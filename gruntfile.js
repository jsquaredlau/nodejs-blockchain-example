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


    ///// GRUNT COMMANDS /////
    // Default tasks.
    grunt.registerTask('default', ['tslint:all', 'ts:build']);

    grunt.registerTask('build', ['tslint:all', 'ts:build', 'concurrent:watchers']);

    // grunt-concurrent will administer the running of nodemon and grunt watch
    grunt.registerTask('serve', ['concurrent:watchers']);
};
