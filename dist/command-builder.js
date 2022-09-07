"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildFETCHCommand = buildFETCHCommand;
exports.buildSEARCHCommand = buildSEARCHCommand;
exports.buildSTORECommand = buildSTORECommand;
exports.buildXOAuth2Token = buildXOAuth2Token;

var _emailjsImapHandler = require("emailjs-imap-handler");

var _emailjsMimeCodec = require("emailjs-mime-codec");

var _emailjsBase = require("emailjs-base64");

var _common = require("./common");

/**
 * Builds a FETCH command
 *
 * @param {String} sequence Message range selector
 * @param {Array} items List of elements to fetch (eg. `['uid', 'envelope']`).
 * @param {Object} [options] Optional options object. Use `{byUid:true}` for `UID FETCH`
 * @returns {Object} Structured IMAP command
 */
function buildFETCHCommand(sequence, items, options) {
  const command = {
    command: options.byUid ? 'UID FETCH' : 'FETCH',
    attributes: [{
      type: 'SEQUENCE',
      value: sequence
    }]
  };

  if (options.valueAsString !== undefined) {
    command.valueAsString = options.valueAsString;
  }

  let query = [];
  items.forEach(item => {
    item = item.toUpperCase().trim();

    if (/^\w+$/.test(item)) {
      // alphanum strings can be used directly
      query.push({
        type: 'ATOM',
        value: item
      });
    } else if (item) {
      try {
        // parse the value as a fake command, use only the attributes block
        const cmd = (0, _emailjsImapHandler.parser)((0, _common.toTypedArray)('* Z ' + item));
        query = query.concat(cmd.attributes || []);
      } catch (e) {
        // if parse failed, use the original string as one entity
        query.push({
          type: 'ATOM',
          value: item
        });
      }
    }
  });

  if (query.length === 1) {
    query = query.pop();
  }

  command.attributes.push(query);

  if (options.changedSince) {
    command.attributes.push([{
      type: 'ATOM',
      value: 'CHANGEDSINCE'
    }, {
      type: 'ATOM',
      value: options.changedSince
    }]);
  }

  return command;
}
/**
 * Builds a login token for XOAUTH2 authentication command
 *
 * @param {String} user E-mail address of the user
 * @param {String} token Valid access token for the user
 * @return {String} Base64 formatted login token
 */


function buildXOAuth2Token(user = '', token) {
  const authData = [`user=${user}`, `auth=Bearer ${token}`, '', ''];
  return (0, _emailjsBase.encode)(authData.join('\x01'));
}
/**
 * Compiles a search query into an IMAP command. Queries are composed as objects
 * where keys are search terms and values are term arguments. Only strings,
 * numbers and Dates are used. If the value is an array, the members of it
 * are processed separately (use this for terms that require multiple params).
 * If the value is a Date, it is converted to the form of "01-Jan-1970".
 * Subqueries (OR, NOT) are made up of objects
 *
 *    {unseen: true, header: ["subject", "hello world"]};
 *    SEARCH UNSEEN HEADER "subject" "hello world"
 *
 * @param {Object} query Search query
 * @param {Object} [options] Option object
 * @param {Boolean} [options.byUid] If ture, use UID SEARCH instead of SEARCH
 * @return {Object} IMAP command object
 */


