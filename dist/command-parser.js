"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseAPPEND = parseAPPEND;
exports.parseBODYSTRUCTURE = parseBODYSTRUCTURE;
exports.parseCOPY = parseCOPY;
exports.parseENVELOPE = parseENVELOPE;
exports.parseFETCH = parseFETCH;
exports.parseNAMESPACE = parseNAMESPACE;
exports.parseNAMESPACEElement = parseNAMESPACEElement;
exports.parseSEARCH = parseSEARCH;
exports.parseSELECT = parseSELECT;
exports.parseSTATUS = parseSTATUS;
var _emailjsAddressparser = _interopRequireDefault(require("emailjs-addressparser"));
var _emailjsImapHandler = require("emailjs-imap-handler");
var _ramda = require("ramda");
var _emailjsMimeCodec = require("emailjs-mime-codec");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Parses NAMESPACE response
 *
 * @param {Object} response
 * @return {Object} Namespaces object
 */
function parseNAMESPACE(response) {
  if (!response.payload || !response.payload.NAMESPACE || !response.payload.NAMESPACE.length) {
    return false;
  }
  const attributes = [].concat(response.payload.NAMESPACE.pop().attributes || []);
  if (!attributes.length) {
    return false;
  }
  return {
    personal: parseNAMESPACEElement(attributes[0]),
    users: parseNAMESPACEElement(attributes[1]),
    shared: parseNAMESPACEElement(attributes[2])
  };
}

/**
 * Parses a NAMESPACE element
 *
 * @param {Object} element
 * @return {Object} Namespaces element object
 */
function parseNAMESPACEElement(element) {
  if (!element) {
    return false;
  }
  element = [].concat(element || []);
  return element.map(ns => {
    if (!ns || !ns.length) {
      return false;
    }
    return {
      prefix: ns[0].value,
      delimiter: ns[1] && ns[1].value // The delimiter can legally be NIL which maps to null
    };
  });
}

/**
 * Parses SELECT response
 *
 * @param {Object} response
 * @return {Object} Mailbox information object
 */
function parseSELECT(response) {
  if (!response || !response.payload) {
    return;
  }
  const mailbox = {
    readOnly: response.code === 'READ-ONLY'
  };
  const existsResponse = response.payload.EXISTS && response.payload.EXISTS.pop();
  const flagsResponse = response.payload.FLAGS && response.payload.FLAGS.pop();
  const okResponse = response.payload.OK;
  if (existsResponse) {
    mailbox.exists = existsResponse.nr || 0;
  }
  if (flagsResponse && flagsResponse.attributes && flagsResponse.attributes.length) {
    mailbox.flags = flagsResponse.attributes[0].map(flag => (flag.value || '').toString().trim());
  }
  [].concat(okResponse || []).forEach(ok => {
    switch (ok && ok.code) {
      case 'PERMANENTFLAGS':
        mailbox.permanentFlags = [].concat(ok.permanentflags || []);
        break;
      case 'UIDVALIDITY':
        mailbox.uidValidity = Number(ok.uidvalidity) || 0;
        break;
      case 'UIDNEXT':
        mailbox.uidNext = Number(ok.uidnext) || 0;
        break;
      case 'HIGHESTMODSEQ':
        mailbox.highestModseq = ok.highestmodseq || '0'; // keep 64bit uint as a string
        break;
      case 'NOMODSEQ':
        mailbox.noModseq = true;
        break;
    }
  });
  return mailbox;
}

/**
 * Parses message envelope from FETCH response. All keys in the resulting
 * object are lowercase. Address fields are all arrays with {name:, address:}
 * structured values. Unicode strings are automatically decoded.
 *
 * @param {Array} value Envelope array
 * @param {Object} Envelope object
 */
function parseENVELOPE(value) {
  const envelope = {};
  if (value[0] && value[0].value) {
    envelope.date = value[0].value;
  }
  if (value[1] && value[1].value) {
    envelope.subject = (0, _emailjsMimeCodec.mimeWordsDecode)(value[1] && value[1].value);
  }
  if (value[2] && value[2].length) {
    envelope.from = processAddresses(value[2]);
  }
  if (value[3] && value[3].length) {
    envelope.sender = processAddresses(value[3]);
  }
  if (value[4] && value[4].length) {
    envelope['reply-to'] = processAddresses(value[4]);
  }
  if (value[5] && value[5].length) {
    envelope.to = processAddresses(value[5]);
  }
  if (value[6] && value[6].length) {
    envelope.cc = processAddresses(value[6]);
  }
  if (value[7] && value[7].length) {
    envelope.bcc = processAddresses(value[7]);
  }
  if (value[8] && value[8].value) {
    envelope['in-reply-to'] = value[8].value;
  }
  if (value[9] && value[9].value) {
    envelope['message-id'] = value[9].value;
  }
  return envelope;
}

/*
 * ENVELOPE lists addresses as [name-part, source-route, username, hostname]
 * where source-route is not used anymore and can be ignored.
 * To get comparable results with other parts of the email.js stack
 * browserbox feeds the parsed address values from ENVELOPE
 * to addressparser and uses resulting values instead of the
 * pre-parsed addresses
 */
function processAddresses(list = []) {
  return list.map(addr => {
    const name = (0, _ramda.pathOr)('', ['0', 'value'], addr).trim();
    const address = (0, _ramda.pathOr)('', ['2', 'value'], addr) + '@' + (0, _ramda.pathOr)('', ['3', 'value'], addr);
    const formatted = name ? encodeAddressName(name) + ' <' + address + '>' : address;
    const parsed = (0, _emailjsAddressparser.default)(formatted).shift(); // there should be just a single address
    parsed.name = (0, _emailjsMimeCodec.mimeWordsDecode)(parsed.name);
    return parsed;
  });
}

/**
 * If needed, encloses with quotes or mime encodes the name part of an e-mail address
 *
 * @param {String} name Name part of an address
 * @returns {String} Mime word encoded or quoted string
 */
