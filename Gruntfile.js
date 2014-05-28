/*
 * grunt
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

'use strict';

module.exports = function(grunt) {

  var files2minified = [

    'js/vendor/jquery.js',
    'js/vendor/jquery-ui.min.js',
    'js/vendor/jquery.tooltip.js',
    'js/vendor/underscore.js',
    'js/vendor/backbone.js',
    'js/vendor/d3.js',
    'js/app.js'

  ];

  // Project configuration.
  grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),

      uglify: {
        options: {
          separator: ';',
          preserveComments:'some'
        },
        dist: {
          src: files2minified,
          dest: 'js/app.min.js'
        }
      },
      watch: {
        options: {
          livereload: true
        },
        src: {
          files: ['js/*.js', 'css/**/*.css', '**/*.html'],
          tasks: ['default'],
        }
      }

    });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('prod', ['uglify:dist']);
  grunt.registerTask('default', ['watch'] );


};
