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
        type: 'connect',
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
          type: 'close',
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
    _diagnosticsChannel.imapCommandChannel.publish({
      type: 'send',
      host: this.host,
      payload: str
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmFtZGEiLCJyZXF1aXJlIiwiX2VtYWlsanNUY3BTb2NrZXQiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2NvbW1vbiIsIl9lbWFpbGpzSW1hcEhhbmRsZXIiLCJfcGFyc2VySGVscGVyIiwiX2NvbXByZXNzaW9uIiwiX2RpYWdub3N0aWNzQ2hhbm5lbCIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiQ29tcHJlc3Npb25CbG9iIiwiTUVTU0FHRV9JTklUSUFMSVpFX1dPUktFUiIsIk1FU1NBR0VfSU5GTEFURSIsIk1FU1NBR0VfSU5GTEFURURfREFUQV9SRUFEWSIsIk1FU1NBR0VfREVGTEFURSIsIk1FU1NBR0VfREVGTEFURURfREFUQV9SRUFEWSIsIkVPTCIsIkxJTkVfRkVFRCIsIkNBUlJJQUdFX1JFVFVSTiIsIkxFRlRfQ1VSTFlfQlJBQ0tFVCIsIlJJR0hUX0NVUkxZX0JSQUNLRVQiLCJBU0NJSV9QTFVTIiwiQlVGRkVSX1NUQVRFX0xJVEVSQUwiLCJCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMSIsIkJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yIiwiQlVGRkVSX1NUQVRFX0RFRkFVTFQiLCJUSU1FT1VUX0VOVEVSX0lETEUiLCJUSU1FT1VUX1NPQ0tFVF9MT1dFUl9CT1VORCIsIlRJTUVPVVRfU09DS0VUX01VTFRJUExJRVIiLCJJbWFwIiwiY29uc3RydWN0b3IiLCJob3N0IiwicG9ydCIsIm9wdGlvbnMiLCJ0aW1lb3V0RW50ZXJJZGxlIiwidGltZW91dFNvY2tldExvd2VyQm91bmQiLCJ0aW1lb3V0U29ja2V0TXVsdGlwbGllciIsInVzZVNlY3VyZVRyYW5zcG9ydCIsInNlY3VyZU1vZGUiLCJfY29ubmVjdGlvblJlYWR5IiwiX2dsb2JhbEFjY2VwdFVudGFnZ2VkIiwiX2NsaWVudFF1ZXVlIiwiX2NhblNlbmQiLCJfdGFnQ291bnRlciIsIl9jdXJyZW50Q29tbWFuZCIsIl9pZGxlVGltZXIiLCJfc29ja2V0VGltZW91dFRpbWVyIiwiY29tcHJlc3NlZCIsIl9pbmNvbWluZ0J1ZmZlcnMiLCJfYnVmZmVyU3RhdGUiLCJfbGl0ZXJhbFJlbWFpbmluZyIsIm9uY2VydCIsIm9uZXJyb3IiLCJvbnJlYWR5Iiwib25pZGxlIiwiY29ubmVjdCIsIlNvY2tldCIsIlRDUFNvY2tldCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic29ja2V0Iiwib3BlbiIsImJpbmFyeVR5cGUiLCJjYSIsImltYXBDb21tYW5kQ2hhbm5lbCIsInB1Ymxpc2giLCJ0eXBlIiwiY2VydCIsIkUiLCJvbmNsb3NlIiwiX29uRXJyb3IiLCJFcnJvciIsIm9uZGF0YSIsImV2dCIsIl9vbkRhdGEiLCJlcnIiLCJlIiwiZGF0YSIsIm1lc3NhZ2UiLCJvbm9wZW4iLCJjbG9zZSIsImVycm9yIiwidGVhckRvd24iLCJmb3JFYWNoIiwiY21kIiwiY2FsbGJhY2siLCJjbGVhclRpbWVvdXQiLCJfZGlzYWJsZUNvbXByZXNzaW9uIiwicmVhZHlTdGF0ZSIsImxvZ291dCIsInRoZW4iLCJjYXRjaCIsImVucXVldWVDb21tYW5kIiwidXBncmFkZSIsInVwZ3JhZGVUb1NlY3VyZSIsInJlcXVlc3QiLCJhY2NlcHRVbnRhZ2dlZCIsImNvbW1hbmQiLCJjb25jYXQiLCJtYXAiLCJ1bnRhZ2dlZCIsInRvU3RyaW5nIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGFnIiwicGF5bG9hZCIsImxlbmd0aCIsInVuZGVmaW5lZCIsInJlc3BvbnNlIiwiaXNFcnJvciIsImF0dHJpYnV0ZXMiLCJpbmRleE9mIiwicHJvcE9yIiwiaHVtYW5SZWFkYWJsZSIsInJlc3BvbnNlQ29tbWFuZCIsImNvZGUiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwiaW5kZXgiLCJjdHgiLCJzcGxpY2UiLCJwdXNoIiwiX3NlbmRSZXF1ZXN0IiwiZ2V0UHJldmlvdXNseVF1ZXVlZCIsImNvbW1hbmRzIiwic3RhcnRJbmRleCIsImkiLCJpc01hdGNoIiwic2VuZCIsInN0ciIsImJ1ZmZlciIsInRvVHlwZWRBcnJheSIsInRpbWVvdXQiLCJNYXRoIiwiZmxvb3IiLCJieXRlTGVuZ3RoIiwic2V0VGltZW91dCIsIl9zZW5kQ29tcHJlc3NlZCIsInNldEhhbmRsZXIiLCJsb2dnZXIiLCJVaW50OEFycmF5IiwiX3BhcnNlSW5jb21pbmdDb21tYW5kcyIsIl9pdGVyYXRlSW5jb21pbmdCdWZmZXIiLCJidWYiLCJkaWZmIiwibWluIiwiTnVtYmVyIiwiZnJvbVR5cGVkQXJyYXkiLCJfbGVuZ3RoQnVmZmVyIiwic3RhcnQiLCJsYXRlc3QiLCJzdWJhcnJheSIsInByZXZCdWYiLCJzZXQiLCJsZWZ0SWR4IiwibGVmdE9mTGVmdEN1cmx5IiwiTEZpZHgiLCJjb21tYW5kTGVuZ3RoIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJ1aW50OEFycmF5Iiwic2hpZnQiLCJyZW1haW5pbmdMZW5ndGgiLCJleGNlc3NMZW5ndGgiLCJfY2xlYXJJZGxlIiwiY2h1bmsiLCJlcnJvclJlc3BvbnNlRXhwZWN0c0VtcHR5TGluZSIsInZhbHVlQXNTdHJpbmciLCJwYXJzZXJIZWxwZXIiLCJkZWJ1ZyIsImNvbXBpbGVyIiwiX3Byb2Nlc3NSZXNwb25zZSIsIl9oYW5kbGVSZXNwb25zZSIsIl9lbnRlcklkbGUiLCJfcmVzdGFydFF1ZXVlIiwicHJlY2hlY2siLCJjb250ZXh0Iiwid2FpdERyYWluIiwidGVzdCIsIm5yIiwidmFsdWUiLCJzZWN0aW9uIiwib3B0aW9uIiwiQXJyYXkiLCJpc0FycmF5IiwidG9Mb3dlckNhc2UiLCJwcm90b3R5cGUiLCJjYWxsIiwibWF0Y2giLCJlbmFibGVDb21wcmVzc2lvbiIsIl9zb2NrZXRPbkRhdGEiLCJ3aW5kb3ciLCJXb3JrZXIiLCJfY29tcHJlc3Npb25Xb3JrZXIiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwib25tZXNzYWdlIiwicG9zdE1lc3NhZ2UiLCJjcmVhdGVNZXNzYWdlIiwiaW5mbGF0ZWRSZWFkeSIsImRlZmxhdGVkUmVhZHkiLCJDb21wcmVzc2lvbiIsImluZmxhdGUiLCJ0ZXJtaW5hdGUiLCJkZWZsYXRlIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uL3NyYy9pbWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHByb3BPciB9IGZyb20gJ3JhbWRhJ1xuaW1wb3J0IFRDUFNvY2tldCBmcm9tICdlbWFpbGpzLXRjcC1zb2NrZXQnXG5pbXBvcnQgeyB0b1R5cGVkQXJyYXksIGZyb21UeXBlZEFycmF5IH0gZnJvbSAnLi9jb21tb24nXG5pbXBvcnQgeyBjb21waWxlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IHsgcGFyc2VySGVscGVyIH0gZnJvbSAnLi9wYXJzZXItaGVscGVyJ1xuaW1wb3J0IENvbXByZXNzaW9uIGZyb20gJy4vY29tcHJlc3Npb24nXG5pbXBvcnQgQ29tcHJlc3Npb25CbG9iIGZyb20gJy4uL3Jlcy9jb21wcmVzc2lvbi53b3JrZXIuYmxvYidcbmltcG9ydCB7IGltYXBDb21tYW5kQ2hhbm5lbCB9IGZyb20gJy4vZGlhZ25vc3RpY3MtY2hhbm5lbCc7XG5cbi8vXG4vLyBjb25zdGFudHMgdXNlZCBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSB3b3JrZXJcbi8vXG5jb25zdCBNRVNTQUdFX0lOSVRJQUxJWkVfV09SS0VSID0gJ3N0YXJ0J1xuY29uc3QgTUVTU0FHRV9JTkZMQVRFID0gJ2luZmxhdGUnXG5jb25zdCBNRVNTQUdFX0lORkxBVEVEX0RBVEFfUkVBRFkgPSAnaW5mbGF0ZWRfcmVhZHknXG5jb25zdCBNRVNTQUdFX0RFRkxBVEUgPSAnZGVmbGF0ZSdcbmNvbnN0IE1FU1NBR0VfREVGTEFURURfREFUQV9SRUFEWSA9ICdkZWZsYXRlZF9yZWFkeSdcblxuY29uc3QgRU9MID0gJ1xcclxcbidcbmNvbnN0IExJTkVfRkVFRCA9IDEwXG5jb25zdCBDQVJSSUFHRV9SRVRVUk4gPSAxM1xuY29uc3QgTEVGVF9DVVJMWV9CUkFDS0VUID0gMTIzXG5jb25zdCBSSUdIVF9DVVJMWV9CUkFDS0VUID0gMTI1XG5cbmNvbnN0IEFTQ0lJX1BMVVMgPSA0M1xuXG4vLyBTdGF0ZSB0cmFja2luZyB3aGVuIGNvbnN0cnVjdGluZyBhbiBJTUFQIGNvbW1hbmQgZnJvbSBidWZmZXJzLlxuY29uc3QgQlVGRkVSX1NUQVRFX0xJVEVSQUwgPSAnbGl0ZXJhbCdcbmNvbnN0IEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8xID0gJ2xpdGVyYWxfbGVuZ3RoXzEnXG5jb25zdCBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMiA9ICdsaXRlcmFsX2xlbmd0aF8yJ1xuY29uc3QgQlVGRkVSX1NUQVRFX0RFRkFVTFQgPSAnZGVmYXVsdCdcblxuLyoqXG4gKiBIb3cgbXVjaCB0aW1lIHRvIHdhaXQgc2luY2UgdGhlIGxhc3QgcmVzcG9uc2UgdW50aWwgdGhlIGNvbm5lY3Rpb24gaXMgY29uc2lkZXJlZCBpZGxpbmdcbiAqL1xuY29uc3QgVElNRU9VVF9FTlRFUl9JRExFID0gMTAwMFxuXG4vKipcbiAqIExvd2VyIEJvdW5kIGZvciBzb2NrZXQgdGltZW91dCB0byB3YWl0IHNpbmNlIHRoZSBsYXN0IGRhdGEgd2FzIHdyaXR0ZW4gdG8gYSBzb2NrZXRcbiAqL1xuY29uc3QgVElNRU9VVF9TT0NLRVRfTE9XRVJfQk9VTkQgPSA2MDAwMFxuXG4vKipcbiAqIE11bHRpcGxpZXIgZm9yIHNvY2tldCB0aW1lb3V0OlxuICpcbiAqIFdlIGFzc3VtZSBhdCBsZWFzdCBhIEdQUlMgY29ubmVjdGlvbiB3aXRoIDExNSBrYi9zID0gMTQsMzc1IGtCL3MgdG9wcywgc28gMTAgS0IvcyB0byBiZSBvblxuICogdGhlIHNhZmUgc2lkZS4gV2UgY2FuIHRpbWVvdXQgYWZ0ZXIgYSBsb3dlciBib3VuZCBvZiAxMHMgKyAobiBLQiAvIDEwIEtCL3MpLiBBIDEgTUIgbWVzc2FnZVxuICogdXBsb2FkIHdvdWxkIGJlIDExMCBzZWNvbmRzIHRvIHdhaXQgZm9yIHRoZSB0aW1lb3V0LiAxMCBLQi9zID09PSAwLjEgcy9CXG4gKi9cbmNvbnN0IFRJTUVPVVRfU09DS0VUX01VTFRJUExJRVIgPSAwLjFcblxuLyoqXG4gKiBDcmVhdGVzIGEgY29ubmVjdGlvbiBvYmplY3QgdG8gYW4gSU1BUCBzZXJ2ZXIuIENhbGwgYGNvbm5lY3RgIG1ldGhvZCB0byBpbml0aXRhdGVcbiAqIHRoZSBhY3R1YWwgY29ubmVjdGlvbiwgdGhlIGNvbnN0cnVjdG9yIG9ubHkgZGVmaW5lcyB0aGUgcHJvcGVydGllcyBidXQgZG9lcyBub3QgYWN0dWFsbHkgY29ubmVjdC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gW2hvc3Q9J2xvY2FsaG9zdCddIEhvc3RuYW1lIHRvIGNvbmVuY3QgdG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBbcG9ydD0xNDNdIFBvcnQgbnVtYmVyIHRvIGNvbm5lY3QgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgb3B0aW9ucyBvYmplY3RcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0XSBTZXQgdG8gdHJ1ZSwgdG8gdXNlIGVuY3J5cHRlZCBjb25uZWN0aW9uXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMuY29tcHJlc3Npb25Xb3JrZXJQYXRoXSBvZmZsb2FkcyBkZS0vY29tcHJlc3Npb24gY29tcHV0YXRpb24gdG8gYSB3ZWIgd29ya2VyLCB0aGlzIGlzIHRoZSBwYXRoIHRvIHRoZSBicm93c2VyaWZpZWQgZW1haWxqcy1jb21wcmVzc29yLXdvcmtlci5qc1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFwIHtcbiAgY29uc3RydWN0b3IgKGhvc3QsIHBvcnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMudGltZW91dEVudGVySWRsZSA9IFRJTUVPVVRfRU5URVJfSURMRVxuICAgIHRoaXMudGltZW91dFNvY2tldExvd2VyQm91bmQgPSBUSU1FT1VUX1NPQ0tFVF9MT1dFUl9CT1VORFxuICAgIHRoaXMudGltZW91dFNvY2tldE11bHRpcGxpZXIgPSBUSU1FT1VUX1NPQ0tFVF9NVUxUSVBMSUVSXG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXG5cbiAgICB0aGlzLnBvcnQgPSBwb3J0IHx8ICh0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0ID8gOTkzIDogMTQzKVxuICAgIHRoaXMuaG9zdCA9IGhvc3QgfHwgJ2xvY2FsaG9zdCdcblxuICAgIC8vIFVzZSBhIFRMUyBjb25uZWN0aW9uLiBQb3J0IDk5MyBhbHNvIGZvcmNlcyBUTFMuXG4gICAgdGhpcy5vcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydCA9ICd1c2VTZWN1cmVUcmFuc3BvcnQnIGluIHRoaXMub3B0aW9ucyA/ICEhdGhpcy5vcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydCA6IHRoaXMucG9ydCA9PT0gOTkzXG5cbiAgICB0aGlzLnNlY3VyZU1vZGUgPSAhIXRoaXMub3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnQgLy8gRG9lcyB0aGUgY29ubmVjdGlvbiB1c2UgU1NML1RMU1xuXG4gICAgdGhpcy5fY29ubmVjdGlvblJlYWR5ID0gZmFsc2UgLy8gSXMgdGhlIGNvbmVjdGlvbiBlc3RhYmxpc2hlZCBhbmQgZ3JlZXRpbmcgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyXG5cbiAgICB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZCA9IHt9IC8vIEdsb2JhbCBoYW5kbGVycyBmb3IgdW5yZWxhdGVkIHJlc3BvbnNlcyAoRVhQVU5HRSwgRVhJU1RTIGV0Yy4pXG5cbiAgICB0aGlzLl9jbGllbnRRdWV1ZSA9IFtdIC8vIFF1ZXVlIG9mIG91dGdvaW5nIGNvbW1hbmRzXG4gICAgdGhpcy5fY2FuU2VuZCA9IGZhbHNlIC8vIElzIGl0IE9LIHRvIHNlbmQgc29tZXRoaW5nIHRvIHRoZSBzZXJ2ZXJcbiAgICB0aGlzLl90YWdDb3VudGVyID0gMCAvLyBDb3VudGVyIHRvIGFsbG93IHVuaXF1ZXVlIGltYXAgdGFnc1xuICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kID0gZmFsc2UgLy8gQ3VycmVudCBjb21tYW5kIHRoYXQgaXMgd2FpdGluZyBmb3IgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXG5cbiAgICB0aGlzLl9pZGxlVGltZXIgPSBmYWxzZSAvLyBUaW1lciB3YWl0aW5nIHRvIGVudGVyIGlkbGVcbiAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBmYWxzZSAvLyBUaW1lciB3YWl0aW5nIHRvIGRlY2xhcmUgdGhlIHNvY2tldCBkZWFkIHN0YXJ0aW5nIGZyb20gdGhlIGxhc3Qgd3JpdGVcblxuICAgIHRoaXMuY29tcHJlc3NlZCA9IGZhbHNlIC8vIElzIHRoZSBjb25uZWN0aW9uIGNvbXByZXNzZWQgYW5kIG5lZWRzIGluZmxhdGluZy9kZWZsYXRpbmdcblxuICAgIC8vXG4gICAgLy8gSEVMUEVSU1xuICAgIC8vXG5cbiAgICAvLyBBcyB0aGUgc2VydmVyIHNlbmRzIGRhdGEgaW4gY2h1bmtzLCBpdCBuZWVkcyB0byBiZSBzcGxpdCBpbnRvIHNlcGFyYXRlIGxpbmVzLiBIZWxwcyBwYXJzaW5nIHRoZSBpbnB1dC5cbiAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMgPSBbXVxuICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX0RFRkFVTFRcbiAgICB0aGlzLl9saXRlcmFsUmVtYWluaW5nID0gMFxuXG4gICAgLy9cbiAgICAvLyBFdmVudCBwbGFjZWhvbGRlcnMsIG1heSBiZSBvdmVycmlkZW4gd2l0aCBjYWxsYmFjayBmdW5jdGlvbnNcbiAgICAvL1xuICAgIHRoaXMub25jZXJ0ID0gbnVsbFxuICAgIHRoaXMub25lcnJvciA9IG51bGwgLy8gSXJyZWNvdmVyYWJsZSBlcnJvciBvY2N1cnJlZC4gQ29ubmVjdGlvbiB0byB0aGUgc2VydmVyIHdpbGwgYmUgY2xvc2VkIGF1dG9tYXRpY2FsbHkuXG4gICAgdGhpcy5vbnJlYWR5ID0gbnVsbCAvLyBUaGUgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyIGhhcyBiZWVuIGVzdGFibGlzaGVkIGFuZCBncmVldGluZyBpcyByZWNlaXZlZFxuICAgIHRoaXMub25pZGxlID0gbnVsbCAvLyBUaGVyZSBhcmUgbm8gbW9yZSBjb21tYW5kcyB0byBwcm9jZXNzXG4gIH1cblxuICAvLyBQVUJMSUMgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlci4gV2FpdCBmb3Igb25yZWFkeSBldmVudFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gU29ja2V0XG4gICAqICAgICBURVNUSU5HIE9OTFkhIFRoZSBUQ1BTb2NrZXQgaGFzIGEgcHJldHR5IG5vbnNlbnNpY2FsIGNvbnZlbmllbmNlIGNvbnN0cnVjdG9yLFxuICAgKiAgICAgd2hpY2ggbWFrZXMgaXQgaGFyZCB0byBtb2NrLiBGb3IgZGVwZW5kZW5jeS1pbmplY3Rpb24gcHVycG9zZXMsIHdlIHVzZSB0aGVcbiAgICogICAgIFNvY2tldCBwYXJhbWV0ZXIgdG8gcGFzcyBpbiBhIG1vY2sgU29ja2V0IGltcGxlbWVudGF0aW9uLiBTaG91bGQgYmUgbGVmdCBibGFua1xuICAgKiAgICAgaW4gcHJvZHVjdGlvbiB1c2UhXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHNvY2tldCBpcyBvcGVuZWRcbiAgICovXG4gIGNvbm5lY3QgKFNvY2tldCA9IFRDUFNvY2tldCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnNvY2tldCA9IFNvY2tldC5vcGVuKHRoaXMuaG9zdCwgdGhpcy5wb3J0LCB7XG4gICAgICAgIGJpbmFyeVR5cGU6ICdhcnJheWJ1ZmZlcicsXG4gICAgICAgIHVzZVNlY3VyZVRyYW5zcG9ydDogdGhpcy5zZWN1cmVNb2RlLFxuICAgICAgICBjYTogdGhpcy5vcHRpb25zLmNhXG4gICAgICB9KVxuXG4gICAgICBpbWFwQ29tbWFuZENoYW5uZWwucHVibGlzaCh7XG4gICAgICAgIHR5cGU6ICdjb25uZWN0JyxcbiAgICAgICAgaG9zdDogdGhpcy5ob3N0LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIGFsbG93cyBjZXJ0aWZpY2F0ZSBoYW5kbGluZyBmb3IgcGxhdGZvcm0gdy9vIG5hdGl2ZSB0bHMgc3VwcG9ydFxuICAgICAgLy8gb25jZXJ0IGlzIG5vbiBzdGFuZGFyZCBzbyBzZXR0aW5nIGl0IG1pZ2h0IHRocm93IGlmIHRoZSBzb2NrZXQgb2JqZWN0IGlzIGltbXV0YWJsZVxuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zb2NrZXQub25jZXJ0ID0gKGNlcnQpID0+IHsgdGhpcy5vbmNlcnQgJiYgdGhpcy5vbmNlcnQoY2VydCkgfVxuICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgIC8vIENvbm5lY3Rpb24gY2xvc2luZyB1bmV4cGVjdGVkIGlzIGFuIGVycm9yXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ1NvY2tldCBjbG9zZWQgdW5leHBlY3RlZGx5IScpKVxuICAgICAgdGhpcy5zb2NrZXQub25kYXRhID0gKGV2dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMuX29uRGF0YShldnQpXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGFuIGVycm9yIGhhcHBlbnMgZHVyaW5nIGNyZWF0ZSB0aW1lLCByZWplY3QgdGhlIHByb21pc2VcbiAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4ge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKCdDb3VsZCBub3Qgb3BlbiBzb2NrZXQ6ICcgKyBlLmRhdGEubWVzc2FnZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgLy8gdXNlIHByb3BlciBcImlycmVjb3ZlcmFibGUgZXJyb3IsIHRlYXIgZG93biBldmVyeXRoaW5nXCItaGFuZGxlciBvbmx5IGFmdGVyIHNvY2tldCBpcyBvcGVuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5fb25FcnJvcihlKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkXG4gICAqL1xuICBjbG9zZSAoZXJyb3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHZhciB0ZWFyRG93biA9ICgpID0+IHtcbiAgICAgICAgLy8gZnVsZmlsbCBwZW5kaW5nIHByb21pc2VzXG4gICAgICAgIHRoaXMuX2NsaWVudFF1ZXVlLmZvckVhY2goY21kID0+IGNtZC5jYWxsYmFjayhlcnJvcikpXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZCkge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmNhbGxiYWNrKGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUgPSBbXVxuICAgICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IGZhbHNlXG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lcilcbiAgICAgICAgdGhpcy5faWRsZVRpbWVyID0gbnVsbFxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpXG4gICAgICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IG51bGxcblxuICAgICAgICBpZiAodGhpcy5zb2NrZXQpIHtcbiAgICAgICAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gbnVsbFxuICAgICAgICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmVycm9yID0gbnVsbFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnNvY2tldC5vbmNlcnQgPSBudWxsXG4gICAgICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgICAgICB0aGlzLnNvY2tldCA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGltYXBDb21tYW5kQ2hhbm5lbC5wdWJsaXNoKHtcbiAgICAgICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgICAgIGhvc3Q6IHRoaXMuaG9zdCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2Rpc2FibGVDb21wcmVzc2lvbigpXG5cbiAgICAgIGlmICghdGhpcy5zb2NrZXQgfHwgdGhpcy5zb2NrZXQucmVhZHlTdGF0ZSAhPT0gJ29wZW4nKSB7XG4gICAgICAgIHJldHVybiB0ZWFyRG93bigpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSB0aGlzLnNvY2tldC5vbmVycm9yID0gdGVhckRvd24gLy8gd2UgZG9uJ3QgcmVhbGx5IGNhcmUgYWJvdXQgdGhlIGVycm9yIGhlcmVcbiAgICAgIHRoaXMuc29ja2V0LmNsb3NlKClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgTE9HT1VUIHRvIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIFVzZSBpcyBkaXNjb3VyYWdlZCFcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gY29ubmVjdGlvbiBpcyBjbG9zZWQgYnkgc2VydmVyLlxuICAgKi9cbiAgbG9nb3V0ICgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5zb2NrZXQub25jbG9zZSA9IHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoJ0NsaWVudCBsb2dnaW5nIG91dCcpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KVxuICAgICAgfVxuXG4gICAgICB0aGlzLmVucXVldWVDb21tYW5kKCdMT0dPVVQnKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGVzIFRMUyBoYW5kc2hha2VcbiAgICovXG4gIHVwZ3JhZGUgKCkge1xuICAgIHRoaXMuc2VjdXJlTW9kZSA9IHRydWVcbiAgICB0aGlzLnNvY2tldC51cGdyYWRlVG9TZWN1cmUoKVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBhIGNvbW1hbmQgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyLlxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VtYWlsanMvZW1haWxqcy1pbWFwLWhhbmRsZXIgZm9yIHJlcXVlc3Qgc3RydWN0dXJlLlxuICAgKiBEbyBub3QgcHJvdmlkZSBhIHRhZyBwcm9wZXJ0eSwgaXQgd2lsbCBiZSBzZXQgYnkgdGhlIHF1ZXVlIG1hbmFnZXIuXG4gICAqXG4gICAqIFRvIGNhdGNoIHVudGFnZ2VkIHJlc3BvbnNlcyB1c2UgYWNjZXB0VW50YWdnZWQgcHJvcGVydHkuIEZvciBleGFtcGxlLCBpZlxuICAgKiB0aGUgdmFsdWUgZm9yIGl0IGlzICdGRVRDSCcgdGhlbiB0aGUgcmVwb25zZSBpbmNsdWRlcyAncGF5bG9hZC5GRVRDSCcgcHJvcGVydHlcbiAgICogdGhhdCBpcyBhbiBhcnJheSBpbmNsdWRpbmcgYWxsIGxpc3RlZCAqIEZFVENIIHJlc3BvbnNlcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3QgU3RydWN0dXJlZCByZXF1ZXN0IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fSBhY2NlcHRVbnRhZ2dlZCBhIGxpc3Qgb2YgdW50YWdnZWQgcmVzcG9uc2VzIHRoYXQgd2lsbCBiZSBpbmNsdWRlZCBpbiAncGF5bG9hZCcgcHJvcGVydHlcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25hbCBkYXRhIGZvciB0aGUgY29tbWFuZCBwYXlsb2FkXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgY29ycmVzcG9uZGluZyByZXNwb25zZSB3YXMgcmVjZWl2ZWRcbiAgICovXG4gIGVucXVldWVDb21tYW5kIChyZXF1ZXN0LCBhY2NlcHRVbnRhZ2dlZCwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgcmVxdWVzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlcXVlc3QgPSB7XG4gICAgICAgIGNvbW1hbmQ6IHJlcXVlc3RcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhY2NlcHRVbnRhZ2dlZCA9IFtdLmNvbmNhdChhY2NlcHRVbnRhZ2dlZCB8fCBbXSkubWFwKCh1bnRhZ2dlZCkgPT4gKHVudGFnZ2VkIHx8ICcnKS50b1N0cmluZygpLnRvVXBwZXJDYXNlKCkudHJpbSgpKVxuXG4gICAgdmFyIHRhZyA9ICdXJyArICgrK3RoaXMuX3RhZ0NvdW50ZXIpXG4gICAgcmVxdWVzdC50YWcgPSB0YWdcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgIHJlcXVlc3Q6IHJlcXVlc3QsXG4gICAgICAgIHBheWxvYWQ6IGFjY2VwdFVudGFnZ2VkLmxlbmd0aCA/IHt9IDogdW5kZWZpbmVkLFxuICAgICAgICBjYWxsYmFjazogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNFcnJvcihyZXNwb25zZSkpIHtcbiAgICAgICAgICAgIC8vIGFkZCBjb21tYW5kIGFuZCBhdHRyaWJ1dGVzIGZvciBtb3JlIGNsdWUgd2hhdCBmYWlsZWRcbiAgICAgICAgICAgIHJlc3BvbnNlLmNvbW1hbmQgPSByZXF1ZXN0LmNvbW1hbmRcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmNvbW1hbmQgIT09ICdsb2dpbicpIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UuYXR0cmlidXRlcyA9IHJlcXVlc3QuYXR0cmlidXRlc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICB9IGVsc2UgaWYgKFsnTk8nLCAnQkFEJ10uaW5kZXhPZihwcm9wT3IoJycsICdjb21tYW5kJywgcmVzcG9uc2UpLnRvVXBwZXJDYXNlKCkudHJpbSgpKSA+PSAwKSB7XG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IocmVzcG9uc2UuaHVtYW5SZWFkYWJsZSB8fCAnRXJyb3InKVxuICAgICAgICAgICAgLy8gYWRkIGNvbW1hbmQgYW5kIGF0dHJpYnV0ZXMgZm9yIG1vcmUgY2x1ZSB3aGF0IGZhaWxlZFxuICAgICAgICAgICAgZXJyb3IuY29tbWFuZCA9IHJlcXVlc3QuY29tbWFuZFxuICAgICAgICAgICAgZXJyb3IucmVzcG9uc2VDb21tYW5kID0gcmVzcG9uc2UuY29tbWFuZFxuICAgICAgICAgICAgaWYgKHJlcXVlc3QuY29tbWFuZCAhPT0gJ2xvZ2luJykge1xuICAgICAgICAgICAgICBlcnJvci5hdHRyaWJ1dGVzID0gcmVxdWVzdC5hdHRyaWJ1dGVzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuY29kZSkge1xuICAgICAgICAgICAgICBlcnJvci5jb2RlID0gcmVzcG9uc2UuY29kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGx5IGFueSBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGNvbW1hbmRcbiAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMgfHwge30pLmZvckVhY2goKGtleSkgPT4geyBkYXRhW2tleV0gPSBvcHRpb25zW2tleV0gfSlcblxuICAgICAgYWNjZXB0VW50YWdnZWQuZm9yRWFjaCgoY29tbWFuZCkgPT4geyBkYXRhLnBheWxvYWRbY29tbWFuZF0gPSBbXSB9KVxuXG4gICAgICAvLyBpZiB3ZSdyZSBpbiBwcmlvcml0eSBtb2RlIChpLmUuIHdlIHJhbiBjb21tYW5kcyBpbiBhIHByZWNoZWNrKSxcbiAgICAgIC8vIHF1ZXVlIGFueSBjb21tYW5kcyBCRUZPUkUgdGhlIGNvbW1hbmQgdGhhdCBjb250aWFuZWQgdGhlIHByZWNoZWNrLFxuICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgcXVldWUgY29tbWFuZCBhcyB1c3VhbFxuICAgICAgdmFyIGluZGV4ID0gZGF0YS5jdHggPyB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGRhdGEuY3R4KSA6IC0xXG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkYXRhLnRhZyArPSAnLnAnXG4gICAgICAgIGRhdGEucmVxdWVzdC50YWcgKz0gJy5wJ1xuICAgICAgICB0aGlzLl9jbGllbnRRdWV1ZS5zcGxpY2UoaW5kZXgsIDAsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jbGllbnRRdWV1ZS5wdXNoKGRhdGEpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jYW5TZW5kKSB7XG4gICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBjb21tYW5kc1xuICAgKiBAcGFyYW0gY3R4XG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0UHJldmlvdXNseVF1ZXVlZCAoY29tbWFuZHMsIGN0eCkge1xuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGN0eCkgLSAxXG5cbiAgICAvLyBzZWFyY2ggYmFja3dhcmRzIGZvciB0aGUgY29tbWFuZHMgYW5kIHJldHVybiB0aGUgZmlyc3QgZm91bmRcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChpc01hdGNoKHRoaXMuX2NsaWVudFF1ZXVlW2ldKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xpZW50UXVldWVbaV1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhbHNvIGNoZWNrIGN1cnJlbnQgY29tbWFuZCBpZiBubyBTRUxFQ1QgaXMgcXVldWVkXG4gICAgaWYgKGlzTWF0Y2godGhpcy5fY3VycmVudENvbW1hbmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3VycmVudENvbW1hbmRcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcblxuICAgIGZ1bmN0aW9uIGlzTWF0Y2ggKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhICYmIGRhdGEucmVxdWVzdCAmJiBjb21tYW5kcy5pbmRleE9mKGRhdGEucmVxdWVzdC5jb21tYW5kKSA+PSAwXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgZGF0YSB0byB0aGUgVENQIHNvY2tldFxuICAgKiBBcm1zIGEgdGltZW91dCB3YWl0aW5nIGZvciBhIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBQYXlsb2FkXG4gICAqL1xuICBzZW5kIChzdHIpIHtcbiAgICBpbWFwQ29tbWFuZENoYW5uZWwucHVibGlzaCh7XG4gICAgICB0eXBlOiAnc2VuZCcsXG4gICAgICBob3N0OiB0aGlzLmhvc3QsXG4gICAgICBwYXlsb2FkOiBzdHIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBidWZmZXIgPSB0b1R5cGVkQXJyYXkoc3RyKS5idWZmZXJcbiAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy50aW1lb3V0U29ja2V0TG93ZXJCb3VuZCArIE1hdGguZmxvb3IoYnVmZmVyLmJ5dGVMZW5ndGggKiB0aGlzLnRpbWVvdXRTb2NrZXRNdWx0aXBsaWVyKVxuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcikgLy8gY2xlYXIgcGVuZGluZyB0aW1lb3V0c1xuICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJyBTb2NrZXQgdGltZWQgb3V0IScpKSwgdGltZW91dCkgLy8gYXJtIHRoZSBuZXh0IHRpbWVvdXRcblxuICAgIGlmICh0aGlzLmNvbXByZXNzZWQpIHtcbiAgICAgIHRoaXMuX3NlbmRDb21wcmVzc2VkKGJ1ZmZlcilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLnNvY2tldCkge1xuICAgICAgICB0aGlzLl9vbkVycm9yKG5ldyBFcnJvcignRXJyb3IgOjogVW5leHBlY3RlZCBzb2NrZXQgY2xvc2UnKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc29ja2V0LnNlbmQoYnVmZmVyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBnbG9iYWwgaGFuZGxlciBmb3IgYW4gdW50YWdnZWQgcmVzcG9uc2UuIElmIGN1cnJlbnRseSBwcm9jZXNzZWQgY29tbWFuZFxuICAgKiBoYXMgbm90IGxpc3RlZCB1bnRhZ2dlZCBjb21tYW5kIGl0IGlzIGZvcndhcmRlZCB0byB0aGUgZ2xvYmFsIGhhbmRsZXIuIFVzZWZ1bFxuICAgKiB3aXRoIEVYUFVOR0UsIEVYSVNUUyBldGMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21tYW5kIFVudGFnZ2VkIGNvbW1hbmQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiB3aXRoIHJlc3BvbnNlIG9iamVjdCBhbmQgY29udGludWUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIHNldEhhbmRsZXIgKGNvbW1hbmQsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWRbY29tbWFuZC50b1VwcGVyQ2FzZSgpLnRyaW0oKV0gPSBjYWxsYmFja1xuICB9XG5cbiAgLy8gSU5URVJOQUwgRVZFTlRTXG5cbiAgLyoqXG4gICAqIEVycm9yIGhhbmRsZXIgZm9yIHRoZSBzb2NrZXRcbiAgICpcbiAgICogQGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2dCBFdmVudCBvYmplY3QuIFNlZSBldnQuZGF0YSBmb3IgdGhlIGVycm9yXG4gICAqL1xuICBfb25FcnJvciAoZXZ0KSB7XG4gICAgdmFyIGVycm9yXG4gICAgaWYgKHRoaXMuaXNFcnJvcihldnQpKSB7XG4gICAgICBlcnJvciA9IGV2dFxuICAgIH0gZWxzZSBpZiAoZXZ0ICYmIHRoaXMuaXNFcnJvcihldnQuZGF0YSkpIHtcbiAgICAgIGVycm9yID0gZXZ0LmRhdGFcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoKGV2dCAmJiBldnQuZGF0YSAmJiBldnQuZGF0YS5tZXNzYWdlKSB8fCBldnQuZGF0YSB8fCBldnQgfHwgJ0Vycm9yJylcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5lcnJvcihlcnJvcilcblxuICAgIC8vIGFsd2F5cyBjYWxsIG9uZXJyb3IgY2FsbGJhY2ssIG5vIG1hdHRlciBpZiBjbG9zZSgpIHN1Y2NlZWRzIG9yIGZhaWxzXG4gICAgdGhpcy5jbG9zZShlcnJvcikudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKGVycm9yKVxuICAgIH0sICgpID0+IHtcbiAgICAgIHRoaXMub25lcnJvciAmJiB0aGlzLm9uZXJyb3IoZXJyb3IpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVyIGZvciBpbmNvbWluZyBkYXRhIGZyb20gdGhlIHNlcnZlci4gVGhlIGRhdGEgaXMgc2VudCBpbiBhcmJpdHJhcnlcbiAgICogY2h1bmtzIGFuZCBjYW4ndCBiZSB1c2VkIGRpcmVjdGx5IHNvIHRoaXMgZnVuY3Rpb24gbWFrZXMgc3VyZSB0aGUgZGF0YVxuICAgKiBpcyBzcGxpdCBpbnRvIGNvbXBsZXRlIGxpbmVzIGJlZm9yZSB0aGUgZGF0YSBpcyBwYXNzZWQgdG8gdGhlIGNvbW1hbmRcbiAgICogaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50fSBldnRcbiAgICovXG4gIF9vbkRhdGEgKGV2dCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpIC8vIHJlc2V0IHRoZSB0aW1lb3V0IG9uIGVhY2ggZGF0YSBwYWNrZXRcbiAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy50aW1lb3V0U29ja2V0TG93ZXJCb3VuZCArIE1hdGguZmxvb3IoNDA5NiAqIHRoaXMudGltZW91dFNvY2tldE11bHRpcGxpZXIpIC8vIG1heCBwYWNrZXQgc2l6ZSBpcyA0MDk2IGJ5dGVzXG4gICAgdGhpcy5fc29ja2V0VGltZW91dFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9vbkVycm9yKG5ldyBFcnJvcignIFNvY2tldCB0aW1lZCBvdXQhJykpLCB0aW1lb3V0KVxuXG4gICAgdGhpcy5faW5jb21pbmdCdWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoZXZ0LmRhdGEpKSAvLyBhcHBlbmQgdG8gdGhlIGluY29taW5nIGJ1ZmZlclxuICAgIHRoaXMuX3BhcnNlSW5jb21pbmdDb21tYW5kcyh0aGlzLl9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKSkgLy8gQ29uc3VtZSB0aGUgaW5jb21pbmcgYnVmZmVyXG4gIH1cblxuICAqIF9pdGVyYXRlSW5jb21pbmdCdWZmZXIgKCkge1xuICAgIGxldCBidWYgPSB0aGlzLl9pbmNvbWluZ0J1ZmZlcnNbdGhpcy5faW5jb21pbmdCdWZmZXJzLmxlbmd0aCAtIDFdIHx8IFtdXG4gICAgbGV0IGkgPSAwXG5cbiAgICAvLyBsb29wIGludmFyaWFudDpcbiAgICAvLyAgIHRoaXMuX2luY29taW5nQnVmZmVycyBzdGFydHMgd2l0aCB0aGUgYmVnaW5uaW5nIG9mIGluY29taW5nIGNvbW1hbmQuXG4gICAgLy8gICBidWYgaXMgc2hvcnRoYW5kIGZvciBsYXN0IGVsZW1lbnQgb2YgdGhpcy5faW5jb21pbmdCdWZmZXJzLlxuICAgIC8vICAgYnVmWzAuLmktMV0gaXMgcGFydCBvZiBpbmNvbWluZyBjb21tYW5kLlxuICAgIHdoaWxlIChpIDwgYnVmLmxlbmd0aCkge1xuICAgICAgc3dpdGNoICh0aGlzLl9idWZmZXJTdGF0ZSkge1xuICAgICAgICBjYXNlIEJVRkZFUl9TVEFURV9MSVRFUkFMOlxuICAgICAgICAgIGNvbnN0IGRpZmYgPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gaSwgdGhpcy5fbGl0ZXJhbFJlbWFpbmluZylcbiAgICAgICAgICB0aGlzLl9saXRlcmFsUmVtYWluaW5nIC09IGRpZmZcbiAgICAgICAgICBpICs9IGRpZmZcbiAgICAgICAgICBpZiAodGhpcy5fbGl0ZXJhbFJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGNhc2UgQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzI6XG4gICAgICAgICAgaWYgKGkgPCBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoYnVmW2ldID09PSBDQVJSSUFHRV9SRVRVUk4pIHtcbiAgICAgICAgICAgICAgdGhpcy5fbGl0ZXJhbFJlbWFpbmluZyA9IE51bWJlcihmcm9tVHlwZWRBcnJheSh0aGlzLl9sZW5ndGhCdWZmZXIpKSArIDIgLy8gZm9yIENSTEZcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfTElURVJBTFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xlbmd0aEJ1ZmZlclxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGNhc2UgQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzE6XG4gICAgICAgICAgY29uc3Qgc3RhcnQgPSBpXG4gICAgICAgICAgd2hpbGUgKGkgPCBidWYubGVuZ3RoICYmIGJ1ZltpXSA+PSA0OCAmJiBidWZbaV0gPD0gNTcpIHsgLy8gZGlnaXRzXG4gICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXJ0ICE9PSBpKSB7XG4gICAgICAgICAgICBjb25zdCBsYXRlc3QgPSBidWYuc3ViYXJyYXkoc3RhcnQsIGkpXG4gICAgICAgICAgICBjb25zdCBwcmV2QnVmID0gdGhpcy5fbGVuZ3RoQnVmZmVyXG4gICAgICAgICAgICB0aGlzLl9sZW5ndGhCdWZmZXIgPSBuZXcgVWludDhBcnJheShwcmV2QnVmLmxlbmd0aCArIGxhdGVzdC5sZW5ndGgpXG4gICAgICAgICAgICB0aGlzLl9sZW5ndGhCdWZmZXIuc2V0KHByZXZCdWYpXG4gICAgICAgICAgICB0aGlzLl9sZW5ndGhCdWZmZXIuc2V0KGxhdGVzdCwgcHJldkJ1Zi5sZW5ndGgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpIDwgYnVmLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xlbmd0aEJ1ZmZlci5sZW5ndGggPiAwICYmIGJ1ZltpXSA9PT0gUklHSFRfQ1VSTFlfQlJBQ0tFVCkge1xuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fbGVuZ3RoQnVmZmVyXG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX0RFRkFVTFRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gZmluZCBsaXRlcmFsIGxlbmd0aFxuICAgICAgICAgIGNvbnN0IGxlZnRJZHggPSBidWYuaW5kZXhPZihMRUZUX0NVUkxZX0JSQUNLRVQsIGkpXG4gICAgICAgICAgaWYgKGxlZnRJZHggPiAtMSkge1xuICAgICAgICAgICAgY29uc3QgbGVmdE9mTGVmdEN1cmx5ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ1ZmZlciwgaSwgbGVmdElkeCAtIGkpXG4gICAgICAgICAgICBpZiAobGVmdE9mTGVmdEN1cmx5LmluZGV4T2YoTElORV9GRUVEKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgaSA9IGxlZnRJZHggKyAxXG4gICAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDApXG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzFcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBmaW5kIGVuZCBvZiBjb21tYW5kXG4gICAgICAgICAgY29uc3QgTEZpZHggPSBidWYuaW5kZXhPZihMSU5FX0ZFRUQsIGkpXG4gICAgICAgICAgaWYgKExGaWR4ID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChMRmlkeCA8IGJ1Zi5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2luY29taW5nQnVmZmVyc1t0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoIC0gMV0gPSBuZXcgVWludDhBcnJheShidWYuYnVmZmVyLCAwLCBMRmlkeCArIDEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kTGVuZ3RoID0gdGhpcy5faW5jb21pbmdCdWZmZXJzLnJlZHVjZSgocHJldiwgY3VycikgPT4gcHJldiArIGN1cnIubGVuZ3RoLCAwKSAtIDIgLy8gMiBmb3IgQ1JMRlxuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBVaW50OEFycmF5KGNvbW1hbmRMZW5ndGgpXG4gICAgICAgICAgICBsZXQgaW5kZXggPSAwXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5faW5jb21pbmdCdWZmZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgbGV0IHVpbnQ4QXJyYXkgPSB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMuc2hpZnQoKVxuXG4gICAgICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0xlbmd0aCA9IGNvbW1hbmRMZW5ndGggLSBpbmRleFxuICAgICAgICAgICAgICBpZiAodWludDhBcnJheS5sZW5ndGggPiByZW1haW5pbmdMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBleGNlc3NMZW5ndGggPSB1aW50OEFycmF5Lmxlbmd0aCAtIHJlbWFpbmluZ0xlbmd0aFxuICAgICAgICAgICAgICAgIHVpbnQ4QXJyYXkgPSB1aW50OEFycmF5LnN1YmFycmF5KDAsIC1leGNlc3NMZW5ndGgpXG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5jb21pbmdCdWZmZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX2luY29taW5nQnVmZmVycyA9IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbW1hbmQuc2V0KHVpbnQ4QXJyYXksIGluZGV4KVxuICAgICAgICAgICAgICBpbmRleCArPSB1aW50OEFycmF5Lmxlbmd0aFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgY29tbWFuZFxuICAgICAgICAgICAgaWYgKExGaWR4IDwgYnVmLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYnVmLnN1YmFycmF5KExGaWR4ICsgMSkpXG4gICAgICAgICAgICAgIHRoaXMuX2luY29taW5nQnVmZmVycy5wdXNoKGJ1ZilcbiAgICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGNsZWFyIHRoZSB0aW1lb3V0IHdoZW4gYW4gZW50aXJlIGNvbW1hbmQgaGFzIGFycml2ZWRcbiAgICAgICAgICAgICAgLy8gYW5kIG5vdCB3YWl0aW5nIG9uIG1vcmUgZGF0YSBmb3IgbmV4dCBjb21tYW5kXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpXG4gICAgICAgICAgICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IG51bGxcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvKipcbiAgICogUHJvY2Vzc2VzIGEgY29tbWFuZCBmcm9tIHRoZSBxdWV1ZS4gVGhlIGNvbW1hbmQgaXMgcGFyc2VkIGFuZCBmZWVkZWQgdG8gYSBoYW5kbGVyXG4gICAqL1xuICBfcGFyc2VJbmNvbWluZ0NvbW1hbmRzIChjb21tYW5kcykge1xuICAgIGZvciAodmFyIGNvbW1hbmQgb2YgY29tbWFuZHMpIHtcbiAgICAgIHRoaXMuX2NsZWFySWRsZSgpXG5cbiAgICAgIC8qXG4gICAgICAgKiBUaGUgXCIrXCItdGFnZ2VkIHJlc3BvbnNlIGlzIGEgc3BlY2lhbCBjYXNlOlxuICAgICAgICogRWl0aGVyIHRoZSBzZXJ2ZXIgY2FuIGFza3MgZm9yIHRoZSBuZXh0IGNodW5rIG9mIGRhdGEsIGUuZy4gZm9yIHRoZSBBVVRIRU5USUNBVEUgY29tbWFuZC5cbiAgICAgICAqXG4gICAgICAgKiBPciB0aGVyZSB3YXMgYW4gZXJyb3IgaW4gdGhlIFhPQVVUSDIgYXV0aGVudGljYXRpb24sIGZvciB3aGljaCBTQVNMIGluaXRpYWwgY2xpZW50IHJlc3BvbnNlIGV4dGVuc2lvblxuICAgICAgICogZGljdGF0ZXMgdGhlIGNsaWVudCBzZW5kcyBhbiBlbXB0eSBFT0wgcmVzcG9uc2UgdG8gdGhlIGNoYWxsZW5nZSBjb250YWluaW5nIHRoZSBlcnJvciBtZXNzYWdlLlxuICAgICAgICpcbiAgICAgICAqIERldGFpbHMgb24gXCIrXCItdGFnZ2VkIHJlc3BvbnNlOlxuICAgICAgICogICBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTIuMi4xXG4gICAgICAgKi9cbiAgICAgIC8vXG4gICAgICBpZiAoY29tbWFuZFswXSA9PT0gQVNDSUlfUExVUykge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBmZWVkIHRoZSBuZXh0IGNodW5rIG9mIGRhdGFcbiAgICAgICAgICB2YXIgY2h1bmsgPSB0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLnNoaWZ0KClcbiAgICAgICAgICBjaHVuayArPSAoIXRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEubGVuZ3RoID8gRU9MIDogJycpIC8vIEVPTCBpZiB0aGVyZSdzIG5vdGhpbmcgbW9yZSB0byBzZW5kXG4gICAgICAgICAgdGhpcy5zZW5kKGNodW5rKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2N1cnJlbnRDb21tYW5kLmVycm9yUmVzcG9uc2VFeHBlY3RzRW1wdHlMaW5lKSB7XG4gICAgICAgICAgdGhpcy5zZW5kKEVPTCkgLy8gWE9BVVRIMiBlbXB0eSByZXNwb25zZSwgZXJyb3Igd2lsbCBiZSByZXBvcnRlZCB3aGVuIHNlcnZlciBjb250aW51ZXMgd2l0aCBOTyByZXNwb25zZVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciByZXNwb25zZVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdmFsdWVBc1N0cmluZyA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QgJiYgdGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdC52YWx1ZUFzU3RyaW5nXG4gICAgICAgIHJlc3BvbnNlID0gcGFyc2VySGVscGVyKGNvbW1hbmQsIHsgdmFsdWVBc1N0cmluZyB9KVxuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnUzonLCAoKSA9PiBjb21waWxlcihyZXNwb25zZSwgZmFsc2UsIHRydWUpKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihlLCAnRXJyb3IgcGFyc2luZyBpbWFwIGNvbW1hbmQhJywgeyByZXNwb25zZSwgY29tbWFuZDogZnJvbVR5cGVkQXJyYXkoY29tbWFuZCkgfSlcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uRXJyb3IoZSlcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKVxuICAgICAgdGhpcy5faGFuZGxlUmVzcG9uc2UocmVzcG9uc2UpXG5cbiAgICAgIC8vIGZpcnN0IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlciwgY29ubmVjdGlvbiBpcyBub3cgdXNhYmxlXG4gICAgICBpZiAoIXRoaXMuX2Nvbm5lY3Rpb25SZWFkeSkge1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uUmVhZHkgPSB0cnVlXG4gICAgICAgIHRoaXMub25yZWFkeSAmJiB0aGlzLm9ucmVhZHkoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGZWVkcyBhIHBhcnNlZCByZXNwb25zZSBvYmplY3QgdG8gYW4gYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIGNvbW1hbmQgb2JqZWN0XG4gICAqL1xuICBfaGFuZGxlUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgdmFyIGNvbW1hbmQgPSBwcm9wT3IoJycsICdjb21tYW5kJywgcmVzcG9uc2UpLnRvVXBwZXJDYXNlKCkudHJpbSgpXG5cbiAgICBpZiAoIXRoaXMuX2N1cnJlbnRDb21tYW5kKSB7XG4gICAgICAvLyB1bnNvbGljaXRlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgaWYgKHJlc3BvbnNlLnRhZyA9PT0gJyonICYmIGNvbW1hbmQgaW4gdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWQpIHtcbiAgICAgICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWRbY29tbWFuZF0ocmVzcG9uc2UpXG4gICAgICAgIHRoaXMuX2NhblNlbmQgPSB0cnVlXG4gICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWQgJiYgcmVzcG9uc2UudGFnID09PSAnKicgJiYgY29tbWFuZCBpbiB0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkKSB7XG4gICAgICAvLyBleHBlY3RlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgdGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZFtjb21tYW5kXS5wdXNoKHJlc3BvbnNlKVxuICAgIH0gZWxzZSBpZiAocmVzcG9uc2UudGFnID09PSAnKicgJiYgY29tbWFuZCBpbiB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZCkge1xuICAgICAgLy8gdW5leHBlY3RlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWRbY29tbWFuZF0ocmVzcG9uc2UpXG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS50YWcgPT09IHRoaXMuX2N1cnJlbnRDb21tYW5kLnRhZykge1xuICAgICAgLy8gdGFnZ2VkIHJlc3BvbnNlXG4gICAgICBpZiAodGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZCAmJiBPYmplY3Qua2V5cyh0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkKS5sZW5ndGgpIHtcbiAgICAgICAgcmVzcG9uc2UucGF5bG9hZCA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWRcbiAgICAgIH1cbiAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmNhbGxiYWNrKHJlc3BvbnNlKVxuICAgICAgdGhpcy5fY2FuU2VuZCA9IHRydWVcbiAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYSBjb21tYW5kIGZyb20gY2xpZW50IHF1ZXVlIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBfc2VuZFJlcXVlc3QgKCkge1xuICAgIGlmICghdGhpcy5fY2xpZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZW50ZXJJZGxlKClcbiAgICB9XG4gICAgdGhpcy5fY2xlYXJJZGxlKClcblxuICAgIC8vIGFuIG9wZXJhdGlvbiB3YXMgbWFkZSBpbiB0aGUgcHJlY2hlY2ssIG5vIG5lZWQgdG8gcmVzdGFydCB0aGUgcXVldWUgbWFudWFsbHlcbiAgICB0aGlzLl9yZXN0YXJ0UXVldWUgPSBmYWxzZVxuXG4gICAgdmFyIGNvbW1hbmQgPSB0aGlzLl9jbGllbnRRdWV1ZVswXVxuICAgIGlmICh0eXBlb2YgY29tbWFuZC5wcmVjaGVjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gcmVtZW1iZXIgdGhlIGNvbnRleHRcbiAgICAgIHZhciBjb250ZXh0ID0gY29tbWFuZFxuICAgICAgdmFyIHByZWNoZWNrID0gY29udGV4dC5wcmVjaGVja1xuICAgICAgZGVsZXRlIGNvbnRleHQucHJlY2hlY2tcblxuICAgICAgLy8gd2UgbmVlZCB0byByZXN0YXJ0IHRoZSBxdWV1ZSBoYW5kbGluZyBpZiBubyBvcGVyYXRpb24gd2FzIG1hZGUgaW4gdGhlIHByZWNoZWNrXG4gICAgICB0aGlzLl9yZXN0YXJ0UXVldWUgPSB0cnVlXG5cbiAgICAgIC8vIGludm9rZSB0aGUgcHJlY2hlY2sgY29tbWFuZCBhbmQgcmVzdW1lIG5vcm1hbCBvcGVyYXRpb24gYWZ0ZXIgdGhlIHByb21pc2UgcmVzb2x2ZXNcbiAgICAgIHByZWNoZWNrKGNvbnRleHQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAvLyB3ZSdyZSBkb25lIHdpdGggdGhlIHByZWNoZWNrXG4gICAgICAgIGlmICh0aGlzLl9yZXN0YXJ0UXVldWUpIHtcbiAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHJlc3RhcnQgdGhlIHF1ZXVlIGhhbmRsaW5nXG4gICAgICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKVxuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIC8vIHByZWNoZWNrIGZhaWxlZCwgc28gd2UgcmVtb3ZlIHRoZSBpbml0aWFsIGNvbW1hbmRcbiAgICAgICAgLy8gZnJvbSB0aGUgcXVldWUsIGludm9rZSBpdHMgY2FsbGJhY2sgYW5kIHJlc3VtZSBub3JtYWwgb3BlcmF0aW9uXG4gICAgICAgIGxldCBjbWRcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGNvbnRleHQpXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY21kID0gdGhpcy5fY2xpZW50UXVldWUuc3BsaWNlKGluZGV4LCAxKVswXVxuICAgICAgICB9XG4gICAgICAgIGlmIChjbWQgJiYgY21kLmNhbGxiYWNrKSB7XG4gICAgICAgICAgY21kLmNhbGxiYWNrKGVycilcbiAgICAgICAgICB0aGlzLl9jYW5TZW5kID0gdHJ1ZVxuICAgICAgICAgIHRoaXMuX3BhcnNlSW5jb21pbmdDb21tYW5kcyh0aGlzLl9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKSkgLy8gQ29uc3VtZSB0aGUgcmVzdCBvZiB0aGUgaW5jb21pbmcgYnVmZmVyXG4gICAgICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKSAvLyBjb250aW51ZSBzZW5kaW5nXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLl9jYW5TZW5kID0gZmFsc2VcbiAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IHRoaXMuX2NsaWVudFF1ZXVlLnNoaWZ0KClcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhID0gY29tcGlsZXIodGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdCwgdHJ1ZSlcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDOicsICgpID0+IGNvbXBpbGVyKHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QsIGZhbHNlLCB0cnVlKSkgLy8gZXhjbHVkZXMgcGFzc3dvcmRzIGV0Yy5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihlLCAnRXJyb3IgY29tcGlsaW5nIGltYXAgY29tbWFuZCEnLCB0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0KVxuICAgICAgcmV0dXJuIHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCdFcnJvciBjb21waWxpbmcgaW1hcCBjb21tYW5kIScpKVxuICAgIH1cblxuICAgIHZhciBkYXRhID0gdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5zaGlmdCgpXG5cbiAgICB0aGlzLnNlbmQoZGF0YSArICghdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5sZW5ndGggPyBFT0wgOiAnJykpXG4gICAgcmV0dXJuIHRoaXMud2FpdERyYWluXG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgb25pZGxlLCBub3RpbmcgdG8gZG8gY3VycmVudGx5XG4gICAqL1xuICBfZW50ZXJJZGxlICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVyKVxuICAgIHRoaXMuX2lkbGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gKHRoaXMub25pZGxlICYmIHRoaXMub25pZGxlKCkpLCB0aGlzLnRpbWVvdXRFbnRlcklkbGUpXG4gIH1cblxuICAvKipcbiAgICogQ2FuY2VsIGlkbGUgdGltZXJcbiAgICovXG4gIF9jbGVhcklkbGUgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZXIpXG4gICAgdGhpcy5faWRsZVRpbWVyID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCBwcm9jZXNzZXMgYSByZXNwb25zZSBpbnRvIGFuIGVhc2llciB0byBoYW5kbGUgZm9ybWF0LlxuICAgKiBBZGQgdW50YWdnZWQgbnVtYmVyZWQgcmVzcG9uc2VzIChlLmcuIEZFVENIKSBpbnRvIGEgbmljZWx5IGZlYXNpYmxlIGZvcm1cbiAgICogQ2hlY2tzIGlmIGEgcmVzcG9uc2UgaW5jbHVkZXMgb3B0aW9uYWwgcmVzcG9uc2UgY29kZXNcbiAgICogYW5kIGNvcGllcyB0aGVzZSBpbnRvIHNlcGFyYXRlIHByb3BlcnRpZXMuIEZvciBleGFtcGxlIHRoZVxuICAgKiBmb2xsb3dpbmcgcmVzcG9uc2UgaW5jbHVkZXMgYSBjYXBhYmlsaXR5IGxpc3RpbmcgYW5kIGEgaHVtYW5cbiAgICogcmVhZGFibGUgbWVzc2FnZTpcbiAgICpcbiAgICogICAgICogT0sgW0NBUEFCSUxJVFkgSUQgTkFNRVNQQUNFXSBBbGwgcmVhZHlcbiAgICpcbiAgICogVGhpcyBtZXRob2QgYWRkcyBhICdjYXBhYmlsaXR5JyBwcm9wZXJ0eSB3aXRoIGFuIGFycmF5IHZhbHVlIFsnSUQnLCAnTkFNRVNQQUNFJ11cbiAgICogdG8gdGhlIHJlc3BvbnNlIG9iamVjdC4gQWRkaXRpb25hbGx5ICdBbGwgcmVhZHknIGlzIGFkZGVkIGFzICdodW1hblJlYWRhYmxlJyBwcm9wZXJ0eS5cbiAgICpcbiAgICogU2VlIHBvc3NpYmxlbSBJTUFQIFJlc3BvbnNlIENvZGVzIGF0IGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM1NTMwXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgcmVzcG9uc2Ugb2JqZWN0XG4gICAqL1xuICBfcHJvY2Vzc1Jlc3BvbnNlIChyZXNwb25zZSkge1xuICAgIGNvbnN0IGNvbW1hbmQgPSBwcm9wT3IoJycsICdjb21tYW5kJywgcmVzcG9uc2UpLnRvVXBwZXJDYXNlKCkudHJpbSgpXG5cbiAgICAvLyBubyBhdHRyaWJ1dGVzXG4gICAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UuYXR0cmlidXRlcyB8fCAhcmVzcG9uc2UuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIHVudGFnZ2VkIHJlc3BvbnNlcyB3LyBzZXF1ZW5jZSBudW1iZXJzXG4gICAgaWYgKHJlc3BvbnNlLnRhZyA9PT0gJyonICYmIC9eXFxkKyQvLnRlc3QocmVzcG9uc2UuY29tbWFuZCkgJiYgcmVzcG9uc2UuYXR0cmlidXRlc1swXS50eXBlID09PSAnQVRPTScpIHtcbiAgICAgIHJlc3BvbnNlLm5yID0gTnVtYmVyKHJlc3BvbnNlLmNvbW1hbmQpXG4gICAgICByZXNwb25zZS5jb21tYW5kID0gKHJlc3BvbnNlLmF0dHJpYnV0ZXMuc2hpZnQoKS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuICAgIH1cblxuICAgIC8vIG5vIG9wdGlvbmFsIHJlc3BvbnNlIGNvZGVcbiAgICBpZiAoWydPSycsICdOTycsICdCQUQnLCAnQllFJywgJ1BSRUFVVEgnXS5pbmRleE9mKGNvbW1hbmQpIDwgMCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gSWYgbGFzdCBlbGVtZW50IG9mIHRoZSByZXNwb25zZSBpcyBURVhUIHRoZW4gdGhpcyBpcyBmb3IgaHVtYW5zXG4gICAgaWYgKHJlc3BvbnNlLmF0dHJpYnV0ZXNbcmVzcG9uc2UuYXR0cmlidXRlcy5sZW5ndGggLSAxXS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIHJlc3BvbnNlLmh1bWFuUmVhZGFibGUgPSByZXNwb25zZS5hdHRyaWJ1dGVzW3Jlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoIC0gMV0udmFsdWVcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBhbmQgZm9ybWF0IEFUT00gdmFsdWVzXG4gICAgaWYgKHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0udHlwZSA9PT0gJ0FUT00nICYmIHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0uc2VjdGlvbikge1xuICAgICAgY29uc3Qgb3B0aW9uID0gcmVzcG9uc2UuYXR0cmlidXRlc1swXS5zZWN0aW9uLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBrZXkubWFwKChrZXkpID0+IChrZXkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudHJpbSgpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAoa2V5LnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRvVXBwZXJDYXNlKCkudHJpbSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGtleSA9IG9wdGlvbi5zaGlmdCgpXG4gICAgICByZXNwb25zZS5jb2RlID0ga2V5XG5cbiAgICAgIGlmIChvcHRpb24ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJlc3BvbnNlW2tleS50b0xvd2VyQ2FzZSgpXSA9IG9wdGlvblswXVxuICAgICAgfSBlbHNlIGlmIChvcHRpb24ubGVuZ3RoID4gMSkge1xuICAgICAgICByZXNwb25zZVtrZXkudG9Mb3dlckNhc2UoKV0gPSBvcHRpb25cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgYW4gRXJyb3Igb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFZhbHVlIHRvIGJlIGNoZWNrZWRcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gcmV0dXJucyB0cnVlIGlmIHRoZSB2YWx1ZSBpcyBhbiBFcnJvclxuICAgKi9cbiAgaXNFcnJvciAodmFsdWUpIHtcbiAgICByZXR1cm4gISFPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLm1hdGNoKC9FcnJvclxcXSQvKVxuICB9XG5cbiAgLy8gQ09NUFJFU1NJT04gUkVMQVRFRCBNRVRIT0RTXG5cbiAgLyoqXG4gICAqIFNldHMgdXAgZGVmbGF0ZS9pbmZsYXRlIGZvciB0aGUgSU9cbiAgICovXG4gIGVuYWJsZUNvbXByZXNzaW9uICgpIHtcbiAgICB0aGlzLl9zb2NrZXRPbkRhdGEgPSB0aGlzLnNvY2tldC5vbmRhdGFcbiAgICB0aGlzLmNvbXByZXNzZWQgPSB0cnVlXG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lldvcmtlcikge1xuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIgPSBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW0NvbXByZXNzaW9uQmxvYl0pKSlcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLm9ubWVzc2FnZSA9IChlKSA9PiB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZS5kYXRhLm1lc3NhZ2VcbiAgICAgICAgdmFyIGRhdGEgPSBlLmRhdGEuYnVmZmVyXG5cbiAgICAgICAgc3dpdGNoIChtZXNzYWdlKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX0lORkxBVEVEX0RBVEFfUkVBRFk6XG4gICAgICAgICAgICB0aGlzLl9zb2NrZXRPbkRhdGEoeyBkYXRhIH0pXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX0RFRkxBVEVEX0RBVEFfUkVBRFk6XG4gICAgICAgICAgICB0aGlzLndhaXREcmFpbiA9IHRoaXMuc29ja2V0LnNlbmQoZGF0YSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIub25lcnJvciA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCdFcnJvciBoYW5kbGluZyBjb21wcmVzc2lvbiB3ZWIgd29ya2VyOiAnICsgZS5tZXNzYWdlKSlcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIucG9zdE1lc3NhZ2UoY3JlYXRlTWVzc2FnZShNRVNTQUdFX0lOSVRJQUxJWkVfV09SS0VSKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5mbGF0ZWRSZWFkeSA9IChidWZmZXIpID0+IHsgdGhpcy5fc29ja2V0T25EYXRhKHsgZGF0YTogYnVmZmVyIH0pIH1cbiAgICAgIGNvbnN0IGRlZmxhdGVkUmVhZHkgPSAoYnVmZmVyKSA9PiB7IHRoaXMud2FpdERyYWluID0gdGhpcy5zb2NrZXQuc2VuZChidWZmZXIpIH1cbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uID0gbmV3IENvbXByZXNzaW9uKGluZmxhdGVkUmVhZHksIGRlZmxhdGVkUmVhZHkpXG4gICAgfVxuXG4gICAgLy8gb3ZlcnJpZGUgZGF0YSBoYW5kbGVyLCBkZWNvbXByZXNzIGluY29taW5nIGRhdGFcbiAgICB0aGlzLnNvY2tldC5vbmRhdGEgPSAoZXZ0KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuY29tcHJlc3NlZCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2NvbXByZXNzaW9uV29ya2VyKSB7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoTUVTU0FHRV9JTkZMQVRFLCBldnQuZGF0YSksIFtldnQuZGF0YV0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jb21wcmVzc2lvbi5pbmZsYXRlKGV2dC5kYXRhKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVbmRvZXMgYW55IGNoYW5nZXMgcmVsYXRlZCB0byBjb21wcmVzc2lvbi4gVGhpcyBvbmx5IGJlIGNhbGxlZCB3aGVuIGNsb3NpbmcgdGhlIGNvbm5lY3Rpb25cbiAgICovXG4gIF9kaXNhYmxlQ29tcHJlc3Npb24gKCkge1xuICAgIGlmICghdGhpcy5jb21wcmVzc2VkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmNvbXByZXNzZWQgPSBmYWxzZVxuICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IHRoaXMuX3NvY2tldE9uRGF0YVxuICAgIHRoaXMuX3NvY2tldE9uRGF0YSA9IG51bGxcblxuICAgIGlmICh0aGlzLl9jb21wcmVzc2lvbldvcmtlcikge1xuICAgICAgLy8gdGVybWluYXRlIHRoZSB3b3JrZXJcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLnRlcm1pbmF0ZSgpXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlciA9IG51bGxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3V0Z29pbmcgcGF5bG9hZCBuZWVkcyB0byBiZSBjb21wcmVzc2VkIGFuZCBzZW50IHRvIHNvY2tldFxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXIgT3V0Z29pbmcgdW5jb21wcmVzc2VkIGFycmF5YnVmZmVyXG4gICAqL1xuICBfc2VuZENvbXByZXNzZWQgKGJ1ZmZlcikge1xuICAgIC8vIGRlZmxhdGVcbiAgICBpZiAodGhpcy5fY29tcHJlc3Npb25Xb3JrZXIpIHtcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoTUVTU0FHRV9ERUZMQVRFLCBidWZmZXIpLCBbYnVmZmVyXSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY29tcHJlc3Npb24uZGVmbGF0ZShidWZmZXIpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGNyZWF0ZU1lc3NhZ2UgPSAobWVzc2FnZSwgYnVmZmVyKSA9PiAoeyBtZXNzYWdlLCBidWZmZXIgfSlcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBQUEsTUFBQSxHQUFBQyxPQUFBO0FBQ0EsSUFBQUMsaUJBQUEsR0FBQUMsc0JBQUEsQ0FBQUYsT0FBQTtBQUNBLElBQUFHLE9BQUEsR0FBQUgsT0FBQTtBQUNBLElBQUFJLG1CQUFBLEdBQUFKLE9BQUE7QUFDQSxJQUFBSyxhQUFBLEdBQUFM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