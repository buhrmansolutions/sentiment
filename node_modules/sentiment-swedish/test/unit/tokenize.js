var test = require('tap').test;
var tokenize = require('../../lib/tokenize');

test('spec', function (t) {
    t.type(tokenize, 'function');
    t.type(tokenize('foo'), 'object');
    t.equal(tokenize('foo bar').length, 2);

    t.throws(function () {
        tokenize();
    });
    t.throws(function () {
        tokenize(123);
    });
    t.throws(function () {
        tokenize({});
    });
    t.throws(function () {
        tokenize([]);
    });

    t.end();
});

test('swedish', function (t) {
    t.deepEqual(
        tokenize('Katten kom över väggen'),
        ['katten', 'kom', 'över', 'väggen']
    );
    t.deepEqual(
        tokenize('Det kommer att orsaka problem för bondens grisar'),
        ['det', 'kommer', 'att', 'orsaka', 'problem', 'för', 'bondens', 'grisar']
    );
    t.end();
});

test('diacritic', function (t) {
    t.deepEqual(
        tokenize('This approach is naïve.'),
        ['this', 'approach', 'is', 'naïve']
    );
    t.deepEqual(
        tokenize('The puppy bowl team was very coöperative.'),
        ['the', 'puppy', 'bowl', 'team', 'was', 'very', 'coöperative']
    );
    t.deepEqual(
        tokenize('The soufflé was delicious!'),
        ['the', 'soufflé', 'was', 'delicious']
    );
    t.end();
});