function encodeAddressName(name) {
  if (!/^[\w ']*$/.test(name)) {
    if (/^[\x20-\x7e]*$/.test(name)) {
      return JSON.stringify(name);
    } else {
      return (0, _emailjsMimeCodec.mimeWordEncode)(name, 'Q', 52);
    }
  }
  return name;
}

/**
 * Parses message body structure from FETCH response.
 *
 * @param {Array} value BODYSTRUCTURE array
 * @param {Object} Envelope object
 */
function parseBODYSTRUCTURE(node, path = []) {
  const curNode = {};
  let i = 0;
  let part = 0;
  if (path.length) {
    curNode.part = path.join('.');
  }

  // multipart
  if (Array.isArray(node[0])) {
    curNode.childNodes = [];
    while (Array.isArray(node[i])) {
      curNode.childNodes.push(parseBODYSTRUCTURE(node[i], path.concat(++part)));
      i++;
    }

    // multipart type
    curNode.type = 'multipart/' + ((node[i++] || {}).value || '').toString().toLowerCase();

    // extension data (not available for BODY requests)

    // body parameter parenthesized list
    if (i < node.length - 1) {
      if (node[i]) {
        curNode.parameters = attributesToObject(node[i]);
      }
      i++;
    }
  } else {
    // content type
    curNode.type = [((node[i++] || {}).value || '').toString().toLowerCase(), ((node[i++] || {}).value || '').toString().toLowerCase()].join('/');

    // body parameter parenthesized list
    if (node[i]) {
      curNode.parameters = attributesToObject(node[i]);
    }
    i++;

    // id
    if (node[i]) {
      curNode.id = ((node[i] || {}).value || '').toString();
    }
    i++;

    // description
    if (node[i]) {
      curNode.description = ((node[i] || {}).value || '').toString();
    }
    i++;

    // encoding
    if (node[i]) {
      curNode.encoding = ((node[i] || {}).value || '').toString().toLowerCase();
    }
    i++;

    // size
    if (node[i]) {
      curNode.size = Number((node[i] || {}).value || 0) || 0;
    }
    i++;
    if (curNode.type === 'message/rfc822') {
      // message/rfc adds additional envelope, bodystructure and line count values

      // envelope
      if (node[i]) {
        curNode.envelope = parseENVELOPE([].concat(node[i] || []));
      }
      i++;
      if (node[i]) {
        curNode.childNodes = [
        // rfc822 bodyparts share the same path, difference is between MIME and HEADER
        // path.MIME returns message/rfc822 header
        // path.HEADER returns inlined message header
        parseBODYSTRUCTURE(node[i], path)];
      }
      i++;

      // line count
      if (node[i]) {
        curNode.lineCount = Number((node[i] || {}).value || 0) || 0;
      }
      i++;
    } else if (/^text\//.test(curNode.type)) {
      // text/* adds additional line count values

      // line count
      if (node[i]) {
        curNode.lineCount = Number((node[i] || {}).value || 0) || 0;
      }
      i++;
    }

    // extension data (not available for BODY requests)

    // md5
    if (i < node.length - 1) {
      if (node[i]) {
        curNode.md5 = ((node[i] || {}).value || '').toString().toLowerCase();
      }
      i++;
    }
  }

  // the following are shared extension values (for both multipart and non-multipart parts)
  // not available for BODY requests

  // body disposition
  if (i < node.length - 1) {
    if (Array.isArray(node[i]) && node[i].length) {
      curNode.disposition = ((node[i][0] || {}).value || '').toString().toLowerCase();
      if (Array.isArray(node[i][1])) {
        curNode.dispositionParameters = attributesToObject(node[i][1]);
      }
    }
    i++;
  }

  // body language
  if (i < node.length - 1) {
    if (node[i]) {
      curNode.language = [].concat(node[i]).map(val => (0, _ramda.propOr)('', 'value', val).toLowerCase());
    }
    i++;
  }

  // body location
  // NB! defined as a "string list" in RFC3501 but replaced in errata document with "string"
  // Errata: http://www.rfc-editor.org/errata_search.php?rfc=3501
  if (i < node.length - 1) {
    if (node[i]) {
      curNode.location = ((node[i] || {}).value || '').toString();
    }
    i++;
  }
  return curNode;
}
function attributesToObject(attrs = [], keyTransform = _ramda.toLower, valueTransform = _emailjsMimeCodec.mimeWordsDecode) {
  const vals = attrs.map((0, _ramda.prop)('value'));
  const keys = vals.filter((_, i) => i % 2 === 0).map(keyTransform);
  const values = vals.filter((_, i) => i % 2 === 1).map(valueTransform);
  return (0, _ramda.fromPairs)((0, _ramda.zip)(keys, values));
}

/**
 * Parses FETCH response
 *
 * @param {Object} response
 * @return {Object} Message object
 */
function parseFETCH(response) {
  if (!response || !response.payload || !response.payload.FETCH || !response.payload.FETCH.length) {
    return [];
  }
  const list = [];
  const messages = {};
  response.payload.FETCH.forEach(item => {
    const params = [].concat([].concat(item.attributes || [])[0] || []); // ensure the first value is an array
    let message;
    let i, len, key;
    if (messages[item.nr]) {
      // same sequence number is already used, so merge values instead of creating a new message object
      message = messages[item.nr];
    } else {
      messages[item.nr] = message = {
        '#': item.nr
      };
      list.push(message);
    }
    for (i = 0, len = params.length; i < len; i++) {
      if (i % 2 === 0) {
        key = (0, _emailjsImapHandler.compiler)({
          attributes: [params[i]]
        }).toLowerCase().replace(/<\d+>$/, '');
        continue;
      }
      message[key] = parseFetchValue(key, params[i]);
    }
  });
  return list;
}

/**
 * Parses STATUS response
 *
 * @param {Object} response
 * @return {Object} Message object
 */
function parseSTATUS(response, atoms = []) {
  if (!response || !response.payload || !response.payload.STATUS || !response.payload.STATUS.length) {
    return [];
  }
  const result = {};
  const atomKeyMap = {
    UIDNEXT: 'uidNext',
    MESSAGES: 'messages',
    HIGHESTMODSEQ: 'highestModseq'
  };
  const attributes = response.payload.STATUS[0].attributes[1];
  const getValueByAtom = atom => {
    const atomIndex = attributes.findIndex(attribute => attribute.value === atom);
    const atomValueAttribute = attributes[atomIndex + 1];
    const parsedAtomValue = atomValueAttribute && atomValueAttribute.value ? Number.parseInt(atomValueAttribute.value, 10) : null;
    return parsedAtomValue || null;
  };
  atoms.forEach(atom => {
    result[atomKeyMap[atom]] = getValueByAtom(atom);
  });
  return result;
}

/**
 * Parses a single value from the FETCH response object
 *
 * @param {String} key Key name (uppercase)
 * @param {Mized} value Value for the key
 * @return {Mixed} Processed value
 */
function parseFetchValue(key, value) {
  if (!value) {
    return null;
  }
  if (!Array.isArray(value)) {
    switch (key) {
      case 'uid':
      case 'rfc822.size':
        return Number(value.value) || 0;
      case 'modseq':
        // do not cast 64 bit uint to a number
        return value.value || '0';
    }
    return value.value;
  }
  switch (key) {
    case 'flags':
    case 'x-gm-labels':
      value = [].concat(value).map(flag => flag.value || '');
      break;
    case 'envelope':
      value = parseENVELOPE([].concat(value || []));
      break;
    case 'bodystructure':
      value = parseBODYSTRUCTURE([].concat(value || []));
      break;
    case 'modseq':
      value = (value.shift() || {}).value || '0';
      break;
  }
  return value;
}

/**
  * Binary Search - from npm module binary-search, license CC0
  *
  * @param {Array} haystack Ordered array
  * @param {any} needle Item to search for in haystack
  * @param {Function} comparator Function that defines the sort order
  * @return {Number} Index of needle in haystack or if not found,
  *     -Index-1 is the position where needle could be inserted while still
  *     keeping haystack ordered.
  */
function binSearch(haystack, needle, comparator = (a, b) => a - b) {
  var mid, cmp;
  var low = 0;
  var high = haystack.length - 1;
  while (low <= high) {
    // Note that "(low + high) >>> 1" may overflow, and results in
    // a typecast to double (which gives the wrong results).
    mid = low + (high - low >> 1);
    cmp = +comparator(haystack[mid], needle);
    if (cmp < 0.0) {
      // too low
      low = mid + 1;
    } else if (cmp > 0.0) {
      // too high
      high = mid - 1;
    } else {
      // key found
      return mid;
    }
  }

  // key not found
  return ~low;
}
;

/**
 * Parses SEARCH response. Gathers all untagged SEARCH responses, fetched seq./uid numbers
 * and compiles these into a sorted array.
 *
 * @param {Object} response
 * @return {Object} Message object
 * @param {Array} Sorted Seq./UID number list
 */
function parseSEARCH(response) {
  const list = [];
  if (!response || !response.payload || !response.payload.SEARCH || !response.payload.SEARCH.length) {
    return list;
  }
  response.payload.SEARCH.forEach(result => (result.attributes || []).forEach(nr => {
    nr = Number(nr && nr.value || nr) || 0;
    const idx = binSearch(list, nr);
    if (idx < 0) {
      list.splice(-idx - 1, 0, nr);
    }
  }));
  return list;
}
;

/**
 * Parses COPY and UID COPY response.
 * https://tools.ietf.org/html/rfc4315
 * @param {Object} response
 * @returns {{destSeqSet: string, srcSeqSet: string}} Source and
 * destination uid sets if available, undefined if not.
 */
function parseCOPY(response) {
  const copyuid = response && response.copyuid;
  if (copyuid) {
    return {
      srcSeqSet: copyuid[1],
      destSeqSet: copyuid[2]
    };
  }
}

/**
 * Parses APPEND (upload) response.
 * https://tools.ietf.org/html/rfc4315
 * @param {Object} response
 * @returns {String} The uid assigned to the uploaded message if available.
 */
function parseAPPEND(response) {
  return response && response.appenduid && response.appenduid[1];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZW1haWxqc0FkZHJlc3NwYXJzZXIiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9lbWFpbGpzSW1hcEhhbmRsZXIiLCJfcmFtZGEiLCJfZW1haWxqc01pbWVDb2RlYyIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwicGFyc2VOQU1FU1BBQ0UiLCJyZXNwb25zZSIsInBheWxvYWQiLCJOQU1FU1BBQ0UiLCJsZW5ndGgiLCJhdHRyaWJ1dGVzIiwiY29uY2F0IiwicG9wIiwicGVyc29uYWwiLCJwYXJzZU5BTUVTUEFDRUVsZW1lbnQiLCJ1c2VycyIsInNoYXJlZCIsImVsZW1lbnQiLCJtYXAiLCJucyIsInByZWZpeCIsInZhbHVlIiwiZGVsaW1pdGVyIiwicGFyc2VTRUxFQ1QiLCJtYWlsYm94IiwicmVhZE9ubHkiLCJjb2RlIiwiZXhpc3RzUmVzcG9uc2UiLCJFWElTVFMiLCJmbGFnc1Jlc3BvbnNlIiwiRkxBR1MiLCJva1Jlc3BvbnNlIiwiT0siLCJleGlzdHMiLCJuciIsImZsYWdzIiwiZmxhZyIsInRvU3RyaW5nIiwidHJpbSIsImZvckVhY2giLCJvayIsInBlcm1hbmVudEZsYWdzIiwicGVybWFuZW50ZmxhZ3MiLCJ1aWRWYWxpZGl0eSIsIk51bWJlciIsInVpZHZhbGlkaXR5IiwidWlkTmV4dCIsInVpZG5leHQiLCJoaWdoZXN0TW9kc2VxIiwiaGlnaGVzdG1vZHNlcSIsIm5vTW9kc2VxIiwicGFyc2VFTlZFTE9QRSIsImVudmVsb3BlIiwiZGF0ZSIsInN1YmplY3QiLCJtaW1lV29yZHNEZWNvZGUiLCJmcm9tIiwicHJvY2Vzc0FkZHJlc3NlcyIsInNlbmRlciIsInRvIiwiY2MiLCJiY2MiLCJsaXN0IiwiYWRkciIsIm5hbWUiLCJwYXRoT3IiLCJhZGRyZXNzIiwiZm9ybWF0dGVkIiwiZW5jb2RlQWRkcmVzc05hbWUiLCJwYXJzZWQiLCJwYXJzZUFkZHJlc3MiLCJzaGlmdCIsInRlc3QiLCJKU09OIiwic3RyaW5naWZ5IiwibWltZVdvcmRFbmNvZGUiLCJwYXJzZUJPRFlTVFJVQ1RVUkUiLCJub2RlIiwicGF0aCIsImN1ck5vZGUiLCJpIiwicGFydCIsImpvaW4iLCJBcnJheSIsImlzQXJyYXkiLCJjaGlsZE5vZGVzIiwicHVzaCIsInR5cGUiLCJ0b0xvd2VyQ2FzZSIsInBhcmFtZXRlcnMiLCJhdHRyaWJ1dGVzVG9PYmplY3QiLCJpZCIsImRlc2NyaXB0aW9uIiwiZW5jb2RpbmciLCJzaXplIiwibGluZUNvdW50IiwibWQ1IiwiZGlzcG9zaXRpb24iLCJkaXNwb3NpdGlvblBhcmFtZXRlcnMiLCJsYW5ndWFnZSIsInZhbCIsInByb3BPciIsImxvY2F0aW9uIiwiYXR0cnMiLCJrZXlUcmFuc2Zvcm0iLCJ0b0xvd2VyIiwidmFsdWVUcmFuc2Zvcm0iLCJ2YWxzIiwicHJvcCIsImtleXMiLCJmaWx0ZXIiLCJfIiwidmFsdWVzIiwiZnJvbVBhaXJzIiwiemlwIiwicGFyc2VGRVRDSCIsIkZFVENIIiwibWVzc2FnZXMiLCJpdGVtIiwicGFyYW1zIiwibWVzc2FnZSIsImxlbiIsImtleSIsImNvbXBpbGVyIiwicmVwbGFjZSIsInBhcnNlRmV0Y2hWYWx1ZSIsInBhcnNlU1RBVFVTIiwiYXRvbXMiLCJTVEFUVVMiLCJyZXN1bHQiLCJhdG9tS2V5TWFwIiwiVUlETkVYVCIsIk1FU1NBR0VTIiwiSElHSEVTVE1PRFNFUSIsImdldFZhbHVlQnlBdG9tIiwiYXRvbSIsImF0b21JbmRleCIsImZpbmRJbmRleCIsImF0dHJpYnV0ZSIsImF0b21WYWx1ZUF0dHJpYnV0ZSIsInBhcnNlZEF0b21WYWx1ZSIsInBhcnNlSW50IiwiYmluU2VhcmNoIiwiaGF5c3RhY2siLCJuZWVkbGUiLCJjb21wYXJhdG9yIiwiYSIsImIiLCJtaWQiLCJjbXAiLCJsb3ciLCJoaWdoIiwicGFyc2VTRUFSQ0giLCJTRUFSQ0giLCJpZHgiLCJzcGxpY2UiLCJwYXJzZUNPUFkiLCJjb3B5dWlkIiwic3JjU2VxU2V0IiwiZGVzdFNlcVNldCIsInBhcnNlQVBQRU5EIiwiYXBwZW5kdWlkIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1hbmQtcGFyc2VyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXJzZUFkZHJlc3MgZnJvbSAnZW1haWxqcy1hZGRyZXNzcGFyc2VyJ1xuaW1wb3J0IHsgY29tcGlsZXIgfSBmcm9tICdlbWFpbGpzLWltYXAtaGFuZGxlcidcbmltcG9ydCB7IHppcCwgZnJvbVBhaXJzLCBwcm9wLCBwYXRoT3IsIHByb3BPciwgdG9Mb3dlciB9IGZyb20gJ3JhbWRhJ1xuaW1wb3J0IHsgbWltZVdvcmRFbmNvZGUsIG1pbWVXb3Jkc0RlY29kZSB9IGZyb20gJ2VtYWlsanMtbWltZS1jb2RlYydcblxuLyoqXG4gKiBQYXJzZXMgTkFNRVNQQUNFIHJlc3BvbnNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5hbWVzcGFjZXMgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU5BTUVTUEFDRSAocmVzcG9uc2UpIHtcbiAgaWYgKCFyZXNwb25zZS5wYXlsb2FkIHx8ICFyZXNwb25zZS5wYXlsb2FkLk5BTUVTUEFDRSB8fCAhcmVzcG9uc2UucGF5bG9hZC5OQU1FU1BBQ0UubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBjb25zdCBhdHRyaWJ1dGVzID0gW10uY29uY2F0KHJlc3BvbnNlLnBheWxvYWQuTkFNRVNQQUNFLnBvcCgpLmF0dHJpYnV0ZXMgfHwgW10pXG4gIGlmICghYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGVyc29uYWw6IHBhcnNlTkFNRVNQQUNFRWxlbWVudChhdHRyaWJ1dGVzWzBdKSxcbiAgICB1c2VyczogcGFyc2VOQU1FU1BBQ0VFbGVtZW50KGF0dHJpYnV0ZXNbMV0pLFxuICAgIHNoYXJlZDogcGFyc2VOQU1FU1BBQ0VFbGVtZW50KGF0dHJpYnV0ZXNbMl0pXG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZXMgYSBOQU1FU1BBQ0UgZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50XG4gKiBAcmV0dXJuIHtPYmplY3R9IE5hbWVzcGFjZXMgZWxlbWVudCBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTkFNRVNQQUNFRWxlbWVudCAoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGVsZW1lbnQgPSBbXS5jb25jYXQoZWxlbWVudCB8fCBbXSlcbiAgcmV0dXJuIGVsZW1lbnQubWFwKChucykgPT4ge1xuICAgIGlmICghbnMgfHwgIW5zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHByZWZpeDogbnNbMF0udmFsdWUsXG4gICAgICBkZWxpbWl0ZXI6IG5zWzFdICYmIG5zWzFdLnZhbHVlIC8vIFRoZSBkZWxpbWl0ZXIgY2FuIGxlZ2FsbHkgYmUgTklMIHdoaWNoIG1hcHMgdG8gbnVsbFxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBQYXJzZXMgU0VMRUNUIHJlc3BvbnNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IE1haWxib3ggaW5mb3JtYXRpb24gb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNFTEVDVCAocmVzcG9uc2UpIHtcbiAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UucGF5bG9hZCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgbWFpbGJveCA9IHtcbiAgICByZWFkT25seTogcmVzcG9uc2UuY29kZSA9PT0gJ1JFQUQtT05MWSdcbiAgfVxuICBjb25zdCBleGlzdHNSZXNwb25zZSA9IHJlc3BvbnNlLnBheWxvYWQuRVhJU1RTICYmIHJlc3BvbnNlLnBheWxvYWQuRVhJU1RTLnBvcCgpXG4gIGNvbnN0IGZsYWdzUmVzcG9uc2UgPSByZXNwb25zZS5wYXlsb2FkLkZMQUdTICYmIHJlc3BvbnNlLnBheWxvYWQuRkxBR1MucG9wKClcbiAgY29uc3Qgb2tSZXNwb25zZSA9IHJlc3BvbnNlLnBheWxvYWQuT0tcblxuICBpZiAoZXhpc3RzUmVzcG9uc2UpIHtcbiAgICBtYWlsYm94LmV4aXN0cyA9IGV4aXN0c1Jlc3BvbnNlLm5yIHx8IDBcbiAgfVxuXG4gIGlmIChmbGFnc1Jlc3BvbnNlICYmIGZsYWdzUmVzcG9uc2UuYXR0cmlidXRlcyAmJiBmbGFnc1Jlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgbWFpbGJveC5mbGFncyA9IGZsYWdzUmVzcG9uc2UuYXR0cmlidXRlc1swXS5tYXAoKGZsYWcpID0+IChmbGFnLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRyaW0oKSlcbiAgfVxuXG4gIFtdLmNvbmNhdChva1Jlc3BvbnNlIHx8IFtdKS5mb3JFYWNoKChvaykgPT4ge1xuICAgIHN3aXRjaCAob2sgJiYgb2suY29kZSkge1xuICAgICAgY2FzZSAnUEVSTUFORU5URkxBR1MnOlxuICAgICAgICBtYWlsYm94LnBlcm1hbmVudEZsYWdzID0gW10uY29uY2F0KG9rLnBlcm1hbmVudGZsYWdzIHx8IFtdKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnVUlEVkFMSURJVFknOlxuICAgICAgICBtYWlsYm94LnVpZFZhbGlkaXR5ID0gTnVtYmVyKG9rLnVpZHZhbGlkaXR5KSB8fCAwXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdVSURORVhUJzpcbiAgICAgICAgbWFpbGJveC51aWROZXh0ID0gTnVtYmVyKG9rLnVpZG5leHQpIHx8IDBcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0hJR0hFU1RNT0RTRVEnOlxuICAgICAgICBtYWlsYm94LmhpZ2hlc3RNb2RzZXEgPSBvay5oaWdoZXN0bW9kc2VxIHx8ICcwJyAvLyBrZWVwIDY0Yml0IHVpbnQgYXMgYSBzdHJpbmdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ05PTU9EU0VRJzpcbiAgICAgICAgbWFpbGJveC5ub01vZHNlcSA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIG1haWxib3hcbn1cblxuLyoqXG4gKiBQYXJzZXMgbWVzc2FnZSBlbnZlbG9wZSBmcm9tIEZFVENIIHJlc3BvbnNlLiBBbGwga2V5cyBpbiB0aGUgcmVzdWx0aW5nXG4gKiBvYmplY3QgYXJlIGxvd2VyY2FzZS4gQWRkcmVzcyBmaWVsZHMgYXJlIGFsbCBhcnJheXMgd2l0aCB7bmFtZTosIGFkZHJlc3M6fVxuICogc3RydWN0dXJlZCB2YWx1ZXMuIFVuaWNvZGUgc3RyaW5ncyBhcmUgYXV0b21hdGljYWxseSBkZWNvZGVkLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlIEVudmVsb3BlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gRW52ZWxvcGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUVOVkVMT1BFICh2YWx1ZSkge1xuICBjb25zdCBlbnZlbG9wZSA9IHt9XG5cbiAgaWYgKHZhbHVlWzBdICYmIHZhbHVlWzBdLnZhbHVlKSB7XG4gICAgZW52ZWxvcGUuZGF0ZSA9IHZhbHVlWzBdLnZhbHVlXG4gIH1cblxuICBpZiAodmFsdWVbMV0gJiYgdmFsdWVbMV0udmFsdWUpIHtcbiAgICBlbnZlbG9wZS5zdWJqZWN0ID0gbWltZVdvcmRzRGVjb2RlKHZhbHVlWzFdICYmIHZhbHVlWzFdLnZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlWzJdICYmIHZhbHVlWzJdLmxlbmd0aCkge1xuICAgIGVudmVsb3BlLmZyb20gPSBwcm9jZXNzQWRkcmVzc2VzKHZhbHVlWzJdKVxuICB9XG5cbiAgaWYgKHZhbHVlWzNdICYmIHZhbHVlWzNdLmxlbmd0aCkge1xuICAgIGVudmVsb3BlLnNlbmRlciA9IHByb2Nlc3NBZGRyZXNzZXModmFsdWVbM10pXG4gIH1cblxuICBpZiAodmFsdWVbNF0gJiYgdmFsdWVbNF0ubGVuZ3RoKSB7XG4gICAgZW52ZWxvcGVbJ3JlcGx5LXRvJ10gPSBwcm9jZXNzQWRkcmVzc2VzKHZhbHVlWzRdKVxuICB9XG5cbiAgaWYgKHZhbHVlWzVdICYmIHZhbHVlWzVdLmxlbmd0aCkge1xuICAgIGVudmVsb3BlLnRvID0gcHJvY2Vzc0FkZHJlc3Nlcyh2YWx1ZVs1XSlcbiAgfVxuXG4gIGlmICh2YWx1ZVs2XSAmJiB2YWx1ZVs2XS5sZW5ndGgpIHtcbiAgICBlbnZlbG9wZS5jYyA9IHByb2Nlc3NBZGRyZXNzZXModmFsdWVbNl0pXG4gIH1cblxuICBpZiAodmFsdWVbN10gJiYgdmFsdWVbN10ubGVuZ3RoKSB7XG4gICAgZW52ZWxvcGUuYmNjID0gcHJvY2Vzc0FkZHJlc3Nlcyh2YWx1ZVs3XSlcbiAgfVxuXG4gIGlmICh2YWx1ZVs4XSAmJiB2YWx1ZVs4XS52YWx1ZSkge1xuICAgIGVudmVsb3BlWydpbi1yZXBseS10byddID0gdmFsdWVbOF0udmFsdWVcbiAgfVxuXG4gIGlmICh2YWx1ZVs5XSAmJiB2YWx1ZVs5XS52YWx1ZSkge1xuICAgIGVudmVsb3BlWydtZXNzYWdlLWlkJ10gPSB2YWx1ZVs5XS52YWx1ZVxuICB9XG5cbiAgcmV0dXJuIGVudmVsb3BlXG59XG5cbi8qXG4gKiBFTlZFTE9QRSBsaXN0cyBhZGRyZXNzZXMgYXMgW25hbWUtcGFydCwgc291cmNlLXJvdXRlLCB1c2VybmFtZSwgaG9zdG5hbWVdXG4gKiB3aGVyZSBzb3VyY2Utcm91dGUgaXMgbm90IHVzZWQgYW55bW9yZSBhbmQgY2FuIGJlIGlnbm9yZWQuXG4gKiBUbyBnZXQgY29tcGFyYWJsZSByZXN1bHRzIHdpdGggb3RoZXIgcGFydHMgb2YgdGhlIGVtYWlsLmpzIHN0YWNrXG4gKiBicm93c2VyYm94IGZlZWRzIHRoZSBwYXJzZWQgYWRkcmVzcyB2YWx1ZXMgZnJvbSBFTlZFTE9QRVxuICogdG8gYWRkcmVzc3BhcnNlciBhbmQgdXNlcyByZXN1bHRpbmcgdmFsdWVzIGluc3RlYWQgb2YgdGhlXG4gKiBwcmUtcGFyc2VkIGFkZHJlc3Nlc1xuICovXG5mdW5jdGlvbiBwcm9jZXNzQWRkcmVzc2VzIChsaXN0ID0gW10pIHtcbiAgcmV0dXJuIGxpc3QubWFwKChhZGRyKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IChwYXRoT3IoJycsIFsnMCcsICd2YWx1ZSddLCBhZGRyKSkudHJpbSgpXG4gICAgY29uc3QgYWRkcmVzcyA9IChwYXRoT3IoJycsIFsnMicsICd2YWx1ZSddLCBhZGRyKSkgKyAnQCcgKyAocGF0aE9yKCcnLCBbJzMnLCAndmFsdWUnXSwgYWRkcikpXG4gICAgY29uc3QgZm9ybWF0dGVkID0gbmFtZSA/IChlbmNvZGVBZGRyZXNzTmFtZShuYW1lKSArICcgPCcgKyBhZGRyZXNzICsgJz4nKSA6IGFkZHJlc3NcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUFkZHJlc3MoZm9ybWF0dGVkKS5zaGlmdCgpIC8vIHRoZXJlIHNob3VsZCBiZSBqdXN0IGEgc2luZ2xlIGFkZHJlc3NcbiAgICBwYXJzZWQubmFtZSA9IG1pbWVXb3Jkc0RlY29kZShwYXJzZWQubmFtZSlcbiAgICByZXR1cm4gcGFyc2VkXG4gIH0pXG59XG5cbi8qKlxuICogSWYgbmVlZGVkLCBlbmNsb3NlcyB3aXRoIHF1b3RlcyBvciBtaW1lIGVuY29kZXMgdGhlIG5hbWUgcGFydCBvZiBhbiBlLW1haWwgYWRkcmVzc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgcGFydCBvZiBhbiBhZGRyZXNzXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBNaW1lIHdvcmQgZW5jb2RlZCBvciBxdW90ZWQgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFkZHJlc3NOYW1lIChuYW1lKSB7XG4gIGlmICghL15bXFx3ICddKiQvLnRlc3QobmFtZSkpIHtcbiAgICBpZiAoL15bXFx4MjAtXFx4N2VdKiQvLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWltZVdvcmRFbmNvZGUobmFtZSwgJ1EnLCA1MilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hbWVcbn1cblxuLyoqXG4gKiBQYXJzZXMgbWVzc2FnZSBib2R5IHN0cnVjdHVyZSBmcm9tIEZFVENIIHJlc3BvbnNlLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlIEJPRFlTVFJVQ1RVUkUgYXJyYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBFbnZlbG9wZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQk9EWVNUUlVDVFVSRSAobm9kZSwgcGF0aCA9IFtdKSB7XG4gIGNvbnN0IGN1ck5vZGUgPSB7fVxuICBsZXQgaSA9IDBcbiAgbGV0IHBhcnQgPSAwXG5cbiAgaWYgKHBhdGgubGVuZ3RoKSB7XG4gICAgY3VyTm9kZS5wYXJ0ID0gcGF0aC5qb2luKCcuJylcbiAgfVxuXG4gIC8vIG11bHRpcGFydFxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlWzBdKSkge1xuICAgIGN1ck5vZGUuY2hpbGROb2RlcyA9IFtdXG4gICAgd2hpbGUgKEFycmF5LmlzQXJyYXkobm9kZVtpXSkpIHtcbiAgICAgIGN1ck5vZGUuY2hpbGROb2Rlcy5wdXNoKHBhcnNlQk9EWVNUUlVDVFVSRShub2RlW2ldLCBwYXRoLmNvbmNhdCgrK3BhcnQpKSlcbiAgICAgIGkrK1xuICAgIH1cblxuICAgIC8vIG11bHRpcGFydCB0eXBlXG4gICAgY3VyTm9kZS50eXBlID0gJ211bHRpcGFydC8nICsgKChub2RlW2krK10gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcblxuICAgIC8vIGV4dGVuc2lvbiBkYXRhIChub3QgYXZhaWxhYmxlIGZvciBCT0RZIHJlcXVlc3RzKVxuXG4gICAgLy8gYm9keSBwYXJhbWV0ZXIgcGFyZW50aGVzaXplZCBsaXN0XG4gICAgaWYgKGkgPCBub2RlLmxlbmd0aCAtIDEpIHtcbiAgICAgIGlmIChub2RlW2ldKSB7XG4gICAgICAgIGN1ck5vZGUucGFyYW1ldGVycyA9IGF0dHJpYnV0ZXNUb09iamVjdChub2RlW2ldKVxuICAgICAgfVxuICAgICAgaSsrXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGNvbnRlbnQgdHlwZVxuICAgIGN1ck5vZGUudHlwZSA9IFtcbiAgICAgICgobm9kZVtpKytdIHx8IHt9KS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLCAoKG5vZGVbaSsrXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxuICAgIF0uam9pbignLycpXG5cbiAgICAvLyBib2R5IHBhcmFtZXRlciBwYXJlbnRoZXNpemVkIGxpc3RcbiAgICBpZiAobm9kZVtpXSkge1xuICAgICAgY3VyTm9kZS5wYXJhbWV0ZXJzID0gYXR0cmlidXRlc1RvT2JqZWN0KG5vZGVbaV0pXG4gICAgfVxuICAgIGkrK1xuXG4gICAgLy8gaWRcbiAgICBpZiAobm9kZVtpXSkge1xuICAgICAgY3VyTm9kZS5pZCA9ICgobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaSsrXG5cbiAgICAvLyBkZXNjcmlwdGlvblxuICAgIGlmIChub2RlW2ldKSB7XG4gICAgICBjdXJOb2RlLmRlc2NyaXB0aW9uID0gKChub2RlW2ldIHx8IHt9KS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpKytcblxuICAgIC8vIGVuY29kaW5nXG4gICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgIGN1ck5vZGUuZW5jb2RpbmcgPSAoKG5vZGVbaV0gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbiAgICB9XG4gICAgaSsrXG5cbiAgICAvLyBzaXplXG4gICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgIGN1ck5vZGUuc2l6ZSA9IE51bWJlcigobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgMCkgfHwgMFxuICAgIH1cbiAgICBpKytcblxuICAgIGlmIChjdXJOb2RlLnR5cGUgPT09ICdtZXNzYWdlL3JmYzgyMicpIHtcbiAgICAgIC8vIG1lc3NhZ2UvcmZjIGFkZHMgYWRkaXRpb25hbCBlbnZlbG9wZSwgYm9keXN0cnVjdHVyZSBhbmQgbGluZSBjb3VudCB2YWx1ZXNcblxuICAgICAgLy8gZW52ZWxvcGVcbiAgICAgIGlmIChub2RlW2ldKSB7XG4gICAgICAgIGN1ck5vZGUuZW52ZWxvcGUgPSBwYXJzZUVOVkVMT1BFKFtdLmNvbmNhdChub2RlW2ldIHx8IFtdKSlcbiAgICAgIH1cbiAgICAgIGkrK1xuXG4gICAgICBpZiAobm9kZVtpXSkge1xuICAgICAgICBjdXJOb2RlLmNoaWxkTm9kZXMgPSBbXG4gICAgICAgICAgLy8gcmZjODIyIGJvZHlwYXJ0cyBzaGFyZSB0aGUgc2FtZSBwYXRoLCBkaWZmZXJlbmNlIGlzIGJldHdlZW4gTUlNRSBhbmQgSEVBREVSXG4gICAgICAgICAgLy8gcGF0aC5NSU1FIHJldHVybnMgbWVzc2FnZS9yZmM4MjIgaGVhZGVyXG4gICAgICAgICAgLy8gcGF0aC5IRUFERVIgcmV0dXJucyBpbmxpbmVkIG1lc3NhZ2UgaGVhZGVyXG4gICAgICAgICAgcGFyc2VCT0RZU1RSVUNUVVJFKG5vZGVbaV0sIHBhdGgpXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICAgIGkrK1xuXG4gICAgICAvLyBsaW5lIGNvdW50XG4gICAgICBpZiAobm9kZVtpXSkge1xuICAgICAgICBjdXJOb2RlLmxpbmVDb3VudCA9IE51bWJlcigobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgMCkgfHwgMFxuICAgICAgfVxuICAgICAgaSsrXG4gICAgfSBlbHNlIGlmICgvXnRleHRcXC8vLnRlc3QoY3VyTm9kZS50eXBlKSkge1xuICAgICAgLy8gdGV4dC8qIGFkZHMgYWRkaXRpb25hbCBsaW5lIGNvdW50IHZhbHVlc1xuXG4gICAgICAvLyBsaW5lIGNvdW50XG4gICAgICBpZiAobm9kZVtpXSkge1xuICAgICAgICBjdXJOb2RlLmxpbmVDb3VudCA9IE51bWJlcigobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgMCkgfHwgMFxuICAgICAgfVxuICAgICAgaSsrXG4gICAgfVxuXG4gICAgLy8gZXh0ZW5zaW9uIGRhdGEgKG5vdCBhdmFpbGFibGUgZm9yIEJPRFkgcmVxdWVzdHMpXG5cbiAgICAvLyBtZDVcbiAgICBpZiAoaSA8IG5vZGUubGVuZ3RoIC0gMSkge1xuICAgICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgICAgY3VyTm9kZS5tZDUgPSAoKG5vZGVbaV0gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbiAgICAgIH1cbiAgICAgIGkrK1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoZSBmb2xsb3dpbmcgYXJlIHNoYXJlZCBleHRlbnNpb24gdmFsdWVzIChmb3IgYm90aCBtdWx0aXBhcnQgYW5kIG5vbi1tdWx0aXBhcnQgcGFydHMpXG4gIC8vIG5vdCBhdmFpbGFibGUgZm9yIEJPRFkgcmVxdWVzdHNcblxuICAvLyBib2R5IGRpc3Bvc2l0aW9uXG4gIGlmIChpIDwgbm9kZS5sZW5ndGggLSAxKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZVtpXSkgJiYgbm9kZVtpXS5sZW5ndGgpIHtcbiAgICAgIGN1ck5vZGUuZGlzcG9zaXRpb24gPSAoKG5vZGVbaV1bMF0gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGVbaV1bMV0pKSB7XG4gICAgICAgIGN1ck5vZGUuZGlzcG9zaXRpb25QYXJhbWV0ZXJzID0gYXR0cmlidXRlc1RvT2JqZWN0KG5vZGVbaV1bMV0pXG4gICAgICB9XG4gICAgfVxuICAgIGkrK1xuICB9XG5cbiAgLy8gYm9keSBsYW5ndWFnZVxuICBpZiAoaSA8IG5vZGUubGVuZ3RoIC0gMSkge1xuICAgIGlmIChub2RlW2ldKSB7XG4gICAgICBjdXJOb2RlLmxhbmd1YWdlID0gW10uY29uY2F0KG5vZGVbaV0pLm1hcCgodmFsKSA9PiBwcm9wT3IoJycsICd2YWx1ZScsIHZhbCkudG9Mb3dlckNhc2UoKSlcbiAgICB9XG4gICAgaSsrXG4gIH1cblxuICAvLyBib2R5IGxvY2F0aW9uXG4gIC8vIE5CISBkZWZpbmVkIGFzIGEgXCJzdHJpbmcgbGlzdFwiIGluIFJGQzM1MDEgYnV0IHJlcGxhY2VkIGluIGVycmF0YSBkb2N1bWVudCB3aXRoIFwic3RyaW5nXCJcbiAgLy8gRXJyYXRhOiBodHRwOi8vd3d3LnJmYy1lZGl0b3Iub3JnL2VycmF0YV9zZWFyY2gucGhwP3JmYz0zNTAxXG4gIGlmIChpIDwgbm9kZS5sZW5ndGggLSAxKSB7XG4gICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgIGN1ck5vZGUubG9jYXRpb24gPSAoKG5vZGVbaV0gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpXG4gICAgfVxuICAgIGkrK1xuICB9XG5cbiAgcmV0dXJuIGN1ck5vZGVcbn1cblxuZnVuY3Rpb24gYXR0cmlidXRlc1RvT2JqZWN0IChhdHRycyA9IFtdLCBrZXlUcmFuc2Zvcm0gPSB0b0xvd2VyLCB2YWx1ZVRyYW5zZm9ybSA9IG1pbWVXb3Jkc0RlY29kZSkge1xuICBjb25zdCB2YWxzID0gYXR0cnMubWFwKHByb3AoJ3ZhbHVlJykpXG4gIGNvbnN0IGtleXMgPSB2YWxzLmZpbHRlcigoXywgaSkgPT4gaSAlIDIgPT09IDApLm1hcChrZXlUcmFuc2Zvcm0pXG4gIGNvbnN0IHZhbHVlcyA9IHZhbHMuZmlsdGVyKChfLCBpKSA9PiBpICUgMiA9PT0gMSkubWFwKHZhbHVlVHJhbnNmb3JtKVxuICByZXR1cm4gZnJvbVBhaXJzKHppcChrZXlzLCB2YWx1ZXMpKVxufVxuXG4vKipcbiAqIFBhcnNlcyBGRVRDSCByZXNwb25zZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZVxuICogQHJldHVybiB7T2JqZWN0fSBNZXNzYWdlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGRVRDSCAocmVzcG9uc2UpIHtcbiAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UucGF5bG9hZCB8fCAhcmVzcG9uc2UucGF5bG9hZC5GRVRDSCB8fCAhcmVzcG9uc2UucGF5bG9hZC5GRVRDSC5sZW5ndGgpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIGNvbnN0IGxpc3QgPSBbXVxuICBjb25zdCBtZXNzYWdlcyA9IHt9XG5cbiAgcmVzcG9uc2UucGF5bG9hZC5GRVRDSC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgY29uc3QgcGFyYW1zID0gW10uY29uY2F0KFtdLmNvbmNhdChpdGVtLmF0dHJpYnV0ZXMgfHwgW10pWzBdIHx8IFtdKSAvLyBlbnN1cmUgdGhlIGZpcnN0IHZhbHVlIGlzIGFuIGFycmF5XG4gICAgbGV0IG1lc3NhZ2VcbiAgICBsZXQgaSwgbGVuLCBrZXlcblxuICAgIGlmIChtZXNzYWdlc1tpdGVtLm5yXSkge1xuICAgICAgLy8gc2FtZSBzZXF1ZW5jZSBudW1iZXIgaXMgYWxyZWFkeSB1c2VkLCBzbyBtZXJnZSB2YWx1ZXMgaW5zdGVhZCBvZiBjcmVhdGluZyBhIG5ldyBtZXNzYWdlIG9iamVjdFxuICAgICAgbWVzc2FnZSA9IG1lc3NhZ2VzW2l0ZW0ubnJdXG4gICAgfSBlbHNlIHtcbiAgICAgIG1lc3NhZ2VzW2l0ZW0ubnJdID0gbWVzc2FnZSA9IHtcbiAgICAgICAgJyMnOiBpdGVtLm5yXG4gICAgICB9XG4gICAgICBsaXN0LnB1c2gobWVzc2FnZSlcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBwYXJhbXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChpICUgMiA9PT0gMCkge1xuICAgICAgICBrZXkgPSBjb21waWxlcih7XG4gICAgICAgICAgYXR0cmlidXRlczogW3BhcmFtc1tpXV1cbiAgICAgICAgfSkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC88XFxkKz4kLywgJycpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBtZXNzYWdlW2tleV0gPSBwYXJzZUZldGNoVmFsdWUoa2V5LCBwYXJhbXNbaV0pXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBsaXN0XG59XG5cbi8qKlxuICogUGFyc2VzIFNUQVRVUyByZXNwb25zZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZVxuICogQHJldHVybiB7T2JqZWN0fSBNZXNzYWdlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTVEFUVVMgKHJlc3BvbnNlLCBhdG9tcyA9IFtdKSB7XG4gIGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnBheWxvYWQgfHwgIXJlc3BvbnNlLnBheWxvYWQuU1RBVFVTIHx8ICFyZXNwb25zZS5wYXlsb2FkLlNUQVRVUy5sZW5ndGgpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IHt9XG4gIGNvbnN0IGF0b21LZXlNYXAgPSB7XG4gICAgVUlETkVYVDogJ3VpZE5leHQnLFxuICAgIE1FU1NBR0VTOiAnbWVzc2FnZXMnLFxuICAgIEhJR0hFU1RNT0RTRVE6ICdoaWdoZXN0TW9kc2VxJ1xuICB9XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSByZXNwb25zZS5wYXlsb2FkLlNUQVRVU1swXS5hdHRyaWJ1dGVzWzFdXG5cbiAgY29uc3QgZ2V0VmFsdWVCeUF0b20gPSAoYXRvbSkgPT4ge1xuICAgIGNvbnN0IGF0b21JbmRleCA9IGF0dHJpYnV0ZXMuZmluZEluZGV4KChhdHRyaWJ1dGUpID0+IGF0dHJpYnV0ZS52YWx1ZSA9PT0gYXRvbSlcbiAgICBjb25zdCBhdG9tVmFsdWVBdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0b21JbmRleCArIDFdXG4gICAgY29uc3QgcGFyc2VkQXRvbVZhbHVlID0gYXRvbVZhbHVlQXR0cmlidXRlICYmIGF0b21WYWx1ZUF0dHJpYnV0ZS52YWx1ZVxuICAgICAgPyBOdW1iZXIucGFyc2VJbnQoYXRvbVZhbHVlQXR0cmlidXRlLnZhbHVlLCAxMClcbiAgICAgIDogbnVsbFxuXG4gICAgcmV0dXJuIHBhcnNlZEF0b21WYWx1ZSB8fCBudWxsXG4gIH1cblxuICBhdG9tcy5mb3JFYWNoKChhdG9tKSA9PiB7XG4gICAgcmVzdWx0W2F0b21LZXlNYXBbYXRvbV1dID0gZ2V0VmFsdWVCeUF0b20oYXRvbSlcbiAgfSlcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogUGFyc2VzIGEgc2luZ2xlIHZhbHVlIGZyb20gdGhlIEZFVENIIHJlc3BvbnNlIG9iamVjdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgS2V5IG5hbWUgKHVwcGVyY2FzZSlcbiAqIEBwYXJhbSB7TWl6ZWR9IHZhbHVlIFZhbHVlIGZvciB0aGUga2V5XG4gKiBAcmV0dXJuIHtNaXhlZH0gUHJvY2Vzc2VkIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIHBhcnNlRmV0Y2hWYWx1ZSAoa2V5LCB2YWx1ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSAndWlkJzpcbiAgICAgIGNhc2UgJ3JmYzgyMi5zaXplJzpcbiAgICAgICAgcmV0dXJuIE51bWJlcih2YWx1ZS52YWx1ZSkgfHwgMFxuICAgICAgY2FzZSAnbW9kc2VxJzogLy8gZG8gbm90IGNhc3QgNjQgYml0IHVpbnQgdG8gYSBudW1iZXJcbiAgICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlIHx8ICcwJ1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUudmFsdWVcbiAgfVxuXG4gIHN3aXRjaCAoa2V5KSB7XG4gICAgY2FzZSAnZmxhZ3MnOlxuICAgIGNhc2UgJ3gtZ20tbGFiZWxzJzpcbiAgICAgIHZhbHVlID0gW10uY29uY2F0KHZhbHVlKS5tYXAoKGZsYWcpID0+IChmbGFnLnZhbHVlIHx8ICcnKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnZW52ZWxvcGUnOlxuICAgICAgdmFsdWUgPSBwYXJzZUVOVkVMT1BFKFtdLmNvbmNhdCh2YWx1ZSB8fCBbXSkpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JvZHlzdHJ1Y3R1cmUnOlxuICAgICAgdmFsdWUgPSBwYXJzZUJPRFlTVFJVQ1RVUkUoW10uY29uY2F0KHZhbHVlIHx8IFtdKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnbW9kc2VxJzpcbiAgICAgIHZhbHVlID0gKHZhbHVlLnNoaWZ0KCkgfHwge30pLnZhbHVlIHx8ICcwJ1xuICAgICAgYnJlYWtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAgKiBCaW5hcnkgU2VhcmNoIC0gZnJvbSBucG0gbW9kdWxlIGJpbmFyeS1zZWFyY2gsIGxpY2Vuc2UgQ0MwXG4gICpcbiAgKiBAcGFyYW0ge0FycmF5fSBoYXlzdGFjayBPcmRlcmVkIGFycmF5XG4gICogQHBhcmFtIHthbnl9IG5lZWRsZSBJdGVtIHRvIHNlYXJjaCBmb3IgaW4gaGF5c3RhY2tcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wYXJhdG9yIEZ1bmN0aW9uIHRoYXQgZGVmaW5lcyB0aGUgc29ydCBvcmRlclxuICAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgbmVlZGxlIGluIGhheXN0YWNrIG9yIGlmIG5vdCBmb3VuZCxcbiAgKiAgICAgLUluZGV4LTEgaXMgdGhlIHBvc2l0aW9uIHdoZXJlIG5lZWRsZSBjb3VsZCBiZSBpbnNlcnRlZCB3aGlsZSBzdGlsbFxuICAqICAgICBrZWVwaW5nIGhheXN0YWNrIG9yZGVyZWQuXG4gICovXG5mdW5jdGlvbiBiaW5TZWFyY2ggKGhheXN0YWNrLCBuZWVkbGUsIGNvbXBhcmF0b3IgPSAoYSwgYikgPT4gYSAtIGIpIHtcbiAgdmFyIG1pZCwgY21wXG4gIHZhciBsb3cgPSAwXG4gIHZhciBoaWdoID0gaGF5c3RhY2subGVuZ3RoIC0gMVxuXG4gIHdoaWxlIChsb3cgPD0gaGlnaCkge1xuICAgIC8vIE5vdGUgdGhhdCBcIihsb3cgKyBoaWdoKSA+Pj4gMVwiIG1heSBvdmVyZmxvdywgYW5kIHJlc3VsdHMgaW5cbiAgICAvLyBhIHR5cGVjYXN0IHRvIGRvdWJsZSAod2hpY2ggZ2l2ZXMgdGhlIHdyb25nIHJlc3VsdHMpLlxuICAgIG1pZCA9IGxvdyArIChoaWdoIC0gbG93ID4+IDEpXG4gICAgY21wID0gK2NvbXBhcmF0b3IoaGF5c3RhY2tbbWlkXSwgbmVlZGxlKVxuXG4gICAgaWYgKGNtcCA8IDAuMCkge1xuICAgICAgLy8gdG9vIGxvd1xuICAgICAgbG93ID0gbWlkICsgMVxuICAgIH0gZWxzZSBpZiAoY21wID4gMC4wKSB7XG4gICAgICAvLyB0b28gaGlnaFxuICAgICAgaGlnaCA9IG1pZCAtIDFcbiAgICB9IGVsc2Uge1xuICAgICAgLy8ga2V5IGZvdW5kXG4gICAgICByZXR1cm4gbWlkXG4gICAgfVxuICB9XG5cbiAgLy8ga2V5IG5vdCBmb3VuZFxuICByZXR1cm4gfmxvd1xufTtcblxuLyoqXG4gKiBQYXJzZXMgU0VBUkNIIHJlc3BvbnNlLiBHYXRoZXJzIGFsbCB1bnRhZ2dlZCBTRUFSQ0ggcmVzcG9uc2VzLCBmZXRjaGVkIHNlcS4vdWlkIG51bWJlcnNcbiAqIGFuZCBjb21waWxlcyB0aGVzZSBpbnRvIGEgc29ydGVkIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZVxuICogQHJldHVybiB7T2JqZWN0fSBNZXNzYWdlIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gU29ydGVkIFNlcS4vVUlEIG51bWJlciBsaXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNFQVJDSCAocmVzcG9uc2UpIHtcbiAgY29uc3QgbGlzdCA9IFtdXG5cbiAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UucGF5bG9hZCB8fCAhcmVzcG9uc2UucGF5bG9hZC5TRUFSQ0ggfHwgIXJlc3BvbnNlLnBheWxvYWQuU0VBUkNILmxlbmd0aCkge1xuICAgIHJldHVybiBsaXN0XG4gIH1cblxuICByZXNwb25zZS5wYXlsb2FkLlNFQVJDSC5mb3JFYWNoKHJlc3VsdCA9PlxuICAgIChyZXN1bHQuYXR0cmlidXRlcyB8fCBbXSkuZm9yRWFjaChuciA9PiB7XG4gICAgICBuciA9IE51bWJlcigobnIgJiYgbnIudmFsdWUpIHx8IG5yKSB8fCAwXG4gICAgICBjb25zdCBpZHggPSBiaW5TZWFyY2gobGlzdCwgbnIpXG4gICAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgICBsaXN0LnNwbGljZSgtaWR4IC0gMSwgMCwgbnIpXG4gICAgICB9XG4gICAgfSlcbiAgKVxuXG4gIHJldHVybiBsaXN0XG59O1xuXG4vKipcbiAqIFBhcnNlcyBDT1BZIGFuZCBVSUQgQ09QWSByZXNwb25zZS5cbiAqIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0MzE1XG4gKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2VcbiAqIEByZXR1cm5zIHt7ZGVzdFNlcVNldDogc3RyaW5nLCBzcmNTZXFTZXQ6IHN0cmluZ319IFNvdXJjZSBhbmRcbiAqIGRlc3RpbmF0aW9uIHVpZCBzZXRzIGlmIGF2YWlsYWJsZSwgdW5kZWZpbmVkIGlmIG5vdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ09QWSAocmVzcG9uc2UpIHtcbiAgY29uc3QgY29weXVpZCA9IHJlc3BvbnNlICYmIHJlc3BvbnNlLmNvcHl1aWRcbiAgaWYgKGNvcHl1aWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3JjU2VxU2V0OiBjb3B5dWlkWzFdLFxuICAgICAgZGVzdFNlcVNldDogY29weXVpZFsyXVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlcyBBUFBFTkQgKHVwbG9hZCkgcmVzcG9uc2UuXG4gKiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNDMxNVxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgdWlkIGFzc2lnbmVkIHRvIHRoZSB1cGxvYWRlZCBtZXNzYWdlIGlmIGF2YWlsYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQVBQRU5EIChyZXNwb25zZSkge1xuICByZXR1cm4gcmVzcG9uc2UgJiYgcmVzcG9uc2UuYXBwZW5kdWlkICYmIHJlc3BvbnNlLmFwcGVuZHVpZFsxXVxufVxuIl0sIm1hcHBpbmdzIjoi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