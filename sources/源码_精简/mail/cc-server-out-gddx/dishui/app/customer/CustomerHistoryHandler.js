/**
 * 提供客户历史相关的操作供 其他模块调用
 *
 * 历史数据字段
 * _id: uuid
 * type: callin/callout/weixin/chat/mail/business/note
 * customer: 客户id
 * createTime:
 * businessType: 业务类型（自定义）
 * agent: 座席
 * status: 状态（不同的数据不一样，通话是通话的状态，业务是业务的步骤，其他的都用自己的状态））
 * lastUpdateTime:
 * comments: 备注  历史可以再页面上添加备注
 * beginTime: 开始时间
 * endTime: 结束时间
 * dispose: 处理结果  （客户自定义）
 */

var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');


var  handler = {
    /**
     * 添加历史
     */
    addHistroy : function (history, accountOrSession, callback){
        if(accountOrSession){
            if(typeof accountOrSession == 'object'){//session
                mongo.db(accountOrSession).collection(accountOrSession.account.account + "_history").insert(history,function(err){
                    if(!err){
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            } else if(typeof accountOrSession == 'string'){//accountId
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id:accountOrSession + "_cc"},function(err , dbProduct){
                    if(!err && dbProduct){
                        var dataDb = dbProduct.dataDB || "";
                        mongo.db(dataDb).collection(accountOrSession + "_history").insert(history,function(err){
                            if(!err){
                                callback(true);
                            } else {
                                callback(false);
                            }
                        });
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    },
    /**
     * 更新历史
     */
    updateHistory : function(_id, data , accountOrSession , callback ){
        if(accountOrSession){
            if(typeof accountOrSession == 'object'){//session
                mongo.db(accountOrSession).collection(accountOrSession.account.account + "_history").update({_id:_id},{$set:data},function(err){
                    if(!err){
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            } else if(typeof accountOrSession == 'string'){//accountId
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id:accountOrSession + "_cc"},function(err , dbProduct){
                    if(!err && dbProduct){
                        var dataDb = dbProduct.dataDB || "";
                        mongo.db(dataDb).collection(accountOrSession + "_history").update({_id:_id},{$set:data},function(err){
                            if(!err){
                                callback(true);
                            } else {
                                callback(false);
                            }
                        });
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    },
    queryCustCommonHistory : function( data , session , callback){
        var result = {success : false};
        var page=data.page;
        delete data.page;
        var limit = data.limit||20;
        delete data.limit;
        var skip = (page - 1) * limit;
        var condition = data;
        utils.removeEmptyProperty(condition);
        var _date=data.date;
        if(_date){
            var beginTime="";
            var endTime=utils.DateTime.getCurrentDate()+" 23:59:59";;
            if(_date=='week'){
                beginTime=utils.DateTime.getStartDate(6)+" 00:00:00";
            }else if(_date=='month'){
                beginTime=utils.DateTime.getStartDate(30)+" 00:00:00";
            }else if(_date=='month3'){
                beginTime=utils.DateTime.getStartDate(90)+" 00:00:00";
            }
            data.createTime={$lte:endTime,$gte:beginTime};
            delete data.date;
        }
        if(!condition.customer){
            result.data = {
                count : 0,
                list : []
            }
            result.success = true;
            callback(result);
            return;
        }
        //如果没传type,过滤掉在线客服的联系历史
        if(!condition.type){
            condition.type = {$ne:"chat"};
        }
        //
        mongo.db(session).collection(session.account.account + "_history").find(condition,{sort:{createTime : -1},limit: limit,skip:skip}).toArray(function(err , docs){
            if(!err){
                docs = docs || [];
                mongo.db(session).collection(session.account.account + "_history").count(condition,function(err , count ){
                    if(!err){
                        count = count || 0;
                        result.data = {
                            count : count,
                            list : docs
                        }
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("query customer common history count error !" ,err);
                        result.message  = "query customer common history count  error !";
                        callback(result);
                    }
                });
            } else {
                logger.app.error("query customer common history error !" ,err);
                result.message  = "query customer common history error !";
                callback(result);
            }
        });



    }
};


module.exports = handler;
