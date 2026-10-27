var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    getCustFeeList: function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit || 10;
        var page = data.page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        _impl.getCustFeeList(session.account._id,function(err,records){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            if(!records){
                callback(result);
                return;
            }
            //手动分页,diao
            result.count = records.length;
            result.list = records.slice(skip,skip+limit);
            result.success = true;
            callback(result);
        });
    }
};

var _impl = {
    getCustFeeList: function(account,callback){
        _impl.getProduct(account,'custFee',function(err,product){
            if(err){
                callback(err);
                return;
            }
            if(!product){
                callback(null,null);
                return;
            }

            callback(null,product.custFees);
        });
    },

    getProduct : function(account,product,callback) {
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: account+'_'+product}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },
}

module.exports = handler;