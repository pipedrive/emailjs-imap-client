"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ramda = require("ramda");
var _emailjsTcpSocket = _interopRequireDefault(require("emailjs-tcp-socket"));
var _common = require("./common");
var _emailjsImapHandler = require("emailjs-imap-handler");
var _parserHelper = require("./parser-helper");
var _compression = _interopRequireDefault(require("./compression"));
var _diagnosticsChannel = require("./diagnostics-channel");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* babel-plugin-inline-import '../res/compression.worker.blob' */
const CompressionBlob = "!function(e){var t={};function a(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,a),i.l=!0,i.exports}a.m=e,a.c=t,a.d=function(e,t,n){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},a.r=function(e){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&\"object\"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(a.r(n),Object.defineProperty(n,\"default\",{enumerable:!0,value:e}),2&t&&\"string\"!=typeof e)for(var i in e)a.d(n,i,function(t){return e[t]}.bind(null,i));return n},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,\"a\",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p=\"\",a(a.s=11)}([function(e,t,a){\"use strict\";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},function(e,t,a){\"use strict\";e.exports={2:\"need dictionary\",1:\"stream end\",0:\"\",\"-1\":\"file error\",\"-2\":\"stream error\",\"-3\":\"data error\",\"-4\":\"insufficient memory\",\"-5\":\"buffer error\",\"-6\":\"incompatible version\"}},function(e,t,a){\"use strict\";var n=\"undefined\"!=typeof Uint8Array&&\"undefined\"!=typeof Uint16Array&&\"undefined\"!=typeof Int32Array;function i(e,t){return Object.prototype.hasOwnProperty.call(e,t)}t.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var a=t.shift();if(a){if(\"object\"!=typeof a)throw new TypeError(a+\"must be non-object\");for(var n in a)i(a,n)&&(e[n]=a[n])}}return e},t.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var r={arraySet:function(e,t,a,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(a,a+n),i);else for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){var t,a,n,i,r,s;for(n=0,t=0,a=e.length;t<a;t++)n+=e[t].length;for(s=new Uint8Array(n),i=0,t=0,a=e.length;t<a;t++)r=e[t],s.set(r,i),i+=r.length;return s}},s={arraySet:function(e,t,a,n,i){for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){return[].concat.apply([],e)}};t.setTyped=function(e){e?(t.Buf8=Uint8Array,t.Buf16=Uint16Array,t.Buf32=Int32Array,t.assign(t,r)):(t.Buf8=Array,t.Buf16=Array,t.Buf32=Array,t.assign(t,s))},t.setTyped(n)},function(e,t,a){\"use strict\";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=\"\",this.state=null,this.data_type=2,this.adler=0}},function(e,t,a){\"use strict\";var n,i=a(2),r=a(8),s=a(6),l=a(7),o=a(1);function h(e,t){return e.msg=o[t],t}function d(e){return(e<<1)-(e>4?9:0)}function _(e){for(var t=e.length;--t>=0;)e[t]=0}function f(e){var t=e.state,a=t.pending;a>e.avail_out&&(a=e.avail_out),0!==a&&(i.arraySet(e.output,t.pending_buf,t.pending_out,a,e.next_out),e.next_out+=a,t.pending_out+=a,e.total_out+=a,e.avail_out-=a,t.pending-=a,0===t.pending&&(t.pending_out=0))}function u(e,t){r._tr_flush_block(e,e.block_start>=0?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,f(e.strm)}function c(e,t){e.pending_buf[e.pending++]=t}function b(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function g(e,t){var a,n,i=e.max_chain_length,r=e.strstart,s=e.prev_length,l=e.nice_match,o=e.strstart>e.w_size-262?e.strstart-(e.w_size-262):0,h=e.window,d=e.w_mask,_=e.prev,f=e.strstart+258,u=h[r+s-1],c=h[r+s];e.prev_length>=e.good_match&&(i>>=2),l>e.lookahead&&(l=e.lookahead);do{if(h[(a=t)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<f);if(n=258-(f-r),r=f-258,n>s){if(e.match_start=t,s=n,n>=l)break;u=h[r+s-1],c=h[r+s]}}}while((t=_[t&d])>o&&0!=--i);return s<=e.lookahead?s:e.lookahead}function m(e){var t,a,n,r,o,h,d,_,f,u,c=e.w_size;do{if(r=e.window_size-e.lookahead-e.strstart,e.strstart>=c+(c-262)){i.arraySet(e.window,e.window,c,c,0),e.match_start-=c,e.strstart-=c,e.block_start-=c,t=a=e.hash_size;do{n=e.head[--t],e.head[t]=n>=c?n-c:0}while(--a);t=a=c;do{n=e.prev[--t],e.prev[t]=n>=c?n-c:0}while(--a);r+=c}if(0===e.strm.avail_in)break;if(h=e.strm,d=e.window,_=e.strstart+e.lookahead,f=r,u=void 0,(u=h.avail_in)>f&&(u=f),a=0===u?0:(h.avail_in-=u,i.arraySet(d,h.input,h.next_in,u,_),1===h.state.wrap?h.adler=s(h.adler,d,u,_):2===h.state.wrap&&(h.adler=l(h.adler,d,u,_)),h.next_in+=u,h.total_in+=u,u),e.lookahead+=a,e.lookahead+e.insert>=3)for(o=e.strstart-e.insert,e.ins_h=e.window[o],e.ins_h=(e.ins_h<<e.hash_shift^e.window[o+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[o+3-1])&e.hash_mask,e.prev[o&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=o,o++,e.insert--,!(e.lookahead+e.insert<3)););}while(e.lookahead<262&&0!==e.strm.avail_in)}function w(e,t){for(var a,n;;){if(e.lookahead<262){if(m(e),e.lookahead<262&&0===t)return 1;if(0===e.lookahead)break}if(a=0,e.lookahead>=3&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==a&&e.strstart-a<=e.w_size-262&&(e.match_length=g(e,a)),e.match_length>=3)if(n=r._tr_tally(e,e.strstart-e.match_start,e.match_length-3),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=3){e.match_length--;do{e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart}while(0!=--e.match_length);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=e.strstart<2?e.strstart:2,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}function p(e,t){for(var a,n,i;;){if(e.lookahead<262){if(m(e),e.lookahead<262&&0===t)return 1;if(0===e.lookahead)break}if(a=0,e.lookahead>=3&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=2,0!==a&&e.prev_length<e.max_lazy_match&&e.strstart-a<=e.w_size-262&&(e.match_length=g(e,a),e.match_length<=5&&(1===e.strategy||3===e.match_length&&e.strstart-e.match_start>4096)&&(e.match_length=2)),e.prev_length>=3&&e.match_length<=e.prev_length){i=e.strstart+e.lookahead-3,n=r._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-3),e.lookahead-=e.prev_length-1,e.prev_length-=2;do{++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+3-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart)}while(0!=--e.prev_length);if(e.match_available=0,e.match_length=2,e.strstart++,n&&(u(e,!1),0===e.strm.avail_out))return 1}else if(e.match_available){if((n=r._tr_tally(e,0,e.window[e.strstart-1]))&&u(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return 1}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=r._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<2?e.strstart:2,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}function v(e,t,a,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=a,this.max_chain=n,this.func=i}function k(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=8,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(1146),this.dyn_dtree=new i.Buf16(122),this.bl_tree=new i.Buf16(78),_(this.dyn_ltree),_(this.dyn_dtree),_(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(16),this.heap=new i.Buf16(573),_(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(573),_(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function y(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=2,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?42:113,e.adler=2===t.wrap?0:1,t.last_flush=0,r._tr_init(t),0):h(e,-2)}function x(e){var t,a=y(e);return 0===a&&((t=e.state).window_size=2*t.w_size,_(t.head),t.max_lazy_match=n[t.level].max_lazy,t.good_match=n[t.level].good_length,t.nice_match=n[t.level].nice_length,t.max_chain_length=n[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=2,t.match_available=0,t.ins_h=0),a}function z(e,t,a,n,r,s){if(!e)return-2;var l=1;if(-1===t&&(t=6),n<0?(l=0,n=-n):n>15&&(l=2,n-=16),r<1||r>9||8!==a||n<8||n>15||t<0||t>9||s<0||s>4)return h(e,-2);8===n&&(n=9);var o=new k;return e.state=o,o.strm=e,o.wrap=l,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=r+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+3-1)/3),o.window=new i.Buf8(2*o.w_size),o.head=new i.Buf16(o.hash_size),o.prev=new i.Buf16(o.w_size),o.lit_bufsize=1<<r+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new i.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=a,x(e)}n=[new v(0,0,0,0,(function(e,t){var a=65535;for(a>e.pending_buf_size-5&&(a=e.pending_buf_size-5);;){if(e.lookahead<=1){if(m(e),0===e.lookahead&&0===t)return 1;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+a;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,u(e,!1),0===e.strm.avail_out))return 1;if(e.strstart-e.block_start>=e.w_size-262&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):(e.strstart>e.block_start&&(u(e,!1),e.strm.avail_out),1)})),new v(4,4,8,4,w),new v(4,5,16,8,w),new v(4,6,32,32,w),new v(4,4,16,16,p),new v(8,16,32,32,p),new v(8,16,128,128,p),new v(8,32,128,256,p),new v(32,128,258,1024,p),new v(32,258,258,4096,p)],t.deflateInit=function(e,t){return z(e,t,8,15,8,0)},t.deflateInit2=z,t.deflateReset=x,t.deflateResetKeep=y,t.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?-2:(e.state.gzhead=t,0):-2},t.deflate=function(e,t){var a,i,s,o;if(!e||!e.state||t>5||t<0)return e?h(e,-2):-2;if(i=e.state,!e.output||!e.input&&0!==e.avail_in||666===i.status&&4!==t)return h(e,0===e.avail_out?-5:-2);if(i.strm=e,a=i.last_flush,i.last_flush=t,42===i.status)if(2===i.wrap)e.adler=0,c(i,31),c(i,139),c(i,8),i.gzhead?(c(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),c(i,255&i.gzhead.time),c(i,i.gzhead.time>>8&255),c(i,i.gzhead.time>>16&255),c(i,i.gzhead.time>>24&255),c(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),c(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(c(i,255&i.gzhead.extra.length),c(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(e.adler=l(e.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(c(i,0),c(i,0),c(i,0),c(i,0),c(i,0),c(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),c(i,3),i.status=113);else{var g=8+(i.w_bits-8<<4)<<8;g|=(i.strategy>=2||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(g|=32),g+=31-g%31,i.status=113,b(i,g),0!==i.strstart&&(b(i,e.adler>>>16),b(i,65535&e.adler)),e.adler=1}if(69===i.status)if(i.gzhead.extra){for(s=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending!==i.pending_buf_size));)c(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(73===i.status)if(i.gzhead.name){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,c(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.gzindex=0,i.status=91)}else i.status=91;if(91===i.status)if(i.gzhead.comment){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),f(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,c(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.status=103)}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&f(e),i.pending+2<=i.pending_buf_size&&(c(i,255&e.adler),c(i,e.adler>>8&255),e.adler=0,i.status=113)):i.status=113),0!==i.pending){if(f(e),0===e.avail_out)return i.last_flush=-1,0}else if(0===e.avail_in&&d(t)<=d(a)&&4!==t)return h(e,-5);if(666===i.status&&0!==e.avail_in)return h(e,-5);if(0!==e.avail_in||0!==i.lookahead||0!==t&&666!==i.status){var w=2===i.strategy?function(e,t){for(var a;;){if(0===e.lookahead&&(m(e),0===e.lookahead)){if(0===t)return 1;break}if(e.match_length=0,a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,a&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}(i,t):3===i.strategy?function(e,t){for(var a,n,i,s,l=e.window;;){if(e.lookahead<=258){if(m(e),e.lookahead<=258&&0===t)return 1;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=3&&e.strstart>0&&(n=l[i=e.strstart-1])===l[++i]&&n===l[++i]&&n===l[++i]){s=e.strstart+258;do{}while(n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&i<s);e.match_length=258-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=3?(a=r._tr_tally(e,1,e.match_length-3),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),a&&(u(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(u(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(u(e,!1),0===e.strm.avail_out)?1:2}(i,t):n[i.level].func(i,t);if(3!==w&&4!==w||(i.status=666),1===w||3===w)return 0===e.avail_out&&(i.last_flush=-1),0;if(2===w&&(1===t?r._tr_align(i):5!==t&&(r._tr_stored_block(i,0,0,!1),3===t&&(_(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),f(e),0===e.avail_out))return i.last_flush=-1,0}return 4!==t?0:i.wrap<=0?1:(2===i.wrap?(c(i,255&e.adler),c(i,e.adler>>8&255),c(i,e.adler>>16&255),c(i,e.adler>>24&255),c(i,255&e.total_in),c(i,e.total_in>>8&255),c(i,e.total_in>>16&255),c(i,e.total_in>>24&255)):(b(i,e.adler>>>16),b(i,65535&e.adler)),f(e),i.wrap>0&&(i.wrap=-i.wrap),0!==i.pending?0:1)},t.deflateEnd=function(e){var t;return e&&e.state?42!==(t=e.state.status)&&69!==t&&73!==t&&91!==t&&103!==t&&113!==t&&666!==t?h(e,-2):(e.state=null,113===t?h(e,-3):0):-2},t.deflateSetDictionary=function(e,t){var a,n,r,l,o,h,d,f,u=t.length;if(!e||!e.state)return-2;if(2===(l=(a=e.state).wrap)||1===l&&42!==a.status||a.lookahead)return-2;for(1===l&&(e.adler=s(e.adler,t,u,0)),a.wrap=0,u>=a.w_size&&(0===l&&(_(a.head),a.strstart=0,a.block_start=0,a.insert=0),f=new i.Buf8(a.w_size),i.arraySet(f,t,u-a.w_size,a.w_size,0),t=f,u=a.w_size),o=e.avail_in,h=e.next_in,d=e.input,e.avail_in=u,e.next_in=0,e.input=t,m(a);a.lookahead>=3;){n=a.strstart,r=a.lookahead-2;do{a.ins_h=(a.ins_h<<a.hash_shift^a.window[n+3-1])&a.hash_mask,a.prev[n&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=n,n++}while(--r);a.strstart=n,a.lookahead=2,m(a)}return a.strstart+=a.lookahead,a.block_start=a.strstart,a.insert=a.lookahead,a.lookahead=0,a.match_length=a.prev_length=2,a.match_available=0,e.next_in=h,e.input=d,e.avail_in=o,a.wrap=l,0},t.deflateInfo=\"pako deflate (from Nodeca project)\"},function(e,t,a){\"use strict\";var n=a(2),i=a(6),r=a(7),s=a(9),l=a(10);function o(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function h(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new n.Buf16(320),this.work=new n.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function d(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg=\"\",t.wrap&&(e.adler=1&t.wrap),t.mode=1,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new n.Buf32(852),t.distcode=t.distdyn=new n.Buf32(592),t.sane=1,t.back=-1,0):-2}function _(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,d(e)):-2}function f(e,t){var a,n;return e&&e.state?(n=e.state,t<0?(a=0,t=-t):(a=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?-2:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=a,n.wbits=t,_(e))):-2}function u(e,t){var a,n;return e?(n=new h,e.state=n,n.window=null,0!==(a=f(e,t))&&(e.state=null),a):-2}var c,b,g=!0;function m(e){if(g){var t;for(c=new n.Buf32(512),b=new n.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(l(1,e.lens,0,288,c,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;l(2,e.lens,0,32,b,0,e.work,{bits:5}),g=!1}e.lencode=c,e.lenbits=9,e.distcode=b,e.distbits=5}function w(e,t,a,i){var r,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new n.Buf8(s.wsize)),i>=s.wsize?(n.arraySet(s.window,t,a-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):((r=s.wsize-s.wnext)>i&&(r=i),n.arraySet(s.window,t,a-i,r,s.wnext),(i-=r)?(n.arraySet(s.window,t,a-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=r,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=r))),0}t.inflateReset=_,t.inflateReset2=f,t.inflateResetKeep=d,t.inflateInit=function(e){return u(e,15)},t.inflateInit2=u,t.inflate=function(e,t){var a,h,d,_,f,u,c,b,g,p,v,k,y,x,z,S,E,A,Z,O,R,B,T,N,D=0,U=new n.Buf8(4),I=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return-2;12===(a=e.state).mode&&(a.mode=13),f=e.next_out,d=e.output,c=e.avail_out,_=e.next_in,h=e.input,u=e.avail_in,b=a.hold,g=a.bits,p=u,v=c,B=0;e:for(;;)switch(a.mode){case 1:if(0===a.wrap){a.mode=13;break}for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(2&a.wrap&&35615===b){a.check=0,U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0),b=0,g=0,a.mode=2;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&b)<<8)+(b>>8))%31){e.msg=\"incorrect header check\",a.mode=30;break}if(8!=(15&b)){e.msg=\"unknown compression method\",a.mode=30;break}if(g-=4,R=8+(15&(b>>>=4)),0===a.wbits)a.wbits=R;else if(R>a.wbits){e.msg=\"invalid window size\",a.mode=30;break}a.dmax=1<<R,e.adler=a.check=1,a.mode=512&b?10:12,b=0,g=0;break;case 2:for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(a.flags=b,8!=(255&a.flags)){e.msg=\"unknown compression method\",a.mode=30;break}if(57344&a.flags){e.msg=\"unknown header flags set\",a.mode=30;break}a.head&&(a.head.text=b>>8&1),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0,a.mode=3;case 3:for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.head&&(a.head.time=b),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,U[2]=b>>>16&255,U[3]=b>>>24&255,a.check=r(a.check,U,4,0)),b=0,g=0,a.mode=4;case 4:for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.head&&(a.head.xflags=255&b,a.head.os=b>>8),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0,a.mode=5;case 5:if(1024&a.flags){for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.length=b,a.head&&(a.head.extra_len=b),512&a.flags&&(U[0]=255&b,U[1]=b>>>8&255,a.check=r(a.check,U,2,0)),b=0,g=0}else a.head&&(a.head.extra=null);a.mode=6;case 6:if(1024&a.flags&&((k=a.length)>u&&(k=u),k&&(a.head&&(R=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),n.arraySet(a.head.extra,h,_,k,R)),512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,a.length-=k),a.length))break e;a.length=0,a.mode=7;case 7:if(2048&a.flags){if(0===u)break e;k=0;do{R=h[_+k++],a.head&&R&&a.length<65536&&(a.head.name+=String.fromCharCode(R))}while(R&&k<u);if(512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,R)break e}else a.head&&(a.head.name=null);a.length=0,a.mode=8;case 8:if(4096&a.flags){if(0===u)break e;k=0;do{R=h[_+k++],a.head&&R&&a.length<65536&&(a.head.comment+=String.fromCharCode(R))}while(R&&k<u);if(512&a.flags&&(a.check=r(a.check,h,k,_)),u-=k,_+=k,R)break e}else a.head&&(a.head.comment=null);a.mode=9;case 9:if(512&a.flags){for(;g<16;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b!==(65535&a.check)){e.msg=\"header crc mismatch\",a.mode=30;break}b=0,g=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),e.adler=a.check=0,a.mode=12;break;case 10:for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}e.adler=a.check=o(b),b=0,g=0,a.mode=11;case 11:if(0===a.havedict)return e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,2;e.adler=a.check=1,a.mode=12;case 12:if(5===t||6===t)break e;case 13:if(a.last){b>>>=7&g,g-=7&g,a.mode=27;break}for(;g<3;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}switch(a.last=1&b,g-=1,3&(b>>>=1)){case 0:a.mode=14;break;case 1:if(m(a),a.mode=20,6===t){b>>>=2,g-=2;break e}break;case 2:a.mode=17;break;case 3:e.msg=\"invalid block type\",a.mode=30}b>>>=2,g-=2;break;case 14:for(b>>>=7&g,g-=7&g;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if((65535&b)!=(b>>>16^65535)){e.msg=\"invalid stored block lengths\",a.mode=30;break}if(a.length=65535&b,b=0,g=0,a.mode=15,6===t)break e;case 15:a.mode=16;case 16:if(k=a.length){if(k>u&&(k=u),k>c&&(k=c),0===k)break e;n.arraySet(d,h,_,k,f),u-=k,_+=k,c-=k,f+=k,a.length-=k;break}a.mode=12;break;case 17:for(;g<14;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(a.nlen=257+(31&b),b>>>=5,g-=5,a.ndist=1+(31&b),b>>>=5,g-=5,a.ncode=4+(15&b),b>>>=4,g-=4,a.nlen>286||a.ndist>30){e.msg=\"too many length or distance symbols\",a.mode=30;break}a.have=0,a.mode=18;case 18:for(;a.have<a.ncode;){for(;g<3;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.lens[I[a.have++]]=7&b,b>>>=3,g-=3}for(;a.have<19;)a.lens[I[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,T={bits:a.lenbits},B=l(0,a.lens,0,19,a.lencode,0,a.work,T),a.lenbits=T.bits,B){e.msg=\"invalid code lengths set\",a.mode=30;break}a.have=0,a.mode=19;case 19:for(;a.have<a.nlen+a.ndist;){for(;S=(D=a.lencode[b&(1<<a.lenbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(E<16)b>>>=z,g-=z,a.lens[a.have++]=E;else{if(16===E){for(N=z+2;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b>>>=z,g-=z,0===a.have){e.msg=\"invalid bit length repeat\",a.mode=30;break}R=a.lens[a.have-1],k=3+(3&b),b>>>=2,g-=2}else if(17===E){for(N=z+3;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}g-=z,R=0,k=3+(7&(b>>>=z)),b>>>=3,g-=3}else{for(N=z+7;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}g-=z,R=0,k=11+(127&(b>>>=z)),b>>>=7,g-=7}if(a.have+k>a.nlen+a.ndist){e.msg=\"invalid bit length repeat\",a.mode=30;break}for(;k--;)a.lens[a.have++]=R}}if(30===a.mode)break;if(0===a.lens[256]){e.msg=\"invalid code -- missing end-of-block\",a.mode=30;break}if(a.lenbits=9,T={bits:a.lenbits},B=l(1,a.lens,0,a.nlen,a.lencode,0,a.work,T),a.lenbits=T.bits,B){e.msg=\"invalid literal/lengths set\",a.mode=30;break}if(a.distbits=6,a.distcode=a.distdyn,T={bits:a.distbits},B=l(2,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,T),a.distbits=T.bits,B){e.msg=\"invalid distances set\",a.mode=30;break}if(a.mode=20,6===t)break e;case 20:a.mode=21;case 21:if(u>=6&&c>=258){e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,s(e,v),f=e.next_out,d=e.output,c=e.avail_out,_=e.next_in,h=e.input,u=e.avail_in,b=a.hold,g=a.bits,12===a.mode&&(a.back=-1);break}for(a.back=0;S=(D=a.lencode[b&(1<<a.lenbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(S&&0==(240&S)){for(A=z,Z=S,O=E;S=(D=a.lencode[O+((b&(1<<A+Z)-1)>>A)])>>>16&255,E=65535&D,!(A+(z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}b>>>=A,g-=A,a.back+=A}if(b>>>=z,g-=z,a.back+=z,a.length=E,0===S){a.mode=26;break}if(32&S){a.back=-1,a.mode=12;break}if(64&S){e.msg=\"invalid literal/length code\",a.mode=30;break}a.extra=15&S,a.mode=22;case 22:if(a.extra){for(N=a.extra;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.length+=b&(1<<a.extra)-1,b>>>=a.extra,g-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=23;case 23:for(;S=(D=a.distcode[b&(1<<a.distbits)-1])>>>16&255,E=65535&D,!((z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(0==(240&S)){for(A=z,Z=S,O=E;S=(D=a.distcode[O+((b&(1<<A+Z)-1)>>A)])>>>16&255,E=65535&D,!(A+(z=D>>>24)<=g);){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}b>>>=A,g-=A,a.back+=A}if(b>>>=z,g-=z,a.back+=z,64&S){e.msg=\"invalid distance code\",a.mode=30;break}a.offset=E,a.extra=15&S,a.mode=24;case 24:if(a.extra){for(N=a.extra;g<N;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}a.offset+=b&(1<<a.extra)-1,b>>>=a.extra,g-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){e.msg=\"invalid distance too far back\",a.mode=30;break}a.mode=25;case 25:if(0===c)break e;if(k=v-c,a.offset>k){if((k=a.offset-k)>a.whave&&a.sane){e.msg=\"invalid distance too far back\",a.mode=30;break}k>a.wnext?(k-=a.wnext,y=a.wsize-k):y=a.wnext-k,k>a.length&&(k=a.length),x=a.window}else x=d,y=f-a.offset,k=a.length;k>c&&(k=c),c-=k,a.length-=k;do{d[f++]=x[y++]}while(--k);0===a.length&&(a.mode=21);break;case 26:if(0===c)break e;d[f++]=a.length,c--,a.mode=21;break;case 27:if(a.wrap){for(;g<32;){if(0===u)break e;u--,b|=h[_++]<<g,g+=8}if(v-=c,e.total_out+=v,a.total+=v,v&&(e.adler=a.check=a.flags?r(a.check,d,v,f-v):i(a.check,d,v,f-v)),v=c,(a.flags?b:o(b))!==a.check){e.msg=\"incorrect data check\",a.mode=30;break}b=0,g=0}a.mode=28;case 28:if(a.wrap&&a.flags){for(;g<32;){if(0===u)break e;u--,b+=h[_++]<<g,g+=8}if(b!==(4294967295&a.total)){e.msg=\"incorrect length check\",a.mode=30;break}b=0,g=0}a.mode=29;case 29:B=1;break e;case 30:B=-3;break e;case 31:return-4;case 32:default:return-2}return e.next_out=f,e.avail_out=c,e.next_in=_,e.avail_in=u,a.hold=b,a.bits=g,(a.wsize||v!==e.avail_out&&a.mode<30&&(a.mode<27||4!==t))&&w(e,e.output,e.next_out,v-e.avail_out)?(a.mode=31,-4):(p-=e.avail_in,v-=e.avail_out,e.total_in+=p,e.total_out+=v,a.total+=v,a.wrap&&v&&(e.adler=a.check=a.flags?r(a.check,d,v,e.next_out-v):i(a.check,d,v,e.next_out-v)),e.data_type=a.bits+(a.last?64:0)+(12===a.mode?128:0)+(20===a.mode||15===a.mode?256:0),(0===p&&0===v||4===t)&&0===B&&(B=-5),B)},t.inflateEnd=function(e){if(!e||!e.state)return-2;var t=e.state;return t.window&&(t.window=null),e.state=null,0},t.inflateGetHeader=function(e,t){var a;return e&&e.state?0==(2&(a=e.state).wrap)?-2:(a.head=t,t.done=!1,0):-2},t.inflateSetDictionary=function(e,t){var a,n=t.length;return e&&e.state?0!==(a=e.state).wrap&&11!==a.mode?-2:11===a.mode&&i(1,t,n,0)!==a.check?-3:w(e,t,n,n)?(a.mode=31,-4):(a.havedict=1,0):-2},t.inflateInfo=\"pako inflate (from Nodeca project)\"},function(e,t,a){\"use strict\";e.exports=function(e,t,a,n){for(var i=65535&e|0,r=e>>>16&65535|0,s=0;0!==a;){a-=s=a>2e3?2e3:a;do{r=r+(i=i+t[n++]|0)|0}while(--s);i%=65521,r%=65521}return i|r<<16|0}},function(e,t,a){\"use strict\";var n=function(){for(var e,t=[],a=0;a<256;a++){e=a;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[a]=e}return t}();e.exports=function(e,t,a,i){var r=n,s=i+a;e^=-1;for(var l=i;l<s;l++)e=e>>>8^r[255&(e^t[l])];return-1^e}},function(e,t,a){\"use strict\";var n=a(2);function i(e){for(var t=e.length;--t>=0;)e[t]=0}var r=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],s=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],l=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],o=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],h=new Array(576);i(h);var d=new Array(60);i(d);var _=new Array(512);i(_);var f=new Array(256);i(f);var u=new Array(29);i(u);var c,b,g,m=new Array(30);function w(e,t,a,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=a,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function p(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function v(e){return e<256?_[e]:_[256+(e>>>7)]}function k(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function y(e,t,a){e.bi_valid>16-a?(e.bi_buf|=t<<e.bi_valid&65535,k(e,e.bi_buf),e.bi_buf=t>>16-e.bi_valid,e.bi_valid+=a-16):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=a)}function x(e,t,a){y(e,a[2*t],a[2*t+1])}function z(e,t){var a=0;do{a|=1&e,e>>>=1,a<<=1}while(--t>0);return a>>>1}function S(e,t,a){var n,i,r=new Array(16),s=0;for(n=1;n<=15;n++)r[n]=s=s+a[n-1]<<1;for(i=0;i<=t;i++){var l=e[2*i+1];0!==l&&(e[2*i]=z(r[l]++,l))}}function E(e){var t;for(t=0;t<286;t++)e.dyn_ltree[2*t]=0;for(t=0;t<30;t++)e.dyn_dtree[2*t]=0;for(t=0;t<19;t++)e.bl_tree[2*t]=0;e.dyn_ltree[512]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function A(e){e.bi_valid>8?k(e,e.bi_buf):e.bi_valid>0&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function Z(e,t,a,n){var i=2*t,r=2*a;return e[i]<e[r]||e[i]===e[r]&&n[t]<=n[a]}function O(e,t,a){for(var n=e.heap[a],i=a<<1;i<=e.heap_len&&(i<e.heap_len&&Z(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!Z(t,n,e.heap[i],e.depth));)e.heap[a]=e.heap[i],a=i,i<<=1;e.heap[a]=n}function R(e,t,a){var n,i,l,o,h=0;if(0!==e.last_lit)do{n=e.pending_buf[e.d_buf+2*h]<<8|e.pending_buf[e.d_buf+2*h+1],i=e.pending_buf[e.l_buf+h],h++,0===n?x(e,i,t):(x(e,(l=f[i])+256+1,t),0!==(o=r[l])&&y(e,i-=u[l],o),x(e,l=v(--n),a),0!==(o=s[l])&&y(e,n-=m[l],o))}while(h<e.last_lit);x(e,256,t)}function B(e,t){var a,n,i,r=t.dyn_tree,s=t.stat_desc.static_tree,l=t.stat_desc.has_stree,o=t.stat_desc.elems,h=-1;for(e.heap_len=0,e.heap_max=573,a=0;a<o;a++)0!==r[2*a]?(e.heap[++e.heap_len]=h=a,e.depth[a]=0):r[2*a+1]=0;for(;e.heap_len<2;)r[2*(i=e.heap[++e.heap_len]=h<2?++h:0)]=1,e.depth[i]=0,e.opt_len--,l&&(e.static_len-=s[2*i+1]);for(t.max_code=h,a=e.heap_len>>1;a>=1;a--)O(e,r,a);i=o;do{a=e.heap[1],e.heap[1]=e.heap[e.heap_len--],O(e,r,1),n=e.heap[1],e.heap[--e.heap_max]=a,e.heap[--e.heap_max]=n,r[2*i]=r[2*a]+r[2*n],e.depth[i]=(e.depth[a]>=e.depth[n]?e.depth[a]:e.depth[n])+1,r[2*a+1]=r[2*n+1]=i,e.heap[1]=i++,O(e,r,1)}while(e.heap_len>=2);e.heap[--e.heap_max]=e.heap[1],function(e,t){var a,n,i,r,s,l,o=t.dyn_tree,h=t.max_code,d=t.stat_desc.static_tree,_=t.stat_desc.has_stree,f=t.stat_desc.extra_bits,u=t.stat_desc.extra_base,c=t.stat_desc.max_length,b=0;for(r=0;r<=15;r++)e.bl_count[r]=0;for(o[2*e.heap[e.heap_max]+1]=0,a=e.heap_max+1;a<573;a++)(r=o[2*o[2*(n=e.heap[a])+1]+1]+1)>c&&(r=c,b++),o[2*n+1]=r,n>h||(e.bl_count[r]++,s=0,n>=u&&(s=f[n-u]),l=o[2*n],e.opt_len+=l*(r+s),_&&(e.static_len+=l*(d[2*n+1]+s)));if(0!==b){do{for(r=c-1;0===e.bl_count[r];)r--;e.bl_count[r]--,e.bl_count[r+1]+=2,e.bl_count[c]--,b-=2}while(b>0);for(r=c;0!==r;r--)for(n=e.bl_count[r];0!==n;)(i=e.heap[--a])>h||(o[2*i+1]!==r&&(e.opt_len+=(r-o[2*i+1])*o[2*i],o[2*i+1]=r),n--)}}(e,t),S(r,h,e.bl_count)}function T(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),t[2*(a+1)+1]=65535,n=0;n<=a;n++)i=s,s=t[2*(n+1)+1],++l<o&&i===s||(l<h?e.bl_tree[2*i]+=l:0!==i?(i!==r&&e.bl_tree[2*i]++,e.bl_tree[32]++):l<=10?e.bl_tree[34]++:e.bl_tree[36]++,l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4))}function N(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),n=0;n<=a;n++)if(i=s,s=t[2*(n+1)+1],!(++l<o&&i===s)){if(l<h)do{x(e,i,e.bl_tree)}while(0!=--l);else 0!==i?(i!==r&&(x(e,i,e.bl_tree),l--),x(e,16,e.bl_tree),y(e,l-3,2)):l<=10?(x(e,17,e.bl_tree),y(e,l-3,3)):(x(e,18,e.bl_tree),y(e,l-11,7));l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4)}}i(m);var D=!1;function U(e,t,a,i){y(e,0+(i?1:0),3),function(e,t,a,i){A(e),i&&(k(e,a),k(e,~a)),n.arraySet(e.pending_buf,e.window,t,a,e.pending),e.pending+=a}(e,t,a,!0)}t._tr_init=function(e){D||(!function(){var e,t,a,n,i,o=new Array(16);for(a=0,n=0;n<28;n++)for(u[n]=a,e=0;e<1<<r[n];e++)f[a++]=n;for(f[a-1]=n,i=0,n=0;n<16;n++)for(m[n]=i,e=0;e<1<<s[n];e++)_[i++]=n;for(i>>=7;n<30;n++)for(m[n]=i<<7,e=0;e<1<<s[n]-7;e++)_[256+i++]=n;for(t=0;t<=15;t++)o[t]=0;for(e=0;e<=143;)h[2*e+1]=8,e++,o[8]++;for(;e<=255;)h[2*e+1]=9,e++,o[9]++;for(;e<=279;)h[2*e+1]=7,e++,o[7]++;for(;e<=287;)h[2*e+1]=8,e++,o[8]++;for(S(h,287,o),e=0;e<30;e++)d[2*e+1]=5,d[2*e]=z(e,5);c=new w(h,r,257,286,15),b=new w(d,s,0,30,15),g=new w(new Array(0),l,0,19,7)}(),D=!0),e.l_desc=new p(e.dyn_ltree,c),e.d_desc=new p(e.dyn_dtree,b),e.bl_desc=new p(e.bl_tree,g),e.bi_buf=0,e.bi_valid=0,E(e)},t._tr_stored_block=U,t._tr_flush_block=function(e,t,a,n){var i,r,s=0;e.level>0?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,a=4093624447;for(t=0;t<=31;t++,a>>>=1)if(1&a&&0!==e.dyn_ltree[2*t])return 0;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return 1;for(t=32;t<256;t++)if(0!==e.dyn_ltree[2*t])return 1;return 0}(e)),B(e,e.l_desc),B(e,e.d_desc),s=function(e){var t;for(T(e,e.dyn_ltree,e.l_desc.max_code),T(e,e.dyn_dtree,e.d_desc.max_code),B(e,e.bl_desc),t=18;t>=3&&0===e.bl_tree[2*o[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(r=e.static_len+3+7>>>3)<=i&&(i=r)):i=r=a+5,a+4<=i&&-1!==t?U(e,t,a,n):4===e.strategy||r===i?(y(e,2+(n?1:0),3),R(e,h,d)):(y(e,4+(n?1:0),3),function(e,t,a,n){var i;for(y(e,t-257,5),y(e,a-1,5),y(e,n-4,4),i=0;i<n;i++)y(e,e.bl_tree[2*o[i]+1],3);N(e,e.dyn_ltree,t-1),N(e,e.dyn_dtree,a-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,s+1),R(e,e.dyn_ltree,e.dyn_dtree)),E(e),n&&A(e)},t._tr_tally=function(e,t,a){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&a,e.last_lit++,0===t?e.dyn_ltree[2*a]++:(e.matches++,t--,e.dyn_ltree[2*(f[a]+256+1)]++,e.dyn_dtree[2*v(t)]++),e.last_lit===e.lit_bufsize-1},t._tr_align=function(e){y(e,2,3),x(e,256,h),function(e){16===e.bi_valid?(k(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):e.bi_valid>=8&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},function(e,t,a){\"use strict\";e.exports=function(e,t){var a,n,i,r,s,l,o,h,d,_,f,u,c,b,g,m,w,p,v,k,y,x,z,S,E;a=e.state,n=e.next_in,S=e.input,i=n+(e.avail_in-5),r=e.next_out,E=e.output,s=r-(t-e.avail_out),l=r+(e.avail_out-257),o=a.dmax,h=a.wsize,d=a.whave,_=a.wnext,f=a.window,u=a.hold,c=a.bits,b=a.lencode,g=a.distcode,m=(1<<a.lenbits)-1,w=(1<<a.distbits)-1;e:do{c<15&&(u+=S[n++]<<c,c+=8,u+=S[n++]<<c,c+=8),p=b[u&m];t:for(;;){if(u>>>=v=p>>>24,c-=v,0===(v=p>>>16&255))E[r++]=65535&p;else{if(!(16&v)){if(0==(64&v)){p=b[(65535&p)+(u&(1<<v)-1)];continue t}if(32&v){a.mode=12;break e}e.msg=\"invalid literal/length code\",a.mode=30;break e}k=65535&p,(v&=15)&&(c<v&&(u+=S[n++]<<c,c+=8),k+=u&(1<<v)-1,u>>>=v,c-=v),c<15&&(u+=S[n++]<<c,c+=8,u+=S[n++]<<c,c+=8),p=g[u&w];a:for(;;){if(u>>>=v=p>>>24,c-=v,!(16&(v=p>>>16&255))){if(0==(64&v)){p=g[(65535&p)+(u&(1<<v)-1)];continue a}e.msg=\"invalid distance code\",a.mode=30;break e}if(y=65535&p,c<(v&=15)&&(u+=S[n++]<<c,(c+=8)<v&&(u+=S[n++]<<c,c+=8)),(y+=u&(1<<v)-1)>o){e.msg=\"invalid distance too far back\",a.mode=30;break e}if(u>>>=v,c-=v,y>(v=r-s)){if((v=y-v)>d&&a.sane){e.msg=\"invalid distance too far back\",a.mode=30;break e}if(x=0,z=f,0===_){if(x+=h-v,v<k){k-=v;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}}else if(_<v){if(x+=h+_-v,(v-=_)<k){k-=v;do{E[r++]=f[x++]}while(--v);if(x=0,_<k){k-=v=_;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}}}else if(x+=_-v,v<k){k-=v;do{E[r++]=f[x++]}while(--v);x=r-y,z=E}for(;k>2;)E[r++]=z[x++],E[r++]=z[x++],E[r++]=z[x++],k-=3;k&&(E[r++]=z[x++],k>1&&(E[r++]=z[x++]))}else{x=r-y;do{E[r++]=E[x++],E[r++]=E[x++],E[r++]=E[x++],k-=3}while(k>2);k&&(E[r++]=E[x++],k>1&&(E[r++]=E[x++]))}break}}break}}while(n<i&&r<l);n-=k=c>>3,u&=(1<<(c-=k<<3))-1,e.next_in=n,e.next_out=r,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=r<l?l-r+257:257-(r-l),a.hold=u,a.bits=c}},function(e,t,a){\"use strict\";var n=a(2),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],r=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],s=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],l=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(e,t,a,o,h,d,_,f){var u,c,b,g,m,w,p,v,k,y=f.bits,x=0,z=0,S=0,E=0,A=0,Z=0,O=0,R=0,B=0,T=0,N=null,D=0,U=new n.Buf16(16),I=new n.Buf16(16),F=null,L=0;for(x=0;x<=15;x++)U[x]=0;for(z=0;z<o;z++)U[t[a+z]]++;for(A=y,E=15;E>=1&&0===U[E];E--);if(A>E&&(A=E),0===E)return h[d++]=20971520,h[d++]=20971520,f.bits=1,0;for(S=1;S<E&&0===U[S];S++);for(A<S&&(A=S),R=1,x=1;x<=15;x++)if(R<<=1,(R-=U[x])<0)return-1;if(R>0&&(0===e||1!==E))return-1;for(I[1]=0,x=1;x<15;x++)I[x+1]=I[x]+U[x];for(z=0;z<o;z++)0!==t[a+z]&&(_[I[t[a+z]]++]=z);if(0===e?(N=F=_,w=19):1===e?(N=i,D-=257,F=r,L-=257,w=256):(N=s,F=l,w=-1),T=0,z=0,x=S,m=d,Z=A,O=0,b=-1,g=(B=1<<A)-1,1===e&&B>852||2===e&&B>592)return 1;for(;;){p=x-O,_[z]<w?(v=0,k=_[z]):_[z]>w?(v=F[L+_[z]],k=N[D+_[z]]):(v=96,k=0),u=1<<x-O,S=c=1<<Z;do{h[m+(T>>O)+(c-=u)]=p<<24|v<<16|k|0}while(0!==c);for(u=1<<x-1;T&u;)u>>=1;if(0!==u?(T&=u-1,T+=u):T=0,z++,0==--U[x]){if(x===E)break;x=t[a+_[z]]}if(x>A&&(T&g)!==b){for(0===O&&(O=A),m+=S,R=1<<(Z=x-O);Z+O<E&&!((R-=U[Z+O])<=0);)Z++,R<<=1;if(B+=1<<Z,1===e&&B>852||2===e&&B>592)return 1;h[b=T&g]=A<<24|Z<<16|m-d|0}}return 0!==T&&(h[m+T]=x-O<<24|64<<16|0),f.bits=A,0}},function(e,t,a){\"use strict\";a.r(t);var n=a(3),i=a.n(n),r=a(4),s=a(5),l=a(1),o=a.n(l),h=a(0);function d(e,t){var a=this;this.inflatedReady=e,this.deflatedReady=t,this._inflate=function(e){var t=new i.a,a=Object(s.inflateInit2)(t,15);if(a!==h.Z_OK)throw new Error(\"Problem initializing inflate stream: \"+o.a[a]);return function(a){if(void 0===a)return e();var n,i,r;t.input=a,t.next_in=0,t.avail_in=t.input.length;var l=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(16384),n=t.next_out=0,t.avail_out=16384),(i=Object(s.inflate)(t,h.Z_NO_FLUSH))!==h.Z_STREAM_END&&i!==h.Z_OK)throw new Error(\"inflate problem: \"+o.a[i]);t.next_out&&(0!==t.avail_out&&i!==h.Z_STREAM_END||(r=t.output.subarray(n,n=t.next_out),l=e(r)))}while(t.avail_in>0&&i!==h.Z_STREAM_END);return t.next_out>n&&(r=t.output.subarray(n,n=t.next_out),l=e(r)),l}}((function(e){return a.inflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))})),this._deflate=function(e){var t=new i.a,a=Object(r.deflateInit2)(t,h.Z_DEFAULT_COMPRESSION,h.Z_DEFLATED,15,8,h.Z_DEFAULT_STRATEGY);if(a!==h.Z_OK)throw new Error(\"Problem initializing deflate stream: \"+o.a[a]);return function(a){if(void 0===a)return e();var n,i,s;t.input=a,t.next_in=0,t.avail_in=t.input.length;var l=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(16384),s=t.next_out=0,t.avail_out=16384),(n=Object(r.deflate)(t,h.Z_SYNC_FLUSH))!==h.Z_STREAM_END&&n!==h.Z_OK)throw new Error(\"Deflate problem: \"+o.a[n]);0===t.avail_out&&t.next_out>s&&(i=t.output.subarray(s,s=t.next_out),l=e(i))}while((t.avail_in>0||0===t.avail_out)&&n!==h.Z_STREAM_END);return t.next_out>s&&(i=t.output.subarray(s,s=t.next_out),l=e(i)),l}}((function(e){return a.deflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))}))}d.prototype.inflate=function(e){this._inflate(new Uint8Array(e))},d.prototype.deflate=function(e){this._deflate(new Uint8Array(e))};var _=function(e,t){return{message:e,buffer:t}},f=new d((function(e){return self.postMessage(_(\"inflated_ready\",e),[e])}),(function(e){return self.postMessage(_(\"deflated_ready\",e),[e])}));self.onmessage=function(e){var t=e.data.message,a=e.data.buffer;switch(t){case\"start\":break;case\"inflate\":f.inflate(a);break;case\"deflate\":f.deflate(a)}}}]);";
//
// constants used for communication with the worker
//
const MESSAGE_INITIALIZE_WORKER = 'start';
const MESSAGE_INFLATE = 'inflate';
const MESSAGE_INFLATED_DATA_READY = 'inflated_ready';
const MESSAGE_DEFLATE = 'deflate';
const MESSAGE_DEFLATED_DATA_READY = 'deflated_ready';
const EOL = '\r\n';
const LINE_FEED = 10;
const CARRIAGE_RETURN = 13;
const LEFT_CURLY_BRACKET = 123;
const RIGHT_CURLY_BRACKET = 125;
const ASCII_PLUS = 43;

