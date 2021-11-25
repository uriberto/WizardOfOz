var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = import_stream.default.Readable.from(body.stream());
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error2 = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index, array) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals && globals.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next, rejectLoop);
                  }
                }
                next(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable, "readable", "ReadableWritablePair");
          assertReadableStream(readable, `${context} has member 'readable' that`);
          const writable2 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable2, "writable", "ReadableWritablePair");
          assertWritableStream(writable2, `${context} has member 'writable' that`);
          return { readable, writable: writable2 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable2 = stream._writable;
              const state = writable2._state;
              if (state === "erroring") {
                throw writable2._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable._state === "errored") {
              throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        import_stream.default.Readable.from(body.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/@lukeed/uuid/dist/index.mjs
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}
var IDX, HEX, BUFFER;
var init_dist = __esm({
  "node_modules/@lukeed/uuid/dist/index.mjs"() {
    init_shims();
    IDX = 256;
    HEX = [];
    while (IDX--)
      HEX[IDX] = (IDX + 256).toString(16).substring(1);
  }
});

// .svelte-kit/output/server/chunks/_api-cf43c630.js
async function api(request, resource, data) {
  if (!request.locals.userid) {
    return { status: 401 };
  }
  const res = await fetch(`${base}/${resource}`, {
    method: request.method,
    headers: {
      "content-type": "application/json"
    },
    body: data && JSON.stringify(data)
  });
  if (res.ok && request.method !== "GET" && request.headers.accept !== "application/json") {
    return {
      status: 303,
      headers: {
        location: "/todos"
      }
    };
  }
  return {
    status: res.status,
    body: await res.json()
  };
}
var base;
var init_api_cf43c630 = __esm({
  ".svelte-kit/output/server/chunks/_api-cf43c630.js"() {
    init_shims();
    base = "https://api.svelte.dev";
  }
});

// .svelte-kit/output/server/chunks/index.json-288c2c7b.js
var index_json_288c2c7b_exports = {};
__export(index_json_288c2c7b_exports, {
  get: () => get,
  post: () => post
});
var get, post;
var init_index_json_288c2c7b = __esm({
  ".svelte-kit/output/server/chunks/index.json-288c2c7b.js"() {
    init_shims();
    init_api_cf43c630();
    get = async (request) => {
      const response = await api(request, `todos/${request.locals.userid}`);
      if (response.status === 404) {
        return { body: [] };
      }
      return response;
    };
    post = async (request) => {
      const response = await api(request, `todos/${request.locals.userid}`, {
        text: request.body.get("text")
      });
      return response;
    };
  }
});

// .svelte-kit/output/server/chunks/_uid_.json-095450d2.js
var uid_json_095450d2_exports = {};
__export(uid_json_095450d2_exports, {
  del: () => del,
  patch: () => patch
});
var patch, del;
var init_uid_json_095450d2 = __esm({
  ".svelte-kit/output/server/chunks/_uid_.json-095450d2.js"() {
    init_shims();
    init_api_cf43c630();
    patch = async (request) => {
      return api(request, `todos/${request.locals.userid}/${request.params.uid}`, {
        text: request.body.get("text"),
        done: request.body.has("done") ? !!request.body.get("done") : void 0
      });
    };
    del = async (request) => {
      return api(request, `todos/${request.locals.userid}/${request.params.uid}`);
    };
  }
});

// .svelte-kit/output/server/chunks/__layout-4d64fb3d.js
var layout_4d64fb3d_exports = {};
__export(layout_4d64fb3d_exports, {
  default: () => _layout
});
var import_cookie, _layout;
var init_layout_4d64fb3d = __esm({
  ".svelte-kit/output/server/chunks/__layout-4d64fb3d.js"() {
    init_shims();
    init_app_c342cded();
    import_cookie = __toModule(require_cookie());
    init_dist();
    _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<main class="${"bg-base-100"}" data-theme="${"light"}">${slots.default ? slots.default({}) : ``}</main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/error-47c7227d.js
var error_47c7227d_exports = {};
__export(error_47c7227d_exports, {
  default: () => Error2,
  load: () => load
});
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var import_cookie2, Error2;
var init_error_47c7227d = __esm({
  ".svelte-kit/output/server/chunks/error-47c7227d.js"() {
    init_shims();
    init_app_c342cded();
    import_cookie2 = __toModule(require_cookie());
    init_dist();
    Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { status } = $$props;
      let { error: error2 } = $$props;
      if ($$props.status === void 0 && $$bindings.status && status !== void 0)
        $$bindings.status(status);
      if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
        $$bindings.error(error2);
      return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-2238331e.js
var index_2238331e_exports = {};
__export(index_2238331e_exports, {
  default: () => Routes,
  prerender: () => prerender
});
var import_cookie3, prerender, Routes;
var init_index_2238331e = __esm({
  ".svelte-kit/output/server/chunks/index-2238331e.js"() {
    init_shims();
    init_app_c342cded();
    import_cookie3 = __toModule(require_cookie());
    init_dist();
    prerender = true;
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `${$$result.title = `<title>Wizard Of Oz Illustrations</title>`, ""}`, ""}

<div class="${"hero min-h-screen bg-base-200"}"><div class="${"flex-col hero-content lg:flex-row-reverse"}"><img src="${"/WizardOfOz/Images/Wonderful%20Wizard%20Of%20Oz/i075_edit.jpg"}" class="${"max-w-sm rounded-lg shadow-2xl"}"> 
		<div><h1 class="${"mb-5 text-5xl font-bold"}">Wizard Of Oz Illustrations
				</h1> 
			<p class="${"mb-5"}">This site gathers together the illustrations from the classic L. Frank Baum book series including: The Wonderful Wizard of Oz,
				The Marvelous Land of Oz, Ozma of Oz, Dorothy and the Wizard in Oz, The Road to Oz, The Emerald City of Oz, The Patchwork Girl of Oz,
				Tik-Tok of Oz, The Scarecrow of Oz, Rinkitink in Oz, The Lost Princess of Oz, The Tin Woodman of Oz, The Magic of Oz, 
				and Glinda of Oz.
			</p> 
			<p class="${"mb-7"}">This site made with love for my little tin woodman, scarecrow, and cowardly lion. 
			</p>
			<div class="${"flex flex-row items-center justify-center gap-3"}"><button class="${"btn btn-primary"}">Books</button><button class="${"btn btn-primary"}">Characters</button></div></div></div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/env-df325643.js
var browser, dev;
var init_env_df325643 = __esm({
  ".svelte-kit/output/server/chunks/env-df325643.js"() {
    init_shims();
    browser = false;
    dev = false;
  }
});

// .svelte-kit/output/server/chunks/ImgItem-771f60f5.js
var ImgItem;
var init_ImgItem_771f60f5 = __esm({
  ".svelte-kit/output/server/chunks/ImgItem-771f60f5.js"() {
    init_shims();
    init_app_c342cded();
    ImgItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { link } = $$props;
      let { src: src2 = "/WizardOfOz/Images/Wonderful Wizard Of Oz/0001v.jpg" } = $$props;
      let { charname } = $$props;
      if ($$props.link === void 0 && $$bindings.link && link !== void 0)
        $$bindings.link(link);
      if ($$props.src === void 0 && $$bindings.src && src2 !== void 0)
        $$bindings.src(src2);
      if ($$props.charname === void 0 && $$bindings.charname && charname !== void 0)
        $$bindings.charname(charname);
      return `${charname ? `<a${add_attribute("href", link, 0)}${add_attribute("rel", link.endsWith("jpg") || link.endsWith("png") ? "external" : "", 0)} class="${"card bordered xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-1/2 px-2 mb-4"}"><figure><img${add_attribute("src", src2, 0)}></figure> 
		<div class="${"card-body"}"><h2 class="${"card-title text-center"}">${escape(charname)}</h2></div></a>` : `<a rel="${"external"}"${add_attribute("href", link, 0)} class="${"xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-1/2 px-2 mb-4"}"><img style="${"width:100%;height:auto;"}" class="${["rounded-3xl ", link ? "cursor-pointer" : ""].join(" ").trim()}"${add_attribute("src", src2, 0)}></a>`}`;
    });
  }
});

// .svelte-kit/output/server/chunks/file_list-05c68039.js
function character_book_img_list(character, book) {
  if (book == "twwoo" || book == "tmloo")
    return window.eval(character + "_in_" + book);
  return [];
}
function charactername(slug) {
  switch (slug) {
    case "dorothy":
      return "Dorothy Gale";
    case "scarecrow":
      return "Scarecrow";
    case "tinwoodman":
      return "Tin Woodman";
    case "toto":
      return "Toto";
    case "cowardlylion":
      return "Cowardly Lion";
    case "glinda":
      return "Glinda the Good Witch of the South";
    case "wogglebug":
      return "H. M. Woggle-Bug, T.E.";
    case "jinjur":
      return "General Jinjur";
    case "munchkins":
      return "The Munchkins";
    case "kalida":
      return "Kalida Monsters";
    case "wizardofoz":
      return "The Wizard of Oz";
    case "flyingmonkeys":
      return "Flying Monkeys";
    case "witchofthewest":
      return "The Wicked Witch of the West";
    case "witchofthenorth":
      return "The Witch of the North";
    case "jackpumpkinhead":
      return "Jack Pumpkinhead";
    case "hammerheads":
      return "The Hammer Heads";
    case "tip":
      return "Tip";
    case "sawhorse":
      return "The Sawhorse";
    case "gump":
      return "The Gump";
    case "mombi":
      return "Mombi";
    case "ozma":
      return "Princess Ozma of Oz";
    case "fieldmice":
      return "Fieldmice";
    case "jelliajamb":
      return "Jellia Jamb";
    case "fightingtree":
      return "The fighting trees";
    case "gotg":
      return "The guardian of the gate";
    case "aoo":
      return "Soldier with the Green Whiskers";
    case "china":
      return "People of the china country";
    default:
      return "";
  }
}
var book_list, characterlist, img_list, title, directory;
var init_file_list_05c68039 = __esm({
  ".svelte-kit/output/server/chunks/file_list-05c68039.js"() {
    init_shims();
    book_list = ["twwoo", "tmloo", "ooo", "datwio", "trto", "tecoo", "tpgoo", "ttoo", "tsoo", "rio", "tlpoo", "ttwoo", "tmoo", "goo"];
    characterlist = [
      "dorothy",
      "scarecrow",
      "tinwoodman",
      "cowardlylion",
      "glinda",
      "wogglebug",
      "jackpumpkinhead",
      "jinjur",
      "toto",
      "munchkins",
      "kalida",
      "wizardofoz",
      "flyingmonkeys",
      "witchofthewest",
      "witchofthenorth",
      "hammerheads",
      "tip",
      "sawhorse",
      "gump",
      "mombi",
      "ozma",
      "jelliajamb",
      "fieldmice",
      "fightingtree",
      "gotg",
      "aoo",
      "china"
    ];
    img_list = (slug) => {
      return window.eval(slug + "_list");
    };
    title = (slug) => {
      switch (slug) {
        case "twwoo":
          return "The Wonderful Wizard of Oz";
        case "tmloo":
          return "The Marvelous Land of Oz";
        case "ooo":
          return "Ozma of Oz";
        case "datwio":
          return "Dorothy and the Wizard in Oz";
        case "trto":
          return "The Road to Oz";
        case "tecoo":
          return "The Emerald City of Oz";
        case "tpgoo":
          return "The Patchwork Girl of Oz";
        case "ttoo":
          return "Tik-Tok of Oz";
        case "tsoo":
          return "The Scarecrow of Oz";
        case "rio":
          return "Rinkitink in Oz";
        case "tlpoo":
          return "The Lost Princess of Oz";
        case "ttwoo":
          return "The Tin Woodman of Oz";
        case "tmoo":
          return "The Magic of Oz";
        case "goo":
          return "Glinda of Oz";
        default:
          return "";
      }
    };
    directory = (slug) => {
      switch (slug) {
        case "twwoo":
          return "WizardOfOz/Images/Wonderful Wizard Of Oz";
        case "tmloo":
          return "WizardOfOz/Images/Marvelous Land Of Oz Images";
        case "ooo":
          return "WizardOfOz/Images/Ozma Of Oz";
        case "datwio":
          return "WizardOfOz/Images/Dorothy And The Wizard In Oz";
        case "trto":
          return "WizardOfOz/Images/The Road To Oz";
        case "tecoo":
          return "WizardOfOz/Images/The Emerald City of Oz";
        case "tpgoo":
          return "WizardOfOz/Images/The Patchwork Girl Of Oz";
        case "ttoo":
          return "WizardOfOz/Images/Tik-tok Of Oz";
        case "tsoo":
          return "WizardOfOz/Images/The Scarecrow of Oz";
        case "rio":
          return "WizardOfOz/Images/Rinkitink in Oz";
        case "tlpoo":
          return "WizardOfOz/Images/The Lost Princess of Oz";
        case "ttwoo":
          return "WizardOfOz/Images/The Tin Woodman of Oz";
        case "tmoo":
          return "WizardOfOz/Images/The Magic of Oz";
        case "goo":
          return "WizardOfOz/Images/Glinda Of Oz";
        default:
          return "";
      }
    };
  }
});

// .svelte-kit/output/server/chunks/byCharacter-9ebeb2c2.js
var byCharacter_9ebeb2c2_exports = {};
__export(byCharacter_9ebeb2c2_exports, {
  default: () => ByCharacter,
  hydrate: () => hydrate,
  prerender: () => prerender2,
  router: () => router
});
var import_cookie4, hydrate, router, prerender2, ByCharacter;
var init_byCharacter_9ebeb2c2 = __esm({
  ".svelte-kit/output/server/chunks/byCharacter-9ebeb2c2.js"() {
    init_shims();
    init_app_c342cded();
    init_env_df325643();
    init_ImgItem_771f60f5();
    init_file_list_05c68039();
    import_cookie4 = __toModule(require_cookie());
    init_dist();
    hydrate = dev;
    router = browser;
    prerender2 = true;
    ByCharacter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `${$$result.title = `<title>Wizard Of Oz Characters</title>`, ""}`, ""}

<h1 class="${"p-10"}">The Wizard Of Oz Characters</h1>

<div class="${"flex flex-wrap -mb-4 container mx-auto"}">${each(characterlist, (character) => `${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "character/" + character,
        charname: charactername(character),
        src: "/WizardOfOz/Images/Characters/" + character + ".jpg"
      }, {}, {})}`)}</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/_slug_-ce389d9f.js
var slug_ce389d9f_exports = {};
__export(slug_ce389d9f_exports, {
  default: () => U5Bslugu5D,
  load: () => load2
});
async function load2({ page, fetch: fetch2, session, stuff }) {
  console.log({ page });
  return { props: { slug: page.params.slug } };
}
var import_cookie5, U5Bslugu5D;
var init_slug_ce389d9f = __esm({
  ".svelte-kit/output/server/chunks/_slug_-ce389d9f.js"() {
    init_shims();
    init_app_c342cded();
    init_ImgItem_771f60f5();
    init_file_list_05c68039();
    import_cookie5 = __toModule(require_cookie());
    init_dist();
    U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { slug } = $$props;
      if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
        $$bindings.slug(slug);
      return `<h1 class="${"p-10"}">${escape(charactername(slug))}</h1>

${each(book_list, (book) => `${character_book_img_list(slug, book).length ? `<div class="${"container mx-auto m-10"}"><h2 class="${"text-2xl ml-4"}">Illustrations from ${escape(title(book))}</h2></div>

        <div class="${"flex flex-wrap -mb-4 container mx-auto"}">${each(character_book_img_list(slug, book), (file) => `${validate_component(ImgItem, "ImgItem").$$render($$result, {
        src: "/" + directory(book) + "/" + file,
        link: "/" + directory(book) + "/" + file
      }, {}, {})}`)}

        </div>` : ``}`)}`;
    });
  }
});

// .svelte-kit/output/server/chunks/byBook-f63296e1.js
var byBook_f63296e1_exports = {};
__export(byBook_f63296e1_exports, {
  default: () => ByBook,
  hydrate: () => hydrate2,
  prerender: () => prerender3,
  router: () => router2
});
var import_cookie6, hydrate2, router2, prerender3, ByBook;
var init_byBook_f63296e1 = __esm({
  ".svelte-kit/output/server/chunks/byBook-f63296e1.js"() {
    init_shims();
    init_app_c342cded();
    init_env_df325643();
    init_ImgItem_771f60f5();
    import_cookie6 = __toModule(require_cookie());
    init_dist();
    hydrate2 = dev;
    router2 = browser;
    prerender3 = true;
    ByBook = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `${$$result.title = `<title>Wizard Of Oz Books</title>`, ""}`, ""}

<h1 class="${"p-10"}">The Wizard Of Oz Books</h1>

<div class="${"flex flex-wrap -mb-4 container mx-auto"}">${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/twwoo",
        title: "The Wonderful Wizard Of Oz",
        src: "/WizardOfOz/Images/Wonderful%20Wizard%20Of%20Oz/i001_edit.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tmloo",
        title: "The Marvelous Land of Oz",
        src: "/WizardOfOz/Images/Marvelous Land Of Oz Images/cover.jpeg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/ooo",
        title: "Ozma of Oz",
        src: "/WizardOfOz/Images/Ozma Of Oz/cover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/datwio",
        title: "Dorothy and the Wizard in Oz",
        src: "/WizardOfOz/Images/Dorothy And The Wizard In Oz/cover.jpeg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/trto",
        title: "The Road to Oz",
        src: "/WizardOfOz/Images/The Road To Oz/cover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tecoo",
        title: "The Emerald City of Oz",
        src: "/WizardOfOz/Images/The Emerald City of Oz/cover.jpg"
      }, {}, {})}
	
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tpgoo",
        title: "The Patchwork Girl of Oz",
        src: "/WizardOfOz/Images/The Patchwork Girl Of Oz/cover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/ttoo",
        title: "Tik-Tok of Oz",
        src: "/WizardOfOz/Images/Tik-tok Of Oz/cover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tsoo",
        title: "The Scarecrow of Oz",
        src: "/WizardOfOz/Images/The Scarecrow of Oz/cover2.jpg"
      }, {}, {})}

	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/rio",
        title: "Rinkitink in Oz",
        src: "/WizardOfOz/Images/Rinkitink in Oz/cover.jpg"
      }, {}, {})}

	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tlpoo",
        title: "The Lost Princess of Oz",
        src: "/WizardOfOz/Images/The Lost Princess of Oz/i_cover.png"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/ttwoo",
        title: "The Tin Woodman of Oz",
        src: "/WizardOfOz/Images/The Tin Woodman of Oz/icover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/tmoo",
        title: "The Magic of Oz",
        src: "/WizardOfOz/Images/The Magic of Oz/cover.jpg"
      }, {}, {})}
	${validate_component(ImgItem, "ImgItem").$$render($$result, {
        link: "book/goo",
        title: "Glinda of Oz",
        src: "/WizardOfOz/Images/Glinda Of Oz/cover.jpg"
      }, {}, {})}</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-c5e80781.js
