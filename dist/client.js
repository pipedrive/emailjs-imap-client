"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TIMEOUT_NOOP = exports.TIMEOUT_IDLE = exports.TIMEOUT_CONNECTION = exports.STATE_SELECTED = exports.STATE_NOT_AUTHENTICATED = exports.STATE_LOGOUT = exports.STATE_CONNECTING = exports.STATE_AUTHENTICATED = exports.DEFAULT_CLIENT_ID = void 0;
var _ramda = require("ramda");
var _emailjsUtf = require("emailjs-utf7");
var _commandParser = require("./command-parser");
var _commandBuilder = require("./command-builder");
var _logger = _interopRequireDefault(require("./logger"));
var _imap = _interopRequireDefault(require("./imap"));
var _common = require("./common");
var _specialUse = require("./special-use");
var _diagnosticsChannel = require("./diagnostics-channel");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
const TIMEOUT_CONNECTION = exports.TIMEOUT_CONNECTION = 90 * 1000; // Milliseconds to wait for the IMAP greeting from the server
const TIMEOUT_NOOP = exports.TIMEOUT_NOOP = 60 * 1000; // Milliseconds between NOOP commands while idling
const TIMEOUT_IDLE = exports.TIMEOUT_IDLE = 60 * 1000; // Milliseconds until IDLE command is cancelled

const STATE_CONNECTING = exports.STATE_CONNECTING = 1;
const STATE_NOT_AUTHENTICATED = exports.STATE_NOT_AUTHENTICATED = 2;
const STATE_AUTHENTICATED = exports.STATE_AUTHENTICATED = 3;
const STATE_SELECTED = exports.STATE_SELECTED = 4;
const STATE_LOGOUT = exports.STATE_LOGOUT = 5;
const DEFAULT_CLIENT_ID = exports.DEFAULT_CLIENT_ID = {
  name: 'emailjs-imap-client'
};

/**
 * emailjs IMAP client
 *
 * @constructor
 *
 * @param {String} [host='localhost'] Hostname to conenct to
 * @param {Number} [port=143] Port number to connect to
 * @param {Object} [options] Optional options object
 */
class Client {
  constructor(host, port, options = {}) {
    this.timeoutConnection = TIMEOUT_CONNECTION;
    this.timeoutNoop = TIMEOUT_NOOP;
    this.timeoutIdle = TIMEOUT_IDLE;
    this.serverId = false; // RFC 2971 Server ID as key value pairs

    // Event placeholders
    this.oncert = null;
    this.onupdate = null;
    this.onselectmailbox = null;
    this.onclosemailbox = null;
    this._host = host;
    this._clientId = (0, _ramda.propOr)(DEFAULT_CLIENT_ID, 'id', options);
    this._state = false; // Current state
    this._authenticated = false; // Is the connection authenticated
    this._capability = []; // List of extensions the server supports
    this._selectedMailbox = false; // Selected mailbox
    this._enteredIdle = false;
    this._idleTimeout = false;
    this._enableCompression = !!options.enableCompression;
    this._auth = options.auth;
    this._requireTLS = !!options.requireTLS;
    this._ignoreTLS = !!options.ignoreTLS;
    this.client = new _imap.default(host, port, options); // IMAP client object

    // Event Handlers
    this.client.onerror = this._onError.bind(this);
    this.client.oncert = cert => this.oncert && this.oncert(cert); // allows certificate handling for platforms w/o native tls support
    this.client.onidle = () => this._onIdle(); // start idling

    // Default handlers for untagged responses
    this.client.setHandler('capability', response => this._untaggedCapabilityHandler(response)); // capability updates
    this.client.setHandler('ok', response => this._untaggedOkHandler(response)); // notifications
    this.client.setHandler('exists', response => this._untaggedExistsHandler(response)); // message count has changed
    this.client.setHandler('expunge', response => this._untaggedExpungeHandler(response)); // message has been deleted
    this.client.setHandler('fetch', response => this._untaggedFetchHandler(response)); // message has been updated (eg. flag change)

    // Activate logging
    this.createLogger();
    this.logLevel = (0, _ramda.propOr)(_common.LOG_LEVEL_ALL, 'logLevel', options);
  }

  /**
   * Called if the lower-level ImapClient has encountered an unrecoverable
   * error during operation. Cleans up and propagates the error upwards.
   */
  _onError(err) {
    // make sure no idle timeout is pending anymore
    clearTimeout(this._idleTimeout);

    // propagate the error upwards
    this.onerror && this.onerror(err);
  }

  //
  //
  // PUBLIC API
  //
  //

  /**
   * Initiate connection and login to the IMAP server
   *
   * @returns {Promise} Promise when login procedure is complete
   */
  connect() {
    var _this = this;
    return _asyncToGenerator(function* () {
      try {
        yield _this.openConnection();
        yield _this.upgradeConnection();
        try {
          yield _this.updateId(_this._clientId);
        } catch (err) {
          _this.logger.warn('Failed to update server id!', err.message);
        }
        yield _this.login(_this._auth);
        yield _this.compressConnection();
        _this.logger.debug('Connection established, ready to roll!');
        _this.client.onerror = _this._onError.bind(_this);
      } catch (err) {
        _this.logger.error('Could not connect to server', err);
        _this.close(err); // we don't really care whether this works or not
        throw err;
      }
    })();
  }

