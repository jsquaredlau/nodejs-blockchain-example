module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        ts: {
            build: {
                src: ["app/server.ts", "!node_modules/**/*.ts"],
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
                configuration: grunt.file.readJSON("tslint.json")
            },
            all: {
                src: ["app/**/*.ts", "!node_modules/**/*.ts", "!obj/**/*.ts", "!typings/**/*.ts"]
                // avoid linting typings files and node_modules files
            }
        },
        watch: {
            scripts: {
                files: ['app/**/*.ts', '!node_modules/**/*.ts'], // the watched files
                tasks: ["newer:tslint:all", "ts:build"], // the task to run
                options: {
                    spawn: false // makes the watch task faster
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-ts");

    grunt.loadNpmTasks("grunt-tslint");

    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.loadNpmTasks("grunt-newer");

    // Default tasks.
    grunt.registerTask('default', ["tslint:all", "ts:build"]);
};
