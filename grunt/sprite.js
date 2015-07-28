module.exports = function (grunt, options) {
    'use strict';

    return {
        all: {
            src: ['src/images/sprites/isolated/*.png'],
            destImg: 'src/images/sprites/spritesheet.png',
            destCSS: 'src/css/sprites.css',
            algorithm: 'binary-tree',
            padding: 2,
            cssOpts: {
                cssClass: function (item) {
                    return '.icon.icon-' + item.name;
                }
            },
            'cssVarMap': function (sprite) {
                sprite.name = sprite.name.replace(/__hover$/, ':hover')
                                .replace(/__active$/, ':active').replace(/__click$/, ':active');
            }
        }//,
//        magnifier: {
//            src: ['src/main/webapp/resources/images/sprites/search/*.png'],
//            destImg: 'src/main/webapp/resources/images/sprites/search-sprite.png',
//            destCSS: 'src/main/webapp/resources/css/search-sprite.css',
//            cssOpts: {
//                cssClass: function (item) {
//                    return '.icon.' + item.name;
//                }
//            },
//            'cssVarMap': function (sprite) {
//                sprite.name = sprite.name.replace(/.hover$/, ':hover')
//                                         .replace(/.active$/, ':active').replace(/.click$/, ':active');
//            }
//        }
    }
};