// State tracking when constructing an IMAP command from buffers.
const BUFFER_STATE_LITERAL = 'literal';
const BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1 = 'literal_length_1';
const BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2 = 'literal_length_2';
const BUFFER_STATE_DEFAULT = 'default';

/**
 * How much time to wait since the last response until the connection is considered idling
 */
const TIMEOUT_ENTER_IDLE = 1000;

/**
 * Lower Bound for socket timeout to wait since the last data was written to a socket
 */
const TIMEOUT_SOCKET_LOWER_BOUND = 60000;

/**
 * Multiplier for socket timeout:
 *
 * We assume at least a GPRS connection with 115 kb/s = 14,375 kB/s tops, so 10 KB/s to be on
 * the safe side. We can timeout after a lower bound of 10s + (n KB / 10 KB/s). A 1 MB message
 * upload would be 110 seconds to wait for the timeout. 10 KB/s === 0.1 s/B
 */
const TIMEOUT_SOCKET_MULTIPLIER = 0.1;

/**
 * Creates a connection object to an IMAP server. Call `connect` method to inititate
 * the actual connection, the constructor only defines the properties but does not actually connect.
 *
 * @constructor
 *
 * @param {String} [host='localhost'] Hostname to conenct to
 * @param {Number} [port=143] Port number to connect to
 * @param {Object} [options] Optional options object
 * @param {Boolean} [options.useSecureTransport] Set to true, to use encrypted connection
 * @param {String} [options.compressionWorkerPath] offloads de-/compression computation to a web worker, this is the path to the browserified emailjs-compressor-worker.js
 */
