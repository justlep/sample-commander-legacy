
'use strict';

let moment = require('./lib/moment.min'),
    _ = require('./lib/underscore-min'),
    elementIdCounter = 0,
    listeners = {};

/**
 * Static helpers for the app.
 */
module.exports = {
    MIME_TYPES: {
        WAV: 'audio/wave'
    },

    EVENTS: {
        PLAY_FILE: 'playfile',
        CHANGE_SOURCE_PATH: 'openSourcePath',
        CHANGE_TARGET_PATH: 'openTargetPath',
        SWAP_PATHS: 'swappaths',
        PATH_CHANGED: 'pathchanged',
        MODAL_SHOW: 'modalShow'
    },
    /**
     * @static
     * Throws an exception if the given condition doesn't evaluate to true.
     * TODO allow '%s' wildcards in errormessage and variable parameter list to prevent superfluous string creation
     *
     * @param condition (mixed) expression expected to evaluate to boolean true
     * @param [errorMessage] (String) (optional)
     */
    assert: function(condition, errorMessage) {
        if (!condition) {
            throw errorMessage || "Assertion failed";
        }
    },
    /** @static */
    assertBoolean: function(expr, errorMessage) {
        this.assert(typeof expr === 'boolean', errorMessage);
    },
    /** @static */
    assertString: function(expr, errorMessage) {
        this.assert(typeof expr === 'string', errorMessage);
    },
    /** @static */
    assertStringOrEmpty: function(expr, errorMessage) {
        this.assert(!expr || typeof expr === 'string', errorMessage);
    },
    /** @static */
    assertNumber: function(expr, errorMessage) {
        this.assert(typeof expr === 'number', errorMessage);
    },
    /** @static */
    assertArray: function(expr, errorMessage) {
        this.assert(_.isArray(expr), errorMessage);
    },
    /** @static */
    assertFunction: function(expr, errorMessage) {
        this.assert(typeof expr === 'function', errorMessage);
    },
    /** static */
    assertFunctionOrEmpty: function(expr, errorMessage) {
        this.assert(!expr || (typeof expr === 'function', errorMessage));
    },
    /** @static */
    assertObject: function(expr, errorMessage) {
        this.assert(typeof expr === 'object', errorMessage);
    },
    /** @static */
    assertObjectOrEmpty: function(expr, errorMessage) {
        this.assert(!expr || (typeof expr === 'object', errorMessage));
    },

    /**
     * @static
     * @param s
     * @returns s escpaed for being usable in a regex
     */
    escapeForRegex: function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },
    /**
     * @static
     * Checks if the given string is usable as a valid directory name.
     * @param s (String)
     * @returns {boolean}
     */
    isValidDirName: function(s) {
        return s && _.isString(s) && !/\.\.|[\\\/]|\s{2,}/.test(s);
    },

    /**
     * @static
     * Simple string formatter
     * Example: Helper.formatString('Test %xxx', {xxx: 123}) --> 'Test 123'
     *
     * @param s (String) with named placeholders (%..)
     * @param data (Object) map for placeholder values
     * @returns (String) s with placeholders replaced
     */
    formatString: function(s, data) {
        let d = data || {},
            str = s || '';
        for (let k in d) {
            if (d.hasOwnProperty(k)) {
                str = str.replace('{'+k+'}', ''+d[k]);
            }
        }
        return str;
    },

    /**
     * @static
     * Formats a given date in a given pattern using momentjs.
     * Used language is German (for weekdays etc).
     *
     * @param date (Date)
     * @param format (String) pattern (see http://momentjs.com/docs/#/displaying/)
     */
    formatDate: function(date, format) {
        return moment(date).lang('de').format(format);
    },

    /**
     * @static
     * Replaces the decimal '.' with ',' and adds thousands separators ('.'),
     * e.g. formatNumber('-1234.56') -> "-1.234,56".
     * @param num (Number|String) number or numeric String (both '-' and '+' prefixes will be preserved)
     * @return (String) formatted number
     */
    formatNumber: function(num) {
        let FORMAT_REGEX = /^([+-])?(\d{1,3})(\d{3})?(\d{3})?(\d{3})?(\d{3})?(\d{3})?(\.\d*)?$/;

        return (''+num).replace(FORMAT_REGEX, function() {
            let formatted = [ (arguments[1]||'') + arguments[2]];
            for (let i = 3; i <= 7; i++) {
                if (arguments[i]) {
                    formatted.push('.' + arguments[i]);
                }
            }
            if (arguments[8]) {
                formatted.push(arguments[8].replace('.',','));
            }
            return formatted.join('');
        });
    },

    /**
     * @static
     * Formats a given weight in grams into a string representation in kilograms.
     * @param weightInGrams (Number)
     * @returns (String)
     */
    formatWeight: function(weightInGrams) {
        return (''+(weightInGrams / 1000).toFixed(1)).replace('.',',');
    },

    /**
     * @static
     * Extends a given object with a second one.
     * @param a (Object)
     * @param bOrNothing (Object|null)
     * @returns (Object) a extended by properties of b
     */
    extend: function(a, bOrNothing) {
        let b = bOrNothing || {};
        for (let k in b) {
            if (b.hasOwnProperty(k)) {
                a[k] = b[k];
            }
        }
        return a;
    },

    /**
     * @static
     * Parse a given date String into a date
     * @param s (Date) day in the form 'yyyy-mm-dd'
     * @returns (Date) or throws error if {s} is invalid
     */
    parseDate: function(s) {
        this.assert(/^\d{4}-\d{2}-\d{2}$/.test(s||''), 'Invalid date for Helper.parseDate()');
        return moment(s).toDate();
    },

    /**
     * @static
     * @returns {string} a new id
     */
    generateId: function() {
        return 'appItem_' + (++elementIdCounter);
    },

    /**
     * @static
     * Adds to the given object a property with key {@link Helper#ELEMENT_ID_PROPERTY} for non-HTML-Elements
     * or 'id' for HTML elements.
     * The property value becomes a generated ID that can be used for DOM elements of the object.
     * If the object already has the property, it is left untouched.
     *
     * @param obj (Object)
     * @returns (String) the generated ID
     */
    generateElementIdFor: function(obj) {
        this.assertObject(obj, 'Invalid object passed to Helper.generateElementIdFor()');
        let propertyName = (_.isElement(obj)) ? 'id' : this.ELEMENT_ID_PROPERTY;
        if (!obj[propertyName]) {
            obj[propertyName] = this.generateId();
            // console.log('Generated element id "%s" for %o (propertyName="%s")', obj[propertyName], obj,
            //                                                                                        propertyName);
        }
        return obj[propertyName];
    },
    /**
     * @static
     * Returns for an object its element ID that has previously been generated via {@link #generateElementIdFor()}.
     * Optionally, the ID can be generated lazily now.
     * @param obj (Object)
     * @param [lazyCreate] (Boolean) if true and the object has no id yet, the ID will be generated now
     * @returns (String) the object's element id
     */
    getElementIdFor: function(obj, lazyCreate) {
        this.assertObject(obj, 'Invalid object passed to Helper.getElementIdFrom()');
        let propertyName = (_.isElement(obj)) ? 'id' : this.ELEMENT_ID_PROPERTY;
        if (!obj[propertyName] && lazyCreate) {
            this.generateElementIdFor(obj);
        }
        return obj[propertyName] || null;
    },

    /**
     * @static
     * Adds a listener function to be called whenever {@link #notify()} is called for the given event name.
     * @param eventName (String)
     * @param handler (function) callback with any number of arguments it expects from the notifier
     */
    listen: function(eventName, handler) {
        this.assertString(eventName, 'Invalid event name for Helper.listen()');
        this.assertFunction(handler, 'Invalid handler function for Helper.listen()');
        if (!listeners[eventName]) {
            listeners[eventName] = [handler];
        } else if (!_.contains(listeners[eventName], handler)) {
            listeners[eventName].push(handler);
        }
    },

    /**
     * @static
     * Removes an event handler (or all) for a given event name.
     * @param eventName (String)
     * @param [handler] (function) if empty, all handlers are removed for the given event name
     */
    unlisten: function(eventName, handler) {
        this.assertString(eventName, 'Invalid event name for Helper.unlisten()');
        this.assertFunctionOrEmpty(handler, 'Invalid handler function for Helper.unlisten()');
        if (!handler && listeners[eventName]) {
            delete listeners[eventName];
            console.log('Removed all event handlers for event "%s"', eventName);
        } else if (handler) {
            _.find(listeners[eventName], function(fn, index) {
                if (fn === handler) {
                    delete listeners[eventName][index];
                    console.log('Removed handler for event "%s"', eventName);
                    return true;
                }
            });
        }
    },

    /**
     * @static
     * Binds an event handler that is called only once, then automatically unbound.
     * @param eventName (String)
     * @param handler (function) callback with any number of arguments it expects from the notifier
     */
    listenOnce: function(eventName, handler) {
        this.assertString(eventName, 'Invalid event name for Helper.listenOnce()');
        this.assertFunction(handler, 'Invalid handler function for Helper.listenOnce()');
        let self = this,
            wrappedHandler = function() {
                self.unlisten(eventName, wrappedHandler);
                handler.apply(self, arguments);
                console.log('Finished call of listenOnce-wrapped handler.');
            };
        this.listen(eventName, wrappedHandler);
        console.log('Bound once-only-handler for event "%s"', eventName);
    },

    /**
     * @static
     * Calls all listeners that were registered via {@link #listen()} for the given event name,
     * passing to each handler the additional arguments.
     * @param eventName (String)
     * @params <any> (mixed) additional arguments to be passed as parameters to the registered listeners
     */
    notify: function(eventName /* , params... */) {
        this.assertString(eventName, 'Invalid event name for Helper.notify()');
        // console.info('Event "%s" triggered', eventName);
        let handlerArgs =  _.toArray(arguments).splice(1);
        _.each(listeners[eventName], function(handler) {
            handler.apply(this, handlerArgs)
        });
    }
};
