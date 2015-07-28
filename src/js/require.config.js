
'use strict';

requirejs.config({
    baseUrl: "js/",
    paths: {
        "jquery": "lib/jquery.min",
        "jquery.scrollTo": "lib/jquery.scrollTo.min",
        "knockout": "lib/knockout",
        "underscore": "lib/underscore-min",
        "moment": "lib/moment.min",
        "uikit": "lib/uikit/uikit.min",
        "jquery.simplemodal": "lib/jquery.simplemodal.1.4.4.min"
    },
    shim: {
        "underscore": {
            exports: "_"
        },
        "jquery.scrollTo": {
            deps: ["jquery"]
        },
        "knockout": {
            exports: "ko"
        },
        "jquery.simplemodal": {
            deps: ["jquery"]
        }
    },
    map: {
        '*': {
            'css': 'css.min'
        }//,
    }
});