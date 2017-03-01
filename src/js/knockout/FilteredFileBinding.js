
'use strict';

let {ko} = require('../common');

ko.bindingHandlers.filteredFile = {
    init: null,
    update: function(element, valueAccessor , allBindings, viewModel, bindingContext) {
        var opts = ko.unwrap(valueAccessor()),
            hiddenIds1 = opts.hiddenIds1,
            hiddenIds2 = opts.hiddenIds2,
            fileId = bindingContext.$data.id,
            isHidden = (hiddenIds1.indexOf(fileId) >= 0) || (hiddenIds2.indexOf(fileId) >= 0);

        element.style.display = (isHidden) ? 'none' : 'block';
    }
};