
'use strict';

define(['knockout', 'AMD/Helper', 'AMD/PathWatcher', 'jquery'], function(ko, Helper, PathWatcher, $) {

    ko.bindingHandlers.abortLoadingOnClick = {
        init: function(element, valueAccessor /*, allBindings, viewModel, bindingContext */) {
            var watcher = valueAccessor();

            Helper.assert(watcher instanceof PathWatcher, 'No PathWatcher given for abortLoadingOnClick binding');

            $(element).on('click', function() {
                watcher.abort();
            })
        },
        update: null
    };

});