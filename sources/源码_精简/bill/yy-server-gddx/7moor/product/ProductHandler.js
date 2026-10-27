var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {

    getProductCache: function (data, session, callback) {

        var data = data || {};
        mongo.db().collection(constants.DB.platform_product).find(data).toArray(function (err, products) {
            if (!err) {
                products = products || [];
                var caches = [];
                for (var i = 0; i < products.length; i++) {
                    var cache = {
                        codeType: "products",
                        codeOrder: i + 1,
                        codeName: products[i].name,
                        codeValue: products[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });

    }

};


module.exports = handler;
