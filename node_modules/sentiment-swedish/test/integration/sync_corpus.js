var test = require('tap').test;
var corpus = require('../fixtures/corpus');
var sentiment = require('../../lib/index');

var dataset = corpus;
var result = sentiment(dataset);

test('synchronous corpus', function (t) {
    t.type(result, 'object');
    t.equal(result.score, 28);
    t.equal(result.tokens.length, 1356);
    t.equal(result.words.length, 81);
    t.end();
});