function buildSEARCHCommand(query = {}, options = {}) {
  const command = {
    command: options.byUid ? 'UID SEARCH' : 'SEARCH'
  };
  let isAscii = true;

  const buildTerm = query => {
    let list = [];
    Object.keys(query).forEach(key => {
      let params = [];

      const formatDate = date => date.toUTCString().replace(/^\w+, 0?(\d+) (\w+) (\d+).*/, '$1-$2-$3');

      const escapeParam = param => {
        if (typeof param === 'number') {
          return {
            type: 'number',
            value: param
          };
        } else if (typeof param === 'string') {
          if (/[\u0080-\uFFFF]/.test(param)) {
            isAscii = false;
            return {
              type: 'literal',
              value: (0, _common.fromTypedArray)((0, _emailjsMimeCodec.encode)(param)) // cast unicode string to pseudo-binary as imap-handler compiles strings as octets

            };
          }

          return {
            type: 'string',
            value: param
          };
        } else if (Object.prototype.toString.call(param) === '[object Date]') {
          // RFC 3501 allows for dates to be placed in
          // double-quotes or left without quotes.  Some
          // servers (Yandex), do not like the double quotes,
          // so we treat the date as an atom.
          return {
            type: 'atom',
            value: formatDate(param)
          };
        } else if (Array.isArray(param)) {
          return param.map(escapeParam);
        } else if (typeof param === 'object') {
          return buildTerm(param);
        }
      };

      params.push({
        type: 'atom',
        value: key.toUpperCase()
      });
      [].concat(query[key] || []).forEach(param => {
        switch (key.toLowerCase()) {
          case 'uid':
            param = {
              type: 'sequence',
              value: param
            };
            break;
          // The Gmail extension values of X-GM-THRID and
          // X-GM-MSGID are defined to be unsigned 64-bit integers
          // and they must not be quoted strings or the server
          // will report a parse error.

          case 'x-gm-thrid':
          case 'x-gm-msgid':
            param = {
              type: 'number',
              value: param
            };
            break;

          default:
            param = escapeParam(param);
        }

        if (param) {
          params = params.concat(param || []);
        }
      });
      list = list.concat(params || []);
    });
    return list;
  };

  command.attributes = buildTerm(query); // If any string input is using 8bit bytes, prepend the optional CHARSET argument

  if (!isAscii) {
    command.attributes.unshift({
      type: 'atom',
      value: 'UTF-8'
    });
    command.attributes.unshift({
      type: 'atom',
      value: 'CHARSET'
    });
  }

  return command;
}
/**
 * Creates an IMAP STORE command from the selected arguments
 */


