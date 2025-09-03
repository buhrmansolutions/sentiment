var test = require('tap').test;
var sentiment = require('../../lib/index');

var dataset = 'Hej din värdelösa skitstövel';
var result = sentiment(dataset);

test('synchronous negative', function (t) {
    t.type(result, 'object');
    t.equal(result.score, -4);
    t.equal(result.comparative, -1);
    t.equal(result.tokens.length, 4);
    t.equal(result.words.length, 1);
    t.end();
});
