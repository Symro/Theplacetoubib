/*global require*/
'use strict';

require.config({
    shim: {
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        d3: '../bower_components/d3'
    }
});

require([
    'backbone'
], function (Backbone) {
    Backbone.history.start();
});
