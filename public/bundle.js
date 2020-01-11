
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty) {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.ctx, $$.dirty);
            $$.dirty = [-1];
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*!
     * Determine if an object is a Buffer
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     */

    var isBuffer = function isBuffer (obj) {
      return obj != null && obj.constructor != null &&
        typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = merge(result[key], val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Function equal to merge with the difference being that no reference
     * to original objects is kept.
     *
     * @see merge
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function deepMerge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = deepMerge(result[key], val);
        } else if (typeof val === 'object') {
          result[key] = deepMerge({}, val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      deepMerge: deepMerge,
      extend: extend,
      trim: trim
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password || '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          var cookies$1 = cookies;

          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
            cookies$1.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (config.withCredentials) {
          request.withCredentials = true;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (requestData === undefined) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      // Only Node.JS has a process variable that is of [[Class]] process
      if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      } else if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Support baseURL config
      if (config.baseURL && !isAbsoluteURL(config.url)) {
        config.url = combineURLs(config.baseURL, config.url);
      }

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers || {}
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      utils.forEach(['url', 'method', 'params', 'data'], function valueFromConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        }
      });

      utils.forEach(['headers', 'auth', 'proxy'], function mergeDeepProperties(prop) {
        if (utils.isObject(config2[prop])) {
          config[prop] = utils.deepMerge(config1[prop], config2[prop]);
        } else if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (utils.isObject(config1[prop])) {
          config[prop] = utils.deepMerge(config1[prop]);
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      utils.forEach([
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength',
        'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken',
        'socketPath'
      ], function defaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);
      config.method = config.method ? config.method.toLowerCase() : 'get';

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var default_1 = axios;
    axios_1.default = default_1;

    var axios$1 = axios_1;

    /* src/Frame/Frame.svelte generated by Svelte v3.16.4 */
    const file = "src/Frame/Frame.svelte";

    // (48:60) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("You are not logged in");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(48:60) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:16) {#if isLoggedIn}
    function create_if_block(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Logout";
    			attr_dev(a, "href", "/logout");
    			add_location(a, file, 47, 32, 1264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:16) {#if isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let a;
    	let t1;
    	let p;
    	let t2;
    	let span;
    	let t4;
    	let t5;
    	let section;
    	let t6;
    	let footer;
    	let div;
    	let img;
    	let img_src_value;
    	let t7;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	function select_block_type(ctx, dirty) {
    		if (/*isLoggedIn*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			a = element("a");
    			a.textContent = "Wali";
    			t1 = space();
    			p = element("p");
    			t2 = text("Welcome to wali");
    			span = element("span");
    			span.textContent = ".family";
    			t4 = text(", a service with a different vision for Islamic marriages.");
    			t5 = space();
    			section = element("section");
    			if (default_slot) default_slot.c();
    			t6 = space();
    			footer = element("footer");
    			div = element("div");
    			img = element("img");
    			t7 = space();
    			if_block.c();
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "link svelte-8q141l");
    			add_location(a, file, 38, 16, 834);
    			add_location(h1, file, 38, 12, 830);
    			attr_dev(span, "class", "dotfamily");
    			add_location(span, file, 39, 44, 921);
    			attr_dev(p, "class", "deck");
    			add_location(p, file, 39, 12, 889);
    			add_location(header, file, 37, 8, 797);
    			attr_dev(section, "class", "main");
    			add_location(section, file, 41, 8, 1051);
    			attr_dev(img, "alt", "No girls allowed");
    			if (img.src !== (img_src_value = "./img/nga.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-8q141l");
    			add_location(img, file, 46, 16, 1182);
    			attr_dev(div, "class", "nga svelte-8q141l");
    			add_location(div, file, 45, 12, 1148);
    			add_location(footer, file, 44, 8, 1127);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, a);
    			append_dev(header, t1);
    			append_dev(header, p);
    			append_dev(p, t2);
    			append_dev(p, span);
    			append_dev(p, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, section, anchor);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, img);
    			append_dev(div, t7);
    			if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty[0] & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(section);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(footer);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let isLoggedIn = false;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		axios$1.get("/isLoggedIn").then(res => {
    			console.log(res);
    			$$invalidate(0, isLoggedIn = JSON.parse(res.data));
    			if (isLoggedIn) dispatch("loggedIn");
    		});
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("isLoggedIn" in $$props) $$invalidate(0, isLoggedIn = $$props.isLoggedIn);
    	};

    	return [isLoggedIn, dispatch, $$scope, $$slots];
    }

    class Frame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Frame",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/AjaxForm.svelte generated by Svelte v3.16.4 */
    const file$1 = "src/AjaxForm.svelte";

    function create_fragment$1(ctx) {
    	let form;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			form = element("form");
    			if (default_slot) default_slot.c();
    			add_location(form, file$1, 21, 0, 453);
    			dispose = listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[0]), false, true, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);

    			if (default_slot) {
    				default_slot.m(form, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty[0] & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { action } = $$props;
    	let { customErrorDetection } = $$props;
    	let { values } = $$props;

    	function handleSubmit() {
    		axios$1.post(action, values).then(e => {
    			if (customErrorDetection(e)) dispatch("error");
    			dispatch("success");
    		});
    	}

    	const writable_props = ["action", "customErrorDetection", "values"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AjaxForm> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    		if ("customErrorDetection" in $$props) $$invalidate(2, customErrorDetection = $$props.customErrorDetection);
    		if ("values" in $$props) $$invalidate(3, values = $$props.values);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { action, customErrorDetection, values };
    	};

    	$$self.$inject_state = $$props => {
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    		if ("customErrorDetection" in $$props) $$invalidate(2, customErrorDetection = $$props.customErrorDetection);
    		if ("values" in $$props) $$invalidate(3, values = $$props.values);
    	};

    	return [handleSubmit, action, customErrorDetection, values, dispatch, $$scope, $$slots];
    }

    class AjaxForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			action: 1,
    			customErrorDetection: 2,
    			values: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AjaxForm",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*action*/ ctx[1] === undefined && !("action" in props)) {
    			console.warn("<AjaxForm> was created without expected prop 'action'");
    		}

    		if (/*customErrorDetection*/ ctx[2] === undefined && !("customErrorDetection" in props)) {
    			console.warn("<AjaxForm> was created without expected prop 'customErrorDetection'");
    		}

    		if (/*values*/ ctx[3] === undefined && !("values" in props)) {
    			console.warn("<AjaxForm> was created without expected prop 'values'");
    		}
    	}

    	get action() {
    		throw new Error("<AjaxForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<AjaxForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customErrorDetection() {
    		throw new Error("<AjaxForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customErrorDetection(value) {
    		throw new Error("<AjaxForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get values() {
    		throw new Error("<AjaxForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<AjaxForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LoginOrRegister/LoginOrRegister.svelte generated by Svelte v3.16.4 */

    const { console: console_1 } = globals;
    const file$2 = "src/LoginOrRegister/LoginOrRegister.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    // (142:48) 
    function create_if_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("We are sending a verification email.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(142:48) ",
    		ctx
    	});

    	return block;
    }

    // (135:48) 
    function create_if_block_4(ctx) {
    	let label;
    	let t;
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("Confirm Password\n            ");
    			input = element("input");
    			attr_dev(input, "type", "password");
    			add_location(input, file$2, 137, 12, 3464);
    			attr_dev(label, "class", "svelte-1ydcl2w");
    			add_location(label, file$2, 135, 8, 3415);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[23]),
    				listen_dev(input, "keydown", /*keydown_handler_2*/ ctx[24], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, input);
    			set_input_value(input, /*passwordConfirmation*/ ctx[3]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*passwordConfirmation*/ 8 && input.value !== /*passwordConfirmation*/ ctx[3]) {
    				set_input_value(input, /*passwordConfirmation*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(135:48) ",
    		ctx
    	});

    	return block;
    }

    // (133:45) 
    function create_if_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Login success!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(133:45) ",
    		ctx
    	});

    	return block;
    }

    // (120:4) {#if currentScreen == LOGIN_REGISTER}
    function create_if_block_2(ctx) {
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let dispose;

    	const block = {
    		c: function create() {
    			label0 = element("label");
    			t0 = text("E-mail\n        ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Password\n        ");
    			input1 = element("input");
    			add_location(input0, file$2, 122, 8, 3047);
    			attr_dev(label0, "class", "svelte-1ydcl2w");
    			add_location(label0, file$2, 120, 9, 3016);
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$2, 128, 8, 3177);
    			attr_dev(label1, "class", "svelte-1ydcl2w");
    			add_location(label1, file$2, 126, 4, 3144);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[19]),
    				listen_dev(input0, "keydown", /*keydown_handler*/ ctx[20], false, false, false),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    				listen_dev(input1, "keydown", /*keydown_handler_1*/ ctx[22], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label0, anchor);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*email*/ ctx[1]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[2]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*email*/ 2 && input0.value !== /*email*/ ctx[1]) {
    				set_input_value(input0, /*email*/ ctx[1]);
    			}

    			if (dirty[0] & /*password*/ 4 && input1.value !== /*password*/ ctx[2]) {
    				set_input_value(input1, /*password*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(120:4) {#if currentScreen == LOGIN_REGISTER}",
    		ctx
    	});

    	return block;
    }

    // (146:4) {#each errors as error}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*error*/ ctx[26] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "error svelte-1ydcl2w");
    			add_location(div, file$2, 145, 27, 3736);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*errors*/ 16 && t_value !== (t_value = /*error*/ ctx[26] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(146:4) {#each errors as error}",
    		ctx
    	});

    	return block;
    }

    // (148:46) 
    function create_if_block_1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Login";
    			t1 = text(" or ");
    			button1 = element("button");
    			button1.textContent = "Register";
    			add_location(button0, file$2, 147, 46, 3986);
    			add_location(button1, file$2, 147, 89, 4029);

    			dispose = [
    				listen_dev(button0, "click", /*login*/ ctx[5], false, false, false),
    				listen_dev(button1, "click", /*register*/ ctx[6], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(148:46) ",
    		ctx
    	});

    	return block;
    }

    // (147:4) {#if currentScreen == CONFIRM_PASSWORD}
    function create_if_block$1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Confirm";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Back";
    			add_location(button0, file$2, 146, 44, 3820);
    			add_location(button1, file$2, 146, 96, 3872);

    			dispose = [
    				listen_dev(button0, "click", /*confirmPassword*/ ctx[7], false, false, false),
    				listen_dev(button1, "click", /*click_handler*/ ctx[25], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(147:4) {#if currentScreen == CONFIRM_PASSWORD}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*currentScreen*/ ctx[0] == LOGIN_REGISTER) return create_if_block_2;
    		if (/*currentScreen*/ ctx[0] == LOGIN_SUCCESS) return create_if_block_3;
    		if (/*currentScreen*/ ctx[0] == CONFIRM_PASSWORD) return create_if_block_4;
    		if (/*currentScreen*/ ctx[0] == REGISTER_SUCCESS) return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let each_value = /*errors*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentScreen*/ ctx[0] == CONFIRM_PASSWORD) return create_if_block$1;
    		if (/*currentScreen*/ ctx[0] == LOGIN_REGISTER) return create_if_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "loginOrRegister svelte-1ydcl2w");
    			add_location(div, file$2, 118, 0, 2935);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			}

    			if (dirty[0] & /*errors*/ 16) {
    				each_value = /*errors*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block0) {
    				if_block0.d();
    			}

    			destroy_each(each_blocks, detaching);

    			if (if_block1) {
    				if_block1.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const LOGIN_REGISTER = "LOGIN_REGISTER";
    const LOGIN_SUCCESS = "LOGIN_SUCCESS";
    const CONFIRM_PASSWORD = "CONFIRM_PASSWORD";
    const REGISTER_SUCCESS = "REGISTER_SUCCESS";

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatcher = createEventDispatcher();
    	let { loginUrl } = $$props;
    	let { emailCheckUrl } = $$props;
    	let { registerUrl } = $$props;
    	let { loginErrors } = $$props;
    	let { registerErrors } = $$props;
    	let { confirmPasswordErrors } = $$props;
    	const screenStates = [LOGIN_REGISTER, LOGIN_SUCCESS, CONFIRM_PASSWORD, REGISTER_SUCCESS];
    	let currentScreen = LOGIN_REGISTER;
    	let email = "";
    	let password = "";
    	let passwordConfirmation = "";
    	let verifyPassword = "";
    	let errors = [];
    	let confirmPasswordScreen = false;
    	let verifyEmailScreen = false;

    	function login() {
    		$$invalidate(4, errors = []);

    		axios$1.post(loginUrl, { ["contact-info"]: email, password }, { withCredentials: true }).then(e => {
    			loginErrors.forEach(error => {
    				const err = error(e);
    				if (err) $$invalidate(4, errors = [...errors, err]);
    			});

    			if (!errors.length) {
    				$$invalidate(0, currentScreen = LOGIN_SUCCESS);
    				dispatcher("login");
    			}
    		});
    	}

    	function register() {
    		if (!email.length) $$invalidate(4, errors = [...errors, "Please enter an email"]);
    		if (!password.length) $$invalidate(4, errors = [...errors, "Please enter a password"]);

    		axios$1.post(emailCheckUrl, { email }, { withCredentials: true }).then(e => {
    			registerErrors.forEach(error => {
    				const err = error(e);
    				if (err) $$invalidate(4, errors = [...errors, err]);

    				if (!errors.length) {
    					$$invalidate(0, currentScreen = CONFIRM_PASSWORD);
    				}
    			});
    		});
    	}

    	function confirmPassword() {
    		if (!passwordConfirmation) $$invalidate(4, errors = [...errors, "Please confirm your password"]); else if (password !== passwordConfirmation) $$invalidate(4, errors = [...errors, "Passwords do not match"]); else {
    			axios$1.post(registerUrl, { ["contact-info"]: email, password }, { withCredentials: true }).then(e => {
    				console.log(e);

    				confirmPasswordErrors.forEach(error => {
    					const err = error(e);
    					if (err) $$invalidate(4, errors = [...errors, err]);
    				});

    				if (!errors.length) {
    					$$invalidate(0, currentScreen = REGISTER_SUCCESS);
    				}
    			});
    		}
    	}

    	const writable_props = [
    		"loginUrl",
    		"emailCheckUrl",
    		"registerUrl",
    		"loginErrors",
    		"registerErrors",
    		"confirmPasswordErrors"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<LoginOrRegister> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(1, email);
    	}

    	const keydown_handler = () => {
    		$$invalidate(4, errors = []);
    	};

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(2, password);
    	}

    	const keydown_handler_1 = () => {
    		$$invalidate(4, errors = []);
    	};

    	function input_input_handler() {
    		passwordConfirmation = this.value;
    		$$invalidate(3, passwordConfirmation);
    	}

    	const keydown_handler_2 = () => {
    		$$invalidate(4, errors = []);
    	};

    	const click_handler = () => {
    		$$invalidate(0, currentScreen = LOGIN_REGISTER);
    	};

    	$$self.$set = $$props => {
    		if ("loginUrl" in $$props) $$invalidate(8, loginUrl = $$props.loginUrl);
    		if ("emailCheckUrl" in $$props) $$invalidate(9, emailCheckUrl = $$props.emailCheckUrl);
    		if ("registerUrl" in $$props) $$invalidate(10, registerUrl = $$props.registerUrl);
    		if ("loginErrors" in $$props) $$invalidate(11, loginErrors = $$props.loginErrors);
    		if ("registerErrors" in $$props) $$invalidate(12, registerErrors = $$props.registerErrors);
    		if ("confirmPasswordErrors" in $$props) $$invalidate(13, confirmPasswordErrors = $$props.confirmPasswordErrors);
    	};

    	$$self.$capture_state = () => {
    		return {
    			loginUrl,
    			emailCheckUrl,
    			registerUrl,
    			loginErrors,
    			registerErrors,
    			confirmPasswordErrors,
    			currentScreen,
    			email,
    			password,
    			passwordConfirmation,
    			verifyPassword,
    			errors,
    			confirmPasswordScreen,
    			verifyEmailScreen
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("loginUrl" in $$props) $$invalidate(8, loginUrl = $$props.loginUrl);
    		if ("emailCheckUrl" in $$props) $$invalidate(9, emailCheckUrl = $$props.emailCheckUrl);
    		if ("registerUrl" in $$props) $$invalidate(10, registerUrl = $$props.registerUrl);
    		if ("loginErrors" in $$props) $$invalidate(11, loginErrors = $$props.loginErrors);
    		if ("registerErrors" in $$props) $$invalidate(12, registerErrors = $$props.registerErrors);
    		if ("confirmPasswordErrors" in $$props) $$invalidate(13, confirmPasswordErrors = $$props.confirmPasswordErrors);
    		if ("currentScreen" in $$props) $$invalidate(0, currentScreen = $$props.currentScreen);
    		if ("email" in $$props) $$invalidate(1, email = $$props.email);
    		if ("password" in $$props) $$invalidate(2, password = $$props.password);
    		if ("passwordConfirmation" in $$props) $$invalidate(3, passwordConfirmation = $$props.passwordConfirmation);
    		if ("verifyPassword" in $$props) verifyPassword = $$props.verifyPassword;
    		if ("errors" in $$props) $$invalidate(4, errors = $$props.errors);
    		if ("confirmPasswordScreen" in $$props) confirmPasswordScreen = $$props.confirmPasswordScreen;
    		if ("verifyEmailScreen" in $$props) verifyEmailScreen = $$props.verifyEmailScreen;
    	};

    	return [
    		currentScreen,
    		email,
    		password,
    		passwordConfirmation,
    		errors,
    		login,
    		register,
    		confirmPassword,
    		loginUrl,
    		emailCheckUrl,
    		registerUrl,
    		loginErrors,
    		registerErrors,
    		confirmPasswordErrors,
    		dispatcher,
    		screenStates,
    		verifyPassword,
    		confirmPasswordScreen,
    		verifyEmailScreen,
    		input0_input_handler,
    		keydown_handler,
    		input1_input_handler,
    		keydown_handler_1,
    		input_input_handler,
    		keydown_handler_2,
    		click_handler
    	];
    }

    class LoginOrRegister extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			loginUrl: 8,
    			emailCheckUrl: 9,
    			registerUrl: 10,
    			loginErrors: 11,
    			registerErrors: 12,
    			confirmPasswordErrors: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoginOrRegister",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*loginUrl*/ ctx[8] === undefined && !("loginUrl" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'loginUrl'");
    		}

    		if (/*emailCheckUrl*/ ctx[9] === undefined && !("emailCheckUrl" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'emailCheckUrl'");
    		}

    		if (/*registerUrl*/ ctx[10] === undefined && !("registerUrl" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'registerUrl'");
    		}

    		if (/*loginErrors*/ ctx[11] === undefined && !("loginErrors" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'loginErrors'");
    		}

    		if (/*registerErrors*/ ctx[12] === undefined && !("registerErrors" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'registerErrors'");
    		}

    		if (/*confirmPasswordErrors*/ ctx[13] === undefined && !("confirmPasswordErrors" in props)) {
    			console_1.warn("<LoginOrRegister> was created without expected prop 'confirmPasswordErrors'");
    		}
    	}

    	get loginUrl() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loginUrl(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emailCheckUrl() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emailCheckUrl(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get registerUrl() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set registerUrl(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loginErrors() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loginErrors(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get registerErrors() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set registerErrors(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get confirmPasswordErrors() {
    		throw new Error("<LoginOrRegister>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set confirmPasswordErrors(value) {
    		throw new Error("<LoginOrRegister>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/MakeAProfileForm/MakeAProfileForm.svelte generated by Svelte v3.16.4 */
    const file$3 = "src/MakeAProfileForm/MakeAProfileForm.svelte";

    // (37:1) <AjaxForm action="/make-profile/submit" values={{name,descriptionofyou,descriptionofspouse}} on:success={handleSuccess} on:error={handleError} customErrorDetection={e=>{      return e.data==='A weird error was thrown'  }}>
    function create_default_slot(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let label0;
    	let input0;
    	let t2;
    	let br0;
    	let t3;
    	let label1;
    	let input1;
    	let t4;
    	let br1;
    	let t5;
    	let label2;
    	let t6;
    	let input2;
    	let t7;
    	let label3;
    	let div2;
    	let t9;
    	let textarea0;
    	let t10;
    	let label4;
    	let div3;
    	let t12;
    	let textarea1;
    	let t13;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "You are:";
    			t1 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t2 = text("Searching for a wife");
    			br0 = element("br");
    			t3 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t4 = text("A wali searching for a suitor");
    			br1 = element("br");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Name\n                    ");
    			input2 = element("input");
    			t7 = space();
    			label3 = element("label");
    			div2 = element("div");
    			div2.textContent = "Description of yourself or the sister you are trying to marry off";
    			t9 = space();
    			textarea0 = element("textarea");
    			t10 = space();
    			label4 = element("label");
    			div3 = element("div");
    			div3.textContent = "Description of what you are looking for in a spouse";
    			t12 = space();
    			textarea1 = element("textarea");
    			t13 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(div0, "class", "youare svelte-1d9tmlc");
    			add_location(div0, file$3, 40, 20, 824);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "youare");
    			input0.value = "searchingforwife";
    			add_location(input0, file$3, 41, 27, 886);
    			add_location(br0, file$3, 41, 106, 965);
    			add_location(label0, file$3, 41, 20, 879);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "youare");
    			input1.value = "wali";
    			add_location(input1, file$3, 42, 27, 1005);
    			add_location(br1, file$3, 42, 103, 1081);
    			add_location(label1, file$3, 42, 20, 998);
    			attr_dev(div1, "class", "svelte-1d9tmlc");
    			add_location(div1, file$3, 39, 16, 798);
    			attr_dev(input2, "name", "name");
    			add_location(input2, file$3, 46, 20, 1186);
    			attr_dev(label2, "class", "svelte-1d9tmlc");
    			add_location(label2, file$3, 44, 16, 1133);
    			add_location(div2, file$3, 49, 20, 1294);
    			attr_dev(textarea0, "name", "descriptionofyou");
    			attr_dev(textarea0, "placeholder", "location, religiosity, culture, vague description of looks, personality");
    			attr_dev(textarea0, "class", "svelte-1d9tmlc");
    			add_location(textarea0, file$3, 50, 20, 1391);
    			attr_dev(label3, "class", "svelte-1d9tmlc");
    			add_location(label3, file$3, 48, 16, 1266);
    			add_location(div3, file$3, 53, 24, 1626);
    			attr_dev(textarea1, "name", "descriptionofspouse");
    			attr_dev(textarea1, "placeholder", "location, religiosity, culture, vague description of looks, personality");
    			attr_dev(textarea1, "class", "svelte-1d9tmlc");
    			add_location(textarea1, file$3, 54, 24, 1713);
    			attr_dev(label4, "class", "svelte-1d9tmlc");
    			add_location(label4, file$3, 52, 16, 1594);
    			attr_dev(button, "class", "svelte-1d9tmlc");
    			add_location(button, file$3, 56, 15, 1925);

    			dispose = [
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    				listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[7]),
    				listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[8])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			append_dev(label0, t2);
    			append_dev(label0, br0);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			append_dev(label1, t4);
    			append_dev(label1, br1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, label2, anchor);
    			append_dev(label2, t6);
    			append_dev(label2, input2);
    			set_input_value(input2, /*name*/ ctx[0]);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, label3, anchor);
    			append_dev(label3, div2);
    			append_dev(label3, t9);
    			append_dev(label3, textarea0);
    			set_input_value(textarea0, /*descriptionofyou*/ ctx[1]);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, label4, anchor);
    			append_dev(label4, div3);
    			append_dev(label4, t12);
    			append_dev(label4, textarea1);
    			set_input_value(textarea1, /*descriptionofspouse*/ ctx[2]);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*name*/ 1 && input2.value !== /*name*/ ctx[0]) {
    				set_input_value(input2, /*name*/ ctx[0]);
    			}

    			if (dirty[0] & /*descriptionofyou*/ 2) {
    				set_input_value(textarea0, /*descriptionofyou*/ ctx[1]);
    			}

    			if (dirty[0] & /*descriptionofspouse*/ 4) {
    				set_input_value(textarea1, /*descriptionofspouse*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(label2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(label3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(label4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(37:1) <AjaxForm action=\\\"/make-profile/submit\\\" values={{name,descriptionofyou,descriptionofspouse}} on:success={handleSuccess} on:error={handleError} customErrorDetection={e=>{      return e.data==='A weird error was thrown'  }}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current;

    	const ajaxform = new AjaxForm({
    			props: {
    				action: "/make-profile/submit",
    				values: {
    					name: /*name*/ ctx[0],
    					descriptionofyou: /*descriptionofyou*/ ctx[1],
    					descriptionofspouse: /*descriptionofspouse*/ ctx[2]
    				},
    				customErrorDetection: func,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	ajaxform.$on("success", /*handleSuccess*/ ctx[3]);
    	ajaxform.$on("error", /*handleError*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(ajaxform.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(ajaxform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ajaxform_changes = {};

    			if (dirty[0] & /*name, descriptionofyou, descriptionofspouse*/ 7) ajaxform_changes.values = {
    				name: /*name*/ ctx[0],
    				descriptionofyou: /*descriptionofyou*/ ctx[1],
    				descriptionofspouse: /*descriptionofspouse*/ ctx[2]
    			};

    			if (dirty[0] & /*$$scope, descriptionofspouse, descriptionofyou, name*/ 519) {
    				ajaxform_changes.$$scope = { dirty, ctx };
    			}

    			ajaxform.$set(ajaxform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ajaxform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ajaxform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ajaxform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = e => {
    	return e.data === "A weird error was thrown";
    };

    function instance$3($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	function handleSuccess() {
    		dispatch("submitSuccess");
    	}

    	function handleError() {
    		dispatch("submitError");
    	}

    	let name = "";
    	let descriptionofyou = "";
    	let descriptionofspouse = "";

    	function input2_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function textarea0_input_handler() {
    		descriptionofyou = this.value;
    		$$invalidate(1, descriptionofyou);
    	}

    	function textarea1_input_handler() {
    		descriptionofspouse = this.value;
    		$$invalidate(2, descriptionofspouse);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("descriptionofyou" in $$props) $$invalidate(1, descriptionofyou = $$props.descriptionofyou);
    		if ("descriptionofspouse" in $$props) $$invalidate(2, descriptionofspouse = $$props.descriptionofspouse);
    	};

    	return [
    		name,
    		descriptionofyou,
    		descriptionofspouse,
    		handleSuccess,
    		handleError,
    		dispatch,
    		input2_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler
    	];
    }

    class MakeAProfileForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MakeAProfileForm",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Index/Index.svelte generated by Svelte v3.16.4 */
    const file$4 = "src/pages/Index/Index.svelte";

    // (83:4) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let t1;
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Make a profile";
    			t1 = space();
    			div = element("div");
    			div.textContent = "So that others can search for you!";
    			add_location(button, file$4, 86, 8, 2547);
    			add_location(div, file$4, 87, 8, 2629);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(83:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if makeAProfileClicked}
    function create_if_block$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*loggedIn*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(47:4) {#if makeAProfileClicked}",
    		ctx
    	});

    	return block;
    }

    // (59:8) {:else}
    function create_else_block_1(ctx) {
    	let current;

    	const loginorregister = new LoginOrRegister({
    			props: {
    				loginUrl: "/login/submit",
    				emailCheckUrl: "/emailcheck",
    				registerUrl: "/register/submit",
    				loginErrors: [func$1, func_1, func_2],
    				registerErrors: [func_3],
    				confirmPasswordErrors: [func_4]
    			},
    			$$inline: true
    		});

    	loginorregister.$on("login", function () {
    		/*login_handler*/ ctx[8].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(loginorregister.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loginorregister, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loginorregister.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loginorregister.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loginorregister, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(59:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#if loggedIn}
    function create_if_block_1$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*profileSubmitted*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(48:8) {#if loggedIn}",
    		ctx
    	});

    	return block;
    }

    // (52:12) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const makeaprofileform = new MakeAProfileForm({ $$inline: true });

    	makeaprofileform.$on("submitSuccess", function () {
    		/*submitSuccess_handler*/ ctx[7].apply(this, arguments);
    	});

    	makeaprofileform.$on("submitError", submitError_handler);

    	const block = {
    		c: function create() {
    			create_component(makeaprofileform.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(makeaprofileform, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(makeaprofileform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(makeaprofileform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(makeaprofileform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(52:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:12) {#if profileSubmitted}
    function create_if_block_2$1(ctx) {
    	let t0;
    	let a;

    	const block = {
    		c: function create() {
    			t0 = text("Thank you for submitting!\n                ");
    			a = element("a");
    			a.textContent = "See all profiles";
    			attr_dev(a, "href", "/profiles");
    			add_location(a, file$4, 50, 16, 1417);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(49:12) {#if profileSubmitted}",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Frame on:loggedIn={()=>{     loggedIn = true; }}>
    function create_default_slot$1(ctx) {
    	let form;
    	let div0;
    	let label0;
    	let t1;
    	let select0;
    	let option0;
    	let option1;
    	let t4;
    	let label1;
    	let t6;
    	let select1;
    	let option2;
    	let option3;
    	let t9;
    	let div1;
    	let button;
    	let t11;
    	let div2;
    	let t13;
    	let div3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$2, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*makeAProfileClicked*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "I am a";
    			t1 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Man";
    			option1 = element("option");
    			option1.textContent = "Wali";
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "looking for a";
    			t6 = space();
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "Man";
    			option3 = element("option");
    			option3.textContent = "Wali";
    			t9 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Search!";
    			t11 = space();
    			div2 = element("div");
    			div2.textContent = "-- Or --";
    			t13 = space();
    			div3 = element("div");
    			if_block.c();
    			attr_dev(label0, "for", "i-am");
    			add_location(label0, file$4, 29, 8, 676);
    			option0.__value = "Man";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 31, 12, 777);
    			option1.__value = "Wali";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 32, 12, 822);
    			attr_dev(select0, "id", "i-am");
    			attr_dev(select0, "name", "i-am");
    			if (/*iam*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[5].call(select0));
    			add_location(select0, file$4, 30, 8, 717);
    			attr_dev(label1, "for", "looking-for");
    			attr_dev(label1, "name", "looking-for");
    			add_location(label1, file$4, 34, 8, 884);
    			option2.__value = "Man";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 36, 12, 1021);
    			option3.__value = "Wali";
    			option3.value = option3.__value;
    			add_location(option3, file$4, 37, 12, 1066);
    			attr_dev(select1, "id", "looking-for");
    			if (/*lookingFor*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[6].call(select1));
    			add_location(select1, file$4, 35, 8, 959);
    			attr_dev(div0, "class", "i-am");
    			add_location(div0, file$4, 28, 4, 649);
    			add_location(button, file$4, 41, 8, 1163);
    			attr_dev(div1, "class", "search");
    			add_location(div1, file$4, 40, 4, 1134);
    			attr_dev(form, "action", "/profiles");
    			add_location(form, file$4, 27, 0, 618);
    			attr_dev(div2, "class", "or");
    			add_location(div2, file$4, 44, 0, 1211);
    			attr_dev(div3, "class", "make-a-profile svelte-pemkxd");
    			add_location(div3, file$4, 45, 0, 1242);

    			dispose = [
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[5]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[6])
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			select_option(select0, /*iam*/ ctx[0]);
    			append_dev(div0, t4);
    			append_dev(div0, label1);
    			append_dev(div0, t6);
    			append_dev(div0, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			select_option(select1, /*lookingFor*/ ctx[1]);
    			append_dev(form, t9);
    			append_dev(form, div1);
    			append_dev(div1, button);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div3, anchor);
    			if_blocks[current_block_type_index].m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iam*/ 1) {
    				select_option(select0, /*iam*/ ctx[0]);
    			}

    			if (dirty[0] & /*lookingFor*/ 2) {
    				select_option(select1, /*lookingFor*/ ctx[1]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div3, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div3);
    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(25:0) <Frame on:loggedIn={()=>{     loggedIn = true; }}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	frame.$on("loggedIn", /*loggedIn_handler*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope, makeAProfileClicked, loggedIn, profileSubmitted, lookingFor, iam*/ 2079) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const submitError_handler = e => {
    	
    };

    const func$1 = e => e.data == "This user does not exist" ? e.data : false;
    const func_1 = e => e.data == "The password is incorrect" ? e.data : false;
    const func_2 = e => e.data == "A weird error was thrown" ? e.data : false;

    const func_3 = e => {
    	return e.data == "Username is taken" ? e.data : false;
    };

    const func_4 = e => {
    	return e.data == "A weird error was thrown" ? e.data : false;
    };

    function instance$4($$self, $$props, $$invalidate) {
    	let iam = "Man";
    	let lookingFor = "Wali";
    	let makeAProfileClicked = false;
    	let loggedIn = false;
    	let profileSubmitted = false;

    	function select0_change_handler() {
    		iam = select_value(this);
    		$$invalidate(0, iam);
    	}

    	function select1_change_handler() {
    		lookingFor = select_value(this);
    		($$invalidate(1, lookingFor), $$invalidate(0, iam));
    	}

    	const submitSuccess_handler = e => {
    		$$invalidate(4, profileSubmitted = true);
    	};

    	const login_handler = e => {
    		$$invalidate(3, loggedIn = true);
    	};

    	const click_handler = () => $$invalidate(2, makeAProfileClicked = true);

    	const loggedIn_handler = () => {
    		$$invalidate(3, loggedIn = true);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("iam" in $$props) $$invalidate(0, iam = $$props.iam);
    		if ("lookingFor" in $$props) $$invalidate(1, lookingFor = $$props.lookingFor);
    		if ("makeAProfileClicked" in $$props) $$invalidate(2, makeAProfileClicked = $$props.makeAProfileClicked);
    		if ("loggedIn" in $$props) $$invalidate(3, loggedIn = $$props.loggedIn);
    		if ("profileSubmitted" in $$props) $$invalidate(4, profileSubmitted = $$props.profileSubmitted);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*iam*/ 1) {
    			 {
    				$$invalidate(1, lookingFor = iam == "Man" ? "Wali" : "Man");
    			}
    		}
    	};

    	return [
    		iam,
    		lookingFor,
    		makeAProfileClicked,
    		loggedIn,
    		profileSubmitted,
    		select0_change_handler,
    		select1_change_handler,
    		submitSuccess_handler,
    		login_handler,
    		click_handler,
    		loggedIn_handler
    	];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/pages/Login/Login.svelte generated by Svelte v3.16.4 */
    const file$5 = "src/pages/Login/Login.svelte";

    // (5:0) <Frame>
    function create_default_slot$2(ctx) {
    	let form;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let t3;
    	let button;

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			t0 = text("Contact Info\n                    ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Password\n                    ");
    			input1 = element("input");
    			t3 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(input0, "name", "contact-info");
    			attr_dev(input0, "maxlength", "500");
    			add_location(input0, file$5, 9, 20, 242);
    			add_location(label0, file$5, 7, 16, 181);
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "maxlength", "500");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$5, 13, 20, 385);
    			add_location(label1, file$5, 11, 16, 328);
    			add_location(button, file$5, 16, 15, 483);
    			attr_dev(form, "action", "/login/submit");
    			attr_dev(form, "method", "post");
    			add_location(form, file$5, 5, 12, 105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			append_dev(form, t1);
    			append_dev(form, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			append_dev(form, t3);
    			append_dev(form, button);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(5:0) <Frame>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope*/ 1) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/Email/Email.svelte generated by Svelte v3.16.4 */
    const file$6 = "src/pages/Email/Email.svelte";

    // (54:0) <Frame>
    function create_default_slot$3(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let input;
    	let br0;
    	let t2;
    	let button;
    	let br1;
    	let t4;
    	let span;
    	let t5;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Email-verification System in Node.js";
    			t1 = space();
    			input = element("input");
    			br0 = element("br");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Send Email";
    			br1 = element("br");
    			t4 = space();
    			span = element("span");
    			t5 = text(/*message*/ ctx[1]);
    			attr_dev(h1, "class", "svelte-8ske1z");
    			add_location(h1, file$6, 55, 0, 845);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "to");
    			attr_dev(input, "placeholder", "Enter E-mail which you want to verify");
    			attr_dev(input, "class", "svelte-8ske1z");
    			add_location(input, file$6, 56, 0, 891);
    			add_location(br0, file$6, 56, 95, 986);
    			attr_dev(button, "id", "send_email");
    			attr_dev(button, "class", "svelte-8ske1z");
    			add_location(button, file$6, 57, 0, 991);
    			add_location(br1, file$6, 57, 65, 1056);
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-8ske1z");
    			add_location(span, file$6, 58, 0, 1061);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-8ske1z");
    			add_location(div, file$6, 54, 0, 824);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    				listen_dev(button, "click", /*send_email*/ ctx[2], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*to*/ ctx[0]);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(div, br1);
    			append_dev(div, t4);
    			append_dev(div, span);
    			append_dev(span, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*to*/ 1 && input.value !== /*to*/ ctx[0]) {
    				set_input_value(input, /*to*/ ctx[0]);
    			}

    			if (dirty[0] & /*message*/ 2) set_data_dev(t5, /*message*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(54:0) <Frame>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope, message, to*/ 19) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let to = "", message = "";

    	function send_email() {
    		axios$1.get("/send", { params: { to } }).then(function (response) {
    			if (response.data == "sent") {
    				$$invalidate(1, message = `Email is been sent at ${to} . Please check inbox !`);
    			}
    		});
    	}

    	function input_input_handler() {
    		to = this.value;
    		$$invalidate(0, to);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    	};

    	return [to, message, send_email, input_input_handler];
    }

    class Email extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Email",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/pages/MakeProfile/MakeProfile.svelte generated by Svelte v3.16.4 */
    const file$7 = "src/pages/MakeProfile/MakeProfile.svelte";

    // (22:0) <Frame>
    function create_default_slot$4(ctx) {
    	let form;
    	let div1;
    	let div0;
    	let t1;
    	let label0;
    	let input0;
    	let t2;
    	let br0;
    	let t3;
    	let label1;
    	let input1;
    	let t4;
    	let br1;
    	let t5;
    	let label2;
    	let t6;
    	let input2;
    	let t7;
    	let label3;
    	let div2;
    	let t9;
    	let textarea0;
    	let t10;
    	let label4;
    	let div3;
    	let t12;
    	let textarea1;
    	let t13;
    	let button;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "You are:";
    			t1 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t2 = text("Searching for a wife");
    			br0 = element("br");
    			t3 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t4 = text("A wali searching for a suitor");
    			br1 = element("br");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Name\n                    ");
    			input2 = element("input");
    			t7 = space();
    			label3 = element("label");
    			div2 = element("div");
    			div2.textContent = "Description of yourself or the sister you are trying to marry off";
    			t9 = space();
    			textarea0 = element("textarea");
    			t10 = space();
    			label4 = element("label");
    			div3 = element("div");
    			div3.textContent = "Description of what you are looking for in a spouse";
    			t12 = space();
    			textarea1 = element("textarea");
    			t13 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(div0, "class", "youare svelte-1d9tmlc");
    			add_location(div0, file$7, 24, 20, 346);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "youare");
    			input0.value = "searchingforwife";
    			add_location(input0, file$7, 25, 27, 408);
    			add_location(br0, file$7, 25, 106, 487);
    			add_location(label0, file$7, 25, 20, 401);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "youare");
    			input1.value = "wali";
    			add_location(input1, file$7, 26, 27, 527);
    			add_location(br1, file$7, 26, 103, 603);
    			add_location(label1, file$7, 26, 20, 520);
    			attr_dev(div1, "class", "svelte-1d9tmlc");
    			add_location(div1, file$7, 23, 16, 320);
    			attr_dev(input2, "name", "name");
    			add_location(input2, file$7, 30, 20, 708);
    			attr_dev(label2, "class", "svelte-1d9tmlc");
    			add_location(label2, file$7, 28, 16, 655);
    			add_location(div2, file$7, 33, 20, 798);
    			attr_dev(textarea0, "name", "descriptionofyou");
    			attr_dev(textarea0, "placeholder", "location, religiosity, culture, vague description of looks, personality");
    			attr_dev(textarea0, "class", "svelte-1d9tmlc");
    			add_location(textarea0, file$7, 34, 20, 895);
    			attr_dev(label3, "class", "svelte-1d9tmlc");
    			add_location(label3, file$7, 32, 16, 770);
    			add_location(div3, file$7, 37, 24, 1100);
    			attr_dev(textarea1, "name", "descriptionofspouse");
    			attr_dev(textarea1, "placeholder", "location, religiosity, culture, vague description of looks, personality");
    			attr_dev(textarea1, "class", "svelte-1d9tmlc");
    			add_location(textarea1, file$7, 38, 24, 1187);
    			attr_dev(label4, "class", "svelte-1d9tmlc");
    			add_location(label4, file$7, 36, 16, 1068);
    			attr_dev(button, "class", "svelte-1d9tmlc");
    			add_location(button, file$7, 40, 15, 1366);
    			attr_dev(form, "action", "/make-profile/submit");
    			attr_dev(form, "method", "post");
    			attr_dev(form, "class", "svelte-1d9tmlc");
    			add_location(form, file$7, 22, 1, 253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			append_dev(label0, t2);
    			append_dev(label0, br0);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			append_dev(label1, t4);
    			append_dev(label1, br1);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(label2, t6);
    			append_dev(label2, input2);
    			append_dev(form, t7);
    			append_dev(form, label3);
    			append_dev(label3, div2);
    			append_dev(label3, t9);
    			append_dev(label3, textarea0);
    			append_dev(form, t10);
    			append_dev(form, label4);
    			append_dev(label4, div3);
    			append_dev(label4, t12);
    			append_dev(label4, textarea1);
    			append_dev(form, t13);
    			append_dev(form, button);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(22:0) <Frame>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope*/ 1) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class MakeProfile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MakeProfile",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Register/Register.svelte generated by Svelte v3.16.4 */
    const file$8 = "src/pages/Register/Register.svelte";

    // (5:0) <Frame>
    function create_default_slot$5(ctx) {
    	let form;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let t3;
    	let label2;
    	let t4;
    	let input2;
    	let t5;
    	let button;

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			t0 = text("Name\n                    ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Contact Info (phone, email, twitter, whatever you want)\n                    ");
    			input1 = element("input");
    			t3 = space();
    			label2 = element("label");
    			t4 = text("Password\n                    ");
    			input2 = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "maxlength", "1000");
    			add_location(input0, file$8, 8, 20, 210);
    			add_location(label0, file$8, 6, 16, 157);
    			attr_dev(input1, "name", "contact-info");
    			attr_dev(input1, "maxlength", "500");
    			add_location(input1, file$8, 12, 20, 393);
    			add_location(label1, file$8, 10, 16, 289);
    			attr_dev(input2, "name", "password");
    			attr_dev(input2, "maxlength", "500");
    			attr_dev(input2, "type", "password");
    			add_location(input2, file$8, 16, 20, 536);
    			add_location(label2, file$8, 14, 16, 479);
    			add_location(button, file$8, 19, 15, 634);
    			attr_dev(form, "action", "/register/submit");
    			attr_dev(form, "method", "post");
    			add_location(form, file$8, 5, 1, 94);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			append_dev(form, t1);
    			append_dev(form, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			append_dev(form, t3);
    			append_dev(form, label2);
    			append_dev(label2, t4);
    			append_dev(label2, input2);
    			append_dev(form, t5);
    			append_dev(form, button);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(5:0) <Frame>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope*/ 1) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/pages/Profiles/Profiles.svelte generated by Svelte v3.16.4 */
    const file$9 = "src/pages/Profiles/Profiles.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (37:8) {#each profiles.suitorProfiles as profile}
    function create_each_block_1(ctx) {
    	let div;
    	let h20;
    	let t1;
    	let p0;
    	let t2_value = /*profile*/ ctx[1].bio + "";
    	let t2;
    	let t3;
    	let h21;
    	let t5;
    	let p1;
    	let t6_value = /*profile*/ ctx[1].looking_for + "";
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h20 = element("h2");
    			h20.textContent = "Bio";
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Looking for";
    			t5 = space();
    			p1 = element("p");
    			t6 = text(t6_value);
    			attr_dev(h20, "class", "svelte-xip93j");
    			add_location(h20, file$9, 38, 16, 652);
    			add_location(p0, file$9, 39, 16, 681);
    			attr_dev(h21, "class", "svelte-xip93j");
    			add_location(h21, file$9, 40, 16, 718);
    			add_location(p1, file$9, 41, 16, 755);
    			attr_dev(div, "class", "profile svelte-xip93j");
    			add_location(div, file$9, 37, 12, 614);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h20);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, h21);
    			append_dev(div, t5);
    			append_dev(div, p1);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*profiles*/ 1 && t2_value !== (t2_value = /*profile*/ ctx[1].bio + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*profiles*/ 1 && t6_value !== (t6_value = /*profile*/ ctx[1].looking_for + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(37:8) {#each profiles.suitorProfiles as profile}",
    		ctx
    	});

    	return block;
    }

    // (45:8) {#each profiles.waliProfiles as profile}
    function create_each_block$1(ctx) {
    	let div;
    	let h20;
    	let t1;
    	let p0;
    	let t2_value = /*profile*/ ctx[1].bio + "";
    	let t2;
    	let t3;
    	let h21;
    	let t5;
    	let p1;
    	let t6_value = /*profile*/ ctx[1].looking_for + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h20 = element("h2");
    			h20.textContent = "Bio";
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Looking for";
    			t5 = space();
    			p1 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(h20, "class", "svelte-xip93j");
    			add_location(h20, file$9, 46, 16, 918);
    			add_location(p0, file$9, 47, 16, 947);
    			attr_dev(h21, "class", "svelte-xip93j");
    			add_location(h21, file$9, 48, 16, 984);
    			add_location(p1, file$9, 49, 16, 1021);
    			attr_dev(div, "class", "profile svelte-xip93j");
    			add_location(div, file$9, 45, 12, 880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h20);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, h21);
    			append_dev(div, t5);
    			append_dev(div, p1);
    			append_dev(p1, t6);
    			append_dev(div, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*profiles*/ 1 && t2_value !== (t2_value = /*profile*/ ctx[1].bio + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*profiles*/ 1 && t6_value !== (t6_value = /*profile*/ ctx[1].looking_for + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(45:8) {#each profiles.waliProfiles as profile}",
    		ctx
    	});

    	return block;
    }

    // (35:0) <Frame>
    function create_default_slot$6(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*profiles*/ ctx[0].suitorProfiles;
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*profiles*/ ctx[0].waliProfiles;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "profiles svelte-xip93j");
    			add_location(div, file$9, 35, 4, 528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*profiles*/ 1) {
    				each_value_1 = /*profiles*/ ctx[0].suitorProfiles;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*profiles*/ 1) {
    				each_value = /*profiles*/ ctx[0].waliProfiles;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(35:0) <Frame>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current;

    	const frame = new Frame({
    			props: {
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(frame.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const frame_changes = {};

    			if (dirty[0] & /*$$scope, profiles*/ 65) {
    				frame_changes.$$scope = { dirty, ctx };
    			}

    			frame.$set(frame_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let profiles = { suitorProfiles: [], waliProfiles: [] };

    	axios$1.get("/api/profiles").then(results => {
    		console.log(results.data);
    		$$invalidate(0, profiles = results.data);
    	}).catch();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("profiles" in $$props) $$invalidate(0, profiles = $$props.profiles);
    	};

    	return [profiles];
    }

    class Profiles extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profiles",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const page = ({
        '/':Index,
        '/doit':Index,
        '/login':Login,
        '/email':Email,
        '/make-profile':MakeProfile,
        '/profiles':Profiles,
        '/register':Register
    })[window.location.pathname];

    const app = new page({
        target: document.querySelector('#app')
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
