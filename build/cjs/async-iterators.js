'use strict';

var wrapIdbValue = require('./wrap-idb-value.js');

var __await = (undefined && undefined.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); };
var __asyncGenerator = (undefined && undefined.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
function iterate(...args) {
    return __asyncGenerator(this, arguments, function* iterate_1() {
        // tslint:disable-next-line:no-this-assignment
        let cursor = this;
        if (!(cursor instanceof IDBCursor)) {
            cursor = yield __await(cursor.openCursor(...args));
        }
        if (!cursor)
            return yield __await(void 0);
        cursor = cursor;
        const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
        ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
        // Map this double-proxy back to the original, so other cursor methods work.
        wrapIdbValue.reverseTransformCache.set(proxiedCursor, wrapIdbValue.unwrap(cursor));
        while (cursor) {
            yield yield __await(proxiedCursor);
            // If one of the advancing methods was not called, call continue().
            cursor = yield __await((advanceResults.get(proxiedCursor) || cursor.continue()));
            advanceResults.delete(proxiedCursor);
        }
    });
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        wrapIdbValue.instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && wrapIdbValue.instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
wrapIdbValue.replaceTraps((oldTraps) => (Object.assign(Object.assign({}, oldTraps), { get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    } })));
