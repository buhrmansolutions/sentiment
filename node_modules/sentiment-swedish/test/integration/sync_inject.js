var test = require('tap').test;
var sentiment = require('../../lib/index');

var dataset = 'Det här är så coolt';
var result = sentiment(dataset, {'coolt': 100});

test('synchronous inject', function (t) {
    t.type(result, 'object');
    t.equal(result.score, 100);
    t.equal(result.comparative, 20);
    t.equal(result.tokens.length, 5);
    t.equal(result.words.length, 1);
    t.end();
});