class Imap {
  constructor(host, port, options = {}) {
    this.timeoutEnterIdle = TIMEOUT_ENTER_IDLE;
    this.timeoutSocketLowerBound = TIMEOUT_SOCKET_LOWER_BOUND;
    this.timeoutSocketMultiplier = TIMEOUT_SOCKET_MULTIPLIER;
    this.options = options;
    this.port = port || (this.options.useSecureTransport ? 993 : 143);
    this.host = host || 'localhost';

    // Use a TLS connection. Port 993 also forces TLS.
    this.options.useSecureTransport = 'useSecureTransport' in this.options ? !!this.options.useSecureTransport : this.port === 993;
    this.secureMode = !!this.options.useSecureTransport; // Does the connection use SSL/TLS

    this._connectionReady = false; // Is the conection established and greeting is received from the server

    this._globalAcceptUntagged = {}; // Global handlers for unrelated responses (EXPUNGE, EXISTS etc.)

    this._clientQueue = []; // Queue of outgoing commands
    this._canSend = false; // Is it OK to send something to the server
    this._tagCounter = 0; // Counter to allow uniqueue imap tags
    this._currentCommand = false; // Current command that is waiting for response from the server

    this._idleTimer = false; // Timer waiting to enter idle
    this._socketTimeoutTimer = false; // Timer waiting to declare the socket dead starting from the last write

    this.compressed = false; // Is the connection compressed and needs inflating/deflating

    //
    // HELPERS
    //

    // As the server sends data in chunks, it needs to be split into separate lines. Helps parsing the input.
    this._incomingBuffers = [];
    this._bufferState = BUFFER_STATE_DEFAULT;
    this._literalRemaining = 0;

    //
    // Event placeholders, may be overriden with callback functions
    //
    this.oncert = null;
    this.onerror = null; // Irrecoverable error occurred. Connection to the server will be closed automatically.
    this.onready = null; // The connection to the server has been established and greeting is received
    this.onidle = null; // There are no more commands to process
  }

  // PUBLIC METHODS

  /**
   * Initiate a connection to the server. Wait for onready event
   *
   * @param {Object} Socket
   *     TESTING ONLY! The TCPSocket has a pretty nonsensical convenience constructor,
   *     which makes it hard to mock. For dependency-injection purposes, we use the
   *     Socket parameter to pass in a mock Socket implementation. Should be left blank
   *     in production use!
   * @returns {Promise} Resolves when socket is opened
   */
  connect(Socket = _emailjsTcpSocket.default) {
    return new Promise((resolve, reject) => {
      this.socket = Socket.open(this.host, this.port, {
        binaryType: 'arraybuffer',
        useSecureTransport: this.secureMode,
        ca: this.options.ca
      });
      _diagnosticsChannel.imapCommandChannel.publish({
        type: 'CONNECT',
        host: this.host
      });

      // allows certificate handling for platform w/o native tls support
      // oncert is non standard so setting it might throw if the socket object is immutable
      try {
        this.socket.oncert = cert => {
          this.oncert && this.oncert(cert);
        };
      } catch (E) {}

      // Connection closing unexpected is an error
      this.socket.onclose = () => this._onError(new Error('Socket closed unexpectedly!'));
      this.socket.ondata = evt => {
        try {
          this._onData(evt);
        } catch (err) {
          this._onError(err);
        }
      };

      // if an error happens during create time, reject the promise
      this.socket.onerror = e => {
        reject(new Error('Could not open socket: ' + e.data.message));
      };
      this.socket.onopen = () => {
        // use proper "irrecoverable error, tear down everything"-handler only after socket is open
        this.socket.onerror = e => this._onError(e);
        resolve();
      };
    });
  }

  /**
   * Closes the connection to the server
   *
   * @returns {Promise} Resolves when the socket is closed
   */
  close(error) {
    return new Promise(resolve => {
      var tearDown = () => {
        // fulfill pending promises
        this._clientQueue.forEach(cmd => cmd.callback(error));
        if (this._currentCommand) {
          this._currentCommand.callback(error);
        }
        this._clientQueue = [];
        this._currentCommand = false;
        clearTimeout(this._idleTimer);
        this._idleTimer = null;
        clearTimeout(this._socketTimeoutTimer);
        this._socketTimeoutTimer = null;
        if (this.socket) {
          // remove all listeners
          this.socket.onopen = null;
          this.socket.onclose = null;
          this.socket.ondata = null;
          this.socket.onerror = null;
          try {
            this.socket.oncert = null;
          } catch (E) {}
          this.socket = null;
        }
        _diagnosticsChannel.imapCommandChannel.publish({
          type: 'CLOSE',
          host: this.host
        });
        resolve();
      };
      this._disableCompression();
      if (!this.socket || this.socket.readyState !== 'open') {
        return tearDown();
      }
      this.socket.onclose = this.socket.onerror = tearDown; // we don't really care about the error here
      this.socket.close();
    });
  }

  /**
   * Send LOGOUT to the server.
   *
   * Use is discouraged!
   *
   * @returns {Promise} Resolves when connection is closed by server.
   */
  logout() {
    return new Promise((resolve, reject) => {
      this.socket.onclose = this.socket.onerror = () => {
        this.close('Client logging out').then(resolve).catch(reject);
      };
      this.enqueueCommand('LOGOUT');
    });
  }

  /**
   * Initiates TLS handshake
   */
  upgrade() {
    this.secureMode = true;
    this.socket.upgradeToSecure();
  }

  /**
   * Schedules a command to be sent to the server.
   * See https://github.com/emailjs/emailjs-imap-handler for request structure.
   * Do not provide a tag property, it will be set by the queue manager.
   *
   * To catch untagged responses use acceptUntagged property. For example, if
   * the value for it is 'FETCH' then the reponse includes 'payload.FETCH' property
   * that is an array including all listed * FETCH responses.
   *
   * @param {Object} request Structured request object
   * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
   * @param {Object} [options] Optional data for the command payload
   * @returns {Promise} Promise that resolves when the corresponding response was received
   */
  enqueueCommand(request, acceptUntagged, options) {
    if (typeof request === 'string') {
      request = {
        command: request
      };
    }
    acceptUntagged = [].concat(acceptUntagged || []).map(untagged => (untagged || '').toString().toUpperCase().trim());
    var tag = 'W' + ++this._tagCounter;
    request.tag = tag;
    return new Promise((resolve, reject) => {
      var data = {
        tag: tag,
        request: request,
        payload: acceptUntagged.length ? {} : undefined,
        callback: response => {
          if (this.isError(response)) {
            // add command and attributes for more clue what failed
            response.command = request.command;
            if (request.command !== 'login') {
              response.attributes = request.attributes;
            }
            return reject(response);
          } else if (['NO', 'BAD'].indexOf((0, _ramda.propOr)('', 'command', response).toUpperCase().trim()) >= 0) {
            var error = new Error(response.humanReadable || 'Error');
            // add command and attributes for more clue what failed
            error.command = request.command;
            error.responseCommand = response.command;
            if (request.command !== 'login') {
              error.attributes = request.attributes;
            }
            if (response.code) {
              error.code = response.code;
            }
            return reject(error);
          }
          resolve(response);
        }
      };

      // apply any additional options to the command
      Object.keys(options || {}).forEach(key => {
        data[key] = options[key];
      });
      acceptUntagged.forEach(command => {
        data.payload[command] = [];
      });

      // if we're in priority mode (i.e. we ran commands in a precheck),
      // queue any commands BEFORE the command that contianed the precheck,
      // otherwise just queue command as usual
      var index = data.ctx ? this._clientQueue.indexOf(data.ctx) : -1;
      if (index >= 0) {
        data.tag += '.p';
        data.request.tag += '.p';
        this._clientQueue.splice(index, 0, data);
      } else {
        this._clientQueue.push(data);
      }
      if (this._canSend) {
        this._sendRequest();
      }
    });
  }

