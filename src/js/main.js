
'use strict';

// IE won't follow links with a button inside
$('a > button').on('click', function() {
    location.href = $(this).closest('a').attr('href') || '#';
});

$(function() {
    var jCss = $('#dynamic-css'),
        jWin = $(window),
        RESIZE_UPDATE_DELAY = 150,
        resizeTimer = null,
        updateResizeCss = function() {
            var offs = $('.col-content:first').offset().top || 0,
                winHeight = jWin.height(),
                newColHeight = winHeight - offs - 12,
                css = '.col-content {height: '+ newColHeight +'px; overflow: auto}';

            console.log('offsTop: %s, winHeight: %s, newColHeight: %s', offs, winHeight, newColHeight);

            jCss.html(css);
            resizeTimer = null;
        };

    $(window).on('resize', function() {
        if (resizeTimer) {
            window.clearTimeout(resizeTimer);
        }
        resizeTimer = window.setTimeout(updateResizeCss, RESIZE_UPDATE_DELAY);
    }).trigger('resize');

});

requirejs(['AMD/App', 'knockout'], function(App, ko){

    ko.applyBindings(App.getInstance());

});