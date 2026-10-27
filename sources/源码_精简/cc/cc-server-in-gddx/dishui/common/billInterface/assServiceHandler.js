var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var http = require('appHttp');
var fields = require(__baseDir + '/dishui/common/Fields');

var agentConcurrentNum = 1.5;

var handler = {
    hasFare: function (data, callback) {
        var accountId = data.accountId;
        var result = {success: false};
        var key=accountId+"_"+fields.product_cc;
        var condition = {_id: key};
        mongo.db("bill").collection("platform_account_product").findOne(condition, function (err, product) {
            if (!err && product) {
                var info = {call: 0};
                var balance=utils.formatTrueFee(product.balance);
                if(balance>0){
                    info.call = 1;
                }
                result.success = true;
                result.info = info;
                callback(result);
            } else {
                result.message = "account is not found!";
                callback(result);
            }
        });


    },
    /**
     * http://localhost:4000/service?action=queryLicenseCount&data={%22accountId%22:%22N00000000152%22,%22sipConfigId%22:%221.1.1.100%22}
     * @param data
     * @param callback
     */
    queryLicenseCount: function (data, callback) {
        var result = {success: false};
        var accountId = data.accountId;
        var id=accountId+"_"+fields.product_cc;
        var condition = {
            _id: id
        };
        mongo.db("bill").collection("platform_account_product").findOne(condition, function (err, product) {
            if (!err && product) {
                var info = {
//                    ivr: 0,
//                    monitor: 0,
//                    enterprise: 0,
//                    business: 0,
//                    ext: 0,
//                    order: 0,
                    standard: 0,
                    outcall: 0,
                    MaxOutboundCalls: 2,
                    MaxIncomingCalls: 2
                };

                var _query = {
                    account: accountId,
                    pbx: data.sipConfigId
                };
                handler._queryAgentLicence(_query,function(rep){
                    if(rep.success){
                        info.outcall = rep.dialout;
                        info.standard = rep.standard;
                        info.MaxIncomingCalls = product.maxInbound || 2;
                        info.MaxOutboundCalls = product.maxOutbound || 2;
                        result.success = true;
                        result.info = info;
                        callback(result);
                    }else{
                        callback(rep);
                    }
                });
//                var nowDate = utils.DateTime.getCurrentDate();
                /*if (account.status == "tryout" && account.expireTime >= nowDate) {
                    info.standard = -1;
                    var type = account.concurrentType || "normal";
                    if (type == "custom") {
                        info.MaxIncomingCalls = account.callInLimit || -1;
                        info.MaxOutboundCalls = account.callOutLimit || -1;
                    } else {
                        info.MaxIncomingCalls = 2;
                        info.MaxOutboundCalls = -1;
                    }

                } else if (account.status == "using" && (account.endTime >= nowDate || account.endTime == "")) {
                    info.standard = account.agentNum;
                    var type = account.concurrentType || "normal";
                    if (type == "custom") {
                        info.MaxIncomingCalls = account.callInLimit || -1;
                        info.MaxOutboundCalls = account.callOutLimit || -1;
                    } else {
                        info.MaxIncomingCalls = Math.ceil(account.agentNum * agentConcurrentNum);
//                        info.MaxOutboundCalls = Math.ceil(account.agentNum * agentConcurrentNum);
                        info.MaxOutboundCalls = -1;
                    }
                }*/

            } else {
                result.message = "account is not found!";
                callback(result);
            }
        });


    },
    /**
     * standard 标准版
     * dialout 外呼版
     *
     * @param data
     * @param callback
     * @private
     */
    _queryAgentLicence: function (data, callback) {
        var result = {success: false};
        var current=utils.DateTime.getCurrentDate();
        var condition = {
            account:data.account,
            pbx:data.pbx
        };
        condition.endDate={$gte:current};
        condition.startDate={$lte:current};
        mongo.db("bill").collection("platform_licence").find(condition).toArray(function (err, docs) {
            if (!err) {
                var standard=0;
                var dialout=0;
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    var num=parseInt(obj.num,10);
                    if(obj.licenceType=='standard'){
                        standard+=num;
                    }else if(obj.licenceType=='dialout'){
                        dialout+=num;
                    }
                }
                result.success = true;
                result.dialout = dialout;
                result.standard = standard;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    notifyAssUpdateLicense: function (accountId, callback) {
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({"_id": accountId+"_cc"}, function (err, account) {
            if (!err && account) {
                var pbx = account.pbx.PBX;
                var postdata = {
                    Command: "Action",
                    Action: "ToUpdateLisence",
                    ActionID: utils.UUID.generateUuid(),
                    PBX: pbx,
                    Account: accountId
                };
                mongo.db().collection("app_pbx").findOne({_id: pbx}, function (err, queryPbx) {
                    if (!err && queryPbx) {
                        http.sendPost(queryPbx.configAddr, postdata, function (err, data) {
                            if (!err) {
                                logger.app.info("notify ass get response:" + data);
                                data = JSON.parse(data);
                            }
                            callback(err, data);
                        });
                    } else {
                        logger.app.error("db error!", err || new Error("can not fount pbx!"));
                        callback(err || new Error("can not fount pbx!"));
                    }

                });
            } else {
                logger.app.error("db error!", err || new Error("can not fount account!"));
                callback(err || new Error("can not fount account!"));
            }
        });
    }
}


module.exports = handler;