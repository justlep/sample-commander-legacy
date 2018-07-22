
'use strict';

require('./lib/jquery.min');
window.ko = require('./lib/knockout');
require('./lib/knockout-fast-foreach-mod');

window.ko.extenders.togglable = function(target /*, opts */) {
    target.toggleOn = function() {
        target(true);
    };
    target.toggleOff = function() {
        target(false);
    };
    target.toggle = function() {
        target(!target());
    };

    return target;
};

module.exports = {
    $: global.jQuery,
    ko: window.ko,
    Helper: require('./Helper'),
    jQueryScrollTo: require('./lib/jquery.scrollTo.min-patched'),
    jQuerySimpleModal: require('./lib/jquery.simplemodal.1.4.4.min'),
    moment: require('./lib/moment.min'),
    _: require('./lib/underscore-min'),
    gui: window.require('nw.gui')
};