  /**
   *
   * @param commands
   * @param ctx
   * @returns {*}
   */
  getPreviouslyQueued(commands, ctx) {
    const startIndex = this._clientQueue.indexOf(ctx) - 1;

    // search backwards for the commands and return the first found
    for (let i = startIndex; i >= 0; i--) {
      if (isMatch(this._clientQueue[i])) {
        return this._clientQueue[i];
      }
    }

    // also check current command if no SELECT is queued
    if (isMatch(this._currentCommand)) {
      return this._currentCommand;
    }
    return false;
    function isMatch(data) {
      return data && data.request && commands.indexOf(data.request.command) >= 0;
    }
  }

  /**
   * Send data to the TCP socket
   * Arms a timeout waiting for a response from the server.
   *
   * @param {String} str Payload
   */
  send(str) {
    const buffer = (0, _common.toTypedArray)(str).buffer;
    const timeout = this.timeoutSocketLowerBound + Math.floor(buffer.byteLength * this.timeoutSocketMultiplier);
    clearTimeout(this._socketTimeoutTimer); // clear pending timeouts
    this._socketTimeoutTimer = setTimeout(() => this._onError(new Error(' Socket timed out!')), timeout); // arm the next timeout

    if (this.compressed) {
      this._sendCompressed(buffer);
    } else {
      if (!this.socket) {
        this._onError(new Error('Error :: Unexpected socket close'));
      } else {
        this.socket.send(buffer);
      }
    }

    // Check for subscribers so we wouldn't parse the payload if not necessary
    if (_diagnosticsChannel.imapCommandChannel.hasSubscribers()) {
      let command = 'UNKNOWN';

      // Parse command type from payload, so we would publish only command type to diagnostics
      try {
        const parsedPayload = (0, _parserHelper.parserHelper)(str);
        // Based on https://github.com/emailjs/emailjs-imap-handler#parse-imap-commands
        if (parsedPayload.command) {
          command = parsedPayload.command;
        }
      } catch (_unused) {}
      _diagnosticsChannel.imapCommandChannel.publish({
        type: command,
        host: this.host,
        payload: str
      });
    }
  }

  /**
   * Set a global handler for an untagged response. If currently processed command
   * has not listed untagged command it is forwarded to the global handler. Useful
   * with EXPUNGE, EXISTS etc.
   *
   * @param {String} command Untagged command name
   * @param {Function} callback Callback function with response object and continue callback function
   */
  setHandler(command, callback) {
    this._globalAcceptUntagged[command.toUpperCase().trim()] = callback;
  }

  // INTERNAL EVENTS

  /**
   * Error handler for the socket
   *
   * @event
   * @param {Event} evt Event object. See evt.data for the error
   */
  _onError(evt) {
    var error;
    if (this.isError(evt)) {
      error = evt;
    } else if (evt && this.isError(evt.data)) {
      error = evt.data;
    } else {
      error = new Error(evt && evt.data && evt.data.message || evt.data || evt || 'Error');
    }
    this.logger.error(error);

    // always call onerror callback, no matter if close() succeeds or fails
    this.close(error).then(() => {
      this.onerror && this.onerror(error);
    }, () => {
      this.onerror && this.onerror(error);
    });
  }

  /**
   * Handler for incoming data from the server. The data is sent in arbitrary
   * chunks and can't be used directly so this function makes sure the data
   * is split into complete lines before the data is passed to the command
   * handler
   *
   * @param {Event} evt
   */
  _onData(evt) {
    clearTimeout(this._socketTimeoutTimer); // reset the timeout on each data packet
    const timeout = this.timeoutSocketLowerBound + Math.floor(4096 * this.timeoutSocketMultiplier); // max packet size is 4096 bytes
    this._socketTimeoutTimer = setTimeout(() => this._onError(new Error(' Socket timed out!')), timeout);
    this._incomingBuffers.push(new Uint8Array(evt.data)); // append to the incoming buffer
    this._parseIncomingCommands(this._iterateIncomingBuffer()); // Consume the incoming buffer
  }

  *_iterateIncomingBuffer() {
    let buf = this._incomingBuffers[this._incomingBuffers.length - 1] || [];
    let i = 0;

    // loop invariant:
    //   this._incomingBuffers starts with the beginning of incoming command.
    //   buf is shorthand for last element of this._incomingBuffers.
    //   buf[0..i-1] is part of incoming command.
    while (i < buf.length) {
      switch (this._bufferState) {
        case BUFFER_STATE_LITERAL:
          const diff = Math.min(buf.length - i, this._literalRemaining);
          this._literalRemaining -= diff;
          i += diff;
          if (this._literalRemaining === 0) {
            this._bufferState = BUFFER_STATE_DEFAULT;
          }
          continue;
        case BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2:
          if (i < buf.length) {
            if (buf[i] === CARRIAGE_RETURN) {
              this._literalRemaining = Number((0, _common.fromTypedArray)(this._lengthBuffer)) + 2; // for CRLF
              this._bufferState = BUFFER_STATE_LITERAL;
            } else {
              this._bufferState = BUFFER_STATE_DEFAULT;
            }
            delete this._lengthBuffer;
          }
          continue;
        case BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1:
          const start = i;
          while (i < buf.length && buf[i] >= 48 && buf[i] <= 57) {
            // digits
            i++;
          }
          if (start !== i) {
            const latest = buf.subarray(start, i);
            const prevBuf = this._lengthBuffer;
            this._lengthBuffer = new Uint8Array(prevBuf.length + latest.length);
            this._lengthBuffer.set(prevBuf);
            this._lengthBuffer.set(latest, prevBuf.length);
          }
          if (i < buf.length) {
            if (this._lengthBuffer.length > 0 && buf[i] === RIGHT_CURLY_BRACKET) {
              this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2;
            } else {
              delete this._lengthBuffer;
              this._bufferState = BUFFER_STATE_DEFAULT;
            }
            i++;
          }
          continue;
        default:
          // find literal length
          const leftIdx = buf.indexOf(LEFT_CURLY_BRACKET, i);
          if (leftIdx > -1) {
            const leftOfLeftCurly = new Uint8Array(buf.buffer, i, leftIdx - i);
            if (leftOfLeftCurly.indexOf(LINE_FEED) === -1) {
              i = leftIdx + 1;
              this._lengthBuffer = new Uint8Array(0);
              this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1;
              continue;
            }
          }

          // find end of command
          const LFidx = buf.indexOf(LINE_FEED, i);
          if (LFidx > -1) {
            if (LFidx < buf.length - 1) {
              this._incomingBuffers[this._incomingBuffers.length - 1] = new Uint8Array(buf.buffer, 0, LFidx + 1);
            }
            const commandLength = this._incomingBuffers.reduce((prev, curr) => prev + curr.length, 0) - 2; // 2 for CRLF
            const command = new Uint8Array(commandLength);
            let index = 0;
            while (this._incomingBuffers.length > 0) {
              let uint8Array = this._incomingBuffers.shift();
              const remainingLength = commandLength - index;
              if (uint8Array.length > remainingLength) {
                const excessLength = uint8Array.length - remainingLength;
                uint8Array = uint8Array.subarray(0, -excessLength);
                if (this._incomingBuffers.length > 0) {
                  this._incomingBuffers = [];
                }
              }
              command.set(uint8Array, index);
              index += uint8Array.length;
            }
            yield command;
            if (LFidx < buf.length - 1) {
              buf = new Uint8Array(buf.subarray(LFidx + 1));
              this._incomingBuffers.push(buf);
              i = 0;
            } else {
              // clear the timeout when an entire command has arrived
              // and not waiting on more data for next command
              clearTimeout(this._socketTimeoutTimer);
              this._socketTimeoutTimer = null;
              return;
            }
          } else {
            return;
          }
      }
    }
  }

  // PRIVATE METHODS

  /**
   * Processes a command from the queue. The command is parsed and feeded to a handler
   */
  _parseIncomingCommands(commands) {
    for (var command of commands) {
      this._clearIdle();

      /*
       * The "+"-tagged response is a special case:
       * Either the server can asks for the next chunk of data, e.g. for the AUTHENTICATE command.
       *
       * Or there was an error in the XOAUTH2 authentication, for which SASL initial client response extension
       * dictates the client sends an empty EOL response to the challenge containing the error message.
       *
       * Details on "+"-tagged response:
       *   https://tools.ietf.org/html/rfc3501#section-2.2.1
       */
      //
      if (command[0] === ASCII_PLUS) {
        if (this._currentCommand.data.length) {
          // feed the next chunk of data
          var chunk = this._currentCommand.data.shift();
          chunk += !this._currentCommand.data.length ? EOL : ''; // EOL if there's nothing more to send
          this.send(chunk);
        } else if (this._currentCommand.errorResponseExpectsEmptyLine) {
          this.send(EOL); // XOAUTH2 empty response, error will be reported when server continues with NO response
        }

        continue;
      }
      var response;
      try {
        const valueAsString = this._currentCommand.request && this._currentCommand.request.valueAsString;
        response = (0, _parserHelper.parserHelper)(command, {
          valueAsString
        });
        this.logger.debug('S:', () => (0, _emailjsImapHandler.compiler)(response, false, true));
      } catch (e) {
        this.logger.error(e, 'Error parsing imap command!', {
          response,
          command: (0, _common.fromTypedArray)(command)
        });
        return this._onError(e);
      }
      this._processResponse(response);
      this._handleResponse(response);

      // first response from the server, connection is now usable
      if (!this._connectionReady) {
        this._connectionReady = true;
        this.onready && this.onready();
      }
    }
  }

  /**
   * Feeds a parsed response object to an appropriate handler
   *
   * @param {Object} response Parsed command object
   */
  _handleResponse(response) {
    var command = (0, _ramda.propOr)('', 'command', response).toUpperCase().trim();
    if (!this._currentCommand) {
      // unsolicited untagged response
      if (response.tag === '*' && command in this._globalAcceptUntagged) {
        this._globalAcceptUntagged[command](response);
        this._canSend = true;
        this._sendRequest();
      }
    } else if (this._currentCommand.payload && response.tag === '*' && command in this._currentCommand.payload) {
      // expected untagged response
      this._currentCommand.payload[command].push(response);
    } else if (response.tag === '*' && command in this._globalAcceptUntagged) {
      // unexpected untagged response
      this._globalAcceptUntagged[command](response);
    } else if (response.tag === this._currentCommand.tag) {
      // tagged response
      if (this._currentCommand.payload && Object.keys(this._currentCommand.payload).length) {
        response.payload = this._currentCommand.payload;
      }
      this._currentCommand.callback(response);
      this._canSend = true;
      this._sendRequest();
    }
  }

  /**
   * Sends a command from client queue to the server.
   */
  _sendRequest() {
    if (!this._clientQueue.length) {
      return this._enterIdle();
    }
    this._clearIdle();

    // an operation was made in the precheck, no need to restart the queue manually
    this._restartQueue = false;
    var command = this._clientQueue[0];
    if (typeof command.precheck === 'function') {
      // remember the context
      var context = command;
      var precheck = context.precheck;
      delete context.precheck;

      // we need to restart the queue handling if no operation was made in the precheck
      this._restartQueue = true;

      // invoke the precheck command and resume normal operation after the promise resolves
      precheck(context).then(() => {
        // we're done with the precheck
        if (this._restartQueue) {
          // we need to restart the queue handling
          this._sendRequest();
        }
      }).catch(err => {
        // precheck failed, so we remove the initial command
        // from the queue, invoke its callback and resume normal operation
        let cmd;
        const index = this._clientQueue.indexOf(context);
        if (index >= 0) {
          cmd = this._clientQueue.splice(index, 1)[0];
        }
        if (cmd && cmd.callback) {
          cmd.callback(err);
          this._canSend = true;
          this._parseIncomingCommands(this._iterateIncomingBuffer()); // Consume the rest of the incoming buffer
          this._sendRequest(); // continue sending
        }
      });

      return;
    }
    this._canSend = false;
    this._currentCommand = this._clientQueue.shift();
    try {
      this._currentCommand.data = (0, _emailjsImapHandler.compiler)(this._currentCommand.request, true);
      this.logger.debug('C:', () => (0, _emailjsImapHandler.compiler)(this._currentCommand.request, false, true)); // excludes passwords etc.
    } catch (e) {
      this.logger.error(e, 'Error compiling imap command!', this._currentCommand.request);
      return this._onError(new Error('Error compiling imap command!'));
    }
    var data = this._currentCommand.data.shift();
    this.send(data + (!this._currentCommand.data.length ? EOL : ''));
    return this.waitDrain;
  }

