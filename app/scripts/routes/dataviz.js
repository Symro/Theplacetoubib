/*global define*/

define([
    'jquery',
    'backbone'
], function ($, Backbone) {
    'use strict';

    var DatavizRouter = Backbone.Router.extend({
        routes: {
        	"/home" : "home",
            "/module1" : "module1"
        }

    });

    DatavizRouter.on('route:home',function(action){
    	alert('route home');
    });

    return DatavizRouter;
});
