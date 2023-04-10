/* stanz - v7.1.0  (c) 2018-2023 YAO */
parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"jcrR":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.isxdata=exports.getType=exports.getRandomId=void 0;var e=t(require("./main.mjs"));function t(e){return e&&e.__esModule?e:{default:e}}const o=()=>Math.random().toString(32).slice(2);exports.getRandomId=o;const r=t=>t instanceof e.default;exports.isxdata=r;const s=Object.prototype.toString,a=e=>s.call(e).toLowerCase().replace(/(\[object )|(])/g,"");exports.getType=a;
},{"./main.mjs":"PnwU"}],"KVRu":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.handler=void 0;var e=require("./public.mjs"),t=n(require("./main.mjs"));function r(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,n=new WeakMap;return(r=function(e){return e?n:t})(e)}function n(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var n=r(t);if(n&&n.has(e))return n.get(e);var o={},a=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var s in e)if("default"!==s&&Object.prototype.hasOwnProperty.call(e,s)){var i=a?Object.getOwnPropertyDescriptor(e,s):null;i&&(i.get||i.set)?Object.defineProperty(o,s,i):o[s]=e[s]}return o.default=e,n&&n.set(e,o),o}const{defineProperties:o}=Object,a=(r,n,o,a)=>{let s=o;const i=(0,e.getType)(o);return(0,e.isxdata)(s)?s._owner.push(a):"object"!==i&&"array"!==i||(s=new t.default(o))._owner.push(a),s},s=(r,n)=>{const o=r[n];if((0,e.isxdata)(o)){const e=o._owner.indexOf(r[t.PROXY]);e>-1?o._owner.splice(e,1):console.error({desc:"This data is wrong, the owner has no boarding object at the time of deletion",target:r,mismatch:o})}},i={set(e,t,r,n){if("symbol"==typeof t)return Reflect.set(e,t,r,n);if(/^_/.test(t))return e.hasOwnProperty(t)?Reflect.set(e,t,r,n):o(e,{[t]:{writable:!0,configurable:!0,value:r}}),!0;try{const o=a(0,0,r,n);return Reflect.set(e,t,o,n)}catch(s){throw{desc:`failed to set ${t}`,key:t,value:r,target:n,error:s}}},deleteProperty:(e,t)=>(s(e,t),Reflect.deleteProperty(e,t))};exports.handler=i;
},{"./public.mjs":"jcrR","./main.mjs":"PnwU"}],"hwXb":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=require("./main.mjs");const t=["push","pop","shift","unshift","splice","reverse","sort","fill","copyWithin"];var r=r=>{const o=r.prototype,s=Array.prototype;t.forEach(t=>{o[t]&&Object.defineProperty(o,t,{value(){for(var r=arguments.length,o=new Array(r),p=0;p<r;p++)o[p]=arguments[p];const i=s[t].apply(this[e.SELF],o);return i===this[e.SELF]?this[e.PROXY]:i}})})};exports.default=r;
},{"./main.mjs":"PnwU"}],"PnwU":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.SELF=exports.PROXY=void 0;var e=require("./public.mjs"),t=require("./accessor.mjs"),r=s(require("./array.mjs"));function s(e){return e&&e.__esModule?e:{default:e}}const{defineProperties:o,getOwnPropertyDescriptor:i}=Object,n=Symbol("self");exports.SELF=n;const a=Symbol("proxy");exports.PROXY=a;class u extends Array{constructor(r){super();const s=new Proxy(this,t.handler);return o(this,{xid:{value:r.xid||(0,e.getRandomId)()},_owner:{configurable:!0,writable:!0,value:[]},owner:{get(){return new Set(this._owner)}},[n]:{get:()=>this},[a]:{get:()=>s}}),Object.keys(r).forEach(e=>{const t=i(r,e);let{value:n,get:a,set:u}=t;a||u?o(this,{[e]:t}):s[e]=n}),s}toJSON(){let t={},r=!0,s=0;Object.keys(this).forEach(o=>{let i=this[o];/\D/.test(o)?r=!1:(o=parseInt(o))>s&&(s=o),(0,e.isxdata)(i)&&(i=i.toJSON()),t[o]=i}),r&&(t.length=s+1,t=Array.from(t));const i=this.xid;return o(t,{xid:{get:()=>i}}),t}}exports.default=u,(0,r.default)(u);
},{"./public.mjs":"jcrR","./accessor.mjs":"KVRu","./array.mjs":"hwXb"}],"SZYs":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=s(require("./main.mjs")),t=require("./public.mjs");function s(e){return e&&e.__esModule?e:{default:e}}const r=t=>new e.default(t);Object.assign(r,{is:t.isxdata});var i=r;exports.default=i,"object"==typeof window&&(window.stanz=r);
},{"./main.mjs":"PnwU","./public.mjs":"jcrR"}]},{},["SZYs"], null)
