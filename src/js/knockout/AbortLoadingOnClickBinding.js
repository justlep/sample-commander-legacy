
'use strict';

let {ko, Helper, $} = require('../common'),
    PathWatcher = require('../PathWatcher');

ko.bindingHandlers.abortLoadingOnClick = {
    init: function(element, valueAccessor /*, allBindings, viewModel, bindingContext */) {
        let watcher = valueAccessor();

        Helper.assert(watcher instanceof PathWatcher, 'No PathWatcher given for abortLoadingOnClick binding');

        $(element).on('click', function() {
            watcher.abort();
        })
    },
    update: null
};
