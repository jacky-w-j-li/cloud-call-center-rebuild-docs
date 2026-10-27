/// add by kivi 2016-06-27 ///
// 技术顾问收支明细查询相关
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    /**
     * 查询收支明细
     *
     * @param data
     * @param session
     * @param callback
     */
    queryFinanceDetail: function (data, session, callback) {
        var result = {success: false};

        var condition = _impl._extractPageCondition(session,data);

        _impl._queryFinanceDetail(condition.query,condition.limit,condition.skip,function(err,totalCount,data){
            if(!err){
                result.success = true;
                result.list = data;
                result.count = totalCount;

                callback(result);
            }else{
                result.message = err.message;
                logger.app.warn("consultant queryFinanceDetail  error", err);
                callback(result);
            }
        });
    },
    /**
     * 查询收入状态,收入总额及有多少笔收入.
     *
     * @param data
     * @param session
     * @param callback
     */
    queryFinanceState: function (data, session, callback) {
        var result = {success: false};
        var query = _impl._extractCondition(session,data);

        _impl._queryFinanceState(query,function(err,data){
           if(!err){
               result.success = true;
               result.stat = data;

               callback(result);
           } else{
               result.message =err.message;
               logger.app.warn("consultant queryFinanceDetail  error", err);
               callback(result);
           }
        });
    }
}

_impl = {
    _queryFinanceDetail : function(query,limit,skip,callback){
        // console.log('查询条件', query);
        mongo.db().collection(constants.DB.bill_consultant_pay).count(query, function (err, count) {
            if (!err) {
                mongo.db().collection(constants.DB.bill_consultant_pay).find(query, {sort: {timestamp: -1}, limit: limit, skip: skip}).toArray(function (err, pays) {
                    if (!err) {
                        pays = pays || [];
                        var accountIds=[];
                        for (var i = 0; i < pays.length; i++) {
                            var record = pays[i];
                            accountIds.push(record.account);
                        }
                        _impl._queryAccountNameByIds(accountIds,function(err,accounts){
                            if(!err){
                                for (var i = 0; i < pays.length; i++) {
                                    var record = pays[i];
                                    record.accountName=accounts[record.account];
                                }
                                callback(null,count,pays);
                            } else{
                                callback(err);
                            }
                        });
                    } else {
                        callback(err);
                    }
                });
            } else {
                callback(err);
            }
        });
    },
    _queryFinanceState: function(query,callback){
        var keys = [];
        var init = {income:0,incomeNum:0,outlay:0,outlayNum:0};
        var aggregation = function (curr, result) {
            if(curr.source == 'payAccount') {
                result.income += (curr.income || 0);
                result.incomeNum += 1;
            }else{
                result.outlay += (curr.income || 0);
                result.outlayNum += 1;
            }
        };
        mongo.db().collection(constants.DB.bill_consultant_pay).group(keys, query, init, aggregation, function (err, datas) {
            if(!err){
                datas = datas || [];
                var stat={};
                if(datas.length==0){
                    stat={income:0,incomeNum:0,outlay:0,outlayNum:0};
                }else{
                    stat=datas[0];
                }

                callback(null,stat);
            }else{
                logger.app.error(err.message);
                callback(err);
            }
        });

    },
    _queryAccountNameByIds:function(ids, callback){
        var query={_id:{$in:ids||[]}};
        var fields={_id:1,name:1/*,companyName:1*/};
        mongo.db().collection(constants.DB.platform_account).find(query,fields).toArray(function (err, docs) {
            if(!err){
                var accounts={};
                for (var i = 0; i < docs.length; i++) {
                    var record = docs[i];
                    accounts[record._id]=record.name;
                }
                callback(null,accounts);
            }else{
                callback(err);
            }
        });
    },
    _extractPageCondition : function(session,data){
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query = _impl._extractCondition(session,data);
        var condition={
            query : query,
            limit : limit,
            skip : skip,
        };
        return condition;
    },
    _extractCondition : function(session,data){
        var query=data||{};
        query.consultant=session.user._id;
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.create_time = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.create_time) {
                query.create_time.$lte = endTime + " 23:59:59"
            } else {
                query.create_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }

        return query;
    },
    _isIncome : function(source){
        return source == constants.consultantSource.payAccount;
    }
}

module.exports = handler;