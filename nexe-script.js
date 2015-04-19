var nexe = require('nexe');

nexe.compile({
    input: 'input.js',
    output: 'path/to/bin',
    nodeVersion: '0.12.0',
    nodeTempDir: __dirname,
    python: 'path/to/python',
    resourceFiles: [ 'path/to/a/file' ],
    flags: true,
    framework: "nodejs"
}, function(err) {
    console.log(err);
});