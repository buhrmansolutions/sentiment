/**
 * Converts raw AFINN data to JSON hash table.
 *
 * @package sentiment
 * @author Andrew Sliwinski <andrew@diy.org>
 */

/**
 * Dependencies
 */
var async   = require('async'),
    fs      = require('fs');

/**
 * Read AFINN data from original format
 */
fs.readFile(__dirname + '/AFINN-sv-165.txt', function (err, data) {
    // Storage object
    var hash = new Object(null);

    // Split lines
    var lines = data.toString().split(/\n/);
    async.forEach(lines, function (obj, callback) {
        //The AFINN-sv-165 file may not be clean
        if (obj.indexOf(' ') == -1 && obj.indexOf('\t' == -1)) return callback();

        var item = obj.split(/[\t ]/);

        // Support for sentences
        if(item.length > 2){
            var temp = '';
            var value = item[item.length - 1];
            for (var i = 0; i < item.length - 1; i++) temp += item[i] + ' ';
            temp = temp.slice(0, -1);
            item = [temp, value];
        }

        // The AFINN-sv-165 may not be clean
        hash[item[0].toLowerCase()] = Number(item[1]);
        callback();
    }, function (err) {
        if (err) throw new Error(err);

        // Write out JSON
        fs.writeFile(
            __dirname + '/AFINN.json',
            JSON.stringify(hash, null, 2),
        function (err) {
            if (err) throw new Error(err);
            process.stdout.write('Complete.');
        });
    });
});