function buildSTORECommand(sequence, action = '', flags = [], options = {}) {
  const command = {
    command: options.byUid ? 'UID STORE' : 'STORE',
    attributes: [{
      type: 'sequence',
      value: sequence
    }]
  };
  command.attributes.push({
    type: 'atom',
    value: action.toUpperCase() + (options.silent ? '.SILENT' : '')
  });
  command.attributes.push(flags.map(flag => {
    return {
      type: 'atom',
      value: flag
    };
  }));
  return command;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJidWlsZEZFVENIQ29tbWFuZCIsInNlcXVlbmNlIiwiaXRlbXMiLCJvcHRpb25zIiwiY29tbWFuZCIsImJ5VWlkIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ2YWx1ZSIsInZhbHVlQXNTdHJpbmciLCJ1bmRlZmluZWQiLCJxdWVyeSIsImZvckVhY2giLCJpdGVtIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGVzdCIsInB1c2giLCJjbWQiLCJwYXJzZXIiLCJ0b1R5cGVkQXJyYXkiLCJjb25jYXQiLCJlIiwibGVuZ3RoIiwicG9wIiwiY2hhbmdlZFNpbmNlIiwiYnVpbGRYT0F1dGgyVG9rZW4iLCJ1c2VyIiwidG9rZW4iLCJhdXRoRGF0YSIsImVuY29kZUJhc2U2NCIsImpvaW4iLCJidWlsZFNFQVJDSENvbW1hbmQiLCJpc0FzY2lpIiwiYnVpbGRUZXJtIiwibGlzdCIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJwYXJhbXMiLCJmb3JtYXREYXRlIiwiZGF0ZSIsInRvVVRDU3RyaW5nIiwicmVwbGFjZSIsImVzY2FwZVBhcmFtIiwicGFyYW0iLCJmcm9tVHlwZWRBcnJheSIsImVuY29kZSIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsInRvTG93ZXJDYXNlIiwidW5zaGlmdCIsImJ1aWxkU1RPUkVDb21tYW5kIiwiYWN0aW9uIiwiZmxhZ3MiLCJzaWxlbnQiLCJmbGFnIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1hbmQtYnVpbGRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZXIgfSBmcm9tICdlbWFpbGpzLWltYXAtaGFuZGxlcidcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gJ2VtYWlsanMtbWltZS1jb2RlYydcbmltcG9ydCB7IGVuY29kZSBhcyBlbmNvZGVCYXNlNjQgfSBmcm9tICdlbWFpbGpzLWJhc2U2NCdcbmltcG9ydCB7XG4gIGZyb21UeXBlZEFycmF5LFxuICB0b1R5cGVkQXJyYXlcbn0gZnJvbSAnLi9jb21tb24nXG5cbi8qKlxuICogQnVpbGRzIGEgRkVUQ0ggY29tbWFuZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHJhbmdlIHNlbGVjdG9yXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtcyBMaXN0IG9mIGVsZW1lbnRzIHRvIGZldGNoIChlZy4gYFsndWlkJywgJ2VudmVsb3BlJ11gKS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QuIFVzZSBge2J5VWlkOnRydWV9YCBmb3IgYFVJRCBGRVRDSGBcbiAqIEByZXR1cm5zIHtPYmplY3R9IFN0cnVjdHVyZWQgSU1BUCBjb21tYW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZFVENIQ29tbWFuZCAoc2VxdWVuY2UsIGl0ZW1zLCBvcHRpb25zKSB7XG4gIGNvbnN0IGNvbW1hbmQgPSB7XG4gICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgRkVUQ0gnIDogJ0ZFVENIJyxcbiAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgdHlwZTogJ1NFUVVFTkNFJyxcbiAgICAgIHZhbHVlOiBzZXF1ZW5jZVxuICAgIH1dXG4gIH1cblxuICBpZiAob3B0aW9ucy52YWx1ZUFzU3RyaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb21tYW5kLnZhbHVlQXNTdHJpbmcgPSBvcHRpb25zLnZhbHVlQXNTdHJpbmdcbiAgfVxuXG4gIGxldCBxdWVyeSA9IFtdXG5cbiAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgIGl0ZW0gPSBpdGVtLnRvVXBwZXJDYXNlKCkudHJpbSgpXG5cbiAgICBpZiAoL15cXHcrJC8udGVzdChpdGVtKSkge1xuICAgICAgLy8gYWxwaGFudW0gc3RyaW5ncyBjYW4gYmUgdXNlZCBkaXJlY3RseVxuICAgICAgcXVlcnkucHVzaCh7XG4gICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgdmFsdWU6IGl0ZW1cbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChpdGVtKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBwYXJzZSB0aGUgdmFsdWUgYXMgYSBmYWtlIGNvbW1hbmQsIHVzZSBvbmx5IHRoZSBhdHRyaWJ1dGVzIGJsb2NrXG4gICAgICAgIGNvbnN0IGNtZCA9IHBhcnNlcih0b1R5cGVkQXJyYXkoJyogWiAnICsgaXRlbSkpXG4gICAgICAgIHF1ZXJ5ID0gcXVlcnkuY29uY2F0KGNtZC5hdHRyaWJ1dGVzIHx8IFtdKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZiBwYXJzZSBmYWlsZWQsIHVzZSB0aGUgb3JpZ2luYWwgc3RyaW5nIGFzIG9uZSBlbnRpdHlcbiAgICAgICAgcXVlcnkucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICAgIHZhbHVlOiBpdGVtXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGlmIChxdWVyeS5sZW5ndGggPT09IDEpIHtcbiAgICBxdWVyeSA9IHF1ZXJ5LnBvcCgpXG4gIH1cblxuICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaChxdWVyeSlcblxuICBpZiAob3B0aW9ucy5jaGFuZ2VkU2luY2UpIHtcbiAgICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaChbe1xuICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgdmFsdWU6ICdDSEFOR0VEU0lOQ0UnXG4gICAgfSwge1xuICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgdmFsdWU6IG9wdGlvbnMuY2hhbmdlZFNpbmNlXG4gICAgfV0pXG4gIH1cblxuICByZXR1cm4gY29tbWFuZFxufVxuXG4vKipcbiAqIEJ1aWxkcyBhIGxvZ2luIHRva2VuIGZvciBYT0FVVEgyIGF1dGhlbnRpY2F0aW9uIGNvbW1hbmRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlciBFLW1haWwgYWRkcmVzcyBvZiB0aGUgdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IHRva2VuIFZhbGlkIGFjY2VzcyB0b2tlbiBmb3IgdGhlIHVzZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gQmFzZTY0IGZvcm1hdHRlZCBsb2dpbiB0b2tlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRYT0F1dGgyVG9rZW4gKHVzZXIgPSAnJywgdG9rZW4pIHtcbiAgY29uc3QgYXV0aERhdGEgPSBbXG4gICAgYHVzZXI9JHt1c2VyfWAsXG4gICAgYGF1dGg9QmVhcmVyICR7dG9rZW59YCxcbiAgICAnJyxcbiAgICAnJ1xuICBdXG4gIHJldHVybiBlbmNvZGVCYXNlNjQoYXV0aERhdGEuam9pbignXFx4MDEnKSlcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIHNlYXJjaCBxdWVyeSBpbnRvIGFuIElNQVAgY29tbWFuZC4gUXVlcmllcyBhcmUgY29tcG9zZWQgYXMgb2JqZWN0c1xuICogd2hlcmUga2V5cyBhcmUgc2VhcmNoIHRlcm1zIGFuZCB2YWx1ZXMgYXJlIHRlcm0gYXJndW1lbnRzLiBPbmx5IHN0cmluZ3MsXG4gKiBudW1iZXJzIGFuZCBEYXRlcyBhcmUgdXNlZC4gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCB0aGUgbWVtYmVycyBvZiBpdFxuICogYXJlIHByb2Nlc3NlZCBzZXBhcmF0ZWx5ICh1c2UgdGhpcyBmb3IgdGVybXMgdGhhdCByZXF1aXJlIG11bHRpcGxlIHBhcmFtcykuXG4gKiBJZiB0aGUgdmFsdWUgaXMgYSBEYXRlLCBpdCBpcyBjb252ZXJ0ZWQgdG8gdGhlIGZvcm0gb2YgXCIwMS1KYW4tMTk3MFwiLlxuICogU3VicXVlcmllcyAoT1IsIE5PVCkgYXJlIG1hZGUgdXAgb2Ygb2JqZWN0c1xuICpcbiAqICAgIHt1bnNlZW46IHRydWUsIGhlYWRlcjogW1wic3ViamVjdFwiLCBcImhlbGxvIHdvcmxkXCJdfTtcbiAqICAgIFNFQVJDSCBVTlNFRU4gSEVBREVSIFwic3ViamVjdFwiIFwiaGVsbG8gd29ybGRcIlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSBTZWFyY2ggcXVlcnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uIG9iamVjdFxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5ieVVpZF0gSWYgdHVyZSwgdXNlIFVJRCBTRUFSQ0ggaW5zdGVhZCBvZiBTRUFSQ0hcbiAqIEByZXR1cm4ge09iamVjdH0gSU1BUCBjb21tYW5kIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTRUFSQ0hDb21tYW5kIChxdWVyeSA9IHt9LCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgY29tbWFuZCA9IHtcbiAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBTRUFSQ0gnIDogJ1NFQVJDSCdcbiAgfVxuXG4gIGxldCBpc0FzY2lpID0gdHJ1ZVxuXG4gIGNvbnN0IGJ1aWxkVGVybSA9IChxdWVyeSkgPT4ge1xuICAgIGxldCBsaXN0ID0gW11cblxuICAgIE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGxldCBwYXJhbXMgPSBbXVxuICAgICAgY29uc3QgZm9ybWF0RGF0ZSA9IChkYXRlKSA9PiBkYXRlLnRvVVRDU3RyaW5nKCkucmVwbGFjZSgvXlxcdyssIDA/KFxcZCspIChcXHcrKSAoXFxkKykuKi8sICckMS0kMi0kMycpXG4gICAgICBjb25zdCBlc2NhcGVQYXJhbSA9IChwYXJhbSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaWYgKC9bXFx1MDA4MC1cXHVGRkZGXS8udGVzdChwYXJhbSkpIHtcbiAgICAgICAgICAgIGlzQXNjaWkgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xpdGVyYWwnLFxuICAgICAgICAgICAgICB2YWx1ZTogZnJvbVR5cGVkQXJyYXkoZW5jb2RlKHBhcmFtKSkgLy8gY2FzdCB1bmljb2RlIHN0cmluZyB0byBwc2V1ZG8tYmluYXJ5IGFzIGltYXAtaGFuZGxlciBjb21waWxlcyBzdHJpbmdzIGFzIG9jdGV0c1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICB2YWx1ZTogcGFyYW1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHBhcmFtKSA9PT0gJ1tvYmplY3QgRGF0ZV0nKSB7XG4gICAgICAgICAgLy8gUkZDIDM1MDEgYWxsb3dzIGZvciBkYXRlcyB0byBiZSBwbGFjZWQgaW5cbiAgICAgICAgICAvLyBkb3VibGUtcXVvdGVzIG9yIGxlZnQgd2l0aG91dCBxdW90ZXMuICBTb21lXG4gICAgICAgICAgLy8gc2VydmVycyAoWWFuZGV4KSwgZG8gbm90IGxpa2UgdGhlIGRvdWJsZSBxdW90ZXMsXG4gICAgICAgICAgLy8gc28gd2UgdHJlYXQgdGhlIGRhdGUgYXMgYW4gYXRvbS5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgICAgICAgdmFsdWU6IGZvcm1hdERhdGUocGFyYW0pXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFyYW0pKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcmFtLm1hcChlc2NhcGVQYXJhbSlcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgcmV0dXJuIGJ1aWxkVGVybShwYXJhbSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwYXJhbXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgICAgdmFsdWU6IGtleS50b1VwcGVyQ2FzZSgpXG4gICAgICB9KTtcblxuICAgICAgW10uY29uY2F0KHF1ZXJ5W2tleV0gfHwgW10pLmZvckVhY2goKHBhcmFtKSA9PiB7XG4gICAgICAgIHN3aXRjaCAoa2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICBjYXNlICd1aWQnOlxuICAgICAgICAgICAgcGFyYW0gPSB7XG4gICAgICAgICAgICAgIHR5cGU6ICdzZXF1ZW5jZScsXG4gICAgICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAvLyBUaGUgR21haWwgZXh0ZW5zaW9uIHZhbHVlcyBvZiBYLUdNLVRIUklEIGFuZFxuICAgICAgICAgIC8vIFgtR00tTVNHSUQgYXJlIGRlZmluZWQgdG8gYmUgdW5zaWduZWQgNjQtYml0IGludGVnZXJzXG4gICAgICAgICAgLy8gYW5kIHRoZXkgbXVzdCBub3QgYmUgcXVvdGVkIHN0cmluZ3Mgb3IgdGhlIHNlcnZlclxuICAgICAgICAgIC8vIHdpbGwgcmVwb3J0IGEgcGFyc2UgZXJyb3IuXG4gICAgICAgICAgY2FzZSAneC1nbS10aHJpZCc6XG4gICAgICAgICAgY2FzZSAneC1nbS1tc2dpZCc6XG4gICAgICAgICAgICBwYXJhbSA9IHtcbiAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcGFyYW0gPSBlc2NhcGVQYXJhbShwYXJhbSlcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgICBwYXJhbXMgPSBwYXJhbXMuY29uY2F0KHBhcmFtIHx8IFtdKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgbGlzdCA9IGxpc3QuY29uY2F0KHBhcmFtcyB8fCBbXSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuXG4gIGNvbW1hbmQuYXR0cmlidXRlcyA9IGJ1aWxkVGVybShxdWVyeSlcblxuICAvLyBJZiBhbnkgc3RyaW5nIGlucHV0IGlzIHVzaW5nIDhiaXQgYnl0ZXMsIHByZXBlbmQgdGhlIG9wdGlvbmFsIENIQVJTRVQgYXJndW1lbnRcbiAgaWYgKCFpc0FzY2lpKSB7XG4gICAgY29tbWFuZC5hdHRyaWJ1dGVzLnVuc2hpZnQoe1xuICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgdmFsdWU6ICdVVEYtOCdcbiAgICB9KVxuICAgIGNvbW1hbmQuYXR0cmlidXRlcy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgIHZhbHVlOiAnQ0hBUlNFVCdcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIGNvbW1hbmRcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIElNQVAgU1RPUkUgY29tbWFuZCBmcm9tIHRoZSBzZWxlY3RlZCBhcmd1bWVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU1RPUkVDb21tYW5kIChzZXF1ZW5jZSwgYWN0aW9uID0gJycsIGZsYWdzID0gW10sIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjb21tYW5kID0ge1xuICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIFNUT1JFJyA6ICdTVE9SRScsXG4gICAgYXR0cmlidXRlczogW3tcbiAgICAgIHR5cGU6ICdzZXF1ZW5jZScsXG4gICAgICB2YWx1ZTogc2VxdWVuY2VcbiAgICB9XVxuICB9XG5cbiAgY29tbWFuZC5hdHRyaWJ1dGVzLnB1c2goe1xuICAgIHR5cGU6ICdhdG9tJyxcbiAgICB2YWx1ZTogYWN0aW9uLnRvVXBwZXJDYXNlKCkgKyAob3B0aW9ucy5zaWxlbnQgPyAnLlNJTEVOVCcgOiAnJylcbiAgfSlcblxuICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaChmbGFncy5tYXAoKGZsYWcpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgdmFs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