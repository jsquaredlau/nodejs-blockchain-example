module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        ts: {
            build: {
                src: ['app/server.ts', '!node_modules/**/*.ts'],
                dest: 'build',
                // Avoid compiling TypeScript files in node_modules
                options: {
                    module: 'commonjs',
                    sourceMap: false,
                    // To compile TypeScript using external modules like NodeJS
                    fast: 'never'
                    // You'll need to recompile all the files each time for NodeJS
                }
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON('tslint.json')
            },
            all: {
                src: ['app/**/*.ts', '!node_modules/**/*.ts', '!obj/**/*.ts', '!typings/**/*.ts']
                // avoid linting typings files and node_modules files
            }
        },
        watch: {
            scripts: {
                files: ['app/**/*.ts', '!node_modules/**/*.ts'], // the watched files
                tasks: ['newer:tslint:all', 'ts:build'], // the task to run
                options: {
                    spawn: false // makes the watch task faster
                }
            }
        },
        nodemon: {
            dev: {
                script: 'build/server.js'
            },
            options: {
                ignore: ['node_modules/**', 'Gruntfile.js'],
                env: {
                    PORT: '3000'
                }
            }
        },
        concurrent: {
            watchers: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        env : {
            options : {
         	//Shared Options Hash
            },
            dev : {
                NODE_ENV : 'development',
                DEST     : 'build'
            },
            dev2 : {
                NODE_ENV : 'development',
                DEST     : 'build',
                NODE_APP_INSTANCE : 2
            },
            dev3 : {
                NODE_ENV : 'development',
                DEST     : 'build',
                NODE_APP_INSTANCE : 3
            },
            production : {
              NODE_ENV : 'production',
              DEST     : 'build',
              concat   : {
                PATH     : {
                  'value': 'node_modules/.bin',
                  'delimiter': ':'
                }
              }
            },
            production2 : {
              NODE_ENV : 'production',
              DEST     : 'build',
              NODE_APP_INSTANCE : 2,
              concat   : {
                PATH     : {
                  'value': 'node_modules/.bin',
                  'delimiter': ':'
                }
              }
            },
            production3 : {
              NODE_ENV : 'production',
              DEST     : 'build',
              NODE_APP_INSTANCE : 3,
              concat   : {
                PATH     : {
                  'value': 'node_modules/.bin',
                  'delimiter': ':'
                }
              }
            },
            functions: {
              BY_FUNCTION: function() {
                var value = '123';
                grunt.log.writeln('setting BY_FUNCTION to ' + value);
                return value;
              }
            }
        }
    });

    ///// GRUNT LIBRARIES /////
    // Compile typescript
    grunt.loadNpmTasks('grunt-ts');

    // Lint typescript
    grunt.loadNpmTasks('grunt-tslint');

    // Watch for file (.ts) changes
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Only recompile .ts files that have changed
    grunt.loadNpmTasks('grunt-newer');

    // Restart server on file (.js) changes
    grunt.loadNpmTasks('grunt-nodemon');

    // Nodemon and grunt watch will block each other by themselves, this will handle that
    grunt.loadNpmTasks('grunt-concurrent');

    // Setting of ENV variables
    grunt.loadNpmTasks('grunt-env');

    ///// GRUNT COMMANDS /////
    // Default tasks.
    grunt.registerTask('default', ['tslint:all', 'ts:build']);

    grunt.registerTask('build', ['tslint:all', 'ts:build', 'env:dev']);

    grunt.registerTask('build2', ['tslint:all', 'ts:build', 'env:dev2']);

    grunt.registerTask('build3', ['tslint:all', 'ts:build', 'env:dev3']);

    grunt.registerTask('production', ['tslint:all', 'ts:build', 'env:production']);

    grunt.registerTask('production2', ['tslint:all', 'ts:build', 'env:production2']);

    grunt.registerTask('production3', ['tslint:all', 'ts:build', 'env:production3']);

    // grunt-concurrent will administer the running of nodemon and grunt watch
    grunt.registerTask('serve', ['tslint:all', 'ts:build', 'concurrent:watchers']);

    // grunt.registerTask('serve', ['tslint:all', 'ts:build', 'concurrent:watchers', 'env:dev']);

    grunt.registerTask('serve2', ['tslint:all', 'ts:build', 'concurrent:watchers', 'env:dev2']);
};
