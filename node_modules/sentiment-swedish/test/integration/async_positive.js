var test = require('tap').test;
var sentiment = require('../../lib/index');

var dataset = 'Det här är så coolt';
sentiment(dataset, function (err, result) {
    test('asynchronous positive', function (t) {
        t.type(result, 'object');
        t.equal(result.score, 4);
        t.equal(result.comparative, 0.8);
        t.equal(result.tokens.length, 5);
        t.equal(result.words.length, 1);
        t.end();
    });
});
