
require('./lib/jquery.min');

module.exports = {
    $: global.jQuery,
    ko: require('./lib/knockout'),
    Helper: require('./Helper'),
    jQueryScrollTo: require('./lib/jquery.scrollTo.min-patched'),
    jQuerySimpleModal: require('./lib/jquery.simplemodal.1.4.4.min'),
    moment: require('./lib/moment.min'),
    _: require('./lib/underscore-min'),
    gui: window.require('nw.gui')
};