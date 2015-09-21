module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),


    /* Sass compiler Task */
    sass: {
      main: {
        options: {
          style: 'nested',
          sourcemap: 'none',
          noCache: true
        },
        files: [
          {
            expand: true,
            cwd: 'src',
            src: ['*.scss'],
            dest: 'dist',
            ext: '.min.css'
          }
        ]
      }
    },

    /* Autoprefixer */
    autoprefixer: {
      your_target: {
        files: {
          'dist/horizon-swiper.min.css': ['dist/horizon-swiper.min.css'],
          'dist/horizon-theme.min.css': ['dist/horizon-theme.min.css']
        }
      },
    },

    /* Minify CSS */
    cssmin: {
      options: {
        compatibility: 'ie8',
        sourceMap: false
      },
      target: {
        files: {
          'dist/horizon-swiper.min.css': ['dist/horizon-swiper.min.css'],
          'dist/horizon-theme.min.css': ['dist/horizon-theme.min.css']
        }
      }
    },

    /* Babel */
    babel: {
      options: {
        sourceMap: false
      },
      dist: {
        files: [
          {
            'expand': true,
            'cwd': 'src/es6',
            'src': ['*.js'],
            'dest': 'src',
            'ext': '.js'
          }
        ]
      }
    },

    /* JS uglify  */
    uglify: {
      options: {
        sourceMap: false
      },
      my_target: {
        files: {
          'dist/horizon-swiper.min.js': ['src/horizon-swiper.js']
        }
      }
    }

  });


  /* Load plugins */
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  /* Tasks  */
  grunt.registerTask('default', ['sass', 'autoprefixer', 'cssmin', 'babel', 'uglify']);
  grunt.registerTask('css', ['sass', 'autoprefixer', 'cssmin']);
  grunt.registerTask('js', ['babel', 'uglify']);

};