  /**
   * Initiate connection to the IMAP server
   *
   * @returns {Promise} capability of server without login
   */
  openConnection() {
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => reject(new Error('Timeout connecting to server')), this.timeoutConnection);
      this.logger.debug('Connecting to', this.client.host, ':', this.client.port);
      this._changeState(STATE_CONNECTING);
      this.client.connect().then(() => {
        this.logger.debug('Socket opened, waiting for greeting from the server...');
        this.client.onready = () => {
          clearTimeout(connectionTimeout);
          this._changeState(STATE_NOT_AUTHENTICATED);
          this.updateCapability().then(() => resolve(this._capability));
        };
        this.client.onerror = err => {
          clearTimeout(connectionTimeout);
          reject(err);
        };
      }).catch(reject);
    });
  }

  /**
   * Logout
   *
   * Send LOGOUT, to which the server responds by closing the connection.
   * Use is discouraged if network status is unclear! If networks status is
   * unclear, please use #close instead!
   *
   * LOGOUT details:
   *   https://tools.ietf.org/html/rfc3501#section-6.1.3
   *
   * @returns {Promise} Resolves when server has closed the connection
   */
  logout() {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      _this2._changeState(STATE_LOGOUT);
      _this2.logger.debug('Logging out...');
      yield _this2.client.logout();
      clearTimeout(_this2._idleTimeout);
    })();
  }

  /**
   * Force-closes the current connection by closing the TCP socket.
   *
   * @returns {Promise} Resolves when socket is closed
   */
  close(err) {
    var _this3 = this;
    return _asyncToGenerator(function* () {
      _this3._changeState(STATE_LOGOUT);
      clearTimeout(_this3._idleTimeout);
      _this3.logger.debug('Closing connection...');
      yield _this3.client.close(err);
      clearTimeout(_this3._idleTimeout);
    })();
  }

  /**
   * Runs ID command, parses ID response, sets this.serverId
   *
   * ID details:
   *   http://tools.ietf.org/html/rfc2971
   *
   * @param {Object} id ID as JSON object. See http://tools.ietf.org/html/rfc2971#section-3.3 for possible values
   * @returns {Promise} Resolves when response has been parsed
   */
  updateId(id) {
    var _this4 = this;
    return _asyncToGenerator(function* () {
      if (_this4._capability.indexOf('ID') < 0) return;
      _this4.logger.debug('Updating id...');
      const command = 'ID';
      const attributes = id ? [(0, _ramda.flatten)(Object.entries(id))] : [null];
      const response = yield _this4.exec({
        command,
        attributes
      }, 'ID');
      const list = (0, _ramda.flatten)((0, _ramda.pathOr)([], ['payload', 'ID', '0', 'attributes', '0'], response).map(Object.values));
      const keys = list.filter((_, i) => i % 2 === 0);
      const values = list.filter((_, i) => i % 2 === 1);
      _this4.serverId = (0, _ramda.fromPairs)((0, _ramda.zip)(keys, values));
      _this4.logger.debug('Server id updated!', _this4.serverId);
    })();
  }
  _shouldSelectMailbox(path, ctx) {
    if (!ctx) {
      return true;
    }
    const previousSelect = this.client.getPreviouslyQueued(['SELECT', 'EXAMINE'], ctx);
    if (previousSelect && previousSelect.request.attributes) {
      const pathAttribute = previousSelect.request.attributes.find(attribute => attribute.type === 'STRING');
      if (pathAttribute) {
        return pathAttribute.value !== path;
      }
    }
    return this._selectedMailbox !== path;
  }

  /**
   * Runs SELECT or EXAMINE to open a mailbox
   *
   * SELECT details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.1
   * EXAMINE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.2
   *
   * @param {String} path Full path to mailbox
   * @param {Object} [options] Options object
   * @returns {Promise} Promise with information about the selected mailbox
   */
  selectMailbox(path, options = {}) {
    var _this5 = this;
    return _asyncToGenerator(function* () {
      const query = {
        command: options.readOnly ? 'EXAMINE' : 'SELECT',
        attributes: [{
          type: 'STRING',
          value: path
        }]
      };
      if (options.condstore && _this5._capability.indexOf('CONDSTORE') >= 0) {
        query.attributes.push([{
          type: 'ATOM',
          value: 'CONDSTORE'
        }]);
      }
      _this5.logger.debug('Opening', path, '...');
      const response = yield _this5.exec(query, ['EXISTS', 'FLAGS', 'OK'], {
        ctx: options.ctx
      });
      const mailboxInfo = (0, _commandParser.parseSELECT)(response);
      _this5._changeState(STATE_SELECTED);
      if (_this5._selectedMailbox !== path && _this5.onclosemailbox) {
        yield _this5.onclosemailbox(_this5._selectedMailbox);
      }
      _this5._selectedMailbox = path;
      if (_this5.onselectmailbox) {
        yield _this5.onselectmailbox(path, mailboxInfo);
      }
      return mailboxInfo;
    })();
  }

  /**
   * Runs NAMESPACE command
   *
   * NAMESPACE details:
   *   https://tools.ietf.org/html/rfc2342
   *
   * @returns {Promise} Promise with namespace object
   */
  listNamespaces() {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      if (_this6._capability.indexOf('NAMESPACE') < 0) return false;
      _this6.logger.debug('Listing namespaces...');
      const response = yield _this6.exec('NAMESPACE', 'NAMESPACE');
      return (0, _commandParser.parseNAMESPACE)(response);
    })();
  }

  /**
   * Runs LIST and LSUB commands. Retrieves a tree of available mailboxes
   *
   * LIST details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.8
   * LSUB details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.9
   *
   * @returns {Promise} Promise with list of mailboxes
   */
  listMailboxes() {
    var _this7 = this;
    return _asyncToGenerator(function* () {
      const tree = {
        root: true,
        children: []
      };
      _this7.logger.debug('Listing mailboxes...');
      const listResponse = yield _this7.exec({
        command: 'LIST',
        attributes: ['', '*']
      }, 'LIST');
      const list = (0, _ramda.pathOr)([], ['payload', 'LIST'], listResponse);
      list.forEach(item => {
        const attr = (0, _ramda.propOr)([], 'attributes', item);
        if (attr.length < 3) return;
        const path = (0, _ramda.pathOr)('', ['2', 'value'], attr);
        const delim = (0, _ramda.pathOr)('/', ['1', 'value'], attr);
        const branch = _this7._ensurePath(tree, path, delim);
        branch.flags = (0, _ramda.propOr)([], '0', attr).map(({
          value
        }) => value || '');
        branch.listed = true;
        (0, _specialUse.checkSpecialUse)(branch);
      });
      const lsubResponse = yield _this7.exec({
        command: 'LSUB',
        attributes: ['', '*']
      }, 'LSUB');
      const lsub = (0, _ramda.pathOr)([], ['payload', 'LSUB'], lsubResponse);
      lsub.forEach(item => {
        const attr = (0, _ramda.propOr)([], 'attributes', item);
        if (attr.length < 3) return;
        const path = (0, _ramda.pathOr)('', ['2', 'value'], attr);
        const delim = (0, _ramda.pathOr)('/', ['1', 'value'], attr);
        const branch = _this7._ensurePath(tree, path, delim);
        (0, _ramda.propOr)([], '0', attr).map((flag = '') => {
          branch.flags = (0, _ramda.union)(branch.flags, [flag]);
        });
        branch.subscribed = true;
      });
      return tree;
    })();
  }

  /**
   * Runs mailbox STATUS
   *
   * STATUS details:
   *  https://tools.ietf.org/html/rfc3501#section-6.3.10
   *
   * @param {String} path Full path to mailbox
   * @param {Object} [options] Options object
   * @returns {Promise} Promise with information about the selected mailbox
   */
  mailboxStatus(path, options = {}) {
    var _this8 = this;
    return _asyncToGenerator(function* () {
      const statusDataItems = ['UIDNEXT', 'MESSAGES'];
      if (options.condstore && _this8._capability.indexOf('CONDSTORE') >= 0) {
        statusDataItems.push('HIGHESTMODSEQ');
      }
      const statusAttributes = statusDataItems.map(statusDataItem => {
        return {
          type: 'ATOM',
          value: statusDataItem
        };
      });
      _this8.logger.debug('Opening', path, '...');
      const response = yield _this8.exec({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [...statusAttributes]]
      }, ['STATUS']);
      return (0, _commandParser.parseSTATUS)(response, statusDataItems);
    })();
  }

  /**
   * Create a mailbox with the given path.
   *
   * CREATE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.3
   *
   * @param {String} path
   *     The path of the mailbox you would like to create.  This method will
   *     handle utf7 encoding for you.
   * @returns {Promise}
   *     Promise resolves if mailbox was created.
   *     In the event the server says NO [ALREADYEXISTS], we treat that as success.
   */
  createMailbox(path) {
    var _this9 = this;
    return _asyncToGenerator(function* () {
      _this9.logger.debug('Creating mailbox', path, '...');
      try {
        yield _this9.exec({
          command: 'CREATE',
          attributes: [(0, _emailjsUtf.imapEncode)(path)]
        });
      } catch (err) {
        if (err && err.code === 'ALREADYEXISTS') {
          return;
        }
        throw err;
      }
    })();
  }

  /**
   * Delete a mailbox with the given path.
   *
   * DELETE details:
   *   https://tools.ietf.org/html/rfc3501#section-6.3.4
   *
   * @param {String} path
   *     The path of the mailbox you would like to delete.  This method will
   *     handle utf7 encoding for you.
   * @returns {Promise}
   *     Promise resolves if mailbox was deleted.
   */
  deleteMailbox(path) {
    this.logger.debug('Deleting mailbox', path, '...');
    return this.exec({
      command: 'DELETE',
      attributes: [(0, _emailjsUtf.imapEncode)(path)]
    });
  }

  /**
   * Runs FETCH command
   *
   * FETCH details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.5
   * CHANGEDSINCE details:
   *   https://tools.ietf.org/html/rfc4551#section-3.3
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Sequence set, eg 1:* for all messages
   * @param {Object} [items] Message data item names or macro
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the fetched message info
   */
  listMessages(path, sequence, items = [{
    fast: true
  }], options = {}) {
    var _this10 = this;
    return _asyncToGenerator(function* () {
      _this10.logger.debug('Fetching messages', sequence, 'from', path, '...');
      const command = (0, _commandBuilder.buildFETCHCommand)(sequence, items, options);
      const response = yield _this10.exec(command, 'FETCH', {
        precheck: ctx => _this10._shouldSelectMailbox(path, ctx) ? _this10.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
      return (0, _commandParser.parseFETCH)(response);
    })();
  }

  /**
   * Runs SEARCH command
   *
   * SEARCH details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.4
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {Object} query Search terms
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  search(path, query, options = {}) {
    var _this11 = this;
    return _asyncToGenerator(function* () {
      _this11.logger.debug('Searching in', path, '...');
      const command = (0, _commandBuilder.buildSEARCHCommand)(query, options);
      const response = yield _this11.exec(command, 'SEARCH', {
        precheck: ctx => _this11._shouldSelectMailbox(path, ctx) ? _this11.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
      return (0, _commandParser.parseSEARCH)(response);
    })();
  }

  /**
   * Runs STORE command
   *
   * STORE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.6
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message selector which the flag change is applied to
   * @param {Array} flags
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  setFlags(path, sequence, flags, options) {
    let key = '';
    let list = [];
    if (Array.isArray(flags) || typeof flags !== 'object') {
      list = [].concat(flags || []);
      key = '';
    } else if (flags.add) {
      list = [].concat(flags.add || []);
      key = '+';
    } else if (flags.set) {
      key = '';
      list = [].concat(flags.set || []);
    } else if (flags.remove) {
      key = '-';
      list = [].concat(flags.remove || []);
    }
    this.logger.debug('Setting flags on', sequence, 'in', path, '...');
    return this.store(path, sequence, key + 'FLAGS', list, options);
  }

  /**
   * Runs STORE command
   *
   * STORE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.6
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message selector which the flag change is applied to
   * @param {String} action STORE method to call, eg "+FLAGS"
   * @param {Array} flags
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  store(path, sequence, action, flags, options = {}) {
    var _this12 = this;
    return _asyncToGenerator(function* () {
      const command = (0, _commandBuilder.buildSTORECommand)(sequence, action, flags, options);
      const response = yield _this12.exec(command, 'FETCH', {
        precheck: ctx => _this12._shouldSelectMailbox(path, ctx) ? _this12.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
      return (0, _commandParser.parseFETCH)(response);
    })();
  }

  /**
   * Runs APPEND command
   *
   * APPEND details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.11
   *
   * @param {String} destination The mailbox where to append the message
   * @param {String} message The message to append
   * @param {Array} options.flags Any flags you want to set on the uploaded message. Defaults to [\Seen]. (optional)
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  upload(destination, message, options = {}) {
    var _this13 = this;
    return _asyncToGenerator(function* () {
      const flags = (0, _ramda.propOr)(['\\Seen'], 'flags', options).map(value => ({
        type: 'atom',
        value
      }));
      const command = {
        command: 'APPEND',
        attributes: [{
          type: 'atom',
          value: destination
        }, flags, {
          type: 'literal',
          value: message
        }]
      };
      _this13.logger.debug('Uploading message to', destination, '...');
      const response = yield _this13.exec(command);
      return (0, _commandParser.parseAPPEND)(response);
    })();
  }

  /**
   * Deletes messages from a selected mailbox
   *
   * EXPUNGE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.3
   * UID EXPUNGE details:
   *   https://tools.ietf.org/html/rfc4315#section-2.1
   *
   * If possible (byUid:true and UIDPLUS extension supported), uses UID EXPUNGE
   * command to delete a range of messages, otherwise falls back to EXPUNGE.
   *
   * NB! This method might be destructive - if EXPUNGE is used, then any messages
   * with \Deleted flag set are deleted
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be deleted
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise
   */
  deleteMessages(path, sequence, options = {}) {
    var _this14 = this;
    return _asyncToGenerator(function* () {
      // add \Deleted flag to the messages and run EXPUNGE or UID EXPUNGE
      _this14.logger.debug('Deleting messages', sequence, 'in', path, '...');
      const useUidPlus = options.byUid && _this14._capability.indexOf('UIDPLUS') >= 0;
      const uidExpungeCommand = {
        command: 'UID EXPUNGE',
        attributes: [{
          type: 'sequence',
          value: sequence
        }]
      };
      yield _this14.setFlags(path, sequence, {
        add: '\\Deleted'
      }, options);
      const cmd = useUidPlus ? uidExpungeCommand : 'EXPUNGE';
      return _this14.exec(cmd, null, {
        precheck: ctx => _this14._shouldSelectMailbox(path, ctx) ? _this14.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
    })();
  }

  /**
   * Copies a range of messages from the active mailbox to the destination mailbox.
   * Silent method (unless an error occurs), by default returns no information.
   *
   * COPY details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.7
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be copied
   * @param {String} destination Destination mailbox path
   * @param {Object} [options] Query modifiers
   * @param {Boolean} [options.byUid] If true, uses UID COPY instead of COPY
   * @returns {Promise} Promise
   */
  copyMessages(path, sequence, destination, options = {}) {
    var _this15 = this;
    return _asyncToGenerator(function* () {
      _this15.logger.debug('Copying messages', sequence, 'from', path, 'to', destination, '...');
      const response = yield _this15.exec({
        command: options.byUid ? 'UID COPY' : 'COPY',
        attributes: [{
          type: 'sequence',
          value: sequence
        }, {
          type: 'atom',
          value: destination
        }]
      }, null, {
        precheck: ctx => _this15._shouldSelectMailbox(path, ctx) ? _this15.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
      return (0, _commandParser.parseCOPY)(response);
    })();
  }

  /**
   * Moves a range of messages from the active mailbox to the destination mailbox.
   * Prefers the MOVE extension but if not available, falls back to
   * COPY + EXPUNGE
   *
   * MOVE details:
   *   http://tools.ietf.org/html/rfc6851
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be moved
   * @param {String} destination Destination mailbox path
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise
   */
  moveMessages(path, sequence, destination, options = {}) {
    var _this16 = this;
    return _asyncToGenerator(function* () {
      _this16.logger.debug('Moving messages', sequence, 'from', path, 'to', destination, '...');
      if (_this16._capability.indexOf('MOVE') === -1) {
        // Fallback to COPY + EXPUNGE
        yield _this16.copyMessages(path, sequence, destination, options);
        return _this16.deleteMessages(path, sequence, options);
      }

      // If possible, use MOVE
      return _this16.exec({
        command: options.byUid ? 'UID MOVE' : 'MOVE',
        attributes: [{
          type: 'sequence',
          value: sequence
        }, {
          type: 'atom',
          value: destination
        }]
      }, ['OK'], {
        precheck: ctx => _this16._shouldSelectMailbox(path, ctx) ? _this16.selectMailbox(path, {
          ctx
        }) : Promise.resolve()
      });
    })();
  }

  /**
   * Runs COMPRESS command
   *
   * COMPRESS details:
   *   https://tools.ietf.org/html/rfc4978
   */
  compressConnection() {
    var _this17 = this;
    return _asyncToGenerator(function* () {
      if (!_this17._enableCompression || _this17._capability.indexOf('COMPRESS=DEFLATE') < 0 || _this17.client.compressed) {
        return false;
      }
      _this17.logger.debug('Enabling compression...');
      yield _this17.exec({
        command: 'COMPRESS',
        attributes: [{
          type: 'ATOM',
          value: 'DEFLATE'
        }]
      });
      _this17.client.enableCompression();
      _this17.logger.debug('Compression enabled, all data sent and received is deflated!');
    })();
  }

  /**
   * Runs LOGIN or AUTHENTICATE XOAUTH2 command
   *
   * LOGIN details:
   *   http://tools.ietf.org/html/rfc3501#section-6.2.3
   * XOAUTH2 details:
   *   https://developers.google.com/gmail/xoauth2_protocol#imap_protocol_exchange
   *
   * @param {String} auth.user
   * @param {String} auth.pass
   * @param {String} auth.xoauth2
   */
  login(auth) {
    var _this18 = this;
    return _asyncToGenerator(function* () {
      let command;
      const options = {};
      if (!auth) {
        throw new Error('Authentication information not provided');
      }
      if (_this18._capability.indexOf('AUTH=XOAUTH2') >= 0 && auth && auth.xoauth2) {
        command = {
          command: 'AUTHENTICATE',
          attributes: [{
            type: 'ATOM',
            value: 'XOAUTH2'
          }, {
            type: 'ATOM',
            value: (0, _commandBuilder.buildXOAuth2Token)(auth.user, auth.xoauth2),
            sensitive: true
          }]
        };
        options.errorResponseExpectsEmptyLine = true; // + tagged error response expects an empty line in return
      } else {
        command = {
          command: 'login',
          attributes: [{
            type: 'STRING',
            value: auth.user || ''
          }, {
            type: 'STRING',
            value: auth.pass || '',
            sensitive: true
          }]
        };
      }
      _this18.logger.debug('Logging in...');
      const response = yield _this18.exec(command, 'capability', options);
      /*
       * update post-auth capabilites
       * capability list shouldn't contain auth related stuff anymore
       * but some new extensions might have popped up that do not
       * make much sense in the non-auth state
       */
      if (response.capability && response.capability.length) {
        // capabilites were listed with the OK [CAPABILITY ...] response
        _this18._capability = response.capability;
      } else if (response.payload && response.payload.CAPABILITY && response.payload.CAPABILITY.length) {
        // capabilites were listed with * CAPABILITY ... response
        _this18._capability = response.payload.CAPABILITY.pop().attributes.map((capa = '') => capa.value.toUpperCase().trim());
      } else {
        // capabilities were not automatically listed, reload
        yield _this18.updateCapability(true);
      }
      _this18._changeState(STATE_AUTHENTICATED);
      _this18._authenticated = true;
      _this18.logger.debug('Login successful, post-auth capabilites updated!', _this18._capability);
    })();
  }

  /**
   * Run an IMAP command.
   *
   * @param {Object} request Structured request object
   * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
   */
  exec(request, acceptUntagged, options) {
    var _this19 = this;
    return _asyncToGenerator(function* () {
      _this19.breakIdle();
      const response = yield _this19.client.enqueueCommand(request, acceptUntagged, options);
      if (response && response.capability) {
        _this19._capability = response.capability;
      }
      return response;
    })();
  }

  /**
   * The connection is idling. Sends a NOOP or IDLE command
   *
   * IDLE details:
   *   https://tools.ietf.org/html/rfc2177
   */
  enterIdle() {
    if (this._enteredIdle) {
      return;
    }
    const supportsIdle = this._capability.indexOf('IDLE') >= 0;
    this._enteredIdle = supportsIdle && this._selectedMailbox ? 'IDLE' : 'NOOP';
    this.logger.debug('Entering idle with ' + this._enteredIdle);
    if (this._enteredIdle === 'NOOP') {
      this._idleTimeout = setTimeout(() => {
        this.logger.debug('Sending NOOP');
        this.exec('NOOP');
      }, this.timeoutNoop);
    } else if (this._enteredIdle === 'IDLE') {
      this.client.enqueueCommand({
        command: 'IDLE'
      });
      this._idleTimeout = setTimeout(() => {
        this.client.send('DONE\r\n');
        this._enteredIdle = false;
        this.logger.debug('Idle terminated');
      }, this.timeoutIdle);
    }
  }

  /**
   * Stops actions related idling, if IDLE is supported, sends DONE to stop it
   */
  breakIdle() {
    if (!this._enteredIdle) {
      return;
    }
    clearTimeout(this._idleTimeout);
    if (this._enteredIdle === 'IDLE') {
      this.client.send('DONE\r\n');
      this.logger.debug('Idle terminated');
    }
    this._enteredIdle = false;
  }

  /**
   * Runs STARTTLS command if needed
   *
   * STARTTLS details:
   *   http://tools.ietf.org/html/rfc3501#section-6.2.1
   *
   * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
   */
  upgradeConnection() {
    var _this20 = this;
    return _asyncToGenerator(function* () {
      // skip request, if already secured
      if (_this20.client.secureMode) {
        return false;
      }

      // skip if STARTTLS not available or starttls support disabled
      if ((_this20._capability.indexOf('STARTTLS') < 0 || _this20._ignoreTLS) && !_this20._requireTLS) {
        return false;
      }
      _this20.logger.debug('Encrypting connection...');
      yield _this20.exec('STARTTLS');
      _this20._capability = [];
      _this20.client.upgrade();
      return _this20.updateCapability();
    })();
  }

  /**
   * Runs CAPABILITY command
   *
   * CAPABILITY details:
   *   http://tools.ietf.org/html/rfc3501#section-6.1.1
   *
   * Doesn't register untagged CAPABILITY handler as this is already
   * handled by global handler
   *
   * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
   */
  updateCapability(forced) {
    var _this21 = this;
    return _asyncToGenerator(function* () {
      // skip request, if not forced update and capabilities are already loaded
      if (!forced && _this21._capability.length) {
        return;
      }

      // If STARTTLS is required then skip capability listing as we are going to try
      // STARTTLS anyway and we re-check capabilities after connection is secured
      if (!_this21.client.secureMode && _this21._requireTLS) {
        return;
      }
      _this21.logger.debug('Updating capability...');
      return _this21.exec('CAPABILITY');
    })();
  }
  hasCapability(capa = '') {
    return this._capability.indexOf(capa.toUpperCase().trim()) >= 0;
  }

  // Default handlers for untagged responses

  /**
   * Checks if an untagged OK includes [CAPABILITY] tag and updates capability object
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedOkHandler(response) {
    if (response && response.capability) {
      this._capability = response.capability;
    }
  }

  /**
   * Updates capability object
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedCapabilityHandler(response) {
    this._capability = (0, _ramda.pipe)((0, _ramda.propOr)([], 'attributes'), (0, _ramda.map)(({
      value
    }) => (value || '').toUpperCase().trim()))(response);
  }

  /**
   * Updates existing message count
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedExistsHandler(response) {
    if (response && Object.prototype.hasOwnProperty.call(response, 'nr')) {
      this.onupdate && this.onupdate(this._selectedMailbox, 'exists', response.nr);
    }
  }

  /**
   * Indicates a message has been deleted
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedExpungeHandler(response) {
    if (response && Object.prototype.hasOwnProperty.call(response, 'nr')) {
      this.onupdate && this.onupdate(this._selectedMailbox, 'expunge', response.nr);
    }
  }

  /**
   * Indicates that flags have been updated for a message
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedFetchHandler(response) {
    this.onupdate && this.onupdate(this._selectedMailbox, 'fetch', [].concat((0, _commandParser.parseFETCH)({
      payload: {
        FETCH: [response]
      }
    }) || []).shift());
  }

  // Private helpers

  /**
   * Indicates that the connection started idling. Initiates a cycle
   * of NOOPs or IDLEs to receive notifications about updates in the server
   */
  _onIdle() {
    if (!this._authenticated || this._enteredIdle) {
      // No need to IDLE when not logged in or already idling
      return;
    }
    this.logger.debug('Client started idling');
    this.enterIdle();
  }

  /**
   * Updates the IMAP state value for the current connection
   *
   * @param {Number} newState The state you want to change to
   */
  _changeState(newState) {
    if (newState === this._state) {
      return;
    }
    this.logger.debug('Entering state: ' + newState);

    // if a mailbox was opened, emit onclosemailbox and clear selectedMailbox value
    if (this._state === STATE_SELECTED && this._selectedMailbox) {
      this.onclosemailbox && this.onclosemailbox(this._selectedMailbox);
      this._selectedMailbox = false;
    }
    this._state = newState;
  }

  /**
   * Ensures a path exists in the Mailbox tree
   *
   * @param {Object} tree Mailbox tree
   * @param {String} path
   * @param {String} delimiter
   * @return {Object} branch for used path
   */
  _ensurePath(tree, path, delimiter) {
    const names = path.split(delimiter);
    let branch = tree;
    for (let i = 0; i < names.length; i++) {
      let found = false;
      for (let j = 0; j < branch.children.length; j++) {
        if (this._compareMailboxNames(branch.children[j].name, (0, _emailjsUtf.imapDecode)(names[i]))) {
          branch = branch.children[j];
          found = true;
          break;
        }
      }
      if (!found) {
        branch.children.push({
          name: (0, _emailjsUtf.imapDecode)(names[i]),
          delimiter: delimiter,
          path: names.slice(0, i + 1).join(delimiter),
          children: []
        });
        branch = branch.children[branch.children.length - 1];
      }
    }
    return branch;
  }

  /**
   * Compares two mailbox names. Case insensitive in case of INBOX, otherwise case sensitive
   *
   * @param {String} a Mailbox name
   * @param {String} b Mailbox name
   * @returns {Boolean} True if the folder names match
   */
  _compareMailboxNames(a, b) {
    return (a.toUpperCase() === 'INBOX' ? 'INBOX' : a) === (b.toUpperCase() === 'INBOX' ? 'INBOX' : b);
  }
  createLogger(creator = _logger.default) {
    const logger = creator((this._auth || {}).user || '', this._host);
    this.logger = this.client.logger = {
      debug: (...msgs) => {
        if (_common.LOG_LEVEL_DEBUG >= this.logLevel) {
          logger.debug(msgs);
        }
      },
      info: (...msgs) => {
        if (_common.LOG_LEVEL_INFO >= this.logLevel) {
          logger.info(msgs);
        }
      },
      warn: (...msgs) => {
        if (_common.LOG_LEVEL_WARN >= this.logLevel) {
          logger.warn(msgs);
        }
      },
      error: (...msgs) => {
        if (_common.LOG_LEVEL_ERROR >= this.logLevel) {
          logger.error(msgs);
        }
      }
    };
  }
}
exports.default = Client;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmFtZGEiLCJyZXF1aXJlIiwiX2VtYWlsanNVdGYiLCJfY29tbWFuZFBhcnNlciIsIl9jb21tYW5kQnVpbGRlciIsIl9sb2dnZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2ltYXAiLCJfY29tbW9uIiwiX3NwZWNpYWxVc2UiLCJfZGlhZ25vc3RpY3NDaGFubmVsIiwib2JqIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJhc3luY0dlbmVyYXRvclN0ZXAiLCJnZW4iLCJyZXNvbHZlIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJhcmciLCJpbmZvIiwidmFsdWUiLCJlcnJvciIsImRvbmUiLCJQcm9taXNlIiwidGhlbiIsIl9hc3luY1RvR2VuZXJhdG9yIiwiZm4iLCJzZWxmIiwiYXJncyIsImFyZ3VtZW50cyIsImFwcGx5IiwiZXJyIiwidW5kZWZpbmVkIiwiVElNRU9VVF9DT05ORUNUSU9OIiwiZXhwb3J0cyIsIlRJTUVPVVRfTk9PUCIsIlRJTUVPVVRfSURMRSIsIlNUQVRFX0NPTk5FQ1RJTkciLCJTVEFURV9OT1RfQVVUSEVOVElDQVRFRCIsIlNUQVRFX0FVVEhFTlRJQ0FURUQiLCJTVEFURV9TRUxFQ1RFRCIsIlNUQVRFX0xPR09VVCIsIkRFRkFVTFRfQ0xJRU5UX0lEIiwibmFtZSIsIkNsaWVudCIsImNvbnN0cnVjdG9yIiwiaG9zdCIsInBvcnQiLCJvcHRpb25zIiwidGltZW91dENvbm5lY3Rpb24iLCJ0aW1lb3V0Tm9vcCIsInRpbWVvdXRJZGxlIiwic2VydmVySWQiLCJvbmNlcnQiLCJvbnVwZGF0ZSIsIm9uc2VsZWN0bWFpbGJveCIsIm9uY2xvc2VtYWlsYm94IiwiX2hvc3QiLCJfY2xpZW50SWQiLCJwcm9wT3IiLCJfc3RhdGUiLCJfYXV0aGVudGljYXRlZCIsIl9jYXBhYmlsaXR5IiwiX3NlbGVjdGVkTWFpbGJveCIsIl9lbnRlcmVkSWRsZSIsIl9pZGxlVGltZW91dCIsIl9lbmFibGVDb21wcmVzc2lvbiIsImVuYWJsZUNvbXByZXNzaW9uIiwiX2F1dGgiLCJhdXRoIiwiX3JlcXVpcmVUTFMiLCJyZXF1aXJlVExTIiwiX2lnbm9yZVRMUyIsImlnbm9yZVRMUyIsImNsaWVudCIsIkltYXBDbGllbnQiLCJvbmVycm9yIiwiX29uRXJyb3IiLCJiaW5kIiwiY2VydCIsIm9uaWRsZSIsIl9vbklkbGUiLCJzZXRIYW5kbGVyIiwicmVzcG9uc2UiLCJfdW50YWdnZWRDYXBhYmlsaXR5SGFuZGxlciIsIl91bnRhZ2dlZE9rSGFuZGxlciIsIl91bnRhZ2dlZEV4aXN0c0hhbmRsZXIiLCJfdW50YWdnZWRFeHB1bmdlSGFuZGxlciIsIl91bnRhZ2dlZEZldGNoSGFuZGxlciIsImNyZWF0ZUxvZ2dlciIsImxvZ0xldmVsIiwiTE9HX0xFVkVMX0FMTCIsImNsZWFyVGltZW91dCIsImNvbm5lY3QiLCJfdGhpcyIsIm9wZW5Db25uZWN0aW9uIiwidXBncmFkZUNvbm5lY3Rpb24iLCJ1cGRhdGVJZCIsImxvZ2dlciIsIndhcm4iLCJtZXNzYWdlIiwibG9naW4iLCJjb21wcmVzc0Nvbm5lY3Rpb24iLCJkZWJ1ZyIsImNsb3NlIiwiY29ubmVjdGlvblRpbWVvdXQiLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJfY2hhbmdlU3RhdGUiLCJvbnJlYWR5IiwidXBkYXRlQ2FwYWJpbGl0eSIsImNhdGNoIiwibG9nb3V0IiwiX3RoaXMyIiwiX3RoaXMzIiwiaWQiLCJfdGhpczQiLCJpbmRleE9mIiwiY29tbWFuZCIsImF0dHJpYnV0ZXMiLCJmbGF0dGVuIiwiT2JqZWN0IiwiZW50cmllcyIsImV4ZWMiLCJsaXN0IiwicGF0aE9yIiwibWFwIiwidmFsdWVzIiwia2V5cyIsImZpbHRlciIsIl8iLCJpIiwiZnJvbVBhaXJzIiwiemlwIiwiX3Nob3VsZFNlbGVjdE1haWxib3giLCJwYXRoIiwiY3R4IiwicHJldmlvdXNTZWxlY3QiLCJnZXRQcmV2aW91c2x5UXVldWVkIiwicmVxdWVzdCIsInBhdGhBdHRyaWJ1dGUiLCJmaW5kIiwiYXR0cmlidXRlIiwidHlwZSIsInNlbGVjdE1haWxib3giLCJfdGhpczUiLCJxdWVyeSIsInJlYWRPbmx5IiwiY29uZHN0b3JlIiwicHVzaCIsIm1haWxib3hJbmZvIiwicGFyc2VTRUxFQ1QiLCJsaXN0TmFtZXNwYWNlcyIsIl90aGlzNiIsInBhcnNlTkFNRVNQQUNFIiwibGlzdE1haWxib3hlcyIsIl90aGlzNyIsInRyZWUiLCJyb290IiwiY2hpbGRyZW4iLCJsaXN0UmVzcG9uc2UiLCJmb3JFYWNoIiwiaXRlbSIsImF0dHIiLCJsZW5ndGgiLCJkZWxpbSIsImJyYW5jaCIsIl9lbnN1cmVQYXRoIiwiZmxhZ3MiLCJsaXN0ZWQiLCJjaGVja1NwZWNpYWxVc2UiLCJsc3ViUmVzcG9uc2UiLCJsc3ViIiwiZmxhZyIsInVuaW9uIiwic3Vic2NyaWJlZCIsIm1haWxib3hTdGF0dXMiLCJfdGhpczgiLCJzdGF0dXNEYXRhSXRlbXMiLCJzdGF0dXNBdHRyaWJ1dGVzIiwic3RhdHVzRGF0YUl0ZW0iLCJwYXJzZVNUQVRVUyIsImNyZWF0ZU1haWxib3giLCJfdGhpczkiLCJpbWFwRW5jb2RlIiwiY29kZSIsImRlbGV0ZU1haWxib3giLCJsaXN0TWVzc2FnZXMiLCJzZXF1ZW5jZSIsIml0ZW1zIiwiZmFzdCIsIl90aGlzMTAiLCJidWlsZEZFVENIQ29tbWFuZCIsInByZWNoZWNrIiwicGFyc2VGRVRDSCIsInNlYXJjaCIsIl90aGlzMTEiLCJidWlsZFNFQVJDSENvbW1hbmQiLCJwYXJzZVNFQVJDSCIsInNldEZsYWdzIiwiQXJyYXkiLCJpc0FycmF5IiwiY29uY2F0IiwiYWRkIiwic2V0IiwicmVtb3ZlIiwic3RvcmUiLCJhY3Rpb24iLCJfdGhpczEyIiwiYnVpbGRTVE9SRUNvbW1hbmQiLCJ1cGxvYWQiLCJkZXN0aW5hdGlvbiIsIl90aGlzMTMiLCJwYXJzZUFQUEVORCIsImRlbGV0ZU1lc3NhZ2VzIiwiX3RoaXMxNCIsInVzZVVpZFBsdXMiLCJieVVpZCIsInVpZEV4cHVuZ2VDb21tYW5kIiwiY21kIiwiY29weU1lc3NhZ2VzIiwiX3RoaXMxNSIsInBhcnNlQ09QWSIsIm1vdmVNZXNzYWdlcyIsIl90aGlzMTYiLCJfdGhpczE3IiwiY29tcHJlc3NlZCIsIl90aGlzMTgiLCJ4b2F1dGgyIiwiYnVpbGRYT0F1dGgyVG9rZW4iLCJ1c2VyIiwic2Vuc2l0aXZlIiwiZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUiLCJwYXNzIiwiY2FwYWJpbGl0eSIsInBheWxvYWQiLCJDQVBBQklMSVRZIiwicG9wIiwiY2FwYSIsInRvVXBwZXJDYXNlIiwidHJpbSIsImFjY2VwdFVudGFnZ2VkIiwiX3RoaXMxOSIsImJyZWFrSWRsZSIsImVucXVldWVDb21tYW5kIiwiZW50ZXJJZGxlIiwic3VwcG9ydHNJZGxlIiwic2VuZCIsIl90aGlzMjAiLCJzZWN1cmVNb2RlIiwidXBncmFkZSIsImZvcmNlZCIsIl90aGlzMjEiLCJoYXNDYXBhYmlsaXR5IiwicGlwZSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsIm5yIiwiRkVUQ0giLCJzaGlmdCIsIm5ld1N0YXRlIiwiZGVsaW1pdGVyIiwibmFtZXMiLCJzcGxpdCIsImZvdW5kIiwiaiIsIl9jb21wYXJlTWFpbGJveE5hbWVzIiwiaW1hcERlY29kZSIsInNsaWNlIiwiam9pbiIsImEiLCJiIiwiY3JlYXRvciIsImNyZWF0ZURlZmF1bHRMb2dnZXIiLCJtc2dzIiwiTE9HX0xFVkVMX0RFQlVHIiwiTE9HX0xFVkVMX0lORk8iLCJMT0dfTEVWRUxfV0FSTiIsIkxPR19MRVZFTF9FUlJPUiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWFwLCBwaXBlLCB1bmlvbiwgemlwLCBmcm9tUGFpcnMsIHByb3BPciwgcGF0aE9yLCBmbGF0dGVuIH0gZnJvbSAncmFtZGEnXG5pbXBvcnQgeyBpbWFwRW5jb2RlLCBpbWFwRGVjb2RlIH0gZnJvbSAnZW1haWxqcy11dGY3J1xuaW1wb3J0IHtcbiAgcGFyc2VBUFBFTkQsXG4gIHBhcnNlQ09QWSxcbiAgcGFyc2VOQU1FU1BBQ0UsXG4gIHBhcnNlU0VMRUNULFxuICBwYXJzZUZFVENILFxuICBwYXJzZVNFQVJDSCxcbiAgcGFyc2VTVEFUVVNcbn0gZnJvbSAnLi9jb21tYW5kLXBhcnNlcidcbmltcG9ydCB7XG4gIGJ1aWxkRkVUQ0hDb21tYW5kLFxuICBidWlsZFhPQXV0aDJUb2tlbixcbiAgYnVpbGRTRUFSQ0hDb21tYW5kLFxuICBidWlsZFNUT1JFQ29tbWFuZFxufSBmcm9tICcuL2NvbW1hbmQtYnVpbGRlcidcblxuaW1wb3J0IGNyZWF0ZURlZmF1bHRMb2dnZXIgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgSW1hcENsaWVudCBmcm9tICcuL2ltYXAnXG5pbXBvcnQge1xuICBMT0dfTEVWRUxfRVJST1IsXG4gIExPR19MRVZFTF9XQVJOLFxuICBMT0dfTEVWRUxfSU5GTyxcbiAgTE9HX0xFVkVMX0RFQlVHLFxuICBMT0dfTEVWRUxfQUxMXG59IGZyb20gJy4vY29tbW9uJ1xuXG5pbXBvcnQge1xuICBjaGVja1NwZWNpYWxVc2Vcbn0gZnJvbSAnLi9zcGVjaWFsLXVzZSdcblxuaW1wb3J0IHsgaW1hcENvbW1hbmRDaGFubmVsIH0gZnJvbSAnLi9kaWFnbm9zdGljcy1jaGFubmVsJztcblxuZXhwb3J0IGNvbnN0IFRJTUVPVVRfQ09OTkVDVElPTiA9IDkwICogMTAwMCAvLyBNaWxsaXNlY29uZHMgdG8gd2FpdCBmb3IgdGhlIElNQVAgZ3JlZXRpbmcgZnJvbSB0aGUgc2VydmVyXG5leHBvcnQgY29uc3QgVElNRU9VVF9OT09QID0gNjAgKiAxMDAwIC8vIE1pbGxpc2Vjb25kcyBiZXR3ZWVuIE5PT1AgY29tbWFuZHMgd2hpbGUgaWRsaW5nXG5leHBvcnQgY29uc3QgVElNRU9VVF9JRExFID0gNjAgKiAxMDAwIC8vIE1pbGxpc2Vjb25kcyB1bnRpbCBJRExFIGNvbW1hbmQgaXMgY2FuY2VsbGVkXG5cbmV4cG9ydCBjb25zdCBTVEFURV9DT05ORUNUSU5HID0gMVxuZXhwb3J0IGNvbnN0IFNUQVRFX05PVF9BVVRIRU5USUNBVEVEID0gMlxuZXhwb3J0IGNvbnN0IFNUQVRFX0FVVEhFTlRJQ0FURUQgPSAzXG5leHBvcnQgY29uc3QgU1RBVEVfU0VMRUNURUQgPSA0XG5leHBvcnQgY29uc3QgU1RBVEVfTE9HT1VUID0gNVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9DTElFTlRfSUQgPSB7XG4gIG5hbWU6ICdlbWFpbGpzLWltYXAtY2xpZW50J1xufVxuXG4vKipcbiAqIGVtYWlsanMgSU1BUCBjbGllbnRcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gW2hvc3Q9J2xvY2FsaG9zdCddIEhvc3RuYW1lIHRvIGNvbmVuY3QgdG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBbcG9ydD0xNDNdIFBvcnQgbnVtYmVyIHRvIGNvbm5lY3QgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgb3B0aW9ucyBvYmplY3RcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpZW50IHtcbiAgY29uc3RydWN0b3IgKGhvc3QsIHBvcnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMudGltZW91dENvbm5lY3Rpb24gPSBUSU1FT1VUX0NPTk5FQ1RJT05cbiAgICB0aGlzLnRpbWVvdXROb29wID0gVElNRU9VVF9OT09QXG4gICAgdGhpcy50aW1lb3V0SWRsZSA9IFRJTUVPVVRfSURMRVxuXG4gICAgdGhpcy5zZXJ2ZXJJZCA9IGZhbHNlIC8vIFJGQyAyOTcxIFNlcnZlciBJRCBhcyBrZXkgdmFsdWUgcGFpcnNcblxuICAgIC8vIEV2ZW50IHBsYWNlaG9sZGVyc1xuICAgIHRoaXMub25jZXJ0ID0gbnVsbFxuICAgIHRoaXMub251cGRhdGUgPSBudWxsXG4gICAgdGhpcy5vbnNlbGVjdG1haWxib3ggPSBudWxsXG4gICAgdGhpcy5vbmNsb3NlbWFpbGJveCA9IG51bGxcblxuICAgIHRoaXMuX2hvc3QgPSBob3N0XG4gICAgdGhpcy5fY2xpZW50SWQgPSBwcm9wT3IoREVGQVVMVF9DTElFTlRfSUQsICdpZCcsIG9wdGlvbnMpXG4gICAgdGhpcy5fc3RhdGUgPSBmYWxzZSAvLyBDdXJyZW50IHN0YXRlXG4gICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IGZhbHNlIC8vIElzIHRoZSBjb25uZWN0aW9uIGF1dGhlbnRpY2F0ZWRcbiAgICB0aGlzLl9jYXBhYmlsaXR5ID0gW10gLy8gTGlzdCBvZiBleHRlbnNpb25zIHRoZSBzZXJ2ZXIgc3VwcG9ydHNcbiAgICB0aGlzLl9zZWxlY3RlZE1haWxib3ggPSBmYWxzZSAvLyBTZWxlY3RlZCBtYWlsYm94XG4gICAgdGhpcy5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICAgIHRoaXMuX2lkbGVUaW1lb3V0ID0gZmFsc2VcbiAgICB0aGlzLl9lbmFibGVDb21wcmVzc2lvbiA9ICEhb3B0aW9ucy5lbmFibGVDb21wcmVzc2lvblxuICAgIHRoaXMuX2F1dGggPSBvcHRpb25zLmF1dGhcbiAgICB0aGlzLl9yZXF1aXJlVExTID0gISFvcHRpb25zLnJlcXVpcmVUTFNcbiAgICB0aGlzLl9pZ25vcmVUTFMgPSAhIW9wdGlvbnMuaWdub3JlVExTXG5cbiAgICB0aGlzLmNsaWVudCA9IG5ldyBJbWFwQ2xpZW50KGhvc3QsIHBvcnQsIG9wdGlvbnMpIC8vIElNQVAgY2xpZW50IG9iamVjdFxuXG4gICAgLy8gRXZlbnQgSGFuZGxlcnNcbiAgICB0aGlzLmNsaWVudC5vbmVycm9yID0gdGhpcy5fb25FcnJvci5iaW5kKHRoaXMpXG4gICAgdGhpcy5jbGllbnQub25jZXJ0ID0gKGNlcnQpID0+ICh0aGlzLm9uY2VydCAmJiB0aGlzLm9uY2VydChjZXJ0KSkgLy8gYWxsb3dzIGNlcnRpZmljYXRlIGhhbmRsaW5nIGZvciBwbGF0Zm9ybXMgdy9vIG5hdGl2ZSB0bHMgc3VwcG9ydFxuICAgIHRoaXMuY2xpZW50Lm9uaWRsZSA9ICgpID0+IHRoaXMuX29uSWRsZSgpIC8vIHN0YXJ0IGlkbGluZ1xuXG4gICAgLy8gRGVmYXVsdCBoYW5kbGVycyBmb3IgdW50YWdnZWQgcmVzcG9uc2VzXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignY2FwYWJpbGl0eScsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRDYXBhYmlsaXR5SGFuZGxlcihyZXNwb25zZSkpIC8vIGNhcGFiaWxpdHkgdXBkYXRlc1xuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ29rJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZE9rSGFuZGxlcihyZXNwb25zZSkpIC8vIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdleGlzdHMnLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkRXhpc3RzSGFuZGxlcihyZXNwb25zZSkpIC8vIG1lc3NhZ2UgY291bnQgaGFzIGNoYW5nZWRcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdleHB1bmdlJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbWVzc2FnZSBoYXMgYmVlbiBkZWxldGVkXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignZmV0Y2gnLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkRmV0Y2hIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbWVzc2FnZSBoYXMgYmVlbiB1cGRhdGVkIChlZy4gZmxhZyBjaGFuZ2UpXG5cbiAgICAvLyBBY3RpdmF0ZSBsb2dnaW5nXG4gICAgdGhpcy5jcmVhdGVMb2dnZXIoKVxuICAgIHRoaXMubG9nTGV2ZWwgPSBwcm9wT3IoTE9HX0xFVkVMX0FMTCwgJ2xvZ0xldmVsJywgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgaWYgdGhlIGxvd2VyLWxldmVsIEltYXBDbGllbnQgaGFzIGVuY291bnRlcmVkIGFuIHVucmVjb3ZlcmFibGVcbiAgICogZXJyb3IgZHVyaW5nIG9wZXJhdGlvbi4gQ2xlYW5zIHVwIGFuZCBwcm9wYWdhdGVzIHRoZSBlcnJvciB1cHdhcmRzLlxuICAgKi9cbiAgX29uRXJyb3IgKGVycikge1xuICAgIC8vIG1ha2Ugc3VyZSBubyBpZGxlIHRpbWVvdXQgaXMgcGVuZGluZyBhbnltb3JlXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuXG4gICAgLy8gcHJvcGFnYXRlIHRoZSBlcnJvciB1cHdhcmRzXG4gICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcihlcnIpXG4gIH1cblxuICAvL1xuICAvL1xuICAvLyBQVUJMSUMgQVBJXG4gIC8vXG4gIC8vXG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGNvbm5lY3Rpb24gYW5kIGxvZ2luIHRvIHRoZSBJTUFQIHNlcnZlclxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aGVuIGxvZ2luIHByb2NlZHVyZSBpcyBjb21wbGV0ZVxuICAgKi9cbiAgYXN5bmMgY29ubmVjdCAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMub3BlbkNvbm5lY3Rpb24oKVxuICAgICAgYXdhaXQgdGhpcy51cGdyYWRlQ29ubmVjdGlvbigpXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUlkKHRoaXMuX2NsaWVudElkKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ0ZhaWxlZCB0byB1cGRhdGUgc2VydmVyIGlkIScsIGVyci5tZXNzYWdlKVxuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLmxvZ2luKHRoaXMuX2F1dGgpXG4gICAgICBhd2FpdCB0aGlzLmNvbXByZXNzQ29ubmVjdGlvbigpXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29ubmVjdGlvbiBlc3RhYmxpc2hlZCwgcmVhZHkgdG8gcm9sbCEnKVxuICAgICAgdGhpcy5jbGllbnQub25lcnJvciA9IHRoaXMuX29uRXJyb3IuYmluZCh0aGlzKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0NvdWxkIG5vdCBjb25uZWN0IHRvIHNlcnZlcicsIGVycilcbiAgICAgIHRoaXMuY2xvc2UoZXJyKSAvLyB3ZSBkb24ndCByZWFsbHkgY2FyZSB3aGV0aGVyIHRoaXMgd29ya3Mgb3Igbm90XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgY29ubmVjdGlvbiB0byB0aGUgSU1BUCBzZXJ2ZXJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IGNhcGFiaWxpdHkgb2Ygc2VydmVyIHdpdGhvdXQgbG9naW5cbiAgICovXG4gIG9wZW5Db25uZWN0aW9uICgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ1RpbWVvdXQgY29ubmVjdGluZyB0byBzZXJ2ZXInKSksIHRoaXMudGltZW91dENvbm5lY3Rpb24pXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29ubmVjdGluZyB0bycsIHRoaXMuY2xpZW50Lmhvc3QsICc6JywgdGhpcy5jbGllbnQucG9ydClcbiAgICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0NPTk5FQ1RJTkcpXG4gICAgICB0aGlzLmNsaWVudC5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTb2NrZXQgb3BlbmVkLCB3YWl0aW5nIGZvciBncmVldGluZyBmcm9tIHRoZSBzZXJ2ZXIuLi4nKVxuXG4gICAgICAgIHRoaXMuY2xpZW50Lm9ucmVhZHkgPSAoKSA9PiB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0KVxuICAgICAgICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX05PVF9BVVRIRU5USUNBVEVEKVxuICAgICAgICAgIHRoaXMudXBkYXRlQ2FwYWJpbGl0eSgpXG4gICAgICAgICAgICAudGhlbigoKSA9PiByZXNvbHZlKHRoaXMuX2NhcGFiaWxpdHkpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGllbnQub25lcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXQpXG4gICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2gocmVqZWN0KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogTG9nb3V0XG4gICAqXG4gICAqIFNlbmQgTE9HT1VULCB0byB3aGljaCB0aGUgc2VydmVyIHJlc3BvbmRzIGJ5IGNsb3NpbmcgdGhlIGNvbm5lY3Rpb24uXG4gICAqIFVzZSBpcyBkaXNjb3VyYWdlZCBpZiBuZXR3b3JrIHN0YXR1cyBpcyB1bmNsZWFyISBJZiBuZXR3b3JrcyBzdGF0dXMgaXNcbiAgICogdW5jbGVhciwgcGxlYXNlIHVzZSAjY2xvc2UgaW5zdGVhZCFcbiAgICpcbiAgICogTE9HT1VUIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjEuM1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiBzZXJ2ZXIgaGFzIGNsb3NlZCB0aGUgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgbG9nb3V0ICgpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9MT0dPVVQpXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xvZ2dpbmcgb3V0Li4uJylcbiAgICBhd2FpdCB0aGlzLmNsaWVudC5sb2dvdXQoKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZS1jbG9zZXMgdGhlIGN1cnJlbnQgY29ubmVjdGlvbiBieSBjbG9zaW5nIHRoZSBUQ1Agc29ja2V0LlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiBzb2NrZXQgaXMgY2xvc2VkXG4gICAqL1xuICBhc3luYyBjbG9zZSAoZXJyKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfTE9HT1VUKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ2xvc2luZyBjb25uZWN0aW9uLi4uJylcbiAgICBhd2FpdCB0aGlzLmNsaWVudC5jbG9zZShlcnIpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgSUQgY29tbWFuZCwgcGFyc2VzIElEIHJlc3BvbnNlLCBzZXRzIHRoaXMuc2VydmVySWRcbiAgICpcbiAgICogSUQgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyOTcxXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpZCBJRCBhcyBKU09OIG9iamVjdC4gU2VlIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI5NzEjc2VjdGlvbi0zLjMgZm9yIHBvc3NpYmxlIHZhbHVlc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiByZXNwb25zZSBoYXMgYmVlbiBwYXJzZWRcbiAgICovXG4gIGFzeW5jIHVwZGF0ZUlkIChpZCkge1xuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0lEJykgPCAwKSByZXR1cm5cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGRhdGluZyBpZC4uLicpXG5cbiAgICBjb25zdCBjb21tYW5kID0gJ0lEJ1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBpZCA/IFtmbGF0dGVuKE9iamVjdC5lbnRyaWVzKGlkKSldIDogW251bGxdXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kLCBhdHRyaWJ1dGVzIH0sICdJRCcpXG4gICAgY29uc3QgbGlzdCA9IGZsYXR0ZW4ocGF0aE9yKFtdLCBbJ3BheWxvYWQnLCAnSUQnLCAnMCcsICdhdHRyaWJ1dGVzJywgJzAnXSwgcmVzcG9uc2UpLm1hcChPYmplY3QudmFsdWVzKSlcbiAgICBjb25zdCBrZXlzID0gbGlzdC5maWx0ZXIoKF8sIGkpID0+IGkgJSAyID09PSAwKVxuICAgIGNvbnN0IHZhbHVlcyA9IGxpc3QuZmlsdGVyKChfLCBpKSA9PiBpICUgMiA9PT0gMSlcbiAgICB0aGlzLnNlcnZlcklkID0gZnJvbVBhaXJzKHppcChrZXlzLCB2YWx1ZXMpKVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTZXJ2ZXIgaWQgdXBkYXRlZCEnLCB0aGlzLnNlcnZlcklkKVxuICB9XG5cbiAgX3Nob3VsZFNlbGVjdE1haWxib3ggKHBhdGgsIGN0eCkge1xuICAgIGlmICghY3R4KSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzU2VsZWN0ID0gdGhpcy5jbGllbnQuZ2V0UHJldmlvdXNseVF1ZXVlZChbJ1NFTEVDVCcsICdFWEFNSU5FJ10sIGN0eClcbiAgICBpZiAocHJldmlvdXNTZWxlY3QgJiYgcHJldmlvdXNTZWxlY3QucmVxdWVzdC5hdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBwYXRoQXR0cmlidXRlID0gcHJldmlvdXNTZWxlY3QucmVxdWVzdC5hdHRyaWJ1dGVzLmZpbmQoKGF0dHJpYnV0ZSkgPT4gYXR0cmlidXRlLnR5cGUgPT09ICdTVFJJTkcnKVxuICAgICAgaWYgKHBhdGhBdHRyaWJ1dGUpIHtcbiAgICAgICAgcmV0dXJuIHBhdGhBdHRyaWJ1dGUudmFsdWUgIT09IHBhdGhcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRNYWlsYm94ICE9PSBwYXRoXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTRUxFQ1Qgb3IgRVhBTUlORSB0byBvcGVuIGEgbWFpbGJveFxuICAgKlxuICAgKiBTRUxFQ1QgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjFcbiAgICogRVhBTUlORSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuMlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBGdWxsIHBhdGggdG8gbWFpbGJveFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlbGVjdGVkIG1haWxib3hcbiAgICovXG4gIGFzeW5jIHNlbGVjdE1haWxib3ggKHBhdGgsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHF1ZXJ5ID0ge1xuICAgICAgY29tbWFuZDogb3B0aW9ucy5yZWFkT25seSA/ICdFWEFNSU5FJyA6ICdTRUxFQ1QnLFxuICAgICAgYXR0cmlidXRlczogW3sgdHlwZTogJ1NUUklORycsIHZhbHVlOiBwYXRoIH1dXG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuY29uZHN0b3JlICYmIHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignQ09ORFNUT1JFJykgPj0gMCkge1xuICAgICAgcXVlcnkuYXR0cmlidXRlcy5wdXNoKFt7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdDT05EU1RPUkUnIH1dKVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdPcGVuaW5nJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMocXVlcnksIFsnRVhJU1RTJywgJ0ZMQUdTJywgJ09LJ10sIHsgY3R4OiBvcHRpb25zLmN0eCB9KVxuICAgIGNvbnN0IG1haWxib3hJbmZvID0gcGFyc2VTRUxFQ1QocmVzcG9uc2UpXG5cbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9TRUxFQ1RFRClcblxuICAgIGlmICh0aGlzLl9zZWxlY3RlZE1haWxib3ggIT09IHBhdGggJiYgdGhpcy5vbmNsb3NlbWFpbGJveCkge1xuICAgICAgYXdhaXQgdGhpcy5vbmNsb3NlbWFpbGJveCh0aGlzLl9zZWxlY3RlZE1haWxib3gpXG4gICAgfVxuICAgIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA9IHBhdGhcbiAgICBpZiAodGhpcy5vbnNlbGVjdG1haWxib3gpIHtcbiAgICAgIGF3YWl0IHRoaXMub25zZWxlY3RtYWlsYm94KHBhdGgsIG1haWxib3hJbmZvKVxuICAgIH1cblxuICAgIHJldHVybiBtYWlsYm94SW5mb1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgTkFNRVNQQUNFIGNvbW1hbmRcbiAgICpcbiAgICogTkFNRVNQQUNFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzIzNDJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBuYW1lc3BhY2Ugb2JqZWN0XG4gICAqL1xuICBhc3luYyBsaXN0TmFtZXNwYWNlcyAoKSB7XG4gICAgaWYgKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignTkFNRVNQQUNFJykgPCAwKSByZXR1cm4gZmFsc2VcblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMaXN0aW5nIG5hbWVzcGFjZXMuLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKCdOQU1FU1BBQ0UnLCAnTkFNRVNQQUNFJylcbiAgICByZXR1cm4gcGFyc2VOQU1FU1BBQ0UocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBMSVNUIGFuZCBMU1VCIGNvbW1hbmRzLiBSZXRyaWV2ZXMgYSB0cmVlIG9mIGF2YWlsYWJsZSBtYWlsYm94ZXNcbiAgICpcbiAgICogTElTVCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuOFxuICAgKiBMU1VCIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy45XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggbGlzdCBvZiBtYWlsYm94ZXNcbiAgICovXG4gIGFzeW5jIGxpc3RNYWlsYm94ZXMgKCkge1xuICAgIGNvbnN0IHRyZWUgPSB7IHJvb3Q6IHRydWUsIGNoaWxkcmVuOiBbXSB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTGlzdGluZyBtYWlsYm94ZXMuLi4nKVxuICAgIGNvbnN0IGxpc3RSZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyh7IGNvbW1hbmQ6ICdMSVNUJywgYXR0cmlidXRlczogWycnLCAnKiddIH0sICdMSVNUJylcbiAgICBjb25zdCBsaXN0ID0gcGF0aE9yKFtdLCBbJ3BheWxvYWQnLCAnTElTVCddLCBsaXN0UmVzcG9uc2UpXG4gICAgbGlzdC5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgY29uc3QgYXR0ciA9IHByb3BPcihbXSwgJ2F0dHJpYnV0ZXMnLCBpdGVtKVxuICAgICAgaWYgKGF0dHIubGVuZ3RoIDwgMykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IHBhdGggPSBwYXRoT3IoJycsIFsnMicsICd2YWx1ZSddLCBhdHRyKVxuICAgICAgY29uc3QgZGVsaW0gPSBwYXRoT3IoJy8nLCBbJzEnLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGJyYW5jaCA9IHRoaXMuX2Vuc3VyZVBhdGgodHJlZSwgcGF0aCwgZGVsaW0pXG4gICAgICBicmFuY2guZmxhZ3MgPSBwcm9wT3IoW10sICcwJywgYXR0cikubWFwKCh7IHZhbHVlIH0pID0+IHZhbHVlIHx8ICcnKVxuICAgICAgYnJhbmNoLmxpc3RlZCA9IHRydWVcbiAgICAgIGNoZWNrU3BlY2lhbFVzZShicmFuY2gpXG4gICAgfSlcblxuICAgIGNvbnN0IGxzdWJSZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyh7IGNvbW1hbmQ6ICdMU1VCJywgYXR0cmlidXRlczogWycnLCAnKiddIH0sICdMU1VCJylcbiAgICBjb25zdCBsc3ViID0gcGF0aE9yKFtdLCBbJ3BheWxvYWQnLCAnTFNVQiddLCBsc3ViUmVzcG9uc2UpXG4gICAgbHN1Yi5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBjb25zdCBhdHRyID0gcHJvcE9yKFtdLCAnYXR0cmlidXRlcycsIGl0ZW0pXG4gICAgICBpZiAoYXR0ci5sZW5ndGggPCAzKSByZXR1cm5cblxuICAgICAgY29uc3QgcGF0aCA9IHBhdGhPcignJywgWycyJywgJ3ZhbHVlJ10sIGF0dHIpXG4gICAgICBjb25zdCBkZWxpbSA9IHBhdGhPcignLycsIFsnMScsICd2YWx1ZSddLCBhdHRyKVxuICAgICAgY29uc3QgYnJhbmNoID0gdGhpcy5fZW5zdXJlUGF0aCh0cmVlLCBwYXRoLCBkZWxpbSlcbiAgICAgIHByb3BPcihbXSwgJzAnLCBhdHRyKS5tYXAoKGZsYWcgPSAnJykgPT4geyBicmFuY2guZmxhZ3MgPSB1bmlvbihicmFuY2guZmxhZ3MsIFtmbGFnXSkgfSlcbiAgICAgIGJyYW5jaC5zdWJzY3JpYmVkID0gdHJ1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gdHJlZVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgbWFpbGJveCBTVEFUVVNcbiAgICpcbiAgICogU1RBVFVTIGRldGFpbHM6XG4gICAqICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4xMFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBGdWxsIHBhdGggdG8gbWFpbGJveFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlbGVjdGVkIG1haWxib3hcbiAgICovXG4gIGFzeW5jIG1haWxib3hTdGF0dXMgKHBhdGgsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHN0YXR1c0RhdGFJdGVtcyA9IFsnVUlETkVYVCcsICdNRVNTQUdFUyddXG5cbiAgICBpZiAob3B0aW9ucy5jb25kc3RvcmUgJiYgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdDT05EU1RPUkUnKSA+PSAwKSB7XG4gICAgICBzdGF0dXNEYXRhSXRlbXMucHVzaCgnSElHSEVTVE1PRFNFUScpXG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdHVzQXR0cmlidXRlcyA9IHN0YXR1c0RhdGFJdGVtcy5tYXAoKHN0YXR1c0RhdGFJdGVtKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgIHZhbHVlOiBzdGF0dXNEYXRhSXRlbVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnT3BlbmluZycsIHBhdGgsICcuLi4nKVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoe1xuICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgIFsuLi5zdGF0dXNBdHRyaWJ1dGVzXVxuICAgICAgXVxuICAgIH0sIFsnU1RBVFVTJ10pXG5cbiAgICByZXR1cm4gcGFyc2VTVEFUVVMocmVzcG9uc2UsIHN0YXR1c0RhdGFJdGVtcylcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBtYWlsYm94IHdpdGggdGhlIGdpdmVuIHBhdGguXG4gICAqXG4gICAqIENSRUFURSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuM1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiAgICAgVGhlIHBhdGggb2YgdGhlIG1haWxib3ggeW91IHdvdWxkIGxpa2UgdG8gY3JlYXRlLiAgVGhpcyBtZXRob2Qgd2lsbFxuICAgKiAgICAgaGFuZGxlIHV0ZjcgZW5jb2RpbmcgZm9yIHlvdS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqICAgICBQcm9taXNlIHJlc29sdmVzIGlmIG1haWxib3ggd2FzIGNyZWF0ZWQuXG4gICAqICAgICBJbiB0aGUgZXZlbnQgdGhlIHNlcnZlciBzYXlzIE5PIFtBTFJFQURZRVhJU1RTXSwgd2UgdHJlYXQgdGhhdCBhcyBzdWNjZXNzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlTWFpbGJveCAocGF0aCkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDcmVhdGluZyBtYWlsYm94JywgcGF0aCwgJy4uLicpXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZXhlYyh7IGNvbW1hbmQ6ICdDUkVBVEUnLCBhdHRyaWJ1dGVzOiBbaW1hcEVuY29kZShwYXRoKV0gfSlcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgPT09ICdBTFJFQURZRVhJU1RTJykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBtYWlsYm94IHdpdGggdGhlIGdpdmVuIHBhdGguXG4gICAqXG4gICAqIERFTEVURSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjRcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogICAgIFRoZSBwYXRoIG9mIHRoZSBtYWlsYm94IHlvdSB3b3VsZCBsaWtlIHRvIGRlbGV0ZS4gIFRoaXMgbWV0aG9kIHdpbGxcbiAgICogICAgIGhhbmRsZSB1dGY3IGVuY29kaW5nIGZvciB5b3UuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiAgICAgUHJvbWlzZSByZXNvbHZlcyBpZiBtYWlsYm94IHdhcyBkZWxldGVkLlxuICAgKi9cbiAgZGVsZXRlTWFpbGJveCAocGF0aCkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdEZWxldGluZyBtYWlsYm94JywgcGF0aCwgJy4uLicpXG4gICAgcmV0dXJuIHRoaXMuZXhlYyh7IGNvbW1hbmQ6ICdERUxFVEUnLCBhdHRyaWJ1dGVzOiBbaW1hcEVuY29kZShwYXRoKV0gfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIEZFVENIIGNvbW1hbmRcbiAgICpcbiAgICogRkVUQ0ggZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjVcbiAgICogQ0hBTkdFRFNJTkNFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzQ1NTEjc2VjdGlvbi0zLjNcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIFNlcXVlbmNlIHNldCwgZWcgMToqIGZvciBhbGwgbWVzc2FnZXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtpdGVtc10gTWVzc2FnZSBkYXRhIGl0ZW0gbmFtZXMgb3IgbWFjcm9cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgZmV0Y2hlZCBtZXNzYWdlIGluZm9cbiAgICovXG4gIGFzeW5jIGxpc3RNZXNzYWdlcyAocGF0aCwgc2VxdWVuY2UsIGl0ZW1zID0gW3sgZmFzdDogdHJ1ZSB9XSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0ZldGNoaW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdmcm9tJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkRkVUQ0hDb21tYW5kKHNlcXVlbmNlLCBpdGVtcywgb3B0aW9ucylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnRkVUQ0gnLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICAgIHJldHVybiBwYXJzZUZFVENIKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU0VBUkNIIGNvbW1hbmRcbiAgICpcbiAgICogU0VBUkNIIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC40XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSBTZWFyY2ggdGVybXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgYXN5bmMgc2VhcmNoIChwYXRoLCBxdWVyeSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NlYXJjaGluZyBpbicsIHBhdGgsICcuLi4nKVxuICAgIGNvbnN0IGNvbW1hbmQgPSBidWlsZFNFQVJDSENvbW1hbmQocXVlcnksIG9wdGlvbnMpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoY29tbWFuZCwgJ1NFQVJDSCcsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHBhcnNlU0VBUkNIKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU1RPUkUgY29tbWFuZFxuICAgKlxuICAgKiBTVE9SRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuNlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSBzZWxlY3RvciB3aGljaCB0aGUgZmxhZyBjaGFuZ2UgaXMgYXBwbGllZCB0b1xuICAgKiBAcGFyYW0ge0FycmF5fSBmbGFnc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBzZXRGbGFncyAocGF0aCwgc2VxdWVuY2UsIGZsYWdzLCBvcHRpb25zKSB7XG4gICAgbGV0IGtleSA9ICcnXG4gICAgbGV0IGxpc3QgPSBbXVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmxhZ3MpIHx8IHR5cGVvZiBmbGFncyAhPT0gJ29iamVjdCcpIHtcbiAgICAgIGxpc3QgPSBbXS5jb25jYXQoZmxhZ3MgfHwgW10pXG4gICAgICBrZXkgPSAnJ1xuICAgIH0gZWxzZSBpZiAoZmxhZ3MuYWRkKSB7XG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzLmFkZCB8fCBbXSlcbiAgICAgIGtleSA9ICcrJ1xuICAgIH0gZWxzZSBpZiAoZmxhZ3Muc2V0KSB7XG4gICAgICBrZXkgPSAnJ1xuICAgICAgbGlzdCA9IFtdLmNvbmNhdChmbGFncy5zZXQgfHwgW10pXG4gICAgfSBlbHNlIGlmIChmbGFncy5yZW1vdmUpIHtcbiAgICAgIGtleSA9ICctJ1xuICAgICAgbGlzdCA9IFtdLmNvbmNhdChmbGFncy5yZW1vdmUgfHwgW10pXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NldHRpbmcgZmxhZ3Mgb24nLCBzZXF1ZW5jZSwgJ2luJywgcGF0aCwgJy4uLicpXG4gICAgcmV0dXJuIHRoaXMuc3RvcmUocGF0aCwgc2VxdWVuY2UsIGtleSArICdGTEFHUycsIGxpc3QsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTVE9SRSBjb21tYW5kXG4gICAqXG4gICAqIFNUT1JFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC42XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHNlbGVjdG9yIHdoaWNoIHRoZSBmbGFnIGNoYW5nZSBpcyBhcHBsaWVkIHRvXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb24gU1RPUkUgbWV0aG9kIHRvIGNhbGwsIGVnIFwiK0ZMQUdTXCJcbiAgICogQHBhcmFtIHtBcnJheX0gZmxhZ3NcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgYXN5bmMgc3RvcmUgKHBhdGgsIHNlcXVlbmNlLCBhY3Rpb24sIGZsYWdzLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBjb21tYW5kID0gYnVpbGRTVE9SRUNvbW1hbmQoc2VxdWVuY2UsIGFjdGlvbiwgZmxhZ3MsIG9wdGlvbnMpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoY29tbWFuZCwgJ0ZFVENIJywge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgICByZXR1cm4gcGFyc2VGRVRDSChyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIEFQUEVORCBjb21tYW5kXG4gICAqXG4gICAqIEFQUEVORCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuMTFcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGRlc3RpbmF0aW9uIFRoZSBtYWlsYm94IHdoZXJlIHRvIGFwcGVuZCB0aGUgbWVzc2FnZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBhcHBlbmRcbiAgICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy5mbGFncyBBbnkgZmxhZ3MgeW91IHdhbnQgdG8gc2V0IG9uIHRoZSB1cGxvYWRlZCBtZXNzYWdlLiBEZWZhdWx0cyB0byBbXFxTZWVuXS4gKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBhc3luYyB1cGxvYWQgKGRlc3RpbmF0aW9uLCBtZXNzYWdlLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBmbGFncyA9IHByb3BPcihbJ1xcXFxTZWVuJ10sICdmbGFncycsIG9wdGlvbnMpLm1hcCh2YWx1ZSA9PiAoeyB0eXBlOiAnYXRvbScsIHZhbHVlIH0pKVxuICAgIGNvbnN0IGNvbW1hbmQgPSB7XG4gICAgICBjb21tYW5kOiAnQVBQRU5EJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgeyB0eXBlOiAnYXRvbScsIHZhbHVlOiBkZXN0aW5hdGlvbiB9LFxuICAgICAgICBmbGFncyxcbiAgICAgICAgeyB0eXBlOiAnbGl0ZXJhbCcsIHZhbHVlOiBtZXNzYWdlIH1cbiAgICAgIF1cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnVXBsb2FkaW5nIG1lc3NhZ2UgdG8nLCBkZXN0aW5hdGlvbiwgJy4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoY29tbWFuZClcbiAgICByZXR1cm4gcGFyc2VBUFBFTkQocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBtZXNzYWdlcyBmcm9tIGEgc2VsZWN0ZWQgbWFpbGJveFxuICAgKlxuICAgKiBFWFBVTkdFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC4zXG4gICAqIFVJRCBFWFBVTkdFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzQzMTUjc2VjdGlvbi0yLjFcbiAgICpcbiAgICogSWYgcG9zc2libGUgKGJ5VWlkOnRydWUgYW5kIFVJRFBMVVMgZXh0ZW5zaW9uIHN1cHBvcnRlZCksIHVzZXMgVUlEIEVYUFVOR0VcbiAgICogY29tbWFuZCB0byBkZWxldGUgYSByYW5nZSBvZiBtZXNzYWdlcywgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gRVhQVU5HRS5cbiAgICpcbiAgICogTkIhIFRoaXMgbWV0aG9kIG1pZ2h0IGJlIGRlc3RydWN0aXZlIC0gaWYgRVhQVU5HRSBpcyB1c2VkLCB0aGVuIGFueSBtZXNzYWdlc1xuICAgKiB3aXRoIFxcRGVsZXRlZCBmbGFnIHNldCBhcmUgZGVsZXRlZFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSByYW5nZSB0byBiZSBkZWxldGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlXG4gICAqL1xuICBhc3luYyBkZWxldGVNZXNzYWdlcyAocGF0aCwgc2VxdWVuY2UsIG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIGFkZCBcXERlbGV0ZWQgZmxhZyB0byB0aGUgbWVzc2FnZXMgYW5kIHJ1biBFWFBVTkdFIG9yIFVJRCBFWFBVTkdFXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0RlbGV0aW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdpbicsIHBhdGgsICcuLi4nKVxuICAgIGNvbnN0IHVzZVVpZFBsdXMgPSBvcHRpb25zLmJ5VWlkICYmIHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignVUlEUExVUycpID49IDBcbiAgICBjb25zdCB1aWRFeHB1bmdlQ29tbWFuZCA9IHsgY29tbWFuZDogJ1VJRCBFWFBVTkdFJywgYXR0cmlidXRlczogW3sgdHlwZTogJ3NlcXVlbmNlJywgdmFsdWU6IHNlcXVlbmNlIH1dIH1cbiAgICBhd2FpdCB0aGlzLnNldEZsYWdzKHBhdGgsIHNlcXVlbmNlLCB7IGFkZDogJ1xcXFxEZWxldGVkJyB9LCBvcHRpb25zKVxuICAgIGNvbnN0IGNtZCA9IHVzZVVpZFBsdXMgPyB1aWRFeHB1bmdlQ29tbWFuZCA6ICdFWFBVTkdFJ1xuICAgIHJldHVybiB0aGlzLmV4ZWMoY21kLCBudWxsLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBhIHJhbmdlIG9mIG1lc3NhZ2VzIGZyb20gdGhlIGFjdGl2ZSBtYWlsYm94IHRvIHRoZSBkZXN0aW5hdGlvbiBtYWlsYm94LlxuICAgKiBTaWxlbnQgbWV0aG9kICh1bmxlc3MgYW4gZXJyb3Igb2NjdXJzKSwgYnkgZGVmYXVsdCByZXR1cm5zIG5vIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBDT1BZIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC43XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHJhbmdlIHRvIGJlIGNvcGllZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gZGVzdGluYXRpb24gRGVzdGluYXRpb24gbWFpbGJveCBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuYnlVaWRdIElmIHRydWUsIHVzZXMgVUlEIENPUFkgaW5zdGVhZCBvZiBDT1BZXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlXG4gICAqL1xuICBhc3luYyBjb3B5TWVzc2FnZXMgKHBhdGgsIHNlcXVlbmNlLCBkZXN0aW5hdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0NvcHlpbmcgbWVzc2FnZXMnLCBzZXF1ZW5jZSwgJ2Zyb20nLCBwYXRoLCAndG8nLCBkZXN0aW5hdGlvbiwgJy4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoe1xuICAgICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgQ09QWScgOiAnQ09QWScsXG4gICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgIHsgdHlwZTogJ3NlcXVlbmNlJywgdmFsdWU6IHNlcXVlbmNlIH0sXG4gICAgICAgIHsgdHlwZTogJ2F0b20nLCB2YWx1ZTogZGVzdGluYXRpb24gfVxuICAgICAgXVxuICAgIH0sIG51bGwsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHBhcnNlQ09QWShyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyBhIHJhbmdlIG9mIG1lc3NhZ2VzIGZyb20gdGhlIGFjdGl2ZSBtYWlsYm94IHRvIHRoZSBkZXN0aW5hdGlvbiBtYWlsYm94LlxuICAgKiBQcmVmZXJzIHRoZSBNT1ZFIGV4dGVuc2lvbiBidXQgaWYgbm90IGF2YWlsYWJsZSwgZmFsbHMgYmFjayB0b1xuICAgKiBDT1BZICsgRVhQVU5HRVxuICAgKlxuICAgKiBNT1ZFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjg1MVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSByYW5nZSB0byBiZSBtb3ZlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gZGVzdGluYXRpb24gRGVzdGluYXRpb24gbWFpbGJveCBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlXG4gICAqL1xuICBhc3luYyBtb3ZlTWVzc2FnZXMgKHBhdGgsIHNlcXVlbmNlLCBkZXN0aW5hdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ01vdmluZyBtZXNzYWdlcycsIHNlcXVlbmNlLCAnZnJvbScsIHBhdGgsICd0bycsIGRlc3RpbmF0aW9uLCAnLi4uJylcblxuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ01PVkUnKSA9PT0gLTEpIHtcbiAgICAgIC8vIEZhbGxiYWNrIHRvIENPUFkgKyBFWFBVTkdFXG4gICAgICBhd2FpdCB0aGlzLmNvcHlNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgZGVzdGluYXRpb24sIG9wdGlvbnMpXG4gICAgICByZXR1cm4gdGhpcy5kZWxldGVNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvLyBJZiBwb3NzaWJsZSwgdXNlIE1PVkVcbiAgICByZXR1cm4gdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIE1PVkUnIDogJ01PVkUnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdzZXF1ZW5jZScsIHZhbHVlOiBzZXF1ZW5jZSB9LFxuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH1cbiAgICAgIF1cbiAgICB9LCBbJ09LJ10sIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVucyBDT01QUkVTUyBjb21tYW5kXG4gICAqXG4gICAqIENPTVBSRVNTIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzQ5NzhcbiAgICovXG4gIGFzeW5jIGNvbXByZXNzQ29ubmVjdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9lbmFibGVDb21wcmVzc2lvbiB8fCB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0NPTVBSRVNTPURFRkxBVEUnKSA8IDAgfHwgdGhpcy5jbGllbnQuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0VuYWJsaW5nIGNvbXByZXNzaW9uLi4uJylcbiAgICBhd2FpdCB0aGlzLmV4ZWMoe1xuICAgICAgY29tbWFuZDogJ0NPTVBSRVNTJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgdmFsdWU6ICdERUZMQVRFJ1xuICAgICAgfV1cbiAgICB9KVxuICAgIHRoaXMuY2xpZW50LmVuYWJsZUNvbXByZXNzaW9uKClcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29tcHJlc3Npb24gZW5hYmxlZCwgYWxsIGRhdGEgc2VudCBhbmQgcmVjZWl2ZWQgaXMgZGVmbGF0ZWQhJylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIExPR0lOIG9yIEFVVEhFTlRJQ0FURSBYT0FVVEgyIGNvbW1hbmRcbiAgICpcbiAgICogTE9HSU4gZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4yLjNcbiAgICogWE9BVVRIMiBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2dtYWlsL3hvYXV0aDJfcHJvdG9jb2wjaW1hcF9wcm90b2NvbF9leGNoYW5nZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXV0aC51c2VyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRoLnBhc3NcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGgueG9hdXRoMlxuICAgKi9cbiAgYXN5bmMgbG9naW4gKGF1dGgpIHtcbiAgICBsZXQgY29tbWFuZFxuICAgIGNvbnN0IG9wdGlvbnMgPSB7fVxuXG4gICAgaWYgKCFhdXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIGluZm9ybWF0aW9uIG5vdCBwcm92aWRlZCcpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignQVVUSD1YT0FVVEgyJykgPj0gMCAmJiBhdXRoICYmIGF1dGgueG9hdXRoMikge1xuICAgICAgY29tbWFuZCA9IHtcbiAgICAgICAgY29tbWFuZDogJ0FVVEhFTlRJQ0FURScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdYT0FVVEgyJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogYnVpbGRYT0F1dGgyVG9rZW4oYXV0aC51c2VyLCBhdXRoLnhvYXV0aDIpLCBzZW5zaXRpdmU6IHRydWUgfVxuICAgICAgICBdXG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMuZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUgPSB0cnVlIC8vICsgdGFnZ2VkIGVycm9yIHJlc3BvbnNlIGV4cGVjdHMgYW4gZW1wdHkgbGluZSBpbiByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgY29tbWFuZCA9IHtcbiAgICAgICAgY29tbWFuZDogJ2xvZ2luJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBhdXRoLnVzZXIgfHwgJycgfSxcbiAgICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogYXV0aC5wYXNzIHx8ICcnLCBzZW5zaXRpdmU6IHRydWUgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xvZ2dpbmcgaW4uLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdjYXBhYmlsaXR5Jywgb3B0aW9ucylcbiAgICAvKlxuICAgICAqIHVwZGF0ZSBwb3N0LWF1dGggY2FwYWJpbGl0ZXNcbiAgICAgKiBjYXBhYmlsaXR5IGxpc3Qgc2hvdWxkbid0IGNvbnRhaW4gYXV0aCByZWxhdGVkIHN0dWZmIGFueW1vcmVcbiAgICAgKiBidXQgc29tZSBuZXcgZXh0ZW5zaW9ucyBtaWdodCBoYXZlIHBvcHBlZCB1cCB0aGF0IGRvIG5vdFxuICAgICAqIG1ha2UgbXVjaCBzZW5zZSBpbiB0aGUgbm9uLWF1dGggc3RhdGVcbiAgICAgKi9cbiAgICBpZiAocmVzcG9uc2UuY2FwYWJpbGl0eSAmJiByZXNwb25zZS5jYXBhYmlsaXR5Lmxlbmd0aCkge1xuICAgICAgLy8gY2FwYWJpbGl0ZXMgd2VyZSBsaXN0ZWQgd2l0aCB0aGUgT0sgW0NBUEFCSUxJVFkgLi4uXSByZXNwb25zZVxuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLmNhcGFiaWxpdHlcbiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnBheWxvYWQgJiYgcmVzcG9uc2UucGF5bG9hZC5DQVBBQklMSVRZICYmIHJlc3BvbnNlLnBheWxvYWQuQ0FQQUJJTElUWS5sZW5ndGgpIHtcbiAgICAgIC8vIGNhcGFiaWxpdGVzIHdlcmUgbGlzdGVkIHdpdGggKiBDQVBBQklMSVRZIC4uLiByZXNwb25zZVxuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLnBheWxvYWQuQ0FQQUJJTElUWS5wb3AoKS5hdHRyaWJ1dGVzLm1hcCgoY2FwYSA9ICcnKSA9PiBjYXBhLnZhbHVlLnRvVXBwZXJDYXNlKCkudHJpbSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjYXBhYmlsaXRpZXMgd2VyZSBub3QgYXV0b21hdGljYWxseSBsaXN0ZWQsIHJlbG9hZFxuICAgICAgYXdhaXQgdGhpcy51cGRhdGVDYXBhYmlsaXR5KHRydWUpXG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfQVVUSEVOVElDQVRFRClcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gdHJ1ZVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMb2dpbiBzdWNjZXNzZnVsLCBwb3N0LWF1dGggY2FwYWJpbGl0ZXMgdXBkYXRlZCEnLCB0aGlzLl9jYXBhYmlsaXR5KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbiBJTUFQIGNvbW1hbmQuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IFN0cnVjdHVyZWQgcmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheX0gYWNjZXB0VW50YWdnZWQgYSBsaXN0IG9mIHVudGFnZ2VkIHJlc3BvbnNlcyB0aGF0IHdpbGwgYmUgaW5jbHVkZWQgaW4gJ3BheWxvYWQnIHByb3BlcnR5XG4gICAqL1xuICBhc3luYyBleGVjIChyZXF1ZXN0LCBhY2NlcHRVbnRhZ2dlZCwgb3B0aW9ucykge1xuICAgIHRoaXMuYnJlYWtJZGxlKClcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xpZW50LmVucXVldWVDb21tYW5kKHJlcXVlc3QsIGFjY2VwdFVudGFnZ2VkLCBvcHRpb25zKVxuICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5jYXBhYmlsaXR5KSB7XG4gICAgICB0aGlzLl9jYXBhYmlsaXR5ID0gcmVzcG9uc2UuY2FwYWJpbGl0eVxuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY29ubmVjdGlvbiBpcyBpZGxpbmcuIFNlbmRzIGEgTk9PUCBvciBJRExFIGNvbW1hbmRcbiAgICpcbiAgICogSURMRSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyMTc3XG4gICAqL1xuICBlbnRlcklkbGUgKCkge1xuICAgIGlmICh0aGlzLl9lbnRlcmVkSWRsZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHN1cHBvcnRzSWRsZSA9IHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignSURMRScpID49IDBcbiAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IHN1cHBvcnRzSWRsZSAmJiB0aGlzLl9zZWxlY3RlZE1haWxib3ggPyAnSURMRScgOiAnTk9PUCdcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW50ZXJpbmcgaWRsZSB3aXRoICcgKyB0aGlzLl9lbnRlcmVkSWRsZSlcblxuICAgIGlmICh0aGlzLl9lbnRlcmVkSWRsZSA9PT0gJ05PT1AnKSB7XG4gICAgICB0aGlzLl9pZGxlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2VuZGluZyBOT09QJylcbiAgICAgICAgdGhpcy5leGVjKCdOT09QJylcbiAgICAgIH0sIHRoaXMudGltZW91dE5vb3ApXG4gICAgfSBlbHNlIGlmICh0aGlzLl9lbnRlcmVkSWRsZSA9PT0gJ0lETEUnKSB7XG4gICAgICB0aGlzLmNsaWVudC5lbnF1ZXVlQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdJRExFJ1xuICAgICAgfSlcbiAgICAgIHRoaXMuX2lkbGVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xpZW50LnNlbmQoJ0RPTkVcXHJcXG4nKVxuICAgICAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IGZhbHNlXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdJZGxlIHRlcm1pbmF0ZWQnKVxuICAgICAgfSwgdGhpcy50aW1lb3V0SWRsZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgYWN0aW9ucyByZWxhdGVkIGlkbGluZywgaWYgSURMRSBpcyBzdXBwb3J0ZWQsIHNlbmRzIERPTkUgdG8gc3RvcCBpdFxuICAgKi9cbiAgYnJlYWtJZGxlICgpIHtcbiAgICBpZiAoIXRoaXMuX2VudGVyZWRJZGxlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG4gICAgaWYgKHRoaXMuX2VudGVyZWRJZGxlID09PSAnSURMRScpIHtcbiAgICAgIHRoaXMuY2xpZW50LnNlbmQoJ0RPTkVcXHJcXG4nKVxuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0lkbGUgdGVybWluYXRlZCcpXG4gICAgfVxuICAgIHRoaXMuX2VudGVyZWRJZGxlID0gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNUQVJUVExTIGNvbW1hbmQgaWYgbmVlZGVkXG4gICAqXG4gICAqIFNUQVJUVExTIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMi4xXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlZF0gQnkgZGVmYXVsdCB0aGUgY29tbWFuZCBpcyBub3QgcnVuIGlmIGNhcGFiaWxpdHkgaXMgYWxyZWFkeSBsaXN0ZWQuIFNldCB0byB0cnVlIHRvIHNraXAgdGhpcyB2YWxpZGF0aW9uXG4gICAqL1xuICBhc3luYyB1cGdyYWRlQ29ubmVjdGlvbiAoKSB7XG4gICAgLy8gc2tpcCByZXF1ZXN0LCBpZiBhbHJlYWR5IHNlY3VyZWRcbiAgICBpZiAodGhpcy5jbGllbnQuc2VjdXJlTW9kZSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gc2tpcCBpZiBTVEFSVFRMUyBub3QgYXZhaWxhYmxlIG9yIHN0YXJ0dGxzIHN1cHBvcnQgZGlzYWJsZWRcbiAgICBpZiAoKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignU1RBUlRUTFMnKSA8IDAgfHwgdGhpcy5faWdub3JlVExTKSAmJiAhdGhpcy5fcmVxdWlyZVRMUykge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0VuY3J5cHRpbmcgY29ubmVjdGlvbi4uLicpXG4gICAgYXdhaXQgdGhpcy5leGVjKCdTVEFSVFRMUycpXG4gICAgdGhpcy5fY2FwYWJpbGl0eSA9IFtdXG4gICAgdGhpcy5jbGllbnQudXBncmFkZSgpXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlQ2FwYWJpbGl0eSgpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBDQVBBQklMSVRZIGNvbW1hbmRcbiAgICpcbiAgICogQ0FQQUJJTElUWSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjEuMVxuICAgKlxuICAgKiBEb2Vzbid0IHJlZ2lzdGVyIHVudGFnZ2VkIENBUEFCSUxJVFkgaGFuZGxlciBhcyB0aGlzIGlzIGFscmVhZHlcbiAgICogaGFuZGxlZCBieSBnbG9iYWwgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtmb3JjZWRdIEJ5IGRlZmF1bHQgdGhlIGNvbW1hbmQgaXMgbm90IHJ1biBpZiBjYXBhYmlsaXR5IGlzIGFscmVhZHkgbGlzdGVkLiBTZXQgdG8gdHJ1ZSB0byBza2lwIHRoaXMgdmFsaWRhdGlvblxuICAgKi9cbiAgYXN5bmMgdXBkYXRlQ2FwYWJpbGl0eSAoZm9yY2VkKSB7XG4gICAgLy8gc2tpcCByZXF1ZXN0LCBpZiBub3QgZm9yY2VkIHVwZGF0ZSBhbmQgY2FwYWJpbGl0aWVzIGFyZSBhbHJlYWR5IGxvYWRlZFxuICAgIGlmICghZm9yY2VkICYmIHRoaXMuX2NhcGFiaWxpdHkubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBJZiBTVEFSVFRMUyBpcyByZXF1aXJlZCB0aGVuIHNraXAgY2FwYWJpbGl0eSBsaXN0aW5nIGFzIHdlIGFyZSBnb2luZyB0byB0cnlcbiAgICAvLyBTVEFSVFRMUyBhbnl3YXkgYW5kIHdlIHJlLWNoZWNrIGNhcGFiaWxpdGllcyBhZnRlciBjb25uZWN0aW9uIGlzIHNlY3VyZWRcbiAgICBpZiAoIXRoaXMuY2xpZW50LnNlY3VyZU1vZGUgJiYgdGhpcy5fcmVxdWlyZVRMUykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1VwZGF0aW5nIGNhcGFiaWxpdHkuLi4nKVxuICAgIHJldHVybiB0aGlzLmV4ZWMoJ0NBUEFCSUxJVFknKVxuICB9XG5cbiAgaGFzQ2FwYWJpbGl0eSAoY2FwYSA9ICcnKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZihjYXBhLnRvVXBwZXJDYXNlKCkudHJpbSgpKSA+PSAwXG4gIH1cblxuICAvLyBEZWZhdWx0IGhhbmRsZXJzIGZvciB1bnRhZ2dlZCByZXNwb25zZXNcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFuIHVudGFnZ2VkIE9LIGluY2x1ZGVzIFtDQVBBQklMSVRZXSB0YWcgYW5kIHVwZGF0ZXMgY2FwYWJpbGl0eSBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZE9rSGFuZGxlciAocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuY2FwYWJpbGl0eSkge1xuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLmNhcGFiaWxpdHlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBjYXBhYmlsaXR5IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIgKHJlc3BvbnNlKSB7XG4gICAgdGhpcy5fY2FwYWJpbGl0eSA9IHBpcGUoXG4gICAgICBwcm9wT3IoW10sICdhdHRyaWJ1dGVzJyksXG4gICAgICBtYXAoKHsgdmFsdWUgfSkgPT4gKHZhbHVlIHx8ICcnKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcbiAgICApKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgZXhpc3RpbmcgbWVzc2FnZSBjb3VudFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkRXhpc3RzSGFuZGxlciAocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3BvbnNlLCAnbnInKSkge1xuICAgICAgdGhpcy5vbnVwZGF0ZSAmJiB0aGlzLm9udXBkYXRlKHRoaXMuX3NlbGVjdGVkTWFpbGJveCwgJ2V4aXN0cycsIHJlc3BvbnNlLm5yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgYSBtZXNzYWdlIGhhcyBiZWVuIGRlbGV0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyIChyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzcG9uc2UsICducicpKSB7XG4gICAgICB0aGlzLm9udXBkYXRlICYmIHRoaXMub251cGRhdGUodGhpcy5fc2VsZWN0ZWRNYWlsYm94LCAnZXhwdW5nZScsIHJlc3BvbnNlLm5yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCBmbGFncyBoYXZlIGJlZW4gdXBkYXRlZCBmb3IgYSBtZXNzYWdlXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRGZXRjaEhhbmRsZXIgKHJlc3BvbnNlKSB7XG4gICAgdGhpcy5vbnVwZGF0ZSAmJiB0aGlzLm9udXBkYXRlKHRoaXMuX3NlbGVjdGVkTWFpbGJveCwgJ2ZldGNoJywgW10uY29uY2F0KHBhcnNlRkVUQ0goeyBwYXlsb2FkOiB7IEZFVENIOiBbcmVzcG9uc2VdIH0gfSkgfHwgW10pLnNoaWZ0KCkpXG4gIH1cblxuICAvLyBQcml2YXRlIGhlbHBlcnNcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHRoYXQgdGhlIGNvbm5lY3Rpb24gc3RhcnRlZCBpZGxpbmcuIEluaXRpYXRlcyBhIGN5Y2xlXG4gICAqIG9mIE5PT1BzIG9yIElETEVzIHRvIHJlY2VpdmUgbm90aWZpY2F0aW9ucyBhYm91dCB1cGRhdGVzIGluIHRoZSBzZXJ2ZXJcbiAgICovXG4gIF9vbklkbGUgKCkge1xuICAgIGlmICghdGhpcy5fYXV0aGVudGljYXRlZCB8fCB0aGlzLl9lbnRlcmVkSWRsZSkge1xuICAgICAgLy8gTm8gbmVlZCB0byBJRExFIHdoZW4gbm90IGxvZ2dlZCBpbiBvciBhbHJlYWR5IGlkbGluZ1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0NsaWVudCBzdGFydGVkIGlkbGluZycpXG4gICAgdGhpcy5lbnRlcklkbGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIElNQVAgc3RhdGUgdmFsdWUgZm9yIHRoZSBjdXJyZW50IGNvbm5lY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG5ld1N0YXRlIFRoZSBzdGF0ZSB5b3Ugd2FudCB0byBjaGFuZ2UgdG9cbiAgICovXG4gIF9jaGFuZ2VTdGF0ZSAobmV3U3RhdGUpIHtcbiAgICBpZiAobmV3U3RhdGUgPT09IHRoaXMuX3N0YXRlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW50ZXJpbmcgc3RhdGU6ICcgKyBuZXdTdGF0ZSlcblxuICAgIC8vIGlmIGEgbWFpbGJveCB3YXMgb3BlbmVkLCBlbWl0IG9uY2xvc2VtYWlsYm94IGFuZCBjbGVhciBzZWxlY3RlZE1haWxib3ggdmFsdWVcbiAgICBpZiAodGhpcy5fc3RhdGUgPT09IFNUQVRFX1NFTEVDVEVEICYmIHRoaXMuX3NlbGVjdGVkTWFpbGJveCkge1xuICAgICAgdGhpcy5vbmNsb3NlbWFpbGJveCAmJiB0aGlzLm9uY2xvc2VtYWlsYm94KHRoaXMuX3NlbGVjdGVkTWFpbGJveClcbiAgICAgIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA9IGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5fc3RhdGUgPSBuZXdTdGF0ZVxuICB9XG5cbiAgLyoqXG4gICAqIEVuc3VyZXMgYSBwYXRoIGV4aXN0cyBpbiB0aGUgTWFpbGJveCB0cmVlXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0cmVlIE1haWxib3ggdHJlZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge1N0cmluZ30gZGVsaW1pdGVyXG4gICAqIEByZXR1cm4ge09iamVjdH0gYnJhbmNoIGZvciB1c2VkIHBhdGhcbiAgICovXG4gIF9lbnN1cmVQYXRoICh0cmVlLCBwYXRoLCBkZWxpbWl0ZXIpIHtcbiAgICBjb25zdCBuYW1lcyA9IHBhdGguc3BsaXQoZGVsaW1pdGVyKVxuICAgIGxldCBicmFuY2ggPSB0cmVlXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZVxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBicmFuY2guY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbXBhcmVNYWlsYm94TmFtZXMoYnJhbmNoLmNoaWxkcmVuW2pdLm5hbWUsIGltYXBEZWNvZGUobmFtZXNbaV0pKSkge1xuICAgICAgICAgIGJyYW5jaCA9IGJyYW5jaC5jaGlsZHJlbltqXVxuICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgYnJhbmNoLmNoaWxkcmVuLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGltYXBEZWNvZGUobmFtZXNbaV0pLFxuICAgICAgICAgIGRlbGltaXRlcjogZGVsaW1pdGVyLFxuICAgICAgICAgIHBhdGg6IG5hbWVzLnNsaWNlKDAsIGkgKyAxKS5qb2luKGRlbGltaXRlciksXG4gICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgIH0pXG4gICAgICAgIGJyYW5jaCA9IGJyYW5jaC5jaGlsZHJlblticmFuY2guY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJyYW5jaFxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBtYWlsYm94IG5hbWVzLiBDYXNlIGluc2Vuc2l0aXZlIGluIGNhc2Ugb2YgSU5CT1gsIG90aGVyd2lzZSBjYXNlIHNlbnNpdGl2ZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYSBNYWlsYm94IG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGIgTWFpbGJveCBuYW1lXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBmb2xkZXIgbmFtZXMgbWF0Y2hcbiAgICovXG4gIF9jb21wYXJlTWFpbGJveE5hbWVzIChhLCBiKSB7XG4gICAgcmV0dXJuIChhLnRvVXBwZXJDYXNlKCkgPT09ICdJTkJPWCcgPyAnSU5CT1gnIDogYSkgPT09IChiLnRvVXBwZXJDYXNlKCkgPT09ICdJTkJPWCcgPyAnSU5CT1gnIDogYilcbiAgfVxuXG4gIGNyZWF0ZUxvZ2dlciAoY3JlYXRvciA9IGNyZWF0ZURlZmF1bHRMb2dnZXIpIHtcbiAgICBjb25zdCBsb2dnZXIgPSBjcmVhdG9yKCh0aGlzLl9hdXRoIHx8IHt9KS51c2VyIHx8ICcnLCB0aGlzLl9ob3N0KVxuICAgIHRoaXMubG9nZ2VyID0gdGhpcy5jbGllbnQubG9nZ2VyID0ge1xuICAgICAgZGVidWc6ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfREVCVUcgPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIuZGVidWcobXNncykgfSB9LFxuICAgICAgaW5mbzogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9JTkZPID49IHRoaXMubG9nTGV2ZWwpIHsgbG9nZ2VyLmluZm8obXNncykgfSB9LFxuICAgICAgd2FybjogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9XQVJOID49IHRoaXMubG9nTGV2ZWwpIHsgbG9nZ2VyLndhcm4obXNncykgfSB9LFxuICAgICAgZXJyb3I6ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfRVJST1IgPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIuZXJyb3IobXNncykgfSB9XG4gICAgfVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUFBLE1BQUEsR0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUQsT0FBQTtBQUNBLElBQUFFLGNBQUEsR0FBQUYsT0FBQTtBQVNBLElBQUFHLGVBQUEsR0FBQUgsT0FBQTtBQU9BLElBQUFJLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUwsT0FBQTtBQUNBLElBQUFNLEtBQUEsR0FBQUQsc0JBQUEsQ0FBQUwsT0FBQTtBQUNBLElBQUFPLE9BQUEsR0FBQVAsT0FBQTtBQVFBLElBQUFRLFdBQUEsR0FBQVIsT0FBQTtBQUlBLElBQUFTLG1CQUFB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