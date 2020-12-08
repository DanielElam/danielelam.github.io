
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    /**
     * Hot module replacement for Svelte in the Wild
     *
     * @export
     * @param {object} Component Svelte component
     * @param {object} [options={ target: document.body }] Options for the Svelte component
     * @param {string} [id='hmr'] ID for the component container
     * @param {string} [eventName='app-loaded'] Name of the event that triggers replacement of previous component
     * @returns
     */
    function HMR(Component, options = { target: document.body }, id = 'hmr', eventName = 'app-loaded') {
        const oldContainer = document.getElementById(id);

        // Create the new (temporarily hidden) component container
        const appContainer = document.createElement("div");
        if (oldContainer) appContainer.style.visibility = 'hidden';
        else appContainer.setAttribute('id', id); //ssr doesn't get an event, so we set the id now

        // Attach it to the target element
        options.target.appendChild(appContainer);

        // Wait for the app to load before replacing the component
        addEventListener(eventName, replaceComponent);

        function replaceComponent() {
            if (oldContainer) oldContainer.remove();
            // Show our component and take over the ID of the old container
            appContainer.style.visibility = 'initial';
            // delete (appContainer.style.visibility)
            appContainer.setAttribute('id', id);
        }

        return new Component({
            ...options,
            target: appContainer
        });
    }

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
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
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
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
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const MATCH_PARAM = RegExp(/\:([^/()]+)/g);

    function handleScroll (element) {
      if (navigator.userAgent.includes('jsdom')) return false
      scrollAncestorsToTop(element);
      handleHash();
    }

    function handleHash () {
      if (navigator.userAgent.includes('jsdom')) return false
      const { hash } = window.location;
      if (hash) {
        const validElementIdRegex = /^[A-Za-z]+[\w\-\:\.]*$/;
        if (validElementIdRegex.test(hash.substring(1))) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView();
        }
      }
    }

    function scrollAncestorsToTop (element) {
      if (
        element &&
        element.scrollTo &&
        element.dataset.routify !== 'scroll-lock' &&
        element.dataset['routify-scroll'] !== 'lock'
      ) {
        element.style['scroll-behavior'] = 'auto';
        element.scrollTo({ top: 0, behavior: 'auto' });
        element.style['scroll-behavior'] = '';
        scrollAncestorsToTop(element.parentElement);
      }
    }

    const pathToRegex = (str, recursive) => {
      const suffix = recursive ? '' : '/?$'; //fallbacks should match recursively
      str = str.replace(/\/_fallback?$/, '(/|$)');
      str = str.replace(/\/index$/, '(/index)?'); //index files should be matched even if not present in url
      str = str.replace(MATCH_PARAM, '([^/]+)') + suffix;
      return str
    };

    const pathToParamKeys = string => {
      const paramsKeys = [];
      let matches;
      while ((matches = MATCH_PARAM.exec(string))) paramsKeys.push(matches[1]);
      return paramsKeys
    };

    const pathToRank = ({ path }) => {
      return path
        .split('/')
        .filter(Boolean)
        .map(str => (str === '_fallback' ? 'A' : str.startsWith(':') ? 'B' : 'C'))
        .join('')
    };

    let warningSuppressed = false;

    /* eslint no-console: 0 */
    function suppressWarnings () {
      if (warningSuppressed) return
      const consoleWarn = console.warn;
      console.warn = function (msg, ...msgs) {
        const ignores = [
          "was created with unknown prop 'scoped'",
          "was created with unknown prop 'scopedSync'",
        ];
        if (!ignores.find(iMsg => msg.includes(iMsg)))
          return consoleWarn(msg, ...msgs)
      };
      warningSuppressed = true;
    }

    function currentLocation () {
      const pathMatch = window.location.search.match(/__routify_path=([^&]+)/);
      const prefetchMatch = window.location.search.match(/__routify_prefetch=\d+/);
      window.routify = window.routify || {};
      window.routify.prefetched = prefetchMatch ? true : false;
      const path = pathMatch && pathMatch[1].replace(/[#?].+/, ''); // strip any thing after ? and #
      return path || window.location.pathname
    }

    window.routify = window.routify || {};

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const route = writable(null); // the actual route being rendered

    /** @type {import('svelte/store').Writable<RouteNode[]>} */
    const routes = writable([]); // all routes
    routes.subscribe(routes => (window.routify.routes = routes));

    let rootContext = writable({ component: { params: {} } });

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const urlRoute = writable(null);  // the route matching the url

    /** @type {import('svelte/store').Writable<String>} */
    const basepath = (() => {
        const { set, subscribe } = writable("");

        return {
            subscribe,
            set(value) {
                if (value.match(/^[/(]/))
                    set(value);
                else console.warn('Basepaths must start with / or (');
            },
            update() { console.warn('Use assignment or set to update basepaths.'); }
        }
    })();

    const location$1 = derived( // the part of the url matching the basepath
        [basepath, urlRoute],
        ([$basepath, $route]) => {
            const [, base, path] = currentLocation().match(`^(${$basepath})(${$route.regex})`) || [];
            return { base, path }
        }
    );

    const prefetchPath = writable("");

    function onAppLoaded({ path, metatags }) {
        metatags.update();
        const prefetchMatch = window.location.search.match(/__routify_prefetch=(\d+)/);
        const prefetchId = prefetchMatch && prefetchMatch[1];

        dispatchEvent(new CustomEvent('app-loaded'));
        parent.postMessage({
            msg: 'app-loaded',
            prefetched: window.routify.prefetched,
            path,
            prefetchId
        }, "*");
        window['routify'].appLoaded = true;
    }

    var defaultConfig = {
        queryHandler: {
            parse: search => fromEntries(new URLSearchParams(search)),
            stringify: params => '?' + (new URLSearchParams(params)).toString()
        }
    };


    function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj
        }, {})
    }

    /**
     * @param {string} url 
     * @return {ClientNode}
     */
    function urlToRoute(url) {
        /** @type {RouteNode[]} */
        const routes$1 = get_store_value(routes);
        const basepath$1 = get_store_value(basepath);
        const route = routes$1.find(route => url.match(`^${basepath$1}${route.regex}`));
        if (!route)
            throw new Error(
                `Route could not be found.`
            )

        const [, base] = url.match(`^(${basepath$1})${route.regex}`);
        const path = url.slice(base.length);

        if (defaultConfig.queryHandler)
            route.params = defaultConfig.queryHandler.parse(window.location.search);

        if (route.paramKeys) {
            const layouts = layoutByPos(route.layouts);
            const fragments = path.split('/').filter(Boolean);
            const routeProps = getRouteProps(route.path);

            routeProps.forEach((prop, i) => {
                if (prop) {
                    route.params[prop] = fragments[i];
                    if (layouts[i]) layouts[i].param = { [prop]: fragments[i] };
                    else route.param = { [prop]: fragments[i] };
                }
            });
        }

        route.leftover = url.replace(new RegExp(base + route.regex), '');

        return route
    }


    /**
     * @param {array} layouts
     */
    function layoutByPos(layouts) {
        const arr = [];
        layouts.forEach(layout => {
            arr[layout.path.split('/').filter(Boolean).length - 1] = layout;
        });
        return arr
    }


    /**
     * @param {string} url
     */
    function getRouteProps(url) {
        return url
            .split('/')
            .filter(Boolean)
            .map(f => f.match(/\:(.+)/))
            .map(f => f && f[1])
    }

    /* node_modules\@sveltech\routify\runtime\Prefetcher.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1 } = globals;
    const file = "node_modules\\@sveltech\\routify\\runtime\\Prefetcher.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (93:2) {#each $actives as prefetch (prefetch.options.prefetch)}
    function create_each_block(key_1, ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "title", "routify prefetcher");
    			add_location(iframe, file, 93, 4, 2549);
    			this.first = iframe;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$actives*/ 1 && iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:2) {#each $actives as prefetch (prefetch.options.prefetch)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$actives*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*prefetch*/ ctx[1].options.prefetch;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "__routify_iframes");
    			set_style(div, "display", "none");
    			add_location(div, file, 91, 0, 2435);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$actives*/ 1) {
    				const each_value = /*$actives*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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

    const iframeNum = 2;

    const defaults = {
    	validFor: 60,
    	timeout: 5000,
    	gracePeriod: 1000
    };

    /** stores and subscriptions */
    const queue = writable([]);

    const actives = derived(queue, q => q.slice(0, iframeNum));

    actives.subscribe(actives => actives.forEach(({ options }) => {
    	setTimeout(() => removeFromQueue(options.prefetch), options.timeout);
    }));

    function prefetch(path, options = {}) {
    	prefetch.id = prefetch.id || 1;

    	path = !path.href
    	? path
    	: path.href.replace(/^(?:\/\/|[^/]+)*\//, "/");

    	//replace first ? since were mixing user queries with routify queries
    	path = path.replace("?", "&");

    	options = { ...defaults, ...options, path };
    	options.prefetch = prefetch.id++;

    	//don't prefetch within prefetch or SSR
    	if (window.routify.prefetched || navigator.userAgent.match("jsdom")) return false;

    	// add to queue
    	queue.update(q => {
    		if (!q.some(e => e.options.path === path)) q.push({
    			url: `/__app.html?${optionsToQuery(options)}`,
    			options
    		});

    		return q;
    	});
    }

    /**
     * convert options to query string
     * {a:1,b:2} becomes __routify_a=1&routify_b=2
     * @param {defaults & {path: string, prefetch: number}} options
     */
    function optionsToQuery(options) {
    	return Object.entries(options).map(([key, val]) => `__routify_${key}=${val}`).join("&");
    }

    /**
     * @param {number|MessageEvent} idOrEvent
     */
    function removeFromQueue(idOrEvent) {
    	const id = idOrEvent.data ? idOrEvent.data.prefetchId : idOrEvent;
    	if (!id) return null;
    	const entry = get_store_value(queue).find(entry => entry && entry.options.prefetch == id);

    	// removeFromQueue is called by both eventListener and timeout,
    	// but we can only remove the item once
    	if (entry) {
    		const { gracePeriod } = entry.options;
    		const gracePromise = new Promise(resolve => setTimeout(resolve, gracePeriod));

    		const idlePromise = new Promise(resolve => {
    				window.requestIdleCallback
    				? window.requestIdleCallback(resolve)
    				: setTimeout(resolve, gracePeriod + 1000);
    			});

    		Promise.all([gracePromise, idlePromise]).then(() => {
    			queue.update(q => q.filter(q => q.options.prefetch != id));
    		});
    	}
    }

    // Listen to message from child window
    addEventListener("message", removeFromQueue, false);

    function instance($$self, $$props, $$invalidate) {
    	let $actives;
    	validate_store(actives, "actives");
    	component_subscribe($$self, actives, $$value => $$invalidate(0, $actives = $$value));
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prefetcher> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Prefetcher", $$slots, []);

    	$$self.$capture_state = () => ({
    		writable,
    		derived,
    		get: get_store_value,
    		iframeNum,
    		defaults,
    		queue,
    		actives,
    		prefetch,
    		optionsToQuery,
    		removeFromQueue,
    		$actives
    	});

    	return [$actives];
    }

    class Prefetcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prefetcher",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /// <reference path="../typedef.js" />

    /** @ts-check */
    /**
     * @typedef {Object} RoutifyContext
     * @prop {ClientNode} component
     * @prop {ClientNode} layout
     * @prop {any} componentFile 
     * 
     *  @returns {import('svelte/store').Readable<RoutifyContext>} */
    function getRoutifyContext() {
      return getContext('routify') || rootContext
    }

    /**
     * @callback AfterPageLoadHelper
     * @param {function} callback
     * 
     * @typedef {import('svelte/store').Readable<AfterPageLoadHelper> & {_hooks:Array<function>}} AfterPageLoadHelperStore
     * @type {AfterPageLoadHelperStore}
     */
    const afterPageLoad = {
      _hooks: [],
      subscribe: hookHandler
    };

    /** 
     * @callback BeforeUrlChangeHelper
     * @param {function} callback
     *
     * @typedef {import('svelte/store').Readable<BeforeUrlChangeHelper> & {_hooks:Array<function>}} BeforeUrlChangeHelperStore
     * @type {BeforeUrlChangeHelperStore}
     **/
    const beforeUrlChange = {
      _hooks: [],
      subscribe: hookHandler
    };

    function hookHandler(listener) {
      const hooks = this._hooks;
      const index = hooks.length;
      listener(callback => { hooks[index] = callback; });
      return () => delete hooks[index]
    }

    /**
     * @callback UrlHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @return {String}
     *
     * @typedef {import('svelte/store').Readable<UrlHelper>} UrlHelperStore
     * @type {UrlHelperStore} 
     * */
    const url = {
      subscribe(listener) {
        const ctx = getRoutifyContext();
        return derived(
          [ctx, route, routes, location$1],
          args => makeUrlHelper(...args)
        ).subscribe(
          listener
        )
      }
    };

    /** 
     * @param {{component: ClientNode}} $ctx 
     * @param {RouteNode} $oldRoute 
     * @param {RouteNode[]} $routes 
     * @param {{base: string, path: string}} $location
     * @returns {UrlHelper}
     */
    function makeUrlHelper($ctx, $oldRoute, $routes, $location) {
      return function url(path, params, options) {
        const { component } = $ctx;
        path = path || './';

        const strict = options && options.strict !== false;
        if (!strict) path = path.replace(/index$/, '');

        if (path.match(/^\.\.?\//)) {
          //RELATIVE PATH
          let [, breadcrumbs, relativePath] = path.match(/^([\.\/]+)(.*)/);
          let dir = component.path.replace(/\/$/, '');
          const traverse = breadcrumbs.match(/\.\.\//g) || [];
          traverse.forEach(() => dir = dir.replace(/\/[^\/]+\/?$/, ''));
          path = `${dir}/${relativePath}`.replace(/\/$/, '');

        } else if (path.match(/^\//)) ; else {
          // NAMED PATH
          const matchingRoute = $routes.find(route => route.meta.name === path);
          if (matchingRoute) path = matchingRoute.shortPath;
        }

        /** @type {Object<string, *>} Parameters */
        const allParams = Object.assign({}, $oldRoute.params, component.params, params);
        let pathWithParams = path;
        for (const [key, value] of Object.entries(allParams)) {
          pathWithParams = pathWithParams.replace(`:${key}`, value);
        }

        const fullPath = $location.base + pathWithParams + _getQueryString(path, params);
        return fullPath.replace(/\?$/, '')
      }
    }

    /**
     * 
     * @param {string} path 
     * @param {object} params 
     */
    function _getQueryString(path, params) {
      if (!defaultConfig.queryHandler) return ""
      const pathParamKeys = pathToParamKeys(path);
      const queryParams = {};
      if (params) Object.entries(params).forEach(([key, value]) => {
        if (!pathParamKeys.includes(key))
          queryParams[key] = value;
      });
      return defaultConfig.queryHandler.stringify(queryParams)
    }

    /**
     * @callback IsActiveHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @returns {Boolean}
     * 
     * @typedef {import('svelte/store').Readable<IsActiveHelper>} IsActiveHelperStore
     * @type {IsActiveHelperStore} 
     * */
    const isActive = {
      subscribe(run) {
        return derived(
          [url, route],
          ([url, route]) => function isActive(path = "", params = {}, { strict } = { strict: true }) {
            path = url(path, null, { strict });
            const currentPath = url(route.path, null, { strict });
            const re = new RegExp('^' + path + '($|/)');
            return !!currentPath.match(re)
          }
        ).subscribe(run)
      },
    };



    const _metatags = {
      props: {},
      templates: {},
      services: {
        plain: { propField: 'name', valueField: 'content' },
        twitter: { propField: 'name', valueField: 'content' },
        og: { propField: 'property', valueField: 'content' },
      },
      plugins: [
        {
          name: 'applyTemplate',
          condition: () => true,
          action: (prop, value) => {
            const template = _metatags.getLongest(_metatags.templates, prop) || (x => x);
            return [prop, template(value)]
          }
        },
        {
          name: 'createMeta',
          condition: () => true,
          action(prop, value) {
            _metatags.writeMeta(prop, value);
          }
        },
        {
          name: 'createOG',
          condition: prop => !prop.match(':'),
          action(prop, value) {
            _metatags.writeMeta(`og:${prop}`, value);
          }
        },
        {
          name: 'createTitle',
          condition: prop => prop === 'title',
          action(prop, value) {
            document.title = value;
          }
        }
      ],
      getLongest(repo, name) {
        const providers = repo[name];
        if (providers) {
          const currentPath = get_store_value(route).path;
          const allPaths = Object.keys(repo[name]);
          const matchingPaths = allPaths.filter(path => currentPath.includes(path));

          const longestKey = matchingPaths.sort((a, b) => b.length - a.length)[0];

          return providers[longestKey]
        }
      },
      writeMeta(prop, value) {
        const head = document.getElementsByTagName('head')[0];
        const match = prop.match(/(.+)\:/);
        const serviceName = match && match[1] || 'plain';
        const { propField, valueField } = metatags.services[serviceName] || metatags.services.plain;
        const oldElement = document.querySelector(`meta[${propField}='${prop}']`);
        if (oldElement) oldElement.remove();

        const newElement = document.createElement('meta');
        newElement.setAttribute(propField, prop);
        newElement.setAttribute(valueField, value);
        newElement.setAttribute('data-origin', 'routify');
        head.appendChild(newElement);
      },
      set(prop, value) {
        _metatags.plugins.forEach(plugin => {
          if (plugin.condition(prop, value))
            [prop, value] = plugin.action(prop, value) || [prop, value];
        });
      },
      clear() {
        const oldElement = document.querySelector(`meta`);
        if (oldElement) oldElement.remove();
      },
      template(name, fn) {
        const origin = _metatags.getOrigin();
        _metatags.templates[name] = _metatags.templates[name] || {};
        _metatags.templates[name][origin] = fn;
      },
      update() {
        Object.keys(_metatags.props).forEach((prop) => {
          let value = (_metatags.getLongest(_metatags.props, prop));
          _metatags.plugins.forEach(plugin => {
            if (plugin.condition(prop, value)) {
              [prop, value] = plugin.action(prop, value) || [prop, value];

            }
          });
        });
      },
      batchedUpdate() {
        if (!_metatags._pendingUpdate) {
          _metatags._pendingUpdate = true;
          setTimeout(() => {
            _metatags._pendingUpdate = false;
            this.update();
          });
        }
      },
      _updateQueued: false,
      getOrigin() {
        const routifyCtx = getRoutifyContext();
        return routifyCtx && get_store_value(routifyCtx).path || '/'
      },
      _pendingUpdate: false
    };


    /**
     * metatags
     * @prop {Object.<string, string>}
     */
    const metatags = new Proxy(_metatags, {
      set(target, name, value, receiver) {
        const { props, getOrigin } = target;

        if (Reflect.has(target, name))
          Reflect.set(target, name, value, receiver);
        else {
          props[name] = props[name] || {};
          props[name][getOrigin()] = value;
        }

        if (window['routify'].appLoaded)
          target.batchedUpdate();
        return true
      }
    });

    const isChangingPage = (function () {
      const store = writable(false);
      beforeUrlChange.subscribe(fn => fn(event => {
        store.set(true);
        return true
      }));
      
      afterPageLoad.subscribe(fn => fn(event => store.set(false)));

      return store
    })();

    /* node_modules\@sveltech\routify\runtime\Route.svelte generated by Svelte v3.24.0 */
    const file$1 = "node_modules\\@sveltech\\routify\\runtime\\Route.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i].component;
    	child_ctx[21] = list[i].componentFile;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i].component;
    	child_ctx[21] = list[i].componentFile;
    	return child_ctx;
    }

    // (122:0) {#if $context}
    function create_if_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$context*/ ctx[6].component.isLayout === false) return 0;
    		if (/*remainingLayouts*/ ctx[5].length) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(122:0) {#if $context}",
    		ctx
    	});

    	return block;
    }

    // (134:36) 
    function create_if_block_3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*component*/ ctx[20].path;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout, remainingLayouts, decorator, Decorator, scopeToChild*/ 201326711) {
    				const each_value_1 = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(134:36) ",
    		ctx
    	});

    	return block;
    }

    // (123:2) {#if $context.component.isLayout === false}
    function create_if_block_2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*component*/ ctx[20].path;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout*/ 85) {
    				const each_value = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(123:2) {#if $context.component.isLayout === false}",
    		ctx
    	});

    	return block;
    }

    // (136:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>
    function create_default_slot(ctx) {
    	let route_1;
    	let t;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: [.../*remainingLayouts*/ ctx[5]],
    				Decorator: typeof /*decorator*/ ctx[27] !== "undefined"
    				? /*decorator*/ ctx[27]
    				: /*Decorator*/ ctx[1],
    				childOfDecorator: /*layout*/ ctx[4].isDecorator,
    				scoped: {
    					.../*scoped*/ ctx[0],
    					.../*scopeToChild*/ ctx[26]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*remainingLayouts*/ 32) route_1_changes.layouts = [.../*remainingLayouts*/ ctx[5]];

    			if (dirty & /*decorator, Decorator*/ 134217730) route_1_changes.Decorator = typeof /*decorator*/ ctx[27] !== "undefined"
    			? /*decorator*/ ctx[27]
    			: /*Decorator*/ ctx[1];

    			if (dirty & /*layout*/ 16) route_1_changes.childOfDecorator = /*layout*/ ctx[4].isDecorator;

    			if (dirty & /*scoped, scopeToChild*/ 67108865) route_1_changes.scoped = {
    				.../*scoped*/ ctx[0],
    				.../*scopeToChild*/ ctx[26]
    			};

    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(136:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>",
    		ctx
    	});

    	return block;
    }

    // (135:4) {#each [$context] as { component, componentFile }
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[2] },
    		/*layout*/ ctx[4].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[21];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: {
    				default: [
    					create_default_slot,
    					({ scoped: scopeToChild, decorator }) => ({ 26: scopeToChild, 27: decorator }),
    					({ scoped: scopeToChild, decorator }) => (scopeToChild ? 67108864 : 0) | (decorator ? 134217728 : 0)
    				]
    			},
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 21)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 4 && { scopedSync: /*scopedSync*/ ctx[2] },
    					dirty & /*layout*/ 16 && get_spread_object(/*layout*/ ctx[4].param || {})
    				])
    			: {};

    			if (dirty & /*$$scope, remainingLayouts, decorator, Decorator, layout, scoped, scopeToChild*/ 469762099) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[21])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(135:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (124:4) {#each [$context] as { component, componentFile }
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[2] },
    		/*layout*/ ctx[4].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[21];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 21)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 4 && { scopedSync: /*scopedSync*/ ctx[2] },
    					dirty & /*layout*/ 16 && get_spread_object(/*layout*/ ctx[4].param || {})
    				])
    			: {};

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[21])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(124:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (154:0) {#if !parentElement}
    function create_if_block(ctx) {
    	let span;
    	let setParent_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$1, 154, 2, 4352);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(setParent_action = /*setParent*/ ctx[8].call(null, span));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(154:0) {#if !parentElement}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$context*/ ctx[6] && create_if_block_1(ctx);
    	let if_block1 = !/*parentElement*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$context*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$context*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*parentElement*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
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
    	let $route;
    	let $context;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(15, $route = $$value));
    	let { layouts = [] } = $$props;
    	let { scoped = {} } = $$props;
    	let { Decorator = null } = $$props;
    	let { childOfDecorator = false } = $$props;
    	let { isRoot = false } = $$props;
    	let scopedSync = {};
    	let layoutIsUpdated = false;
    	let isDecorator = false;

    	/** @type {HTMLElement} */
    	let parentElement;

    	/** @type {LayoutOrDecorator} */
    	let layout = null;

    	/** @type {LayoutOrDecorator} */
    	let lastLayout = null;

    	/** @type {LayoutOrDecorator[]} */
    	let remainingLayouts = [];

    	const context = writable(null);
    	validate_store(context, "context");
    	component_subscribe($$self, context, value => $$invalidate(6, $context = value));

    	/** @type {import("svelte/store").Writable<Context>} */
    	const parentContextStore = getContext("routify");

    	isDecorator = Decorator && !childOfDecorator;
    	setContext("routify", context);

    	/** @param {HTMLElement} el */
    	function setParent(el) {
    		$$invalidate(3, parentElement = el.parentElement);
    	}

    	/** @param {SvelteComponent} componentFile */
    	function onComponentLoaded(componentFile) {
    		/** @type {Context} */
    		const parentContext = get_store_value(parentContextStore);

    		$$invalidate(2, scopedSync = { ...scoped });
    		$$invalidate(14, lastLayout = layout);
    		if (remainingLayouts.length === 0) onLastComponentLoaded();

    		const ctx = {
    			layout: isDecorator ? parentContext.layout : layout,
    			component: layout,
    			route: $route,
    			componentFile,
    			child: isDecorator
    			? parentContext.child
    			: get_store_value(context) && get_store_value(context).child
    		};

    		context.set(ctx);
    		if (isRoot) rootContext.set(ctx);

    		if (parentContext && !isDecorator) parentContextStore.update(store => {
    			store.child = layout || store.child;
    			return store;
    		});
    	}

    	/**  @param {LayoutOrDecorator} layout */
    	function setComponent(layout) {
    		let PendingComponent = layout.component();
    		if (PendingComponent instanceof Promise) PendingComponent.then(onComponentLoaded); else onComponentLoaded(PendingComponent);
    	}

    	async function onLastComponentLoaded() {
    		afterPageLoad._hooks.forEach(hook => hook(layout.api));
    		await tick();
    		handleScroll(parentElement);

    		if (!window["routify"].appLoaded) {
    			const pagePath = $context.component.path;
    			const routePath = $route.path;
    			const isOnCurrentRoute = pagePath === routePath; //maybe we're getting redirected

    			// Let everyone know the last child has rendered
    			if (!window["routify"].stopAutoReady && isOnCurrentRoute) {
    				onAppLoaded({ path: pagePath, metatags });
    			}
    		}
    	}

    	const writable_props = ["layouts", "scoped", "Decorator", "childOfDecorator", "isRoot"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, []);

    	$$self.$set = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onDestroy,
    		onMount,
    		tick,
    		writable,
    		get: get_store_value,
    		metatags,
    		afterPageLoad,
    		route,
    		routes,
    		rootContext,
    		handleScroll,
    		onAppLoaded,
    		layouts,
    		scoped,
    		Decorator,
    		childOfDecorator,
    		isRoot,
    		scopedSync,
    		layoutIsUpdated,
    		isDecorator,
    		parentElement,
    		layout,
    		lastLayout,
    		remainingLayouts,
    		context,
    		parentContextStore,
    		setParent,
    		onComponentLoaded,
    		setComponent,
    		onLastComponentLoaded,
    		$route,
    		$context
    	});

    	$$self.$inject_state = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    		if ("scopedSync" in $$props) $$invalidate(2, scopedSync = $$props.scopedSync);
    		if ("layoutIsUpdated" in $$props) layoutIsUpdated = $$props.layoutIsUpdated;
    		if ("isDecorator" in $$props) $$invalidate(13, isDecorator = $$props.isDecorator);
    		if ("parentElement" in $$props) $$invalidate(3, parentElement = $$props.parentElement);
    		if ("layout" in $$props) $$invalidate(4, layout = $$props.layout);
    		if ("lastLayout" in $$props) $$invalidate(14, lastLayout = $$props.lastLayout);
    		if ("remainingLayouts" in $$props) $$invalidate(5, remainingLayouts = $$props.remainingLayouts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isDecorator, Decorator, layouts*/ 8706) {
    			 if (isDecorator) {
    				const decoratorLayout = {
    					component: () => Decorator,
    					path: `${layouts[0].path}__decorator`,
    					isDecorator: true
    				};

    				$$invalidate(9, layouts = [decoratorLayout, ...layouts]);
    			}
    		}

    		if ($$self.$$.dirty & /*layouts*/ 512) {
    			 $$invalidate(4, [layout, ...remainingLayouts] = layouts, layout, ((($$invalidate(5, remainingLayouts), $$invalidate(9, layouts)), $$invalidate(13, isDecorator)), $$invalidate(1, Decorator)));
    		}

    		if ($$self.$$.dirty & /*lastLayout, layout*/ 16400) {
    			 layoutIsUpdated = !lastLayout || lastLayout.path !== layout.path;
    		}

    		if ($$self.$$.dirty & /*layout*/ 16) {
    			 setComponent(layout);
    		}
    	};

    	return [
    		scoped,
    		Decorator,
    		scopedSync,
    		parentElement,
    		layout,
    		remainingLayouts,
    		$context,
    		context,
    		setParent,
    		layouts,
    		childOfDecorator,
    		isRoot
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			layouts: 9,
    			scoped: 0,
    			Decorator: 1,
    			childOfDecorator: 10,
    			isRoot: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get layouts() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layouts(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scoped() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoped(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Decorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Decorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childOfDecorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childOfDecorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRoot() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRoot(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function init$1(routes, callback) {
      /** @type { ClientNode | false } */
      let lastRoute = false;

      function updatePage(proxyToUrl, shallow) {
        const url = proxyToUrl || currentLocation();
        const route$1 = urlToRoute(url);
        const currentRoute = shallow && urlToRoute(currentLocation());
        const contextRoute = currentRoute || route$1;
        const layouts = [...contextRoute.layouts, route$1];
        if (lastRoute) delete lastRoute.last; //todo is a page component the right place for the previous route?
        route$1.last = lastRoute;
        lastRoute = route$1;

        //set the route in the store
        if (!proxyToUrl)
          urlRoute.set(route$1);
        route.set(route$1);

        //run callback in Router.svelte
        callback(layouts);
      }

      const destroy = createEventListeners(updatePage);

      return { updatePage, destroy }
    }

    /**
     * svelte:window events doesn't work on refresh
     * @param {Function} updatePage
     */
    function createEventListeners(updatePage) {
    ['pushState', 'replaceState'].forEach(eventName => {
        const fn = history[eventName];
        history[eventName] = async function (state = {}, title, url) {
          const { id, path, params } = get_store_value(route);
          state = { id, path, params, ...state };
          const event = new Event(eventName.toLowerCase());
          Object.assign(event, { state, title, url });

          if (await runHooksBeforeUrlChange(event)) {
            fn.apply(this, [state, title, url]);
            return dispatchEvent(event)
          }
        };
      });

      let _ignoreNextPop = false;

      const listeners = {
        click: handleClick,
        pushstate: () => updatePage(),
        replacestate: () => updatePage(),
        popstate: async event => {
          if (_ignoreNextPop)
            _ignoreNextPop = false;
          else {
            if (await runHooksBeforeUrlChange(event)) {
              updatePage();
            } else {
              _ignoreNextPop = true;
              event.preventDefault();
              history.go(1);
            }
          }
        },
      };

      Object.entries(listeners).forEach(args => addEventListener(...args));

      const unregister = () => {
        Object.entries(listeners).forEach(args => removeEventListener(...args));
      };

      return unregister
    }

    function handleClick(event) {
      const el = event.target.closest('a');
      const href = el && el.getAttribute('href');

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.button ||
        event.defaultPrevented
      )
        return
      if (!href || el.target || el.host !== location.host) return

      event.preventDefault();
      history.pushState({}, '', href);
    }

    async function runHooksBeforeUrlChange(event) {
      const route$1 = get_store_value(route);
      for (const hook of beforeUrlChange._hooks.filter(Boolean)) {
        // return false if the hook returns false
        const result = await hook(event, route$1); //todo remove route from hook. Its API Can be accessed as $page
        if (!result) return false
      }
      return true
    }

    /* node_modules\@sveltech\routify\runtime\Router.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1$1 } = globals;

    // (64:0) {#if layouts && $route !== null}
    function create_if_block$1(ctx) {
    	let route_1;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: /*layouts*/ ctx[0],
    				isRoot: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*layouts*/ 1) route_1_changes.layouts = /*layouts*/ ctx[0];
    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:0) {#if layouts && $route !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let prefetcher;
    	let current;
    	let if_block = /*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null && create_if_block$1(ctx);
    	prefetcher = new Prefetcher({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(prefetcher.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(prefetcher, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*layouts, $route*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(prefetcher.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(prefetcher.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(prefetcher, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $route;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(1, $route = $$value));
    	let { routes: routes$1 } = $$props;
    	let { config = {} } = $$props;
    	let layouts;
    	let navigator;
    	window.routify = window.routify || {};
    	window.routify.inBrowser = !window.navigator.userAgent.match("jsdom");

    	Object.entries(config).forEach(([key, value]) => {
    		defaultConfig[key] = value;
    	});

    	suppressWarnings();
    	const updatePage = (...args) => navigator && navigator.updatePage(...args);
    	setContext("routifyupdatepage", updatePage);
    	const callback = res => $$invalidate(0, layouts = res);

    	const cleanup = () => {
    		if (!navigator) return;
    		navigator.destroy();
    		navigator = null;
    	};

    	let initTimeout = null;

    	// init is async to prevent a horrible bug that completely disable reactivity
    	// in the host component -- something like the component's update function is
    	// called before its fragment is created, and since the component is then seen
    	// as already dirty, it is never scheduled for update again, and remains dirty
    	// forever... I failed to isolate the precise conditions for the bug, but the
    	// faulty update is triggered by a change in the route store, and so offseting
    	// store initialization by one tick gives the host component some time to
    	// create its fragment. The root cause it probably a bug in Svelte with deeply
    	// intertwinned store and reactivity.
    	const doInit = () => {
    		clearTimeout(initTimeout);

    		initTimeout = setTimeout(() => {
    			cleanup();
    			navigator = init$1(routes$1, callback);
    			routes.set(routes$1);
    			navigator.updatePage();
    		});
    	};

    	onDestroy(cleanup);
    	const writable_props = ["routes", "config"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onDestroy,
    		Route,
    		Prefetcher,
    		init: init$1,
    		route,
    		routesStore: routes,
    		prefetchPath,
    		suppressWarnings,
    		defaultConfig,
    		routes: routes$1,
    		config,
    		layouts,
    		navigator,
    		updatePage,
    		callback,
    		cleanup,
    		initTimeout,
    		doInit,
    		$route
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("layouts" in $$props) $$invalidate(0, layouts = $$props.layouts);
    		if ("navigator" in $$props) navigator = $$props.navigator;
    		if ("initTimeout" in $$props) initTimeout = $$props.initTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routes*/ 4) {
    			 if (routes$1) doInit();
    		}
    	};

    	return [layouts, $route, routes$1, config];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 2, config: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*routes*/ ctx[2] === undefined && !("routes" in props)) {
    			console.warn("<Router> was created without expected prop 'routes'");
    		}
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** 
     * Node payload
     * @typedef {Object} NodePayload
     * @property {RouteNode=} file current node
     * @property {RouteNode=} parent parent of the current node
     * @property {StateObject=} state state shared by every node in the walker
     * @property {Object=} scope scope inherited by descendants in the scope
     *
     * State Object
     * @typedef {Object} StateObject
     * @prop {TreePayload=} treePayload payload from the tree
     * 
     * Node walker proxy
     * @callback NodeWalkerProxy
     * @param {NodePayload} NodePayload
     */


    /**
     * Node middleware
     * @description Walks through the nodes of a tree
     * @example middleware = createNodeMiddleware(payload => {payload.file.name = 'hello'})(treePayload))
     * @param {NodeWalkerProxy} fn 
     */
    function createNodeMiddleware(fn) {

        /**    
         * NodeMiddleware payload receiver
         * @param {TreePayload} payload
         */
        const inner = async function execute(payload) {
            return await nodeMiddleware(payload.tree, fn, { state: { treePayload: payload } })
        };

        /**    
         * NodeMiddleware sync payload receiver
         * @param {TreePayload} payload
         */
        inner.sync = function executeSync(payload) {
            return nodeMiddlewareSync(payload.tree, fn, { state: { treePayload: payload } })
        };

        return inner
    }

    /**
     * Node walker
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    async function nodeMiddleware(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        await fn(payload);

        if (file.children) {
            payload.parent = file;
            await Promise.all(file.children.map(_file => nodeMiddleware(_file, fn, payload)));
        }
        return payload
    }

    /**
     * Node walker (sync version)
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    function nodeMiddlewareSync(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        fn(payload);

        if (file.children) {
            payload.parent = file;
            file.children.map(_file => nodeMiddlewareSync(_file, fn, payload));
        }
        return payload
    }


    /**
     * Clone with JSON
     * @param {T} obj 
     * @returns {T} JSON cloned object
     * @template T
     */
    function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

    const setRegex = createNodeMiddleware(({ file }) => {
        if (file.isPage || file.isFallback)
            file.regex = pathToRegex(file.path, file.isFallback);
    });
    const setParamKeys = createNodeMiddleware(({ file }) => {
        file.paramKeys = pathToParamKeys(file.path);
    });

    const setShortPath = createNodeMiddleware(({ file }) => {
        if (file.isFallback || file.isIndex)
            file.shortPath = file.path.replace(/\/[^/]+$/, '');
        else file.shortPath = file.path;
    });
    const setRank = createNodeMiddleware(({ file }) => {
        file.ranking = pathToRank(file);
    });


    // todo delete?
    const addMetaChildren = createNodeMiddleware(({ file }) => {
        const node = file;
        const metaChildren = file.meta && file.meta.children || [];
        if (metaChildren.length) {
            node.children = node.children || [];
            node.children.push(...metaChildren.map(meta => ({ isMeta: true, ...meta, meta })));
        }
    });

    const setIsIndexable = createNodeMiddleware(payload => {
        const { file } = payload;
        const { isLayout, isFallback, meta } = file;
        file.isIndexable = !isLayout && !isFallback && meta.index !== false;
        file.isNonIndexable = !file.isIndexable;
    });


    const assignRelations = createNodeMiddleware(({ file, parent }) => {
        Object.defineProperty(file, 'parent', { get: () => parent });
        Object.defineProperty(file, 'nextSibling', { get: () => _getSibling(file, 1) });
        Object.defineProperty(file, 'prevSibling', { get: () => _getSibling(file, -1) });
        Object.defineProperty(file, 'lineage', { get: () => _getLineage(parent) });
    });

    function _getLineage(node, lineage = []){
        if(node){
            lineage.unshift(node);
            _getLineage(node.parent, lineage);
        }
        return lineage
    }

    /**
     * 
     * @param {RouteNode} file 
     * @param {Number} direction 
     */
    function _getSibling(file, direction) {
        if (!file.root) {
            const siblings = file.parent.children.filter(c => c.isIndexable);
            const index = siblings.indexOf(file);
            return siblings[index + direction]
        }
    }

    const assignIndex = createNodeMiddleware(({ file, parent }) => {
        if (file.isIndex) Object.defineProperty(parent, 'index', { get: () => file });
        if (file.isLayout)
            Object.defineProperty(parent, 'layout', { get: () => file });
    });

    const assignLayout = createNodeMiddleware(({ file, scope }) => {
        Object.defineProperty(file, 'layouts', { get: () => getLayouts(file) });
        function getLayouts(file) {
            const { parent } = file;
            const layout = parent && parent.layout;
            const isReset = layout && layout.isReset;
            const layouts = (parent && !isReset && getLayouts(parent)) || [];
            if (layout) layouts.push(layout);
            return layouts
        }
    });


    const createFlatList = treePayload => {
        createNodeMiddleware(payload => {
            if (payload.file.isPage || payload.file.isFallback)
            payload.state.treePayload.routes.push(payload.file);
        }).sync(treePayload);    
        treePayload.routes.sort((c, p) => (c.ranking >= p.ranking ? -1 : 1));
    };

    const setPrototype = createNodeMiddleware(({ file }) => {
        const Prototype = file.root
            ? Root
            : file.children
                ? file.isFile ? PageDir : Dir
                : file.isReset
                    ? Reset
                    : file.isLayout
                        ? Layout
                        : file.isFallback
                            ? Fallback
                            : Page;
        Object.setPrototypeOf(file, Prototype.prototype);

        function Layout() { }
        function Dir() { }
        function Fallback() { }
        function Page() { }
        function PageDir() { }
        function Reset() { }
        function Root() { }
    });

    var miscPlugins = /*#__PURE__*/Object.freeze({
        __proto__: null,
        setRegex: setRegex,
        setParamKeys: setParamKeys,
        setShortPath: setShortPath,
        setRank: setRank,
        addMetaChildren: addMetaChildren,
        setIsIndexable: setIsIndexable,
        assignRelations: assignRelations,
        assignIndex: assignIndex,
        assignLayout: assignLayout,
        createFlatList: createFlatList,
        setPrototype: setPrototype
    });

    const assignAPI = createNodeMiddleware(({ file }) => {
        file.api = new ClientApi(file);
    });

    class ClientApi {
        constructor(file) {
            this.__file = file;
            Object.defineProperty(this, '__file', { enumerable: false });
            this.isMeta = !!file.isMeta;
            this.path = file.path;
            this.title = _prettyName(file);
            this.meta = file.meta;
        }

        get parent() { return !this.__file.root && this.__file.parent.api }
        get children() {
            return (this.__file.children || this.__file.isLayout && this.__file.parent.children || [])
                .filter(c => !c.isNonIndexable)
                .sort((a, b) => {
                    if(a.isMeta && b.isMeta) return 0
                    a = (a.meta.index || a.meta.title || a.path).toString();
                    b = (b.meta.index || b.meta.title || b.path).toString();
                    return a.localeCompare((b), undefined, { numeric: true, sensitivity: 'base' })
                })
                .map(({ api }) => api)
        }
        get next() { return _navigate(this, +1) }
        get prev() { return _navigate(this, -1) }
        preload() {
            this.__file.layouts.forEach(file => file.component());
            this.__file.component(); 
        }
    }

    function _navigate(node, direction) {
        if (!node.__file.root) {
            const siblings = node.parent.children;
            const index = siblings.indexOf(node);
            return node.parent.children[index + direction]
        }
    }


    function _prettyName(file) {
        if (typeof file.meta.title !== 'undefined') return file.meta.title
        else return (file.shortPath || file.path)
            .split('/')
            .pop()
            .replace(/-/g, ' ')
    }

    const plugins = {...miscPlugins, assignAPI};

    function buildClientTree(tree) {
      const order = [
        // pages
        "setParamKeys", //pages only
        "setRegex", //pages only
        "setShortPath", //pages only
        "setRank", //pages only
        "assignLayout", //pages only,
        // all
        "setPrototype",
        "addMetaChildren",
        "assignRelations", //all (except meta components?)
        "setIsIndexable", //all
        "assignIndex", //all
        "assignAPI", //all
        // routes
        "createFlatList"
      ];

      const payload = { tree, routes: [] };
      for (let name of order) {
        const syncFn = plugins[name].sync || plugins[name];
        syncFn(payload);
      }
      return payload
    }

    /* src\pages\_fallback.svelte generated by Svelte v3.24.0 */
    const file$2 = "src\\pages\\_fallback.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let a;
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "404";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Page not found.\n        \n        ");
    			a = element("a");
    			t3 = text("Go back");
    			attr_dev(div0, "class", "huge svelte-rik5m2");
    			add_location(div0, file$2, 18, 4, 258);
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0]("../"));
    			add_location(a, file$2, 22, 8, 403);
    			attr_dev(div1, "class", "big");
    			add_location(div1, file$2, 19, 4, 290);
    			attr_dev(div2, "class", "e404 svelte-rik5m2");
    			add_location(div2, file$2, 17, 0, 235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0]("../"))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let $url;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fallback> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Fallback", $$slots, []);
    	$$self.$capture_state = () => ({ url, $url });
    	return [$url];
    }

    class Fallback extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fallback",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\core\controls\Navbar.svelte generated by Svelte v3.24.0 */
    const file$3 = "src\\core\\controls\\Navbar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (68:0) {:else}
    function create_else_block(ctx) {
    	let nav_bar;
    	let div3;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span;
    	let t2;
    	let div0;
    	let a_href_value;
    	let t3;
    	let div2;
    	let each_value = /*urls*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav_bar = element("nav-bar");
    			div3 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "DanDev";
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "id", "siteLogo");
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "inline-flex svelte-ir6z56");
    			if (img.src !== (img_src_value = "/i/logo-64px.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$3, 71, 16, 1220);
    			attr_dev(span, "class", "ml-2 block inline-flex");
    			add_location(span, file$3, 73, 20, 1337);
    			attr_dev(div0, "class", "logo-line ml-2 w-8 h-1 border-white border-t absolute svelte-ir6z56");
    			add_location(div0, file$3, 74, 20, 1408);
    			add_location(div1, file$3, 72, 16, 1311);
    			attr_dev(a, "id", "siteTitle");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[1]("/"));
    			attr_dev(a, "class", "flex items-center h-8 svelte-ir6z56");
    			add_location(a, file$3, 70, 12, 1138);
    			attr_dev(div2, "id", "navLinks");
    			attr_dev(div2, "class", "flex ml-6 text-white uppercase font-bold svelte-ir6z56");
    			add_location(div2, file$3, 77, 12, 1534);
    			attr_dev(div3, "class", "container flex items-center mx-auto select-none");
    			add_location(div3, file$3, 69, 8, 1064);
    			set_custom_element_data(nav_bar, "class", "w-full bg-red-800 h-16 items-center flex shadow svelte-ir6z56");
    			add_location(nav_bar, file$3, 68, 4, 990);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav_bar, anchor);
    			append_dev(nav_bar, div3);
    			append_dev(div3, a);
    			append_dev(a, img);
    			append_dev(a, t0);
    			append_dev(a, div1);
    			append_dev(div1, span);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 2 && a_href_value !== (a_href_value = /*$url*/ ctx[1]("/"))) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$url, urls, $isActive*/ 14) {
    				each_value = /*urls*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav_bar);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(68:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:0) {#if kind == "small"}
    function create_if_block$2(ctx) {
    	let nav_bar;

    	const block = {
    		c: function create() {
    			nav_bar = element("nav-bar");
    			set_custom_element_data(nav_bar, "class", "w-full bg-red-500 h-24 svelte-ir6z56");
    			add_location(nav_bar, file$3, 64, 4, 921);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav_bar, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav_bar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:0) {#if kind == \\\"small\\\"}",
    		ctx
    	});

    	return block;
    }

    // (79:16) {#each urls as navBtn}
    function create_each_block$2(ctx) {
    	let div;
    	let a;
    	let t_value = /*navBtn*/ ctx[4].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "btn-nav svelte-ir6z56");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[1](/*navBtn*/ ctx[4].href));
    			toggle_class(a, "active", /*$isActive*/ ctx[2](/*navBtn*/ ctx[4].href));
    			add_location(a, file$3, 79, 38, 1680);
    			attr_dev(div, "class", "mr-6");
    			add_location(div, file$3, 79, 20, 1662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 2 && a_href_value !== (a_href_value = /*$url*/ ctx[1](/*navBtn*/ ctx[4].href))) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$isActive, urls*/ 12) {
    				toggle_class(a, "active", /*$isActive*/ ctx[2](/*navBtn*/ ctx[4].href));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(79:16) {#each urls as navBtn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*kind*/ ctx[0] == "small") return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let $url;
    	let $isActive;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(1, $url = $$value));
    	validate_store(isActive, "isActive");
    	component_subscribe($$self, isActive, $$value => $$invalidate(2, $isActive = $$value));
    	let { kind = "small" } = $$props;

    	let urls = [
    		{ name: "About", href: "/index" },
    		{ name: "Projects", href: "/projects" },
    		{ name: "Boards", href: "/boards" },
    		{ name: "Photos", href: "/photos" }
    	];

    	const writable_props = ["kind"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", $$slots, []);

    	$$self.$set = $$props => {
    		if ("kind" in $$props) $$invalidate(0, kind = $$props.kind);
    	};

    	$$self.$capture_state = () => ({
    		url,
    		isActive,
    		kind,
    		urls,
    		$url,
    		$isActive
    	});

    	$$self.$inject_state = $$props => {
    		if ("kind" in $$props) $$invalidate(0, kind = $$props.kind);
    		if ("urls" in $$props) $$invalidate(3, urls = $$props.urls);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [kind, $url, $isActive, urls];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { kind: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get kind() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\core\controls\Footer.svelte generated by Svelte v3.24.0 */

    const file$4 = "src\\core\\controls\\Footer.svelte";

    function create_fragment$5(ctx) {
    	let footer;
    	let div;
    	let p;
    	let t;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			p = element("p");
    			t = text("© 2021 Daniel Elam\n            ");
    			img = element("img");
    			attr_dev(img, "class", "inline-block");
    			attr_dev(img, "width", "18");
    			if (img.src !== (img_src_value = "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/237/flag-for-scotland_1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 23, 12, 445);
    			add_location(p, file$4, 21, 8, 398);
    			attr_dev(div, "class", "content text-center py-6 font-thin text-sm opacity-85 text-gray-200");
    			add_location(div, file$4, 20, 4, 308);
    			attr_dev(footer, "class", "footer svelte-9jrqqn");
    			add_location(footer, file$4, 19, 0, 280);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, p);
    			append_dev(p, t);
    			append_dev(p, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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

    function instance$5($$self, $$props, $$invalidate) {
    	const twemoji = window.twemoji;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	$$self.$capture_state = () => ({ twemoji });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\_layout.svelte generated by Svelte v3.24.0 */
    const file$5 = "src\\pages\\_layout.svelte";

    function create_fragment$6(ctx) {
    	let site;
    	let navbar;
    	let t0;
    	let master;
    	let t1;
    	let footer;
    	let current;
    	navbar = new Navbar({ props: { kind: "large" }, $$inline: true });
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			site = element("site");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			master = element("master");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(master, "class", "flex-grow h-full");
    			add_location(master, file$5, 52, 4, 950);
    			attr_dev(site, "class", "flex flex-col min-h-screen w-screen min-h-screen bg-transparent\n    text-foreground");
    			add_location(site, file$5, 48, 0, 815);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site, anchor);
    			mount_component(navbar, site, null);
    			append_dev(site, t0);
    			append_dev(site, master);

    			if (default_slot) {
    				default_slot.m(master, null);
    			}

    			append_dev(site, t1);
    			mount_component(footer, site, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(default_slot, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(default_slot, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site);
    			destroy_component(navbar);
    			if (default_slot) default_slot.d(detaching);
    			destroy_component(footer);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { url = "" } = $$props;
    	const writable_props = ["url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layout", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Navbar, Footer, url });

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, $$scope, $$slots];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { url: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get url() {
    		throw new Error("<Layout>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Layout>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let apiUrl =  `https://apitest.dandev.uk`;
    let graphql = async (query, variables, errorHandler) => {
        return await fetch(`${apiUrl}/graphql`, {
            method: "POST",
            headers: {
                'Content-Type': "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                query,
                variables,
            }),
        }).then((response) => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1)
                return response.json();
            throw new Error(`Expected JSON response. Status code: ${response.statusText}`);
        }).then((json) => {
            if (json.errors)
                throw new Error(`Query error: ${JSON.stringify(json)}`);
            return { result: json, error: null };
        }).catch(e => {
            console.error(`Failed to query backend API with '${e.props}'`);
            console.error(e);
            if (errorHandler)
                errorHandler(e);
            return { result: null, error: e };
        });
    };

    const getPostsQuery = (fields) => `query($slug: String, $author: Int, $posted: DateRange, $published: DateRange, $first: Int, $skip: Int) {
    index: getBlogPosts(slug: $slug, author: $author, posted: $posted, published: $published, first: $first, skip: $skip) {
        ${fields}
    }
}`;
    class Blog {
        static async getPostsIndexAsync(args) {
            return [
                {
                    title: "Where has the feeling gone?",
                    datePublished: new Date(Date.now()).toString(),
                    coverImage: "https://images.unsplash.com/photo-1531685250784-7569952593d2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
                },
                {
                    title: "Will I remember the songs?",
                    datePublished: new Date(Date.now()).toString(),
                    coverImage: "https://images.unsplash.com/photo-1531685250784-7569952593d2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
                },
                {
                    title: "The show must go on",
                    datePublished: new Date(Date.now()).toString(),
                    coverImage: "https://images.unsplash.com/photo-1531685250784-7569952593d2?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
                }
            ];
        }
        static async getPostAsync(args) {
            return await graphql(getPostsQuery(`
            title,
            excerpt,
            status,
            commentsMode,
            parentId,
            slug,
            coverImage,
            commentCount,
            authorId,
            content,
            comments {
                authorId,
                content
            }
        `), args)
                .then(res => res.result.index)
                .then(posts => posts.length > 0 && posts[0]);
        }
    }

    /* src\pages\blog\[slug].svelte generated by Svelte v3.24.0 */
    const file$6 = "src\\pages\\blog\\[slug].svelte";

    // (110:8) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[7].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$6, 110, 12, 2432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(110:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {:then post}
    function create_then_block(ctx) {
    	let h1;
    	let t0_value = /*post*/ ctx[6].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			attr_dev(h1, "class", "post-title my-4");
    			add_location(h1, file$6, 100, 12, 1967);
    			attr_dev(div0, "class", "w-full");
    			set_style(div0, "border-radius", "1rem");
    			set_style(div0, "height", "25rem");
    			set_style(div0, "max-height", "30rem");
    			set_style(div0, "background-position", "50% 50%");
    			set_style(div0, "background-repeat", "no-repeat");
    			set_style(div0, "background-size", "100%");
    			set_style(div0, "background-image", "url(" + /*post*/ ctx[6].coverImage + ")");
    			add_location(div0, file$6, 102, 5, 2031);
    			attr_dev(div1, "class", "blog-content inline");
    			attr_dev(div1, "contenteditable", "false");
    			if (/*html*/ ctx[0] === void 0) add_render_callback(() => /*div1_input_handler*/ ctx[3].call(div1));
    			add_location(div1, file$6, 105, 12, 2267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			if (/*html*/ ctx[0] !== void 0) {
    				div1.innerHTML = /*html*/ ctx[0];
    			}

    			if (!mounted) {
    				dispose = listen_dev(div1, "input", /*div1_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*html*/ 1 && /*html*/ ctx[0] !== div1.innerHTML) {
    				div1.innerHTML = /*html*/ ctx[0];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(100:8) {:then post}",
    		ctx
    	});

    	return block;
    }

    // (98:28)              <span>Loading...</span>         {:then post}
    function create_pending_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			add_location(span, file$6, 98, 12, 1910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(98:28)              <span>Loading...</span>         {:then post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let site_page;
    	let div;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 7
    	};

    	handle_promise(promise = /*postPromise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "container flex-1 mx-auto");
    			add_location(div, file$6, 96, 4, 1830);
    			set_custom_element_data(site_page, "id", "blogPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$6, 95, 0, 1781);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    function instance$7($$self, $$props, $$invalidate) {
    	const shortMonths = [
    		"Jan",
    		"Feb",
    		"Mar",
    		"Apr",
    		"May",
    		"Jun",
    		"Jul",
    		"Aug",
    		"Sep",
    		"Oct",
    		"Nov",
    		"Dec"
    	];

    	let { slug } = $$props;
    	let html;
    	let postPromise = Blog.getPostAsync({ slug });
    	postPromise.then(post => $$invalidate(0, html = post && post.content));
    	const exampleUrl = `https://images.unsplash.com/photo-1588094504753-ddf9319e6c0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80`;
    	const writable_props = ["slug"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<U5Bslugu5D> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("U5Bslugu5D", $$slots, []);

    	function div1_input_handler() {
    		html = this.innerHTML;
    		$$invalidate(0, html);
    	}

    	$$self.$set = $$props => {
    		if ("slug" in $$props) $$invalidate(2, slug = $$props.slug);
    	};

    	$$self.$capture_state = () => ({
    		Blog,
    		shortMonths,
    		slug,
    		html,
    		postPromise,
    		exampleUrl
    	});

    	$$self.$inject_state = $$props => {
    		if ("slug" in $$props) $$invalidate(2, slug = $$props.slug);
    		if ("html" in $$props) $$invalidate(0, html = $$props.html);
    		if ("postPromise" in $$props) $$invalidate(1, postPromise = $$props.postPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [html, postPromise, slug, div1_input_handler];
    }

    class U5Bslugu5D extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { slug: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "U5Bslugu5D",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*slug*/ ctx[2] === undefined && !("slug" in props)) {
    			console.warn("<U5Bslugu5D> was created without expected prop 'slug'");
    		}
    	}

    	get slug() {
    		throw new Error("<U5Bslugu5D>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slug(value) {
    		throw new Error("<U5Bslugu5D>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\blog\controls\PostList.svelte generated by Svelte v3.24.0 */
    const file$7 = "src\\blog\\controls\\PostList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (54:4) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[6].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$7, 54, 8, 1537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(54:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {:then posts}
    function create_then_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*posts*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*postsPromise, Date, shortMonths*/ 3) {
    				each_value = /*posts*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(34:4) {:then posts}",
    		ctx
    	});

    	return block;
    }

    // (35:8) {#each posts as post}
    function create_each_block$3(ctx) {
    	let blog_entry;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let h1;
    	let t1_value = /*post*/ ctx[3].title + "";
    	let t1;
    	let t2;
    	let span;
    	let t3_value = new Date(/*post*/ ctx[3].datePublished).getFullYear() + "";
    	let t3;
    	let t4;
    	let t5_value = /*shortMonths*/ ctx[0][new Date(/*post*/ ctx[3].datePublished).getMonth()] + "";
    	let t5;
    	let t6;
    	let t7_value = new Date(/*post*/ ctx[3].datePublished).getDay() + "";
    	let t7;
    	let a_href_value;
    	let t8;

    	const block = {
    		c: function create() {
    			blog_entry = element("blog-entry");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			attr_dev(img, "class", "w-20 rounded-md");
    			if (img.src !== (img_src_value = /*post*/ ctx[3].coverImage)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$7, 37, 20, 788);
    			attr_dev(h1, "class", "text-lg");
    			add_location(h1, file$7, 41, 24, 986);
    			attr_dev(span, "class", "post-date svelte-pzsf6e");
    			set_style(span, "opacity", "0.7");
    			add_location(span, file$7, 42, 24, 1049);
    			attr_dev(div, "class", "ml-4 flex flex-col justify-center");
    			add_location(div, file$7, 40, 20, 913);
    			attr_dev(a, "class", "flex p-4");
    			attr_dev(a, "href", a_href_value = "/blog/" + /*post*/ ctx[3].slug);
    			add_location(a, file$7, 36, 16, 721);
    			set_custom_element_data(blog_entry, "class", "block rounded-md svelte-pzsf6e");
    			add_location(blog_entry, file$7, 35, 12, 666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, blog_entry, anchor);
    			append_dev(blog_entry, a);
    			append_dev(a, img);
    			append_dev(a, t0);
    			append_dev(a, div);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    			append_dev(div, t2);
    			append_dev(div, span);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			append_dev(blog_entry, t8);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(blog_entry);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(35:8) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    // (32:25)           <span>Loading...</span>      {:then posts}
    function create_pending_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			add_location(span, file$7, 32, 8, 579);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(32:25)           <span>Loading...</span>      {:then posts}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let post_list;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 2,
    		error: 6
    	};

    	handle_promise(promise = /*postsPromise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			post_list = element("post-list");
    			info.block.c();
    			set_custom_element_data(post_list, "class", "block");
    			add_location(post_list, file$7, 30, 0, 517);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, post_list, anchor);
    			info.block.m(post_list, info.anchor = null);
    			info.mount = () => post_list;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[2] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(post_list);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    function instance$8($$self, $$props, $$invalidate) {
    	const shortMonths = [
    		"Jan",
    		"Feb",
    		"Mar",
    		"Apr",
    		"May",
    		"Jun",
    		"Jul",
    		"Aug",
    		"Sep",
    		"Oct",
    		"Nov",
    		"Dec"
    	];

    	let postsPromise = Blog.getPostsIndexAsync({ skip: 0, first: 3 });
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostList> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PostList", $$slots, []);
    	$$self.$capture_state = () => ({ Blog, shortMonths, postsPromise });

    	$$self.$inject_state = $$props => {
    		if ("postsPromise" in $$props) $$invalidate(1, postsPromise = $$props.postsPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shortMonths, postsPromise];
    }

    class PostList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostList",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\pages\blog\index.svelte generated by Svelte v3.24.0 */
    const file$8 = "src\\pages\\blog\\index.svelte";

    function create_fragment$9(ctx) {
    	let site_page;
    	let div;
    	let h1;
    	let t1;
    	let ul;
    	let postlist;
    	let current;
    	postlist = new PostList({ $$inline: true });

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Posts";
    			t1 = space();
    			ul = element("ul");
    			create_component(postlist.$$.fragment);
    			attr_dev(h1, "class", "text-xl mt-4");
    			add_location(h1, file$8, 18, 8, 464);
    			attr_dev(ul, "class", "mt-4");
    			add_location(ul, file$8, 20, 8, 509);
    			attr_dev(div, "class", "container flex-1 mx-auto");
    			add_location(div, file$8, 17, 4, 417);
    			set_custom_element_data(site_page, "id", "blogPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$8, 16, 0, 368);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, ul);
    			mount_component(postlist, ul, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			destroy_component(postlist);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let links = [
    		{
    			href: "mailto:dan@dandev.uk",
    			title: "Email"
    		},
    		{
    			href: "https://discord.gg/8euHrc",
    			title: "Discord"
    		},
    		{
    			href: "https://github.com/DanielElam",
    			title: "Github"
    		},
    		{
    			href: "https://keybase.io/dandev",
    			title: "Keybase"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Blog", $$slots, []);
    	$$self.$capture_state = () => ({ PostList, links });

    	$$self.$inject_state = $$props => {
    		if ("links" in $$props) links = $$props.links;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Blog$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const replyStore = writable({ show: true, postNumber: 0 });
    const boardMetadata = {
        "wp": { title: "Wallpapers", bg: "green-500" },
        "cs": { title: "Computers & Software", bg: "blue-500" },
        "asdt": { title: "Anime Shovelware Defence Tycoon", bg: "yellow-600" }
    };
    class Post {
    }
    class Goldhill {
        static async getPostsAsync(args) {
            return await graphql(`query($isOP: Boolean, $board: String, $postNumber: Int, $parent: Int) {
            threads: getBoardPosts(isOP: $isOP, board: $board, postNumber: $postNumber, parent: $parent) {
                postNumber
                subject
                name
                datePosted
                ipHash
                country
                comment
                sticky
                bumpOrder
                parentThread
                image {
                  url
                  fileName
                  fileSizeKB
                  dimensions
                }
                repliedTo
            }
        }`, args)
                .then(res => res.result.threads).then(posts => {
                posts.forEach(post => {
                    this.postsCache.set(post.postNumber, post);
                    post.openReplies = [];
                });
                return posts;
            });
        }
        static async getPostByIdAsync(postNumber) {
            let post = Goldhill.postsCache.get(postNumber);
            if (post)
                return post;
            return await Goldhill.getPostsAsync({ postNumber })
                .then(posts => (posts && posts.length > 0) && posts[0])
                .then(post => {
                this.postsCache.set(post.postNumber, post);
                return post;
            });
        }
        static async getPostAsync(args) {
            return await Goldhill.getPostsAsync(args)
                .then(posts => (posts && posts.length > 0) && posts[0])
                .then(post => {
                this.postsCache.set(post.postNumber, post);
                return post;
            });
        }
    }
    Goldhill.postsCache = new Map();
    Goldhill.tempPosts = fetch("/4ch-test.json")
        .then(r => r.json())
        .then(r => {
        let posts = [];
        for (let thread of r.threads) {
            for (let post of thread.posts) {
                if (post != thread.posts[0])
                    post.parentThread = thread.posts[0];
            }
            posts = posts.concat(thread.posts);
        }
        return posts;
    })
        .then(r => r.map(m => {
        var post = new Post();
        post.name = m.name;
        post.comment = m.com;
        post.postNumber = m.no;
        post.parentThread = m.parentThread;
        post.repliedTo = [];
        post.replies = [];
        post.openReplies = [];
        post.country = "GB-SCT";
        post.ipHash = "45KSM5S";
        post.datePosted = m.now;
        post.image = {
            url: `https://i.4cdn.org/g/${m.tim}.jpg`,
            fileName: m.filename + m.ext,
            fileSizeKB: m.fsize,
            dimensions: `${m.x}, ${m.y}`
        };
        return post;
    }));

    /* src\goldhill\controls\ReplyBox.svelte generated by Svelte v3.24.0 */
    const file$9 = "src\\goldhill\\controls\\ReplyBox.svelte";

    function create_fragment$a(ctx) {
    	let reply_box;
    	let h1;
    	let t0;
    	let t1_value = /*$replyStore*/ ctx[0].postNumber + "";
    	let t1;

    	const block = {
    		c: function create() {
    			reply_box = element("reply-box");
    			h1 = element("h1");
    			t0 = text("Reply to post #");
    			t1 = text(t1_value);
    			attr_dev(h1, "class", "text-md font-medium");
    			add_location(h1, file$9, 18, 4, 334);
    			set_custom_element_data(reply_box, "class", "block fixed p-4 svelte-16icudz");
    			add_location(reply_box, file$9, 17, 0, 293);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, reply_box, anchor);
    			append_dev(reply_box, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$replyStore*/ 1 && t1_value !== (t1_value = /*$replyStore*/ ctx[0].postNumber + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(reply_box);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $replyStore;
    	validate_store(replyStore, "replyStore");
    	component_subscribe($$self, replyStore, $$value => $$invalidate(0, $replyStore = $$value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReplyBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ReplyBox", $$slots, []);
    	$$self.$capture_state = () => ({ Goldhill, replyStore, get: get_store_value, $replyStore });
    	return [$replyStore];
    }

    class ReplyBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReplyBox",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\pages\boards\[board]\_layout.svelte generated by Svelte v3.24.0 */
    const file$a = "src\\pages\\boards\\[board]\\_layout.svelte";
    const get_default_slot_changes = dirty => ({ scoped: dirty & /*threadsPromise*/ 2 });
    const get_default_slot_context = ctx => ({ scoped: { threads: /*threads*/ ctx[9] } });

    // (44:12) {:else}
    function create_else_block_1(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Start a thread";
    			attr_dev(a, "id", "startThreadButton");
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "btn-bracket");
    			attr_dev(a, "data-toggle", "modal");
    			attr_dev(a, "data-target", "#createThreadDialog");
    			attr_dev(a, "data-backdrop", "static");
    			attr_dev(a, "data-keyboard", "false");
    			add_location(a, file$a, 44, 16, 1512);
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(44:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:12) {#if thread}
    function create_if_block_4(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Reply to thread";
    			attr_dev(a, "id", "startThreadButton");
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "btn-bracket");
    			attr_dev(a, "data-toggle", "modal");
    			attr_dev(a, "data-target", "#createThreadDialog");
    			attr_dev(a, "data-backdrop", "static");
    			attr_dev(a, "data-keyboard", "false");
    			add_location(a, file$a, 33, 16, 1124);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(33:12) {#if thread}",
    		ctx
    	});

    	return block;
    }

    // (64:16) {#if !thread}
    function create_if_block_3$1(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Archive");
    			attr_dev(a, "class", "btn-bracket");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/archive`));
    			add_location(a, file$a, 64, 20, 2272);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url, board*/ 5 && a_href_value !== (a_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/archive`))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(64:16) {#if !thread}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#if thread}
    function create_if_block_2$1(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Bottom";
    			attr_dev(a, "class", "btn-bracket");
    			attr_dev(a, "href", "#bottom");
    			add_location(a, file$a, 71, 16, 2508);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(71:16) {#if thread}",
    		ctx
    	});

    	return block;
    }

    // (74:16) {#if thread}
    function create_if_block_1$1(ctx) {
    	let a;
    	let time;

    	const block = {
    		c: function create() {
    			a = element("a");
    			time = element("time");
    			time.textContent = "42 seconds ago";
    			attr_dev(time, "title", "Last index refresh");
    			attr_dev(time, "data-utc", "1548618241000");
    			add_location(time, file$a, 78, 24, 2792);
    			attr_dev(a, "class", "btn-bracket");
    			attr_dev(a, "id", "index-last-refresh");
    			attr_dev(a, "href", "javascript:;");
    			add_location(a, file$a, 74, 20, 2628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, time);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(74:16) {#if thread}",
    		ctx
    	});

    	return block;
    }

    // (88:16) {:else}
    function create_else_block$1(ctx) {
    	let input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "search");
    			attr_dev(input, "id", "index-search");
    			attr_dev(input, "class", "field webflow-style-input");
    			attr_dev(input, "placeholder", "Search");
    			add_location(input, file$a, 88, 20, 3135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(88:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (86:16) {#if thread}
    function create_if_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("``");
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(86:16) {#if thread}",
    		ctx
    	});

    	return block;
    }

    // (100:12) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[10].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$a, 100, 16, 3552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*threadsPromise*/ 2 && t_value !== (t_value = /*error*/ ctx[10].message + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(100:12) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (98:48)                  <slot scoped={{ threads }}
    function create_then_block$2(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, threadsPromise*/ 34) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_default_slot_changes, get_default_slot_context);
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
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(98:48)                  <slot scoped={{ threads }}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script lang="ts">import { url }
    function create_pending_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <script lang=\\\"ts\\\">import { url }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let site_page;
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div3;
    	let div2;
    	let div1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let hr0;
    	let t7;
    	let span;
    	let a0;
    	let t8;
    	let a0_href_value;
    	let t9;
    	let a1;
    	let t10;
    	let a1_href_value;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let hr1;
    	let t16;
    	let promise;
    	let t17;
    	let replybox;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*thread*/ ctx[3]) return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = !/*thread*/ ctx[3] && create_if_block_3$1(ctx);
    	let if_block2 = /*thread*/ ctx[3] && create_if_block_2$1(ctx);
    	let if_block3 = /*thread*/ ctx[3] && create_if_block_1$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*thread*/ ctx[3]) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block4 = current_block_type_1(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 9,
    		error: 10,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*threadsPromise*/ ctx[1], info);
    	replybox = new ReplyBox({ $$inline: true });

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			t1 = text("/");
    			t2 = text(/*board*/ ctx[0]);
    			t3 = text("/ - ");
    			t4 = text(/*boardTitle*/ ctx[4]);
    			t5 = space();
    			if_block0.c();
    			t6 = space();
    			hr0 = element("hr");
    			t7 = space();
    			span = element("span");
    			a0 = element("a");
    			t8 = text("Index");
    			t9 = space();
    			a1 = element("a");
    			t10 = text("Catalog");
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			if (if_block2) if_block2.c();
    			t13 = space();
    			if (if_block3) if_block3.c();
    			t14 = space();
    			if_block4.c();
    			t15 = space();
    			hr1 = element("hr");
    			t16 = space();
    			info.block.c();
    			t17 = space();
    			create_component(replybox.$$.fragment);
    			attr_dev(div0, "class", "globalMessage hideMobile");
    			attr_dev(div0, "id", "globalMessage");
    			add_location(div0, file$a, 24, 12, 752);
    			attr_dev(div1, "class", "boardTitle text-2xl text-gray-200");
    			add_location(div1, file$a, 27, 20, 917);
    			attr_dev(div2, "class", "boardBanner mt-8");
    			add_location(div2, file$a, 26, 16, 866);
    			attr_dev(div3, "class", "boardHeader");
    			add_location(div3, file$a, 25, 12, 824);
    			attr_dev(hr0, "class", "opacity-25 my-1");
    			add_location(hr0, file$a, 55, 12, 1893);
    			attr_dev(a0, "class", "btn-bracket");
    			attr_dev(a0, "href", a0_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/`));
    			add_location(a0, file$a, 57, 16, 1989);
    			attr_dev(a1, "class", "btn-bracket");
    			attr_dev(a1, "href", a1_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/catalog`));
    			add_location(a1, file$a, 60, 16, 2109);
    			attr_dev(span, "class", "navLinks leading-none");
    			add_location(span, file$a, 56, 12, 1936);
    			attr_dev(hr1, "class", "opacity-25 my-1");
    			add_location(hr1, file$a, 95, 12, 3382);
    			attr_dev(div4, "class", "container flex-1 items-eft mx-auto select-none");
    			add_location(div4, file$a, 23, 8, 679);
    			attr_dev(div5, "class", "app-body boards-body");
    			add_location(div5, file$a, 22, 4, 636);
    			set_custom_element_data(site_page, "id", "boardPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$a, 21, 0, 586);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div4, t5);
    			if_block0.m(div4, null);
    			append_dev(div4, t6);
    			append_dev(div4, hr0);
    			append_dev(div4, t7);
    			append_dev(div4, span);
    			append_dev(span, a0);
    			append_dev(a0, t8);
    			append_dev(span, t9);
    			append_dev(span, a1);
    			append_dev(a1, t10);
    			append_dev(span, t11);
    			if (if_block1) if_block1.m(span, null);
    			append_dev(span, t12);
    			if (if_block2) if_block2.m(span, null);
    			append_dev(span, t13);
    			if (if_block3) if_block3.m(span, null);
    			append_dev(span, t14);
    			if_block4.m(span, null);
    			append_dev(div4, t15);
    			append_dev(div4, hr1);
    			append_dev(div4, t16);
    			info.block.m(div4, info.anchor = null);
    			info.mount = () => div4;
    			info.anchor = null;
    			append_dev(site_page, t17);
    			mount_component(replybox, site_page, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!current || dirty & /*board*/ 1) set_data_dev(t2, /*board*/ ctx[0]);

    			if (!current || dirty & /*$url, board*/ 5 && a0_href_value !== (a0_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/`))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (!current || dirty & /*$url, board*/ 5 && a1_href_value !== (a1_href_value = /*$url*/ ctx[2](`/boards/${/*board*/ ctx[0]}/catalog`))) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (!/*thread*/ ctx[3]) if_block1.p(ctx, dirty);
    			info.ctx = ctx;

    			if (dirty & /*threadsPromise*/ 2 && promise !== (promise = /*threadsPromise*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[9] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(replybox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(replybox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if_block4.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(replybox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $url;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(2, $url = $$value));
    	let { board } = $$props;
    	let thread;
    	let threadsPromise;
    	let boardTitle = boardMetadata[board].title;
    	let catalog = false;

    	function updateIndex() {
    		$$invalidate(1, threadsPromise = Goldhill.getPostsAsync({ board, isOP: true }).then(threads => threads.sort((a, b) => b.bumpOrder - a.bumpOrder)));
    	}

    	updateIndex();
    	const writable_props = ["board"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layout", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		url,
    		Goldhill,
    		boardMetadata,
    		ReplyBox,
    		board,
    		thread,
    		threadsPromise,
    		boardTitle,
    		catalog,
    		updateIndex,
    		$url
    	});

    	$$self.$inject_state = $$props => {
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("thread" in $$props) $$invalidate(3, thread = $$props.thread);
    		if ("threadsPromise" in $$props) $$invalidate(1, threadsPromise = $$props.threadsPromise);
    		if ("boardTitle" in $$props) $$invalidate(4, boardTitle = $$props.boardTitle);
    		if ("catalog" in $$props) catalog = $$props.catalog;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [board, threadsPromise, $url, thread, boardTitle, $$scope, $$slots];
    }

    class Layout$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { board: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*board*/ ctx[0] === undefined && !("board" in props)) {
    			console.warn("<Layout> was created without expected prop 'board'");
    		}
    	}

    	get board() {
    		throw new Error("<Layout>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set board(value) {
    		throw new Error("<Layout>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\boards\[board]\catalog.svelte generated by Svelte v3.24.0 */

    const file$b = "src\\pages\\boards\\[board]\\catalog.svelte";

    function create_fragment$c(ctx) {
    	let catalog_presenter;

    	const block = {
    		c: function create() {
    			catalog_presenter = element("catalog-presenter");
    			add_location(catalog_presenter, file$b, 18, 0, 208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, catalog_presenter, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(catalog_presenter);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Catalog> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Catalog", $$slots, []);
    	return [];
    }

    class Catalog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Catalog",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    var config = {
        anonName: "Anon",
        indexReplyCount: 6
    };

    /* src\goldhill\controls\PostPresenterImage.svelte generated by Svelte v3.24.0 */
    const file$c = "src\\goldhill\\controls\\PostPresenterImage.svelte";

    // (59:4) {#if post.image}
    function create_if_block$4(ctx) {
    	let div1;
    	let span;
    	let t0;
    	let t1_value = " " + "";
    	let t1;
    	let t2;
    	let a0;
    	let t3_value = /*post*/ ctx[0].image.fileName + "";
    	let t3;
    	let a0_href_value;
    	let t4;
    	let t5_value = " " + "";
    	let t5;
    	let t6;
    	let div0;
    	let t7;
    	let t8;
    	let t9;
    	let t10_value = vec2i(/*post*/ ctx[0].image.dimensions).x + "";
    	let t10;
    	let t11;
    	let t12_value = vec2i(/*post*/ ctx[0].image.dimensions).y + "";
    	let t12;
    	let t13;
    	let t14;
    	let t15_value = " " + "";
    	let t15;
    	let t16;
    	let a1;
    	let t17;
    	let a1_href_value;
    	let t18;
    	let t19_value = " " + "";
    	let t19;
    	let t20;
    	let a2;
    	let t21;
    	let a2_href_value;
    	let div1_class_value;
    	let t22;
    	let a3;
    	let img;
    	let img_class_value;
    	let img_src_value;
    	let t23;
    	let mounted;
    	let dispose;
    	let if_block = /*showFullImage*/ ctx[1] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			t0 = text("File:");
    			t1 = text(t1_value);
    			t2 = space();
    			a0 = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			div0 = element("div");
    			t7 = text("\r\n                (");
    			t8 = text(/*fileSizePretty*/ ctx[2]);
    			t9 = text(", ");
    			t10 = text(t10_value);
    			t11 = text("x");
    			t12 = text(t12_value);
    			t13 = text(")");
    			t14 = space();
    			t15 = text(t15_value);
    			t16 = space();
    			a1 = element("a");
    			t17 = text("google");
    			t18 = space();
    			t19 = text(t19_value);
    			t20 = space();
    			a2 = element("a");
    			t21 = text("yandex");
    			t22 = space();
    			a3 = element("a");
    			img = element("img");
    			t23 = space();
    			if (if_block) if_block.c();
    			attr_dev(a0, "href", a0_href_value = /*post*/ ctx[0].image.url);
    			attr_dev(a0, "class", "fileName");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$c, 64, 16, 1784);
    			attr_dev(div0, "class", "fa cursor-pointer download-button inline-block svelte-r1x7vx");
    			add_location(div0, file$c, 68, 16, 1948);
    			attr_dev(span, "class", "fileInfo");
    			add_location(span, file$c, 62, 12, 1715);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "google-search svelte-r1x7vx");
    			attr_dev(a1, "href", a1_href_value = `https://www.google.com/searchbyimage?image_url=${encodeURI(/*post*/ ctx[0].image.url)}`);
    			add_location(a1, file$c, 74, 12, 2240);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "yandex-search svelte-r1x7vx");
    			attr_dev(a2, "href", a2_href_value = `https://www.yandex.com/images/search?rpt=imageview&img_url=${encodeURI(/*post*/ ctx[0].image.url)}`);
    			add_location(a2, file$c, 81, 12, 2492);
    			attr_dev(div1, "class", div1_class_value = "fileText text-sm " + (/*post*/ ctx[0].parentThread == null ? "" : "mt-2"));
    			set_style(div1, "color", "#d8d6d9");
    			set_style(div1, "line-height", "0");
    			add_location(div1, file$c, 59, 8, 1563);

    			attr_dev(img, "class", img_class_value = "mt-2 mr-3 thumb-image " + (/*post*/ ctx[0].parentThread == null
    			? "max-h-48"
    			: "max-h-32") + " svelte-r1x7vx");

    			attr_dev(img, "href", "#");
    			if (img.src !== (img_src_value = /*post*/ ctx[0].image.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*fileSizePretty*/ ctx[2]);
    			add_location(img, file$c, 89, 12, 2826);
    			attr_dev(a3, "class", "fileThumb float-left contained mt-1");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$c, 88, 8, 2749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, a0);
    			append_dev(a0, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(span, div0);
    			append_dev(span, t7);
    			append_dev(span, t8);
    			append_dev(span, t9);
    			append_dev(span, t10);
    			append_dev(span, t11);
    			append_dev(span, t12);
    			append_dev(span, t13);
    			append_dev(div1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, t16);
    			append_dev(div1, a1);
    			append_dev(a1, t17);
    			append_dev(div1, t18);
    			append_dev(div1, t19);
    			append_dev(div1, t20);
    			append_dev(div1, a2);
    			append_dev(a2, t21);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, a3, anchor);
    			append_dev(a3, img);
    			append_dev(a3, t23);
    			if (if_block) if_block.m(a3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mousedown", /*onClickDownload*/ ctx[3], false, false, false),
    					listen_dev(img, "mousedown", onClickThumbnail, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*post*/ 1 && t3_value !== (t3_value = /*post*/ ctx[0].image.fileName + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*post*/ 1 && a0_href_value !== (a0_href_value = /*post*/ ctx[0].image.url)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*post*/ 1 && t10_value !== (t10_value = vec2i(/*post*/ ctx[0].image.dimensions).x + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*post*/ 1 && t12_value !== (t12_value = vec2i(/*post*/ ctx[0].image.dimensions).y + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*post*/ 1 && a1_href_value !== (a1_href_value = `https://www.google.com/searchbyimage?image_url=${encodeURI(/*post*/ ctx[0].image.url)}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*post*/ 1 && a2_href_value !== (a2_href_value = `https://www.yandex.com/images/search?rpt=imageview&img_url=${encodeURI(/*post*/ ctx[0].image.url)}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*post*/ 1 && div1_class_value !== (div1_class_value = "fileText text-sm " + (/*post*/ ctx[0].parentThread == null ? "" : "mt-2"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*post*/ 1 && img_class_value !== (img_class_value = "mt-2 mr-3 thumb-image " + (/*post*/ ctx[0].parentThread == null
    			? "max-h-48"
    			: "max-h-32") + " svelte-r1x7vx")) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (dirty & /*post*/ 1 && img.src !== (img_src_value = /*post*/ ctx[0].image.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (/*showFullImage*/ ctx[1]) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(a3);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(59:4) {#if post.image}",
    		ctx
    	});

    	return block;
    }

    // (96:12) {#if showFullImage}
    function create_if_block_1$2(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "full-image svelte-r1x7vx");
    			if (img.src !== (img_src_value = /*post*/ ctx[0].image.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*fileSizePretty*/ ctx[2]);
    			add_location(img, file$c, 96, 16, 3136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "mousedown", onClickThumbnail, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*post*/ 1 && img.src !== (img_src_value = /*post*/ ctx[0].image.url)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(96:12) {#if showFullImage}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let t;
    	let div;
    	let div_class_value;
    	let if_block = /*post*/ ctx[0].image && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			t = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "file break-words " + (/*post*/ ctx[0].parentThread == null ? "op" : "") + " svelte-r1x7vx");
    			add_location(div, file$c, 57, 0, 1461);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*post*/ ctx[0].image) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*post*/ 1 && div_class_value !== (div_class_value = "file break-words " + (/*post*/ ctx[0].parentThread == null ? "op" : "") + " svelte-r1x7vx")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function forceDownload(url, fileName) {
    	var xhr = new XMLHttpRequest();
    	xhr.open("GET", url, true);
    	xhr.responseType = "blob";

    	xhr.onload = function () {
    		var urlCreator = window.URL || window["webkitURL"];
    		var imageUrl = urlCreator.createObjectURL(this.response);
    		var tag = document.createElement("a");
    		tag.href = imageUrl;
    		tag.download = fileName;
    		document.body.appendChild(tag);
    		tag.click();
    		document.body.removeChild(tag);
    	};

    	xhr.send();
    }

    function onClickThumbnail(e) {
    	e.preventDefault();
    	return false;
    }

    function vec2i(str) {
    	let split = str.replace("{", "").replace("}", "").split(",");
    	return { x: split[0], y: split[1] };
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { post } = $$props;
    	let showFullImage = false;
    	let fileSizePretty = 0;

    	function onClickDownload(e) {
    		forceDownload(post.image.url, post.image.fileName);
    		e.preventDefault();
    		return false;
    	}

    	const writable_props = ["post"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPresenterImage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PostPresenterImage", $$slots, []);

    	$$self.$set = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    	};

    	$$self.$capture_state = () => ({
    		Post,
    		post,
    		showFullImage,
    		fileSizePretty,
    		forceDownload,
    		onClickThumbnail,
    		onClickDownload,
    		vec2i
    	});

    	$$self.$inject_state = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    		if ("showFullImage" in $$props) $$invalidate(1, showFullImage = $$props.showFullImage);
    		if ("fileSizePretty" in $$props) $$invalidate(2, fileSizePretty = $$props.fileSizePretty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [post, showFullImage, fileSizePretty, onClickDownload];
    }

    class PostPresenterImage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { post: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPresenterImage",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*post*/ ctx[0] === undefined && !("post" in props)) {
    			console.warn("<PostPresenterImage> was created without expected prop 'post'");
    		}
    	}

    	get post() {
    		throw new Error("<PostPresenterImage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostPresenterImage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\goldhill\controls\PostPresenterBody.svelte generated by Svelte v3.24.0 */
    const file$d = "src\\goldhill\\controls\\PostPresenterBody.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (144:8) {#if post.admin}
    function create_if_block$5(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "[ADMIN]";
    			attr_dev(span, "class", "name-admin");
    			add_location(span, file$d, 144, 12, 5069);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(144:8) {#if post.admin}",
    		ctx
    	});

    	return block;
    }

    // (187:8) {#each post.replies as reply}
    function create_each_block_1$1(ctx) {
    	let a;
    	let t0;
    	let t1_value = /*reply*/ ctx[11] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function mousedown_handler(...args) {
    		return /*mousedown_handler*/ ctx[5](/*reply*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(">>");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(a, "role", "button");
    			add_location(a, file$d, 187, 12, 6843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);

    			if (!mounted) {
    				dispose = listen_dev(a, "mousedown", mousedown_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*post*/ 1 && t1_value !== (t1_value = /*reply*/ ctx[11] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(187:8) {#each post.replies as reply}",
    		ctx
    	});

    	return block;
    }

    // (1:0)   <script lang="ts">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0)   <script lang=\\\"ts\\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }",
    		ctx
    	});

    	return block;
    }

    // (195:66)                   <PostPresenter inline={true}
    function create_then_block$3(ctx) {
    	let postpresenter;
    	let t;
    	let current;

    	postpresenter = new PostPresenter({
    			props: { inline: true, post: /*reply*/ ctx[11] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpresenter.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpresenter, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpresenter_changes = {};
    			if (dirty & /*post*/ 1) postpresenter_changes.post = /*reply*/ ctx[11];
    			postpresenter.$set(postpresenter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpresenter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpresenter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpresenter, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(195:66)                   <PostPresenter inline={true}",
    		ctx
    	});

    	return block;
    }

    // (1:0)   <script lang="ts">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }
    function create_pending_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0)   <script lang=\\\"ts\\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }",
    		ctx
    	});

    	return block;
    }

    // (194:8) {#each post.openReplies as replyId}
    function create_each_block$4(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 11,
    		blocks: [,,,]
    	};

    	handle_promise(promise = Goldhill.getPostByIdAsync(/*replyId*/ ctx[8]), info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*post*/ 1 && promise !== (promise = Goldhill.getPostByIdAsync(/*replyId*/ ctx[8])) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[11] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(194:8) {#each post.openReplies as replyId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let t0;
    	let div1;
    	let a0;
    	let t1;
    	let span0;
    	let t2_value = (/*post*/ ctx[0].subject || "") + "";
    	let t2;
    	let t3;
    	let t4_value = (/*post*/ ctx[0].subject !== undefined ? " " : "") + "";
    	let t4;
    	let t5;
    	let span4;
    	let t6;
    	let span1;
    	let t7_value = (/*post*/ ctx[0].name || config.anonName) + "";
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let span2;
    	let t10_value = /*post*/ ctx[0].ipHash + "";
    	let t10;
    	let t11;
    	let t12;
    	let img;
    	let img_title_value;
    	let img_alt_value;
    	let img_src_value;
    	let t13;
    	let span5;
    	let t14;
    	let t15;
    	let span6;
    	let a1;
    	let t16;
    	let a1_href_value;
    	let t17;
    	let a2;
    	let t18_value = /*post*/ ctx[0].postNumber.toString().padStart(4, "0") + "";
    	let t18;
    	let a2_href_value;
    	let t19;
    	let span7;
    	let t21;
    	let a3;
    	let i;
    	let t22;
    	let span8;
    	let t23;
    	let div0;
    	let div1_class_value;
    	let div1_id_value;
    	let div1_style_value;
    	let current;
    	let if_block = /*post*/ ctx[0].admin && create_if_block$5(ctx);
    	let each_value_1 = /*post*/ ctx[0].replies;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*post*/ ctx[0].openReplies;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t0 = space();
    			div1 = element("div");
    			a0 = element("a");
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			span4 = element("span");
    			if (if_block) if_block.c();
    			t6 = space();
    			span1 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			span3 = element("span");
    			t9 = text("(ID:\r\n            ");
    			span2 = element("span");
    			t10 = text(t10_value);
    			t11 = text("\r\n            )");
    			t12 = space();
    			img = element("img");
    			t13 = space();
    			span5 = element("span");
    			t14 = text(/*postDatePretty*/ ctx[1]);
    			t15 = space();
    			span6 = element("span");
    			a1 = element("a");
    			t16 = text("No.");
    			t17 = space();
    			a2 = element("a");
    			t18 = text(t18_value);
    			t19 = space();
    			span7 = element("span");
    			span7.textContent = `${` `}`;
    			t21 = space();
    			a3 = element("a");
    			i = element("i");
    			t22 = space();
    			span8 = element("span");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t23 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a0, "class", "watch-thread-link");
    			attr_dev(a0, "title", "Watch Thread");
    			add_location(a0, file$d, 137, 4, 4783);
    			attr_dev(span0, "class", "subject anim-text-flow font-bold");
    			set_style(span0, "color", "#b19993");
    			add_location(span0, file$d, 138, 4, 4841);
    			attr_dev(span1, "class", "name font-medium");
    			add_location(span1, file$d, 146, 8, 5133);
    			attr_dev(span2, "class", "ml-1 hand-painted rounded-sm text-xs");
    			set_style(span2, "padding", "0.05rem 0.15rem");
    			set_style(span2, "margin-top", "-0.05rem");
    			set_style(span2, "background-color", handPaint(/*post*/ ctx[0].ipHash));
    			add_location(span2, file$d, 152, 12, 5419);
    			attr_dev(span3, "class", "poster-id inline-flex cursor-pointer");
    			set_style(span3, "font-size", "0.76rem");
    			attr_dev(span3, "title", "This ID is unique to this poster for this thread.");
    			add_location(span3, file$d, 147, 8, 5211);
    			attr_dev(img, "class", "inline-block w-6 h-6");
    			attr_dev(img, "title", img_title_value = /*post*/ ctx[0].country ?? "Unknown");
    			attr_dev(img, "alt", img_alt_value = /*post*/ ctx[0].country);

    			if (img.src !== (img_src_value = `/i/flags/${/*post*/ ctx[0].country == null
			? "u1F3F3.png"
			: flagEmojiToFileName(isoCountryCodeToFlagEmoji(/*post*/ ctx[0].country))}`)) attr_dev(img, "src", img_src_value);

    			add_location(img, file$d, 160, 8, 5713);
    			attr_dev(span4, "class", "nameBlock");
    			add_location(span4, file$d, 142, 4, 5005);
    			attr_dev(span5, "class", "dateTime");
    			set_style(span5, "color", "#b3b3b3");
    			set_style(span5, "font-size", "0.85rem");
    			add_location(span5, file$d, 166, 4, 5992);

    			attr_dev(a1, "href", a1_href_value = /*isThreadPage*/ ctx[2]
    			? `#p${/*post*/ ctx[0].postNumber}`
    			: `/boards/${/*board*/ ctx[3]}/thread/${/*post*/ ctx[0].parentThread || /*post*/ ctx[0].postNumber}#p${/*post*/ ctx[0].postNumber}`);

    			attr_dev(a1, "title", "Link to this post");
    			add_location(a1, file$d, 170, 8, 6155);

    			attr_dev(a2, "href", a2_href_value = /*isThreadPage*/ ctx[2]
    			? `#q${/*post*/ ctx[0].postNumber}`
    			: `/boards/${/*board*/ ctx[3]}/thread/${/*post*/ ctx[0].parentThread || /*post*/ ctx[0].postNumber}#q${/*post*/ ctx[0].postNumber}`);

    			attr_dev(a2, "title", "Reply to this post");
    			add_location(a2, file$d, 175, 8, 6384);
    			attr_dev(span6, "class", "postNum desktop inline-flex");
    			add_location(span6, file$d, 169, 4, 6103);
    			add_location(span7, file$d, 181, 4, 6665);
    			attr_dev(i, "class", "fa fa-angle-down");
    			add_location(i, file$d, 183, 8, 6722);
    			attr_dev(a3, "class", "menu-button");
    			add_location(a3, file$d, 182, 4, 6689);
    			attr_dev(span8, "class", "replies");
    			add_location(span8, file$d, 185, 4, 6768);
    			attr_dev(div0, "class", "inline");
    			add_location(div0, file$d, 192, 4, 6993);
    			attr_dev(div1, "class", div1_class_value = "post-info " + (/*post*/ ctx[0].parentThread == null ? "mt-2" : ""));
    			attr_dev(div1, "id", div1_id_value = `pi${/*post*/ ctx[0].postNumber}`);
    			attr_dev(div1, "style", div1_style_value = /*post*/ ctx[0].parentThread && "margin-top: -2px;");
    			add_location(div1, file$d, 133, 0, 4619);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(div1, t1);
    			append_dev(div1, span0);
    			append_dev(span0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, span4);
    			if (if_block) if_block.m(span4, null);
    			append_dev(span4, t6);
    			append_dev(span4, span1);
    			append_dev(span1, t7);
    			append_dev(span4, t8);
    			append_dev(span4, span3);
    			append_dev(span3, t9);
    			append_dev(span3, span2);
    			append_dev(span2, t10);
    			append_dev(span3, t11);
    			append_dev(span4, t12);
    			append_dev(span4, img);
    			append_dev(div1, t13);
    			append_dev(div1, span5);
    			append_dev(span5, t14);
    			append_dev(div1, t15);
    			append_dev(div1, span6);
    			append_dev(span6, a1);
    			append_dev(a1, t16);
    			append_dev(span6, t17);
    			append_dev(span6, a2);
    			append_dev(a2, t18);
    			append_dev(div1, t19);
    			append_dev(div1, span7);
    			append_dev(div1, t21);
    			append_dev(div1, a3);
    			append_dev(a3, i);
    			append_dev(div1, t22);
    			append_dev(div1, span8);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(span8, null);
    			}

    			append_dev(div1, t23);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*post*/ 1) && t2_value !== (t2_value = (/*post*/ ctx[0].subject || "") + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*post*/ 1) && t4_value !== (t4_value = (/*post*/ ctx[0].subject !== undefined ? " " : "") + "")) set_data_dev(t4, t4_value);

    			if (/*post*/ ctx[0].admin) {
    				if (if_block) ; else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(span4, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*post*/ 1) && t7_value !== (t7_value = (/*post*/ ctx[0].name || config.anonName) + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*post*/ 1) && t10_value !== (t10_value = /*post*/ ctx[0].ipHash + "")) set_data_dev(t10, t10_value);

    			if (!current || dirty & /*post*/ 1) {
    				set_style(span2, "background-color", handPaint(/*post*/ ctx[0].ipHash));
    			}

    			if (!current || dirty & /*post*/ 1 && img_title_value !== (img_title_value = /*post*/ ctx[0].country ?? "Unknown")) {
    				attr_dev(img, "title", img_title_value);
    			}

    			if (!current || dirty & /*post*/ 1 && img_alt_value !== (img_alt_value = /*post*/ ctx[0].country)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*post*/ 1 && img.src !== (img_src_value = `/i/flags/${/*post*/ ctx[0].country == null
			? "u1F3F3.png"
			: flagEmojiToFileName(isoCountryCodeToFlagEmoji(/*post*/ ctx[0].country))}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*postDatePretty*/ 2) set_data_dev(t14, /*postDatePretty*/ ctx[1]);

    			if (!current || dirty & /*post*/ 1 && a1_href_value !== (a1_href_value = /*isThreadPage*/ ctx[2]
    			? `#p${/*post*/ ctx[0].postNumber}`
    			: `/boards/${/*board*/ ctx[3]}/thread/${/*post*/ ctx[0].parentThread || /*post*/ ctx[0].postNumber}#p${/*post*/ ctx[0].postNumber}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if ((!current || dirty & /*post*/ 1) && t18_value !== (t18_value = /*post*/ ctx[0].postNumber.toString().padStart(4, "0") + "")) set_data_dev(t18, t18_value);

    			if (!current || dirty & /*post*/ 1 && a2_href_value !== (a2_href_value = /*isThreadPage*/ ctx[2]
    			? `#q${/*post*/ ctx[0].postNumber}`
    			: `/boards/${/*board*/ ctx[3]}/thread/${/*post*/ ctx[0].parentThread || /*post*/ ctx[0].postNumber}#q${/*post*/ ctx[0].postNumber}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*toggleInlineReply, post*/ 17) {
    				each_value_1 = /*post*/ ctx[0].replies;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(span8, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*Goldhill, post*/ 1) {
    				each_value = /*post*/ ctx[0].openReplies;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*post*/ 1 && div1_class_value !== (div1_class_value = "post-info " + (/*post*/ ctx[0].parentThread == null ? "mt-2" : ""))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*post*/ 1 && div1_id_value !== (div1_id_value = `pi${/*post*/ ctx[0].postNumber}`)) {
    				attr_dev(div1, "id", div1_id_value);
    			}

    			if (!current || dirty & /*post*/ 1 && div1_style_value !== (div1_style_value = /*post*/ ctx[0].parentThread && "margin-top: -2px;")) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function humanisedTimeAgo(time) {
    	switch (typeof time) {
    		case "number":
    			break;
    		case "string":
    			time = +new Date(time);
    			break;
    		case "object":
    			if (time.constructor === Date) time = time.getTime();
    			break;
    		default:
    			time = +new Date();
    	}

    	var time_formats = [
    		[60, "seconds", 1],
    		[120, "1 minute ago", "1 minute from now"],
    		[3600, "minutes", 60],
    		[7200, "1 hour ago", "1 hour from now"],
    		[86400, "hours", 3600],
    		[172800, "Yesterday", "Tomorrow"],
    		[604800, "days", 86400],
    		[1209600, "Last week", "Next week"],
    		[2419200, "weeks", 604800],
    		[4838400, "Last month", "Next month"],
    		[29030400, "months", 2419200],
    		[58060800, "Last year", "Next year"],
    		[2903040000, "years", 29030400],
    		[5806080000, "Last century", "Next century"],
    		[58060800000, "centuries", 2903040000]
    	];

    	var seconds = (+new Date() - time) / 1000, token = "ago", list_choice = 1;

    	if (seconds === 0) {
    		return "Just now";
    	}

    	if (seconds < 0) {
    		seconds = Math.abs(seconds);
    		token = "from now";
    		list_choice = 2;
    	}

    	var i = 0, format;

    	while (format = time_formats[i++]) if (seconds < format[0]) {
    		if (typeof format[2] == "string") return format[list_choice]; else return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
    	}

    	return time;
    }

    function toCodePoints(str) {
    	var arCP = [];

    	for (var i = 0; i < str.length; i += 1) {
    		var cP = str.codePointAt(i);
    		arCP.push(cP);

    		if (cP >= 65536) {
    			i += 1;
    		}
    	}

    	return arCP;
    }

    function isoCountryCodeToFlagEmoji(country) {
    	if (country == "GB-SCT") {
    		return String.fromCodePoint(127988, 917607, 917602, 917619, 917603, 917620, 917631);
    	}

    	return String.fromCodePoint(...[...country.toUpperCase()].map(c => c.charCodeAt() + 127397));
    }

    function flagEmojiToFileName(emoji) {
    	return `${toCodePoints(emoji).map(e => `u${e.toString(16).toUpperCase()}`).join("_")}.png`;
    }

    function hashCode(str) {
    	let hash = 0;

    	for (var i = 0; i < str.length; i++) {
    		hash = str.charCodeAt(i) + ((hash << 5) - hash);
    	}

    	return hash;
    }

    function handPaint(str) {
    	return `hsl(${hashCode(str) % 360}, 20%, 40%)`;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let { post } = $$props;
    	let isThreadPage = false;
    	let board = "cs";
    	let pd = new Date(post.datePosted); // the time of the post in local timezone
    	let postDatePretty = `${pd.getFullYear()}/${pd.getMonth()}/${pd.getDay()} ${pd.getHours().toString().padStart(2, "0")}:${pd.getMinutes().toString().padStart(2, "0")}:${pd.getSeconds().toString().padStart(2, "0")}`;
    	postDatePretty = humanisedTimeAgo(pd);

    	function toggleInlineReply(replyId) {
    		return __awaiter(this, void 0, void 0, function* () {
    			let index = post.openReplies.indexOf(replyId);
    			if (index > -1) post.openReplies.splice(index, 1); else post.openReplies.push(replyId);
    			$$invalidate(0, post);
    		});
    	}

    	const writable_props = ["post"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPresenterBody> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PostPresenterBody", $$slots, []);
    	const mousedown_handler = reply => toggleInlineReply(reply);

    	$$self.$set = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Goldhill,
    		Post,
    		PostPresenter,
    		config,
    		post,
    		isThreadPage,
    		board,
    		pd,
    		postDatePretty,
    		humanisedTimeAgo,
    		toggleInlineReply,
    		toCodePoints,
    		isoCountryCodeToFlagEmoji,
    		flagEmojiToFileName,
    		hashCode,
    		handPaint
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    		if ("isThreadPage" in $$props) $$invalidate(2, isThreadPage = $$props.isThreadPage);
    		if ("board" in $$props) $$invalidate(3, board = $$props.board);
    		if ("pd" in $$props) pd = $$props.pd;
    		if ("postDatePretty" in $$props) $$invalidate(1, postDatePretty = $$props.postDatePretty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		post,
    		postDatePretty,
    		isThreadPage,
    		board,
    		toggleInlineReply,
    		mousedown_handler
    	];
    }

    class PostPresenterBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { post: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPresenterBody",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*post*/ ctx[0] === undefined && !("post" in props)) {
    			console.warn("<PostPresenterBody> was created without expected prop 'post'");
    		}
    	}

    	get post() {
    		throw new Error("<PostPresenterBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostPresenterBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\goldhill\controls\PostPresenter.svelte generated by Svelte v3.24.0 */
    const file$e = "src\\goldhill\\controls\\PostPresenter.svelte";

    // (186:8) {:else}
    function create_else_block_1$1(ctx) {
    	let t0;
    	let span;
    	let t1_value = (/*post*/ ctx[0].name || config.anonName) + "";
    	let t1;
    	let if_block = /*post*/ ctx[0].admin && create_if_block_3$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "center");
    			add_location(span, file$e, 189, 12, 4857);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (/*post*/ ctx[0].admin) {
    				if (if_block) ; else {
    					if_block = create_if_block_3$2(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*post*/ 1 && t1_value !== (t1_value = (/*post*/ ctx[0].name || config.anonName) + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(186:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (169:8) {#if !collapsed}
    function create_if_block_1$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let blockquote;
    	let blockquote_class_value;
    	let blockquote_id_value;
    	let t1;
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_2$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*op*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			t0 = space();
    			blockquote = element("blockquote");
    			t1 = space();
    			div = element("div");

    			attr_dev(blockquote, "class", blockquote_class_value = "post-message " + (/*post*/ ctx[0].image != null && /*post*/ ctx[0].parentThread != null
    			? "mt-4"
    			: "mt-1"));

    			attr_dev(blockquote, "id", blockquote_id_value = "m" + /*post*/ ctx[0].postNumber);
    			attr_dev(blockquote, "contenteditable", "false");
    			if (/*post*/ ctx[0].comment === void 0) add_render_callback(() => /*blockquote_input_handler*/ ctx[10].call(blockquote));
    			add_location(blockquote, file$e, 176, 12, 4295);
    			attr_dev(div, "class", "admin-notice");
    			add_location(div, file$e, 182, 12, 4583);
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, blockquote, anchor);

    			if (/*post*/ ctx[0].comment !== void 0) {
    				blockquote.innerHTML = /*post*/ ctx[0].comment;
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(blockquote, "input", /*blockquote_input_handler*/ ctx[10]);
    				mounted = true;
    			}
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
    				if_block.m(t0.parentNode, t0);
    			}

    			if (!current || dirty & /*post*/ 1 && blockquote_class_value !== (blockquote_class_value = "post-message " + (/*post*/ ctx[0].image != null && /*post*/ ctx[0].parentThread != null
    			? "mt-4"
    			: "mt-1"))) {
    				attr_dev(blockquote, "class", blockquote_class_value);
    			}

    			if (!current || dirty & /*post*/ 1 && blockquote_id_value !== (blockquote_id_value = "m" + /*post*/ ctx[0].postNumber)) {
    				attr_dev(blockquote, "id", blockquote_id_value);
    			}

    			if (dirty & /*post*/ 1 && /*post*/ ctx[0].comment !== blockquote.innerHTML) {
    				blockquote.innerHTML = /*post*/ ctx[0].comment;
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(blockquote);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(169:8) {#if !collapsed}",
    		ctx
    	});

    	return block;
    }

    // (187:12) {#if post.admin}
    function create_if_block_3$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "[ADMIN]";
    			attr_dev(span, "class", "name-admin");
    			add_location(span, file$e, 187, 16, 4785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(187:12) {#if post.admin}",
    		ctx
    	});

    	return block;
    }

    // (173:12) {:else}
    function create_else_block$2(ctx) {
    	let postpresenterbody;
    	let t;
    	let postpresenterimage;
    	let current;

    	postpresenterbody = new PostPresenterBody({
    			props: { post: /*post*/ ctx[0] },
    			$$inline: true
    		});

    	postpresenterimage = new PostPresenterImage({
    			props: { post: /*post*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpresenterbody.$$.fragment);
    			t = space();
    			create_component(postpresenterimage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpresenterbody, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(postpresenterimage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpresenterbody_changes = {};
    			if (dirty & /*post*/ 1) postpresenterbody_changes.post = /*post*/ ctx[0];
    			postpresenterbody.$set(postpresenterbody_changes);
    			const postpresenterimage_changes = {};
    			if (dirty & /*post*/ 1) postpresenterimage_changes.post = /*post*/ ctx[0];
    			postpresenterimage.$set(postpresenterimage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpresenterbody.$$.fragment, local);
    			transition_in(postpresenterimage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpresenterbody.$$.fragment, local);
    			transition_out(postpresenterimage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpresenterbody, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(postpresenterimage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(173:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (170:12) {#if op}
    function create_if_block_2$2(ctx) {
    	let postpresenterimage;
    	let t;
    	let postpresenterbody;
    	let current;

    	postpresenterimage = new PostPresenterImage({
    			props: { post: /*post*/ ctx[0] },
    			$$inline: true
    		});

    	postpresenterbody = new PostPresenterBody({
    			props: { post: /*post*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpresenterimage.$$.fragment);
    			t = space();
    			create_component(postpresenterbody.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpresenterimage, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(postpresenterbody, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpresenterimage_changes = {};
    			if (dirty & /*post*/ 1) postpresenterimage_changes.post = /*post*/ ctx[0];
    			postpresenterimage.$set(postpresenterimage_changes);
    			const postpresenterbody_changes = {};
    			if (dirty & /*post*/ 1) postpresenterbody_changes.post = /*post*/ ctx[0];
    			postpresenterbody.$set(postpresenterbody_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpresenterimage.$$.fragment, local);
    			transition_in(postpresenterbody.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpresenterimage.$$.fragment, local);
    			transition_out(postpresenterbody.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpresenterimage, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(postpresenterbody, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(170:12) {#if op}",
    		ctx
    	});

    	return block;
    }

    // (193:4) {#if op && !collapsed && summary != ''}
    function create_if_block$6(ctx) {
    	let show_replies_btn;
    	let span;
    	let t0_value = (/*summarized*/ ctx[5] ? "+" : "-") + "";
    	let t0;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			show_replies_btn = element("show-replies-btn");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(/*summary*/ ctx[7]);
    			attr_dev(span, "class", "text-blue-500 text-lg w-4 inline-block text-center");
    			add_location(span, file$e, 198, 12, 5218);
    			set_custom_element_data(show_replies_btn, "class", "summary select-none block p-2 text-sm svelte-1fi9i7c");
    			set_style(show_replies_btn, "margin-left", "1.2rem");
    			set_style(show_replies_btn, "color", "#d8d6d9");
    			set_custom_element_data(show_replies_btn, "role", "button");
    			add_location(show_replies_btn, file$e, 193, 8, 5006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, show_replies_btn, anchor);
    			append_dev(show_replies_btn, span);
    			append_dev(span, t0);
    			append_dev(show_replies_btn, t1);
    			append_dev(show_replies_btn, t2);

    			if (!mounted) {
    				dispose = listen_dev(
    					show_replies_btn,
    					"mousedown",
    					function () {
    						if (is_function(/*onExpand*/ ctx[3])) /*onExpand*/ ctx[3].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*summarized*/ 32 && t0_value !== (t0_value = (/*summarized*/ ctx[5] ? "+" : "-") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*summary*/ 128) set_data_dev(t2, /*summary*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(show_replies_btn);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(193:4) {#if op && !collapsed && summary != ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let t0;
    	let post_presenter;
    	let post_content;
    	let current_block_type_index;
    	let if_block0;
    	let post_content_class_value;
    	let post_content_id_value;
    	let t1;
    	let t2;
    	let hide_btn;
    	let span;
    	let t3_value = (/*collapsed*/ ctx[1] ? "+" : "-") + "";
    	let t3;
    	let post_presenter_class_value;
    	let post_presenter_id_value;
    	let post_presenter_op_value;
    	let post_presenter_reply_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*collapsed*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*op*/ ctx[2] && !/*collapsed*/ ctx[1] && /*summary*/ ctx[7] != "" && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			post_presenter = element("post-presenter");
    			post_content = element("post-content");
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			hide_btn = element("hide-btn");
    			span = element("span");
    			t3 = text(t3_value);

    			set_custom_element_data(post_content, "class", post_content_class_value = "post block rounded-md px-3 " + (/*collapsed*/ ctx[1]
    			? "py-2"
    			: /*op*/ ctx[2] ? "py-3" : "py-2") + " svelte-1fi9i7c");

    			set_style(post_content, "margin-left", "0rem");
    			set_style(post_content, "padding-left", "2rem");

    			set_custom_element_data(post_content, "id", post_content_id_value = /*inline*/ ctx[4]
    			? ``
    			: `p${/*post*/ ctx[0].postNumber}`);

    			add_location(post_content, file$e, 163, 4, 3797);
    			attr_dev(span, "class", "leading-none text-xl");
    			set_style(span, "margin-bottom", "0.1rem");
    			set_style(span, "color", "#d6d6d6");
    			add_location(span, file$e, 210, 8, 5660);
    			set_custom_element_data(hide_btn, "class", "block mr-2 select-none absolute float-left bg-black rounded-sm\r\n        w-5 h-full cursor-pointer flex items-center justify-center svelte-1fi9i7c");
    			set_style(hide_btn, "left", "0");
    			add_location(hide_btn, file$e, 205, 4, 5417);
    			set_custom_element_data(post_presenter, "class", post_presenter_class_value = "w-100 flex flex-col " + (/*op*/ ctx[2] && !/*collapsed*/ ctx[1] ? "" : "") + "\r\n    " + (/*op*/ ctx[2] ? `my-4 mb-2` : "my-2 ml-6 mr-48") + " svelte-1fi9i7c");
    			set_custom_element_data(post_presenter, "id", post_presenter_id_value = `pc${/*post*/ ctx[0].postNumber}`);
    			set_custom_element_data(post_presenter, "op", post_presenter_op_value = /*op*/ ctx[2] || undefined);
    			set_custom_element_data(post_presenter, "reply", post_presenter_reply_value = !/*op*/ ctx[2] || undefined);
    			add_location(post_presenter, file$e, 156, 0, 3578);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, post_presenter, anchor);
    			append_dev(post_presenter, post_content);
    			if_blocks[current_block_type_index].m(post_content, null);
    			append_dev(post_presenter, t1);
    			if (if_block1) if_block1.m(post_presenter, null);
    			append_dev(post_presenter, t2);
    			append_dev(post_presenter, hide_btn);
    			append_dev(hide_btn, span);
    			append_dev(span, t3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(hide_btn, "mousedown", /*mousedown_handler*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(post_content, null);
    			}

    			if (!current || dirty & /*collapsed, op*/ 6 && post_content_class_value !== (post_content_class_value = "post block rounded-md px-3 " + (/*collapsed*/ ctx[1]
    			? "py-2"
    			: /*op*/ ctx[2] ? "py-3" : "py-2") + " svelte-1fi9i7c")) {
    				set_custom_element_data(post_content, "class", post_content_class_value);
    			}

    			if (!current || dirty & /*inline, post*/ 17 && post_content_id_value !== (post_content_id_value = /*inline*/ ctx[4]
    			? ``
    			: `p${/*post*/ ctx[0].postNumber}`)) {
    				set_custom_element_data(post_content, "id", post_content_id_value);
    			}

    			if (/*op*/ ctx[2] && !/*collapsed*/ ctx[1] && /*summary*/ ctx[7] != "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(post_presenter, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty & /*collapsed*/ 2) && t3_value !== (t3_value = (/*collapsed*/ ctx[1] ? "+" : "-") + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*op, collapsed*/ 6 && post_presenter_class_value !== (post_presenter_class_value = "w-100 flex flex-col " + (/*op*/ ctx[2] && !/*collapsed*/ ctx[1] ? "" : "") + "\r\n    " + (/*op*/ ctx[2] ? `my-4 mb-2` : "my-2 ml-6 mr-48") + " svelte-1fi9i7c")) {
    				set_custom_element_data(post_presenter, "class", post_presenter_class_value);
    			}

    			if (!current || dirty & /*post*/ 1 && post_presenter_id_value !== (post_presenter_id_value = `pc${/*post*/ ctx[0].postNumber}`)) {
    				set_custom_element_data(post_presenter, "id", post_presenter_id_value);
    			}

    			if (!current || dirty & /*op*/ 4 && post_presenter_op_value !== (post_presenter_op_value = /*op*/ ctx[2] || undefined)) {
    				set_custom_element_data(post_presenter, "op", post_presenter_op_value);
    			}

    			if (!current || dirty & /*op*/ 4 && post_presenter_reply_value !== (post_presenter_reply_value = !/*op*/ ctx[2] || undefined)) {
    				set_custom_element_data(post_presenter, "reply", post_presenter_reply_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(post_presenter);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toggleThread() {
    	alert("toggle thread!");
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { post } = $$props;
    	let { op } = $$props;
    	let { thread } = $$props;
    	let { summaryInfo } = $$props;
    	let { onExpand } = $$props;
    	let { inline = false } = $$props;
    	let { summarized = false } = $$props;
    	let { collapsed = false } = $$props;
    	let { toggleCollapsed = () => $$invalidate(1, collapsed = !collapsed) } = $$props;
    	let summary = "";

    	if (summaryInfo) {
    		if (summaryInfo.postsOmitted > 0 && summaryInfo.imagesOmitted > 0) {
    			summary = `${summaryInfo.postsOmitted} posts and ${summaryInfo.imagesOmitted} image replies omitted.`;
    		} else if (summaryInfo.postsOmitted > 0) {
    			summary = `${summaryInfo.postsOmitted} posts omitted.`;
    		} else if (summaryInfo.imagesOmitted > 0) {
    			summary = `${summaryInfo.postsOmitted} images omitted.`;
    		} else if (!summarized) {
    			if (summaryInfo.postTotal > 0 && summaryInfo.imageTotal > 0) {
    				summary = `${summaryInfo.postTotal} posts and ${summaryInfo.imageTotal} image replies shown.`;
    			} else if (summaryInfo.postTotal > 0) {
    				summary = `${summaryInfo.postTotal} posts shown.`;
    			} else if (summaryInfo.imageTotal > 0) {
    				summary = `${summaryInfo.imageTotal} image replies shown.`;
    			}
    		}
    	}

    	const writable_props = [
    		"post",
    		"op",
    		"thread",
    		"summaryInfo",
    		"onExpand",
    		"inline",
    		"summarized",
    		"collapsed",
    		"toggleCollapsed"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPresenter> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PostPresenter", $$slots, []);

    	function blockquote_input_handler() {
    		post.comment = this.innerHTML;
    		$$invalidate(0, post);
    	}

    	const mousedown_handler = e => toggleCollapsed();

    	$$self.$set = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    		if ("op" in $$props) $$invalidate(2, op = $$props.op);
    		if ("thread" in $$props) $$invalidate(8, thread = $$props.thread);
    		if ("summaryInfo" in $$props) $$invalidate(9, summaryInfo = $$props.summaryInfo);
    		if ("onExpand" in $$props) $$invalidate(3, onExpand = $$props.onExpand);
    		if ("inline" in $$props) $$invalidate(4, inline = $$props.inline);
    		if ("summarized" in $$props) $$invalidate(5, summarized = $$props.summarized);
    		if ("collapsed" in $$props) $$invalidate(1, collapsed = $$props.collapsed);
    		if ("toggleCollapsed" in $$props) $$invalidate(6, toggleCollapsed = $$props.toggleCollapsed);
    	};

    	$$self.$capture_state = () => ({
    		Post,
    		PostPresenterImage,
    		PostPresenterBody,
    		config,
    		post,
    		op,
    		thread,
    		summaryInfo,
    		onExpand,
    		inline,
    		summarized,
    		collapsed,
    		toggleCollapsed,
    		summary,
    		toggleThread
    	});

    	$$self.$inject_state = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    		if ("op" in $$props) $$invalidate(2, op = $$props.op);
    		if ("thread" in $$props) $$invalidate(8, thread = $$props.thread);
    		if ("summaryInfo" in $$props) $$invalidate(9, summaryInfo = $$props.summaryInfo);
    		if ("onExpand" in $$props) $$invalidate(3, onExpand = $$props.onExpand);
    		if ("inline" in $$props) $$invalidate(4, inline = $$props.inline);
    		if ("summarized" in $$props) $$invalidate(5, summarized = $$props.summarized);
    		if ("collapsed" in $$props) $$invalidate(1, collapsed = $$props.collapsed);
    		if ("toggleCollapsed" in $$props) $$invalidate(6, toggleCollapsed = $$props.toggleCollapsed);
    		if ("summary" in $$props) $$invalidate(7, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		post,
    		collapsed,
    		op,
    		onExpand,
    		inline,
    		summarized,
    		toggleCollapsed,
    		summary,
    		thread,
    		summaryInfo,
    		blockquote_input_handler,
    		mousedown_handler
    	];
    }

    class PostPresenter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			post: 0,
    			op: 2,
    			thread: 8,
    			summaryInfo: 9,
    			onExpand: 3,
    			inline: 4,
    			summarized: 5,
    			collapsed: 1,
    			toggleCollapsed: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPresenter",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*post*/ ctx[0] === undefined && !("post" in props)) {
    			console.warn("<PostPresenter> was created without expected prop 'post'");
    		}

    		if (/*op*/ ctx[2] === undefined && !("op" in props)) {
    			console.warn("<PostPresenter> was created without expected prop 'op'");
    		}

    		if (/*thread*/ ctx[8] === undefined && !("thread" in props)) {
    			console.warn("<PostPresenter> was created without expected prop 'thread'");
    		}

    		if (/*summaryInfo*/ ctx[9] === undefined && !("summaryInfo" in props)) {
    			console.warn("<PostPresenter> was created without expected prop 'summaryInfo'");
    		}

    		if (/*onExpand*/ ctx[3] === undefined && !("onExpand" in props)) {
    			console.warn("<PostPresenter> was created without expected prop 'onExpand'");
    		}
    	}

    	get post() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get op() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set op(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thread() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thread(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summaryInfo() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summaryInfo(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onExpand() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onExpand(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summarized() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summarized(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get collapsed() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapsed(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleCollapsed() {
    		throw new Error("<PostPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleCollapsed(value) {
    		throw new Error("<PostPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\goldhill\controls\ThreadPresenter.svelte generated by Svelte v3.24.0 */

    const { console: console_1 } = globals;
    const file$f = "src\\goldhill\\controls\\ThreadPresenter.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].post;
    	child_ctx[16] = list[i].index;
    	return child_ctx;
    }

    // (114:29) 
    function create_if_block_1$4(ctx) {
    	let postpresenter;
    	let current;

    	postpresenter = new PostPresenter({
    			props: {
    				op: false,
    				post: /*post*/ ctx[15],
    				thread: /*thread*/ ctx[0],
    				summaryInfo: {
    					imagesOmitted: /*imagesOmitted*/ ctx[2],
    					postsOmitted: /*postsOmitted*/ ctx[3],
    					postTotal: /*postTotal*/ ctx[4],
    					imageTotal: /*imageTotal*/ ctx[5]
    				},
    				onExpand: null
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpresenter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpresenter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpresenter_changes = {};
    			if (dirty & /*visibleReplies*/ 2) postpresenter_changes.post = /*post*/ ctx[15];
    			if (dirty & /*thread*/ 1) postpresenter_changes.thread = /*thread*/ ctx[0];

    			if (dirty & /*imagesOmitted, postsOmitted, postTotal, imageTotal*/ 60) postpresenter_changes.summaryInfo = {
    				imagesOmitted: /*imagesOmitted*/ ctx[2],
    				postsOmitted: /*postsOmitted*/ ctx[3],
    				postTotal: /*postTotal*/ ctx[4],
    				imageTotal: /*imageTotal*/ ctx[5]
    			};

    			postpresenter.$set(postpresenter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpresenter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpresenter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpresenter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(114:29) ",
    		ctx
    	});

    	return block;
    }

    // (101:8) {#if index === 0}
    function create_if_block$7(ctx) {
    	let postpresenter;
    	let current;

    	postpresenter = new PostPresenter({
    			props: {
    				op: true,
    				post: /*post*/ ctx[15],
    				thread: /*thread*/ ctx[0],
    				collapsed: /*collapsed*/ ctx[7],
    				summarized: /*summarized*/ ctx[6],
    				summaryInfo: {
    					imagesOmitted: /*imagesOmitted*/ ctx[2],
    					postsOmitted: /*postsOmitted*/ ctx[3],
    					postTotal: /*postTotal*/ ctx[4],
    					imageTotal: /*imageTotal*/ ctx[5]
    				},
    				toggleCollapsed: /*func_1*/ ctx[9],
    				onExpand: /*func_2*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpresenter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpresenter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpresenter_changes = {};
    			if (dirty & /*visibleReplies*/ 2) postpresenter_changes.post = /*post*/ ctx[15];
    			if (dirty & /*thread*/ 1) postpresenter_changes.thread = /*thread*/ ctx[0];
    			if (dirty & /*collapsed*/ 128) postpresenter_changes.collapsed = /*collapsed*/ ctx[7];
    			if (dirty & /*summarized*/ 64) postpresenter_changes.summarized = /*summarized*/ ctx[6];

    			if (dirty & /*imagesOmitted, postsOmitted, postTotal, imageTotal*/ 60) postpresenter_changes.summaryInfo = {
    				imagesOmitted: /*imagesOmitted*/ ctx[2],
    				postsOmitted: /*postsOmitted*/ ctx[3],
    				postTotal: /*postTotal*/ ctx[4],
    				imageTotal: /*imageTotal*/ ctx[5]
    			};

    			if (dirty & /*collapsed*/ 128) postpresenter_changes.toggleCollapsed = /*func_1*/ ctx[9];
    			if (dirty & /*summarized*/ 64) postpresenter_changes.onExpand = /*func_2*/ ctx[10];
    			postpresenter.$set(postpresenter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpresenter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpresenter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpresenter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(101:8) {#if index === 0}",
    		ctx
    	});

    	return block;
    }

    // (98:4) {#each visibleReplies.map((post, index) => {          return { post, index }      }) as { post, index }}
    function create_each_block$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_if_block_1$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*index*/ ctx[16] === 0) return 0;
    		if (!/*collapsed*/ ctx[7]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(98:4) {#each visibleReplies.map((post, index) => {          return { post, index }      }) as { post, index }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let t;
    	let thread_presenter;
    	let thread_presenter_class_value;
    	let current;
    	let each_value = /*visibleReplies*/ ctx[1].map(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t = space();
    			thread_presenter = element("thread-presenter");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_custom_element_data(thread_presenter, "class", thread_presenter_class_value = "select-text " + (/*collapsed*/ ctx[7]
    			? `thread threadCollapsed`
    			: `thread`) + " svelte-1qyzki0");

    			add_location(thread_presenter, file$f, 95, 0, 3245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, thread_presenter, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(thread_presenter, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*visibleReplies, thread, collapsed, summarized, imagesOmitted, postsOmitted, postTotal, imageTotal, updateReplies*/ 511) {
    				each_value = /*visibleReplies*/ ctx[1].map(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(thread_presenter, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*collapsed*/ 128 && thread_presenter_class_value !== (thread_presenter_class_value = "select-text " + (/*collapsed*/ ctx[7]
    			? `thread threadCollapsed`
    			: `thread`) + " svelte-1qyzki0")) {
    				set_custom_element_data(thread_presenter, "class", thread_presenter_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(thread_presenter);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sliceIfNonZero(self, value) {
    	if (value === 0 || value === -0) return self;
    	return self.slice(value);
    }

    const func = (post, index) => {
    	return { post, index };
    };

    function instance$g($$self, $$props, $$invalidate) {
    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let { thread } = $$props;
    	let visibleReplies = [];
    	let replies = [];
    	let imagesOmitted = 0;
    	let postsOmitted = 0;
    	let postTotal = 0;
    	let imageTotal = 0;
    	let summarized = true;
    	let collapsed = false;
    	let isThreadPage = false;

    	function fetchRepliesAsync() {
    		return __awaiter(this, void 0, void 0, function* () {
    			replies = yield Goldhill.getPostsAsync({ parent: thread.postNumber });
    		});
    	}

    	function updateReplies() {
    		//const thread = params;
    		$$invalidate(0, thread.children = [], thread);

    		$$invalidate(0, thread.replies = [], thread);

    		const postLookup = replies.reduce(
    			function (map, post) {
    				map[post.postNumber] = post;
    				return map;
    			},
    			{}
    		);

    		for (let post of replies) {
    			post.replies = [];
    			thread.children.push(post);

    			for (let replyNum of post.repliedTo) {
    				const repliedPost = postLookup[replyNum];
    				if (repliedPost) repliedPost.replies.push(post.postNumber);
    			}
    		}

    		/* -------------------------------------- */
    		$$invalidate(2, imagesOmitted = 0);

    		$$invalidate(3, postsOmitted = 0);
    		let postCount = thread.children.length;
    		let maxShown = summarized ? config.indexReplyCount : postCount;

    		if (thread.children.length > maxShown && summarized) {
    			for (let i = 0; i < postCount - maxShown; i++) {
    				if (thread.children[i].image != null) $$invalidate(2, imagesOmitted++, imagesOmitted); else $$invalidate(3, postsOmitted++, postsOmitted);
    			}
    		}

    		console.log(thread.children.length, maxShown);
    		let visibleReplies2 = thread.children.slice(0);
    		visibleReplies2 = sliceIfNonZero(replies, -maxShown);
    		visibleReplies2.splice(0, 0, thread);
    		$$invalidate(1, visibleReplies = visibleReplies2);

    		if (!isThreadPage) {
    			$$invalidate(4, postTotal = 0);
    			$$invalidate(5, imageTotal = 0);

    			for (let child of replies) {
    				if (child.image !== null) $$invalidate(5, imageTotal++, imageTotal); else $$invalidate(4, postTotal++, postTotal);
    			}
    		}
    	}

    	fetchRepliesAsync().then(updateReplies);
    	const writable_props = ["thread"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ThreadPresenter> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ThreadPresenter", $$slots, []);
    	const func_1 = () => $$invalidate(7, collapsed = !collapsed);

    	const func_2 = () => {
    		$$invalidate(6, summarized = !summarized);
    		updateReplies();
    	};

    	$$self.$set = $$props => {
    		if ("thread" in $$props) $$invalidate(0, thread = $$props.thread);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Goldhill,
    		Post,
    		config,
    		PostPresenter,
    		thread,
    		visibleReplies,
    		replies,
    		imagesOmitted,
    		postsOmitted,
    		postTotal,
    		imageTotal,
    		summarized,
    		collapsed,
    		isThreadPage,
    		sliceIfNonZero,
    		fetchRepliesAsync,
    		updateReplies
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("thread" in $$props) $$invalidate(0, thread = $$props.thread);
    		if ("visibleReplies" in $$props) $$invalidate(1, visibleReplies = $$props.visibleReplies);
    		if ("replies" in $$props) replies = $$props.replies;
    		if ("imagesOmitted" in $$props) $$invalidate(2, imagesOmitted = $$props.imagesOmitted);
    		if ("postsOmitted" in $$props) $$invalidate(3, postsOmitted = $$props.postsOmitted);
    		if ("postTotal" in $$props) $$invalidate(4, postTotal = $$props.postTotal);
    		if ("imageTotal" in $$props) $$invalidate(5, imageTotal = $$props.imageTotal);
    		if ("summarized" in $$props) $$invalidate(6, summarized = $$props.summarized);
    		if ("collapsed" in $$props) $$invalidate(7, collapsed = $$props.collapsed);
    		if ("isThreadPage" in $$props) isThreadPage = $$props.isThreadPage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		thread,
    		visibleReplies,
    		imagesOmitted,
    		postsOmitted,
    		postTotal,
    		imageTotal,
    		summarized,
    		collapsed,
    		updateReplies,
    		func_1,
    		func_2
    	];
    }

    class ThreadPresenter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { thread: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThreadPresenter",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*thread*/ ctx[0] === undefined && !("thread" in props)) {
    			console_1.warn("<ThreadPresenter> was created without expected prop 'thread'");
    		}
    	}

    	get thread() {
    		throw new Error("<ThreadPresenter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thread(value) {
    		throw new Error("<ThreadPresenter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\boards\[board]\index.svelte generated by Svelte v3.24.0 */
    const file$g = "src\\pages\\boards\\[board]\\index.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (14:4) {#each threads as thread}
    function create_each_block$6(ctx) {
    	let threadpresenter;
    	let current;

    	threadpresenter = new ThreadPresenter({
    			props: { thread: /*thread*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(threadpresenter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(threadpresenter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const threadpresenter_changes = {};
    			if (dirty & /*threads*/ 1) threadpresenter_changes.thread = /*thread*/ ctx[2];
    			threadpresenter.$set(threadpresenter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(threadpresenter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(threadpresenter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(threadpresenter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(14:4) {#each threads as thread}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let index_presenter;
    	let current;
    	let each_value = /*threads*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			index_presenter = element("index-presenter");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_custom_element_data(index_presenter, "class", "block svelte-uqq2oq");
    			add_location(index_presenter, file$g, 12, 0, 307);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, index_presenter, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(index_presenter, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*threads*/ 1) {
    				each_value = /*threads*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(index_presenter, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(index_presenter);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { scoped } = $$props;
    	let threads = scoped.threads;
    	const writable_props = ["scoped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<U5Bboardu5D> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("U5Bboardu5D", $$slots, []);

    	$$self.$set = $$props => {
    		if ("scoped" in $$props) $$invalidate(1, scoped = $$props.scoped);
    	};

    	$$self.$capture_state = () => ({ Post, ThreadPresenter, scoped, threads });

    	$$self.$inject_state = $$props => {
    		if ("scoped" in $$props) $$invalidate(1, scoped = $$props.scoped);
    		if ("threads" in $$props) $$invalidate(0, threads = $$props.threads);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [threads, scoped];
    }

    class U5Bboardu5D extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { scoped: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "U5Bboardu5D",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*scoped*/ ctx[1] === undefined && !("scoped" in props)) {
    			console.warn("<U5Bboardu5D> was created without expected prop 'scoped'");
    		}
    	}

    	get scoped() {
    		throw new Error("<U5Bboardu5D>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoped(value) {
    		throw new Error("<U5Bboardu5D>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\boards\index.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1$2 } = globals;
    const file$h = "src\\pages\\boards\\index.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i][0];
    	child_ctx[2] = list[i][1];
    	return child_ctx;
    }

    // (29:16) {#each Object.entries(boardMetadata) as [slug, board]}
    function create_each_block$7(ctx) {
    	let a;
    	let div;
    	let span0;
    	let t0;
    	let t1_value = /*slug*/ ctx[1] + "";
    	let t1;
    	let t2;
    	let t3;
    	let span1;
    	let t4_value = /*board*/ ctx[2].title + "";
    	let t4;
    	let div_class_value;
    	let t5;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			span0 = element("span");
    			t0 = text("/");
    			t1 = text(t1_value);
    			t2 = text("/");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(span0, "class", "board-slug text-5xl font-medium svelte-1qp7zmz");
    			add_location(span0, file$h, 31, 28, 929);
    			attr_dev(span1, "class", "board-title text-xl mt-4 font-light svelte-1qp7zmz");
    			add_location(span1, file$h, 32, 28, 1019);
    			attr_dev(div, "class", div_class_value = "bg-gray-600 hover:bg-" + /*board*/ ctx[2].bg + " h-full flex flex-col justify-center items-center" + " svelte-1qp7zmz");
    			add_location(div, file$h, 30, 24, 806);
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0](`boards/${/*slug*/ ctx[1]}/`));
    			attr_dev(a, "class", "board-entry block h-full text-white hover:text-white svelte-1qp7zmz");
    			add_location(a, file$h, 29, 20, 686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(span0, t2);
    			append_dev(div, t3);
    			append_dev(div, span1);
    			append_dev(span1, t4);
    			append_dev(a, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0](`boards/${/*slug*/ ctx[1]}/`))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(29:16) {#each Object.entries(boardMetadata) as [slug, board]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let site_page;
    	let div1;
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let ul;
    	let div0;
    	let each_value = Object.entries(boardMetadata);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Boards";
    			t1 = space();
    			h2 = element("h2");
    			t2 = space();
    			ul = element("ul");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "text-3xl mt-8");
    			add_location(h1, file$h, 22, 8, 418);
    			attr_dev(h2, "class", "text-gray-400");
    			add_location(h2, file$h, 23, 8, 464);
    			attr_dev(div0, "class", "grid grid-cols-3 gap-8");
    			add_location(div0, file$h, 27, 12, 558);
    			attr_dev(ul, "class", "flex flex-col py-12 h-full");
    			add_location(ul, file$h, 25, 8, 505);
    			attr_dev(div1, "class", "container flex-1 items-eft mx-auto select-none");
    			add_location(div1, file$h, 21, 4, 349);
    			set_custom_element_data(site_page, "id", "boardsPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$h, 19, 0, 297);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, h2);
    			append_dev(div1, t2);
    			append_dev(div1, ul);
    			append_dev(ul, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url, Object, boardMetadata*/ 1) {
    				each_value = Object.entries(boardMetadata);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $url;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Boards> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Boards", $$slots, []);
    	$$self.$capture_state = () => ({ url, boardMetadata, $url });
    	return [$url];
    }

    class Boards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Boards",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\pages\index.svelte generated by Svelte v3.24.0 */
    const file$i = "src\\pages\\index.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (46:16) {#each links as link}
    function create_each_block$8(ctx) {
    	let li;
    	let a;
    	let t0_value = /*link*/ ctx[1].title + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = /*link*/ ctx[1].href);
    			add_location(a, file$i, 47, 24, 1507);
    			attr_dev(li, "class", "mr-4 text-blue-300 hover:text-blue-100");
    			add_location(li, file$i, 46, 20, 1431);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(46:16) {#each links as link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let site_page;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let span1;
    	let b;
    	let t2;
    	let div0;
    	let t3;
    	let span0;
    	let t4;
    	let br;
    	let t5;
    	let i;
    	let t7;
    	let ul0;
    	let t8;
    	let ul1;
    	let h1;
    	let t10;
    	let postlist;
    	let current;
    	let each_value = /*links*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	postlist = new PostList({ $$inline: true });

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			span1 = element("span");
    			b = element("b");
    			b.textContent = "Daniel Elam";
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			span0 = element("span");
    			t4 = text("Coder - web, desktop, mobile. Full-stack.\n                    ");
    			br = element("br");
    			t5 = space();
    			i = element("i");
    			i.textContent = "Studying Software Engineering @ Edinburgh Napier";
    			t7 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			ul1 = element("ul");
    			h1 = element("h1");
    			h1.textContent = "Posts";
    			t10 = space();
    			create_component(postlist.$$.fragment);
    			attr_dev(img, "class", "pfp svelte-z1u9vr");
    			if (img.src !== (img_src_value = "https://avatars2.githubusercontent.com/u/14797394?s=460&u=9129c69b78a2b160c66cc58076a8d4283e789be5&v=4")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$i, 30, 12, 689);
    			add_location(b, file$i, 34, 16, 907);
    			set_style(div0, "height", "1px");
    			set_style(div0, "margin-bottom", "0.25rem");
    			attr_dev(div0, "class", "inline-block mx-1 w-3 bg-gray-300");
    			add_location(div0, file$i, 35, 16, 942);
    			add_location(br, file$i, 40, 20, 1211);
    			add_location(i, file$i, 41, 20, 1238);
    			attr_dev(span0, "class", "text-gray-300 text-sm");
    			add_location(span0, file$i, 38, 16, 1092);
    			attr_dev(span1, "class", "block text-lg");
    			add_location(span1, file$i, 33, 12, 862);
    			attr_dev(ul0, "class", "flex mt-1");
    			add_location(ul0, file$i, 44, 12, 1350);
    			attr_dev(div1, "class", "section mt-4 svelte-z1u9vr");
    			add_location(div1, file$i, 29, 8, 650);
    			attr_dev(h1, "class", "text-xl mb-2");
    			add_location(h1, file$i, 54, 12, 1674);
    			attr_dev(ul1, "class", "section mt-4 svelte-z1u9vr");
    			add_location(ul1, file$i, 53, 8, 1636);
    			attr_dev(div2, "class", "container flex-1 mx-auto px-4");
    			add_location(div2, file$i, 28, 4, 598);
    			set_custom_element_data(site_page, "id", "aboutPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$i, 26, 0, 547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, span1);
    			append_dev(span1, b);
    			append_dev(span1, t2);
    			append_dev(span1, div0);
    			append_dev(span1, t3);
    			append_dev(span1, span0);
    			append_dev(span0, t4);
    			append_dev(span0, br);
    			append_dev(span0, t5);
    			append_dev(span0, i);
    			append_dev(div1, t7);
    			append_dev(div1, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(div2, t8);
    			append_dev(div2, ul1);
    			append_dev(ul1, h1);
    			append_dev(ul1, t10);
    			mount_component(postlist, ul1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*links*/ 1) {
    				each_value = /*links*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			destroy_each(each_blocks, detaching);
    			destroy_component(postlist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let links = [
    		{
    			href: "mailto:dan@dandev.uk",
    			title: "Email"
    		},
    		{
    			href: "https://discord.gg/8euHrc",
    			title: "Discord"
    		},
    		{
    			href: "https://github.com/DanielElam",
    			title: "Github"
    		},
    		{
    			href: "https://keybase.io/dandev",
    			title: "Keybase"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pages> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pages", $$slots, []);
    	$$self.$capture_state = () => ({ PostList, links });

    	$$self.$inject_state = $$props => {
    		if ("links" in $$props) $$invalidate(0, links = $$props.links);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [links];
    }

    class Pages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\pages\photos\index.svelte generated by Svelte v3.24.0 */

    const file$j = "src\\pages\\photos\\index.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (74:16) {#each instaPosts as post}
    function create_each_block$9(ctx) {
    	let div;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*post*/ ctx[3].thumbnail_src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "photo");
    			attr_dev(img, "class", "svelte-1ct700l");
    			add_location(img, file$j, 80, 28, 2442);
    			attr_dev(a, "href", a_href_value = `https://www.instagram.com/p/${/*post*/ ctx[3].shortcode}/`);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$j, 77, 24, 2282);
    			attr_dev(div, "class", "image-entry text-gray-700 text-center rounded-lg\n                        overflow-hidden");
    			add_location(div, file$j, 74, 20, 2131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, img);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*instaPosts*/ 1 && img.src !== (img_src_value = /*post*/ ctx[3].thumbnail_src)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*instaPosts*/ 1 && a_href_value !== (a_href_value = `https://www.instagram.com/p/${/*post*/ ctx[3].shortcode}/`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(74:16) {#each instaPosts as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let site_page;
    	let div2;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let div1;
    	let div0;
    	let each_value = /*instaPosts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Photos";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Here's some pictures of cats and stuff.";
    			t3 = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "text-3xl mt-8");
    			add_location(h1, file$j, 67, 8, 1858);
    			attr_dev(h2, "class", "text-gray-400");
    			add_location(h2, file$j, 68, 8, 1904);
    			attr_dev(div0, "class", "grid grid-cols-2 gap-8 svelte-1ct700l");
    			add_location(div0, file$j, 72, 12, 2031);
    			attr_dev(div1, "class", "flex flex-col py-12");
    			add_location(div1, file$j, 70, 8, 1984);
    			attr_dev(div2, "class", "container flex-1 items-eft mx-auto select-none");
    			add_location(div2, file$j, 48, 4, 1231);
    			set_custom_element_data(site_page, "id", "photosPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$j, 47, 0, 1180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			append_dev(div2, h2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*instaPosts*/ 1) {
    				each_value = /*instaPosts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let urls = [
    		"https://i.imgur.com/1JFp7i3.jpg",
    		"https://i.imgur.com/L2Wf02i.jpg",
    		"https://i.imgur.com/50VCO9S.jpg",
    		"https://i.imgur.com/Z106uhL.jpg"
    	];

    	let instaPosts = [];

    	function fetchInsta(name) {
    		let url = `https://images${+~~(Math.random() * 3333)}-focus-opensocial.googleusercontent.com/gadgets/proxy?container=none&url=https://www.instagram.com/${name}/`;

    		fetch(url).then(async _ => {
    			var regex = /_sharedData = ({.*);<\/script>/m;
    			var html = await _.text();
    			return JSON.parse(regex.exec(html)[1]);
    		}).then(json => {
    			$$invalidate(0, instaPosts = json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges.map(_ => _.node));
    		});
    	}

    	fetchInsta("instagram");
    	window.test = fetchInsta;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Photos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Photos", $$slots, []);
    	$$self.$capture_state = () => ({ urls, instaPosts, fetchInsta });

    	$$self.$inject_state = $$props => {
    		if ("urls" in $$props) urls = $$props.urls;
    		if ("instaPosts" in $$props) $$invalidate(0, instaPosts = $$props.instaPosts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [instaPosts];
    }

    class Photos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Photos",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\pages\projects\index.svelte generated by Svelte v3.24.0 */

    const file$k = "src\\pages\\projects\\index.svelte";

    function create_fragment$l(ctx) {
    	let site_page;
    	let div;
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			site_page = element("site-page");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Stuff I've worked on.";
    			attr_dev(h1, "class", "text-3xl mt-8");
    			add_location(h1, file$k, 27, 8, 626);
    			attr_dev(h2, "class", "text-gray-400");
    			add_location(h2, file$k, 28, 8, 674);
    			attr_dev(div, "class", "container flex-1 items-eft mx-auto select-none");
    			add_location(div, file$k, 26, 4, 557);
    			set_custom_element_data(site_page, "id", "photosPage");
    			set_custom_element_data(site_page, "class", "text-white");
    			add_location(site_page, file$k, 24, 0, 505);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, site_page, anchor);
    			append_dev(site_page, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(site_page);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let urls = [
    		"https://i.imgur.com/1JFp7i3.jpg",
    		"https://i.imgur.com/L2Wf02i.jpg",
    		"https://i.imgur.com/50VCO9S.jpg",
    		"https://i.imgur.com/Z106uhL.jpg"
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Projects", $$slots, []);
    	$$self.$capture_state = () => ({ urls });

    	$$self.$inject_state = $$props => {
    		if ("urls" in $$props) urls = $$props.urls;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    //tree
    const _tree = {
      "name": "root",
      "filepath": "/",
      "root": true,
      "ownMeta": {},
      "absolutePath": "src/pages",
      "children": [
        {
          "isFile": true,
          "isDir": false,
          "file": "_fallback.svelte",
          "filepath": "/_fallback.svelte",
          "name": "_fallback",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/_fallback.svelte",
          "importPath": "../../../../src/pages/_fallback.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": true,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/_fallback",
          "id": "__fallback",
          "component": () => Fallback
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "_layout.svelte",
          "filepath": "/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/_layout.svelte",
          "importPath": "../../../../src/pages/_layout.svelte",
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/",
          "id": "__layout",
          "component": () => Layout
        },
        {
          "isFile": false,
          "isDir": true,
          "file": "blog",
          "filepath": "/blog",
          "name": "blog",
          "ext": "",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/blog",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "[slug].svelte",
              "filepath": "/blog/[slug].svelte",
              "name": "[slug]",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/blog/[slug].svelte",
              "importPath": "../../../../src/pages/blog/[slug].svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/blog/:slug",
              "id": "_blog__slug",
              "component": () => U5Bslugu5D
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/blog/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/blog/index.svelte",
              "importPath": "../../../../src/pages/blog/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/blog/index",
              "id": "_blog_index",
              "component": () => Blog$1
            }
          ],
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/blog"
        },
        {
          "isFile": false,
          "isDir": true,
          "file": "boards",
          "filepath": "/boards",
          "name": "boards",
          "ext": "",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards",
          "children": [
            {
              "isFile": false,
              "isDir": true,
              "file": "[board]",
              "filepath": "/boards/[board]",
              "name": "[board]",
              "ext": "",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards/[board]",
              "children": [
                {
                  "isFile": true,
                  "isDir": false,
                  "file": "_layout.svelte",
                  "filepath": "/boards/[board]/_layout.svelte",
                  "name": "_layout",
                  "ext": "svelte",
                  "badExt": false,
                  "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards/[board]/_layout.svelte",
                  "importPath": "../../../../src/pages/boards/[board]/_layout.svelte",
                  "isLayout": true,
                  "isReset": false,
                  "isIndex": false,
                  "isFallback": false,
                  "isPage": false,
                  "ownMeta": {},
                  "meta": {
                    "preload": false,
                    "prerender": true,
                    "precache-order": false,
                    "precache-proximity": true,
                    "recursive": true
                  },
                  "path": "/boards/:board",
                  "id": "_boards__board__layout",
                  "component": () => Layout$1
                },
                {
                  "isFile": true,
                  "isDir": false,
                  "file": "catalog.svelte",
                  "filepath": "/boards/[board]/catalog.svelte",
                  "name": "catalog",
                  "ext": "svelte",
                  "badExt": false,
                  "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards/[board]/catalog.svelte",
                  "importPath": "../../../../src/pages/boards/[board]/catalog.svelte",
                  "isLayout": false,
                  "isReset": false,
                  "isIndex": false,
                  "isFallback": false,
                  "isPage": true,
                  "ownMeta": {},
                  "meta": {
                    "preload": false,
                    "prerender": true,
                    "precache-order": false,
                    "precache-proximity": true,
                    "recursive": true
                  },
                  "path": "/boards/:board/catalog",
                  "id": "_boards__board_catalog",
                  "component": () => Catalog
                },
                {
                  "isFile": true,
                  "isDir": false,
                  "file": "index.svelte",
                  "filepath": "/boards/[board]/index.svelte",
                  "name": "index",
                  "ext": "svelte",
                  "badExt": false,
                  "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards/[board]/index.svelte",
                  "importPath": "../../../../src/pages/boards/[board]/index.svelte",
                  "isLayout": false,
                  "isReset": false,
                  "isIndex": true,
                  "isFallback": false,
                  "isPage": true,
                  "ownMeta": {},
                  "meta": {
                    "preload": false,
                    "prerender": true,
                    "precache-order": false,
                    "precache-proximity": true,
                    "recursive": true
                  },
                  "path": "/boards/:board/index",
                  "id": "_boards__board_index",
                  "component": () => U5Bboardu5D
                }
              ],
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": false,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/boards/:board"
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/boards/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/boards/index.svelte",
              "importPath": "../../../../src/pages/boards/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/boards/index",
              "id": "_boards_index",
              "component": () => Boards
            }
          ],
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/boards"
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/index.svelte",
          "importPath": "../../../../src/pages/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/index",
          "id": "_index",
          "component": () => Pages
        },
        {
          "isFile": false,
          "isDir": true,
          "file": "photos",
          "filepath": "/photos",
          "name": "photos",
          "ext": "",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/photos",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/photos/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/photos/index.svelte",
              "importPath": "../../../../src/pages/photos/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/photos/index",
              "id": "_photos_index",
              "component": () => Photos
            }
          ],
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/photos"
        },
        {
          "isFile": false,
          "isDir": true,
          "file": "projects",
          "filepath": "/projects",
          "name": "projects",
          "ext": "",
          "badExt": false,
          "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/projects",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/projects/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "C:/Users/Daniel/Projects/dandev-dot-uk/frontend/src/pages/projects/index.svelte",
              "importPath": "../../../../src/pages/projects/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/projects/index",
              "id": "_projects_index",
              "component": () => Projects
            }
          ],
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/projects"
        }
      ],
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/"
    };


    const {tree, routes: routes$1} = buildClientTree(_tree);

    /* src\App.svelte generated by Svelte v3.24.0 */

    function create_fragment$m(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes: routes$1 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	var redirect = sessionStorage.redirect;
    	delete sessionStorage.redirect;

    	if (redirect && redirect != location.href) {
    		history.replaceState(null, null, redirect);

    		// REMOVE THIS - just showing the redirect route in the UI
    		document.body.setAttribute("message", "This page was redirected by 404.html, from the route: " + redirect);
    	} else {
    		// REMOVE THIS - just showing the redirect route in the UI
    		document.body.setAttribute("message", "This page was loaded directly from the index.html file");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Router, routes: routes$1, redirect });

    	$$self.$inject_state = $$props => {
    		if ("redirect" in $$props) redirect = $$props.redirect;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    const app = HMR(App, { target: document.body }, 'routify-app');
    /** Service worker. Uncomment to use service worker */
    // if ('serviceWorker' in navigator) {
    //     import('workbox-window').then(async ({ Workbox }) => {
    //         const wb = new Workbox('/sw.js')
    //         const registration = await wb.register()
    //         wb.addEventListener('installed', () => (console.log('installed service worker')))
    //         wb.addEventListener('externalinstalled', () => (console.log('installed service worker')))  
    //     })
    // }

    return app;

}());
//# sourceMappingURL=bundle.js.map
