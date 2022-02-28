"use strict";

var _client = _interopRequireWildcard(require("./client"));

var _emailjsImapHandler = require("emailjs-imap-handler");

var _common = require("./common");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/* eslint-disable no-unused-expressions */
describe('browserbox unit tests', () => {
  var br;
  beforeEach(() => {
    const auth = {
      user: 'baldrian',
      pass: 'sleeper.de'
    };
    br = new _client.default('somehost', 1234, {
      auth,
      logLevel: _common.LOG_LEVEL_NONE
    });
    br.client.socket = {
      send: () => {},
      upgradeToSecure: () => {}
    };
  });
  describe('#_onIdle', () => {
    it('should call enterIdle', () => {
      sinon.stub(br, 'enterIdle');
      br._authenticated = true;
      br._enteredIdle = false;

      br._onIdle();

      expect(br.enterIdle.callCount).to.equal(1);
    });
    it('should not call enterIdle', () => {
      sinon.stub(br, 'enterIdle');
      br._enteredIdle = true;

      br._onIdle();

      expect(br.enterIdle.callCount).to.equal(0);
    });
  });
  describe('#openConnection', () => {
    beforeEach(() => {
      sinon.stub(br.client, 'connect');
      sinon.stub(br.client, 'close');
      sinon.stub(br.client, 'enqueueCommand');
    });
    it('should open connection', () => {
      br.client.connect.returns(Promise.resolve());
      br.client.enqueueCommand.returns(Promise.resolve({
        capability: ['capa1', 'capa2']
      }));
      setTimeout(() => br.client.onready(), 0);
      return br.openConnection().then(() => {
        expect(br.client.connect.calledOnce).to.be.true;
        expect(br.client.enqueueCommand.calledOnce).to.be.true;
        expect(br._capability.length).to.equal(2);
        expect(br._capability[0]).to.equal('capa1');
        expect(br._capability[1]).to.equal('capa2');
      });
    });
  });
  describe('#connect', () => {
    beforeEach(() => {
      sinon.stub(br.client, 'connect');
      sinon.stub(br.client, 'close');
      sinon.stub(br, 'updateCapability');
      sinon.stub(br, 'upgradeConnection');
      sinon.stub(br, 'updateId');
      sinon.stub(br, 'login');
      sinon.stub(br, 'compressConnection');
    });
    it('should connect', () => {
      br.client.connect.returns(Promise.resolve());
      br.updateCapability.returns(Promise.resolve());
      br.upgradeConnection.returns(Promise.resolve());
      br.updateId.returns(Promise.resolve());
      br.login.returns(Promise.resolve());
      br.compressConnection.returns(Promise.resolve());
      setTimeout(() => br.client.onready(), 0);
      return br.connect().then(() => {
        expect(br.client.connect.calledOnce).to.be.true;
        expect(br.updateCapability.calledOnce).to.be.true;
        expect(br.upgradeConnection.calledOnce).to.be.true;
        expect(br.updateId.calledOnce).to.be.true;
        expect(br.login.calledOnce).to.be.true;
        expect(br.compressConnection.calledOnce).to.be.true;
      });
    });
    it('should fail to login', done => {
      br.client.connect.returns(Promise.resolve());
      br.updateCapability.returns(Promise.resolve());
      br.upgradeConnection.returns(Promise.resolve());
      br.updateId.returns(Promise.resolve());
      br.login.throws(new Error());
      setTimeout(() => br.client.onready(), 0);
      br.connect().catch(err => {
        expect(err).to.exist;
        expect(br.client.connect.calledOnce).to.be.true;
        expect(br.client.close.calledOnce).to.be.true;
        expect(br.updateCapability.calledOnce).to.be.true;
        expect(br.upgradeConnection.calledOnce).to.be.true;
        expect(br.updateId.calledOnce).to.be.true;
        expect(br.login.calledOnce).to.be.true;
        expect(br.compressConnection.called).to.be.false;
        done();
      });
    });
    it('should timeout', done => {
      br.client.connect.returns(Promise.resolve());
      br.timeoutConnection = 1;
      br.connect().catch(err => {
        expect(err).to.exist;
        expect(br.client.connect.calledOnce).to.be.true;
        expect(br.client.close.calledOnce).to.be.true;
        expect(br.updateCapability.called).to.be.false;
        expect(br.upgradeConnection.called).to.be.false;
        expect(br.updateId.called).to.be.false;
        expect(br.login.called).to.be.false;
        expect(br.compressConnection.called).to.be.false;
        done();
      });
    });
  });
  describe('#close', () => {
    it('should force-close', () => {
      sinon.stub(br.client, 'close').returns(Promise.resolve());
      return br.close().then(() => {
        expect(br._state).to.equal(_client.STATE_LOGOUT);
        expect(br.client.close.calledOnce).to.be.true;
      });
    });
  });
  describe('#exec', () => {
    beforeEach(() => {
      sinon.stub(br, 'breakIdle');
    });
    it('should send string command', () => {
      sinon.stub(br.client, 'enqueueCommand').returns(Promise.resolve({}));
      return br.exec('TEST').then(res => {
        expect(res).to.deep.equal({});
        expect(br.client.enqueueCommand.args[0][0]).to.equal('TEST');
      });
    });
    it('should update capability from response', () => {
      sinon.stub(br.client, 'enqueueCommand').returns(Promise.resolve({
        capability: ['A', 'B']
      }));
      return br.exec('TEST').then(res => {
        expect(res).to.deep.equal({
          capability: ['A', 'B']
        });
        expect(br._capability).to.deep.equal(['A', 'B']);
      });
    });
  });
  describe('#enterIdle', () => {
    it('should periodically send NOOP if IDLE not supported', done => {
      sinon.stub(br, 'exec').callsFake(command => {
        expect(command).to.equal('NOOP');
        done();
      });
      br._capability = [];
      br._selectedMailbox = 'FOO';
      br.timeoutNoop = 1;
      br.enterIdle();
    });
    it('should periodically send NOOP if no mailbox selected', done => {
      sinon.stub(br, 'exec').callsFake(command => {
        expect(command).to.equal('NOOP');
        done();
      });
      br._capability = ['IDLE'];
      br._selectedMailbox = undefined;
      br.timeoutNoop = 1;
      br.enterIdle();
    });
    it('should break IDLE after timeout', done => {
      sinon.stub(br.client, 'enqueueCommand');
      sinon.stub(br.client.socket, 'send').callsFake(payload => {
        expect(br.client.enqueueCommand.args[0][0].command).to.equal('IDLE');
        expect([].slice.call(new Uint8Array(payload))).to.deep.equal([0x44, 0x4f, 0x4e, 0x45, 0x0d, 0x0a]);
        done();
      });
      br._capability = ['IDLE'];
      br._selectedMailbox = 'FOO';
      br.timeoutIdle = 1;
      br.enterIdle();
    });
  });
  describe('#breakIdle', () => {
    it('should send DONE to socket', () => {
      sinon.stub(br.client.socket, 'send');
      br._enteredIdle = 'IDLE';
      br.breakIdle();
      expect([].slice.call(new Uint8Array(br.client.socket.send.args[0][0]))).to.deep.equal([0x44, 0x4f, 0x4e, 0x45, 0x0d, 0x0a]);
    });
  });
  describe('#upgradeConnection', () => {
    it('should do nothing if already secured', () => {
      br.client.secureMode = true;
      br._capability = ['starttls'];
      return br.upgradeConnection();
    });
    it('should do nothing if STARTTLS not available', () => {
      br.client.secureMode = false;
      br._capability = [];
      return br.upgradeConnection();
    });
    it('should run STARTTLS', () => {
      sinon.stub(br.client, 'upgrade');
      sinon.stub(br, 'exec').withArgs('STARTTLS').returns(Promise.resolve());
      sinon.stub(br, 'updateCapability').returns(Promise.resolve());
      br._capability = ['STARTTLS'];
      return br.upgradeConnection().then(() => {
        expect(br.client.upgrade.callCount).to.equal(1);
        expect(br._capability.length).to.equal(0);
      });
    });
  });
  describe('#updateCapability', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should do nothing if capability is set', () => {
      br._capability = ['abc'];
      return br.updateCapability();
    });
    it('should run CAPABILITY if capability not set', () => {
      br.exec.returns(Promise.resolve());
      br._capability = [];
      return br.updateCapability().then(() => {
        expect(br.exec.args[0][0]).to.equal('CAPABILITY');
      });
    });
    it('should force run CAPABILITY', () => {
      br.exec.returns(Promise.resolve());
      br._capability = ['abc'];
      return br.updateCapability(true).then(() => {
        expect(br.exec.args[0][0]).to.equal('CAPABILITY');
      });
    });
    it('should do nothing if connection is not yet upgraded', () => {
      br._capability = [];
      br.client.secureMode = false;
      br._requireTLS = true;
      br.updateCapability();
    });
  });
  describe('#listNamespaces', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should run NAMESPACE if supported', () => {
      br.exec.returns(Promise.resolve({
        payload: {
          NAMESPACE: [{
            attributes: [[[{
              type: 'STRING',
              value: 'INBOX.'
            }, {
              type: 'STRING',
              value: '.'
            }]], null, null]
          }]
        }
      }));
      br._capability = ['NAMESPACE'];
      return br.listNamespaces().then(namespaces => {
        expect(namespaces).to.deep.equal({
          personal: [{
            prefix: 'INBOX.',
            delimiter: '.'
          }],
          users: false,
          shared: false
        });
        expect(br.exec.args[0][0]).to.equal('NAMESPACE');
        expect(br.exec.args[0][1]).to.equal('NAMESPACE');
      });
    });
    it('should do nothing if not supported', () => {
      br._capability = [];
      return br.listNamespaces().then(namespaces => {
        expect(namespaces).to.be.false;
        expect(br.exec.callCount).to.equal(0);
      });
    });
  });
  describe('#compressConnection', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br.client, 'enableCompression');
    });
    it('should run COMPRESS=DEFLATE if supported', () => {
      br.exec.withArgs({
        command: 'COMPRESS',
        attributes: [{
          type: 'ATOM',
          value: 'DEFLATE'
        }]
      }).returns(Promise.resolve({}));
      br._enableCompression = true;
      br._capability = ['COMPRESS=DEFLATE'];
      return br.compressConnection().then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br.client.enableCompression.callCount).to.equal(1);
      });
    });
    it('should do nothing if not supported', () => {
      br._capability = [];
      return br.compressConnection().then(() => {
        expect(br.exec.callCount).to.equal(0);
      });
    });
    it('should do nothing if not enabled', () => {
      br._enableCompression = false;
      br._capability = ['COMPRESS=DEFLATE'];
      return br.compressConnection().then(() => {
        expect(br.exec.callCount).to.equal(0);
      });
    });
  });
  describe('#login', () => {
    it('should call LOGIN', () => {
      sinon.stub(br, 'exec').returns(Promise.resolve({}));
      sinon.stub(br, 'updateCapability').returns(Promise.resolve(true));
      return br.login({
        user: 'u1',
        pass: 'p1'
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br.exec.args[0][0]).to.deep.equal({
          command: 'login',
          attributes: [{
            type: 'STRING',
            value: 'u1'
          }, {
            type: 'STRING',
            value: 'p1',
            sensitive: true
          }]
        });
      });
    });
    it('should call XOAUTH2', () => {
      sinon.stub(br, 'exec').returns(Promise.resolve({}));
      sinon.stub(br, 'updateCapability').returns(Promise.resolve(true));
      br._capability = ['AUTH=XOAUTH2'];
      br.login({
        user: 'u1',
        xoauth2: 'abc'
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br.exec.args[0][0]).to.deep.equal({
          command: 'AUTHENTICATE',
          attributes: [{
            type: 'ATOM',
            value: 'XOAUTH2'
          }, {
            type: 'ATOM',
            value: 'dXNlcj11MQFhdXRoPUJlYXJlciBhYmMBAQ==',
            sensitive: true
          }]
        });
      });
    });
  });
  describe('#updateId', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should not nothing if not supported', () => {
      br._capability = [];
      return br.updateId({
        a: 'b',
        c: 'd'
      }).then(() => {
        expect(br.serverId).to.be.false;
      });
    });
    it('should send NIL', () => {
      br.exec.withArgs({
        command: 'ID',
        attributes: [null]
      }).returns(Promise.resolve({
        payload: {
          ID: [{
            attributes: [null]
          }]
        }
      }));
      br._capability = ['ID'];
      return br.updateId(null).then(() => {
        expect(br.serverId).to.deep.equal({});
      });
    });
    it('should exhange ID values', () => {
      br.exec.withArgs({
        command: 'ID',
        attributes: [['ckey1', 'cval1', 'ckey2', 'cval2']]
      }).returns(Promise.resolve({
        payload: {
          ID: [{
            attributes: [[{
              value: 'skey1'
            }, {
              value: 'sval1'
            }, {
              value: 'skey2'
            }, {
              value: 'sval2'
            }]]
          }]
        }
      }));
      br._capability = ['ID'];
      return br.updateId({
        ckey1: 'cval1',
        ckey2: 'cval2'
      }).then(() => {
        expect(br.serverId).to.deep.equal({
          skey1: 'sval1',
          skey2: 'sval2'
        });
      });
    });
  });
  describe('#listMailboxes', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should call LIST and LSUB in sequence', () => {
      br.exec.withArgs({
        command: 'LIST',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LIST: [false]
        }
      }));
      br.exec.withArgs({
        command: 'LSUB',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LSUB: [false]
        }
      }));
      return br.listMailboxes().then(tree => {
        expect(tree).to.exist;
      });
    });
    it('should not die on NIL separators', () => {
      br.exec.withArgs({
        command: 'LIST',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LIST: [(0, _emailjsImapHandler.parser)((0, _common.toTypedArray)('* LIST (\\NoInferiors) NIL "INBOX"'))]
        }
      }));
      br.exec.withArgs({
        command: 'LSUB',
        attributes: ['', '*']
      }).returns(Promise.resolve({
        payload: {
          LSUB: [(0, _emailjsImapHandler.parser)((0, _common.toTypedArray)('* LSUB (\\NoInferiors) NIL "INBOX"'))]
        }
      }));
      return br.listMailboxes().then(tree => {
        expect(tree).to.exist;
      });
    });
  });
  describe('#createMailbox', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should call CREATE with a string payload', () => {
      // The spec allows unquoted ATOM-style syntax too, but for
      // simplicity we always generate a string even if it could be
      // expressed as an atom.
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['mailboxname']
      }).returns(Promise.resolve());
      return br.createMailbox('mailboxname').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call mutf7 encode the argument', () => {
      // From RFC 3501
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['~peter/mail/&U,BTFw-/&ZeVnLIqe-']
      }).returns(Promise.resolve());
      return br.createMailbox('~peter/mail/\u53f0\u5317/\u65e5\u672c\u8a9e').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should treat an ALREADYEXISTS response as success', () => {
      var fakeErr = {
        code: 'ALREADYEXISTS'
      };
      br.exec.withArgs({
        command: 'CREATE',
        attributes: ['mailboxname']
      }).returns(Promise.reject(fakeErr));
      return br.createMailbox('mailboxname').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#deleteMailbox', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should call DELETE with a string payload', () => {
      br.exec.withArgs({
        command: 'DELETE',
        attributes: ['mailboxname']
      }).returns(Promise.resolve());
      return br.deleteMailbox('mailboxname').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call mutf7 encode the argument', () => {
      // From RFC 3501
      br.exec.withArgs({
        command: 'DELETE',
        attributes: ['~peter/mail/&U,BTFw-/&ZeVnLIqe-']
      }).returns(Promise.resolve());
      return br.deleteMailbox('~peter/mail/\u53f0\u5317/\u65e5\u672c\u8a9e').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe.skip('#listMessages', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildFETCHCommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call FETCH', () => {
      br.exec.returns(Promise.resolve('abc'));

      br._buildFETCHCommand.withArgs(['1:2', ['uid', 'flags'], {
        byUid: true
      }]).returns({});

      return br.listMessages('INBOX', '1:2', ['uid', 'flags'], {
        byUid: true
      }).then(() => {
        expect(br._buildFETCHCommand.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe.skip('#search', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSEARCHCommand');
      sinon.stub(br, '_parseSEARCH');
    });
    it('should call SEARCH', () => {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSEARCHCommand.withArgs({
        uid: 1
      }, {
        byUid: true
      }).returns({});

      return br.search('INBOX', {
        uid: 1
      }, {
        byUid: true
      }).then(() => {
        expect(br._buildSEARCHCommand.callCount).to.equal(1);
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseSEARCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe('#upload', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should call APPEND with custom flag', () => {
      br.exec.returns(Promise.resolve());
      return br.upload('mailbox', 'this is a message', {
        flags: ['\\$MyFlag']
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call APPEND w/o flags', () => {
      br.exec.returns(Promise.resolve());
      return br.upload('mailbox', 'this is a message').then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe.skip('#setFlags', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSTORECommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call STORE', () => {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSTORECommand.withArgs('1:2', 'FLAGS', ['\\Seen', '$MyFlag'], {
        byUid: true
      }).returns({});

      return br.setFlags('INBOX', '1:2', ['\\Seen', '$MyFlag'], {
        byUid: true
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe.skip('#store', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br, '_buildSTORECommand');
      sinon.stub(br, '_parseFETCH');
    });
    it('should call STORE', () => {
      br.exec.returns(Promise.resolve('abc'));

      br._buildSTORECommand.withArgs('1:2', '+X-GM-LABELS', ['\\Sent', '\\Junk'], {
        byUid: true
      }).returns({});

      return br.store('INBOX', '1:2', '+X-GM-LABELS', ['\\Sent', '\\Junk'], {
        byUid: true
      }).then(() => {
        expect(br._buildSTORECommand.callCount).to.equal(1);
        expect(br.exec.callCount).to.equal(1);
        expect(br._parseFETCH.withArgs('abc').callCount).to.equal(1);
      });
    });
  });
  describe('#deleteMessages', () => {
    beforeEach(() => {
      sinon.stub(br, 'setFlags');
      sinon.stub(br, 'exec');
    });
    it('should call UID EXPUNGE', () => {
      br.exec.withArgs({
        command: 'UID EXPUNGE',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }]
      }).returns(Promise.resolve('abc'));
      br.setFlags.withArgs('INBOX', '1:2', {
        add: '\\Deleted'
      }).returns(Promise.resolve());
      br._capability = ['UIDPLUS'];
      return br.deleteMessages('INBOX', '1:2', {
        byUid: true
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should call EXPUNGE', () => {
      br.exec.withArgs('EXPUNGE').returns(Promise.resolve('abc'));
      br.setFlags.withArgs('INBOX', '1:2', {
        add: '\\Deleted'
      }).returns(Promise.resolve());
      br._capability = [];
      return br.deleteMessages('INBOX', '1:2', {
        byUid: true
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#copyMessages', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should call COPY', () => {
      br.exec.withArgs({
        command: 'UID COPY',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }, {
          type: 'atom',
          value: '[Gmail]/Trash'
        }]
      }).returns(Promise.resolve({
        copyuid: ['1', '1:2', '4,3']
      }));
      return br.copyMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(response => {
        expect(response).to.deep.equal({
          srcSeqSet: '1:2',
          destSeqSet: '4,3'
        });
        expect(br.exec.callCount).to.equal(1);
      });
    });
  });
  describe('#moveMessages', () => {
    beforeEach(() => {
      sinon.stub(br, 'exec');
      sinon.stub(br, 'copyMessages');
      sinon.stub(br, 'deleteMessages');
    });
    it('should call MOVE if supported', () => {
      br.exec.withArgs({
        command: 'UID MOVE',
        attributes: [{
          type: 'sequence',
          value: '1:2'
        }, {
          type: 'atom',
          value: '[Gmail]/Trash'
        }]
      }, ['OK']).returns(Promise.resolve('abc'));
      br._capability = ['MOVE'];
      return br.moveMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
      });
    });
    it('should fallback to copy+expunge', () => {
      br.copyMessages.withArgs('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).returns(Promise.resolve());
      br.deleteMessages.withArgs('1:2', {
        byUid: true
      }).returns(Promise.resolve());
      br._capability = [];
      return br.moveMessages('INBOX', '1:2', '[Gmail]/Trash', {
        byUid: true
      }).then(() => {
        expect(br.deleteMessages.callCount).to.equal(1);
      });
    });
  });
  describe('#_shouldSelectMailbox', () => {
    it('should return true when ctx is undefined', () => {
      expect(br._shouldSelectMailbox('path')).to.be.true;
    });
    it('should return true when a different path is queued', () => {
      sinon.stub(br.client, 'getPreviouslyQueued').returns({
        request: {
          command: 'SELECT',
          attributes: [{
            type: 'STRING',
            value: 'queued path'
          }]
        }
      });
      expect(br._shouldSelectMailbox('path', {})).to.be.true;
    });
    it('should return false when the same path is queued', () => {
      sinon.stub(br.client, 'getPreviouslyQueued').returns({
        request: {
          command: 'SELECT',
          attributes: [{
            type: 'STRING',
            value: 'queued path'
          }]
        }
      });
      expect(br._shouldSelectMailbox('queued path', {})).to.be.false;
    });
  });
  describe('#selectMailbox', () => {
    const path = '[Gmail]/Trash';
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should run SELECT', () => {
      br.exec.withArgs({
        command: 'SELECT',
        attributes: [{
          type: 'STRING',
          value: path
        }]
      }).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));
      return br.selectMailbox(path).then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br._state).to.equal(_client.STATE_SELECTED);
      });
    });
    it('should run SELECT with CONDSTORE', () => {
      br.exec.withArgs({
        command: 'SELECT',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'CONDSTORE'
        }]]
      }).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));
      br._capability = ['CONDSTORE'];
      return br.selectMailbox(path, {
        condstore: true
      }).then(() => {
        expect(br.exec.callCount).to.equal(1);
        expect(br._state).to.equal(_client.STATE_SELECTED);
      });
    });
    describe('should emit onselectmailbox before selectMailbox is resolved', () => {
      beforeEach(() => {
        br.exec.returns(Promise.resolve({
          code: 'READ-WRITE'
        }));
      });
      it('when it returns a promise', () => {
        var promiseResolved = false;

        br.onselectmailbox = () => new Promise(resolve => {
          resolve();
          promiseResolved = true;
        });

        var onselectmailboxSpy = sinon.spy(br, 'onselectmailbox');
        return br.selectMailbox(path).then(() => {
          expect(onselectmailboxSpy.withArgs(path).callCount).to.equal(1);
          expect(promiseResolved).to.equal(true);
        });
      });
      it('when it does not return a promise', () => {
        br.onselectmailbox = () => {};

        var onselectmailboxSpy = sinon.spy(br, 'onselectmailbox');
        return br.selectMailbox(path).then(() => {
          expect(onselectmailboxSpy.withArgs(path).callCount).to.equal(1);
        });
      });
    });
    it('should emit onclosemailbox', () => {
      let called = false;
      br.exec.returns(Promise.resolve('abc')).returns(Promise.resolve({
        code: 'READ-WRITE'
      }));

      br.onclosemailbox = path => {
        expect(path).to.equal('yyy');
        called = true;
      };

      br._selectedMailbox = 'yyy';
      return br.selectMailbox(path).then(() => {
        expect(called).to.be.true;
      });
    });
  });
  describe('#mailboxStatus', () => {
    const path = 'Inbox';
    beforeEach(() => {
      sinon.stub(br, 'exec');
    });
    it('should run STATUS', () => {
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: '2824'
            }, {
              type: 'ATOM',
              value: 'MESSAGES'
            }, {
              type: 'ATOM',
              value: '676'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path).then(result => {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(2824);
        expect(result.messages).to.equal(676);
      });
    });
    it('should run STATUS with HIGHESTMODSEQ', () => {
      br._capability = ['CONDSTORE'];
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }, {
          type: 'ATOM',
          value: 'HIGHESTMODSEQ'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: '2824'
            }, {
              type: 'ATOM',
              value: 'MESSAGES'
            }, {
              type: 'ATOM',
              value: '676'
            }, {
              type: 'ATOM',
              value: 'HIGHESTMODSEQ'
            }, {
              type: 'ATOM',
              value: '10'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path, {
        condstore: true
      }).then(result => {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(2824);
        expect(result.messages).to.equal(676);
        expect(result.highestModseq).to.equal(10);
      });
    });
    it('should run STATUS with invalid result', () => {
      br.exec.withArgs({
        command: 'STATUS',
        attributes: [{
          type: 'STRING',
          value: path
        }, [{
          type: 'ATOM',
          value: 'UIDNEXT'
        }, {
          type: 'ATOM',
          value: 'MESSAGES'
        }]]
      }).returns(Promise.resolve({
        payload: {
          STATUS: [{
            tag: '*',
            command: 'STATUS',
            attributes: [{
              type: 'ATOM',
              value: path
            }, [{
              type: 'ATOM',
              value: 'UIDNEXT'
            }, {
              type: 'ATOM',
              value: 'youyou'
            }, {
              type: 'ATOM',
              value: 'MESSAGES_invalid'
            }]]
          }]
        }
      }));
      return br.mailboxStatus(path).then(result => {
        expect(br.exec.callCount).to.equal(1);
        expect(result.uidNext).to.equal(null);
        expect(result.messages).to.equal(null);
      });
    });
  });
  describe('#hasCapability', () => {
    it('should detect existing capability', () => {
      br._capability = ['ZZZ'];
      expect(br.hasCapability('zzz')).to.be.true;
    });
    it('should detect non existing capability', () => {
      br._capability = ['ZZZ'];
      expect(br.hasCapability('ooo')).to.be.false;
      expect(br.hasCapability()).to.be.false;
    });
  });
  describe('#_untaggedOkHandler', () => {
    it('should update capability if present', () => {
      br._untaggedOkHandler({
        capability: ['abc']
      }, () => {});

      expect(br._capability).to.deep.equal(['abc']);
    });
  });
  describe('#_untaggedCapabilityHandler', () => {
    it('should update capability', () => {
      br._untaggedCapabilityHandler({
        attributes: [{
          value: 'abc'
        }]
      }, () => {});

      expect(br._capability).to.deep.equal(['ABC']);
    });
  });
  describe('#_untaggedExistsHandler', () => {
    it('should emit onupdate', () => {
      br.onupdate = sinon.stub();
      br._selectedMailbox = 'FOO';

      br._untaggedExistsHandler({
        nr: 123
      }, () => {});

      expect(br.onupdate.withArgs('FOO', 'exists', 123).callCount).to.equal(1);
    });
  });
  describe('#_untaggedExpungeHandler', () => {
    it('should emit onupdate', () => {
      br.onupdate = sinon.stub();
      br._selectedMailbox = 'FOO';

      br._untaggedExpungeHandler({
        nr: 123
      }, () => {});

      expect(br.onupdate.withArgs('FOO', 'expunge', 123).callCount).to.equal(1);
    });
  });
  describe.skip('#_untaggedFetchHandler', () => {
    it('should emit onupdate', () => {
      br.onupdate = sinon.stub();
      sinon.stub(br, '_parseFETCH').returns('abc');
      br._selectedMailbox = 'FOO';

      br._untaggedFetchHandler({
        nr: 123
      }, () => {});

      expect(br.onupdate.withArgs('FOO', 'fetch', 'abc').callCount).to.equal(1);
      expect(br._parseFETCH.args[0][0]).to.deep.equal({
        payload: {
          FETCH: [{
            nr: 123
          }]
        }
      });
    });
  });
  describe('#_changeState', () => {
    it('should set the state value', () => {
      br._changeState(12345);

      expect(br._state).to.equal(12345);
    });
    it('should emit onclosemailbox if mailbox was closed', () => {
      br.onclosemailbox = sinon.stub();
      br._state = _client.STATE_SELECTED;
      br._selectedMailbox = 'aaa';

      br._changeState(12345);

      expect(br._selectedMailbox).to.be.false;
      expect(br.onclosemailbox.withArgs('aaa').callCount).to.equal(1);
    });
  });
  describe('#_ensurePath', () => {
    it('should create the path if not present', () => {
      var tree = {
        children: []
      };
      expect(br._ensurePath(tree, 'hello/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'hello/world',
        children: []
      });
      expect(tree).to.deep.equal({
        children: [{
          name: 'hello',
          delimiter: '/',
          path: 'hello',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'hello/world',
            children: []
          }]
        }]
      });
    });
    it('should return existing path if possible', () => {
      var tree = {
        children: [{
          name: 'hello',
          delimiter: '/',
          path: 'hello',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'hello/world',
            children: [],
            abc: 123
          }]
        }]
      };
      expect(br._ensurePath(tree, 'hello/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'hello/world',
        children: [],
        abc: 123
      });
    });
    it('should handle case insensitive Inbox', () => {
      var tree = {
        children: []
      };
      expect(br._ensurePath(tree, 'Inbox/world', '/')).to.deep.equal({
        name: 'world',
        delimiter: '/',
        path: 'Inbox/world',
        children: []
      });
      expect(br._ensurePath(tree, 'INBOX/worlds', '/')).to.deep.equal({
        name: 'worlds',
        delimiter: '/',
        path: 'INBOX/worlds',
        children: []
      });
      expect(tree).to.deep.equal({
        children: [{
          name: 'Inbox',
          delimiter: '/',
          path: 'Inbox',
          children: [{
            name: 'world',
            delimiter: '/',
            path: 'Inbox/world',
            children: []
          }, {
            name: 'worlds',
            delimiter: '/',
            path: 'INBOX/worlds',
            children: []
          }]
        }]
      });
    });
  });
  describe('untagged updates', () => {
    it('should receive information about untagged exists', done => {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = (path, type, value) => {
        expect(path).to.equal('FOO');
        expect(type).to.equal('exists');
        expect(value).to.equal(123);
        done();
      };

      br.client._onData({
        /* * 123 EXISTS\r\n */
        data: new Uint8Array([42, 32, 49, 50, 51, 32, 69, 88, 73, 83, 84, 83, 13, 10]).buffer
      });
    });
    it('should receive information about untagged expunge', done => {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = (path, type, value) => {
        expect(path).to.equal('FOO');
        expect(type).to.equal('expunge');
        expect(value).to.equal(456);
        done();
      };

      br.client._onData({
        /* * 456 EXPUNGE\r\n */
        data: new Uint8Array([42, 32, 52, 53, 54, 32, 69, 88, 80, 85, 78, 71, 69, 13, 10]).buffer
      });
    });
    it('should receive information about untagged fetch', done => {
      br.client._connectionReady = true;
      br._selectedMailbox = 'FOO';

      br.onupdate = (path, type, value) => {
        expect(path).to.equal('FOO');
        expect(type).to.equal('fetch');
        expect(value).to.deep.equal({
          '#': 123,
          flags: ['\\Seen'],
          modseq: '4'
        });
        done();
      };

      br.client._onData({
        /* * 123 FETCH (FLAGS (\\Seen) MODSEQ (4))\r\n */
        data: new Uint8Array([42, 32, 49, 50, 51, 32, 70, 69, 84, 67, 72, 32, 40, 70, 76, 65, 71, 83, 32, 40, 92, 83, 101, 101, 110, 41, 32, 77, 79, 68, 83, 69, 81, 32, 40, 52, 41, 41, 13, 10]).buffer
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQtdW5pdC5qcyJdLCJuYW1lcyI6WyJkZXNjcmliZSIsImJyIiwiYmVmb3JlRWFjaCIsImF1dGgiLCJ1c2VyIiwicGFzcyIsIkltYXBDbGllbnQiLCJsb2dMZXZlbCIsImNsaWVudCIsInNvY2tldCIsInNlbmQiLCJ1cGdyYWRlVG9TZWN1cmUiLCJpdCIsInNpbm9uIiwic3R1YiIsIl9hdXRoZW50aWNhdGVkIiwiX2VudGVyZWRJZGxlIiwiX29uSWRsZSIsImV4cGVjdCIsImVudGVySWRsZSIsImNhbGxDb3VudCIsInRvIiwiZXF1YWwiLCJjb25uZWN0IiwicmV0dXJucyIsIlByb21pc2UiLCJyZXNvbHZlIiwiZW5xdWV1ZUNvbW1hbmQiLCJjYXBhYmlsaXR5Iiwic2V0VGltZW91dCIsIm9ucmVhZHkiLCJvcGVuQ29ubmVjdGlvbiIsInRoZW4iLCJjYWxsZWRPbmNlIiwiYmUiLCJ0cnVlIiwiX2NhcGFiaWxpdHkiLCJsZW5ndGgiLCJ1cGRhdGVDYXBhYmlsaXR5IiwidXBncmFkZUNvbm5lY3Rpb24iLCJ1cGRhdGVJZCIsImxvZ2luIiwiY29tcHJlc3NDb25uZWN0aW9uIiwiZG9uZSIsInRocm93cyIsIkVycm9yIiwiY2F0Y2giLCJlcnIiLCJleGlzdCIsImNsb3NlIiwiY2FsbGVkIiwiZmFsc2UiLCJ0aW1lb3V0Q29ubmVjdGlvbiIsIl9zdGF0ZSIsIlNUQVRFX0xPR09VVCIsImV4ZWMiLCJyZXMiLCJkZWVwIiwiYXJncyIsImNhbGxzRmFrZSIsImNvbW1hbmQiLCJfc2VsZWN0ZWRNYWlsYm94IiwidGltZW91dE5vb3AiLCJ1bmRlZmluZWQiLCJwYXlsb2FkIiwic2xpY2UiLCJjYWxsIiwiVWludDhBcnJheSIsInRpbWVvdXRJZGxlIiwiYnJlYWtJZGxlIiwic2VjdXJlTW9kZSIsIndpdGhBcmdzIiwidXBncmFkZSIsIl9yZXF1aXJlVExTIiwiTkFNRVNQQUNFIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ2YWx1ZSIsImxpc3ROYW1lc3BhY2VzIiwibmFtZXNwYWNlcyIsInBlcnNvbmFsIiwicHJlZml4IiwiZGVsaW1pdGVyIiwidXNlcnMiLCJzaGFyZWQiLCJfZW5hYmxlQ29tcHJlc3Npb24iLCJlbmFibGVDb21wcmVzc2lvbiIsInNlbnNpdGl2ZSIsInhvYXV0aDIiLCJhIiwiYyIsInNlcnZlcklkIiwiSUQiLCJja2V5MSIsImNrZXkyIiwic2tleTEiLCJza2V5MiIsIkxJU1QiLCJMU1VCIiwibGlzdE1haWxib3hlcyIsInRyZWUiLCJjcmVhdGVNYWlsYm94IiwiZmFrZUVyciIsImNvZGUiLCJyZWplY3QiLCJkZWxldGVNYWlsYm94Iiwic2tpcCIsIl9idWlsZEZFVENIQ29tbWFuZCIsImJ5VWlkIiwibGlzdE1lc3NhZ2VzIiwiX3BhcnNlRkVUQ0giLCJfYnVpbGRTRUFSQ0hDb21tYW5kIiwidWlkIiwic2VhcmNoIiwiX3BhcnNlU0VBUkNIIiwidXBsb2FkIiwiZmxhZ3MiLCJfYnVpbGRTVE9SRUNvbW1hbmQiLCJzZXRGbGFncyIsInN0b3JlIiwiYWRkIiwiZGVsZXRlTWVzc2FnZXMiLCJjb3B5dWlkIiwiY29weU1lc3NhZ2VzIiwicmVzcG9uc2UiLCJzcmNTZXFTZXQiLCJkZXN0U2VxU2V0IiwibW92ZU1lc3NhZ2VzIiwiX3Nob3VsZFNlbGVjdE1haWxib3giLCJyZXF1ZXN0IiwicGF0aCIsInNlbGVjdE1haWxib3giLCJTVEFURV9TRUxFQ1RFRCIsImNvbmRzdG9yZSIsInByb21pc2VSZXNvbHZlZCIsIm9uc2VsZWN0bWFpbGJveCIsIm9uc2VsZWN0bWFpbGJveFNweSIsInNweSIsIm9uY2xvc2VtYWlsYm94IiwiU1RBVFVTIiwidGFnIiwibWFpbGJveFN0YXR1cyIsInJlc3VsdCIsInVpZE5leHQiLCJtZXNzYWdlcyIsImhpZ2hlc3RNb2RzZXEiLCJoYXNDYXBhYmlsaXR5IiwiX3VudGFnZ2VkT2tIYW5kbGVyIiwiX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXIiLCJvbnVwZGF0ZSIsIl91bnRhZ2dlZEV4aXN0c0hhbmRsZXIiLCJuciIsIl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyIiwiX3VudGFnZ2VkRmV0Y2hIYW5kbGVyIiwiRkVUQ0giLCJfY2hhbmdlU3RhdGUiLCJjaGlsZHJlbiIsIl9lbnN1cmVQYXRoIiwibmFtZSIsImFiYyIsIl9jb25uZWN0aW9uUmVhZHkiLCJfb25EYXRhIiwiZGF0YSIsImJ1ZmZlciIsIm1vZHNlcSJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7O0FBSkE7QUFTQUEsUUFBUSxDQUFDLHVCQUFELEVBQTBCLE1BQU07QUFDdEMsTUFBSUMsRUFBSjtBQUVBQyxFQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmLFVBQU1DLElBQUksR0FBRztBQUFFQyxNQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsTUFBQUEsSUFBSSxFQUFFO0FBQTFCLEtBQWI7QUFDQUosSUFBQUEsRUFBRSxHQUFHLElBQUlLLGVBQUosQ0FBZSxVQUFmLEVBQTJCLElBQTNCLEVBQWlDO0FBQUVILE1BQUFBLElBQUY7QUFBUUksTUFBQUEsUUFBUSxFQUFSQTtBQUFSLEtBQWpDLENBQUw7QUFDQU4sSUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVVDLE1BQVYsR0FBbUI7QUFDakJDLE1BQUFBLElBQUksRUFBRSxNQUFNLENBQUcsQ0FERTtBQUVqQkMsTUFBQUEsZUFBZSxFQUFFLE1BQU0sQ0FBRztBQUZULEtBQW5CO0FBSUQsR0FQUyxDQUFWO0FBU0FYLEVBQUFBLFFBQVEsQ0FBQyxVQUFELEVBQWEsTUFBTTtBQUN6QlksSUFBQUEsRUFBRSxDQUFDLHVCQUFELEVBQTBCLE1BQU07QUFDaENDLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsV0FBZjtBQUVBQSxNQUFBQSxFQUFFLENBQUNjLGNBQUgsR0FBb0IsSUFBcEI7QUFDQWQsTUFBQUEsRUFBRSxDQUFDZSxZQUFILEdBQWtCLEtBQWxCOztBQUNBZixNQUFBQSxFQUFFLENBQUNnQixPQUFIOztBQUVBQyxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNrQixTQUFILENBQWFDLFNBQWQsQ0FBTixDQUErQkMsRUFBL0IsQ0FBa0NDLEtBQWxDLENBQXdDLENBQXhDO0FBQ0QsS0FSQyxDQUFGO0FBVUFWLElBQUFBLEVBQUUsQ0FBQywyQkFBRCxFQUE4QixNQUFNO0FBQ3BDQyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLFdBQWY7QUFFQUEsTUFBQUEsRUFBRSxDQUFDZSxZQUFILEdBQWtCLElBQWxCOztBQUNBZixNQUFBQSxFQUFFLENBQUNnQixPQUFIOztBQUVBQyxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNrQixTQUFILENBQWFDLFNBQWQsQ0FBTixDQUErQkMsRUFBL0IsQ0FBa0NDLEtBQWxDLENBQXdDLENBQXhDO0FBQ0QsS0FQQyxDQUFGO0FBUUQsR0FuQk8sQ0FBUjtBQXFCQXRCLEVBQUFBLFFBQVEsQ0FBQyxpQkFBRCxFQUFvQixNQUFNO0FBQ2hDRSxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBRSxDQUFDTyxNQUFkLEVBQXNCLFNBQXRCO0FBQ0FLLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFFLENBQUNPLE1BQWQsRUFBc0IsT0FBdEI7QUFDQUssTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQUUsQ0FBQ08sTUFBZCxFQUFzQixnQkFBdEI7QUFDRCxLQUpTLENBQVY7QUFLQUksSUFBQUEsRUFBRSxDQUFDLHdCQUFELEVBQTJCLE1BQU07QUFDakNYLE1BQUFBLEVBQUUsQ0FBQ08sTUFBSCxDQUFVZSxPQUFWLENBQWtCQyxPQUFsQixDQUEwQkMsT0FBTyxDQUFDQyxPQUFSLEVBQTFCO0FBQ0F6QixNQUFBQSxFQUFFLENBQUNPLE1BQUgsQ0FBVW1CLGNBQVYsQ0FBeUJILE9BQXpCLENBQWlDQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDL0NFLFFBQUFBLFVBQVUsRUFBRSxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBRG1DLE9BQWhCLENBQWpDO0FBR0FDLE1BQUFBLFVBQVUsQ0FBQyxNQUFNNUIsRUFBRSxDQUFDTyxNQUFILENBQVVzQixPQUFWLEVBQVAsRUFBNEIsQ0FBNUIsQ0FBVjtBQUNBLGFBQU83QixFQUFFLENBQUM4QixjQUFILEdBQW9CQyxJQUFwQixDQUF5QixNQUFNO0FBQ3BDZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNPLE1BQUgsQ0FBVWUsT0FBVixDQUFrQlUsVUFBbkIsQ0FBTixDQUFxQ1osRUFBckMsQ0FBd0NhLEVBQXhDLENBQTJDQyxJQUEzQztBQUNBakIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDTyxNQUFILENBQVVtQixjQUFWLENBQXlCTSxVQUExQixDQUFOLENBQTRDWixFQUE1QyxDQUErQ2EsRUFBL0MsQ0FBa0RDLElBQWxEO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNtQyxXQUFILENBQWVDLE1BQWhCLENBQU4sQ0FBOEJoQixFQUE5QixDQUFpQ0MsS0FBakMsQ0FBdUMsQ0FBdkM7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDbUMsV0FBSCxDQUFlLENBQWYsQ0FBRCxDQUFOLENBQTBCZixFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsT0FBbkM7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDbUMsV0FBSCxDQUFlLENBQWYsQ0FBRCxDQUFOLENBQTBCZixFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsT0FBbkM7QUFDRCxPQU5NLENBQVA7QUFPRCxLQWJDLENBQUY7QUFjRCxHQXBCTyxDQUFSO0FBc0JBdEIsRUFBQUEsUUFBUSxDQUFDLFVBQUQsRUFBYSxNQUFNO0FBQ3pCRSxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBRSxDQUFDTyxNQUFkLEVBQXNCLFNBQXRCO0FBQ0FLLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFFLENBQUNPLE1BQWQsRUFBc0IsT0FBdEI7QUFDQUssTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxrQkFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLG1CQUFmO0FBQ0FZLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsVUFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE9BQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxvQkFBZjtBQUNELEtBUlMsQ0FBVjtBQVVBVyxJQUFBQSxFQUFFLENBQUMsZ0JBQUQsRUFBbUIsTUFBTTtBQUN6QlgsTUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVVlLE9BQVYsQ0FBa0JDLE9BQWxCLENBQTBCQyxPQUFPLENBQUNDLE9BQVIsRUFBMUI7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQ3FDLGdCQUFILENBQW9CZCxPQUFwQixDQUE0QkMsT0FBTyxDQUFDQyxPQUFSLEVBQTVCO0FBQ0F6QixNQUFBQSxFQUFFLENBQUNzQyxpQkFBSCxDQUFxQmYsT0FBckIsQ0FBNkJDLE9BQU8sQ0FBQ0MsT0FBUixFQUE3QjtBQUNBekIsTUFBQUEsRUFBRSxDQUFDdUMsUUFBSCxDQUFZaEIsT0FBWixDQUFvQkMsT0FBTyxDQUFDQyxPQUFSLEVBQXBCO0FBQ0F6QixNQUFBQSxFQUFFLENBQUN3QyxLQUFILENBQVNqQixPQUFULENBQWlCQyxPQUFPLENBQUNDLE9BQVIsRUFBakI7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQ3lDLGtCQUFILENBQXNCbEIsT0FBdEIsQ0FBOEJDLE9BQU8sQ0FBQ0MsT0FBUixFQUE5QjtBQUVBRyxNQUFBQSxVQUFVLENBQUMsTUFBTTVCLEVBQUUsQ0FBQ08sTUFBSCxDQUFVc0IsT0FBVixFQUFQLEVBQTRCLENBQTVCLENBQVY7QUFDQSxhQUFPN0IsRUFBRSxDQUFDc0IsT0FBSCxHQUFhUyxJQUFiLENBQWtCLE1BQU07QUFDN0JkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ08sTUFBSCxDQUFVZSxPQUFWLENBQWtCVSxVQUFuQixDQUFOLENBQXFDWixFQUFyQyxDQUF3Q2EsRUFBeEMsQ0FBMkNDLElBQTNDO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNxQyxnQkFBSCxDQUFvQkwsVUFBckIsQ0FBTixDQUF1Q1osRUFBdkMsQ0FBMENhLEVBQTFDLENBQTZDQyxJQUE3QztBQUNBakIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0MsaUJBQUgsQ0FBcUJOLFVBQXRCLENBQU4sQ0FBd0NaLEVBQXhDLENBQTJDYSxFQUEzQyxDQUE4Q0MsSUFBOUM7QUFDQWpCLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3VDLFFBQUgsQ0FBWVAsVUFBYixDQUFOLENBQStCWixFQUEvQixDQUFrQ2EsRUFBbEMsQ0FBcUNDLElBQXJDO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUN3QyxLQUFILENBQVNSLFVBQVYsQ0FBTixDQUE0QlosRUFBNUIsQ0FBK0JhLEVBQS9CLENBQWtDQyxJQUFsQztBQUNBakIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDeUMsa0JBQUgsQ0FBc0JULFVBQXZCLENBQU4sQ0FBeUNaLEVBQXpDLENBQTRDYSxFQUE1QyxDQUErQ0MsSUFBL0M7QUFDRCxPQVBNLENBQVA7QUFRRCxLQWpCQyxDQUFGO0FBbUJBdkIsSUFBQUEsRUFBRSxDQUFDLHNCQUFELEVBQTBCK0IsSUFBRCxJQUFVO0FBQ25DMUMsTUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVVlLE9BQVYsQ0FBa0JDLE9BQWxCLENBQTBCQyxPQUFPLENBQUNDLE9BQVIsRUFBMUI7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQ3FDLGdCQUFILENBQW9CZCxPQUFwQixDQUE0QkMsT0FBTyxDQUFDQyxPQUFSLEVBQTVCO0FBQ0F6QixNQUFBQSxFQUFFLENBQUNzQyxpQkFBSCxDQUFxQmYsT0FBckIsQ0FBNkJDLE9BQU8sQ0FBQ0MsT0FBUixFQUE3QjtBQUNBekIsTUFBQUEsRUFBRSxDQUFDdUMsUUFBSCxDQUFZaEIsT0FBWixDQUFvQkMsT0FBTyxDQUFDQyxPQUFSLEVBQXBCO0FBQ0F6QixNQUFBQSxFQUFFLENBQUN3QyxLQUFILENBQVNHLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixFQUFoQjtBQUVBaEIsTUFBQUEsVUFBVSxDQUFDLE1BQU01QixFQUFFLENBQUNPLE1BQUgsQ0FBVXNCLE9BQVYsRUFBUCxFQUE0QixDQUE1QixDQUFWO0FBQ0E3QixNQUFBQSxFQUFFLENBQUNzQixPQUFILEdBQWF1QixLQUFiLENBQW9CQyxHQUFELElBQVM7QUFDMUI3QixRQUFBQSxNQUFNLENBQUM2QixHQUFELENBQU4sQ0FBWTFCLEVBQVosQ0FBZTJCLEtBQWY7QUFFQTlCLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ08sTUFBSCxDQUFVZSxPQUFWLENBQWtCVSxVQUFuQixDQUFOLENBQXFDWixFQUFyQyxDQUF3Q2EsRUFBeEMsQ0FBMkNDLElBQTNDO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNPLE1BQUgsQ0FBVXlDLEtBQVYsQ0FBZ0JoQixVQUFqQixDQUFOLENBQW1DWixFQUFuQyxDQUFzQ2EsRUFBdEMsQ0FBeUNDLElBQXpDO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNxQyxnQkFBSCxDQUFvQkwsVUFBckIsQ0FBTixDQUF1Q1osRUFBdkMsQ0FBMENhLEVBQTFDLENBQTZDQyxJQUE3QztBQUNBakIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0MsaUJBQUgsQ0FBcUJOLFVBQXRCLENBQU4sQ0FBd0NaLEVBQXhDLENBQTJDYSxFQUEzQyxDQUE4Q0MsSUFBOUM7QUFDQWpCLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3VDLFFBQUgsQ0FBWVAsVUFBYixDQUFOLENBQStCWixFQUEvQixDQUFrQ2EsRUFBbEMsQ0FBcUNDLElBQXJDO0FBQ0FqQixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUN3QyxLQUFILENBQVNSLFVBQVYsQ0FBTixDQUE0QlosRUFBNUIsQ0FBK0JhLEVBQS9CLENBQWtDQyxJQUFsQztBQUVBakIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDeUMsa0JBQUgsQ0FBc0JRLE1BQXZCLENBQU4sQ0FBcUM3QixFQUFyQyxDQUF3Q2EsRUFBeEMsQ0FBMkNpQixLQUEzQztBQUVBUixRQUFBQSxJQUFJO0FBQ0wsT0FiRDtBQWNELEtBdEJDLENBQUY7QUF3QkEvQixJQUFBQSxFQUFFLENBQUMsZ0JBQUQsRUFBb0IrQixJQUFELElBQVU7QUFDN0IxQyxNQUFBQSxFQUFFLENBQUNPLE1BQUgsQ0FBVWUsT0FBVixDQUFrQkMsT0FBbEIsQ0FBMEJDLE9BQU8sQ0FBQ0MsT0FBUixFQUExQjtBQUNBekIsTUFBQUEsRUFBRSxDQUFDbUQsaUJBQUgsR0FBdUIsQ0FBdkI7QUFFQW5ELE1BQUFBLEVBQUUsQ0FBQ3NCLE9BQUgsR0FBYXVCLEtBQWIsQ0FBb0JDLEdBQUQsSUFBUztBQUMxQjdCLFFBQUFBLE1BQU0sQ0FBQzZCLEdBQUQsQ0FBTixDQUFZMUIsRUFBWixDQUFlMkIsS0FBZjtBQUVBOUIsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDTyxNQUFILENBQVVlLE9BQVYsQ0FBa0JVLFVBQW5CLENBQU4sQ0FBcUNaLEVBQXJDLENBQXdDYSxFQUF4QyxDQUEyQ0MsSUFBM0M7QUFDQWpCLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ08sTUFBSCxDQUFVeUMsS0FBVixDQUFnQmhCLFVBQWpCLENBQU4sQ0FBbUNaLEVBQW5DLENBQXNDYSxFQUF0QyxDQUF5Q0MsSUFBekM7QUFFQWpCLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3FDLGdCQUFILENBQW9CWSxNQUFyQixDQUFOLENBQW1DN0IsRUFBbkMsQ0FBc0NhLEVBQXRDLENBQXlDaUIsS0FBekM7QUFDQWpDLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NDLGlCQUFILENBQXFCVyxNQUF0QixDQUFOLENBQW9DN0IsRUFBcEMsQ0FBdUNhLEVBQXZDLENBQTBDaUIsS0FBMUM7QUFDQWpDLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3VDLFFBQUgsQ0FBWVUsTUFBYixDQUFOLENBQTJCN0IsRUFBM0IsQ0FBOEJhLEVBQTlCLENBQWlDaUIsS0FBakM7QUFDQWpDLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3dDLEtBQUgsQ0FBU1MsTUFBVixDQUFOLENBQXdCN0IsRUFBeEIsQ0FBMkJhLEVBQTNCLENBQThCaUIsS0FBOUI7QUFDQWpDLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3lDLGtCQUFILENBQXNCUSxNQUF2QixDQUFOLENBQXFDN0IsRUFBckMsQ0FBd0NhLEVBQXhDLENBQTJDaUIsS0FBM0M7QUFFQVIsUUFBQUEsSUFBSTtBQUNMLE9BYkQ7QUFjRCxLQWxCQyxDQUFGO0FBbUJELEdBekVPLENBQVI7QUEyRUEzQyxFQUFBQSxRQUFRLENBQUMsUUFBRCxFQUFXLE1BQU07QUFDdkJZLElBQUFBLEVBQUUsQ0FBQyxvQkFBRCxFQUF1QixNQUFNO0FBQzdCQyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBRSxDQUFDTyxNQUFkLEVBQXNCLE9BQXRCLEVBQStCZ0IsT0FBL0IsQ0FBdUNDLE9BQU8sQ0FBQ0MsT0FBUixFQUF2QztBQUVBLGFBQU96QixFQUFFLENBQUNnRCxLQUFILEdBQVdqQixJQUFYLENBQWdCLE1BQU07QUFDM0JkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ29ELE1BQUosQ0FBTixDQUFrQmhDLEVBQWxCLENBQXFCQyxLQUFyQixDQUEyQmdDLG9CQUEzQjtBQUNBcEMsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDTyxNQUFILENBQVV5QyxLQUFWLENBQWdCaEIsVUFBakIsQ0FBTixDQUFtQ1osRUFBbkMsQ0FBc0NhLEVBQXRDLENBQXlDQyxJQUF6QztBQUNELE9BSE0sQ0FBUDtBQUlELEtBUEMsQ0FBRjtBQVFELEdBVE8sQ0FBUjtBQVdBbkMsRUFBQUEsUUFBUSxDQUFDLE9BQUQsRUFBVSxNQUFNO0FBQ3RCRSxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLFdBQWY7QUFDRCxLQUZTLENBQVY7QUFJQVcsSUFBQUEsRUFBRSxDQUFDLDRCQUFELEVBQStCLE1BQU07QUFDckNDLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFFLENBQUNPLE1BQWQsRUFBc0IsZ0JBQXRCLEVBQXdDZ0IsT0FBeEMsQ0FBZ0RDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixFQUFoQixDQUFoRDtBQUNBLGFBQU96QixFQUFFLENBQUNzRCxJQUFILENBQVEsTUFBUixFQUFnQnZCLElBQWhCLENBQXNCd0IsR0FBRCxJQUFTO0FBQ25DdEMsUUFBQUEsTUFBTSxDQUFDc0MsR0FBRCxDQUFOLENBQVluQyxFQUFaLENBQWVvQyxJQUFmLENBQW9CbkMsS0FBcEIsQ0FBMEIsRUFBMUI7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDTyxNQUFILENBQVVtQixjQUFWLENBQXlCK0IsSUFBekIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsQ0FBRCxDQUFOLENBQTRDckMsRUFBNUMsQ0FBK0NDLEtBQS9DLENBQXFELE1BQXJEO0FBQ0QsT0FITSxDQUFQO0FBSUQsS0FOQyxDQUFGO0FBUUFWLElBQUFBLEVBQUUsQ0FBQyx3Q0FBRCxFQUEyQyxNQUFNO0FBQ2pEQyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBRSxDQUFDTyxNQUFkLEVBQXNCLGdCQUF0QixFQUF3Q2dCLE9BQXhDLENBQWdEQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDOURFLFFBQUFBLFVBQVUsRUFBRSxDQUFDLEdBQUQsRUFBTSxHQUFOO0FBRGtELE9BQWhCLENBQWhEO0FBR0EsYUFBTzNCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUSxNQUFSLEVBQWdCdkIsSUFBaEIsQ0FBc0J3QixHQUFELElBQVM7QUFDbkN0QyxRQUFBQSxNQUFNLENBQUNzQyxHQUFELENBQU4sQ0FBWW5DLEVBQVosQ0FBZW9DLElBQWYsQ0FBb0JuQyxLQUFwQixDQUEwQjtBQUN4Qk0sVUFBQUEsVUFBVSxFQUFFLENBQUMsR0FBRCxFQUFNLEdBQU47QUFEWSxTQUExQjtBQUdBVixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNtQyxXQUFKLENBQU4sQ0FBdUJmLEVBQXZCLENBQTBCb0MsSUFBMUIsQ0FBK0JuQyxLQUEvQixDQUFxQyxDQUFDLEdBQUQsRUFBTSxHQUFOLENBQXJDO0FBQ0QsT0FMTSxDQUFQO0FBTUQsS0FWQyxDQUFGO0FBV0QsR0F4Qk8sQ0FBUjtBQTBCQXRCLEVBQUFBLFFBQVEsQ0FBQyxZQUFELEVBQWUsTUFBTTtBQUMzQlksSUFBQUEsRUFBRSxDQUFDLHFEQUFELEVBQXlEK0IsSUFBRCxJQUFVO0FBQ2xFOUIsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmLEVBQXVCMEQsU0FBdkIsQ0FBa0NDLE9BQUQsSUFBYTtBQUM1QzFDLFFBQUFBLE1BQU0sQ0FBQzBDLE9BQUQsQ0FBTixDQUFnQnZDLEVBQWhCLENBQW1CQyxLQUFuQixDQUF5QixNQUF6QjtBQUVBcUIsUUFBQUEsSUFBSTtBQUNMLE9BSkQ7QUFNQTFDLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsRUFBakI7QUFDQW5DLE1BQUFBLEVBQUUsQ0FBQzRELGdCQUFILEdBQXNCLEtBQXRCO0FBQ0E1RCxNQUFBQSxFQUFFLENBQUM2RCxXQUFILEdBQWlCLENBQWpCO0FBQ0E3RCxNQUFBQSxFQUFFLENBQUNrQixTQUFIO0FBQ0QsS0FYQyxDQUFGO0FBYUFQLElBQUFBLEVBQUUsQ0FBQyxzREFBRCxFQUEwRCtCLElBQUQsSUFBVTtBQUNuRTlCLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZixFQUF1QjBELFNBQXZCLENBQWtDQyxPQUFELElBQWE7QUFDNUMxQyxRQUFBQSxNQUFNLENBQUMwQyxPQUFELENBQU4sQ0FBZ0J2QyxFQUFoQixDQUFtQkMsS0FBbkIsQ0FBeUIsTUFBekI7QUFFQXFCLFFBQUFBLElBQUk7QUFDTCxPQUpEO0FBTUExQyxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsTUFBRCxDQUFqQjtBQUNBbkMsTUFBQUEsRUFBRSxDQUFDNEQsZ0JBQUgsR0FBc0JFLFNBQXRCO0FBQ0E5RCxNQUFBQSxFQUFFLENBQUM2RCxXQUFILEdBQWlCLENBQWpCO0FBQ0E3RCxNQUFBQSxFQUFFLENBQUNrQixTQUFIO0FBQ0QsS0FYQyxDQUFGO0FBYUFQLElBQUFBLEVBQUUsQ0FBQyxpQ0FBRCxFQUFxQytCLElBQUQsSUFBVTtBQUM5QzlCLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFFLENBQUNPLE1BQWQsRUFBc0IsZ0JBQXRCO0FBQ0FLLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFFLENBQUNPLE1BQUgsQ0FBVUMsTUFBckIsRUFBNkIsTUFBN0IsRUFBcUNrRCxTQUFyQyxDQUFnREssT0FBRCxJQUFhO0FBQzFEOUMsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDTyxNQUFILENBQVVtQixjQUFWLENBQXlCK0IsSUFBekIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0NFLE9BQXJDLENBQU4sQ0FBb0R2QyxFQUFwRCxDQUF1REMsS0FBdkQsQ0FBNkQsTUFBN0Q7QUFDQUosUUFBQUEsTUFBTSxDQUFDLEdBQUcrQyxLQUFILENBQVNDLElBQVQsQ0FBYyxJQUFJQyxVQUFKLENBQWVILE9BQWYsQ0FBZCxDQUFELENBQU4sQ0FBK0MzQyxFQUEvQyxDQUFrRG9DLElBQWxELENBQXVEbkMsS0FBdkQsQ0FBNkQsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsSUFBbkIsRUFBeUIsSUFBekIsRUFBK0IsSUFBL0IsQ0FBN0Q7QUFFQXFCLFFBQUFBLElBQUk7QUFDTCxPQUxEO0FBT0ExQyxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsTUFBRCxDQUFqQjtBQUNBbkMsTUFBQUEsRUFBRSxDQUFDNEQsZ0JBQUgsR0FBc0IsS0FBdEI7QUFDQTVELE1BQUFBLEVBQUUsQ0FBQ21FLFdBQUgsR0FBaUIsQ0FBakI7QUFDQW5FLE1BQUFBLEVBQUUsQ0FBQ2tCLFNBQUg7QUFDRCxLQWJDLENBQUY7QUFjRCxHQXpDTyxDQUFSO0FBMkNBbkIsRUFBQUEsUUFBUSxDQUFDLFlBQUQsRUFBZSxNQUFNO0FBQzNCWSxJQUFBQSxFQUFFLENBQUMsNEJBQUQsRUFBK0IsTUFBTTtBQUNyQ0MsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQUUsQ0FBQ08sTUFBSCxDQUFVQyxNQUFyQixFQUE2QixNQUE3QjtBQUVBUixNQUFBQSxFQUFFLENBQUNlLFlBQUgsR0FBa0IsTUFBbEI7QUFDQWYsTUFBQUEsRUFBRSxDQUFDb0UsU0FBSDtBQUNBbkQsTUFBQUEsTUFBTSxDQUFDLEdBQUcrQyxLQUFILENBQVNDLElBQVQsQ0FBYyxJQUFJQyxVQUFKLENBQWVsRSxFQUFFLENBQUNPLE1BQUgsQ0FBVUMsTUFBVixDQUFpQkMsSUFBakIsQ0FBc0JnRCxJQUF0QixDQUEyQixDQUEzQixFQUE4QixDQUE5QixDQUFmLENBQWQsQ0FBRCxDQUFOLENBQXdFckMsRUFBeEUsQ0FBMkVvQyxJQUEzRSxDQUFnRm5DLEtBQWhGLENBQXNGLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLENBQXRGO0FBQ0QsS0FOQyxDQUFGO0FBT0QsR0FSTyxDQUFSO0FBVUF0QixFQUFBQSxRQUFRLENBQUMsb0JBQUQsRUFBdUIsTUFBTTtBQUNuQ1ksSUFBQUEsRUFBRSxDQUFDLHNDQUFELEVBQXlDLE1BQU07QUFDL0NYLE1BQUFBLEVBQUUsQ0FBQ08sTUFBSCxDQUFVOEQsVUFBVixHQUF1QixJQUF2QjtBQUNBckUsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixDQUFDLFVBQUQsQ0FBakI7QUFDQSxhQUFPbkMsRUFBRSxDQUFDc0MsaUJBQUgsRUFBUDtBQUNELEtBSkMsQ0FBRjtBQU1BM0IsSUFBQUEsRUFBRSxDQUFDLDZDQUFELEVBQWdELE1BQU07QUFDdERYLE1BQUFBLEVBQUUsQ0FBQ08sTUFBSCxDQUFVOEQsVUFBVixHQUF1QixLQUF2QjtBQUNBckUsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixFQUFqQjtBQUNBLGFBQU9uQyxFQUFFLENBQUNzQyxpQkFBSCxFQUFQO0FBQ0QsS0FKQyxDQUFGO0FBTUEzQixJQUFBQSxFQUFFLENBQUMscUJBQUQsRUFBd0IsTUFBTTtBQUM5QkMsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQUUsQ0FBQ08sTUFBZCxFQUFzQixTQUF0QjtBQUNBSyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWYsRUFBdUJzRSxRQUF2QixDQUFnQyxVQUFoQyxFQUE0Qy9DLE9BQTVDLENBQW9EQyxPQUFPLENBQUNDLE9BQVIsRUFBcEQ7QUFDQWIsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxrQkFBZixFQUFtQ3VCLE9BQW5DLENBQTJDQyxPQUFPLENBQUNDLE9BQVIsRUFBM0M7QUFFQXpCLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsQ0FBQyxVQUFELENBQWpCO0FBRUEsYUFBT25DLEVBQUUsQ0FBQ3NDLGlCQUFILEdBQXVCUCxJQUF2QixDQUE0QixNQUFNO0FBQ3ZDZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNPLE1BQUgsQ0FBVWdFLE9BQVYsQ0FBa0JwRCxTQUFuQixDQUFOLENBQW9DQyxFQUFwQyxDQUF1Q0MsS0FBdkMsQ0FBNkMsQ0FBN0M7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDbUMsV0FBSCxDQUFlQyxNQUFoQixDQUFOLENBQThCaEIsRUFBOUIsQ0FBaUNDLEtBQWpDLENBQXVDLENBQXZDO0FBQ0QsT0FITSxDQUFQO0FBSUQsS0FYQyxDQUFGO0FBWUQsR0F6Qk8sQ0FBUjtBQTJCQXRCLEVBQUFBLFFBQVEsQ0FBQyxtQkFBRCxFQUFzQixNQUFNO0FBQ2xDRSxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDRCxLQUZTLENBQVY7QUFJQVcsSUFBQUEsRUFBRSxDQUFDLHdDQUFELEVBQTJDLE1BQU07QUFDakRYLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsQ0FBQyxLQUFELENBQWpCO0FBQ0EsYUFBT25DLEVBQUUsQ0FBQ3FDLGdCQUFILEVBQVA7QUFDRCxLQUhDLENBQUY7QUFLQTFCLElBQUFBLEVBQUUsQ0FBQyw2Q0FBRCxFQUFnRCxNQUFNO0FBQ3REWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVEvQixPQUFSLENBQWdCQyxPQUFPLENBQUNDLE9BQVIsRUFBaEI7QUFFQXpCLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsRUFBakI7QUFFQSxhQUFPbkMsRUFBRSxDQUFDcUMsZ0JBQUgsR0FBc0JOLElBQXRCLENBQTJCLE1BQU07QUFDdENkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUUcsSUFBUixDQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBRCxDQUFOLENBQTJCckMsRUFBM0IsQ0FBOEJDLEtBQTlCLENBQW9DLFlBQXBDO0FBQ0QsT0FGTSxDQUFQO0FBR0QsS0FSQyxDQUFGO0FBVUFWLElBQUFBLEVBQUUsQ0FBQyw2QkFBRCxFQUFnQyxNQUFNO0FBQ3RDWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVEvQixPQUFSLENBQWdCQyxPQUFPLENBQUNDLE9BQVIsRUFBaEI7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsQ0FBQyxLQUFELENBQWpCO0FBRUEsYUFBT25DLEVBQUUsQ0FBQ3FDLGdCQUFILENBQW9CLElBQXBCLEVBQTBCTixJQUExQixDQUErQixNQUFNO0FBQzFDZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFHLElBQVIsQ0FBYSxDQUFiLEVBQWdCLENBQWhCLENBQUQsQ0FBTixDQUEyQnJDLEVBQTNCLENBQThCQyxLQUE5QixDQUFvQyxZQUFwQztBQUNELE9BRk0sQ0FBUDtBQUdELEtBUEMsQ0FBRjtBQVNBVixJQUFBQSxFQUFFLENBQUMscURBQUQsRUFBd0QsTUFBTTtBQUM5RFgsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixFQUFqQjtBQUNBbkMsTUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVU4RCxVQUFWLEdBQXVCLEtBQXZCO0FBQ0FyRSxNQUFBQSxFQUFFLENBQUN3RSxXQUFILEdBQWlCLElBQWpCO0FBRUF4RSxNQUFBQSxFQUFFLENBQUNxQyxnQkFBSDtBQUNELEtBTkMsQ0FBRjtBQU9ELEdBcENPLENBQVI7QUFzQ0F0QyxFQUFBQSxRQUFRLENBQUMsaUJBQUQsRUFBb0IsTUFBTTtBQUNoQ0UsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0QsS0FGUyxDQUFWO0FBSUFXLElBQUFBLEVBQUUsQ0FBQyxtQ0FBRCxFQUFzQyxNQUFNO0FBQzVDWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVEvQixPQUFSLENBQWdCQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDOUJzQyxRQUFBQSxPQUFPLEVBQUU7QUFDUFUsVUFBQUEsU0FBUyxFQUFFLENBQUM7QUFDVkMsWUFBQUEsVUFBVSxFQUFFLENBQ1YsQ0FDRSxDQUFDO0FBQ0NDLGNBQUFBLElBQUksRUFBRSxRQURQO0FBRUNDLGNBQUFBLEtBQUssRUFBRTtBQUZSLGFBQUQsRUFHRztBQUNERCxjQUFBQSxJQUFJLEVBQUUsUUFETDtBQUVEQyxjQUFBQSxLQUFLLEVBQUU7QUFGTixhQUhILENBREYsQ0FEVSxFQVNQLElBVE8sRUFTRCxJQVRDO0FBREYsV0FBRDtBQURKO0FBRHFCLE9BQWhCLENBQWhCO0FBaUJBNUUsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixDQUFDLFdBQUQsQ0FBakI7QUFFQSxhQUFPbkMsRUFBRSxDQUFDNkUsY0FBSCxHQUFvQjlDLElBQXBCLENBQTBCK0MsVUFBRCxJQUFnQjtBQUM5QzdELFFBQUFBLE1BQU0sQ0FBQzZELFVBQUQsQ0FBTixDQUFtQjFELEVBQW5CLENBQXNCb0MsSUFBdEIsQ0FBMkJuQyxLQUEzQixDQUFpQztBQUMvQjBELFVBQUFBLFFBQVEsRUFBRSxDQUFDO0FBQ1RDLFlBQUFBLE1BQU0sRUFBRSxRQURDO0FBRVRDLFlBQUFBLFNBQVMsRUFBRTtBQUZGLFdBQUQsQ0FEcUI7QUFLL0JDLFVBQUFBLEtBQUssRUFBRSxLQUx3QjtBQU0vQkMsVUFBQUEsTUFBTSxFQUFFO0FBTnVCLFNBQWpDO0FBUUFsRSxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFHLElBQVIsQ0FBYSxDQUFiLEVBQWdCLENBQWhCLENBQUQsQ0FBTixDQUEyQnJDLEVBQTNCLENBQThCQyxLQUE5QixDQUFvQyxXQUFwQztBQUNBSixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFHLElBQVIsQ0FBYSxDQUFiLEVBQWdCLENBQWhCLENBQUQsQ0FBTixDQUEyQnJDLEVBQTNCLENBQThCQyxLQUE5QixDQUFvQyxXQUFwQztBQUNELE9BWE0sQ0FBUDtBQVlELEtBaENDLENBQUY7QUFrQ0FWLElBQUFBLEVBQUUsQ0FBQyxvQ0FBRCxFQUF1QyxNQUFNO0FBQzdDWCxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLEVBQWpCO0FBQ0EsYUFBT25DLEVBQUUsQ0FBQzZFLGNBQUgsR0FBb0I5QyxJQUFwQixDQUEwQitDLFVBQUQsSUFBZ0I7QUFDOUM3RCxRQUFBQSxNQUFNLENBQUM2RCxVQUFELENBQU4sQ0FBbUIxRCxFQUFuQixDQUFzQmEsRUFBdEIsQ0FBeUJpQixLQUF6QjtBQUNBakMsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUhNLENBQVA7QUFJRCxLQU5DLENBQUY7QUFPRCxHQTlDTyxDQUFSO0FBZ0RBdEIsRUFBQUEsUUFBUSxDQUFDLHFCQUFELEVBQXdCLE1BQU07QUFDcENFLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBRSxDQUFDTyxNQUFkLEVBQXNCLG1CQUF0QjtBQUNELEtBSFMsQ0FBVjtBQUtBSSxJQUFBQSxFQUFFLENBQUMsMENBQUQsRUFBNkMsTUFBTTtBQUNuRFgsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsVUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FBQztBQUNYQyxVQUFBQSxJQUFJLEVBQUUsTUFESztBQUVYQyxVQUFBQSxLQUFLLEVBQUU7QUFGSSxTQUFEO0FBRkcsT0FBakIsRUFNR3JELE9BTkgsQ0FNV0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLENBTlg7QUFRQXpCLE1BQUFBLEVBQUUsQ0FBQ29GLGtCQUFILEdBQXdCLElBQXhCO0FBQ0FwRixNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsa0JBQUQsQ0FBakI7QUFDQSxhQUFPbkMsRUFBRSxDQUFDeUMsa0JBQUgsR0FBd0JWLElBQXhCLENBQTZCLE1BQU07QUFDeENkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ08sTUFBSCxDQUFVOEUsaUJBQVYsQ0FBNEJsRSxTQUE3QixDQUFOLENBQThDQyxFQUE5QyxDQUFpREMsS0FBakQsQ0FBdUQsQ0FBdkQ7QUFDRCxPQUhNLENBQVA7QUFJRCxLQWZDLENBQUY7QUFpQkFWLElBQUFBLEVBQUUsQ0FBQyxvQ0FBRCxFQUF1QyxNQUFNO0FBQzdDWCxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLEVBQWpCO0FBRUEsYUFBT25DLEVBQUUsQ0FBQ3lDLGtCQUFILEdBQXdCVixJQUF4QixDQUE2QixNQUFNO0FBQ3hDZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFuQyxTQUFULENBQU4sQ0FBMEJDLEVBQTFCLENBQTZCQyxLQUE3QixDQUFtQyxDQUFuQztBQUNELE9BRk0sQ0FBUDtBQUdELEtBTkMsQ0FBRjtBQVFBVixJQUFBQSxFQUFFLENBQUMsa0NBQUQsRUFBcUMsTUFBTTtBQUMzQ1gsTUFBQUEsRUFBRSxDQUFDb0Ysa0JBQUgsR0FBd0IsS0FBeEI7QUFDQXBGLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsQ0FBQyxrQkFBRCxDQUFqQjtBQUVBLGFBQU9uQyxFQUFFLENBQUN5QyxrQkFBSCxHQUF3QlYsSUFBeEIsQ0FBNkIsTUFBTTtBQUN4Q2QsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUZNLENBQVA7QUFHRCxLQVBDLENBQUY7QUFRRCxHQXZDTyxDQUFSO0FBeUNBdEIsRUFBQUEsUUFBUSxDQUFDLFFBQUQsRUFBVyxNQUFNO0FBQ3ZCWSxJQUFBQSxFQUFFLENBQUMsbUJBQUQsRUFBc0IsTUFBTTtBQUM1QkMsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmLEVBQXVCdUIsT0FBdkIsQ0FBK0JDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixFQUFoQixDQUEvQjtBQUNBYixNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLGtCQUFmLEVBQW1DdUIsT0FBbkMsQ0FBMkNDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixJQUFoQixDQUEzQztBQUVBLGFBQU96QixFQUFFLENBQUN3QyxLQUFILENBQVM7QUFDZHJDLFFBQUFBLElBQUksRUFBRSxJQURRO0FBRWRDLFFBQUFBLElBQUksRUFBRTtBQUZRLE9BQVQsRUFHSjJCLElBSEksQ0FHQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUUcsSUFBUixDQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBRCxDQUFOLENBQTJCckMsRUFBM0IsQ0FBOEJvQyxJQUE5QixDQUFtQ25DLEtBQW5DLENBQXlDO0FBQ3ZDc0MsVUFBQUEsT0FBTyxFQUFFLE9BRDhCO0FBRXZDZSxVQUFBQSxVQUFVLEVBQUUsQ0FBQztBQUNYQyxZQUFBQSxJQUFJLEVBQUUsUUFESztBQUVYQyxZQUFBQSxLQUFLLEVBQUU7QUFGSSxXQUFELEVBR1Q7QUFDREQsWUFBQUEsSUFBSSxFQUFFLFFBREw7QUFFREMsWUFBQUEsS0FBSyxFQUFFLElBRk47QUFHRFUsWUFBQUEsU0FBUyxFQUFFO0FBSFYsV0FIUztBQUYyQixTQUF6QztBQVdELE9BaEJNLENBQVA7QUFpQkQsS0FyQkMsQ0FBRjtBQXVCQTNFLElBQUFBLEVBQUUsQ0FBQyxxQkFBRCxFQUF3QixNQUFNO0FBQzlCQyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWYsRUFBdUJ1QixPQUF2QixDQUErQkMsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLENBQS9CO0FBQ0FiLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsa0JBQWYsRUFBbUN1QixPQUFuQyxDQUEyQ0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLENBQTNDO0FBRUF6QixNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsY0FBRCxDQUFqQjtBQUNBbkMsTUFBQUEsRUFBRSxDQUFDd0MsS0FBSCxDQUFTO0FBQ1ByQyxRQUFBQSxJQUFJLEVBQUUsSUFEQztBQUVQb0YsUUFBQUEsT0FBTyxFQUFFO0FBRkYsT0FBVCxFQUdHeEQsSUFISCxDQUdRLE1BQU07QUFDWmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRRyxJQUFSLENBQWEsQ0FBYixFQUFnQixDQUFoQixDQUFELENBQU4sQ0FBMkJyQyxFQUEzQixDQUE4Qm9DLElBQTlCLENBQW1DbkMsS0FBbkMsQ0FBeUM7QUFDdkNzQyxVQUFBQSxPQUFPLEVBQUUsY0FEOEI7QUFFdkNlLFVBQUFBLFVBQVUsRUFBRSxDQUFDO0FBQ1hDLFlBQUFBLElBQUksRUFBRSxNQURLO0FBRVhDLFlBQUFBLEtBQUssRUFBRTtBQUZJLFdBQUQsRUFHVDtBQUNERCxZQUFBQSxJQUFJLEVBQUUsTUFETDtBQUVEQyxZQUFBQSxLQUFLLEVBQUUsc0NBRk47QUFHRFUsWUFBQUEsU0FBUyxFQUFFO0FBSFYsV0FIUztBQUYyQixTQUF6QztBQVdELE9BaEJEO0FBaUJELEtBdEJDLENBQUY7QUF1QkQsR0EvQ08sQ0FBUjtBQWlEQXZGLEVBQUFBLFFBQVEsQ0FBQyxXQUFELEVBQWMsTUFBTTtBQUMxQkUsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0QsS0FGUyxDQUFWO0FBSUFXLElBQUFBLEVBQUUsQ0FBQyxxQ0FBRCxFQUF3QyxNQUFNO0FBQzlDWCxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLEVBQWpCO0FBRUEsYUFBT25DLEVBQUUsQ0FBQ3VDLFFBQUgsQ0FBWTtBQUNqQmlELFFBQUFBLENBQUMsRUFBRSxHQURjO0FBRWpCQyxRQUFBQSxDQUFDLEVBQUU7QUFGYyxPQUFaLEVBR0oxRCxJQUhJLENBR0MsTUFBTTtBQUNaZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUMwRixRQUFKLENBQU4sQ0FBb0J0RSxFQUFwQixDQUF1QmEsRUFBdkIsQ0FBMEJpQixLQUExQjtBQUNELE9BTE0sQ0FBUDtBQU1ELEtBVEMsQ0FBRjtBQVdBdkMsSUFBQUEsRUFBRSxDQUFDLGlCQUFELEVBQW9CLE1BQU07QUFDMUJYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLElBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQ1YsSUFEVTtBQUZHLE9BQWpCLEVBS0duRCxPQUxILENBS1dDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QnNDLFFBQUFBLE9BQU8sRUFBRTtBQUNQNEIsVUFBQUEsRUFBRSxFQUFFLENBQUM7QUFDSGpCLFlBQUFBLFVBQVUsRUFBRSxDQUNWLElBRFU7QUFEVCxXQUFEO0FBREc7QUFEZ0IsT0FBaEIsQ0FMWDtBQWNBMUUsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixDQUFDLElBQUQsQ0FBakI7QUFFQSxhQUFPbkMsRUFBRSxDQUFDdUMsUUFBSCxDQUFZLElBQVosRUFBa0JSLElBQWxCLENBQXVCLE1BQU07QUFDbENkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQzBGLFFBQUosQ0FBTixDQUFvQnRFLEVBQXBCLENBQXVCb0MsSUFBdkIsQ0FBNEJuQyxLQUE1QixDQUFrQyxFQUFsQztBQUNELE9BRk0sQ0FBUDtBQUdELEtBcEJDLENBQUY7QUFzQkFWLElBQUFBLEVBQUUsQ0FBQywwQkFBRCxFQUE2QixNQUFNO0FBQ25DWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxJQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUNWLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEIsT0FBNUIsQ0FEVTtBQUZHLE9BQWpCLEVBS0duRCxPQUxILENBS1dDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QnNDLFFBQUFBLE9BQU8sRUFBRTtBQUNQNEIsVUFBQUEsRUFBRSxFQUFFLENBQUM7QUFDSGpCLFlBQUFBLFVBQVUsRUFBRSxDQUNWLENBQUM7QUFDQ0UsY0FBQUEsS0FBSyxFQUFFO0FBRFIsYUFBRCxFQUVHO0FBQ0RBLGNBQUFBLEtBQUssRUFBRTtBQUROLGFBRkgsRUFJRztBQUNEQSxjQUFBQSxLQUFLLEVBQUU7QUFETixhQUpILEVBTUc7QUFDREEsY0FBQUEsS0FBSyxFQUFFO0FBRE4sYUFOSCxDQURVO0FBRFQsV0FBRDtBQURHO0FBRGdCLE9BQWhCLENBTFg7QUFzQkE1RSxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsSUFBRCxDQUFqQjtBQUVBLGFBQU9uQyxFQUFFLENBQUN1QyxRQUFILENBQVk7QUFDakJxRCxRQUFBQSxLQUFLLEVBQUUsT0FEVTtBQUVqQkMsUUFBQUEsS0FBSyxFQUFFO0FBRlUsT0FBWixFQUdKOUQsSUFISSxDQUdDLE1BQU07QUFDWmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDMEYsUUFBSixDQUFOLENBQW9CdEUsRUFBcEIsQ0FBdUJvQyxJQUF2QixDQUE0Qm5DLEtBQTVCLENBQWtDO0FBQ2hDeUUsVUFBQUEsS0FBSyxFQUFFLE9BRHlCO0FBRWhDQyxVQUFBQSxLQUFLLEVBQUU7QUFGeUIsU0FBbEM7QUFJRCxPQVJNLENBQVA7QUFTRCxLQWxDQyxDQUFGO0FBbUNELEdBekVPLENBQVI7QUEyRUFoRyxFQUFBQSxRQUFRLENBQUMsZ0JBQUQsRUFBbUIsTUFBTTtBQUMvQkUsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0QsS0FGUyxDQUFWO0FBSUFXLElBQUFBLEVBQUUsQ0FBQyx1Q0FBRCxFQUEwQyxNQUFNO0FBQ2hEWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxNQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUFDLEVBQUQsRUFBSyxHQUFMO0FBRkcsT0FBakIsRUFHR25ELE9BSEgsQ0FHV0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCO0FBQ3pCc0MsUUFBQUEsT0FBTyxFQUFFO0FBQ1BpQyxVQUFBQSxJQUFJLEVBQUUsQ0FBQyxLQUFEO0FBREM7QUFEZ0IsT0FBaEIsQ0FIWDtBQVNBaEcsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsTUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FBQyxFQUFELEVBQUssR0FBTDtBQUZHLE9BQWpCLEVBR0duRCxPQUhILENBR1dDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QnNDLFFBQUFBLE9BQU8sRUFBRTtBQUNQa0MsVUFBQUEsSUFBSSxFQUFFLENBQUMsS0FBRDtBQURDO0FBRGdCLE9BQWhCLENBSFg7QUFTQSxhQUFPakcsRUFBRSxDQUFDa0csYUFBSCxHQUFtQm5FLElBQW5CLENBQXlCb0UsSUFBRCxJQUFVO0FBQ3ZDbEYsUUFBQUEsTUFBTSxDQUFDa0YsSUFBRCxDQUFOLENBQWEvRSxFQUFiLENBQWdCMkIsS0FBaEI7QUFDRCxPQUZNLENBQVA7QUFHRCxLQXRCQyxDQUFGO0FBd0JBcEMsSUFBQUEsRUFBRSxDQUFDLGtDQUFELEVBQXFDLE1BQU07QUFDM0NYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLE1BRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQUMsRUFBRCxFQUFLLEdBQUw7QUFGRyxPQUFqQixFQUdHbkQsT0FISCxDQUdXQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDekJzQyxRQUFBQSxPQUFPLEVBQUU7QUFDUGlDLFVBQUFBLElBQUksRUFBRSxDQUNKLGdDQUFPLDBCQUFhLG9DQUFiLENBQVAsQ0FESTtBQURDO0FBRGdCLE9BQWhCLENBSFg7QUFXQWhHLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLE1BRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQUMsRUFBRCxFQUFLLEdBQUw7QUFGRyxPQUFqQixFQUdHbkQsT0FISCxDQUdXQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDekJzQyxRQUFBQSxPQUFPLEVBQUU7QUFDUGtDLFVBQUFBLElBQUksRUFBRSxDQUNKLGdDQUFPLDBCQUFhLG9DQUFiLENBQVAsQ0FESTtBQURDO0FBRGdCLE9BQWhCLENBSFg7QUFXQSxhQUFPakcsRUFBRSxDQUFDa0csYUFBSCxHQUFtQm5FLElBQW5CLENBQXlCb0UsSUFBRCxJQUFVO0FBQ3ZDbEYsUUFBQUEsTUFBTSxDQUFDa0YsSUFBRCxDQUFOLENBQWEvRSxFQUFiLENBQWdCMkIsS0FBaEI7QUFDRCxPQUZNLENBQVA7QUFHRCxLQTFCQyxDQUFGO0FBMkJELEdBeERPLENBQVI7QUEwREFoRCxFQUFBQSxRQUFRLENBQUMsZ0JBQUQsRUFBbUIsTUFBTTtBQUMvQkUsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0QsS0FGUyxDQUFWO0FBSUFXLElBQUFBLEVBQUUsQ0FBQywwQ0FBRCxFQUE2QyxNQUFNO0FBQ25EO0FBQ0E7QUFDQTtBQUNBWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxRQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUFDLGFBQUQ7QUFGRyxPQUFqQixFQUdHbkQsT0FISCxDQUdXQyxPQUFPLENBQUNDLE9BQVIsRUFIWDtBQUtBLGFBQU96QixFQUFFLENBQUNvRyxhQUFILENBQWlCLGFBQWpCLEVBQWdDckUsSUFBaEMsQ0FBcUMsTUFBTTtBQUNoRGQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUZNLENBQVA7QUFHRCxLQVpDLENBQUY7QUFjQVYsSUFBQUEsRUFBRSxDQUFDLHVDQUFELEVBQTBDLE1BQU07QUFDaEQ7QUFDQVgsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsUUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FBQyxpQ0FBRDtBQUZHLE9BQWpCLEVBR0duRCxPQUhILENBR1dDLE9BQU8sQ0FBQ0MsT0FBUixFQUhYO0FBS0EsYUFBT3pCLEVBQUUsQ0FBQ29HLGFBQUgsQ0FBaUIsNkNBQWpCLEVBQWdFckUsSUFBaEUsQ0FBcUUsTUFBTTtBQUNoRmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUZNLENBQVA7QUFHRCxLQVZDLENBQUY7QUFZQVYsSUFBQUEsRUFBRSxDQUFDLG1EQUFELEVBQXNELE1BQU07QUFDNUQsVUFBSTBGLE9BQU8sR0FBRztBQUNaQyxRQUFBQSxJQUFJLEVBQUU7QUFETSxPQUFkO0FBR0F0RyxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxRQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUFDLGFBQUQ7QUFGRyxPQUFqQixFQUdHbkQsT0FISCxDQUdXQyxPQUFPLENBQUMrRSxNQUFSLENBQWVGLE9BQWYsQ0FIWDtBQUtBLGFBQU9yRyxFQUFFLENBQUNvRyxhQUFILENBQWlCLGFBQWpCLEVBQWdDckUsSUFBaEMsQ0FBcUMsTUFBTTtBQUNoRGQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUZNLENBQVA7QUFHRCxLQVpDLENBQUY7QUFhRCxHQTVDTyxDQUFSO0FBOENBdEIsRUFBQUEsUUFBUSxDQUFDLGdCQUFELEVBQW1CLE1BQU07QUFDL0JFLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZjtBQUNELEtBRlMsQ0FBVjtBQUlBVyxJQUFBQSxFQUFFLENBQUMsMENBQUQsRUFBNkMsTUFBTTtBQUNuRFgsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsUUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FBQyxhQUFEO0FBRkcsT0FBakIsRUFHR25ELE9BSEgsQ0FHV0MsT0FBTyxDQUFDQyxPQUFSLEVBSFg7QUFLQSxhQUFPekIsRUFBRSxDQUFDd0csYUFBSCxDQUFpQixhQUFqQixFQUFnQ3pFLElBQWhDLENBQXFDLE1BQU07QUFDaERkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0QsT0FGTSxDQUFQO0FBR0QsS0FUQyxDQUFGO0FBV0FWLElBQUFBLEVBQUUsQ0FBQyx1Q0FBRCxFQUEwQyxNQUFNO0FBQ2hEO0FBQ0FYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLFFBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQUMsaUNBQUQ7QUFGRyxPQUFqQixFQUdHbkQsT0FISCxDQUdXQyxPQUFPLENBQUNDLE9BQVIsRUFIWDtBQUtBLGFBQU96QixFQUFFLENBQUN3RyxhQUFILENBQWlCLDZDQUFqQixFQUFnRXpFLElBQWhFLENBQXFFLE1BQU07QUFDaEZkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0QsT0FGTSxDQUFQO0FBR0QsS0FWQyxDQUFGO0FBV0QsR0EzQk8sQ0FBUjtBQTZCQXRCLEVBQUFBLFFBQVEsQ0FBQzBHLElBQVQsQ0FBYyxlQUFkLEVBQStCLE1BQU07QUFDbkN4RyxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxvQkFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLGFBQWY7QUFDRCxLQUpTLENBQVY7QUFNQVcsSUFBQUEsRUFBRSxDQUFDLG1CQUFELEVBQXNCLE1BQU07QUFDNUJYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUS9CLE9BQVIsQ0FBZ0JDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQUFoQjs7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQzBHLGtCQUFILENBQXNCcEMsUUFBdEIsQ0FBK0IsQ0FBQyxLQUFELEVBQVEsQ0FBQyxLQUFELEVBQVEsT0FBUixDQUFSLEVBQTBCO0FBQ3ZEcUMsUUFBQUEsS0FBSyxFQUFFO0FBRGdELE9BQTFCLENBQS9CLEVBRUlwRixPQUZKLENBRVksRUFGWjs7QUFJQSxhQUFPdkIsRUFBRSxDQUFDNEcsWUFBSCxDQUFnQixPQUFoQixFQUF5QixLQUF6QixFQUFnQyxDQUFDLEtBQUQsRUFBUSxPQUFSLENBQWhDLEVBQWtEO0FBQ3ZERCxRQUFBQSxLQUFLLEVBQUU7QUFEZ0QsT0FBbEQsRUFFSjVFLElBRkksQ0FFQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQzBHLGtCQUFILENBQXNCdkYsU0FBdkIsQ0FBTixDQUF3Q0MsRUFBeEMsQ0FBMkNDLEtBQTNDLENBQWlELENBQWpEO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQzZHLFdBQUgsQ0FBZXZDLFFBQWYsQ0FBd0IsS0FBeEIsRUFBK0JuRCxTQUFoQyxDQUFOLENBQWlEQyxFQUFqRCxDQUFvREMsS0FBcEQsQ0FBMEQsQ0FBMUQ7QUFDRCxPQUxNLENBQVA7QUFNRCxLQVpDLENBQUY7QUFhRCxHQXBCRDtBQXNCQXRCLEVBQUFBLFFBQVEsQ0FBQzBHLElBQVQsQ0FBYyxTQUFkLEVBQXlCLE1BQU07QUFDN0J4RyxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxxQkFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLGNBQWY7QUFDRCxLQUpTLENBQVY7QUFNQVcsSUFBQUEsRUFBRSxDQUFDLG9CQUFELEVBQXVCLE1BQU07QUFDN0JYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUS9CLE9BQVIsQ0FBZ0JDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQUFoQjs7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQzhHLG1CQUFILENBQXVCeEMsUUFBdkIsQ0FBZ0M7QUFDOUJ5QyxRQUFBQSxHQUFHLEVBQUU7QUFEeUIsT0FBaEMsRUFFRztBQUNESixRQUFBQSxLQUFLLEVBQUU7QUFETixPQUZILEVBSUdwRixPQUpILENBSVcsRUFKWDs7QUFNQSxhQUFPdkIsRUFBRSxDQUFDZ0gsTUFBSCxDQUFVLE9BQVYsRUFBbUI7QUFDeEJELFFBQUFBLEdBQUcsRUFBRTtBQURtQixPQUFuQixFQUVKO0FBQ0RKLFFBQUFBLEtBQUssRUFBRTtBQUROLE9BRkksRUFJSjVFLElBSkksQ0FJQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQzhHLG1CQUFILENBQXVCM0YsU0FBeEIsQ0FBTixDQUF5Q0MsRUFBekMsQ0FBNENDLEtBQTVDLENBQWtELENBQWxEO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ2lILFlBQUgsQ0FBZ0IzQyxRQUFoQixDQUF5QixLQUF6QixFQUFnQ25ELFNBQWpDLENBQU4sQ0FBa0RDLEVBQWxELENBQXFEQyxLQUFyRCxDQUEyRCxDQUEzRDtBQUNELE9BUk0sQ0FBUDtBQVNELEtBakJDLENBQUY7QUFrQkQsR0F6QkQ7QUEyQkF0QixFQUFBQSxRQUFRLENBQUMsU0FBRCxFQUFZLE1BQU07QUFDeEJFLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZjtBQUNELEtBRlMsQ0FBVjtBQUlBVyxJQUFBQSxFQUFFLENBQUMscUNBQUQsRUFBd0MsTUFBTTtBQUM5Q1gsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRL0IsT0FBUixDQUFnQkMsT0FBTyxDQUFDQyxPQUFSLEVBQWhCO0FBRUEsYUFBT3pCLEVBQUUsQ0FBQ2tILE1BQUgsQ0FBVSxTQUFWLEVBQXFCLG1CQUFyQixFQUEwQztBQUMvQ0MsUUFBQUEsS0FBSyxFQUFFLENBQUMsV0FBRDtBQUR3QyxPQUExQyxFQUVKcEYsSUFGSSxDQUVDLE1BQU07QUFDWmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUpNLENBQVA7QUFLRCxLQVJDLENBQUY7QUFVQVYsSUFBQUEsRUFBRSxDQUFDLDhCQUFELEVBQWlDLE1BQU07QUFDdkNYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUS9CLE9BQVIsQ0FBZ0JDLE9BQU8sQ0FBQ0MsT0FBUixFQUFoQjtBQUVBLGFBQU96QixFQUFFLENBQUNrSCxNQUFILENBQVUsU0FBVixFQUFxQixtQkFBckIsRUFBMENuRixJQUExQyxDQUErQyxNQUFNO0FBQzFEZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFuQyxTQUFULENBQU4sQ0FBMEJDLEVBQTFCLENBQTZCQyxLQUE3QixDQUFtQyxDQUFuQztBQUNELE9BRk0sQ0FBUDtBQUdELEtBTkMsQ0FBRjtBQU9ELEdBdEJPLENBQVI7QUF3QkF0QixFQUFBQSxRQUFRLENBQUMwRyxJQUFULENBQWMsV0FBZCxFQUEyQixNQUFNO0FBQy9CeEcsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0FZLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsb0JBQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxhQUFmO0FBQ0QsS0FKUyxDQUFWO0FBTUFXLElBQUFBLEVBQUUsQ0FBQyxtQkFBRCxFQUFzQixNQUFNO0FBQzVCWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVEvQixPQUFSLENBQWdCQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBaEI7O0FBQ0F6QixNQUFBQSxFQUFFLENBQUNvSCxrQkFBSCxDQUFzQjlDLFFBQXRCLENBQStCLEtBQS9CLEVBQXNDLE9BQXRDLEVBQStDLENBQUMsUUFBRCxFQUFXLFNBQVgsQ0FBL0MsRUFBc0U7QUFDcEVxQyxRQUFBQSxLQUFLLEVBQUU7QUFENkQsT0FBdEUsRUFFR3BGLE9BRkgsQ0FFVyxFQUZYOztBQUlBLGFBQU92QixFQUFFLENBQUNxSCxRQUFILENBQVksT0FBWixFQUFxQixLQUFyQixFQUE0QixDQUFDLFFBQUQsRUFBVyxTQUFYLENBQTVCLEVBQW1EO0FBQ3hEVixRQUFBQSxLQUFLLEVBQUU7QUFEaUQsT0FBbkQsRUFFSjVFLElBRkksQ0FFQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQzZHLFdBQUgsQ0FBZXZDLFFBQWYsQ0FBd0IsS0FBeEIsRUFBK0JuRCxTQUFoQyxDQUFOLENBQWlEQyxFQUFqRCxDQUFvREMsS0FBcEQsQ0FBMEQsQ0FBMUQ7QUFDRCxPQUxNLENBQVA7QUFNRCxLQVpDLENBQUY7QUFhRCxHQXBCRDtBQXNCQXRCLEVBQUFBLFFBQVEsQ0FBQzBHLElBQVQsQ0FBYyxRQUFkLEVBQXdCLE1BQU07QUFDNUJ4RyxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxvQkFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLGFBQWY7QUFDRCxLQUpTLENBQVY7QUFNQVcsSUFBQUEsRUFBRSxDQUFDLG1CQUFELEVBQXNCLE1BQU07QUFDNUJYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUS9CLE9BQVIsQ0FBZ0JDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQUFoQjs7QUFDQXpCLE1BQUFBLEVBQUUsQ0FBQ29ILGtCQUFILENBQXNCOUMsUUFBdEIsQ0FBK0IsS0FBL0IsRUFBc0MsY0FBdEMsRUFBc0QsQ0FBQyxRQUFELEVBQVcsUUFBWCxDQUF0RCxFQUE0RTtBQUMxRXFDLFFBQUFBLEtBQUssRUFBRTtBQURtRSxPQUE1RSxFQUVHcEYsT0FGSCxDQUVXLEVBRlg7O0FBSUEsYUFBT3ZCLEVBQUUsQ0FBQ3NILEtBQUgsQ0FBUyxPQUFULEVBQWtCLEtBQWxCLEVBQXlCLGNBQXpCLEVBQXlDLENBQUMsUUFBRCxFQUFXLFFBQVgsQ0FBekMsRUFBK0Q7QUFDcEVYLFFBQUFBLEtBQUssRUFBRTtBQUQ2RCxPQUEvRCxFQUVKNUUsSUFGSSxDQUVDLE1BQU07QUFDWmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDb0gsa0JBQUgsQ0FBc0JqRyxTQUF2QixDQUFOLENBQXdDQyxFQUF4QyxDQUEyQ0MsS0FBM0MsQ0FBaUQsQ0FBakQ7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDQUosUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNkcsV0FBSCxDQUFldkMsUUFBZixDQUF3QixLQUF4QixFQUErQm5ELFNBQWhDLENBQU4sQ0FBaURDLEVBQWpELENBQW9EQyxLQUFwRCxDQUEwRCxDQUExRDtBQUNELE9BTk0sQ0FBUDtBQU9ELEtBYkMsQ0FBRjtBQWNELEdBckJEO0FBdUJBdEIsRUFBQUEsUUFBUSxDQUFDLGlCQUFELEVBQW9CLE1BQU07QUFDaENFLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsVUFBZjtBQUNBWSxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDRCxLQUhTLENBQVY7QUFLQVcsSUFBQUEsRUFBRSxDQUFDLHlCQUFELEVBQTRCLE1BQU07QUFDbENYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLGFBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQUM7QUFDWEMsVUFBQUEsSUFBSSxFQUFFLFVBREs7QUFFWEMsVUFBQUEsS0FBSyxFQUFFO0FBRkksU0FBRDtBQUZHLE9BQWpCLEVBTUdyRCxPQU5ILENBTVdDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixLQUFoQixDQU5YO0FBT0F6QixNQUFBQSxFQUFFLENBQUNxSCxRQUFILENBQVkvQyxRQUFaLENBQXFCLE9BQXJCLEVBQThCLEtBQTlCLEVBQXFDO0FBQ25DaUQsUUFBQUEsR0FBRyxFQUFFO0FBRDhCLE9BQXJDLEVBRUdoRyxPQUZILENBRVdDLE9BQU8sQ0FBQ0MsT0FBUixFQUZYO0FBSUF6QixNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsU0FBRCxDQUFqQjtBQUNBLGFBQU9uQyxFQUFFLENBQUN3SCxjQUFILENBQWtCLE9BQWxCLEVBQTJCLEtBQTNCLEVBQWtDO0FBQ3ZDYixRQUFBQSxLQUFLLEVBQUU7QUFEZ0MsT0FBbEMsRUFFSjVFLElBRkksQ0FFQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0QsT0FKTSxDQUFQO0FBS0QsS0FsQkMsQ0FBRjtBQW9CQVYsSUFBQUEsRUFBRSxDQUFDLHFCQUFELEVBQXdCLE1BQU07QUFDOUJYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUIsU0FBakIsRUFBNEIvQyxPQUE1QixDQUFvQ0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEtBQWhCLENBQXBDO0FBQ0F6QixNQUFBQSxFQUFFLENBQUNxSCxRQUFILENBQVkvQyxRQUFaLENBQXFCLE9BQXJCLEVBQThCLEtBQTlCLEVBQXFDO0FBQ25DaUQsUUFBQUEsR0FBRyxFQUFFO0FBRDhCLE9BQXJDLEVBRUdoRyxPQUZILENBRVdDLE9BQU8sQ0FBQ0MsT0FBUixFQUZYO0FBSUF6QixNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLEVBQWpCO0FBQ0EsYUFBT25DLEVBQUUsQ0FBQ3dILGNBQUgsQ0FBa0IsT0FBbEIsRUFBMkIsS0FBM0IsRUFBa0M7QUFDdkNiLFFBQUFBLEtBQUssRUFBRTtBQURnQyxPQUFsQyxFQUVKNUUsSUFGSSxDQUVDLE1BQU07QUFDWmQsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQUpNLENBQVA7QUFLRCxLQVpDLENBQUY7QUFhRCxHQXZDTyxDQUFSO0FBeUNBdEIsRUFBQUEsUUFBUSxDQUFDLGVBQUQsRUFBa0IsTUFBTTtBQUM5QkUsSUFBQUEsVUFBVSxDQUFDLE1BQU07QUFDZlcsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxNQUFmO0FBQ0QsS0FGUyxDQUFWO0FBSUFXLElBQUFBLEVBQUUsQ0FBQyxrQkFBRCxFQUFxQixNQUFNO0FBQzNCWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxVQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUFDO0FBQ1hDLFVBQUFBLElBQUksRUFBRSxVQURLO0FBRVhDLFVBQUFBLEtBQUssRUFBRTtBQUZJLFNBQUQsRUFHVDtBQUNERCxVQUFBQSxJQUFJLEVBQUUsTUFETDtBQUVEQyxVQUFBQSxLQUFLLEVBQUU7QUFGTixTQUhTO0FBRkcsT0FBakIsRUFTR3JELE9BVEgsQ0FTV0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCO0FBQ3pCZ0csUUFBQUEsT0FBTyxFQUFFLENBQUMsR0FBRCxFQUFNLEtBQU4sRUFBYSxLQUFiO0FBRGdCLE9BQWhCLENBVFg7QUFhQSxhQUFPekgsRUFBRSxDQUFDMEgsWUFBSCxDQUFnQixPQUFoQixFQUF5QixLQUF6QixFQUFnQyxlQUFoQyxFQUFpRDtBQUN0RGYsUUFBQUEsS0FBSyxFQUFFO0FBRCtDLE9BQWpELEVBRUo1RSxJQUZJLENBRUU0RixRQUFELElBQWM7QUFDcEIxRyxRQUFBQSxNQUFNLENBQUMwRyxRQUFELENBQU4sQ0FBaUJ2RyxFQUFqQixDQUFvQm9DLElBQXBCLENBQXlCbkMsS0FBekIsQ0FBK0I7QUFDN0J1RyxVQUFBQSxTQUFTLEVBQUUsS0FEa0I7QUFFN0JDLFVBQUFBLFVBQVUsRUFBRTtBQUZpQixTQUEvQjtBQUlBNUcsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDRCxPQVJNLENBQVA7QUFTRCxLQXZCQyxDQUFGO0FBd0JELEdBN0JPLENBQVI7QUErQkF0QixFQUFBQSxRQUFRLENBQUMsZUFBRCxFQUFrQixNQUFNO0FBQzlCRSxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmVyxNQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsRUFBWCxFQUFlLE1BQWY7QUFDQVksTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQVgsRUFBZSxjQUFmO0FBQ0FZLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsZ0JBQWY7QUFDRCxLQUpTLENBQVY7QUFNQVcsSUFBQUEsRUFBRSxDQUFDLCtCQUFELEVBQWtDLE1BQU07QUFDeENYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLFVBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQUM7QUFDWEMsVUFBQUEsSUFBSSxFQUFFLFVBREs7QUFFWEMsVUFBQUEsS0FBSyxFQUFFO0FBRkksU0FBRCxFQUdUO0FBQ0RELFVBQUFBLElBQUksRUFBRSxNQURMO0FBRURDLFVBQUFBLEtBQUssRUFBRTtBQUZOLFNBSFM7QUFGRyxPQUFqQixFQVNHLENBQUMsSUFBRCxDQVRILEVBU1dyRCxPQVRYLENBU21CQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FUbkI7QUFXQXpCLE1BQUFBLEVBQUUsQ0FBQ21DLFdBQUgsR0FBaUIsQ0FBQyxNQUFELENBQWpCO0FBQ0EsYUFBT25DLEVBQUUsQ0FBQzhILFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIsS0FBekIsRUFBZ0MsZUFBaEMsRUFBaUQ7QUFDdERuQixRQUFBQSxLQUFLLEVBQUU7QUFEK0MsT0FBakQsRUFFSjVFLElBRkksQ0FFQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0QsT0FKTSxDQUFQO0FBS0QsS0FsQkMsQ0FBRjtBQW9CQVYsSUFBQUEsRUFBRSxDQUFDLGlDQUFELEVBQW9DLE1BQU07QUFDMUNYLE1BQUFBLEVBQUUsQ0FBQzBILFlBQUgsQ0FBZ0JwRCxRQUFoQixDQUF5QixPQUF6QixFQUFrQyxLQUFsQyxFQUF5QyxlQUF6QyxFQUEwRDtBQUN4RHFDLFFBQUFBLEtBQUssRUFBRTtBQURpRCxPQUExRCxFQUVHcEYsT0FGSCxDQUVXQyxPQUFPLENBQUNDLE9BQVIsRUFGWDtBQUdBekIsTUFBQUEsRUFBRSxDQUFDd0gsY0FBSCxDQUFrQmxELFFBQWxCLENBQTJCLEtBQTNCLEVBQWtDO0FBQ2hDcUMsUUFBQUEsS0FBSyxFQUFFO0FBRHlCLE9BQWxDLEVBRUdwRixPQUZILENBRVdDLE9BQU8sQ0FBQ0MsT0FBUixFQUZYO0FBSUF6QixNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLEVBQWpCO0FBQ0EsYUFBT25DLEVBQUUsQ0FBQzhILFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIsS0FBekIsRUFBZ0MsZUFBaEMsRUFBaUQ7QUFDdERuQixRQUFBQSxLQUFLLEVBQUU7QUFEK0MsT0FBakQsRUFFSjVFLElBRkksQ0FFQyxNQUFNO0FBQ1pkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3dILGNBQUgsQ0FBa0JyRyxTQUFuQixDQUFOLENBQW9DQyxFQUFwQyxDQUF1Q0MsS0FBdkMsQ0FBNkMsQ0FBN0M7QUFDRCxPQUpNLENBQVA7QUFLRCxLQWRDLENBQUY7QUFlRCxHQTFDTyxDQUFSO0FBNENBdEIsRUFBQUEsUUFBUSxDQUFDLHVCQUFELEVBQTBCLE1BQU07QUFDdENZLElBQUFBLEVBQUUsQ0FBQywwQ0FBRCxFQUE2QyxNQUFNO0FBQ25ETSxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUMrSCxvQkFBSCxDQUF3QixNQUF4QixDQUFELENBQU4sQ0FBd0MzRyxFQUF4QyxDQUEyQ2EsRUFBM0MsQ0FBOENDLElBQTlDO0FBQ0QsS0FGQyxDQUFGO0FBSUF2QixJQUFBQSxFQUFFLENBQUMsb0RBQUQsRUFBdUQsTUFBTTtBQUM3REMsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQUUsQ0FBQ08sTUFBZCxFQUFzQixxQkFBdEIsRUFBNkNnQixPQUE3QyxDQUFxRDtBQUNuRHlHLFFBQUFBLE9BQU8sRUFBRTtBQUNQckUsVUFBQUEsT0FBTyxFQUFFLFFBREY7QUFFUGUsVUFBQUEsVUFBVSxFQUFFLENBQUM7QUFDWEMsWUFBQUEsSUFBSSxFQUFFLFFBREs7QUFFWEMsWUFBQUEsS0FBSyxFQUFFO0FBRkksV0FBRDtBQUZMO0FBRDBDLE9BQXJEO0FBVUEzRCxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUMrSCxvQkFBSCxDQUF3QixNQUF4QixFQUFnQyxFQUFoQyxDQUFELENBQU4sQ0FBNEMzRyxFQUE1QyxDQUErQ2EsRUFBL0MsQ0FBa0RDLElBQWxEO0FBQ0QsS0FaQyxDQUFGO0FBY0F2QixJQUFBQSxFQUFFLENBQUMsa0RBQUQsRUFBcUQsTUFBTTtBQUMzREMsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLENBQVdiLEVBQUUsQ0FBQ08sTUFBZCxFQUFzQixxQkFBdEIsRUFBNkNnQixPQUE3QyxDQUFxRDtBQUNuRHlHLFFBQUFBLE9BQU8sRUFBRTtBQUNQckUsVUFBQUEsT0FBTyxFQUFFLFFBREY7QUFFUGUsVUFBQUEsVUFBVSxFQUFFLENBQUM7QUFDWEMsWUFBQUEsSUFBSSxFQUFFLFFBREs7QUFFWEMsWUFBQUEsS0FBSyxFQUFFO0FBRkksV0FBRDtBQUZMO0FBRDBDLE9BQXJEO0FBVUEzRCxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUMrSCxvQkFBSCxDQUF3QixhQUF4QixFQUF1QyxFQUF2QyxDQUFELENBQU4sQ0FBbUQzRyxFQUFuRCxDQUFzRGEsRUFBdEQsQ0FBeURpQixLQUF6RDtBQUNELEtBWkMsQ0FBRjtBQWFELEdBaENPLENBQVI7QUFrQ0FuRCxFQUFBQSxRQUFRLENBQUMsZ0JBQUQsRUFBbUIsTUFBTTtBQUMvQixVQUFNa0ksSUFBSSxHQUFHLGVBQWI7QUFDQWhJLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZjtBQUNELEtBRlMsQ0FBVjtBQUlBVyxJQUFBQSxFQUFFLENBQUMsbUJBQUQsRUFBc0IsTUFBTTtBQUM1QlgsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsUUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FBQztBQUNYQyxVQUFBQSxJQUFJLEVBQUUsUUFESztBQUVYQyxVQUFBQSxLQUFLLEVBQUVxRDtBQUZJLFNBQUQ7QUFGRyxPQUFqQixFQU1HMUcsT0FOSCxDQU1XQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDekI2RSxRQUFBQSxJQUFJLEVBQUU7QUFEbUIsT0FBaEIsQ0FOWDtBQVVBLGFBQU90RyxFQUFFLENBQUNrSSxhQUFILENBQWlCRCxJQUFqQixFQUF1QmxHLElBQXZCLENBQTRCLE1BQU07QUFDdkNkLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ29ELE1BQUosQ0FBTixDQUFrQmhDLEVBQWxCLENBQXFCQyxLQUFyQixDQUEyQjhHLHNCQUEzQjtBQUNELE9BSE0sQ0FBUDtBQUlELEtBZkMsQ0FBRjtBQWlCQXhILElBQUFBLEVBQUUsQ0FBQyxrQ0FBRCxFQUFxQyxNQUFNO0FBQzNDWCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVFnQixRQUFSLENBQWlCO0FBQ2ZYLFFBQUFBLE9BQU8sRUFBRSxRQURNO0FBRWZlLFFBQUFBLFVBQVUsRUFBRSxDQUFDO0FBQ1hDLFVBQUFBLElBQUksRUFBRSxRQURLO0FBRVhDLFVBQUFBLEtBQUssRUFBRXFEO0FBRkksU0FBRCxFQUlaLENBQUM7QUFDQ3RELFVBQUFBLElBQUksRUFBRSxNQURQO0FBRUNDLFVBQUFBLEtBQUssRUFBRTtBQUZSLFNBQUQsQ0FKWTtBQUZHLE9BQWpCLEVBV0dyRCxPQVhILENBV1dDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QjZFLFFBQUFBLElBQUksRUFBRTtBQURtQixPQUFoQixDQVhYO0FBZUF0RyxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsV0FBRCxDQUFqQjtBQUNBLGFBQU9uQyxFQUFFLENBQUNrSSxhQUFILENBQWlCRCxJQUFqQixFQUF1QjtBQUM1QkcsUUFBQUEsU0FBUyxFQUFFO0FBRGlCLE9BQXZCLEVBRUpyRyxJQUZJLENBRUMsTUFBTTtBQUNaZCxRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNzRCxJQUFILENBQVFuQyxTQUFULENBQU4sQ0FBMEJDLEVBQTFCLENBQTZCQyxLQUE3QixDQUFtQyxDQUFuQztBQUNBSixRQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUNvRCxNQUFKLENBQU4sQ0FBa0JoQyxFQUFsQixDQUFxQkMsS0FBckIsQ0FBMkI4RyxzQkFBM0I7QUFDRCxPQUxNLENBQVA7QUFNRCxLQXZCQyxDQUFGO0FBeUJBcEksSUFBQUEsUUFBUSxDQUFDLDhEQUFELEVBQWlFLE1BQU07QUFDN0VFLE1BQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZELFFBQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUS9CLE9BQVIsQ0FBZ0JDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUM5QjZFLFVBQUFBLElBQUksRUFBRTtBQUR3QixTQUFoQixDQUFoQjtBQUdELE9BSlMsQ0FBVjtBQU1BM0YsTUFBQUEsRUFBRSxDQUFDLDJCQUFELEVBQThCLE1BQU07QUFDcEMsWUFBSTBILGVBQWUsR0FBRyxLQUF0Qjs7QUFDQXJJLFFBQUFBLEVBQUUsQ0FBQ3NJLGVBQUgsR0FBcUIsTUFBTSxJQUFJOUcsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDbERBLFVBQUFBLE9BQU87QUFDUDRHLFVBQUFBLGVBQWUsR0FBRyxJQUFsQjtBQUNELFNBSDBCLENBQTNCOztBQUlBLFlBQUlFLGtCQUFrQixHQUFHM0gsS0FBSyxDQUFDNEgsR0FBTixDQUFVeEksRUFBVixFQUFjLGlCQUFkLENBQXpCO0FBQ0EsZUFBT0EsRUFBRSxDQUFDa0ksYUFBSCxDQUFpQkQsSUFBakIsRUFBdUJsRyxJQUF2QixDQUE0QixNQUFNO0FBQ3ZDZCxVQUFBQSxNQUFNLENBQUNzSCxrQkFBa0IsQ0FBQ2pFLFFBQW5CLENBQTRCMkQsSUFBNUIsRUFBa0M5RyxTQUFuQyxDQUFOLENBQW9EQyxFQUFwRCxDQUF1REMsS0FBdkQsQ0FBNkQsQ0FBN0Q7QUFDQUosVUFBQUEsTUFBTSxDQUFDb0gsZUFBRCxDQUFOLENBQXdCakgsRUFBeEIsQ0FBMkJDLEtBQTNCLENBQWlDLElBQWpDO0FBQ0QsU0FITSxDQUFQO0FBSUQsT0FYQyxDQUFGO0FBYUFWLE1BQUFBLEVBQUUsQ0FBQyxtQ0FBRCxFQUFzQyxNQUFNO0FBQzVDWCxRQUFBQSxFQUFFLENBQUNzSSxlQUFILEdBQXFCLE1BQU0sQ0FBRyxDQUE5Qjs7QUFDQSxZQUFJQyxrQkFBa0IsR0FBRzNILEtBQUssQ0FBQzRILEdBQU4sQ0FBVXhJLEVBQVYsRUFBYyxpQkFBZCxDQUF6QjtBQUNBLGVBQU9BLEVBQUUsQ0FBQ2tJLGFBQUgsQ0FBaUJELElBQWpCLEVBQXVCbEcsSUFBdkIsQ0FBNEIsTUFBTTtBQUN2Q2QsVUFBQUEsTUFBTSxDQUFDc0gsa0JBQWtCLENBQUNqRSxRQUFuQixDQUE0QjJELElBQTVCLEVBQWtDOUcsU0FBbkMsQ0FBTixDQUFvREMsRUFBcEQsQ0FBdURDLEtBQXZELENBQTZELENBQTdEO0FBQ0QsU0FGTSxDQUFQO0FBR0QsT0FOQyxDQUFGO0FBT0QsS0EzQk8sQ0FBUjtBQTZCQVYsSUFBQUEsRUFBRSxDQUFDLDRCQUFELEVBQStCLE1BQU07QUFDckMsVUFBSXNDLE1BQU0sR0FBRyxLQUFiO0FBQ0FqRCxNQUFBQSxFQUFFLENBQUNzRCxJQUFILENBQVEvQixPQUFSLENBQWdCQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsS0FBaEIsQ0FBaEIsRUFBd0NGLE9BQXhDLENBQWdEQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0I7QUFDOUQ2RSxRQUFBQSxJQUFJLEVBQUU7QUFEd0QsT0FBaEIsQ0FBaEQ7O0FBSUF0RyxNQUFBQSxFQUFFLENBQUN5SSxjQUFILEdBQXFCUixJQUFELElBQVU7QUFDNUJoSCxRQUFBQSxNQUFNLENBQUNnSCxJQUFELENBQU4sQ0FBYTdHLEVBQWIsQ0FBZ0JDLEtBQWhCLENBQXNCLEtBQXRCO0FBQ0E0QixRQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNELE9BSEQ7O0FBS0FqRCxNQUFBQSxFQUFFLENBQUM0RCxnQkFBSCxHQUFzQixLQUF0QjtBQUNBLGFBQU81RCxFQUFFLENBQUNrSSxhQUFILENBQWlCRCxJQUFqQixFQUF1QmxHLElBQXZCLENBQTRCLE1BQU07QUFDdkNkLFFBQUFBLE1BQU0sQ0FBQ2dDLE1BQUQsQ0FBTixDQUFlN0IsRUFBZixDQUFrQmEsRUFBbEIsQ0FBcUJDLElBQXJCO0FBQ0QsT0FGTSxDQUFQO0FBR0QsS0FmQyxDQUFGO0FBZ0JELEdBN0ZPLENBQVI7QUErRkFuQyxFQUFBQSxRQUFRLENBQUMsZ0JBQUQsRUFBbUIsTUFBTTtBQUMvQixVQUFNa0ksSUFBSSxHQUFHLE9BQWI7QUFFQWhJLElBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZXLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsTUFBZjtBQUNELEtBRlMsQ0FBVjtBQUlBVyxJQUFBQSxFQUFFLENBQUMsbUJBQUQsRUFBc0IsTUFBTTtBQUM1QlgsTUFBQUEsRUFBRSxDQUFDc0QsSUFBSCxDQUFRZ0IsUUFBUixDQUFpQjtBQUNmWCxRQUFBQSxPQUFPLEVBQUUsUUFETTtBQUVmZSxRQUFBQSxVQUFVLEVBQUUsQ0FDVjtBQUFFQyxVQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsVUFBQUEsS0FBSyxFQUFFcUQ7QUFBekIsU0FEVSxFQUVWLENBQ0U7QUFBRXRELFVBQUFBLElBQUksRUFBRSxNQUFSO0FBQWdCQyxVQUFBQSxLQUFLLEVBQUU7QUFBdkIsU0FERixFQUVFO0FBQUVELFVBQUFBLElBQUksRUFBRSxNQUFSO0FBQWdCQyxVQUFBQSxLQUFLLEVBQUU7QUFBdkIsU0FGRixDQUZVO0FBRkcsT0FBakIsRUFTR3JELE9BVEgsQ0FTV0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCO0FBQ3pCc0MsUUFBQUEsT0FBTyxFQUFFO0FBQ1AyRSxVQUFBQSxNQUFNLEVBQUUsQ0FBQztBQUNQQyxZQUFBQSxHQUFHLEVBQUUsR0FERTtBQUVQaEYsWUFBQUEsT0FBTyxFQUFFLFFBRkY7QUFHUGUsWUFBQUEsVUFBVSxFQUNSLENBQ0U7QUFBRUMsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRXFEO0FBQXZCLGFBREYsRUFFRSxDQUNFO0FBQUV0RCxjQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsY0FBQUEsS0FBSyxFQUFFO0FBQXZCLGFBREYsRUFFRTtBQUFFRCxjQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsY0FBQUEsS0FBSyxFQUFFO0FBQXZCLGFBRkYsRUFHRTtBQUFFRCxjQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsY0FBQUEsS0FBSyxFQUFFO0FBQXZCLGFBSEYsRUFJRTtBQUFFRCxjQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsY0FBQUEsS0FBSyxFQUFFO0FBQXZCLGFBSkYsQ0FGRjtBQUpLLFdBQUQ7QUFERDtBQURnQixPQUFoQixDQVRYO0FBNEJBLGFBQU81RSxFQUFFLENBQUM0SSxhQUFILENBQWlCWCxJQUFqQixFQUF1QmxHLElBQXZCLENBQTZCOEcsTUFBRCxJQUFZO0FBQzdDNUgsUUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDc0QsSUFBSCxDQUFRbkMsU0FBVCxDQUFOLENBQTBCQyxFQUExQixDQUE2QkMsS0FBN0IsQ0FBbUMsQ0FBbkM7QUFDQUosUUFBQUEsTUFBTSxDQUFDNEgsTUFBTSxDQUFDQyxPQUFSLENBQU4sQ0FBdUIxSCxFQUF2QixDQUEwQkMsS0FBMUIsQ0FBZ0MsSUFBaEM7QUFDQUosUUFBQUEsTUFBTSxDQUFDNEgsTUFBTSxDQUFDRSxRQUFSLENBQU4sQ0FBd0IzSCxFQUF4QixDQUEyQkMsS0FBM0IsQ0FBaUMsR0FBakM7QUFDRCxPQUpNLENBQVA7QUFLRCxLQWxDQyxDQUFGO0FBb0NBVixJQUFBQSxFQUFFLENBQUMsc0NBQUQsRUFBeUMsTUFBTTtBQUMvQ1gsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixDQUFDLFdBQUQsQ0FBakI7QUFDQW5DLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLFFBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQ1Y7QUFBRUMsVUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLFVBQUFBLEtBQUssRUFBRXFEO0FBQXpCLFNBRFUsRUFFVixDQUNFO0FBQUV0RCxVQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBREYsRUFFRTtBQUFFRCxVQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBRkYsRUFHRTtBQUFFRCxVQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBSEYsQ0FGVTtBQUZHLE9BQWpCLEVBVUdyRCxPQVZILENBVVdDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QnNDLFFBQUFBLE9BQU8sRUFBRTtBQUNQMkUsVUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDUEMsWUFBQUEsR0FBRyxFQUFFLEdBREU7QUFFUGhGLFlBQUFBLE9BQU8sRUFBRSxRQUZGO0FBR1BlLFlBQUFBLFVBQVUsRUFDUixDQUNFO0FBQUVDLGNBQUFBLElBQUksRUFBRSxNQUFSO0FBQWdCQyxjQUFBQSxLQUFLLEVBQUVxRDtBQUF2QixhQURGLEVBRUUsQ0FDRTtBQUFFdEQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQURGLEVBRUU7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUZGLEVBR0U7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUhGLEVBSUU7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUpGLEVBS0U7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUxGLEVBTUU7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQU5GLENBRkY7QUFKSyxXQUFEO0FBREQ7QUFEZ0IsT0FBaEIsQ0FWWDtBQStCQSxhQUFPNUUsRUFBRSxDQUFDNEksYUFBSCxDQUFpQlgsSUFBakIsRUFBdUI7QUFBRUcsUUFBQUEsU0FBUyxFQUFFO0FBQWIsT0FBdkIsRUFBNENyRyxJQUE1QyxDQUFrRDhHLE1BQUQsSUFBWTtBQUNsRTVILFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzRILE1BQU0sQ0FBQ0MsT0FBUixDQUFOLENBQXVCMUgsRUFBdkIsQ0FBMEJDLEtBQTFCLENBQWdDLElBQWhDO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzRILE1BQU0sQ0FBQ0UsUUFBUixDQUFOLENBQXdCM0gsRUFBeEIsQ0FBMkJDLEtBQTNCLENBQWlDLEdBQWpDO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzRILE1BQU0sQ0FBQ0csYUFBUixDQUFOLENBQTZCNUgsRUFBN0IsQ0FBZ0NDLEtBQWhDLENBQXNDLEVBQXRDO0FBQ0QsT0FMTSxDQUFQO0FBTUQsS0F2Q0MsQ0FBRjtBQXlDQVYsSUFBQUEsRUFBRSxDQUFDLHVDQUFELEVBQTBDLE1BQU07QUFDaERYLE1BQUFBLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUWdCLFFBQVIsQ0FBaUI7QUFDZlgsUUFBQUEsT0FBTyxFQUFFLFFBRE07QUFFZmUsUUFBQUEsVUFBVSxFQUFFLENBQ1Y7QUFBRUMsVUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLFVBQUFBLEtBQUssRUFBRXFEO0FBQXpCLFNBRFUsRUFFVixDQUNFO0FBQUV0RCxVQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBREYsRUFFRTtBQUFFRCxVQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkMsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBRkYsQ0FGVTtBQUZHLE9BQWpCLEVBU0dyRCxPQVRILENBU1dDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQjtBQUN6QnNDLFFBQUFBLE9BQU8sRUFBRTtBQUNQMkUsVUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDUEMsWUFBQUEsR0FBRyxFQUFFLEdBREU7QUFFUGhGLFlBQUFBLE9BQU8sRUFBRSxRQUZGO0FBR1BlLFlBQUFBLFVBQVUsRUFDUixDQUNFO0FBQUVDLGNBQUFBLElBQUksRUFBRSxNQUFSO0FBQWdCQyxjQUFBQSxLQUFLLEVBQUVxRDtBQUF2QixhQURGLEVBRUUsQ0FDRTtBQUFFdEQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQURGLEVBRUU7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUZGLEVBR0U7QUFBRUQsY0FBQUEsSUFBSSxFQUFFLE1BQVI7QUFBZ0JDLGNBQUFBLEtBQUssRUFBRTtBQUF2QixhQUhGLENBRkY7QUFKSyxXQUFEO0FBREQ7QUFEZ0IsT0FBaEIsQ0FUWDtBQTJCQSxhQUFPNUUsRUFBRSxDQUFDNEksYUFBSCxDQUFpQlgsSUFBakIsRUFBdUJsRyxJQUF2QixDQUE2QjhHLE1BQUQsSUFBWTtBQUM3QzVILFFBQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ3NELElBQUgsQ0FBUW5DLFNBQVQsQ0FBTixDQUEwQkMsRUFBMUIsQ0FBNkJDLEtBQTdCLENBQW1DLENBQW5DO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzRILE1BQU0sQ0FBQ0MsT0FBUixDQUFOLENBQXVCMUgsRUFBdkIsQ0FBMEJDLEtBQTFCLENBQWdDLElBQWhDO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzRILE1BQU0sQ0FBQ0UsUUFBUixDQUFOLENBQXdCM0gsRUFBeEIsQ0FBMkJDLEtBQTNCLENBQWlDLElBQWpDO0FBQ0QsT0FKTSxDQUFQO0FBS0QsS0FqQ0MsQ0FBRjtBQWtDRCxHQXRITyxDQUFSO0FBd0hBdEIsRUFBQUEsUUFBUSxDQUFDLGdCQUFELEVBQW1CLE1BQU07QUFDL0JZLElBQUFBLEVBQUUsQ0FBQyxtQ0FBRCxFQUFzQyxNQUFNO0FBQzVDWCxNQUFBQSxFQUFFLENBQUNtQyxXQUFILEdBQWlCLENBQUMsS0FBRCxDQUFqQjtBQUNBbEIsTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDaUosYUFBSCxDQUFpQixLQUFqQixDQUFELENBQU4sQ0FBZ0M3SCxFQUFoQyxDQUFtQ2EsRUFBbkMsQ0FBc0NDLElBQXRDO0FBQ0QsS0FIQyxDQUFGO0FBS0F2QixJQUFBQSxFQUFFLENBQUMsdUNBQUQsRUFBMEMsTUFBTTtBQUNoRFgsTUFBQUEsRUFBRSxDQUFDbUMsV0FBSCxHQUFpQixDQUFDLEtBQUQsQ0FBakI7QUFDQWxCLE1BQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ2lKLGFBQUgsQ0FBaUIsS0FBakIsQ0FBRCxDQUFOLENBQWdDN0gsRUFBaEMsQ0FBbUNhLEVBQW5DLENBQXNDaUIsS0FBdEM7QUFDQWpDLE1BQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ2lKLGFBQUgsRUFBRCxDQUFOLENBQTJCN0gsRUFBM0IsQ0FBOEJhLEVBQTlCLENBQWlDaUIsS0FBakM7QUFDRCxLQUpDLENBQUY7QUFLRCxHQVhPLENBQVI7QUFhQW5ELEVBQUFBLFFBQVEsQ0FBQyxxQkFBRCxFQUF3QixNQUFNO0FBQ3BDWSxJQUFBQSxFQUFFLENBQUMscUNBQUQsRUFBd0MsTUFBTTtBQUM5Q1gsTUFBQUEsRUFBRSxDQUFDa0osa0JBQUgsQ0FBc0I7QUFDcEJ2SCxRQUFBQSxVQUFVLEVBQUUsQ0FBQyxLQUFEO0FBRFEsT0FBdEIsRUFFRyxNQUFNLENBQUcsQ0FGWjs7QUFHQVYsTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDbUMsV0FBSixDQUFOLENBQXVCZixFQUF2QixDQUEwQm9DLElBQTFCLENBQStCbkMsS0FBL0IsQ0FBcUMsQ0FBQyxLQUFELENBQXJDO0FBQ0QsS0FMQyxDQUFGO0FBTUQsR0FQTyxDQUFSO0FBU0F0QixFQUFBQSxRQUFRLENBQUMsNkJBQUQsRUFBZ0MsTUFBTTtBQUM1Q1ksSUFBQUEsRUFBRSxDQUFDLDBCQUFELEVBQTZCLE1BQU07QUFDbkNYLE1BQUFBLEVBQUUsQ0FBQ21KLDBCQUFILENBQThCO0FBQzVCekUsUUFBQUEsVUFBVSxFQUFFLENBQUM7QUFDWEUsVUFBQUEsS0FBSyxFQUFFO0FBREksU0FBRDtBQURnQixPQUE5QixFQUlHLE1BQU0sQ0FBRyxDQUpaOztBQUtBM0QsTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDbUMsV0FBSixDQUFOLENBQXVCZixFQUF2QixDQUEwQm9DLElBQTFCLENBQStCbkMsS0FBL0IsQ0FBcUMsQ0FBQyxLQUFELENBQXJDO0FBQ0QsS0FQQyxDQUFGO0FBUUQsR0FUTyxDQUFSO0FBV0F0QixFQUFBQSxRQUFRLENBQUMseUJBQUQsRUFBNEIsTUFBTTtBQUN4Q1ksSUFBQUEsRUFBRSxDQUFDLHNCQUFELEVBQXlCLE1BQU07QUFDL0JYLE1BQUFBLEVBQUUsQ0FBQ29KLFFBQUgsR0FBY3hJLEtBQUssQ0FBQ0MsSUFBTixFQUFkO0FBQ0FiLE1BQUFBLEVBQUUsQ0FBQzRELGdCQUFILEdBQXNCLEtBQXRCOztBQUVBNUQsTUFBQUEsRUFBRSxDQUFDcUosc0JBQUgsQ0FBMEI7QUFDeEJDLFFBQUFBLEVBQUUsRUFBRTtBQURvQixPQUExQixFQUVHLE1BQU0sQ0FBRyxDQUZaOztBQUdBckksTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDb0osUUFBSCxDQUFZOUUsUUFBWixDQUFxQixLQUFyQixFQUE0QixRQUE1QixFQUFzQyxHQUF0QyxFQUEyQ25ELFNBQTVDLENBQU4sQ0FBNkRDLEVBQTdELENBQWdFQyxLQUFoRSxDQUFzRSxDQUF0RTtBQUNELEtBUkMsQ0FBRjtBQVNELEdBVk8sQ0FBUjtBQVlBdEIsRUFBQUEsUUFBUSxDQUFDLDBCQUFELEVBQTZCLE1BQU07QUFDekNZLElBQUFBLEVBQUUsQ0FBQyxzQkFBRCxFQUF5QixNQUFNO0FBQy9CWCxNQUFBQSxFQUFFLENBQUNvSixRQUFILEdBQWN4SSxLQUFLLENBQUNDLElBQU4sRUFBZDtBQUNBYixNQUFBQSxFQUFFLENBQUM0RCxnQkFBSCxHQUFzQixLQUF0Qjs7QUFFQTVELE1BQUFBLEVBQUUsQ0FBQ3VKLHVCQUFILENBQTJCO0FBQ3pCRCxRQUFBQSxFQUFFLEVBQUU7QUFEcUIsT0FBM0IsRUFFRyxNQUFNLENBQUcsQ0FGWjs7QUFHQXJJLE1BQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ29KLFFBQUgsQ0FBWTlFLFFBQVosQ0FBcUIsS0FBckIsRUFBNEIsU0FBNUIsRUFBdUMsR0FBdkMsRUFBNENuRCxTQUE3QyxDQUFOLENBQThEQyxFQUE5RCxDQUFpRUMsS0FBakUsQ0FBdUUsQ0FBdkU7QUFDRCxLQVJDLENBQUY7QUFTRCxHQVZPLENBQVI7QUFZQXRCLEVBQUFBLFFBQVEsQ0FBQzBHLElBQVQsQ0FBYyx3QkFBZCxFQUF3QyxNQUFNO0FBQzVDOUYsSUFBQUEsRUFBRSxDQUFDLHNCQUFELEVBQXlCLE1BQU07QUFDL0JYLE1BQUFBLEVBQUUsQ0FBQ29KLFFBQUgsR0FBY3hJLEtBQUssQ0FBQ0MsSUFBTixFQUFkO0FBQ0FELE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixDQUFXYixFQUFYLEVBQWUsYUFBZixFQUE4QnVCLE9BQTlCLENBQXNDLEtBQXRDO0FBQ0F2QixNQUFBQSxFQUFFLENBQUM0RCxnQkFBSCxHQUFzQixLQUF0Qjs7QUFFQTVELE1BQUFBLEVBQUUsQ0FBQ3dKLHFCQUFILENBQXlCO0FBQ3ZCRixRQUFBQSxFQUFFLEVBQUU7QUFEbUIsT0FBekIsRUFFRyxNQUFNLENBQUcsQ0FGWjs7QUFHQXJJLE1BQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ29KLFFBQUgsQ0FBWTlFLFFBQVosQ0FBcUIsS0FBckIsRUFBNEIsT0FBNUIsRUFBcUMsS0FBckMsRUFBNENuRCxTQUE3QyxDQUFOLENBQThEQyxFQUE5RCxDQUFpRUMsS0FBakUsQ0FBdUUsQ0FBdkU7QUFDQUosTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNkcsV0FBSCxDQUFlcEQsSUFBZixDQUFvQixDQUFwQixFQUF1QixDQUF2QixDQUFELENBQU4sQ0FBa0NyQyxFQUFsQyxDQUFxQ29DLElBQXJDLENBQTBDbkMsS0FBMUMsQ0FBZ0Q7QUFDOUMwQyxRQUFBQSxPQUFPLEVBQUU7QUFDUDBGLFVBQUFBLEtBQUssRUFBRSxDQUFDO0FBQ05ILFlBQUFBLEVBQUUsRUFBRTtBQURFLFdBQUQ7QUFEQTtBQURxQyxPQUFoRDtBQU9ELEtBaEJDLENBQUY7QUFpQkQsR0FsQkQ7QUFvQkF2SixFQUFBQSxRQUFRLENBQUMsZUFBRCxFQUFrQixNQUFNO0FBQzlCWSxJQUFBQSxFQUFFLENBQUMsNEJBQUQsRUFBK0IsTUFBTTtBQUNyQ1gsTUFBQUEsRUFBRSxDQUFDMEosWUFBSCxDQUFnQixLQUFoQjs7QUFFQXpJLE1BQUFBLE1BQU0sQ0FBQ2pCLEVBQUUsQ0FBQ29ELE1BQUosQ0FBTixDQUFrQmhDLEVBQWxCLENBQXFCQyxLQUFyQixDQUEyQixLQUEzQjtBQUNELEtBSkMsQ0FBRjtBQU1BVixJQUFBQSxFQUFFLENBQUMsa0RBQUQsRUFBcUQsTUFBTTtBQUMzRFgsTUFBQUEsRUFBRSxDQUFDeUksY0FBSCxHQUFvQjdILEtBQUssQ0FBQ0MsSUFBTixFQUFwQjtBQUNBYixNQUFBQSxFQUFFLENBQUNvRCxNQUFILEdBQVkrRSxzQkFBWjtBQUNBbkksTUFBQUEsRUFBRSxDQUFDNEQsZ0JBQUgsR0FBc0IsS0FBdEI7O0FBRUE1RCxNQUFBQSxFQUFFLENBQUMwSixZQUFILENBQWdCLEtBQWhCOztBQUVBekksTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNEQsZ0JBQUosQ0FBTixDQUE0QnhDLEVBQTVCLENBQStCYSxFQUEvQixDQUFrQ2lCLEtBQWxDO0FBQ0FqQyxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUN5SSxjQUFILENBQWtCbkUsUUFBbEIsQ0FBMkIsS0FBM0IsRUFBa0NuRCxTQUFuQyxDQUFOLENBQW9EQyxFQUFwRCxDQUF1REMsS0FBdkQsQ0FBNkQsQ0FBN0Q7QUFDRCxLQVRDLENBQUY7QUFVRCxHQWpCTyxDQUFSO0FBbUJBdEIsRUFBQUEsUUFBUSxDQUFDLGNBQUQsRUFBaUIsTUFBTTtBQUM3QlksSUFBQUEsRUFBRSxDQUFDLHVDQUFELEVBQTBDLE1BQU07QUFDaEQsVUFBSXdGLElBQUksR0FBRztBQUNUd0QsUUFBQUEsUUFBUSxFQUFFO0FBREQsT0FBWDtBQUdBMUksTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNEosV0FBSCxDQUFlekQsSUFBZixFQUFxQixhQUFyQixFQUFvQyxHQUFwQyxDQUFELENBQU4sQ0FBaUQvRSxFQUFqRCxDQUFvRG9DLElBQXBELENBQXlEbkMsS0FBekQsQ0FBK0Q7QUFDN0R3SSxRQUFBQSxJQUFJLEVBQUUsT0FEdUQ7QUFFN0Q1RSxRQUFBQSxTQUFTLEVBQUUsR0FGa0Q7QUFHN0RnRCxRQUFBQSxJQUFJLEVBQUUsYUFIdUQ7QUFJN0QwQixRQUFBQSxRQUFRLEVBQUU7QUFKbUQsT0FBL0Q7QUFNQTFJLE1BQUFBLE1BQU0sQ0FBQ2tGLElBQUQsQ0FBTixDQUFhL0UsRUFBYixDQUFnQm9DLElBQWhCLENBQXFCbkMsS0FBckIsQ0FBMkI7QUFDekJzSSxRQUFBQSxRQUFRLEVBQUUsQ0FBQztBQUNURSxVQUFBQSxJQUFJLEVBQUUsT0FERztBQUVUNUUsVUFBQUEsU0FBUyxFQUFFLEdBRkY7QUFHVGdELFVBQUFBLElBQUksRUFBRSxPQUhHO0FBSVQwQixVQUFBQSxRQUFRLEVBQUUsQ0FBQztBQUNURSxZQUFBQSxJQUFJLEVBQUUsT0FERztBQUVUNUUsWUFBQUEsU0FBUyxFQUFFLEdBRkY7QUFHVGdELFlBQUFBLElBQUksRUFBRSxhQUhHO0FBSVQwQixZQUFBQSxRQUFRLEVBQUU7QUFKRCxXQUFEO0FBSkQsU0FBRDtBQURlLE9BQTNCO0FBYUQsS0F2QkMsQ0FBRjtBQXlCQWhKLElBQUFBLEVBQUUsQ0FBQyx5Q0FBRCxFQUE0QyxNQUFNO0FBQ2xELFVBQUl3RixJQUFJLEdBQUc7QUFDVHdELFFBQUFBLFFBQVEsRUFBRSxDQUFDO0FBQ1RFLFVBQUFBLElBQUksRUFBRSxPQURHO0FBRVQ1RSxVQUFBQSxTQUFTLEVBQUUsR0FGRjtBQUdUZ0QsVUFBQUEsSUFBSSxFQUFFLE9BSEc7QUFJVDBCLFVBQUFBLFFBQVEsRUFBRSxDQUFDO0FBQ1RFLFlBQUFBLElBQUksRUFBRSxPQURHO0FBRVQ1RSxZQUFBQSxTQUFTLEVBQUUsR0FGRjtBQUdUZ0QsWUFBQUEsSUFBSSxFQUFFLGFBSEc7QUFJVDBCLFlBQUFBLFFBQVEsRUFBRSxFQUpEO0FBS1RHLFlBQUFBLEdBQUcsRUFBRTtBQUxJLFdBQUQ7QUFKRCxTQUFEO0FBREQsT0FBWDtBQWNBN0ksTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNEosV0FBSCxDQUFlekQsSUFBZixFQUFxQixhQUFyQixFQUFvQyxHQUFwQyxDQUFELENBQU4sQ0FBaUQvRSxFQUFqRCxDQUFvRG9DLElBQXBELENBQXlEbkMsS0FBekQsQ0FBK0Q7QUFDN0R3SSxRQUFBQSxJQUFJLEVBQUUsT0FEdUQ7QUFFN0Q1RSxRQUFBQSxTQUFTLEVBQUUsR0FGa0Q7QUFHN0RnRCxRQUFBQSxJQUFJLEVBQUUsYUFIdUQ7QUFJN0QwQixRQUFBQSxRQUFRLEVBQUUsRUFKbUQ7QUFLN0RHLFFBQUFBLEdBQUcsRUFBRTtBQUx3RCxPQUEvRDtBQU9ELEtBdEJDLENBQUY7QUF3QkFuSixJQUFBQSxFQUFFLENBQUMsc0NBQUQsRUFBeUMsTUFBTTtBQUMvQyxVQUFJd0YsSUFBSSxHQUFHO0FBQ1R3RCxRQUFBQSxRQUFRLEVBQUU7QUFERCxPQUFYO0FBR0ExSSxNQUFBQSxNQUFNLENBQUNqQixFQUFFLENBQUM0SixXQUFILENBQWV6RCxJQUFmLEVBQXFCLGFBQXJCLEVBQW9DLEdBQXBDLENBQUQsQ0FBTixDQUFpRC9FLEVBQWpELENBQW9Eb0MsSUFBcEQsQ0FBeURuQyxLQUF6RCxDQUErRDtBQUM3RHdJLFFBQUFBLElBQUksRUFBRSxPQUR1RDtBQUU3RDVFLFFBQUFBLFNBQVMsRUFBRSxHQUZrRDtBQUc3RGdELFFBQUFBLElBQUksRUFBRSxhQUh1RDtBQUk3RDBCLFFBQUFBLFFBQVEsRUFBRTtBQUptRCxPQUEvRDtBQU1BMUksTUFBQUEsTUFBTSxDQUFDakIsRUFBRSxDQUFDNEosV0FBSCxDQUFlekQsSUFBZixFQUFxQixjQUFyQixFQUFxQyxHQUFyQyxDQUFELENBQU4sQ0FBa0QvRSxFQUFsRCxDQUFxRG9DLElBQXJELENBQTBEbkMsS0FBMUQsQ0FBZ0U7QUFDOUR3SSxRQUFBQSxJQUFJLEVBQUUsUUFEd0Q7QUFFOUQ1RSxRQUFBQSxTQUFTLEVBQUUsR0FGbUQ7QUFHOURnRCxRQUFBQSxJQUFJLEVBQUUsY0FId0Q7QUFJOUQwQixRQUFBQSxRQUFRLEVBQUU7QUFKb0QsT0FBaEU7QUFPQTFJLE1BQUFBLE1BQU0sQ0FBQ2tGLElBQUQsQ0FBTixDQUFhL0UsRUFBYixDQUFnQm9DLElBQWhCLENBQXFCbkMsS0FBckIsQ0FBMkI7QUFDekJzSSxRQUFBQSxRQUFRLEVBQUUsQ0FBQztBQUNURSxVQUFBQSxJQUFJLEVBQUUsT0FERztBQUVUNUUsVUFBQUEsU0FBUyxFQUFFLEdBRkY7QUFHVGdELFVBQUFBLElBQUksRUFBRSxPQUhHO0FBSVQwQixVQUFBQSxRQUFRLEVBQUUsQ0FBQztBQUNURSxZQUFBQSxJQUFJLEVBQUUsT0FERztBQUVUNUUsWUFBQUEsU0FBUyxFQUFFLEdBRkY7QUFHVGdELFlBQUFBLElBQUksRUFBRSxhQUhHO0FBSVQwQixZQUFBQSxRQUFRLEVBQUU7QUFKRCxXQUFELEVBS1A7QUFDREUsWUFBQUEsSUFBSSxFQUFFLFFBREw7QUFFRDVFLFlBQUFBLFNBQVMsRUFBRSxHQUZWO0FBR0RnRCxZQUFBQSxJQUFJLEVBQUUsY0FITDtBQUlEMEIsWUFBQUEsUUFBUSxFQUFFO0FBSlQsV0FMTztBQUpELFNBQUQ7QUFEZSxPQUEzQjtBQWtCRCxLQW5DQyxDQUFGO0FBb0NELEdBdEZPLENBQVI7QUF3RkE1SixFQUFBQSxRQUFRLENBQUMsa0JBQUQsRUFBcUIsTUFBTTtBQUNqQ1ksSUFBQUEsRUFBRSxDQUFDLGtEQUFELEVBQXNEK0IsSUFBRCxJQUFVO0FBQy9EMUMsTUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVV3SixnQkFBVixHQUE2QixJQUE3QjtBQUNBL0osTUFBQUEsRUFBRSxDQUFDNEQsZ0JBQUgsR0FBc0IsS0FBdEI7O0FBQ0E1RCxNQUFBQSxFQUFFLENBQUNvSixRQUFILEdBQWMsQ0FBQ25CLElBQUQsRUFBT3RELElBQVAsRUFBYUMsS0FBYixLQUF1QjtBQUNuQzNELFFBQUFBLE1BQU0sQ0FBQ2dILElBQUQsQ0FBTixDQUFhN0csRUFBYixDQUFnQkMsS0FBaEIsQ0FBc0IsS0FBdEI7QUFDQUosUUFBQUEsTUFBTSxDQUFDMEQsSUFBRCxDQUFOLENBQWF2RCxFQUFiLENBQWdCQyxLQUFoQixDQUFzQixRQUF0QjtBQUNBSixRQUFBQSxNQUFNLENBQUMyRCxLQUFELENBQU4sQ0FBY3hELEVBQWQsQ0FBaUJDLEtBQWpCLENBQXVCLEdBQXZCO0FBQ0FxQixRQUFBQSxJQUFJO0FBQ0wsT0FMRDs7QUFNQTFDLE1BQUFBLEVBQUUsQ0FBQ08sTUFBSCxDQUFVeUosT0FBVixDQUFrQjtBQUNoQjtBQUNBQyxRQUFBQSxJQUFJLEVBQUUsSUFBSS9GLFVBQUosQ0FBZSxDQUFDLEVBQUQsRUFBSyxFQUFMLEVBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsRUFBckIsRUFBeUIsRUFBekIsRUFBNkIsRUFBN0IsRUFBaUMsRUFBakMsRUFBcUMsRUFBckMsRUFBeUMsRUFBekMsRUFBNkMsRUFBN0MsRUFBaUQsRUFBakQsRUFBcUQsRUFBckQsQ0FBZixFQUF5RWdHO0FBRi9ELE9BQWxCO0FBSUQsS0FiQyxDQUFGO0FBZUF2SixJQUFBQSxFQUFFLENBQUMsbURBQUQsRUFBdUQrQixJQUFELElBQVU7QUFDaEUxQyxNQUFBQSxFQUFFLENBQUNPLE1BQUgsQ0FBVXdKLGdCQUFWLEdBQTZCLElBQTdCO0FBQ0EvSixNQUFBQSxFQUFFLENBQUM0RCxnQkFBSCxHQUFzQixLQUF0Qjs7QUFDQTVELE1BQUFBLEVBQUUsQ0FBQ29KLFFBQUgsR0FBYyxDQUFDbkIsSUFBRCxFQUFPdEQsSUFBUCxFQUFhQyxLQUFiLEtBQXVCO0FBQ25DM0QsUUFBQUEsTUFBTSxDQUFDZ0gsSUFBRCxDQUFOLENBQWE3RyxFQUFiLENBQWdCQyxLQUFoQixDQUFzQixLQUF0QjtBQUNBSixRQUFBQSxNQUFNLENBQUMwRCxJQUFELENBQU4sQ0FBYXZELEVBQWIsQ0FBZ0JDLEtBQWhCLENBQXNCLFNBQXRCO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzJELEtBQUQsQ0FBTixDQUFjeEQsRUFBZCxDQUFpQkMsS0FBakIsQ0FBdUIsR0FBdkI7QUFDQXFCLFFBQUFBLElBQUk7QUFDTCxPQUxEOztBQU1BMUMsTUFBQUEsRUFBRSxDQUFDTyxNQUFILENBQVV5SixPQUFWLENBQWtCO0FBQ2hCO0FBQ0FDLFFBQUFBLElBQUksRUFBRSxJQUFJL0YsVUFBSixDQUFlLENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixFQUFyQixFQUF5QixFQUF6QixFQUE2QixFQUE3QixFQUFpQyxFQUFqQyxFQUFxQyxFQUFyQyxFQUF5QyxFQUF6QyxFQUE2QyxFQUE3QyxFQUFpRCxFQUFqRCxFQUFxRCxFQUFyRCxFQUF5RCxFQUF6RCxDQUFmLEVBQTZFZ0c7QUFGbkUsT0FBbEI7QUFJRCxLQWJDLENBQUY7QUFlQXZKLElBQUFBLEVBQUUsQ0FBQyxpREFBRCxFQUFxRCtCLElBQUQsSUFBVTtBQUM5RDFDLE1BQUFBLEVBQUUsQ0FBQ08sTUFBSCxDQUFVd0osZ0JBQVYsR0FBNkIsSUFBN0I7QUFDQS9KLE1BQUFBLEVBQUUsQ0FBQzRELGdCQUFILEdBQXNCLEtBQXRCOztBQUNBNUQsTUFBQUEsRUFBRSxDQUFDb0osUUFBSCxHQUFjLENBQUNuQixJQUFELEVBQU90RCxJQUFQLEVBQWFDLEtBQWIsS0FBdUI7QUFDbkMzRCxRQUFBQSxNQUFNLENBQUNnSCxJQUFELENBQU4sQ0FBYTdHLEVBQWIsQ0FBZ0JDLEtBQWhCLENBQXNCLEtBQXRCO0FBQ0FKLFFBQUFBLE1BQU0sQ0FBQzBELElBQUQsQ0FBTixDQUFhdkQsRUFBYixDQUFnQkMsS0FBaEIsQ0FBc0IsT0FBdEI7QUFDQUosUUFBQUEsTUFBTSxDQUFDMkQsS0FBRCxDQUFOLENBQWN4RCxFQUFkLENBQWlCb0MsSUFBakIsQ0FBc0JuQyxLQUF0QixDQUE0QjtBQUMxQixlQUFLLEdBRHFCO0FBRTFCOEYsVUFBQUEsS0FBSyxFQUFFLENBQUMsUUFBRCxDQUZtQjtBQUcxQmdELFVBQUFBLE1BQU0sRUFBRTtBQUhrQixTQUE1QjtBQUtBekgsUUFBQUEsSUFBSTtBQUNMLE9BVEQ7O0FBVUExQyxNQUFBQSxFQUFFLENBQUNPLE1BQUgsQ0FBVXlKLE9BQVYsQ0FBa0I7QUFDaEI7QUFDQUMsUUFBQUEsSUFBSSxFQUFFLElBQUkvRixVQUFKLENBQWUsQ0FBQyxFQUFELEVBQUssRUFBTCxFQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLEVBQXlCLEVBQXpCLEVBQTZCLEVBQTdCLEVBQWlDLEVBQWpDLEVBQXFDLEVBQXJDLEVBQXlDLEVBQXpDLEVBQTZDLEVBQTdDLEVBQWlELEVBQWpELEVBQXFELEVBQXJELEVBQXlELEVBQXpELEVBQTZELEVBQTdELEVBQWlFLEVBQWpFLEVBQXFFLEVBQXJFLEVBQXlFLEVBQXpFLEVBQTZFLEVBQTdFLEVBQWlGLEVBQWpGLEVBQXFGLEVBQXJGLEVBQXlGLEdBQXpGLEVBQThGLEdBQTlGLEVBQW1HLEdBQW5HLEVBQXdHLEVBQXhHLEVBQTRHLEVBQTVHLEVBQWdILEVBQWhILEVBQW9ILEVBQXBILEVBQXdILEVBQXhILEVBQTRILEVBQTVILEVBQWdJLEVBQWhJLEVBQW9JLEVBQXBJLEVBQXdJLEVBQXhJLEVBQTRJLEVBQTVJLEVBQWdKLEVBQWhKLEVBQW9KLEVBQXBKLEVBQXdKLEVBQXhKLEVBQTRKLEVBQTVKLEVBQWdLLEVBQWhLLENBQWYsRUFBb0xnRztBQUYxSyxPQUFsQjtBQUlELEtBakJDLENBQUY7QUFrQkQsR0FqRE8sQ0FBUjtBQWtERCxDQXAwQ08sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucyAqL1xuXG5pbXBvcnQgSW1hcENsaWVudCwgeyBTVEFURV9TRUxFQ1RFRCwgU1RBVEVfTE9HT1VUIH0gZnJvbSAnLi9jbGllbnQnXG5pbXBvcnQgeyBwYXJzZXIgfSBmcm9tICdlbWFpbGpzLWltYXAtaGFuZGxlcidcbmltcG9ydCB7XG4gIHRvVHlwZWRBcnJheSxcbiAgTE9HX0xFVkVMX05PTkUgYXMgbG9nTGV2ZWxcbn0gZnJvbSAnLi9jb21tb24nXG5cbmRlc2NyaWJlKCdicm93c2VyYm94IHVuaXQgdGVzdHMnLCAoKSA9PiB7XG4gIHZhciBiclxuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGNvbnN0IGF1dGggPSB7IHVzZXI6ICdiYWxkcmlhbicsIHBhc3M6ICdzbGVlcGVyLmRlJyB9XG4gICAgYnIgPSBuZXcgSW1hcENsaWVudCgnc29tZWhvc3QnLCAxMjM0LCB7IGF1dGgsIGxvZ0xldmVsIH0pXG4gICAgYnIuY2xpZW50LnNvY2tldCA9IHtcbiAgICAgIHNlbmQ6ICgpID0+IHsgfSxcbiAgICAgIHVwZ3JhZGVUb1NlY3VyZTogKCkgPT4geyB9XG4gICAgfVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX29uSWRsZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgZW50ZXJJZGxlJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2VudGVySWRsZScpXG5cbiAgICAgIGJyLl9hdXRoZW50aWNhdGVkID0gdHJ1ZVxuICAgICAgYnIuX2VudGVyZWRJZGxlID0gZmFsc2VcbiAgICAgIGJyLl9vbklkbGUoKVxuXG4gICAgICBleHBlY3QoYnIuZW50ZXJJZGxlLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgY2FsbCBlbnRlcklkbGUnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZW50ZXJJZGxlJylcblxuICAgICAgYnIuX2VudGVyZWRJZGxlID0gdHJ1ZVxuICAgICAgYnIuX29uSWRsZSgpXG5cbiAgICAgIGV4cGVjdChici5lbnRlcklkbGUuY2FsbENvdW50KS50by5lcXVhbCgwKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNvcGVuQ29ubmVjdGlvbicsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnY29ubmVjdCcpXG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2Nsb3NlJylcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnZW5xdWV1ZUNvbW1hbmQnKVxuICAgIH0pXG4gICAgaXQoJ3Nob3VsZCBvcGVuIGNvbm5lY3Rpb24nLCAoKSA9PiB7XG4gICAgICBici5jbGllbnQuY29ubmVjdC5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIuY2xpZW50LmVucXVldWVDb21tYW5kLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY2FwYWJpbGl0eTogWydjYXBhMScsICdjYXBhMiddXG4gICAgICB9KSlcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gYnIuY2xpZW50Lm9ucmVhZHkoKSwgMClcbiAgICAgIHJldHVybiBici5vcGVuQ29ubmVjdGlvbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmVucXVldWVDb21tYW5kLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLl9jYXBhYmlsaXR5Lmxlbmd0aCkudG8uZXF1YWwoMilcbiAgICAgICAgZXhwZWN0KGJyLl9jYXBhYmlsaXR5WzBdKS50by5lcXVhbCgnY2FwYTEnKVxuICAgICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHlbMV0pLnRvLmVxdWFsKCdjYXBhMicpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNjb25uZWN0JywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdjb25uZWN0JylcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnY2xvc2UnKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZGF0ZUNhcGFiaWxpdHknKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZ3JhZGVDb25uZWN0aW9uJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICd1cGRhdGVJZCcpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnbG9naW4nKVxuICAgICAgc2lub24uc3R1YihiciwgJ2NvbXByZXNzQ29ubmVjdGlvbicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY29ubmVjdCcsICgpID0+IHtcbiAgICAgIGJyLmNsaWVudC5jb25uZWN0LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici51cGRhdGVDYXBhYmlsaXR5LnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici51cGdyYWRlQ29ubmVjdGlvbi5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIudXBkYXRlSWQucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLmxvZ2luLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici5jb21wcmVzc0Nvbm5lY3Rpb24ucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiBici5jbGllbnQub25yZWFkeSgpLCAwKVxuICAgICAgcmV0dXJuIGJyLmNvbm5lY3QoKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLnVwZGF0ZUNhcGFiaWxpdHkuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIudXBncmFkZUNvbm5lY3Rpb24uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIudXBkYXRlSWQuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIubG9naW4uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3QoYnIuY29tcHJlc3NDb25uZWN0aW9uLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFpbCB0byBsb2dpbicsIChkb25lKSA9PiB7XG4gICAgICBici5jbGllbnQuY29ubmVjdC5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIudXBkYXRlQ2FwYWJpbGl0eS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIudXBncmFkZUNvbm5lY3Rpb24ucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgIGJyLnVwZGF0ZUlkLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici5sb2dpbi50aHJvd3MobmV3IEVycm9yKCkpXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gYnIuY2xpZW50Lm9ucmVhZHkoKSwgMClcbiAgICAgIGJyLmNvbm5lY3QoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmV4aXN0XG5cbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jbG9zZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChici51cGRhdGVDYXBhYmlsaXR5LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLnVwZ3JhZGVDb25uZWN0aW9uLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLnVwZGF0ZUlkLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLmxvZ2luLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcblxuICAgICAgICBleHBlY3QoYnIuY29tcHJlc3NDb25uZWN0aW9uLmNhbGxlZCkudG8uYmUuZmFsc2VcblxuICAgICAgICBkb25lKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdGltZW91dCcsIChkb25lKSA9PiB7XG4gICAgICBici5jbGllbnQuY29ubmVjdC5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIudGltZW91dENvbm5lY3Rpb24gPSAxXG5cbiAgICAgIGJyLmNvbm5lY3QoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmV4aXN0XG5cbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jbG9zZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG5cbiAgICAgICAgZXhwZWN0KGJyLnVwZGF0ZUNhcGFiaWxpdHkuY2FsbGVkKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3QoYnIudXBncmFkZUNvbm5lY3Rpb24uY2FsbGVkKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3QoYnIudXBkYXRlSWQuY2FsbGVkKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3QoYnIubG9naW4uY2FsbGVkKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3QoYnIuY29tcHJlc3NDb25uZWN0aW9uLmNhbGxlZCkudG8uYmUuZmFsc2VcblxuICAgICAgICBkb25lKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2Nsb3NlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZm9yY2UtY2xvc2UnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2Nsb3NlJykucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgcmV0dXJuIGJyLmNsb3NlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5fc3RhdGUpLnRvLmVxdWFsKFNUQVRFX0xPR09VVClcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5jbG9zZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNleGVjJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2JyZWFrSWRsZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2VuZCBzdHJpbmcgY29tbWFuZCcsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnZW5xdWV1ZUNvbW1hbmQnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7fSkpXG4gICAgICByZXR1cm4gYnIuZXhlYygnVEVTVCcpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICBleHBlY3QocmVzKS50by5kZWVwLmVxdWFsKHt9KVxuICAgICAgICBleHBlY3QoYnIuY2xpZW50LmVucXVldWVDb21tYW5kLmFyZ3NbMF1bMF0pLnRvLmVxdWFsKCdURVNUJylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIGNhcGFiaWxpdHkgZnJvbSByZXNwb25zZScsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LCAnZW5xdWV1ZUNvbW1hbmQnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIGNhcGFiaWxpdHk6IFsnQScsICdCJ11cbiAgICAgIH0pKVxuICAgICAgcmV0dXJuIGJyLmV4ZWMoJ1RFU1QnKS50aGVuKChyZXMpID0+IHtcbiAgICAgICAgZXhwZWN0KHJlcykudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgY2FwYWJpbGl0eTogWydBJywgJ0InXVxuICAgICAgICB9KVxuICAgICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHkpLnRvLmRlZXAuZXF1YWwoWydBJywgJ0InXSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2VudGVySWRsZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBlcmlvZGljYWxseSBzZW5kIE5PT1AgaWYgSURMRSBub3Qgc3VwcG9ydGVkJywgKGRvbmUpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJykuY2FsbHNGYWtlKChjb21tYW5kKSA9PiB7XG4gICAgICAgIGV4cGVjdChjb21tYW5kKS50by5lcXVhbCgnTk9PUCcpXG5cbiAgICAgICAgZG9uZSgpXG4gICAgICB9KVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcbiAgICAgIGJyLnRpbWVvdXROb29wID0gMVxuICAgICAgYnIuZW50ZXJJZGxlKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwZXJpb2RpY2FsbHkgc2VuZCBOT09QIGlmIG5vIG1haWxib3ggc2VsZWN0ZWQnLCAoZG9uZSkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKS5jYWxsc0Zha2UoKGNvbW1hbmQpID0+IHtcbiAgICAgICAgZXhwZWN0KGNvbW1hbmQpLnRvLmVxdWFsKCdOT09QJylcblxuICAgICAgICBkb25lKClcbiAgICAgIH0pXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydJRExFJ11cbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSB1bmRlZmluZWRcbiAgICAgIGJyLnRpbWVvdXROb29wID0gMVxuICAgICAgYnIuZW50ZXJJZGxlKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBicmVhayBJRExFIGFmdGVyIHRpbWVvdXQnLCAoZG9uZSkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdlbnF1ZXVlQ29tbWFuZCcpXG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudC5zb2NrZXQsICdzZW5kJykuY2FsbHNGYWtlKChwYXlsb2FkKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5jbGllbnQuZW5xdWV1ZUNvbW1hbmQuYXJnc1swXVswXS5jb21tYW5kKS50by5lcXVhbCgnSURMRScpXG4gICAgICAgIGV4cGVjdChbXS5zbGljZS5jYWxsKG5ldyBVaW50OEFycmF5KHBheWxvYWQpKSkudG8uZGVlcC5lcXVhbChbMHg0NCwgMHg0ZiwgMHg0ZSwgMHg0NSwgMHgwZCwgMHgwYV0pXG5cbiAgICAgICAgZG9uZSgpXG4gICAgICB9KVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnSURMRSddXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcbiAgICAgIGJyLnRpbWVvdXRJZGxlID0gMVxuICAgICAgYnIuZW50ZXJJZGxlKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjYnJlYWtJZGxlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2VuZCBET05FIHRvIHNvY2tldCcsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIuY2xpZW50LnNvY2tldCwgJ3NlbmQnKVxuXG4gICAgICBici5fZW50ZXJlZElkbGUgPSAnSURMRSdcbiAgICAgIGJyLmJyZWFrSWRsZSgpXG4gICAgICBleHBlY3QoW10uc2xpY2UuY2FsbChuZXcgVWludDhBcnJheShici5jbGllbnQuc29ja2V0LnNlbmQuYXJnc1swXVswXSkpKS50by5kZWVwLmVxdWFsKFsweDQ0LCAweDRmLCAweDRlLCAweDQ1LCAweDBkLCAweDBhXSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjdXBncmFkZUNvbm5lY3Rpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBkbyBub3RoaW5nIGlmIGFscmVhZHkgc2VjdXJlZCcsICgpID0+IHtcbiAgICAgIGJyLmNsaWVudC5zZWN1cmVNb2RlID0gdHJ1ZVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ3N0YXJ0dGxzJ11cbiAgICAgIHJldHVybiBici51cGdyYWRlQ29ubmVjdGlvbigpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZG8gbm90aGluZyBpZiBTVEFSVFRMUyBub3QgYXZhaWxhYmxlJywgKCkgPT4ge1xuICAgICAgYnIuY2xpZW50LnNlY3VyZU1vZGUgPSBmYWxzZVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuICAgICAgcmV0dXJuIGJyLnVwZ3JhZGVDb25uZWN0aW9uKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gU1RBUlRUTFMnLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ3VwZ3JhZGUnKVxuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKS53aXRoQXJncygnU1RBUlRUTFMnKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZGF0ZUNhcGFiaWxpdHknKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnU1RBUlRUTFMnXVxuXG4gICAgICByZXR1cm4gYnIudXBncmFkZUNvbm5lY3Rpb24oKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC51cGdyYWRlLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLl9jYXBhYmlsaXR5Lmxlbmd0aCkudG8uZXF1YWwoMClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3VwZGF0ZUNhcGFiaWxpdHknLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZG8gbm90aGluZyBpZiBjYXBhYmlsaXR5IGlzIHNldCcsICgpID0+IHtcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydhYmMnXVxuICAgICAgcmV0dXJuIGJyLnVwZGF0ZUNhcGFiaWxpdHkoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBDQVBBQklMSVRZIGlmIGNhcGFiaWxpdHkgbm90IHNldCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuXG4gICAgICByZXR1cm4gYnIudXBkYXRlQ2FwYWJpbGl0eSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5hcmdzWzBdWzBdKS50by5lcXVhbCgnQ0FQQUJJTElUWScpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZvcmNlIHJ1biBDQVBBQklMSVRZJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ2FiYyddXG5cbiAgICAgIHJldHVybiBici51cGRhdGVDYXBhYmlsaXR5KHRydWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5hcmdzWzBdWzBdKS50by5lcXVhbCgnQ0FQQUJJTElUWScpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRvIG5vdGhpbmcgaWYgY29ubmVjdGlvbiBpcyBub3QgeWV0IHVwZ3JhZGVkJywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuICAgICAgYnIuY2xpZW50LnNlY3VyZU1vZGUgPSBmYWxzZVxuICAgICAgYnIuX3JlcXVpcmVUTFMgPSB0cnVlXG5cbiAgICAgIGJyLnVwZGF0ZUNhcGFiaWxpdHkoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNsaXN0TmFtZXNwYWNlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gTkFNRVNQQUNFIGlmIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgTkFNRVNQQUNFOiBbe1xuICAgICAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgW3tcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdTVFJJTkcnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdJTkJPWC4nXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogJy4nXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgXSwgbnVsbCwgbnVsbFxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pKVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ05BTUVTUEFDRSddXG5cbiAgICAgIHJldHVybiBici5saXN0TmFtZXNwYWNlcygpLnRoZW4oKG5hbWVzcGFjZXMpID0+IHtcbiAgICAgICAgZXhwZWN0KG5hbWVzcGFjZXMpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICAgIHBlcnNvbmFsOiBbe1xuICAgICAgICAgICAgcHJlZml4OiAnSU5CT1guJyxcbiAgICAgICAgICAgIGRlbGltaXRlcjogJy4nXG4gICAgICAgICAgfV0sXG4gICAgICAgICAgdXNlcnM6IGZhbHNlLFxuICAgICAgICAgIHNoYXJlZDogZmFsc2VcbiAgICAgICAgfSlcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuYXJnc1swXVswXSkudG8uZXF1YWwoJ05BTUVTUEFDRScpXG4gICAgICAgIGV4cGVjdChici5leGVjLmFyZ3NbMF1bMV0pLnRvLmVxdWFsKCdOQU1FU1BBQ0UnKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkbyBub3RoaW5nIGlmIG5vdCBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICByZXR1cm4gYnIubGlzdE5hbWVzcGFjZXMoKS50aGVuKChuYW1lc3BhY2VzKSA9PiB7XG4gICAgICAgIGV4cGVjdChuYW1lc3BhY2VzKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNjb21wcmVzc0Nvbm5lY3Rpb24nLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgICBzaW5vbi5zdHViKGJyLmNsaWVudCwgJ2VuYWJsZUNvbXByZXNzaW9uJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBydW4gQ09NUFJFU1M9REVGTEFURSBpZiBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0NPTVBSRVNTJyxcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgICAgdmFsdWU6ICdERUZMQVRFJ1xuICAgICAgICB9XVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe30pKVxuXG4gICAgICBici5fZW5hYmxlQ29tcHJlc3Npb24gPSB0cnVlXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnQ09NUFJFU1M9REVGTEFURSddXG4gICAgICByZXR1cm4gYnIuY29tcHJlc3NDb25uZWN0aW9uKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLmNsaWVudC5lbmFibGVDb21wcmVzc2lvbi5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRvIG5vdGhpbmcgaWYgbm90IHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gW11cblxuICAgICAgcmV0dXJuIGJyLmNvbXByZXNzQ29ubmVjdGlvbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRvIG5vdGhpbmcgaWYgbm90IGVuYWJsZWQnLCAoKSA9PiB7XG4gICAgICBici5fZW5hYmxlQ29tcHJlc3Npb24gPSBmYWxzZVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0NPTVBSRVNTPURFRkxBVEUnXVxuXG4gICAgICByZXR1cm4gYnIuY29tcHJlc3NDb25uZWN0aW9uKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2xvZ2luJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2FsbCBMT0dJTicsICgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJykucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe30pKVxuICAgICAgc2lub24uc3R1YihiciwgJ3VwZGF0ZUNhcGFiaWxpdHknKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh0cnVlKSlcblxuICAgICAgcmV0dXJuIGJyLmxvZ2luKHtcbiAgICAgICAgdXNlcjogJ3UxJyxcbiAgICAgICAgcGFzczogJ3AxJ1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuYXJnc1swXVswXSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgY29tbWFuZDogJ2xvZ2luJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICB2YWx1ZTogJ3UxJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdTVFJJTkcnLFxuICAgICAgICAgICAgdmFsdWU6ICdwMScsXG4gICAgICAgICAgICBzZW5zaXRpdmU6IHRydWVcbiAgICAgICAgICB9XVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIFhPQVVUSDInLCAoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHt9KSlcbiAgICAgIHNpbm9uLnN0dWIoYnIsICd1cGRhdGVDYXBhYmlsaXR5JykucmV0dXJucyhQcm9taXNlLnJlc29sdmUodHJ1ZSkpXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydBVVRIPVhPQVVUSDInXVxuICAgICAgYnIubG9naW4oe1xuICAgICAgICB1c2VyOiAndTEnLFxuICAgICAgICB4b2F1dGgyOiAnYWJjJ1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuYXJnc1swXVswXSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgY29tbWFuZDogJ0FVVEhFTlRJQ0FURScsXG4gICAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICAgIHZhbHVlOiAnWE9BVVRIMidcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgICAgICB2YWx1ZTogJ2RYTmxjajExTVFGaGRYUm9QVUpsWVhKbGNpQmhZbU1CQVE9PScsXG4gICAgICAgICAgICBzZW5zaXRpdmU6IHRydWVcbiAgICAgICAgICB9XVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjdXBkYXRlSWQnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IG5vdGhpbmcgaWYgbm90IHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gW11cblxuICAgICAgcmV0dXJuIGJyLnVwZGF0ZUlkKHtcbiAgICAgICAgYTogJ2InLFxuICAgICAgICBjOiAnZCdcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuc2VydmVySWQpLnRvLmJlLmZhbHNlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNlbmQgTklMJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdJRCcsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICBudWxsXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIElEOiBbe1xuICAgICAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnSUQnXVxuXG4gICAgICByZXR1cm4gYnIudXBkYXRlSWQobnVsbCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5zZXJ2ZXJJZCkudG8uZGVlcC5lcXVhbCh7fSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZXhoYW5nZSBJRCB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0lEJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIFsnY2tleTEnLCAnY3ZhbDEnLCAnY2tleTInLCAnY3ZhbDInXVxuICAgICAgICBdXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBJRDogW3tcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICAgICAgW3tcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3NrZXkxJ1xuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICdzdmFsMSdcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnc2tleTInXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3N2YWwyJ1xuICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pKVxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0lEJ11cblxuICAgICAgcmV0dXJuIGJyLnVwZGF0ZUlkKHtcbiAgICAgICAgY2tleTE6ICdjdmFsMScsXG4gICAgICAgIGNrZXkyOiAnY3ZhbDInXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLnNlcnZlcklkKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgICBza2V5MTogJ3N2YWwxJyxcbiAgICAgICAgICBza2V5MjogJ3N2YWwyJ1xuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjbGlzdE1haWxib3hlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIExJU1QgYW5kIExTVUIgaW4gc2VxdWVuY2UnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0xJU1QnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJycsICcqJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIExJU1Q6IFtmYWxzZV1cbiAgICAgICAgfVxuICAgICAgfSkpXG5cbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnTFNVQicsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnJywgJyonXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgTFNVQjogW2ZhbHNlXVxuICAgICAgICB9XG4gICAgICB9KSlcblxuICAgICAgcmV0dXJuIGJyLmxpc3RNYWlsYm94ZXMoKS50aGVuKCh0cmVlKSA9PiB7XG4gICAgICAgIGV4cGVjdCh0cmVlKS50by5leGlzdFxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgZGllIG9uIE5JTCBzZXBhcmF0b3JzJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdMSVNUJyxcbiAgICAgICAgYXR0cmlidXRlczogWycnLCAnKiddXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBMSVNUOiBbXG4gICAgICAgICAgICBwYXJzZXIodG9UeXBlZEFycmF5KCcqIExJU1QgKFxcXFxOb0luZmVyaW9ycykgTklMIFwiSU5CT1hcIicpKVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSkpXG5cbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnTFNVQicsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnJywgJyonXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgTFNVQjogW1xuICAgICAgICAgICAgcGFyc2VyKHRvVHlwZWRBcnJheSgnKiBMU1VCIChcXFxcTm9JbmZlcmlvcnMpIE5JTCBcIklOQk9YXCInKSlcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIubGlzdE1haWxib3hlcygpLnRoZW4oKHRyZWUpID0+IHtcbiAgICAgICAgZXhwZWN0KHRyZWUpLnRvLmV4aXN0XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNjcmVhdGVNYWlsYm94JywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgQ1JFQVRFIHdpdGggYSBzdHJpbmcgcGF5bG9hZCcsICgpID0+IHtcbiAgICAgIC8vIFRoZSBzcGVjIGFsbG93cyB1bnF1b3RlZCBBVE9NLXN0eWxlIHN5bnRheCB0b28sIGJ1dCBmb3JcbiAgICAgIC8vIHNpbXBsaWNpdHkgd2UgYWx3YXlzIGdlbmVyYXRlIGEgc3RyaW5nIGV2ZW4gaWYgaXQgY291bGQgYmVcbiAgICAgIC8vIGV4cHJlc3NlZCBhcyBhbiBhdG9tLlxuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdDUkVBVEUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJ21haWxib3huYW1lJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici5jcmVhdGVNYWlsYm94KCdtYWlsYm94bmFtZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgbXV0ZjcgZW5jb2RlIHRoZSBhcmd1bWVudCcsICgpID0+IHtcbiAgICAgIC8vIEZyb20gUkZDIDM1MDFcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnQ1JFQVRFJyxcbiAgICAgICAgYXR0cmlidXRlczogWyd+cGV0ZXIvbWFpbC8mVSxCVEZ3LS8mWmVWbkxJcWUtJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici5jcmVhdGVNYWlsYm94KCd+cGV0ZXIvbWFpbC9cXHU1M2YwXFx1NTMxNy9cXHU2NWU1XFx1NjcyY1xcdThhOWUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB0cmVhdCBhbiBBTFJFQURZRVhJU1RTIHJlc3BvbnNlIGFzIHN1Y2Nlc3MnLCAoKSA9PiB7XG4gICAgICB2YXIgZmFrZUVyciA9IHtcbiAgICAgICAgY29kZTogJ0FMUkVBRFlFWElTVFMnXG4gICAgICB9XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ0NSRUFURScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFsnbWFpbGJveG5hbWUnXVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlamVjdChmYWtlRXJyKSlcblxuICAgICAgcmV0dXJuIGJyLmNyZWF0ZU1haWxib3goJ21haWxib3huYW1lJykudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2RlbGV0ZU1haWxib3gnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBERUxFVEUgd2l0aCBhIHN0cmluZyBwYXlsb2FkJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdERUxFVEUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbJ21haWxib3huYW1lJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici5kZWxldGVNYWlsYm94KCdtYWlsYm94bmFtZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgbXV0ZjcgZW5jb2RlIHRoZSBhcmd1bWVudCcsICgpID0+IHtcbiAgICAgIC8vIEZyb20gUkZDIDM1MDFcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnREVMRVRFJyxcbiAgICAgICAgYXR0cmlidXRlczogWyd+cGV0ZXIvbWFpbC8mVSxCVEZ3LS8mWmVWbkxJcWUtJ11cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici5kZWxldGVNYWlsYm94KCd+cGV0ZXIvbWFpbC9cXHU1M2YwXFx1NTMxNy9cXHU2NWU1XFx1NjcyY1xcdThhOWUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlLnNraXAoJyNsaXN0TWVzc2FnZXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnX2J1aWxkRkVUQ0hDb21tYW5kJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfcGFyc2VGRVRDSCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBGRVRDSCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoJ2FiYycpKVxuICAgICAgYnIuX2J1aWxkRkVUQ0hDb21tYW5kLndpdGhBcmdzKFsnMToyJywgWyd1aWQnLCAnZmxhZ3MnXSwge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfV0pLnJldHVybnMoe30pXG5cbiAgICAgIHJldHVybiBici5saXN0TWVzc2FnZXMoJ0lOQk9YJywgJzE6MicsIFsndWlkJywgJ2ZsYWdzJ10sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuX2J1aWxkRkVUQ0hDb21tYW5kLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLl9wYXJzZUZFVENILndpdGhBcmdzKCdhYmMnKS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUuc2tpcCgnI3NlYXJjaCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfYnVpbGRTRUFSQ0hDb21tYW5kJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfcGFyc2VTRUFSQ0gnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgU0VBUkNIJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG4gICAgICBici5fYnVpbGRTRUFSQ0hDb21tYW5kLndpdGhBcmdzKHtcbiAgICAgICAgdWlkOiAxXG4gICAgICB9LCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS5yZXR1cm5zKHt9KVxuXG4gICAgICByZXR1cm4gYnIuc2VhcmNoKCdJTkJPWCcsIHtcbiAgICAgICAgdWlkOiAxXG4gICAgICB9LCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLl9idWlsZFNFQVJDSENvbW1hbmQuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIGV4cGVjdChici5fcGFyc2VTRUFSQ0gud2l0aEFyZ3MoJ2FiYycpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3VwbG9hZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIEFQUEVORCB3aXRoIGN1c3RvbSBmbGFnJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICByZXR1cm4gYnIudXBsb2FkKCdtYWlsYm94JywgJ3RoaXMgaXMgYSBtZXNzYWdlJywge1xuICAgICAgICBmbGFnczogWydcXFxcJE15RmxhZyddXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIEFQUEVORCB3L28gZmxhZ3MnLCAoKSA9PiB7XG4gICAgICBici5leGVjLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG5cbiAgICAgIHJldHVybiBici51cGxvYWQoJ21haWxib3gnLCAndGhpcyBpcyBhIG1lc3NhZ2UnKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlLnNraXAoJyNzZXRGbGFncycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfYnVpbGRTVE9SRUNvbW1hbmQnKVxuICAgICAgc2lub24uc3R1YihiciwgJ19wYXJzZUZFVENIJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIFNUT1JFJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG4gICAgICBici5fYnVpbGRTVE9SRUNvbW1hbmQud2l0aEFyZ3MoJzE6MicsICdGTEFHUycsIFsnXFxcXFNlZW4nLCAnJE15RmxhZyddLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS5yZXR1cm5zKHt9KVxuXG4gICAgICByZXR1cm4gYnIuc2V0RmxhZ3MoJ0lOQk9YJywgJzE6MicsIFsnXFxcXFNlZW4nLCAnJE15RmxhZyddLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX3BhcnNlRkVUQ0gud2l0aEFyZ3MoJ2FiYycpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZS5za2lwKCcjc3RvcmUnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnX2J1aWxkU1RPUkVDb21tYW5kJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdfcGFyc2VGRVRDSCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBTVE9SRScsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoJ2FiYycpKVxuICAgICAgYnIuX2J1aWxkU1RPUkVDb21tYW5kLndpdGhBcmdzKCcxOjInLCAnK1gtR00tTEFCRUxTJywgWydcXFxcU2VudCcsICdcXFxcSnVuayddLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS5yZXR1cm5zKHt9KVxuXG4gICAgICByZXR1cm4gYnIuc3RvcmUoJ0lOQk9YJywgJzE6MicsICcrWC1HTS1MQUJFTFMnLCBbJ1xcXFxTZW50JywgJ1xcXFxKdW5rJ10sIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuX2J1aWxkU1RPUkVDb21tYW5kLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QoYnIuX3BhcnNlRkVUQ0gud2l0aEFyZ3MoJ2FiYycpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI2RlbGV0ZU1lc3NhZ2VzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ3NldEZsYWdzJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdleGVjJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIFVJRCBFWFBVTkdFJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdVSUQgRVhQVU5HRScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgICAgICB2YWx1ZTogJzE6MidcbiAgICAgICAgfV1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCdhYmMnKSlcbiAgICAgIGJyLnNldEZsYWdzLndpdGhBcmdzKCdJTkJPWCcsICcxOjInLCB7XG4gICAgICAgIGFkZDogJ1xcXFxEZWxldGVkJ1xuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ1VJRFBMVVMnXVxuICAgICAgcmV0dXJuIGJyLmRlbGV0ZU1lc3NhZ2VzKCdJTkJPWCcsICcxOjInLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIEVYUFVOR0UnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKCdFWFBVTkdFJykucmV0dXJucyhQcm9taXNlLnJlc29sdmUoJ2FiYycpKVxuICAgICAgYnIuc2V0RmxhZ3Mud2l0aEFyZ3MoJ0lOQk9YJywgJzE6MicsIHtcbiAgICAgICAgYWRkOiAnXFxcXERlbGV0ZWQnXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgpKVxuXG4gICAgICBici5fY2FwYWJpbGl0eSA9IFtdXG4gICAgICByZXR1cm4gYnIuZGVsZXRlTWVzc2FnZXMoJ0lOQk9YJywgJzE6MicsIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNjb3B5TWVzc2FnZXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBDT1BZJywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdVSUQgQ09QWScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgICAgICB2YWx1ZTogJzE6MidcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgICAgICB2YWx1ZTogJ1tHbWFpbF0vVHJhc2gnXG4gICAgICAgIH1dXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIGNvcHl1aWQ6IFsnMScsICcxOjInLCAnNCwzJ11cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIuY29weU1lc3NhZ2VzKCdJTkJPWCcsICcxOjInLCAnW0dtYWlsXS9UcmFzaCcsIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgc3JjU2VxU2V0OiAnMToyJyxcbiAgICAgICAgICBkZXN0U2VxU2V0OiAnNCwzJ1xuICAgICAgICB9KVxuICAgICAgICBleHBlY3QoYnIuZXhlYy5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNtb3ZlTWVzc2FnZXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgICBzaW5vbi5zdHViKGJyLCAnY29weU1lc3NhZ2VzJylcbiAgICAgIHNpbm9uLnN0dWIoYnIsICdkZWxldGVNZXNzYWdlcycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBNT1ZFIGlmIHN1cHBvcnRlZCcsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnVUlEIE1PVkUnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgIHR5cGU6ICdzZXF1ZW5jZScsXG4gICAgICAgICAgdmFsdWU6ICcxOjInXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnYXRvbScsXG4gICAgICAgICAgdmFsdWU6ICdbR21haWxdL1RyYXNoJ1xuICAgICAgICB9XVxuICAgICAgfSwgWydPSyddKS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpXG5cbiAgICAgIGJyLl9jYXBhYmlsaXR5ID0gWydNT1ZFJ11cbiAgICAgIHJldHVybiBici5tb3ZlTWVzc2FnZXMoJ0lOQk9YJywgJzE6MicsICdbR21haWxdL1RyYXNoJywge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gY29weStleHB1bmdlJywgKCkgPT4ge1xuICAgICAgYnIuY29weU1lc3NhZ2VzLndpdGhBcmdzKCdJTkJPWCcsICcxOjInLCAnW0dtYWlsXS9UcmFzaCcsIHtcbiAgICAgICAgYnlVaWQ6IHRydWVcbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgICBici5kZWxldGVNZXNzYWdlcy53aXRoQXJncygnMToyJywge1xuICAgICAgICBieVVpZDogdHJ1ZVxuICAgICAgfSkucmV0dXJucyhQcm9taXNlLnJlc29sdmUoKSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbXVxuICAgICAgcmV0dXJuIGJyLm1vdmVNZXNzYWdlcygnSU5CT1gnLCAnMToyJywgJ1tHbWFpbF0vVHJhc2gnLCB7XG4gICAgICAgIGJ5VWlkOiB0cnVlXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmRlbGV0ZU1lc3NhZ2VzLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI19zaG91bGRTZWxlY3RNYWlsYm94JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRydWUgd2hlbiBjdHggaXMgdW5kZWZpbmVkJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGJyLl9zaG91bGRTZWxlY3RNYWlsYm94KCdwYXRoJykpLnRvLmJlLnRydWVcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIGEgZGlmZmVyZW50IHBhdGggaXMgcXVldWVkJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdnZXRQcmV2aW91c2x5UXVldWVkJykucmV0dXJucyh7XG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICBjb21tYW5kOiAnU0VMRUNUJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICB2YWx1ZTogJ3F1ZXVlZCBwYXRoJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChici5fc2hvdWxkU2VsZWN0TWFpbGJveCgncGF0aCcsIHt9KSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSB3aGVuIHRoZSBzYW1lIHBhdGggaXMgcXVldWVkJywgKCkgPT4ge1xuICAgICAgc2lub24uc3R1Yihici5jbGllbnQsICdnZXRQcmV2aW91c2x5UXVldWVkJykucmV0dXJucyh7XG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICBjb21tYW5kOiAnU0VMRUNUJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgICB2YWx1ZTogJ3F1ZXVlZCBwYXRoJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChici5fc2hvdWxkU2VsZWN0TWFpbGJveCgncXVldWVkIHBhdGgnLCB7fSkpLnRvLmJlLmZhbHNlXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI3NlbGVjdE1haWxib3gnLCAoKSA9PiB7XG4gICAgY29uc3QgcGF0aCA9ICdbR21haWxdL1RyYXNoJ1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc2lub24uc3R1YihiciwgJ2V4ZWMnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBTRUxFQ1QnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1NFTEVDVCcsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgdmFsdWU6IHBhdGhcbiAgICAgICAgfV1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY29kZTogJ1JFQUQtV1JJVEUnXG4gICAgICB9KSlcblxuICAgICAgcmV0dXJuIGJyLnNlbGVjdE1haWxib3gocGF0aCkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLl9zdGF0ZSkudG8uZXF1YWwoU1RBVEVfU0VMRUNURUQpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBTRUxFQ1Qgd2l0aCBDT05EU1RPUkUnLCAoKSA9PiB7XG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1NFTEVDVCcsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgICAgdHlwZTogJ1NUUklORycsXG4gICAgICAgICAgdmFsdWU6IHBhdGhcbiAgICAgICAgfSxcbiAgICAgICAgW3tcbiAgICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgICAgdmFsdWU6ICdDT05EU1RPUkUnXG4gICAgICAgIH1dXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY29kZTogJ1JFQUQtV1JJVEUnXG4gICAgICB9KSlcblxuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0NPTkRTVE9SRSddXG4gICAgICByZXR1cm4gYnIuc2VsZWN0TWFpbGJveChwYXRoLCB7XG4gICAgICAgIGNvbmRzdG9yZTogdHJ1ZVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KGJyLl9zdGF0ZSkudG8uZXF1YWwoU1RBVEVfU0VMRUNURUQpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBkZXNjcmliZSgnc2hvdWxkIGVtaXQgb25zZWxlY3RtYWlsYm94IGJlZm9yZSBzZWxlY3RNYWlsYm94IGlzIHJlc29sdmVkJywgKCkgPT4ge1xuICAgICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICAgIGJyLmV4ZWMucmV0dXJucyhQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgIGNvZGU6ICdSRUFELVdSSVRFJ1xuICAgICAgICB9KSlcbiAgICAgIH0pXG5cbiAgICAgIGl0KCd3aGVuIGl0IHJldHVybnMgYSBwcm9taXNlJywgKCkgPT4ge1xuICAgICAgICB2YXIgcHJvbWlzZVJlc29sdmVkID0gZmFsc2VcbiAgICAgICAgYnIub25zZWxlY3RtYWlsYm94ID0gKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICBwcm9taXNlUmVzb2x2ZWQgPSB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIHZhciBvbnNlbGVjdG1haWxib3hTcHkgPSBzaW5vbi5zcHkoYnIsICdvbnNlbGVjdG1haWxib3gnKVxuICAgICAgICByZXR1cm4gYnIuc2VsZWN0TWFpbGJveChwYXRoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBleHBlY3Qob25zZWxlY3RtYWlsYm94U3B5LndpdGhBcmdzKHBhdGgpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgICBleHBlY3QocHJvbWlzZVJlc29sdmVkKS50by5lcXVhbCh0cnVlKVxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgaXQoJ3doZW4gaXQgZG9lcyBub3QgcmV0dXJuIGEgcHJvbWlzZScsICgpID0+IHtcbiAgICAgICAgYnIub25zZWxlY3RtYWlsYm94ID0gKCkgPT4geyB9XG4gICAgICAgIHZhciBvbnNlbGVjdG1haWxib3hTcHkgPSBzaW5vbi5zcHkoYnIsICdvbnNlbGVjdG1haWxib3gnKVxuICAgICAgICByZXR1cm4gYnIuc2VsZWN0TWFpbGJveChwYXRoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBleHBlY3Qob25zZWxlY3RtYWlsYm94U3B5LndpdGhBcmdzKHBhdGgpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZW1pdCBvbmNsb3NlbWFpbGJveCcsICgpID0+IHtcbiAgICAgIGxldCBjYWxsZWQgPSBmYWxzZVxuICAgICAgYnIuZXhlYy5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSgnYWJjJykpLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgY29kZTogJ1JFQUQtV1JJVEUnXG4gICAgICB9KSlcblxuICAgICAgYnIub25jbG9zZW1haWxib3ggPSAocGF0aCkgPT4ge1xuICAgICAgICBleHBlY3QocGF0aCkudG8uZXF1YWwoJ3l5eScpXG4gICAgICAgIGNhbGxlZCA9IHRydWVcbiAgICAgIH1cblxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9ICd5eXknXG4gICAgICByZXR1cm4gYnIuc2VsZWN0TWFpbGJveChwYXRoKS50aGVuKCgpID0+IHtcbiAgICAgICAgZXhwZWN0KGNhbGxlZCkudG8uYmUudHJ1ZVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjbWFpbGJveFN0YXR1cycsICgpID0+IHtcbiAgICBjb25zdCBwYXRoID0gJ0luYm94J1xuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBzaW5vbi5zdHViKGJyLCAnZXhlYycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIFNUQVRVUycsICgpID0+IHtcbiAgICAgIGJyLmV4ZWMud2l0aEFyZ3Moe1xuICAgICAgICBjb21tYW5kOiAnU1RBVFVTJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgICAgW1xuICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnVUlETkVYVCcgfSxcbiAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ01FU1NBR0VTJyB9XG4gICAgICAgICAgXVxuICAgICAgICBdXG4gICAgICB9KS5yZXR1cm5zKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBTVEFUVVM6IFt7XG4gICAgICAgICAgICB0YWc6ICcqJyxcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdTVEFUVVMnLFxuICAgICAgICAgICAgYXR0cmlidXRlczpcbiAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogcGF0aCB9LFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ1VJRE5FWFQnIH0sXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICcyODI0JyB9LFxuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnTUVTU0FHRVMnIH0sXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICc2NzYnIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9KSlcblxuICAgICAgcmV0dXJuIGJyLm1haWxib3hTdGF0dXMocGF0aCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KHJlc3VsdC51aWROZXh0KS50by5lcXVhbCgyODI0KVxuICAgICAgICBleHBlY3QocmVzdWx0Lm1lc3NhZ2VzKS50by5lcXVhbCg2NzYpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJ1biBTVEFUVVMgd2l0aCBISUdIRVNUTU9EU0VRJywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ0NPTkRTVE9SRSddXG4gICAgICBici5leGVjLndpdGhBcmdzKHtcbiAgICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogcGF0aCB9LFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ1VJRE5FWFQnIH0sXG4gICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdNRVNTQUdFUycgfSxcbiAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ0hJR0hFU1RNT0RTRVEnIH1cbiAgICAgICAgICBdXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIFNUQVRVUzogW3tcbiAgICAgICAgICAgIHRhZzogJyonLFxuICAgICAgICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOlxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnVUlETkVYVCcgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJzI4MjQnIH0sXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdNRVNTQUdFUycgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJzY3NicgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ0hJR0hFU1RNT0RTRVEnIH0sXG4gICAgICAgICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICcxMCcgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pKVxuXG4gICAgICByZXR1cm4gYnIubWFpbGJveFN0YXR1cyhwYXRoLCB7IGNvbmRzdG9yZTogdHJ1ZSB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgZXhwZWN0KGJyLmV4ZWMuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgICAgICBleHBlY3QocmVzdWx0LnVpZE5leHQpLnRvLmVxdWFsKDI4MjQpXG4gICAgICAgIGV4cGVjdChyZXN1bHQubWVzc2FnZXMpLnRvLmVxdWFsKDY3NilcbiAgICAgICAgZXhwZWN0KHJlc3VsdC5oaWdoZXN0TW9kc2VxKS50by5lcXVhbCgxMClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcnVuIFNUQVRVUyB3aXRoIGludmFsaWQgcmVzdWx0JywgKCkgPT4ge1xuICAgICAgYnIuZXhlYy53aXRoQXJncyh7XG4gICAgICAgIGNvbW1hbmQ6ICdTVEFUVVMnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAgeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IHBhdGggfSxcbiAgICAgICAgICBbXG4gICAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdVSURORVhUJyB9LFxuICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnTUVTU0FHRVMnIH1cbiAgICAgICAgICBdXG4gICAgICAgIF1cbiAgICAgIH0pLnJldHVybnMoUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIFNUQVRVUzogW3tcbiAgICAgICAgICAgIHRhZzogJyonLFxuICAgICAgICAgICAgY29tbWFuZDogJ1NUQVRVUycsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOlxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiBwYXRoIH0sXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnQVRPTScsIHZhbHVlOiAnVUlETkVYVCcgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ3lvdXlvdScgfSxcbiAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ01FU1NBR0VTX2ludmFsaWQnIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9KSlcblxuICAgICAgcmV0dXJuIGJyLm1haWxib3hTdGF0dXMocGF0aCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGV4cGVjdChici5leGVjLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KHJlc3VsdC51aWROZXh0KS50by5lcXVhbChudWxsKVxuICAgICAgICBleHBlY3QocmVzdWx0Lm1lc3NhZ2VzKS50by5lcXVhbChudWxsKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjaGFzQ2FwYWJpbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRldGVjdCBleGlzdGluZyBjYXBhYmlsaXR5JywgKCkgPT4ge1xuICAgICAgYnIuX2NhcGFiaWxpdHkgPSBbJ1paWiddXG4gICAgICBleHBlY3QoYnIuaGFzQ2FwYWJpbGl0eSgnenp6JykpLnRvLmJlLnRydWVcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkZXRlY3Qgbm9uIGV4aXN0aW5nIGNhcGFiaWxpdHknLCAoKSA9PiB7XG4gICAgICBici5fY2FwYWJpbGl0eSA9IFsnWlpaJ11cbiAgICAgIGV4cGVjdChici5oYXNDYXBhYmlsaXR5KCdvb28nKSkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdChici5oYXNDYXBhYmlsaXR5KCkpLnRvLmJlLmZhbHNlXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnI191bnRhZ2dlZE9rSGFuZGxlcicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBjYXBhYmlsaXR5IGlmIHByZXNlbnQnLCAoKSA9PiB7XG4gICAgICBici5fdW50YWdnZWRPa0hhbmRsZXIoe1xuICAgICAgICBjYXBhYmlsaXR5OiBbJ2FiYyddXG4gICAgICB9LCAoKSA9PiB7IH0pXG4gICAgICBleHBlY3QoYnIuX2NhcGFiaWxpdHkpLnRvLmRlZXAuZXF1YWwoWydhYmMnXSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX3VudGFnZ2VkQ2FwYWJpbGl0eUhhbmRsZXInLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgY2FwYWJpbGl0eScsICgpID0+IHtcbiAgICAgIGJyLl91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyKHtcbiAgICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgICB2YWx1ZTogJ2FiYydcbiAgICAgICAgfV1cbiAgICAgIH0sICgpID0+IHsgfSlcbiAgICAgIGV4cGVjdChici5fY2FwYWJpbGl0eSkudG8uZGVlcC5lcXVhbChbJ0FCQyddKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfdW50YWdnZWRFeGlzdHNIYW5kbGVyJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZW1pdCBvbnVwZGF0ZScsICgpID0+IHtcbiAgICAgIGJyLm9udXBkYXRlID0gc2lub24uc3R1YigpXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcblxuICAgICAgYnIuX3VudGFnZ2VkRXhpc3RzSGFuZGxlcih7XG4gICAgICAgIG5yOiAxMjNcbiAgICAgIH0sICgpID0+IHsgfSlcbiAgICAgIGV4cGVjdChici5vbnVwZGF0ZS53aXRoQXJncygnRk9PJywgJ2V4aXN0cycsIDEyMykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfdW50YWdnZWRFeHB1bmdlSGFuZGxlcicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGVtaXQgb251cGRhdGUnLCAoKSA9PiB7XG4gICAgICBici5vbnVwZGF0ZSA9IHNpbm9uLnN0dWIoKVxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9ICdGT08nXG5cbiAgICAgIGJyLl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyKHtcbiAgICAgICAgbnI6IDEyM1xuICAgICAgfSwgKCkgPT4geyB9KVxuICAgICAgZXhwZWN0KGJyLm9udXBkYXRlLndpdGhBcmdzKCdGT08nLCAnZXhwdW5nZScsIDEyMykuY2FsbENvdW50KS50by5lcXVhbCgxKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUuc2tpcCgnI191bnRhZ2dlZEZldGNoSGFuZGxlcicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGVtaXQgb251cGRhdGUnLCAoKSA9PiB7XG4gICAgICBici5vbnVwZGF0ZSA9IHNpbm9uLnN0dWIoKVxuICAgICAgc2lub24uc3R1YihiciwgJ19wYXJzZUZFVENIJykucmV0dXJucygnYWJjJylcbiAgICAgIGJyLl9zZWxlY3RlZE1haWxib3ggPSAnRk9PJ1xuXG4gICAgICBici5fdW50YWdnZWRGZXRjaEhhbmRsZXIoe1xuICAgICAgICBucjogMTIzXG4gICAgICB9LCAoKSA9PiB7IH0pXG4gICAgICBleHBlY3QoYnIub251cGRhdGUud2l0aEFyZ3MoJ0ZPTycsICdmZXRjaCcsICdhYmMnKS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICBleHBlY3QoYnIuX3BhcnNlRkVUQ0guYXJnc1swXVswXSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBGRVRDSDogW3tcbiAgICAgICAgICAgIG5yOiAxMjNcbiAgICAgICAgICB9XVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJyNfY2hhbmdlU3RhdGUnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzZXQgdGhlIHN0YXRlIHZhbHVlJywgKCkgPT4ge1xuICAgICAgYnIuX2NoYW5nZVN0YXRlKDEyMzQ1KVxuXG4gICAgICBleHBlY3QoYnIuX3N0YXRlKS50by5lcXVhbCgxMjM0NSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBlbWl0IG9uY2xvc2VtYWlsYm94IGlmIG1haWxib3ggd2FzIGNsb3NlZCcsICgpID0+IHtcbiAgICAgIGJyLm9uY2xvc2VtYWlsYm94ID0gc2lub24uc3R1YigpXG4gICAgICBici5fc3RhdGUgPSBTVEFURV9TRUxFQ1RFRFxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9ICdhYWEnXG5cbiAgICAgIGJyLl9jaGFuZ2VTdGF0ZSgxMjM0NSlcblxuICAgICAgZXhwZWN0KGJyLl9zZWxlY3RlZE1haWxib3gpLnRvLmJlLmZhbHNlXG4gICAgICBleHBlY3QoYnIub25jbG9zZW1haWxib3gud2l0aEFyZ3MoJ2FhYScpLmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjX2Vuc3VyZVBhdGgnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdGhlIHBhdGggaWYgbm90IHByZXNlbnQnLCAoKSA9PiB7XG4gICAgICB2YXIgdHJlZSA9IHtcbiAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICB9XG4gICAgICBleHBlY3QoYnIuX2Vuc3VyZVBhdGgodHJlZSwgJ2hlbGxvL3dvcmxkJywgJy8nKSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIG5hbWU6ICd3b3JsZCcsXG4gICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICBwYXRoOiAnaGVsbG8vd29ybGQnLFxuICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgIH0pXG4gICAgICBleHBlY3QodHJlZSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIG5hbWU6ICdoZWxsbycsXG4gICAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgICAgcGF0aDogJ2hlbGxvJyxcbiAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgIG5hbWU6ICd3b3JsZCcsXG4gICAgICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgICAgIHBhdGg6ICdoZWxsby93b3JsZCcsXG4gICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICB9XVxuICAgICAgICB9XVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZXhpc3RpbmcgcGF0aCBpZiBwb3NzaWJsZScsICgpID0+IHtcbiAgICAgIHZhciB0cmVlID0ge1xuICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICBuYW1lOiAnaGVsbG8nLFxuICAgICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICAgIHBhdGg6ICdoZWxsbycsXG4gICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICBuYW1lOiAnd29ybGQnLFxuICAgICAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgICAgICBwYXRoOiAnaGVsbG8vd29ybGQnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgYWJjOiAxMjNcbiAgICAgICAgICB9XVxuICAgICAgICB9XVxuICAgICAgfVxuICAgICAgZXhwZWN0KGJyLl9lbnN1cmVQYXRoKHRyZWUsICdoZWxsby93b3JsZCcsICcvJykpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICBuYW1lOiAnd29ybGQnLFxuICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgcGF0aDogJ2hlbGxvL3dvcmxkJyxcbiAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICBhYmM6IDEyM1xuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY2FzZSBpbnNlbnNpdGl2ZSBJbmJveCcsICgpID0+IHtcbiAgICAgIHZhciB0cmVlID0ge1xuICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgIH1cbiAgICAgIGV4cGVjdChici5fZW5zdXJlUGF0aCh0cmVlLCAnSW5ib3gvd29ybGQnLCAnLycpKS50by5kZWVwLmVxdWFsKHtcbiAgICAgICAgbmFtZTogJ3dvcmxkJyxcbiAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgIHBhdGg6ICdJbmJveC93b3JsZCcsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfSlcbiAgICAgIGV4cGVjdChici5fZW5zdXJlUGF0aCh0cmVlLCAnSU5CT1gvd29ybGRzJywgJy8nKSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIG5hbWU6ICd3b3JsZHMnLFxuICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgcGF0aDogJ0lOQk9YL3dvcmxkcycsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KHRyZWUpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICBuYW1lOiAnSW5ib3gnLFxuICAgICAgICAgIGRlbGltaXRlcjogJy8nLFxuICAgICAgICAgIHBhdGg6ICdJbmJveCcsXG4gICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICBuYW1lOiAnd29ybGQnLFxuICAgICAgICAgICAgZGVsaW1pdGVyOiAnLycsXG4gICAgICAgICAgICBwYXRoOiAnSW5ib3gvd29ybGQnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ3dvcmxkcycsXG4gICAgICAgICAgICBkZWxpbWl0ZXI6ICcvJyxcbiAgICAgICAgICAgIHBhdGg6ICdJTkJPWC93b3JsZHMnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgfV1cbiAgICAgICAgfV1cbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgndW50YWdnZWQgdXBkYXRlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlY2VpdmUgaW5mb3JtYXRpb24gYWJvdXQgdW50YWdnZWQgZXhpc3RzJywgKGRvbmUpID0+IHtcbiAgICAgIGJyLmNsaWVudC5fY29ubmVjdGlvblJlYWR5ID0gdHJ1ZVxuICAgICAgYnIuX3NlbGVjdGVkTWFpbGJveCA9ICdGT08nXG4gICAgICBici5vbnVwZGF0ZSA9IChwYXRoLCB0eXBlLCB2YWx1ZSkgPT4ge1xuICAgICAgICBleHBlY3QocGF0aCkudG8uZXF1YWwoJ0ZPTycpXG4gICAgICAgIGV4cGVjdCh0eXBlKS50by5lcXVhbCgnZXhpc3RzJylcbiAgICAgICAgZXhwZWN0KHZhbHVlKS50by5lcXVhbCgxMjMpXG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgICAgYnIuY2xpZW50Ll9vbkRhdGEoe1xuICAgICAgICAvKiAqIDEyMyBFWElTVFNcXHJcXG4gKi9cbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoWzQyLCAzMiwgNDksIDUwLCA1MSwgMzIsIDY5LCA4OCwgNzMsIDgzLCA4NCwgODMsIDEzLCAxMF0pLmJ1ZmZlclxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZWNlaXZlIGluZm9ybWF0aW9uIGFib3V0IHVudGFnZ2VkIGV4cHVuZ2UnLCAoZG9uZSkgPT4ge1xuICAgICAgYnIuY2xpZW50Ll9jb25uZWN0aW9uUmVhZHkgPSB0cnVlXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcbiAgICAgIGJyLm9udXBkYXRlID0gKHBhdGgsIHR5cGUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGV4cGVjdChwYXRoKS50by5lcXVhbCgnRk9PJylcbiAgICAgICAgZXhwZWN0KHR5cGUpLnRvLmVxdWFsKCdleHB1bmdlJylcbiAgICAgICAgZXhwZWN0KHZhbHVlKS50by5lcXVhbCg0NTYpXG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgICAgYnIuY2xpZW50Ll9vbkRhdGEoe1xuICAgICAgICAvKiAqIDQ1NiBFWFBVTkdFXFxyXFxuICovXG4gICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KFs0MiwgMzIsIDUyLCA1MywgNTQsIDMyLCA2OSwgODgsIDgwLCA4NSwgNzgsIDcxLCA2OSwgMTMsIDEwXSkuYnVmZmVyXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlY2VpdmUgaW5mb3JtYXRpb24gYWJvdXQgdW50YWdnZWQgZmV0Y2gnLCAoZG9uZSkgPT4ge1xuICAgICAgYnIuY2xpZW50Ll9jb25uZWN0aW9uUmVhZHkgPSB0cnVlXG4gICAgICBici5fc2VsZWN0ZWRNYWlsYm94ID0gJ0ZPTydcbiAgICAgIGJyLm9udXBkYXRlID0gKHBhdGgsIHR5cGUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGV4cGVjdChwYXRoKS50by5lcXVhbCgnRk9PJylcbiAgICAgICAgZXhwZWN0KHR5cGUpLnRvLmVxdWFsKCdmZXRjaCcpXG4gICAgICAgIGV4cGVjdCh2YWx1ZSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgJyMnOiAxMjMsXG4gICAgICAgICAgZmxhZ3M6IFsnXFxcXFNlZW4nXSxcbiAgICAgICAgICBtb2RzZXE6ICc0J1xuICAgICAgICB9KVxuICAgICAgICBkb25lKClcbiAgICAgIH1cbiAgICAgIGJyLmNsaWVudC5fb25EYXRhKHtcbiAgICAgICAgLyogKiAxMjMgRkVUQ0ggKEZMQUdTIChcXFxcU2VlbikgTU9EU0VRICg0KSlcXHJcXG4gKi9cbiAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoWzQyLCAzMiwgNDksIDUwLCA1MSwgMzIsIDcwLCA2OSwgODQsIDY3LCA3MiwgMzIsIDQwLCA3MCwgNzYsIDY1LCA3MSwgODMsIDMyLCA0MCwgOTIsIDgzLCAxMDEsIDEwMSwgMTEwLCA0MSwgMzIsIDc3LCA3OSwgNjgsIDgzLCA2OSwgODEsIDMyLCA0MCwgNTIsIDQxLCA0MSwgMTMsIDEwXSkuYnVmZmVyXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG59KVxuIl19