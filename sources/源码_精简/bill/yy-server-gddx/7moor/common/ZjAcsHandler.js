var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
//var businessUtil = require('appUtil/BusinessUtil');


var handler = {
    generateZJIvrFlow: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var pbx=data.pbx;
        var query={product:'zj','pbx.pbx':pbx};
        mongo.db().collection(constants.DB.platform_account_product).find(query,{fields:{account:1}}).toArray(function (err, accounts) {
            if (!err) {
                accounts=accounts||[];
//                accounts=[{account:'N00000000170'}];
                var index=0;
                var setIvrFlow=function(){
                    var acc=accounts[index];
                    if(acc){
                        var aid=acc.account;
                        mongo.db("zj").collection("platform_ivr").findOne({account:aid},function (err, flow) {
                            if(!err && flow){
                                flow.pbx=pbx;
                                if(flow.serviceNo){
                                    syncAcs.generateIvrFlow(flow,function(isSuccess){
                                        if(isSuccess){
                                            index++;
                                            setIvrFlow();
                                        }else{
                                            result.message="account is "+aid;
                                            callback(result);
                                            logger.app.error("generateZJIvrFlow account error is "+aid);
                                            index++;
                                            setIvrFlow();
                                        }
                                    });
                                }else{
                                    index++;
                                    setIvrFlow();
                                }
                            }else{
                                index++;
                                setIvrFlow();
//                                logger.app.error(err);
//                                result.message="account is "+aid;
//                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                setIvrFlow();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    deleteZJDefaultIvr:function(data, callback){
        var result = {success: false};
        var syncErrMsg="deleteZJDefaultIvr同步acs失败";
        mongo.db("zj").collection(constants.DB.platform_ivr).find({serviceNo:{$in:[null,'']}}).toArray(function (err, flows) {
            if(!err){
                flows=flows||[];
                var index=0;
                var delIvr=function(){
                    var flow=flows[index];
                    if(flow){
                        var ivrId=flow._id;
                        var queue1=flow.queue;
                        var queue2=flow.serviceQueue;
                        var account=flow.account;
                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:account+"_zj"},function(err,product){
                            if(!err && product){
                                var pbx=product.pbx[0].pbx;
                                var doc={
                                    pbx:pbx,
                                    account:account,
                                    extens:[queue1,queue2]
                                }
                                syncAcs.removeDefaultIvr(doc,function(isSuccess){
                                    if(isSuccess){
                                        mongo.db("zj").collection(constants.DB.platform_ivr).remove({_id:ivrId},function(err){
                                            if(!err){
                                                //free queue
                                                var queueSet={
                                                    account: '',
                                                    pbx: '',
                                                    type: '',
                                                    status: 'free',
                                                    lastAccount:account
                                                }
                                                mongo.db().collection('platform_queue').update({_id: queue1},{$set:queueSet});
                                                mongo.db().collection('platform_queue').update({_id: queue2},{$set: queueSet});
                                                index++;
                                                delIvr();
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    }else{
                                        logger.app.error(syncErrMsg+"["+account+"]");
                                        result.message=syncErrMsg+"["+account+"]";
                                        callback(result);
                                    }
                                });
                            }else{
                                index++;
                                delIvr();
//                                logger.app.error(syncErrMsg+"["+account+"]");
//                                result.message=syncErrMsg+"["+account+"]";
//                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                delIvr();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }

}
module.exports = handler;