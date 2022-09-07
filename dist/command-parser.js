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
  } // multipart


  if (Array.isArray(node[0])) {
    curNode.childNodes = [];

    while (Array.isArray(node[i])) {
      curNode.childNodes.push(parseBODYSTRUCTURE(node[i], path.concat(++part)));
      i++;
    } // multipart type


    curNode.type = 'multipart/' + ((node[i++] || {}).value || '').toString().toLowerCase(); // extension data (not available for BODY requests)
    // body parameter parenthesized list

    if (i < node.length - 1) {
      if (node[i]) {
        curNode.parameters = attributesToObject(node[i]);
      }

      i++;
    }
  } else {
    // content type
    curNode.type = [((node[i++] || {}).value || '').toString().toLowerCase(), ((node[i++] || {}).value || '').toString().toLowerCase()].join('/'); // body parameter parenthesized list

    if (node[i]) {
      curNode.parameters = attributesToObject(node[i]);
    }

    i++; // id

    if (node[i]) {
      curNode.id = ((node[i] || {}).value || '').toString();
    }

    i++; // description

    if (node[i]) {
      curNode.description = ((node[i] || {}).value || '').toString();
    }

    i++; // encoding

    if (node[i]) {
      curNode.encoding = ((node[i] || {}).value || '').toString().toLowerCase();
    }

    i++; // size

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
        curNode.childNodes = [// rfc822 bodyparts share the same path, difference is between MIME and HEADER
        // path.MIME returns message/rfc822 header
        // path.HEADER returns inlined message header
        parseBODYSTRUCTURE(node[i], path)];
      }

      i++; // line count

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
    } // extension data (not available for BODY requests)
    // md5


    if (i < node.length - 1) {
      if (node[i]) {
        curNode.md5 = ((node[i] || {}).value || '').toString().toLowerCase();
      }

      i++;
    }
  } // the following are shared extension values (for both multipart and non-multipart parts)
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
  } // body language


  if (i < node.length - 1) {
    if (node[i]) {
      curNode.language = [].concat(node[i]).map(val => (0, _ramda.propOr)('', 'value', val).toLowerCase());
    }

    i++;
  } // body location
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
  } // key not found


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXJzZU5BTUVTUEFDRSIsInJlc3BvbnNlIiwicGF5bG9hZCIsIk5BTUVTUEFDRSIsImxlbmd0aCIsImF0dHJpYnV0ZXMiLCJjb25jYXQiLCJwb3AiLCJwZXJzb25hbCIsInBhcnNlTkFNRVNQQUNFRWxlbWVudCIsInVzZXJzIiwic2hhcmVkIiwiZWxlbWVudCIsIm1hcCIsIm5zIiwicHJlZml4IiwidmFsdWUiLCJkZWxpbWl0ZXIiLCJwYXJzZVNFTEVDVCIsIm1haWxib3giLCJyZWFkT25seSIsImNvZGUiLCJleGlzdHNSZXNwb25zZSIsIkVYSVNUUyIsImZsYWdzUmVzcG9uc2UiLCJGTEFHUyIsIm9rUmVzcG9uc2UiLCJPSyIsImV4aXN0cyIsIm5yIiwiZmxhZ3MiLCJmbGFnIiwidG9TdHJpbmciLCJ0cmltIiwiZm9yRWFjaCIsIm9rIiwicGVybWFuZW50RmxhZ3MiLCJwZXJtYW5lbnRmbGFncyIsInVpZFZhbGlkaXR5IiwiTnVtYmVyIiwidWlkdmFsaWRpdHkiLCJ1aWROZXh0IiwidWlkbmV4dCIsImhpZ2hlc3RNb2RzZXEiLCJoaWdoZXN0bW9kc2VxIiwibm9Nb2RzZXEiLCJwYXJzZUVOVkVMT1BFIiwiZW52ZWxvcGUiLCJkYXRlIiwic3ViamVjdCIsIm1pbWVXb3Jkc0RlY29kZSIsImZyb20iLCJwcm9jZXNzQWRkcmVzc2VzIiwic2VuZGVyIiwidG8iLCJjYyIsImJjYyIsImxpc3QiLCJhZGRyIiwibmFtZSIsInBhdGhPciIsImFkZHJlc3MiLCJmb3JtYXR0ZWQiLCJlbmNvZGVBZGRyZXNzTmFtZSIsInBhcnNlZCIsInBhcnNlQWRkcmVzcyIsInNoaWZ0IiwidGVzdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJtaW1lV29yZEVuY29kZSIsInBhcnNlQk9EWVNUUlVDVFVSRSIsIm5vZGUiLCJwYXRoIiwiY3VyTm9kZSIsImkiLCJwYXJ0Iiwiam9pbiIsIkFycmF5IiwiaXNBcnJheSIsImNoaWxkTm9kZXMiLCJwdXNoIiwidHlwZSIsInRvTG93ZXJDYXNlIiwicGFyYW1ldGVycyIsImF0dHJpYnV0ZXNUb09iamVjdCIsImlkIiwiZGVzY3JpcHRpb24iLCJlbmNvZGluZyIsInNpemUiLCJsaW5lQ291bnQiLCJtZDUiLCJkaXNwb3NpdGlvbiIsImRpc3Bvc2l0aW9uUGFyYW1ldGVycyIsImxhbmd1YWdlIiwidmFsIiwicHJvcE9yIiwibG9jYXRpb24iLCJhdHRycyIsImtleVRyYW5zZm9ybSIsInRvTG93ZXIiLCJ2YWx1ZVRyYW5zZm9ybSIsInZhbHMiLCJwcm9wIiwia2V5cyIsImZpbHRlciIsIl8iLCJ2YWx1ZXMiLCJmcm9tUGFpcnMiLCJ6aXAiLCJwYXJzZUZFVENIIiwiRkVUQ0giLCJtZXNzYWdlcyIsIml0ZW0iLCJwYXJhbXMiLCJtZXNzYWdlIiwibGVuIiwia2V5IiwiY29tcGlsZXIiLCJyZXBsYWNlIiwicGFyc2VGZXRjaFZhbHVlIiwicGFyc2VTVEFUVVMiLCJhdG9tcyIsIlNUQVRVUyIsInJlc3VsdCIsImF0b21LZXlNYXAiLCJVSURORVhUIiwiTUVTU0FHRVMiLCJISUdIRVNUTU9EU0VRIiwiZ2V0VmFsdWVCeUF0b20iLCJhdG9tIiwiYXRvbUluZGV4IiwiZmluZEluZGV4IiwiYXR0cmlidXRlIiwiYXRvbVZhbHVlQXR0cmlidXRlIiwicGFyc2VkQXRvbVZhbHVlIiwicGFyc2VJbnQiLCJiaW5TZWFyY2giLCJoYXlzdGFjayIsIm5lZWRsZSIsImNvbXBhcmF0b3IiLCJhIiwiYiIsIm1pZCIsImNtcCIsImxvdyIsImhpZ2giLCJwYXJzZVNFQVJDSCIsIlNFQVJDSCIsImlkeCIsInNwbGljZSIsInBhcnNlQ09QWSIsImNvcHl1aWQiLCJzcmNTZXFTZXQiLCJkZXN0U2VxU2V0IiwicGFyc2VBUFBFTkQiLCJhcHBlbmR1aWQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbWFuZC1wYXJzZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhcnNlQWRkcmVzcyBmcm9tICdlbWFpbGpzLWFkZHJlc3NwYXJzZXInXG5pbXBvcnQgeyBjb21waWxlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IHsgemlwLCBmcm9tUGFpcnMsIHByb3AsIHBhdGhPciwgcHJvcE9yLCB0b0xvd2VyIH0gZnJvbSAncmFtZGEnXG5pbXBvcnQgeyBtaW1lV29yZEVuY29kZSwgbWltZVdvcmRzRGVjb2RlIH0gZnJvbSAnZW1haWxqcy1taW1lLWNvZGVjJ1xuXG4vKipcbiAqIFBhcnNlcyBOQU1FU1BBQ0UgcmVzcG9uc2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2VcbiAqIEByZXR1cm4ge09iamVjdH0gTmFtZXNwYWNlcyBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTkFNRVNQQUNFIChyZXNwb25zZSkge1xuICBpZiAoIXJlc3BvbnNlLnBheWxvYWQgfHwgIXJlc3BvbnNlLnBheWxvYWQuTkFNRVNQQUNFIHx8ICFyZXNwb25zZS5wYXlsb2FkLk5BTUVTUEFDRS5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXS5jb25jYXQocmVzcG9uc2UucGF5bG9hZC5OQU1FU1BBQ0UucG9wKCkuYXR0cmlidXRlcyB8fCBbXSlcbiAgaWYgKCFhdHRyaWJ1dGVzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwZXJzb25hbDogcGFyc2VOQU1FU1BBQ0VFbGVtZW50KGF0dHJpYnV0ZXNbMF0pLFxuICAgIHVzZXJzOiBwYXJzZU5BTUVTUEFDRUVsZW1lbnQoYXR0cmlidXRlc1sxXSksXG4gICAgc2hhcmVkOiBwYXJzZU5BTUVTUEFDRUVsZW1lbnQoYXR0cmlidXRlc1syXSlcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlcyBhIE5BTUVTUEFDRSBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnRcbiAqIEByZXR1cm4ge09iamVjdH0gTmFtZXNwYWNlcyBlbGVtZW50IG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VOQU1FU1BBQ0VFbGVtZW50IChlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZWxlbWVudCA9IFtdLmNvbmNhdChlbGVtZW50IHx8IFtdKVxuICByZXR1cm4gZWxlbWVudC5tYXAoKG5zKSA9PiB7XG4gICAgaWYgKCFucyB8fCAhbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJlZml4OiBuc1swXS52YWx1ZSxcbiAgICAgIGRlbGltaXRlcjogbnNbMV0gJiYgbnNbMV0udmFsdWUgLy8gVGhlIGRlbGltaXRlciBjYW4gbGVnYWxseSBiZSBOSUwgd2hpY2ggbWFwcyB0byBudWxsXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIFBhcnNlcyBTRUxFQ1QgcmVzcG9uc2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2VcbiAqIEByZXR1cm4ge09iamVjdH0gTWFpbGJveCBpbmZvcm1hdGlvbiBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU0VMRUNUIChyZXNwb25zZSkge1xuICBpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5wYXlsb2FkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCBtYWlsYm94ID0ge1xuICAgIHJlYWRPbmx5OiByZXNwb25zZS5jb2RlID09PSAnUkVBRC1PTkxZJ1xuICB9XG4gIGNvbnN0IGV4aXN0c1Jlc3BvbnNlID0gcmVzcG9uc2UucGF5bG9hZC5FWElTVFMgJiYgcmVzcG9uc2UucGF5bG9hZC5FWElTVFMucG9wKClcbiAgY29uc3QgZmxhZ3NSZXNwb25zZSA9IHJlc3BvbnNlLnBheWxvYWQuRkxBR1MgJiYgcmVzcG9uc2UucGF5bG9hZC5GTEFHUy5wb3AoKVxuICBjb25zdCBva1Jlc3BvbnNlID0gcmVzcG9uc2UucGF5bG9hZC5PS1xuXG4gIGlmIChleGlzdHNSZXNwb25zZSkge1xuICAgIG1haWxib3guZXhpc3RzID0gZXhpc3RzUmVzcG9uc2UubnIgfHwgMFxuICB9XG5cbiAgaWYgKGZsYWdzUmVzcG9uc2UgJiYgZmxhZ3NSZXNwb25zZS5hdHRyaWJ1dGVzICYmIGZsYWdzUmVzcG9uc2UuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICBtYWlsYm94LmZsYWdzID0gZmxhZ3NSZXNwb25zZS5hdHRyaWJ1dGVzWzBdLm1hcCgoZmxhZykgPT4gKGZsYWcudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudHJpbSgpKVxuICB9XG5cbiAgW10uY29uY2F0KG9rUmVzcG9uc2UgfHwgW10pLmZvckVhY2goKG9rKSA9PiB7XG4gICAgc3dpdGNoIChvayAmJiBvay5jb2RlKSB7XG4gICAgICBjYXNlICdQRVJNQU5FTlRGTEFHUyc6XG4gICAgICAgIG1haWxib3gucGVybWFuZW50RmxhZ3MgPSBbXS5jb25jYXQob2sucGVybWFuZW50ZmxhZ3MgfHwgW10pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdVSURWQUxJRElUWSc6XG4gICAgICAgIG1haWxib3gudWlkVmFsaWRpdHkgPSBOdW1iZXIob2sudWlkdmFsaWRpdHkpIHx8IDBcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ1VJRE5FWFQnOlxuICAgICAgICBtYWlsYm94LnVpZE5leHQgPSBOdW1iZXIob2sudWlkbmV4dCkgfHwgMFxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnSElHSEVTVE1PRFNFUSc6XG4gICAgICAgIG1haWxib3guaGlnaGVzdE1vZHNlcSA9IG9rLmhpZ2hlc3Rtb2RzZXEgfHwgJzAnIC8vIGtlZXAgNjRiaXQgdWludCBhcyBhIHN0cmluZ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnTk9NT0RTRVEnOlxuICAgICAgICBtYWlsYm94Lm5vTW9kc2VxID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfSlcblxuICByZXR1cm4gbWFpbGJveFxufVxuXG4vKipcbiAqIFBhcnNlcyBtZXNzYWdlIGVudmVsb3BlIGZyb20gRkVUQ0ggcmVzcG9uc2UuIEFsbCBrZXlzIGluIHRoZSByZXN1bHRpbmdcbiAqIG9iamVjdCBhcmUgbG93ZXJjYXNlLiBBZGRyZXNzIGZpZWxkcyBhcmUgYWxsIGFycmF5cyB3aXRoIHtuYW1lOiwgYWRkcmVzczp9XG4gKiBzdHJ1Y3R1cmVkIHZhbHVlcy4gVW5pY29kZSBzdHJpbmdzIGFyZSBhdXRvbWF0aWNhbGx5IGRlY29kZWQuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWUgRW52ZWxvcGUgYXJyYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBFbnZlbG9wZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRU5WRUxPUEUgKHZhbHVlKSB7XG4gIGNvbnN0IGVudmVsb3BlID0ge31cblxuICBpZiAodmFsdWVbMF0gJiYgdmFsdWVbMF0udmFsdWUpIHtcbiAgICBlbnZlbG9wZS5kYXRlID0gdmFsdWVbMF0udmFsdWVcbiAgfVxuXG4gIGlmICh2YWx1ZVsxXSAmJiB2YWx1ZVsxXS52YWx1ZSkge1xuICAgIGVudmVsb3BlLnN1YmplY3QgPSBtaW1lV29yZHNEZWNvZGUodmFsdWVbMV0gJiYgdmFsdWVbMV0udmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWVbMl0gJiYgdmFsdWVbMl0ubGVuZ3RoKSB7XG4gICAgZW52ZWxvcGUuZnJvbSA9IHByb2Nlc3NBZGRyZXNzZXModmFsdWVbMl0pXG4gIH1cblxuICBpZiAodmFsdWVbM10gJiYgdmFsdWVbM10ubGVuZ3RoKSB7XG4gICAgZW52ZWxvcGUuc2VuZGVyID0gcHJvY2Vzc0FkZHJlc3Nlcyh2YWx1ZVszXSlcbiAgfVxuXG4gIGlmICh2YWx1ZVs0XSAmJiB2YWx1ZVs0XS5sZW5ndGgpIHtcbiAgICBlbnZlbG9wZVsncmVwbHktdG8nXSA9IHByb2Nlc3NBZGRyZXNzZXModmFsdWVbNF0pXG4gIH1cblxuICBpZiAodmFsdWVbNV0gJiYgdmFsdWVbNV0ubGVuZ3RoKSB7XG4gICAgZW52ZWxvcGUudG8gPSBwcm9jZXNzQWRkcmVzc2VzKHZhbHVlWzVdKVxuICB9XG5cbiAgaWYgKHZhbHVlWzZdICYmIHZhbHVlWzZdLmxlbmd0aCkge1xuICAgIGVudmVsb3BlLmNjID0gcHJvY2Vzc0FkZHJlc3Nlcyh2YWx1ZVs2XSlcbiAgfVxuXG4gIGlmICh2YWx1ZVs3XSAmJiB2YWx1ZVs3XS5sZW5ndGgpIHtcbiAgICBlbnZlbG9wZS5iY2MgPSBwcm9jZXNzQWRkcmVzc2VzKHZhbHVlWzddKVxuICB9XG5cbiAgaWYgKHZhbHVlWzhdICYmIHZhbHVlWzhdLnZhbHVlKSB7XG4gICAgZW52ZWxvcGVbJ2luLXJlcGx5LXRvJ10gPSB2YWx1ZVs4XS52YWx1ZVxuICB9XG5cbiAgaWYgKHZhbHVlWzldICYmIHZhbHVlWzldLnZhbHVlKSB7XG4gICAgZW52ZWxvcGVbJ21lc3NhZ2UtaWQnXSA9IHZhbHVlWzldLnZhbHVlXG4gIH1cblxuICByZXR1cm4gZW52ZWxvcGVcbn1cblxuLypcbiAqIEVOVkVMT1BFIGxpc3RzIGFkZHJlc3NlcyBhcyBbbmFtZS1wYXJ0LCBzb3VyY2Utcm91dGUsIHVzZXJuYW1lLCBob3N0bmFtZV1cbiAqIHdoZXJlIHNvdXJjZS1yb3V0ZSBpcyBub3QgdXNlZCBhbnltb3JlIGFuZCBjYW4gYmUgaWdub3JlZC5cbiAqIFRvIGdldCBjb21wYXJhYmxlIHJlc3VsdHMgd2l0aCBvdGhlciBwYXJ0cyBvZiB0aGUgZW1haWwuanMgc3RhY2tcbiAqIGJyb3dzZXJib3ggZmVlZHMgdGhlIHBhcnNlZCBhZGRyZXNzIHZhbHVlcyBmcm9tIEVOVkVMT1BFXG4gKiB0byBhZGRyZXNzcGFyc2VyIGFuZCB1c2VzIHJlc3VsdGluZyB2YWx1ZXMgaW5zdGVhZCBvZiB0aGVcbiAqIHByZS1wYXJzZWQgYWRkcmVzc2VzXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NBZGRyZXNzZXMgKGxpc3QgPSBbXSkge1xuICByZXR1cm4gbGlzdC5tYXAoKGFkZHIpID0+IHtcbiAgICBjb25zdCBuYW1lID0gKHBhdGhPcignJywgWycwJywgJ3ZhbHVlJ10sIGFkZHIpKS50cmltKClcbiAgICBjb25zdCBhZGRyZXNzID0gKHBhdGhPcignJywgWycyJywgJ3ZhbHVlJ10sIGFkZHIpKSArICdAJyArIChwYXRoT3IoJycsIFsnMycsICd2YWx1ZSddLCBhZGRyKSlcbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBuYW1lID8gKGVuY29kZUFkZHJlc3NOYW1lKG5hbWUpICsgJyA8JyArIGFkZHJlc3MgKyAnPicpIDogYWRkcmVzc1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQWRkcmVzcyhmb3JtYXR0ZWQpLnNoaWZ0KCkgLy8gdGhlcmUgc2hvdWxkIGJlIGp1c3QgYSBzaW5nbGUgYWRkcmVzc1xuICAgIHBhcnNlZC5uYW1lID0gbWltZVdvcmRzRGVjb2RlKHBhcnNlZC5uYW1lKVxuICAgIHJldHVybiBwYXJzZWRcbiAgfSlcbn1cblxuLyoqXG4gKiBJZiBuZWVkZWQsIGVuY2xvc2VzIHdpdGggcXVvdGVzIG9yIG1pbWUgZW5jb2RlcyB0aGUgbmFtZSBwYXJ0IG9mIGFuIGUtbWFpbCBhZGRyZXNzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBwYXJ0IG9mIGFuIGFkZHJlc3NcbiAqIEByZXR1cm5zIHtTdHJpbmd9IE1pbWUgd29yZCBlbmNvZGVkIG9yIHF1b3RlZCBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZW5jb2RlQWRkcmVzc05hbWUgKG5hbWUpIHtcbiAgaWYgKCEvXltcXHcgJ10qJC8udGVzdChuYW1lKSkge1xuICAgIGlmICgvXltcXHgyMC1cXHg3ZV0qJC8udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG5hbWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtaW1lV29yZEVuY29kZShuYW1lLCAnUScsIDUyKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmFtZVxufVxuXG4vKipcbiAqIFBhcnNlcyBtZXNzYWdlIGJvZHkgc3RydWN0dXJlIGZyb20gRkVUQ0ggcmVzcG9uc2UuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWUgQk9EWVNUUlVDVFVSRSBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IEVudmVsb3BlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VCT0RZU1RSVUNUVVJFIChub2RlLCBwYXRoID0gW10pIHtcbiAgY29uc3QgY3VyTm9kZSA9IHt9XG4gIGxldCBpID0gMFxuICBsZXQgcGFydCA9IDBcblxuICBpZiAocGF0aC5sZW5ndGgpIHtcbiAgICBjdXJOb2RlLnBhcnQgPSBwYXRoLmpvaW4oJy4nKVxuICB9XG5cbiAgLy8gbXVsdGlwYXJ0XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVbMF0pKSB7XG4gICAgY3VyTm9kZS5jaGlsZE5vZGVzID0gW11cbiAgICB3aGlsZSAoQXJyYXkuaXNBcnJheShub2RlW2ldKSkge1xuICAgICAgY3VyTm9kZS5jaGlsZE5vZGVzLnB1c2gocGFyc2VCT0RZU1RSVUNUVVJFKG5vZGVbaV0sIHBhdGguY29uY2F0KCsrcGFydCkpKVxuICAgICAgaSsrXG4gICAgfVxuXG4gICAgLy8gbXVsdGlwYXJ0IHR5cGVcbiAgICBjdXJOb2RlLnR5cGUgPSAnbXVsdGlwYXJ0LycgKyAoKG5vZGVbaSsrXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxuXG4gICAgLy8gZXh0ZW5zaW9uIGRhdGEgKG5vdCBhdmFpbGFibGUgZm9yIEJPRFkgcmVxdWVzdHMpXG5cbiAgICAvLyBib2R5IHBhcmFtZXRlciBwYXJlbnRoZXNpemVkIGxpc3RcbiAgICBpZiAoaSA8IG5vZGUubGVuZ3RoIC0gMSkge1xuICAgICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgICAgY3VyTm9kZS5wYXJhbWV0ZXJzID0gYXR0cmlidXRlc1RvT2JqZWN0KG5vZGVbaV0pXG4gICAgICB9XG4gICAgICBpKytcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gY29udGVudCB0eXBlXG4gICAgY3VyTm9kZS50eXBlID0gW1xuICAgICAgKChub2RlW2krK10gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCksICgobm9kZVtpKytdIHx8IHt9KS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpXG4gICAgXS5qb2luKCcvJylcblxuICAgIC8vIGJvZHkgcGFyYW1ldGVyIHBhcmVudGhlc2l6ZWQgbGlzdFxuICAgIGlmIChub2RlW2ldKSB7XG4gICAgICBjdXJOb2RlLnBhcmFtZXRlcnMgPSBhdHRyaWJ1dGVzVG9PYmplY3Qobm9kZVtpXSlcbiAgICB9XG4gICAgaSsrXG5cbiAgICAvLyBpZFxuICAgIGlmIChub2RlW2ldKSB7XG4gICAgICBjdXJOb2RlLmlkID0gKChub2RlW2ldIHx8IHt9KS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpKytcblxuICAgIC8vIGRlc2NyaXB0aW9uXG4gICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgIGN1ck5vZGUuZGVzY3JpcHRpb24gPSAoKG5vZGVbaV0gfHwge30pLnZhbHVlIHx8ICcnKS50b1N0cmluZygpXG4gICAgfVxuICAgIGkrK1xuXG4gICAgLy8gZW5jb2RpbmdcbiAgICBpZiAobm9kZVtpXSkge1xuICAgICAgY3VyTm9kZS5lbmNvZGluZyA9ICgobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxuICAgIH1cbiAgICBpKytcblxuICAgIC8vIHNpemVcbiAgICBpZiAobm9kZVtpXSkge1xuICAgICAgY3VyTm9kZS5zaXplID0gTnVtYmVyKChub2RlW2ldIHx8IHt9KS52YWx1ZSB8fCAwKSB8fCAwXG4gICAgfVxuICAgIGkrK1xuXG4gICAgaWYgKGN1ck5vZGUudHlwZSA9PT0gJ21lc3NhZ2UvcmZjODIyJykge1xuICAgICAgLy8gbWVzc2FnZS9yZmMgYWRkcyBhZGRpdGlvbmFsIGVudmVsb3BlLCBib2R5c3RydWN0dXJlIGFuZCBsaW5lIGNvdW50IHZhbHVlc1xuXG4gICAgICAvLyBlbnZlbG9wZVxuICAgICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgICAgY3VyTm9kZS5lbnZlbG9wZSA9IHBhcnNlRU5WRUxPUEUoW10uY29uY2F0KG5vZGVbaV0gfHwgW10pKVxuICAgICAgfVxuICAgICAgaSsrXG5cbiAgICAgIGlmIChub2RlW2ldKSB7XG4gICAgICAgIGN1ck5vZGUuY2hpbGROb2RlcyA9IFtcbiAgICAgICAgICAvLyByZmM4MjIgYm9keXBhcnRzIHNoYXJlIHRoZSBzYW1lIHBhdGgsIGRpZmZlcmVuY2UgaXMgYmV0d2VlbiBNSU1FIGFuZCBIRUFERVJcbiAgICAgICAgICAvLyBwYXRoLk1JTUUgcmV0dXJucyBtZXNzYWdlL3JmYzgyMiBoZWFkZXJcbiAgICAgICAgICAvLyBwYXRoLkhFQURFUiByZXR1cm5zIGlubGluZWQgbWVzc2FnZSBoZWFkZXJcbiAgICAgICAgICBwYXJzZUJPRFlTVFJVQ1RVUkUobm9kZVtpXSwgcGF0aClcbiAgICAgICAgXVxuICAgICAgfVxuICAgICAgaSsrXG5cbiAgICAgIC8vIGxpbmUgY291bnRcbiAgICAgIGlmIChub2RlW2ldKSB7XG4gICAgICAgIGN1ck5vZGUubGluZUNvdW50ID0gTnVtYmVyKChub2RlW2ldIHx8IHt9KS52YWx1ZSB8fCAwKSB8fCAwXG4gICAgICB9XG4gICAgICBpKytcbiAgICB9IGVsc2UgaWYgKC9edGV4dFxcLy8udGVzdChjdXJOb2RlLnR5cGUpKSB7XG4gICAgICAvLyB0ZXh0LyogYWRkcyBhZGRpdGlvbmFsIGxpbmUgY291bnQgdmFsdWVzXG5cbiAgICAgIC8vIGxpbmUgY291bnRcbiAgICAgIGlmIChub2RlW2ldKSB7XG4gICAgICAgIGN1ck5vZGUubGluZUNvdW50ID0gTnVtYmVyKChub2RlW2ldIHx8IHt9KS52YWx1ZSB8fCAwKSB8fCAwXG4gICAgICB9XG4gICAgICBpKytcbiAgICB9XG5cbiAgICAvLyBleHRlbnNpb24gZGF0YSAobm90IGF2YWlsYWJsZSBmb3IgQk9EWSByZXF1ZXN0cylcblxuICAgIC8vIG1kNVxuICAgIGlmIChpIDwgbm9kZS5sZW5ndGggLSAxKSB7XG4gICAgICBpZiAobm9kZVtpXSkge1xuICAgICAgICBjdXJOb2RlLm1kNSA9ICgobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxuICAgICAgfVxuICAgICAgaSsrXG4gICAgfVxuICB9XG5cbiAgLy8gdGhlIGZvbGxvd2luZyBhcmUgc2hhcmVkIGV4dGVuc2lvbiB2YWx1ZXMgKGZvciBib3RoIG11bHRpcGFydCBhbmQgbm9uLW11bHRpcGFydCBwYXJ0cylcbiAgLy8gbm90IGF2YWlsYWJsZSBmb3IgQk9EWSByZXF1ZXN0c1xuXG4gIC8vIGJvZHkgZGlzcG9zaXRpb25cbiAgaWYgKGkgPCBub2RlLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlW2ldKSAmJiBub2RlW2ldLmxlbmd0aCkge1xuICAgICAgY3VyTm9kZS5kaXNwb3NpdGlvbiA9ICgobm9kZVtpXVswXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZVtpXVsxXSkpIHtcbiAgICAgICAgY3VyTm9kZS5kaXNwb3NpdGlvblBhcmFtZXRlcnMgPSBhdHRyaWJ1dGVzVG9PYmplY3Qobm9kZVtpXVsxXSlcbiAgICAgIH1cbiAgICB9XG4gICAgaSsrXG4gIH1cblxuICAvLyBib2R5IGxhbmd1YWdlXG4gIGlmIChpIDwgbm9kZS5sZW5ndGggLSAxKSB7XG4gICAgaWYgKG5vZGVbaV0pIHtcbiAgICAgIGN1ck5vZGUubGFuZ3VhZ2UgPSBbXS5jb25jYXQobm9kZVtpXSkubWFwKCh2YWwpID0+IHByb3BPcignJywgJ3ZhbHVlJywgdmFsKS50b0xvd2VyQ2FzZSgpKVxuICAgIH1cbiAgICBpKytcbiAgfVxuXG4gIC8vIGJvZHkgbG9jYXRpb25cbiAgLy8gTkIhIGRlZmluZWQgYXMgYSBcInN0cmluZyBsaXN0XCIgaW4gUkZDMzUwMSBidXQgcmVwbGFjZWQgaW4gZXJyYXRhIGRvY3VtZW50IHdpdGggXCJzdHJpbmdcIlxuICAvLyBFcnJhdGE6IGh0dHA6Ly93d3cucmZjLWVkaXRvci5vcmcvZXJyYXRhX3NlYXJjaC5waHA/cmZjPTM1MDFcbiAgaWYgKGkgPCBub2RlLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAobm9kZVtpXSkge1xuICAgICAgY3VyTm9kZS5sb2NhdGlvbiA9ICgobm9kZVtpXSB8fCB7fSkudmFsdWUgfHwgJycpLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaSsrXG4gIH1cblxuICByZXR1cm4gY3VyTm9kZVxufVxuXG5mdW5jdGlvbiBhdHRyaWJ1dGVzVG9PYmplY3QgKGF0dHJzID0gW10sIGtleVRyYW5zZm9ybSA9IHRvTG93ZXIsIHZhbHVlVHJhbnNmb3JtID0gbWltZVdvcmRzRGVjb2RlKSB7XG4gIGNvbnN0IHZhbHMgPSBhdHRycy5tYXAocHJvcCgndmFsdWUnKSlcbiAgY29uc3Qga2V5cyA9IHZhbHMuZmlsdGVyKChfLCBpKSA9PiBpICUgMiA9PT0gMCkubWFwKGtleVRyYW5zZm9ybSlcbiAgY29uc3QgdmFsdWVzID0gdmFscy5maWx0ZXIoKF8sIGkpID0+IGkgJSAyID09PSAxKS5tYXAodmFsdWVUcmFuc2Zvcm0pXG4gIHJldHVybiBmcm9tUGFpcnMoemlwKGtleXMsIHZhbHVlcykpXG59XG5cbi8qKlxuICogUGFyc2VzIEZFVENIIHJlc3BvbnNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IE1lc3NhZ2Ugb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZFVENIIChyZXNwb25zZSkge1xuICBpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5wYXlsb2FkIHx8ICFyZXNwb25zZS5wYXlsb2FkLkZFVENIIHx8ICFyZXNwb25zZS5wYXlsb2FkLkZFVENILmxlbmd0aCkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgY29uc3QgbGlzdCA9IFtdXG4gIGNvbnN0IG1lc3NhZ2VzID0ge31cblxuICByZXNwb25zZS5wYXlsb2FkLkZFVENILmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBjb25zdCBwYXJhbXMgPSBbXS5jb25jYXQoW10uY29uY2F0KGl0ZW0uYXR0cmlidXRlcyB8fCBbXSlbMF0gfHwgW10pIC8vIGVuc3VyZSB0aGUgZmlyc3QgdmFsdWUgaXMgYW4gYXJyYXlcbiAgICBsZXQgbWVzc2FnZVxuICAgIGxldCBpLCBsZW4sIGtleVxuXG4gICAgaWYgKG1lc3NhZ2VzW2l0ZW0ubnJdKSB7XG4gICAgICAvLyBzYW1lIHNlcXVlbmNlIG51bWJlciBpcyBhbHJlYWR5IHVzZWQsIHNvIG1lcmdlIHZhbHVlcyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IG1lc3NhZ2Ugb2JqZWN0XG4gICAgICBtZXNzYWdlID0gbWVzc2FnZXNbaXRlbS5ucl1cbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZXNbaXRlbS5ucl0gPSBtZXNzYWdlID0ge1xuICAgICAgICAnIyc6IGl0ZW0ubnJcbiAgICAgIH1cbiAgICAgIGxpc3QucHVzaChtZXNzYWdlKVxuICAgIH1cblxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKGkgJSAyID09PSAwKSB7XG4gICAgICAgIGtleSA9IGNvbXBpbGVyKHtcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBbcGFyYW1zW2ldXVxuICAgICAgICB9KS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLzxcXGQrPiQvLCAnJylcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIG1lc3NhZ2Vba2V5XSA9IHBhcnNlRmV0Y2hWYWx1ZShrZXksIHBhcmFtc1tpXSlcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIGxpc3Rcbn1cblxuLyoqXG4gKiBQYXJzZXMgU1RBVFVTIHJlc3BvbnNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IE1lc3NhZ2Ugb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNUQVRVUyAocmVzcG9uc2UsIGF0b21zID0gW10pIHtcbiAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UucGF5bG9hZCB8fCAhcmVzcG9uc2UucGF5bG9hZC5TVEFUVVMgfHwgIXJlc3BvbnNlLnBheWxvYWQuU1RBVFVTLmxlbmd0aCkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0ge31cbiAgY29uc3QgYXRvbUtleU1hcCA9IHtcbiAgICBVSURORVhUOiAndWlkTmV4dCcsXG4gICAgTUVTU0FHRVM6ICdtZXNzYWdlcycsXG4gICAgSElHSEVTVE1PRFNFUTogJ2hpZ2hlc3RNb2RzZXEnXG4gIH1cbiAgY29uc3QgYXR0cmlidXRlcyA9IHJlc3BvbnNlLnBheWxvYWQuU1RBVFVTWzBdLmF0dHJpYnV0ZXNbMV1cblxuICBjb25zdCBnZXRWYWx1ZUJ5QXRvbSA9IChhdG9tKSA9PiB7XG4gICAgY29uc3QgYXRvbUluZGV4ID0gYXR0cmlidXRlcy5maW5kSW5kZXgoKGF0dHJpYnV0ZSkgPT4gYXR0cmlidXRlLnZhbHVlID09PSBhdG9tKVxuICAgIGNvbnN0IGF0b21WYWx1ZUF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXRvbUluZGV4ICsgMV1cbiAgICBjb25zdCBwYXJzZWRBdG9tVmFsdWUgPSBhdG9tVmFsdWVBdHRyaWJ1dGUgJiYgYXRvbVZhbHVlQXR0cmlidXRlLnZhbHVlXG4gICAgICA/IE51bWJlci5wYXJzZUludChhdG9tVmFsdWVBdHRyaWJ1dGUudmFsdWUsIDEwKVxuICAgICAgOiBudWxsXG5cbiAgICByZXR1cm4gcGFyc2VkQXRvbVZhbHVlIHx8IG51bGxcbiAgfVxuXG4gIGF0b21zLmZvckVhY2goKGF0b20pID0+IHtcbiAgICByZXN1bHRbYXRvbUtleU1hcFthdG9tXV0gPSBnZXRWYWx1ZUJ5QXRvbShhdG9tKVxuICB9KVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBQYXJzZXMgYSBzaW5nbGUgdmFsdWUgZnJvbSB0aGUgRkVUQ0ggcmVzcG9uc2Ugb2JqZWN0XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBLZXkgbmFtZSAodXBwZXJjYXNlKVxuICogQHBhcmFtIHtNaXplZH0gdmFsdWUgVmFsdWUgZm9yIHRoZSBrZXlcbiAqIEByZXR1cm4ge01peGVkfSBQcm9jZXNzZWQgdmFsdWVcbiAqL1xuZnVuY3Rpb24gcGFyc2VGZXRjaFZhbHVlIChrZXksIHZhbHVlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlICd1aWQnOlxuICAgICAgY2FzZSAncmZjODIyLnNpemUnOlxuICAgICAgICByZXR1cm4gTnVtYmVyKHZhbHVlLnZhbHVlKSB8fCAwXG4gICAgICBjYXNlICdtb2RzZXEnOiAvLyBkbyBub3QgY2FzdCA2NCBiaXQgdWludCB0byBhIG51bWJlclxuICAgICAgICByZXR1cm4gdmFsdWUudmFsdWUgfHwgJzAnXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS52YWx1ZVxuICB9XG5cbiAgc3dpdGNoIChrZXkpIHtcbiAgICBjYXNlICdmbGFncyc6XG4gICAgY2FzZSAneC1nbS1sYWJlbHMnOlxuICAgICAgdmFsdWUgPSBbXS5jb25jYXQodmFsdWUpLm1hcCgoZmxhZykgPT4gKGZsYWcudmFsdWUgfHwgJycpKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdlbnZlbG9wZSc6XG4gICAgICB2YWx1ZSA9IHBhcnNlRU5WRUxPUEUoW10uY29uY2F0KHZhbHVlIHx8IFtdKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYm9keXN0cnVjdHVyZSc6XG4gICAgICB2YWx1ZSA9IHBhcnNlQk9EWVNUUlVDVFVSRShbXS5jb25jYXQodmFsdWUgfHwgW10pKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdtb2RzZXEnOlxuICAgICAgdmFsdWUgPSAodmFsdWUuc2hpZnQoKSB8fCB7fSkudmFsdWUgfHwgJzAnXG4gICAgICBicmVha1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICAqIEJpbmFyeSBTZWFyY2ggLSBmcm9tIG5wbSBtb2R1bGUgYmluYXJ5LXNlYXJjaCwgbGljZW5zZSBDQzBcbiAgKlxuICAqIEBwYXJhbSB7QXJyYXl9IGhheXN0YWNrIE9yZGVyZWQgYXJyYXlcbiAgKiBAcGFyYW0ge2FueX0gbmVlZGxlIEl0ZW0gdG8gc2VhcmNoIGZvciBpbiBoYXlzdGFja1xuICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgRnVuY3Rpb24gdGhhdCBkZWZpbmVzIHRoZSBzb3J0IG9yZGVyXG4gICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiBuZWVkbGUgaW4gaGF5c3RhY2sgb3IgaWYgbm90IGZvdW5kLFxuICAqICAgICAtSW5kZXgtMSBpcyB0aGUgcG9zaXRpb24gd2hlcmUgbmVlZGxlIGNvdWxkIGJlIGluc2VydGVkIHdoaWxlIHN0aWxsXG4gICogICAgIGtlZXBpbmcgaGF5c3RhY2sgb3JkZXJlZC5cbiAgKi9cbmZ1bmN0aW9uIGJpblNlYXJjaCAoaGF5c3RhY2ssIG5lZWRsZSwgY29tcGFyYXRvciA9IChhLCBiKSA9PiBhIC0gYikge1xuICB2YXIgbWlkLCBjbXBcbiAgdmFyIGxvdyA9IDBcbiAgdmFyIGhpZ2ggPSBoYXlzdGFjay5sZW5ndGggLSAxXG5cbiAgd2hpbGUgKGxvdyA8PSBoaWdoKSB7XG4gICAgLy8gTm90ZSB0aGF0IFwiKGxvdyArIGhpZ2gpID4+PiAxXCIgbWF5IG92ZXJmbG93LCBhbmQgcmVzdWx0cyBpblxuICAgIC8vIGEgdHlwZWNhc3QgdG8gZG91YmxlICh3aGljaCBnaXZlcyB0aGUgd3JvbmcgcmVzdWx0cykuXG4gICAgbWlkID0gbG93ICsgKGhpZ2ggLSBsb3cgPj4gMSlcbiAgICBjbXAgPSArY29tcGFyYXRvcihoYXlzdGFja1ttaWRdLCBuZWVkbGUpXG5cbiAgICBpZiAoY21wIDwgMC4wKSB7XG4gICAgICAvLyB0b28gbG93XG4gICAgICBsb3cgPSBtaWQgKyAxXG4gICAgfSBlbHNlIGlmIChjbXAgPiAwLjApIHtcbiAgICAgIC8vIHRvbyBoaWdoXG4gICAgICBoaWdoID0gbWlkIC0gMVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBrZXkgZm91bmRcbiAgICAgIHJldHVybiBtaWRcbiAgICB9XG4gIH1cblxuICAvLyBrZXkgbm90IGZvdW5kXG4gIHJldHVybiB+bG93XG59O1xuXG4vKipcbiAqIFBhcnNlcyBTRUFSQ0ggcmVzcG9uc2UuIEdhdGhlcnMgYWxsIHVudGFnZ2VkIFNFQVJDSCByZXNwb25zZXMsIGZldGNoZWQgc2VxLi91aWQgbnVtYmVyc1xuICogYW5kIGNvbXBpbGVzIHRoZXNlIGludG8gYSBzb3J0ZWQgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IE1lc3NhZ2Ugb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBTb3J0ZWQgU2VxLi9VSUQgbnVtYmVyIGxpc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU0VBUkNIIChyZXNwb25zZSkge1xuICBjb25zdCBsaXN0ID0gW11cblxuICBpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5wYXlsb2FkIHx8ICFyZXNwb25zZS5wYXlsb2FkLlNFQVJDSCB8fCAhcmVzcG9uc2UucGF5bG9hZC5TRUFSQ0gubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuXG4gIHJlc3BvbnNlLnBheWxvYWQuU0VBUkNILmZvckVhY2gocmVzdWx0ID0+XG4gICAgKHJlc3VsdC5hdHRyaWJ1dGVzIHx8IFtdKS5mb3JFYWNoKG5yID0+IHtcbiAgICAgIG5yID0gTnVtYmVyKChuciAmJiBuci52YWx1ZSkgfHwgbnIpIHx8IDBcbiAgICAgIGNvbnN0IGlkeCA9IGJpblNlYXJjaChsaXN0LCBucilcbiAgICAgIGlmIChpZHggPCAwKSB7XG4gICAgICAgIGxpc3Quc3BsaWNlKC1pZHggLSAxLCAwLCBucilcbiAgICAgIH1cbiAgICB9KVxuICApXG5cbiAgcmV0dXJuIGxpc3Rcbn07XG5cbi8qKlxuICogUGFyc2VzIENPUFkgYW5kIFVJRCBDT1BZIHJlc3BvbnNlLlxuICogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzQzMTVcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZVxuICogQHJldHVybnMge3tkZXN0U2VxU2V0OiBzdHJpbmcsIHNyY1NlcVNldDogc3RyaW5nfX0gU291cmNlIGFuZFxuICogZGVzdGluYXRpb24gdWlkIHNldHMgaWYgYXZhaWxhYmxlLCB1bmRlZmluZWQgaWYgbm90LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDT1BZIChyZXNwb25zZSkge1xuICBjb25zdCBjb3B5dWlkID0gcmVzcG9uc2UgJiYgcmVzcG9uc2UuY29weXVpZFxuICBpZiAoY29weXVpZCkge1xuICAgIHJldHVybiB7XG4gICAgICBzcmNTZXFTZXQ6IGNvcHl1aWRbMV0sXG4gICAgICBkZXN0U2VxU2V0OiBjb3B5dWlkWzJdXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUGFyc2VzIEFQUEVORCAodXBsb2FkKSByZXNwb25zZS5cbiAqIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0MzE1XG4gKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2VcbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSB1aWQgYXNzaWduZWQgdG8gdGhlIHVwbG9hZGVkIG1lc3NhZ2UgaWYgYXZhaWxhYmxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBUFBFTkQgKHJlc3BvbnNlKSB7XG4gIHJldHVybiByZXNwb25zZSAmJiByZXNwb25zZS5hcHBlbmR1aWQgJiYgcmVzcG9uc2UuYXBwZW5kdWlkWzFdXG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLFNBQVNBLGNBQVQsQ0FBeUJDLFFBQXpCLEVBQW1DO0VBQ3hDLElBQUksQ0FBQ0EsUUFBUSxDQUFDQyxPQUFW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