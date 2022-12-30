import { first } from './nlp'

test('Beagle.fromString simple', () => {
  expect(first()).toStrictEqual("")
})

describe("data-driven test", function() {
    let rows;
    
    // we'll create an asynchronous beforeAll() method to read in our data
    beforeAll(function (done) {
        rows = [];
        // require needed modules
        let fs = require('fs');
        let csv = require('fast-csv');
        // read in the csv file contents
        let stream = fs.createReadStream('/my/path/to/data.csv');
        // use fast-csv; this particular file has headers, so let it know about it
        let csvStream = csv({headers : true})
            .on('data', function (data) {
                // for each row, push the data into our rows[] object
                // NOTE: this module also provides validation if certain rows need exclusion,
                // as well as transformation callbacks if the data needs to be massaged after it's read
                rows.push(data);
            })
            .on('end', function () {
                // done reading the file; we can call done() to tell Sencha Test to continue with specs
                done();
            });
            
        stream.pipe(csvStream);
    });
    
    afterAll(function () {
        rows = null;
    });
    
    it('should use external data', function () {
        // rows[] should now be populated with the correct data, so we can iterate over it if desired to execute
        // whatever expectations we need
        rows.forEach(function (data) {
            ...
        })
    })
});
