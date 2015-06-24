var nexe = require('nexe');
var fs   = require('fs');

var resources = [];
var rawResources = fs.readdirSync('player');

for(var i = 0; i < resources.length; i++) {
    if (!fs.statSync(resources[i]).isDirectory()) {
        resources.push('./player/' + resources[i]);
    }
}

nexe.compile({
    input: './test.js',
    output: 'test',
    nodeVersion: '0.12.0',
    nodeTempDir: __dirname,
    //python: 'path/to/python',
    resourceFiles: resources,
    flags: true,
    framework: "nodejs"
}, function(err) {
    console.log(err);
});