var index_c5e80781_exports = {};
__export(index_c5e80781_exports, {
  default: () => Todos,
  load: () => load3
});
var import_cookie7, css, load3, Todos;
var init_index_c5e80781 = __esm({
  ".svelte-kit/output/server/chunks/index-c5e80781.js"() {
    init_shims();
    init_app_c342cded();
    import_cookie7 = __toModule(require_cookie());
    init_dist();
    css = {
      code: `.todos.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{line-height:1;margin:var(--column-margin-top) auto 0 auto;max-width:var(--column-width);width:100%}.new.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{margin:0 0 .5rem}input.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{border:1px solid transparent}input.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn:focus-visible{border:1px solid #ff3e00!important;box-shadow:inset 1px 1px 6px rgba(0,0,0,.1);outline:none}.new.svelte-16tkvjn input.svelte-16tkvjn.svelte-16tkvjn{background:hsla(0,0%,100%,.05);box-sizing:border-box;font-size:28px;padding:.5em 1em .3em;text-align:center;width:100%}.new.svelte-16tkvjn input.svelte-16tkvjn.svelte-16tkvjn,.todo.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{border-radius:8px}.todo.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{grid-gap:.5rem;align-items:center;background-color:#fff;display:grid;filter:drop-shadow(2px 4px 6px rgba(0,0,0,.1));grid-template-columns:2rem 1fr 2rem;margin:0 0 .5rem;padding:.5rem;transform:translate(-1px,-1px);transition:filter .2s,transform .2s}.done.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{filter:drop-shadow(0 0 1px rgba(0,0,0,.1));opacity:.4;transform:none}form.text.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{align-items:center;display:flex;flex:1;position:relative}.todo.svelte-16tkvjn input.svelte-16tkvjn.svelte-16tkvjn{border-radius:3px;flex:1;padding:.5em 2em .5em .8em}.todo.svelte-16tkvjn button.svelte-16tkvjn.svelte-16tkvjn{background-color:transparent;background-position:50% 50%;background-repeat:no-repeat;border:none;height:2em;width:2em}button.toggle.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{background-size:1em auto;border:1px solid rgba(0,0,0,.2);border-radius:50%;box-sizing:border-box}.done.svelte-16tkvjn .toggle.svelte-16tkvjn.svelte-16tkvjn{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='22' height='16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m20.5 1.5-13.063 13L1.5 8.59' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}.delete.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 5v17h15V5h-15Z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M10 10v6.5M14 10v6.5' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 5h20' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m8 5 1.645-3h4.744L16 5H8Z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E");opacity:.2}.delete.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn:focus,.delete.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn:hover{opacity:1;transition:opacity .2s}.save.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2Z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M17 2v9H7.5V2H17Z' fill='%23fff' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M13.5 5.5v2M5.998 2H18.5' stroke='%23676778' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");opacity:0;position:absolute;right:0}.save.svelte-16tkvjn.svelte-16tkvjn.svelte-16tkvjn:focus,.todo.svelte-16tkvjn input.svelte-16tkvjn:focus+.save.svelte-16tkvjn{opacity:1;transition:opacity .2s}`,
      map: null
    };
    load3 = async ({ fetch: fetch2 }) => {
      const res = await fetch2("/todos.json");
      if (res.ok) {
        const todos = await res.json();
        return { props: { todos } };
      }
      const { message } = await res.json();
      return { error: new Error(message) };
    };
    Todos = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { todos } = $$props;
      if ($$props.todos === void 0 && $$bindings.todos && todos !== void 0)
        $$bindings.todos(todos);
      $$result.css.add(css);
      return `${$$result.head += `${$$result.title = `<title>Todos</title>`, ""}`, ""}

<div class="${"todos svelte-16tkvjn"}"><h1>Todos</h1>

	<form class="${"new svelte-16tkvjn"}" action="${"/todos.json"}" method="${"post"}"><input name="${"text"}" aria-label="${"Add todo"}" placeholder="${"+ tap to add a todo"}" class="${"svelte-16tkvjn"}"></form>

	${each(todos, (todo) => `<div class="${["todo svelte-16tkvjn", todo.done ? "done" : ""].join(" ").trim()}"><form action="${"/todos/" + escape(todo.uid) + ".json?_method=patch"}" method="${"post"}"><input type="${"hidden"}" name="${"done"}"${add_attribute("value", todo.done ? "" : "true", 0)} class="${"svelte-16tkvjn"}">
				<button class="${"toggle svelte-16tkvjn"}" aria-label="${"Mark todo as " + escape(todo.done ? "not done" : "done")}"></button></form>

			<form class="${"text svelte-16tkvjn"}" action="${"/todos/" + escape(todo.uid) + ".json?_method=patch"}" method="${"post"}"><input aria-label="${"Edit todo"}" type="${"text"}" name="${"text"}"${add_attribute("value", todo.text, 0)} class="${"svelte-16tkvjn"}">
				<button class="${"save svelte-16tkvjn"}" aria-label="${"Save todo"}"></button></form>

			<form action="${"/todos/" + escape(todo.uid) + ".json?_method=delete"}" method="${"post"}"><button class="${"delete svelte-16tkvjn"}" aria-label="${"Delete todo"}" ${todo.pending_delete ? "disabled" : ""}></button></form>
		</div>`)}
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/_slug_-f84e6dab.js
var slug_f84e6dab_exports = {};
__export(slug_f84e6dab_exports, {
  default: () => U5Bslugu5D2,
  load: () => load4
});
async function load4({ page, fetch: fetch2, session, stuff }) {
  console.log({ page });
  return { props: { slug: page.params.slug } };
}
var import_cookie8, U5Bslugu5D2;
var init_slug_f84e6dab = __esm({
  ".svelte-kit/output/server/chunks/_slug_-f84e6dab.js"() {
    init_shims();
    init_app_c342cded();
    init_ImgItem_771f60f5();
    init_file_list_05c68039();
    import_cookie8 = __toModule(require_cookie());
    init_dist();
    U5Bslugu5D2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { slug } = $$props;
      if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
        $$bindings.slug(slug);
      return `<h1 class="${"p-10"}">${escape(title(slug))}</h1>

<div class="${"flex flex-wrap -mb-4 container mx-auto"}">${each(img_list(slug), (file) => `${validate_component(ImgItem, "ImgItem").$$render($$result, {
        src: "/" + directory(slug) + "/" + file,
        link: "/" + directory(slug) + "/" + file
      }, {}, {})}`)}</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-c342cded.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape$1(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css22 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css22.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css22).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${page && page.path ? try_serialize(page.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page && page.query ? s$1(page.query.toString()) : ""}),
						params: ${page && page.params ? try_serialize(page.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url)}`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
function resolve(base22, path) {
  const base_match = absolute.exec(base22);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base22}"`);
  }
  const baseparts = path_match ? [] : base22.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base2 = paths.base;
  assets = paths.assets || base2;
}
function set_prerendering(value) {
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-176a7546.js",
      css: [assets + "/_app/assets/start-464e9d0a.css"],
      js: [assets + "/_app/start-176a7546.js", assets + "/_app/chunks/vendor-c0c3cf9b.js", assets + "/_app/chunks/singletons-12a22614.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender4
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender4 });
}
var import_cookie9, __accessCheck, __privateGet, __privateAdd, __privateSet, _map, chars, unsafeChars, reserved, escaped$1, objectProtoOwnPropertyNames, subscriber_queue, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, absolute, ReadOnlyFormData, current_component, escaped, missing_component, on_destroy, css2, Root, base2, assets, handle, user_hooks, template, options, default_settings, d, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_c342cded = __esm({
  ".svelte-kit/output/server/chunks/app-c342cded.js"() {
    init_shims();
    import_cookie9 = __toModule(require_cookie());
    init_dist();
    __accessCheck = (obj, member, msg) => {
      if (!member.has(obj))
        throw TypeError("Cannot " + msg);
    };
    __privateGet = (obj, member, getter) => {
      __accessCheck(obj, member, "read from private field");
      return getter ? getter.call(obj) : member.get(obj);
    };
    __privateAdd = (obj, member, value) => {
      if (member.has(obj))
        throw TypeError("Cannot add the same private member more than once");
      member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
    };
    __privateSet = (obj, member, value, setter) => {
      __accessCheck(obj, member, "write to private field");
      setter ? setter.call(obj, value) : member.set(obj, value);
      return value;
    };
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped$1 = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    absolute = /^([a-z]+:)?\/?\//;
    ReadOnlyFormData = class {
      constructor(map) {
        __privateAdd(this, _map, void 0);
        __privateSet(this, _map, map);
      }
      get(key) {
        const value = __privateGet(this, _map).get(key);
        return value && value[0];
      }
      getAll(key) {
        return __privateGet(this, _map).get(key);
      }
      has(key) {
        return __privateGet(this, _map).has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of __privateGet(this, _map))
          yield key;
      }
      *values() {
        for (const [, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
    _map = new WeakMap();
    Promise.resolve();
    escaped = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css2 = {
      code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page !== void 0)
        $$bindings.page(page);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css2);
      {
        stores.page.set(page);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base2 = "";
    assets = "";
    handle = async ({ request, resolve: resolve2 }) => {
      const cookies = import_cookie9.default.parse(request.headers.cookie || "");
      request.locals.userid = cookies.userid || v4();
      if (request.query.has("_method")) {
        request.method = request.query.get("_method").toUpperCase();
      }
      const response = await resolve2(request);
      if (!cookies.userid) {
        response.headers["set-cookie"] = import_cookie9.default.serialize("userid", request.locals.userid, {
          path: "/",
          httpOnly: true
        });
      }
      return response;
    };
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      handle
    });
    template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    d = (s2) => s2.replace(/%23/g, "#").replace(/%3[Bb]/g, ";").replace(/%2[Cc]/g, ",").replace(/%2[Ff]/g, "/").replace(/%3[Ff]/g, "?").replace(/%3[Aa]/g, ":").replace(/%40/g, "@").replace(/%26/g, "&").replace(/%3[Dd]/g, "=").replace(/%2[Bb]/g, "+").replace(/%24/g, "$");
    empty = () => ({});
    manifest = {
      assets: [{ "file": ".DS_Store", "size": 8196, "type": null }, { "file": "WizardOfOz/.DS_Store", "size": 6148, "type": null }, { "file": "WizardOfOz/.ipynb_checkpoints/Download All Images From Links From File-checkpoint.ipynb", "size": 72, "type": null }, { "file": "WizardOfOz/.ipynb_checkpoints/Download All Images From Page-checkpoint.ipynb", "size": 72, "type": null }, { "file": "WizardOfOz/.ipynb_checkpoints/Soup To Get Photos from Flickr search-checkpoint.ipynb", "size": 72, "type": null }, { "file": "WizardOfOz/Images/.DS_Store", "size": 18436, "type": null }, { "file": "WizardOfOz/Images/Characters/aoo.jpg", "size": 100640, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/china.jpg", "size": 112453, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/cowardlylion.jpg", "size": 31924, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/dorothy.jpg", "size": 79477, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/fieldmice.jpg", "size": 68737, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/fightingtree.jpg", "size": 138567, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/flyingmonkeys.jpg", "size": 352515, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/glinda.jpg", "size": 1548761, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/gotg.jpg", "size": 63787, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/gump.jpg", "size": 909813, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/hammerheads.jpg", "size": 286102, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/jackpumpkinhead.jpg", "size": 142235, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/jelliajamb.jpg", "size": 63048, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/jinjur.jpg", "size": 148673, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/kalida.jpg", "size": 404311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/mombi.jpg", "size": 232587, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/munchkins.jpg", "size": 452302, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/ozma.jpg", "size": 37024, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/sawhorse.jpg", "size": 114978, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/scarecrow.jpg", "size": 1290994, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/tinwoodman.jpg", "size": 149980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/tip.jpg", "size": 140560, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/toto.jpg", "size": 1501114, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/witchofthenorth.jpg", "size": 137818, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/witchofthewest.jpg", "size": 290957, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/wizardofoz.jpg", "size": 408529, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Characters/wogglebug.jpg", "size": 238993, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/.DS_Store", "size": 12292, "type": null }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566355950_99d6a1e788_o.jpg", "size": 210689, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566359570_87f58878df_o.jpg", "size": 57805, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566360820_9d21a968a1_o.jpg", "size": 572687, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566370420_b55c73a0c6_o.jpg", "size": 260474, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566374270_1e0f0fe773_o.jpg", "size": 210552, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566384930_fa31435a9d_o.jpg", "size": 99039, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566385830_f13fc01705_o.jpg", "size": 828236, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566386539_80c45c2d9d_o.jpg", "size": 269203, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566387769_5b9d9c0f95_o.jpg", "size": 1125017, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566392218_5e7f6e9c60_o.jpg", "size": 188913, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566394388_be99220a5a_o.jpg", "size": 929920, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566407859_a8827f4057_o.jpg", "size": 846452, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566410168_6234433a0f_o.jpg", "size": 961232, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566419179_082c2117c8_o.jpg", "size": 239370, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566420818_ace4de01eb_o.jpg", "size": 1008373, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566421438_19a401912a_o.jpg", "size": 286982, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566422008_3cf5cb528a_o.jpg", "size": 912316, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566426359_188e77a008_o.jpg", "size": 814455, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566589597_78d0be3f7f_o.jpg", "size": 293817, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566594877_822b7a4ccd_o.jpg", "size": 984124, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566595617_8995dc3760_o.jpg", "size": 394479, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566597997_013d4de8fd_o.jpg", "size": 117807, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566603807_1fa74d6bab_o.jpg", "size": 974304, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566616057_bdee2ddf48_o.jpg", "size": 188093, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566616617_ced5057d9b_o.jpg", "size": 70548, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566623767_68f568b624_o.jpg", "size": 195030, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566625537_58d9c10a00_o.jpg", "size": 266334, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14566626027_0af6e28a64_o.jpg", "size": 945224, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730042076_37114478de_o.jpg", "size": 240224, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730043496_d9fde96698_o.jpg", "size": 129931, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730050756_96670dce74_o.jpg", "size": 97431, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730052126_1879fe8170_o.jpg", "size": 318903, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730056906_69ec16ff12_o.jpg", "size": 166862, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730057646_6b1dfb7fb8_o.jpg", "size": 270550, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730060376_affb234a34_o.jpg", "size": 345445, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730062756_76a7b12b52_o.jpg", "size": 547778, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730063206_1c1c6cec36_o.jpg", "size": 501211, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730065066_d42e728f5a_o.jpg", "size": 152886, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730067706_e5221e255d_o.jpg", "size": 1090606, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730071726_dc5fb62c6d_o.jpg", "size": 727334, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14730072326_9ddc1378a3_o.jpg", "size": 317452, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749876521_b62b3155c9_o.jpg", "size": 675831, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749885281_42b6516244_o.jpg", "size": 923680, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749886891_14c282c656_o.jpg", "size": 195373, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749888171_2ea1db0c99_o.jpg", "size": 148466, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749892441_30534f106b_o.jpg", "size": 1035241, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749893461_0cf746b224_o.jpg", "size": 257044, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749895071_c6efe5f0a2_o.jpg", "size": 854589, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14749898111_ee685e84b4_o.jpg", "size": 1117959, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14750702444_a22afda3cb_o.jpg", "size": 170678, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14750706734_2eefe95a41_o.jpg", "size": 272178, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14750714484_c508fdb364_o.jpg", "size": 186322, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752724602_2f79438b8e_o.jpg", "size": 419641, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752725952_4c1eb0f6b1_o.jpg", "size": 446712, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752728022_f76206cbe6_o.jpg", "size": 126638, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752747532_ecf3134192_o.jpg", "size": 851905, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752752692_36df69aee4_o.jpg", "size": 128079, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14752761232_341d3c4452_o.jpg", "size": 55084, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14753042175_42d2284d93_o.jpg", "size": 41098, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14753043985_4726329832_o.jpg", "size": 233093, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14753044615_b56ed898dd_o.jpg", "size": 866929, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14753063625_df1147c85e_o.jpg", "size": 820593, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14753065125_281fae945f_o.jpg", "size": 144122, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772918523_bc89603c6c_o.jpg", "size": 322292, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772923243_5e76d47bc2_o.jpg", "size": 978454, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772925503_571e9dd553_o.jpg", "size": 981523, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772930283_359dae11e2_o.jpg", "size": 313183, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772930643_660a65d082_o.jpg", "size": 129007, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772937703_dfb4fff8cc_o.jpg", "size": 891563, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/14772943233_3a52116956_o.jpg", "size": 75594, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/cover.jpeg", "size": 38225, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Dorothy And The Wizard In Oz/filelist.txt", "size": 2254, "type": "text/plain" }, { "file": "WizardOfOz/Images/Glinda Of Oz/cover.jpg", "size": 34081, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/endpaper.jpg", "size": 29574, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/filelist.txt", "size": 1242, "type": "text/plain" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i002.jpg", "size": 41034, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i003.jpg", "size": 19879, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i004.jpg", "size": 11194, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i005.jpg", "size": 23872, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i006.jpg", "size": 32527, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i007.jpg", "size": 7976, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i009.jpg", "size": 23478, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i011.jpg", "size": 20562, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i012.jpg", "size": 27347, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i017.jpg", "size": 12457, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i025.jpg", "size": 28559, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i026.jpg", "size": 8486, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i029.jpg", "size": 11558, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i030.jpg", "size": 15735, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i032.jpg", "size": 33106, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i037.jpg", "size": 12973, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i041.jpg", "size": 33840, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i043.jpg", "size": 14786, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i047.jpg", "size": 15311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i048.jpg", "size": 45064, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i052.jpg", "size": 7852, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i053.jpg", "size": 7919, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i054.jpg", "size": 49551, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i058.jpg", "size": 13934, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i061.jpg", "size": 8384, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i062.jpg", "size": 40662, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i071.jpg", "size": 18793, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i072.jpg", "size": 29109, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i075.jpg", "size": 9256, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i078.jpg", "size": 15256, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i083.jpg", "size": 12148, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i086.jpg", "size": 35665, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i091.jpg", "size": 41052, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i094.jpg", "size": 48388, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i095.jpg", "size": 17284, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i096.jpg", "size": 31867, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i100.jpg", "size": 17112, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i102.jpg", "size": 28956, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i106.jpg", "size": 10625, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i107.jpg", "size": 8663, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i109.jpg", "size": 31136, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i111.jpg", "size": 10501, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i112.jpg", "size": 21454, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i122.jpg", "size": 28732, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i124.jpg", "size": 48148, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i128.jpg", "size": 14575, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i132.jpg", "size": 34067, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i134.jpg", "size": 35407, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i139.jpg", "size": 6678, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i140.jpg", "size": 40442, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i143.jpg", "size": 32324, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i151.jpg", "size": 19302, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i155.jpg", "size": 9108, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i156.jpg", "size": 31844, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i161.jpg", "size": 35203, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i164.jpg", "size": 13884, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i165.jpg", "size": 18250, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i166.jpg", "size": 34347, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i175.jpg", "size": 21994, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i176.jpg", "size": 25917, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i179.jpg", "size": 33466, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i183.jpg", "size": 29341, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i185.jpg", "size": 17309, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i188.jpg", "size": 16550, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i191.jpg", "size": 11519, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i192.jpg", "size": 24617, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i197.jpg", "size": 43731, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i199.jpg", "size": 8656, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i201.jpg", "size": 12723, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i203.jpg", "size": 21081, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i204.jpg", "size": 40692, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i207.jpg", "size": 20722, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i213.jpg", "size": 15474, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i217.jpg", "size": 12391, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i218.jpg", "size": 27592, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i226.jpg", "size": 31993, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i229.jpg", "size": 24962, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i231.jpg", "size": 33764, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i234.jpg", "size": 13809, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i235.jpg", "size": 8164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i236.jpg", "size": 31779, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i246.jpg", "size": 51191, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i249.jpg", "size": 34535, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i255.jpg", "size": 15510, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i259.jpg", "size": 12792, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i260.jpg", "size": 30448, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i266.jpg", "size": 31717, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i267.jpg", "size": 25624, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i271.jpg", "size": 22699, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i272.jpg", "size": 43134, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i278.jpg", "size": 21374, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i280.jpg", "size": 10969, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i281.jpg", "size": 9066, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i282.jpg", "size": 45166, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i285.jpg", "size": 39331, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i288.jpg", "size": 10060, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i292.jpg", "size": 13306, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i293.jpg", "size": 22775, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i294.jpg", "size": 37464, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i299.jpg", "size": 11276, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Glinda Of Oz/i300.jpg", "size": 14143, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/.DS_Store", "size": 18436, "type": null }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566566900_e082ee5e23_o.jpg", "size": 37416, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566576090_e66227eb21_o.jpg", "size": 704741, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566577470_dfd254e00c_o.jpg", "size": 143078, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566597109_9e65bb92a4_o.jpg", "size": 191407, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566598868_bd97445cf9_o.jpg", "size": 288649, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566600610_74720b238f_o.jpg", "size": 193937, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566609460_d2649ec679_o.jpg", "size": 249221, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566611318_bdea79fbb1_o.jpg", "size": 987083, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566611659_1cc09e48f4_o.jpg", "size": 355748, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566616649_c053afab0f_o.jpg", "size": 468328, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566616828_aabfd71618_o.jpg", "size": 746707, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566617320_87e202b205_o.jpg", "size": 1153604, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566621569_1a918e0e81_o.jpg", "size": 354902, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566622350_8182100dfa_o.jpg", "size": 172016, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566625568_66f753c221_o.jpg", "size": 629049, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566625609_75042a48fc_o.jpg", "size": 184825, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566626570_6833eb04bb_o.jpg", "size": 125736, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566629360_ecda30f330_o.jpg", "size": 66342, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566634408_758cedece4_o.jpg", "size": 733037, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566634699_4575c41847_o.jpg", "size": 1162591, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566635270_16e6be3777_o.jpg", "size": 112311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566636018_a3d718ddfc_o.jpg", "size": 290344, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566636240_15aa8684ea_o.jpg", "size": 195946, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566637188_121605d1c6_o.jpg", "size": 95899, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566638618_3cb958fea6_o.jpg", "size": 134056, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566642539_cea1ee2c65_o.jpg", "size": 1417543, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566643599_6842206c26_o.jpg", "size": 178327, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566645418_8d3a1f92b0_o.jpg", "size": 185711, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566651509_90c95e2d82_o.jpg", "size": 144132, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566654499_c75e121680_o.jpg", "size": 909813, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566659598_c3363155be_o.jpg", "size": 1548761, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566660128_b4dbeb54c5_o.jpg", "size": 69290, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566661588_c8557d8d2b_o.jpg", "size": 96879, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566662699_796c6f3e96_o.jpg", "size": 239749, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566664289_dae983101b_o.jpg", "size": 148673, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566666458_3cac0b62ef_o.jpg", "size": 232587, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566670979_8e6ce746b5_o.jpg", "size": 197033, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566673939_a17b389f54_o.jpg", "size": 426113, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566801187_ab45d9c5d2_o.jpg", "size": 614560, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566810057_e32a478087_o.jpg", "size": 168997, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566814317_6bde500626_o.jpg", "size": 665306, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566814817_c45697dea8_o.jpg", "size": 114978, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566815387_393c6977c8_o.jpg", "size": 245158, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566819687_c73b748c42_o.jpg", "size": 1572391, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566827287_53102919c5_o.jpg", "size": 199395, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566836727_2d9997a7f2_o.jpg", "size": 317617, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566838467_c2728f6858_o.jpg", "size": 123083, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566842717_b5a11f4939_o.jpg", "size": 1129861, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566843417_1dfa051533_o.jpg", "size": 238993, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566847497_3e768f26f7_o.jpg", "size": 1217102, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566850117_2ab98a3d36_o.jpg", "size": 300696, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566855387_98820d07b1_o.jpg", "size": 218270, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14566867227_f39dd64a36_o.jpg", "size": 194302, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730250606_8c6458970c_o.jpg", "size": 336077, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730253076_6206709ac1_o.jpg", "size": 116064, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730254546_575f089404_o.jpg", "size": 342706, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730256936_abf1cc595b_o.jpg", "size": 858157, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730265916_51514e3059_o.jpg", "size": 79809, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730266216_e1e2831005_o.jpg", "size": 402421, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730274956_18312f1eda_o.jpg", "size": 270118, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730275286_413df391d8_o.jpg", "size": 727637, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730276496_2626080a4e_o.jpg", "size": 245254, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730279566_38608359f8_o.jpg", "size": 154664, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730288596_157012d748_o.jpg", "size": 290326, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730295956_1c62a3e73e_o.jpg", "size": 1463218, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730306986_07e1944e65_o.jpg", "size": 1390097, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730314766_09ea2cc387_o.jpg", "size": 316549, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14730322066_dbe9658892_o.jpg", "size": 1290994, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750093931_3ab20948ab_o.jpg", "size": 248760, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750096681_1fc23eb66c_o.jpg", "size": 293183, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750102901_8d6c4fb26e_o.jpg", "size": 142235, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750104541_bcec574fd5_o.jpg", "size": 201495, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750106211_56eb12a00e_o.jpg", "size": 1532435, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750114401_e64df62bd4_o.jpg", "size": 187093, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750118601_a4b054af2f_o.jpg", "size": 340295, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750123361_dc13ea53a8_o.jpg", "size": 543555, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750128451_39cb9a75c2_o.jpg", "size": 188717, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750133681_2b7ed29339_o.jpg", "size": 98381, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750134011_f0f0a2156e_o.jpg", "size": 172828, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750138461_cc4410b66f_o.jpg", "size": 312855, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750143251_96e433042a_o.jpg", "size": 352064, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750145161_bb63444e5d_o.jpg", "size": 206574, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750151191_16dc84875c_o.jpg", "size": 75232, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750152681_bbd4da7a27_o.jpg", "size": 398585, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750157581_14958bb896_o.jpg", "size": 255974, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750158621_c34dd0b757_o.jpg", "size": 73529, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750905364_22f6873d98_o.jpg", "size": 912368, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750907574_7ace47e249_o.jpg", "size": 399676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750911914_200cb354a6_o.jpg", "size": 1551676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750919454_4e5c832f7e_o.jpg", "size": 175719, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750925994_8cfc345fb5_o.jpg", "size": 210089, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750927304_ee369e70f6_o.jpg", "size": 226709, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750927744_bb6c91a10a_o.jpg", "size": 267497, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750929574_0ce2e423b1_o.jpg", "size": 1469636, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750930444_dff8be66ef_o.jpg", "size": 114727, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750932084_362db08613_o.jpg", "size": 511381, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750940944_967db626e3_o.jpg", "size": 877234, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750961904_ab0e99a1ca_o.jpg", "size": 1082499, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750973104_e63c27aeb8_o.jpg", "size": 655740, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750974584_91d2d9e16b_o.jpg", "size": 246254, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14750975894_d80400f569_o.jpg", "size": 353087, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752933482_fde21ed155_o.jpg", "size": 445173, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752944182_5b0b9d31a1_o.jpg", "size": 275378, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752957332_25fd548e07_o.jpg", "size": 207483, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752958122_7527099026_o.jpg", "size": 30689, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752967312_7383aaf519_o.jpg", "size": 121048, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752972562_793cd83b6c_o.jpg", "size": 1514680, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752987252_83ba83ae9f_o.jpg", "size": 140560, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14752997482_12873e5cea_o.jpg", "size": 325943, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753001882_a49ff69581_o.jpg", "size": 59165, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753005462_e85003101a_o.jpg", "size": 282113, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753248105_fd573d9c07_o.jpg", "size": 214546, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753268085_0227f24608_o.jpg", "size": 715674, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753276295_0c67d6f002_o.jpg", "size": 298728, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753278005_118800d134_o.jpg", "size": 763572, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753279655_7292af2cb4_o.jpg", "size": 149980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753284875_442c6a6570_o.jpg", "size": 187380, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753290445_2574698115_o.jpg", "size": 292707, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753295665_a92a7acf8d_o.jpg", "size": 105280, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753297415_8af320b7ac_o.jpg", "size": 357493, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753302625_27c6dcbd01_o.jpg", "size": 782546, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753303635_d86fbd35f2_o.jpg", "size": 176397, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753305185_7b72e0cdff_o.jpg", "size": 277896, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753306155_fca353e421_o.jpg", "size": 369057, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753307455_0e0164db68_o.jpg", "size": 193354, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753308105_2344c7093e_o.jpg", "size": 127795, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14753318105_487297019e_o.jpg", "size": 437999, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773121433_5157e20485_o.jpg", "size": 178724, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773124503_47ec1bf7e2_o.jpg", "size": 123542, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773125643_eed8373b8f_o.jpg", "size": 923828, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773126823_36b29767ea_o.jpg", "size": 916238, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773129193_e8e530acb5_o.jpg", "size": 713667, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773133783_2e4c4ffaaa_o.jpg", "size": 812313, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773136403_0d9a6f7bc8_o.jpg", "size": 201032, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773143843_004bf273c0_o.jpg", "size": 165222, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773147603_86cbe56009_o.jpg", "size": 659399, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773149293_065e144c9b_o.jpg", "size": 644300, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773168113_da8544f410_o.jpg", "size": 1377022, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773169153_309b38aebd_o.jpg", "size": 311805, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773170393_5241543f19_o.jpg", "size": 167305, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/14773185943_481a24eaa5_o.jpg", "size": 124440, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/cover.jpeg", "size": 63073, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Marvelous Land Of Oz Images/filelist.txt", "size": 4113, "type": "text/plain" }, { "file": "WizardOfOz/Images/Ozma Of Oz/.DS_Store", "size": 14340, "type": null }, { "file": "WizardOfOz/Images/Ozma Of Oz/005.jpg", "size": 5368, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/cover.jpg", "size": 39864, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/filelist.txt", "size": 814, "type": "text/plain" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i001.jpg", "size": 42314, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i003.jpg", "size": 34630, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i004.jpg", "size": 37024, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i006.jpg", "size": 51269, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i007.jpg", "size": 16650, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i010.jpg", "size": 23149, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i011.jpg", "size": 30222, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i012.jpg", "size": 35369, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i017.jpg", "size": 53666, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i021.jpg", "size": 45902, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i023.jpg", "size": 15513, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i029.jpg", "size": 32471, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i033.jpg", "size": 46767, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i036.jpg", "size": 9597, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i041.jpg", "size": 49708, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i043.jpg", "size": 21820, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i045.jpg", "size": 41299, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i048.jpg", "size": 10427, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i051.jpg", "size": 32786, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i053.jpg", "size": 45705, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i057.jpg", "size": 40891, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i059.jpg", "size": 21040, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i061.jpg", "size": 45777, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i063.jpg", "size": 10164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i066.jpg", "size": 40185, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i069.jpg", "size": 41145, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i073.jpg", "size": 47040, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i075.jpg", "size": 35982, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i079.jpg", "size": 33562, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i081.jpg", "size": 50209, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i085.jpg", "size": 46998, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i087.jpg", "size": 40496, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i089.jpg", "size": 52802, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i093.jpg", "size": 44654, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i097.jpg", "size": 79477, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i100.jpg", "size": 9390, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i105.jpg", "size": 48514, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i107.jpg", "size": 25880, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i109.jpg", "size": 44163, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i111.jpg", "size": 34722, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i113.jpg", "size": 31737, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i116.jpg", "size": 29528, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i119.jpg", "size": 18769, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i121.jpg", "size": 37695, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i125.jpg", "size": 50398, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i127.jpg", "size": 19353, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i133.jpg", "size": 48061, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i136.jpg", "size": 44353, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i138.jpg", "size": 32986, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i143.jpg", "size": 16623, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i145.jpg", "size": 59661, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i149.jpg", "size": 41414, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i153.jpg", "size": 44769, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i155.jpg", "size": 30291, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i160.jpg", "size": 52816, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i162.jpg", "size": 32233, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i165.jpg", "size": 50219, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i167.jpg", "size": 52100, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i171.jpg", "size": 57431, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i174.jpg", "size": 24891, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i178.jpg", "size": 43091, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i181.jpg", "size": 18534, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i187.jpg", "size": 38899, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i190.jpg", "size": 51476, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i193.jpg", "size": 45067, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i197.jpg", "size": 43827, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i202.jpg", "size": 26387, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i204.jpg", "size": 20378, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i209.jpg", "size": 40737, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i211.jpg", "size": 27760, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i212.jpg", "size": 44211, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i215.jpg", "size": 17288, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i221.jpg", "size": 37949, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i225.jpg", "size": 19076, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i231.jpg", "size": 48765, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i239.jpg", "size": 39777, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i241.jpg", "size": 22291, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i244.jpg", "size": 44161, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i249.jpg", "size": 12584, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i251.jpg", "size": 55584, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i253.jpg", "size": 17662, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i257.jpg", "size": 12921, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i259.jpg", "size": 56440, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i262.jpg", "size": 21768, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i266.jpg", "size": 54499, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i269.jpg", "size": 35167, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Ozma Of Oz/i270.jpg", "size": 29909, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/cover.jpg", "size": 74510, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/filelist.txt", "size": 1698, "type": "text/plain" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/flypaper.jpg", "size": 40417, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image1.jpg", "size": 25471, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image10.jpg", "size": 10423, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image100.jpg", "size": 25196, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image101.jpg", "size": 20889, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image102.jpg", "size": 25855, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image103.jpg", "size": 24427, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image104.jpg", "size": 93886, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image105.jpg", "size": 16849, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image106.jpg", "size": 22814, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image107.jpg", "size": 89650, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image108.jpg", "size": 22955, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image109.jpg", "size": 97209, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image11.jpg", "size": 46676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image110.jpg", "size": 92370, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image111.jpg", "size": 71057, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image12.jpg", "size": 17121, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image13.jpg", "size": 58187, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image14.jpg", "size": 14150, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image15.jpg", "size": 15054, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image16.jpg", "size": 62924, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image17.jpg", "size": 63951, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image18.jpg", "size": 19078, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image19.jpg", "size": 61802, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image2.jpg", "size": 35983, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image20.jpg", "size": 58490, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image21.jpg", "size": 58701, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image22.jpg", "size": 31551, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image23.jpg", "size": 21212, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image24.jpg", "size": 60402, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image25.jpg", "size": 71137, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image26.jpg", "size": 24033, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image27.jpg", "size": 15569, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image28.jpg", "size": 32785, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image29.jpg", "size": 31429, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image3.jpg", "size": 32604, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image30.jpg", "size": 60032, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image31.jpg", "size": 8905, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image32.jpg", "size": 17806, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image33.jpg", "size": 20927, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image34.jpg", "size": 24419, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image35.jpg", "size": 65991, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image36.jpg", "size": 12304, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image37.jpg", "size": 35640, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image38.jpg", "size": 71062, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image39.jpg", "size": 76765, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image4.jpg", "size": 50646, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image40.jpg", "size": 98691, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image41.jpg", "size": 38423, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image42.jpg", "size": 28800, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image43.jpg", "size": 80226, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image44.jpg", "size": 76205, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image45.jpg", "size": 88963, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image46.jpg", "size": 12092, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image47.jpg", "size": 25654, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image48.jpg", "size": 81329, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image49.jpg", "size": 80536, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image5.jpg", "size": 2187, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image50.jpg", "size": 21636, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image51.jpg", "size": 91170, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image52.jpg", "size": 65861, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image53.jpg", "size": 74836, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image54.jpg", "size": 10079, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image55.jpg", "size": 24492, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image56.jpg", "size": 79715, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image57.jpg", "size": 92993, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image58.jpg", "size": 21936, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image59.jpg", "size": 21363, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image6.jpg", "size": 28162, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image60.jpg", "size": 76979, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image61.jpg", "size": 98025, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image62.jpg", "size": 23467, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image63.jpg", "size": 66676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image64.jpg", "size": 21507, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image65.jpg", "size": 20464, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image66.jpg", "size": 86515, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image67.jpg", "size": 76975, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image68.jpg", "size": 99385, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image69.jpg", "size": 69994, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image7.jpg", "size": 41345, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image70.jpg", "size": 22749, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image71.jpg", "size": 23028, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image72.jpg", "size": 76905, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image73.jpg", "size": 16110, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image74.jpg", "size": 18741, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image75.jpg", "size": 79719, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image76.jpg", "size": 51987, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image77.jpg", "size": 34484, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image78.jpg", "size": 23183, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image79.jpg", "size": 93797, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image8.jpg", "size": 48031, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image80.jpg", "size": 92889, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image81.jpg", "size": 20906, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image82.jpg", "size": 86884, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image83.jpg", "size": 77681, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image84.jpg", "size": 47531, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image85.jpg", "size": 74689, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image86.jpg", "size": 96867, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image87.jpg", "size": 89644, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image88.jpg", "size": 13822, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image89.jpg", "size": 22794, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image9.jpg", "size": 27969, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image90.jpg", "size": 81753, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image91.jpg", "size": 23421, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image92.jpg", "size": 72530, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image93.jpg", "size": 13266, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image94.jpg", "size": 84348, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image95.jpg", "size": 28207, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image96.jpg", "size": 71876, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image97.jpg", "size": 82313, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image98.jpg", "size": 15292, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Rinkitink in Oz/image99.jpg", "size": 27622, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/.DS_Store", "size": 12292, "type": null }, { "file": "WizardOfOz/Images/The Emerald City of Oz/cover.jpg", "size": 74665, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/filelist.txt", "size": 1422, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i001l.jpg", "size": 129905, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i003l.jpg", "size": 128442, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i004al.jpg", "size": 102778, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i004cl.jpg", "size": 10497, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i006l.jpg", "size": 87526, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i008l.jpg", "size": 139596, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i009al.jpg", "size": 17002, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i009cl.jpg", "size": 21927, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i010l.jpg", "size": 121859, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i011l.jpg", "size": 30755, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i012l.jpg", "size": 75898, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i013l.jpg", "size": 111102, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i015l.jpg", "size": 140455, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i020l.jpg", "size": 131031, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i022l.jpg", "size": 115067, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i023l.jpg", "size": 98632, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i027l.jpg", "size": 62702, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i032l.jpg", "size": 60749, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i033l.jpg", "size": 97880, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i041l.jpg", "size": 69924, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i042l.jpg", "size": 70886, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i043l.jpg", "size": 113406, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i047l.jpg", "size": 128549, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i049l.jpg", "size": 109101, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i051l.jpg", "size": 59524, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i052l.jpg", "size": 84821, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i059l.jpg", "size": 66144, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i063l.jpg", "size": 111068, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i064l.jpg", "size": 75793, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i065l.jpg", "size": 82969, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i069l.jpg", "size": 88403, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i070l.jpg", "size": 88146, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i071l.jpg", "size": 46775, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i072l.jpg", "size": 78367, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i075l.jpg", "size": 78567, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i081l.jpg", "size": 96814, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i085l.jpg", "size": 109696, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i086l.jpg", "size": 79837, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i089l.jpg", "size": 153967, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i093l.jpg", "size": 47055, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i095l.jpg", "size": 101136, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i101l.jpg", "size": 115408, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i105l.jpg", "size": 49468, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i108l.jpg", "size": 57173, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i117l.jpg", "size": 86196, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i121l.jpg", "size": 119033, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i123l.jpg", "size": 90851, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i124l.jpg", "size": 78625, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i127l.jpg", "size": 80551, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i133l.jpg", "size": 141206, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i137l.jpg", "size": 69765, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i139l.jpg", "size": 73454, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i141l.jpg", "size": 76348, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i149l.jpg", "size": 75598, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i153l.jpg", "size": 67268, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i155l.jpg", "size": 84095, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i159l.jpg", "size": 87472, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i161l.jpg", "size": 86880, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i169l.jpg", "size": 59389, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i171l.jpg", "size": 51541, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i172l.jpg", "size": 98509, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i177l.jpg", "size": 79424, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i181l.jpg", "size": 92541, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i184l.jpg", "size": 74367, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i185l.jpg", "size": 53069, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i187l.jpg", "size": 141546, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i195l.jpg", "size": 82174, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i196l.jpg", "size": 101351, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i203l.jpg", "size": 76468, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i209l.jpg", "size": 79202, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i210l.jpg", "size": 94569, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i214l.jpg", "size": 70534, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i221l.jpg", "size": 53535, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i223l.jpg", "size": 104812, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i227l.jpg", "size": 98905, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i233l.jpg", "size": 115265, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i234l.jpg", "size": 86056, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i241l.jpg", "size": 83698, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i245l.jpg", "size": 63883, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i246l.jpg", "size": 80661, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i251l.jpg", "size": 83486, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i253l.jpg", "size": 67562, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i257l.jpg", "size": 105953, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i258l.jpg", "size": 79400, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i259l.jpg", "size": 95691, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i263l.jpg", "size": 77585, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i269l.jpg", "size": 122015, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i271l.jpg", "size": 71855, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i278l.jpg", "size": 46632, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i279l.jpg", "size": 100044, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i283l.jpg", "size": 82171, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i287l.jpg", "size": 62631, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i289l.jpg", "size": 92334, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i291l.jpg", "size": 86934, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i299l.jpg", "size": 133740, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i301l.jpg", "size": 67242, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i302l.jpg", "size": 99310, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i303l.jpg", "size": 94227, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i305l.jpg", "size": 111172, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i308l.jpg", "size": 113543, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i311l.jpg", "size": 96666, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i315l.jpg", "size": 84267, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i317l.jpg", "size": 74430, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i319l.jpg", "size": 104540, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i323l.jpg", "size": 78214, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i324l.jpg", "size": 78869, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i327l.jpg", "size": 84767, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Emerald City of Oz/i328l.jpg", "size": 102622, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/.DS_Store", "size": 14340, "type": null }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/filelist.txt", "size": 1411, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/front_th.png", "size": 63342, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i001.png", "size": 14259, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i003.png", "size": 37463, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i004.png", "size": 32459, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i006_th.png", "size": 93769, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i007.png", "size": 8211, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i008.png", "size": 20256, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i009.png", "size": 11897, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i010.png", "size": 26798, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i011.png", "size": 7503, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i013.png", "size": 12223, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i014.png", "size": 34732, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i015.png", "size": 18013, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i017.png", "size": 33317, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i021.png", "size": 69696, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i023.png", "size": 46367, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i025.png", "size": 29067, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i027.png", "size": 18164, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i028.png", "size": 27426, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i031.png", "size": 14412, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i033.png", "size": 51578, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i035.png", "size": 6897, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i036.png", "size": 20500, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i039.png", "size": 24594, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i043_th.png", "size": 82176, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i047.png", "size": 39676, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i055.png", "size": 24960, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i056.png", "size": 6434, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i057.png", "size": 36655, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i061.png", "size": 63588, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i063.png", "size": 5986, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i064.png", "size": 24096, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i067.png", "size": 50869, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i071_th.png", "size": 88974, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i077.png", "size": 51696, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i078.png", "size": 14297, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i079.png", "size": 21234, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i081.png", "size": 30658, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i085.png", "size": 33758, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i091.png", "size": 42174, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i094.png", "size": 8290, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i095.png", "size": 15053, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i102.png", "size": 42610, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i103.png", "size": 36727, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i107_th.png", "size": 98634, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i112.png", "size": 20174, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i115.png", "size": 23261, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i123.png", "size": 41787, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i127.png", "size": 11860, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i128.png", "size": 14934, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i131_th.png", "size": 75295, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i139.png", "size": 29029, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i146.png", "size": 6093, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i147.png", "size": 24858, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i151.png", "size": 27765, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i155.png", "size": 10883, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i156.png", "size": 20904, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i163_th.png", "size": 93153, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i168.png", "size": 9635, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i169.png", "size": 17174, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i173.png", "size": 31410, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i179.png", "size": 42637, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i185.png", "size": 20646, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i191.png", "size": 37887, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i193.png", "size": 37436, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i195.png", "size": 6365, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i196.png", "size": 26926, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i199.png", "size": 23408, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i203.png", "size": 26775, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i205.png", "size": 7434, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i206.png", "size": 25808, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i211_th.png", "size": 53237, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i213.png", "size": 43226, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i215.png", "size": 8448, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i216.png", "size": 26690, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i219.png", "size": 36602, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i223_th.png", "size": 94996, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i227.png", "size": 48295, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i229.png", "size": 25881, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i231.png", "size": 6657, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i232.png", "size": 22742, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i235.png", "size": 23730, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i238_th.png", "size": 92918, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i244.png", "size": 48099, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i245.png", "size": 53166, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i247.png", "size": 9415, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i248.png", "size": 25530, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i255.png", "size": 26267, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i261.png", "size": 30844, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i262.png", "size": 8687, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i263.png", "size": 16263, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i269.png", "size": 35341, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i271_th.png", "size": 89370, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i275.png", "size": 5862, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i276.png", "size": 18607, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i279_th.png", "size": 98124, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i285.png", "size": 33925, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i287.png", "size": 18687, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i293.png", "size": 61188, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i297.png", "size": 42746, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i299.png", "size": 21203, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i301.png", "size": 5964, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i302.png", "size": 17364, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i305.png", "size": 34671, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i310.png", "size": 2323, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i311.png", "size": 18634, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i313.png", "size": 25711, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i316.png", "size": 3734, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i317.png", "size": 13933, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i323.png", "size": 40761, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i325.png", "size": 14782, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i327_th.png", "size": 100389, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i333.png", "size": 23373, "type": "image/png" }, { "file": "WizardOfOz/Images/The Lost Princess of Oz/i_cover.png", "size": 96550, "type": "image/png" }, { "file": "WizardOfOz/Images/The Magic of Oz/cover.jpg", "size": 181572, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/filelist.txt", "size": 1310, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Magic of Oz/i001.jpg", "size": 45892, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i003.jpg", "size": 39215, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i004.jpg", "size": 43988, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i006.jpg", "size": 99917, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i007.jpg", "size": 9992, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i008.jpg", "size": 41402, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i009.jpg", "size": 58969, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i010.jpg", "size": 70639, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i011.jpg", "size": 27009, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i013.jpg", "size": 19800, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i014.jpg", "size": 84346, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i015.jpg", "size": 49753, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i016.jpg", "size": 87532, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i017.jpg", "size": 63203, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i023.jpg", "size": 56136, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i026.jpg", "size": 47407, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i027.jpg", "size": 64368, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i031.jpg", "size": 23090, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i032.jpg", "size": 24827, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i033.jpg", "size": 24753, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i034.jpg", "size": 67738, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i041.jpg", "size": 32007, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i044.jpg", "size": 43932, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i047.jpg", "size": 57303, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i048.jpg", "size": 58698, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i051.jpg", "size": 60590, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i052.jpg", "size": 41228, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i053.jpg", "size": 61389, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i056.jpg", "size": 45276, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i059.jpg", "size": 33589, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i061.jpg", "size": 32402, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i063.jpg", "size": 39696, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i064.jpg", "size": 25823, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i065.jpg", "size": 63552, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i067.jpg", "size": 41764, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i069.jpg", "size": 41537, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i071.jpg", "size": 29254, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i073.jpg", "size": 29306, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i077.jpg", "size": 43692, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i080.jpg", "size": 34908, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i081.jpg", "size": 61828, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i087.jpg", "size": 59538, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i089.jpg", "size": 36564, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i095.jpg", "size": 71545, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i097.jpg", "size": 48135, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i098.jpg", "size": 42192, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i099.jpg", "size": 61406, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i101.jpg", "size": 63840, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i105.jpg", "size": 55528, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i107.jpg", "size": 99065, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i111.jpg", "size": 36703, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i112.jpg", "size": 60357, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i115.jpg", "size": 32405, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i120.jpg", "size": 20824, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i121.jpg", "size": 56860, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i124.jpg", "size": 109134, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i125.jpg", "size": 113363, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i129.jpg", "size": 35264, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i131.jpg", "size": 65501, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i134.jpg", "size": 91588, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i135.jpg", "size": 93132, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i141.jpg", "size": 34140, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i142.jpg", "size": 29967, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i144.jpg", "size": 64088, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i148.jpg", "size": 2095, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i151.jpg", "size": 33257, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i155.jpg", "size": 29173, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i157.jpg", "size": 60106, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i165.jpg", "size": 34028, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i167.jpg", "size": 19866, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i169.jpg", "size": 62258, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i173.jpg", "size": 80655, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i177.jpg", "size": 29441, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i182.jpg", "size": 41824, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i183.jpg", "size": 46343, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i186.jpg", "size": 98794, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i187.jpg", "size": 108257, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i191.jpg", "size": 33718, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i195.jpg", "size": 47057, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i197.jpg", "size": 55500, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i203.jpg", "size": 43256, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i205.jpg", "size": 31137, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i207.jpg", "size": 41156, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i209.jpg", "size": 62249, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i213.jpg", "size": 76795, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i215.jpg", "size": 27214, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i216.jpg", "size": 34844, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i217.jpg", "size": 57928, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i221.jpg", "size": 35913, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i225.jpg", "size": 67214, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i226.jpg", "size": 60277, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i229.jpg", "size": 32574, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i231.jpg", "size": 32603, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i235.jpg", "size": 59886, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i239.jpg", "size": 25207, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i240.jpg", "size": 64627, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i243.jpg", "size": 66914, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i246.jpg", "size": 110516, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i247.jpg", "size": 111813, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i253.jpg", "size": 78438, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i255.jpg", "size": 59189, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i259.jpg", "size": 21606, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i261.jpg", "size": 36562, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i263.jpg", "size": 36388, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i265.jpg", "size": 33645, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i266.jpg", "size": 36134, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i272.jpg", "size": 47705, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Magic of Oz/i300.jpg", "size": 127724, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/.DS_Store", "size": 14340, "type": null }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/cover.jpg", "size": 29063, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/endpaper.jpg", "size": 52258, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/filelist.txt", "size": 1919, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i001.jpg", "size": 42038, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i003.jpg", "size": 100888, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i006.jpg", "size": 90626, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i007.jpg", "size": 4634, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i008.jpg", "size": 80304, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i009.jpg", "size": 88784, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i010.jpg", "size": 92707, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i013a.jpg", "size": 10745, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i013b.jpg", "size": 7220, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i014.jpg", "size": 85821, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i015a.jpg", "size": 16161, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i015b.jpg", "size": 93131, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i018.jpg", "size": 27986, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i019a.jpg", "size": 18758, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i019b.jpg", "size": 101550, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i025.jpg", "size": 99944, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i029.jpg", "size": 72866, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i030.jpg", "size": 50572, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i031a.jpg", "size": 16913, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i031b.jpg", "size": 99996, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i035.jpg", "size": 95612, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i040.jpg", "size": 63438, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i041.jpg", "size": 52876, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i042.jpg", "size": 58128, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i043a.jpg", "size": 14609, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i043b.jpg", "size": 97771, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i049.jpg", "size": 50755, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i050.jpg", "size": 59255, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i051a.jpg", "size": 14606, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i051b.jpg", "size": 93059, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i054.jpg", "size": 63035, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i063a.jpg", "size": 16980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i063b.jpg", "size": 100671, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i067.jpg", "size": 80332, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i073.jpg", "size": 71217, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i077.jpg", "size": 90453, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i078.jpg", "size": 53605, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i079a.jpg", "size": 23506, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i079b.jpg", "size": 96012, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i082.jpg", "size": 57527, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i087a.jpg", "size": 24989, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i087b.jpg", "size": 98153, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i091.jpg", "size": 63059, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i093.jpg", "size": 42438, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i094.jpg", "size": 77003, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i095a.jpg", "size": 15313, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i095b.jpg", "size": 94615, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i103.jpg", "size": 91230, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i107.jpg", "size": 57765, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i109.jpg", "size": 85082, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i110.jpg", "size": 43498, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i111a.jpg", "size": 21429, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i111b.jpg", "size": 98838, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i114.jpg", "size": 63727, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i119.jpg", "size": 93822, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i121.jpg", "size": 71520, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i122.jpg", "size": 91253, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i123a.jpg", "size": 17126, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i123b.jpg", "size": 93966, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i127.jpg", "size": 92656, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i134.jpg", "size": 47561, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i139.jpg", "size": 68212, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i141.jpg", "size": 54973, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i142.jpg", "size": 81678, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i143a.jpg", "size": 16903, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i143b.jpg", "size": 96416, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i146.jpg", "size": 61646, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i149.jpg", "size": 58325, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i150.jpg", "size": 60563, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i151.jpg", "size": 92316, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i155a.jpg", "size": 14731, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i155b.jpg", "size": 95422, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i156-157.jpg", "size": 48256, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i162.jpg", "size": 69897, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i166-167.jpg", "size": 91202, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i171.jpg", "size": 63766, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i173.jpg", "size": 33553, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i174.jpg", "size": 67992, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i175a.jpg", "size": 15625, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i175b.jpg", "size": 92468, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i178-179.jpg", "size": 49151, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i184.jpg", "size": 44305, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i185.jpg", "size": 48143, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i186.jpg", "size": 74760, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i187a.jpg", "size": 16056, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i187b.jpg", "size": 79672, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i189.jpg", "size": 42132, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i195.jpg", "size": 50177, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i197.jpg", "size": 26781, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i198.jpg", "size": 81805, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i199a.jpg", "size": 18641, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i199b.jpg", "size": 82051, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i201.jpg", "size": 81160, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i207.jpg", "size": 102259, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i209.jpg", "size": 43164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i210.jpg", "size": 88341, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i211a.jpg", "size": 16871, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i211b.jpg", "size": 102203, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i214.jpg", "size": 42917, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i217.jpg", "size": 65770, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i218.jpg", "size": 96150, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i219a.jpg", "size": 17316, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i219b.jpg", "size": 100290, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i222-223.jpg", "size": 99542, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i230.jpg", "size": 48577, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i231a.jpg", "size": 23430, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i231b.jpg", "size": 93020, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i232-233.jpg", "size": 64229, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i238.jpg", "size": 56373, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i239.jpg", "size": 80027, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i243.jpg", "size": 100293, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i246-247.jpg", "size": 71596, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i249.jpg", "size": 74678, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i250.jpg", "size": 94725, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i251a.jpg", "size": 17995, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i251b.jpg", "size": 97864, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i255.jpg", "size": 85601, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i261.jpg", "size": 79272, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i262.jpg", "size": 64645, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i263a.jpg", "size": 19281, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i263b.jpg", "size": 87880, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i271a.jpg", "size": 19795, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i271b.jpg", "size": 94754, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i277.jpg", "size": 68080, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i278-279.jpg", "size": 88873, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i283a.jpg", "size": 17087, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i283b.jpg", "size": 99332, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i291.jpg", "size": 99860, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i293.jpg", "size": 58033, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i294.jpg", "size": 81172, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i295a.jpg", "size": 24378, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i295b.jpg", "size": 101775, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i298.jpg", "size": 79655, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i299a.jpg", "size": 28316, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i299b.jpg", "size": 99658, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i307a.jpg", "size": 15179, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i307b.jpg", "size": 86449, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i311.jpg", "size": 99831, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i314-315.jpg", "size": 85562, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i319a.jpg", "size": 28161, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i319b.jpg", "size": 94971, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i321.jpg", "size": 26951, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i327.jpg", "size": 75817, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i329.jpg", "size": 58579, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i330.jpg", "size": 39842, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i331a.jpg", "size": 24198, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i331b.jpg", "size": 91571, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i333.jpg", "size": 80790, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i335.jpg", "size": 98940, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Patchwork Girl Of Oz/i337.jpg", "size": 95139, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/.DS_Store", "size": 16388, "type": null }, { "file": "WizardOfOz/Images/The Road To Oz/14566437430_efae3f3575_o.jpg", "size": 481465, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566438690_d91ddb7936_o.jpg", "size": 351975, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566442120_5c2a7b13d1_o.jpg", "size": 191074, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566444220_23a2b204c6_o.jpg", "size": 413164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566460208_2509216357_o.jpg", "size": 552256, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566460500_a4f8b19897_o.jpg", "size": 425826, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566460909_fca7493e31_o.jpg", "size": 303868, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566460930_1b15e3b578_o.jpg", "size": 204890, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566461619_f8bc3bc54c_o.jpg", "size": 108674, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566462858_1380c1c725_o.jpg", "size": 31132, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566466269_34aba6948a_o.jpg", "size": 120942, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566467829_cc9181b891_o.jpg", "size": 302737, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566468760_4a2b09bc78_o.jpg", "size": 409344, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566469140_22be122959_o.jpg", "size": 245975, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566473880_d6eea61aba_o.jpg", "size": 375341, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566474268_d666933884_o.jpg", "size": 265125, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566474329_b789228110_o.jpg", "size": 287459, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566478258_7facee9911_o.jpg", "size": 967081, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566486829_3d53b3cc08_o.jpg", "size": 254232, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566492328_c06fe6ec9d_o.jpg", "size": 430969, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566494018_3b757584b2_o.jpg", "size": 747943, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566497678_43bb30ffab_o.jpg", "size": 349216, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566500588_3e3510c767_o.jpg", "size": 413266, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566504258_fb0a9007d7_o.jpg", "size": 326634, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566507568_fb0262fceb_o.jpg", "size": 348859, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566511719_71afb8d999_o.jpg", "size": 420312, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566514678_522b6b70bd_o.jpg", "size": 847847, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566519398_1042beab10_o.jpg", "size": 233011, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566523809_970ff5a3c5_o.jpg", "size": 297039, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566524959_10ea0b2a87_o.jpg", "size": 1132496, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566525849_71740fafbf_o.jpg", "size": 304217, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566527649_c91a6bd53f_o.jpg", "size": 514400, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566528048_e54cb02d8e_o.jpg", "size": 920448, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566672637_5fa76681fa_o.jpg", "size": 281603, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566673787_0acbee2390_o.jpg", "size": 398246, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566674107_a6a334166e_o.jpg", "size": 234024, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566675977_fec9e6631d_o.jpg", "size": 289864, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566677627_80e9dce6b4_o.jpg", "size": 367390, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566679777_10a5bc6523_o.jpg", "size": 1017998, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566686067_6102b081e0_o.jpg", "size": 465668, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566687427_815a9f70b1_o.jpg", "size": 30536, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566691127_062a1d3baf_o.jpg", "size": 294990, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566700417_1bc5519182_o.jpg", "size": 371225, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566708227_6d432dc2da_o.jpg", "size": 423028, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566708617_1f0e2d41f9_o.jpg", "size": 1060815, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566713057_69c8180a95_o.jpg", "size": 760457, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566716007_66bb7c7eda_o.jpg", "size": 399902, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566717087_c304c9cd6e_o.jpg", "size": 386439, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566721557_13be1ed1fc_o.jpg", "size": 440001, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14566736087_d99e661897_o.jpg", "size": 37088, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730130566_5c727f8d99_o.jpg", "size": 396646, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730142946_dac06040ee_o.jpg", "size": 229988, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730161276_08c3f43567_o.jpg", "size": 408930, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730178206_425d457978_o.jpg", "size": 283728, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730179696_43f9c1f4ce_o.jpg", "size": 1106128, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14730182016_6ca61d3dfc_o.jpg", "size": 430802, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14749975421_a13ae92558_o.jpg", "size": 230275, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14749979571_1a6106f66e_o.jpg", "size": 935363, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14749982681_93bcd74182_o.jpg", "size": 307570, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14749991481_2c68d242c1_o.jpg", "size": 504538, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14749994701_a53efea691_o.jpg", "size": 376309, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750006071_7f7aa37c1c_o.jpg", "size": 815310, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750008551_1bfe46e130_o.jpg", "size": 217154, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750778424_3d603e3a71_o.jpg", "size": 351127, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750781184_34bf3bea16_o.jpg", "size": 418980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750787714_f96c80ae18_o.jpg", "size": 943240, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750792744_69c6a7ae2e_o.jpg", "size": 188271, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750804294_cc932bd062_o.jpg", "size": 1386068, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750828724_7d99a0b9e0_o.jpg", "size": 210643, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750833444_ef66704474_o.jpg", "size": 353122, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750838594_07e069ef10_o.jpg", "size": 300781, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14750841884_dece101b65_o.jpg", "size": 314177, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752812992_6666984e0a_o.jpg", "size": 412788, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752818792_7664b02d91_o.jpg", "size": 466528, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752830102_28b8382d56_o.jpg", "size": 381711, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752833312_536b11bb07_o.jpg", "size": 394460, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752840722_d0f9cd35db_o.jpg", "size": 235286, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752859752_f94dd997c3_o.jpg", "size": 1018728, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14752869262_a8cf33ed89_o.jpg", "size": 1038584, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753118065_3f111e1089_o.jpg", "size": 494325, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753131375_cd0c37a0c9_o.jpg", "size": 420106, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753134395_0a8a5047b7_o.jpg", "size": 343963, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753146805_133dd98351_o.jpg", "size": 406811, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753153705_66042e6111_o.jpg", "size": 96510, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753158095_e3968295d7_o.jpg", "size": 358897, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753159245_8acf8019e7_o.jpg", "size": 450079, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753163595_65e72fc16d_o.jpg", "size": 438315, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753164885_566110d025_o.jpg", "size": 467776, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14753168465_51cbf035a9_o.jpg", "size": 1012071, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14772979543_ea48c58dbb_o.jpg", "size": 193106, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14772985983_ba10e5108f_o.jpg", "size": 243597, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14772997163_14b4b83d4d_o.jpg", "size": 329862, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773005723_08b37ea3a6_o.jpg", "size": 306508, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773008293_d4587dfdd2_o.jpg", "size": 238953, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773026823_079d3e10b3_o.jpg", "size": 357867, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773028093_73370445fd_o.jpg", "size": 212293, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773029193_430621373d_o.jpg", "size": 290725, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773039803_17f5daabde_o.jpg", "size": 347718, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/14773041343_528f02a3d9_o.jpg", "size": 296774, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/cover.jpg", "size": 46034, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Road To Oz/filelist.txt", "size": 3182, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/.DS_Store", "size": 14340, "type": null }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_1.png", "size": 256684, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_10.png", "size": 279306, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_11.png", "size": 266876, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_12.png", "size": 260389, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_2.png", "size": 243240, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_3.png", "size": 304240, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_4.png", "size": 238397, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_5.png", "size": 292252, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_6.png", "size": 268646, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_7.png", "size": 268559, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_8.png", "size": 292718, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/color_9.png", "size": 266667, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/cover.jpg", "size": 241844, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/cover2.jpg", "size": 42488, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/filelist.txt", "size": 1771, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_1.png", "size": 10076, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_10-11_sm.png", "size": 68778, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_101.png", "size": 19487, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_105.png", "size": 29821, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_109.png", "size": 51770, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_113.png", "size": 46428, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_116-117.png", "size": 24024, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_119.png", "size": 18897, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_12.png", "size": 72838, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_123.png", "size": 32895, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_127.png", "size": 15974, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_13.png", "size": 19453, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_130.png", "size": 31376, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_131.png", "size": 19861, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_137.png", "size": 28429, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_138.png", "size": 18333, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_143.png", "size": 53770, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_147.png", "size": 50634, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_149.png", "size": 40168, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_150.png", "size": 22651, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_151.png", "size": 16790, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_155.png", "size": 64994, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_159.png", "size": 20164, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_163.png", "size": 67380, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_166.png", "size": 16995, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_167.png", "size": 26435, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_169.png", "size": 57251, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_173.png", "size": 42504, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_175.png", "size": 73190, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_176-177.png", "size": 28726, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_178.png", "size": 23142, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_18-19_sm.png", "size": 84488, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_183.png", "size": 30369, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_187.png", "size": 70567, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_191.png", "size": 29161, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_194.png", "size": 33791, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_195.png", "size": 24707, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_198.png", "size": 25723, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_201.png", "size": 12919, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_203.png", "size": 12540, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_204.png", "size": 17203, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_207.png", "size": 42511, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_209.png", "size": 40927, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_212.png", "size": 33024, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_213.png", "size": 17800, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_215.png", "size": 23383, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_219.png", "size": 27693, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_22.png", "size": 13822, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_220.png", "size": 23686, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_221.png", "size": 51640, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_225.png", "size": 68672, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_229.png", "size": 28329, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_230.png", "size": 20028, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_233.png", "size": 40963, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_237.png", "size": 29764, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_239.png", "size": 57307, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_241.png", "size": 22462, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_245.png", "size": 30699, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_250-251.png", "size": 34688, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_255.png", "size": 19033, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_259.png", "size": 51550, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_261.png", "size": 31369, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_263.png", "size": 21867, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_264.png", "size": 19678, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_269.png", "size": 38816, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_27.png", "size": 40791, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_272.png", "size": 27961, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_273.png", "size": 21781, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_277.png", "size": 35739, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_278.png", "size": 20752, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_284.png", "size": 95453, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_285.png", "size": 53781, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_288.png", "size": 53768, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_3.png", "size": 45284, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_32.png", "size": 37355, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_33.png", "size": 19695, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_39.png", "size": 27579, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_4.png", "size": 37356, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_43.png", "size": 25928, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_5.png", "size": 2285, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_51.png", "size": 34512, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_52.png", "size": 18451, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_56-57.png", "size": 56573, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_59.png", "size": 30368, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_6.png", "size": 35981, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_61.png", "size": 20535, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_62.png", "size": 20226, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_67.png", "size": 30140, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_7.png", "size": 41205, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_71.png", "size": 35671, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_77.png", "size": 22246, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_81.png", "size": 23961, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_82.png", "size": 25532, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_88.png", "size": 37814, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_89.png", "size": 19343, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_9.png", "size": 55596, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_96-97.png", "size": 63740, "type": "image/png" }, { "file": "WizardOfOz/Images/The Scarecrow of Oz/page_99.png", "size": 60003, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/endpapers.png", "size": 40843, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/filelist.txt", "size": 904, "type": "text/plain" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i003.png", "size": 21307, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i004.png", "size": 28406, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i006.jpg", "size": 100171, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i007.png", "size": 1747, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i008.png", "size": 19228, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i009.png", "size": 13910, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i010.png", "size": 22086, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i014.png", "size": 27861, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i020-21s.png", "size": 40282, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i023.png", "size": 18753, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i028.jpg", "size": 103470, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i031.png", "size": 45311, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i037.png", "size": 17965, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i041.png", "size": 15557, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i045.png", "size": 21900, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i047.jpg", "size": 99567, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i051.png", "size": 20804, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i054.png", "size": 19869, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i063.png", "size": 45439, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i065.png", "size": 22999, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i068-69s.png", "size": 44678, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i071.png", "size": 18641, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i075.jpg", "size": 102097, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i084-85s.png", "size": 43915, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i087.png", "size": 14417, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i095.png", "size": 29555, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i099.png", "size": 17416, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i103.png", "size": 49299, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i105.png", "size": 17023, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i111.png", "size": 31507, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i113.png", "size": 17717, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i119.jpg", "size": 100248, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i126.png", "size": 22440, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i129.png", "size": 17279, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i131.png", "size": 16180, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i137.png", "size": 34147, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i140.png", "size": 10576, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i147.png", "size": 39358, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i151.png", "size": 24123, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i155.png", "size": 11632, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i160-161s.png", "size": 36348, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i163.jpg", "size": 100364, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i173.png", "size": 19131, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i175.png", "size": 38512, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i182.jpg", "size": 101276, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i185.png", "size": 40265, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i191.png", "size": 34803, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i192.png", "size": 21426, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i195.png", "size": 34543, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i198.png", "size": 11372, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i207.jpg", "size": 100407, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i218-219s.png", "size": 51728, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i224.png", "size": 18939, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i227.png", "size": 31874, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i234-235s.png", "size": 58875, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i237.png", "size": 49120, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i241.png", "size": 15863, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i243.jpg", "size": 99394, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i251.png", "size": 25093, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i259.jpg", "size": 101289, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i261.png", "size": 48015, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i267.png", "size": 32237, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i270.png", "size": 19366, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i276-277s.png", "size": 40217, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i283.png", "size": 28537, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i286.png", "size": 16498, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i295.jpg", "size": 98131, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i297.png", "size": 13711, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i307.jpg", "size": 101092, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/i312.png", "size": 6513, "type": "image/png" }, { "file": "WizardOfOz/Images/The Tin Woodman of Oz/icover.jpg", "size": 99805, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/cover.jpg", "size": 46317, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/filelist.txt", "size": 1008, "type": "text/plain" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/logo.png", "size": 3009, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p003.png", "size": 50684, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p004.png", "size": 53649, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p006.png", "size": 47493, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p007.png", "size": 52160, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p008.png", "size": 47447, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p009.png", "size": 27542, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p012.png", "size": 34881, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p013.png", "size": 23e3, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p021.png", "size": 64426, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p023.png", "size": 27918, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p024.png", "size": 23480, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p025.png", "size": 75852, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p027.png", "size": 21193, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p028.png", "size": 23925, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p035.png", "size": 57453, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p039.png", "size": 21721, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p042.png", "size": 27601, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p044.png", "size": 57592, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p048.png", "size": 27663, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p056.png", "size": 66039, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p057.png", "size": 66086, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p059.png", "size": 49861, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p063.png", "size": 65133, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p065.png", "size": 20400, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p077.png", "size": 13812, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p078.png", "size": 22879, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p081.png", "size": 61955, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p085.png", "size": 47606, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p092.png", "size": 25450, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p099.png", "size": 66973, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p103.png", "size": 39360, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p106.png", "size": 21306, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p107.png", "size": 20755, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p113.png", "size": 49926, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p117.png", "size": 55194, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p119.png", "size": 13133, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p120.png", "size": 21278, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p127.png", "size": 69228, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p128.png", "size": 16314, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p129.png", "size": 22451, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p135.png", "size": 10340, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p136.png", "size": 24568, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p148.png", "size": 22188, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p149.png", "size": 17173, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p155.png", "size": 68449, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p158.png", "size": 23615, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p159.png", "size": 25618, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p163.png", "size": 73166, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p166.png", "size": 5993, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p167.png", "size": 82385, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p168.png", "size": 27671, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p171.png", "size": 65318, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p177.png", "size": 23008, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p179.png", "size": 63415, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p183.png", "size": 77953, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p187.png", "size": 56255, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p192.png", "size": 35136, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p193.png", "size": 24306, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p201.png", "size": 57680, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p202.png", "size": 21116, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p205.png", "size": 82066, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p211.png", "size": 31919, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p212.png", "size": 26599, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p213.png", "size": 21057, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p219.png", "size": 72590, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p221.png", "size": 18701, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p225.png", "size": 43473, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p232.png", "size": 8111, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p233.png", "size": 15127, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p239.png", "size": 88309, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p245.png", "size": 26144, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p249.png", "size": 50437, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p250.png", "size": 26580, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p251.png", "size": 16497, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p261.png", "size": 48616, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p262.png", "size": 15644, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p263.png", "size": 14524, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p269.png", "size": 66765, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/p272.png", "size": 14836, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/toc_bkgrnd.png", "size": 37769, "type": "image/png" }, { "file": "WizardOfOz/Images/Tik-tok Of Oz/toc_epub.png", "size": 32447, "type": "image/png" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/.DS_Store", "size": 16388, "type": null }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/filelist.txt", "size": 2499, "type": "text/plain" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i001_edit.jpg", "size": 140275, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i003_edit.jpg", "size": 24697, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i004_edit.jpg", "size": 101608, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i005_edit.jpg", "size": 44541, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i006_edit.jpg", "size": 67181, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i007_edit.jpg", "size": 63353, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i009_edit.jpg", "size": 67902, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i011_edit.jpg", "size": 114164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i013_edit.jpg", "size": 43258, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i016_edit.jpg", "size": 62095, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i017.jpg", "size": 63288, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i019_edit.jpg", "size": 55414, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i021.jpg", "size": 137818, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i023_edit.jpg", "size": 35646, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i024_edit.jpg", "size": 70160, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i027_edit.jpg", "size": 34175, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i028_edit.jpg", "size": 20796, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i030_edit.jpg", "size": 43023, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i031.jpg", "size": 62974, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i033.jpg", "size": 59016, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i035_edit.jpg", "size": 61878, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i037.jpg", "size": 173230, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i039_edit.jpg", "size": 31207, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i041_edit.jpg", "size": 131725, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i044_edit.jpg", "size": 43561, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i047.jpg", "size": 123434, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i049_edit.jpg", "size": 54980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i051.jpg", "size": 156980, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i055_edit.jpg", "size": 97325, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i057.jpg", "size": 58427, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i059.jpg", "size": 86859, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i061_edit.jpg", "size": 53853, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i063_edit.jpg", "size": 158045, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i065_edit.jpg", "size": 158911, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i068_edit.jpg", "size": 62362, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i070_edit.jpg", "size": 64840, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i071_edit.jpg", "size": 65960, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i073_edit.jpg", "size": 58181, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i075_edit.jpg", "size": 148434, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i076_edit.jpg", "size": 98729, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i079_edit.jpg", "size": 43297, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i082_edit.jpg", "size": 63211, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i084_edit.jpg", "size": 79361, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i086_edit.jpg", "size": 69975, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i087_edit.jpg", "size": 56796, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i089-i090_combo.jpg", "size": 38676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i093_edit.jpg", "size": 133555, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i095_edit.jpg", "size": 66844, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i096_edit.jpg", "size": 72417, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i098_edit.jpg", "size": 96313, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i100_edit.jpg", "size": 57452, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i101_edit.jpg", "size": 37230, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i102_edit.jpg", "size": 36128, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i103_edit.jpg", "size": 36204, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i107_edit.jpg", "size": 110849, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i109-edit.jpg", "size": 64544, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i111_edit.jpg", "size": 73009, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i112_edit.jpg", "size": 68737, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i114_edit.jpg", "size": 57971, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i116_edit.jpg", "size": 122474, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i118_edit.jpg", "size": 35400, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i121-i122_combo.jpg", "size": 63491, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i123_edit.jpg", "size": 38176, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i124_edit.jpg", "size": 63787, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i126_edit.jpg", "size": 76202, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i127-i128_combo.jpg", "size": 51867, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i130_edit.jpg", "size": 41594, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i132_edit.jpg", "size": 137884, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i135_edit.jpg", "size": 37519, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i136_edit.jpg", "size": 46073, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i138_edit.jpg", "size": 55199, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i140_edit.jpg", "size": 63048, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i142_edit.jpg", "size": 100640, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i143_edit.jpg", "size": 74066, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i144_edit.jpg", "size": 62336, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i148_edit.jpg", "size": 48278, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i150_edit.jpg", "size": 46355, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i152_edit.jpg", "size": 157573, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i154_edit.jpg", "size": 19548, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i155_edit.jpg", "size": 138762, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i158_edit.jpg", "size": 149266, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i160_edit.jpg", "size": 68542, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i162_edit.jpg", "size": 48703, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i163_edit.jpg", "size": 34077, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i165_edit.jpg", "size": 38820, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i167_edit.jpg", "size": 50207, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i168_edit.jpg", "size": 6035, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i169_edit.jpg", "size": 31924, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i170_edit.jpg", "size": 36773, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i172_edit.jpg", "size": 148233, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i174_edit.jpg", "size": 52311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i178_edit.jpg", "size": 21613, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i180_edit.jpg", "size": 45311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i182_edit.jpg", "size": 51690, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i184_edit.jpg", "size": 58323, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i186_edit.jpg", "size": 145696, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i190_edit.jpg", "size": 44211, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i192_edit.jpg", "size": 72722, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i194_edit.jpg", "size": 58275, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i195-196_combo.jpg", "size": 33557, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i198_edit.jpg", "size": 112792, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i202_edit.jpg", "size": 49190, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i204_edit.jpg", "size": 52642, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i206_edit.jpg", "size": 58120, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i208_edit.jpg", "size": 45850, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i210_edit.jpg", "size": 16612, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i212_edit.jpg", "size": 42065, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i214_edit.jpg", "size": 130889, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i218_edit.jpg", "size": 47955, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i220_edit.jpg", "size": 35874, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i221_edit.jpg", "size": 21043, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i222_edit.jpg", "size": 45664, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i224_edit.jpg", "size": 86330, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i226_edit.jpg", "size": 43164, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i228_edit.jpg", "size": 134714, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i230_edit.jpg", "size": 36772, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i231_edit.jpg", "size": 34022, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i234_edit.jpg", "size": 81553, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i236_edit.jpg", "size": 32079, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i238_edit.jpg", "size": 14927, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i240_edit.jpg", "size": 47183, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i242_edit.jpg", "size": 62700, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i244_edit.jpg", "size": 56026, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i246_edit.jpg", "size": 162056, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i249_edit.jpg", "size": 29e3, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i251_edit.jpg", "size": 67299, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i252_edit.jpg", "size": 122234, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i254_edit.jpg", "size": 61190, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i256_edit.jpg", "size": 138567, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i259_edit.jpg", "size": 77843, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i262_edit.jpg", "size": 75281, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i264_edit.jpg", "size": 60327, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i266_edit.jpg", "size": 112453, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i270_edit.jpg", "size": 37764, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i272_edit.jpg", "size": 71161, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i274_edit.jpg", "size": 81315, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i276_edit.jpg", "size": 58438, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i278_edit.jpg", "size": 50204, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i282_edit.jpg", "size": 74888, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i284_edit.jpg", "size": 114764, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i286_edit.jpg", "size": 52072, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i290_edit.jpg", "size": 52672, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i292_edit.jpg", "size": 79556, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i294_edit.jpg", "size": 142063, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i296_edit.jpg", "size": 49231, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i299_edit.jpg", "size": 66111, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i301_edit.jpg", "size": 9982, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/i304_edit.jpg", "size": 56390, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/.DS_Store", "size": 8196, "type": null }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0001v.jpg", "size": 411627, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0011v.jpg", "size": 230107, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0015v.jpg", "size": 1501114, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0023v.jpg", "size": 279688, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0025v.jpg", "size": 398467, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0041v.jpg", "size": 452302, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0059v.jpg", "size": 369457, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0069v.jpg", "size": 448796, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0075v.jpg", "size": 361300, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0081v.jpg", "size": 481369, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0089v.jpg", "size": 290374, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0101v.jpg", "size": 394701, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0109v.jpg", "size": 319993, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0114v.jpg", "size": 305974, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0121v.jpg", "size": 398928, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0135v.jpg", "size": 398286, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0139v.jpg", "size": 404311, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0151v.jpg", "size": 408529, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0160v.jpg", "size": 440292, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0165v.jpg", "size": 413696, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0179v.jpg", "size": 407676, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0185v.jpg", "size": 290957, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0191v.jpg", "size": 411481, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0203v.jpg", "size": 352515, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0209v.jpg", "size": 260126, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0215v.jpg", "size": 343413, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0219v.jpg", "size": 382077, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0227v.jpg", "size": 229888, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0235v.jpg", "size": 379858, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0251v.jpg", "size": 449368, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0261v.jpg", "size": 389765, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0271v.jpg", "size": 411079, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0287v.jpg", "size": 286102, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0291v.jpg", "size": 329433, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0301v.jpg", "size": 400574, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/0312v.jpg", "size": 408786, "type": "image/jpeg" }, { "file": "WizardOfOz/Images/Wonderful Wizard Of Oz/old/filelist.txt", "size": 468, "type": "text/plain" }, { "file": "WizardOfOz/Scraping Code/.DS_Store", "size": 6148, "type": null }, { "file": "WizardOfOz/Scraping Code/.ipynb_checkpoints/Making Lists For Characters-checkpoint.ipynb", "size": 26005, "type": null }, { "file": "WizardOfOz/Scraping Code/Dorothy And The Wizard In Oz Links", "size": 149377, "type": null }, { "file": "WizardOfOz/Scraping Code/Download All Images From Links From File.ipynb", "size": 4049, "type": null }, { "file": "WizardOfOz/Scraping Code/Download All Images From Page.ipynb", "size": 9269, "type": null }, { "file": "WizardOfOz/Scraping Code/Making Lists For Characters.ipynb", "size": 24900, "type": null }, { "file": "WizardOfOz/Scraping Code/Marvelous Land Of Oz Link", "size": 348195, "type": null }, { "file": "WizardOfOz/Scraping Code/Soup To Get Photos from Flickr search.ipynb", "size": 333475, "type": null }, { "file": "WizardOfOz/Scraping Code/The Road To Oz Links", "size": 265060, "type": null }, { "file": "WizardOfOz/Scraping Code/Wonderful Wizard Of Oz Links", "size": 35212, "type": null }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }],
      layout: "src/routes/__layout.svelte",
      error: ".svelte-kit/build/components/error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/byCharacter\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/byCharacter.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/character\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          a: ["src/routes/__layout.svelte", "src/routes/character/[slug].svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/byBook\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/byBook.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/todos\.json$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_index_json_288c2c7b(), index_json_288c2c7b_exports))
        },
        {
          type: "page",
          pattern: /^\/todos\/?$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/todos/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/todos\/([^/]+?)\.json$/,
          params: (m) => ({ uid: d(m[1]) }),
          load: () => Promise.resolve().then(() => (init_uid_json_095450d2(), uid_json_095450d2_exports))
        },
        {
          type: "page",
          pattern: /^\/book\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          a: ["src/routes/__layout.svelte", "src/routes/book/[slug].svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      "src/routes/__layout.svelte": () => Promise.resolve().then(() => (init_layout_4d64fb3d(), layout_4d64fb3d_exports)),
      ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(() => (init_error_47c7227d(), error_47c7227d_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_2238331e(), index_2238331e_exports)),
      "src/routes/byCharacter.svelte": () => Promise.resolve().then(() => (init_byCharacter_9ebeb2c2(), byCharacter_9ebeb2c2_exports)),
      "src/routes/character/[slug].svelte": () => Promise.resolve().then(() => (init_slug_ce389d9f(), slug_ce389d9f_exports)),
      "src/routes/byBook.svelte": () => Promise.resolve().then(() => (init_byBook_f63296e1(), byBook_f63296e1_exports)),
      "src/routes/todos/index.svelte": () => Promise.resolve().then(() => (init_index_c5e80781(), index_c5e80781_exports)),
      "src/routes/book/[slug].svelte": () => Promise.resolve().then(() => (init_slug_f84e6dab(), slug_f84e6dab_exports))
    };
    metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-92926c9b.js", "css": ["assets/pages/__layout.svelte-262f9fa3.css"], "js": ["pages/__layout.svelte-92926c9b.js", "chunks/vendor-c0c3cf9b.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-d8e07498.js", "css": [], "js": ["error.svelte-d8e07498.js", "chunks/vendor-c0c3cf9b.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-7ddb3aa9.js", "css": [], "js": ["pages/index.svelte-7ddb3aa9.js", "chunks/vendor-c0c3cf9b.js", "chunks/singletons-12a22614.js"], "styles": [] }, "src/routes/byCharacter.svelte": { "entry": "pages/byCharacter.svelte-c9eda4a2.js", "css": [], "js": ["pages/byCharacter.svelte-c9eda4a2.js", "chunks/vendor-c0c3cf9b.js", "chunks/env-a13806e5.js", "chunks/ImgItem-69ed6302.js", "chunks/file_list-b6351ddc.js"], "styles": [] }, "src/routes/character/[slug].svelte": { "entry": "pages/character/_slug_.svelte-926bdb98.js", "css": [], "js": ["pages/character/_slug_.svelte-926bdb98.js", "chunks/vendor-c0c3cf9b.js", "chunks/ImgItem-69ed6302.js", "chunks/file_list-b6351ddc.js"], "styles": [] }, "src/routes/byBook.svelte": { "entry": "pages/byBook.svelte-52df74f4.js", "css": ["assets/pages/byBook.svelte-4b2c420d.css"], "js": ["pages/byBook.svelte-52df74f4.js", "chunks/vendor-c0c3cf9b.js", "chunks/env-a13806e5.js", "chunks/ImgItem-69ed6302.js"], "styles": [] }, "src/routes/todos/index.svelte": { "entry": "pages/todos/index.svelte-fbdf4661.js", "css": ["assets/pages/todos/index.svelte-785505fa.css"], "js": ["pages/todos/index.svelte-fbdf4661.js", "chunks/vendor-c0c3cf9b.js"], "styles": [] }, "src/routes/book/[slug].svelte": { "entry": "pages/book/_slug_.svelte-523c3472.js", "css": [], "js": ["pages/book/_slug_.svelte-523c3472.js", "chunks/vendor-c0c3cf9b.js", "chunks/ImgItem-69ed6302.js", "chunks/file_list-b6351ddc.js"], "styles": [] } };
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();
init_app_c342cded();
var import_cookie10 = __toModule(require_cookie());
init_dist();

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (!rendered) {
    return {
      statusCode: 404,
      body: "Not found"
    };
  }
  const partial_response = {
    statusCode: rendered.status,
    ...split_headers(rendered.headers)
  };
  if (rendered.body instanceof Uint8Array) {
    return {
      ...partial_response,
      isBase64Encoded: true,
      body: Buffer.from(rendered.body).toString("base64")
    };
  }
  return {
    ...partial_response,
    body: rendered.body
  };
}
function split_headers(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
