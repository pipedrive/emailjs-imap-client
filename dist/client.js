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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const TIMEOUT_CONNECTION = 90 * 1000; // Milliseconds to wait for the IMAP greeting from the server

exports.TIMEOUT_CONNECTION = TIMEOUT_CONNECTION;
const TIMEOUT_NOOP = 60 * 1000; // Milliseconds between NOOP commands while idling

exports.TIMEOUT_NOOP = TIMEOUT_NOOP;
const TIMEOUT_IDLE = 60 * 1000; // Milliseconds until IDLE command is cancelled

exports.TIMEOUT_IDLE = TIMEOUT_IDLE;
const STATE_CONNECTING = 1;
exports.STATE_CONNECTING = STATE_CONNECTING;
const STATE_NOT_AUTHENTICATED = 2;
exports.STATE_NOT_AUTHENTICATED = STATE_NOT_AUTHENTICATED;
const STATE_AUTHENTICATED = 3;
exports.STATE_AUTHENTICATED = STATE_AUTHENTICATED;
const STATE_SELECTED = 4;
exports.STATE_SELECTED = STATE_SELECTED;
const STATE_LOGOUT = 5;
exports.STATE_LOGOUT = STATE_LOGOUT;
const DEFAULT_CLIENT_ID = {
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

exports.DEFAULT_CLIENT_ID = DEFAULT_CLIENT_ID;

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
    clearTimeout(this._idleTimeout); // propagate the error upwards

    this.onerror && this.onerror(err);
  } //
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
      } // If possible, use MOVE


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
      } // skip if STARTTLS not available or starttls support disabled


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
      } // If STARTTLS is required then skip capability listing as we are going to try
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
  } // Default handlers for untagged responses

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
  } // Private helpers

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

    this.logger.debug('Entering state: ' + newState); // if a mailbox was opened, emit onclosemailbox and clear selectedMailbox value

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUSU1FT1VUX0NPTk5FQ1RJT04iLCJUSU1FT1VUX05PT1AiLCJUSU1FT1VUX0lETEUiLCJTVEFURV9DT05ORUNUSU5HIiwiU1RBVEVfTk9UX0FVVEhFTlRJQ0FURUQiLCJTVEFURV9BVVRIRU5USUNBVEVEIiwiU1RBVEVfU0VMRUNURUQiLCJTVEFURV9MT0dPVVQiLCJERUZBVUxUX0NMSUVOVF9JRCIsIm5hbWUiLCJDbGllbnQiLCJjb25zdHJ1Y3RvciIsImhvc3QiLCJwb3J0Iiwib3B0aW9ucyIsInRpbWVvdXRDb25uZWN0aW9uIiwidGltZW91dE5vb3AiLCJ0aW1lb3V0SWRsZSIsInNlcnZlcklkIiwib25jZXJ0Iiwib251cGRhdGUiLCJvbnNlbGVjdG1haWxib3giLCJvbmNsb3NlbWFpbGJveCIsIl9ob3N0IiwiX2NsaWVudElkIiwicHJvcE9yIiwiX3N0YXRlIiwiX2F1dGhlbnRpY2F0ZWQiLCJfY2FwYWJpbGl0eSIsIl9zZWxlY3RlZE1haWxib3giLCJfZW50ZXJlZElkbGUiLCJfaWRsZVRpbWVvdXQiLCJfZW5hYmxlQ29tcHJlc3Npb24iLCJlbmFibGVDb21wcmVzc2lvbiIsIl9hdXRoIiwiYXV0aCIsIl9yZXF1aXJlVExTIiwicmVxdWlyZVRMUyIsIl9pZ25vcmVUTFMiLCJpZ25vcmVUTFMiLCJjbGllbnQiLCJJbWFwQ2xpZW50Iiwib25lcnJvciIsIl9vbkVycm9yIiwiYmluZCIsImNlcnQiLCJvbmlkbGUiLCJfb25JZGxlIiwic2V0SGFuZGxlciIsInJlc3BvbnNlIiwiX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIiLCJfdW50YWdnZWRPa0hhbmRsZXIiLCJfdW50YWdnZWRFeGlzdHNIYW5kbGVyIiwiX3VudGFnZ2VkRXhwdW5nZUhhbmRsZXIiLCJfdW50YWdnZWRGZXRjaEhhbmRsZXIiLCJjcmVhdGVMb2dnZXIiLCJsb2dMZXZlbCIsIkxPR19MRVZFTF9BTEwiLCJlcnIiLCJjbGVhclRpbWVvdXQiLCJjb25uZWN0Iiwib3BlbkNvbm5lY3Rpb24iLCJ1cGdyYWRlQ29ubmVjdGlvbiIsInVwZGF0ZUlkIiwibG9nZ2VyIiwid2FybiIsIm1lc3NhZ2UiLCJsb2dpbiIsImNvbXByZXNzQ29ubmVjdGlvbiIsImRlYnVnIiwiZXJyb3IiLCJjbG9zZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY29ubmVjdGlvblRpbWVvdXQiLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJfY2hhbmdlU3RhdGUiLCJ0aGVuIiwib25yZWFkeSIsInVwZGF0ZUNhcGFiaWxpdHkiLCJjYXRjaCIsImxvZ291dCIsImlkIiwiaW5kZXhPZiIsImNvbW1hbmQiLCJhdHRyaWJ1dGVzIiwiZmxhdHRlbiIsIk9iamVjdCIsImVudHJpZXMiLCJleGVjIiwibGlzdCIsInBhdGhPciIsIm1hcCIsInZhbHVlcyIsImtleXMiLCJmaWx0ZXIiLCJfIiwiaSIsImZyb21QYWlycyIsInppcCIsIl9zaG91bGRTZWxlY3RNYWlsYm94IiwicGF0aCIsImN0eCIsInByZXZpb3VzU2VsZWN0IiwiZ2V0UHJldmlvdXNseVF1ZXVlZCIsInJlcXVlc3QiLCJwYXRoQXR0cmlidXRlIiwiZmluZCIsImF0dHJpYnV0ZSIsInR5cGUiLCJ2YWx1ZSIsInNlbGVjdE1haWxib3giLCJxdWVyeSIsInJlYWRPbmx5IiwiY29uZHN0b3JlIiwicHVzaCIsIm1haWxib3hJbmZvIiwicGFyc2VTRUxFQ1QiLCJsaXN0TmFtZXNwYWNlcyIsInBhcnNlTkFNRVNQQUNFIiwibGlzdE1haWxib3hlcyIsInRyZWUiLCJyb290IiwiY2hpbGRyZW4iLCJsaXN0UmVzcG9uc2UiLCJmb3JFYWNoIiwiaXRlbSIsImF0dHIiLCJsZW5ndGgiLCJkZWxpbSIsImJyYW5jaCIsIl9lbnN1cmVQYXRoIiwiZmxhZ3MiLCJsaXN0ZWQiLCJjaGVja1NwZWNpYWxVc2UiLCJsc3ViUmVzcG9uc2UiLCJsc3ViIiwiZmxhZyIsInVuaW9uIiwic3Vic2NyaWJlZCIsIm1haWxib3hTdGF0dXMiLCJzdGF0dXNEYXRhSXRlbXMiLCJzdGF0dXNBdHRyaWJ1dGVzIiwic3RhdHVzRGF0YUl0ZW0iLCJwYXJzZVNUQVRVUyIsImNyZWF0ZU1haWxib3giLCJpbWFwRW5jb2RlIiwiY29kZSIsImRlbGV0ZU1haWxib3giLCJsaXN0TWVzc2FnZXMiLCJzZXF1ZW5jZSIsIml0ZW1zIiwiZmFzdCIsImJ1aWxkRkVUQ0hDb21tYW5kIiwicHJlY2hlY2siLCJwYXJzZUZFVENIIiwic2VhcmNoIiwiYnVpbGRTRUFSQ0hDb21tYW5kIiwicGFyc2VTRUFSQ0giLCJzZXRGbGFncyIsImtleSIsIkFycmF5IiwiaXNBcnJheSIsImNvbmNhdCIsImFkZCIsInNldCIsInJlbW92ZSIsInN0b3JlIiwiYWN0aW9uIiwiYnVpbGRTVE9SRUNvbW1hbmQiLCJ1cGxvYWQiLCJkZXN0aW5hdGlvbiIsInBhcnNlQVBQRU5EIiwiZGVsZXRlTWVzc2FnZXMiLCJ1c2VVaWRQbHVzIiwiYnlVaWQiLCJ1aWRFeHB1bmdlQ29tbWFuZCIsImNtZCIsImNvcHlNZXNzYWdlcyIsInBhcnNlQ09QWSIsIm1vdmVNZXNzYWdlcyIsImNvbXByZXNzZWQiLCJ4b2F1dGgyIiwiYnVpbGRYT0F1dGgyVG9rZW4iLCJ1c2VyIiwic2Vuc2l0aXZlIiwiZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUiLCJwYXNzIiwiY2FwYWJpbGl0eSIsInBheWxvYWQiLCJDQVBBQklMSVRZIiwicG9wIiwiY2FwYSIsInRvVXBwZXJDYXNlIiwidHJpbSIsImFjY2VwdFVudGFnZ2VkIiwiYnJlYWtJZGxlIiwiZW5xdWV1ZUNvbW1hbmQiLCJlbnRlcklkbGUiLCJzdXBwb3J0c0lkbGUiLCJzZW5kIiwic2VjdXJlTW9kZSIsInVwZ3JhZGUiLCJmb3JjZWQiLCJoYXNDYXBhYmlsaXR5IiwicGlwZSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsIm5yIiwiRkVUQ0giLCJzaGlmdCIsIm5ld1N0YXRlIiwiZGVsaW1pdGVyIiwibmFtZXMiLCJzcGxpdCIsImZvdW5kIiwiaiIsIl9jb21wYXJlTWFpbGJveE5hbWVzIiwiaW1hcERlY29kZSIsInNsaWNlIiwiam9pbiIsImEiLCJiIiwiY3JlYXRvciIsImNyZWF0ZURlZmF1bHRMb2dnZXIiLCJtc2dzIiwiTE9HX0xFVkVMX0RFQlVHIiwiaW5mbyIsIkxPR19MRVZFTF9JTkZPIiwiTE9HX0xFVkVMX1dBUk4iLCJMT0dfTEVWRUxfRVJST1IiXSwic291cmNlcyI6WyIuLi9zcmMvY2xpZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1hcCwgcGlwZSwgdW5pb24sIHppcCwgZnJvbVBhaXJzLCBwcm9wT3IsIHBhdGhPciwgZmxhdHRlbiB9IGZyb20gJ3JhbWRhJ1xuaW1wb3J0IHsgaW1hcEVuY29kZSwgaW1hcERlY29kZSB9IGZyb20gJ2VtYWlsanMtdXRmNydcbmltcG9ydCB7XG4gIHBhcnNlQVBQRU5ELFxuICBwYXJzZUNPUFksXG4gIHBhcnNlTkFNRVNQQUNFLFxuICBwYXJzZVNFTEVDVCxcbiAgcGFyc2VGRVRDSCxcbiAgcGFyc2VTRUFSQ0gsXG4gIHBhcnNlU1RBVFVTXG59IGZyb20gJy4vY29tbWFuZC1wYXJzZXInXG5pbXBvcnQge1xuICBidWlsZEZFVENIQ29tbWFuZCxcbiAgYnVpbGRYT0F1dGgyVG9rZW4sXG4gIGJ1aWxkU0VBUkNIQ29tbWFuZCxcbiAgYnVpbGRTVE9SRUNvbW1hbmRcbn0gZnJvbSAnLi9jb21tYW5kLWJ1aWxkZXInXG5cbmltcG9ydCBjcmVhdGVEZWZhdWx0TG9nZ2VyIGZyb20gJy4vbG9nZ2VyJ1xuaW1wb3J0IEltYXBDbGllbnQgZnJvbSAnLi9pbWFwJ1xuaW1wb3J0IHtcbiAgTE9HX0xFVkVMX0VSUk9SLFxuICBMT0dfTEVWRUxfV0FSTixcbiAgTE9HX0xFVkVMX0lORk8sXG4gIExPR19MRVZFTF9ERUJVRyxcbiAgTE9HX0xFVkVMX0FMTFxufSBmcm9tICcuL2NvbW1vbidcblxuaW1wb3J0IHtcbiAgY2hlY2tTcGVjaWFsVXNlXG59IGZyb20gJy4vc3BlY2lhbC11c2UnXG5cbmV4cG9ydCBjb25zdCBUSU1FT1VUX0NPTk5FQ1RJT04gPSA5MCAqIDEwMDAgLy8gTWlsbGlzZWNvbmRzIHRvIHdhaXQgZm9yIHRoZSBJTUFQIGdyZWV0aW5nIGZyb20gdGhlIHNlcnZlclxuZXhwb3J0IGNvbnN0IFRJTUVPVVRfTk9PUCA9IDYwICogMTAwMCAvLyBNaWxsaXNlY29uZHMgYmV0d2VlbiBOT09QIGNvbW1hbmRzIHdoaWxlIGlkbGluZ1xuZXhwb3J0IGNvbnN0IFRJTUVPVVRfSURMRSA9IDYwICogMTAwMCAvLyBNaWxsaXNlY29uZHMgdW50aWwgSURMRSBjb21tYW5kIGlzIGNhbmNlbGxlZFxuXG5leHBvcnQgY29uc3QgU1RBVEVfQ09OTkVDVElORyA9IDFcbmV4cG9ydCBjb25zdCBTVEFURV9OT1RfQVVUSEVOVElDQVRFRCA9IDJcbmV4cG9ydCBjb25zdCBTVEFURV9BVVRIRU5USUNBVEVEID0gM1xuZXhwb3J0IGNvbnN0IFNUQVRFX1NFTEVDVEVEID0gNFxuZXhwb3J0IGNvbnN0IFNUQVRFX0xPR09VVCA9IDVcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ0xJRU5UX0lEID0ge1xuICBuYW1lOiAnZW1haWxqcy1pbWFwLWNsaWVudCdcbn1cblxuLyoqXG4gKiBlbWFpbGpzIElNQVAgY2xpZW50XG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtob3N0PSdsb2NhbGhvc3QnXSBIb3N0bmFtZSB0byBjb25lbmN0IHRvXG4gKiBAcGFyYW0ge051bWJlcn0gW3BvcnQ9MTQzXSBQb3J0IG51bWJlciB0byBjb25uZWN0IHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCB7XG4gIGNvbnN0cnVjdG9yIChob3N0LCBwb3J0LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLnRpbWVvdXRDb25uZWN0aW9uID0gVElNRU9VVF9DT05ORUNUSU9OXG4gICAgdGhpcy50aW1lb3V0Tm9vcCA9IFRJTUVPVVRfTk9PUFxuICAgIHRoaXMudGltZW91dElkbGUgPSBUSU1FT1VUX0lETEVcblxuICAgIHRoaXMuc2VydmVySWQgPSBmYWxzZSAvLyBSRkMgMjk3MSBTZXJ2ZXIgSUQgYXMga2V5IHZhbHVlIHBhaXJzXG5cbiAgICAvLyBFdmVudCBwbGFjZWhvbGRlcnNcbiAgICB0aGlzLm9uY2VydCA9IG51bGxcbiAgICB0aGlzLm9udXBkYXRlID0gbnVsbFxuICAgIHRoaXMub25zZWxlY3RtYWlsYm94ID0gbnVsbFxuICAgIHRoaXMub25jbG9zZW1haWxib3ggPSBudWxsXG5cbiAgICB0aGlzLl9ob3N0ID0gaG9zdFxuICAgIHRoaXMuX2NsaWVudElkID0gcHJvcE9yKERFRkFVTFRfQ0xJRU5UX0lELCAnaWQnLCBvcHRpb25zKVxuICAgIHRoaXMuX3N0YXRlID0gZmFsc2UgLy8gQ3VycmVudCBzdGF0ZVxuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZSAvLyBJcyB0aGUgY29ubmVjdGlvbiBhdXRoZW50aWNhdGVkXG4gICAgdGhpcy5fY2FwYWJpbGl0eSA9IFtdIC8vIExpc3Qgb2YgZXh0ZW5zaW9ucyB0aGUgc2VydmVyIHN1cHBvcnRzXG4gICAgdGhpcy5fc2VsZWN0ZWRNYWlsYm94ID0gZmFsc2UgLy8gU2VsZWN0ZWQgbWFpbGJveFxuICAgIHRoaXMuX2VudGVyZWRJZGxlID0gZmFsc2VcbiAgICB0aGlzLl9pZGxlVGltZW91dCA9IGZhbHNlXG4gICAgdGhpcy5fZW5hYmxlQ29tcHJlc3Npb24gPSAhIW9wdGlvbnMuZW5hYmxlQ29tcHJlc3Npb25cbiAgICB0aGlzLl9hdXRoID0gb3B0aW9ucy5hdXRoXG4gICAgdGhpcy5fcmVxdWlyZVRMUyA9ICEhb3B0aW9ucy5yZXF1aXJlVExTXG4gICAgdGhpcy5faWdub3JlVExTID0gISFvcHRpb25zLmlnbm9yZVRMU1xuXG4gICAgdGhpcy5jbGllbnQgPSBuZXcgSW1hcENsaWVudChob3N0LCBwb3J0LCBvcHRpb25zKSAvLyBJTUFQIGNsaWVudCBvYmplY3RcblxuICAgIC8vIEV2ZW50IEhhbmRsZXJzXG4gICAgdGhpcy5jbGllbnQub25lcnJvciA9IHRoaXMuX29uRXJyb3IuYmluZCh0aGlzKVxuICAgIHRoaXMuY2xpZW50Lm9uY2VydCA9IChjZXJ0KSA9PiAodGhpcy5vbmNlcnQgJiYgdGhpcy5vbmNlcnQoY2VydCkpIC8vIGFsbG93cyBjZXJ0aWZpY2F0ZSBoYW5kbGluZyBmb3IgcGxhdGZvcm1zIHcvbyBuYXRpdmUgdGxzIHN1cHBvcnRcbiAgICB0aGlzLmNsaWVudC5vbmlkbGUgPSAoKSA9PiB0aGlzLl9vbklkbGUoKSAvLyBzdGFydCBpZGxpbmdcblxuICAgIC8vIERlZmF1bHQgaGFuZGxlcnMgZm9yIHVudGFnZ2VkIHJlc3BvbnNlc1xuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ2NhcGFiaWxpdHknLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIocmVzcG9uc2UpKSAvLyBjYXBhYmlsaXR5IHVwZGF0ZXNcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdvaycsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRPa0hhbmRsZXIocmVzcG9uc2UpKSAvLyBub3RpZmljYXRpb25zXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignZXhpc3RzJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZEV4aXN0c0hhbmRsZXIocmVzcG9uc2UpKSAvLyBtZXNzYWdlIGNvdW50IGhhcyBjaGFuZ2VkXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignZXhwdW5nZScsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRFeHB1bmdlSGFuZGxlcihyZXNwb25zZSkpIC8vIG1lc3NhZ2UgaGFzIGJlZW4gZGVsZXRlZFxuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ2ZldGNoJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZEZldGNoSGFuZGxlcihyZXNwb25zZSkpIC8vIG1lc3NhZ2UgaGFzIGJlZW4gdXBkYXRlZCAoZWcuIGZsYWcgY2hhbmdlKVxuXG4gICAgLy8gQWN0aXZhdGUgbG9nZ2luZ1xuICAgIHRoaXMuY3JlYXRlTG9nZ2VyKClcbiAgICB0aGlzLmxvZ0xldmVsID0gcHJvcE9yKExPR19MRVZFTF9BTEwsICdsb2dMZXZlbCcsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGlmIHRoZSBsb3dlci1sZXZlbCBJbWFwQ2xpZW50IGhhcyBlbmNvdW50ZXJlZCBhbiB1bnJlY292ZXJhYmxlXG4gICAqIGVycm9yIGR1cmluZyBvcGVyYXRpb24uIENsZWFucyB1cCBhbmQgcHJvcGFnYXRlcyB0aGUgZXJyb3IgdXB3YXJkcy5cbiAgICovXG4gIF9vbkVycm9yIChlcnIpIHtcbiAgICAvLyBtYWtlIHN1cmUgbm8gaWRsZSB0aW1lb3V0IGlzIHBlbmRpbmcgYW55bW9yZVxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcblxuICAgIC8vIHByb3BhZ2F0ZSB0aGUgZXJyb3IgdXB3YXJkc1xuICAgIHRoaXMub25lcnJvciAmJiB0aGlzLm9uZXJyb3IoZXJyKVxuICB9XG5cbiAgLy9cbiAgLy9cbiAgLy8gUFVCTElDIEFQSVxuICAvL1xuICAvL1xuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBjb25uZWN0aW9uIGFuZCBsb2dpbiB0byB0aGUgSU1BUCBzZXJ2ZXJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hlbiBsb2dpbiBwcm9jZWR1cmUgaXMgY29tcGxldGVcbiAgICovXG4gIGFzeW5jIGNvbm5lY3QgKCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLm9wZW5Db25uZWN0aW9uKClcbiAgICAgIGF3YWl0IHRoaXMudXBncmFkZUNvbm5lY3Rpb24oKVxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJZCh0aGlzLl9jbGllbnRJZClcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdGYWlsZWQgdG8gdXBkYXRlIHNlcnZlciBpZCEnLCBlcnIubWVzc2FnZSlcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5sb2dpbih0aGlzLl9hdXRoKVxuICAgICAgYXdhaXQgdGhpcy5jb21wcmVzc0Nvbm5lY3Rpb24oKVxuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0Nvbm5lY3Rpb24gZXN0YWJsaXNoZWQsIHJlYWR5IHRvIHJvbGwhJylcbiAgICAgIHRoaXMuY2xpZW50Lm9uZXJyb3IgPSB0aGlzLl9vbkVycm9yLmJpbmQodGhpcylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgY29ubmVjdCB0byBzZXJ2ZXInLCBlcnIpXG4gICAgICB0aGlzLmNsb3NlKGVycikgLy8gd2UgZG9uJ3QgcmVhbGx5IGNhcmUgd2hldGhlciB0aGlzIHdvcmtzIG9yIG5vdFxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGNvbm5lY3Rpb24gdG8gdGhlIElNQVAgc2VydmVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBjYXBhYmlsaXR5IG9mIHNlcnZlciB3aXRob3V0IGxvZ2luXG4gICAqL1xuICBvcGVuQ29ubmVjdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKCdUaW1lb3V0IGNvbm5lY3RpbmcgdG8gc2VydmVyJykpLCB0aGlzLnRpbWVvdXRDb25uZWN0aW9uKVxuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0Nvbm5lY3RpbmcgdG8nLCB0aGlzLmNsaWVudC5ob3N0LCAnOicsIHRoaXMuY2xpZW50LnBvcnQpXG4gICAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9DT05ORUNUSU5HKVxuICAgICAgdGhpcy5jbGllbnQuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU29ja2V0IG9wZW5lZCwgd2FpdGluZyBmb3IgZ3JlZXRpbmcgZnJvbSB0aGUgc2VydmVyLi4uJylcblxuICAgICAgICB0aGlzLmNsaWVudC5vbnJlYWR5ID0gKCkgPT4ge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjb25uZWN0aW9uVGltZW91dClcbiAgICAgICAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9OT1RfQVVUSEVOVElDQVRFRClcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNhcGFiaWxpdHkoKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzb2x2ZSh0aGlzLl9jYXBhYmlsaXR5KSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xpZW50Lm9uZXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0KVxuICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKHJlamVjdClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIExvZ291dFxuICAgKlxuICAgKiBTZW5kIExPR09VVCwgdG8gd2hpY2ggdGhlIHNlcnZlciByZXNwb25kcyBieSBjbG9zaW5nIHRoZSBjb25uZWN0aW9uLlxuICAgKiBVc2UgaXMgZGlzY291cmFnZWQgaWYgbmV0d29yayBzdGF0dXMgaXMgdW5jbGVhciEgSWYgbmV0d29ya3Mgc3RhdHVzIGlzXG4gICAqIHVuY2xlYXIsIHBsZWFzZSB1c2UgI2Nsb3NlIGluc3RlYWQhXG4gICAqXG4gICAqIExPR09VVCBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4xLjNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gc2VydmVyIGhhcyBjbG9zZWQgdGhlIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGxvZ291dCAoKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfTE9HT1VUKVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMb2dnaW5nIG91dC4uLicpXG4gICAgYXdhaXQgdGhpcy5jbGllbnQubG9nb3V0KClcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG4gIH1cblxuICAvKipcbiAgICogRm9yY2UtY2xvc2VzIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24gYnkgY2xvc2luZyB0aGUgVENQIHNvY2tldC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gc29ja2V0IGlzIGNsb3NlZFxuICAgKi9cbiAgYXN5bmMgY2xvc2UgKGVycikge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0xPR09VVClcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0Nsb3NpbmcgY29ubmVjdGlvbi4uLicpXG4gICAgYXdhaXQgdGhpcy5jbGllbnQuY2xvc2UoZXJyKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIElEIGNvbW1hbmQsIHBhcnNlcyBJRCByZXNwb25zZSwgc2V0cyB0aGlzLnNlcnZlcklkXG4gICAqXG4gICAqIElEIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjk3MVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gaWQgSUQgYXMgSlNPTiBvYmplY3QuIFNlZSBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyOTcxI3NlY3Rpb24tMy4zIGZvciBwb3NzaWJsZSB2YWx1ZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gcmVzcG9uc2UgaGFzIGJlZW4gcGFyc2VkXG4gICAqL1xuICBhc3luYyB1cGRhdGVJZCAoaWQpIHtcbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdJRCcpIDwgMCkgcmV0dXJuXG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnVXBkYXRpbmcgaWQuLi4nKVxuXG4gICAgY29uc3QgY29tbWFuZCA9ICdJRCdcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gaWQgPyBbZmxhdHRlbihPYmplY3QuZW50cmllcyhpZCkpXSA6IFtudWxsXVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHsgY29tbWFuZCwgYXR0cmlidXRlcyB9LCAnSUQnKVxuICAgIGNvbnN0IGxpc3QgPSBmbGF0dGVuKHBhdGhPcihbXSwgWydwYXlsb2FkJywgJ0lEJywgJzAnLCAnYXR0cmlidXRlcycsICcwJ10sIHJlc3BvbnNlKS5tYXAoT2JqZWN0LnZhbHVlcykpXG4gICAgY29uc3Qga2V5cyA9IGxpc3QuZmlsdGVyKChfLCBpKSA9PiBpICUgMiA9PT0gMClcbiAgICBjb25zdCB2YWx1ZXMgPSBsaXN0LmZpbHRlcigoXywgaSkgPT4gaSAlIDIgPT09IDEpXG4gICAgdGhpcy5zZXJ2ZXJJZCA9IGZyb21QYWlycyh6aXAoa2V5cywgdmFsdWVzKSlcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2VydmVyIGlkIHVwZGF0ZWQhJywgdGhpcy5zZXJ2ZXJJZClcbiAgfVxuXG4gIF9zaG91bGRTZWxlY3RNYWlsYm94IChwYXRoLCBjdHgpIHtcbiAgICBpZiAoIWN0eCkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aW91c1NlbGVjdCA9IHRoaXMuY2xpZW50LmdldFByZXZpb3VzbHlRdWV1ZWQoWydTRUxFQ1QnLCAnRVhBTUlORSddLCBjdHgpXG4gICAgaWYgKHByZXZpb3VzU2VsZWN0ICYmIHByZXZpb3VzU2VsZWN0LnJlcXVlc3QuYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgcGF0aEF0dHJpYnV0ZSA9IHByZXZpb3VzU2VsZWN0LnJlcXVlc3QuYXR0cmlidXRlcy5maW5kKChhdHRyaWJ1dGUpID0+IGF0dHJpYnV0ZS50eXBlID09PSAnU1RSSU5HJylcbiAgICAgIGlmIChwYXRoQXR0cmlidXRlKSB7XG4gICAgICAgIHJldHVybiBwYXRoQXR0cmlidXRlLnZhbHVlICE9PSBwYXRoXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkTWFpbGJveCAhPT0gcGF0aFxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU0VMRUNUIG9yIEVYQU1JTkUgdG8gb3BlbiBhIG1haWxib3hcbiAgICpcbiAgICogU0VMRUNUIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4xXG4gICAqIEVYQU1JTkUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjJcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggRnVsbCBwYXRoIHRvIG1haWxib3hcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIG9iamVjdFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzZWxlY3RlZCBtYWlsYm94XG4gICAqL1xuICBhc3luYyBzZWxlY3RNYWlsYm94IChwYXRoLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBxdWVyeSA9IHtcbiAgICAgIGNvbW1hbmQ6IG9wdGlvbnMucmVhZE9ubHkgPyAnRVhBTUlORScgOiAnU0VMRUNUJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFt7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogcGF0aCB9XVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmNvbmRzdG9yZSAmJiB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0NPTkRTVE9SRScpID49IDApIHtcbiAgICAgIHF1ZXJ5LmF0dHJpYnV0ZXMucHVzaChbeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnQ09ORFNUT1JFJyB9XSlcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnT3BlbmluZycsIHBhdGgsICcuLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHF1ZXJ5LCBbJ0VYSVNUUycsICdGTEFHUycsICdPSyddLCB7IGN0eDogb3B0aW9ucy5jdHggfSlcbiAgICBjb25zdCBtYWlsYm94SW5mbyA9IHBhcnNlU0VMRUNUKHJlc3BvbnNlKVxuXG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfU0VMRUNURUQpXG5cbiAgICBpZiAodGhpcy5fc2VsZWN0ZWRNYWlsYm94ICE9PSBwYXRoICYmIHRoaXMub25jbG9zZW1haWxib3gpIHtcbiAgICAgIGF3YWl0IHRoaXMub25jbG9zZW1haWxib3godGhpcy5fc2VsZWN0ZWRNYWlsYm94KVxuICAgIH1cbiAgICB0aGlzLl9zZWxlY3RlZE1haWxib3ggPSBwYXRoXG4gICAgaWYgKHRoaXMub25zZWxlY3RtYWlsYm94KSB7XG4gICAgICBhd2FpdCB0aGlzLm9uc2VsZWN0bWFpbGJveChwYXRoLCBtYWlsYm94SW5mbylcbiAgICB9XG5cbiAgICByZXR1cm4gbWFpbGJveEluZm9cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIE5BTUVTUEFDRSBjb21tYW5kXG4gICAqXG4gICAqIE5BTUVTUEFDRSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyMzQyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggbmFtZXNwYWNlIG9iamVjdFxuICAgKi9cbiAgYXN5bmMgbGlzdE5hbWVzcGFjZXMgKCkge1xuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ05BTUVTUEFDRScpIDwgMCkgcmV0dXJuIGZhbHNlXG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTGlzdGluZyBuYW1lc3BhY2VzLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYygnTkFNRVNQQUNFJywgJ05BTUVTUEFDRScpXG4gICAgcmV0dXJuIHBhcnNlTkFNRVNQQUNFKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgTElTVCBhbmQgTFNVQiBjb21tYW5kcy4gUmV0cmlldmVzIGEgdHJlZSBvZiBhdmFpbGFibGUgbWFpbGJveGVzXG4gICAqXG4gICAqIExJU1QgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjhcbiAgICogTFNVQiBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuOVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIGxpc3Qgb2YgbWFpbGJveGVzXG4gICAqL1xuICBhc3luYyBsaXN0TWFpbGJveGVzICgpIHtcbiAgICBjb25zdCB0cmVlID0geyByb290OiB0cnVlLCBjaGlsZHJlbjogW10gfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xpc3RpbmcgbWFpbGJveGVzLi4uJylcbiAgICBjb25zdCBsaXN0UmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnTElTVCcsIGF0dHJpYnV0ZXM6IFsnJywgJyonXSB9LCAnTElTVCcpXG4gICAgY29uc3QgbGlzdCA9IHBhdGhPcihbXSwgWydwYXlsb2FkJywgJ0xJU1QnXSwgbGlzdFJlc3BvbnNlKVxuICAgIGxpc3QuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGNvbnN0IGF0dHIgPSBwcm9wT3IoW10sICdhdHRyaWJ1dGVzJywgaXRlbSlcbiAgICAgIGlmIChhdHRyLmxlbmd0aCA8IDMpIHJldHVyblxuXG4gICAgICBjb25zdCBwYXRoID0gcGF0aE9yKCcnLCBbJzInLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGRlbGltID0gcGF0aE9yKCcvJywgWycxJywgJ3ZhbHVlJ10sIGF0dHIpXG4gICAgICBjb25zdCBicmFuY2ggPSB0aGlzLl9lbnN1cmVQYXRoKHRyZWUsIHBhdGgsIGRlbGltKVxuICAgICAgYnJhbmNoLmZsYWdzID0gcHJvcE9yKFtdLCAnMCcsIGF0dHIpLm1hcCgoeyB2YWx1ZSB9KSA9PiB2YWx1ZSB8fCAnJylcbiAgICAgIGJyYW5jaC5saXN0ZWQgPSB0cnVlXG4gICAgICBjaGVja1NwZWNpYWxVc2UoYnJhbmNoKVxuICAgIH0pXG5cbiAgICBjb25zdCBsc3ViUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnTFNVQicsIGF0dHJpYnV0ZXM6IFsnJywgJyonXSB9LCAnTFNVQicpXG4gICAgY29uc3QgbHN1YiA9IHBhdGhPcihbXSwgWydwYXlsb2FkJywgJ0xTVUInXSwgbHN1YlJlc3BvbnNlKVxuICAgIGxzdWIuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgY29uc3QgYXR0ciA9IHByb3BPcihbXSwgJ2F0dHJpYnV0ZXMnLCBpdGVtKVxuICAgICAgaWYgKGF0dHIubGVuZ3RoIDwgMykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IHBhdGggPSBwYXRoT3IoJycsIFsnMicsICd2YWx1ZSddLCBhdHRyKVxuICAgICAgY29uc3QgZGVsaW0gPSBwYXRoT3IoJy8nLCBbJzEnLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGJyYW5jaCA9IHRoaXMuX2Vuc3VyZVBhdGgodHJlZSwgcGF0aCwgZGVsaW0pXG4gICAgICBwcm9wT3IoW10sICcwJywgYXR0cikubWFwKChmbGFnID0gJycpID0+IHsgYnJhbmNoLmZsYWdzID0gdW5pb24oYnJhbmNoLmZsYWdzLCBbZmxhZ10pIH0pXG4gICAgICBicmFuY2guc3Vic2NyaWJlZCA9IHRydWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRyZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIG1haWxib3ggU1RBVFVTXG4gICAqXG4gICAqIFNUQVRVUyBkZXRhaWxzOlxuICAgKiAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuMTBcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggRnVsbCBwYXRoIHRvIG1haWxib3hcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIG9iamVjdFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzZWxlY3RlZCBtYWlsYm94XG4gICAqL1xuICBhc3luYyBtYWlsYm94U3RhdHVzIChwYXRoLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBzdGF0dXNEYXRhSXRlbXMgPSBbJ1VJRE5FWFQnLCAnTUVTU0FHRVMnXVxuXG4gICAgaWYgKG9wdGlvbnMuY29uZHN0b3JlICYmIHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignQ09ORFNUT1JFJykgPj0gMCkge1xuICAgICAgc3RhdHVzRGF0YUl0ZW1zLnB1c2goJ0hJR0hFU1RNT0RTRVEnKVxuICAgIH1cblxuICAgIGNvbnN0IHN0YXR1c0F0dHJpYnV0ZXMgPSBzdGF0dXNEYXRhSXRlbXMubWFwKChzdGF0dXNEYXRhSXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICB2YWx1ZTogc3RhdHVzRGF0YUl0ZW1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ09wZW5pbmcnLCBwYXRoLCAnLi4uJylcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6ICdTVEFUVVMnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogcGF0aCB9LFxuICAgICAgICBbLi4uc3RhdHVzQXR0cmlidXRlc11cbiAgICAgIF1cbiAgICB9LCBbJ1NUQVRVUyddKVxuXG4gICAgcmV0dXJuIHBhcnNlU1RBVFVTKHJlc3BvbnNlLCBzdGF0dXNEYXRhSXRlbXMpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbWFpbGJveCB3aXRoIHRoZSBnaXZlbiBwYXRoLlxuICAgKlxuICAgKiBDUkVBVEUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjNcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogICAgIFRoZSBwYXRoIG9mIHRoZSBtYWlsYm94IHlvdSB3b3VsZCBsaWtlIHRvIGNyZWF0ZS4gIFRoaXMgbWV0aG9kIHdpbGxcbiAgICogICAgIGhhbmRsZSB1dGY3IGVuY29kaW5nIGZvciB5b3UuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiAgICAgUHJvbWlzZSByZXNvbHZlcyBpZiBtYWlsYm94IHdhcyBjcmVhdGVkLlxuICAgKiAgICAgSW4gdGhlIGV2ZW50IHRoZSBzZXJ2ZXIgc2F5cyBOTyBbQUxSRUFEWUVYSVNUU10sIHdlIHRyZWF0IHRoYXQgYXMgc3VjY2Vzcy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU1haWxib3ggKHBhdGgpIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ3JlYXRpbmcgbWFpbGJveCcsIHBhdGgsICcuLi4nKVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnQ1JFQVRFJywgYXR0cmlidXRlczogW2ltYXBFbmNvZGUocGF0aCldIH0pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyICYmIGVyci5jb2RlID09PSAnQUxSRUFEWUVYSVNUUycpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgbWFpbGJveCB3aXRoIHRoZSBnaXZlbiBwYXRoLlxuICAgKlxuICAgKiBERUxFVEUgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy40XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqICAgICBUaGUgcGF0aCBvZiB0aGUgbWFpbGJveCB5b3Ugd291bGQgbGlrZSB0byBkZWxldGUuICBUaGlzIG1ldGhvZCB3aWxsXG4gICAqICAgICBoYW5kbGUgdXRmNyBlbmNvZGluZyBmb3IgeW91LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogICAgIFByb21pc2UgcmVzb2x2ZXMgaWYgbWFpbGJveCB3YXMgZGVsZXRlZC5cbiAgICovXG4gIGRlbGV0ZU1haWxib3ggKHBhdGgpIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRGVsZXRpbmcgbWFpbGJveCcsIHBhdGgsICcuLi4nKVxuICAgIHJldHVybiB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnREVMRVRFJywgYXR0cmlidXRlczogW2ltYXBFbmNvZGUocGF0aCldIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVucyBGRVRDSCBjb21tYW5kXG4gICAqXG4gICAqIEZFVENIIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC41XG4gICAqIENIQU5HRURTSU5DRSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0NTUxI3NlY3Rpb24tMy4zXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBTZXF1ZW5jZSBzZXQsIGVnIDE6KiBmb3IgYWxsIG1lc3NhZ2VzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbaXRlbXNdIE1lc3NhZ2UgZGF0YSBpdGVtIG5hbWVzIG9yIG1hY3JvXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGZldGNoZWQgbWVzc2FnZSBpbmZvXG4gICAqL1xuICBhc3luYyBsaXN0TWVzc2FnZXMgKHBhdGgsIHNlcXVlbmNlLCBpdGVtcyA9IFt7IGZhc3Q6IHRydWUgfV0sIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdGZXRjaGluZyBtZXNzYWdlcycsIHNlcXVlbmNlLCAnZnJvbScsIHBhdGgsICcuLi4nKVxuICAgIGNvbnN0IGNvbW1hbmQgPSBidWlsZEZFVENIQ29tbWFuZChzZXF1ZW5jZSwgaXRlbXMsIG9wdGlvbnMpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoY29tbWFuZCwgJ0ZFVENIJywge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgICByZXR1cm4gcGFyc2VGRVRDSChyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNFQVJDSCBjb21tYW5kXG4gICAqXG4gICAqIFNFQVJDSCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuNFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgU2VhcmNoIHRlcm1zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGFycmF5IG9mIG1hdGNoaW5nIHNlcS4gb3IgdWlkIG51bWJlcnNcbiAgICovXG4gIGFzeW5jIHNlYXJjaCAocGF0aCwgcXVlcnksIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTZWFyY2hpbmcgaW4nLCBwYXRoLCAnLi4uJylcbiAgICBjb25zdCBjb21tYW5kID0gYnVpbGRTRUFSQ0hDb21tYW5kKHF1ZXJ5LCBvcHRpb25zKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdTRUFSQ0gnLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICAgIHJldHVybiBwYXJzZVNFQVJDSChyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNUT1JFIGNvbW1hbmRcbiAgICpcbiAgICogU1RPUkUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjZcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2Ugc2VsZWN0b3Igd2hpY2ggdGhlIGZsYWcgY2hhbmdlIGlzIGFwcGxpZWQgdG9cbiAgICogQHBhcmFtIHtBcnJheX0gZmxhZ3NcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgc2V0RmxhZ3MgKHBhdGgsIHNlcXVlbmNlLCBmbGFncywgb3B0aW9ucykge1xuICAgIGxldCBrZXkgPSAnJ1xuICAgIGxldCBsaXN0ID0gW11cblxuICAgIGlmIChBcnJheS5pc0FycmF5KGZsYWdzKSB8fCB0eXBlb2YgZmxhZ3MgIT09ICdvYmplY3QnKSB7XG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzIHx8IFtdKVxuICAgICAga2V5ID0gJydcbiAgICB9IGVsc2UgaWYgKGZsYWdzLmFkZCkge1xuICAgICAgbGlzdCA9IFtdLmNvbmNhdChmbGFncy5hZGQgfHwgW10pXG4gICAgICBrZXkgPSAnKydcbiAgICB9IGVsc2UgaWYgKGZsYWdzLnNldCkge1xuICAgICAga2V5ID0gJydcbiAgICAgIGxpc3QgPSBbXS5jb25jYXQoZmxhZ3Muc2V0IHx8IFtdKVxuICAgIH0gZWxzZSBpZiAoZmxhZ3MucmVtb3ZlKSB7XG4gICAgICBrZXkgPSAnLSdcbiAgICAgIGxpc3QgPSBbXS5jb25jYXQoZmxhZ3MucmVtb3ZlIHx8IFtdKVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTZXR0aW5nIGZsYWdzIG9uJywgc2VxdWVuY2UsICdpbicsIHBhdGgsICcuLi4nKVxuICAgIHJldHVybiB0aGlzLnN0b3JlKHBhdGgsIHNlcXVlbmNlLCBrZXkgKyAnRkxBR1MnLCBsaXN0LCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU1RPUkUgY29tbWFuZFxuICAgKlxuICAgKiBTVE9SRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuNlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSBzZWxlY3RvciB3aGljaCB0aGUgZmxhZyBjaGFuZ2UgaXMgYXBwbGllZCB0b1xuICAgKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uIFNUT1JFIG1ldGhvZCB0byBjYWxsLCBlZyBcIitGTEFHU1wiXG4gICAqIEBwYXJhbSB7QXJyYXl9IGZsYWdzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGFycmF5IG9mIG1hdGNoaW5nIHNlcS4gb3IgdWlkIG51bWJlcnNcbiAgICovXG4gIGFzeW5jIHN0b3JlIChwYXRoLCBzZXF1ZW5jZSwgYWN0aW9uLCBmbGFncywgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkU1RPUkVDb21tYW5kKHNlcXVlbmNlLCBhY3Rpb24sIGZsYWdzLCBvcHRpb25zKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdGRVRDSCcsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHBhcnNlRkVUQ0gocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBBUFBFTkQgY29tbWFuZFxuICAgKlxuICAgKiBBUFBFTkQgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjExXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbiBUaGUgbWFpbGJveCB3aGVyZSB0byBhcHBlbmQgdGhlIG1lc3NhZ2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gYXBwZW5kXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMuZmxhZ3MgQW55IGZsYWdzIHlvdSB3YW50IHRvIHNldCBvbiB0aGUgdXBsb2FkZWQgbWVzc2FnZS4gRGVmYXVsdHMgdG8gW1xcU2Vlbl0uIChvcHRpb25hbClcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgYXN5bmMgdXBsb2FkIChkZXN0aW5hdGlvbiwgbWVzc2FnZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcm9wT3IoWydcXFxcU2VlbiddLCAnZmxhZ3MnLCBvcHRpb25zKS5tYXAodmFsdWUgPT4gKHsgdHlwZTogJ2F0b20nLCB2YWx1ZSB9KSlcbiAgICBjb25zdCBjb21tYW5kID0ge1xuICAgICAgY29tbWFuZDogJ0FQUEVORCcsXG4gICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgIHsgdHlwZTogJ2F0b20nLCB2YWx1ZTogZGVzdGluYXRpb24gfSxcbiAgICAgICAgZmxhZ3MsXG4gICAgICAgIHsgdHlwZTogJ2xpdGVyYWwnLCB2YWx1ZTogbWVzc2FnZSB9XG4gICAgICBdXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1VwbG9hZGluZyBtZXNzYWdlIHRvJywgZGVzdGluYXRpb24sICcuLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQpXG4gICAgcmV0dXJuIHBhcnNlQVBQRU5EKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgbWVzc2FnZXMgZnJvbSBhIHNlbGVjdGVkIG1haWxib3hcbiAgICpcbiAgICogRVhQVU5HRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuM1xuICAgKiBVSUQgRVhQVU5HRSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0MzE1I3NlY3Rpb24tMi4xXG4gICAqXG4gICAqIElmIHBvc3NpYmxlIChieVVpZDp0cnVlIGFuZCBVSURQTFVTIGV4dGVuc2lvbiBzdXBwb3J0ZWQpLCB1c2VzIFVJRCBFWFBVTkdFXG4gICAqIGNvbW1hbmQgdG8gZGVsZXRlIGEgcmFuZ2Ugb2YgbWVzc2FnZXMsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIEVYUFVOR0UuXG4gICAqXG4gICAqIE5CISBUaGlzIG1ldGhvZCBtaWdodCBiZSBkZXN0cnVjdGl2ZSAtIGlmIEVYUFVOR0UgaXMgdXNlZCwgdGhlbiBhbnkgbWVzc2FnZXNcbiAgICogd2l0aCBcXERlbGV0ZWQgZmxhZyBzZXQgYXJlIGRlbGV0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2UgdG8gYmUgZGVsZXRlZFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgZGVsZXRlTWVzc2FnZXMgKHBhdGgsIHNlcXVlbmNlLCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBhZGQgXFxEZWxldGVkIGZsYWcgdG8gdGhlIG1lc3NhZ2VzIGFuZCBydW4gRVhQVU5HRSBvciBVSUQgRVhQVU5HRVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdEZWxldGluZyBtZXNzYWdlcycsIHNlcXVlbmNlLCAnaW4nLCBwYXRoLCAnLi4uJylcbiAgICBjb25zdCB1c2VVaWRQbHVzID0gb3B0aW9ucy5ieVVpZCAmJiB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ1VJRFBMVVMnKSA+PSAwXG4gICAgY29uc3QgdWlkRXhwdW5nZUNvbW1hbmQgPSB7IGNvbW1hbmQ6ICdVSUQgRVhQVU5HRScsIGF0dHJpYnV0ZXM6IFt7IHR5cGU6ICdzZXF1ZW5jZScsIHZhbHVlOiBzZXF1ZW5jZSB9XSB9XG4gICAgYXdhaXQgdGhpcy5zZXRGbGFncyhwYXRoLCBzZXF1ZW5jZSwgeyBhZGQ6ICdcXFxcRGVsZXRlZCcgfSwgb3B0aW9ucylcbiAgICBjb25zdCBjbWQgPSB1c2VVaWRQbHVzID8gdWlkRXhwdW5nZUNvbW1hbmQgOiAnRVhQVU5HRSdcbiAgICByZXR1cm4gdGhpcy5leGVjKGNtZCwgbnVsbCwge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgYSByYW5nZSBvZiBtZXNzYWdlcyBmcm9tIHRoZSBhY3RpdmUgbWFpbGJveCB0byB0aGUgZGVzdGluYXRpb24gbWFpbGJveC5cbiAgICogU2lsZW50IG1ldGhvZCAodW5sZXNzIGFuIGVycm9yIG9jY3VycyksIGJ5IGRlZmF1bHQgcmV0dXJucyBubyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQ09QWSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuN1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSByYW5nZSB0byBiZSBjb3BpZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGRlc3RpbmF0aW9uIERlc3RpbmF0aW9uIG1haWxib3ggcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmJ5VWlkXSBJZiB0cnVlLCB1c2VzIFVJRCBDT1BZIGluc3RlYWQgb2YgQ09QWVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgY29weU1lc3NhZ2VzIChwYXRoLCBzZXF1ZW5jZSwgZGVzdGluYXRpb24sIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDb3B5aW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdmcm9tJywgcGF0aCwgJ3RvJywgZGVzdGluYXRpb24sICcuLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIENPUFknIDogJ0NPUFknLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdzZXF1ZW5jZScsIHZhbHVlOiBzZXF1ZW5jZSB9LFxuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH1cbiAgICAgIF1cbiAgICB9LCBudWxsLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICAgIHJldHVybiBwYXJzZUNPUFkocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgYSByYW5nZSBvZiBtZXNzYWdlcyBmcm9tIHRoZSBhY3RpdmUgbWFpbGJveCB0byB0aGUgZGVzdGluYXRpb24gbWFpbGJveC5cbiAgICogUHJlZmVycyB0aGUgTU9WRSBleHRlbnNpb24gYnV0IGlmIG5vdCBhdmFpbGFibGUsIGZhbGxzIGJhY2sgdG9cbiAgICogQ09QWSArIEVYUFVOR0VcbiAgICpcbiAgICogTU9WRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY4NTFcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2UgdG8gYmUgbW92ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGRlc3RpbmF0aW9uIERlc3RpbmF0aW9uIG1haWxib3ggcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgbW92ZU1lc3NhZ2VzIChwYXRoLCBzZXF1ZW5jZSwgZGVzdGluYXRpb24sIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdNb3ZpbmcgbWVzc2FnZXMnLCBzZXF1ZW5jZSwgJ2Zyb20nLCBwYXRoLCAndG8nLCBkZXN0aW5hdGlvbiwgJy4uLicpXG5cbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdNT1ZFJykgPT09IC0xKSB7XG4gICAgICAvLyBGYWxsYmFjayB0byBDT1BZICsgRVhQVU5HRVxuICAgICAgYXdhaXQgdGhpcy5jb3B5TWVzc2FnZXMocGF0aCwgc2VxdWVuY2UsIGRlc3RpbmF0aW9uLCBvcHRpb25zKVxuICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlTWVzc2FnZXMocGF0aCwgc2VxdWVuY2UsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgLy8gSWYgcG9zc2libGUsIHVzZSBNT1ZFXG4gICAgcmV0dXJuIHRoaXMuZXhlYyh7XG4gICAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBNT1ZFJyA6ICdNT1ZFJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgeyB0eXBlOiAnc2VxdWVuY2UnLCB2YWx1ZTogc2VxdWVuY2UgfSxcbiAgICAgICAgeyB0eXBlOiAnYXRvbScsIHZhbHVlOiBkZXN0aW5hdGlvbiB9XG4gICAgICBdXG4gICAgfSwgWydPSyddLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgQ09NUFJFU1MgY29tbWFuZFxuICAgKlxuICAgKiBDT01QUkVTUyBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0OTc4XG4gICAqL1xuICBhc3luYyBjb21wcmVzc0Nvbm5lY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5fZW5hYmxlQ29tcHJlc3Npb24gfHwgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdDT01QUkVTUz1ERUZMQVRFJykgPCAwIHx8IHRoaXMuY2xpZW50LmNvbXByZXNzZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdFbmFibGluZyBjb21wcmVzc2lvbi4uLicpXG4gICAgYXdhaXQgdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6ICdDT01QUkVTUycsXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgIHZhbHVlOiAnREVGTEFURSdcbiAgICAgIH1dXG4gICAgfSlcbiAgICB0aGlzLmNsaWVudC5lbmFibGVDb21wcmVzc2lvbigpXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0NvbXByZXNzaW9uIGVuYWJsZWQsIGFsbCBkYXRhIHNlbnQgYW5kIHJlY2VpdmVkIGlzIGRlZmxhdGVkIScpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBMT0dJTiBvciBBVVRIRU5USUNBVEUgWE9BVVRIMiBjb21tYW5kXG4gICAqXG4gICAqIExPR0lOIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMi4zXG4gICAqIFhPQVVUSDIgZGV0YWlsczpcbiAgICogICBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9nbWFpbC94b2F1dGgyX3Byb3RvY29sI2ltYXBfcHJvdG9jb2xfZXhjaGFuZ2VcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGgudXNlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXV0aC5wYXNzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRoLnhvYXV0aDJcbiAgICovXG4gIGFzeW5jIGxvZ2luIChhdXRoKSB7XG4gICAgbGV0IGNvbW1hbmRcbiAgICBjb25zdCBvcHRpb25zID0ge31cblxuICAgIGlmICghYXV0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdXRoZW50aWNhdGlvbiBpbmZvcm1hdGlvbiBub3QgcHJvdmlkZWQnKVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0FVVEg9WE9BVVRIMicpID49IDAgJiYgYXV0aCAmJiBhdXRoLnhvYXV0aDIpIHtcbiAgICAgIGNvbW1hbmQgPSB7XG4gICAgICAgIGNvbW1hbmQ6ICdBVVRIRU5USUNBVEUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnWE9BVVRIMicgfSxcbiAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6IGJ1aWxkWE9BdXRoMlRva2VuKGF1dGgudXNlciwgYXV0aC54b2F1dGgyKSwgc2Vuc2l0aXZlOiB0cnVlIH1cbiAgICAgICAgXVxuICAgICAgfVxuXG4gICAgICBvcHRpb25zLmVycm9yUmVzcG9uc2VFeHBlY3RzRW1wdHlMaW5lID0gdHJ1ZSAvLyArIHRhZ2dlZCBlcnJvciByZXNwb25zZSBleHBlY3RzIGFuIGVtcHR5IGxpbmUgaW4gcmV0dXJuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbW1hbmQgPSB7XG4gICAgICAgIGNvbW1hbmQ6ICdsb2dpbicsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogYXV0aC51c2VyIHx8ICcnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IGF1dGgucGFzcyB8fCAnJywgc2Vuc2l0aXZlOiB0cnVlIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMb2dnaW5nIGluLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnY2FwYWJpbGl0eScsIG9wdGlvbnMpXG4gICAgLypcbiAgICAgKiB1cGRhdGUgcG9zdC1hdXRoIGNhcGFiaWxpdGVzXG4gICAgICogY2FwYWJpbGl0eSBsaXN0IHNob3VsZG4ndCBjb250YWluIGF1dGggcmVsYXRlZCBzdHVmZiBhbnltb3JlXG4gICAgICogYnV0IHNvbWUgbmV3IGV4dGVuc2lvbnMgbWlnaHQgaGF2ZSBwb3BwZWQgdXAgdGhhdCBkbyBub3RcbiAgICAgKiBtYWtlIG11Y2ggc2Vuc2UgaW4gdGhlIG5vbi1hdXRoIHN0YXRlXG4gICAgICovXG4gICAgaWYgKHJlc3BvbnNlLmNhcGFiaWxpdHkgJiYgcmVzcG9uc2UuY2FwYWJpbGl0eS5sZW5ndGgpIHtcbiAgICAgIC8vIGNhcGFiaWxpdGVzIHdlcmUgbGlzdGVkIHdpdGggdGhlIE9LIFtDQVBBQklMSVRZIC4uLl0gcmVzcG9uc2VcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5jYXBhYmlsaXR5XG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS5wYXlsb2FkICYmIHJlc3BvbnNlLnBheWxvYWQuQ0FQQUJJTElUWSAmJiByZXNwb25zZS5wYXlsb2FkLkNBUEFCSUxJVFkubGVuZ3RoKSB7XG4gICAgICAvLyBjYXBhYmlsaXRlcyB3ZXJlIGxpc3RlZCB3aXRoICogQ0FQQUJJTElUWSAuLi4gcmVzcG9uc2VcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5wYXlsb2FkLkNBUEFCSUxJVFkucG9wKCkuYXR0cmlidXRlcy5tYXAoKGNhcGEgPSAnJykgPT4gY2FwYS52YWx1ZS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2FwYWJpbGl0aWVzIHdlcmUgbm90IGF1dG9tYXRpY2FsbHkgbGlzdGVkLCByZWxvYWRcbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlQ2FwYWJpbGl0eSh0cnVlKVxuICAgIH1cblxuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0FVVEhFTlRJQ0FURUQpXG4gICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IHRydWVcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTG9naW4gc3VjY2Vzc2Z1bCwgcG9zdC1hdXRoIGNhcGFiaWxpdGVzIHVwZGF0ZWQhJywgdGhpcy5fY2FwYWJpbGl0eSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYW4gSU1BUCBjb21tYW5kLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdCBTdHJ1Y3R1cmVkIHJlcXVlc3Qgb2JqZWN0XG4gICAqIEBwYXJhbSB7QXJyYXl9IGFjY2VwdFVudGFnZ2VkIGEgbGlzdCBvZiB1bnRhZ2dlZCByZXNwb25zZXMgdGhhdCB3aWxsIGJlIGluY2x1ZGVkIGluICdwYXlsb2FkJyBwcm9wZXJ0eVxuICAgKi9cbiAgYXN5bmMgZXhlYyAocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmJyZWFrSWRsZSgpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsaWVudC5lbnF1ZXVlQ29tbWFuZChyZXF1ZXN0LCBhY2NlcHRVbnRhZ2dlZCwgb3B0aW9ucylcbiAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuY2FwYWJpbGl0eSkge1xuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLmNhcGFiaWxpdHlcbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH1cblxuICAvKipcbiAgICogVGhlIGNvbm5lY3Rpb24gaXMgaWRsaW5nLiBTZW5kcyBhIE5PT1Agb3IgSURMRSBjb21tYW5kXG4gICAqXG4gICAqIElETEUgZGV0YWlsczpcbiAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjE3N1xuICAgKi9cbiAgZW50ZXJJZGxlICgpIHtcbiAgICBpZiAodGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBzdXBwb3J0c0lkbGUgPSB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0lETEUnKSA+PSAwXG4gICAgdGhpcy5fZW50ZXJlZElkbGUgPSBzdXBwb3J0c0lkbGUgJiYgdGhpcy5fc2VsZWN0ZWRNYWlsYm94ID8gJ0lETEUnIDogJ05PT1AnXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0VudGVyaW5nIGlkbGUgd2l0aCAnICsgdGhpcy5fZW50ZXJlZElkbGUpXG5cbiAgICBpZiAodGhpcy5fZW50ZXJlZElkbGUgPT09ICdOT09QJykge1xuICAgICAgdGhpcy5faWRsZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NlbmRpbmcgTk9PUCcpXG4gICAgICAgIHRoaXMuZXhlYygnTk9PUCcpXG4gICAgICB9LCB0aGlzLnRpbWVvdXROb29wKVxuICAgIH0gZWxzZSBpZiAodGhpcy5fZW50ZXJlZElkbGUgPT09ICdJRExFJykge1xuICAgICAgdGhpcy5jbGllbnQuZW5xdWV1ZUNvbW1hbmQoe1xuICAgICAgICBjb21tYW5kOiAnSURMRSdcbiAgICAgIH0pXG4gICAgICB0aGlzLl9pZGxlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmNsaWVudC5zZW5kKCdET05FXFxyXFxuJylcbiAgICAgICAgdGhpcy5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnSWRsZSB0ZXJtaW5hdGVkJylcbiAgICAgIH0sIHRoaXMudGltZW91dElkbGUpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIGFjdGlvbnMgcmVsYXRlZCBpZGxpbmcsIGlmIElETEUgaXMgc3VwcG9ydGVkLCBzZW5kcyBET05FIHRvIHN0b3AgaXRcbiAgICovXG4gIGJyZWFrSWRsZSAoKSB7XG4gICAgaWYgKCF0aGlzLl9lbnRlcmVkSWRsZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuICAgIGlmICh0aGlzLl9lbnRlcmVkSWRsZSA9PT0gJ0lETEUnKSB7XG4gICAgICB0aGlzLmNsaWVudC5zZW5kKCdET05FXFxyXFxuJylcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdJZGxlIHRlcm1pbmF0ZWQnKVxuICAgIH1cbiAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTVEFSVFRMUyBjb21tYW5kIGlmIG5lZWRlZFxuICAgKlxuICAgKiBTVEFSVFRMUyBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjIuMVxuICAgKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtmb3JjZWRdIEJ5IGRlZmF1bHQgdGhlIGNvbW1hbmQgaXMgbm90IHJ1biBpZiBjYXBhYmlsaXR5IGlzIGFscmVhZHkgbGlzdGVkLiBTZXQgdG8gdHJ1ZSB0byBza2lwIHRoaXMgdmFsaWRhdGlvblxuICAgKi9cbiAgYXN5bmMgdXBncmFkZUNvbm5lY3Rpb24gKCkge1xuICAgIC8vIHNraXAgcmVxdWVzdCwgaWYgYWxyZWFkeSBzZWN1cmVkXG4gICAgaWYgKHRoaXMuY2xpZW50LnNlY3VyZU1vZGUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIHNraXAgaWYgU1RBUlRUTFMgbm90IGF2YWlsYWJsZSBvciBzdGFydHRscyBzdXBwb3J0IGRpc2FibGVkXG4gICAgaWYgKCh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ1NUQVJUVExTJykgPCAwIHx8IHRoaXMuX2lnbm9yZVRMUykgJiYgIXRoaXMuX3JlcXVpcmVUTFMpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdFbmNyeXB0aW5nIGNvbm5lY3Rpb24uLi4nKVxuICAgIGF3YWl0IHRoaXMuZXhlYygnU1RBUlRUTFMnKVxuICAgIHRoaXMuX2NhcGFiaWxpdHkgPSBbXVxuICAgIHRoaXMuY2xpZW50LnVwZ3JhZGUoKVxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUNhcGFiaWxpdHkoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgQ0FQQUJJTElUWSBjb21tYW5kXG4gICAqXG4gICAqIENBUEFCSUxJVFkgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4xLjFcbiAgICpcbiAgICogRG9lc24ndCByZWdpc3RlciB1bnRhZ2dlZCBDQVBBQklMSVRZIGhhbmRsZXIgYXMgdGhpcyBpcyBhbHJlYWR5XG4gICAqIGhhbmRsZWQgYnkgZ2xvYmFsIGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VkXSBCeSBkZWZhdWx0IHRoZSBjb21tYW5kIGlzIG5vdCBydW4gaWYgY2FwYWJpbGl0eSBpcyBhbHJlYWR5IGxpc3RlZC4gU2V0IHRvIHRydWUgdG8gc2tpcCB0aGlzIHZhbGlkYXRpb25cbiAgICovXG4gIGFzeW5jIHVwZGF0ZUNhcGFiaWxpdHkgKGZvcmNlZCkge1xuICAgIC8vIHNraXAgcmVxdWVzdCwgaWYgbm90IGZvcmNlZCB1cGRhdGUgYW5kIGNhcGFiaWxpdGllcyBhcmUgYWxyZWFkeSBsb2FkZWRcbiAgICBpZiAoIWZvcmNlZCAmJiB0aGlzLl9jYXBhYmlsaXR5Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gSWYgU1RBUlRUTFMgaXMgcmVxdWlyZWQgdGhlbiBza2lwIGNhcGFiaWxpdHkgbGlzdGluZyBhcyB3ZSBhcmUgZ29pbmcgdG8gdHJ5XG4gICAgLy8gU1RBUlRUTFMgYW55d2F5IGFuZCB3ZSByZS1jaGVjayBjYXBhYmlsaXRpZXMgYWZ0ZXIgY29ubmVjdGlvbiBpcyBzZWN1cmVkXG4gICAgaWYgKCF0aGlzLmNsaWVudC5zZWN1cmVNb2RlICYmIHRoaXMuX3JlcXVpcmVUTFMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGRhdGluZyBjYXBhYmlsaXR5Li4uJylcbiAgICByZXR1cm4gdGhpcy5leGVjKCdDQVBBQklMSVRZJylcbiAgfVxuXG4gIGhhc0NhcGFiaWxpdHkgKGNhcGEgPSAnJykge1xuICAgIHJldHVybiB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoY2FwYS50b1VwcGVyQ2FzZSgpLnRyaW0oKSkgPj0gMFxuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVycyBmb3IgdW50YWdnZWQgcmVzcG9uc2VzXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiB1bnRhZ2dlZCBPSyBpbmNsdWRlcyBbQ0FQQUJJTElUWV0gdGFnIGFuZCB1cGRhdGVzIGNhcGFiaWxpdHkgb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRPa0hhbmRsZXIgKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmNhcGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5jYXBhYmlsaXR5XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgY2FwYWJpbGl0eSBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyIChyZXNwb25zZSkge1xuICAgIHRoaXMuX2NhcGFiaWxpdHkgPSBwaXBlKFxuICAgICAgcHJvcE9yKFtdLCAnYXR0cmlidXRlcycpLFxuICAgICAgbWFwKCh7IHZhbHVlIH0pID0+ICh2YWx1ZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCkpXG4gICAgKShyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGV4aXN0aW5nIG1lc3NhZ2UgY291bnRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZEV4aXN0c0hhbmRsZXIgKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXNwb25zZSwgJ25yJykpIHtcbiAgICAgIHRoaXMub251cGRhdGUgJiYgdGhpcy5vbnVwZGF0ZSh0aGlzLl9zZWxlY3RlZE1haWxib3gsICdleGlzdHMnLCByZXNwb25zZS5ucilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGEgbWVzc2FnZSBoYXMgYmVlbiBkZWxldGVkXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRFeHB1bmdlSGFuZGxlciAocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3BvbnNlLCAnbnInKSkge1xuICAgICAgdGhpcy5vbnVwZGF0ZSAmJiB0aGlzLm9udXBkYXRlKHRoaXMuX3NlbGVjdGVkTWFpbGJveCwgJ2V4cHVuZ2UnLCByZXNwb25zZS5ucilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHRoYXQgZmxhZ3MgaGF2ZSBiZWVuIHVwZGF0ZWQgZm9yIGEgbWVzc2FnZVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkRmV0Y2hIYW5kbGVyIChyZXNwb25zZSkge1xuICAgIHRoaXMub251cGRhdGUgJiYgdGhpcy5vbnVwZGF0ZSh0aGlzLl9zZWxlY3RlZE1haWxib3gsICdmZXRjaCcsIFtdLmNvbmNhdChwYXJzZUZFVENIKHsgcGF5bG9hZDogeyBGRVRDSDogW3Jlc3BvbnNlXSB9IH0pIHx8IFtdKS5zaGlmdCgpKVxuICB9XG5cbiAgLy8gUHJpdmF0ZSBoZWxwZXJzXG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGF0IHRoZSBjb25uZWN0aW9uIHN0YXJ0ZWQgaWRsaW5nLiBJbml0aWF0ZXMgYSBjeWNsZVxuICAgKiBvZiBOT09QcyBvciBJRExFcyB0byByZWNlaXZlIG5vdGlmaWNhdGlvbnMgYWJvdXQgdXBkYXRlcyBpbiB0aGUgc2VydmVyXG4gICAqL1xuICBfb25JZGxlICgpIHtcbiAgICBpZiAoIXRoaXMuX2F1dGhlbnRpY2F0ZWQgfHwgdGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIC8vIE5vIG5lZWQgdG8gSURMRSB3aGVuIG5vdCBsb2dnZWQgaW4gb3IgYWxyZWFkeSBpZGxpbmdcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDbGllbnQgc3RhcnRlZCBpZGxpbmcnKVxuICAgIHRoaXMuZW50ZXJJZGxlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBJTUFQIHN0YXRlIHZhbHVlIGZvciB0aGUgY3VycmVudCBjb25uZWN0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuZXdTdGF0ZSBUaGUgc3RhdGUgeW91IHdhbnQgdG8gY2hhbmdlIHRvXG4gICAqL1xuICBfY2hhbmdlU3RhdGUgKG5ld1N0YXRlKSB7XG4gICAgaWYgKG5ld1N0YXRlID09PSB0aGlzLl9zdGF0ZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0VudGVyaW5nIHN0YXRlOiAnICsgbmV3U3RhdGUpXG5cbiAgICAvLyBpZiBhIG1haWxib3ggd2FzIG9wZW5lZCwgZW1pdCBvbmNsb3NlbWFpbGJveCBhbmQgY2xlYXIgc2VsZWN0ZWRNYWlsYm94IHZhbHVlXG4gICAgaWYgKHRoaXMuX3N0YXRlID09PSBTVEFURV9TRUxFQ1RFRCAmJiB0aGlzLl9zZWxlY3RlZE1haWxib3gpIHtcbiAgICAgIHRoaXMub25jbG9zZW1haWxib3ggJiYgdGhpcy5vbmNsb3NlbWFpbGJveCh0aGlzLl9zZWxlY3RlZE1haWxib3gpXG4gICAgICB0aGlzLl9zZWxlY3RlZE1haWxib3ggPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuX3N0YXRlID0gbmV3U3RhdGVcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnN1cmVzIGEgcGF0aCBleGlzdHMgaW4gdGhlIE1haWxib3ggdHJlZVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gdHJlZSBNYWlsYm94IHRyZWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtTdHJpbmd9IGRlbGltaXRlclxuICAgKiBAcmV0dXJuIHtPYmplY3R9IGJyYW5jaCBmb3IgdXNlZCBwYXRoXG4gICAqL1xuICBfZW5zdXJlUGF0aCAodHJlZSwgcGF0aCwgZGVsaW1pdGVyKSB7XG4gICAgY29uc3QgbmFtZXMgPSBwYXRoLnNwbGl0KGRlbGltaXRlcilcbiAgICBsZXQgYnJhbmNoID0gdHJlZVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2VcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYnJhbmNoLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb21wYXJlTWFpbGJveE5hbWVzKGJyYW5jaC5jaGlsZHJlbltqXS5uYW1lLCBpbWFwRGVjb2RlKG5hbWVzW2ldKSkpIHtcbiAgICAgICAgICBicmFuY2ggPSBicmFuY2guY2hpbGRyZW5bal1cbiAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIGJyYW5jaC5jaGlsZHJlbi5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBpbWFwRGVjb2RlKG5hbWVzW2ldKSxcbiAgICAgICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgICAgICBwYXRoOiBuYW1lcy5zbGljZSgwLCBpICsgMSkuam9pbihkZWxpbWl0ZXIpLFxuICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICB9KVxuICAgICAgICBicmFuY2ggPSBicmFuY2guY2hpbGRyZW5bYnJhbmNoLmNoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBicmFuY2hcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gbWFpbGJveCBuYW1lcy4gQ2FzZSBpbnNlbnNpdGl2ZSBpbiBjYXNlIG9mIElOQk9YLCBvdGhlcndpc2UgY2FzZSBzZW5zaXRpdmVcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGEgTWFpbGJveCBuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBiIE1haWxib3ggbmFtZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgZm9sZGVyIG5hbWVzIG1hdGNoXG4gICAqL1xuICBfY29tcGFyZU1haWxib3hOYW1lcyAoYSwgYikge1xuICAgIHJldHVybiAoYS50b1VwcGVyQ2FzZSgpID09PSAnSU5CT1gnID8gJ0lOQk9YJyA6IGEpID09PSAoYi50b1VwcGVyQ2FzZSgpID09PSAnSU5CT1gnID8gJ0lOQk9YJyA6IGIpXG4gIH1cblxuICBjcmVhdGVMb2dnZXIgKGNyZWF0b3IgPSBjcmVhdGVEZWZhdWx0TG9nZ2VyKSB7XG4gICAgY29uc3QgbG9nZ2VyID0gY3JlYXRvcigodGhpcy5fYXV0aCB8fCB7fSkudXNlciB8fCAnJywgdGhpcy5faG9zdClcbiAgICB0aGlzLmxvZ2dlciA9IHRoaXMuY2xpZW50LmxvZ2dlciA9IHtcbiAgICAgIGRlYnVnOiAoLi4ubXNncykgPT4geyBpZiAoTE9HX0xFVkVMX0RFQlVHID49IHRoaXMubG9nTGV2ZWwpIHsgbG9nZ2VyLmRlYnVnKG1zZ3MpIH0gfSxcbiAgICAgIGluZm86ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfSU5GTyA+PSB0aGlzLmxvZ0xldmVsKSB7IGxvZ2dlci5pbmZvKG1zZ3MpIH0gfSxcbiAgICAgIHdhcm46ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfV0FSTiA+PSB0aGlzLmxvZ0xldmVsKSB7IGxvZ2dlci53YXJuKG1zZ3MpIH0gfSxcbiAgICAgIGVycm9yOiAoLi4ubXNncykgPT4geyBpZiAoTE9HX0xFVkVMX0VSUk9SID49IHRoaXMubG9nTGV2ZWwpIHsgbG9n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