  /**
   * Emits onidle, noting to do currently
   */
  _enterIdle() {
    clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => this.onidle && this.onidle(), this.timeoutEnterIdle);
  }

  /**
   * Cancel idle timer
   */
  _clearIdle() {
    clearTimeout(this._idleTimer);
    this._idleTimer = null;
  }

  /**
   * Method processes a response into an easier to handle format.
   * Add untagged numbered responses (e.g. FETCH) into a nicely feasible form
   * Checks if a response includes optional response codes
   * and copies these into separate properties. For example the
   * following response includes a capability listing and a human
   * readable message:
   *
   *     * OK [CAPABILITY ID NAMESPACE] All ready
   *
   * This method adds a 'capability' property with an array value ['ID', 'NAMESPACE']
   * to the response object. Additionally 'All ready' is added as 'humanReadable' property.
   *
   * See possiblem IMAP Response Codes at https://tools.ietf.org/html/rfc5530
   *
   * @param {Object} response Parsed response object
   */
  _processResponse(response) {
    const command = (0, _ramda.propOr)('', 'command', response).toUpperCase().trim();

    // no attributes
    if (!response || !response.attributes || !response.attributes.length) {
      return;
    }

    // untagged responses w/ sequence numbers
    if (response.tag === '*' && /^\d+$/.test(response.command) && response.attributes[0].type === 'ATOM') {
      response.nr = Number(response.command);
      response.command = (response.attributes.shift().value || '').toString().toUpperCase().trim();
    }

    // no optional response code
    if (['OK', 'NO', 'BAD', 'BYE', 'PREAUTH'].indexOf(command) < 0) {
      return;
    }

    // If last element of the response is TEXT then this is for humans
    if (response.attributes[response.attributes.length - 1].type === 'TEXT') {
      response.humanReadable = response.attributes[response.attributes.length - 1].value;
    }

    // Parse and format ATOM values
    if (response.attributes[0].type === 'ATOM' && response.attributes[0].section) {
      const option = response.attributes[0].section.map(key => {
        if (!key) {
          return;
        }
        if (Array.isArray(key)) {
          return key.map(key => (key.value || '').toString().trim());
        } else {
          return (key.value || '').toString().toUpperCase().trim();
        }
      });
      const key = option.shift();
      response.code = key;
      if (option.length === 1) {
        response[key.toLowerCase()] = option[0];
      } else if (option.length > 1) {
        response[key.toLowerCase()] = option;
      }
    }
  }

  /**
   * Checks if a value is an Error object
   *
   * @param {Mixed} value Value to be checked
   * @return {Boolean} returns true if the value is an Error
   */
  isError(value) {
    return !!Object.prototype.toString.call(value).match(/Error\]$/);
  }

  // COMPRESSION RELATED METHODS

  /**
   * Sets up deflate/inflate for the IO
   */
  enableCompression() {
    this._socketOnData = this.socket.ondata;
    this.compressed = true;
    if (typeof window !== 'undefined' && window.Worker) {
      this._compressionWorker = new Worker(URL.createObjectURL(new Blob([CompressionBlob])));
      this._compressionWorker.onmessage = e => {
        var message = e.data.message;
        var data = e.data.buffer;
        switch (message) {
          case MESSAGE_INFLATED_DATA_READY:
            this._socketOnData({
              data
            });
            break;
          case MESSAGE_DEFLATED_DATA_READY:
            this.waitDrain = this.socket.send(data);
            break;
        }
      };
      this._compressionWorker.onerror = e => {
        this._onError(new Error('Error handling compression web worker: ' + e.message));
      };
      this._compressionWorker.postMessage(createMessage(MESSAGE_INITIALIZE_WORKER));
    } else {
      const inflatedReady = buffer => {
        this._socketOnData({
          data: buffer
        });
      };
      const deflatedReady = buffer => {
        this.waitDrain = this.socket.send(buffer);
      };
      this._compression = new _compression.default(inflatedReady, deflatedReady);
    }

    // override data handler, decompress incoming data
    this.socket.ondata = evt => {
      if (!this.compressed) {
        return;
      }
      if (this._compressionWorker) {
        this._compressionWorker.postMessage(createMessage(MESSAGE_INFLATE, evt.data), [evt.data]);
      } else {
        this._compression.inflate(evt.data);
      }
    };
  }

  /**
   * Undoes any changes related to compression. This only be called when closing the connection
   */
  _disableCompression() {
    if (!this.compressed) {
      return;
    }
    this.compressed = false;
    this.socket.ondata = this._socketOnData;
    this._socketOnData = null;
    if (this._compressionWorker) {
      // terminate the worker
      this._compressionWorker.terminate();
      this._compressionWorker = null;
    }
  }

  /**
   * Outgoing payload needs to be compressed and sent to socket
   *
   * @param {ArrayBuffer} buffer Outgoing uncompressed arraybuffer
   */
  _sendCompressed(buffer) {
    // deflate
    if (this._compressionWorker) {
      this._compressionWorker.postMessage(createMessage(MESSAGE_DEFLATE, buffer), [buffer]);
    } else {
      this._compression.deflate(buffer);
    }
  }
}
exports.default = Imap;
const createMessage = (message, buffer) => ({
  message,
  buffer
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmFtZGEiLCJyZXF1aXJlIiwiX2VtYWlsanNUY3BTb2NrZXQiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2NvbW1vbiIsIl9lbWFpbGpzSW1hcEhhbmRsZXIiLCJfcGFyc2VySGVscGVyIiwiX2NvbXByZXNzaW9uIiwiX2RpYWdub3N0aWNzQ2hhbm5lbCIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiQ29tcHJlc3Npb25CbG9iIiwiTUVTU0FHRV9JTklUSUFMSVpFX1dPUktFUiIsIk1FU1NBR0VfSU5GTEFURSIsIk1FU1NBR0VfSU5GTEFURURfREFUQV9SRUFEWSIsIk1FU1NBR0VfREVGTEFURSIsIk1FU1NBR0VfREVGTEFURURfREFUQV9SRUFEWSIsIkVPTCIsIkxJTkVfRkVFRCIsIkNBUlJJQUdFX1JFVFVSTiIsIkxFRlRfQ1VSTFlfQlJBQ0tFVCIsIlJJR0hUX0NVUkxZX0JSQUNLRVQiLCJBU0NJSV9QTFVTIiwiQlVGRkVSX1NUQVRFX0xJVEVSQUwiLCJCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMSIsIkJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yIiwiQlVGRkVSX1NUQVRFX0RFRkFVTFQiLCJUSU1FT1VUX0VOVEVSX0lETEUiLCJUSU1FT1VUX1NPQ0tFVF9MT1dFUl9CT1VORCIsIlRJTUVPVVRfU09DS0VUX01VTFRJUExJRVIiLCJJbWFwIiwiY29uc3RydWN0b3IiLCJob3N0IiwicG9ydCIsIm9wdGlvbnMiLCJ0aW1lb3V0RW50ZXJJZGxlIiwidGltZW91dFNvY2tldExvd2VyQm91bmQiLCJ0aW1lb3V0U29ja2V0TXVsdGlwbGllciIsInVzZVNlY3VyZVRyYW5zcG9ydCIsInNlY3VyZU1vZGUiLCJfY29ubmVjdGlvblJlYWR5IiwiX2dsb2JhbEFjY2VwdFVudGFnZ2VkIiwiX2NsaWVudFF1ZXVlIiwiX2NhblNlbmQiLCJfdGFnQ291bnRlciIsIl9jdXJyZW50Q29tbWFuZCIsIl9pZGxlVGltZXIiLCJfc29ja2V0VGltZW91dFRpbWVyIiwiY29tcHJlc3NlZCIsIl9pbmNvbWluZ0J1ZmZlcnMiLCJfYnVmZmVyU3RhdGUiLCJfbGl0ZXJhbFJlbWFpbmluZyIsIm9uY2VydCIsIm9uZXJyb3IiLCJvbnJlYWR5Iiwib25pZGxlIiwiY29ubmVjdCIsIlNvY2tldCIsIlRDUFNvY2tldCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic29ja2V0Iiwib3BlbiIsImJpbmFyeVR5cGUiLCJjYSIsImltYXBDb21tYW5kQ2hhbm5lbCIsInB1Ymxpc2giLCJ0eXBlIiwiY2VydCIsIkUiLCJvbmNsb3NlIiwiX29uRXJyb3IiLCJFcnJvciIsIm9uZGF0YSIsImV2dCIsIl9vbkRhdGEiLCJlcnIiLCJlIiwiZGF0YSIsIm1lc3NhZ2UiLCJvbm9wZW4iLCJjbG9zZSIsImVycm9yIiwidGVhckRvd24iLCJmb3JFYWNoIiwiY21kIiwiY2FsbGJhY2siLCJjbGVhclRpbWVvdXQiLCJfZGlzYWJsZUNvbXByZXNzaW9uIiwicmVhZHlTdGF0ZSIsImxvZ291dCIsInRoZW4iLCJjYXRjaCIsImVucXVldWVDb21tYW5kIiwidXBncmFkZSIsInVwZ3JhZGVUb1NlY3VyZSIsInJlcXVlc3QiLCJhY2NlcHRVbnRhZ2dlZCIsImNvbW1hbmQiLCJjb25jYXQiLCJtYXAiLCJ1bnRhZ2dlZCIsInRvU3RyaW5nIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGFnIiwicGF5bG9hZCIsImxlbmd0aCIsInVuZGVmaW5lZCIsInJlc3BvbnNlIiwiaXNFcnJvciIsImF0dHJpYnV0ZXMiLCJpbmRleE9mIiwicHJvcE9yIiwiaHVtYW5SZWFkYWJsZSIsInJlc3BvbnNlQ29tbWFuZCIsImNvZGUiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwiaW5kZXgiLCJjdHgiLCJzcGxpY2UiLCJwdXNoIiwiX3NlbmRSZXF1ZXN0IiwiZ2V0UHJldmlvdXNseVF1ZXVlZCIsImNvbW1hbmRzIiwic3RhcnRJbmRleCIsImkiLCJpc01hdGNoIiwic2VuZCIsInN0ciIsImJ1ZmZlciIsInRvVHlwZWRBcnJheSIsInRpbWVvdXQiLCJNYXRoIiwiZmxvb3IiLCJieXRlTGVuZ3RoIiwic2V0VGltZW91dCIsIl9zZW5kQ29tcHJlc3NlZCIsImhhc1N1YnNjcmliZXJzIiwicGFyc2VkUGF5bG9hZCIsInBhcnNlckhlbHBlciIsIl91bnVzZWQiLCJzZXRIYW5kbGVyIiwibG9nZ2VyIiwiVWludDhBcnJheSIsIl9wYXJzZUluY29taW5nQ29tbWFuZHMiLCJfaXRlcmF0ZUluY29taW5nQnVmZmVyIiwiYnVmIiwiZGlmZiIsIm1pbiIsIk51bWJlciIsImZyb21UeXBlZEFycmF5IiwiX2xlbmd0aEJ1ZmZlciIsInN0YXJ0IiwibGF0ZXN0Iiwic3ViYXJyYXkiLCJwcmV2QnVmIiwic2V0IiwibGVmdElkeCIsImxlZnRPZkxlZnRDdXJseSIsIkxGaWR4IiwiY29tbWFuZExlbmd0aCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwidWludDhBcnJheSIsInNoaWZ0IiwicmVtYWluaW5nTGVuZ3RoIiwiZXhjZXNzTGVuZ3RoIiwiX2NsZWFySWRsZSIsImNodW5rIiwiZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUiLCJ2YWx1ZUFzU3RyaW5nIiwiZGVidWciLCJjb21waWxlciIsIl9wcm9jZXNzUmVzcG9uc2UiLCJfaGFuZGxlUmVzcG9uc2UiLCJfZW50ZXJJZGxlIiwiX3Jlc3RhcnRRdWV1ZSIsInByZWNoZWNrIiwiY29udGV4dCIsIndhaXREcmFpbiIsInRlc3QiLCJuciIsInZhbHVlIiwic2VjdGlvbiIsIm9wdGlvbiIsIkFycmF5IiwiaXNBcnJheSIsInRvTG93ZXJDYXNlIiwicHJvdG90eXBlIiwiY2FsbCIsIm1hdGNoIiwiZW5hYmxlQ29tcHJlc3Npb24iLCJfc29ja2V0T25EYXRhIiwid2luZG93IiwiV29ya2VyIiwiX2NvbXByZXNzaW9uV29ya2VyIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsIm9ubWVzc2FnZSIsInBvc3RNZXNzYWdlIiwiY3JlYXRlTWVzc2FnZSIsImluZmxhdGVkUmVhZHkiLCJkZWZsYXRlZFJlYWR5IiwiQ29tcHJlc3Npb24iLCJpbmZsYXRlIiwidGVybWluYXRlIiwiZGVmbGF0ZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi9zcmMvaW1hcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9wT3IgfSBmcm9tICdyYW1kYSdcbmltcG9ydCBUQ1BTb2NrZXQgZnJvbSAnZW1haWxqcy10Y3Atc29ja2V0J1xuaW1wb3J0IHsgdG9UeXBlZEFycmF5LCBmcm9tVHlwZWRBcnJheSB9IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0IHsgY29tcGlsZXIgfSBmcm9tICdlbWFpbGpzLWltYXAtaGFuZGxlcidcbmltcG9ydCB7IHBhcnNlckhlbHBlciB9IGZyb20gJy4vcGFyc2VyLWhlbHBlcidcbmltcG9ydCBDb21wcmVzc2lvbiBmcm9tICcuL2NvbXByZXNzaW9uJ1xuaW1wb3J0IENvbXByZXNzaW9uQmxvYiBmcm9tICcuLi9yZXMvY29tcHJlc3Npb24ud29ya2VyLmJsb2InXG5pbXBvcnQgeyBpbWFwQ29tbWFuZENoYW5uZWwgfSBmcm9tICcuL2RpYWdub3N0aWNzLWNoYW5uZWwnO1xuXG4vL1xuLy8gY29uc3RhbnRzIHVzZWQgZm9yIGNvbW11bmljYXRpb24gd2l0aCB0aGUgd29ya2VyXG4vL1xuY29uc3QgTUVTU0FHRV9JTklUSUFMSVpFX1dPUktFUiA9ICdzdGFydCdcbmNvbnN0IE1FU1NBR0VfSU5GTEFURSA9ICdpbmZsYXRlJ1xuY29uc3QgTUVTU0FHRV9JTkZMQVRFRF9EQVRBX1JFQURZID0gJ2luZmxhdGVkX3JlYWR5J1xuY29uc3QgTUVTU0FHRV9ERUZMQVRFID0gJ2RlZmxhdGUnXG5jb25zdCBNRVNTQUdFX0RFRkxBVEVEX0RBVEFfUkVBRFkgPSAnZGVmbGF0ZWRfcmVhZHknXG5cbmNvbnN0IEVPTCA9ICdcXHJcXG4nXG5jb25zdCBMSU5FX0ZFRUQgPSAxMFxuY29uc3QgQ0FSUklBR0VfUkVUVVJOID0gMTNcbmNvbnN0IExFRlRfQ1VSTFlfQlJBQ0tFVCA9IDEyM1xuY29uc3QgUklHSFRfQ1VSTFlfQlJBQ0tFVCA9IDEyNVxuXG5jb25zdCBBU0NJSV9QTFVTID0gNDNcblxuLy8gU3RhdGUgdHJhY2tpbmcgd2hlbiBjb25zdHJ1Y3RpbmcgYW4gSU1BUCBjb21tYW5kIGZyb20gYnVmZmVycy5cbmNvbnN0IEJVRkZFUl9TVEFURV9MSVRFUkFMID0gJ2xpdGVyYWwnXG5jb25zdCBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMSA9ICdsaXRlcmFsX2xlbmd0aF8xJ1xuY29uc3QgQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzIgPSAnbGl0ZXJhbF9sZW5ndGhfMidcbmNvbnN0IEJVRkZFUl9TVEFURV9ERUZBVUxUID0gJ2RlZmF1bHQnXG5cbi8qKlxuICogSG93IG11Y2ggdGltZSB0byB3YWl0IHNpbmNlIHRoZSBsYXN0IHJlc3BvbnNlIHVudGlsIHRoZSBjb25uZWN0aW9uIGlzIGNvbnNpZGVyZWQgaWRsaW5nXG4gKi9cbmNvbnN0IFRJTUVPVVRfRU5URVJfSURMRSA9IDEwMDBcblxuLyoqXG4gKiBMb3dlciBCb3VuZCBmb3Igc29ja2V0IHRpbWVvdXQgdG8gd2FpdCBzaW5jZSB0aGUgbGFzdCBkYXRhIHdhcyB3cml0dGVuIHRvIGEgc29ja2V0XG4gKi9cbmNvbnN0IFRJTUVPVVRfU09DS0VUX0xPV0VSX0JPVU5EID0gNjAwMDBcblxuLyoqXG4gKiBNdWx0aXBsaWVyIGZvciBzb2NrZXQgdGltZW91dDpcbiAqXG4gKiBXZSBhc3N1bWUgYXQgbGVhc3QgYSBHUFJTIGNvbm5lY3Rpb24gd2l0aCAxMTUga2IvcyA9IDE0LDM3NSBrQi9zIHRvcHMsIHNvIDEwIEtCL3MgdG8gYmUgb25cbiAqIHRoZSBzYWZlIHNpZGUuIFdlIGNhbiB0aW1lb3V0IGFmdGVyIGEgbG93ZXIgYm91bmQgb2YgMTBzICsgKG4gS0IgLyAxMCBLQi9zKS4gQSAxIE1CIG1lc3NhZ2VcbiAqIHVwbG9hZCB3b3VsZCBiZSAxMTAgc2Vjb25kcyB0byB3YWl0IGZvciB0aGUgdGltZW91dC4gMTAgS0IvcyA9PT0gMC4xIHMvQlxuICovXG5jb25zdCBUSU1FT1VUX1NPQ0tFVF9NVUxUSVBMSUVSID0gMC4xXG5cbi8qKlxuICogQ3JlYXRlcyBhIGNvbm5lY3Rpb24gb2JqZWN0IHRvIGFuIElNQVAgc2VydmVyLiBDYWxsIGBjb25uZWN0YCBtZXRob2QgdG8gaW5pdGl0YXRlXG4gKiB0aGUgYWN0dWFsIGNvbm5lY3Rpb24sIHRoZSBjb25zdHJ1Y3RvciBvbmx5IGRlZmluZXMgdGhlIHByb3BlcnRpZXMgYnV0IGRvZXMgbm90IGFjdHVhbGx5IGNvbm5lY3QuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtob3N0PSdsb2NhbGhvc3QnXSBIb3N0bmFtZSB0byBjb25lbmN0IHRvXG4gKiBAcGFyYW0ge051bWJlcn0gW3BvcnQ9MTQzXSBQb3J0IG51bWJlciB0byBjb25uZWN0IHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0XG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydF0gU2V0IHRvIHRydWUsIHRvIHVzZSBlbmNyeXB0ZWQgY29ubmVjdGlvblxuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLmNvbXByZXNzaW9uV29ya2VyUGF0aF0gb2ZmbG9hZHMgZGUtL2NvbXByZXNzaW9uIGNvbXB1dGF0aW9uIHRvIGEgd2ViIHdvcmtlciwgdGhpcyBpcyB0aGUgcGF0aCB0byB0aGUgYnJvd3NlcmlmaWVkIGVtYWlsanMtY29tcHJlc3Nvci13b3JrZXIuanNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW1hcCB7XG4gIGNvbnN0cnVjdG9yIChob3N0LCBwb3J0LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLnRpbWVvdXRFbnRlcklkbGUgPSBUSU1FT1VUX0VOVEVSX0lETEVcbiAgICB0aGlzLnRpbWVvdXRTb2NrZXRMb3dlckJvdW5kID0gVElNRU9VVF9TT0NLRVRfTE9XRVJfQk9VTkRcbiAgICB0aGlzLnRpbWVvdXRTb2NrZXRNdWx0aXBsaWVyID0gVElNRU9VVF9TT0NLRVRfTVVMVElQTElFUlxuXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuXG4gICAgdGhpcy5wb3J0ID0gcG9ydCB8fCAodGhpcy5vcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydCA/IDk5MyA6IDE0MylcbiAgICB0aGlzLmhvc3QgPSBob3N0IHx8ICdsb2NhbGhvc3QnXG5cbiAgICAvLyBVc2UgYSBUTFMgY29ubmVjdGlvbi4gUG9ydCA5OTMgYWxzbyBmb3JjZXMgVExTLlxuICAgIHRoaXMub3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnQgPSAndXNlU2VjdXJlVHJhbnNwb3J0JyBpbiB0aGlzLm9wdGlvbnMgPyAhIXRoaXMub3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnQgOiB0aGlzLnBvcnQgPT09IDk5M1xuXG4gICAgdGhpcy5zZWN1cmVNb2RlID0gISF0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0IC8vIERvZXMgdGhlIGNvbm5lY3Rpb24gdXNlIFNTTC9UTFNcblxuICAgIHRoaXMuX2Nvbm5lY3Rpb25SZWFkeSA9IGZhbHNlIC8vIElzIHRoZSBjb25lY3Rpb24gZXN0YWJsaXNoZWQgYW5kIGdyZWV0aW5nIGlzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlclxuXG4gICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWQgPSB7fSAvLyBHbG9iYWwgaGFuZGxlcnMgZm9yIHVucmVsYXRlZCByZXNwb25zZXMgKEVYUFVOR0UsIEVYSVNUUyBldGMuKVxuXG4gICAgdGhpcy5fY2xpZW50UXVldWUgPSBbXSAvLyBRdWV1ZSBvZiBvdXRnb2luZyBjb21tYW5kc1xuICAgIHRoaXMuX2NhblNlbmQgPSBmYWxzZSAvLyBJcyBpdCBPSyB0byBzZW5kIHNvbWV0aGluZyB0byB0aGUgc2VydmVyXG4gICAgdGhpcy5fdGFnQ291bnRlciA9IDAgLy8gQ291bnRlciB0byBhbGxvdyB1bmlxdWV1ZSBpbWFwIHRhZ3NcbiAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IGZhbHNlIC8vIEN1cnJlbnQgY29tbWFuZCB0aGF0IGlzIHdhaXRpbmcgZm9yIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuXG4gICAgdGhpcy5faWRsZVRpbWVyID0gZmFsc2UgLy8gVGltZXIgd2FpdGluZyB0byBlbnRlciBpZGxlXG4gICAgdGhpcy5fc29ja2V0VGltZW91dFRpbWVyID0gZmFsc2UgLy8gVGltZXIgd2FpdGluZyB0byBkZWNsYXJlIHRoZSBzb2NrZXQgZGVhZCBzdGFydGluZyBmcm9tIHRoZSBsYXN0IHdyaXRlXG5cbiAgICB0aGlzLmNvbXByZXNzZWQgPSBmYWxzZSAvLyBJcyB0aGUgY29ubmVjdGlvbiBjb21wcmVzc2VkIGFuZCBuZWVkcyBpbmZsYXRpbmcvZGVmbGF0aW5nXG5cbiAgICAvL1xuICAgIC8vIEhFTFBFUlNcbiAgICAvL1xuXG4gICAgLy8gQXMgdGhlIHNlcnZlciBzZW5kcyBkYXRhIGluIGNodW5rcywgaXQgbmVlZHMgdG8gYmUgc3BsaXQgaW50byBzZXBhcmF0ZSBsaW5lcy4gSGVscHMgcGFyc2luZyB0aGUgaW5wdXQuXG4gICAgdGhpcy5faW5jb21pbmdCdWZmZXJzID0gW11cbiAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgdGhpcy5fbGl0ZXJhbFJlbWFpbmluZyA9IDBcblxuICAgIC8vXG4gICAgLy8gRXZlbnQgcGxhY2Vob2xkZXJzLCBtYXkgYmUgb3ZlcnJpZGVuIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zXG4gICAgLy9cbiAgICB0aGlzLm9uY2VydCA9IG51bGxcbiAgICB0aGlzLm9uZXJyb3IgPSBudWxsIC8vIElycmVjb3ZlcmFibGUgZXJyb3Igb2NjdXJyZWQuIENvbm5lY3Rpb24gdG8gdGhlIHNlcnZlciB3aWxsIGJlIGNsb3NlZCBhdXRvbWF0aWNhbGx5LlxuICAgIHRoaXMub25yZWFkeSA9IG51bGwgLy8gVGhlIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlciBoYXMgYmVlbiBlc3RhYmxpc2hlZCBhbmQgZ3JlZXRpbmcgaXMgcmVjZWl2ZWRcbiAgICB0aGlzLm9uaWRsZSA9IG51bGwgLy8gVGhlcmUgYXJlIG5vIG1vcmUgY29tbWFuZHMgdG8gcHJvY2Vzc1xuICB9XG5cbiAgLy8gUFVCTElDIE1FVEhPRFNcblxuICAvKipcbiAgICogSW5pdGlhdGUgYSBjb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIuIFdhaXQgZm9yIG9ucmVhZHkgZXZlbnRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFNvY2tldFxuICAgKiAgICAgVEVTVElORyBPTkxZISBUaGUgVENQU29ja2V0IGhhcyBhIHByZXR0eSBub25zZW5zaWNhbCBjb252ZW5pZW5jZSBjb25zdHJ1Y3RvcixcbiAgICogICAgIHdoaWNoIG1ha2VzIGl0IGhhcmQgdG8gbW9jay4gRm9yIGRlcGVuZGVuY3ktaW5qZWN0aW9uIHB1cnBvc2VzLCB3ZSB1c2UgdGhlXG4gICAqICAgICBTb2NrZXQgcGFyYW1ldGVyIHRvIHBhc3MgaW4gYSBtb2NrIFNvY2tldCBpbXBsZW1lbnRhdGlvbi4gU2hvdWxkIGJlIGxlZnQgYmxhbmtcbiAgICogICAgIGluIHByb2R1Y3Rpb24gdXNlIVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiBzb2NrZXQgaXMgb3BlbmVkXG4gICAqL1xuICBjb25uZWN0IChTb2NrZXQgPSBUQ1BTb2NrZXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5zb2NrZXQgPSBTb2NrZXQub3Blbih0aGlzLmhvc3QsIHRoaXMucG9ydCwge1xuICAgICAgICBiaW5hcnlUeXBlOiAnYXJyYXlidWZmZXInLFxuICAgICAgICB1c2VTZWN1cmVUcmFuc3BvcnQ6IHRoaXMuc2VjdXJlTW9kZSxcbiAgICAgICAgY2E6IHRoaXMub3B0aW9ucy5jYVxuICAgICAgfSlcblxuICAgICAgaW1hcENvbW1hbmRDaGFubmVsLnB1Ymxpc2goe1xuICAgICAgICB0eXBlOiAnQ09OTkVDVCcsXG4gICAgICAgIGhvc3Q6IHRoaXMuaG9zdCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBhbGxvd3MgY2VydGlmaWNhdGUgaGFuZGxpbmcgZm9yIHBsYXRmb3JtIHcvbyBuYXRpdmUgdGxzIHN1cHBvcnRcbiAgICAgIC8vIG9uY2VydCBpcyBub24gc3RhbmRhcmQgc28gc2V0dGluZyBpdCBtaWdodCB0aHJvdyBpZiB0aGUgc29ja2V0IG9iamVjdCBpcyBpbW11dGFibGVcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuc29ja2V0Lm9uY2VydCA9IChjZXJ0KSA9PiB7IHRoaXMub25jZXJ0ICYmIHRoaXMub25jZXJ0KGNlcnQpIH1cbiAgICAgIH0gY2F0Y2ggKEUpIHsgfVxuXG4gICAgICAvLyBDb25uZWN0aW9uIGNsb3NpbmcgdW5leHBlY3RlZCBpcyBhbiBlcnJvclxuICAgICAgdGhpcy5zb2NrZXQub25jbG9zZSA9ICgpID0+IHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCdTb2NrZXQgY2xvc2VkIHVuZXhwZWN0ZWRseSEnKSlcbiAgICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IChldnQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLl9vbkRhdGEoZXZ0KVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICB0aGlzLl9vbkVycm9yKGVycilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBpZiBhbiBlcnJvciBoYXBwZW5zIGR1cmluZyBjcmVhdGUgdGltZSwgcmVqZWN0IHRoZSBwcm9taXNlXG4gICAgICB0aGlzLnNvY2tldC5vbmVycm9yID0gKGUpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignQ291bGQgbm90IG9wZW4gc29ja2V0OiAnICsgZS5kYXRhLm1lc3NhZ2UpKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICAgIC8vIHVzZSBwcm9wZXIgXCJpcnJlY292ZXJhYmxlIGVycm9yLCB0ZWFyIGRvd24gZXZlcnl0aGluZ1wiLWhhbmRsZXIgb25seSBhZnRlciBzb2NrZXQgaXMgb3BlblxuICAgICAgICB0aGlzLnNvY2tldC5vbmVycm9yID0gKGUpID0+IHRoaXMuX29uRXJyb3IoZSlcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlclxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiB0aGUgc29ja2V0IGlzIGNsb3NlZFxuICAgKi9cbiAgY2xvc2UgKGVycm9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB2YXIgdGVhckRvd24gPSAoKSA9PiB7XG4gICAgICAgIC8vIGZ1bGZpbGwgcGVuZGluZyBwcm9taXNlc1xuICAgICAgICB0aGlzLl9jbGllbnRRdWV1ZS5mb3JFYWNoKGNtZCA9PiBjbWQuY2FsbGJhY2soZXJyb3IpKVxuICAgICAgICBpZiAodGhpcy5fY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZC5jYWxsYmFjayhlcnJvcilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NsaWVudFF1ZXVlID0gW11cbiAgICAgICAgdGhpcy5fY3VycmVudENvbW1hbmQgPSBmYWxzZVxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZXIpXG4gICAgICAgIHRoaXMuX2lkbGVUaW1lciA9IG51bGxcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fc29ja2V0VGltZW91dFRpbWVyKVxuICAgICAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBudWxsXG5cbiAgICAgICAgaWYgKHRoaXMuc29ja2V0KSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnNcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSBudWxsXG4gICAgICAgICAgdGhpcy5zb2NrZXQub25jbG9zZSA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmRhdGEgPSBudWxsXG4gICAgICAgICAgdGhpcy5zb2NrZXQub25lcnJvciA9IG51bGxcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5zb2NrZXQub25jZXJ0ID0gbnVsbFxuICAgICAgICAgIH0gY2F0Y2ggKEUpIHsgfVxuXG4gICAgICAgICAgdGhpcy5zb2NrZXQgPSBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBpbWFwQ29tbWFuZENoYW5uZWwucHVibGlzaCh7XG4gICAgICAgICAgdHlwZTogJ0NMT1NFJyxcbiAgICAgICAgICBob3N0OiB0aGlzLmhvc3QsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc29sdmUoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9kaXNhYmxlQ29tcHJlc3Npb24oKVxuXG4gICAgICBpZiAoIXRoaXMuc29ja2V0IHx8IHRoaXMuc29ja2V0LnJlYWR5U3RhdGUgIT09ICdvcGVuJykge1xuICAgICAgICByZXR1cm4gdGVhckRvd24oKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gdGhpcy5zb2NrZXQub25lcnJvciA9IHRlYXJEb3duIC8vIHdlIGRvbid0IHJlYWxseSBjYXJlIGFib3V0IHRoZSBlcnJvciBoZXJlXG4gICAgICB0aGlzLnNvY2tldC5jbG9zZSgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIExPR09VVCB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBVc2UgaXMgZGlzY291cmFnZWQhXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIGNvbm5lY3Rpb24gaXMgY2xvc2VkIGJ5IHNlcnZlci5cbiAgICovXG4gIGxvZ291dCAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSB0aGlzLnNvY2tldC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCdDbGllbnQgbG9nZ2luZyBvdXQnKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbnF1ZXVlQ29tbWFuZCgnTE9HT1VUJylcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBUTFMgaGFuZHNoYWtlXG4gICAqL1xuICB1cGdyYWRlICgpIHtcbiAgICB0aGlzLnNlY3VyZU1vZGUgPSB0cnVlXG4gICAgdGhpcy5zb2NrZXQudXBncmFkZVRvU2VjdXJlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgYSBjb21tYW5kIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlci5cbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbWFpbGpzL2VtYWlsanMtaW1hcC1oYW5kbGVyIGZvciByZXF1ZXN0IHN0cnVjdHVyZS5cbiAgICogRG8gbm90IHByb3ZpZGUgYSB0YWcgcHJvcGVydHksIGl0IHdpbGwgYmUgc2V0IGJ5IHRoZSBxdWV1ZSBtYW5hZ2VyLlxuICAgKlxuICAgKiBUbyBjYXRjaCB1bnRhZ2dlZCByZXNwb25zZXMgdXNlIGFjY2VwdFVudGFnZ2VkIHByb3BlcnR5LiBGb3IgZXhhbXBsZSwgaWZcbiAgICogdGhlIHZhbHVlIGZvciBpdCBpcyAnRkVUQ0gnIHRoZW4gdGhlIHJlcG9uc2UgaW5jbHVkZXMgJ3BheWxvYWQuRkVUQ0gnIHByb3BlcnR5XG4gICAqIHRoYXQgaXMgYW4gYXJyYXkgaW5jbHVkaW5nIGFsbCBsaXN0ZWQgKiBGRVRDSCByZXNwb25zZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IFN0cnVjdHVyZWQgcmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheX0gYWNjZXB0VW50YWdnZWQgYSBsaXN0IG9mIHVudGFnZ2VkIHJlc3BvbnNlcyB0aGF0IHdpbGwgYmUgaW5jbHVkZWQgaW4gJ3BheWxvYWQnIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgZGF0YSBmb3IgdGhlIGNvbW1hbmQgcGF5bG9hZFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkXG4gICAqL1xuICBlbnF1ZXVlQ29tbWFuZCAocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXF1ZXN0ID0ge1xuICAgICAgICBjb21tYW5kOiByZXF1ZXN0XG4gICAgICB9XG4gICAgfVxuXG4gICAgYWNjZXB0VW50YWdnZWQgPSBbXS5jb25jYXQoYWNjZXB0VW50YWdnZWQgfHwgW10pLm1hcCgodW50YWdnZWQpID0+ICh1bnRhZ2dlZCB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcblxuICAgIHZhciB0YWcgPSAnVycgKyAoKyt0aGlzLl90YWdDb3VudGVyKVxuICAgIHJlcXVlc3QudGFnID0gdGFnXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIHRhZzogdGFnLFxuICAgICAgICByZXF1ZXN0OiByZXF1ZXN0LFxuICAgICAgICBwYXlsb2FkOiBhY2NlcHRVbnRhZ2dlZC5sZW5ndGggPyB7fSA6IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsbGJhY2s6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzRXJyb3IocmVzcG9uc2UpKSB7XG4gICAgICAgICAgICAvLyBhZGQgY29tbWFuZCBhbmQgYXR0cmlidXRlcyBmb3IgbW9yZSBjbHVlIHdoYXQgZmFpbGVkXG4gICAgICAgICAgICByZXNwb25zZS5jb21tYW5kID0gcmVxdWVzdC5jb21tYW5kXG4gICAgICAgICAgICBpZiAocmVxdWVzdC5jb21tYW5kICE9PSAnbG9naW4nKSB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmF0dHJpYnV0ZXMgPSByZXF1ZXN0LmF0dHJpYnV0ZXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgfSBlbHNlIGlmIChbJ05PJywgJ0JBRCddLmluZGV4T2YocHJvcE9yKCcnLCAnY29tbWFuZCcsIHJlc3BvbnNlKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSkgPj0gMCkge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKHJlc3BvbnNlLmh1bWFuUmVhZGFibGUgfHwgJ0Vycm9yJylcbiAgICAgICAgICAgIC8vIGFkZCBjb21tYW5kIGFuZCBhdHRyaWJ1dGVzIGZvciBtb3JlIGNsdWUgd2hhdCBmYWlsZWRcbiAgICAgICAgICAgIGVycm9yLmNvbW1hbmQgPSByZXF1ZXN0LmNvbW1hbmRcbiAgICAgICAgICAgIGVycm9yLnJlc3BvbnNlQ29tbWFuZCA9IHJlc3BvbnNlLmNvbW1hbmRcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmNvbW1hbmQgIT09ICdsb2dpbicpIHtcbiAgICAgICAgICAgICAgZXJyb3IuYXR0cmlidXRlcyA9IHJlcXVlc3QuYXR0cmlidXRlc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmNvZGUpIHtcbiAgICAgICAgICAgICAgZXJyb3IuY29kZSA9IHJlc3BvbnNlLmNvZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBhcHBseSBhbnkgYWRkaXRpb25hbCBvcHRpb25zIHRvIHRoZSBjb21tYW5kXG4gICAgICBPYmplY3Qua2V5cyhvcHRpb25zIHx8IHt9KS5mb3JFYWNoKChrZXkpID0+IHsgZGF0YVtrZXldID0gb3B0aW9uc1trZXldIH0pXG5cbiAgICAgIGFjY2VwdFVudGFnZ2VkLmZvckVhY2goKGNvbW1hbmQpID0+IHsgZGF0YS5wYXlsb2FkW2NvbW1hbmRdID0gW10gfSlcblxuICAgICAgLy8gaWYgd2UncmUgaW4gcHJpb3JpdHkgbW9kZSAoaS5lLiB3ZSByYW4gY29tbWFuZHMgaW4gYSBwcmVjaGVjayksXG4gICAgICAvLyBxdWV1ZSBhbnkgY29tbWFuZHMgQkVGT1JFIHRoZSBjb21tYW5kIHRoYXQgY29udGlhbmVkIHRoZSBwcmVjaGVjayxcbiAgICAgIC8vIG90aGVyd2lzZSBqdXN0IHF1ZXVlIGNvbW1hbmQgYXMgdXN1YWxcbiAgICAgIHZhciBpbmRleCA9IGRhdGEuY3R4ID8gdGhpcy5fY2xpZW50UXVldWUuaW5kZXhPZihkYXRhLmN0eCkgOiAtMVxuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZGF0YS50YWcgKz0gJy5wJ1xuICAgICAgICBkYXRhLnJlcXVlc3QudGFnICs9ICcucCdcbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUuc3BsaWNlKGluZGV4LCAwLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUucHVzaChkYXRhKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY2FuU2VuZCkge1xuICAgICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gY29tbWFuZHNcbiAgICogQHBhcmFtIGN0eFxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGdldFByZXZpb3VzbHlRdWV1ZWQgKGNvbW1hbmRzLCBjdHgpIHtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gdGhpcy5fY2xpZW50UXVldWUuaW5kZXhPZihjdHgpIC0gMVxuXG4gICAgLy8gc2VhcmNoIGJhY2t3YXJkcyBmb3IgdGhlIGNvbW1hbmRzIGFuZCByZXR1cm4gdGhlIGZpcnN0IGZvdW5kXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoaXNNYXRjaCh0aGlzLl9jbGllbnRRdWV1ZVtpXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NsaWVudFF1ZXVlW2ldXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYWxzbyBjaGVjayBjdXJyZW50IGNvbW1hbmQgaWYgbm8gU0VMRUNUIGlzIHF1ZXVlZFxuICAgIGlmIChpc01hdGNoKHRoaXMuX2N1cnJlbnRDb21tYW5kKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRDb21tYW5kXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgICBmdW5jdGlvbiBpc01hdGNoIChkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSAmJiBkYXRhLnJlcXVlc3QgJiYgY29tbWFuZHMuaW5kZXhPZihkYXRhLnJlcXVlc3QuY29tbWFuZCkgPj0gMFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGRhdGEgdG8gdGhlIFRDUCBzb2NrZXRcbiAgICogQXJtcyBhIHRpbWVvdXQgd2FpdGluZyBmb3IgYSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgUGF5bG9hZFxuICAgKi9cbiAgc2VuZCAoc3RyKSB7XG4gICAgY29uc3QgYnVmZmVyID0gdG9UeXBlZEFycmF5KHN0cikuYnVmZmVyXG4gICAgY29uc3QgdGltZW91dCA9IHRoaXMudGltZW91dFNvY2tldExvd2VyQm91bmQgKyBNYXRoLmZsb29yKGJ1ZmZlci5ieXRlTGVuZ3RoICogdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllcilcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpIC8vIGNsZWFyIHBlbmRpbmcgdGltZW91dHNcbiAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCcgU29ja2V0IHRpbWVkIG91dCEnKSksIHRpbWVvdXQpIC8vIGFybSB0aGUgbmV4dCB0aW1lb3V0XG5cbiAgICBpZiAodGhpcy5jb21wcmVzc2VkKSB7XG4gICAgICB0aGlzLl9zZW5kQ29tcHJlc3NlZChidWZmZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5zb2NrZXQpIHtcbiAgICAgICAgdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ0Vycm9yIDo6IFVuZXhwZWN0ZWQgc29ja2V0IGNsb3NlJykpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNvY2tldC5zZW5kKGJ1ZmZlcilcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igc3Vic2NyaWJlcnMgc28gd2Ugd291bGRuJ3QgcGFyc2UgdGhlIHBheWxvYWQgaWYgbm90IG5lY2Vzc2FyeVxuICAgIGlmIChpbWFwQ29tbWFuZENoYW5uZWwuaGFzU3Vic2NyaWJlcnMoKSkge1xuICAgICAgbGV0IGNvbW1hbmQgPSAnVU5LTk9XTidcblxuICAgICAgLy8gUGFyc2UgY29tbWFuZCB0eXBlIGZyb20gcGF5bG9hZCwgc28gd2Ugd291bGQgcHVibGlzaCBvbmx5IGNvbW1hbmQgdHlwZSB0byBkaWFnbm9zdGljc1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFyc2VkUGF5bG9hZCA9IHBhcnNlckhlbHBlcihzdHIpXG4gICAgICAgIC8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9lbWFpbGpzL2VtYWlsanMtaW1hcC1oYW5kbGVyI3BhcnNlLWltYXAtY29tbWFuZHNcbiAgICAgICAgaWYgKHBhcnNlZFBheWxvYWQuY29tbWFuZCkge1xuICAgICAgICAgIGNvbW1hbmQgPSBwYXJzZWRQYXlsb2FkLmNvbW1hbmRcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBpbWFwQ29tbWFuZENoYW5uZWwucHVibGlzaCh7XG4gICAgICAgIHR5cGU6IGNvbW1hbmQsXG4gICAgICAgIGhvc3Q6IHRoaXMuaG9zdCxcbiAgICAgICAgcGF5bG9hZDogc3RyLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIGdsb2JhbCBoYW5kbGVyIGZvciBhbiB1bnRhZ2dlZCByZXNwb25zZS4gSWYgY3VycmVudGx5IHByb2Nlc3NlZCBjb21tYW5kXG4gICAqIGhhcyBub3QgbGlzdGVkIHVudGFnZ2VkIGNvbW1hbmQgaXQgaXMgZm9yd2FyZGVkIHRvIHRoZSBnbG9iYWwgaGFuZGxlci4gVXNlZnVsXG4gICAqIHdpdGggRVhQVU5HRSwgRVhJU1RTIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbW1hbmQgVW50YWdnZWQgY29tbWFuZCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2Ugb2JqZWN0IGFuZCBjb250aW51ZSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgc2V0SGFuZGxlciAoY29tbWFuZCwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZFtjb21tYW5kLnRvVXBwZXJDYXNlKCkudHJpbSgpXSA9IGNhbGxiYWNrXG4gIH1cblxuICAvLyBJTlRFUk5BTCBFVkVOVFNcblxuICAvKipcbiAgICogRXJyb3IgaGFuZGxlciBmb3IgdGhlIHNvY2tldFxuICAgKlxuICAgKiBAZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZ0IEV2ZW50IG9iamVjdC4gU2VlIGV2dC5kYXRhIGZvciB0aGUgZXJyb3JcbiAgICovXG4gIF9vbkVycm9yIChldnQpIHtcbiAgICB2YXIgZXJyb3JcbiAgICBpZiAodGhpcy5pc0Vycm9yKGV2dCkpIHtcbiAgICAgIGVycm9yID0gZXZ0XG4gICAgfSBlbHNlIGlmIChldnQgJiYgdGhpcy5pc0Vycm9yKGV2dC5kYXRhKSkge1xuICAgICAgZXJyb3IgPSBldnQuZGF0YVxuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcigoZXZ0ICYmIGV2dC5kYXRhICYmIGV2dC5kYXRhLm1lc3NhZ2UpIHx8IGV2dC5kYXRhIHx8IGV2dCB8fCAnRXJyb3InKVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yKVxuXG4gICAgLy8gYWx3YXlzIGNhbGwgb25lcnJvciBjYWxsYmFjaywgbm8gbWF0dGVyIGlmIGNsb3NlKCkgc3VjY2VlZHMgb3IgZmFpbHNcbiAgICB0aGlzLmNsb3NlKGVycm9yKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMub25lcnJvciAmJiB0aGlzLm9uZXJyb3IoZXJyb3IpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcihlcnJvcilcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgZm9yIGluY29taW5nIGRhdGEgZnJvbSB0aGUgc2VydmVyLiBUaGUgZGF0YSBpcyBzZW50IGluIGFyYml0cmFyeVxuICAgKiBjaHVua3MgYW5kIGNhbid0IGJlIHVzZWQgZGlyZWN0bHkgc28gdGhpcyBmdW5jdGlvbiBtYWtlcyBzdXJlIHRoZSBkYXRhXG4gICAqIGlzIHNwbGl0IGludG8gY29tcGxldGUgbGluZXMgYmVmb3JlIHRoZSBkYXRhIGlzIHBhc3NlZCB0byB0aGUgY29tbWFuZFxuICAgKiBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2dFxuICAgKi9cbiAgX29uRGF0YSAoZXZ0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcikgLy8gcmVzZXQgdGhlIHRpbWVvdXQgb24gZWFjaCBkYXRhIHBhY2tldFxuICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLnRpbWVvdXRTb2NrZXRMb3dlckJvdW5kICsgTWF0aC5mbG9vcig0MDk2ICogdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllcikgLy8gbWF4IHBhY2tldCBzaXplIGlzIDQwOTYgYnl0ZXNcbiAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCcgU29ja2V0IHRpbWVkIG91dCEnKSksIHRpbWVvdXQpXG5cbiAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShldnQuZGF0YSkpIC8vIGFwcGVuZCB0byB0aGUgaW5jb21pbmcgYnVmZmVyXG4gICAgdGhpcy5fcGFyc2VJbmNvbWluZ0NvbW1hbmRzKHRoaXMuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpKSAvLyBDb25zdW1lIHRoZSBpbmNvbWluZyBidWZmZXJcbiAgfVxuXG4gICogX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlciAoKSB7XG4gICAgbGV0IGJ1ZiA9IHRoaXMuX2luY29taW5nQnVmZmVyc1t0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoIC0gMV0gfHwgW11cbiAgICBsZXQgaSA9IDBcblxuICAgIC8vIGxvb3AgaW52YXJpYW50OlxuICAgIC8vICAgdGhpcy5faW5jb21pbmdCdWZmZXJzIHN0YXJ0cyB3aXRoIHRoZSBiZWdpbm5pbmcgb2YgaW5jb21pbmcgY29tbWFuZC5cbiAgICAvLyAgIGJ1ZiBpcyBzaG9ydGhhbmQgZm9yIGxhc3QgZWxlbWVudCBvZiB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMuXG4gICAgLy8gICBidWZbMC4uaS0xXSBpcyBwYXJ0IG9mIGluY29taW5nIGNvbW1hbmQuXG4gICAgd2hpbGUgKGkgPCBidWYubGVuZ3RoKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuX2J1ZmZlclN0YXRlKSB7XG4gICAgICAgIGNhc2UgQlVGRkVSX1NUQVRFX0xJVEVSQUw6XG4gICAgICAgICAgY29uc3QgZGlmZiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBpLCB0aGlzLl9saXRlcmFsUmVtYWluaW5nKVxuICAgICAgICAgIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgLT0gZGlmZlxuICAgICAgICAgIGkgKz0gZGlmZlxuICAgICAgICAgIGlmICh0aGlzLl9saXRlcmFsUmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgY2FzZSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMjpcbiAgICAgICAgICBpZiAoaSA8IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChidWZbaV0gPT09IENBUlJJQUdFX1JFVFVSTikge1xuICAgICAgICAgICAgICB0aGlzLl9saXRlcmFsUmVtYWluaW5nID0gTnVtYmVyKGZyb21UeXBlZEFycmF5KHRoaXMuX2xlbmd0aEJ1ZmZlcikpICsgMiAvLyBmb3IgQ1JMRlxuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9MSVRFUkFMXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGVuZ3RoQnVmZmVyXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgY2FzZSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMTpcbiAgICAgICAgICBjb25zdCBzdGFydCA9IGlcbiAgICAgICAgICB3aGlsZSAoaSA8IGJ1Zi5sZW5ndGggJiYgYnVmW2ldID49IDQ4ICYmIGJ1ZltpXSA8PSA1NykgeyAvLyBkaWdpdHNcbiAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhcnQgIT09IGkpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdCA9IGJ1Zi5zdWJhcnJheShzdGFydCwgaSlcbiAgICAgICAgICAgIGNvbnN0IHByZXZCdWYgPSB0aGlzLl9sZW5ndGhCdWZmZXJcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHByZXZCdWYubGVuZ3RoICsgbGF0ZXN0Lmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlci5zZXQocHJldkJ1ZilcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlci5zZXQobGF0ZXN0LCBwcmV2QnVmLmxlbmd0aClcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPCBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGVuZ3RoQnVmZmVyLmxlbmd0aCA+IDAgJiYgYnVmW2ldID09PSBSSUdIVF9DVVJMWV9CUkFDS0VUKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzJcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9sZW5ndGhCdWZmZXJcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBmaW5kIGxpdGVyYWwgbGVuZ3RoXG4gICAgICAgICAgY29uc3QgbGVmdElkeCA9IGJ1Zi5pbmRleE9mKExFRlRfQ1VSTFlfQlJBQ0tFVCwgaSlcbiAgICAgICAgICBpZiAobGVmdElkeCA+IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBsZWZ0T2ZMZWZ0Q3VybHkgPSBuZXcgVWludDhBcnJheShidWYuYnVmZmVyLCBpLCBsZWZ0SWR4IC0gaSlcbiAgICAgICAgICAgIGlmIChsZWZ0T2ZMZWZ0Q3VybHkuaW5kZXhPZihMSU5FX0ZFRUQpID09PSAtMSkge1xuICAgICAgICAgICAgICBpID0gbGVmdElkeCArIDFcbiAgICAgICAgICAgICAgdGhpcy5fbGVuZ3RoQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoMClcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGZpbmQgZW5kIG9mIGNvbW1hbmRcbiAgICAgICAgICBjb25zdCBMRmlkeCA9IGJ1Zi5pbmRleE9mKExJTkVfRkVFRCwgaSlcbiAgICAgICAgICBpZiAoTEZpZHggPiAtMSkge1xuICAgICAgICAgICAgaWYgKExGaWR4IDwgYnVmLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzW3RoaXMuX2luY29taW5nQnVmZmVycy5sZW5ndGggLSAxXSA9IG5ldyBVaW50OEFycmF5KGJ1Zi5idWZmZXIsIDAsIExGaWR4ICsgMSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmRMZW5ndGggPSB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMucmVkdWNlKChwcmV2LCBjdXJyKSA9PiBwcmV2ICsgY3Vyci5sZW5ndGgsIDApIC0gMiAvLyAyIGZvciBDUkxGXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gbmV3IFVpbnQ4QXJyYXkoY29tbWFuZExlbmd0aClcbiAgICAgICAgICAgIGxldCBpbmRleCA9IDBcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBsZXQgdWludDhBcnJheSA9IHRoaXMuX2luY29taW5nQnVmZmVycy5zaGlmdCgpXG5cbiAgICAgICAgICAgICAgY29uc3QgcmVtYWluaW5nTGVuZ3RoID0gY29tbWFuZExlbmd0aCAtIGluZGV4XG4gICAgICAgICAgICAgIGlmICh1aW50OEFycmF5Lmxlbmd0aCA+IHJlbWFpbmluZ0xlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2Vzc0xlbmd0aCA9IHVpbnQ4QXJyYXkubGVuZ3RoIC0gcmVtYWluaW5nTGVuZ3RoXG4gICAgICAgICAgICAgICAgdWludDhBcnJheSA9IHVpbnQ4QXJyYXkuc3ViYXJyYXkoMCwgLWV4Y2Vzc0xlbmd0aClcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzID0gW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29tbWFuZC5zZXQodWludDhBcnJheSwgaW5kZXgpXG4gICAgICAgICAgICAgIGluZGV4ICs9IHVpbnQ4QXJyYXkubGVuZ3RoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5aWVsZCBjb21tYW5kXG4gICAgICAgICAgICBpZiAoTEZpZHggPCBidWYubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICBidWYgPSBuZXcgVWludDhBcnJheShidWYuc3ViYXJyYXkoTEZpZHggKyAxKSlcbiAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzLnB1c2goYnVmKVxuICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHRpbWVvdXQgd2hlbiBhbiBlbnRpcmUgY29tbWFuZCBoYXMgYXJyaXZlZFxuICAgICAgICAgICAgICAvLyBhbmQgbm90IHdhaXRpbmcgb24gbW9yZSBkYXRhIGZvciBuZXh0IGNvbW1hbmRcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcilcbiAgICAgICAgICAgICAgdGhpcy5fc29ja2V0VGltZW91dFRpbWVyID0gbnVsbFxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFBSSVZBVEUgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYSBjb21tYW5kIGZyb20gdGhlIHF1ZXVlLiBUaGUgY29tbWFuZCBpcyBwYXJzZWQgYW5kIGZlZWRlZCB0byBhIGhhbmRsZXJcbiAgICovXG4gIF9wYXJzZUluY29taW5nQ29tbWFuZHMgKGNvbW1hbmRzKSB7XG4gICAgZm9yICh2YXIgY29tbWFuZCBvZiBjb21tYW5kcykge1xuICAgICAgdGhpcy5fY2xlYXJJZGxlKClcblxuICAgICAgLypcbiAgICAgICAqIFRoZSBcIitcIi10YWdnZWQgcmVzcG9uc2UgaXMgYSBzcGVjaWFsIGNhc2U6XG4gICAgICAgKiBFaXRoZXIgdGhlIHNlcnZlciBjYW4gYXNrcyBmb3IgdGhlIG5leHQgY2h1bmsgb2YgZGF0YSwgZS5nLiBmb3IgdGhlIEFVVEhFTlRJQ0FURSBjb21tYW5kLlxuICAgICAgICpcbiAgICAgICAqIE9yIHRoZXJlIHdhcyBhbiBlcnJvciBpbiB0aGUgWE9BVVRIMiBhdXRoZW50aWNhdGlvbiwgZm9yIHdoaWNoIFNBU0wgaW5pdGlhbCBjbGllbnQgcmVzcG9uc2UgZXh0ZW5zaW9uXG4gICAgICAgKiBkaWN0YXRlcyB0aGUgY2xpZW50IHNlbmRzIGFuIGVtcHR5IEVPTCByZXNwb25zZSB0byB0aGUgY2hhbGxlbmdlIGNvbnRhaW5pbmcgdGhlIGVycm9yIG1lc3NhZ2UuXG4gICAgICAgKlxuICAgICAgICogRGV0YWlscyBvbiBcIitcIi10YWdnZWQgcmVzcG9uc2U6XG4gICAgICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tMi4yLjFcbiAgICAgICAqL1xuICAgICAgLy9cbiAgICAgIGlmIChjb21tYW5kWzBdID09PSBBU0NJSV9QTFVTKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLmxlbmd0aCkge1xuICAgICAgICAgIC8vIGZlZWQgdGhlIG5leHQgY2h1bmsgb2YgZGF0YVxuICAgICAgICAgIHZhciBjaHVuayA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEuc2hpZnQoKVxuICAgICAgICAgIGNodW5rICs9ICghdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5sZW5ndGggPyBFT0wgOiAnJykgLy8gRU9MIGlmIHRoZXJlJ3Mgbm90aGluZyBtb3JlIHRvIHNlbmRcbiAgICAgICAgICB0aGlzLnNlbmQoY2h1bmspXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fY3VycmVudENvbW1hbmQuZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUpIHtcbiAgICAgICAgICB0aGlzLnNlbmQoRU9MKSAvLyBYT0FVVEgyIGVtcHR5IHJlc3BvbnNlLCBlcnJvciB3aWxsIGJlIHJlcG9ydGVkIHdoZW4gc2VydmVyIGNvbnRpbnVlcyB3aXRoIE5PIHJlc3BvbnNlXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHJlc3BvbnNlXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2YWx1ZUFzU3RyaW5nID0gdGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdCAmJiB0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0LnZhbHVlQXNTdHJpbmdcbiAgICAgICAgcmVzcG9uc2UgPSBwYXJzZXJIZWxwZXIoY29tbWFuZCwgeyB2YWx1ZUFzU3RyaW5nIH0pXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTOicsICgpID0+IGNvbXBpbGVyKHJlc3BvbnNlLCBmYWxzZSwgdHJ1ZSkpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGUsICdFcnJvciBwYXJzaW5nIGltYXAgY29tbWFuZCEnLCB7IHJlc3BvbnNlLCBjb21tYW5kOiBmcm9tVHlwZWRBcnJheShjb21tYW5kKSB9KVxuICAgICAgICByZXR1cm4gdGhpcy5fb25FcnJvcihlKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpXG4gICAgICB0aGlzLl9oYW5kbGVSZXNwb25zZShyZXNwb25zZSlcblxuICAgICAgLy8gZmlyc3QgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyLCBjb25uZWN0aW9uIGlzIG5vdyB1c2FibGVcbiAgICAgIGlmICghdGhpcy5fY29ubmVjdGlvblJlYWR5KSB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb25SZWFkeSA9IHRydWVcbiAgICAgICAgdGhpcy5vbnJlYWR5ICYmIHRoaXMub25yZWFkeSgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZlZWRzIGEgcGFyc2VkIHJlc3BvbnNlIG9iamVjdCB0byBhbiBhcHByb3ByaWF0ZSBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgY29tbWFuZCBvYmplY3RcbiAgICovXG4gIF9oYW5kbGVSZXNwb25zZSAocmVzcG9uc2UpIHtcbiAgICB2YXIgY29tbWFuZCA9IHByb3BPcignJywgJ2NvbW1hbmQnLCByZXNwb25zZSkudG9VcHBlckNhc2UoKS50cmltKClcblxuICAgIGlmICghdGhpcy5fY3VycmVudENvbW1hbmQpIHtcbiAgICAgIC8vIHVuc29saWNpdGVkIHVudGFnZ2VkIHJlc3BvbnNlXG4gICAgICBpZiAocmVzcG9uc2UudGFnID09PSAnKicgJiYgY29tbWFuZCBpbiB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZCkge1xuICAgICAgICB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZFtjb21tYW5kXShyZXNwb25zZSlcbiAgICAgICAgdGhpcy5fY2FuU2VuZCA9IHRydWVcbiAgICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZCAmJiByZXNwb25zZS50YWcgPT09ICcqJyAmJiBjb21tYW5kIGluIHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWQpIHtcbiAgICAgIC8vIGV4cGVjdGVkIHVudGFnZ2VkIHJlc3BvbnNlXG4gICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkW2NvbW1hbmRdLnB1c2gocmVzcG9uc2UpXG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS50YWcgPT09ICcqJyAmJiBjb21tYW5kIGluIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkKSB7XG4gICAgICAvLyB1bmV4cGVjdGVkIHVudGFnZ2VkIHJlc3BvbnNlXG4gICAgICB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZFtjb21tYW5kXShyZXNwb25zZSlcbiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnRhZyA9PT0gdGhpcy5fY3VycmVudENvbW1hbmQudGFnKSB7XG4gICAgICAvLyB0YWdnZWQgcmVzcG9uc2VcbiAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkICYmIE9iamVjdC5rZXlzKHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWQpLmxlbmd0aCkge1xuICAgICAgICByZXNwb25zZS5wYXlsb2FkID0gdGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZFxuICAgICAgfVxuICAgICAgdGhpcy5fY3VycmVudENvbW1hbmQuY2FsbGJhY2socmVzcG9uc2UpXG4gICAgICB0aGlzLl9jYW5TZW5kID0gdHJ1ZVxuICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyBhIGNvbW1hbmQgZnJvbSBjbGllbnQgcXVldWUgdG8gdGhlIHNlcnZlci5cbiAgICovXG4gIF9zZW5kUmVxdWVzdCAoKSB7XG4gICAgaWYgKCF0aGlzLl9jbGllbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9lbnRlcklkbGUoKVxuICAgIH1cbiAgICB0aGlzLl9jbGVhcklkbGUoKVxuXG4gICAgLy8gYW4gb3BlcmF0aW9uIHdhcyBtYWRlIGluIHRoZSBwcmVjaGVjaywgbm8gbmVlZCB0byByZXN0YXJ0IHRoZSBxdWV1ZSBtYW51YWxseVxuICAgIHRoaXMuX3Jlc3RhcnRRdWV1ZSA9IGZhbHNlXG5cbiAgICB2YXIgY29tbWFuZCA9IHRoaXMuX2NsaWVudFF1ZXVlWzBdXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kLnByZWNoZWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyByZW1lbWJlciB0aGUgY29udGV4dFxuICAgICAgdmFyIGNvbnRleHQgPSBjb21tYW5kXG4gICAgICB2YXIgcHJlY2hlY2sgPSBjb250ZXh0LnByZWNoZWNrXG4gICAgICBkZWxldGUgY29udGV4dC5wcmVjaGVja1xuXG4gICAgICAvLyB3ZSBuZWVkIHRvIHJlc3RhcnQgdGhlIHF1ZXVlIGhhbmRsaW5nIGlmIG5vIG9wZXJhdGlvbiB3YXMgbWFkZSBpbiB0aGUgcHJlY2hlY2tcbiAgICAgIHRoaXMuX3Jlc3RhcnRRdWV1ZSA9IHRydWVcblxuICAgICAgLy8gaW52b2tlIHRoZSBwcmVjaGVjayBjb21tYW5kIGFuZCByZXN1bWUgbm9ybWFsIG9wZXJhdGlvbiBhZnRlciB0aGUgcHJvbWlzZSByZXNvbHZlc1xuICAgICAgcHJlY2hlY2soY29udGV4dCkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIHdlJ3JlIGRvbmUgd2l0aCB0aGUgcHJlY2hlY2tcbiAgICAgICAgaWYgKHRoaXMuX3Jlc3RhcnRRdWV1ZSkge1xuICAgICAgICAgIC8vIHdlIG5lZWQgdG8gcmVzdGFydCB0aGUgcXVldWUgaGFuZGxpbmdcbiAgICAgICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpXG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgLy8gcHJlY2hlY2sgZmFpbGVkLCBzbyB3ZSByZW1vdmUgdGhlIGluaXRpYWwgY29tbWFuZFxuICAgICAgICAvLyBmcm9tIHRoZSBxdWV1ZSwgaW52b2tlIGl0cyBjYWxsYmFjayBhbmQgcmVzdW1lIG5vcm1hbCBvcGVyYXRpb25cbiAgICAgICAgbGV0IGNtZFxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2NsaWVudFF1ZXVlLmluZGV4T2YoY29udGV4dClcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjbWQgPSB0aGlzLl9jbGllbnRRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpWzBdXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNtZCAmJiBjbWQuY2FsbGJhY2spIHtcbiAgICAgICAgICBjbWQuY2FsbGJhY2soZXJyKVxuICAgICAgICAgIHRoaXMuX2NhblNlbmQgPSB0cnVlXG4gICAgICAgICAgdGhpcy5fcGFyc2VJbmNvbWluZ0NvbW1hbmRzKHRoaXMuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpKSAvLyBDb25zdW1lIHRoZSByZXN0IG9mIHRoZSBpbmNvbWluZyBidWZmZXJcbiAgICAgICAgICB0aGlzLl9zZW5kUmVxdWVzdCgpIC8vIGNvbnRpbnVlIHNlbmRpbmdcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuX2NhblNlbmQgPSBmYWxzZVxuICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kID0gdGhpcy5fY2xpZW50UXVldWUuc2hpZnQoKVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEgPSBjb21waWxlcih0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0LCB0cnVlKVxuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0M6JywgKCkgPT4gY29tcGlsZXIodGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdCwgZmFsc2UsIHRydWUpKSAvLyBleGNsdWRlcyBwYXNzd29yZHMgZXRjLlxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGUsICdFcnJvciBjb21waWxpbmcgaW1hcCBjb21tYW5kIScsIHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QpXG4gICAgICByZXR1cm4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ0Vycm9yIGNvbXBpbGluZyBpbWFwIGNvbW1hbmQhJykpXG4gICAgfVxuXG4gICAgdmFyIGRhdGEgPSB0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLnNoaWZ0KClcblxuICAgIHRoaXMuc2VuZChkYXRhICsgKCF0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLmxlbmd0aCA/IEVPTCA6ICcnKSlcbiAgICByZXR1cm4gdGhpcy53YWl0RHJhaW5cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBvbmlkbGUsIG5vdGluZyB0byBkbyBjdXJyZW50bHlcbiAgICovXG4gIF9lbnRlcklkbGUgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZXIpXG4gICAgdGhpcy5faWRsZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiAodGhpcy5vbmlkbGUgJiYgdGhpcy5vbmlkbGUoKSksIHRoaXMudGltZW91dEVudGVySWRsZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDYW5jZWwgaWRsZSB0aW1lclxuICAgKi9cbiAgX2NsZWFySWRsZSAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lcilcbiAgICB0aGlzLl9pZGxlVGltZXIgPSBudWxsXG4gIH1cblxuICAvKipcbiAgICogTWV0aG9kIHByb2Nlc3NlcyBhIHJlc3BvbnNlIGludG8gYW4gZWFzaWVyIHRvIGhhbmRsZSBmb3JtYXQuXG4gICAqIEFkZCB1bnRhZ2dlZCBudW1iZXJlZCByZXNwb25zZXMgKGUuZy4gRkVUQ0gpIGludG8gYSBuaWNlbHkgZmVhc2libGUgZm9ybVxuICAgKiBDaGVja3MgaWYgYSByZXNwb25zZSBpbmNsdWRlcyBvcHRpb25hbCByZXNwb25zZSBjb2Rlc1xuICAgKiBhbmQgY29waWVzIHRoZXNlIGludG8gc2VwYXJhdGUgcHJvcGVydGllcy4gRm9yIGV4YW1wbGUgdGhlXG4gICAqIGZvbGxvd2luZyByZXNwb25zZSBpbmNsdWRlcyBhIGNhcGFiaWxpdHkgbGlzdGluZyBhbmQgYSBodW1hblxuICAgKiByZWFkYWJsZSBtZXNzYWdlOlxuICAgKlxuICAgKiAgICAgKiBPSyBbQ0FQQUJJTElUWSBJRCBOQU1FU1BBQ0VdIEFsbCByZWFkeVxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBhZGRzIGEgJ2NhcGFiaWxpdHknIHByb3BlcnR5IHdpdGggYW4gYXJyYXkgdmFsdWUgWydJRCcsICdOQU1FU1BBQ0UnXVxuICAgKiB0byB0aGUgcmVzcG9uc2Ugb2JqZWN0LiBBZGRpdGlvbmFsbHkgJ0FsbCByZWFkeScgaXMgYWRkZWQgYXMgJ2h1bWFuUmVhZGFibGUnIHByb3BlcnR5LlxuICAgKlxuICAgKiBTZWUgcG9zc2libGVtIElNQVAgUmVzcG9uc2UgQ29kZXMgYXQgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzU1MzBcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCByZXNwb25zZSBvYmplY3RcbiAgICovXG4gIF9wcm9jZXNzUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IHByb3BPcignJywgJ2NvbW1hbmQnLCByZXNwb25zZSkudG9VcHBlckNhc2UoKS50cmltKClcblxuICAgIC8vIG5vIGF0dHJpYnV0ZXNcbiAgICBpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5hdHRyaWJ1dGVzIHx8ICFyZXNwb25zZS5hdHRyaWJ1dGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gdW50YWdnZWQgcmVzcG9uc2VzIHcvIHNlcXVlbmNlIG51bWJlcnNcbiAgICBpZiAocmVzcG9uc2UudGFnID09PSAnKicgJiYgL15cXGQrJC8udGVzdChyZXNwb25zZS5jb21tYW5kKSAmJiByZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnR5cGUgPT09ICdBVE9NJykge1xuICAgICAgcmVzcG9uc2UubnIgPSBOdW1iZXIocmVzcG9uc2UuY29tbWFuZClcbiAgICAgIHJlc3BvbnNlLmNvbW1hbmQgPSAocmVzcG9uc2UuYXR0cmlidXRlcy5zaGlmdCgpLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvVXBwZXJDYXNlKCkudHJpbSgpXG4gICAgfVxuXG4gICAgLy8gbm8gb3B0aW9uYWwgcmVzcG9uc2UgY29kZVxuICAgIGlmIChbJ09LJywgJ05PJywgJ0JBRCcsICdCWUUnLCAnUFJFQVVUSCddLmluZGV4T2YoY29tbWFuZCkgPCAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBJZiBsYXN0IGVsZW1lbnQgb2YgdGhlIHJlc3BvbnNlIGlzIFRFWFQgdGhlbiB0aGlzIGlzIGZvciBodW1hbnNcbiAgICBpZiAocmVzcG9uc2UuYXR0cmlidXRlc1tyZXNwb25zZS5hdHRyaWJ1dGVzLmxlbmd0aCAtIDFdLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgcmVzcG9uc2UuaHVtYW5SZWFkYWJsZSA9IHJlc3BvbnNlLmF0dHJpYnV0ZXNbcmVzcG9uc2UuYXR0cmlidXRlcy5sZW5ndGggLSAxXS52YWx1ZVxuICAgIH1cblxuICAgIC8vIFBhcnNlIGFuZCBmb3JtYXQgQVRPTSB2YWx1ZXNcbiAgICBpZiAocmVzcG9uc2UuYXR0cmlidXRlc1swXS50eXBlID09PSAnQVRPTScgJiYgcmVzcG9uc2UuYXR0cmlidXRlc1swXS5zZWN0aW9uKSB7XG4gICAgICBjb25zdCBvcHRpb24gPSByZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnNlY3Rpb24ubWFwKChrZXkpID0+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGtleS5tYXAoKGtleSkgPT4gKGtleS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50cmltKCkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIChrZXkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKS50cmltKClcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY29uc3Qga2V5ID0gb3B0aW9uLnNoaWZ0KClcbiAgICAgIHJlc3BvbnNlLmNvZGUgPSBrZXlcblxuICAgICAgaWYgKG9wdGlvbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmVzcG9uc2Vba2V5LnRvTG93ZXJDYXNlKCldID0gb3B0aW9uWzBdXG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgIHJlc3BvbnNlW2tleS50b0xvd2VyQ2FzZSgpXSA9IG9wdGlvblxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBpcyBhbiBFcnJvciBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVmFsdWUgdG8gYmUgY2hlY2tlZFxuICAgKiBAcmV0dXJuIHtCb29sZWFufSByZXR1cm5zIHRydWUgaWYgdGhlIHZhbHVlIGlzIGFuIEVycm9yXG4gICAqL1xuICBpc0Vycm9yICh2YWx1ZSkge1xuICAgIHJldHVybiAhIU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkubWF0Y2goL0Vycm9yXFxdJC8pXG4gIH1cblxuICAvLyBDT01QUkVTU0lPTiBSRUxBVEVEIE1FVEhPRFNcblxuICAvKipcbiAgICogU2V0cyB1cCBkZWZsYXRlL2luZmxhdGUgZm9yIHRoZSBJT1xuICAgKi9cbiAgZW5hYmxlQ29tcHJlc3Npb24gKCkge1xuICAgIHRoaXMuX3NvY2tldE9uRGF0YSA9IHRoaXMuc29ja2V0Lm9uZGF0YVxuICAgIHRoaXMuY29tcHJlc3NlZCA9IHRydWVcblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuV29ya2VyKSB7XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlciA9IG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbQ29tcHJlc3Npb25CbG9iXSkpKVxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIub25tZXNzYWdlID0gKGUpID0+IHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBlLmRhdGEubWVzc2FnZVxuICAgICAgICB2YXIgZGF0YSA9IGUuZGF0YS5idWZmZXJcblxuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UpIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfSU5GTEFURURfREFUQV9SRUFEWTpcbiAgICAgICAgICAgIHRoaXMuX3NvY2tldE9uRGF0YSh7IGRhdGEgfSlcbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfREVGTEFURURfREFUQV9SRUFEWTpcbiAgICAgICAgICAgIHRoaXMud2FpdERyYWluID0gdGhpcy5zb2NrZXQuc2VuZChkYXRhKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5vbmVycm9yID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ0Vycm9yIGhhbmRsaW5nIGNvbXByZXNzaW9uIHdlYiB3b3JrZXI6ICcgKyBlLm1lc3NhZ2UpKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKE1FU1NBR0VfSU5JVElBTElaRV9XT1JLRVIpKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmZsYXRlZFJlYWR5ID0gKGJ1ZmZlcikgPT4geyB0aGlzLl9zb2NrZXRPbkRhdGEoeyBkYXRhOiBidWZmZXIgfSkgfVxuICAgICAgY29uc3QgZGVmbGF0ZWRSZWFkeSA9IChidWZmZXIpID0+IHsgdGhpcy53YWl0RHJhaW4gPSB0aGlzLnNvY2tldC5zZW5kKGJ1ZmZlcikgfVxuICAgICAgdGhpcy5fY29tcHJlc3Npb24gPSBuZXcgQ29tcHJlc3Npb24oaW5mbGF0ZWRSZWFkeSwgZGVmbGF0ZWRSZWFkeSlcbiAgICB9XG5cbiAgICAvLyBvdmVycmlkZSBkYXRhIGhhbmRsZXIsIGRlY29tcHJlc3MgaW5jb21pbmcgZGF0YVxuICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IChldnQpID0+IHtcbiAgICAgIGlmICghdGhpcy5jb21wcmVzc2VkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY29tcHJlc3Npb25Xb3JrZXIpIHtcbiAgICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIucG9zdE1lc3NhZ2UoY3JlYXRlTWVzc2FnZShNRVNTQUdFX0lORkxBVEUsIGV2dC5kYXRhKSwgW2V2dC5kYXRhXSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzaW9uLmluZmxhdGUoZXZ0LmRhdGEpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuZG9lcyBhbnkgY2hhbmdlcyByZWxhdGVkIHRvIGNvbXByZXNzaW9uLiBUaGlzIG9ubHkgYmUgY2FsbGVkIHdoZW4gY2xvc2luZyB0aGUgY29ubmVjdGlvblxuICAgKi9cbiAgX2Rpc2FibGVDb21wcmVzc2lvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmNvbXByZXNzZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuY29tcHJlc3NlZCA9IGZhbHNlXG4gICAgdGhpcy5zb2NrZXQub25kYXRhID0gdGhpcy5fc29ja2V0T25EYXRhXG4gICAgdGhpcy5fc29ja2V0T25EYXRhID0gbnVsbFxuXG4gICAgaWYgKHRoaXMuX2NvbXByZXNzaW9uV29ya2VyKSB7XG4gICAgICAvLyB0ZXJtaW5hdGUgdGhlIHdvcmtlclxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIudGVybWluYXRlKClcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPdXRnb2luZyBwYXlsb2FkIG5lZWRzIHRvIGJlIGNvbXByZXNzZWQgYW5kIHNlbnQgdG8gc29ja2V0XG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGJ1ZmZlciBPdXRnb2luZyB1bmNvbXByZXNzZWQgYXJyYXlidWZmZXJcbiAgICovXG4gIF9zZW5kQ29tcHJlc3NlZCAoYnVmZmVyKSB7XG4gICAgLy8gZGVmbGF0ZVxuICAgIGlmICh0aGlzLl9jb21wcmVzc2lvbldvcmtlcikge1xuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIucG9zdE1lc3NhZ2UoY3JlYXRlTWVzc2FnZShNRVNTQUdFX0RFRkxBVEUsIGJ1ZmZlciksIFtidWZmZXJdKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbi5kZWZsYXRlKGJ1ZmZlcilcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgY3JlYXRlTWVzc2FnZSA9IChtZXNzYWdlLCBidWZmZXIpID0+ICh7IG1lc3NhZ2UsIGJ1ZmZlciB9KVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxNQUFBLEdBQUFDLE9BQUE7QUFDQSxJQUFBQyxpQkFBQSxHQUFBQyxzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUcsT0FBQSxHQUFBSCxPQUFBO0FBQ0EsSUFBQUksbUJBQUEsR0FBQUosT0FBQTtBQUNBLElBQUFLLGFBQUEsR0FBQUwsT0FBQTtBQUNBLElBQUFNLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUYsT0FBQTtBQUVBLElBQUFPLG1CQUFBLEdBQUFQLE9BQUE7QUFBMkQsU0FBQUUsdUJBQUFNLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxLQUFBRSxPQUFBLEVBQUFGLEdBQUE7QUFBQTtBQUFBLE1BQUFHLGVBQUE7QUFFM0Q7QUFDQTtBQUNBO0FBQ0EsTUFBTUMseUJBQXlCLEdBQUcsT0FBTztBQUN6QyxNQUFNQyxlQUFlLEdBQUcsU0FBUztBQUNqQyxNQUFNQywyQkFBMkIsR0FBRyxnQkFBZ0I7QUFDcEQsTUFBTUMsZUFBZSxHQUFHLFNBQVM7QUFDakMs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