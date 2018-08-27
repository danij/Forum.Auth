const pg = require('pg');

const pool = new pg.Pool();

module.exports = {

    executeQuery: (query, parameters) => {

        return new Promise((resolve, reject) => {

            pool.connect((err, client, done) => {

                if (err) {

                    reject(err);
                }
                else if (client) {

                    client.query(query, parameters, (queryErr, res) => {

                        if (queryErr) {

                            reject(queryErr);
                        }
                        else {

                            resolve(res);
                        }
                        done();
                    });
                }
            });
        });
    }
};
