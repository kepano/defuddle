(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Defuddle"] = factory();
	else
		root["Defuddle"] = factory();
})(typeof self !== "undefined" ? self : this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 354:
/*!*********************************************************!*\
  !*** ./node_modules/mathml-to-latex/dist/bundle.min.js ***!
  \*********************************************************/
/***/ (function(module) {

!function(e,t){ true?module.exports=t():0}(this,(()=>(()=>{var e={4582:(e,t)=>{"use strict";function r(e,t){return void 0===t&&(t=Object),t&&"function"==typeof t.freeze?t.freeze(e):e}var a=r({HTML:"text/html",isHTML:function(e){return e===a.HTML},XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),n=r({HTML:"http://www.w3.org/1999/xhtml",isHTML:function(e){return e===n.HTML},SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});t.assign=function(e,t){if(null===e||"object"!=typeof e)throw new TypeError("target is not an object");for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e},t.find=function(e,t,r){if(void 0===r&&(r=Array.prototype),e&&"function"==typeof r.find)return r.find.call(e,t);for(var a=0;a<e.length;a++)if(Object.prototype.hasOwnProperty.call(e,a)){var n=e[a];if(t.call(void 0,n,a,e))return n}},t.freeze=r,t.MIME_TYPE=a,t.NAMESPACE=n},5752:(e,t,r)=>{var a=r(4582),n=r(4722),o=r(6559),i=r(4466),s=n.DOMImplementation,l=a.NAMESPACE,c=i.ParseError,u=i.XMLReader;function h(e){return e.replace(/\r[\n\u0085]/g,"\n").replace(/[\r\u0085\u2028]/g,"\n")}function d(e){this.options=e||{locator:{}}}function m(){this.cdata=!1}function p(e,t){t.lineNumber=e.lineNumber,t.columnNumber=e.columnNumber}function f(e){if(e)return"\n@"+(e.systemId||"")+"#[line:"+e.lineNumber+",col:"+e.columnNumber+"]"}function x(e,t,r){return"string"==typeof e?e.substr(t,r):e.length>=t+r||t?new java.lang.String(e,t,r)+"":e}function g(e,t){e.currentElement?e.currentElement.appendChild(t):e.doc.appendChild(t)}d.prototype.parseFromString=function(e,t){var r=this.options,a=new u,n=r.domBuilder||new m,i=r.errorHandler,s=r.locator,c=r.xmlns||{},d=/\/x?html?$/.test(t),p=d?o.HTML_ENTITIES:o.XML_ENTITIES;s&&n.setDocumentLocator(s),a.errorHandler=function(e,t,r){if(!e){if(t instanceof m)return t;e=t}var a={},n=e instanceof Function;function o(t){var o=e[t];!o&&n&&(o=2==e.length?function(r){e(t,r)}:e),a[t]=o&&function(e){o("[xmldom "+t+"]\t"+e+f(r))}||function(){}}return r=r||{},o("warning"),o("error"),o("fatalError"),a}(i,n,s),a.domBuilder=r.domBuilder||n,d&&(c[""]=l.HTML),c.xml=c.xml||l.XML;var x=r.normalizeLineEndings||h;return e&&"string"==typeof e?a.parse(x(e),c,p):a.errorHandler.error("invalid doc source"),n.doc},m.prototype={startDocument:function(){this.doc=(new s).createDocument(null,null,null),this.locator&&(this.doc.documentURI=this.locator.systemId)},startElement:function(e,t,r,a){var n=this.doc,o=n.createElementNS(e,r||t),i=a.length;g(this,o),this.currentElement=o,this.locator&&p(this.locator,o);for(var s=0;s<i;s++){e=a.getURI(s);var l=a.getValue(s),c=(r=a.getQName(s),n.createAttributeNS(e,r));this.locator&&p(a.getLocator(s),c),c.value=c.nodeValue=l,o.setAttributeNode(c)}},endElement:function(e,t,r){var a=this.currentElement;a.tagName,this.currentElement=a.parentNode},startPrefixMapping:function(e,t){},endPrefixMapping:function(e){},processingInstruction:function(e,t){var r=this.doc.createProcessingInstruction(e,t);this.locator&&p(this.locator,r),g(this,r)},ignorableWhitespace:function(e,t,r){},characters:function(e,t,r){if(e=x.apply(this,arguments)){if(this.cdata)var a=this.doc.createCDATASection(e);else a=this.doc.createTextNode(e);this.currentElement?this.currentElement.appendChild(a):/^\s*$/.test(e)&&this.doc.appendChild(a),this.locator&&p(this.locator,a)}},skippedEntity:function(e){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(e){(this.locator=e)&&(e.lineNumber=0)},comment:function(e,t,r){e=x.apply(this,arguments);var a=this.doc.createComment(e);this.locator&&p(this.locator,a),g(this,a)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(e,t,r){var a=this.doc.implementation;if(a&&a.createDocumentType){var n=a.createDocumentType(e,t,r);this.locator&&p(this.locator,n),g(this,n),this.doc.doctype=n}},warning:function(e){console.warn("[xmldom warning]\t"+e,f(this.locator))},error:function(e){console.error("[xmldom error]\t"+e,f(this.locator))},fatalError:function(e){throw new c(e,this.locator)}},"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,(function(e){m.prototype[e]=function(){return null}})),t.DOMParser=d},4722:(e,t,r)=>{var a=r(4582),n=a.find,o=a.NAMESPACE;function i(e){return""!==e}function s(e,t){return e.hasOwnProperty(t)||(e[t]=!0),e}function l(e){if(!e)return[];var t=function(e){return e?e.split(/[\t\n\f\r ]+/).filter(i):[]}(e);return Object.keys(t.reduce(s,{}))}function c(e,t){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r])}function u(e,t){var r=e.prototype;if(!(r instanceof t)){function a(){}a.prototype=t.prototype,c(r,a=new a),e.prototype=r=a}r.constructor!=e&&("function"!=typeof e&&console.error("unknown Class:"+e),r.constructor=e)}var h={},d=h.ELEMENT_NODE=1,m=h.ATTRIBUTE_NODE=2,p=h.TEXT_NODE=3,f=h.CDATA_SECTION_NODE=4,x=h.ENTITY_REFERENCE_NODE=5,g=h.ENTITY_NODE=6,w=h.PROCESSING_INSTRUCTION_NODE=7,b=h.COMMENT_NODE=8,v=h.DOCUMENT_NODE=9,C=h.DOCUMENT_TYPE_NODE=10,A=h.DOCUMENT_FRAGMENT_NODE=11,E=h.NOTATION_NODE=12,_={},y={},q=(_.INDEX_SIZE_ERR=(y[1]="Index size error",1),_.DOMSTRING_SIZE_ERR=(y[2]="DOMString size error",2),_.HIERARCHY_REQUEST_ERR=(y[3]="Hierarchy request error",3)),D=(_.WRONG_DOCUMENT_ERR=(y[4]="Wrong document",4),_.INVALID_CHARACTER_ERR=(y[5]="Invalid character",5),_.NO_DATA_ALLOWED_ERR=(y[6]="No data allowed",6),_.NO_MODIFICATION_ALLOWED_ERR=(y[7]="No modification allowed",7),_.NOT_FOUND_ERR=(y[8]="Not found",8)),M=(_.NOT_SUPPORTED_ERR=(y[9]="Not supported",9),_.INUSE_ATTRIBUTE_ERR=(y[10]="Attribute in use",10));function T(e,t){if(t instanceof Error)var r=t;else r=this,Error.call(this,y[e]),this.message=y[e],Error.captureStackTrace&&Error.captureStackTrace(this,T);return r.code=e,t&&(this.message=this.message+": "+t),r}function N(){}function O(e,t){this._node=e,this._refresh=t,L(this)}function L(e){var t=e._node._inc||e._node.ownerDocument._inc;if(e._inc!==t){var r=e._refresh(e._node);if(we(e,"length",r.length),!e.$$length||r.length<e.$$length)for(var a=r.length;a in e;a++)Object.prototype.hasOwnProperty.call(e,a)&&delete e[a];c(r,e),e._inc=t}}function B(){}function S(e,t){for(var r=e.length;r--;)if(e[r]===t)return r}function F(e,t,r,a){if(a?t[S(t,a)]=r:t[t.length++]=r,e){r.ownerElement=e;var n=e.ownerDocument;n&&(a&&V(n,e,a),function(e,t,r){e&&e._inc++,r.namespaceURI===o.XMLNS&&(t._nsMap[r.prefix?r.localName:""]=r.value)}(n,e,r))}}function P(e,t,r){var a=S(t,r);if(!(a>=0))throw new T(D,new Error(e.tagName+"@"+r));for(var n=t.length-1;a<n;)t[a]=t[++a];if(t.length=n,e){var o=e.ownerDocument;o&&(V(o,e,r),r.ownerElement=null)}}function k(){}function R(){}function I(e){return("<"==e?"&lt;":">"==e&&"&gt;")||"&"==e&&"&amp;"||'"'==e&&"&quot;"||"&#"+e.charCodeAt()+";"}function U(e,t){if(t(e))return!0;if(e=e.firstChild)do{if(U(e,t))return!0}while(e=e.nextSibling)}function j(){this.ownerDocument=this}function V(e,t,r,a){e&&e._inc++,r.namespaceURI===o.XMLNS&&delete t._nsMap[r.prefix?r.localName:""]}function G(e,t,r){if(e&&e._inc){e._inc++;var a=t.childNodes;if(r)a[a.length++]=r;else{for(var n=t.firstChild,o=0;n;)a[o++]=n,n=n.nextSibling;a.length=o,delete a[a.length]}}}function $(e,t){var r=t.previousSibling,a=t.nextSibling;return r?r.nextSibling=a:e.firstChild=a,a?a.previousSibling=r:e.lastChild=r,t.parentNode=null,t.previousSibling=null,t.nextSibling=null,G(e.ownerDocument,e),t}function X(e){return e&&e.nodeType===R.DOCUMENT_TYPE_NODE}function H(e){return e&&e.nodeType===R.ELEMENT_NODE}function W(e){return e&&e.nodeType===R.TEXT_NODE}function z(e,t){var r=e.childNodes||[];if(n(r,H)||X(t))return!1;var a=n(r,X);return!(t&&a&&r.indexOf(a)>r.indexOf(t))}function Y(e,t){var r=e.childNodes||[];if(n(r,(function(e){return H(e)&&e!==t})))return!1;var a=n(r,X);return!(t&&a&&r.indexOf(a)>r.indexOf(t))}function J(e,t,r){var a=e.childNodes||[],o=t.childNodes||[];if(t.nodeType===R.DOCUMENT_FRAGMENT_NODE){var i=o.filter(H);if(i.length>1||n(o,W))throw new T(q,"More than one element or text in fragment");if(1===i.length&&!z(e,r))throw new T(q,"Element in fragment can not be inserted before doctype")}if(H(t)&&!z(e,r))throw new T(q,"Only one element can be added and only after doctype");if(X(t)){if(n(a,X))throw new T(q,"Only one doctype is allowed");var s=n(a,H);if(r&&a.indexOf(s)<a.indexOf(r))throw new T(q,"Doctype can only be inserted before an element");if(!r&&s)throw new T(q,"Doctype can not be appended since element is present")}}function Z(e,t,r){var a=e.childNodes||[],o=t.childNodes||[];if(t.nodeType===R.DOCUMENT_FRAGMENT_NODE){var i=o.filter(H);if(i.length>1||n(o,W))throw new T(q,"More than one element or text in fragment");if(1===i.length&&!Y(e,r))throw new T(q,"Element in fragment can not be inserted before doctype")}if(H(t)&&!Y(e,r))throw new T(q,"Only one element can be added and only after doctype");if(X(t)){if(n(a,(function(e){return X(e)&&e!==r})))throw new T(q,"Only one doctype is allowed");var s=n(a,H);if(r&&a.indexOf(s)<a.indexOf(r))throw new T(q,"Doctype can only be inserted before an element")}}function Q(e,t,r,a){(function(e,t,r){if(!function(e){return e&&(e.nodeType===R.DOCUMENT_NODE||e.nodeType===R.DOCUMENT_FRAGMENT_NODE||e.nodeType===R.ELEMENT_NODE)}(e))throw new T(q,"Unexpected parent node type "+e.nodeType);if(r&&r.parentNode!==e)throw new T(D,"child not in parent");if(!function(e){return e&&(H(e)||W(e)||X(e)||e.nodeType===R.DOCUMENT_FRAGMENT_NODE||e.nodeType===R.COMMENT_NODE||e.nodeType===R.PROCESSING_INSTRUCTION_NODE)}(t)||X(t)&&e.nodeType!==R.DOCUMENT_NODE)throw new T(q,"Unexpected node type "+t.nodeType+" for parent node type "+e.nodeType)})(e,t,r),e.nodeType===R.DOCUMENT_NODE&&(a||J)(e,t,r);var n=t.parentNode;if(n&&n.removeChild(t),t.nodeType===A){var o=t.firstChild;if(null==o)return t;var i=t.lastChild}else o=i=t;var s=r?r.previousSibling:e.lastChild;o.previousSibling=s,i.nextSibling=r,s?s.nextSibling=o:e.firstChild=o,null==r?e.lastChild=i:r.previousSibling=i;do{o.parentNode=e}while(o!==i&&(o=o.nextSibling));return G(e.ownerDocument||e,e),t.nodeType==A&&(t.firstChild=t.lastChild=null),t}function K(){this._nsMap={}}function ee(){}function te(){}function re(){}function ae(){}function ne(){}function oe(){}function ie(){}function se(){}function le(){}function ce(){}function ue(){}function he(){}function de(e,t){var r=[],a=9==this.nodeType&&this.documentElement||this,n=a.prefix,o=a.namespaceURI;if(o&&null==n&&null==(n=a.lookupPrefix(o)))var i=[{namespace:o,prefix:null}];return fe(this,r,e,t,i),r.join("")}function me(e,t,r){var a=e.prefix||"",n=e.namespaceURI;if(!n)return!1;if("xml"===a&&n===o.XML||n===o.XMLNS)return!1;for(var i=r.length;i--;){var s=r[i];if(s.prefix===a)return s.namespace!==n}return!0}function pe(e,t,r){e.push(" ",t,'="',r.replace(/[<>&"\t\n\r]/g,I),'"')}function fe(e,t,r,a,n){if(n||(n=[]),a){if(!(e=a(e)))return;if("string"==typeof e)return void t.push(e)}switch(e.nodeType){case d:var i=e.attributes,s=i.length,l=e.firstChild,c=e.tagName,u=c;if(!(r=o.isHTML(e.namespaceURI)||r)&&!e.prefix&&e.namespaceURI){for(var h,g=0;g<i.length;g++)if("xmlns"===i.item(g).name){h=i.item(g).value;break}if(!h)for(var E=n.length-1;E>=0;E--)if(""===(_=n[E]).prefix&&_.namespace===e.namespaceURI){h=_.namespace;break}if(h!==e.namespaceURI)for(E=n.length-1;E>=0;E--){var _;if((_=n[E]).namespace===e.namespaceURI){_.prefix&&(u=_.prefix+":"+c);break}}}t.push("<",u);for(var y=0;y<s;y++)"xmlns"==(q=i.item(y)).prefix?n.push({prefix:q.localName,namespace:q.value}):"xmlns"==q.nodeName&&n.push({prefix:"",namespace:q.value});for(y=0;y<s;y++){var q,D,M;me(q=i.item(y),0,n)&&(pe(t,(D=q.prefix||"")?"xmlns:"+D:"xmlns",M=q.namespaceURI),n.push({prefix:D,namespace:M})),fe(q,t,r,a,n)}if(c===u&&me(e,0,n)&&(pe(t,(D=e.prefix||"")?"xmlns:"+D:"xmlns",M=e.namespaceURI),n.push({prefix:D,namespace:M})),l||r&&!/^(?:meta|link|img|br|hr|input)$/i.test(c)){if(t.push(">"),r&&/^script$/i.test(c))for(;l;)l.data?t.push(l.data):fe(l,t,r,a,n.slice()),l=l.nextSibling;else for(;l;)fe(l,t,r,a,n.slice()),l=l.nextSibling;t.push("</",u,">")}else t.push("/>");return;case v:case A:for(l=e.firstChild;l;)fe(l,t,r,a,n.slice()),l=l.nextSibling;return;case m:return pe(t,e.name,e.value);case p:return t.push(e.data.replace(/[<&>]/g,I));case f:return t.push("<![CDATA[",e.data,"]]>");case b:return t.push("\x3c!--",e.data,"--\x3e");case C:var T=e.publicId,N=e.systemId;if(t.push("<!DOCTYPE ",e.name),T)t.push(" PUBLIC ",T),N&&"."!=N&&t.push(" ",N),t.push(">");else if(N&&"."!=N)t.push(" SYSTEM ",N,">");else{var O=e.internalSubset;O&&t.push(" [",O,"]"),t.push(">")}return;case w:return t.push("<?",e.target," ",e.data,"?>");case x:return t.push("&",e.nodeName,";");default:t.push("??",e.nodeName)}}function xe(e,t,r){var a;switch(t.nodeType){case d:(a=t.cloneNode(!1)).ownerDocument=e;case A:break;case m:r=!0}if(a||(a=t.cloneNode(!1)),a.ownerDocument=e,a.parentNode=null,r)for(var n=t.firstChild;n;)a.appendChild(xe(e,n,r)),n=n.nextSibling;return a}function ge(e,t,r){var a=new t.constructor;for(var n in t)if(Object.prototype.hasOwnProperty.call(t,n)){var o=t[n];"object"!=typeof o&&o!=a[n]&&(a[n]=o)}switch(t.childNodes&&(a.childNodes=new N),a.ownerDocument=e,a.nodeType){case d:var i=t.attributes,s=a.attributes=new B,l=i.length;s._ownerElement=a;for(var c=0;c<l;c++)a.setAttributeNode(ge(e,i.item(c),!0));break;case m:r=!0}if(r)for(var u=t.firstChild;u;)a.appendChild(ge(e,u,r)),u=u.nextSibling;return a}function we(e,t,r){e[t]=r}_.INVALID_STATE_ERR=(y[11]="Invalid state",11),_.SYNTAX_ERR=(y[12]="Syntax error",12),_.INVALID_MODIFICATION_ERR=(y[13]="Invalid modification",13),_.NAMESPACE_ERR=(y[14]="Invalid namespace",14),_.INVALID_ACCESS_ERR=(y[15]="Invalid access",15),T.prototype=Error.prototype,c(_,T),N.prototype={length:0,item:function(e){return e>=0&&e<this.length?this[e]:null},toString:function(e,t){for(var r=[],a=0;a<this.length;a++)fe(this[a],r,e,t);return r.join("")},filter:function(e){return Array.prototype.filter.call(this,e)},indexOf:function(e){return Array.prototype.indexOf.call(this,e)}},O.prototype.item=function(e){return L(this),this[e]||null},u(O,N),B.prototype={length:0,item:N.prototype.item,getNamedItem:function(e){for(var t=this.length;t--;){var r=this[t];if(r.nodeName==e)return r}},setNamedItem:function(e){var t=e.ownerElement;if(t&&t!=this._ownerElement)throw new T(M);var r=this.getNamedItem(e.nodeName);return F(this._ownerElement,this,e,r),r},setNamedItemNS:function(e){var t,r=e.ownerElement;if(r&&r!=this._ownerElement)throw new T(M);return t=this.getNamedItemNS(e.namespaceURI,e.localName),F(this._ownerElement,this,e,t),t},removeNamedItem:function(e){var t=this.getNamedItem(e);return P(this._ownerElement,this,t),t},removeNamedItemNS:function(e,t){var r=this.getNamedItemNS(e,t);return P(this._ownerElement,this,r),r},getNamedItemNS:function(e,t){for(var r=this.length;r--;){var a=this[r];if(a.localName==t&&a.namespaceURI==e)return a}return null}},k.prototype={hasFeature:function(e,t){return!0},createDocument:function(e,t,r){var a=new j;if(a.implementation=this,a.childNodes=new N,a.doctype=r||null,r&&a.appendChild(r),t){var n=a.createElementNS(e,t);a.appendChild(n)}return a},createDocumentType:function(e,t,r){var a=new oe;return a.name=e,a.nodeName=e,a.publicId=t||"",a.systemId=r||"",a}},R.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,attributes:null,parentNode:null,childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,insertBefore:function(e,t){return Q(this,e,t)},replaceChild:function(e,t){Q(this,e,t,Z),t&&this.removeChild(t)},removeChild:function(e){return $(this,e)},appendChild:function(e){return this.insertBefore(e,null)},hasChildNodes:function(){return null!=this.firstChild},cloneNode:function(e){return ge(this.ownerDocument||this,this,e)},normalize:function(){for(var e=this.firstChild;e;){var t=e.nextSibling;t&&t.nodeType==p&&e.nodeType==p?(this.removeChild(t),e.appendData(t.data)):(e.normalize(),e=t)}},isSupported:function(e,t){return this.ownerDocument.implementation.hasFeature(e,t)},hasAttributes:function(){return this.attributes.length>0},lookupPrefix:function(e){for(var t=this;t;){var r=t._nsMap;if(r)for(var a in r)if(Object.prototype.hasOwnProperty.call(r,a)&&r[a]===e)return a;t=t.nodeType==m?t.ownerDocument:t.parentNode}return null},lookupNamespaceURI:function(e){for(var t=this;t;){var r=t._nsMap;if(r&&Object.prototype.hasOwnProperty.call(r,e))return r[e];t=t.nodeType==m?t.ownerDocument:t.parentNode}return null},isDefaultNamespace:function(e){return null==this.lookupPrefix(e)}},c(h,R),c(h,R.prototype),j.prototype={nodeName:"#document",nodeType:v,doctype:null,documentElement:null,_inc:1,insertBefore:function(e,t){if(e.nodeType==A){for(var r=e.firstChild;r;){var a=r.nextSibling;this.insertBefore(r,t),r=a}return e}return Q(this,e,t),e.ownerDocument=this,null===this.documentElement&&e.nodeType===d&&(this.documentElement=e),e},removeChild:function(e){return this.documentElement==e&&(this.documentElement=null),$(this,e)},replaceChild:function(e,t){Q(this,e,t,Z),e.ownerDocument=this,t&&this.removeChild(t),H(e)&&(this.documentElement=e)},importNode:function(e,t){return xe(this,e,t)},getElementById:function(e){var t=null;return U(this.documentElement,(function(r){if(r.nodeType==d&&r.getAttribute("id")==e)return t=r,!0})),t},getElementsByClassName:function(e){var t=l(e);return new O(this,(function(r){var a=[];return t.length>0&&U(r.documentElement,(function(n){if(n!==r&&n.nodeType===d){var o=n.getAttribute("class");if(o){var i=e===o;if(!i){var s=l(o);i=t.every((c=s,function(e){return c&&-1!==c.indexOf(e)}))}i&&a.push(n)}}var c})),a}))},createElement:function(e){var t=new K;return t.ownerDocument=this,t.nodeName=e,t.tagName=e,t.localName=e,t.childNodes=new N,(t.attributes=new B)._ownerElement=t,t},createDocumentFragment:function(){var e=new ce;return e.ownerDocument=this,e.childNodes=new N,e},createTextNode:function(e){var t=new re;return t.ownerDocument=this,t.appendData(e),t},createComment:function(e){var t=new ae;return t.ownerDocument=this,t.appendData(e),t},createCDATASection:function(e){var t=new ne;return t.ownerDocument=this,t.appendData(e),t},createProcessingInstruction:function(e,t){var r=new ue;return r.ownerDocument=this,r.tagName=r.nodeName=r.target=e,r.nodeValue=r.data=t,r},createAttribute:function(e){var t=new ee;return t.ownerDocument=this,t.name=e,t.nodeName=e,t.localName=e,t.specified=!0,t},createEntityReference:function(e){var t=new le;return t.ownerDocument=this,t.nodeName=e,t},createElementNS:function(e,t){var r=new K,a=t.split(":"),n=r.attributes=new B;return r.childNodes=new N,r.ownerDocument=this,r.nodeName=t,r.tagName=t,r.namespaceURI=e,2==a.length?(r.prefix=a[0],r.localName=a[1]):r.localName=t,n._ownerElement=r,r},createAttributeNS:function(e,t){var r=new ee,a=t.split(":");return r.ownerDocument=this,r.nodeName=t,r.name=t,r.namespaceURI=e,r.specified=!0,2==a.length?(r.prefix=a[0],r.localName=a[1]):r.localName=t,r}},u(j,R),K.prototype={nodeType:d,hasAttribute:function(e){return null!=this.getAttributeNode(e)},getAttribute:function(e){var t=this.getAttributeNode(e);return t&&t.value||""},getAttributeNode:function(e){return this.attributes.getNamedItem(e)},setAttribute:function(e,t){var r=this.ownerDocument.createAttribute(e);r.value=r.nodeValue=""+t,this.setAttributeNode(r)},removeAttribute:function(e){var t=this.getAttributeNode(e);t&&this.removeAttributeNode(t)},appendChild:function(e){return e.nodeType===A?this.insertBefore(e,null):function(e,t){return t.parentNode&&t.parentNode.removeChild(t),t.parentNode=e,t.previousSibling=e.lastChild,t.nextSibling=null,t.previousSibling?t.previousSibling.nextSibling=t:e.firstChild=t,e.lastChild=t,G(e.ownerDocument,e,t),t}(this,e)},setAttributeNode:function(e){return this.attributes.setNamedItem(e)},setAttributeNodeNS:function(e){return this.attributes.setNamedItemNS(e)},removeAttributeNode:function(e){return this.attributes.removeNamedItem(e.nodeName)},removeAttributeNS:function(e,t){var r=this.getAttributeNodeNS(e,t);r&&this.removeAttributeNode(r)},hasAttributeNS:function(e,t){return null!=this.getAttributeNodeNS(e,t)},getAttributeNS:function(e,t){var r=this.getAttributeNodeNS(e,t);return r&&r.value||""},setAttributeNS:function(e,t,r){var a=this.ownerDocument.createAttributeNS(e,t);a.value=a.nodeValue=""+r,this.setAttributeNode(a)},getAttributeNodeNS:function(e,t){return this.attributes.getNamedItemNS(e,t)},getElementsByTagName:function(e){return new O(this,(function(t){var r=[];return U(t,(function(a){a===t||a.nodeType!=d||"*"!==e&&a.tagName!=e||r.push(a)})),r}))},getElementsByTagNameNS:function(e,t){return new O(this,(function(r){var a=[];return U(r,(function(n){n===r||n.nodeType!==d||"*"!==e&&n.namespaceURI!==e||"*"!==t&&n.localName!=t||a.push(n)})),a}))}},j.prototype.getElementsByTagName=K.prototype.getElementsByTagName,j.prototype.getElementsByTagNameNS=K.prototype.getElementsByTagNameNS,u(K,R),ee.prototype.nodeType=m,u(ee,R),te.prototype={data:"",substringData:function(e,t){return this.data.substring(e,e+t)},appendData:function(e){e=this.data+e,this.nodeValue=this.data=e,this.length=e.length},insertData:function(e,t){this.replaceData(e,0,t)},appendChild:function(e){throw new Error(y[q])},deleteData:function(e,t){this.replaceData(e,t,"")},replaceData:function(e,t,r){r=this.data.substring(0,e)+r+this.data.substring(e+t),this.nodeValue=this.data=r,this.length=r.length}},u(te,R),re.prototype={nodeName:"#text",nodeType:p,splitText:function(e){var t=this.data,r=t.substring(e);t=t.substring(0,e),this.data=this.nodeValue=t,this.length=t.length;var a=this.ownerDocument.createTextNode(r);return this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling),a}},u(re,te),ae.prototype={nodeName:"#comment",nodeType:b},u(ae,te),ne.prototype={nodeName:"#cdata-section",nodeType:f},u(ne,te),oe.prototype.nodeType=C,u(oe,R),ie.prototype.nodeType=E,u(ie,R),se.prototype.nodeType=g,u(se,R),le.prototype.nodeType=x,u(le,R),ce.prototype.nodeName="#document-fragment",ce.prototype.nodeType=A,u(ce,R),ue.prototype.nodeType=w,u(ue,R),he.prototype.serializeToString=function(e,t,r){return de.call(e,t,r)},R.prototype.toString=de;try{if(Object.defineProperty){function be(e){switch(e.nodeType){case d:case A:var t=[];for(e=e.firstChild;e;)7!==e.nodeType&&8!==e.nodeType&&t.push(be(e)),e=e.nextSibling;return t.join("");default:return e.nodeValue}}Object.defineProperty(O.prototype,"length",{get:function(){return L(this),this.$$length}}),Object.defineProperty(R.prototype,"textContent",{get:function(){return be(this)},set:function(e){switch(this.nodeType){case d:case A:for(;this.firstChild;)this.removeChild(this.firstChild);(e||String(e))&&this.appendChild(this.ownerDocument.createTextNode(e));break;default:this.data=e,this.value=e,this.nodeValue=e}}}),we=function(e,t,r){e["$$"+t]=r}}}catch(ve){}t.DocumentType=oe,t.DOMException=T,t.DOMImplementation=k,t.Element=K,t.Node=R,t.NodeList=N,t.XMLSerializer=he},6559:(e,t,r)=>{"use strict";var a=r(4582).freeze;t.XML_ENTITIES=a({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'}),t.HTML_ENTITIES=a({Aacute:"Á",aacute:"á",Abreve:"Ă",abreve:"ă",ac:"∾",acd:"∿",acE:"∾̳",Acirc:"Â",acirc:"â",acute:"´",Acy:"А",acy:"а",AElig:"Æ",aelig:"æ",af:"⁡",Afr:"𝔄",afr:"𝔞",Agrave:"À",agrave:"à",alefsym:"ℵ",aleph:"ℵ",Alpha:"Α",alpha:"α",Amacr:"Ā",amacr:"ā",amalg:"⨿",AMP:"&",amp:"&",And:"⩓",and:"∧",andand:"⩕",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsd:"∡",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",Aogon:"Ą",aogon:"ą",Aopf:"𝔸",aopf:"𝕒",ap:"≈",apacir:"⩯",apE:"⩰",ape:"≊",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",Aring:"Å",aring:"å",Ascr:"𝒜",ascr:"𝒶",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",Barwed:"⌆",barwed:"⌅",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",Bcy:"Б",bcy:"б",bdquo:"„",becaus:"∵",Because:"∵",because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",Beta:"Β",beta:"β",beth:"ℶ",between:"≬",Bfr:"𝔅",bfr:"𝔟",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bNot:"⫭",bnot:"⌐",Bopf:"𝔹",bopf:"𝕓",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxDL:"╗",boxDl:"╖",boxdL:"╕",boxdl:"┐",boxDR:"╔",boxDr:"╓",boxdR:"╒",boxdr:"┌",boxH:"═",boxh:"─",boxHD:"╦",boxHd:"╤",boxhD:"╥",boxhd:"┬",boxHU:"╩",boxHu:"╧",boxhU:"╨",boxhu:"┴",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxUL:"╝",boxUl:"╜",boxuL:"╛",boxul:"┘",boxUR:"╚",boxUr:"╙",boxuR:"╘",boxur:"└",boxV:"║",boxv:"│",boxVH:"╬",boxVh:"╫",boxvH:"╪",boxvh:"┼",boxVL:"╣",boxVl:"╢",boxvL:"╡",boxvl:"┤",boxVR:"╠",boxVr:"╟",boxvR:"╞",boxvr:"├",bprime:"‵",Breve:"˘",breve:"˘",brvbar:"¦",Bscr:"ℬ",bscr:"𝒷",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsol:"\\",bsolb:"⧅",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpE:"⪮",bumpe:"≏",Bumpeq:"≎",bumpeq:"≏",Cacute:"Ć",cacute:"ć",Cap:"⋒",cap:"∩",capand:"⩄",capbrcup:"⩉",capcap:"⩋",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",Ccaron:"Č",ccaron:"č",Ccedil:"Ç",ccedil:"ç",Ccirc:"Ĉ",ccirc:"ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",Cdot:"Ċ",cdot:"ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",CenterDot:"·",centerdot:"·",Cfr:"ℭ",cfr:"𝔠",CHcy:"Ч",chcy:"ч",check:"✓",checkmark:"✓",Chi:"Χ",chi:"χ",cir:"○",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cirE:"⧃",cire:"≗",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",Colon:"∷",colon:":",Colone:"⩴",colone:"≔",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",Conint:"∯",conint:"∮",ContourIntegral:"∮",Copf:"ℂ",copf:"𝕔",coprod:"∐",Coproduct:"∐",COPY:"©",copy:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",Cross:"⨯",cross:"✗",Cscr:"𝒞",cscr:"𝒸",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",Cup:"⋓",cup:"∪",cupbrcap:"⩈",CupCap:"≍",cupcap:"⩆",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",Dagger:"‡",dagger:"†",daleth:"ℸ",Darr:"↡",dArr:"⇓",darr:"↓",dash:"‐",Dashv:"⫤",dashv:"⊣",dbkarow:"⤏",dblac:"˝",Dcaron:"Ď",dcaron:"ď",Dcy:"Д",dcy:"д",DD:"ⅅ",dd:"ⅆ",ddagger:"‡",ddarr:"⇊",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",Delta:"Δ",delta:"δ",demptyv:"⦱",dfisht:"⥿",Dfr:"𝔇",dfr:"𝔡",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",Diamond:"⋄",diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",DJcy:"Ђ",djcy:"ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",Dopf:"𝔻",dopf:"𝕕",Dot:"¨",dot:"˙",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",DownArrow:"↓",Downarrow:"⇓",downarrow:"↓",DownArrowBar:"⤓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVector:"↽",DownLeftVectorBar:"⥖",DownRightTeeVector:"⥟",DownRightVector:"⇁",DownRightVectorBar:"⥗",DownTee:"⊤",DownTeeArrow:"↧",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",Dscr:"𝒟",dscr:"𝒹",DScy:"Ѕ",dscy:"ѕ",dsol:"⧶",Dstrok:"Đ",dstrok:"đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",DZcy:"Џ",dzcy:"џ",dzigrarr:"⟿",Eacute:"É",eacute:"é",easter:"⩮",Ecaron:"Ě",ecaron:"ě",ecir:"≖",Ecirc:"Ê",ecirc:"ê",ecolon:"≕",Ecy:"Э",ecy:"э",eDDot:"⩷",Edot:"Ė",eDot:"≑",edot:"ė",ee:"ⅇ",efDot:"≒",Efr:"𝔈",efr:"𝔢",eg:"⪚",Egrave:"È",egrave:"è",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",Emacr:"Ē",emacr:"ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp:" ",emsp13:" ",emsp14:" ",ENG:"Ŋ",eng:"ŋ",ensp:" ",Eogon:"Ę",eogon:"ę",Eopf:"𝔼",eopf:"𝕖",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",Epsilon:"Ε",epsilon:"ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",Escr:"ℰ",escr:"ℯ",esdot:"≐",Esim:"⩳",esim:"≂",Eta:"Η",eta:"η",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",ExponentialE:"ⅇ",exponentiale:"ⅇ",fallingdotseq:"≒",Fcy:"Ф",fcy:"ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",Ffr:"𝔉",ffr:"𝔣",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",Fopf:"𝔽",fopf:"𝕗",ForAll:"∀",forall:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",Fscr:"ℱ",fscr:"𝒻",gacute:"ǵ",Gamma:"Γ",gamma:"γ",Gammad:"Ϝ",gammad:"ϝ",gap:"⪆",Gbreve:"Ğ",gbreve:"ğ",Gcedil:"Ģ",Gcirc:"Ĝ",gcirc:"ĝ",Gcy:"Г",gcy:"г",Gdot:"Ġ",gdot:"ġ",gE:"≧",ge:"≥",gEl:"⪌",gel:"⋛",geq:"≥",geqq:"≧",geqslant:"⩾",ges:"⩾",gescc:"⪩",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",Gfr:"𝔊",gfr:"𝔤",Gg:"⋙",gg:"≫",ggg:"⋙",gimel:"ℷ",GJcy:"Ѓ",gjcy:"ѓ",gl:"≷",gla:"⪥",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gnE:"≩",gne:"⪈",gneq:"⪈",gneqq:"≩",gnsim:"⋧",Gopf:"𝔾",gopf:"𝕘",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",Gscr:"𝒢",gscr:"ℊ",gsim:"≳",gsime:"⪎",gsiml:"⪐",Gt:"≫",GT:">",gt:">",gtcc:"⪧",gtcir:"⩺",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",HARDcy:"Ъ",hardcy:"ъ",hArr:"⇔",harr:"↔",harrcir:"⥈",harrw:"↭",Hat:"^",hbar:"ℏ",Hcirc:"Ĥ",hcirc:"ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",Hfr:"ℌ",hfr:"𝔥",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",Hopf:"ℍ",hopf:"𝕙",horbar:"―",HorizontalLine:"─",Hscr:"ℋ",hscr:"𝒽",hslash:"ℏ",Hstrok:"Ħ",hstrok:"ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",Iacute:"Í",iacute:"í",ic:"⁣",Icirc:"Î",icirc:"î",Icy:"И",icy:"и",Idot:"İ",IEcy:"Е",iecy:"е",iexcl:"¡",iff:"⇔",Ifr:"ℑ",ifr:"𝔦",Igrave:"Ì",igrave:"ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",IJlig:"Ĳ",ijlig:"ĳ",Im:"ℑ",Imacr:"Ī",imacr:"ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",imof:"⊷",imped:"Ƶ",Implies:"⇒",in:"∈",incare:"℅",infin:"∞",infintie:"⧝",inodot:"ı",Int:"∬",int:"∫",intcal:"⊺",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",IOcy:"Ё",iocy:"ё",Iogon:"Į",iogon:"į",Iopf:"𝕀",iopf:"𝕚",Iota:"Ι",iota:"ι",iprod:"⨼",iquest:"¿",Iscr:"ℐ",iscr:"𝒾",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",Itilde:"Ĩ",itilde:"ĩ",Iukcy:"І",iukcy:"і",Iuml:"Ï",iuml:"ï",Jcirc:"Ĵ",jcirc:"ĵ",Jcy:"Й",jcy:"й",Jfr:"𝔍",jfr:"𝔧",jmath:"ȷ",Jopf:"𝕁",jopf:"𝕛",Jscr:"𝒥",jscr:"𝒿",Jsercy:"Ј",jsercy:"ј",Jukcy:"Є",jukcy:"є",Kappa:"Κ",kappa:"κ",kappav:"ϰ",Kcedil:"Ķ",kcedil:"ķ",Kcy:"К",kcy:"к",Kfr:"𝔎",kfr:"𝔨",kgreen:"ĸ",KHcy:"Х",khcy:"х",KJcy:"Ќ",kjcy:"ќ",Kopf:"𝕂",kopf:"𝕜",Kscr:"𝒦",kscr:"𝓀",lAarr:"⇚",Lacute:"Ĺ",lacute:"ĺ",laemptyv:"⦴",lagran:"ℒ",Lambda:"Λ",lambda:"λ",Lang:"⟪",lang:"⟨",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",Larr:"↞",lArr:"⇐",larr:"←",larrb:"⇤",larrbfs:"⤟",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",lat:"⪫",lAtail:"⤛",latail:"⤙",late:"⪭",lates:"⪭︀",lBarr:"⤎",lbarr:"⤌",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",Lcaron:"Ľ",lcaron:"ľ",Lcedil:"Ļ",lcedil:"ļ",lceil:"⌈",lcub:"{",Lcy:"Л",lcy:"л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",lE:"≦",le:"≤",LeftAngleBracket:"⟨",LeftArrow:"←",Leftarrow:"⇐",leftarrow:"←",LeftArrowBar:"⇤",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVector:"⇃",LeftDownVectorBar:"⥙",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",LeftRightArrow:"↔",Leftrightarrow:"⇔",leftrightarrow:"↔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTee:"⊣",LeftTeeArrow:"↤",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangle:"⊲",LeftTriangleBar:"⧏",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVector:"↿",LeftUpVectorBar:"⥘",LeftVector:"↼",LeftVectorBar:"⥒",lEg:"⪋",leg:"⋚",leq:"≤",leqq:"≦",leqslant:"⩽",les:"⩽",lescc:"⪨",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",Lfr:"𝔏",lfr:"𝔩",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",LJcy:"Љ",ljcy:"љ",Ll:"⋘",ll:"≪",llarr:"⇇",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",Lmidot:"Ŀ",lmidot:"ŀ",lmoust:"⎰",lmoustache:"⎰",lnap:"⪉",lnapprox:"⪉",lnE:"≨",lne:"⪇",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",LongLeftArrow:"⟵",Longleftarrow:"⟸",longleftarrow:"⟵",LongLeftRightArrow:"⟷",Longleftrightarrow:"⟺",longleftrightarrow:"⟷",longmapsto:"⟼",LongRightArrow:"⟶",Longrightarrow:"⟹",longrightarrow:"⟶",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",Lopf:"𝕃",lopf:"𝕝",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",Lscr:"ℒ",lscr:"𝓁",Lsh:"↰",lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",Lstrok:"Ł",lstrok:"ł",Lt:"≪",LT:"<",lt:"<",ltcc:"⪦",ltcir:"⩹",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",Map:"⤅",map:"↦",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",Mcy:"М",mcy:"м",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",Mfr:"𝔐",mfr:"𝔪",mho:"℧",micro:"µ",mid:"∣",midast:"*",midcir:"⫰",middot:"·",minus:"−",minusb:"⊟",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",Mopf:"𝕄",mopf:"𝕞",mp:"∓",Mscr:"ℳ",mscr:"𝓂",mstpos:"∾",Mu:"Μ",mu:"μ",multimap:"⊸",mumap:"⊸",nabla:"∇",Nacute:"Ń",nacute:"ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natur:"♮",natural:"♮",naturals:"ℕ",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",Ncaron:"Ň",ncaron:"ň",Ncedil:"Ņ",ncedil:"ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",Ncy:"Н",ncy:"н",ndash:"–",ne:"≠",nearhk:"⤤",neArr:"⇗",nearr:"↗",nearrow:"↗",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",Nfr:"𝔑",nfr:"𝔫",ngE:"≧̸",nge:"≱",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",nGt:"≫⃒",ngt:"≯",ngtr:"≯",nGtv:"≫̸",nhArr:"⇎",nharr:"↮",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",NJcy:"Њ",njcy:"њ",nlArr:"⇍",nlarr:"↚",nldr:"‥",nlE:"≦̸",nle:"≰",nLeftarrow:"⇍",nleftarrow:"↚",nLeftrightarrow:"⇎",nleftrightarrow:"↮",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nLt:"≪⃒",nlt:"≮",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",Nopf:"ℕ",nopf:"𝕟",Not:"⫬",not:"¬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangle:"⋪",NotLeftTriangleBar:"⧏̸",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangle:"⋫",NotRightTriangleBar:"⧐̸",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",npar:"∦",nparallel:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",npre:"⪯̸",nprec:"⊀",npreceq:"⪯̸",nrArr:"⇏",nrarr:"↛",nrarrc:"⤳̸",nrarrw:"↝̸",nRightarrow:"⇏",nrightarrow:"↛",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",Nscr:"𝒩",nscr:"𝓃",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsubE:"⫅̸",nsube:"⊈",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupE:"⫆̸",nsupe:"⊉",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",Ntilde:"Ñ",ntilde:"ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",Nu:"Ν",nu:"ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nVDash:"⊯",nVdash:"⊮",nvDash:"⊭",nvdash:"⊬",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwArr:"⇖",nwarr:"↖",nwarrow:"↖",nwnear:"⤧",Oacute:"Ó",oacute:"ó",oast:"⊛",ocir:"⊚",Ocirc:"Ô",ocirc:"ô",Ocy:"О",ocy:"о",odash:"⊝",Odblac:"Ő",odblac:"ő",odiv:"⨸",odot:"⊙",odsold:"⦼",OElig:"Œ",oelig:"œ",ofcir:"⦿",Ofr:"𝔒",ofr:"𝔬",ogon:"˛",Ograve:"Ò",ograve:"ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",Omacr:"Ō",omacr:"ō",Omega:"Ω",omega:"ω",Omicron:"Ο",omicron:"ο",omid:"⦶",ominus:"⊖",Oopf:"𝕆",oopf:"𝕠",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",Or:"⩔",or:"∨",orarr:"↻",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",Oscr:"𝒪",oscr:"ℴ",Oslash:"Ø",oslash:"ø",osol:"⊘",Otilde:"Õ",otilde:"õ",Otimes:"⨷",otimes:"⊗",otimesas:"⨶",Ouml:"Ö",ouml:"ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",par:"∥",para:"¶",parallel:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",Pcy:"П",pcy:"п",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",Pfr:"𝔓",pfr:"𝔭",Phi:"Φ",phi:"φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",Pi:"Π",pi:"π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plus:"+",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",Popf:"ℙ",popf:"𝕡",pound:"£",Pr:"⪻",pr:"≺",prap:"⪷",prcue:"≼",prE:"⪳",pre:"⪯",prec:"≺",precapprox:"⪷",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",precsim:"≾",Prime:"″",prime:"′",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportion:"∷",Proportional:"∝",propto:"∝",prsim:"≾",prurel:"⊰",Pscr:"𝒫",pscr:"𝓅",Psi:"Ψ",psi:"ψ",puncsp:" ",Qfr:"𝔔",qfr:"𝔮",qint:"⨌",Qopf:"ℚ",qopf:"𝕢",qprime:"⁗",Qscr:"𝒬",qscr:"𝓆",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",QUOT:'"',quot:'"',rAarr:"⇛",race:"∽̱",Racute:"Ŕ",racute:"ŕ",radic:"√",raemptyv:"⦳",Rang:"⟫",rang:"⟩",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",Rarr:"↠",rArr:"⇒",rarr:"→",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",Rarrtl:"⤖",rarrtl:"↣",rarrw:"↝",rAtail:"⤜",ratail:"⤚",ratio:"∶",rationals:"ℚ",RBarr:"⤐",rBarr:"⤏",rbarr:"⤍",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",Rcaron:"Ř",rcaron:"ř",Rcedil:"Ŗ",rcedil:"ŗ",rceil:"⌉",rcub:"}",Rcy:"Р",rcy:"р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",Re:"ℜ",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",rect:"▭",REG:"®",reg:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",Rfr:"ℜ",rfr:"𝔯",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",Rho:"Ρ",rho:"ρ",rhov:"ϱ",RightAngleBracket:"⟩",RightArrow:"→",Rightarrow:"⇒",rightarrow:"→",RightArrowBar:"⇥",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVector:"⇂",RightDownVectorBar:"⥕",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTee:"⊢",RightTeeArrow:"↦",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangle:"⊳",RightTriangleBar:"⧐",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVector:"↾",RightUpVectorBar:"⥔",RightVector:"⇀",RightVectorBar:"⥓",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoust:"⎱",rmoustache:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",Ropf:"ℝ",ropf:"𝕣",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",Rscr:"ℛ",rscr:"𝓇",Rsh:"↱",rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",Sacute:"Ś",sacute:"ś",sbquo:"‚",Sc:"⪼",sc:"≻",scap:"⪸",Scaron:"Š",scaron:"š",sccue:"≽",scE:"⪴",sce:"⪰",Scedil:"Ş",scedil:"ş",Scirc:"Ŝ",scirc:"ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",Scy:"С",scy:"с",sdot:"⋅",sdotb:"⊡",sdote:"⩦",searhk:"⤥",seArr:"⇘",searr:"↘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",Sfr:"𝔖",sfr:"𝔰",sfrown:"⌢",sharp:"♯",SHCHcy:"Щ",shchcy:"щ",SHcy:"Ш",shcy:"ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",Sigma:"Σ",sigma:"σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",SOFTcy:"Ь",softcy:"ь",sol:"/",solb:"⧄",solbar:"⌿",Sopf:"𝕊",sopf:"𝕤",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",squ:"□",Square:"□",square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squf:"▪",srarr:"→",Sscr:"𝒮",sscr:"𝓈",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",Star:"⋆",star:"☆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",Sub:"⋐",sub:"⊂",subdot:"⪽",subE:"⫅",sube:"⊆",subedot:"⫃",submult:"⫁",subnE:"⫋",subne:"⊊",subplus:"⪿",subrarr:"⥹",Subset:"⋐",subset:"⊂",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succ:"≻",succapprox:"⪸",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",Sum:"∑",sum:"∑",sung:"♪",Sup:"⋑",sup:"⊃",sup1:"¹",sup2:"²",sup3:"³",supdot:"⪾",supdsub:"⫘",supE:"⫆",supe:"⊇",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supnE:"⫌",supne:"⊋",supplus:"⫀",Supset:"⋑",supset:"⊃",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swArr:"⇙",swarr:"↙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",Tau:"Τ",tau:"τ",tbrk:"⎴",Tcaron:"Ť",tcaron:"ť",Tcedil:"Ţ",tcedil:"ţ",Tcy:"Т",tcy:"т",tdot:"⃛",telrec:"⌕",Tfr:"𝔗",tfr:"𝔱",there4:"∴",Therefore:"∴",therefore:"∴",Theta:"Θ",theta:"θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",thinsp:" ",ThinSpace:" ",thkap:"≈",thksim:"∼",THORN:"Þ",thorn:"þ",Tilde:"∼",tilde:"˜",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",times:"×",timesb:"⊠",timesbar:"⨱",timesd:"⨰",tint:"∭",toea:"⤨",top:"⊤",topbot:"⌶",topcir:"⫱",Topf:"𝕋",topf:"𝕥",topfork:"⫚",tosa:"⤩",tprime:"‴",TRADE:"™",trade:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",Tscr:"𝒯",tscr:"𝓉",TScy:"Ц",tscy:"ц",TSHcy:"Ћ",tshcy:"ћ",Tstrok:"Ŧ",tstrok:"ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",Uacute:"Ú",uacute:"ú",Uarr:"↟",uArr:"⇑",uarr:"↑",Uarrocir:"⥉",Ubrcy:"Ў",ubrcy:"ў",Ubreve:"Ŭ",ubreve:"ŭ",Ucirc:"Û",ucirc:"û",Ucy:"У",ucy:"у",udarr:"⇅",Udblac:"Ű",udblac:"ű",udhar:"⥮",ufisht:"⥾",Ufr:"𝔘",ufr:"𝔲",Ugrave:"Ù",ugrave:"ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",Umacr:"Ū",umacr:"ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",Uogon:"Ų",uogon:"ų",Uopf:"𝕌",uopf:"𝕦",UpArrow:"↑",Uparrow:"⇑",uparrow:"↑",UpArrowBar:"⤒",UpArrowDownArrow:"⇅",UpDownArrow:"↕",Updownarrow:"⇕",updownarrow:"↕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",Upsi:"ϒ",upsi:"υ",upsih:"ϒ",Upsilon:"Υ",upsilon:"υ",UpTee:"⊥",UpTeeArrow:"↥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",Uring:"Ů",uring:"ů",urtri:"◹",Uscr:"𝒰",uscr:"𝓊",utdot:"⋰",Utilde:"Ũ",utilde:"ũ",utri:"▵",utrif:"▴",uuarr:"⇈",Uuml:"Ü",uuml:"ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",vArr:"⇕",varr:"↕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",Vbar:"⫫",vBar:"⫨",vBarv:"⫩",Vcy:"В",vcy:"в",VDash:"⊫",Vdash:"⊩",vDash:"⊨",vdash:"⊢",Vdashl:"⫦",Vee:"⋁",vee:"∨",veebar:"⊻",veeeq:"≚",vellip:"⋮",Verbar:"‖",verbar:"|",Vert:"‖",vert:"|",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",Vfr:"𝔙",vfr:"𝔳",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",Vopf:"𝕍",vopf:"𝕧",vprop:"∝",vrtri:"⊳",Vscr:"𝒱",vscr:"𝓋",vsubnE:"⫋︀",vsubne:"⊊︀",vsupnE:"⫌︀",vsupne:"⊋︀",Vvdash:"⊪",vzigzag:"⦚",Wcirc:"Ŵ",wcirc:"ŵ",wedbar:"⩟",Wedge:"⋀",wedge:"∧",wedgeq:"≙",weierp:"℘",Wfr:"𝔚",wfr:"𝔴",Wopf:"𝕎",wopf:"𝕨",wp:"℘",wr:"≀",wreath:"≀",Wscr:"𝒲",wscr:"𝓌",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",Xfr:"𝔛",xfr:"𝔵",xhArr:"⟺",xharr:"⟷",Xi:"Ξ",xi:"ξ",xlArr:"⟸",xlarr:"⟵",xmap:"⟼",xnis:"⋻",xodot:"⨀",Xopf:"𝕏",xopf:"𝕩",xoplus:"⨁",xotime:"⨂",xrArr:"⟹",xrarr:"⟶",Xscr:"𝒳",xscr:"𝓍",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",Yacute:"Ý",yacute:"ý",YAcy:"Я",yacy:"я",Ycirc:"Ŷ",ycirc:"ŷ",Ycy:"Ы",ycy:"ы",yen:"¥",Yfr:"𝔜",yfr:"𝔶",YIcy:"Ї",yicy:"ї",Yopf:"𝕐",yopf:"𝕪",Yscr:"𝒴",yscr:"𝓎",YUcy:"Ю",yucy:"ю",Yuml:"Ÿ",yuml:"ÿ",Zacute:"Ź",zacute:"ź",Zcaron:"Ž",zcaron:"ž",Zcy:"З",zcy:"з",Zdot:"Ż",zdot:"ż",zeetrf:"ℨ",ZeroWidthSpace:"​",Zeta:"Ζ",zeta:"ζ",Zfr:"ℨ",zfr:"𝔷",ZHcy:"Ж",zhcy:"ж",zigrarr:"⇝",Zopf:"ℤ",zopf:"𝕫",Zscr:"𝒵",zscr:"𝓏",zwj:"‍",zwnj:"‌"}),t.entityMap=t.HTML_ENTITIES},8978:(e,t,r)=>{var a=r(4722);t.DOMImplementation=a.DOMImplementation,t.XMLSerializer=a.XMLSerializer,t.DOMParser=r(5752).DOMParser},4466:(e,t,r)=>{var a=r(4582).NAMESPACE,n=/[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,o=new RegExp("[\\-\\.0-9"+n.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"),i=new RegExp("^"+n.source+o.source+"*(?::"+n.source+o.source+"*)?$");function s(e,t){this.message=e,this.locator=t,Error.captureStackTrace&&Error.captureStackTrace(this,s)}function l(){}function c(e,t){return t.lineNumber=e.lineNumber,t.columnNumber=e.columnNumber,t}function u(e,t,r,n,o,i){function s(e,t,a){r.attributeNames.hasOwnProperty(e)&&i.fatalError("Attribute "+e+" redefined"),r.addValue(e,t.replace(/[\t\n\r]/g," ").replace(/&#?\w+;/g,o),a)}for(var l,c=++t,u=0;;){var h=e.charAt(c);switch(h){case"=":if(1===u)l=e.slice(t,c),u=3;else{if(2!==u)throw new Error("attribute equal must after attrName");u=3}break;case"'":case'"':if(3===u||1===u){if(1===u&&(i.warning('attribute value must after "="'),l=e.slice(t,c)),t=c+1,!((c=e.indexOf(h,t))>0))throw new Error("attribute value no end '"+h+"' match");s(l,d=e.slice(t,c),t-1),u=5}else{if(4!=u)throw new Error('attribute value must after "="');s(l,d=e.slice(t,c),t),i.warning('attribute "'+l+'" missed start quot('+h+")!!"),t=c+1,u=5}break;case"/":switch(u){case 0:r.setTagName(e.slice(t,c));case 5:case 6:case 7:u=7,r.closed=!0;case 4:case 1:break;case 2:r.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return i.error("unexpected end of input"),0==u&&r.setTagName(e.slice(t,c)),c;case">":switch(u){case 0:r.setTagName(e.slice(t,c));case 5:case 6:case 7:break;case 4:case 1:"/"===(d=e.slice(t,c)).slice(-1)&&(r.closed=!0,d=d.slice(0,-1));case 2:2===u&&(d=l),4==u?(i.warning('attribute "'+d+'" missed quot(")!'),s(l,d,t)):(a.isHTML(n[""])&&d.match(/^(?:disabled|checked|selected)$/i)||i.warning('attribute "'+d+'" missed value!! "'+d+'" instead!!'),s(d,d,t));break;case 3:throw new Error("attribute value missed!!")}return c;case"":h=" ";default:if(h<=" ")switch(u){case 0:r.setTagName(e.slice(t,c)),u=6;break;case 1:l=e.slice(t,c),u=2;break;case 4:var d=e.slice(t,c);i.warning('attribute "'+d+'" missed quot(")!!'),s(l,d,t);case 5:u=6}else switch(u){case 2:r.tagName,a.isHTML(n[""])&&l.match(/^(?:disabled|checked|selected)$/i)||i.warning('attribute "'+l+'" missed value!! "'+l+'" instead2!!'),s(l,l,t),t=c,u=1;break;case 5:i.warning('attribute space is required"'+l+'"!!');case 6:u=1,t=c;break;case 3:u=4,t=c;break;case 7:throw new Error("elements closed character '/' and '>' must be connected to")}}c++}}function h(e,t,r){for(var n=e.tagName,o=null,i=e.length;i--;){var s=e[i],l=s.qName,c=s.value;if((m=l.indexOf(":"))>0)var u=s.prefix=l.slice(0,m),h=l.slice(m+1),d="xmlns"===u&&h;else h=l,u=null,d="xmlns"===l&&"";s.localName=h,!1!==d&&(null==o&&(o={},p(r,r={})),r[d]=o[d]=c,s.uri=a.XMLNS,t.startPrefixMapping(d,c))}for(i=e.length;i--;)(u=(s=e[i]).prefix)&&("xml"===u&&(s.uri=a.XML),"xmlns"!==u&&(s.uri=r[u||""]));var m;(m=n.indexOf(":"))>0?(u=e.prefix=n.slice(0,m),h=e.localName=n.slice(m+1)):(u=null,h=e.localName=n);var f=e.uri=r[u||""];if(t.startElement(f,h,n,e),!e.closed)return e.currentNSMap=r,e.localNSMap=o,!0;if(t.endElement(f,h,n),o)for(u in o)Object.prototype.hasOwnProperty.call(o,u)&&t.endPrefixMapping(u)}function d(e,t,r,a,n){if(/^(?:script|textarea)$/i.test(r)){var o=e.indexOf("</"+r+">",t),i=e.substring(t+1,o);if(/[&<]/.test(i))return/^script$/i.test(r)?(n.characters(i,0,i.length),o):(i=i.replace(/&#?\w+;/g,a),n.characters(i,0,i.length),o)}return t+1}function m(e,t,r,a){var n=a[r];return null==n&&((n=e.lastIndexOf("</"+r+">"))<t&&(n=e.lastIndexOf("</"+r)),a[r]=n),n<t}function p(e,t){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r])}function f(e,t,r,a){if("-"===e.charAt(t+2))return"-"===e.charAt(t+3)?(n=e.indexOf("--\x3e",t+4))>t?(r.comment(e,t+4,n-t-4),n+3):(a.error("Unclosed comment"),-1):-1;if("CDATA["==e.substr(t+3,6)){var n=e.indexOf("]]>",t+9);return r.startCDATA(),r.characters(e,t+9,n-t-9),r.endCDATA(),n+3}var o=function(e,t){var r,a=[],n=/'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;for(n.lastIndex=t,n.exec(e);r=n.exec(e);)if(a.push(r),r[1])return a}(e,t),i=o.length;if(i>1&&/!doctype/i.test(o[0][0])){var s=o[1][0],l=!1,c=!1;i>3&&(/^public$/i.test(o[2][0])?(l=o[3][0],c=i>4&&o[4][0]):/^system$/i.test(o[2][0])&&(c=o[3][0]));var u=o[i-1];return r.startDTD(s,l,c),r.endDTD(),u.index+u[0].length}return-1}function x(e,t,r){var a=e.indexOf("?>",t);if(a){var n=e.substring(t,a).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);return n?(n[0].length,r.processingInstruction(n[1],n[2]),a+2):-1}return-1}function g(){this.attributeNames={}}s.prototype=new Error,s.prototype.name=s.name,l.prototype={parse:function(e,t,r){var n=this.domBuilder;n.startDocument(),p(t,t={}),function(e,t,r,n,o){function i(e){var t=e.slice(1,-1);return Object.hasOwnProperty.call(r,t)?r[t]:"#"===t.charAt(0)?function(e){if(e>65535){var t=55296+((e-=65536)>>10),r=56320+(1023&e);return String.fromCharCode(t,r)}return String.fromCharCode(e)}(parseInt(t.substr(1).replace("x","0x"))):(o.error("entity not found:"+e),e)}function l(t){if(t>_){var r=e.substring(_,t).replace(/&#?\w+;/g,i);C&&p(_),n.characters(r,0,t-_),_=t}}function p(t,r){for(;t>=b&&(r=v.exec(e));)w=r.index,b=w+r[0].length,C.lineNumber++;C.columnNumber=t-w+1}for(var w=0,b=0,v=/.*(?:\r\n?|\n)|.*$/g,C=n.locator,A=[{currentNSMap:t}],E={},_=0;;){try{var y=e.indexOf("<",_);if(y<0){if(!e.substr(_).match(/^\s*$/)){var q=n.doc,D=q.createTextNode(e.substr(_));q.appendChild(D),n.currentElement=D}return}switch(y>_&&l(y),e.charAt(y+1)){case"/":var M=e.indexOf(">",y+3),T=e.substring(y+2,M).replace(/[ \t\n\r]+$/g,""),N=A.pop();M<0?(T=e.substring(y+2).replace(/[\s<].*/,""),o.error("end tag name: "+T+" is not complete:"+N.tagName),M=y+1+T.length):T.match(/\s</)&&(T=T.replace(/[\s<].*/,""),o.error("end tag name: "+T+" maybe not complete"),M=y+1+T.length);var O=N.localNSMap,L=N.tagName==T;if(L||N.tagName&&N.tagName.toLowerCase()==T.toLowerCase()){if(n.endElement(N.uri,N.localName,T),O)for(var B in O)Object.prototype.hasOwnProperty.call(O,B)&&n.endPrefixMapping(B);L||o.fatalError("end tag name: "+T+" is not match the current start tagName:"+N.tagName)}else A.push(N);M++;break;case"?":C&&p(y),M=x(e,y,n);break;case"!":C&&p(y),M=f(e,y,n,o);break;default:C&&p(y);var S=new g,F=A[A.length-1].currentNSMap,P=(M=u(e,y,S,F,i,o),S.length);if(!S.closed&&m(e,M,S.tagName,E)&&(S.closed=!0,r.nbsp||o.warning("unclosed xml attribute")),C&&P){for(var k=c(C,{}),R=0;R<P;R++){var I=S[R];p(I.offset),I.locator=c(C,{})}n.locator=k,h(S,n,F)&&A.push(S),n.locator=C}else h(S,n,F)&&A.push(S);a.isHTML(S.uri)&&!S.closed?M=d(e,M,S.tagName,i,n):M++}}catch(e){if(e instanceof s)throw e;o.error("element parse error: "+e),M=-1}M>_?_=M:l(Math.max(y,_)+1)}}(e,t,r,n,this.errorHandler),n.endDocument()}},g.prototype={setTagName:function(e){if(!i.test(e))throw new Error("invalid tagName:"+e);this.tagName=e},addValue:function(e,t,r){if(!i.test(e))throw new Error("invalid attribute:"+e);this.attributeNames[e]=this.length,this[this.length++]={qName:e,value:t,offset:r}},length:0,getLocalName:function(e){return this[e].localName},getLocator:function(e){return this[e].locator},getQName:function(e){return this[e].qName},getURI:function(e){return this[e].uri},getValue:function(e){return this[e].value}},t.XMLReader=l,t.ParseError=s},8917:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidNumberOfChildrenError=void 0;var a=r(6200);Object.defineProperty(t,"InvalidNumberOfChildrenError",{enumerable:!0,get:function(){return a.InvalidNumberOfChildrenError}})},6200:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidNumberOfChildrenError=void 0;class r extends Error{constructor(e,t,r,a="exactly"){super(`${e} tag must have ${a} ${t} children. It's actually ${r}`),this.name="InvalidNumberOfChildrenError"}}t.InvalidNumberOfChildrenError=r},4279:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),n(r(828),t),n(r(5975),t),n(r(799),t),n(r(2424),t)},5975:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.JoinWithManySeparators=void 0;class r{constructor(e){this._separators=e}static join(e,t){return new r(t)._join(e)}_join(e){return e.reduce(((e,t,r,a)=>e+t+(r===a.length-1?"":this._get(r))),"")}_get(e){return this._separators[e]?this._separators[e]:this._separators.length>0?this._separators[this._separators.length-1]:","}}t.JoinWithManySeparators=r},799:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mathMLElementToLaTeXConverter=void 0;const a=r(5443);t.mathMLElementToLaTeXConverter=e=>new a.MathMLElementToLatexConverterAdapter(e).toLatexConverter()},2424:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeWhiteSpaces=void 0,t.normalizeWhiteSpaces=e=>e.replace(/\s+/g," ")},7192:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.BracketWrapper=void 0;const a=r(1855);t.BracketWrapper=class{constructor(){this._open="{",this._close="}"}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}}},5025:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericWrapper=void 0;const a=r(1855);t.GenericWrapper=class{constructor(e,t){this._open="\\left"+e,this._close="\\right"+t}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}}},828:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericWrapper=t.ParenthesisWrapper=t.BracketWrapper=void 0;var a=r(7192);Object.defineProperty(t,"BracketWrapper",{enumerable:!0,get:function(){return a.BracketWrapper}});var n=r(1168);Object.defineProperty(t,"ParenthesisWrapper",{enumerable:!0,get:function(){return n.ParenthesisWrapper}});var o=r(5025);Object.defineProperty(t,"GenericWrapper",{enumerable:!0,get:function(){return o.GenericWrapper}})},1168:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ParenthesisWrapper=void 0;const a=r(1855);t.ParenthesisWrapper=class{constructor(){this._open="\\left(",this._close="\\right)"}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}wrapIfMoreThanOneChar(e){return e.length<=1?e:this.wrap(e)}}},1855:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Wrapper=void 0,t.Wrapper=class{constructor(e,t){this._open=e,this._close=t}wrap(e){return this._open+e+this._close}}},2697:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.VoidMathMLElement=void 0,t.VoidMathMLElement=class{constructor(){this.name="void",this.value="",this.children=[],this.attributes={}}}},4760:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericSpacingWrapper=void 0;const a=r(4279);t.GenericSpacingWrapper=class{constructor(e){this._mathmlElement=e}convert(){return this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}}},9376:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericUnderOver=void 0;const a=r(799),n=r(8917),o=r(472);t.GenericUnderOver=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert(),i=(0,a.mathMLElementToLaTeXConverter)(t[1]).convert();return this._applyCommand(o,i)}_applyCommand(e,t){const r=this._mathmlElement.name.match(/under/)?s.Under:s.Over;return new i(r).apply(e,t)}};class i{constructor(e){this._type=e}apply(e,t){return o.latexAccents.includes(t)?`${t}{${e}}`:`${this._defaultCommand}{${t}}{${e}}`}get _defaultCommand(){return this._type===s.Under?"\\underset":"\\overset"}}var s;!function(e){e[e.Under=0]="Under",e[e.Over=1]="Over"}(s||(s={}))},6959:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Void=t.GenericUnderOver=t.GenericSpacingWrapper=t.MTr=t.MTable=t.MUnderover=t.MText=t.MMultiscripts=t.MSubsup=t.MSub=t.MSup=t.MPhantom=t.MError=t.MEnclose=t.MAction=t.MRoot=t.MFrac=t.MFenced=t.MSqrt=t.MN=t.MO=t.MI=t.Math=void 0;var a=r(393);Object.defineProperty(t,"Math",{enumerable:!0,get:function(){return a.Math}});var n=r(7037);Object.defineProperty(t,"MI",{enumerable:!0,get:function(){return n.MI}});var o=r(3487);Object.defineProperty(t,"MO",{enumerable:!0,get:function(){return o.MO}});var i=r(4464);Object.defineProperty(t,"MN",{enumerable:!0,get:function(){return i.MN}});var s=r(8686);Object.defineProperty(t,"MSqrt",{enumerable:!0,get:function(){return s.MSqrt}});var l=r(9511);Object.defineProperty(t,"MFenced",{enumerable:!0,get:function(){return l.MFenced}});var c=r(6440);Object.defineProperty(t,"MFrac",{enumerable:!0,get:function(){return c.MFrac}});var u=r(6052);Object.defineProperty(t,"MRoot",{enumerable:!0,get:function(){return u.MRoot}});var h=r(1678);Object.defineProperty(t,"MAction",{enumerable:!0,get:function(){return h.MAction}});var d=r(2631);Object.defineProperty(t,"MEnclose",{enumerable:!0,get:function(){return d.MEnclose}});var m=r(1840);Object.defineProperty(t,"MError",{enumerable:!0,get:function(){return m.MError}});var p=r(7443);Object.defineProperty(t,"MPhantom",{enumerable:!0,get:function(){return p.MPhantom}});var f=r(6926);Object.defineProperty(t,"MSup",{enumerable:!0,get:function(){return f.MSup}});var x=r(2564);Object.defineProperty(t,"MSub",{enumerable:!0,get:function(){return x.MSub}});var g=r(1358);Object.defineProperty(t,"MSubsup",{enumerable:!0,get:function(){return g.MSubsup}});var w=r(8303);Object.defineProperty(t,"MMultiscripts",{enumerable:!0,get:function(){return w.MMultiscripts}});var b=r(3951);Object.defineProperty(t,"MText",{enumerable:!0,get:function(){return b.MText}});var v=r(1222);Object.defineProperty(t,"MUnderover",{enumerable:!0,get:function(){return v.MUnderover}});var C=r(2350);Object.defineProperty(t,"MTable",{enumerable:!0,get:function(){return C.MTable}});var A=r(1586);Object.defineProperty(t,"MTr",{enumerable:!0,get:function(){return A.MTr}});var E=r(4760);Object.defineProperty(t,"GenericSpacingWrapper",{enumerable:!0,get:function(){return E.GenericSpacingWrapper}});var _=r(9376);Object.defineProperty(t,"GenericUnderOver",{enumerable:!0,get:function(){return _.GenericUnderOver}});var y=r(9165);Object.defineProperty(t,"Void",{enumerable:!0,get:function(){return y.Void}})},1678:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MAction=void 0;const a=r(799);t.MAction=class{constructor(e){this._mathmlElement=e}convert(){const{children:e}=this._mathmlElement;return this._isToggle()?e.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" \\Longrightarrow "):(0,a.mathMLElementToLaTeXConverter)(e[0]).convert()}_isToggle(){const{actiontype:e}=this._mathmlElement.attributes;return"toggle"===e||!e}}},393:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Math=void 0;const a=r(799),n=r(2424);t.Math=class{constructor(e){this._mathmlElement=e}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ");return(0,n.normalizeWhiteSpaces)(e)}}},2631:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MEnclose=void 0;const a=r(799);t.MEnclose=class{constructor(e){this._mathmlElement=e}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ");return"actuarial"===this._notation?`\\overline{\\left.${e}\\right|}`:"radical"===this._notation?`\\sqrt{${e}}`:["box","roundedbox","circle"].includes(this._notation)?`\\boxed{${e}}`:"left"===this._notation?`\\left|${e}`:"right"===this._notation?`${e}\\right|`:"top"===this._notation?`\\overline{${e}}`:"bottom"===this._notation?`\\underline{${e}}`:"updiagonalstrike"===this._notation?`\\cancel{${e}}`:"downdiagonalstrike"===this._notation?`\\bcancel{${e}}`:"updiagonalarrow"===this._notation?`\\cancelto{}{${e}}`:["verticalstrike","horizontalstrike"].includes(this._notation)?`\\hcancel{${e}}`:"madruwb"===this._notation?`\\underline{${e}\\right|}`:"phasorangle"===this._notation?`{\\angle \\underline{${e}}}`:`\\overline{\\left.\\right)${e}}`}get _notation(){return this._mathmlElement.attributes.notation||"longdiv"}}},1840:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MError=void 0;const a=r(799);t.MError=class{constructor(e){this._mathmlElement=e}convert(){return`\\color{red}{${this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}}`}}},9511:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MFenced=void 0;const a=r(799),n=r(4279);t.MFenced=class{constructor(e){this._mathmlElement=e,this._open=this._mathmlElement.attributes.open||"",this._close=this._mathmlElement.attributes.close||"",this._separators=Array.from(this._mathmlElement.attributes.separators||"")}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert()));return this._isThereRelativeOfName(this._mathmlElement.children,"mtable")?new i(this._open,this._close).apply(e):new o(this._open,this._close,this._separators).apply(e)}_isThereRelativeOfName(e,t){return e.some((e=>e.name===t||this._isThereRelativeOfName(e.children,t)))}};class o{constructor(e,t,r){this._open=e||"(",this._close=t||")",this._separators=r}apply(e){const t=n.JoinWithManySeparators.join(e,this._separators);return new n.GenericWrapper(this._open,this._close).wrap(t)}}class i{constructor(e,t){this._genericCommand="matrix",this._separators=new s(e,t)}apply(e){const t=this._command,r=`\\begin{${t}}\n${e.join("")}\n\\end{${t}}`;return t===this._genericCommand?this._separators.wrap(r):r}get _command(){return this._separators.areParentheses()?"pmatrix":this._separators.areSquareBrackets()?"bmatrix":this._separators.areBrackets()?"Bmatrix":this._separators.areDivides()?"vmatrix":this._separators.areParallels()?"Vmatrix":this._separators.areNotEqual()?this._genericCommand:"bmatrix"}}class s{constructor(e,t){this._open=e,this._close=t}wrap(e){return new n.GenericWrapper(this._open,this._close).wrap(e)}areParentheses(){return this._compare("(",")")}areSquareBrackets(){return this._compare("[","]")}areBrackets(){return this._compare("{","}")}areDivides(){return this._compare("|","|")}areParallels(){return this._compare("||","||")}areNotEqual(){return this._open!==this._close}_compare(e,t){return this._open===e&&this._close===t}}},6440:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MFrac=void 0;const a=r(8917),n=r(4279);t.MFrac=class{constructor(e){this._mathmlElement=e}convert(){const{children:e,name:t}=this._mathmlElement,r=e.length;if(2!==r)throw new a.InvalidNumberOfChildrenError(t,2,r);const o=(0,n.mathMLElementToLaTeXConverter)(e[0]).convert(),i=(0,n.mathMLElementToLaTeXConverter)(e[1]).convert();return this._isBevelled()?`${this._wrapIfMoreThanOneChar(o)}/${this._wrapIfMoreThanOneChar(i)}`:`\\frac{${o}}{${i}}`}_wrapIfMoreThanOneChar(e){return(new n.ParenthesisWrapper).wrapIfMoreThanOneChar(e)}_isBevelled(){return!!this._mathmlElement.attributes.bevelled}}},7037:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MI=void 0;const a=r(4279),n=r(5406),o=r(6122);t.MI=class{constructor(e){this.utf8Converter=new o.HashUTF8ToLtXConverter,this._mathmlElement=e}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value);if(" "===e)return i.apply(e);const t=e.trim(),r=i.apply(t),n=this.utf8Converter.convert(r);return n!==r?n:this.wrapInMathVariant(r,this.getMathVariant(this._mathmlElement.attributes))}getMathVariant(e){if(e&&e.mathvariant)return e.mathvariant}wrapInMathVariant(e,t){switch(t){case"bold":return`\\mathbf{${e}}`;case"italic":return`\\mathit{${e}}`;case"bold-italic":return`\\mathbf{\\mathit{${e}}}`;case"double-struck":return`\\mathbb{${e}}`;case"bold-fraktur":return`\\mathbf{\\mathfrak{${e}}}`;case"script":return`\\mathcal{${e}}`;case"bold-script":return`\\mathbf{\\mathcal{${e}}}`;case"fraktur":return`\\mathfrak{${e}}`;case"sans-serif":return`\\mathsf{${e}}`;case"bold-sans-serif":return`\\mathbf{\\mathsf{${e}}}`;case"sans-serif-italic":return`\\mathsf{\\mathit{${e}}}`;case"sans-serif-bold-italic":return`\\mathbf{\\mathsf{\\mathit{${e}}}}`;case"monospace":return`\\mathtt{${e}}`;default:return e}}};class i{constructor(e){this._value=e}static apply(e){return new i(e)._apply()}_apply(){return this._findByCharacter()||this._findByGlyph()||this._findByNumber()||(new o.HashUTF8ToLtXConverter).convert(this._value)}_findByCharacter(){return n.allMathSymbolsByChar[this._value]}_findByGlyph(){return n.allMathSymbolsByGlyph[this._value]}_findByNumber(){return n.mathNumberByGlyph[this._value]}}},8303:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MMultiscripts=void 0;const a=r(4279),n=r(8917);t.MMultiscripts=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(r<3)throw new n.InvalidNumberOfChildrenError(e,3,r,"at least");const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert();return this._prescriptLatex()+this._wrapInParenthesisIfThereIsSpace(o)+this._postscriptLatex()}_prescriptLatex(){const{children:e}=this._mathmlElement;let t,r;if(this._isPrescripts(e[1]))t=e[2],r=e[3];else{if(!this._isPrescripts(e[3]))return"";t=e[4],r=e[5]}return`\\_{${(0,a.mathMLElementToLaTeXConverter)(t).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(r).convert()}}`}_postscriptLatex(){const{children:e}=this._mathmlElement;if(this._isPrescripts(e[1]))return"";const t=e[1],r=e[2];return`_{${(0,a.mathMLElementToLaTeXConverter)(t).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(r).convert()}}`}_wrapInParenthesisIfThereIsSpace(e){return e.match(/\s+/g)?(new a.ParenthesisWrapper).wrap(e):e}_isPrescripts(e){return"mprescripts"===(null==e?void 0:e.name)}}},4464:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MN=void 0;const a=r(4279),n=r(5406);t.MN=class{constructor(e){this._mathmlElement=e}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value).trim();return n.mathNumberByGlyph[e]||e}}},3487:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MO=void 0;const a=r(4279),n=r(5406);t.MO=class{constructor(e){this._mathmlElement=e}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value).trim();return o.operate(e)}};class o{constructor(e){this._value=e}static operate(e){return new o(e)._operate()}_operate(){return this._findByCharacter()||this._findByGlyph()||this._findByNumber()||(new n.HashUTF8ToLtXConverter).convert(this._value)}_findByCharacter(){return n.allMathOperatorsByChar[this._value]}_findByGlyph(){return n.allMathOperatorsByGlyph[this._value]}_findByNumber(){return n.mathNumberByGlyph[this._value]}}},7443:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MPhantom=void 0,t.MPhantom=class{constructor(e){this._mathmlElement=e}convert(){return""}}},6052:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MRoot=void 0;const a=r(4279),n=r(8917);t.MRoot=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert();return`\\sqrt[${(0,a.mathMLElementToLaTeXConverter)(t[1]).convert()}]{${o}}`}}},8686:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSqrt=void 0;const a=r(4279);t.MSqrt=class{constructor(e){this._mathmlElement=e}convert(){return`\\sqrt{${this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}}`}}},2564:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSub=void 0;const a=r(4279),n=r(8917);t.MSub=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const a=t[0],o=t[1];return`${this._handleBaseChild(a)}_${this._handleSubscriptChild(o)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleSubscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return(new a.BracketWrapper).wrap(t)}}},1358:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSubsup=void 0;const a=r(4279),n=r(8917);t.MSubsup=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(3!==r)throw new n.InvalidNumberOfChildrenError(e,3,r);const a=t[0],o=t[1],i=t[2];return`${this._handleBaseChild(a)}_${this._handleSubscriptChild(o)}^${this._handleSuperscriptChild(i)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleSubscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return(new a.BracketWrapper).wrap(t)}_handleSuperscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return(new a.BracketWrapper).wrap(t)}}},6926:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSup=void 0;const a=r(4279),n=r(8917);t.MSup=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const a=t[0],o=t[1];return`${this._handleBaseChild(a)}^${this._handleExponentChild(o)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleExponentChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return(new a.BracketWrapper).wrap(t)}}},2350:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MTable=void 0;const a=r(4279);t.MTable=class{constructor(e){this._mathmlElement=e,this._addFlagRecursiveIfName(this._mathmlElement.children,"mtable","innerTable")}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" \\\\\n");return this._hasFlag("innerTable")?this._wrap(e):e}_wrap(e){return`\\begin{matrix}${e}\\end{matrix}`}_addFlagRecursiveIfName(e,t,r){e.forEach((e=>{e.name===t&&(e.attributes[r]=r),this._addFlagRecursiveIfName(e.children,t,r)}))}_hasFlag(e){return!!this._mathmlElement.attributes[e]}}},3951:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MText=void 0;const a=r(7037);t.MText=class{constructor(e){this._mathmlElement=e}convert(){const{attributes:e,value:t}=this._mathmlElement;return[...t].map((e=>/^[a-zA-Z0-9]$/.test(e)||" "===e?{value:e,isAlphanumeric:!0}:{value:e,isAlphanumeric:!1})).reduce(((e,t)=>{if(t.isAlphanumeric){const r=e[e.length-1];if(r&&r.isAlphanumeric)return r.value+=t.value,e}return[...e,t]}),[]).map((t=>t.isAlphanumeric?new n(e.mathvariant).apply(t.value):new a.MI({name:"mi",attributes:{},children:[],value:t.value}).convert())).join("")}};class n{constructor(e){this._mathvariant=e||"normal"}apply(e){return this._commands.reduce(((t,r,a)=>0===a?`${r}{${e}}`:`${r}{${t}}`),"")}get _commands(){switch(this._mathvariant){case"bold":return["\\textbf"];case"italic":return["\\textit"];case"bold-italic":return["\\textit","\\textbf"];case"double-struck":return["\\mathbb"];case"monospace":return["\\mathtt"];case"bold-fraktur":case"fraktur":return["\\mathfrak"];default:return["\\text"]}}}},1586:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MTr=void 0;const a=r(4279);t.MTr=class{constructor(e){this._mathmlElement=e}convert(){return this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" & ")}}},1222:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MUnderover=void 0;const a=r(4279),n=r(8917);t.MUnderover=class{constructor(e){this._mathmlElement=e}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(3!==r)throw new n.InvalidNumberOfChildrenError(e,3,r);return`${(0,a.mathMLElementToLaTeXConverter)(t[0]).convert()}_{${(0,a.mathMLElementToLaTeXConverter)(t[1]).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(t[2]).convert()}}`}}},9165:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Void=void 0,t.Void=class{constructor(e){this._mathmlElement=e}convert(){return""}}},5443:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&a(t,e,r);return n(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.MathMLElementToLatexConverterAdapter=void 0;const i=o(r(6959)),s=r(2697);t.MathMLElementToLatexConverterAdapter=class{constructor(e){this._mathMLElement=null!=e?e:new s.VoidMathMLElement}toLatexConverter(){const{name:e}=this._mathMLElement;return new(l[e]||i.GenericSpacingWrapper)(this._mathMLElement)}};const l={math:i.Math,mi:i.MI,mo:i.MO,mn:i.MN,msqrt:i.MSqrt,mfenced:i.MFenced,mfrac:i.MFrac,mroot:i.MRoot,maction:i.MAction,menclose:i.MEnclose,merror:i.MError,mphantom:i.MPhantom,msup:i.MSup,msub:i.MSub,msubsup:i.MSubsup,mmultiscripts:i.MMultiscripts,mtext:i.MText,munderover:i.MUnderover,mtable:i.MTable,mtr:i.MTr,mover:i.GenericUnderOver,munder:i.GenericUnderOver,mrow:i.GenericSpacingWrapper,mpadded:i.GenericSpacingWrapper,void:i.Void}},5243:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ErrorHandler=void 0,t.ErrorHandler=class{constructor(){this._errors=[],this.errorLocator={}}fixError(e,t){return this._isMissingAttributeValueError(t)?(this._errors.push(t),this._fixMissingAttribute(t,e)):e}isThereAnyErrors(){return this._errors.length>0}cleanErrors(){this._errors=[]}_fixMissingAttribute(e,t){const r=e.split('"')[1];if(r)return t.replace(this._matchMissingValueForAttribute(r),"");for(;this._mathGenericMissingValue().exec(t);)t=t.replace(this._mathGenericMissingValue(),"$1$3");return t}_matchMissingValueForAttribute(e){return new RegExp(`(${e}=(?!("|')))|(${e}(?!("|')))`,"gm")}_mathGenericMissingValue(){return/(\<.* )(\w+=(?!\"|\'))(.*\>)/gm}_isMissingAttributeValueError(e){return!!e.includes("attribute")&&!!e.includes("missed")||e.includes("attribute value missed")}}},9208:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),n(r(9548),t),n(r(5243),t),n(r(1101),t)},1101:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ElementsToMathMLAdapter=void 0,t.ElementsToMathMLAdapter=class{convert(e){return e.filter((e=>void 0!==e.tagName)).map((e=>this._convertElement(e)))}_convertElement(e){return{name:e.tagName,attributes:this._convertElementAttributes(e.attributes),value:this._hasElementChild(e)?"":e.textContent||"",children:this._hasElementChild(e)?this.convert(Array.from(e.childNodes)):[]}}_convertElementAttributes(e){return Array.from(e).reduce(((e,t)=>Object.assign({[t.nodeName]:t.nodeValue===t.nodeName?"":t.nodeValue},e)),{})}_hasElementChild(e){const t=e.childNodes;return!!t&&0!==t.length&&this._isThereAnyNoTextNode(t)}_isThereAnyNoTextNode(e){return Array.from(e).some((e=>"#text"!==e.nodeName))}}},9548:function(e,t,r){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.XmlToMathMLAdapter=void 0;const n=a(r(8978));t.XmlToMathMLAdapter=class{constructor(e,t){this._xml="",this._elementsConvertor=e,this._errorHandler=t,this._xmlDOM=new n.default.DOMParser({locator:this._errorHandler.errorLocator,errorHandler:this._fixError.bind(this)})}convert(e){return this._xml=this._removeLineBreaks(e),this._xml=this._removeMsWordPrefixes(this._xml),this._elementsConvertor.convert(this._mathMLElements)}_fixError(e){this._xml=this._errorHandler.fixError(this._xml,e)}_removeLineBreaks(e){return e.replace(/\n|\r\n|\r/g,"")}_removeMsWordPrefixes(e){return e.replace(/mml:/g,"")}get _mathMLElements(){let e=this._xmlDOM.parseFromString(this._xml).getElementsByTagName("math");return this._errorHandler.isThereAnyErrors()&&(this._errorHandler.cleanErrors(),e=this._xmlDOM.parseFromString(this._xml).getElementsByTagName("math")),Array.from(e)}}},7941:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),n(r(8585),t)},8585:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.makeToMathElementsConverter=void 0;const a=r(9208);t.makeToMathElementsConverter=()=>{const e=new a.ElementsToMathMLAdapter,t=new a.ErrorHandler;return new a.XmlToMathMLAdapter(e,t)}},8672:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),n(r(3798),t)},3798:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MathMLToLaTeX=void 0;const a=r(5443),n=r(7941);t.MathMLToLaTeX=class{static convert(e){return(0,n.makeToMathElementsConverter)().convert(e).map((e=>new a.MathMLElementToLatexConverterAdapter(e).toLatexConverter())).map((e=>e.convert())).join("").trim()}}},2965:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathOperatorsByChar=void 0,t.allMathOperatorsByChar={_:"\\underline","&#x23E1;":"\\underbrace","&#x23E0;":"\\overbrace","&#x23DF;":"\\underbrace","&#x23DE;":"\\overbrace","&#x23DD;":"\\underbrace","&#x23DC;":"\\overbrace","&#x23B5;":"\\underbrace","&#x23B4;":"\\overbrace","&#x20DC;":"\\square","&#x20DB;":"\\square","&#x2064;":"","&#x2057;":"''''","&#x203E;":"\\bar","&#x2037;":"```","&#x2036;":"``","&#x2035;":"`","&#x2034;":"'''","&#x2033;":"''","&#x201F;":"``","&#x201E;":",,","&#x201B;":"`","&#x201A;":",","&#x302;":"\\hat","&#x2F7;":"\\sim","&#x2DD;":"\\sim","&#x2DC;":"\\sim","&#x2DA;":"\\circ","&#x2D9;":"\\cdot","&#x2D8;":"","&#x2CD;":"\\_","&#x2CB;":"ˋ","&#x2CA;":"ˊ","&#x2C9;":"ˉ","&#x2C7;":"","&#x2C6;":"\\hat","&#xBA;":"o","&#xB9;":"1","&#xB8;":"¸","&#xB4;":"´","&#xB3;":"3","&#xB2;":"2","&#xB0;":"\\circ","&#xAF;":"\\bar","&#xAA;":"a","&#xA8;":"\\cdot\\cdot","~":"\\sim","`":"`","^":"\\hat","--":"--","++":"++","&amp;":"\\&","&#x2061;":"","&#x221C;":"\\sqrt[4]{}","&#x221B;":"\\sqrt[3]{}","&#x221A;":"\\sqrt{}","&#x2146;":"d","&#x2145;":"\\mathbb{D}","?":"?","@":"@","//":"//","!!":"!!","!":"!","&#x266F;":"\\#","&#x266E;":"","&#x266D;":"","&#x2032;":"'","&lt;>":"<>","**":"\\star\\star","&#x2207;":"\\nabla","&#x2202;":"\\partial","&#x2299;":"\\bigodot","&#xAC;":"\\neg","&#x2222;":"\\measuredangle","&#x2221;":"\\measuredangle","&#x2220;":"\\angle","&#xF7;":"\\div","/":"/","&#x2216;":"\\backslash","\\":"\\backslash","%":"\\%","&#x2297;":"\\bigotimes","&#xB7;":"\\cdot","&#x2A3F;":"\\coprod","&#x2A2F;":"\\times","&#x22C5;":"\\cdot","&#x22A1;":"\\boxdot","&#x22A0;":"\\boxtimes","&#x2062;":"","&#x2043;":"-","&#x2022;":"\\cdot","&#xD7;":"\\times",".":".","*":"\\star","&#x222A;":"\\cup","&#x2229;":"\\cap","&#x2210;":"\\coprod","&#x220F;":"\\prod","&#x2240;":"","&#x2AFF;":"","&#x2AFC;":"\\mid\\mid\\mid","&#x2A09;":"\\times","&#x2A08;":"","&#x2A07;":"","&#x2A06;":"\\sqcup","&#x2A05;":"\\sqcap","&#x2A02;":"\\otimes","&#x2A00;":"\\odot","&#x22C2;":"\\cap","&#x22C1;":"\\vee","&#x22C0;":"\\wedge","&#x2A04;":"\\uplus","&#x2A03;":"\\cup","&#x22C3;":"\\cup","&#x2A1C;":"\\underline{\\int}","&#x2A1B;":"\\overline{\\int}","&#x2A1A;":"\\int","&#x2A19;":"\\int","&#x2A18;":"\\int","&#x2A17;":"\\int","&#x2A16;":"\\oint","&#x2A15;":"\\oint","&#x2A14;":"\\int","&#x2A13;":"\\int","&#x2A12;":"\\int","&#x2A11;":"\\int","&#x2A10;":"\\int","&#x2A0F;":"\\bcancel{\\int}","&#x2A0E;":"","&#x2A0D;":"\\hcancel{\\int}","&#x2A0C;":"\\iiiint","&#x2233;":"\\oint","&#x2232;":"\\oint","&#x2231;":"\\int","&#x2230;":"\\oiint","&#x222F;":"\\oiint","&#x222E;":"\\oint","&#x222B;":"\\int","&#x2A01;":"\\oplus","&#x2298;":"\\oslash","&#x2296;":"\\ominus","&#x2295;":"\\oplus","&#x222D;":"\\iiint","&#x222C;":"\\iint","&#x2A0B;":"","&#x2A0A;":"","&#x2211;":"\\sum","&#x229F;":"\\boxminus","&#x229E;":"\\boxplus","&#x2214;":"\\dot{+}","&#x2213;":"+-","&#x2212;":"-","&#xB1;":"\\pm","-":"-","+":"+","&#x2B46;":"\\Rrightarrow","&#x2B45;":"\\Lleftarrow","&#x29F4;":":\\rightarrow","&#x29EF;":"","&#x29DF;":"\\bullet-\\bullet","&#x299F;":"\\angle","&#x299E;":"\\measuredangle","&#x299D;":"\\measuredangle","&#x299C;":"\\perp","&#x299B;":"\\measuredangle","&#x299A;":"","&#x2999;":"\\vdots","&#x297F;":"","&#x297E;":"","&#x297D;":"\\prec","&#x297C;":"\\succ","&#x297B;":"\\underset{\\rightarrow}{\\supset}","&#x297A;":"","&#x2979;":"\\underset{\\rightarrow}{\\subset}","&#x2978;":"\\underset{\\rightarrow}{>}","&#x2977;":"","&#x2976;":"\\underset{\\leftarrow}{<}","&#x2975;":"\\underset{\\approx}{\\rightarrow}","&#x2974;":"\\underset{\\sim}{\\rightarrow}","&#x2973;":"\\underset{\\sim}{\\leftarrow}","&#x2972;":"\\overset{\\sim}{\\rightarrow}","&#x2971;":"\\overset{=}{\\rightarrow}","&#x2970;":"","&#x296F;":"","&#x296E;":"","&#x296D;":"\\overline{\\rightharpoondown}","&#x296C;":"\\underline{\\rightharpoonup}","&#x296B;":"\\overline{\\leftharpoondown}","&#x296A;":"\\underline{\\leftharpoonup}","&#x2969;":"\\rightleftharpoons","&#x2968;":"\\rightleftharpoons","&#x2967;":"\\rightleftharpoons","&#x2966;":"\\rightleftharpoons","&#x2965;":"\\Downarrow","&#x2964;":"\\Rightarrow","&#x2963;":"\\Uparrow","&#x2962;":"\\Leftarrow","&#x2961;":"\\downarrow","&#x2960;":"\\uparrow","&#x295F;":"\\rightarrow","&#x295E;":"\\leftarrow","&#x295D;":"\\downarrow","&#x295C;":"\\uparrow","&#x295B;":"\\rightarrow","&#x295A;":"\\leftarrow","&#x2959;":"\\downarrow","&#x2958;":"\\uparrow","&#x2957;":"\\rightarrow","&#x2956;":"\\leftarrow","&#x2955;":"\\downarrow","&#x2954;":"\\uparrow","&#x2953;":"\\rightarrow","&#x2952;":"\\leftarrow","&#x2951;":"\\updownarrow","&#x2950;":"\\leftrightarrow","&#x294F;":"\\updownarrow","&#x294E;":"\\leftrightarrow","&#x294D;":"\\updownarrow","&#x294C;":"\\updownarrow","&#x294B;":"\\leftrightarrow","&#x294A;":"\\leftrightarrow","&#x2949;":"","&#x2948;":"\\leftrightarrow","&#x2947;":"\\nrightarrow","&#x2946;":"","&#x2945;":"","&#x2944;":"\\rightleftarrows","&#x2943;":"\\leftrightarrows","&#x2942;":"\\rightleftarrows","&#x2941;":"\\circlearrowright","&#x2940;":"\\circlearrowleft","&#x293F;":"\\rightarrow","&#x293E;":"\\leftarrow","&#x293D;":"","&#x293C;":"","&#x293B;":"","&#x293A;":"","&#x2939;":"","&#x2938;":"","&#x2937;":"\\Rsh","&#x2936;":"\\Lsh","&#x2935;":"\\downarrow","&#x2934;":"\\uparrow","&#x2933;":"\\leadsto","&#x2932;":"","&#x2931;":"","&#x2930;":"","&#x292F;":"","&#x292E;":"","&#x292D;":"","&#x292C;":"\\times","&#x292B;":"\\times","&#x292A;":"","&#x2929;":"","&#x2928;":"","&#x2927;":"","&#x2926;":"","&#x2925;":"","&#x2924;":"","&#x2923;":"","&#x2922;":"","&#x2921;":"","&#x2920;":"\\mapsto\\cdot","&#x291F;":"\\cdot\\leftarrow","&#x291E;":"\\rightarrow\\cdot","&#x291D;":"\\leftarrow","&#x291C;":"\\rightarrow","&#x291B;":"\\leftarrow","&#x291A;":"\\rightarrow","&#x2919;":"\\leftarrow","&#x2918;":"\\rightarrow","&#x2917;":"\\rightarrow","&#x2916;":"\\rightarrow","&#x2915;":"\\rightarrow","&#x2914;":"\\rightarrow","&#x2913;":"\\downarrow","&#x2912;":"\\uparrow","&#x2911;":"\\rightarrow","&#x2910;":"\\rightarrow","&#x290F;":"\\rightarrow","&#x290E;":"\\leftarrow","&#x290D;":"\\rightarrow","&#x290C;":"\\leftarrow","&#x290B;":"\\Downarrow","&#x290A;":"\\Uparrow","&#x2909;":"\\uparrow","&#x2908;":"\\downarrow","&#x2907;":"\\Rightarrow","&#x2906;":"\\Leftarrow","&#x2905;":"\\mapsto","&#x2904;":"\\nLeftrightarrow","&#x2903;":"\\nRightarrow","&#x2902;":"\\nLeftarrow","&#x2901;":"\\rightsquigarrow","&#x2900;":"\\rightsquigarrow","&#x27FF;":"\\rightsquigarrow","&#x27FE;":"\\Rightarrow","&#x27FD;":"\\Leftarrow","&#x27FC;":"\\mapsto","&#x27FB;":"\\leftarrow","&#x27FA;":"\\Longleftrightarrow","&#x27F9;":"\\Longrightarrow","&#x27F8;":"\\Longleftarrow","&#x27F7;":"\\leftrightarrow","&#x27F6;":"\\rightarrow","&#x27F5;":"\\leftarrow","&#x27F1;":"\\Downarrow","&#x27F0;":"\\Uparrow","&#x22B8;":"\\rightarrow","&#x21FF;":"\\leftrightarrow","&#x21FE;":"\\rightarrow","&#x21FD;":"\\leftarrow","&#x21FC;":"\\nleftrightarrow","&#x21FB;":"\\nrightarrow","&#x21FA;":"\\nleftarrow","&#x21F9;":"\\nleftrightarrow","&#x21F8;":"\\nrightarrow","&#x21F7;":"\\nleftarrow","&#x21F6;":"\\Rrightarrow","&#x21F5;":"","&#x21F4;":"\\rightarrow","&#x21F3;":"\\Updownarrow","&#x21F2;":"\\searrow","&#x21F1;":"\\nwarrow","&#x21F0;":"\\Leftarrow","&#x21EF;":"\\Uparrow","&#x21EE;":"\\Uparrow","&#x21ED;":"\\Uparrow","&#x21EC;":"\\Uparrow","&#x21EB;":"\\Uparrow","&#x21EA;":"\\Uparrow","&#x21E9;":"\\Downarrow","&#x21E8;":"\\Rightarrow","&#x21E7;":"\\Uparrow","&#x21E6;":"\\Leftarrow","&#x21E5;":"\\rightarrow","&#x21E4;":"\\leftarrow","&#x21E3;":"\\downarrow","&#x21E2;":"\\rightarrow","&#x21E1;":"\\uparrow","&#x21E0;":"\\leftarrow","&#x21DF;":"\\downarrow","&#x21DE;":"\\uparrow","&#x21DD;":"\\rightsquigarrow","&#x21DC;":"\\leftarrow","&#x21DB;":"\\Rrightarrow","&#x21DA;":"\\Lleftarrow","&#x21D9;":"\\swarrow","&#x21D8;":"\\searrow","&#x21D7;":"\\nearrow","&#x21D6;":"\\nwarrow","&#x21D5;":"\\Updownarrow","&#x21D4;":"\\Leftrightarrow","&#x21D3;":"\\Downarrow","&#x21D2;":"\\Rightarrow","&#x21D1;":"\\Uparrow","&#x21D0;":"\\Leftarrow","&#x21CF;":"\\nRightarrow","&#x21CE;":"\\nLeftrightarrow","&#x21CD;":"\\nLeftarrow","&#x21CC;":"\\rightleftharpoons","&#x21CB;":"\\leftrightharpoons","&#x21CA;":"\\downdownarrows","&#x21C9;":"\\rightrightarrows","&#x21C8;":"\\upuparrows","&#x21C7;":"\\leftleftarrows","&#x21C6;":"\\leftrightarrows","&#x21C5;":"","&#x21C4;":"\\rightleftarrows","&#x21C3;":"\\downharpoonleft","&#x21C2;":"\\downharpoonright","&#x21C1;":"\\rightharpoondown","&#x21C0;":"\\rightharpoonup","&#x21BF;":"\\upharpoonleft","&#x21BE;":"\\upharpoonright","&#x21BD;":"\\leftharpoondown","&#x21BC;":"\\leftharpoonup","&#x21BB;":"\\circlearrowright","&#x21BA;":"\\circlearrowleft","&#x21B9;":"\\leftrightarrows","&#x21B8;":"\\overline{\\nwarrow}","&#x21B7;":"\\curvearrowright","&#x21B6;":"\\curvearrowleft","&#x21B5;":"\\swarrow","&#x21B4;":"\\searrow","&#x21B3;":"\\Rsh","&#x21B2;":"\\Lsh","&#x21B1;":"\\Rsh","&#x21B0;":"\\Lsh","&#x21AF;":"\\swarrow","&#x21AE;":"","&#x21AD;":"\\leftrightsquigarrow","&#x21AC;":"\\looparrowright","&#x21AB;":"\\looparrowleft","&#x21AA;":"\\hookrightarrow","&#x21A9;":"\\hookleftarrow","&#x21A8;":"\\underline{\\updownarrow}","&#x21A7;":"\\downarrow","&#x21A6;":"\\rightarrowtail","&#x21A5;":"\\uparrow","&#x21A4;":"\\leftarrowtail","&#x21A3;":"\\rightarrowtail","&#x21A2;":"\\leftarrowtail","&#x21A1;":"\\downarrow","&#x21A0;":"\\twoheadrightarrow","&#x219F;":"\\uparrow","&#x219E;":"\\twoheadleftarrow","&#x219D;":"\\nearrow","&#x219C;":"\\nwarrow","&#x219B;":"","&#x219A;":"","&#x2199;":"\\swarrow","&#x2198;":"\\searrow","&#x2197;":"\\nearrow","&#x2196;":"\\nwarrow","&#x2195;":"\\updownarrow","&#x2194;":"\\leftrightarrow","&#x2193;":"\\downarrow","&#x2192;":"\\rightarrow","&#x2191;":"\\uparrow","&#x2190;":"\\leftarrow","|||":"\\left|||\\right.","||":"\\left||\\right.","|":"\\left|\\right.","&#x2AFE;":"","&#x2AFD;":"//","&#x2AFB;":"///","&#x2AFA;":"","&#x2AF9;":"","&#x2AF8;":"","&#x2AF7;":"","&#x2AF6;":"\\vdots","&#x2AF5;":"","&#x2AF4;":"","&#x2AF3;":"","&#x2AF2;":"\\nparallel","&#x2AF1;":"","&#x2AF0;":"","&#x2AEF;":"","&#x2AEE;":"\\bcancel{\\mid}","&#x2AED;":"","&#x2AEC;":"","&#x2AEB;":"","&#x2AEA;":"","&#x2AE9;":"","&#x2AE8;":"\\underline{\\perp}","&#x2AE7;":"\\overline{\\top}","&#x2AE6;":"","&#x2AE5;":"","&#x2AE4;":"","&#x2AE3;":"","&#x2AE2;":"","&#x2AE1;":"","&#x2AE0;":"\\perp","&#x2ADF;":"\\top","&#x2ADE;":"\\dashv","&#x2ADD;&#x338;":"","&#x2ADD;":"","&#x2ADB;":"\\pitchfork","&#x2ADA;":"","&#x2AD9;":"","&#x2AD8;":"","&#x2AD7;":"","&#x2AD6;":"","&#x2AD5;":"","&#x2AD4;":"","&#x2AD3;":"","&#x2AD2;":"","&#x2AD1;":"","&#x2AD0;":"","&#x2ACF;":"","&#x2ACE;":"","&#x2ACD;":"","&#x2ACC;":"\\underset{\\neq}{\\supset}","&#x2ACB;":"\\underset{\\neq}{\\subset}","&#x2ACA;":"\\underset{\\approx}{\\supset}","&#x2AC9;":"\\underset{\\approx}{\\subset}","&#x2AC8;":"\\underset{\\sim}{\\supset}","&#x2AC7;":"\\underset{\\sim}{\\subset}","&#x2AC6;":"\\supseteqq","&#x2AC5;":"\\subseteqq","&#x2AC4;":"\\dot{\\supseteq}","&#x2AC3;":"\\dot{\\subseteq}","&#x2AC2;":"\\underset{\\times}{\\supset}","&#x2AC1;":"\\underset{\\times}{\\subset}","&#x2AC0;":"\\underset{+}{\\supset}","&#x2ABF;":"\\underset{+}{\\subset}","&#x2ABE;":"","&#x2ABD;":"","&#x2ABC;":"\\gg ","&#x2ABB;":"\\ll","&#x2ABA;":"\\underset{\\cancel{\\approx}}{\\succ}","&#x2AB9;":"\\underset{\\cancel{\\approx}}{\\prec}","&#x2AB8;":"\\underset{\\approx}{\\succ}","&#x2AB7;":"\\underset{\\approx}{\\prec}","&#x2AB6;":"\\underset{\\cancel{=}}{\\succ}","&#x2AB5;":"\\underset{\\cancel{=}}{\\prec}","&#x2AB4;":"\\underset{=}{\\succ}","&#x2AB3;":"\\underset{=}{\\prec}","&#x2AB2;":"","&#x2AB1;":"","&#x2AAE;":"","&#x2AAD;":"\\underline{\\hcancel{>}}","&#x2AAC;":"\\underline{\\hcancel{>}}","&#x2AAB;":"\\hcancel{>}","&#x2AAA;":"\\hcancel{<}","&#x2AA9;":"","&#x2AA8;":"","&#x2AA7;":"\\vartriangleright","&#x2AA6;":"\\vartriangleleft","&#x2AA5;":"><","&#x2AA4;":"><","&#x2AA3;":"\\underline{\\ll}","&#x2AA2;&#x338;":"\\cancel{\\gg}","&#x2AA2;":"\\gg","&#x2AA1;&#x338;":"\\cancel{\\ll}","&#x2AA1;":"\\ll","&#x2AA0;":"\\overset{\\sim}{\\geqq}","&#x2A9F;":"\\overset{\\sim}{\\leqq}","&#x2A9E;":"\\overset{\\sim}{>}","&#x2A9D;":"\\overset{\\sim}{<}","&#x2A9C;":"","&#x2A9B;":"","&#x2A9A;":"\\overset{=}{>}","&#x2A99;":"\\overset{=}{<}","&#x2A98;":"","&#x2A97;":"","&#x2A96;":"","&#x2A95;":"","&#x2A94;":"","&#x2A93;":"","&#x2A92;":"\\underset{=}{\\gtrless}","&#x2A91;":"\\underset{=}{\\lessgtr}","&#x2A90;":"\\underset{<}{\\gtrsim}","&#x2A8F;":"\\underset{>}{\\lesssim}","&#x2A8E;":"\\underset{\\simeq}{>}","&#x2A8D;":"\\underset{\\simeq}{<}","&#x2A8C;":"\\gtreqqless","&#x2A8B;":"\\lesseqqgtr","&#x2A8A;":"\\underset{\\cancel{\\approx}}{>}","&#x2A89;":"\\underset{\\approx}{<}","&#x2A86;":"\\underset{\\approx}{>}","&#x2A85;":"\\underset{\\approx}{<}","&#x2A84;":"","&#x2A83;":"","&#x2A82;":"","&#x2A81;":"","&#x2A80;":"","&#x2A7F;":"","&#x2A7E;&#x338;":"\\bcancel{\\geq}","&#x2A7E;":"\\geq","&#x2A7D;&#x338;":"\\bcancel{\\leq}","&#x2A7D;":"\\leq","&#x2A7C;":"","&#x2A7B;":"","&#x2A7A;":"","&#x2A79;":"","&#x2A78;":"\\overset{\\dots}{\\equiv}","&#x2A77;":"","&#x2A76;":"===","&#x2A75;":"==","&#x2A74;":"::=","&#x2A73;":"","&#x2A72;":"\\underset{=}{+}","&#x2A71;":"\\overset{=}{+}","&#x2A70;":"\\overset{\\approx}{=}","&#x2A6F;":"\\overset{\\wedge}{=}","&#x2A6E;":"\\overset{*}{=}","&#x2A6D;":"\\dot{\\approx}","&#x2A6C;":"","&#x2A6B;":"","&#x2A6A;":"\\dot{\\sim}","&#x2A69;":"","&#x2A68;":"","&#x2A67;":"\\dot{\\equiv}","&#x2A66;":"\\underset{\\cdot}{=}","&#x2A65;":"","&#x2A64;":"","&#x2A63;":"\\underset{=}{\\vee}","&#x2A62;":"\\overset{=}{\\vee}","&#x2A61;":"ul(vv)","&#x2A60;":"\\underset{=}{\\wedge}","&#x2A5F;":"\\underline{\\wedge}","&#x2A5E;":"\\overset{=}{\\wedge}","&#x2A5D;":"\\hcancel{\\vee}","&#x2A5C;":"\\hcancel{\\wedge}","&#x2A5B;":"","&#x2A5A;":"","&#x2A59;":"","&#x2A58;":"\\vee","&#x2A57;":"\\wedge","&#x2A56;":"","&#x2A55;":"","&#x2A54;":"","&#x2A53;":"","&#x2A52;":"\\dot{\\vee}","&#x2A51;":"\\dot{\\wedge}","&#x2A50;":"","&#x2A4F;":"","&#x2A4E;":"","&#x2A4D;":"\\overline{\\cap}","&#x2A4C;":"\\overline{\\cup}","&#x2A4B;":"","&#x2A4A;":"","&#x2A49;":"","&#x2A48;":"","&#x2A47;":"","&#x2A46;":"","&#x2A45;":"","&#x2A44;":"","&#x2A43;":"\\overline{\\cap}","&#x2A42;":"\\overline{\\cup}","&#x2A41;":"","&#x2A40;":"","&#x2A3E;":"","&#x2A3D;":"\\llcorner","&#x2A3C;":"\\lrcorner","&#x2A3B;":"","&#x2A3A;":"","&#x2A39;":"","&#x2A38;":"","&#x2A37;":"","&#x2A36;":"\\hat{\\otimes}","&#x2A35;":"","&#x2A34;":"","&#x2A33;":"","&#x2A32;":"\\underline{\\times}","&#x2A31;":"\\underline{\\times}","&#x2A30;":"\\dot{\\times}","&#x2A2E;":"","&#x2A2D;":"","&#x2A2C;":"","&#x2A2B;":"","&#x2A2A;":"","&#x2A29;":"","&#x2A28;":"","&#x2A27;":"","&#x2A26;":"\\underset{\\sim}{+}","&#x2A25;":"\\underset{\\circ}{+}","&#x2A24;":"\\overset{\\sim}{+}","&#x2A23;":"\\hat{+}","&#x2A22;":"\\dot{+}","&#x2A21;":"\\upharpoonright","&#x2A20;":">>","&#x2A1F;":"","&#x2A1E;":"\\triangleleft","&#x2A1D;":"\\bowtie","&#x29FF;":"","&#x29FE;":"+","&#x29FB;":"\\hcancel{|||}","&#x29FA;":"\\hcancel{||}","&#x29F9;":"\\backslash","&#x29F8;":"/","&#x29F7;":"hcancel{\backslash}","&#x29F6;":"","&#x29F5;":"\\backslash","&#x29F2;":"\\Phi","&#x29F1;":"","&#x29F0;":"","&#x29EE;":"","&#x29ED;":"","&#x29EC;":"","&#x29EB;":"\\lozenge","&#x29EA;":"","&#x29E9;":"","&#x29E8;":"","&#x29E7;":"\\ddagger","&#x29E2;":"\\sqcup\\sqcup","&#x29E1;":"","&#x29E0;":"\\square","&#x29DE;":"","&#x29DD;":"","&#x29DC;":"","&#x29DB;":"\\{\\{","&#x29D9;":"\\{","&#x29D8;":"\\}","&#x29D7;":"","&#x29D6;":"","&#x29D5;":"\\bowtie","&#x29D4;":"\\bowtie","&#x29D3;":"\\bowtie","&#x29D2;":"\\bowtie","&#x29D1;":"\\bowtie","&#x29D0;&#x338;":"| \\not\\triangleright","&#x29D0;":"| \\triangleright","&#x29CF;&#x338;":"\\not\\triangleleft |","&#x29CF;":"\\triangleleft |","&#x29CE;":"","&#x29CD;":"\\triangle","&#x29CC;":"","&#x29CB;":"\\underline{\\triangle}","&#x29CA;":"\\dot{\\triangle}","&#x29C9;":"","&#x29C8;":"\\boxed{\\circ}","&#x29C7;":"\\boxed{\\circ}","&#x29C6;":"\\boxed{\\rightarrow}","&#x29C5;":"\\bcancel{\\square}","&#x29C4;":"\\cancel{\\square}","&#x29C3;":"\\odot","&#x29C2;":"\\odot","&#x29BF;":"\\odot","&#x29BE;":"\\odot","&#x29BD;":"\\varnothing","&#x29BC;":"\\oplus","&#x29BB;":"\\otimes","&#x29BA;":"","&#x29B9;":"\\varnothing","&#x29B8;":"\\varnothing","&#x29B7;":"\\ominus","&#x29B6;":"\\ominus","&#x29B5;":"\\ominus","&#x29B4;":"\\vec{\\varnothing}","&#x29B3;":"\\vec{\\varnothing}","&#x29B2;":"\\dot{\\varnothing}","&#x29B1;":"\\overline{\\varnothing}","&#x29B0;":"\\varnothing","&#x29AF;":"","&#x29AE;":"","&#x29AD;":"","&#x29AC;":"","&#x29AB;":"","&#x29AA;":"","&#x29A9;":"","&#x29A8;":"","&#x29A7;":"","&#x29A6;":"","&#x29A5;":"","&#x29A4;":"","&#x29A3;":"","&#x29A2;":"","&#x29A1;":"\\not\\lor","&#x29A0;":"\\bcancel{>}","&#x2982;":":","&#x2981;":"\\circ","&#x2758;":"|","&#x25B2;":"\\bigtriangleup","&#x22FF;":"\\Epsilon","&#x22FE;":"\\overline{\\ni}","&#x22FD;":"\\overline{\\ni}","&#x22FC;":"\\in","&#x22FB;":"\\in","&#x22FA;":"\\in","&#x22F9;":"\\underline{\\in}","&#x22F8;":"\\underline{\\in}","&#x22F7;":"\\overline{\\in}","&#x22F6;":"\\overline{\\in}","&#x22F5;":"\\dot{\\in}","&#x22F4;":"\\in","&#x22F3;":"\\in","&#x22F2;":"\\in","&#x22F0;":"\\ddots","&#x22E9;":"\\underset{\\sim}{\\succ}","&#x22E8;":"\\underset{\\sim}{\\prec}","&#x22E7;":"\\underset{\\not\\sim}{>}","&#x22E6;":"\\underset{\\not\\sim}{<}","&#x22E5;":"\\not\\sqsupseteq","&#x22E4;":"\\not\\sqsubseteq","&#x22E3;":"\\not\\sqsupseteq","&#x22E2;":"\\not\\sqsubseteq","&#x22E1;":"\\nsucc","&#x22E0;":"\\nprec","&#x22DF;":"\\succ","&#x22DE;":"\\prec","&#x22DD;":"\\overline{>}","&#x22DC;":"\\overline{<}","&#x22DB;":"\\underset{>}{\\leq}","&#x22DA;":"\\underset{<}{\\geq}","&#x22D5;":"\\#","&#x22D3;":"\\cup","&#x22D2;":"\\cap","&#x22D1;":"\\supset","&#x22D0;":"\\subset","&#x22CF;":"\\wedge","&#x22CE;":"\\vee","&#x22CD;":"\\simeq","&#x22C8;":"\\bowtie","&#x22C7;":"\\ast","&#x22C6;":"\\star","&#x22C4;":"\\diamond","&#x22BF;":"\\triangle","&#x22BE;":"\\measuredangle","&#x22BD;":"\\overline{\\lor}","&#x22BC;":"\\overline{\\land}","&#x22BB;":"\\underline{\\lor}","&#x22BA;":"\\top","&#x22B9;":"","&#x22B7;":"\\circ\\multimap","&#x22B6;":"\\circ\\multimap","&#x22B3;":"\\triangleright","&#x22B2;":"\\triangleleft","&#x22B1;":"\\succ","&#x22B0;":"\\prec","&#x22AB;":"|\\models","&#x22AA;":"|\\models","&#x22A7;":"\\models","&#x22A6;":"\\vdash","&#x229D;":"\\ominus","&#x229C;":"\\ominus","&#x229B;":"\\odot","&#x229A;":"\\odot","&#x2294;":"\\sqcup","&#x2293;":"\\sqcap","&#x2292;":"\\sqsupseteq","&#x2291;":"\\sqsubseteq","&#x2290;&#x338;":"\\not\\sqsupset","&#x2290;":"\\sqsupset","&#x228F;&#x338;":"\\not\\sqsubset","&#x228F;":"\\sqsubset","&#x228E;":"\\cup","&#x228D;":"\\cup","&#x228C;":"\\cup","&#x227F;&#x338;":"\\not\\succsim","&#x227F;":"\\succsim","&#x227E;":"\\precsim","&#x2279;":"\\not\\overset{>}{<}","&#x2278;":"\\not\\overset{>}{<}","&#x2277;":"\\overset{>}{<}","&#x2276;":"\\overset{<}{>}","&#x2275;":"\\not\\geg","&#x2274;":"\\not\\leq","&#x2273;":"\\geg","&#x2272;":"\\leq","&#x226C;":"","&#x2267;":"\\geg","&#x2266;&#x338;":"\\not\\leq","&#x2266;":"\\leq","&#x2263;":"\\overset{=}{=} ","&#x225E;":"\\overset{m}{=} ","&#x225D;":"\\overset{def}{=}","&#x2258;":"=","&#x2256;":"=","&#x2255;":"=:","&#x2253;":"\\doteq","&#x2252;":"\\doteq","&#x2251;":"\\doteq","&#x2250;":"\\doteq","&#x224F;&#x338;":"","&#x224F;":"","&#x224E;&#x338;":"","&#x224E;":"","&#x224C;":"\\approx","&#x224B;":"\\approx","&#x224A;":"\\approx","&#x2242;&#x338;":"\\neq","&#x2242;":"=","&#x223F;":"\\sim","&#x223E;":"\\infty","&#x223D;&#x331;":"\\sim","&#x223D;":"\\sim","&#x223B;":"\\sim","&#x223A;":":-:","&#x2239;":"-:","&#x2238;":"\\bot","&#x2237;":"::","&#x2236;":":","&#x2223;":"|","&#x221F;":"\\llcorner","&#x2219;":"\\cdot","&#x2218;":"\\circ","&#x2217;":"*","&#x2215;":"/","&#x220E;":"\\square","&#x220D;":"\\ni","&#x220A;":"\\in","&#x2206;":"\\Delta","&#x2044;":"/","&#x2AB0;&#x338;":"\\nsucceq","&#x2AB0;":"\\succeq","&#x2AAF;&#x338;":"\\npreceq","&#x2AAF;":"\\preceq","&#x2A88;":"\\ngeqslant","&#x2A87;":"\\nleqslant","&#x29F3;":"\\Phi","&#x29E6;":"\\models","&#x29E5;":"\\not\\equiv","&#x29E4;":"\\approx\\neq","&#x29E3;":"\\neq","&#x29C1;":"\\circle","&#x29C0;":"\\circle","&#x25E6;":"\\circle","&#x25D7;":"\\circle","&#x25D6;":"\\circle","&#x25CF;":"\\circle","&#x25CE;":"\\circledcirc","&#x25CD;":"\\circledcirc","&#x25CC;":"\\circledcirc","&#x25C9;":"\\circledcirc","&#x25C8;":"\\diamond","&#x25C7;":"\\diamond","&#x25C6;":"\\diamond","&#x25C5;":"\\triangleleft","&#x25C4;":"\\triangleleft","&#x25C3;":"\\triangleleft","&#x25C2;":"\\triangleleft","&#x25C1;":"\\triangleleft","&#x25C0;":"\\triangleleft","&#x25BF;":"\\triangledown","&#x25BE;":"\\triangledown","&#x25BD;":"\\triangledown","&#x25BC;":"\\triangledown","&#x25B9;":"\\triangleright","&#x25B8;":"\\triangleright","&#x25B7;":"\\triangleright","&#x25B6;":"\\triangleright","&#x25B5;":"\\triangle","&#x25B4;":"\\triangle","&#x25B3;":"\\triangle","&#x25B1;":"\\square","&#x25B0;":"\\square","&#x25AF;":"\\square","&#x25AE;":"\\square","&#x25AD;":"\\square","&#x25AB;":"\\square","&#x25AA;":"\\square","&#x25A1;":"\\square","&#x25A0;":"\\square","&#x22ED;":"\\not\\triangleright","&#x22EC;":"\\not\\triangleleft","&#x22EB;":"\\not\\triangleright","&#x22EA;":"\\not\\triangleleft","&#x22D9;":"\\ggg","&#x22D8;":"\\lll","&#x22D7;":"*>","&#x22D6;":"<*","&#x22D4;":"\\pitchfork","&#x22CC;":"","&#x22CB;":"","&#x22CA;":"\\rtimes","&#x22C9;":"\\ltimes","&#x22B5;":"\\triangleright","&#x22B4;":"","&#x22A5;":"\\bot","&#x2281;":"\\nsucc","&#x2280;":"\\preceq","&#x227D;":"\\succeq","&#x227C;":"\\preceq","&#x227B;":"\\succ","&#x227A;":"\\prec","&#x2271;":"\\geq/","&#x2270;":"\\leq/","&#x226D;":"\\neq","&#x226B;&#x338;":"\\not\\gg","&#x226B;":"\\gg","&#x226A;&#x338;":"\\not\\ll","&#x226A;":"\\ll","&#x2269;":"\\ngeqslant","&#x2268;":"\\nleqslant","&#x2261;":"\\equiv","&#x225F;":"\\doteq","&#x225C;":"\\triangleq","&#x225B;":"\\doteq","&#x225A;":"\\triangleq","&#x2259;":"\\triangleq","&#x2257;":"\\doteq","&#x2254;":":=","&#x224D;":"\\asymp","&#x2247;":"\\ncong","&#x2246;":"\\ncong","&#x2245;":"\\cong","&#x2244;":"\\not\\simeq","&#x2243;":"\\simeq","&#x2241;":"\\not\\sim","&#x2226;":"\\not\\parallel","&#x2225;":"\\parallel","&#x2224;":"\\not|","&#x221D;":"\\propto","==":"==","=":"=",":=":":=","/=":"=","-=":"-=","+=":"+=","*=":"*=","!=":"!=","&#x2260;":"\\neq","&#x2262;":"\\equiv /","&#x2249;":"\\approx /","&#x223C;":"sim","&#x2248;":"\\approx","&#x226E;":"</","&lt;":"<","&#x226F;":">/",">=":">=",">":">","&#x2265;":"\\geq","&#x2264;":"\\leq","&lt;=":"<=","&#x228B;":"\\supsetneq","&#x228A;":"\\subsetneq","&#x2289;":"\\nsupseteq","&#x2288;":"\\nsubseteq","&#x2287;":"\\supseteq","&#x2286;":"\\subseteq","&#x2285;":"\\not\\supset","&#x2284;":"\\not\\subset","&#x2283;&#x20D2;":"\\supset |","&#x2283;":"\\supset","&#x2282;&#x20D2;":"\\subset |","&#x2282;":"\\subset","&#x220C;":"\\not\\in","&#x2209;":"\\notin","&#x2208;":"\\in","&#x2201;":"C","&#x2204;":"\\nexists","&#x2203;":"\\exists","&#x2200;":"\\forall","&#x2227;":"\\land","&amp;&amp;":"\\&\\&","&#x2228;":"\\lor","&#x22AF;":"\\cancel{\\vDash}","&#x22AE;":"\\cancel{\\Vdash}","&#x22AD;":"\\nvDash","&#x22AC;":"\\nvDash","&#x22A9;":"\\Vdash","&#x22A8;":"\\vDash","&#x22A4;":"\\top","&#x22A3;":"\\dashv","&#x22A2;":"\\vdash","&#x220B;":"\\ni","&#x22F1;":"\\ddots","&#x22EF;":"\\hdots","&#x22EE;":"\\vdots","&#x2026;":"\\hdots","&#x3F6;":"\\ni",":":":","...":"\\cdots","..":"..","->":"->","&#x2235;":"\\because","&#x2234;":"\\therefore ","&#x2063;":"",",":",",";":";","&#x29FD;":"\\}","&#x29FC;":"\\{","&#x2998;":"\\]","&#x2997;":"\\[","&#x2996;":"\\ll","&#x2995;":"\\gg","&#x2994;":"\\gg","&#x2993;":"\\ll","&#x2992;":"\\gg","&#x2991;":"\\ll","&#x2990;":"\\]","&#x298F;":"\\]","&#x298E;":"\\]","&#x298D;":"\\[","&#x298C;":"\\[","&#x298B;":"\\]","&#x298A;":"\\triangleright","&#x2989;":"\\triangleleft","&#x2988;":"|\\)","&#x2987;":"\\(|","&#x2986;":"|\\)","&#x2985;":"\\(\\(","&#x2984;":"|\\}","&#x2983;":"\\{|","&#x2980;":"\\||","&#x27EF;":"\\left. \\right]","&#x27EE;":"\\left[ \\right.","&#x27ED;":"\\left. \\right]]","&#x27EC;":"\\left[[ \\right.","&#x27EB;":"\\gg","&#x27EA;":"\\ll","&#x27E9;":"\\rangle","&#x27E8;":"\\langle","&#x27E7;":"\\left. \\right]]","&#x27E6;":"\\left[[ \\right.","&#x2773;":"\\left.\\right)","&#x2772;":"\\left(\\right.","&#x232A;":"\\rangle","&#x2329;":"\\langle","&#x230B;":"\\rfloor","&#x230A;":"\\lfloor","&#x2309;":"\\rceil","&#x2308;":"\\lceil","&#x2016;":"\\parallel","}":"\\left.\\right}","{":"\\left{\\right.","]":"\\left]\\right.","[":"\\left[\\right.",")":"\\left.\\right)","(":"\\left(\\right.","&#x201D;":'"',"&#x201C;":"``","&#x2019;":"'","&#x2018;":"`","%CE%B1":"\\alpha","%CE%B2":"\\beta","%CE%B3":"\\gamma","%CE%93":"\\Gamma","%CE%B4":"\\delta","%CE%94":"\\Delta","%CF%B5":"\\epsilon","%CE%B6":"\\zeta","%CE%B7":"\\eta","%CE%B8":"\\theta","%CE%98":"\\Theta","%CE%B9":"\\iota","%CE%BA":"\\kappa","%CE%BB":"\\lambda","%CE%BC":"\\mu","%CE%BD":"\\nu","%CE%BF":"\\omicron","%CF%80":"\\pi","%CE%A0":"\\Pi","%CF%81":"\\pho","%CF%83":"\\sigma","%CE%A3":"\\Sigma","%CF%84":"\\tau","%CF%85":"\\upsilon","%CE%A5":"\\Upsilon","%CF%95":"\\phi","%CE%A6":"\\Phi","%CF%87":"\\chi","%CF%88":"\\psi","%CE%A8":"\\Psi","%CF%89":"\\omega","%CE%A9":"\\Omega"}},9039:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathOperatorsByGlyph=void 0,t.allMathOperatorsByGlyph={_:"\\underline","⏡":"\\underbrace","⏠":"\\overbrace","⏟":"\\underbrace","⏞":"\\overbrace","⏝":"\\underbrace","⏜":"\\overbrace","⎵":"\\underbrace","⎴":"\\overbrace","⃜":"\\square","⃛":"\\square","⁤":"","⁗":"''''","‾":"\\overline","‷":"```","‶":"``","‵":"`","‴":"'''","″":"''","‟":"``","„":",,","‛":"`","‚":",","^":"\\hat","˷":"\\sim","˝":"\\sim","˜":"\\sim","˚":"\\circ","˙":"\\cdot","˘":" ",ˍ:"\\_",ˋ:"ˋ",ˊ:"ˊ",ˉ:"ˉ",ˇ:"",ˆ:"\\hat",º:"o","¹":"1","¸":",","´":"´","³":"3","²":"2","°":"\\circ","¯":"\\bar",ª:"a","↛":"\\nrightarrow","¨":"\\cdot\\cdot","~":"\\sim","`":"`","--":"--","++":"++","&":"\\&","∜":"\\sqrt[4]{}","∛":"\\sqrt[3]{}","√":"\\sqrt{}",ⅆ:"d",ⅅ:"\\mathbb{D}","?":"?","@":"@","//":"//","!!":"!!","!":"!","♯":"\\#","♮":"","♭":"","′":"'","<>":"<>","**":"\\star\\star","∇":"\\nabla","∂":"\\partial","⊙":"\\bigodot","¬":"\\neg","∢":"\\measuredangle","∡":"\\measuredangle","∠":"\\angle","÷":"\\div","/":"/","∖":"\\backslash","\\":"\\backslash","%":"\\%","⊗":"\\bigotimes","·":"\\cdot","⨿":"\\coprod","⨯":"\\times","⋅":"\\cdot","⊡":"\\boxdot","⊠":"\\boxtimes","⁢":"","⁃":"-","•":"\\cdot",".":".","*":"\\star","∪":"\\cup","∩":"\\cap","∐":"\\coprod","∏":"\\prod","≀":"","⫿":"","⫼":"\\mid\\mid\\mid","⨉":"\\times","⨈":"","⨇":"","⨆":"\\sqcup","⨅":"\\sqcap","⨂":"\\otimes","⨀":"\\odot","⋂":"\\cap","⋁":"\\vee","⋀":"\\wedge","⨄":"\\uplus","⨃":"\\cup","⋃":"\\cup","⨜":"\\underline{\\int}","⨛":"\\overline{\\int}","⨚":"\\int","⨙":"\\int","⨘":"\\int","⨗":"\\int","⨖":"\\oint","⨕":"\\oint","⨔":"\\int","⨓":"\\int","⨒":"\\int","⨑":"\\int","⨐":"\\int","⨏":"\\bcancel{\\int}","⨎":"","⨍":"\\hcancel{\\int}","⨌":"\\iiiint","∳":"\\oint","∲":"\\oint","∱":"\\int","∰":"\\oiint","∯":"\\oiint","∮":"\\oint","∫":"\\int","⨁":"\\oplus","⊘":"\\oslash","⊖":"\\ominus","⊕":"\\oplus","∭":"\\iiint","∬":"\\iint","⨋":"","⨊":"","∑":"\\sum","⊟":"\\boxminus","⊞":"\\boxplus","∔":"\\dot{+}","∓":"+-","−":"-","±":"\\pm","-":"-","+":"+","⭆":"\\Rrightarrow","⭅":"\\Lleftarrow","⧴":":\\rightarrow","⧯":"","⧟":"\\bullet-\\bullet","⦟":"\\angle","⦞":"\\measuredangle","⦝":"\\measuredangle","⦜":"\\perp","⦛":"\\measuredangle","⦚":"","⦙":"\\vdots","⥿":"","⥾":"","⥽":"\\prec","⥼":"\\succ","⥻":"\\underset{\\rightarrow}{\\supset}","⥺":"","⥹":"\\underset{\\rightarrow}{\\subset}","⥸":"\\underset{\\rightarrow}{>}","⥷":"","⥶":"\\underset{\\leftarrow}{<}","⥵":"\\underset{\\approx}{\\rightarrow}","⥴":"\\underset{\\sim}{\\rightarrow}","⥳":"\\underset{\\sim}{\\leftarrow}","⥲":"\\overset{\\sim}{\\rightarrow}","⥱":"\\overset{=}{\\rightarrow}","⥰":"","⥯":"","⥮":"","⥭":"\\overline{\\rightharpoondown}","⥬":"\\underline{\\rightharpoonup}","⥫":"\\overline{\\leftharpoondown}","⥪":"\\underline{\\leftharpoonup}","⥩":"\\rightleftharpoons","⥨":"\\rightleftharpoons","⥧":"\\rightleftharpoons","⥦":"\\rightleftharpoons","⥥":"\\Downarrow","⥤":"\\Rightarrow","⥣":"\\Uparrow","⥢":"\\Leftarrow","⥡":"\\downarrow","⥠":"\\uparrow","⥟":"\\rightarrow","⥞":"\\leftarrow","⥝":"\\downarrow","⥜":"\\uparrow","⥛":"\\rightarrow","⥚":"\\leftarrow","⥙":"\\downarrow","⥘":"\\uparrow","⥗":"\\rightarrow","⥖":"\\leftarrow","⥕":"\\downarrow","⥔":"\\uparrow","⥓":"\\rightarrow","⥒":"\\leftarrow","⥑":"\\updownarrow","⥐":"\\leftrightarrow","⥏":"\\updownarrow","⥎":"\\leftrightarrow","⥍":"\\updownarrow","⥌":"\\updownarrow","⥋":"\\leftrightarrow","⥊":"\\leftrightarrow","⥉":"","⥈":"\\leftrightarrow","⥇":"\\nrightarrow","⥆":"","⥅":"","⥄":"\\rightleftarrows","⥃":"\\leftrightarrows","⥂":"\\rightleftarrows","⥁":"\\circlearrowright","⥀":"\\circlearrowleft","⤿":"\\rightarrow","⤾":"\\leftarrow","⤽":"\\leftarrow","⤼":"\\rightarrow","⤻":"\\rightarrow","⤺":"\\leftarrow","⤹":"\\downarrow","⤸":"\\downarrow","⤷":"\\Rsh","⤶":"\\Lsh","⤵":"\\downarrow","⤴":"\\uparrow","⤳":"\\rightarrow","⤲":"\\leftarrow","⤱":" ","⤰":" ","⤯":" ","⤮":" ","⤭":" ","⤬":"\\times","⤫":"\\times","⤪":" ","⤩":" ","⤨":" ","⤧":" ","⤦":" ","⤥":" ","⤤":" ","⤣":" ","⤢":" ","⤡":" ","⤠":"\\mapsto\\cdot","⤟":"\\cdot\\leftarrow","⤞":"\\rightarrow\\cdot","⤝":"\\leftarrow","⤜":"\\rightarrow","⤛":"\\leftarrow","⤚":"\\rightarrow","⤙":"\\leftarrow","⤘":"\\rightarrow","⤗":"\\rightarrow","⤖":"\\rightarrow","⤕":"\\rightarrow","⤔":"\\rightarrow","⤓":"\\downarrow","⤒":"\\uparrow","⤑":"\\rightarrow","⤐":"\\rightarrow","⤏":"\\rightarrow","⤎":"\\leftarrow","⤍":"\\rightarrow","⤌":"\\leftarrow","⤋":"\\Downarrow","⤊":"\\Uparrow","⤉":"\\uparrow","⤈":"\\downarrow","⤇":"\\Rightarrow","⤆":"\\Leftarrow","⤅":"\\mapsto","⤄":"\\nLeftrightarrow","⤃":"\\nRightarrow","⤂":"\\nLeftarrow","⤁":"\\rightsquigarrow","⤀":"\\rightsquigarrow","⟿":"\\rightsquigarrow","⟾":"\\Rightarrow","⟽":"\\Leftarrow","⟼":"\\mapsto","⟻":"\\leftarrow","⟺":"\\Longleftrightarrow","⟹":"\\Longrightarrow","⟸":"\\Longleftarrow","⟷":"\\leftrightarrow","⟶":"\\rightarrow","⟵":"\\leftarrow","⟱":"\\Downarrow","⟰":"\\Uparrow","⊸":"\\rightarrow","⇿":"\\leftrightarrow","⇾":"\\rightarrow","⇽":"\\leftarrow","⇼":"\\nleftrightarrow","⇻":"\\nrightarrow","⇺":"\\nleftarrow","⇹":"\\nleftrightarrow","⇸":"\\nrightarrow","⇷":"\\nleftarrow","⇶":"\\Rrightarrow","⇵":"","⇴":"\\rightarrow","⇳":"\\Updownarrow","⇲":"\\searrow","⇱":"\\nwarrow","⇰":"\\Leftarrow","⇯":"\\Uparrow","⇮":"\\Uparrow","⇭":"\\Uparrow","⇬":"\\Uparrow","⇫":"\\Uparrow","⇪":"\\Uparrow","⇩":"\\Downarrow","⇨":"\\Rightarrow","⇧":"\\Uparrow","⇦":"\\Leftarrow","⇥":"\\rightarrow","⇤":"\\leftarrow","⇣":"\\downarrow","⇢":"\\rightarrow","⇡":"\\uparrow","⇠":"\\leftarrow","⇟":"\\downarrow","⇞":"\\uparrow","⇝":"\\rightsquigarrow","⇜":"\\leftarrow","⇛":"\\Rrightarrow","⇚":"\\Lleftarrow","⇙":"\\swarrow","⇘":"\\searrow","⇗":"\\nearrow","⇖":"\\nwarrow","⇕":"\\Updownarrow","⇔":"\\Leftrightarrow","⇓":"\\Downarrow","⇒":"\\Rightarrow","⇑":"\\Uparrow","⇐":"\\Leftarrow","⇏":"\\nRightarrow","⇎":"\\nLeftrightarrow","⇍":"\\nLeftarrow","⇌":"\\rightleftharpoons","⇋":"\\leftrightharpoons","⇊":"\\downdownarrows","⇉":"\\rightrightarrows","⇈":"\\upuparrows","⇇":"\\leftleftarrows","⇆":"\\leftrightarrows","⇅":"","⇄":"\\rightleftarrows","⇃":"\\downharpoonleft","⇂":"\\downharpoonright","⇁":"\\rightharpoondown","⇀":"\\rightharpoonup","↿":"\\upharpoonleft","↾":"\\upharpoonright","↽":"\\leftharpoondown","↼":"\\leftharpoonup","↻":"\\circlearrowright","↺":"\\circlearrowleft","↹":"\\leftrightarrows","↸":"\\overline{\\nwarrow}","↷":"\\curvearrowright","↶":"\\curvearrowleft","↵":"\\swarrow","↴":"\\searrow","↳":"\\Rsh","↲":"\\Lsh","↱":"\\Rsh","↰":"\\Lsh","↯":"\\swarrow","↮":"","↭":"\\leftrightsquigarrow","↬":"\\looparrowright","↫":"\\looparrowleft","↪":"\\hookrightarrow","↩":"\\hookleftarrow","↨":"\\underline{\\updownarrow}","↧":"\\downarrow","↦":"\\rightarrowtail","↥":"\\uparrow","↤":"\\leftarrowtail","↣":"\\rightarrowtail","↢":"\\leftarrowtail","↡":"\\downarrow","↠":"\\twoheadrightarrow","↟":"\\uparrow","↞":"\\twoheadleftarrow","↝":"\\nearrow","↜":"\\nwarrow","↚":"","↙":"\\swarrow","↘":"\\searrow","↗":"\\nearrow","↖":"\\nwarrow","↕":"\\updownarrow","↔":"\\leftrightarrow","↓":"\\downarrow","→":"\\rightarrow","↑":"\\uparrow","←":"\\leftarrow","|||":"\\left|||\\right.","||":"\\left||\\right.","|":"\\mid","⫾":"","⫽":"//","⫻":"///","⫺":"","⫹":"","⫸":"","⫷":"","⫶":"\\vdots","⫵":"","⫴":"","⫳":"","⫲":"\\nparallel","⫱":"","⫰":"","⫯":"","⫮":"\\bcancel{\\mid}","⫭":"","⫬":"","⫫":"","⫪":"","⫩":"","⫨":"\\underline{\\perp}","⫧":"\\overline{\\top}","⫦":"","⫥":"","⫤":"","⫣":"","⫢":"","⫡":"","⫠":"\\perp","⫟":"\\top","⫞":"\\dashv","⫝̸":"","⫝":"","⫛":"\\pitchfork","⫚":"","⫙":"","⫘":"","⫗":"","⫖":"","⫕":"","⫔":"","⫓":"","⫒":"","⫑":"","⫐":"","⫏":"","⫎":"","⫍":"","⫌":"\\underset{\\neq}{\\supset}","⫋":"\\underset{\\neq}{\\subset}","⫊":"\\underset{\\approx}{\\supset}","⫉":"\\underset{\\approx}{\\subset}","⫈":"\\underset{\\sim}{\\supset}","⫇":"\\underset{\\sim}{\\subset}","⫆":"\\supseteqq","⫅":"\\subseteqq","⫄":"\\dot{\\supseteq}","⫃":"\\dot{\\subseteq}","⫂":"\\underset{\\times}{\\supset}","⫁":"\\underset{\\times}{\\subset}","⫀":"\\underset{+}{\\supset}","⪿":"\\underset{+}{\\subset}","⪾":"","⪽":"","⪼":"\\gg ","⪻":"\\ll","⪺":"\\underset{\\cancel{\\approx}}{\\succ}","⪹":"\\underset{\\cancel{\\approx}}{\\prec}","⪸":"\\underset{\\approx}{\\succ}","⪷":"\\underset{\\approx}{\\prec}","⪶":"\\underset{\\cancel{=}}{\\succ}","⪵":"\\underset{\\cancel{=}}{\\prec}","⪴":"\\underset{=}{\\succ}","⪳":"\\underset{=}{\\prec}","⪲":"","⪱":"","⪮":"","⪭":"\\underline{\\hcancel{>}}","⪬":"\\underline{\\hcancel{>}}","⪫":"\\hcancel{>}","⪪":"\\hcancel{<}","⪩":"","⪨":"","⪧":"\\vartriangleright","⪦":"\\vartriangleleft","⪥":"><","⪤":"><","⪣":"\\underline{\\ll}","⪢̸":"\\cancel{\\gg}","⪢":"\\gg","⪡̸":"\\cancel{\\ll}","⪡":"\\ll","⪠":"\\overset{\\sim}{\\geqq}","⪟":"\\overset{\\sim}{\\leqq}","⪞":"\\overset{\\sim}{>}","⪝":"\\overset{\\sim}{<}","⪜":"","⪛":"","⪚":"\\overset{=}{>}","⪙":"\\overset{=}{<}","⪘":"","⪗":"","⪖":"","⪕":"","⪔":"","⪓":"","⪒":"\\underset{=}{\\gtrless}","⪑":"\\underset{=}{\\lessgtr}","⪐":"\\underset{<}{\\gtrsim}","⪏":"\\underset{>}{\\lesssim}","⪎":"\\underset{\\simeq}{>}","⪍":"\\underset{\\simeq}{<}","⪌":"\\gtreqqless","⪋":"\\lesseqqgtr","⪊":"\\underset{\\cancel{\\approx}}{>}","⪉":"\\underset{\\approx}{<}","⪆":"\\underset{\\approx}{>}","⪅":"\\underset{\\approx}{<}","⪄":"","⪃":"","⪂":"","⪁":"","⪀":"","⩿":"","⩾̸":"\\bcancel{\\geq}","⩾":"\\geq","⩽̸":"\\bcancel{\\leq}","⩽":"\\leq","⩼":"","⩻":"","⩺":"","⩹":"","⩸":"\\overset{\\dots}{\\equiv}","⩷":"","⩶":"===","⩵":"==","⩴":"::=","⩳":"","⩲":"\\underset{=}{+}","⩱":"\\overset{=}{+}","⩰":"\\overset{\\approx}{=}","⩯":"\\overset{\\wedge}{=}","⩮":"\\overset{*}{=}","⩭":"\\dot{\\approx}","⩬":"","⩫":"","⩪":"\\dot{\\sim}","⩩":"","⩨":"","⩧":"\\dot{\\equiv}","⩦":"\\underset{\\cdot}{=}","⩥":"","⩤":"","⩣":"\\underset{=}{\\vee}","⩢":"\\overset{=}{\\vee}","⩡":"ul(vv)","⩠":"\\underset{=}{\\wedge}","⩟":"\\underline{\\wedge}","⩞":"\\overset{=}{\\wedge}","⩝":"\\hcancel{\\vee}","⩜":"\\hcancel{\\wedge}","⩛":"","⩚":"","⩙":"","⩘":"\\vee","⩗":"\\wedge","⩖":"","⩕":"","⩔":"","⩓":"","⩒":"\\dot{\\vee}","⩑":"\\dot{\\wedge}","⩐":"","⩏":"","⩎":"","⩍":"\\overline{\\cap}","⩌":"\\overline{\\cup}","⩋":"","⩊":"","⩉":"","⩈":"","⩇":"","⩆":"","⩅":"","⩄":"","⩃":"\\overline{\\cap}","⩂":"\\overline{\\cup}","⩁":"","⩀":"","⨾":"","⨽":"\\llcorner","⨼":"\\lrcorner","⨻":"","⨺":"","⨹":"","⨸":"","⨷":"","⨶":"\\hat{\\otimes}","⨵":"","⨴":"","⨳":"","⨲":"\\underline{\\times}","⨱":"\\underline{\\times}","⨰":"\\dot{\\times}","⨮":"\\bigodot","⨭":"\\bigodot","⨬":"","⨫":"","⨪":"","⨩":"","⨨":"","⨧":"","◻":"\\Box","⨦":"\\underset{\\sim}{+}","⨥":"\\underset{\\circ}{+}","⨤":"\\overset{\\sim}{+}","⨣":"\\hat{+}","⨢":"\\dot{+}","⨡":"\\upharpoonright","⨠":">>","⨟":"","⨞":"\\triangleleft","⨝":"\\bowtie","⧿":"","⧾":"+","⧻":"\\hcancel{|||}","⧺":"\\hcancel{||}","⧹":"\\backslash","⧸":"/","⧷":"hcancel{\backslash}","⧶":"","⧵":"\\backslash","⧲":"\\Phi","⧱":"","⧰":"","⧮":"","⧭":"","⧬":"","⧫":"\\lozenge","⧪":"","⧩":"","⧨":"","⧧":"\\ddagger","⧢":"\\sqcup\\sqcup","⧡":"","⧠":"\\square","⧞":"","⧝":"","⧜":"","⧛":"\\{\\{","⧙":"\\{","⧘":"\\}","⧗":"","⧖":"","⧕":"\\bowtie","⧔":"\\bowtie","⧓":"\\bowtie","⧒":"\\bowtie","⧑":"\\bowtie","⧐̸":"| \\not\\triangleright","⧐":"| \\triangleright","⧏̸":"\\not\\triangleleft |","⧏":"\\triangleleft |","⧎":"","⧍":"\\triangle","⧌":"","⧋":"\\underline{\\triangle}","⧊":"\\dot{\\triangle}","⧉":"","⧈":"\\boxed{\\circ}","⧇":"\\boxed{\\circ}","⧆":"\\boxed{\\rightarrow}","⧅":"\\bcancel{\\square}","⧄":"\\cancel{\\square}","⧃":"\\odot","⧂":"\\odot","⦿":"\\odot","⦾":"\\odot","⦽":"\\varnothing","⦼":"\\oplus","⦻":"\\otimes","⦺":"","⦹":"\\varnothing","⦸":"\\varnothing","⦷":"\\ominus","⦶":"\\ominus","⦵":"\\ominus","⦴":"\\vec{\\varnothing}","⦳":"\\vec{\\varnothing}","⦲":"\\dot{\\varnothing}","⦱":"\\overline{\\varnothing}","⦰":"\\varnothing","⦯":"\\measuredangle","⦮":"\\measuredangle","⦭":"\\measuredangle","⦬":"\\measuredangle","⦫":"\\measuredangle","⦪":"\\measuredangle","⦩":"\\measuredangle","⦨":"\\measuredangle","⦧":"","⦦":"","⦥":"","⦤":"","⦣":"\\ulcorner","⦢":"\\measuredangle","⦡":"\\not\\lor","⦠":"\\bcancel{>}","⦂":":","⦁":"\\cdot","❘":"\\mid","▲":"\\bigtriangleup","⋿":"\\Epsilon","⋾":"\\overline{\\ni}","⋽":"\\overline{\\ni}","⋼":"\\in","⋻":"\\in","⋺":"\\in","⋹":"\\underline{\\in}","⋸":"\\underline{\\in}","⋷":"\\overline{\\in}","⋶":"\\overline{\\in}","⋵":"\\dot{\\in}","⋴":"\\in","⋳":"\\in","⋲":"\\in","⋰":"\\ddots","։":":","⋩":"\\underset{\\sim}{\\succ}","⋨":"\\underset{\\sim}{\\prec}","⋧":"\\underset{\\not\\sim}{>}","⋦":"\\underset{\\not\\sim}{<}","⋥":"\\not\\sqsupseteq","⋤":"\\not\\sqsubseteq","⋣":"\\not\\sqsupseteq","⋢":"\\not\\sqsubseteq","⋡":"\\nsucc","⋠":"\\nprec","⋟":"\\succ","⋞":"\\prec","⋝":"\\overline{>}","⋜":"\\overline{<}","⋛":"\\underset{>}{\\leq}","⋚":"\\underset{<}{\\geq}","⋕":"\\#","⋓":"\\cup","⋒":"\\cap","⋑":"\\supset","⋐":"\\subset","⋏":"\\wedge","⋎":"\\vee","⋍":"\\simeq","⋈":"\\Join","⋇":"\\ast","⋆":"\\star","⋄":"\\diamond","⊿":"\\triangle","⊾":"\\measuredangle","⊽":"\\overline{\\lor}","⊼":"\\overline{\\land}","⊻":"\\underline{\\lor}","⊺":"\\top",土:"\\pm",十:"+","⊹":"","⊷":"\\circ\\multimap","⊶":"\\circ\\multimap","⊳":"\\triangleright","⊲":"\\triangleleft","⊱":"\\succ","⊰":"\\prec","⊫":"|\\models","⊪":"|\\models","⊧":"\\models","⊦":"\\vdash","⊝":"\\ominus","⊜":"\\ominus","⊛":"\\odot","⊚":"\\odot","⊔":"\\sqcup","⊓":"\\sqcap","⊒":"\\sqsupseteq","⊑":"\\sqsubseteq","⊐̸":"\\not\\sqsupset","⊐":"\\sqsupset","⊏̸":"\\not\\sqsubset","⊏":"\\sqsubset","⊎":"\\cup","⊍":"\\cup","⊌":"\\cup","≿̸":"\\not\\succsim","≿":"\\succsim","≾":"\\precsim","≹":"\\not\\overset{>}{<}","≸":"\\not\\overset{>}{<}","≷":"\\overset{>}{<}","≶":"\\overset{<}{>}","≵":"\\not\\geg","≴":"\\not\\leq","≳":"\\geg","≲":"\\leq","≬":"","≧":"\\geg","≦̸":"\\not\\leq","≦":"\\leq","≣":"\\overset{=}{=} ","≞":"\\overset{m}{=} ","≝":"\\overset{def}{=}","≘":"=","≖":"=","≕":"=:","≓":"\\doteq","≒":"\\doteq","≑":"\\doteq","≐":"\\doteq","≏̸":"","≏":"","≎̸":"","≎":"","≌":"\\approx","≋":"\\approx","≊":"\\approx","≂̸":"\\neq","≂":"=","∿":"\\sim","∾":"\\infty","∽̱":"\\sim","∽":"\\sim","∻":"\\sim","∺":":-:","∹":"-:","∸":"\\bot","∷":"::","∶":":","∣":"\\mid","∟":"\\llcorner","∘":"\\circ","∗":"*","∕":"/","∎":"\\square","∍":"\\ni","∊":"\\in","∆":"\\Delta","⁄":"/","⪰̸":"\\nsucceq","⪰":"\\succeq","⪯̸":"\\npreceq","⪯":"\\preceq","⪈":"\\ngeqslant","⪇":"\\nleqslant","⧳":"\\Phi","⧦":"\\models","⧥":"\\not\\equiv","⧤":"\\approx\\neq","⧣":"\\neq","⧁":"\\circle","⧀":"\\circle","◦":"\\circle","◗":"\\circle","◖":"\\circle","●":"\\circle","◎":"\\circledcirc","◍":"\\circledcirc","◌":"\\circledcirc","◉":"\\circledcirc","◈":"\\diamond","◇":"\\diamond","◆":"\\diamond","◅":"\\triangleleft","◄":"\\triangleleft","◃":"\\triangleleft","◂":"\\triangleleft","◁":"\\triangleleft","◀":"\\triangleleft","▿":"\\triangledown","▾":"\\triangledown","▽":"\\triangledown","▼":"\\triangledown","▹":"\\triangleright","▸":"\\triangleright","▷":"\\triangleright","▶":"\\triangleright","▵":"\\triangle","▴":"\\triangle","△":"\\triangle","▱":"\\square","▰":"\\blacksquare","▯":"\\square","▮":"\\blacksquare","▭":"\\square","▫":"\\square","▪":"\\square","□":"\\square","■":"\\blacksquare","⋭":"\\not\\triangleright","⋬":"\\not\\triangleleft","⋫":"\\not\\triangleright","⋪":"\\not\\triangleleft","⋙":"\\ggg","⋘":"\\lll","⋗":"*>","⋖":"<*","⋔":"\\pitchfork","⋌":"","⋋":"\\bowtie","⋊":"\\ltimes","⋉":"\\rtimes","⊵":"\\triangleright","\\triangleleft":"","⊥":"\\bot","⊁":"\\nsucc","⊀":"\\preceq","≽":"\\succeq","≼":"\\preceq","≻":"\\succ","≺":"\\prec","≱":"\\geq/","≰":"\\leq/","≭":"\\neq","≫̸":"\\not\\gg","≫":"\\gg","≪̸":"\\not\\ll","≪":"\\ll","≩":"\\ngeqslant","≨":"\\nleqslant","≡":"\\equiv","≟":"\\doteq","≜":"\\triangleq","≛":"\\doteq","≚":"\\triangleq","≙":"\\triangleq","≗":"\\doteq","≔":":=","≍":"\\asymp","≇":"\\ncong","≆":"\\ncong","≅":"\\cong","≄":"\\not\\simeq","≃":"\\simeq","≁":"\\not\\sim","∦":"\\not\\parallel","∥":"\\parallel","∤":"\\not|","∝":"\\propto","==":"==","=":"=",":=":":=","/=":"=","-=":"-=","+=":"+=","*=":"*=","!=":"!=","≠":"\\neq","≢":"\\equiv /","≉":"\\approx /","∼":"sim","≈":"\\approx","≮":"</","<":"<","≯":">/",">=":">=",">":">","≥":"\\geq","≤":"\\leq","<=":"<=","⊋":"\\supsetneq","⊊":"\\subsetneq","⊉":"\\nsupseteq","⊈":"\\nsubseteq","⊇":"\\supseteq","⊆":"\\subseteq","⊅":"\\not\\supset","⊄":"\\not\\subset","⊃⃒":"\\supset |","⊃":"\\supset","⊂⃒":"\\subset |","⊂":"\\subset","∌":"\\not\\in","∉":"\\notin","∈":"\\in","∁":"C","∄":"\\nexists","∃":"\\exists","∀":"\\forall","∧":"\\land","&&":"\\&\\&","∨":"\\lor","⊯":"\\cancel{\\vDash}","⊮":"\\cancel{\\Vdash}","⊭":"\\nvDash","⊬":"\\nvDash","⊩":"\\Vdash","⊨":"\\vDash","⊤":"\\top","⊣":"\\dashv","⊢":"\\vdash","∋":"\\ni","⋱":"\\ddots","⋯":"\\hdots","⋮":"\\vdots","϶":"\\ni",":":":","...":"\\cdots","..":"..","->":"->","∵":"\\because","∴":"\\therefore ","⁣":"\\llbracket",",":",",";":";","⧽":"\\}","⧼":"\\{","⦘":"\\]","⦗":"\\[","⦖":"\\ll","⦕":"\\gg","⦔":"\\gg","⦓":"\\ll","⦒":"\\gg","⦑":"\\ll","⦐":"\\]","⦏":"\\]","⦎":"\\]","⦍":"\\[","⦌":"\\[","⦋":"\\]","⦊":"\\triangleright","⦉":"\\triangleleft","⦈":"|\\)","⦇":"\\(|","⦆":"|\\)","⦅":"\\(\\(","⦄":"|\\}","⦃":"\\{|","⦀":"\\||","⟯":"\\left. \\right]","⟮":"\\left[ \\right.","⟭":"\\left. \\right]]","⟬":"\\left[[ \\right.","⟫":"\\gg","⟪":"\\ll","⟧":"\\)|","⟦":"\\(|","❳":"\\left.\\right)","❲":"\\left(\\right.","〉":"\\rangle","〈":"\\langle","⌋":"\\rfloor","⌊":"\\lfloor","⌉":"\\rceil","⌈":"\\lceil","‖":"\\parallel","}":"\\left.\\right}","{":"\\left{\\right.","]":"\\left]\\right.","[":"\\left[\\right.",")":"\\left.\\right)","(":"\\left(\\right.","”":'\\"',"“":"\\text{``}","’":"'","‘":"`",α:"\\alpha",β:"\\beta",γ:"\\gamma",Γ:"\\Gamma",δ:"\\delta",Δ:"\\Delta",ϵ:"\\epsilon",ζ:"\\zeta",η:"\\eta",θ:"\\theta",Θ:"\\Theta",ι:"\\iota",κ:"\\kappa",λ:"\\lambda",ν:"\\nu",ο:"\\omicron",π:"\\pi",Π:"\\Pi",ρ:"\\rho",σ:"\\sigma",Σ:"\\Sigma",τ:"\\tau",υ:"\\upsilon",Υ:"\\Upsilon",ϕ:"\\phi",Φ:"\\Phi",χ:"\\chi",ψ:"\\psi",Ψ:"\\Psi",ω:"\\omega",Ω:"\\Omega",Ω:"\\Omega","∅":"\\emptyset","⟲":"\\circlearrowleft","⟳":"\\circlearrowright","×":"\\times","½":"\\dfrac{1}{2}",μ:"\\mu",Ө:"\\theta","✓":"\\checkmark","⟩":"\\rangle","⟨":"\\langle","¼":"\\dfrac{1}{4}","…":"\\ldots",ℏ:"\\hbar",ℜ:"\\mathfrak{R}",Ѳ:"\\theta",Ø:"\\emptyset",ϱ:"\\varrho",ф:"\\phi",ℇ:"\\varepsilon",T:"T","∙":"\\cdot",Ρ:"P","∞":"\\infty",ᐁ:"\\nabla",ƞ:"\\eta","⁺":"^{+}","⁻":"^{-}","⁼":"^{=}","⁽":"^{(}","⁾":"^{)}","〗":"\\)|","〖":"\\langle",";":";","൦":"\\circ","┴":"\\perp","✕":"\\times","⎻":"-","»":"\\gg","⬆":"\\uparrow","⬇":"\\downarrow","⬅":"\\leftarrow","➡":"\\rightarrow","⎼":"-","⎜":"\\mid","⎥":"\\mid",ħ:"\\hbar","⮕":"\\rightarrow","・":"\\cdot","¦":"\\mid","£":"\\pounds","¥":"\\yen","✗":"\\times","✔":"\\checkmark",ⁿ:"^{n}","«":"\\ll",เ:"\\prime","†":"\\dagger","│":"\\mid",$:"\\$","#":"\\#","℃":"\\text{\\textdegree C}","℉":"\\text{\\textdegree F}","█":"\\blacksquare","℧":"\\mho",ⅇ:"\\text{e}",ɼ:"r","‡":"\\ddagger",ἱ:"i",ϒ:"\\Upsilon",𝛿:"\\delta","˳":"\\cdot",ѳ:"\\theta",𝜙:"\\phi",П:"\\prod",о:"o",ђ:"\\hbar",Ʌ:"\\Lambda","।":"\\mid","€":"\\euro",ῡ:"\\bar{u}",φ:"\\varphi",ȼ:"c",𝞮:"\\epsilon",Χ:"\\mathsf{X}",ₙ:"_{n}"}},8249:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathSymbolsByChar=void 0,t.allMathSymbolsByChar={"&#xA0;":"\\textrm{ }","&#x2203;":"\\exists","&#x2200;":"\\forall","&#x21D4;":"\\iff","&#x21D2;":"=>","&#xAC;":"\\neg","&#x2124;":"\\mathbb{Z}","&#x211D;":"\\mathbb{R}","&#x211A;":"\\mathbb{Q}","&#x2115;":"\\mathbb{N}","&#x2102;":"CC","&#x25A1;":"\\square","&#x22C4;":"\\diamond","&#x25B3;":"\\triangle","&#x2322;":"\\frown","&#x2220;":"\\angle","&#x22F1;":"\\ddots","&#x22EE;":"\\vdots","&#x2235;":"\\because","&#x2234;":"\\therefore","&#x2135;":"\\aleph","&#x2205;":"\\oslash","&#xB1;":"\\pm","&#x2207;":"\\nabla","&#x2202;":"\\partial","&#x222E;":"\\oint","&#x222B;":"\\int","&#x22C3;":"\\cup","&#x222A;":"\\cup","&#x22C2;":"\\cap","&#x2229;":"\\cap","&#x22C1;":"\\vee","&#x2228;":"\\vee","&#x22C0;":"\\wedge","&#x2227;":"\\wedge","&#x220F;":"\\prod","&#x2211;":"\\sum","&#x2299;":"\\bigodot","&#x2297;":"\\bigoplus","&#x2295;":"o+","&#x2218;":"@","&#x22C8;":"\\bowtie","&#x22CA;":"\\rtimes","&#x22C9;":"\\ltimes","&#xF7;":"\\div","&#xD7;":"\\times","\\":"\\backslash","&#x22C6;":"\\star","&#x2217;":"\\star","&#x22C5;":"\\cdot","&#x3A9;":"\\Omega","&#x3C9;":"\\omega","&#x3A8;":"\\Psi","&#x3C8;":"\\psi","&#x3C7;":"\\chi","&#x3C6;":"\\varphi","&#x3A6;":"\\Phi","&#x3D5;":"\\phi","&#x3C5;":"\\upsilon","&#x3C4;":"\\tau","&#x3A3;":"\\Sigma","&#x3C3;":"\\sigma","&#x3C1;":"\\rho","&#x3A0;":"\\Pi","&#x3C0;":"\\pi","&#x39E;":"\\Xi","&#x3BE;":"\\xi","&#x3BD;":"\\nu","&#x3BC;":"\\mu","&#x39B;":"\\Lambda","&#x3BB;":"\\lambda","&#x3BA;":"\\kappa","&#x3B9;":"\\iota","&#x3D1;":"\\vartheta","&#x398;":"\\Theta","&#x3B8;":"\\theta","&#x3B7;":"\\eta","&#x3B6;":"\\zeta","&#x25B;":"\\varepsilon","&#x3B5;":"\\epsilon","&#x394;":"\\Delta","&#x3B4;":"\\delta","&#x393;":"\\Gamma","&#x3B3;":"\\gamma","&#x3B2;":"\\beta","&#x3B1;":"\\alpha","&#x221E;":"\\infty","‬":"\\text{\\textdir TRT}","‎":"\\text{\\textdir LTR}"}},8171:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathSymbolsByGlyph=void 0,t.allMathSymbolsByGlyph={" ":"\\textrm{ }","∃":"\\exists","∀":"\\forall","⇔":"\\iff","⇒":"\\Rightarrow","¬":"\\neg","□":"\\square","⋄":"\\diamond","△":"\\triangle","⌢":"\\frown","∠":"\\angle","⋱":"\\ddots","⋮":"\\vdots","∵":"\\because","∴":"\\therefore",ℵ:"\\aleph","∅":"\\emptyset","±":"\\pm","∇":"\\nabla","∂":"\\partial","∮":"\\oint","∫":"\\int","⋃":"\\cup","∪":"\\cup","⋂":"\\cap","∩":"\\cap","⋁":"\\vee","∨":"\\vee","⋀":"\\wedge","∧":"\\wedge","∏":"\\prod","∑":"\\sum","⊙":"\\bigodot","⊗":"\\bigoplus","⊕":"o+","∘":"@","⋈":"\\bowtie","⋊":"\\rtimes","⋉":"\\ltimes","÷":"\\div","×":"\\times","\\":"\\backslash","⋆":"\\star","∗":"\\star","⋅":"\\cdot",Ω:"\\Omega",ω:"\\omega",Ψ:"\\Psi",ψ:"\\psi",χ:"\\chi",φ:"\\varphi",Φ:"\\Phi",ϕ:"\\phi",υ:"\\upsilon",τ:"\\tau",Σ:"\\Sigma",σ:"\\sigma",ρ:"\\rho",Π:"\\Pi",π:"\\pi",Ξ:"\\Xi",ξ:"\\xi",ν:"\\nu",μ:"\\mu",Λ:"\\Lambda",λ:"\\lambda",κ:"\\kappa",ι:"\\iota",ϑ:"\\vartheta",Θ:"\\Theta",θ:"\\theta",η:"\\eta",ζ:"\\zeta",ɛ:"\\varepsilon",ε:"\\epsilon",Δ:"\\Delta",δ:"\\delta",Γ:"\\Gamma",γ:"\\gamma",β:"\\beta",α:"\\alpha","∞":"\\infty",ϵ:"\\epsilon",µ:"\\mu","²":"^{2}",ı:"\\imath","∎":"\\blacksquare",ม:"\\mathbf{m}",Ω:"\\Omega","⟲":"\\circlearrowleft","⟳":"\\circlearrowright",त:" ","¥":"\\yen","⁽":"^{(}","⁾":"^{)}",ß:"\\ss",Ћ:"\\hbar","⦵":"\\ominus","⊿":"\\bigtriangleup","↛'":"\\nrightarrow","†":"\\dagger",เ:"\\prime",白:" ","⿱":" ",ℸ:"\\wp",퓰:" ",ⁿ:"^{n}","✔":"\\checkmark","✗":"\\times","½":"\\dfrac{1}{2}",Ө:"\\theta","✓":"\\checkmark","⟩":"\\rangle","⟨":"\\langle","〈":"\\langle","¼":"\\dfrac{1}{4}","…":"\\ldots",ℏ:"\\hbar",ℜ:"\\mathfrak{R}",Ѳ:"\\theta",Ø:"\\emptyset",ϱ:"\\varrho",ф:"\\phi",T:"T","∙":"\\cdot",Ρ:"P",ᐁ:"\\nabla",ƞ:"\\eta",ɣ:"\\gamma",ћ:"\\hbar",Ɛ:"\\varepsilon",ⅅ:"\\_{D}",𝜆:"\\lambda","〗":"\\rangle","〖":"\\langle",";":";",𝑥:"x",𝑦:"y",𝑧:"z",𝑖:"i",𝑗:"j",𝑘:"k",𝑚:"m",𝑒:"e",𝑟:"r",ɳ:"\\eta",𝛽:"\\beta","⍵":"\\omega",℘:"\\wp",𝜋:"\\pi",Є:"\\epsilon",є:"\\epsilon",𝜀:"\\epsilon",п:"\\pi",Ν:"\\nu",ɵ:"\\theta",𝜓:"\\psi",ϴ:"\\theta",ɸ:"\\phi",Ӷ:"\\Gamma",ɭ:"\\ell",ʋ:"\\upsilon",𝛟:"\\varphi","⍬":"\\theta",Ф:"\\Phi",𝜑:"\\varphi",ⅈ:"i",ο:"o",ơ:"o",ƒ:"f","⍴":"\\rho","🇽":"x",𝑝:"p",𝑞:"q",𝑠:"s",𝑡:"t",𝑢:"u",𝑣:"v",𝑤:"w",𝑎:"a",𝑏:"b",𝑐:"c",𝑑:"d",𝑓:"f",𝑔:"g",𝑙:"l",𝑛:"n",𝑜:"o",𝔀:"w",𝚟:"v",ṁ:"m","൦":"\\circ","┴":"\\perp","✕":"\\times","∣":"\\mid",Փ:"\\Phi","⎜":"\\mid",ħ:"\\hbar",ፈ:" ","⦨":"\\llbracket",ế:"\\hat{e}","¢":"\\cent","⤹":"\\downarrow","⤸":"\\downarrow","⤷":"\\Rsh","⤶":"\\Lsh","⤵":"\\downarrow","⤴":"\\uparrow","⤳":"\\rightarrow","|":"\\mid","⎥":"\\mid","♥":"\\heartsuit",О:"0",Υ:"Y",х:"x",𝓏:"z",𝓎:"y",𝓍:"x",р:"p",а:"a","£":"\\pounds",m:"m",𝚵:"\\Xi","⓪":"\\textcircled{0}","①":"\\textcircled{1}","②":"\\textcircled{2}","③":"\\textcircled{3}","④":"\\textcircled{4}","⑤":"\\textcircled{5}","⑥":"\\textcircled{6}","⑦":"\\textcircled{7}","⑧":"\\textcircled{8}","⑨":"\\textcircled{9}","⑩":"\\textcircled{10}","⑪":"\\textcircled{11}","⑫":"\\textcircled{12}","⑬":"\\textcircled{13}","⑭":"\\textcircled{14}","⑮":"\\textcircled{15}","⑯":"\\textcircled{16}","⑰":"\\textcircled{17}","⑱":"\\textcircled{18}","⑲":"\\textcircled{19}","⑳":"\\textcircled{20}","㉑":"\\textcircled{21}","㉒":"\\textcircled{22}","㉓":"\\textcircled{23}","㉔":"\\textcircled{24}","㉕":"\\textcircled{25}","㉖":"\\textcircled{26}","㉗":"\\textcircled{27}","㉘":"\\textcircled{28}","㉙":"\\textcircled{29}","㉚":"\\textcircled{30}","㉛":"\\textcircled{31}","㉜":"\\textcircled{32}","㉝":"\\textcircled{33}","㉞":"\\textcircled{34}","㉟":"\\textcircled{35}","㊱":"\\textcircled{36}","㊲":"\\textcircled{37}","㊳":"\\textcircled{38}","㊴":"\\textcircled{39}","㊵":"\\textcircled{40}","㊶":"\\textcircled{41}","㊷":"\\textcircled{42}","㊸":"\\textcircled{43}","㊹":"\\textcircled{44}","㊺":"\\textcircled{45}","㊻":"\\textcircled{46}","㊼":"\\textcircled{47}","㊽":"\\textcircled{48}","㊾":"\\textcircled{49}","㊿":"\\textcircled{50}","&":"\\&","‖":"\\parallel","%":"\\%","“":"\\text{``}",$:"\\$","#":"\\#","℃":"\\text{\\textdegree C}","℉":"\\text{\\textdegree F}","█":"\\blacksquare","℧":"\\mho","⌋":"\\rfloor","⌊":"\\lfloor","⌉":"\\rceil","⌈":"\\lceil",ℇ:"\\varepsilon",ⅇ:"\\text{e}",ɼ:"r","↛":"\\nrightarrow",ˆ:"\\hat{}","‾":"\\overline","→":"\\rightarrow","‡":"\\ddagger","・":"\\cdot","▱":"\\square","∆":"\\Delta",ἱ:"i","∡":"\\angle",ϒ:"\\Upsilon","↓":"\\downarrow","↑":"\\uparrow","»":"\\gg","⊤":"\\top","⧸":"/",𝛿:"\\delta","˳":"\\cdot","։":":","⦪":"\\measuredangle","⦩":"\\measuredangle","⦫":"\\measuredangle","⦁":"\\cdot",ѳ:"\\theta","⦢":"\\measuredangle","¸":",","⎻":"\\overline","⟦":"\\llbracket",𝜙:"\\phi",П:"\\prod",о:"o","≈":"\\approx","≤":"\\leq",ђ:"\\hbar",Ʌ:"\\Lambda",土:"\\pm","⎼":"-",十:"+","≠":"\\neq","←":"\\leftarrow","।":"\\mid","€":"\\euro","˘":" ",ῡ:"\\bar{u}","∥":"\\parallel","↔":"\\leftrightarrow","√":"\\sqrt{}",ȼ:"c",𝞮:"\\epsilon","·":"\\cdot","⦬":"\\measuredangle","⦮":"\\measuredangle","⦭":"\\measuredangle","«":"\\ll",Χ:"\\mathsf{X}","│":"\\mid","〉":"\\rangle",ₙ:"_{n}","▫":"\\square","●":"\\circle","”":'\\"'}},5406:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n)}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r]}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),n(r(2965),t),n(r(9039),t),n(r(8249),t),n(r(8171),t),n(r(472),t),n(r(4320),t),n(r(6122),t)},472:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.latexAccents=void 0,t.latexAccents=["\\hat","\\bar","\\underbrace","\\overbrace"]},4320:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mathNumberByGlyph=void 0,t.mathNumberByGlyph={"₀":"_{0}","₁":"_{1}","₂":"_{2}","₃":"_{3}","₄":"_{4}","₅":"_{5}","₆":"_{6}","₇":"_{7}","₈":"_{8}","₉":"_{9}","⁰":"^{0}","¹":"^{1}","²":"^{2}","³":"^{3}","⁴":"^{4}","⁵":"^{5}","⁶":"^{6}","⁷":"^{7}","⁸":"^{8}","⁹":"^{9}",ⁿ:"^{n}",ₙ:"_{n}","⓪":"\\textcircled{0}","①":"\\textcircled{1}","②":"\\textcircled{2}","③":"\\textcircled{3}","④":"\\textcircled{4}","⑤":"\\textcircled{5}","⑥":"\\textcircled{6}","⑦":"\\textcircled{7}","⑧":"\\textcircled{8}","⑨":"\\textcircled{9}","⑩":"\\textcircled{10}","⑪":"\\textcircled{11}","⑫":"\\textcircled{12}","⑬":"\\textcircled{13}","⑭":"\\textcircled{14}","⑮":"\\textcircled{15}","⑯":"\\textcircled{16}","⑰":"\\textcircled{17}","⑱":"\\textcircled{18}","⑲":"\\textcircled{19}","⑳":"\\textcircled{20}","㉑":"\\textcircled{21}","㉒":"\\textcircled{22}","㉓":"\\textcircled{23}","㉔":"\\textcircled{24}","㉕":"\\textcircled{25}","㉖":"\\textcircled{26}","㉗":"\\textcircled{27}","㉘":"\\textcircled{28}","㉙":"\\textcircled{29}","㉚":"\\textcircled{30}","㉛":"\\textcircled{31}","㉜":"\\textcircled{32}","㉝":"\\textcircled{33}","㉞":"\\textcircled{34}","㉟":"\\textcircled{35}","㊱":"\\textcircled{36}","㊲":"\\textcircled{37}","㊳":"\\textcircled{38}","㊴":"\\textcircled{39}","㊵":"\\textcircled{40}","㊶":"\\textcircled{41}","㊷":"\\textcircled{42}","㊸":"\\textcircled{43}","㊹":"\\textcircled{44}","㊺":"\\textcircled{45}","㊻":"\\textcircled{46}","㊼":"\\textcircled{47}","㊽":"\\textcircled{48}","㊾":"\\textcircled{49}","㊿":"\\textcircled{50}","½":"\\dfrac{1}{2}","⅓":"\\dfrac{1}{3}","⅔":"\\dfrac{2}{3}","¼":"\\dfrac{1}{4}","¾":"\\dfrac{3}{4}","⅕":"\\dfrac{1}{5}","⅖":"\\dfrac{2}{5}","⅗":"\\dfrac{3}{5}","⅘":"\\dfrac{4}{5}","⅙":"\\dfrac{1}{6}","⅚":"\\dfrac{5}{6}","⅐":"\\dfrac{1}{7}","⅛":"\\dfrac{1}{8}","⅜":"\\dfrac{3}{8}","⅝":"\\dfrac{5}{8}","⅞":"\\dfrac{7}{8}","⅑":"\\dfrac{1}{9}","⅒":"\\dfrac{1}{10}"}},6122:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.HashUTF8ToLtXConverter=void 0,t.HashUTF8ToLtXConverter=class{convert(e){if(e.match(/[a-z0-9]/i))return e;const t=r[e];if(t){return this.convertAccentCharToLtX(t)||e}return this.convertSpecialCharToLtX(e)||e}convertAccentCharToLtX(e){const{char:t,accent:r}=e,n=a[r];return n?`\\${n}{${t}}`:null}convertSpecialCharToLtX(e){const t=n[e];if(!t)return null;const{letter:r,fontCmd:a}=t;return`\\${a}{${r}}`}};const r={á:{char:"a",accent:"´"},à:{char:"a",accent:"`"},â:{char:"a",accent:"^"},ã:{char:"a",accent:"~"},ä:{char:"a",accent:"¨"},å:{char:"a",accent:"˚"},ą:{char:"a",accent:"˙"},ă:{char:"a",accent:"˘"},ǎ:{char:"a",accent:"ˇ"},ǟ:{char:"a",accent:"ˆ"},ǻ:{char:"a",accent:"˙"},ǡ:{char:"a",accent:"-"},ā:{char:"a",accent:"-"},é:{char:"e",accent:"´"},è:{char:"e",accent:"`"},ê:{char:"e",accent:"^"},ë:{char:"e",accent:"¨"},ę:{char:"e",accent:"˙"},ě:{char:"e",accent:"ˇ"},ȇ:{char:"i",accent:"^"},ё:{char:"e",accent:"¨"},ē:{char:"e",accent:"-"},í:{char:"i",accent:"´"},ì:{char:"i",accent:"`"},î:{char:"i",accent:"^"},ï:{char:"i",accent:"¨"},į:{char:"i",accent:"˙"},ǐ:{char:"i",accent:"ˇ"},ȉ:{char:"i",accent:"`"},ȋ:{char:"i",accent:"¨"},ī:{char:"i",accent:"-"},ó:{char:"o",accent:"´"},ò:{char:"o",accent:"`"},ô:{char:"o",accent:"^"},õ:{char:"o",accent:"~"},ö:{char:"o",accent:"¨"},ő:{char:"o",accent:"˝"},ǒ:{char:"o",accent:"ˇ"},ȍ:{char:"o",accent:"`"},ȏ:{char:"o",accent:"¨"},ȫ:{char:"o",accent:"˘"},ȭ:{char:"o",accent:"˝"},ȯ:{char:"o",accent:"˙"},ō:{char:"o",accent:"-"},ú:{char:"u",accent:"´"},ù:{char:"u",accent:"`"},û:{char:"u",accent:"^"},ü:{char:"u",accent:"¨"},ű:{char:"u",accent:"˝"},ǔ:{char:"u",accent:"ˇ"},ǖ:{char:"u",accent:"¨"},ǘ:{char:"u",accent:"¨"},ǚ:{char:"u",accent:"¨"},ǜ:{char:"u",accent:"¨"},ȕ:{char:"u",accent:"`"},ȗ:{char:"u",accent:"¨"},ū:{char:"u",accent:"-"},ý:{char:"y",accent:"´"},ỳ:{char:"y",accent:"`"},ŷ:{char:"y",accent:"^"},ÿ:{char:"y",accent:"¨"},ȳ:{char:"y",accent:"-"},Á:{char:"A",accent:"´"},À:{char:"A",accent:"`"},Â:{char:"A",accent:"^"},Ã:{char:"A",accent:"~"},Ä:{char:"A",accent:"¨"},Å:{char:"A",accent:"˚"},Å:{char:"A",accent:"˚"},Ȧ:{char:"A",accent:"˙"},Ă:{char:"A",accent:"˘"},Ǎ:{char:"A",accent:"ˇ"},Ǟ:{char:"A",accent:"˝"},Ǻ:{char:"A",accent:"˚"},Ǡ:{char:"A",accent:"-"},Ā:{char:"A",accent:"-"},É:{char:"E",accent:"´"},È:{char:"E",accent:"`"},Ė:{char:"E",accent:"˙"},Ê:{char:"E",accent:"^"},Ë:{char:"E",accent:"¨"},Ě:{char:"E",accent:"ˇ"},Ȅ:{char:"E",accent:"`"},Ȇ:{char:"E",accent:"¨"},Ē:{char:"E",accent:"-"},Í:{char:"I",accent:"´"},Ì:{char:"I",accent:"`"},Î:{char:"I",accent:"^"},Ï:{char:"I",accent:"¨"},Ĭ:{char:"I",accent:"˘"},Ǐ:{char:"I",accent:"ˇ"},Ȉ:{char:"I",accent:"`"},Ȋ:{char:"I",accent:"¨"},Ī:{char:"I",accent:"-"},Ó:{char:"O",accent:"´"},Ò:{char:"O",accent:"`"},Ô:{char:"O",accent:"^"},Õ:{char:"O",accent:"~"},Ö:{char:"O",accent:"¨"},Ő:{char:"O",accent:"˝"},Ǒ:{char:"O",accent:"ˇ"},Ȍ:{char:"O",accent:"`"},Ȏ:{char:"O",accent:"¨"},Ȫ:{char:"O",accent:"˘"},Ȭ:{char:"O",accent:"˝"},Ȯ:{char:"O",accent:"˙"},Ō:{char:"O",accent:"-"},Ú:{char:"U",accent:"´"},Ù:{char:"U",accent:"`"},Û:{char:"U",accent:"^"},Ü:{char:"U",accent:"¨"},Ű:{char:"U",accent:"˝"},Ǔ:{char:"U",accent:"ˇ"},Ǖ:{char:"U",accent:"¨"},Ȕ:{char:"U",accent:"`"},Ȗ:{char:"U",accent:"¨"},Ū:{char:"U",accent:"-"},Ý:{char:"Y",accent:"´"},Ỳ:{char:"Y",accent:"`"},Ŷ:{char:"Y",accent:"^"},Ÿ:{char:"Y",accent:"¨"},Ȳ:{char:"Y",accent:"-"},ñ:{char:"n",accent:"~"},Ñ:{char:"N",accent:"~"},ç:{char:"c",accent:"˙"},Ç:{char:"C",accent:"˙"},ṽ:{char:"v",accent:"~"},Ṽ:{char:"V",accent:"~"},ĵ:{char:"j",accent:"^"},Ĵ:{char:"J",accent:"^"},ź:{char:"z",accent:"´"},Ź:{char:"Z",accent:"´"},Ż:{char:"Z",accent:"^"},ż:{char:"z",accent:"^"},Ž:{char:"Z",accent:"ˇ"},ž:{char:"z",accent:"ˇ"},ẑ:{char:"z",accent:"ˆ"}},a={"´":"grave","`":"acute","^":"hat","~":"tilde","¨":"ddot","˚":"mathring","˘":"breve",ˇ:"check","˝":"ddot","˙":"dot","-":"bar",ˆ:"hat","˜":"tilde"},n={𝐀:{letter:"A",fontCmd:"mathbf"},𝐁:{letter:"B",fontCmd:"mathbf"},𝐂:{letter:"C",fontCmd:"mathbf"},𝐃:{letter:"D",fontCmd:"mathbf"},𝐄:{letter:"E",fontCmd:"mathbf"},Ε:{letter:"E",fontCmd:"mathbf"},𝐅:{letter:"F",fontCmd:"mathbf"},𝐆:{letter:"G",fontCmd:"mathbf"},𝐇:{letter:"H",fontCmd:"mathbf"},𝐈:{letter:"I",fontCmd:"mathbf"},𝐉:{letter:"J",fontCmd:"mathbf"},𝐊:{letter:"K",fontCmd:"mathbf"},𝐋:{letter:"L",fontCmd:"mathbf"},𝐌:{letter:"M",fontCmd:"mathbf"},𝐍:{letter:"N",fontCmd:"mathbf"},𝐎:{letter:"O",fontCmd:"mathbf"},𝐏:{letter:"P",fontCmd:"mathbf"},𝐐:{letter:"Q",fontCmd:"mathbf"},𝐑:{letter:"R",fontCmd:"mathbf"},𝐒:{letter:"S",fontCmd:"mathbf"},𝐓:{letter:"T",fontCmd:"mathbf"},𝐔:{letter:"U",fontCmd:"mathbf"},𝐕:{letter:"V",fontCmd:"mathbf"},𝐖:{letter:"W",fontCmd:"mathbf"},𝐗:{letter:"X",fontCmd:"mathbf"},𝞆:{letter:"X",fontCmd:"mathbf"},𝐘:{letter:"Y",fontCmd:"mathbf"},𝐙:{letter:"Z",fontCmd:"mathbf"},"𝟎":{letter:"0",fontCmd:"mathbf"},"𝟏":{letter:"1",fontCmd:"mathbf"},"𝟐":{letter:"2",fontCmd:"mathbf"},"𝟑":{letter:"3",fontCmd:"mathbf"},"𝟒":{letter:"4",fontCmd:"mathbf"},"𝟓":{letter:"5",fontCmd:"mathbf"},"𝟔":{letter:"6",fontCmd:"mathbf"},"𝟕":{letter:"7",fontCmd:"mathbf"},"𝟖":{letter:"8",fontCmd:"mathbf"},"𝟗":{letter:"9",fontCmd:"mathbf"},𝐴:{letter:"A",fontCmd:"mathit"},𝐵:{letter:"B",fontCmd:"mathit"},𝐶:{letter:"C",fontCmd:"mathit"},𝐷:{letter:"D",fontCmd:"mathit"},𝐸:{letter:"E",fontCmd:"mathit"},𝐹:{letter:"F",fontCmd:"mathit"},𝐺:{letter:"G",fontCmd:"mathit"},𝐻:{letter:"H",fontCmd:"mathit"},𝐼:{letter:"I",fontCmd:"mathit"},Ι:{letter:"I",fontCmd:"mathit"},𝐽:{letter:"J",fontCmd:"mathit"},𝐾:{letter:"K",fontCmd:"mathit"},𝐿:{letter:"L",fontCmd:"mathit"},𝑀:{letter:"M",fontCmd:"mathit"},𝑁:{letter:"N",fontCmd:"mathit"},𝑂:{letter:"O",fontCmd:"mathit"},𝑃:{letter:"P",fontCmd:"mathit"},𝑄:{letter:"Q",fontCmd:"mathit"},𝑅:{letter:"R",fontCmd:"mathit"},𝑆:{letter:"S",fontCmd:"mathit"},𝑇:{letter:"T",fontCmd:"mathit"},𝑈:{letter:"U",fontCmd:"mathit"},𝑉:{letter:"V",fontCmd:"mathit"},𝑊:{letter:"W",fontCmd:"mathit"},𝑋:{letter:"X",fontCmd:"mathit"},𝑌:{letter:"Y",fontCmd:"mathit"},𝑍:{letter:"Z",fontCmd:"mathit"},𝔸:{letter:"A",fontCmd:"mathbb"},𝔹:{letter:"B",fontCmd:"mathbb"},ℂ:{letter:"C",fontCmd:"mathbb"},𝔻:{letter:"D",fontCmd:"mathbb"},𝔼:{letter:"E",fontCmd:"mathbb"},𝔽:{letter:"F",fontCmd:"mathbb"},𝔾:{letter:"G",fontCmd:"mathbb"},ℍ:{letter:"H",fontCmd:"mathbb"},𝕀:{letter:"I",fontCmd:"mathbb"},𝕁:{letter:"J",fontCmd:"mathbb"},𝕂:{letter:"K",fontCmd:"mathbb"},𝕃:{letter:"L",fontCmd:"mathbb"},𝕄:{letter:"M",fontCmd:"mathbb"},ℕ:{letter:"N",fontCmd:"mathbb"},𝕆:{letter:"O",fontCmd:"mathbb"},ℙ:{letter:"P",fontCmd:"mathbb"},ℚ:{letter:"Q",fontCmd:"mathbb"},ℝ:{letter:"R",fontCmd:"mathbb"},𝕊:{letter:"S",fontCmd:"mathbb"},𝕋:{letter:"T",fontCmd:"mathbb"},𝕌:{letter:"U",fontCmd:"mathbb"},𝕍:{letter:"V",fontCmd:"mathbb"},𝕎:{letter:"W",fontCmd:"mathbb"},𝕏:{letter:"X",fontCmd:"mathbb"},𝕐:{letter:"Y",fontCmd:"mathbb"},ℤ:{letter:"Z",fontCmd:"mathbb"},"𝟘":{letter:"0",fontCmd:"mathbb"},"𝟙":{letter:"1",fontCmd:"mathbb"},"𝟚":{letter:"2",fontCmd:"mathbb"},"𝟛":{letter:"3",fontCmd:"mathbb"},"𝟜":{letter:"4",fontCmd:"mathbb"},"𝟝":{letter:"5",fontCmd:"mathbb"},"𝟞":{letter:"6",fontCmd:"mathbb"},"𝟟":{letter:"7",fontCmd:"mathbb"},"𝟠":{letter:"8",fontCmd:"mathbb"},"𝟡":{letter:"9",fontCmd:"mathbb"},𝒜:{letter:"A",fontCmd:"mathcal"},𝓐:{letter:"A",fontCmd:"mathcal"},ℬ:{letter:"B",fontCmd:"mathcal"},𝒞:{letter:"C",fontCmd:"mathcal"},𝒟:{letter:"D",fontCmd:"mathcal"},𝓓:{letter:"D",fontCmd:"mathcal"},ℰ:{letter:"E",fontCmd:"mathcal"},ℱ:{letter:"F",fontCmd:"mathcal"},𝓕:{letter:"F",fontCmd:"mathcal"},𝒢:{letter:"G",fontCmd:"mathcal"},ℋ:{letter:"H",fontCmd:"mathcal"},ℐ:{letter:"I",fontCmd:"mathcal"},𝒥:{letter:"J",fontCmd:"mathcal"},𝒦:{letter:"K",fontCmd:"mathcal"},ℒ:{letter:"L",fontCmd:"mathcal"},𝓛:{letter:"L",fontCmd:"mathcal"},ℳ:{letter:"M",fontCmd:"mathcal"},𝒩:{letter:"N",fontCmd:"mathcal"},𝒪:{letter:"O",fontCmd:"mathcal"},𝓞:{letter:"O",fontCmd:"mathcal"},𝒫:{letter:"P",fontCmd:"mathcal"},𝒬:{letter:"Q",fontCmd:"mathcal"},ℛ:{letter:"R",fontCmd:"mathcal"},𝕽:{letter:"R",fontCmd:"mathcal"},"℟":{letter:"R",fontCmd:"mathcal"},𝒮:{letter:"S",fontCmd:"mathcal"},𝒯:{letter:"T",fontCmd:"mathcal"},𝒰:{letter:"U",fontCmd:"mathcal"},𝒱:{letter:"V",fontCmd:"mathcal"},𝒲:{letter:"W",fontCmd:"mathcal"},𝒳:{letter:"X",fontCmd:"mathcal"},𝒴:{letter:"Y",fontCmd:"mathcal"},𝒵:{letter:"Z",fontCmd:"mathcal"},𝔄:{letter:"A",fontCmd:"mathfrak"},𝔅:{letter:"B",fontCmd:"mathfrak"},ℭ:{letter:"C",fontCmd:"mathfrak"},𝔇:{letter:"D",fontCmd:"mathfrak"},𝔈:{letter:"E",fontCmd:"mathfrak"},𝔉:{letter:"F",fontCmd:"mathfrak"},𝔊:{letter:"G",fontCmd:"mathfrak"},ℌ:{letter:"H",fontCmd:"mathfrak"},ℑ:{letter:"I",fontCmd:"mathfrak"},𝔍:{letter:"J",fontCmd:"mathfrak"},𝔎:{letter:"K",fontCmd:"mathfrak"},𝔏:{letter:"L",fontCmd:"mathfrak"},𝔐:{letter:"M",fontCmd:"mathfrak"},𝔑:{letter:"N",fontCmd:"mathfrak"},𝔒:{letter:"O",fontCmd:"mathfrak"},𝔓:{letter:"P",fontCmd:"mathfrak"},𝔔:{letter:"Q",fontCmd:"mathfrak"},ℜ:{letter:"R",fontCmd:"mathfrak"},𝔖:{letter:"S",fontCmd:"mathfrak"},𝔗:{letter:"T",fontCmd:"mathfrak"},𝔘:{letter:"U",fontCmd:"mathfrak"},𝔙:{letter:"V",fontCmd:"mathfrak"},𝔚:{letter:"W",fontCmd:"mathfrak"},𝔛:{letter:"X",fontCmd:"mathfrak"},𝔜:{letter:"Y",fontCmd:"mathfrak"},ℨ:{letter:"Z",fontCmd:"mathfrak"},𝖠:{letter:"A",fontCmd:"mathsf"},Α:{letter:"A",fontCmd:"mathsf"},𝖡:{letter:"B",fontCmd:"mathsf"},Β:{letter:"B",fontCmd:"mathsf"},𝖢:{letter:"C",fontCmd:"mathsf"},𝖣:{letter:"D",fontCmd:"mathsf"},𝖤:{letter:"E",fontCmd:"mathsf"},𝖥:{letter:"F",fontCmd:"mathsf"},𝖦:{letter:"G",fontCmd:"mathsf"},𝖧:{letter:"H",fontCmd:"mathsf"},𝖨:{letter:"I",fontCmd:"mathsf"},𝖩:{letter:"J",fontCmd:"mathsf"},ȷ:{letter:"J",fontCmd:"mathsf"},𝖪:{letter:"K",fontCmd:"mathsf"},Κ:{letter:"K",fontCmd:"mathsf"},𝖫:{letter:"L",fontCmd:"mathsf"},𝖬:{letter:"M",fontCmd:"mathsf"},𝖭:{letter:"N",fontCmd:"mathsf"},𝖮:{letter:"O",fontCmd:"mathsf"},𝖯:{letter:"P",fontCmd:"mathsf"},𝖰:{letter:"Q",fontCmd:"mathsf"},𝖱:{letter:"R",fontCmd:"mathsf"},𝖲:{letter:"S",fontCmd:"mathsf"},𝖳:{letter:"T",fontCmd:"mathsf"},𝖴:{letter:"U",fontCmd:"mathsf"},𝖵:{letter:"V",fontCmd:"mathsf"},𝖶:{letter:"W",fontCmd:"mathsf"},𝖷:{letter:"X",fontCmd:"mathsf"},Χ:{letter:"X",fontCmd:"mathsf"},𝖸:{letter:"Y",fontCmd:"mathsf"},𝖹:{letter:"Z",fontCmd:"mathsf"},𝚨:{letter:"A",fontCmd:"mathtt"},𝚩:{letter:"B",fontCmd:"mathtt"},𝚪:{letter:"\\Gamma",fontCmd:"mathtt"},𝚫:{letter:"\\Delta",fontCmd:"mathtt"},𝚬:{letter:"E",fontCmd:"mathtt"},𝚭:{letter:"F",fontCmd:"mathtt"},𝚮:{letter:"G",fontCmd:"mathtt"},𝚯:{letter:"\\Theta",fontCmd:"mathtt"},𝚰:{letter:"I",fontCmd:"mathtt"},𝚱:{letter:"J",fontCmd:"mathtt"},𝚲:{letter:"\\Lambda",fontCmd:"mathtt"},𝚳:{letter:"L",fontCmd:"mathtt"},𝚴:{letter:"M",fontCmd:"mathtt"},𝚵:{letter:"\\Pi",fontCmd:"mathtt"},𝚶:{letter:"O",fontCmd:"mathtt"},𝚷:{letter:"\\Pi",fontCmd:"mathtt"},𝚸:{letter:"Q",fontCmd:"mathtt"},𝚹:{letter:"R",fontCmd:"mathtt"},𝚺:{letter:"S",fontCmd:"mathtt"},𝚻:{letter:"T",fontCmd:"mathtt"},𝚼:{letter:"U",fontCmd:"mathtt"},𝚽:{letter:"\\Phi",fontCmd:"mathtt"},𝚾:{letter:"W",fontCmd:"mathtt"},𝚿:{letter:"\\Psi",fontCmd:"mathtt"},𝛀:{letter:"\\Omega",fontCmd:"mathtt"}}}},t={};function r(a){var n=t[a];if(void 0!==n)return n.exports;var o=t[a]={exports:{}};return e[a].call(o.exports,o,o.exports,r),o.exports}var a={};return(()=>{"use strict";var e=a;Object.defineProperty(e,"__esModule",{value:!0}),e.MathMLToLaTeX=void 0;var t=r(8672);Object.defineProperty(e,"MathMLToLaTeX",{enumerable:!0,get:function(){return t.MathMLToLaTeX}})})(),a})()));
//# sourceMappingURL=bundle.min.js.map

/***/ }),

/***/ 608:
/*!*************************!*\
  !*** ./src/metadata.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataExtractor = void 0;
class MetadataExtractor {
    static extract(doc, schemaOrgData) {
        var _a, _b;
        let domain = '';
        let url = '';
        try {
            // Try to get URL from document location
            url = ((_a = doc.location) === null || _a === void 0 ? void 0 : _a.href) || '';
            // If no URL from location, try other sources
            if (!url) {
                url = this.getMetaContent(doc, "property", "og:url") ||
                    this.getMetaContent(doc, "property", "twitter:url") ||
                    this.getSchemaProperty(doc, schemaOrgData, 'url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'mainEntityOfPage.url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'mainEntity.url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'WebSite.url') ||
                    ((_b = doc.querySelector('link[rel="canonical"]')) === null || _b === void 0 ? void 0 : _b.getAttribute('href')) || '';
            }
            if (url) {
                domain = new URL(url).hostname.replace(/^www\./, '');
            }
        }
        catch (e) {
            // If URL parsing fails, try to get from base tag
            const baseTag = doc.querySelector('base[href]');
            if (baseTag) {
                try {
                    url = baseTag.getAttribute('href') || '';
                    domain = new URL(url).hostname.replace(/^www\./, '');
                }
                catch (e) {
                    console.warn('Failed to parse base URL:', e);
                }
            }
        }
        return {
            title: this.getTitle(doc, schemaOrgData),
            description: this.getDescription(doc, schemaOrgData),
            domain,
            favicon: this.getFavicon(doc, url),
            image: this.getImage(doc, schemaOrgData),
            published: this.getPublished(doc, schemaOrgData),
            author: this.getAuthor(doc, schemaOrgData),
            site: this.getSite(doc, schemaOrgData),
            schemaOrgData,
            wordCount: 0,
            parseTime: 0
        };
    }
    static getAuthor(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "name", "sailthru.author") ||
            this.getSchemaProperty(doc, schemaOrgData, 'author.name') ||
            this.getMetaContent(doc, "property", "author") ||
            this.getMetaContent(doc, "name", "byl") ||
            this.getMetaContent(doc, "name", "author") ||
            this.getMetaContent(doc, "name", "authorList") ||
            this.getMetaContent(doc, "name", "copyright") ||
            this.getSchemaProperty(doc, schemaOrgData, 'copyrightHolder.name') ||
            this.getMetaContent(doc, "property", "og:site_name") ||
            this.getSchemaProperty(doc, schemaOrgData, 'publisher.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'sourceOrganization.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'isPartOf.name') ||
            this.getMetaContent(doc, "name", "twitter:creator") ||
            this.getMetaContent(doc, "name", "application-name") ||
            '');
    }
    static getSite(doc, schemaOrgData) {
        return (this.getSchemaProperty(doc, schemaOrgData, 'publisher.name') ||
            this.getMetaContent(doc, "property", "og:site_name") ||
            this.getSchemaProperty(doc, schemaOrgData, 'WebSite.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'sourceOrganization.name') ||
            this.getMetaContent(doc, "name", "copyright") ||
            this.getSchemaProperty(doc, schemaOrgData, 'copyrightHolder.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'isPartOf.name') ||
            this.getMetaContent(doc, "name", "application-name") ||
            this.getAuthor(doc, schemaOrgData) ||
            '');
    }
    static getTitle(doc, schemaOrgData) {
        var _a, _b;
        const rawTitle = (this.getMetaContent(doc, "property", "og:title") ||
            this.getMetaContent(doc, "name", "twitter:title") ||
            this.getSchemaProperty(doc, schemaOrgData, 'headline') ||
            this.getMetaContent(doc, "name", "title") ||
            this.getMetaContent(doc, "name", "sailthru.title") ||
            ((_b = (_a = doc.querySelector('title')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ||
            '');
        return this.cleanTitle(rawTitle, this.getSite(doc, schemaOrgData));
    }
    static cleanTitle(title, siteName) {
        if (!title || !siteName)
            return title;
        // Remove site name if it exists
        const siteNameEscaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            `\\s*[\\|\\-–—]\\s*${siteNameEscaped}\\s*$`, // Title | Site Name
            `^\\s*${siteNameEscaped}\\s*[\\|\\-–—]\\s*`, // Site Name | Title
        ];
        for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(title)) {
                title = title.replace(regex, '');
                break;
            }
        }
        return title.trim();
    }
    static getDescription(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "name", "description") ||
            this.getMetaContent(doc, "property", "description") ||
            this.getMetaContent(doc, "property", "og:description") ||
            this.getSchemaProperty(doc, schemaOrgData, 'description') ||
            this.getMetaContent(doc, "name", "twitter:description") ||
            this.getMetaContent(doc, "name", "sailthru.description") ||
            '');
    }
    static getImage(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "property", "og:image") ||
            this.getMetaContent(doc, "name", "twitter:image") ||
            this.getSchemaProperty(doc, schemaOrgData, 'image.url') ||
            this.getMetaContent(doc, "name", "sailthru.image.full") ||
            '');
    }
    static getFavicon(doc, baseUrl) {
        var _a, _b;
        const iconFromMeta = this.getMetaContent(doc, "property", "og:image:favicon");
        if (iconFromMeta)
            return iconFromMeta;
        const iconLink = (_a = doc.querySelector("link[rel='icon']")) === null || _a === void 0 ? void 0 : _a.getAttribute("href");
        if (iconLink)
            return iconLink;
        const shortcutLink = (_b = doc.querySelector("link[rel='shortcut icon']")) === null || _b === void 0 ? void 0 : _b.getAttribute("href");
        if (shortcutLink)
            return shortcutLink;
        // Only try to construct favicon URL if we have a valid base URL
        if (baseUrl) {
            try {
                return new URL("/favicon.ico", baseUrl).href;
            }
            catch (e) {
                console.warn('Failed to construct favicon URL:', e);
            }
        }
        return '';
    }
    static getPublished(doc, schemaOrgData) {
        return (this.getSchemaProperty(doc, schemaOrgData, 'datePublished') ||
            this.getMetaContent(doc, "name", "publishDate") ||
            this.getMetaContent(doc, "property", "article:published_time") ||
            this.getTimeElement(doc) ||
            this.getMetaContent(doc, "name", "sailthru.date") ||
            '');
    }
    static getMetaContent(doc, attr, value) {
        var _a, _b;
        const selector = `meta[${attr}]`;
        const element = Array.from(doc.querySelectorAll(selector))
            .find(el => { var _a; return ((_a = el.getAttribute(attr)) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === value.toLowerCase(); });
        const content = element ? (_b = (_a = element.getAttribute("content")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "" : "";
        return this.decodeHTMLEntities(content, doc);
    }
    static getTimeElement(doc) {
        var _a, _b, _c, _d;
        const selector = `time`;
        const element = Array.from(doc.querySelectorAll(selector))[0];
        const content = element ? ((_d = (_b = (_a = element.getAttribute("datetime")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = element.textContent) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "") : "";
        return this.decodeHTMLEntities(content, doc);
    }
    static decodeHTMLEntities(text, doc) {
        const textarea = doc.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
    static getSchemaProperty(doc, schemaOrgData, property, defaultValue = '') {
        if (!schemaOrgData)
            return defaultValue;
        const searchSchema = (data, props, fullPath, isExactMatch = true) => {
            if (typeof data === 'string') {
                return props.length === 0 ? [data] : [];
            }
            if (!data || typeof data !== 'object') {
                return [];
            }
            if (Array.isArray(data)) {
                const currentProp = props[0];
                if (/^\[\d+\]$/.test(currentProp)) {
                    const index = parseInt(currentProp.slice(1, -1));
                    if (data[index]) {
                        return searchSchema(data[index], props.slice(1), fullPath, isExactMatch);
                    }
                    return [];
                }
                if (props.length === 0 && data.every(item => typeof item === 'string' || typeof item === 'number')) {
                    return data.map(String);
                }
                return data.flatMap(item => searchSchema(item, props, fullPath, isExactMatch));
            }
            const [currentProp, ...remainingProps] = props;
            if (!currentProp) {
                if (typeof data === 'string')
                    return [data];
                if (typeof data === 'object' && data.name) {
                    return [data.name];
                }
                return [];
            }
            if (data.hasOwnProperty(currentProp)) {
                return searchSchema(data[currentProp], remainingProps, fullPath ? `${fullPath}.${currentProp}` : currentProp, true);
            }
            if (!isExactMatch) {
                const nestedResults = [];
                for (const key in data) {
                    if (typeof data[key] === 'object') {
                        const results = searchSchema(data[key], props, fullPath ? `${fullPath}.${key}` : key, false);
                        nestedResults.push(...results);
                    }
                }
                if (nestedResults.length > 0) {
                    return nestedResults;
                }
            }
            return [];
        };
        try {
            let results = searchSchema(schemaOrgData, property.split('.'), '', true);
            if (results.length === 0) {
                results = searchSchema(schemaOrgData, property.split('.'), '', false);
            }
            const result = results.length > 0 ? results.filter(Boolean).join(', ') : defaultValue;
            return this.decodeHTMLEntities(result, doc);
        }
        catch (error) {
            console.error(`Error in getSchemaProperty for ${property}:`, error);
            return defaultValue;
        }
    }
    static extractSchemaOrgData(doc) {
        const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
        const schemaData = [];
        schemaScripts.forEach(script => {
            let jsonContent = script.textContent || '';
            try {
                jsonContent = jsonContent
                    .replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
                    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
                    .replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g, '')
                    .trim();
                const jsonData = JSON.parse(jsonContent);
                if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
                    schemaData.push(...jsonData['@graph']);
                }
                else {
                    schemaData.push(jsonData);
                }
            }
            catch (error) {
                console.error('Error parsing schema.org data:', error);
                console.error('Problematic JSON content:', jsonContent);
            }
        });
        return schemaData;
    }
}
exports.MetadataExtractor = MetadataExtractor;


/***/ }),

/***/ 628:
/*!*************************!*\
  !*** ./src/defuddle.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Defuddle = void 0;
const metadata_1 = __webpack_require__(/*! ./metadata */ 608);
const mathml_to_latex_1 = __webpack_require__(/*! mathml-to-latex */ 354);
const constants_1 = __webpack_require__(/*! ./constants */ 640);
const ELEMENT_STANDARDIZATION_RULES = [
    // Math elements
    {
        selector: 'span.MathJax',
        element: 'math',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            // Try to get MathML from data-mathml attribute
            const mathmlStr = el.getAttribute('data-mathml');
            if (!mathmlStr) {
                // Check for assistive MathML as fallback
                const assistiveMml = el.querySelector('.MJX_Assistive_MathML math');
                if (assistiveMml) {
                    // Create new math element
                    const newMath = document.createElement('math');
                    // Copy attributes from assistive MathML
                    Array.from(assistiveMml.attributes).forEach(attr => {
                        if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                            newMath.setAttribute(attr.name, attr.value);
                        }
                    });
                    // Set display mode (default to inline)
                    const isBlock = assistiveMml.getAttribute('display') === 'block';
                    newMath.setAttribute('display', isBlock ? 'block' : 'inline');
                    // Convert to LaTeX and store
                    try {
                        const latex = mathml_to_latex_1.MathMLToLaTeX.convert(assistiveMml.outerHTML);
                        newMath.setAttribute('data-latex', latex);
                    }
                    catch (error) {
                        console.error('Error converting MathML to LaTeX:', error);
                    }
                    // Copy content
                    newMath.innerHTML = assistiveMml.innerHTML;
                    return newMath;
                }
                return el;
            }
            // Create a temporary div to parse the MathML string
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = mathmlStr;
            const mathElement = tempDiv.querySelector('math');
            if (!mathElement)
                return el;
            // Create new math element
            const newMath = document.createElement('math');
            // Copy attributes from original math element
            Array.from(mathElement.attributes).forEach(attr => {
                if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                    newMath.setAttribute(attr.name, attr.value);
                }
            });
            // Set display mode (default to inline)
            const isBlock = mathElement.getAttribute('display') === 'block';
            newMath.setAttribute('display', isBlock ? 'block' : 'inline');
            // Convert to LaTeX and store
            try {
                const latex = mathml_to_latex_1.MathMLToLaTeX.convert(mathElement.outerHTML);
                newMath.setAttribute('data-latex', latex);
            }
            catch (error) {
                console.error('Error converting MathML to LaTeX:', error);
            }
            // Copy content
            newMath.innerHTML = mathElement.innerHTML;
            return newMath;
        }
    },
    {
        selector: 'mjx-container',
        element: 'math',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            const assistiveMml = el.querySelector('mjx-assistive-mml');
            if (!assistiveMml)
                return el;
            const mathElement = assistiveMml.querySelector('math');
            if (!mathElement)
                return el;
            // Create new math element
            const newMath = document.createElement('math');
            // Copy attributes from original math element
            Array.from(mathElement.attributes).forEach(attr => {
                if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                    newMath.setAttribute(attr.name, attr.value);
                }
            });
            // Set display mode (default to inline)
            const isBlock = mathElement.getAttribute('display') === 'block';
            newMath.setAttribute('display', isBlock ? 'block' : 'inline');
            // Convert to LaTeX and store
            try {
                const latex = mathml_to_latex_1.MathMLToLaTeX.convert(mathElement.outerHTML);
                newMath.setAttribute('data-latex', latex);
            }
            catch (error) {
                console.error('Error converting MathML to LaTeX:', error);
            }
            // Copy content
            newMath.innerHTML = mathElement.innerHTML;
            return newMath;
        }
    },
    {
        selector: 'math, .mwe-math-element, .mwe-math-fallback-image-inline, .mwe-math-fallback-image-display',
        element: 'math',
        transform: (el) => {
            var _a, _b;
            if (!(el instanceof HTMLElement))
                return el;
            // Helper function to extract LaTeX from various formats
            const extractLatex = (element) => {
                // Check if the element is a <math> element and has an alttext attribute
                if (element.nodeName.toLowerCase() === 'math') {
                    const alttext = element.getAttribute('alttext');
                    if (alttext) {
                        return alttext.trim();
                    }
                }
                // If not, look for a nested <math> element with alttext
                const mathElement = element.querySelector('math[alttext]');
                if (mathElement) {
                    const alttext = mathElement.getAttribute('alttext');
                    if (alttext) {
                        return alttext.trim();
                    }
                }
                // Try to find LaTeX in annotation
                const annotation = element.querySelector('annotation[encoding="application/x-tex"]');
                if (annotation === null || annotation === void 0 ? void 0 : annotation.textContent) {
                    return annotation.textContent.trim();
                }
                // Try to convert MathML to LaTeX
                const mathNode = element.nodeName.toLowerCase() === 'math' ? element : element.querySelector('math');
                if (mathNode) {
                    try {
                        return mathml_to_latex_1.MathMLToLaTeX.convert(mathNode.outerHTML);
                    }
                    catch (error) {
                        console.error('Error converting MathML to LaTeX:', error);
                    }
                }
                // Fallback to img alt text
                const imgNode = element.querySelector('img');
                return (imgNode === null || imgNode === void 0 ? void 0 : imgNode.getAttribute('alt')) || '';
            };
            // Create new math element
            const newMath = document.createElement('math');
            // Copy attributes from original element if it's a math element
            if (el.tagName.toLowerCase() === 'math') {
                Array.from(el.attributes).forEach(attr => {
                    if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                        newMath.setAttribute(attr.name, attr.value);
                    }
                });
            }
            // Determine if it's a block element
            const isBlock = el.getAttribute('display') === 'block' ||
                el.classList.contains('mwe-math-fallback-image-display') ||
                (((_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.classList.contains('mwe-math-element')) &&
                    ((_b = el.parentElement.previousElementSibling) === null || _b === void 0 ? void 0 : _b.nodeName.toLowerCase()) === 'p');
            // Always set display mode (default to inline)
            newMath.setAttribute('display', isBlock ? 'block' : 'inline');
            // Extract and store LaTeX as alttext
            const latex = extractLatex(el);
            if (latex) {
                newMath.setAttribute('data-latex', latex);
            }
            // If original is a math element, copy its content
            if (el.tagName.toLowerCase() === 'math') {
                newMath.innerHTML = el.innerHTML;
            }
            else {
                // Otherwise, try to find and copy content from a nested math element
                const nestedMath = el.querySelector('math');
                if (nestedMath) {
                    newMath.innerHTML = nestedMath.innerHTML;
                }
            }
            return newMath;
        }
    },
    {
        selector: '.math, .katex',
        element: 'math',
        transform: (el) => {
            var _a;
            if (!(el instanceof HTMLElement))
                return el;
            // Create new math element
            const newMath = document.createElement('math');
            // Try to find the original LaTeX content
            let latex = el.getAttribute('data-latex');
            if (!latex) {
                // Try to get from .katex-mathml
                const mathml = el.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
                latex = (mathml === null || mathml === void 0 ? void 0 : mathml.textContent) || '';
            }
            if (!latex) {
                // Use text content as fallback
                latex = ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            }
            // Store LaTeX
            if (latex) {
                newMath.setAttribute('data-latex', latex);
            }
            // Set display mode (default to inline)
            const isBlock = !el.classList.contains('math-inline') && (el.classList.contains('math-display') ||
                el.classList.contains('katex-display') ||
                el.closest('.katex-display') !== null);
            newMath.setAttribute('display', isBlock ? 'block' : 'inline');
            // Try to get content from mathml if available
            const mathml = el.querySelector('.katex-mathml math');
            if (mathml) {
                newMath.innerHTML = mathml.innerHTML;
            }
            return newMath;
        }
    },
    // Code blocks
    {
        selector: 'pre',
        element: 'pre',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            // Function to get language from class
            const getLanguageFromClass = (element) => {
                // Check data-lang attribute first
                const dataLang = element.getAttribute('data-lang');
                if (dataLang) {
                    return dataLang.toLowerCase();
                }
                // Define language patterns
                const languagePatterns = [
                    /^language-(\w+)$/, // language-javascript
                    /^lang-(\w+)$/, // lang-javascript
                    /^(\w+)-code$/, // javascript-code
                    /^code-(\w+)$/, // code-javascript
                    /^syntax-(\w+)$/, // syntax-javascript
                    /^code-snippet__(\w+)$/, // code-snippet__javascript
                    /^highlight-(\w+)$/, // highlight-javascript
                    /^(\w+)-snippet$/ // javascript-snippet
                ];
                // Then check the class attribute for patterns
                if (element.className && typeof element.className === 'string') {
                    for (const pattern of languagePatterns) {
                        const match = element.className.toLowerCase().match(pattern);
                        if (match) {
                            return match[1].toLowerCase();
                        }
                    }
                    // Then check for supported language
                    if (constants_1.SUPPORTED_LANGUAGES.has(element.className.toLowerCase())) {
                        return element.className.toLowerCase();
                    }
                }
                const classNames = Array.from(element.classList);
                for (const className of classNames) {
                    // Check patterns first
                    for (const pattern of languagePatterns) {
                        const match = className.match(pattern);
                        if (match) {
                            return match[1].toLowerCase();
                        }
                    }
                }
                // Only check bare language names if no patterns were found
                for (const className of classNames) {
                    if (constants_1.SUPPORTED_LANGUAGES.has(className.toLowerCase())) {
                        return className.toLowerCase();
                    }
                }
                return '';
            };
            // Try to get the language from the element and its ancestors
            let language = '';
            let currentElement = el;
            while (currentElement && !language) {
                language = getLanguageFromClass(currentElement);
                // Also check for code elements within the current element
                if (!language && currentElement.querySelector('code')) {
                    language = getLanguageFromClass(currentElement.querySelector('code'));
                }
                currentElement = currentElement.parentElement;
            }
            // Function to recursively extract text content while preserving structure
            const extractStructuredText = (element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                    return element.textContent || '';
                }
                let text = '';
                if (element instanceof HTMLElement) {
                    // Handle line breaks
                    if (element.tagName === 'BR') {
                        return '\n';
                    }
                    // Handle code elements and their children
                    element.childNodes.forEach(child => {
                        text += extractStructuredText(child);
                    });
                    // Add newline after each code element
                    if (element.tagName === 'CODE') {
                        text += '\n';
                    }
                }
                return text;
            };
            // Extract all text content
            let codeContent = extractStructuredText(el);
            // Clean up the content
            codeContent = codeContent
                // Remove any extra newlines at the start
                .replace(/^\n+/, '')
                // Remove any extra newlines at the end
                .replace(/\n+$/, '')
                // Replace multiple consecutive newlines with a single newline
                .replace(/\n{3,}/g, '\n\n');
            // Create new pre element
            const newPre = document.createElement('pre');
            // Copy allowed attributes
            Array.from(el.attributes).forEach(attr => {
                if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                    newPre.setAttribute(attr.name, attr.value);
                }
            });
            // Create code element
            const code = document.createElement('code');
            if (language) {
                code.setAttribute('data-lang', language);
                code.setAttribute('class', `language-${language}`);
            }
            code.textContent = codeContent;
            newPre.appendChild(code);
            return newPre;
        }
    },
    // Simplify headings by removing internal navigation elements
    {
        selector: 'h1, h2, h3, h4, h5, h6',
        element: 'keep',
        transform: (el) => {
            var _a, _b, _c, _d, _e;
            // If heading only contains a single anchor with internal link
            if (el.children.length === 1 &&
                ((_a = el.firstElementChild) === null || _a === void 0 ? void 0 : _a.tagName) === 'A' &&
                (((_b = el.firstElementChild.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.includes('#')) ||
                    ((_c = el.firstElementChild.getAttribute('href')) === null || _c === void 0 ? void 0 : _c.startsWith('#')))) {
                // Create new heading of same level
                const newHeading = document.createElement(el.tagName);
                // Copy allowed attributes from original heading
                Array.from(el.attributes).forEach(attr => {
                    if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                        newHeading.setAttribute(attr.name, attr.value);
                    }
                });
                // Just use the text content
                newHeading.textContent = ((_d = el.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                return newHeading;
            }
            // If heading contains navigation buttons or other utility elements
            const buttons = el.querySelectorAll('button');
            if (buttons.length > 0) {
                const newHeading = document.createElement(el.tagName);
                // Copy allowed attributes
                Array.from(el.attributes).forEach(attr => {
                    if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                        newHeading.setAttribute(attr.name, attr.value);
                    }
                });
                // Just use the text content
                newHeading.textContent = ((_e = el.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || '';
                return newHeading;
            }
            return el;
        }
    },
    // Convert divs with paragraph role to actual paragraphs
    {
        selector: 'div[data-testid^="paragraph"], div[role="paragraph"]',
        element: 'p',
        transform: (el) => {
            const p = document.createElement('p');
            // Copy innerHTML
            p.innerHTML = el.innerHTML;
            // Copy allowed attributes
            Array.from(el.attributes).forEach(attr => {
                if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                    p.setAttribute(attr.name, attr.value);
                }
            });
            return p;
        }
    },
    // Convert divs with list roles to actual lists
    {
        selector: 'div[role="list"]',
        element: 'ul',
        // Custom handler for list type detection and transformation
        transform: (el) => {
            var _a;
            // First determine if this is an ordered list
            const firstItem = el.querySelector('div[role="listitem"] .label');
            const label = ((_a = firstItem === null || firstItem === void 0 ? void 0 : firstItem.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            const isOrdered = label.match(/^\d+\)/);
            // Create the appropriate list type
            const list = document.createElement(isOrdered ? 'ol' : 'ul');
            // Process each list item
            const items = el.querySelectorAll('div[role="listitem"]');
            items.forEach(item => {
                const li = document.createElement('li');
                const content = item.querySelector('.content');
                if (content) {
                    // Convert any paragraph divs inside content
                    const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
                    paragraphDivs.forEach(div => {
                        const p = document.createElement('p');
                        p.innerHTML = div.innerHTML;
                        div.replaceWith(p);
                    });
                    // Convert any nested lists recursively
                    const nestedLists = content.querySelectorAll('div[role="list"]');
                    nestedLists.forEach(nestedList => {
                        var _a;
                        const firstNestedItem = nestedList.querySelector('div[role="listitem"] .label');
                        const nestedLabel = ((_a = firstNestedItem === null || firstNestedItem === void 0 ? void 0 : firstNestedItem.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                        const isNestedOrdered = nestedLabel.match(/^\d+\)/);
                        const newNestedList = document.createElement(isNestedOrdered ? 'ol' : 'ul');
                        // Process nested items
                        const nestedItems = nestedList.querySelectorAll('div[role="listitem"]');
                        nestedItems.forEach(nestedItem => {
                            const nestedLi = document.createElement('li');
                            const nestedContent = nestedItem.querySelector('.content');
                            if (nestedContent) {
                                // Convert paragraph divs in nested items
                                const nestedParagraphs = nestedContent.querySelectorAll('div[role="paragraph"]');
                                nestedParagraphs.forEach(div => {
                                    const p = document.createElement('p');
                                    p.innerHTML = div.innerHTML;
                                    div.replaceWith(p);
                                });
                                nestedLi.innerHTML = nestedContent.innerHTML;
                            }
                            newNestedList.appendChild(nestedLi);
                        });
                        nestedList.replaceWith(newNestedList);
                    });
                    li.innerHTML = content.innerHTML;
                }
                list.appendChild(li);
            });
            return list;
        }
    },
    {
        selector: 'div[role="listitem"]',
        element: 'li',
        // Custom handler for list item content
        transform: (el) => {
            const content = el.querySelector('.content');
            if (!content)
                return el;
            // Convert any paragraph divs inside content
            const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
            paragraphDivs.forEach(div => {
                const p = document.createElement('p');
                p.innerHTML = div.innerHTML;
                div.replaceWith(p);
            });
            return content;
        }
    },
    // Code blocks with syntax highlighting
    {
        selector: '.wp-block-syntaxhighlighter-code, .syntaxhighlighter, .highlight, .highlight-source, .wp-block-code, pre[class*="language-"], pre[class*="brush:"]',
        element: 'pre',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            // Create new pre element
            const newPre = document.createElement('pre');
            // Try to detect language
            let language = '';
            // Check for WordPress syntax highlighter specific format
            const syntaxEl = el.querySelector('.syntaxhighlighter');
            if (syntaxEl) {
                // Get language from syntaxhighlighter class
                const classes = Array.from(syntaxEl.classList);
                const langClass = classes.find(c => !['syntaxhighlighter', 'nogutter'].includes(c));
                if (langClass && constants_1.SUPPORTED_LANGUAGES.has(langClass.toLowerCase())) {
                    language = langClass.toLowerCase();
                }
            }
            // If no language found yet, check other common patterns
            if (!language) {
                const classNames = Array.from(el.classList);
                const languagePatterns = [
                    /(?:^|\s)(?:language|lang|brush|syntax)-(\w+)(?:\s|$)/i,
                    /(?:^|\s)(\w+)(?:\s|$)/i
                ];
                for (const className of classNames) {
                    for (const pattern of languagePatterns) {
                        const match = className.match(pattern);
                        if (match && match[1] && constants_1.SUPPORTED_LANGUAGES.has(match[1].toLowerCase())) {
                            language = match[1].toLowerCase();
                            break;
                        }
                    }
                    if (language)
                        break;
                }
            }
            // Extract code content, handling various formats
            let codeContent = '';
            // Handle WordPress syntax highlighter table format
            const codeContainer = el.querySelector('.syntaxhighlighter table .code .container');
            if (codeContainer) {
                // Process each line
                const lines = Array.from(codeContainer.children);
                codeContent = lines
                    .map(line => {
                    // Get all code elements in this line
                    const codeParts = Array.from(line.querySelectorAll('code'))
                        .map(code => {
                        // Get the text content, preserving spaces
                        let text = code.textContent || '';
                        // If this is a 'spaces' class element, convert to actual spaces
                        if (code.classList.contains('spaces')) {
                            text = ' '.repeat(text.length);
                        }
                        return text;
                    })
                        .join('');
                    return codeParts || line.textContent || '';
                })
                    .join('\n');
            }
            else {
                // Handle WordPress syntax highlighter non-table format
                const codeLines = el.querySelectorAll('.code .line');
                if (codeLines.length > 0) {
                    codeContent = Array.from(codeLines)
                        .map(line => {
                        const codeParts = Array.from(line.querySelectorAll('code'))
                            .map(code => code.textContent || '')
                            .join('');
                        return codeParts || line.textContent || '';
                    })
                        .join('\n');
                }
                else {
                    // Fallback to regular text content
                    codeContent = el.textContent || '';
                }
            }
            // Clean up the content
            codeContent = codeContent
                .replace(/^\s+|\s+$/g, '') // Trim start/end whitespace
                .replace(/\t/g, '    ') // Convert tabs to spaces
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                .replace(/\u00a0/g, ' '); // Replace non-breaking spaces with regular spaces
            // Create code element with language class if detected
            const code = document.createElement('code');
            if (language) {
                code.setAttribute('data-lang', language);
                code.setAttribute('class', `language-${language}`);
            }
            code.textContent = codeContent;
            newPre.appendChild(code);
            return newPre;
        }
    }
];
class Defuddle {
    /**
     * Create a new Defuddle instance
     * @param doc - The document to parse
     * @param options - Options for parsing
     */
    constructor(doc, options = {}) {
        this.doc = doc;
        this.options = options;
        this.debug = options.debug || false;
    }
    /**
     * Parse the document and extract its main content
     */
    parse() {
        const startTime = performance.now();
        // Extract metadata first since we'll need it in multiple places
        const schemaOrgData = metadata_1.MetadataExtractor.extractSchemaOrgData(this.doc);
        const metadata = metadata_1.MetadataExtractor.extract(this.doc, schemaOrgData);
        try {
            // Evaluate styles and sizes on original document
            const mobileStyles = this._evaluateMediaQueries(this.doc);
            // Check for small images in original document, excluding lazy-loaded ones
            const smallImages = this.findSmallImages(this.doc);
            // Clone document
            const clone = this.doc.cloneNode(true);
            // Apply mobile style to clone
            this.applyMobileStyles(clone, mobileStyles);
            // Find main content
            const mainContent = this.findMainContent(clone);
            if (!mainContent) {
                const endTime = performance.now();
                return Object.assign(Object.assign({ content: this.doc.body.innerHTML }, metadata), { wordCount: this.countWords(this.doc.body.innerHTML), parseTime: Math.round(endTime - startTime) });
            }
            // Remove small images identified from original document
            this.removeSmallImages(clone, smallImages);
            // Perform other destructive operations on the clone
            this.removeHiddenElements(clone);
            this.removeClutter(clone);
            // Clean up the main content
            this.cleanContent(mainContent, metadata);
            const content = mainContent ? mainContent.outerHTML : this.doc.body.innerHTML;
            const endTime = performance.now();
            return Object.assign(Object.assign({ content }, metadata), { wordCount: this.countWords(content), parseTime: Math.round(endTime - startTime) });
        }
        catch (error) {
            console.error('Defuddle', 'Error processing document:', error);
            const endTime = performance.now();
            return Object.assign(Object.assign({ content: this.doc.body.innerHTML }, metadata), { wordCount: this.countWords(this.doc.body.innerHTML), parseTime: Math.round(endTime - startTime) });
        }
    }
    countWords(content) {
        // Create a temporary div to parse HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        // Get text content, removing extra whitespace
        const text = tempDiv.textContent || '';
        const words = text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .split(' ')
            .filter(word => word.length > 0); // Filter out empty strings
        return words.length;
    }
    // Make all other methods private by removing the static keyword and using private
    _log(...args) {
        if (this.debug) {
            console.log('Defuddle:', ...args);
        }
    }
    _evaluateMediaQueries(doc) {
        const mobileStyles = [];
        const maxWidthRegex = /max-width[^:]*:\s*(\d+)/;
        try {
            // Get all styles, including inline styles
            const sheets = Array.from(doc.styleSheets).filter(sheet => {
                try {
                    // Access rules once to check validity
                    sheet.cssRules;
                    return true;
                }
                catch (e) {
                    // Expected error for cross-origin stylesheets
                    if (e instanceof DOMException && e.name === 'SecurityError') {
                        return false;
                    }
                    throw e;
                }
            });
            // Process all sheets in a single pass
            const mediaRules = sheets.flatMap(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .filter((rule) => rule instanceof CSSMediaRule &&
                        rule.conditionText.includes('max-width'));
                }
                catch (e) {
                    if (this.debug) {
                        console.warn('Defuddle: Failed to process stylesheet:', e);
                    }
                    return [];
                }
            });
            // Process all media rules in a single pass
            mediaRules.forEach(rule => {
                const match = rule.conditionText.match(maxWidthRegex);
                if (match) {
                    const maxWidth = parseInt(match[1]);
                    if (constants_1.MOBILE_WIDTH <= maxWidth) {
                        // Batch process all style rules
                        const styleRules = Array.from(rule.cssRules)
                            .filter((r) => r instanceof CSSStyleRule);
                        styleRules.forEach(cssRule => {
                            try {
                                mobileStyles.push({
                                    selector: cssRule.selectorText,
                                    styles: cssRule.style.cssText
                                });
                            }
                            catch (e) {
                                if (this.debug) {
                                    console.warn('Defuddle: Failed to process CSS rule:', e);
                                }
                            }
                        });
                    }
                }
            });
        }
        catch (e) {
            console.error('Defuddle: Error evaluating media queries:', e);
        }
        return mobileStyles;
    }
    applyMobileStyles(doc, mobileStyles) {
        let appliedCount = 0;
        mobileStyles.forEach(({ selector, styles }) => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(element => {
                    element.setAttribute('style', (element.getAttribute('style') || '') + styles);
                    appliedCount++;
                });
            }
            catch (e) {
                console.error('Defuddle', 'Error applying styles for selector:', selector, e);
            }
        });
    }
    removeHiddenElements(doc) {
        let count = 0;
        const elementsToRemove = new Set();
        // First pass: Get all elements matching hidden selectors
        const hiddenElements = doc.querySelectorAll(constants_1.HIDDEN_ELEMENT_SELECTORS);
        hiddenElements.forEach(el => elementsToRemove.add(el));
        count += hiddenElements.length;
        // Second pass: Use TreeWalker for efficient traversal
        const treeWalker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                // Skip elements already marked for removal
                if (elementsToRemove.has(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        // Batch style computations
        const elements = [];
        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            elements.push(currentNode);
        }
        // Process styles in batches to minimize layout thrashing
        const BATCH_SIZE = 100;
        for (let i = 0; i < elements.length; i += BATCH_SIZE) {
            const batch = elements.slice(i, i + BATCH_SIZE);
            // Read phase - gather all computedStyles
            const styles = batch.map(el => window.getComputedStyle(el));
            // Write phase - mark elements for removal
            batch.forEach((element, index) => {
                const computedStyle = styles[index];
                if (computedStyle.display === 'none' ||
                    computedStyle.visibility === 'hidden' ||
                    computedStyle.opacity === '0') {
                    elementsToRemove.add(element);
                    count++;
                }
            });
        }
        // Final pass: Batch remove all hidden elements
        elementsToRemove.forEach(el => el.remove());
        this._log('Removed hidden elements:', count);
    }
    removeClutter(doc) {
        const startTime = performance.now();
        let exactSelectorCount = 0;
        let partialSelectorCount = 0;
        // Track all elements to be removed
        const elementsToRemove = new Set();
        // First collect elements matching exact selectors
        const exactElements = doc.querySelectorAll(constants_1.EXACT_SELECTORS.join(','));
        exactElements.forEach(el => {
            if (el === null || el === void 0 ? void 0 : el.parentNode) {
                elementsToRemove.add(el);
                exactSelectorCount++;
            }
        });
        // Pre-compile regexes and combine into a single regex for better performance
        const combinedPattern = constants_1.PARTIAL_SELECTORS.join('|');
        const partialRegex = new RegExp(combinedPattern, 'i');
        // Create an efficient attribute selector for elements we care about
        const attributeSelector = '[class],[id],[data-testid],[data-qa],[data-cy]';
        const allElements = doc.querySelectorAll(attributeSelector);
        // Process elements for partial matches
        allElements.forEach(el => {
            // Skip if already marked for removal
            if (elementsToRemove.has(el)) {
                return;
            }
            // Get all relevant attributes and combine into a single string
            const attrs = [
                el.className && typeof el.className === 'string' ? el.className : '',
                el.id || '',
                el.getAttribute('data-testid') || '',
                el.getAttribute('data-qa') || '',
                el.getAttribute('data-cy') || ''
            ].join(' ').toLowerCase();
            // Skip if no attributes to check
            if (!attrs.trim()) {
                return;
            }
            // Check for partial match using single regex test
            if (partialRegex.test(attrs)) {
                elementsToRemove.add(el);
                partialSelectorCount++;
            }
        });
        // Remove all collected elements in a single pass
        elementsToRemove.forEach(el => el.remove());
        const endTime = performance.now();
        this._log('Removed clutter elements:', {
            exactSelectors: exactSelectorCount,
            partialSelectors: partialSelectorCount,
            total: elementsToRemove.size,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    }
    flattenDivs(element) {
        let processedCount = 0;
        const startTime = performance.now();
        // Process in batches to maintain performance
        let keepProcessing = true;
        const shouldPreserveElement = (el) => {
            const tagName = el.tagName.toLowerCase();
            // Check if element should be preserved
            if (constants_1.PRESERVE_ELEMENTS.has(tagName))
                return true;
            // Check for semantic roles
            const role = el.getAttribute('role');
            if (role && ['article', 'main', 'navigation', 'banner', 'contentinfo'].includes(role)) {
                return true;
            }
            // Check for semantic classes
            const className = el.className.toLowerCase();
            if (className.match(/(?:article|main|content|footnote|reference|bibliography)/)) {
                return true;
            }
            // Check if div contains mixed content types that should be preserved
            if (tagName === 'div') {
                const children = Array.from(el.children);
                const hasPreservedElements = children.some(child => constants_1.PRESERVE_ELEMENTS.has(child.tagName.toLowerCase()) ||
                    child.getAttribute('role') === 'article' ||
                    child.className.toLowerCase().includes('article'));
                if (hasPreservedElements)
                    return true;
            }
            return false;
        };
        const isWrapperDiv = (div) => {
            var _a;
            // Check if it's just empty space
            if (!((_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim()))
                return true;
            // Check if it only contains other divs or block elements
            const children = Array.from(div.children);
            if (children.length === 0)
                return true;
            // Check if all children are block elements
            const allBlockElements = children.every(child => {
                const tag = child.tagName.toLowerCase();
                return tag === 'div' || tag === 'p' || tag === 'h1' || tag === 'h2' ||
                    tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' ||
                    tag === 'ul' || tag === 'ol' || tag === 'pre' || tag === 'blockquote' ||
                    tag === 'figure';
            });
            if (allBlockElements)
                return true;
            // Check for common wrapper patterns
            const className = div.className.toLowerCase();
            const isWrapper = /(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(className);
            if (isWrapper)
                return true;
            // Check if it has excessive whitespace or empty text nodes
            const textNodes = Array.from(div.childNodes).filter(node => { var _a; return node.nodeType === Node.TEXT_NODE && ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()); });
            if (textNodes.length === 0)
                return true;
            // Check if it's a div that only contains block elements
            const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
                const tag = child.tagName.toLowerCase();
                return constants_1.INLINE_ELEMENTS.has(tag);
            });
            if (hasOnlyBlockElements)
                return true;
            return false;
        };
        // Function to process a single div
        const processDiv = (div) => {
            var _a, _b;
            // Skip processing if div has been removed or should be preserved
            if (!div.isConnected || shouldPreserveElement(div))
                return false;
            // Case 1: Empty div or div with only whitespace
            if (!div.hasChildNodes() || !((_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim())) {
                div.remove();
                processedCount++;
                return true;
            }
            // Case 2: Top-level div - be more aggressive
            if (div.parentElement === element) {
                const children = Array.from(div.children);
                const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
                    const tag = child.tagName.toLowerCase();
                    return constants_1.INLINE_ELEMENTS.has(tag);
                });
                if (hasOnlyBlockElements) {
                    const fragment = document.createDocumentFragment();
                    while (div.firstChild) {
                        fragment.appendChild(div.firstChild);
                    }
                    div.replaceWith(fragment);
                    processedCount++;
                    return true;
                }
            }
            // Case 3: Wrapper div - merge up aggressively
            if (isWrapperDiv(div)) {
                // Special case: if div only contains block elements, merge them up
                const children = Array.from(div.children);
                const onlyBlockElements = !children.some(child => {
                    const tag = child.tagName.toLowerCase();
                    return constants_1.INLINE_ELEMENTS.has(tag);
                });
                if (onlyBlockElements) {
                    const fragment = document.createDocumentFragment();
                    while (div.firstChild) {
                        fragment.appendChild(div.firstChild);
                    }
                    div.replaceWith(fragment);
                    processedCount++;
                    return true;
                }
                // Otherwise handle as normal wrapper
                const fragment = document.createDocumentFragment();
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                div.replaceWith(fragment);
                processedCount++;
                return true;
            }
            // Case 4: Div only contains text content - convert to paragraph
            if (!div.children.length && ((_b = div.textContent) === null || _b === void 0 ? void 0 : _b.trim())) {
                const p = document.createElement('p');
                p.textContent = div.textContent;
                div.replaceWith(p);
                processedCount++;
                return true;
            }
            // Case 5: Div has single child
            if (div.children.length === 1) {
                const child = div.firstElementChild;
                const childTag = child.tagName.toLowerCase();
                // Don't unwrap if child is inline or should be preserved
                if (!constants_1.INLINE_ELEMENTS.has(childTag) && !shouldPreserveElement(child)) {
                    div.replaceWith(child);
                    processedCount++;
                    return true;
                }
            }
            // Case 6: Deeply nested div - merge up
            let nestingDepth = 0;
            let parent = div.parentElement;
            while (parent) {
                if (parent.tagName.toLowerCase() === 'div') {
                    nestingDepth++;
                }
                parent = parent.parentElement;
            }
            if (nestingDepth > 0) { // Changed from > 1 to > 0 to be more aggressive
                const fragment = document.createDocumentFragment();
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                div.replaceWith(fragment);
                processedCount++;
                return true;
            }
            return false;
        };
        // First pass: Process top-level divs
        const processTopLevelDivs = () => {
            const topDivs = Array.from(element.children).filter(el => el.tagName.toLowerCase() === 'div');
            let modified = false;
            topDivs.forEach(div => {
                if (processDiv(div)) {
                    modified = true;
                }
            });
            return modified;
        };
        // Second pass: Process remaining divs from deepest to shallowest
        const processRemainingDivs = () => {
            const allDivs = Array.from(element.getElementsByTagName('div'))
                .sort((a, b) => {
                // Count nesting depth
                const getDepth = (el) => {
                    let depth = 0;
                    let parent = el.parentElement;
                    while (parent) {
                        if (parent.tagName.toLowerCase() === 'div')
                            depth++;
                        parent = parent.parentElement;
                    }
                    return depth;
                };
                return getDepth(b) - getDepth(a); // Process deepest first
            });
            let modified = false;
            allDivs.forEach(div => {
                if (processDiv(div)) {
                    modified = true;
                }
            });
            return modified;
        };
        // Final cleanup pass - aggressively flatten remaining divs
        const finalCleanup = () => {
            const remainingDivs = Array.from(element.getElementsByTagName('div'));
            let modified = false;
            remainingDivs.forEach(div => {
                // Check if div only contains paragraphs
                const children = Array.from(div.children);
                const onlyParagraphs = children.every(child => child.tagName.toLowerCase() === 'p');
                if (onlyParagraphs || (!shouldPreserveElement(div) && isWrapperDiv(div))) {
                    const fragment = document.createDocumentFragment();
                    while (div.firstChild) {
                        fragment.appendChild(div.firstChild);
                    }
                    div.replaceWith(fragment);
                    processedCount++;
                    modified = true;
                }
            });
            return modified;
        };
        // Execute all passes until no more changes
        do {
            keepProcessing = false;
            if (processTopLevelDivs())
                keepProcessing = true;
            if (processRemainingDivs())
                keepProcessing = true;
            if (finalCleanup())
                keepProcessing = true;
        } while (keepProcessing);
        const endTime = performance.now();
        this._log('Flattened divs:', {
            count: processedCount,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    }
    cleanContent(element, metadata) {
        // Remove HTML comments
        this.removeHtmlComments(element);
        // Handle H1 elements - remove first one and convert others to H2
        this.handleHeadings(element, metadata.title);
        // Standardize footnotes and citations
        this.standardizeFootnotes(element);
        // Handle lazy-loaded images
        this.handleLazyImages(element);
        // Convert embedded content to standard formats
        this.standardizeElements(element);
        // Skip div flattening in debug mode
        if (!this.debug) {
            // First pass of div flattening
            this.flattenDivs(element);
            // Strip unwanted attributes
            this.stripUnwantedAttributes(element);
            // Remove empty elements
            this.removeEmptyElements(element);
            // Remove trailing headings
            this.removeTrailingHeadings(element);
            // Final pass of div flattening after cleanup operations
            this.flattenDivs(element);
        }
        else {
            // In debug mode, still do basic cleanup but preserve structure
            this.stripUnwantedAttributes(element);
            this.removeEmptyElements(element);
            this.removeTrailingHeadings(element);
            this._log('Debug mode: Skipping div flattening to preserve structure');
        }
    }
    removeTrailingHeadings(element) {
        let removedCount = 0;
        const hasContentAfter = (el) => {
            // Check if there's any meaningful content after this element
            let nextContent = '';
            let sibling = el.nextSibling;
            // First check direct siblings
            while (sibling) {
                if (sibling.nodeType === Node.TEXT_NODE) {
                    nextContent += sibling.textContent || '';
                }
                else if (sibling.nodeType === Node.ELEMENT_NODE) {
                    // If we find an element sibling, check its content
                    nextContent += sibling.textContent || '';
                }
                sibling = sibling.nextSibling;
            }
            // If we found meaningful content at this level, return true
            if (nextContent.trim()) {
                return true;
            }
            // If no content found at this level and we have a parent,
            // check for content after the parent
            const parent = el.parentElement;
            if (parent && parent !== element) {
                return hasContentAfter(parent);
            }
            return false;
        };
        // Process all headings from bottom to top
        const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .reverse();
        headings.forEach(heading => {
            if (!hasContentAfter(heading)) {
                heading.remove();
                removedCount++;
            }
            else {
                // Stop processing once we find a heading with content after it
                return;
            }
        });
        if (removedCount > 0) {
            this._log('Removed trailing headings:', removedCount);
        }
    }
    handleHeadings(element, title) {
        var _a;
        const h1s = element.getElementsByTagName('h1');
        Array.from(h1s).forEach(h1 => {
            var _a;
            const h2 = document.createElement('h2');
            h2.innerHTML = h1.innerHTML;
            // Copy allowed attributes
            Array.from(h1.attributes).forEach(attr => {
                if (constants_1.ALLOWED_ATTRIBUTES.has(attr.name)) {
                    h2.setAttribute(attr.name, attr.value);
                }
            });
            (_a = h1.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(h2, h1);
        });
        // Remove first H2 if it matches title
        const h2s = element.getElementsByTagName('h2');
        if (h2s.length > 0) {
            const firstH2 = h2s[0];
            const firstH2Text = ((_a = firstH2.textContent) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || '';
            const normalizedTitle = title.toLowerCase().trim();
            if (normalizedTitle && normalizedTitle === firstH2Text) {
                firstH2.remove();
            }
        }
    }
    removeHtmlComments(element) {
        const comments = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_COMMENT, null);
        let node;
        while (node = walker.nextNode()) {
            comments.push(node);
        }
        comments.forEach(comment => {
            comment.remove();
        });
        this._log('Removed HTML comments:', comments.length);
    }
    stripUnwantedAttributes(element) {
        let attributeCount = 0;
        const processElement = (el) => {
            // Skip SVG elements - preserve all their attributes
            if (el instanceof SVGElement) {
                return;
            }
            const attributes = Array.from(el.attributes);
            attributes.forEach(attr => {
                const attrName = attr.name.toLowerCase();
                // In debug mode, allow debug attributes and data- attributes
                if (this.debug) {
                    if (!constants_1.ALLOWED_ATTRIBUTES.has(attrName) &&
                        !constants_1.ALLOWED_ATTRIBUTES_DEBUG.has(attrName) &&
                        !attrName.startsWith('data-')) {
                        el.removeAttribute(attr.name);
                        attributeCount++;
                    }
                }
                else {
                    // In normal mode, only allow standard attributes
                    if (!constants_1.ALLOWED_ATTRIBUTES.has(attrName)) {
                        el.removeAttribute(attr.name);
                        attributeCount++;
                    }
                }
            });
        };
        processElement(element);
        element.querySelectorAll('*').forEach(processElement);
        this._log('Stripped attributes:', attributeCount);
    }
    removeEmptyElements(element) {
        let removedCount = 0;
        let iterations = 0;
        let keepRemoving = true;
        while (keepRemoving) {
            iterations++;
            keepRemoving = false;
            // Get all elements without children, working from deepest first
            const emptyElements = Array.from(element.getElementsByTagName('*')).filter(el => {
                if (constants_1.ALLOWED_EMPTY_ELEMENTS.has(el.tagName.toLowerCase())) {
                    return false;
                }
                // Check if element has only whitespace or &nbsp;
                const textContent = el.textContent || '';
                const hasOnlyWhitespace = textContent.trim().length === 0;
                const hasNbsp = textContent.includes('\u00A0'); // Unicode non-breaking space
                // Check if element has no meaningful children
                const hasNoChildren = !el.hasChildNodes() ||
                    (Array.from(el.childNodes).every(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const nodeText = node.textContent || '';
                            return nodeText.trim().length === 0 && !nodeText.includes('\u00A0');
                        }
                        return false;
                    }));
                // Special case: Check for divs that only contain spans with commas
                if (el.tagName.toLowerCase() === 'div') {
                    const children = Array.from(el.children);
                    const hasOnlyCommaSpans = children.length > 0 && children.every(child => {
                        var _a;
                        if (child.tagName.toLowerCase() !== 'span')
                            return false;
                        const content = ((_a = child.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                        return content === ',' || content === '' || content === ' ';
                    });
                    if (hasOnlyCommaSpans)
                        return true;
                }
                return hasOnlyWhitespace && !hasNbsp && hasNoChildren;
            });
            if (emptyElements.length > 0) {
                emptyElements.forEach(el => {
                    el.remove();
                    removedCount++;
                });
                keepRemoving = true;
            }
        }
        this._log('Removed empty elements:', {
            count: removedCount,
            iterations
        });
    }
    createFootnoteItem(footnoteNumber, content, refs) {
        const newItem = document.createElement('li');
        newItem.className = 'footnote';
        newItem.id = `fn:${footnoteNumber}`;
        // Handle content
        if (typeof content === 'string') {
            const paragraph = document.createElement('p');
            paragraph.innerHTML = content;
            newItem.appendChild(paragraph);
        }
        else {
            // Get all paragraphs from the content
            const paragraphs = Array.from(content.querySelectorAll('p'));
            if (paragraphs.length === 0) {
                // If no paragraphs, wrap content in a paragraph
                const paragraph = document.createElement('p');
                paragraph.innerHTML = content.innerHTML;
                newItem.appendChild(paragraph);
            }
            else {
                // Copy existing paragraphs
                paragraphs.forEach(p => {
                    const newP = document.createElement('p');
                    newP.innerHTML = p.innerHTML;
                    newItem.appendChild(newP);
                });
            }
        }
        // Add backlink(s) to the last paragraph
        const lastParagraph = newItem.querySelector('p:last-of-type') || newItem;
        refs.forEach((refId, index) => {
            const backlink = document.createElement('a');
            backlink.href = `#${refId}`;
            backlink.title = 'return to article';
            backlink.className = 'footnote-backref';
            backlink.innerHTML = '↩';
            if (index < refs.length - 1) {
                backlink.innerHTML += ' ';
            }
            lastParagraph.appendChild(backlink);
        });
        return newItem;
    }
    collectFootnotes(element) {
        const footnotes = {};
        let footnoteCount = 1;
        const processedIds = new Set(); // Track processed IDs
        // Collect all footnotes and their IDs from footnote lists
        const footnoteLists = element.querySelectorAll(constants_1.FOOTNOTE_LIST_SELECTORS);
        footnoteLists.forEach(list => {
            // Substack has individual footnote divs with no parent
            if (list.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
                const anchor = list.querySelector('a.footnote-number');
                const content = list.querySelector('.footnote-content');
                if (anchor && content) {
                    const id = anchor.id.replace('footnote-', '').toLowerCase();
                    if (id && !processedIds.has(id)) {
                        footnotes[footnoteCount] = {
                            content: content,
                            originalId: id,
                            refs: []
                        };
                        processedIds.add(id);
                        footnoteCount++;
                    }
                }
                return;
            }
            // Common format using OL/UL and LI elements
            const items = list.querySelectorAll('li, div[role="listitem"]');
            items.forEach(li => {
                var _a, _b, _c, _d;
                let id = '';
                let content = null;
                // Handle citations with .citations class
                const citationsDiv = li.querySelector('.citations');
                if ((_a = citationsDiv === null || citationsDiv === void 0 ? void 0 : citationsDiv.id) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith('r')) {
                    id = citationsDiv.id.toLowerCase();
                    // Look for citation content within the citations div
                    const citationContent = citationsDiv.querySelector('.citation-content');
                    if (citationContent) {
                        content = citationContent;
                    }
                }
                else {
                    // Extract ID from various formats
                    if (li.id.toLowerCase().startsWith('bib.bib')) {
                        id = li.id.replace('bib.bib', '').toLowerCase();
                    }
                    else if (li.id.toLowerCase().startsWith('fn:')) {
                        id = li.id.replace('fn:', '').toLowerCase();
                    }
                    else if (li.id.toLowerCase().startsWith('fn')) {
                        id = li.id.replace('fn', '').toLowerCase();
                        // Nature.com
                    }
                    else if (li.hasAttribute('data-counter')) {
                        id = ((_c = (_b = li.getAttribute('data-counter')) === null || _b === void 0 ? void 0 : _b.replace(/\.$/, '')) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '';
                    }
                    else {
                        const match = (_d = li.id.split('/').pop()) === null || _d === void 0 ? void 0 : _d.match(/cite_note-(.+)/);
                        id = match ? match[1].toLowerCase() : li.id.toLowerCase();
                    }
                    content = li;
                }
                if (id && !processedIds.has(id)) {
                    footnotes[footnoteCount] = {
                        content: content || li,
                        originalId: id,
                        refs: []
                    };
                    processedIds.add(id);
                    footnoteCount++;
                }
            });
        });
        return footnotes;
    }
    findOuterFootnoteContainer(el) {
        let current = el;
        let parent = el.parentElement;
        // Keep going up until we find an element that's not a span or sup
        while (parent && (parent.tagName.toLowerCase() === 'span' ||
            parent.tagName.toLowerCase() === 'sup')) {
            current = parent;
            parent = parent.parentElement;
        }
        return current;
    }
    // Every footnote reference should be a sup element with an anchor inside
    // e.g. <sup id="fnref:1"><a href="#fn:1">1</a></sup>
    createFootnoteReference(footnoteNumber, refId) {
        const sup = document.createElement('sup');
        sup.id = refId;
        const link = document.createElement('a');
        link.href = `#fn:${footnoteNumber}`;
        link.textContent = footnoteNumber;
        sup.appendChild(link);
        return sup;
    }
    standardizeFootnotes(element) {
        const footnotes = this.collectFootnotes(element);
        // Standardize inline footnotes using the collected IDs
        const footnoteInlineReferences = element.querySelectorAll(constants_1.FOOTNOTE_INLINE_REFERENCES);
        // Group references by their parent sup element
        const supGroups = new Map();
        footnoteInlineReferences.forEach(el => {
            var _a, _b, _c, _d;
            if (!(el instanceof HTMLElement))
                return;
            let footnoteId = '';
            let footnoteContent = '';
            // Extract footnote ID based on element type
            // Nature.com
            if (el.matches('a[id^="ref-link"]')) {
                footnoteId = ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                // Science.org
            }
            else if (el.matches('a[role="doc-biblioref"]')) {
                const xmlRid = el.getAttribute('data-xml-rid');
                if (xmlRid) {
                    footnoteId = xmlRid;
                }
                else {
                    const href = el.getAttribute('href');
                    if (href === null || href === void 0 ? void 0 : href.startsWith('#core-R')) {
                        footnoteId = href.replace('#core-', '');
                    }
                }
                // Substack
            }
            else if (el.matches('a.footnote-anchor, span.footnote-hovercard-target a')) {
                const id = ((_b = el.id) === null || _b === void 0 ? void 0 : _b.replace('footnote-anchor-', '')) || '';
                if (id) {
                    footnoteId = id.toLowerCase();
                }
                // Arxiv
            }
            else if (el.matches('cite.ltx_cite')) {
                const link = el.querySelector('a');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href) {
                        const match = (_c = href.split('/').pop()) === null || _c === void 0 ? void 0 : _c.match(/bib\.bib(\d+)/);
                        if (match) {
                            footnoteId = match[1].toLowerCase();
                        }
                    }
                }
            }
            else if (el.matches('sup.reference')) {
                const links = el.querySelectorAll('a');
                Array.from(links).forEach(link => {
                    var _a;
                    const href = link.getAttribute('href');
                    if (href) {
                        const match = (_a = href.split('/').pop()) === null || _a === void 0 ? void 0 : _a.match(/(?:cite_note|cite_ref)-(.+)/);
                        if (match) {
                            footnoteId = match[1].toLowerCase();
                        }
                    }
                });
            }
            else if (el.matches('sup[id^="fnref:"]')) {
                footnoteId = el.id.replace('fnref:', '').toLowerCase();
            }
            else if (el.matches('sup[id^="fnr"]')) {
                footnoteId = el.id.replace('fnr', '').toLowerCase();
            }
            else if (el.matches('span.footnote-reference')) {
                footnoteId = el.getAttribute('data-footnote-id') || '';
            }
            else if (el.matches('span.footnote-link')) {
                footnoteId = el.getAttribute('data-footnote-id') || '';
                footnoteContent = el.getAttribute('data-footnote-content') || '';
            }
            else if (el.matches('a.citation')) {
                footnoteId = ((_d = el.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                footnoteContent = el.getAttribute('href') || '';
            }
            else if (el.matches('a[id^="fnref"]')) {
                footnoteId = el.id.replace('fnref', '').toLowerCase();
            }
            else {
                // Other citation types
                const href = el.getAttribute('href');
                if (href) {
                    const id = href.replace(/^[#]/, '');
                    footnoteId = id.toLowerCase();
                }
            }
            if (footnoteId) {
                // Find the footnote number by matching the original ID
                const footnoteEntry = Object.entries(footnotes).find(([_, data]) => data.originalId === footnoteId.toLowerCase());
                if (footnoteEntry) {
                    const [footnoteNumber, footnoteData] = footnoteEntry;
                    // Create footnote reference ID
                    const refId = footnoteData.refs.length > 0 ?
                        `fnref:${footnoteNumber}-${footnoteData.refs.length + 1}` :
                        `fnref:${footnoteNumber}`;
                    footnoteData.refs.push(refId);
                    // Find the outermost container (span or sup)
                    const container = this.findOuterFootnoteContainer(el);
                    // If container is a sup, group references
                    if (container.tagName.toLowerCase() === 'sup') {
                        if (!supGroups.has(container)) {
                            supGroups.set(container, []);
                        }
                        const group = supGroups.get(container);
                        group.push(this.createFootnoteReference(footnoteNumber, refId));
                    }
                    else {
                        // Replace the container directly
                        container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
                    }
                }
            }
        });
        // Handle grouped references
        supGroups.forEach((references, container) => {
            if (references.length > 0) {
                // Create a document fragment to hold all the references
                const fragment = document.createDocumentFragment();
                // Add each reference as its own sup element
                references.forEach((ref, index) => {
                    const link = ref.querySelector('a');
                    if (link) {
                        const sup = document.createElement('sup');
                        sup.id = ref.id;
                        sup.appendChild(link.cloneNode(true));
                        fragment.appendChild(sup);
                    }
                });
                container.replaceWith(fragment);
            }
        });
        // Create the standardized footnote list
        const newList = document.createElement('footnotes');
        newList.className = 'footnotes';
        const orderedList = document.createElement('ol');
        // Create footnote items in order
        Object.entries(footnotes).forEach(([number, data]) => {
            const newItem = this.createFootnoteItem(parseInt(number), data.content, data.refs);
            orderedList.appendChild(newItem);
        });
        // Remove original footnote lists
        const footnoteLists = element.querySelectorAll(constants_1.FOOTNOTE_LIST_SELECTORS);
        footnoteLists.forEach(list => list.remove());
        // If we have any footnotes, add the new list to the document
        if (orderedList.children.length > 0) {
            newList.appendChild(orderedList);
            element.appendChild(newList);
        }
    }
    handleLazyImages(element) {
        let processedCount = 0;
        const lazyImages = element.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => {
            if (!(img instanceof HTMLImageElement))
                return;
            // Handle data-src
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc && !img.src) {
                img.src = dataSrc;
                processedCount++;
            }
            // Handle data-srcset
            const dataSrcset = img.getAttribute('data-srcset');
            if (dataSrcset && !img.srcset) {
                img.srcset = dataSrcset;
                processedCount++;
            }
            // Remove lazy loading related classes and attributes
            img.classList.remove('lazy', 'lazyload');
            img.removeAttribute('data-ll-status');
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
        });
        this._log('Processed lazy images:', processedCount);
    }
    standardizeElements(element) {
        let processedCount = 0;
        // Convert elements based on standardization rules
        ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
            const elements = element.querySelectorAll(rule.selector);
            elements.forEach(el => {
                if (rule.transform) {
                    // If there's a transform function, use it to create the new element
                    const transformed = rule.transform(el);
                    el.replaceWith(transformed);
                    processedCount++;
                }
            });
        });
        // Convert lite-youtube elements
        const liteYoutubeElements = element.querySelectorAll('lite-youtube');
        liteYoutubeElements.forEach(el => {
            const videoId = el.getAttribute('videoid');
            if (!videoId)
                return;
            const iframe = document.createElement('iframe');
            iframe.width = '560';
            iframe.height = '315';
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.title = el.getAttribute('videotitle') || 'YouTube video player';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.setAttribute('allowfullscreen', '');
            el.replaceWith(iframe);
            processedCount++;
        });
        // Add future embed conversions (Twitter, Instagram, etc.)
        this._log('Converted embedded elements:', processedCount);
    }
    // Find small IMG and SVG elements
    findSmallImages(doc) {
        const MIN_DIMENSION = 33;
        const smallImages = new Set();
        const transformRegex = /scale\(([\d.]+)\)/;
        const startTime = performance.now();
        let processedCount = 0;
        // 1. Read phase - Gather all elements in a single pass
        const elements = [
            ...Array.from(doc.getElementsByTagName('img')),
            ...Array.from(doc.getElementsByTagName('svg'))
        ].filter(element => {
            // Skip lazy-loaded images that haven't been processed yet
            if (element instanceof HTMLImageElement) {
                const isLazy = element.classList.contains('lazy') ||
                    element.classList.contains('lazyload') ||
                    element.hasAttribute('data-src') ||
                    element.hasAttribute('data-srcset');
                return !isLazy;
            }
            return true;
        });
        if (elements.length === 0) {
            return smallImages;
        }
        // 2. Batch process - Collect all measurements in one go
        const measurements = elements.map(element => ({
            element,
            // Static attributes (no reflow)
            naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : 0,
            naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : 0,
            attrWidth: parseInt(element.getAttribute('width') || '0'),
            attrHeight: parseInt(element.getAttribute('height') || '0')
        }));
        // 3. Batch compute styles - Process in chunks to avoid long tasks
        const BATCH_SIZE = 50;
        for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
            const batch = measurements.slice(i, i + BATCH_SIZE);
            try {
                // Read phase - compute all styles at once
                const styles = batch.map(({ element }) => window.getComputedStyle(element));
                const rects = batch.map(({ element }) => element.getBoundingClientRect());
                // Process phase - no DOM operations
                batch.forEach((measurement, index) => {
                    var _a;
                    try {
                        const style = styles[index];
                        const rect = rects[index];
                        // Get transform scale in the same batch
                        const transform = style.transform;
                        const scale = transform ?
                            parseFloat(((_a = transform.match(transformRegex)) === null || _a === void 0 ? void 0 : _a[1]) || '1') : 1;
                        // Calculate effective dimensions
                        const widths = [
                            measurement.naturalWidth,
                            measurement.attrWidth,
                            parseInt(style.width) || 0,
                            rect.width * scale
                        ].filter(dim => typeof dim === 'number' && dim > 0);
                        const heights = [
                            measurement.naturalHeight,
                            measurement.attrHeight,
                            parseInt(style.height) || 0,
                            rect.height * scale
                        ].filter(dim => typeof dim === 'number' && dim > 0);
                        // Decision phase - no DOM operations
                        if (widths.length > 0 && heights.length > 0) {
                            const effectiveWidth = Math.min(...widths);
                            const effectiveHeight = Math.min(...heights);
                            if (effectiveWidth < MIN_DIMENSION || effectiveHeight < MIN_DIMENSION) {
                                const identifier = this.getElementIdentifier(measurement.element);
                                if (identifier) {
                                    smallImages.add(identifier);
                                    processedCount++;
                                }
                            }
                        }
                    }
                    catch (e) {
                        if (this.debug) {
                            console.warn('Defuddle: Failed to process element dimensions:', e);
                        }
                    }
                });
            }
            catch (e) {
                if (this.debug) {
                    console.warn('Defuddle: Failed to process batch:', e);
                }
            }
        }
        const endTime = performance.now();
        this._log('Found small elements:', {
            count: processedCount,
            totalElements: elements.length,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
        return smallImages;
    }
    removeSmallImages(doc, smallImages) {
        let removedCount = 0;
        ['img', 'svg'].forEach(tag => {
            const elements = doc.getElementsByTagName(tag);
            Array.from(elements).forEach(element => {
                const identifier = this.getElementIdentifier(element);
                if (identifier && smallImages.has(identifier)) {
                    element.remove();
                    removedCount++;
                }
            });
        });
        this._log('Removed small elements:', removedCount);
    }
    getElementIdentifier(element) {
        // Try to create a unique identifier using various attributes
        if (element instanceof HTMLImageElement) {
            // For lazy-loaded images, use data-src as identifier if available
            const dataSrc = element.getAttribute('data-src');
            if (dataSrc)
                return `src:${dataSrc}`;
            const src = element.src || '';
            const srcset = element.srcset || '';
            const dataSrcset = element.getAttribute('data-srcset');
            if (src)
                return `src:${src}`;
            if (srcset)
                return `srcset:${srcset}`;
            if (dataSrcset)
                return `srcset:${dataSrcset}`;
        }
        const id = element.id || '';
        const className = element.className || '';
        const viewBox = element instanceof SVGElement ? element.getAttribute('viewBox') || '' : '';
        if (id)
            return `id:${id}`;
        if (viewBox)
            return `viewBox:${viewBox}`;
        if (className)
            return `class:${className}`;
        return null;
    }
    findMainContent(doc) {
        // Find all potential content containers
        const candidates = [];
        constants_1.ENTRY_POINT_ELEMENTS.forEach((selector, index) => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(element => {
                // Base score from selector priority (earlier = higher)
                let score = (constants_1.ENTRY_POINT_ELEMENTS.length - index) * 10;
                // Add score based on content analysis
                score += this.scoreElement(element);
                candidates.push({ element, score });
            });
        });
        if (candidates.length === 0) {
            // Fall back to scoring block elements
            // Currently <body> element is used as the fallback, so this is not used
            return this.findContentByScoring(doc);
        }
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);
        if (this.debug) {
            this._log('Content candidates:', candidates.map(c => ({
                element: c.element.tagName,
                selector: this.getElementSelector(c.element),
                score: c.score
            })));
        }
        return candidates[0].element;
    }
    findContentByScoring(doc) {
        const candidates = this.scoreElements(doc);
        return candidates.length > 0 ? candidates[0].element : null;
    }
    getElementSelector(element) {
        const parts = [];
        let current = element;
        while (current && current !== this.doc.documentElement) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += '#' + current.id;
            }
            else if (current.className && typeof current.className === 'string') {
                selector += '.' + current.className.trim().split(/\s+/).join('.');
            }
            parts.unshift(selector);
            current = current.parentElement;
        }
        return parts.join(' > ');
    }
    scoreElements(doc) {
        const candidates = [];
        constants_1.BLOCK_ELEMENTS.forEach((tag) => {
            Array.from(doc.getElementsByTagName(tag)).forEach((element) => {
                const score = this.scoreElement(element);
                if (score > 0) {
                    candidates.push({ score, element });
                }
            });
        });
        return candidates.sort((a, b) => b.score - a.score);
    }
    scoreElement(element) {
        let score = 0;
        // Score based on element properties
        const className = element.className && typeof element.className === 'string' ?
            element.className.toLowerCase() : '';
        const id = element.id ? element.id.toLowerCase() : '';
        // Score based on content
        const text = element.textContent || '';
        const words = text.split(/\s+/).length;
        score += Math.min(Math.floor(words / 100), 3);
        // Score based on link density
        const links = element.getElementsByTagName('a');
        const linkText = Array.from(links).reduce((acc, link) => { var _a; return acc + (((_a = link.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        const linkDensity = text.length ? linkText / text.length : 0;
        if (linkDensity > 0.5) {
            score -= 10;
        }
        // Score based on presence of meaningful elements
        const paragraphs = element.getElementsByTagName('p').length;
        score += paragraphs;
        const images = element.getElementsByTagName('img').length;
        score += Math.min(images * 3, 9);
        return score;
    }
}
exports.Defuddle = Defuddle;


/***/ }),

/***/ 640:
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SUPPORTED_LANGUAGES = exports.ALLOWED_ATTRIBUTES_DEBUG = exports.ALLOWED_ATTRIBUTES = exports.ALLOWED_EMPTY_ELEMENTS = exports.FOOTNOTE_LIST_SELECTORS = exports.FOOTNOTE_INLINE_REFERENCES = exports.PARTIAL_SELECTORS = exports.EXACT_SELECTORS = exports.HIDDEN_ELEMENT_SELECTORS = exports.INLINE_ELEMENTS = exports.PRESERVE_ELEMENTS = exports.BLOCK_ELEMENTS = exports.MOBILE_WIDTH = exports.ENTRY_POINT_ELEMENTS = void 0;
// Entry point elements
// These are the elements that will be used to find the main content
exports.ENTRY_POINT_ELEMENTS = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-content',
    '#article-content',
    '.content-article',
    'main',
    '[role="main"]',
    'body' // ensures there is always a match
];
exports.MOBILE_WIDTH = 600;
exports.BLOCK_ELEMENTS = ['div', 'section', 'article', 'main'];
// Elements that should not be unwrapped
exports.PRESERVE_ELEMENTS = new Set([
    'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'figure', 'figcaption', 'picture',
    'details', 'summary',
    'blockquote',
    'form', 'fieldset'
]);
// Inline elements that should not be unwrapped
exports.INLINE_ELEMENTS = new Set([
    'a', 'span', 'strong', 'em', 'i', 'b', 'u', 'code', 'br', 'small',
    'sub', 'sup', 'mark', 'del', 'ins', 'q', 'abbr', 'cite', 'time'
]);
// Hidden elements that should be removed
exports.HIDDEN_ELEMENT_SELECTORS = [
    '[hidden]',
    '[aria-hidden="true"]',
    //	'[style*="display: none"]', causes problems for math formulas
    //	'[style*="display:none"]',
    '[style*="visibility: hidden"]',
    '[style*="visibility:hidden"]',
    '.hidden',
    '.invisible'
].join(',');
// Selectors to be removed
exports.EXACT_SELECTORS = [
    // scripts, styles
    'noscript',
    'script',
    'style',
    // ads
    '.ad:not([class*="gradient"])',
    '[class^="ad-" i]',
    '[class$="-ad" i]',
    '[id^="ad-" i]',
    '[id$="-ad" i]',
    '[role="banner" i]',
    '.promo',
    '.Promo',
    '#barrier-page', // ft.com
    // comments
    '[id="comments" i]',
    // header, nav
    'header',
    '.header',
    '#header',
    'nav',
    '.navigation',
    '#navigation',
    '[role="navigation" i]',
    '[role="dialog" i]',
    '[role*="complementary" i]',
    '[class*="pagination" i]',
    '.menu',
    '#menu',
    '#siteSub',
    // metadata
    '.author',
    '.Author',
    '.contributor',
    '.date',
    '.meta',
    '.tags',
    '.toc',
    '.Toc',
    '#toc',
    '#title',
    '#Title',
    '[href*="/category"]',
    '[href*="/categories"]',
    '[href*="/tag/"]',
    '[href*="/tags/"]',
    '[href*="/topics"]',
    '[href*="author"]',
    '[href="#site-content"]',
    '[src*="author"]',
    // footer
    'footer',
    // inputs, forms, elements
    'aside',
    'button',
    // '[role="button"]', Medium images
    'canvas',
    'dialog',
    'fieldset',
    'form',
    'input:not([type="checkbox"])',
    'label',
    'link',
    'option',
    'select',
    'textarea',
    'time',
    // iframes
    'instaread-player',
    'iframe:not([src*="youtube"]):not([src*="youtu.be"]):not([src*="vimeo"]):not([src*="twitter"])',
    // logos
    '[class="logo" i]',
    '#logo',
    '#Logo',
    // newsletter
    '#newsletter',
    '#Newsletter',
    // hidden for print
    '.noprint',
    '[data-link-name*="skip" i]',
    '[data-print-layout="hide" i]',
    '[data-block="donotprint" i]',
    // footnotes, citations
    '[class*="clickable-icon" i]',
    'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]',
    'a[href^="#"][class*="anchor" i]',
    'a[href^="#"][class*="ref" i]',
    // link lists
    '[data-container*="most-viewed" i]',
    // sidebar
    '.sidebar',
    '.Sidebar',
    '#sidebar',
    '#Sidebar',
    '#sitesub',
    // other
    '#primaryaudio', // NPR
    '#NYT_ABOVE_MAIN_CONTENT_REGION',
    '[data-testid="photoviewer-children-figure"] > span', // New York Times
    'table.infobox',
    '.pencraft:not(.pc-display-contents)', // Substack
    '[data-optimizely="related-articles-section" i]' // The Economist
];
// Removal patterns tested against attributes: class, id, data-testid, and data-qa
// Case insensitive, partial matches allowed
exports.PARTIAL_SELECTORS = [
    'access-wall',
    'activitypub',
    'actioncall',
    'appendix',
    'avatar',
    'advert',
    '-ad-',
    '_ad_',
    'allterms',
    'around-the-web',
    'article-bottom-section',
    'article__copy',
    'article_date',
    'article-end ',
    'article_header',
    'article__header',
    'article__info',
    'article-info',
    'article__meta',
    'article-subject',
    'article_subject',
    'article-snippet',
    'article-separator',
    'article--share',
    'article--topics',
    'articletags',
    'article-tags',
    'article_tags',
    'article-title',
    'article_title',
    'articletopics',
    'article-topics',
    'article-type',
    'article--lede', // The Verge
    'articlewell',
    'associated-people',
    'audio-card',
    //	'author', Gwern
    'authored-by',
    'author-box',
    'author-name',
    'author-bio',
    'author-mini-bio',
    'back-to-top',
    'backlinks-section',
    'banner',
    'bio-block',
    'blog-pager',
    'bookmark-',
    '-bookmark',
    'bottom-of-article',
    'brand-bar',
    'breadcrumb',
    'button-wrapper',
    'btn-',
    '-btn',
    'byline',
    'captcha',
    'card-text',
    'card-media',
    'cat_header',
    'catlinks',
    'chapter-list', // The Economist
    'collections',
    'comments',
    //	'-comment', Syntax highlighting
    'commentbox',
    'comment-count',
    'comment-content',
    'comment-form',
    'comment-number',
    'comment-respond',
    'comment-thread',
    'complementary',
    'consent',
    'content-card', // The Verge
    'content-topics',
    'contentpromo',
    'context-widget', // Reuters
    'core-collateral',
    '_cta',
    '-cta',
    'cta-',
    'cta_',
    'current-issue', // The Nation
    'custom-list-number',
    'dateline',
    'dateheader',
    'date-header',
    'date_header-',
    //	'dialog',
    'disclaimer',
    'disclosure',
    'discussion',
    'discuss_',
    'disqus',
    'donate',
    'dropdown', // Ars Technica
    'eletters',
    'emailsignup',
    'engagement-widget',
    'entry-author-info',
    'entry-categories',
    'entry-date',
    'entry-meta',
    'entry-title',
    'entry-utility',
    'eyebrow',
    'expand-reduce',
    'externallinkembedwrapper', // The New Yorker
    'extra-services',
    'extra-title',
    'facebook',
    'favorite',
    'feedback',
    'feed-links',
    'field-site-sections',
    'fixed',
    'floating-vid',
    'follow',
    'footer',
    'footnote-back',
    'footnoteback',
    'for-you',
    'frontmatter',
    'further-reading',
    'gist-meta',
    //	'global',
    'google',
    'goog-',
    'graph-view',
    'header-logo',
    'header-pattern', // The Verge
    'hero-list',
    'hide-for-print',
    'hide-print',
    'hide-when-no-script',
    'hidden-sidenote',
    'interlude',
    'interaction',
    'jumplink',
    'jump-to-',
    //	'keyword', // used in syntax highlighting
    'kicker',
    'labstab', // Arxiv
    '-labels',
    'language-name',
    'latest-content',
    '-ledes-', // The Verge
    '-license',
    'link-box',
    'links-grid', // BBC
    'links-title', // BBC
    'listing-dynamic-terms', // Boston Review
    'list-tags',
    'loading',
    'loa-info',
    'logo_container',
    'ltx_role_refnum', // Arxiv
    'ltx_tag_bibitem',
    'ltx_error',
    'marketing',
    'media-inquiry',
    'menu-',
    'meta-',
    'metadata',
    'might-like',
    '_modal',
    '-modal',
    'more-',
    'morenews',
    'morestories',
    'move-helper',
    'mw-editsection',
    'mw-cite-backlink',
    'mw-indicators',
    'mw-jump-link',
    'nav-',
    'nav_',
    'navbar',
    //	'navigation',
    'next-',
    'news-story-title',
    //	'newsletter', used on Substack
    'newsletter_',
    'newsletter-signup',
    'newslettersignup',
    'newsletterwidget',
    'newsletterwrapper',
    'not-found',
    'nomobile',
    'noprint',
    'originally-published', // Mercury News
    'outline-view',
    'overlay',
    'page-title',
    '-partners',
    'plea',
    'popular',
    //	'popup', Gwern
    'pop-up',
    'popover',
    'post-bottom',
    'post__category',
    'postcomment',
    'postdate',
    'post-author',
    'post-date',
    'post_date',
    'post-feeds',
    'postinfo',
    'post-info',
    'post_info',
    'post-inline-date',
    'post-links',
    'post-meta',
    'postmeta',
    'postsnippet',
    'post_snippet',
    'post-snippet',
    'posttitle',
    'post-title',
    'post_title',
    'posttax',
    'post-tax',
    'post_tax',
    'posttag',
    'post_tag',
    'post-tag',
    //	'preview', used on Obsidian Publish
    'prevnext',
    'previousnext',
    'press-inquiries',
    'print-none',
    'print-header',
    'profile',
    //	'promo',
    'promo-box',
    'pubdate',
    'pub_date',
    'pub-date',
    'publication-date',
    'publicationName', // Medium
    'qr-code',
    'qr_code',
    '_rail',
    'readmore',
    'read-next',
    'read_next',
    'read_time',
    'read-time',
    'reading_time',
    'reading-time',
    'reading-list',
    'recentpost',
    'recent_post',
    'recent-post',
    'recommend',
    'redirectedfrom',
    'recirc',
    'register',
    'related',
    'relevant',
    'reversefootnote',
    'screen-reader-text',
    //	'share',
    //	'-share', scitechdaily.com
    'share-box',
    'sharedaddy',
    'share-icons',
    'sharelinks',
    'share-section',
    'sidebartitle',
    'sidebar_',
    'sidebar-content',
    'similar-',
    'similar_',
    'similars-',
    'sideitems',
    'side-box',
    'site-index',
    'site-header',
    'site-logo',
    'site-name',
    //	'skip-',
    //	'skip-link', TechCrunch
    '_skip-link',
    'slug-wrap',
    'social',
    'speechify-ignore',
    'sponsor',
    'springercitation',
    //	'-stats',
    '_stats',
    'sticky',
    'storyreadtime', // Medium
    'storypublishdate', // Medium
    'subject-label',
    'subscribe',
    '_tags',
    'tags__item',
    'tag_list',
    'taxonomy',
    'table-of-contents',
    'tabs-',
    //	'teaser', Nature
    'terminaltout',
    'time-rubric',
    'timestamp',
    'tip_off',
    'tiptout',
    '-tout-',
    '-toc',
    'toggle-caption',
    'topic-list',
    'toolbar',
    'tooltip',
    'top-wrapper',
    'tree-item',
    'trending',
    'trust-feat',
    'trust-badge',
    'twitter',
    'visually-hidden',
    'welcomebox'
    //	'widget-'
];
// Selectors for footnotes and citations
exports.FOOTNOTE_INLINE_REFERENCES = [
    'sup.reference',
    'cite.ltx_cite',
    'sup[id^="fnr"]',
    'sup[id^="fnref:"]',
    'span.footnote-link',
    'a.citation',
    'a[id^="ref-link"]',
    'a[href^="#fn"]',
    'a[href^="#cite"]',
    'a[href^="#reference"]',
    'a[href^="#footnote"]',
    'a[href^="#r"]', // Common in academic papers
    'a[href^="#b"]', // Common for bibliography references
    'a[href*="cite_note"]',
    'a[href*="cite_ref"]',
    'a.footnote-anchor', // Substack
    'span.footnote-hovercard-target a', // Substack
    'a[role="doc-biblioref"]', // Science.org
    'a[id^="fnref"]',
    'a[id^="ref-link"]', // Nature.com
].join(',');
exports.FOOTNOTE_LIST_SELECTORS = [
    'div.footnote ol',
    'div.footnotes ol',
    'div[role="doc-endnotes"]',
    'div[role="doc-footnotes"]',
    'ol.footnotes-list',
    'ol.footnotes',
    'ol.references',
    'ol[class*="article-references"]',
    'section.footnotes ol',
    'section[role="doc-endnotes"]',
    'section[role="doc-footnotes"]',
    'section[role="doc-bibliography"]',
    'ul.footnotes-list',
    'ul.ltx_biblist',
    'div.footnote[data-component-name="FootnoteToDOM"]' // Substack
].join(',');
// Elements that are allowed to be empty
// These are not removed even if they have no content
exports.ALLOWED_EMPTY_ELEMENTS = new Set([
    'area',
    'audio',
    'base',
    'br',
    'circle',
    'col',
    'defs',
    'ellipse',
    'embed',
    'figure',
    'g',
    'hr',
    'iframe',
    'img',
    'input',
    'line',
    'link',
    'mask',
    'meta',
    'object',
    'param',
    'path',
    'pattern',
    'picture',
    'polygon',
    'polyline',
    'rect',
    'source',
    'stop',
    'svg',
    'td',
    'th',
    'track',
    'use',
    'video',
    'wbr'
]);
// Attributes to keep
exports.ALLOWED_ATTRIBUTES = new Set([
    'alt',
    'allow',
    'allowfullscreen',
    'aria-label',
    'checked',
    'colspan',
    'controls',
    'data-src',
    'data-srcset',
    'data-lang',
    'data-latex',
    'dir',
    'display',
    'frameborder',
    'headers',
    'height',
    'href',
    'lang',
    'role',
    'rowspan',
    'src',
    'srcset',
    'title',
    'type',
    'width'
]);
exports.ALLOWED_ATTRIBUTES_DEBUG = new Set([
    'class',
    'id',
]);
// Supported languages for code blocks
exports.SUPPORTED_LANGUAGES = new Set([
    // Markup & Web
    'markup', 'html', 'xml', 'svg', 'mathml', 'ssml', 'atom', 'rss',
    'javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx',
    'webassembly', 'wasm',
    // Common Programming Languages
    'python',
    'java',
    'csharp', 'cs', 'dotnet', 'aspnet',
    'cpp', 'c++', 'c', 'objc',
    'ruby', 'rb',
    'php',
    'golang',
    'rust',
    'swift',
    'kotlin',
    'scala',
    'dart',
    // Shell & Scripting
    'bash', 'shell', 'sh',
    'powershell',
    'batch',
    // Data & Config
    'json', 'jsonp',
    'yaml', 'yml',
    'toml',
    'dockerfile',
    'gitignore',
    // Query Languages
    'sql', 'mysql', 'postgresql',
    'graphql',
    'mongodb',
    'sparql',
    // Markup & Documentation
    'markdown', 'md',
    'latex', 'tex',
    'asciidoc', 'adoc',
    'jsdoc',
    // Functional Languages
    'haskell', 'hs',
    'elm',
    'elixir',
    'erlang',
    'ocaml',
    'fsharp',
    'scheme',
    'lisp', 'elisp',
    'clojure',
    // Other Languages
    'matlab',
    'fortran',
    'cobol',
    'pascal',
    'perl',
    'lua',
    'julia',
    'groovy',
    'crystal',
    'nim',
    'zig',
    // Domain Specific
    'regex',
    'gradle',
    'cmake',
    'makefile',
    'nix',
    'terraform',
    'solidity',
    'glsl',
    'hlsl',
    // Assembly
    'nasm',
    'masm',
    'armasm',
    // Game Development
    'gdscript',
    'unrealscript',
    // Others
    'abap',
    'actionscript',
    'ada',
    'agda',
    'antlr4',
    'applescript',
    'arduino',
    'coffeescript',
    'django',
    'erlang',
    'fortran',
    'haxe',
    'idris',
    'kotlin',
    'livescript',
    'matlab',
    'nginx',
    'pascal',
    'prolog',
    'puppet',
    'scala',
    'scheme',
    'tcl',
    'verilog',
    'vhdl'
]);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Defuddle = void 0;
var defuddle_1 = __webpack_require__(/*! ./defuddle */ 628);
Object.defineProperty(exports, "Defuddle", ({ enumerable: true, get: function () { return defuddle_1.Defuddle; } }));

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q1osUUFBUTtJQUNSLE9BQU87SUFDUCxRQUFRO0lBQ1IsUUFBUTtJQUNSLFFBQVE7SUFDUixPQUFPO0lBQ1AsUUFBUTtJQUNSLEtBQUs7SUFDTCxTQUFTO0lBQ1QsTUFBTTtDQUNOLENBQUMsQ0FBQzs7Ozs7OztVQ3J0Qkg7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7Ozs7Ozs7OztBQ3RCQSw0REFBc0M7QUFBN0IsNkdBQVEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9EZWZ1ZGRsZS93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvbWV0YWRhdGEudHMiLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvZGVmdWRkbGUudHMiLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvY29uc3RhbnRzLnRzIiwid2VicGFjazovL0RlZnVkZGxlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0RlZnVkZGxlLy4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkRlZnVkZGxlXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkRlZnVkZGxlXCJdID0gZmFjdG9yeSgpO1xufSkodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdGhpcywgKCkgPT4ge1xucmV0dXJuICIsImltcG9ydCB7IERlZnVkZGxlTWV0YWRhdGEgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhRXh0cmFjdG9yIHtcblx0c3RhdGljIGV4dHJhY3QoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogRGVmdWRkbGVNZXRhZGF0YSB7XG5cdFx0bGV0IGRvbWFpbiA9ICcnO1xuXHRcdGxldCB1cmwgPSAnJztcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBUcnkgdG8gZ2V0IFVSTCBmcm9tIGRvY3VtZW50IGxvY2F0aW9uXG5cdFx0XHR1cmwgPSBkb2MubG9jYXRpb24/LmhyZWYgfHwgJyc7XG5cdFx0XHRcblx0XHRcdC8vIElmIG5vIFVSTCBmcm9tIGxvY2F0aW9uLCB0cnkgb3RoZXIgc291cmNlc1xuXHRcdFx0aWYgKCF1cmwpIHtcblx0XHRcdFx0dXJsID0gdGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzp1cmxcIikgfHxcblx0XHRcdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcInR3aXR0ZXI6dXJsXCIpIHx8XG5cdFx0XHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICd1cmwnKSB8fFxuXHRcdFx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnbWFpbkVudGl0eU9mUGFnZS51cmwnKSB8fFxuXHRcdFx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnbWFpbkVudGl0eS51cmwnKSB8fFxuXHRcdFx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnV2ViU2l0ZS51cmwnKSB8fFxuXHRcdFx0XHRcdGRvYy5xdWVyeVNlbGVjdG9yKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpPy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVybCkge1xuXHRcdFx0XHRkb21haW4gPSBuZXcgVVJMKHVybCkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sICcnKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvLyBJZiBVUkwgcGFyc2luZyBmYWlscywgdHJ5IHRvIGdldCBmcm9tIGJhc2UgdGFnXG5cdFx0XHRjb25zdCBiYXNlVGFnID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJ2Jhc2VbaHJlZl0nKTtcblx0XHRcdGlmIChiYXNlVGFnKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dXJsID0gYmFzZVRhZy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcblx0XHRcdFx0XHRkb21haW4gPSBuZXcgVVJMKHVybCkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sICcnKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybignRmFpbGVkIHRvIHBhcnNlIGJhc2UgVVJMOicsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHRpdGxlOiB0aGlzLmdldFRpdGxlKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRkZXNjcmlwdGlvbjogdGhpcy5nZXREZXNjcmlwdGlvbihkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0ZG9tYWluLFxuXHRcdFx0ZmF2aWNvbjogdGhpcy5nZXRGYXZpY29uKGRvYywgdXJsKSxcblx0XHRcdGltYWdlOiB0aGlzLmdldEltYWdlKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRwdWJsaXNoZWQ6IHRoaXMuZ2V0UHVibGlzaGVkKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRhdXRob3I6IHRoaXMuZ2V0QXV0aG9yKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRzaXRlOiB0aGlzLmdldFNpdGUoZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdHNjaGVtYU9yZ0RhdGEsXG5cdFx0XHR3b3JkQ291bnQ6IDAsXG5cdFx0XHRwYXJzZVRpbWU6IDBcblx0XHR9O1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0QXV0aG9yKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJzYWlsdGhydS5hdXRob3JcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnYXV0aG9yLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJhdXRob3JcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJieWxcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJhdXRob3JcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJhdXRob3JMaXN0XCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiY29weXJpZ2h0XCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2NvcHlyaWdodEhvbGRlci5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6c2l0ZV9uYW1lXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ3B1Ymxpc2hlci5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnc291cmNlT3JnYW5pemF0aW9uLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdpc1BhcnRPZi5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJ0d2l0dGVyOmNyZWF0b3JcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJhcHBsaWNhdGlvbi1uYW1lXCIpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRTaXRlKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAncHVibGlzaGVyLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzpzaXRlX25hbWVcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnV2ViU2l0ZS5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnc291cmNlT3JnYW5pemF0aW9uLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImNvcHlyaWdodFwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdjb3B5cmlnaHRIb2xkZXIubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2lzUGFydE9mLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImFwcGxpY2F0aW9uLW5hbWVcIikgfHxcblx0XHRcdHRoaXMuZ2V0QXV0aG9yKGRvYywgc2NoZW1hT3JnRGF0YSkgfHxcblx0XHRcdCcnXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldFRpdGxlKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0Y29uc3QgcmF3VGl0bGUgPSAoXG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOnRpdGxlXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwidHdpdHRlcjp0aXRsZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdoZWFkbGluZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwidGl0bGVcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJzYWlsdGhydS50aXRsZVwiKSB8fFxuXHRcdFx0ZG9jLnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJyk/LnRleHRDb250ZW50Py50cmltKCkgfHxcblx0XHRcdCcnXG5cdFx0KTtcblxuXHRcdHJldHVybiB0aGlzLmNsZWFuVGl0bGUocmF3VGl0bGUsIHRoaXMuZ2V0U2l0ZShkb2MsIHNjaGVtYU9yZ0RhdGEpKTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGNsZWFuVGl0bGUodGl0bGU6IHN0cmluZywgc2l0ZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0aWYgKCF0aXRsZSB8fCAhc2l0ZU5hbWUpIHJldHVybiB0aXRsZTtcblxuXHRcdC8vIFJlbW92ZSBzaXRlIG5hbWUgaWYgaXQgZXhpc3RzXG5cdFx0Y29uc3Qgc2l0ZU5hbWVFc2NhcGVkID0gc2l0ZU5hbWUucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcblx0XHRjb25zdCBwYXR0ZXJucyA9IFtcblx0XHRcdGBcXFxccypbXFxcXHxcXFxcLeKAk+KAlF1cXFxccyoke3NpdGVOYW1lRXNjYXBlZH1cXFxccyokYCwgLy8gVGl0bGUgfCBTaXRlIE5hbWVcblx0XHRcdGBeXFxcXHMqJHtzaXRlTmFtZUVzY2FwZWR9XFxcXHMqW1xcXFx8XFxcXC3igJPigJRdXFxcXHMqYCwgLy8gU2l0ZSBOYW1lIHwgVGl0bGVcblx0XHRdO1xuXHRcdFxuXHRcdGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuXHRcdFx0Y29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4sICdpJyk7XG5cdFx0XHRpZiAocmVnZXgudGVzdCh0aXRsZSkpIHtcblx0XHRcdFx0dGl0bGUgPSB0aXRsZS5yZXBsYWNlKHJlZ2V4LCAnJyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aXRsZS50cmltKCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXREZXNjcmlwdGlvbihkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiZGVzY3JpcHRpb25cIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwiZGVzY3JpcHRpb25cIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6ZGVzY3JpcHRpb25cIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnZGVzY3JpcHRpb24nKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInR3aXR0ZXI6ZGVzY3JpcHRpb25cIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJzYWlsdGhydS5kZXNjcmlwdGlvblwiKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0SW1hZ2UoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzppbWFnZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInR3aXR0ZXI6aW1hZ2VcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnaW1hZ2UudXJsJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJzYWlsdGhydS5pbWFnZS5mdWxsXCIpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRGYXZpY29uKGRvYzogRG9jdW1lbnQsIGJhc2VVcmw6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Y29uc3QgaWNvbkZyb21NZXRhID0gdGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzppbWFnZTpmYXZpY29uXCIpO1xuXHRcdGlmIChpY29uRnJvbU1ldGEpIHJldHVybiBpY29uRnJvbU1ldGE7XG5cblx0XHRjb25zdCBpY29uTGluayA9IGRvYy5xdWVyeVNlbGVjdG9yKFwibGlua1tyZWw9J2ljb24nXVwiKT8uZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcblx0XHRpZiAoaWNvbkxpbmspIHJldHVybiBpY29uTGluaztcblxuXHRcdGNvbnN0IHNob3J0Y3V0TGluayA9IGRvYy5xdWVyeVNlbGVjdG9yKFwibGlua1tyZWw9J3Nob3J0Y3V0IGljb24nXVwiKT8uZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcblx0XHRpZiAoc2hvcnRjdXRMaW5rKSByZXR1cm4gc2hvcnRjdXRMaW5rO1xuXG5cdFx0Ly8gT25seSB0cnkgdG8gY29uc3RydWN0IGZhdmljb24gVVJMIGlmIHdlIGhhdmUgYSB2YWxpZCBiYXNlIFVSTFxuXHRcdGlmIChiYXNlVXJsKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IFVSTChcIi9mYXZpY29uLmljb1wiLCBiYXNlVXJsKS5ocmVmO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBjb25zdHJ1Y3QgZmF2aWNvbiBVUkw6JywgZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0UHVibGlzaGVkKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnZGF0ZVB1Ymxpc2hlZCcpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwicHVibGlzaERhdGVcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwiYXJ0aWNsZTpwdWJsaXNoZWRfdGltZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRUaW1lRWxlbWVudChkb2MpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwic2FpbHRocnUuZGF0ZVwiKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0TWV0YUNvbnRlbnQoZG9jOiBEb2N1bWVudCwgYXR0cjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRjb25zdCBzZWxlY3RvciA9IGBtZXRhWyR7YXR0cn1dYDtcblx0XHRjb25zdCBlbGVtZW50ID0gQXJyYXkuZnJvbShkb2MucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpXG5cdFx0XHQuZmluZChlbCA9PiBlbC5nZXRBdHRyaWJ1dGUoYXR0cik/LnRvTG93ZXJDYXNlKCkgPT09IHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xuXHRcdGNvbnN0IGNvbnRlbnQgPSBlbGVtZW50ID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb250ZW50XCIpPy50cmltKCkgPz8gXCJcIiA6IFwiXCI7XG5cdFx0cmV0dXJuIHRoaXMuZGVjb2RlSFRNTEVudGl0aWVzKGNvbnRlbnQsIGRvYyk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRUaW1lRWxlbWVudChkb2M6IERvY3VtZW50KTogc3RyaW5nIHtcblx0XHRjb25zdCBzZWxlY3RvciA9IGB0aW1lYDtcblx0XHRjb25zdCBlbGVtZW50ID0gQXJyYXkuZnJvbShkb2MucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpWzBdO1xuXHRcdGNvbnN0IGNvbnRlbnQgPSBlbGVtZW50ID8gKGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0ZXRpbWVcIik/LnRyaW0oKSA/PyBlbGVtZW50LnRleHRDb250ZW50Py50cmltKCkgPz8gXCJcIikgOiBcIlwiO1xuXHRcdHJldHVybiB0aGlzLmRlY29kZUhUTUxFbnRpdGllcyhjb250ZW50LCBkb2MpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZGVjb2RlSFRNTEVudGl0aWVzKHRleHQ6IHN0cmluZywgZG9jOiBEb2N1bWVudCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgdGV4dGFyZWEgPSBkb2MuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcblx0XHR0ZXh0YXJlYS5pbm5lckhUTUwgPSB0ZXh0O1xuXHRcdHJldHVybiB0ZXh0YXJlYS52YWx1ZTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldFNjaGVtYVByb3BlcnR5KGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSwgcHJvcGVydHk6IHN0cmluZywgZGVmYXVsdFZhbHVlOiBzdHJpbmcgPSAnJyk6IHN0cmluZyB7XG5cdFx0aWYgKCFzY2hlbWFPcmdEYXRhKSByZXR1cm4gZGVmYXVsdFZhbHVlO1xuXG5cdFx0Y29uc3Qgc2VhcmNoU2NoZW1hID0gKGRhdGE6IGFueSwgcHJvcHM6IHN0cmluZ1tdLCBmdWxsUGF0aDogc3RyaW5nLCBpc0V4YWN0TWF0Y2g6IGJvb2xlYW4gPSB0cnVlKTogc3RyaW5nW10gPT4ge1xuXHRcdFx0aWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRyZXR1cm4gcHJvcHMubGVuZ3RoID09PSAwID8gW2RhdGFdIDogW107XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmICghZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0XHRjb25zdCBjdXJyZW50UHJvcCA9IHByb3BzWzBdO1xuXHRcdFx0XHRpZiAoL15cXFtcXGQrXFxdJC8udGVzdChjdXJyZW50UHJvcCkpIHtcblx0XHRcdFx0XHRjb25zdCBpbmRleCA9IHBhcnNlSW50KGN1cnJlbnRQcm9wLnNsaWNlKDEsIC0xKSk7XG5cdFx0XHRcdFx0aWYgKGRhdGFbaW5kZXhdKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc2VhcmNoU2NoZW1hKGRhdGFbaW5kZXhdLCBwcm9wcy5zbGljZSgxKSwgZnVsbFBhdGgsIGlzRXhhY3RNYXRjaCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKHByb3BzLmxlbmd0aCA9PT0gMCAmJiBkYXRhLmV2ZXJ5KGl0ZW0gPT4gdHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YS5tYXAoU3RyaW5nKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIGRhdGEuZmxhdE1hcChpdGVtID0+IHNlYXJjaFNjaGVtYShpdGVtLCBwcm9wcywgZnVsbFBhdGgsIGlzRXhhY3RNYXRjaCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBbY3VycmVudFByb3AsIC4uLnJlbWFpbmluZ1Byb3BzXSA9IHByb3BzO1xuXHRcdFx0XG5cdFx0XHRpZiAoIWN1cnJlbnRQcm9wKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHJldHVybiBbZGF0YV07XG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcgJiYgZGF0YS5uYW1lKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtkYXRhLm5hbWVdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEuaGFzT3duUHJvcGVydHkoY3VycmVudFByb3ApKSB7XG5cdFx0XHRcdHJldHVybiBzZWFyY2hTY2hlbWEoZGF0YVtjdXJyZW50UHJvcF0sIHJlbWFpbmluZ1Byb3BzLCBcblx0XHRcdFx0XHRmdWxsUGF0aCA/IGAke2Z1bGxQYXRofS4ke2N1cnJlbnRQcm9wfWAgOiBjdXJyZW50UHJvcCwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghaXNFeGFjdE1hdGNoKSB7XG5cdFx0XHRcdGNvbnN0IG5lc3RlZFJlc3VsdHM6IHN0cmluZ1tdID0gW107XG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGRhdGFba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBzZWFyY2hTY2hlbWEoZGF0YVtrZXldLCBwcm9wcywgXG5cdFx0XHRcdFx0XHRcdGZ1bGxQYXRoID8gYCR7ZnVsbFBhdGh9LiR7a2V5fWAgOiBrZXksIGZhbHNlKTtcblx0XHRcdFx0XHRcdG5lc3RlZFJlc3VsdHMucHVzaCguLi5yZXN1bHRzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG5lc3RlZFJlc3VsdHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdHJldHVybiBuZXN0ZWRSZXN1bHRzO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBbXTtcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGxldCByZXN1bHRzID0gc2VhcmNoU2NoZW1hKHNjaGVtYU9yZ0RhdGEsIHByb3BlcnR5LnNwbGl0KCcuJyksICcnLCB0cnVlKTtcblx0XHRcdGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRyZXN1bHRzID0gc2VhcmNoU2NoZW1hKHNjaGVtYU9yZ0RhdGEsIHByb3BlcnR5LnNwbGl0KCcuJyksICcnLCBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA+IDAgPyByZXN1bHRzLmZpbHRlcihCb29sZWFuKS5qb2luKCcsICcpIDogZGVmYXVsdFZhbHVlO1xuXHRcdFx0cmV0dXJuIHRoaXMuZGVjb2RlSFRNTEVudGl0aWVzKHJlc3VsdCwgZG9jKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgRXJyb3IgaW4gZ2V0U2NoZW1hUHJvcGVydHkgZm9yICR7cHJvcGVydHl9OmAsIGVycm9yKTtcblx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljIGV4dHJhY3RTY2hlbWFPcmdEYXRhKGRvYzogRG9jdW1lbnQpOiBhbnkge1xuXHRcdGNvbnN0IHNjaGVtYVNjcmlwdHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0W3R5cGU9XCJhcHBsaWNhdGlvbi9sZCtqc29uXCJdJyk7XG5cdFx0Y29uc3Qgc2NoZW1hRGF0YTogYW55W10gPSBbXTtcblxuXHRcdHNjaGVtYVNjcmlwdHMuZm9yRWFjaChzY3JpcHQgPT4ge1xuXHRcdFx0bGV0IGpzb25Db250ZW50ID0gc2NyaXB0LnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRqc29uQ29udGVudCA9IGpzb25Db250ZW50XG5cdFx0XHRcdFx0LnJlcGxhY2UoL1xcL1xcKltcXHNcXFNdKj9cXCpcXC98XlxccypcXC9cXC8uKiQvZ20sICcnKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC9eXFxzKjwhXFxbQ0RBVEFcXFsoW1xcc1xcU10qPylcXF1cXF0+XFxzKiQvLCAnJDEnKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC9eXFxzKihcXCpcXC98XFwvXFwqKVxccyp8XFxzKihcXCpcXC98XFwvXFwqKVxccyokL2csICcnKVxuXHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdGNvbnN0IGpzb25EYXRhID0gSlNPTi5wYXJzZShqc29uQ29udGVudCk7XG5cblx0XHRcdFx0aWYgKGpzb25EYXRhWydAZ3JhcGgnXSAmJiBBcnJheS5pc0FycmF5KGpzb25EYXRhWydAZ3JhcGgnXSkpIHtcblx0XHRcdFx0XHRzY2hlbWFEYXRhLnB1c2goLi4uanNvbkRhdGFbJ0BncmFwaCddKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzY2hlbWFEYXRhLnB1c2goanNvbkRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBwYXJzaW5nIHNjaGVtYS5vcmcgZGF0YTonLCBlcnJvcik7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1Byb2JsZW1hdGljIEpTT04gY29udGVudDonLCBqc29uQ29udGVudCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gc2NoZW1hRGF0YTtcblx0fVxufSIsImltcG9ydCB7IE1ldGFkYXRhRXh0cmFjdG9yIH0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQgeyBEZWZ1ZGRsZU9wdGlvbnMsIERlZnVkZGxlUmVzcG9uc2UsIERlZnVkZGxlTWV0YWRhdGEgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFxuXHRISURERU5fRUxFTUVOVF9TRUxFQ1RPUlMsXG5cdE1PQklMRV9XSURUSCxcblx0QkxPQ0tfRUxFTUVOVFMsXG5cdFBSRVNFUlZFX0VMRU1FTlRTLFxuXHRJTkxJTkVfRUxFTUVOVFMsXG5cdFNVUFBPUlRFRF9MQU5HVUFHRVMsXG5cdEFMTE9XRURfQVRUUklCVVRFUyxcblx0QUxMT1dFRF9BVFRSSUJVVEVTX0RFQlVHLFxuXHRFWEFDVF9TRUxFQ1RPUlMsXG5cdFBBUlRJQUxfU0VMRUNUT1JTLFxuXHRGT09UTk9URV9MSVNUX1NFTEVDVE9SUyxcblx0Rk9PVE5PVEVfSU5MSU5FX1JFRkVSRU5DRVMsXG5cdEVOVFJZX1BPSU5UX0VMRU1FTlRTLFxuXHRBTExPV0VEX0VNUFRZX0VMRU1FTlRTXG59IGZyb20gJy4vY29uc3RhbnRzJztcblxuLy8gRWxlbWVudCBzdGFuZGFyZGl6YXRpb24gcnVsZXNcbi8vIE1hcHMgc2VsZWN0b3JzIHRvIHRoZWlyIHRhcmdldCBIVE1MIGVsZW1lbnQgbmFtZVxuaW50ZXJmYWNlIFN0YW5kYXJkaXphdGlvblJ1bGUge1xuXHRzZWxlY3Rvcjogc3RyaW5nO1xuXHRlbGVtZW50OiBzdHJpbmc7XG5cdHRyYW5zZm9ybT86IChlbDogRWxlbWVudCkgPT4gRWxlbWVudDtcbn1cblxuY29uc3QgRUxFTUVOVF9TVEFOREFSRElaQVRJT05fUlVMRVM6IFN0YW5kYXJkaXphdGlvblJ1bGVbXSA9IFtcblx0Ly8gQ29kZSBibG9ja3Ncblx0e1xuXHRcdHNlbGVjdG9yOiAncHJlJyxcblx0XHRlbGVtZW50OiAncHJlJyxcblx0XHR0cmFuc2Zvcm06IChlbDogRWxlbWVudCk6IEVsZW1lbnQgPT4ge1xuXHRcdFx0aWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybiBlbDtcblxuXHRcdFx0Ly8gRnVuY3Rpb24gdG8gZ2V0IGxhbmd1YWdlIGZyb20gY2xhc3Ncblx0XHRcdGNvbnN0IGdldExhbmd1YWdlRnJvbUNsYXNzID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nID0+IHtcblx0XHRcdFx0Ly8gQ2hlY2sgZGF0YS1sYW5nIGF0dHJpYnV0ZSBmaXJzdFxuXHRcdFx0XHRjb25zdCBkYXRhTGFuZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmcnKTtcblx0XHRcdFx0aWYgKGRhdGFMYW5nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFMYW5nLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBEZWZpbmUgbGFuZ3VhZ2UgcGF0dGVybnNcblx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VQYXR0ZXJucyA9IFtcblx0XHRcdFx0XHQvXmxhbmd1YWdlLShcXHcrKSQvLCAgICAgICAgICAvLyBsYW5ndWFnZS1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15sYW5nLShcXHcrKSQvLCAgICAgICAgICAgICAgLy8gbGFuZy1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L14oXFx3KyktY29kZSQvLCAgICAgICAgICAgICAgLy8gamF2YXNjcmlwdC1jb2RlXG5cdFx0XHRcdFx0L15jb2RlLShcXHcrKSQvLCAgICAgICAgICAgICAgLy8gY29kZS1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15zeW50YXgtKFxcdyspJC8sICAgICAgICAgICAgLy8gc3ludGF4LWphdmFzY3JpcHRcblx0XHRcdFx0XHQvXmNvZGUtc25pcHBldF9fKFxcdyspJC8sICAgICAvLyBjb2RlLXNuaXBwZXRfX2phdmFzY3JpcHRcblx0XHRcdFx0XHQvXmhpZ2hsaWdodC0oXFx3KykkLywgICAgICAgICAvLyBoaWdobGlnaHQtamF2YXNjcmlwdFxuXHRcdFx0XHRcdC9eKFxcdyspLXNuaXBwZXQkLyAgICAgICAgICAgIC8vIGphdmFzY3JpcHQtc25pcHBldFxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdC8vIFRoZW4gY2hlY2sgdGhlIGNsYXNzIGF0dHJpYnV0ZSBmb3IgcGF0dGVybnNcblx0XHRcdFx0aWYgKGVsZW1lbnQuY2xhc3NOYW1lICYmIHR5cGVvZiBlbGVtZW50LmNsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbGFuZ3VhZ2VQYXR0ZXJucykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBlbGVtZW50LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpLm1hdGNoKHBhdHRlcm4pO1xuXHRcdFx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBUaGVuIGNoZWNrIGZvciBzdXBwb3J0ZWQgbGFuZ3VhZ2Vcblx0XHRcdFx0XHRpZiAoU1VQUE9SVEVEX0xBTkdVQUdFUy5oYXMoZWxlbWVudC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtZW50LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNsYXNzTmFtZXMgPSBBcnJheS5mcm9tKGVsZW1lbnQuY2xhc3NMaXN0KTtcblx0XHRcdFx0XG5cdFx0XHRcdGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcblx0XHRcdFx0XHQvLyBDaGVjayBwYXR0ZXJucyBmaXJzdFxuXHRcdFx0XHRcdGZvciAoY29uc3QgcGF0dGVybiBvZiBsYW5ndWFnZVBhdHRlcm5zKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IGNsYXNzTmFtZS5tYXRjaChwYXR0ZXJuKTtcblx0XHRcdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPbmx5IGNoZWNrIGJhcmUgbGFuZ3VhZ2UgbmFtZXMgaWYgbm8gcGF0dGVybnMgd2VyZSBmb3VuZFxuXHRcdFx0XHRmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG5cdFx0XHRcdFx0aWYgKFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH07XG5cblx0XHRcdC8vIFRyeSB0byBnZXQgdGhlIGxhbmd1YWdlIGZyb20gdGhlIGVsZW1lbnQgYW5kIGl0cyBhbmNlc3RvcnNcblx0XHRcdGxldCBsYW5ndWFnZSA9ICcnO1xuXHRcdFx0bGV0IGN1cnJlbnRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbDtcblx0XHRcdFxuXHRcdFx0d2hpbGUgKGN1cnJlbnRFbGVtZW50ICYmICFsYW5ndWFnZSkge1xuXHRcdFx0XHRsYW5ndWFnZSA9IGdldExhbmd1YWdlRnJvbUNsYXNzKGN1cnJlbnRFbGVtZW50KTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEFsc28gY2hlY2sgZm9yIGNvZGUgZWxlbWVudHMgd2l0aGluIHRoZSBjdXJyZW50IGVsZW1lbnRcblx0XHRcdFx0aWYgKCFsYW5ndWFnZSAmJiBjdXJyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdjb2RlJykpIHtcblx0XHRcdFx0XHRsYW5ndWFnZSA9IGdldExhbmd1YWdlRnJvbUNsYXNzKGN1cnJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NvZGUnKSEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEZ1bmN0aW9uIHRvIHJlY3Vyc2l2ZWx5IGV4dHJhY3QgdGV4dCBjb250ZW50IHdoaWxlIHByZXNlcnZpbmcgc3RydWN0dXJlXG5cdFx0XHRjb25zdCBleHRyYWN0U3RydWN0dXJlZFRleHQgPSAoZWxlbWVudDogTm9kZSk6IHN0cmluZyA9PiB7XG5cdFx0XHRcdGlmIChlbGVtZW50Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRsZXQgdGV4dCA9ICcnO1xuXHRcdFx0XHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gSGFuZGxlIGxpbmUgYnJlYWtzXG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQudGFnTmFtZSA9PT0gJ0JSJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBIYW5kbGUgY29kZSBlbGVtZW50cyBhbmQgdGhlaXIgY2hpbGRyZW5cblx0XHRcdFx0XHRlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XG5cdFx0XHRcdFx0XHR0ZXh0ICs9IGV4dHJhY3RTdHJ1Y3R1cmVkVGV4dChjaGlsZCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gQWRkIG5ld2xpbmUgYWZ0ZXIgZWFjaCBjb2RlIGVsZW1lbnRcblx0XHRcdFx0XHRpZiAoZWxlbWVudC50YWdOYW1lID09PSAnQ09ERScpIHtcblx0XHRcdFx0XHRcdHRleHQgKz0gJ1xcbic7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fTtcblxuXHRcdFx0Ly8gRXh0cmFjdCBhbGwgdGV4dCBjb250ZW50XG5cdFx0XHRsZXQgY29kZUNvbnRlbnQgPSBleHRyYWN0U3RydWN0dXJlZFRleHQoZWwpO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCB0aGUgY29udGVudFxuXHRcdFx0Y29kZUNvbnRlbnQgPSBjb2RlQ29udGVudFxuXHRcdFx0XHQvLyBSZW1vdmUgYW55IGV4dHJhIG5ld2xpbmVzIGF0IHRoZSBzdGFydFxuXHRcdFx0XHQucmVwbGFjZSgvXlxcbisvLCAnJylcblx0XHRcdFx0Ly8gUmVtb3ZlIGFueSBleHRyYSBuZXdsaW5lcyBhdCB0aGUgZW5kXG5cdFx0XHRcdC5yZXBsYWNlKC9cXG4rJC8sICcnKVxuXHRcdFx0XHQvLyBSZXBsYWNlIG11bHRpcGxlIGNvbnNlY3V0aXZlIG5ld2xpbmVzIHdpdGggYSBzaW5nbGUgbmV3bGluZVxuXHRcdFx0XHQucmVwbGFjZSgvXFxuezMsfS9nLCAnXFxuXFxuJyk7XG5cblx0XHRcdC8vIENyZWF0ZSBuZXcgcHJlIGVsZW1lbnRcblx0XHRcdGNvbnN0IG5ld1ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXHRcdFx0XG5cdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlc1xuXHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0bmV3UHJlLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQ3JlYXRlIGNvZGUgZWxlbWVudFxuXHRcdFx0Y29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcblx0XHRcdGlmIChsYW5ndWFnZSkge1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5nJywgbGFuZ3VhZ2UpO1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBgbGFuZ3VhZ2UtJHtsYW5ndWFnZX1gKTtcblx0XHRcdH1cblx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSBjb2RlQ29udGVudDtcblx0XHRcdFxuXHRcdFx0bmV3UHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXHRcdFx0cmV0dXJuIG5ld1ByZTtcblx0XHR9XG5cdH0sXG5cdC8vIFNpbXBsaWZ5IGhlYWRpbmdzIGJ5IHJlbW92aW5nIGludGVybmFsIG5hdmlnYXRpb24gZWxlbWVudHNcblx0e1xuXHRcdHNlbGVjdG9yOiAnaDEsIGgyLCBoMywgaDQsIGg1LCBoNicsXG5cdFx0ZWxlbWVudDogJ2tlZXAnLFxuXHRcdHRyYW5zZm9ybTogKGVsOiBFbGVtZW50KTogRWxlbWVudCA9PiB7XG5cdFx0XHQvLyBJZiBoZWFkaW5nIG9ubHkgY29udGFpbnMgYSBzaW5nbGUgYW5jaG9yIHdpdGggaW50ZXJuYWwgbGlua1xuXHRcdFx0aWYgKGVsLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBcblx0XHRcdFx0ZWwuZmlyc3RFbGVtZW50Q2hpbGQ/LnRhZ05hbWUgPT09ICdBJyAmJlxuXHRcdFx0XHQoZWwuZmlyc3RFbGVtZW50Q2hpbGQuZ2V0QXR0cmlidXRlKCdocmVmJyk/LmluY2x1ZGVzKCcjJykgfHwgXG5cdFx0XHRcdCBlbC5maXJzdEVsZW1lbnRDaGlsZC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKT8uc3RhcnRzV2l0aCgnIycpKSkge1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ3JlYXRlIG5ldyBoZWFkaW5nIG9mIHNhbWUgbGV2ZWxcblx0XHRcdFx0Y29uc3QgbmV3SGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwudGFnTmFtZSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlcyBmcm9tIG9yaWdpbmFsIGhlYWRpbmdcblx0XHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRcdGlmIChBTExPV0VEX0FUVFJJQlVURVMuaGFzKGF0dHIubmFtZSkpIHtcblx0XHRcdFx0XHRcdG5ld0hlYWRpbmcuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEp1c3QgdXNlIHRoZSB0ZXh0IGNvbnRlbnRcblx0XHRcdFx0bmV3SGVhZGluZy50ZXh0Q29udGVudCA9IGVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3SGVhZGluZztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gSWYgaGVhZGluZyBjb250YWlucyBuYXZpZ2F0aW9uIGJ1dHRvbnMgb3Igb3RoZXIgdXRpbGl0eSBlbGVtZW50c1xuXHRcdFx0Y29uc3QgYnV0dG9ucyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpO1xuXHRcdFx0aWYgKGJ1dHRvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjb25zdCBuZXdIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbC50YWdOYW1lKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIENvcHkgYWxsb3dlZCBhdHRyaWJ1dGVzXG5cdFx0XHRcdEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0XHRuZXdIZWFkaW5nLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBKdXN0IHVzZSB0aGUgdGV4dCBjb250ZW50XG5cdFx0XHRcdG5ld0hlYWRpbmcudGV4dENvbnRlbnQgPSBlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIG5ld0hlYWRpbmc7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBlbDtcblx0XHR9XG5cdH0sXG5cdC8vIENvbnZlcnQgZGl2cyB3aXRoIHBhcmFncmFwaCByb2xlIHRvIGFjdHVhbCBwYXJhZ3JhcGhzXG5cdHsgXG5cdFx0c2VsZWN0b3I6ICdkaXZbZGF0YS10ZXN0aWRePVwicGFyYWdyYXBoXCJdLCBkaXZbcm9sZT1cInBhcmFncmFwaFwiXScsIFxuXHRcdGVsZW1lbnQ6ICdwJyxcblx0XHR0cmFuc2Zvcm06IChlbDogRWxlbWVudCk6IEVsZW1lbnQgPT4ge1xuXHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ29weSBpbm5lckhUTUxcblx0XHRcdHAuaW5uZXJIVE1MID0gZWwuaW5uZXJIVE1MO1xuXHRcdFx0XG5cdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlc1xuXHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0cC5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBwO1xuXHRcdH1cblx0fSxcblx0Ly8gQ29udmVydCBkaXZzIHdpdGggbGlzdCByb2xlcyB0byBhY3R1YWwgbGlzdHNcblx0eyBcblx0XHRzZWxlY3RvcjogJ2Rpdltyb2xlPVwibGlzdFwiXScsIFxuXHRcdGVsZW1lbnQ6ICd1bCcsXG5cdFx0Ly8gQ3VzdG9tIGhhbmRsZXIgZm9yIGxpc3QgdHlwZSBkZXRlY3Rpb24gYW5kIHRyYW5zZm9ybWF0aW9uXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdC8vIEZpcnN0IGRldGVybWluZSBpZiB0aGlzIGlzIGFuIG9yZGVyZWQgbGlzdFxuXHRcdFx0Y29uc3QgZmlyc3RJdGVtID0gZWwucXVlcnlTZWxlY3RvcignZGl2W3JvbGU9XCJsaXN0aXRlbVwiXSAubGFiZWwnKTtcblx0XHRcdGNvbnN0IGxhYmVsID0gZmlyc3RJdGVtPy50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0Y29uc3QgaXNPcmRlcmVkID0gbGFiZWwubWF0Y2goL15cXGQrXFwpLyk7XG5cdFx0XHRcblx0XHRcdC8vIENyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgbGlzdCB0eXBlXG5cdFx0XHRjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChpc09yZGVyZWQgPyAnb2wnIDogJ3VsJyk7XG5cdFx0XHRcblx0XHRcdC8vIFByb2Nlc3MgZWFjaCBsaXN0IGl0ZW1cblx0XHRcdGNvbnN0IGl0ZW1zID0gZWwucXVlcnlTZWxlY3RvckFsbCgnZGl2W3JvbGU9XCJsaXN0aXRlbVwiXScpO1xuXHRcdFx0aXRlbXMuZm9yRWFjaChpdGVtID0+IHtcblx0XHRcdFx0Y29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdFx0XHRjb25zdCBjb250ZW50ID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGNvbnRlbnQpIHtcblx0XHRcdFx0XHQvLyBDb252ZXJ0IGFueSBwYXJhZ3JhcGggZGl2cyBpbnNpZGUgY29udGVudFxuXHRcdFx0XHRcdGNvbnN0IHBhcmFncmFwaERpdnMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdltyb2xlPVwicGFyYWdyYXBoXCJdJyk7XG5cdFx0XHRcdFx0cGFyYWdyYXBoRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRcdFx0cC5pbm5lckhUTUwgPSBkaXYuaW5uZXJIVE1MO1xuXHRcdFx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKHApO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIENvbnZlcnQgYW55IG5lc3RlZCBsaXN0cyByZWN1cnNpdmVseVxuXHRcdFx0XHRcdGNvbnN0IG5lc3RlZExpc3RzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cImxpc3RcIl0nKTtcblx0XHRcdFx0XHRuZXN0ZWRMaXN0cy5mb3JFYWNoKG5lc3RlZExpc3QgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgZmlyc3ROZXN0ZWRJdGVtID0gbmVzdGVkTGlzdC5xdWVyeVNlbGVjdG9yKCdkaXZbcm9sZT1cImxpc3RpdGVtXCJdIC5sYWJlbCcpO1xuXHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkTGFiZWwgPSBmaXJzdE5lc3RlZEl0ZW0/LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHRcdFx0XHRjb25zdCBpc05lc3RlZE9yZGVyZWQgPSBuZXN0ZWRMYWJlbC5tYXRjaCgvXlxcZCtcXCkvKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Y29uc3QgbmV3TmVzdGVkTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXNOZXN0ZWRPcmRlcmVkID8gJ29sJyA6ICd1bCcpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBQcm9jZXNzIG5lc3RlZCBpdGVtc1xuXHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkSXRlbXMgPSBuZXN0ZWRMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdltyb2xlPVwibGlzdGl0ZW1cIl0nKTtcblx0XHRcdFx0XHRcdG5lc3RlZEl0ZW1zLmZvckVhY2gobmVzdGVkSXRlbSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5lc3RlZExpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkQ29udGVudCA9IG5lc3RlZEl0ZW0ucXVlcnlTZWxlY3RvcignLmNvbnRlbnQnKTtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmIChuZXN0ZWRDb250ZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gQ29udmVydCBwYXJhZ3JhcGggZGl2cyBpbiBuZXN0ZWQgaXRlbXNcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBuZXN0ZWRQYXJhZ3JhcGhzID0gbmVzdGVkQ29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cInBhcmFncmFwaFwiXScpO1xuXHRcdFx0XHRcdFx0XHRcdG5lc3RlZFBhcmFncmFwaHMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0XHRcdFx0XHRcdHAuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTDtcblx0XHRcdFx0XHRcdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChwKTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRuZXN0ZWRMaS5pbm5lckhUTUwgPSBuZXN0ZWRDb250ZW50LmlubmVySFRNTDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0bmV3TmVzdGVkTGlzdC5hcHBlbmRDaGlsZChuZXN0ZWRMaSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0bmVzdGVkTGlzdC5yZXBsYWNlV2l0aChuZXdOZXN0ZWRMaXN0KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRsaS5pbm5lckhUTUwgPSBjb250ZW50LmlubmVySFRNTDtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0bGlzdC5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0cmV0dXJuIGxpc3Q7XG5cdFx0fVxuXHR9LFxuXHR7IFxuXHRcdHNlbGVjdG9yOiAnZGl2W3JvbGU9XCJsaXN0aXRlbVwiXScsIFxuXHRcdGVsZW1lbnQ6ICdsaScsXG5cdFx0Ly8gQ3VzdG9tIGhhbmRsZXIgZm9yIGxpc3QgaXRlbSBjb250ZW50XG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpO1xuXHRcdFx0aWYgKCFjb250ZW50KSByZXR1cm4gZWw7XG5cdFx0XHRcblx0XHRcdC8vIENvbnZlcnQgYW55IHBhcmFncmFwaCBkaXZzIGluc2lkZSBjb250ZW50XG5cdFx0XHRjb25zdCBwYXJhZ3JhcGhEaXZzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cInBhcmFncmFwaFwiXScpO1xuXHRcdFx0cGFyYWdyYXBoRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcdHAuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTDtcblx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKHApO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBjb250ZW50O1xuXHRcdH1cblx0fSxcblx0Ly8gQ29kZSBibG9ja3Mgd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nXG5cdHtcblx0XHRzZWxlY3RvcjogJy53cC1ibG9jay1zeW50YXhoaWdobGlnaHRlci1jb2RlLCAuc3ludGF4aGlnaGxpZ2h0ZXIsIC5oaWdobGlnaHQsIC5oaWdobGlnaHQtc291cmNlLCAud3AtYmxvY2stY29kZSwgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSwgcHJlW2NsYXNzKj1cImJydXNoOlwiXScsXG5cdFx0ZWxlbWVudDogJ3ByZScsXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGlmICghKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm4gZWw7XG5cblx0XHRcdC8vIENyZWF0ZSBuZXcgcHJlIGVsZW1lbnRcblx0XHRcdGNvbnN0IG5ld1ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXHRcdFx0XG5cdFx0XHQvLyBUcnkgdG8gZGV0ZWN0IGxhbmd1YWdlXG5cdFx0XHRsZXQgbGFuZ3VhZ2UgPSAnJztcblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgZm9yIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgc3BlY2lmaWMgZm9ybWF0XG5cdFx0XHRjb25zdCBzeW50YXhFbCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5zeW50YXhoaWdobGlnaHRlcicpO1xuXHRcdFx0aWYgKHN5bnRheEVsKSB7XG5cdFx0XHRcdC8vIEdldCBsYW5ndWFnZSBmcm9tIHN5bnRheGhpZ2hsaWdodGVyIGNsYXNzXG5cdFx0XHRcdGNvbnN0IGNsYXNzZXMgPSBBcnJheS5mcm9tKHN5bnRheEVsLmNsYXNzTGlzdCk7XG5cdFx0XHRcdGNvbnN0IGxhbmdDbGFzcyA9IGNsYXNzZXMuZmluZChjID0+ICFbJ3N5bnRheGhpZ2hsaWdodGVyJywgJ25vZ3V0dGVyJ10uaW5jbHVkZXMoYykpO1xuXHRcdFx0XHRpZiAobGFuZ0NsYXNzICYmIFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKGxhbmdDbGFzcy50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdGxhbmd1YWdlID0gbGFuZ0NsYXNzLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgbm8gbGFuZ3VhZ2UgZm91bmQgeWV0LCBjaGVjayBvdGhlciBjb21tb24gcGF0dGVybnNcblx0XHRcdGlmICghbGFuZ3VhZ2UpIHtcblx0XHRcdFx0Y29uc3QgY2xhc3NOYW1lcyA9IEFycmF5LmZyb20oZWwuY2xhc3NMaXN0KTtcblx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VQYXR0ZXJucyA9IFtcblx0XHRcdFx0XHQvKD86XnxcXHMpKD86bGFuZ3VhZ2V8bGFuZ3xicnVzaHxzeW50YXgpLShcXHcrKSg/Olxcc3wkKS9pLFxuXHRcdFx0XHRcdC8oPzpefFxccykoXFx3KykoPzpcXHN8JCkvaVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbGFuZ3VhZ2VQYXR0ZXJucykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBjbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cdFx0XHRcdFx0XHRpZiAobWF0Y2ggJiYgbWF0Y2hbMV0gJiYgU1VQUE9SVEVEX0xBTkdVQUdFUy5oYXMobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRcdFx0bGFuZ3VhZ2UgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGxhbmd1YWdlKSBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBFeHRyYWN0IGNvZGUgY29udGVudCwgaGFuZGxpbmcgdmFyaW91cyBmb3JtYXRzXG5cdFx0XHRsZXQgY29kZUNvbnRlbnQgPSAnJztcblxuXHRcdFx0Ly8gSGFuZGxlIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgdGFibGUgZm9ybWF0XG5cdFx0XHRjb25zdCBjb2RlQ29udGFpbmVyID0gZWwucXVlcnlTZWxlY3RvcignLnN5bnRheGhpZ2hsaWdodGVyIHRhYmxlIC5jb2RlIC5jb250YWluZXInKTtcblx0XHRcdGlmIChjb2RlQ29udGFpbmVyKSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgZWFjaCBsaW5lXG5cdFx0XHRcdGNvbnN0IGxpbmVzID0gQXJyYXkuZnJvbShjb2RlQ29udGFpbmVyLmNoaWxkcmVuKTtcblx0XHRcdFx0Y29kZUNvbnRlbnQgPSBsaW5lc1xuXHRcdFx0XHRcdC5tYXAobGluZSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBHZXQgYWxsIGNvZGUgZWxlbWVudHMgaW4gdGhpcyBsaW5lXG5cdFx0XHRcdFx0XHRjb25zdCBjb2RlUGFydHMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnY29kZScpKVxuXHRcdFx0XHRcdFx0XHQubWFwKGNvZGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdC8vIEdldCB0aGUgdGV4dCBjb250ZW50LCBwcmVzZXJ2aW5nIHNwYWNlc1xuXHRcdFx0XHRcdFx0XHRcdGxldCB0ZXh0ID0gY29kZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHRcdFx0XHQvLyBJZiB0aGlzIGlzIGEgJ3NwYWNlcycgY2xhc3MgZWxlbWVudCwgY29udmVydCB0byBhY3R1YWwgc3BhY2VzXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNvZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdzcGFjZXMnKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGV4dCA9ICcgJy5yZXBlYXQodGV4dC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gdGV4dDtcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LmpvaW4oJycpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNvZGVQYXJ0cyB8fCBsaW5lLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmpvaW4oJ1xcbicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gSGFuZGxlIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgbm9uLXRhYmxlIGZvcm1hdFxuXHRcdFx0XHRjb25zdCBjb2RlTGluZXMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCcuY29kZSAubGluZScpO1xuXHRcdFx0XHRpZiAoY29kZUxpbmVzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRjb2RlQ29udGVudCA9IEFycmF5LmZyb20oY29kZUxpbmVzKVxuXHRcdFx0XHRcdFx0Lm1hcChsaW5lID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY29kZVBhcnRzID0gQXJyYXkuZnJvbShsaW5lLnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKSlcblx0XHRcdFx0XHRcdFx0XHQubWFwKGNvZGUgPT4gY29kZS50ZXh0Q29udGVudCB8fCAnJylcblx0XHRcdFx0XHRcdFx0XHQuam9pbignJyk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBjb2RlUGFydHMgfHwgbGluZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuam9pbignXFxuJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gRmFsbGJhY2sgdG8gcmVndWxhciB0ZXh0IGNvbnRlbnRcblx0XHRcdFx0XHRjb2RlQ29udGVudCA9IGVsLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIENsZWFuIHVwIHRoZSBjb250ZW50XG5cdFx0XHRjb2RlQ29udGVudCA9IGNvZGVDb250ZW50XG5cdFx0XHRcdC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykgLy8gVHJpbSBzdGFydC9lbmQgd2hpdGVzcGFjZVxuXHRcdFx0XHQucmVwbGFjZSgvXFx0L2csICcgICAgJykgLy8gQ29udmVydCB0YWJzIHRvIHNwYWNlc1xuXHRcdFx0XHQucmVwbGFjZSgvXFxuezMsfS9nLCAnXFxuXFxuJykgLy8gTm9ybWFsaXplIG11bHRpcGxlIG5ld2xpbmVzXG5cdFx0XHRcdC5yZXBsYWNlKC9cXHUwMGEwL2csICcgJyk7IC8vIFJlcGxhY2Ugbm9uLWJyZWFraW5nIHNwYWNlcyB3aXRoIHJlZ3VsYXIgc3BhY2VzXG5cblx0XHRcdC8vIENyZWF0ZSBjb2RlIGVsZW1lbnQgd2l0aCBsYW5ndWFnZSBjbGFzcyBpZiBkZXRlY3RlZFxuXHRcdFx0Y29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcblx0XHRcdGlmIChsYW5ndWFnZSkge1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5nJywgbGFuZ3VhZ2UpO1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBgbGFuZ3VhZ2UtJHtsYW5ndWFnZX1gKTtcblx0XHRcdH1cblx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSBjb2RlQ29udGVudDtcblx0XHRcdFxuXHRcdFx0bmV3UHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXHRcdFx0cmV0dXJuIG5ld1ByZTtcblx0XHR9XG5cdH1cbl07XG5cbmludGVyZmFjZSBGb290bm90ZURhdGEge1xuXHRjb250ZW50OiBFbGVtZW50IHwgc3RyaW5nO1xuXHRvcmlnaW5hbElkOiBzdHJpbmc7XG5cdHJlZnM6IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgRm9vdG5vdGVDb2xsZWN0aW9uIHtcblx0W2Zvb3Rub3RlTnVtYmVyOiBudW1iZXJdOiBGb290bm90ZURhdGE7XG59XG5cbmludGVyZmFjZSBDb250ZW50U2NvcmUge1xuXHRzY29yZTogbnVtYmVyO1xuXHRlbGVtZW50OiBFbGVtZW50O1xufVxuXG5pbnRlcmZhY2UgU3R5bGVDaGFuZ2Uge1xuXHRzZWxlY3Rvcjogc3RyaW5nO1xuXHRzdHlsZXM6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIERlZnVkZGxlIHtcblx0cHJpdmF0ZSBkb2M6IERvY3VtZW50O1xuXHRwcml2YXRlIG9wdGlvbnM6IERlZnVkZGxlT3B0aW9ucztcblx0cHJpdmF0ZSBkZWJ1ZzogYm9vbGVhbjtcblxuXHQvKipcblx0ICogQ3JlYXRlIGEgbmV3IERlZnVkZGxlIGluc3RhbmNlXG5cdCAqIEBwYXJhbSBkb2MgLSBUaGUgZG9jdW1lbnQgdG8gcGFyc2Vcblx0ICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25zIGZvciBwYXJzaW5nXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihkb2M6IERvY3VtZW50LCBvcHRpb25zOiBEZWZ1ZGRsZU9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuZG9jID0gZG9jO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5kZWJ1ZyA9IG9wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogUGFyc2UgdGhlIGRvY3VtZW50IGFuZCBleHRyYWN0IGl0cyBtYWluIGNvbnRlbnRcblx0ICovXG5cdHBhcnNlKCk6IERlZnVkZGxlUmVzcG9uc2Uge1xuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0Ly8gRXh0cmFjdCBtZXRhZGF0YSBmaXJzdCBzaW5jZSB3ZSdsbCBuZWVkIGl0IGluIG11bHRpcGxlIHBsYWNlc1xuXHRcdGNvbnN0IHNjaGVtYU9yZ0RhdGEgPSBNZXRhZGF0YUV4dHJhY3Rvci5leHRyYWN0U2NoZW1hT3JnRGF0YSh0aGlzLmRvYyk7XG5cdFx0Y29uc3QgbWV0YWRhdGEgPSBNZXRhZGF0YUV4dHJhY3Rvci5leHRyYWN0KHRoaXMuZG9jLCBzY2hlbWFPcmdEYXRhKTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBFdmFsdWF0ZSBzdHlsZXMgYW5kIHNpemVzIG9uIG9yaWdpbmFsIGRvY3VtZW50XG5cdFx0XHRjb25zdCBtb2JpbGVTdHlsZXMgPSB0aGlzLl9ldmFsdWF0ZU1lZGlhUXVlcmllcyh0aGlzLmRvYyk7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGZvciBzbWFsbCBpbWFnZXMgaW4gb3JpZ2luYWwgZG9jdW1lbnQsIGV4Y2x1ZGluZyBsYXp5LWxvYWRlZCBvbmVzXG5cdFx0XHRjb25zdCBzbWFsbEltYWdlcyA9IHRoaXMuZmluZFNtYWxsSW1hZ2VzKHRoaXMuZG9jKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ2xvbmUgZG9jdW1lbnRcblx0XHRcdGNvbnN0IGNsb25lID0gdGhpcy5kb2MuY2xvbmVOb2RlKHRydWUpIGFzIERvY3VtZW50O1xuXHRcdFx0XG5cdFx0XHQvLyBBcHBseSBtb2JpbGUgc3R5bGUgdG8gY2xvbmVcblx0XHRcdHRoaXMuYXBwbHlNb2JpbGVTdHlsZXMoY2xvbmUsIG1vYmlsZVN0eWxlcyk7XG5cblx0XHRcdC8vIEZpbmQgbWFpbiBjb250ZW50XG5cdFx0XHRjb25zdCBtYWluQ29udGVudCA9IHRoaXMuZmluZE1haW5Db250ZW50KGNsb25lKTtcblx0XHRcdGlmICghbWFpbkNvbnRlbnQpIHtcblx0XHRcdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGNvbnRlbnQ6IHRoaXMuZG9jLmJvZHkuaW5uZXJIVE1MLFxuXHRcdFx0XHRcdC4uLm1ldGFkYXRhLFxuXHRcdFx0XHRcdHdvcmRDb3VudDogdGhpcy5jb3VudFdvcmRzKHRoaXMuZG9jLmJvZHkuaW5uZXJIVE1MKSxcblx0XHRcdFx0XHRwYXJzZVRpbWU6IE1hdGgucm91bmQoZW5kVGltZSAtIHN0YXJ0VGltZSlcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVtb3ZlIHNtYWxsIGltYWdlcyBpZGVudGlmaWVkIGZyb20gb3JpZ2luYWwgZG9jdW1lbnRcblx0XHRcdHRoaXMucmVtb3ZlU21hbGxJbWFnZXMoY2xvbmUsIHNtYWxsSW1hZ2VzKTtcblx0XHRcdFxuXHRcdFx0Ly8gUGVyZm9ybSBvdGhlciBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zIG9uIHRoZSBjbG9uZVxuXHRcdFx0dGhpcy5yZW1vdmVIaWRkZW5FbGVtZW50cyhjbG9uZSk7XG5cdFx0XHR0aGlzLnJlbW92ZUNsdXR0ZXIoY2xvbmUpO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCB0aGUgbWFpbiBjb250ZW50XG5cdFx0XHR0aGlzLmNsZWFuQ29udGVudChtYWluQ29udGVudCwgbWV0YWRhdGEpO1xuXG5cdFx0XHRjb25zdCBjb250ZW50ID0gbWFpbkNvbnRlbnQgPyBtYWluQ29udGVudC5vdXRlckhUTUwgOiB0aGlzLmRvYy5ib2R5LmlubmVySFRNTDtcblx0XHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29udGVudCxcblx0XHRcdFx0Li4ubWV0YWRhdGEsXG5cdFx0XHRcdHdvcmRDb3VudDogdGhpcy5jb3VudFdvcmRzKGNvbnRlbnQpLFxuXHRcdFx0XHRwYXJzZVRpbWU6IE1hdGgucm91bmQoZW5kVGltZSAtIHN0YXJ0VGltZSlcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0RlZnVkZGxlJywgJ0Vycm9yIHByb2Nlc3NpbmcgZG9jdW1lbnQ6JywgZXJyb3IpO1xuXHRcdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29udGVudDogdGhpcy5kb2MuYm9keS5pbm5lckhUTUwsXG5cdFx0XHRcdC4uLm1ldGFkYXRhLFxuXHRcdFx0XHR3b3JkQ291bnQ6IHRoaXMuY291bnRXb3Jkcyh0aGlzLmRvYy5ib2R5LmlubmVySFRNTCksXG5cdFx0XHRcdHBhcnNlVGltZTogTWF0aC5yb3VuZChlbmRUaW1lIC0gc3RhcnRUaW1lKVxuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNvdW50V29yZHMoY29udGVudDogc3RyaW5nKTogbnVtYmVyIHtcblx0XHQvLyBDcmVhdGUgYSB0ZW1wb3JhcnkgZGl2IHRvIHBhcnNlIEhUTUwgY29udGVudFxuXHRcdGNvbnN0IHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHR0ZW1wRGl2LmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cblx0XHQvLyBHZXQgdGV4dCBjb250ZW50LCByZW1vdmluZyBleHRyYSB3aGl0ZXNwYWNlXG5cdFx0Y29uc3QgdGV4dCA9IHRlbXBEaXYudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0Y29uc3Qgd29yZHMgPSB0ZXh0XG5cdFx0XHQudHJpbSgpXG5cdFx0XHQucmVwbGFjZSgvXFxzKy9nLCAnICcpIC8vIFJlcGxhY2UgbXVsdGlwbGUgc3BhY2VzIHdpdGggc2luZ2xlIHNwYWNlXG5cdFx0XHQuc3BsaXQoJyAnKVxuXHRcdFx0LmZpbHRlcih3b3JkID0+IHdvcmQubGVuZ3RoID4gMCk7IC8vIEZpbHRlciBvdXQgZW1wdHkgc3RyaW5nc1xuXG5cdFx0cmV0dXJuIHdvcmRzLmxlbmd0aDtcblx0fVxuXG5cdC8vIE1ha2UgYWxsIG90aGVyIG1ldGhvZHMgcHJpdmF0ZSBieSByZW1vdmluZyB0aGUgc3RhdGljIGtleXdvcmQgYW5kIHVzaW5nIHByaXZhdGVcblx0cHJpdmF0ZSBfbG9nKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdEZWZ1ZGRsZTonLCAuLi5hcmdzKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9ldmFsdWF0ZU1lZGlhUXVlcmllcyhkb2M6IERvY3VtZW50KTogU3R5bGVDaGFuZ2VbXSB7XG5cdFx0Y29uc3QgbW9iaWxlU3R5bGVzOiBTdHlsZUNoYW5nZVtdID0gW107XG5cdFx0Y29uc3QgbWF4V2lkdGhSZWdleCA9IC9tYXgtd2lkdGhbXjpdKjpcXHMqKFxcZCspLztcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBHZXQgYWxsIHN0eWxlcywgaW5jbHVkaW5nIGlubGluZSBzdHlsZXNcblx0XHRcdGNvbnN0IHNoZWV0cyA9IEFycmF5LmZyb20oZG9jLnN0eWxlU2hlZXRzKS5maWx0ZXIoc2hlZXQgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIEFjY2VzcyBydWxlcyBvbmNlIHRvIGNoZWNrIHZhbGlkaXR5XG5cdFx0XHRcdFx0c2hlZXQuY3NzUnVsZXM7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHQvLyBFeHBlY3RlZCBlcnJvciBmb3IgY3Jvc3Mtb3JpZ2luIHN0eWxlc2hlZXRzXG5cdFx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicpIHtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdC8vIFByb2Nlc3MgYWxsIHNoZWV0cyBpbiBhIHNpbmdsZSBwYXNzXG5cdFx0XHRjb25zdCBtZWRpYVJ1bGVzID0gc2hlZXRzLmZsYXRNYXAoc2hlZXQgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJldHVybiBBcnJheS5mcm9tKHNoZWV0LmNzc1J1bGVzKVxuXHRcdFx0XHRcdFx0LmZpbHRlcigocnVsZSk6IHJ1bGUgaXMgQ1NTTWVkaWFSdWxlID0+IFxuXHRcdFx0XHRcdFx0XHRydWxlIGluc3RhbmNlb2YgQ1NTTWVkaWFSdWxlICYmXG5cdFx0XHRcdFx0XHRcdHJ1bGUuY29uZGl0aW9uVGV4dC5pbmNsdWRlcygnbWF4LXdpZHRoJylcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3Mgc3R5bGVzaGVldDonLCBlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gUHJvY2VzcyBhbGwgbWVkaWEgcnVsZXMgaW4gYSBzaW5nbGUgcGFzc1xuXHRcdFx0bWVkaWFSdWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuXHRcdFx0XHRjb25zdCBtYXRjaCA9IHJ1bGUuY29uZGl0aW9uVGV4dC5tYXRjaChtYXhXaWR0aFJlZ2V4KTtcblx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0Y29uc3QgbWF4V2lkdGggPSBwYXJzZUludChtYXRjaFsxXSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKE1PQklMRV9XSURUSCA8PSBtYXhXaWR0aCkge1xuXHRcdFx0XHRcdFx0Ly8gQmF0Y2ggcHJvY2VzcyBhbGwgc3R5bGUgcnVsZXNcblx0XHRcdFx0XHRcdGNvbnN0IHN0eWxlUnVsZXMgPSBBcnJheS5mcm9tKHJ1bGUuY3NzUnVsZXMpXG5cdFx0XHRcdFx0XHRcdC5maWx0ZXIoKHIpOiByIGlzIENTU1N0eWxlUnVsZSA9PiByIGluc3RhbmNlb2YgQ1NTU3R5bGVSdWxlKTtcblxuXHRcdFx0XHRcdFx0c3R5bGVSdWxlcy5mb3JFYWNoKGNzc1J1bGUgPT4ge1xuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdG1vYmlsZVN0eWxlcy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdG9yOiBjc3NSdWxlLnNlbGVjdG9yVGV4dCxcblx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlczogY3NzUnVsZS5zdHlsZS5jc3NUZXh0XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3MgQ1NTIHJ1bGU6JywgZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0RlZnVkZGxlOiBFcnJvciBldmFsdWF0aW5nIG1lZGlhIHF1ZXJpZXM6JywgZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1vYmlsZVN0eWxlcztcblx0fVxuXG5cdHByaXZhdGUgYXBwbHlNb2JpbGVTdHlsZXMoZG9jOiBEb2N1bWVudCwgbW9iaWxlU3R5bGVzOiBTdHlsZUNoYW5nZVtdKSB7XG5cdFx0bGV0IGFwcGxpZWRDb3VudCA9IDA7XG5cblx0XHRtb2JpbGVTdHlsZXMuZm9yRWFjaCgoe3NlbGVjdG9yLCBzdHlsZXN9KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBlbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdFx0ZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBcblx0XHRcdFx0XHRcdChlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3R5bGUnKSB8fCAnJykgKyBzdHlsZXNcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGFwcGxpZWRDb3VudCsrO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignRGVmdWRkbGUnLCAnRXJyb3IgYXBwbHlpbmcgc3R5bGVzIGZvciBzZWxlY3RvcjonLCBzZWxlY3RvciwgZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlSGlkZGVuRWxlbWVudHMoZG9jOiBEb2N1bWVudCkge1xuXHRcdGxldCBjb3VudCA9IDA7XG5cdFx0Y29uc3QgZWxlbWVudHNUb1JlbW92ZSA9IG5ldyBTZXQ8RWxlbWVudD4oKTtcblxuXHRcdC8vIEZpcnN0IHBhc3M6IEdldCBhbGwgZWxlbWVudHMgbWF0Y2hpbmcgaGlkZGVuIHNlbGVjdG9yc1xuXHRcdGNvbnN0IGhpZGRlbkVsZW1lbnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoSElEREVOX0VMRU1FTlRfU0VMRUNUT1JTKTtcblx0XHRoaWRkZW5FbGVtZW50cy5mb3JFYWNoKGVsID0+IGVsZW1lbnRzVG9SZW1vdmUuYWRkKGVsKSk7XG5cdFx0Y291bnQgKz0gaGlkZGVuRWxlbWVudHMubGVuZ3RoO1xuXG5cdFx0Ly8gU2Vjb25kIHBhc3M6IFVzZSBUcmVlV2Fsa2VyIGZvciBlZmZpY2llbnQgdHJhdmVyc2FsXG5cdFx0Y29uc3QgdHJlZVdhbGtlciA9IGRvYy5jcmVhdGVUcmVlV2Fsa2VyKFxuXHRcdFx0ZG9jLmJvZHksXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCxcblx0XHRcdHtcblx0XHRcdFx0YWNjZXB0Tm9kZTogKG5vZGU6IEVsZW1lbnQpID0+IHtcblx0XHRcdFx0XHQvLyBTa2lwIGVsZW1lbnRzIGFscmVhZHkgbWFya2VkIGZvciByZW1vdmFsXG5cdFx0XHRcdFx0aWYgKGVsZW1lbnRzVG9SZW1vdmUuaGFzKG5vZGUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfUkVKRUNUO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdC8vIEJhdGNoIHN0eWxlIGNvbXB1dGF0aW9uc1xuXHRcdGNvbnN0IGVsZW1lbnRzOiBFbGVtZW50W10gPSBbXTtcblx0XHRsZXQgY3VycmVudE5vZGU6IEVsZW1lbnQgfCBudWxsO1xuXHRcdHdoaWxlIChjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIubmV4dE5vZGUoKSBhcyBFbGVtZW50KSB7XG5cdFx0XHRlbGVtZW50cy5wdXNoKGN1cnJlbnROb2RlKTtcblx0XHR9XG5cblx0XHQvLyBQcm9jZXNzIHN0eWxlcyBpbiBiYXRjaGVzIHRvIG1pbmltaXplIGxheW91dCB0aHJhc2hpbmdcblx0XHRjb25zdCBCQVRDSF9TSVpFID0gMTAwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdGNvbnN0IGJhdGNoID0gZWxlbWVudHMuc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuXHRcdFx0XG5cdFx0XHQvLyBSZWFkIHBoYXNlIC0gZ2F0aGVyIGFsbCBjb21wdXRlZFN0eWxlc1xuXHRcdFx0Y29uc3Qgc3R5bGVzID0gYmF0Y2gubWFwKGVsID0+IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKSk7XG5cdFx0XHRcblx0XHRcdC8vIFdyaXRlIHBoYXNlIC0gbWFyayBlbGVtZW50cyBmb3IgcmVtb3ZhbFxuXHRcdFx0YmF0Y2guZm9yRWFjaCgoZWxlbWVudCwgaW5kZXgpID0+IHtcblx0XHRcdFx0Y29uc3QgY29tcHV0ZWRTdHlsZSA9IHN0eWxlc1tpbmRleF07XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlLmRpc3BsYXkgPT09ICdub25lJyB8fFxuXHRcdFx0XHRcdGNvbXB1dGVkU3R5bGUudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbicgfHxcblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlLm9wYWNpdHkgPT09ICcwJ1xuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRlbGVtZW50c1RvUmVtb3ZlLmFkZChlbGVtZW50KTtcblx0XHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBGaW5hbCBwYXNzOiBCYXRjaCByZW1vdmUgYWxsIGhpZGRlbiBlbGVtZW50c1xuXHRcdGVsZW1lbnRzVG9SZW1vdmUuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XG5cblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgaGlkZGVuIGVsZW1lbnRzOicsIGNvdW50KTtcblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlQ2x1dHRlcihkb2M6IERvY3VtZW50KSB7XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0bGV0IGV4YWN0U2VsZWN0b3JDb3VudCA9IDA7XG5cdFx0bGV0IHBhcnRpYWxTZWxlY3RvckNvdW50ID0gMDtcblxuXHRcdC8vIFRyYWNrIGFsbCBlbGVtZW50cyB0byBiZSByZW1vdmVkXG5cdFx0Y29uc3QgZWxlbWVudHNUb1JlbW92ZSA9IG5ldyBTZXQ8RWxlbWVudD4oKTtcblxuXHRcdC8vIEZpcnN0IGNvbGxlY3QgZWxlbWVudHMgbWF0Y2hpbmcgZXhhY3Qgc2VsZWN0b3JzXG5cdFx0Y29uc3QgZXhhY3RFbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKEVYQUNUX1NFTEVDVE9SUy5qb2luKCcsJykpO1xuXHRcdGV4YWN0RWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRpZiAoZWw/LnBhcmVudE5vZGUpIHtcblx0XHRcdFx0ZWxlbWVudHNUb1JlbW92ZS5hZGQoZWwpO1xuXHRcdFx0XHRleGFjdFNlbGVjdG9yQ291bnQrKztcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFByZS1jb21waWxlIHJlZ2V4ZXMgYW5kIGNvbWJpbmUgaW50byBhIHNpbmdsZSByZWdleCBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG5cdFx0Y29uc3QgY29tYmluZWRQYXR0ZXJuID0gUEFSVElBTF9TRUxFQ1RPUlMuam9pbignfCcpO1xuXHRcdGNvbnN0IHBhcnRpYWxSZWdleCA9IG5ldyBSZWdFeHAoY29tYmluZWRQYXR0ZXJuLCAnaScpO1xuXG5cdFx0Ly8gQ3JlYXRlIGFuIGVmZmljaWVudCBhdHRyaWJ1dGUgc2VsZWN0b3IgZm9yIGVsZW1lbnRzIHdlIGNhcmUgYWJvdXRcblx0XHRjb25zdCBhdHRyaWJ1dGVTZWxlY3RvciA9ICdbY2xhc3NdLFtpZF0sW2RhdGEtdGVzdGlkXSxbZGF0YS1xYV0sW2RhdGEtY3ldJztcblx0XHRjb25zdCBhbGxFbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKGF0dHJpYnV0ZVNlbGVjdG9yKTtcblxuXHRcdC8vIFByb2Nlc3MgZWxlbWVudHMgZm9yIHBhcnRpYWwgbWF0Y2hlc1xuXHRcdGFsbEVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0Ly8gU2tpcCBpZiBhbHJlYWR5IG1hcmtlZCBmb3IgcmVtb3ZhbFxuXHRcdFx0aWYgKGVsZW1lbnRzVG9SZW1vdmUuaGFzKGVsKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIEdldCBhbGwgcmVsZXZhbnQgYXR0cmlidXRlcyBhbmQgY29tYmluZSBpbnRvIGEgc2luZ2xlIHN0cmluZ1xuXHRcdFx0Y29uc3QgYXR0cnMgPSBbXG5cdFx0XHRcdGVsLmNsYXNzTmFtZSAmJiB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSAnc3RyaW5nJyA/IGVsLmNsYXNzTmFtZSA6ICcnLFxuXHRcdFx0XHRlbC5pZCB8fCAnJyxcblx0XHRcdFx0ZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXRlc3RpZCcpIHx8ICcnLFxuXHRcdFx0XHRlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcWEnKSB8fCAnJyxcblx0XHRcdFx0ZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWN5JykgfHwgJydcblx0XHRcdF0uam9pbignICcpLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdC8vIFNraXAgaWYgbm8gYXR0cmlidXRlcyB0byBjaGVja1xuXHRcdFx0aWYgKCFhdHRycy50cmltKCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDaGVjayBmb3IgcGFydGlhbCBtYXRjaCB1c2luZyBzaW5nbGUgcmVnZXggdGVzdFxuXHRcdFx0aWYgKHBhcnRpYWxSZWdleC50ZXN0KGF0dHJzKSkge1xuXHRcdFx0XHRlbGVtZW50c1RvUmVtb3ZlLmFkZChlbCk7XG5cdFx0XHRcdHBhcnRpYWxTZWxlY3RvckNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBSZW1vdmUgYWxsIGNvbGxlY3RlZCBlbGVtZW50cyBpbiBhIHNpbmdsZSBwYXNzXG5cdFx0ZWxlbWVudHNUb1JlbW92ZS5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcblxuXHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgY2x1dHRlciBlbGVtZW50czonLCB7XG5cdFx0XHRleGFjdFNlbGVjdG9yczogZXhhY3RTZWxlY3RvckNvdW50LFxuXHRcdFx0cGFydGlhbFNlbGVjdG9yczogcGFydGlhbFNlbGVjdG9yQ291bnQsXG5cdFx0XHR0b3RhbDogZWxlbWVudHNUb1JlbW92ZS5zaXplLFxuXHRcdFx0cHJvY2Vzc2luZ1RpbWU6IGAkeyhlbmRUaW1lIC0gc3RhcnRUaW1lKS50b0ZpeGVkKDIpfW1zYFxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBmbGF0dGVuRGl2cyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblx0XHRjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdC8vIFByb2Nlc3MgaW4gYmF0Y2hlcyB0byBtYWludGFpbiBwZXJmb3JtYW5jZVxuXHRcdGxldCBrZWVwUHJvY2Vzc2luZyA9IHRydWU7XG5cblx0XHRjb25zdCBzaG91bGRQcmVzZXJ2ZUVsZW1lbnQgPSAoZWw6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdGNvbnN0IHRhZ05hbWUgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGlmIGVsZW1lbnQgc2hvdWxkIGJlIHByZXNlcnZlZFxuXHRcdFx0aWYgKFBSRVNFUlZFX0VMRU1FTlRTLmhhcyh0YWdOYW1lKSkgcmV0dXJuIHRydWU7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGZvciBzZW1hbnRpYyByb2xlc1xuXHRcdFx0Y29uc3Qgcm9sZSA9IGVsLmdldEF0dHJpYnV0ZSgncm9sZScpO1xuXHRcdFx0aWYgKHJvbGUgJiYgWydhcnRpY2xlJywgJ21haW4nLCAnbmF2aWdhdGlvbicsICdiYW5uZXInLCAnY29udGVudGluZm8nXS5pbmNsdWRlcyhyb2xlKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHNlbWFudGljIGNsYXNzZXNcblx0XHRcdGNvbnN0IGNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0aWYgKGNsYXNzTmFtZS5tYXRjaCgvKD86YXJ0aWNsZXxtYWlufGNvbnRlbnR8Zm9vdG5vdGV8cmVmZXJlbmNlfGJpYmxpb2dyYXBoeSkvKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hlY2sgaWYgZGl2IGNvbnRhaW5zIG1peGVkIGNvbnRlbnQgdHlwZXMgdGhhdCBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRpZiAodGFnTmFtZSA9PT0gJ2RpdicpIHtcblx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGVsLmNoaWxkcmVuKTtcblx0XHRcdFx0Y29uc3QgaGFzUHJlc2VydmVkRWxlbWVudHMgPSBjaGlsZHJlbi5zb21lKGNoaWxkID0+IFxuXHRcdFx0XHRcdFBSRVNFUlZFX0VMRU1FTlRTLmhhcyhjaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpIHx8XG5cdFx0XHRcdFx0Y2hpbGQuZ2V0QXR0cmlidXRlKCdyb2xlJykgPT09ICdhcnRpY2xlJyB8fFxuXHRcdFx0XHRcdGNoaWxkLmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdhcnRpY2xlJylcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKGhhc1ByZXNlcnZlZEVsZW1lbnRzKSByZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0XHRjb25zdCBpc1dyYXBwZXJEaXYgPSAoZGl2OiBFbGVtZW50KTogYm9vbGVhbiA9PiB7XG5cdFx0XHQvLyBDaGVjayBpZiBpdCdzIGp1c3QgZW1wdHkgc3BhY2Vcblx0XHRcdGlmICghZGl2LnRleHRDb250ZW50Py50cmltKCkpIHJldHVybiB0cnVlO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBpdCBvbmx5IGNvbnRhaW5zIG90aGVyIGRpdnMgb3IgYmxvY2sgZWxlbWVudHNcblx0XHRcdGNvbnN0IGNoaWxkcmVuID0gQXJyYXkuZnJvbShkaXYuY2hpbGRyZW4pO1xuXHRcdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGlmIGFsbCBjaGlsZHJlbiBhcmUgYmxvY2sgZWxlbWVudHNcblx0XHRcdGNvbnN0IGFsbEJsb2NrRWxlbWVudHMgPSBjaGlsZHJlbi5ldmVyeShjaGlsZCA9PiB7XG5cdFx0XHRcdGNvbnN0IHRhZyA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0cmV0dXJuIHRhZyA9PT0gJ2RpdicgfHwgdGFnID09PSAncCcgfHwgdGFnID09PSAnaDEnIHx8IHRhZyA9PT0gJ2gyJyB8fCBcblx0XHRcdFx0XHQgICB0YWcgPT09ICdoMycgfHwgdGFnID09PSAnaDQnIHx8IHRhZyA9PT0gJ2g1JyB8fCB0YWcgPT09ICdoNicgfHxcblx0XHRcdFx0XHQgICB0YWcgPT09ICd1bCcgfHwgdGFnID09PSAnb2wnIHx8IHRhZyA9PT0gJ3ByZScgfHwgdGFnID09PSAnYmxvY2txdW90ZScgfHxcblx0XHRcdFx0XHQgICB0YWcgPT09ICdmaWd1cmUnO1xuXHRcdFx0fSk7XG5cdFx0XHRpZiAoYWxsQmxvY2tFbGVtZW50cykgcmV0dXJuIHRydWU7XG5cblx0XHRcdC8vIENoZWNrIGZvciBjb21tb24gd3JhcHBlciBwYXR0ZXJuc1xuXHRcdFx0Y29uc3QgY2xhc3NOYW1lID0gZGl2LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Y29uc3QgaXNXcmFwcGVyID0gLyg/OndyYXBwZXJ8Y29udGFpbmVyfGxheW91dHxyb3d8Y29sfGdyaWR8ZmxleHxvdXRlcnxpbm5lcnxjb250ZW50LWFyZWEpL2kudGVzdChjbGFzc05hbWUpO1xuXHRcdFx0aWYgKGlzV3JhcHBlcikgcmV0dXJuIHRydWU7XG5cblx0XHRcdC8vIENoZWNrIGlmIGl0IGhhcyBleGNlc3NpdmUgd2hpdGVzcGFjZSBvciBlbXB0eSB0ZXh0IG5vZGVzXG5cdFx0XHRjb25zdCB0ZXh0Tm9kZXMgPSBBcnJheS5mcm9tKGRpdi5jaGlsZE5vZGVzKS5maWx0ZXIobm9kZSA9PiBcblx0XHRcdFx0bm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUgJiYgbm9kZS50ZXh0Q29udGVudD8udHJpbSgpXG5cdFx0XHQpO1xuXHRcdFx0aWYgKHRleHROb2Rlcy5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBpdCdzIGEgZGl2IHRoYXQgb25seSBjb250YWlucyBibG9jayBlbGVtZW50c1xuXHRcdFx0Y29uc3QgaGFzT25seUJsb2NrRWxlbWVudHMgPSBjaGlsZHJlbi5sZW5ndGggPiAwICYmICFjaGlsZHJlbi5zb21lKGNoaWxkID0+IHtcblx0XHRcdFx0Y29uc3QgdGFnID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRyZXR1cm4gSU5MSU5FX0VMRU1FTlRTLmhhcyh0YWcpO1xuXHRcdFx0fSk7XG5cdFx0XHRpZiAoaGFzT25seUJsb2NrRWxlbWVudHMpIHJldHVybiB0cnVlO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIHByb2Nlc3MgYSBzaW5nbGUgZGl2XG5cdFx0Y29uc3QgcHJvY2Vzc0RpdiA9IChkaXY6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdC8vIFNraXAgcHJvY2Vzc2luZyBpZiBkaXYgaGFzIGJlZW4gcmVtb3ZlZCBvciBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRpZiAoIWRpdi5pc0Nvbm5lY3RlZCB8fCBzaG91bGRQcmVzZXJ2ZUVsZW1lbnQoZGl2KSkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0XHQvLyBDYXNlIDE6IEVtcHR5IGRpdiBvciBkaXYgd2l0aCBvbmx5IHdoaXRlc3BhY2Vcblx0XHRcdGlmICghZGl2Lmhhc0NoaWxkTm9kZXMoKSB8fCAhZGl2LnRleHRDb250ZW50Py50cmltKCkpIHtcblx0XHRcdFx0ZGl2LnJlbW92ZSgpO1xuXHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FzZSAyOiBUb3AtbGV2ZWwgZGl2IC0gYmUgbW9yZSBhZ2dyZXNzaXZlXG5cdFx0XHRpZiAoZGl2LnBhcmVudEVsZW1lbnQgPT09IGVsZW1lbnQpIHtcblx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGRpdi5jaGlsZHJlbik7XG5cdFx0XHRcdGNvbnN0IGhhc09ubHlCbG9ja0VsZW1lbnRzID0gY2hpbGRyZW4ubGVuZ3RoID4gMCAmJiAhY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdGFnID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdHJldHVybiBJTkxJTkVfRUxFTUVOVFMuaGFzKHRhZyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmIChoYXNPbmx5QmxvY2tFbGVtZW50cykge1xuXHRcdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHRcdHdoaWxlIChkaXYuZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZGl2LmZpcnN0Q2hpbGQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgoZnJhZ21lbnQpO1xuXHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FzZSAzOiBXcmFwcGVyIGRpdiAtIG1lcmdlIHVwIGFnZ3Jlc3NpdmVseVxuXHRcdFx0aWYgKGlzV3JhcHBlckRpdihkaXYpKSB7XG5cdFx0XHRcdC8vIFNwZWNpYWwgY2FzZTogaWYgZGl2IG9ubHkgY29udGFpbnMgYmxvY2sgZWxlbWVudHMsIG1lcmdlIHRoZW0gdXBcblx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGRpdi5jaGlsZHJlbik7XG5cdFx0XHRcdGNvbnN0IG9ubHlCbG9ja0VsZW1lbnRzID0gIWNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHRhZyA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRyZXR1cm4gSU5MSU5FX0VMRU1FTlRTLmhhcyh0YWcpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChvbmx5QmxvY2tFbGVtZW50cykge1xuXHRcdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHRcdHdoaWxlIChkaXYuZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZGl2LmZpcnN0Q2hpbGQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgoZnJhZ21lbnQpO1xuXHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPdGhlcndpc2UgaGFuZGxlIGFzIG5vcm1hbCB3cmFwcGVyXG5cdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHR3aGlsZSAoZGl2LmZpcnN0Q2hpbGQpIHtcblx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhc2UgNDogRGl2IG9ubHkgY29udGFpbnMgdGV4dCBjb250ZW50IC0gY29udmVydCB0byBwYXJhZ3JhcGhcblx0XHRcdGlmICghZGl2LmNoaWxkcmVuLmxlbmd0aCAmJiBkaXYudGV4dENvbnRlbnQ/LnRyaW0oKSkge1xuXHRcdFx0XHRjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRwLnRleHRDb250ZW50ID0gZGl2LnRleHRDb250ZW50O1xuXHRcdFx0XHRkaXYucmVwbGFjZVdpdGgocCk7XG5cdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDYXNlIDU6IERpdiBoYXMgc2luZ2xlIGNoaWxkXG5cdFx0XHRpZiAoZGl2LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRjb25zdCBjaGlsZCA9IGRpdi5maXJzdEVsZW1lbnRDaGlsZCE7XG5cdFx0XHRcdGNvbnN0IGNoaWxkVGFnID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gRG9uJ3QgdW53cmFwIGlmIGNoaWxkIGlzIGlubGluZSBvciBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRcdGlmICghSU5MSU5FX0VMRU1FTlRTLmhhcyhjaGlsZFRhZykgJiYgIXNob3VsZFByZXNlcnZlRWxlbWVudChjaGlsZCkpIHtcblx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgoY2hpbGQpO1xuXHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FzZSA2OiBEZWVwbHkgbmVzdGVkIGRpdiAtIG1lcmdlIHVwXG5cdFx0XHRsZXQgbmVzdGluZ0RlcHRoID0gMDtcblx0XHRcdGxldCBwYXJlbnQgPSBkaXYucGFyZW50RWxlbWVudDtcblx0XHRcdHdoaWxlIChwYXJlbnQpIHtcblx0XHRcdFx0aWYgKHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdkaXYnKSB7XG5cdFx0XHRcdFx0bmVzdGluZ0RlcHRoKys7XG5cdFx0XHRcdH1cblx0XHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZXN0aW5nRGVwdGggPiAwKSB7IC8vIENoYW5nZWQgZnJvbSA+IDEgdG8gPiAwIHRvIGJlIG1vcmUgYWdncmVzc2l2ZVxuXHRcdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0d2hpbGUgKGRpdi5maXJzdENoaWxkKSB7XG5cdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZGl2LmZpcnN0Q2hpbGQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChmcmFnbWVudCk7XG5cdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHRcdC8vIEZpcnN0IHBhc3M6IFByb2Nlc3MgdG9wLWxldmVsIGRpdnNcblx0XHRjb25zdCBwcm9jZXNzVG9wTGV2ZWxEaXZzID0gKCkgPT4ge1xuXHRcdFx0Y29uc3QgdG9wRGl2cyA9IEFycmF5LmZyb20oZWxlbWVudC5jaGlsZHJlbikuZmlsdGVyKFxuXHRcdFx0XHRlbCA9PiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdkaXYnXG5cdFx0XHQpO1xuXHRcdFx0XG5cdFx0XHRsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblx0XHRcdHRvcERpdnMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRpZiAocHJvY2Vzc0RpdihkaXYpKSB7XG5cdFx0XHRcdFx0bW9kaWZpZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBtb2RpZmllZDtcblx0XHR9O1xuXG5cdFx0Ly8gU2Vjb25kIHBhc3M6IFByb2Nlc3MgcmVtYWluaW5nIGRpdnMgZnJvbSBkZWVwZXN0IHRvIHNoYWxsb3dlc3Rcblx0XHRjb25zdCBwcm9jZXNzUmVtYWluaW5nRGl2cyA9ICgpID0+IHtcblx0XHRcdGNvbnN0IGFsbERpdnMgPSBBcnJheS5mcm9tKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpKVxuXHRcdFx0XHQuc29ydCgoYSwgYikgPT4ge1xuXHRcdFx0XHRcdC8vIENvdW50IG5lc3RpbmcgZGVwdGhcblx0XHRcdFx0XHRjb25zdCBnZXREZXB0aCA9IChlbDogRWxlbWVudCk6IG51bWJlciA9PiB7XG5cdFx0XHRcdFx0XHRsZXQgZGVwdGggPSAwO1xuXHRcdFx0XHRcdFx0bGV0IHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0XHR3aGlsZSAocGFyZW50KSB7XG5cdFx0XHRcdFx0XHRcdGlmIChwYXJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGl2JykgZGVwdGgrKztcblx0XHRcdFx0XHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gZGVwdGg7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0RGVwdGgoYikgLSBnZXREZXB0aChhKTsgLy8gUHJvY2VzcyBkZWVwZXN0IGZpcnN0XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblx0XHRcdGFsbERpdnMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRpZiAocHJvY2Vzc0RpdihkaXYpKSB7XG5cdFx0XHRcdFx0bW9kaWZpZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBtb2RpZmllZDtcblx0XHR9O1xuXG5cdFx0Ly8gRmluYWwgY2xlYW51cCBwYXNzIC0gYWdncmVzc2l2ZWx5IGZsYXR0ZW4gcmVtYWluaW5nIGRpdnNcblx0XHRjb25zdCBmaW5hbENsZWFudXAgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCByZW1haW5pbmdEaXZzID0gQXJyYXkuZnJvbShlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKSk7XG5cdFx0XHRsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblx0XHRcdFxuXHRcdFx0cmVtYWluaW5nRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdC8vIENoZWNrIGlmIGRpdiBvbmx5IGNvbnRhaW5zIHBhcmFncmFwaHNcblx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGRpdi5jaGlsZHJlbik7XG5cdFx0XHRcdGNvbnN0IG9ubHlQYXJhZ3JhcGhzID0gY2hpbGRyZW4uZXZlcnkoY2hpbGQgPT4gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAncCcpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKG9ubHlQYXJhZ3JhcGhzIHx8ICghc2hvdWxkUHJlc2VydmVFbGVtZW50KGRpdikgJiYgaXNXcmFwcGVyRGl2KGRpdikpKSB7XG5cdFx0XHRcdFx0Y29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0XHRcdFx0d2hpbGUgKGRpdi5maXJzdENoaWxkKSB7XG5cdFx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChmcmFnbWVudCk7XG5cdFx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0XHRtb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG1vZGlmaWVkO1xuXHRcdH07XG5cblx0XHQvLyBFeGVjdXRlIGFsbCBwYXNzZXMgdW50aWwgbm8gbW9yZSBjaGFuZ2VzXG5cdFx0ZG8ge1xuXHRcdFx0XHRrZWVwUHJvY2Vzc2luZyA9IGZhbHNlO1xuXHRcdFx0XHRpZiAocHJvY2Vzc1RvcExldmVsRGl2cygpKSBrZWVwUHJvY2Vzc2luZyA9IHRydWU7XG5cdFx0XHRcdGlmIChwcm9jZXNzUmVtYWluaW5nRGl2cygpKSBrZWVwUHJvY2Vzc2luZyA9IHRydWU7XG5cdFx0XHRcdGlmIChmaW5hbENsZWFudXAoKSkga2VlcFByb2Nlc3NpbmcgPSB0cnVlO1xuXHRcdFx0fSB3aGlsZSAoa2VlcFByb2Nlc3NpbmcpO1xuXG5cdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdHRoaXMuX2xvZygnRmxhdHRlbmVkIGRpdnM6Jywge1xuXHRcdFx0Y291bnQ6IHByb2Nlc3NlZENvdW50LFxuXHRcdFx0cHJvY2Vzc2luZ1RpbWU6IGAkeyhlbmRUaW1lIC0gc3RhcnRUaW1lKS50b0ZpeGVkKDIpfW1zYFxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjbGVhbkNvbnRlbnQoZWxlbWVudDogRWxlbWVudCwgbWV0YWRhdGE6IERlZnVkZGxlTWV0YWRhdGEpIHtcblx0XHQvLyBSZW1vdmUgSFRNTCBjb21tZW50c1xuXHRcdHRoaXMucmVtb3ZlSHRtbENvbW1lbnRzKGVsZW1lbnQpO1xuXHRcdFxuXHRcdC8vIEhhbmRsZSBIMSBlbGVtZW50cyAtIHJlbW92ZSBmaXJzdCBvbmUgYW5kIGNvbnZlcnQgb3RoZXJzIHRvIEgyXG5cdFx0dGhpcy5oYW5kbGVIZWFkaW5ncyhlbGVtZW50LCBtZXRhZGF0YS50aXRsZSk7XG5cdFx0XG5cdFx0Ly8gU3RhbmRhcmRpemUgZm9vdG5vdGVzIGFuZCBjaXRhdGlvbnNcblx0XHR0aGlzLnN0YW5kYXJkaXplRm9vdG5vdGVzKGVsZW1lbnQpO1xuXG5cdFx0Ly8gSGFuZGxlIGxhenktbG9hZGVkIGltYWdlc1xuXHRcdHRoaXMuaGFuZGxlTGF6eUltYWdlcyhlbGVtZW50KTtcblxuXHRcdC8vIENvbnZlcnQgZW1iZWRkZWQgY29udGVudCB0byBzdGFuZGFyZCBmb3JtYXRzXG5cdFx0dGhpcy5zdGFuZGFyZGl6ZUVsZW1lbnRzKGVsZW1lbnQpO1xuXG5cdFx0Ly8gU2tpcCBkaXYgZmxhdHRlbmluZyBpbiBkZWJ1ZyBtb2RlXG5cdFx0aWYgKCF0aGlzLmRlYnVnKSB7XG5cdFx0XHQvLyBGaXJzdCBwYXNzIG9mIGRpdiBmbGF0dGVuaW5nXG5cdFx0XHR0aGlzLmZsYXR0ZW5EaXZzKGVsZW1lbnQpO1xuXHRcdFx0XG5cdFx0XHQvLyBTdHJpcCB1bndhbnRlZCBhdHRyaWJ1dGVzXG5cdFx0XHR0aGlzLnN0cmlwVW53YW50ZWRBdHRyaWJ1dGVzKGVsZW1lbnQpO1xuXG5cdFx0XHQvLyBSZW1vdmUgZW1wdHkgZWxlbWVudHNcblx0XHRcdHRoaXMucmVtb3ZlRW1wdHlFbGVtZW50cyhlbGVtZW50KTtcblxuXHRcdFx0Ly8gUmVtb3ZlIHRyYWlsaW5nIGhlYWRpbmdzXG5cdFx0XHR0aGlzLnJlbW92ZVRyYWlsaW5nSGVhZGluZ3MoZWxlbWVudCk7XG5cblx0XHRcdC8vIEZpbmFsIHBhc3Mgb2YgZGl2IGZsYXR0ZW5pbmcgYWZ0ZXIgY2xlYW51cCBvcGVyYXRpb25zXG5cdFx0XHR0aGlzLmZsYXR0ZW5EaXZzKGVsZW1lbnQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBJbiBkZWJ1ZyBtb2RlLCBzdGlsbCBkbyBiYXNpYyBjbGVhbnVwIGJ1dCBwcmVzZXJ2ZSBzdHJ1Y3R1cmVcblx0XHRcdHRoaXMuc3RyaXBVbndhbnRlZEF0dHJpYnV0ZXMoZWxlbWVudCk7XG5cdFx0XHR0aGlzLnJlbW92ZUVtcHR5RWxlbWVudHMoZWxlbWVudCk7XG5cdFx0XHR0aGlzLnJlbW92ZVRyYWlsaW5nSGVhZGluZ3MoZWxlbWVudCk7XG5cdFx0XHR0aGlzLl9sb2coJ0RlYnVnIG1vZGU6IFNraXBwaW5nIGRpdiBmbGF0dGVuaW5nIHRvIHByZXNlcnZlIHN0cnVjdHVyZScpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlVHJhaWxpbmdIZWFkaW5ncyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHJlbW92ZWRDb3VudCA9IDA7XG5cblx0XHRjb25zdCBoYXNDb250ZW50QWZ0ZXIgPSAoZWw6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdC8vIENoZWNrIGlmIHRoZXJlJ3MgYW55IG1lYW5pbmdmdWwgY29udGVudCBhZnRlciB0aGlzIGVsZW1lbnRcblx0XHRcdGxldCBuZXh0Q29udGVudCA9ICcnO1xuXHRcdFx0bGV0IHNpYmxpbmcgPSBlbC5uZXh0U2libGluZztcblxuXHRcdFx0Ly8gRmlyc3QgY2hlY2sgZGlyZWN0IHNpYmxpbmdzXG5cdFx0XHR3aGlsZSAoc2libGluZykge1xuXHRcdFx0XHRpZiAoc2libGluZy5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdFx0XHRuZXh0Q29udGVudCArPSBzaWJsaW5nLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG5cdFx0XHRcdFx0Ly8gSWYgd2UgZmluZCBhbiBlbGVtZW50IHNpYmxpbmcsIGNoZWNrIGl0cyBjb250ZW50XG5cdFx0XHRcdFx0bmV4dENvbnRlbnQgKz0gKHNpYmxpbmcgYXMgRWxlbWVudCkudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHdlIGZvdW5kIG1lYW5pbmdmdWwgY29udGVudCBhdCB0aGlzIGxldmVsLCByZXR1cm4gdHJ1ZVxuXHRcdFx0aWYgKG5leHRDb250ZW50LnRyaW0oKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgbm8gY29udGVudCBmb3VuZCBhdCB0aGlzIGxldmVsIGFuZCB3ZSBoYXZlIGEgcGFyZW50LFxuXHRcdFx0Ly8gY2hlY2sgZm9yIGNvbnRlbnQgYWZ0ZXIgdGhlIHBhcmVudFxuXHRcdFx0Y29uc3QgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudDtcblx0XHRcdGlmIChwYXJlbnQgJiYgcGFyZW50ICE9PSBlbGVtZW50KSB7XG5cdFx0XHRcdHJldHVybiBoYXNDb250ZW50QWZ0ZXIocGFyZW50KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0XHQvLyBQcm9jZXNzIGFsbCBoZWFkaW5ncyBmcm9tIGJvdHRvbSB0byB0b3Bcblx0XHRjb25zdCBoZWFkaW5ncyA9IEFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdoMSwgaDIsIGgzLCBoNCwgaDUsIGg2JykpXG5cdFx0XHQucmV2ZXJzZSgpO1xuXG5cdFx0aGVhZGluZ3MuZm9yRWFjaChoZWFkaW5nID0+IHtcblx0XHRcdGlmICghaGFzQ29udGVudEFmdGVyKGhlYWRpbmcpKSB7XG5cdFx0XHRcdGhlYWRpbmcucmVtb3ZlKCk7XG5cdFx0XHRcdHJlbW92ZWRDb3VudCsrO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gU3RvcCBwcm9jZXNzaW5nIG9uY2Ugd2UgZmluZCBhIGhlYWRpbmcgd2l0aCBjb250ZW50IGFmdGVyIGl0XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmIChyZW1vdmVkQ291bnQgPiAwKSB7XG5cdFx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgdHJhaWxpbmcgaGVhZGluZ3M6JywgcmVtb3ZlZENvdW50KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUhlYWRpbmdzKGVsZW1lbnQ6IEVsZW1lbnQsIHRpdGxlOiBzdHJpbmcpIHtcblx0XHRjb25zdCBoMXMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMScpO1xuXG5cdFx0QXJyYXkuZnJvbShoMXMpLmZvckVhY2goaDEgPT4ge1xuXHRcdFx0Y29uc3QgaDIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuXHRcdFx0aDIuaW5uZXJIVE1MID0gaDEuaW5uZXJIVE1MO1xuXHRcdFx0Ly8gQ29weSBhbGxvd2VkIGF0dHJpYnV0ZXNcblx0XHRcdEFycmF5LmZyb20oaDEuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0aWYgKEFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ci5uYW1lKSkge1xuXHRcdFx0XHRcdGgyLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGgxLnBhcmVudE5vZGU/LnJlcGxhY2VDaGlsZChoMiwgaDEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gUmVtb3ZlIGZpcnN0IEgyIGlmIGl0IG1hdGNoZXMgdGl0bGVcblx0XHRjb25zdCBoMnMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMicpO1xuXHRcdGlmIChoMnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgZmlyc3RIMiA9IGgyc1swXTtcblx0XHRcdGNvbnN0IGZpcnN0SDJUZXh0ID0gZmlyc3RIMi50ZXh0Q29udGVudD8udHJpbSgpLnRvTG93ZXJDYXNlKCkgfHwgJyc7XG5cdFx0XHRjb25zdCBub3JtYWxpemVkVGl0bGUgPSB0aXRsZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdGlmIChub3JtYWxpemVkVGl0bGUgJiYgbm9ybWFsaXplZFRpdGxlID09PSBmaXJzdEgyVGV4dCkge1xuXHRcdFx0XHRmaXJzdEgyLnJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlSHRtbENvbW1lbnRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRjb25zdCBjb21tZW50czogQ29tbWVudFtdID0gW107XG5cdFx0Y29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcblx0XHRcdGVsZW1lbnQsXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCxcblx0XHRcdG51bGxcblx0XHQpO1xuXG5cdFx0bGV0IG5vZGU7XG5cdFx0d2hpbGUgKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0Y29tbWVudHMucHVzaChub2RlIGFzIENvbW1lbnQpO1xuXHRcdH1cblxuXHRcdGNvbW1lbnRzLmZvckVhY2goY29tbWVudCA9PiB7XG5cdFx0XHRjb21tZW50LnJlbW92ZSgpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIEhUTUwgY29tbWVudHM6JywgY29tbWVudHMubGVuZ3RoKTtcblx0fVxuXG5cdHByaXZhdGUgc3RyaXBVbndhbnRlZEF0dHJpYnV0ZXMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCBhdHRyaWJ1dGVDb3VudCA9IDA7XG5cblx0XHRjb25zdCBwcm9jZXNzRWxlbWVudCA9IChlbDogRWxlbWVudCkgPT4ge1xuXHRcdFx0Ly8gU2tpcCBTVkcgZWxlbWVudHMgLSBwcmVzZXJ2ZSBhbGwgdGhlaXIgYXR0cmlidXRlc1xuXHRcdFx0aWYgKGVsIGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGF0dHJpYnV0ZXMgPSBBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpO1xuXHRcdFx0XG5cdFx0XHRhdHRyaWJ1dGVzLmZvckVhY2goYXR0ciA9PiB7XG5cdFx0XHRcdGNvbnN0IGF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdC8vIEluIGRlYnVnIG1vZGUsIGFsbG93IGRlYnVnIGF0dHJpYnV0ZXMgYW5kIGRhdGEtIGF0dHJpYnV0ZXNcblx0XHRcdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdFx0XHRpZiAoIUFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ck5hbWUpICYmIFxuXHRcdFx0XHRcdFx0IUFMTE9XRURfQVRUUklCVVRFU19ERUJVRy5oYXMoYXR0ck5hbWUpICYmIFxuXHRcdFx0XHRcdFx0IWF0dHJOYW1lLnN0YXJ0c1dpdGgoJ2RhdGEtJykpIHtcblx0XHRcdFx0XHRcdGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpO1xuXHRcdFx0XHRcdFx0YXR0cmlidXRlQ291bnQrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gSW4gbm9ybWFsIG1vZGUsIG9ubHkgYWxsb3cgc3RhbmRhcmQgYXR0cmlidXRlc1xuXHRcdFx0XHRcdGlmICghQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyTmFtZSkpIHtcblx0XHRcdFx0XHRcdGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpO1xuXHRcdFx0XHRcdFx0YXR0cmlidXRlQ291bnQrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRwcm9jZXNzRWxlbWVudChlbGVtZW50KTtcblx0XHRlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyonKS5mb3JFYWNoKHByb2Nlc3NFbGVtZW50KTtcblxuXHRcdHRoaXMuX2xvZygnU3RyaXBwZWQgYXR0cmlidXRlczonLCBhdHRyaWJ1dGVDb3VudCk7XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZUVtcHR5RWxlbWVudHMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCByZW1vdmVkQ291bnQgPSAwO1xuXHRcdGxldCBpdGVyYXRpb25zID0gMDtcblx0XHRsZXQga2VlcFJlbW92aW5nID0gdHJ1ZTtcblxuXHRcdHdoaWxlIChrZWVwUmVtb3ZpbmcpIHtcblx0XHRcdGl0ZXJhdGlvbnMrKztcblx0XHRcdGtlZXBSZW1vdmluZyA9IGZhbHNlO1xuXHRcdFx0Ly8gR2V0IGFsbCBlbGVtZW50cyB3aXRob3V0IGNoaWxkcmVuLCB3b3JraW5nIGZyb20gZGVlcGVzdCBmaXJzdFxuXHRcdFx0Y29uc3QgZW1wdHlFbGVtZW50cyA9IEFycmF5LmZyb20oZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpKS5maWx0ZXIoZWwgPT4ge1xuXHRcdFx0XHRpZiAoQUxMT1dFRF9FTVBUWV9FTEVNRU5UUy5oYXMoZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgZWxlbWVudCBoYXMgb25seSB3aGl0ZXNwYWNlIG9yICZuYnNwO1xuXHRcdFx0XHRjb25zdCB0ZXh0Q29udGVudCA9IGVsLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHRjb25zdCBoYXNPbmx5V2hpdGVzcGFjZSA9IHRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPT09IDA7XG5cdFx0XHRcdGNvbnN0IGhhc05ic3AgPSB0ZXh0Q29udGVudC5pbmNsdWRlcygnXFx1MDBBMCcpOyAvLyBVbmljb2RlIG5vbi1icmVha2luZyBzcGFjZVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgZWxlbWVudCBoYXMgbm8gbWVhbmluZ2Z1bCBjaGlsZHJlblxuXHRcdFx0XHRjb25zdCBoYXNOb0NoaWxkcmVuID0gIWVsLmhhc0NoaWxkTm9kZXMoKSB8fCBcblx0XHRcdFx0XHQoQXJyYXkuZnJvbShlbC5jaGlsZE5vZGVzKS5ldmVyeShub2RlID0+IHtcblx0XHRcdFx0XHRcdGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBub2RlVGV4dCA9IG5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBub2RlVGV4dC50cmltKCkubGVuZ3RoID09PSAwICYmICFub2RlVGV4dC5pbmNsdWRlcygnXFx1MDBBMCcpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH0pKTtcblxuXHRcdFx0XHQvLyBTcGVjaWFsIGNhc2U6IENoZWNrIGZvciBkaXZzIHRoYXQgb25seSBjb250YWluIHNwYW5zIHdpdGggY29tbWFzXG5cdFx0XHRcdGlmIChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdkaXYnKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGVsLmNoaWxkcmVuKTtcblx0XHRcdFx0XHRjb25zdCBoYXNPbmx5Q29tbWFTcGFucyA9IGNoaWxkcmVuLmxlbmd0aCA+IDAgJiYgY2hpbGRyZW4uZXZlcnkoY2hpbGQgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ3NwYW4nKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHRjb25zdCBjb250ZW50ID0gY2hpbGQudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblx0XHRcdFx0XHRcdHJldHVybiBjb250ZW50ID09PSAnLCcgfHwgY29udGVudCA9PT0gJycgfHwgY29udGVudCA9PT0gJyAnO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGlmIChoYXNPbmx5Q29tbWFTcGFucykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gaGFzT25seVdoaXRlc3BhY2UgJiYgIWhhc05ic3AgJiYgaGFzTm9DaGlsZHJlbjtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoZW1wdHlFbGVtZW50cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGVtcHR5RWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRcdFx0ZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0cmVtb3ZlZENvdW50Kys7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRrZWVwUmVtb3ZpbmcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuX2xvZygnUmVtb3ZlZCBlbXB0eSBlbGVtZW50czonLCB7XG5cdFx0XHRjb3VudDogcmVtb3ZlZENvdW50LFxuXHRcdFx0aXRlcmF0aW9uc1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVGb290bm90ZUl0ZW0oXG5cdFx0Zm9vdG5vdGVOdW1iZXI6IG51bWJlcixcblx0XHRjb250ZW50OiBzdHJpbmcgfCBFbGVtZW50LFxuXHRcdHJlZnM6IHN0cmluZ1tdXG5cdCk6IEhUTUxMSUVsZW1lbnQge1xuXHRcdGNvbnN0IG5ld0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdG5ld0l0ZW0uY2xhc3NOYW1lID0gJ2Zvb3Rub3RlJztcblx0XHRuZXdJdGVtLmlkID0gYGZuOiR7Zm9vdG5vdGVOdW1iZXJ9YDtcblxuXHRcdC8vIEhhbmRsZSBjb250ZW50XG5cdFx0aWYgKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykge1xuXHRcdFx0Y29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0cGFyYWdyYXBoLmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cdFx0XHRuZXdJdGVtLmFwcGVuZENoaWxkKHBhcmFncmFwaCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEdldCBhbGwgcGFyYWdyYXBocyBmcm9tIHRoZSBjb250ZW50XG5cdFx0XHRjb25zdCBwYXJhZ3JhcGhzID0gQXJyYXkuZnJvbShjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3AnKSk7XG5cdFx0XHRpZiAocGFyYWdyYXBocy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0Ly8gSWYgbm8gcGFyYWdyYXBocywgd3JhcCBjb250ZW50IGluIGEgcGFyYWdyYXBoXG5cdFx0XHRcdGNvbnN0IHBhcmFncmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0cGFyYWdyYXBoLmlubmVySFRNTCA9IGNvbnRlbnQuaW5uZXJIVE1MO1xuXHRcdFx0XHRuZXdJdGVtLmFwcGVuZENoaWxkKHBhcmFncmFwaCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBDb3B5IGV4aXN0aW5nIHBhcmFncmFwaHNcblx0XHRcdFx0cGFyYWdyYXBocy5mb3JFYWNoKHAgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IG5ld1AgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcdFx0bmV3UC5pbm5lckhUTUwgPSBwLmlubmVySFRNTDtcblx0XHRcdFx0XHRuZXdJdGVtLmFwcGVuZENoaWxkKG5ld1ApO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBBZGQgYmFja2xpbmsocykgdG8gdGhlIGxhc3QgcGFyYWdyYXBoXG5cdFx0Y29uc3QgbGFzdFBhcmFncmFwaCA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcigncDpsYXN0LW9mLXR5cGUnKSB8fCBuZXdJdGVtO1xuXHRcdHJlZnMuZm9yRWFjaCgocmVmSWQsIGluZGV4KSA9PiB7XG5cdFx0XHRjb25zdCBiYWNrbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblx0XHRcdGJhY2tsaW5rLmhyZWYgPSBgIyR7cmVmSWR9YDtcblx0XHRcdGJhY2tsaW5rLnRpdGxlID0gJ3JldHVybiB0byBhcnRpY2xlJztcblx0XHRcdGJhY2tsaW5rLmNsYXNzTmFtZSA9ICdmb290bm90ZS1iYWNrcmVmJztcblx0XHRcdGJhY2tsaW5rLmlubmVySFRNTCA9ICfihqknO1xuXHRcdFx0aWYgKGluZGV4IDwgcmVmcy5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdGJhY2tsaW5rLmlubmVySFRNTCArPSAnICc7XG5cdFx0XHR9XG5cdFx0XHRsYXN0UGFyYWdyYXBoLmFwcGVuZENoaWxkKGJhY2tsaW5rKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBuZXdJdGVtO1xuXHR9XG5cblx0cHJpdmF0ZSBjb2xsZWN0Rm9vdG5vdGVzKGVsZW1lbnQ6IEVsZW1lbnQpOiBGb290bm90ZUNvbGxlY3Rpb24ge1xuXHRcdGNvbnN0IGZvb3Rub3RlczogRm9vdG5vdGVDb2xsZWN0aW9uID0ge307XG5cdFx0bGV0IGZvb3Rub3RlQ291bnQgPSAxO1xuXHRcdGNvbnN0IHByb2Nlc3NlZElkcyA9IG5ldyBTZXQ8c3RyaW5nPigpOyAvLyBUcmFjayBwcm9jZXNzZWQgSURzXG5cblx0XHQvLyBDb2xsZWN0IGFsbCBmb290bm90ZXMgYW5kIHRoZWlyIElEcyBmcm9tIGZvb3Rub3RlIGxpc3RzXG5cdFx0Y29uc3QgZm9vdG5vdGVMaXN0cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChGT09UTk9URV9MSVNUX1NFTEVDVE9SUyk7XG5cdFx0Zm9vdG5vdGVMaXN0cy5mb3JFYWNoKGxpc3QgPT4ge1xuXHRcdFx0Ly8gU3Vic3RhY2sgaGFzIGluZGl2aWR1YWwgZm9vdG5vdGUgZGl2cyB3aXRoIG5vIHBhcmVudFxuXHRcdFx0aWYgKGxpc3QubWF0Y2hlcygnZGl2LmZvb3Rub3RlW2RhdGEtY29tcG9uZW50LW5hbWU9XCJGb290bm90ZVRvRE9NXCJdJykpIHtcblx0XHRcdFx0Y29uc3QgYW5jaG9yID0gbGlzdC5xdWVyeVNlbGVjdG9yKCdhLmZvb3Rub3RlLW51bWJlcicpO1xuXHRcdFx0XHRjb25zdCBjb250ZW50ID0gbGlzdC5xdWVyeVNlbGVjdG9yKCcuZm9vdG5vdGUtY29udGVudCcpO1xuXHRcdFx0XHRpZiAoYW5jaG9yICYmIGNvbnRlbnQpIHtcblx0XHRcdFx0XHRjb25zdCBpZCA9IGFuY2hvci5pZC5yZXBsYWNlKCdmb290bm90ZS0nLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRpZiAoaWQgJiYgIXByb2Nlc3NlZElkcy5oYXMoaWQpKSB7XG5cdFx0XHRcdFx0XHRmb290bm90ZXNbZm9vdG5vdGVDb3VudF0gPSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnQsXG5cdFx0XHRcdFx0XHRcdG9yaWdpbmFsSWQ6IGlkLFxuXHRcdFx0XHRcdFx0XHRyZWZzOiBbXVxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdHByb2Nlc3NlZElkcy5hZGQoaWQpO1xuXHRcdFx0XHRcdFx0Zm9vdG5vdGVDb3VudCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbW1vbiBmb3JtYXQgdXNpbmcgT0wvVUwgYW5kIExJIGVsZW1lbnRzXG5cdFx0XHRjb25zdCBpdGVtcyA9IGxpc3QucXVlcnlTZWxlY3RvckFsbCgnbGksIGRpdltyb2xlPVwibGlzdGl0ZW1cIl0nKTtcblx0XHRcdGl0ZW1zLmZvckVhY2gobGkgPT4ge1xuXHRcdFx0XHRsZXQgaWQgPSAnJztcblx0XHRcdFx0bGV0IGNvbnRlbnQ6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuXHRcdFx0XHQvLyBIYW5kbGUgY2l0YXRpb25zIHdpdGggLmNpdGF0aW9ucyBjbGFzc1xuXHRcdFx0XHRjb25zdCBjaXRhdGlvbnNEaXYgPSBsaS5xdWVyeVNlbGVjdG9yKCcuY2l0YXRpb25zJyk7XG5cdFx0XHRcdGlmIChjaXRhdGlvbnNEaXY/LmlkPy50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3InKSkge1xuXHRcdFx0XHRcdGlkID0gY2l0YXRpb25zRGl2LmlkLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0Ly8gTG9vayBmb3IgY2l0YXRpb24gY29udGVudCB3aXRoaW4gdGhlIGNpdGF0aW9ucyBkaXZcblx0XHRcdFx0XHRjb25zdCBjaXRhdGlvbkNvbnRlbnQgPSBjaXRhdGlvbnNEaXYucXVlcnlTZWxlY3RvcignLmNpdGF0aW9uLWNvbnRlbnQnKTtcblx0XHRcdFx0XHRpZiAoY2l0YXRpb25Db250ZW50KSB7XG5cdFx0XHRcdFx0XHRjb250ZW50ID0gY2l0YXRpb25Db250ZW50O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBFeHRyYWN0IElEIGZyb20gdmFyaW91cyBmb3JtYXRzXG5cdFx0XHRcdFx0aWYgKGxpLmlkLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnYmliLmJpYicpKSB7XG5cdFx0XHRcdFx0XHRpZCA9IGxpLmlkLnJlcGxhY2UoJ2JpYi5iaWInLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGxpLmlkLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZm46JykpIHtcblx0XHRcdFx0XHRcdGlkID0gbGkuaWQucmVwbGFjZSgnZm46JywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChsaS5pZC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2ZuJykpIHtcblx0XHRcdFx0XHRcdGlkID0gbGkuaWQucmVwbGFjZSgnZm4nLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHQvLyBOYXR1cmUuY29tXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChsaS5oYXNBdHRyaWJ1dGUoJ2RhdGEtY291bnRlcicpKSB7XG5cdFx0XHRcdFx0XHRpZCA9IGxpLmdldEF0dHJpYnV0ZSgnZGF0YS1jb3VudGVyJyk/LnJlcGxhY2UoL1xcLiQvLCAnJyk/LnRvTG93ZXJDYXNlKCkgfHwgJyc7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoID0gbGkuaWQuc3BsaXQoJy8nKS5wb3AoKT8ubWF0Y2goL2NpdGVfbm90ZS0oLispLyk7XG5cdFx0XHRcdFx0XHRpZCA9IG1hdGNoID8gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKSA6IGxpLmlkLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnRlbnQgPSBsaTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpZCAmJiAhcHJvY2Vzc2VkSWRzLmhhcyhpZCkpIHtcblx0XHRcdFx0XHRmb290bm90ZXNbZm9vdG5vdGVDb3VudF0gPSB7XG5cdFx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50IHx8IGxpLFxuXHRcdFx0XHRcdFx0b3JpZ2luYWxJZDogaWQsXG5cdFx0XHRcdFx0XHRyZWZzOiBbXVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cHJvY2Vzc2VkSWRzLmFkZChpZCk7XG5cdFx0XHRcdFx0Zm9vdG5vdGVDb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBmb290bm90ZXM7XG5cdH1cblxuXHRwcml2YXRlIGZpbmRPdXRlckZvb3Rub3RlQ29udGFpbmVyKGVsOiBFbGVtZW50KTogRWxlbWVudCB7XG5cdFx0bGV0IGN1cnJlbnQ6IEVsZW1lbnQgfCBudWxsID0gZWw7XG5cdFx0bGV0IHBhcmVudDogRWxlbWVudCB8IG51bGwgPSBlbC5wYXJlbnRFbGVtZW50O1xuXHRcdFxuXHRcdC8vIEtlZXAgZ29pbmcgdXAgdW50aWwgd2UgZmluZCBhbiBlbGVtZW50IHRoYXQncyBub3QgYSBzcGFuIG9yIHN1cFxuXHRcdHdoaWxlIChwYXJlbnQgJiYgKFxuXHRcdFx0cGFyZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3NwYW4nIHx8IFxuXHRcdFx0cGFyZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3N1cCdcblx0XHQpKSB7XG5cdFx0XHRjdXJyZW50ID0gcGFyZW50O1xuXHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBjdXJyZW50O1xuXHR9XG5cblx0Ly8gRXZlcnkgZm9vdG5vdGUgcmVmZXJlbmNlIHNob3VsZCBiZSBhIHN1cCBlbGVtZW50IHdpdGggYW4gYW5jaG9yIGluc2lkZVxuXHQvLyBlLmcuIDxzdXAgaWQ9XCJmbnJlZjoxXCI+PGEgaHJlZj1cIiNmbjoxXCI+MTwvYT48L3N1cD5cblx0cHJpdmF0ZSBjcmVhdGVGb290bm90ZVJlZmVyZW5jZShmb290bm90ZU51bWJlcjogc3RyaW5nLCByZWZJZDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuXHRcdGNvbnN0IHN1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1cCcpO1xuXHRcdHN1cC5pZCA9IHJlZklkO1xuXHRcdGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdFx0bGluay5ocmVmID0gYCNmbjoke2Zvb3Rub3RlTnVtYmVyfWA7XG5cdFx0bGluay50ZXh0Q29udGVudCA9IGZvb3Rub3RlTnVtYmVyO1xuXHRcdHN1cC5hcHBlbmRDaGlsZChsaW5rKTtcblx0XHRyZXR1cm4gc3VwO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGFuZGFyZGl6ZUZvb3Rub3RlcyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0Y29uc3QgZm9vdG5vdGVzID0gdGhpcy5jb2xsZWN0Rm9vdG5vdGVzKGVsZW1lbnQpO1xuXG5cdFx0Ly8gU3RhbmRhcmRpemUgaW5saW5lIGZvb3Rub3RlcyB1c2luZyB0aGUgY29sbGVjdGVkIElEc1xuXHRcdGNvbnN0IGZvb3Rub3RlSW5saW5lUmVmZXJlbmNlcyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChGT09UTk9URV9JTkxJTkVfUkVGRVJFTkNFUyk7XG5cdFx0XG5cdFx0Ly8gR3JvdXAgcmVmZXJlbmNlcyBieSB0aGVpciBwYXJlbnQgc3VwIGVsZW1lbnRcblx0XHRjb25zdCBzdXBHcm91cHMgPSBuZXcgTWFwPEVsZW1lbnQsIEVsZW1lbnRbXT4oKTtcblx0XHRcblx0XHRmb290bm90ZUlubGluZVJlZmVyZW5jZXMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuO1xuXG5cdFx0XHRsZXQgZm9vdG5vdGVJZCA9ICcnO1xuXHRcdFx0bGV0IGZvb3Rub3RlQ29udGVudCA9ICcnO1xuXG5cdFx0XHQvLyBFeHRyYWN0IGZvb3Rub3RlIElEIGJhc2VkIG9uIGVsZW1lbnQgdHlwZVxuXHRcdFx0Ly8gTmF0dXJlLmNvbVxuXHRcdFx0aWYgKGVsLm1hdGNoZXMoJ2FbaWRePVwicmVmLWxpbmtcIl0nKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblx0XHRcdC8vIFNjaWVuY2Uub3JnXG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ2Fbcm9sZT1cImRvYy1iaWJsaW9yZWZcIl0nKSkge1xuXHRcdFx0XHRjb25zdCB4bWxSaWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEteG1sLXJpZCcpO1xuXHRcdFx0XHRpZiAoeG1sUmlkKSB7XG5cdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IHhtbFJpZDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zdCBocmVmID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cdFx0XHRcdFx0aWYgKGhyZWY/LnN0YXJ0c1dpdGgoJyNjb3JlLVInKSkge1xuXHRcdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IGhyZWYucmVwbGFjZSgnI2NvcmUtJywgJycpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0Ly8gU3Vic3RhY2tcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnYS5mb290bm90ZS1hbmNob3IsIHNwYW4uZm9vdG5vdGUtaG92ZXJjYXJkLXRhcmdldCBhJykpIHtcblx0XHRcdFx0Y29uc3QgaWQgPSBlbC5pZD8ucmVwbGFjZSgnZm9vdG5vdGUtYW5jaG9yLScsICcnKSB8fCAnJztcblx0XHRcdFx0aWYgKGlkKSB7XG5cdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IGlkLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdC8vIEFyeGl2XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ2NpdGUubHR4X2NpdGUnKSkge1xuXHRcdFx0XHRjb25zdCBsaW5rID0gZWwucXVlcnlTZWxlY3RvcignYScpO1xuXHRcdFx0XHRpZiAobGluaykge1xuXHRcdFx0XHRcdGNvbnN0IGhyZWYgPSBsaW5rLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuXHRcdFx0XHRcdGlmIChocmVmKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IGhyZWYuc3BsaXQoJy8nKS5wb3AoKT8ubWF0Y2goL2JpYlxcLmJpYihcXGQrKS8pO1xuXHRcdFx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdGZvb3Rub3RlSWQgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdzdXAucmVmZXJlbmNlJykpIHtcblx0XHRcdFx0Y29uc3QgbGlua3MgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCdhJyk7XG5cdFx0XHRcdEFycmF5LmZyb20obGlua3MpLmZvckVhY2gobGluayA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgaHJlZiA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cdFx0XHRcdFx0aWYgKGhyZWYpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoID0gaHJlZi5zcGxpdCgnLycpLnBvcCgpPy5tYXRjaCgvKD86Y2l0ZV9ub3RlfGNpdGVfcmVmKS0oLispLyk7XG5cdFx0XHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnc3VwW2lkXj1cImZucmVmOlwiXScpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC5pZC5yZXBsYWNlKCdmbnJlZjonLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnc3VwW2lkXj1cImZuclwiXScpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC5pZC5yZXBsYWNlKCdmbnInLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnc3Bhbi5mb290bm90ZS1yZWZlcmVuY2UnKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvb3Rub3RlLWlkJykgfHwgJyc7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ3NwYW4uZm9vdG5vdGUtbGluaycpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZm9vdG5vdGUtaWQnKSB8fCAnJztcblx0XHRcdFx0Zm9vdG5vdGVDb250ZW50ID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvb3Rub3RlLWNvbnRlbnQnKSB8fCAnJztcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnYS5jaXRhdGlvbicpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0XHRmb290bm90ZUNvbnRlbnQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnYVtpZF49XCJmbnJlZlwiXScpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC5pZC5yZXBsYWNlKCdmbnJlZicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gT3RoZXIgY2l0YXRpb24gdHlwZXNcblx0XHRcdFx0Y29uc3QgaHJlZiA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuXHRcdFx0XHRpZiAoaHJlZikge1xuXHRcdFx0XHRcdGNvbnN0IGlkID0gaHJlZi5yZXBsYWNlKC9eWyNdLywgJycpO1xuXHRcdFx0XHRcdGZvb3Rub3RlSWQgPSBpZC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmb290bm90ZUlkKSB7XG5cdFx0XHRcdC8vIEZpbmQgdGhlIGZvb3Rub3RlIG51bWJlciBieSBtYXRjaGluZyB0aGUgb3JpZ2luYWwgSURcblx0XHRcdFx0Y29uc3QgZm9vdG5vdGVFbnRyeSA9IE9iamVjdC5lbnRyaWVzKGZvb3Rub3RlcykuZmluZChcblx0XHRcdFx0XHQoW18sIGRhdGFdKSA9PiBkYXRhLm9yaWdpbmFsSWQgPT09IGZvb3Rub3RlSWQudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmIChmb290bm90ZUVudHJ5KSB7XG5cdFx0XHRcdFx0Y29uc3QgW2Zvb3Rub3RlTnVtYmVyLCBmb290bm90ZURhdGFdID0gZm9vdG5vdGVFbnRyeTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBDcmVhdGUgZm9vdG5vdGUgcmVmZXJlbmNlIElEXG5cdFx0XHRcdFx0Y29uc3QgcmVmSWQgPSBmb290bm90ZURhdGEucmVmcy5sZW5ndGggPiAwID8gXG5cdFx0XHRcdFx0XHRgZm5yZWY6JHtmb290bm90ZU51bWJlcn0tJHtmb290bm90ZURhdGEucmVmcy5sZW5ndGggKyAxfWAgOiBcblx0XHRcdFx0XHRcdGBmbnJlZjoke2Zvb3Rub3RlTnVtYmVyfWA7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Zm9vdG5vdGVEYXRhLnJlZnMucHVzaChyZWZJZCk7XG5cblx0XHRcdFx0XHQvLyBGaW5kIHRoZSBvdXRlcm1vc3QgY29udGFpbmVyIChzcGFuIG9yIHN1cClcblx0XHRcdFx0XHRjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRPdXRlckZvb3Rub3RlQ29udGFpbmVyKGVsKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBJZiBjb250YWluZXIgaXMgYSBzdXAsIGdyb3VwIHJlZmVyZW5jZXNcblx0XHRcdFx0XHRpZiAoY29udGFpbmVyLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3N1cCcpIHtcblx0XHRcdFx0XHRcdGlmICghc3VwR3JvdXBzLmhhcyhjb250YWluZXIpKSB7XG5cdFx0XHRcdFx0XHRcdHN1cEdyb3Vwcy5zZXQoY29udGFpbmVyLCBbXSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCBncm91cCA9IHN1cEdyb3Vwcy5nZXQoY29udGFpbmVyKSE7XG5cdFx0XHRcdFx0XHRncm91cC5wdXNoKHRoaXMuY3JlYXRlRm9vdG5vdGVSZWZlcmVuY2UoZm9vdG5vdGVOdW1iZXIsIHJlZklkKSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdC8vIFJlcGxhY2UgdGhlIGNvbnRhaW5lciBkaXJlY3RseVxuXHRcdFx0XHRcdFx0Y29udGFpbmVyLnJlcGxhY2VXaXRoKHRoaXMuY3JlYXRlRm9vdG5vdGVSZWZlcmVuY2UoZm9vdG5vdGVOdW1iZXIsIHJlZklkKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBIYW5kbGUgZ3JvdXBlZCByZWZlcmVuY2VzXG5cdFx0c3VwR3JvdXBzLmZvckVhY2goKHJlZmVyZW5jZXMsIGNvbnRhaW5lcikgPT4ge1xuXHRcdFx0aWYgKHJlZmVyZW5jZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQvLyBDcmVhdGUgYSBkb2N1bWVudCBmcmFnbWVudCB0byBob2xkIGFsbCB0aGUgcmVmZXJlbmNlc1xuXHRcdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEFkZCBlYWNoIHJlZmVyZW5jZSBhcyBpdHMgb3duIHN1cCBlbGVtZW50XG5cdFx0XHRcdHJlZmVyZW5jZXMuZm9yRWFjaCgocmVmLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGxpbmsgPSByZWYucXVlcnlTZWxlY3RvcignYScpO1xuXHRcdFx0XHRcdGlmIChsaW5rKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdXAnKTtcblx0XHRcdFx0XHRcdHN1cC5pZCA9IHJlZi5pZDtcblx0XHRcdFx0XHRcdHN1cC5hcHBlbmRDaGlsZChsaW5rLmNsb25lTm9kZSh0cnVlKSk7XG5cdFx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChzdXApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRjb250YWluZXIucmVwbGFjZVdpdGgoZnJhZ21lbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBzdGFuZGFyZGl6ZWQgZm9vdG5vdGUgbGlzdFxuXHRcdGNvbnN0IG5ld0xpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb290bm90ZXMnKTtcblx0XHRuZXdMaXN0LmNsYXNzTmFtZSA9ICdmb290bm90ZXMnO1xuXHRcdGNvbnN0IG9yZGVyZWRMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2wnKTtcblxuXHRcdC8vIENyZWF0ZSBmb290bm90ZSBpdGVtcyBpbiBvcmRlclxuXHRcdE9iamVjdC5lbnRyaWVzKGZvb3Rub3RlcykuZm9yRWFjaCgoW251bWJlciwgZGF0YV0pID0+IHtcblx0XHRcdGNvbnN0IG5ld0l0ZW0gPSB0aGlzLmNyZWF0ZUZvb3Rub3RlSXRlbShcblx0XHRcdFx0cGFyc2VJbnQobnVtYmVyKSxcblx0XHRcdFx0ZGF0YS5jb250ZW50LFxuXHRcdFx0XHRkYXRhLnJlZnNcblx0XHRcdCk7XG5cdFx0XHRvcmRlcmVkTGlzdC5hcHBlbmRDaGlsZChuZXdJdGVtKTtcblx0XHR9KTtcblxuXHRcdC8vIFJlbW92ZSBvcmlnaW5hbCBmb290bm90ZSBsaXN0c1xuXHRcdGNvbnN0IGZvb3Rub3RlTGlzdHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRk9PVE5PVEVfTElTVF9TRUxFQ1RPUlMpO1xuXHRcdGZvb3Rub3RlTGlzdHMuZm9yRWFjaChsaXN0ID0+IGxpc3QucmVtb3ZlKCkpO1xuXG5cdFx0Ly8gSWYgd2UgaGF2ZSBhbnkgZm9vdG5vdGVzLCBhZGQgdGhlIG5ldyBsaXN0IHRvIHRoZSBkb2N1bWVudFxuXHRcdGlmIChvcmRlcmVkTGlzdC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRuZXdMaXN0LmFwcGVuZENoaWxkKG9yZGVyZWRMaXN0KTtcblx0XHRcdGVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3TGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVMYXp5SW1hZ2VzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRsZXQgcHJvY2Vzc2VkQ291bnQgPSAwO1xuXHRcdGNvbnN0IGxhenlJbWFnZXMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZ1tkYXRhLXNyY10sIGltZ1tkYXRhLXNyY3NldF0nKTtcblxuXHRcdGxhenlJbWFnZXMuZm9yRWFjaChpbWcgPT4ge1xuXHRcdFx0aWYgKCEoaW1nIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkpIHJldHVybjtcblxuXHRcdFx0Ly8gSGFuZGxlIGRhdGEtc3JjXG5cdFx0XHRjb25zdCBkYXRhU3JjID0gaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcblx0XHRcdGlmIChkYXRhU3JjICYmICFpbWcuc3JjKSB7XG5cdFx0XHRcdGltZy5zcmMgPSBkYXRhU3JjO1xuXHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBIYW5kbGUgZGF0YS1zcmNzZXRcblx0XHRcdGNvbnN0IGRhdGFTcmNzZXQgPSBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xuXHRcdFx0aWYgKGRhdGFTcmNzZXQgJiYgIWltZy5zcmNzZXQpIHtcblx0XHRcdFx0aW1nLnNyY3NldCA9IGRhdGFTcmNzZXQ7XG5cdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlbW92ZSBsYXp5IGxvYWRpbmcgcmVsYXRlZCBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5cdFx0XHRpbWcuY2xhc3NMaXN0LnJlbW92ZSgnbGF6eScsICdsYXp5bG9hZCcpO1xuXHRcdFx0aW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1sbC1zdGF0dXMnKTtcblx0XHRcdGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XG5cdFx0XHRpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5fbG9nKCdQcm9jZXNzZWQgbGF6eSBpbWFnZXM6JywgcHJvY2Vzc2VkQ291bnQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGFuZGFyZGl6ZUVsZW1lbnRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRsZXQgcHJvY2Vzc2VkQ291bnQgPSAwO1xuXG5cdFx0Ly8gQ29udmVydCBlbGVtZW50cyBiYXNlZCBvbiBzdGFuZGFyZGl6YXRpb24gcnVsZXNcblx0XHRFTEVNRU5UX1NUQU5EQVJESVpBVElPTl9SVUxFUy5mb3JFYWNoKHJ1bGUgPT4ge1xuXHRcdFx0Y29uc3QgZWxlbWVudHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3Rvcik7XG5cdFx0XHRlbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcblx0XHRcdFx0aWYgKHJ1bGUudHJhbnNmb3JtKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlcmUncyBhIHRyYW5zZm9ybSBmdW5jdGlvbiwgdXNlIGl0IHRvIGNyZWF0ZSB0aGUgbmV3IGVsZW1lbnRcblx0XHRcdFx0XHRjb25zdCB0cmFuc2Zvcm1lZCA9IHJ1bGUudHJhbnNmb3JtKGVsKTtcblx0XHRcdFx0XHRlbC5yZXBsYWNlV2l0aCh0cmFuc2Zvcm1lZCk7XG5cdFx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBDb252ZXJ0IGxpdGUteW91dHViZSBlbGVtZW50c1xuXHRcdGNvbnN0IGxpdGVZb3V0dWJlRWxlbWVudHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpdGUteW91dHViZScpO1xuXHRcdGxpdGVZb3V0dWJlRWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRjb25zdCB2aWRlb0lkID0gZWwuZ2V0QXR0cmlidXRlKCd2aWRlb2lkJyk7XG5cdFx0XHRpZiAoIXZpZGVvSWQpIHJldHVybjtcblxuXHRcdFx0Y29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG5cdFx0XHRpZnJhbWUud2lkdGggPSAnNTYwJztcblx0XHRcdGlmcmFtZS5oZWlnaHQgPSAnMzE1Jztcblx0XHRcdGlmcmFtZS5zcmMgPSBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJHt2aWRlb0lkfWA7XG5cdFx0XHRpZnJhbWUudGl0bGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3ZpZGVvdGl0bGUnKSB8fCAnWW91VHViZSB2aWRlbyBwbGF5ZXInO1xuXHRcdFx0aWZyYW1lLmZyYW1lQm9yZGVyID0gJzAnO1xuXHRcdFx0aWZyYW1lLmFsbG93ID0gJ2FjY2VsZXJvbWV0ZXI7IGF1dG9wbGF5OyBjbGlwYm9hcmQtd3JpdGU7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmU7IHdlYi1zaGFyZSc7XG5cdFx0XHRpZnJhbWUuc2V0QXR0cmlidXRlKCdhbGxvd2Z1bGxzY3JlZW4nLCAnJyk7XG5cblx0XHRcdGVsLnJlcGxhY2VXaXRoKGlmcmFtZSk7XG5cdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQWRkIGZ1dHVyZSBlbWJlZCBjb252ZXJzaW9ucyAoVHdpdHRlciwgSW5zdGFncmFtLCBldGMuKVxuXG5cdFx0dGhpcy5fbG9nKCdDb252ZXJ0ZWQgZW1iZWRkZWQgZWxlbWVudHM6JywgcHJvY2Vzc2VkQ291bnQpO1xuXHR9XG5cblx0Ly8gRmluZCBzbWFsbCBJTUcgYW5kIFNWRyBlbGVtZW50c1xuXHRwcml2YXRlIGZpbmRTbWFsbEltYWdlcyhkb2M6IERvY3VtZW50KTogU2V0PHN0cmluZz4ge1xuXHRcdGNvbnN0IE1JTl9ESU1FTlNJT04gPSAzMztcblx0XHRjb25zdCBzbWFsbEltYWdlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdGNvbnN0IHRyYW5zZm9ybVJlZ2V4ID0gL3NjYWxlXFwoKFtcXGQuXSspXFwpLztcblx0XHRjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRsZXQgcHJvY2Vzc2VkQ291bnQgPSAwO1xuXG5cdFx0Ly8gMS4gUmVhZCBwaGFzZSAtIEdhdGhlciBhbGwgZWxlbWVudHMgaW4gYSBzaW5nbGUgcGFzc1xuXHRcdGNvbnN0IGVsZW1lbnRzID0gW1xuXHRcdFx0Li4uQXJyYXkuZnJvbShkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpKSxcblx0XHRcdC4uLkFycmF5LmZyb20oZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzdmcnKSlcblx0XHRdLmZpbHRlcihlbGVtZW50ID0+IHtcblx0XHRcdC8vIFNraXAgbGF6eS1sb2FkZWQgaW1hZ2VzIHRoYXQgaGF2ZW4ndCBiZWVuIHByb2Nlc3NlZCB5ZXRcblx0XHRcdGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuXHRcdFx0XHRjb25zdCBpc0xhenkgPSBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnbGF6eScpIHx8IFxuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdsYXp5bG9hZCcpIHx8XG5cdFx0XHRcdFx0ZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2RhdGEtc3JjJykgfHxcblx0XHRcdFx0XHRlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcblx0XHRcdFx0cmV0dXJuICFpc0xhenk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHRcdGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBzbWFsbEltYWdlcztcblx0XHR9XG5cblx0XHQvLyAyLiBCYXRjaCBwcm9jZXNzIC0gQ29sbGVjdCBhbGwgbWVhc3VyZW1lbnRzIGluIG9uZSBnb1xuXHRcdGNvbnN0IG1lYXN1cmVtZW50cyA9IGVsZW1lbnRzLm1hcChlbGVtZW50ID0+ICh7XG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Ly8gU3RhdGljIGF0dHJpYnV0ZXMgKG5vIHJlZmxvdylcblx0XHRcdG5hdHVyYWxXaWR0aDogZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgPyBlbGVtZW50Lm5hdHVyYWxXaWR0aCA6IDAsXG5cdFx0XHRuYXR1cmFsSGVpZ2h0OiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCA/IGVsZW1lbnQubmF0dXJhbEhlaWdodCA6IDAsXG5cdFx0XHRhdHRyV2lkdGg6IHBhcnNlSW50KGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd3aWR0aCcpIHx8ICcwJyksXG5cdFx0XHRhdHRySGVpZ2h0OiBwYXJzZUludChlbGVtZW50LmdldEF0dHJpYnV0ZSgnaGVpZ2h0JykgfHwgJzAnKVxuXHRcdH0pKTtcblxuXHRcdC8vIDMuIEJhdGNoIGNvbXB1dGUgc3R5bGVzIC0gUHJvY2VzcyBpbiBjaHVua3MgdG8gYXZvaWQgbG9uZyB0YXNrc1xuXHRcdGNvbnN0IEJBVENIX1NJWkUgPSA1MDtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG1lYXN1cmVtZW50cy5sZW5ndGg7IGkgKz0gQkFUQ0hfU0laRSkge1xuXHRcdFx0Y29uc3QgYmF0Y2ggPSBtZWFzdXJlbWVudHMuc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuXHRcdFx0XG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvLyBSZWFkIHBoYXNlIC0gY29tcHV0ZSBhbGwgc3R5bGVzIGF0IG9uY2Vcblx0XHRcdFx0Y29uc3Qgc3R5bGVzID0gYmF0Y2gubWFwKCh7IGVsZW1lbnQgfSkgPT4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkpO1xuXHRcdFx0XHRjb25zdCByZWN0cyA9IGJhdGNoLm1hcCgoeyBlbGVtZW50IH0pID0+IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gUHJvY2VzcyBwaGFzZSAtIG5vIERPTSBvcGVyYXRpb25zXG5cdFx0XHRcdGJhdGNoLmZvckVhY2goKG1lYXN1cmVtZW50LCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzdHlsZSA9IHN0eWxlc1tpbmRleF07XG5cdFx0XHRcdFx0XHRjb25zdCByZWN0ID0gcmVjdHNbaW5kZXhdO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBHZXQgdHJhbnNmb3JtIHNjYWxlIGluIHRoZSBzYW1lIGJhdGNoXG5cdFx0XHRcdFx0XHRjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm07XG5cdFx0XHRcdFx0XHRjb25zdCBzY2FsZSA9IHRyYW5zZm9ybSA/IFxuXHRcdFx0XHRcdFx0XHRwYXJzZUZsb2F0KHRyYW5zZm9ybS5tYXRjaCh0cmFuc2Zvcm1SZWdleCk/LlsxXSB8fCAnMScpIDogMTtcblxuXHRcdFx0XHRcdFx0Ly8gQ2FsY3VsYXRlIGVmZmVjdGl2ZSBkaW1lbnNpb25zXG5cdFx0XHRcdFx0XHRjb25zdCB3aWR0aHMgPSBbXG5cdFx0XHRcdFx0XHRcdG1lYXN1cmVtZW50Lm5hdHVyYWxXaWR0aCxcblx0XHRcdFx0XHRcdFx0bWVhc3VyZW1lbnQuYXR0cldpZHRoLFxuXHRcdFx0XHRcdFx0XHRwYXJzZUludChzdHlsZS53aWR0aCkgfHwgMCxcblx0XHRcdFx0XHRcdFx0cmVjdC53aWR0aCAqIHNjYWxlXG5cdFx0XHRcdFx0XHRdLmZpbHRlcihkaW0gPT4gdHlwZW9mIGRpbSA9PT0gJ251bWJlcicgJiYgZGltID4gMCk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IGhlaWdodHMgPSBbXG5cdFx0XHRcdFx0XHRcdG1lYXN1cmVtZW50Lm5hdHVyYWxIZWlnaHQsXG5cdFx0XHRcdFx0XHRcdG1lYXN1cmVtZW50LmF0dHJIZWlnaHQsXG5cdFx0XHRcdFx0XHRcdHBhcnNlSW50KHN0eWxlLmhlaWdodCkgfHwgMCxcblx0XHRcdFx0XHRcdFx0cmVjdC5oZWlnaHQgKiBzY2FsZVxuXHRcdFx0XHRcdFx0XS5maWx0ZXIoZGltID0+IHR5cGVvZiBkaW0gPT09ICdudW1iZXInICYmIGRpbSA+IDApO1xuXG5cdFx0XHRcdFx0XHQvLyBEZWNpc2lvbiBwaGFzZSAtIG5vIERPTSBvcGVyYXRpb25zXG5cdFx0XHRcdFx0XHRpZiAod2lkdGhzLmxlbmd0aCA+IDAgJiYgaGVpZ2h0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGVmZmVjdGl2ZVdpZHRoID0gTWF0aC5taW4oLi4ud2lkdGhzKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZWZmZWN0aXZlSGVpZ2h0ID0gTWF0aC5taW4oLi4uaGVpZ2h0cyk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGVmZmVjdGl2ZVdpZHRoIDwgTUlOX0RJTUVOU0lPTiB8fCBlZmZlY3RpdmVIZWlnaHQgPCBNSU5fRElNRU5TSU9OKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgaWRlbnRpZmllciA9IHRoaXMuZ2V0RWxlbWVudElkZW50aWZpZXIobWVhc3VyZW1lbnQuZWxlbWVudCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGlkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHNtYWxsSW1hZ2VzLmFkZChpZGVudGlmaWVyKTtcblx0XHRcdFx0XHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3MgZWxlbWVudCBkaW1lbnNpb25zOicsIGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICh0aGlzLmRlYnVnKSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3MgYmF0Y2g6JywgZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBlbmRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0dGhpcy5fbG9nKCdGb3VuZCBzbWFsbCBlbGVtZW50czonLCB7XG5cdFx0XHRjb3VudDogcHJvY2Vzc2VkQ291bnQsXG5cdFx0XHR0b3RhbEVsZW1lbnRzOiBlbGVtZW50cy5sZW5ndGgsXG5cdFx0XHRwcm9jZXNzaW5nVGltZTogYCR7KGVuZFRpbWUgLSBzdGFydFRpbWUpLnRvRml4ZWQoMil9bXNgXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gc21hbGxJbWFnZXM7XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZVNtYWxsSW1hZ2VzKGRvYzogRG9jdW1lbnQsIHNtYWxsSW1hZ2VzOiBTZXQ8c3RyaW5nPikge1xuXHRcdGxldCByZW1vdmVkQ291bnQgPSAwO1xuXG5cdFx0WydpbWcnLCAnc3ZnJ10uZm9yRWFjaCh0YWcgPT4ge1xuXHRcdFx0Y29uc3QgZWxlbWVudHMgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKTtcblx0XHRcdEFycmF5LmZyb20oZWxlbWVudHMpLmZvckVhY2goZWxlbWVudCA9PiB7XG5cdFx0XHRcdGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLmdldEVsZW1lbnRJZGVudGlmaWVyKGVsZW1lbnQpO1xuXHRcdFx0XHRpZiAoaWRlbnRpZmllciAmJiBzbWFsbEltYWdlcy5oYXMoaWRlbnRpZmllcikpIHtcblx0XHRcdFx0XHRlbGVtZW50LnJlbW92ZSgpO1xuXHRcdFx0XHRcdHJlbW92ZWRDb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuX2xvZygnUmVtb3ZlZCBzbWFsbCBlbGVtZW50czonLCByZW1vdmVkQ291bnQpO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRFbGVtZW50SWRlbnRpZmllcihlbGVtZW50OiBFbGVtZW50KTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0Ly8gVHJ5IHRvIGNyZWF0ZSBhIHVuaXF1ZSBpZGVudGlmaWVyIHVzaW5nIHZhcmlvdXMgYXR0cmlidXRlc1xuXHRcdGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuXHRcdFx0Ly8gRm9yIGxhenktbG9hZGVkIGltYWdlcywgdXNlIGRhdGEtc3JjIGFzIGlkZW50aWZpZXIgaWYgYXZhaWxhYmxlXG5cdFx0XHRjb25zdCBkYXRhU3JjID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XG5cdFx0XHRpZiAoZGF0YVNyYykgcmV0dXJuIGBzcmM6JHtkYXRhU3JjfWA7XG5cdFx0XHRcblx0XHRcdGNvbnN0IHNyYyA9IGVsZW1lbnQuc3JjIHx8ICcnO1xuXHRcdFx0Y29uc3Qgc3Jjc2V0ID0gZWxlbWVudC5zcmNzZXQgfHwgJyc7XG5cdFx0XHRjb25zdCBkYXRhU3Jjc2V0ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jyk7XG5cdFx0XHRcblx0XHRcdGlmIChzcmMpIHJldHVybiBgc3JjOiR7c3JjfWA7XG5cdFx0XHRpZiAoc3Jjc2V0KSByZXR1cm4gYHNyY3NldDoke3NyY3NldH1gO1xuXHRcdFx0aWYgKGRhdGFTcmNzZXQpIHJldHVybiBgc3Jjc2V0OiR7ZGF0YVNyY3NldH1gO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlkID0gZWxlbWVudC5pZCB8fCAnJztcblx0XHRjb25zdCBjbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZSB8fCAnJztcblx0XHRjb25zdCB2aWV3Qm94ID0gZWxlbWVudCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQgPyBlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlld0JveCcpIHx8ICcnIDogJyc7XG5cdFx0XG5cdFx0aWYgKGlkKSByZXR1cm4gYGlkOiR7aWR9YDtcblx0XHRpZiAodmlld0JveCkgcmV0dXJuIGB2aWV3Qm94OiR7dmlld0JveH1gO1xuXHRcdGlmIChjbGFzc05hbWUpIHJldHVybiBgY2xhc3M6JHtjbGFzc05hbWV9YDtcblx0XHRcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdHByaXZhdGUgZmluZE1haW5Db250ZW50KGRvYzogRG9jdW1lbnQpOiBFbGVtZW50IHwgbnVsbCB7XG5cblx0XHQvLyBGaW5kIGFsbCBwb3RlbnRpYWwgY29udGVudCBjb250YWluZXJzXG5cdFx0Y29uc3QgY2FuZGlkYXRlczogeyBlbGVtZW50OiBFbGVtZW50OyBzY29yZTogbnVtYmVyIH1bXSA9IFtdO1xuXG5cdFx0RU5UUllfUE9JTlRfRUxFTUVOVFMuZm9yRWFjaCgoc2VsZWN0b3IsIGluZGV4KSA9PiB7XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG5cdFx0XHRcdC8vIEJhc2Ugc2NvcmUgZnJvbSBzZWxlY3RvciBwcmlvcml0eSAoZWFybGllciA9IGhpZ2hlcilcblx0XHRcdFx0bGV0IHNjb3JlID0gKEVOVFJZX1BPSU5UX0VMRU1FTlRTLmxlbmd0aCAtIGluZGV4KSAqIDEwO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQWRkIHNjb3JlIGJhc2VkIG9uIGNvbnRlbnQgYW5hbHlzaXNcblx0XHRcdFx0c2NvcmUgKz0gdGhpcy5zY29yZUVsZW1lbnQoZWxlbWVudCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRjYW5kaWRhdGVzLnB1c2goeyBlbGVtZW50LCBzY29yZSB9KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHQvLyBGYWxsIGJhY2sgdG8gc2NvcmluZyBibG9jayBlbGVtZW50c1xuXHRcdFx0Ly8gQ3VycmVudGx5IDxib2R5PiBlbGVtZW50IGlzIHVzZWQgYXMgdGhlIGZhbGxiYWNrLCBzbyB0aGlzIGlzIG5vdCB1c2VkXG5cdFx0XHRyZXR1cm4gdGhpcy5maW5kQ29udGVudEJ5U2NvcmluZyhkb2MpO1xuXHRcdH1cblxuXHRcdC8vIFNvcnQgYnkgc2NvcmUgZGVzY2VuZGluZ1xuXHRcdGNhbmRpZGF0ZXMuc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpO1xuXHRcdFxuXHRcdGlmICh0aGlzLmRlYnVnKSB7XG5cdFx0XHR0aGlzLl9sb2coJ0NvbnRlbnQgY2FuZGlkYXRlczonLCBjYW5kaWRhdGVzLm1hcChjID0+ICh7XG5cdFx0XHRcdGVsZW1lbnQ6IGMuZWxlbWVudC50YWdOYW1lLFxuXHRcdFx0XHRzZWxlY3RvcjogdGhpcy5nZXRFbGVtZW50U2VsZWN0b3IoYy5lbGVtZW50KSxcblx0XHRcdFx0c2NvcmU6IGMuc2NvcmVcblx0XHRcdH0pKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNhbmRpZGF0ZXNbMF0uZWxlbWVudDtcblx0fVxuXG5cdHByaXZhdGUgZmluZENvbnRlbnRCeVNjb3JpbmcoZG9jOiBEb2N1bWVudCk6IEVsZW1lbnQgfCBudWxsIHtcblx0XHRjb25zdCBjYW5kaWRhdGVzID0gdGhpcy5zY29yZUVsZW1lbnRzKGRvYyk7XG5cdFx0cmV0dXJuIGNhbmRpZGF0ZXMubGVuZ3RoID4gMCA/IGNhbmRpZGF0ZXNbMF0uZWxlbWVudCA6IG51bGw7XG5cdH1cblxuXHRwcml2YXRlIGdldEVsZW1lbnRTZWxlY3RvcihlbGVtZW50OiBFbGVtZW50KTogc3RyaW5nIHtcblx0XHRjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblx0XHRsZXQgY3VycmVudDogRWxlbWVudCB8IG51bGwgPSBlbGVtZW50O1xuXHRcdFxuXHRcdHdoaWxlIChjdXJyZW50ICYmIGN1cnJlbnQgIT09IHRoaXMuZG9jLmRvY3VtZW50RWxlbWVudCkge1xuXHRcdFx0bGV0IHNlbGVjdG9yID0gY3VycmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoY3VycmVudC5pZCkge1xuXHRcdFx0XHRzZWxlY3RvciArPSAnIycgKyBjdXJyZW50LmlkO1xuXHRcdFx0fSBlbHNlIGlmIChjdXJyZW50LmNsYXNzTmFtZSAmJiB0eXBlb2YgY3VycmVudC5jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHNlbGVjdG9yICs9ICcuJyArIGN1cnJlbnQuY2xhc3NOYW1lLnRyaW0oKS5zcGxpdCgvXFxzKy8pLmpvaW4oJy4nKTtcblx0XHRcdH1cblx0XHRcdHBhcnRzLnVuc2hpZnQoc2VsZWN0b3IpO1xuXHRcdFx0Y3VycmVudCA9IGN1cnJlbnQucGFyZW50RWxlbWVudDtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHBhcnRzLmpvaW4oJyA+ICcpO1xuXHR9XG5cblx0cHJpdmF0ZSBzY29yZUVsZW1lbnRzKGRvYzogRG9jdW1lbnQpOiBDb250ZW50U2NvcmVbXSB7XG5cdFx0Y29uc3QgY2FuZGlkYXRlczogQ29udGVudFNjb3JlW10gPSBbXTtcblxuXHRcdEJMT0NLX0VMRU1FTlRTLmZvckVhY2goKHRhZzogc3RyaW5nKSA9PiB7XG5cdFx0XHRBcnJheS5mcm9tKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpKS5mb3JFYWNoKChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG5cdFx0XHRcdGNvbnN0IHNjb3JlID0gdGhpcy5zY29yZUVsZW1lbnQoZWxlbWVudCk7XG5cdFx0XHRcdGlmIChzY29yZSA+IDApIHtcblx0XHRcdFx0XHRjYW5kaWRhdGVzLnB1c2goeyBzY29yZSwgZWxlbWVudCB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gY2FuZGlkYXRlcy5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSk7XG5cdH1cblxuXHRwcml2YXRlIHNjb3JlRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogbnVtYmVyIHtcblx0XHRsZXQgc2NvcmUgPSAwO1xuXG5cdFx0Ly8gU2NvcmUgYmFzZWQgb24gZWxlbWVudCBwcm9wZXJ0aWVzXG5cdFx0Y29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUgJiYgdHlwZW9mIGVsZW1lbnQuY2xhc3NOYW1lID09PSAnc3RyaW5nJyA/IFxuXHRcdFx0ZWxlbWVudC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKSA6ICcnO1xuXHRcdGNvbnN0IGlkID0gZWxlbWVudC5pZCA/IGVsZW1lbnQuaWQudG9Mb3dlckNhc2UoKSA6ICcnO1xuXG5cdFx0Ly8gU2NvcmUgYmFzZWQgb24gY29udGVudFxuXHRcdGNvbnN0IHRleHQgPSBlbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xuXHRcdGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgvXFxzKy8pLmxlbmd0aDtcblx0XHRzY29yZSArPSBNYXRoLm1pbihNYXRoLmZsb29yKHdvcmRzIC8gMTAwKSwgMyk7XG5cblx0XHQvLyBTY29yZSBiYXNlZCBvbiBsaW5rIGRlbnNpdHlcblx0XHRjb25zdCBsaW5rcyA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKTtcblx0XHRjb25zdCBsaW5rVGV4dCA9IEFycmF5LmZyb20obGlua3MpLnJlZHVjZSgoYWNjLCBsaW5rKSA9PiBhY2MgKyAobGluay50ZXh0Q29udGVudD8ubGVuZ3RoIHx8IDApLCAwKTtcblx0XHRjb25zdCBsaW5rRGVuc2l0eSA9IHRleHQubGVuZ3RoID8gbGlua1RleHQgLyB0ZXh0Lmxlbmd0aCA6IDA7XG5cdFx0aWYgKGxpbmtEZW5zaXR5ID4gMC41KSB7XG5cdFx0XHRzY29yZSAtPSAxMDtcblx0XHR9XG5cblx0XHQvLyBTY29yZSBiYXNlZCBvbiBwcmVzZW5jZSBvZiBtZWFuaW5nZnVsIGVsZW1lbnRzXG5cdFx0Y29uc3QgcGFyYWdyYXBocyA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3AnKS5sZW5ndGg7XG5cdFx0c2NvcmUgKz0gcGFyYWdyYXBocztcblxuXHRcdGNvbnN0IGltYWdlcyA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpLmxlbmd0aDtcblx0XHRzY29yZSArPSBNYXRoLm1pbihpbWFnZXMgKiAzLCA5KTtcblxuXHRcdHJldHVybiBzY29yZTtcblx0fVxufSAiLCIvLyBFbnRyeSBwb2ludCBlbGVtZW50c1xuLy8gVGhlc2UgYXJlIHRoZSBlbGVtZW50cyB0aGF0IHdpbGwgYmUgdXNlZCB0byBmaW5kIHRoZSBtYWluIGNvbnRlbnRcbmV4cG9ydCBjb25zdCBFTlRSWV9QT0lOVF9FTEVNRU5UUyA9IFtcblx0J2FydGljbGUnLFxuXHQnW3JvbGU9XCJhcnRpY2xlXCJdJyxcblx0Jy5wb3N0LWNvbnRlbnQnLFxuXHQnLmFydGljbGUtY29udGVudCcsXG5cdCcjYXJ0aWNsZS1jb250ZW50Jyxcblx0Jy5jb250ZW50LWFydGljbGUnLFxuXHQnbWFpbicsXG5cdCdbcm9sZT1cIm1haW5cIl0nLFxuXHQnYm9keScgLy8gZW5zdXJlcyB0aGVyZSBpcyBhbHdheXMgYSBtYXRjaFxuXTtcblxuZXhwb3J0IGNvbnN0IE1PQklMRV9XSURUSCA9IDYwMDtcbmV4cG9ydCBjb25zdCBCTE9DS19FTEVNRU5UUyA9IFsnZGl2JywgJ3NlY3Rpb24nLCAnYXJ0aWNsZScsICdtYWluJ107XG5cbi8vIEVsZW1lbnRzIHRoYXQgc2hvdWxkIG5vdCBiZSB1bndyYXBwZWRcbmV4cG9ydCBjb25zdCBQUkVTRVJWRV9FTEVNRU5UUyA9IG5ldyBTZXQoW1xuXHQncHJlJywgJ2NvZGUnLCAndGFibGUnLCAndGhlYWQnLCAndGJvZHknLCAndHInLCAndGQnLCAndGgnLFxuXHQndWwnLCAnb2wnLCAnbGknLCAnZGwnLCAnZHQnLCAnZGQnLFxuXHQnZmlndXJlJywgJ2ZpZ2NhcHRpb24nLCAncGljdHVyZScsXG5cdCdkZXRhaWxzJywgJ3N1bW1hcnknLFxuXHQnYmxvY2txdW90ZScsXG5cdCdmb3JtJywgJ2ZpZWxkc2V0J1xuXSk7XG5cbi8vIElubGluZSBlbGVtZW50cyB0aGF0IHNob3VsZCBub3QgYmUgdW53cmFwcGVkXG5leHBvcnQgY29uc3QgSU5MSU5FX0VMRU1FTlRTID0gbmV3IFNldChbXG5cdCdhJywgJ3NwYW4nLCAnc3Ryb25nJywgJ2VtJywgJ2knLCAnYicsICd1JywgJ2NvZGUnLCAnYnInLCAnc21hbGwnLFxuXHQnc3ViJywgJ3N1cCcsICdtYXJrJywgJ2RlbCcsICdpbnMnLCAncScsICdhYmJyJywgJ2NpdGUnLCAndGltZSdcbl0pO1xuXG4vLyBIaWRkZW4gZWxlbWVudHMgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuZXhwb3J0IGNvbnN0IEhJRERFTl9FTEVNRU5UX1NFTEVDVE9SUyA9IFtcblx0J1toaWRkZW5dJyxcblx0J1thcmlhLWhpZGRlbj1cInRydWVcIl0nLFxuLy9cdCdbc3R5bGUqPVwiZGlzcGxheTogbm9uZVwiXScsIGNhdXNlcyBwcm9ibGVtcyBmb3IgbWF0aCBmb3JtdWxhc1xuLy9cdCdbc3R5bGUqPVwiZGlzcGxheTpub25lXCJdJyxcblx0J1tzdHlsZSo9XCJ2aXNpYmlsaXR5OiBoaWRkZW5cIl0nLFxuXHQnW3N0eWxlKj1cInZpc2liaWxpdHk6aGlkZGVuXCJdJyxcblx0Jy5oaWRkZW4nLFxuXHQnLmludmlzaWJsZSdcbl0uam9pbignLCcpO1xuXG4vLyBTZWxlY3RvcnMgdG8gYmUgcmVtb3ZlZFxuZXhwb3J0IGNvbnN0IEVYQUNUX1NFTEVDVE9SUyA9IFtcblx0Ly8gc2NyaXB0cywgc3R5bGVzXG5cdCdub3NjcmlwdCcsXG5cdCdzY3JpcHQnLFxuXHQnc3R5bGUnLFxuXG5cdC8vIGFkc1xuXHQnLmFkOm5vdChbY2xhc3MqPVwiZ3JhZGllbnRcIl0pJyxcblx0J1tjbGFzc149XCJhZC1cIiBpXScsXG5cdCdbY2xhc3MkPVwiLWFkXCIgaV0nLFxuXHQnW2lkXj1cImFkLVwiIGldJyxcblx0J1tpZCQ9XCItYWRcIiBpXScsXG5cdCdbcm9sZT1cImJhbm5lclwiIGldJyxcblx0Jy5wcm9tbycsXG5cdCcuUHJvbW8nLFxuXHQnI2JhcnJpZXItcGFnZScsIC8vIGZ0LmNvbVxuXG5cdC8vIGNvbW1lbnRzXG5cdCdbaWQ9XCJjb21tZW50c1wiIGldJyxcblxuXHQvLyBoZWFkZXIsIG5hdlxuXHQnaGVhZGVyJyxcblx0Jy5oZWFkZXInLFxuXHQnI2hlYWRlcicsXG5cdCduYXYnLFxuXHQnLm5hdmlnYXRpb24nLFxuXHQnI25hdmlnYXRpb24nLFxuXHQnW3JvbGU9XCJuYXZpZ2F0aW9uXCIgaV0nLFxuXHQnW3JvbGU9XCJkaWFsb2dcIiBpXScsXG5cdCdbcm9sZSo9XCJjb21wbGVtZW50YXJ5XCIgaV0nLFxuXHQnW2NsYXNzKj1cInBhZ2luYXRpb25cIiBpXScsXG5cdCcubWVudScsXG5cdCcjbWVudScsXG5cdCcjc2l0ZVN1YicsXG5cblx0Ly8gbWV0YWRhdGFcblx0Jy5hdXRob3InLFxuXHQnLkF1dGhvcicsXG5cdCcuY29udHJpYnV0b3InLFxuXHQnLmRhdGUnLFxuXHQnLm1ldGEnLFxuXHQnLnRhZ3MnLFxuXHQnLnRvYycsXG5cdCcuVG9jJyxcblx0JyN0b2MnLFxuXHQnI3RpdGxlJyxcblx0JyNUaXRsZScsXG5cdCdbaHJlZio9XCIvY2F0ZWdvcnlcIl0nLFxuXHQnW2hyZWYqPVwiL2NhdGVnb3JpZXNcIl0nLFxuXHQnW2hyZWYqPVwiL3RhZy9cIl0nLFxuXHQnW2hyZWYqPVwiL3RhZ3MvXCJdJyxcblx0J1tocmVmKj1cIi90b3BpY3NcIl0nLFxuXHQnW2hyZWYqPVwiYXV0aG9yXCJdJyxcblx0J1tocmVmPVwiI3NpdGUtY29udGVudFwiXScsXG5cdCdbc3JjKj1cImF1dGhvclwiXScsXG5cblx0Ly8gZm9vdGVyXG5cdCdmb290ZXInLFxuXG5cdC8vIGlucHV0cywgZm9ybXMsIGVsZW1lbnRzXG5cdCdhc2lkZScsXG5cdCdidXR0b24nLFxuXHRcdC8vICdbcm9sZT1cImJ1dHRvblwiXScsIE1lZGl1bSBpbWFnZXNcblx0J2NhbnZhcycsXG5cdCdkaWFsb2cnLFxuXHQnZmllbGRzZXQnLFxuXHQnZm9ybScsXG5cdCdpbnB1dDpub3QoW3R5cGU9XCJjaGVja2JveFwiXSknLFxuXHQnbGFiZWwnLFxuXHQnbGluaycsXG5cdCdvcHRpb24nLFxuXHQnc2VsZWN0Jyxcblx0J3RleHRhcmVhJyxcblx0J3RpbWUnLFxuXG5cdC8vIGlmcmFtZXNcblx0J2luc3RhcmVhZC1wbGF5ZXInLFxuXHQnaWZyYW1lOm5vdChbc3JjKj1cInlvdXR1YmVcIl0pOm5vdChbc3JjKj1cInlvdXR1LmJlXCJdKTpub3QoW3NyYyo9XCJ2aW1lb1wiXSk6bm90KFtzcmMqPVwidHdpdHRlclwiXSknLFxuXG5cdC8vIGxvZ29zXG5cdCdbY2xhc3M9XCJsb2dvXCIgaV0nLFxuXHQnI2xvZ28nLFxuXHQnI0xvZ28nLFxuXG5cdC8vIG5ld3NsZXR0ZXJcblx0JyNuZXdzbGV0dGVyJyxcblx0JyNOZXdzbGV0dGVyJyxcblxuXHQvLyBoaWRkZW4gZm9yIHByaW50XG5cdCcubm9wcmludCcsXG5cdCdbZGF0YS1saW5rLW5hbWUqPVwic2tpcFwiIGldJyxcblx0J1tkYXRhLXByaW50LWxheW91dD1cImhpZGVcIiBpXScsXG5cdCdbZGF0YS1ibG9jaz1cImRvbm90cHJpbnRcIiBpXScsXG5cblx0Ly8gZm9vdG5vdGVzLCBjaXRhdGlvbnNcblx0J1tjbGFzcyo9XCJjbGlja2FibGUtaWNvblwiIGldJyxcblx0J2xpIHNwYW5bY2xhc3MqPVwibHR4X3RhZ1wiIGldW2NsYXNzKj1cImx0eF90YWdfaXRlbVwiIGldJyxcblx0J2FbaHJlZl49XCIjXCJdW2NsYXNzKj1cImFuY2hvclwiIGldJyxcblx0J2FbaHJlZl49XCIjXCJdW2NsYXNzKj1cInJlZlwiIGldJyxcblxuXHQvLyBsaW5rIGxpc3RzXG5cdCdbZGF0YS1jb250YWluZXIqPVwibW9zdC12aWV3ZWRcIiBpXScsXG5cblx0Ly8gc2lkZWJhclxuXHQnLnNpZGViYXInLFxuXHQnLlNpZGViYXInLFxuXHQnI3NpZGViYXInLFxuXHQnI1NpZGViYXInLFxuXHQnI3NpdGVzdWInLFxuXHRcblx0Ly8gb3RoZXJcblx0JyNwcmltYXJ5YXVkaW8nLCAvLyBOUFJcblx0JyNOWVRfQUJPVkVfTUFJTl9DT05URU5UX1JFR0lPTicsXG5cdCdbZGF0YS10ZXN0aWQ9XCJwaG90b3ZpZXdlci1jaGlsZHJlbi1maWd1cmVcIl0gPiBzcGFuJywgLy8gTmV3IFlvcmsgVGltZXNcblx0J3RhYmxlLmluZm9ib3gnLFxuXHQnLnBlbmNyYWZ0Om5vdCgucGMtZGlzcGxheS1jb250ZW50cyknLCAvLyBTdWJzdGFja1xuXHQnW2RhdGEtb3B0aW1pemVseT1cInJlbGF0ZWQtYXJ0aWNsZXMtc2VjdGlvblwiIGldJyAvLyBUaGUgRWNvbm9taXN0XG5dO1xuXG4vLyBSZW1vdmFsIHBhdHRlcm5zIHRlc3RlZCBhZ2FpbnN0IGF0dHJpYnV0ZXM6IGNsYXNzLCBpZCwgZGF0YS10ZXN0aWQsIGFuZCBkYXRhLXFhXG4vLyBDYXNlIGluc2Vuc2l0aXZlLCBwYXJ0aWFsIG1hdGNoZXMgYWxsb3dlZFxuZXhwb3J0IGNvbnN0IFBBUlRJQUxfU0VMRUNUT1JTID0gW1xuXHQnYWNjZXNzLXdhbGwnLFxuXHQnYWN0aXZpdHlwdWInLFxuXHQnYWN0aW9uY2FsbCcsXG5cdCdhcHBlbmRpeCcsXG5cdCdhdmF0YXInLFxuXHQnYWR2ZXJ0Jyxcblx0Jy1hZC0nLFxuXHQnX2FkXycsXG5cdCdhbGx0ZXJtcycsXG5cdCdhcm91bmQtdGhlLXdlYicsXG5cdCdhcnRpY2xlLWJvdHRvbS1zZWN0aW9uJyxcblx0J2FydGljbGVfX2NvcHknLFxuXHQnYXJ0aWNsZV9kYXRlJyxcblx0J2FydGljbGUtZW5kICcsXG5cdCdhcnRpY2xlX2hlYWRlcicsXG5cdCdhcnRpY2xlX19oZWFkZXInLFxuXHQnYXJ0aWNsZV9faW5mbycsXG5cdCdhcnRpY2xlLWluZm8nLFxuXHQnYXJ0aWNsZV9fbWV0YScsXG5cdCdhcnRpY2xlLXN1YmplY3QnLFxuXHQnYXJ0aWNsZV9zdWJqZWN0Jyxcblx0J2FydGljbGUtc25pcHBldCcsXG5cdCdhcnRpY2xlLXNlcGFyYXRvcicsXG5cdCdhcnRpY2xlLS1zaGFyZScsXG5cdCdhcnRpY2xlLS10b3BpY3MnLFxuXHQnYXJ0aWNsZXRhZ3MnLFxuXHQnYXJ0aWNsZS10YWdzJyxcblx0J2FydGljbGVfdGFncycsXG5cdCdhcnRpY2xlLXRpdGxlJyxcblx0J2FydGljbGVfdGl0bGUnLFxuXHQnYXJ0aWNsZXRvcGljcycsXG5cdCdhcnRpY2xlLXRvcGljcycsXG5cdCdhcnRpY2xlLXR5cGUnLFxuXHQnYXJ0aWNsZS0tbGVkZScsIC8vIFRoZSBWZXJnZVxuXHQnYXJ0aWNsZXdlbGwnLFxuXHQnYXNzb2NpYXRlZC1wZW9wbGUnLFxuXHQnYXVkaW8tY2FyZCcsXG4vL1x0J2F1dGhvcicsIEd3ZXJuXG5cdCdhdXRob3JlZC1ieScsXG5cdCdhdXRob3ItYm94Jyxcblx0J2F1dGhvci1uYW1lJyxcblx0J2F1dGhvci1iaW8nLFxuXHQnYXV0aG9yLW1pbmktYmlvJyxcblx0J2JhY2stdG8tdG9wJyxcblx0J2JhY2tsaW5rcy1zZWN0aW9uJyxcblx0J2Jhbm5lcicsXG5cdCdiaW8tYmxvY2snLFxuXHQnYmxvZy1wYWdlcicsXG5cdCdib29rbWFyay0nLFxuXHQnLWJvb2ttYXJrJyxcblx0J2JvdHRvbS1vZi1hcnRpY2xlJyxcblx0J2JyYW5kLWJhcicsXG5cdCdicmVhZGNydW1iJyxcblx0J2J1dHRvbi13cmFwcGVyJyxcblx0J2J0bi0nLFxuXHQnLWJ0bicsXG5cdCdieWxpbmUnLFxuXHQnY2FwdGNoYScsXG5cdCdjYXJkLXRleHQnLFxuXHQnY2FyZC1tZWRpYScsXG5cdCdjYXRfaGVhZGVyJyxcblx0J2NhdGxpbmtzJyxcblx0J2NoYXB0ZXItbGlzdCcsIC8vIFRoZSBFY29ub21pc3Rcblx0J2NvbGxlY3Rpb25zJyxcblx0J2NvbW1lbnRzJyxcbi8vXHQnLWNvbW1lbnQnLCBTeW50YXggaGlnaGxpZ2h0aW5nXG5cdCdjb21tZW50Ym94Jyxcblx0J2NvbW1lbnQtY291bnQnLFxuXHQnY29tbWVudC1jb250ZW50Jyxcblx0J2NvbW1lbnQtZm9ybScsXG5cdCdjb21tZW50LW51bWJlcicsXG5cdCdjb21tZW50LXJlc3BvbmQnLFxuXHQnY29tbWVudC10aHJlYWQnLFxuXHQnY29tcGxlbWVudGFyeScsXG5cdCdjb25zZW50Jyxcblx0J2NvbnRlbnQtY2FyZCcsIC8vIFRoZSBWZXJnZVxuXHQnY29udGVudC10b3BpY3MnLFxuXHQnY29udGVudHByb21vJyxcblx0J2NvbnRleHQtd2lkZ2V0JywgLy8gUmV1dGVyc1xuXHQnY29yZS1jb2xsYXRlcmFsJyxcblx0J19jdGEnLFxuXHQnLWN0YScsXG5cdCdjdGEtJyxcblx0J2N0YV8nLFxuXHQnY3VycmVudC1pc3N1ZScsIC8vIFRoZSBOYXRpb25cblx0J2N1c3RvbS1saXN0LW51bWJlcicsXG5cdCdkYXRlbGluZScsXG5cdCdkYXRlaGVhZGVyJyxcblx0J2RhdGUtaGVhZGVyJyxcblx0J2RhdGVfaGVhZGVyLScsXG4vL1x0J2RpYWxvZycsXG5cdCdkaXNjbGFpbWVyJyxcblx0J2Rpc2Nsb3N1cmUnLFxuXHQnZGlzY3Vzc2lvbicsXG5cdCdkaXNjdXNzXycsXG5cdCdkaXNxdXMnLFxuXHQnZG9uYXRlJyxcblx0J2Ryb3Bkb3duJywgLy8gQXJzIFRlY2huaWNhXG5cdCdlbGV0dGVycycsXG5cdCdlbWFpbHNpZ251cCcsXG5cdCdlbmdhZ2VtZW50LXdpZGdldCcsXG5cdCdlbnRyeS1hdXRob3ItaW5mbycsXG5cdCdlbnRyeS1jYXRlZ29yaWVzJyxcblx0J2VudHJ5LWRhdGUnLFxuXHQnZW50cnktbWV0YScsXG5cdCdlbnRyeS10aXRsZScsXG5cdCdlbnRyeS11dGlsaXR5Jyxcblx0J2V5ZWJyb3cnLFxuXHQnZXhwYW5kLXJlZHVjZScsXG5cdCdleHRlcm5hbGxpbmtlbWJlZHdyYXBwZXInLCAvLyBUaGUgTmV3IFlvcmtlclxuXHQnZXh0cmEtc2VydmljZXMnLFxuXHQnZXh0cmEtdGl0bGUnLFxuXHQnZmFjZWJvb2snLFxuXHQnZmF2b3JpdGUnLFxuXHQnZmVlZGJhY2snLFxuXHQnZmVlZC1saW5rcycsXG5cdCdmaWVsZC1zaXRlLXNlY3Rpb25zJyxcblx0J2ZpeGVkJyxcblx0J2Zsb2F0aW5nLXZpZCcsXG5cdCdmb2xsb3cnLFxuXHQnZm9vdGVyJyxcblx0J2Zvb3Rub3RlLWJhY2snLFxuXHQnZm9vdG5vdGViYWNrJyxcblx0J2Zvci15b3UnLFxuXHQnZnJvbnRtYXR0ZXInLFxuXHQnZnVydGhlci1yZWFkaW5nJyxcblx0J2dpc3QtbWV0YScsXG4vL1x0J2dsb2JhbCcsXG5cdCdnb29nbGUnLFxuXHQnZ29vZy0nLFxuXHQnZ3JhcGgtdmlldycsXG5cdCdoZWFkZXItbG9nbycsXG5cdCdoZWFkZXItcGF0dGVybicsIC8vIFRoZSBWZXJnZVxuXHQnaGVyby1saXN0Jyxcblx0J2hpZGUtZm9yLXByaW50Jyxcblx0J2hpZGUtcHJpbnQnLFxuXHQnaGlkZS13aGVuLW5vLXNjcmlwdCcsXG5cdCdoaWRkZW4tc2lkZW5vdGUnLFxuXHQnaW50ZXJsdWRlJyxcblx0J2ludGVyYWN0aW9uJyxcblx0J2p1bXBsaW5rJyxcblx0J2p1bXAtdG8tJyxcbi8vXHQna2V5d29yZCcsIC8vIHVzZWQgaW4gc3ludGF4IGhpZ2hsaWdodGluZ1xuXHQna2lja2VyJyxcblx0J2xhYnN0YWInLCAvLyBBcnhpdlxuXHQnLWxhYmVscycsXG5cdCdsYW5ndWFnZS1uYW1lJyxcblx0J2xhdGVzdC1jb250ZW50Jyxcblx0Jy1sZWRlcy0nLCAvLyBUaGUgVmVyZ2Vcblx0Jy1saWNlbnNlJyxcblx0J2xpbmstYm94Jyxcblx0J2xpbmtzLWdyaWQnLCAvLyBCQkNcblx0J2xpbmtzLXRpdGxlJywgLy8gQkJDXG5cdCdsaXN0aW5nLWR5bmFtaWMtdGVybXMnLCAvLyBCb3N0b24gUmV2aWV3XG5cdCdsaXN0LXRhZ3MnLFxuXHQnbG9hZGluZycsXG5cdCdsb2EtaW5mbycsXG5cdCdsb2dvX2NvbnRhaW5lcicsXG5cdCdsdHhfcm9sZV9yZWZudW0nLCAvLyBBcnhpdlxuXHQnbHR4X3RhZ19iaWJpdGVtJyxcblx0J2x0eF9lcnJvcicsXG5cdCdtYXJrZXRpbmcnLFxuXHQnbWVkaWEtaW5xdWlyeScsXG5cdCdtZW51LScsXG5cdCdtZXRhLScsXG5cdCdtZXRhZGF0YScsXG5cdCdtaWdodC1saWtlJyxcblx0J19tb2RhbCcsXG5cdCctbW9kYWwnLFxuXHQnbW9yZS0nLFxuXHQnbW9yZW5ld3MnLFxuXHQnbW9yZXN0b3JpZXMnLFxuXHQnbW92ZS1oZWxwZXInLFxuXHQnbXctZWRpdHNlY3Rpb24nLFxuXHQnbXctY2l0ZS1iYWNrbGluaycsXG5cdCdtdy1pbmRpY2F0b3JzJyxcblx0J213LWp1bXAtbGluaycsXG5cdCduYXYtJyxcblx0J25hdl8nLFxuXHQnbmF2YmFyJyxcbi8vXHQnbmF2aWdhdGlvbicsXG5cdCduZXh0LScsXG5cdCduZXdzLXN0b3J5LXRpdGxlJyxcbi8vXHQnbmV3c2xldHRlcicsIHVzZWQgb24gU3Vic3RhY2tcblx0J25ld3NsZXR0ZXJfJyxcblx0J25ld3NsZXR0ZXItc2lnbnVwJyxcblx0J25ld3NsZXR0ZXJzaWdudXAnLFxuXHQnbmV3c2xldHRlcndpZGdldCcsXG5cdCduZXdzbGV0dGVyd3JhcHBlcicsXG5cdCdub3QtZm91bmQnLFxuXHQnbm9tb2JpbGUnLFxuXHQnbm9wcmludCcsXG5cdCdvcmlnaW5hbGx5LXB1Ymxpc2hlZCcsIC8vIE1lcmN1cnkgTmV3c1xuXHQnb3V0bGluZS12aWV3Jyxcblx0J292ZXJsYXknLFxuXHQncGFnZS10aXRsZScsXG5cdCctcGFydG5lcnMnLFxuXHQncGxlYScsXG5cdCdwb3B1bGFyJyxcbi8vXHQncG9wdXAnLCBHd2VyblxuXHQncG9wLXVwJyxcblx0J3BvcG92ZXInLFxuXHQncG9zdC1ib3R0b20nLFxuXHQncG9zdF9fY2F0ZWdvcnknLFxuXHQncG9zdGNvbW1lbnQnLFxuXHQncG9zdGRhdGUnLFxuXHQncG9zdC1hdXRob3InLFxuXHQncG9zdC1kYXRlJyxcblx0J3Bvc3RfZGF0ZScsXG5cdCdwb3N0LWZlZWRzJyxcblx0J3Bvc3RpbmZvJyxcblx0J3Bvc3QtaW5mbycsXG5cdCdwb3N0X2luZm8nLFxuXHQncG9zdC1pbmxpbmUtZGF0ZScsXG5cdCdwb3N0LWxpbmtzJyxcblx0J3Bvc3QtbWV0YScsXG5cdCdwb3N0bWV0YScsXG5cdCdwb3N0c25pcHBldCcsXG5cdCdwb3N0X3NuaXBwZXQnLFxuXHQncG9zdC1zbmlwcGV0Jyxcblx0J3Bvc3R0aXRsZScsXG5cdCdwb3N0LXRpdGxlJyxcblx0J3Bvc3RfdGl0bGUnLFxuXHQncG9zdHRheCcsXG5cdCdwb3N0LXRheCcsXG5cdCdwb3N0X3RheCcsXG5cdCdwb3N0dGFnJyxcblx0J3Bvc3RfdGFnJyxcblx0J3Bvc3QtdGFnJyxcbi8vXHQncHJldmlldycsIHVzZWQgb24gT2JzaWRpYW4gUHVibGlzaFxuXHQncHJldm5leHQnLFxuXHQncHJldmlvdXNuZXh0Jyxcblx0J3ByZXNzLWlucXVpcmllcycsXG5cdCdwcmludC1ub25lJyxcblx0J3ByaW50LWhlYWRlcicsXG5cdCdwcm9maWxlJyxcbi8vXHQncHJvbW8nLFxuXHQncHJvbW8tYm94Jyxcblx0J3B1YmRhdGUnLFxuXHQncHViX2RhdGUnLFxuXHQncHViLWRhdGUnLFxuXHQncHVibGljYXRpb24tZGF0ZScsXG5cdCdwdWJsaWNhdGlvbk5hbWUnLCAvLyBNZWRpdW1cblx0J3FyLWNvZGUnLFxuXHQncXJfY29kZScsXG5cdCdfcmFpbCcsXG5cdCdyZWFkbW9yZScsXG5cdCdyZWFkLW5leHQnLFxuXHQncmVhZF9uZXh0Jyxcblx0J3JlYWRfdGltZScsXG5cdCdyZWFkLXRpbWUnLFxuXHQncmVhZGluZ190aW1lJyxcblx0J3JlYWRpbmctdGltZScsXG5cdCdyZWFkaW5nLWxpc3QnLFxuXHQncmVjZW50cG9zdCcsXG5cdCdyZWNlbnRfcG9zdCcsXG5cdCdyZWNlbnQtcG9zdCcsXG5cdCdyZWNvbW1lbmQnLFxuXHQncmVkaXJlY3RlZGZyb20nLFxuXHQncmVjaXJjJyxcblx0J3JlZ2lzdGVyJyxcblx0J3JlbGF0ZWQnLFxuXHQncmVsZXZhbnQnLFxuXHQncmV2ZXJzZWZvb3Rub3RlJyxcblx0J3NjcmVlbi1yZWFkZXItdGV4dCcsXG4vL1x0J3NoYXJlJyxcbi8vXHQnLXNoYXJlJywgc2NpdGVjaGRhaWx5LmNvbVxuXHQnc2hhcmUtYm94Jyxcblx0J3NoYXJlZGFkZHknLFxuXHQnc2hhcmUtaWNvbnMnLFxuXHQnc2hhcmVsaW5rcycsXG5cdCdzaGFyZS1zZWN0aW9uJyxcblx0J3NpZGViYXJ0aXRsZScsXG5cdCdzaWRlYmFyXycsXG5cdCdzaWRlYmFyLWNvbnRlbnQnLFxuXHQnc2ltaWxhci0nLFxuXHQnc2ltaWxhcl8nLFxuXHQnc2ltaWxhcnMtJyxcblx0J3NpZGVpdGVtcycsXG5cdCdzaWRlLWJveCcsXG5cdCdzaXRlLWluZGV4Jyxcblx0J3NpdGUtaGVhZGVyJyxcblx0J3NpdGUtbG9nbycsXG5cdCdzaXRlLW5hbWUnLFxuLy9cdCdza2lwLScsXG4vL1x0J3NraXAtbGluaycsIFRlY2hDcnVuY2hcblx0J19za2lwLWxpbmsnLFxuXHQnc2x1Zy13cmFwJyxcblx0J3NvY2lhbCcsXG5cdCdzcGVlY2hpZnktaWdub3JlJyxcblx0J3Nwb25zb3InLFxuXHQnc3ByaW5nZXJjaXRhdGlvbicsXG4vL1x0Jy1zdGF0cycsXG5cdCdfc3RhdHMnLFxuXHQnc3RpY2t5Jyxcblx0J3N0b3J5cmVhZHRpbWUnLCAvLyBNZWRpdW1cblx0J3N0b3J5cHVibGlzaGRhdGUnLCAvLyBNZWRpdW1cblx0J3N1YmplY3QtbGFiZWwnLFxuXHQnc3Vic2NyaWJlJyxcblx0J190YWdzJyxcblx0J3RhZ3NfX2l0ZW0nLFxuXHQndGFnX2xpc3QnLFxuXHQndGF4b25vbXknLFxuXHQndGFibGUtb2YtY29udGVudHMnLFxuXHQndGFicy0nLFxuLy9cdCd0ZWFzZXInLCBOYXR1cmVcblx0J3Rlcm1pbmFsdG91dCcsXG5cdCd0aW1lLXJ1YnJpYycsXG5cdCd0aW1lc3RhbXAnLFxuXHQndGlwX29mZicsXG5cdCd0aXB0b3V0Jyxcblx0Jy10b3V0LScsXG5cdCctdG9jJyxcblx0J3RvZ2dsZS1jYXB0aW9uJyxcblx0J3RvcGljLWxpc3QnLFxuXHQndG9vbGJhcicsXG5cdCd0b29sdGlwJyxcblx0J3RvcC13cmFwcGVyJyxcblx0J3RyZWUtaXRlbScsXG5cdCd0cmVuZGluZycsXG5cdCd0cnVzdC1mZWF0Jyxcblx0J3RydXN0LWJhZGdlJyxcblx0J3R3aXR0ZXInLFxuXHQndmlzdWFsbHktaGlkZGVuJyxcblx0J3dlbGNvbWVib3gnXG4vL1x0J3dpZGdldC0nXG5dO1xuXG4vLyBTZWxlY3RvcnMgZm9yIGZvb3Rub3RlcyBhbmQgY2l0YXRpb25zXG5leHBvcnQgY29uc3QgRk9PVE5PVEVfSU5MSU5FX1JFRkVSRU5DRVMgPSBbXG5cdCdzdXAucmVmZXJlbmNlJyxcblx0J2NpdGUubHR4X2NpdGUnLFxuXHQnc3VwW2lkXj1cImZuclwiXScsXG5cdCdzdXBbaWRePVwiZm5yZWY6XCJdJyxcblx0J3NwYW4uZm9vdG5vdGUtbGluaycsXG5cdCdhLmNpdGF0aW9uJyxcblx0J2FbaWRePVwicmVmLWxpbmtcIl0nLFxuXHQnYVtocmVmXj1cIiNmblwiXScsXG5cdCdhW2hyZWZePVwiI2NpdGVcIl0nLFxuXHQnYVtocmVmXj1cIiNyZWZlcmVuY2VcIl0nLFxuXHQnYVtocmVmXj1cIiNmb290bm90ZVwiXScsXG5cdCdhW2hyZWZePVwiI3JcIl0nLCAvLyBDb21tb24gaW4gYWNhZGVtaWMgcGFwZXJzXG5cdCdhW2hyZWZePVwiI2JcIl0nLCAvLyBDb21tb24gZm9yIGJpYmxpb2dyYXBoeSByZWZlcmVuY2VzXG5cdCdhW2hyZWYqPVwiY2l0ZV9ub3RlXCJdJyxcblx0J2FbaHJlZio9XCJjaXRlX3JlZlwiXScsXG5cdCdhLmZvb3Rub3RlLWFuY2hvcicsIC8vIFN1YnN0YWNrXG5cdCdzcGFuLmZvb3Rub3RlLWhvdmVyY2FyZC10YXJnZXQgYScsIC8vIFN1YnN0YWNrXG5cdCdhW3JvbGU9XCJkb2MtYmlibGlvcmVmXCJdJywgLy8gU2NpZW5jZS5vcmdcblx0J2FbaWRePVwiZm5yZWZcIl0nLFxuXHQnYVtpZF49XCJyZWYtbGlua1wiXScsIC8vIE5hdHVyZS5jb21cbl0uam9pbignLCcpO1xuXG5leHBvcnQgY29uc3QgRk9PVE5PVEVfTElTVF9TRUxFQ1RPUlMgPSBbXG5cdCdkaXYuZm9vdG5vdGUgb2wnLFxuXHQnZGl2LmZvb3Rub3RlcyBvbCcsXG5cdCdkaXZbcm9sZT1cImRvYy1lbmRub3Rlc1wiXScsXG5cdCdkaXZbcm9sZT1cImRvYy1mb290bm90ZXNcIl0nLFxuXHQnb2wuZm9vdG5vdGVzLWxpc3QnLFxuXHQnb2wuZm9vdG5vdGVzJyxcblx0J29sLnJlZmVyZW5jZXMnLFxuXHQnb2xbY2xhc3MqPVwiYXJ0aWNsZS1yZWZlcmVuY2VzXCJdJyxcblx0J3NlY3Rpb24uZm9vdG5vdGVzIG9sJyxcblx0J3NlY3Rpb25bcm9sZT1cImRvYy1lbmRub3Rlc1wiXScsXG5cdCdzZWN0aW9uW3JvbGU9XCJkb2MtZm9vdG5vdGVzXCJdJyxcblx0J3NlY3Rpb25bcm9sZT1cImRvYy1iaWJsaW9ncmFwaHlcIl0nLFxuXHQndWwuZm9vdG5vdGVzLWxpc3QnLFxuXHQndWwubHR4X2JpYmxpc3QnLFxuXHQnZGl2LmZvb3Rub3RlW2RhdGEtY29tcG9uZW50LW5hbWU9XCJGb290bm90ZVRvRE9NXCJdJyAvLyBTdWJzdGFja1xuXS5qb2luKCcsJyk7XG5cbi8vIEVsZW1lbnRzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYmUgZW1wdHlcbi8vIFRoZXNlIGFyZSBub3QgcmVtb3ZlZCBldmVuIGlmIHRoZXkgaGF2ZSBubyBjb250ZW50XG5leHBvcnQgY29uc3QgQUxMT1dFRF9FTVBUWV9FTEVNRU5UUyA9IG5ldyBTZXQoW1xuXHQnYXJlYScsXG5cdCdhdWRpbycsXG5cdCdiYXNlJyxcblx0J2JyJyxcblx0J2NpcmNsZScsXG5cdCdjb2wnLFxuXHQnZGVmcycsXG5cdCdlbGxpcHNlJyxcblx0J2VtYmVkJyxcblx0J2ZpZ3VyZScsXG5cdCdnJyxcblx0J2hyJyxcblx0J2lmcmFtZScsXG5cdCdpbWcnLFxuXHQnaW5wdXQnLFxuXHQnbGluZScsXG5cdCdsaW5rJyxcblx0J21hc2snLFxuXHQnbWV0YScsXG5cdCdvYmplY3QnLFxuXHQncGFyYW0nLFxuXHQncGF0aCcsXG5cdCdwYXR0ZXJuJyxcblx0J3BpY3R1cmUnLFxuXHQncG9seWdvbicsXG5cdCdwb2x5bGluZScsXG5cdCdyZWN0Jyxcblx0J3NvdXJjZScsXG5cdCdzdG9wJyxcblx0J3N2ZycsXG5cdCd0ZCcsXG5cdCd0aCcsXG5cdCd0cmFjaycsXG5cdCd1c2UnLFxuXHQndmlkZW8nLFxuXHQnd2JyJ1xuXSk7XG5cbi8vIEF0dHJpYnV0ZXMgdG8ga2VlcFxuZXhwb3J0IGNvbnN0IEFMTE9XRURfQVRUUklCVVRFUyA9IG5ldyBTZXQoW1xuXHQnYWx0Jyxcblx0J2FsbG93Jyxcblx0J2FsbG93ZnVsbHNjcmVlbicsXG5cdCdhcmlhLWxhYmVsJyxcblx0J2NoZWNrZWQnLFxuXHQnY29sc3BhbicsXG5cdCdjb250cm9scycsXG5cdCdkYXRhLXNyYycsXG5cdCdkYXRhLXNyY3NldCcsXG5cdCdkYXRhLWxhbmcnLFxuXHQnZGlyJyxcblx0J2ZyYW1lYm9yZGVyJyxcblx0J2hlYWRlcnMnLFxuXHQnaGVpZ2h0Jyxcblx0J2hyZWYnLFxuXHQnbGFuZycsXG5cdCdyb2xlJyxcblx0J3Jvd3NwYW4nLFxuXHQnc3JjJyxcblx0J3NyY3NldCcsXG5cdCd0aXRsZScsXG5cdCd0eXBlJyxcblx0J3dpZHRoJ1xuXSk7XG5leHBvcnQgY29uc3QgQUxMT1dFRF9BVFRSSUJVVEVTX0RFQlVHID0gbmV3IFNldChbXG5cdCdjbGFzcycsXG5cdCdpZCcsXG5dKTtcblxuLy8gU3VwcG9ydGVkIGxhbmd1YWdlcyBmb3IgY29kZSBibG9ja3NcbmV4cG9ydCBjb25zdCBTVVBQT1JURURfTEFOR1VBR0VTID0gbmV3IFNldChbXG5cdC8vIE1hcmt1cCAmIFdlYlxuXHQnbWFya3VwJywgJ2h0bWwnLCAneG1sJywgJ3N2ZycsICdtYXRobWwnLCAnc3NtbCcsICdhdG9tJywgJ3JzcycsXG5cdCdqYXZhc2NyaXB0JywgJ2pzJywgJ2pzeCcsICd0eXBlc2NyaXB0JywgJ3RzJywgJ3RzeCcsXG5cdCd3ZWJhc3NlbWJseScsICd3YXNtJyxcblx0XG5cdC8vIENvbW1vbiBQcm9ncmFtbWluZyBMYW5ndWFnZXNcblx0J3B5dGhvbicsXG5cdCdqYXZhJyxcblx0J2NzaGFycCcsICdjcycsICdkb3RuZXQnLCAnYXNwbmV0Jyxcblx0J2NwcCcsICdjKysnLCAnYycsICdvYmpjJyxcblx0J3J1YnknLCAncmInLFxuXHQncGhwJyxcblx0J2dvbGFuZycsXG5cdCdydXN0Jyxcblx0J3N3aWZ0Jyxcblx0J2tvdGxpbicsXG5cdCdzY2FsYScsXG5cdCdkYXJ0Jyxcblx0XG5cdC8vIFNoZWxsICYgU2NyaXB0aW5nXG5cdCdiYXNoJywgJ3NoZWxsJywgJ3NoJyxcblx0J3Bvd2Vyc2hlbGwnLFxuXHQnYmF0Y2gnLFxuXHRcblx0Ly8gRGF0YSAmIENvbmZpZ1xuXHQnanNvbicsICdqc29ucCcsXG5cdCd5YW1sJywgJ3ltbCcsXG5cdCd0b21sJyxcblx0J2RvY2tlcmZpbGUnLFxuXHQnZ2l0aWdub3JlJyxcblx0XG5cdC8vIFF1ZXJ5IExhbmd1YWdlc1xuXHQnc3FsJywgJ215c3FsJywgJ3Bvc3RncmVzcWwnLFxuXHQnZ3JhcGhxbCcsXG5cdCdtb25nb2RiJyxcblx0J3NwYXJxbCcsXG5cdFxuXHQvLyBNYXJrdXAgJiBEb2N1bWVudGF0aW9uXG5cdCdtYXJrZG93bicsICdtZCcsXG5cdCdsYXRleCcsICd0ZXgnLFxuXHQnYXNjaWlkb2MnLCAnYWRvYycsXG5cdCdqc2RvYycsXG5cdFxuXHQvLyBGdW5jdGlvbmFsIExhbmd1YWdlc1xuXHQnaGFza2VsbCcsICdocycsXG5cdCdlbG0nLFxuXHQnZWxpeGlyJyxcblx0J2VybGFuZycsXG5cdCdvY2FtbCcsXG5cdCdmc2hhcnAnLFxuXHQnc2NoZW1lJyxcblx0J2xpc3AnLCAnZWxpc3AnLFxuXHQnY2xvanVyZScsXG5cdFxuXHQvLyBPdGhlciBMYW5ndWFnZXNcblx0J21hdGxhYicsXG5cdCdmb3J0cmFuJyxcblx0J2NvYm9sJyxcblx0J3Bhc2NhbCcsXG5cdCdwZXJsJyxcblx0J2x1YScsXG5cdCdqdWxpYScsXG5cdCdncm9vdnknLFxuXHQnY3J5c3RhbCcsXG5cdCduaW0nLFxuXHQnemlnJyxcblx0XG5cdC8vIERvbWFpbiBTcGVjaWZpY1xuXHQncmVnZXgnLFxuXHQnZ3JhZGxlJyxcblx0J2NtYWtlJyxcblx0J21ha2VmaWxlJyxcblx0J25peCcsXG5cdCd0ZXJyYWZvcm0nLFxuXHQnc29saWRpdHknLFxuXHQnZ2xzbCcsXG5cdCdobHNsJyxcblx0XG5cdC8vIEFzc2VtYmx5XG5cdCduYXNtJyxcblx0J21hc20nLFxuXHQnYXJtYXNtJyxcblx0XG5cdC8vIEdhbWUgRGV2ZWxvcG1lbnRcblx0J2dkc2NyaXB0Jyxcblx0J3VucmVhbHNjcmlwdCcsXG5cdFxuXHQvLyBPdGhlcnNcblx0J2FiYXAnLFxuXHQnYWN0aW9uc2NyaXB0Jyxcblx0J2FkYScsXG5cdCdhZ2RhJyxcblx0J2FudGxyNCcsXG5cdCdhcHBsZXNjcmlwdCcsXG5cdCdhcmR1aW5vJyxcblx0J2NvZmZlZXNjcmlwdCcsXG5cdCdkamFuZ28nLFxuXHQnZXJsYW5nJyxcblx0J2ZvcnRyYW4nLFxuXHQnaGF4ZScsXG5cdCdpZHJpcycsXG5cdCdrb3RsaW4nLFxuXHQnbGl2ZXNjcmlwdCcsXG5cdCdtYXRsYWInLFxuXHQnbmdpbngnLFxuXHQncGFzY2FsJyxcblx0J3Byb2xvZycsXG5cdCdwdXBwZXQnLFxuXHQnc2NhbGEnLFxuXHQnc2NoZW1lJyxcblx0J3RjbCcsXG5cdCd2ZXJpbG9nJyxcblx0J3ZoZGwnXG5dKTtcblxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsImV4cG9ydCB7IERlZnVkZGxlIH0gZnJvbSAnLi9kZWZ1ZGRsZSc7XG5leHBvcnQgdHlwZSB7IERlZnVkZGxlT3B0aW9ucywgRGVmdWRkbGVSZXNwb25zZSwgRGVmdWRkbGVNZXRhZGF0YSB9IGZyb20gJy4vdHlwZXMnOyAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
