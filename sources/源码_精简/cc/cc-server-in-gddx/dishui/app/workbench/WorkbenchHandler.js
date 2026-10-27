/**
 * Created by chenguang on 11/17/15.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var datetime = require('appUtil/DateTime');

exports.workbenchRefresh = function (data, session, callback) {
    var result = {success: false};
    result.serverCurrentTime = utils.DateTime.getCurrentTimestamp();
    var queryDate = {
        actionType : "date",
        owner : session.user._id
    };
    var dateSort={notifyTime:1};
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(queryDate, {sort:dateSort}).toArray(function (err, docs) {
        if (!err) {
            result.dateList = docs;
            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER)
             .aggregate([{$match:{owner:session.user._id}}
             ,{$group:{_id:"$status",count:{$sum:1} }}], function (err, aggRes) {
             if (!err) {
            /*//从统计表中查出客户状态
            var reportQuery = {"account":session.account.account,"user":session.user._id};
            var outFiled ={"_id":0,"user":0,"account":0};//去除字段
            mongo.reportDb().collection(fields.CC_CUSTOMER_STATUS_REPORT).findOne(reportQuery,outFiled,function (err, repo) {
                if (!err) {*/
                    result.custStatusList = aggRes;

                    //从统计表查询商机统计
                    //查询商机统计
                    var keys = {"user":1};
                    var condition = {account:session.account.account,"user":session.user._id};
                    var reduce = function ( curr, result ) {
                        if(!isNumber(curr.total)){
                            result.total += 0;
                        }else{
                            result.total += curr.total;
                        }

                        if(!isNumber(curr.deal)){
                            result.deal += 0;
                        }else{
                            result.deal += curr.deal;
                        }

                        if(!curr.money){
                            result.money += 0;
                        }else{
                            result.money += curr.money;
                        }

                        if(!isNumber(curr.lost)){
                            result.lost += 0;
                        }else{
                            result.lost += curr.lost;
                        }

                        if(!isNumber(curr.recycle)){
                            result.recycle += 0;
                        }else{
                            result.recycle += curr.recycle;
                        }

                        if(!isNumber(curr.invalid)){
                            result.invalid += 0;
                        }else{
                            result.invalid += curr.invalid;
                        }
                    };
                    var initial =  { total:0,deal:0,money:0,lost:0,invalid:0,recycle:0};
                    mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).group(keys, condition, initial, reduce ,function(err,docs){
                        if(!err){
                            if(docs.length == 0){
                                var sales = {total:0,deal:0,money:0,lost:0,invalid:0,recycle:0};
                                result.sales = sales;
                            }else{
                                result.sales = docs[0];
                            }

                            var toClaimFind = {master: "","roles.role": {$in: session.user.role || []},"status": "dealing"};
                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).count(toClaimFind, function(err, count){
                                if(!err){
                                    result.busToClaim = count;

                                    var toClaimFind = {master: session.user._id,"status": "dealing"};
                                    mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).count(toClaimFind, function(err, dealCount) {
                                        if(!err){
                                            result.busToDeal = dealCount;
                                            var _q={accountId:session.user.account,userId:session.user._id,status:'0',deal:'2'};
                                            mongo.db().collection(fields.DB_APP_NOTE).find(_q,{sort: {notifyTime: 1}}).toArray(function (err, noteList) {
                                                if (!err) {
                                                    result.noteList = noteList || [];
                                                    mongo.db().collection(fields.DB_APP_NOTE).update(_q,{$set:{deal:'1'}},{multi: true},function(err){
                                                        if(err){
                                                            logger.app.error(err);
                                                        }
                                                    })
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            })
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });

                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}

exports.getWorkbenchInfo = function (data, session, callback) {
    var result = {success: false};
    result.serverCurrentTime = utils.DateTime.getCurrentTimestamp();
    var queryDate = {
        actionType : "date",
        owner : session.user._id
    };
    var dateSort={notifyTime:1};
    var today = new Date();
    var tmonth = (today.getMonth()+1)<10?("0" + (today.getMonth()+1)):(today.getMonth()+1);
    var tdate = today.getDate()<10?("0"+today.getDate()):today.getDate();
    var todayStr = today.getFullYear() + "-" + tmonth + "-"+ tdate;
    var thmatch = {
        $match:{DISPOSAL_AGENT:session.user._id,
                END_TIME:{
                    $lt: todayStr + " 23:59:59",
                    $gt: todayStr + " 00:00:00"
                }
            }
        };
    var thgroup = {
        $group:{_id:"$CONNECT_TYPE",
            count:{$sum:1},
            linked:{$sum:{$cond:{if:{$eq:["$STATUS", "dealing"]},then:1,else:0}}},
            linkedTime:{$sum:"$CALL_TIME_LENGTH"}
            }
        }
    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).aggregate([thmatch,thgroup],function(err, summary){
        if(!err){
            result.todaySummary = summary;

            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(queryDate, {sort:dateSort}).toArray(function (err, docs) {
                if (!err) {
                    result.dateList = docs;

                    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER)
                        .aggregate([{$match:{owner:session.user._id}}
                            ,{$group:{_id:"$status",count:{$sum:1} }}], function (err, aggRes) {
                            if (!err) {
                                result.custStatusList = aggRes;

                                mongo.db().collection("customer_template").findOne({"account":session.user.account}, {"status":1}, function(err,custStatus){
                                    if(!err){
                                        if(custStatus != null){
                                            var statusDicMap = custStatus.status;
                                            if(statusDicMap != null){
                                                for(var i=0; i<result.custStatusList.length; i++){
                                                    var tempStat = statusDicMap[result.custStatusList[i]._id];
                                                    result.custStatusList[i].name = tempStat==null?"":tempStat;
                                                }
                                            }
                                        }

                                        var toClaimFind = {master: "","roles.role": {$in: session.user.role || []},"status": "dealing"};
                                        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).count(toClaimFind, function(err, count){
                                            if(!err){
                                                result.busToClaim = count;
                                                var toClaimFind = {master: session.user._id,"roles.role": {$in: session.user.role || []},"status": "dealing"};
                                                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).count(toClaimFind, function(err, dealCount) {
                                                    if(!err){
                                                        result.busToDeal = dealCount;

                                                        var match = {
                                                            agentId : session.user._id,
                                                            dayId : utils.DateTime.getCurrentDayId()
                                                        }
                                                        var group = {_id:"$platform",count:{$sum:"$accessSessionCount"}};

                                                        mongo.reportDb().collection("cc_im_agent_report")
                                                            .aggregate([{$match:match},{$group:group}], function (err, workRes) {
                                                                if (!err) {
                                                                    result.multichannel = workRes;
                                                                    result.success = true;
                                                                    callback(result);
                                                                } else {
                                                                    logger.app.error(err);
                                                                    result.message = "query multichannel failed";
                                                                    callback(result);
                                                                }
                                                            });
                                                    }else{
                                                        logger.app.error(err);
                                                        result.message = "query business busToDeal failed";
                                                        callback(result);
                                                    }
                                                });
                                            }else{
                                                logger.app.error(err);
                                                result.message = "query business busToClaim failed";
                                                callback(result);
                                            }
                                        });
                                    }else{
                                        logger.app.error(err);
                                        result.message = "query customer template failed";
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.error(err);
                                result.message = "query customer statistics failed";
                                callback(result);
                            }
                        });
                } else {
                    logger.app.error(err);
                    result.message = "query contact plan failed";
                    callback(result);
                }
            });
        }else{
            logger.app.error(err);
            result.message = "query call_sheet summary failed";
            callback(result);
        }
    });
}