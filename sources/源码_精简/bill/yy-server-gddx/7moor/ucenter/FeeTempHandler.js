var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');

var handler = {
    saveProxyMonthDetail: function () {
        var condition = {};
        condition.proxy='cf1e27c0-df29-11e3-b374-07e0de844661';
//        condition.proxy='7570ed20-3c76-11e4-89f1-b5fc972171bb';
        mongo.db("bill_data").collection("bill_call_proxy_detail").find(condition).toArray(function (err, docs) {
            if (!err) {
                docs=docs||[];
                var idx=0;
                var local=600;
                var remote=800;

                var saveData=function(){
                    var obj=docs[idx];
                    if(obj){
                        mongo.db("bill").collection("platform_account_product").findOne({_id:obj.account+"_zj"},function(err,product){
                            if(!err && product){
                                var dialFee=product.dialFee;
                                var newIncome=0;
                                if(obj.isLocal){
                                    newIncome=obj.minutes*(dialFee.local-local);
                                }else{
                                    newIncome=obj.minutes*(dialFee.remote-remote);
                                }
                                obj.newIncome=newIncome;
                                mongo.db("bill_data").collection("bill_call_proxy_detail_temp").insert(obj,function(err){
                                    if(!err){
                                        idx++;
                                        saveData();
                                    }else{
                                        logger.app.error(err);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                            }
                        });
                    }else{
                        logger.app.info("生成成功");
                    }
                }
                saveData();
            } else {
                logger.app.error(err);
            }
        });
    }

};

module.exports = handler;
