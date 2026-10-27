var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var userHandler = require(__baseDir + '/dishui/app/user/UserHandler');

exports.queryCdrPeer = function (data, session, callback) {
    var result = {success: false};
    var begin = 0;
    var pageSize = data.pageSize;
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    delete data.page;
    if (data.BEGIN_TIME != '' && data.END_TIME == '') {
        data.BEGIN_TIME = {"$gt": data.BEGIN_TIME};
    } else if (data.BEGIN_TIME == '' && data.END_TIME != '') {
        data.BEGIN_TIME = {"$lt": data.END_TIME};
    } else if (data.BEGIN_TIME == '' && data.END_TIME == '') {
        delete data.BEGIN_TIME;
    } else if (data.BEGIN_TIME != '' && data.END_TIME != '') {
        data.BEGIN_TIME = {"$gte": data.BEGIN_TIME, "$lte": data.END_TIME};
    }

//上下级连查询


    var findAgent = {
        account: session.user.account
    }
    var agents;
    if(data.selectedAgent)
        agents = data.selectedAgent.split(',');

    userHandler.queryUser(findAgent, session, function (userRes) {
        if (!data.includeSubordinate) {
            delete data.includeSubordinate;
        } else {
            var agentChooseList = data.selectedAgent.split(',');
            var agentList = userRes.list;
            for (var i = 0; i < agentChooseList.length; i++) {
                var agent_id = agentChooseList[i];
                utils.getLowUserArrayByParentId(agent_id, agentList, agents);
            }
            data.AGENT = {'$in': agents};
            result.queryArry = agents;
        }
        //
        delete data.reportType;
        delete data.selectedAgent;
        delete data.END_TIME;
        delete data.pageSize;
        delete data.includeSubordinate;


        data.ASTERISK = session.user.pbx;
        data.ACCOUNT_ID = session.user.account;
        var sort = {BEGIN_TIME: -1};
        if (session.user.type == "admin" || session.user.scope.call == 'all') {
            if (data.AGENT == '') {
                delete data.AGENT;
            }
        } else {
            utils.setUserLevelCondition(data, 'AGENT','call', session);

        }
        //没有选中
        if(!data.StartingAndEndingTime){
            // $(".cdr_peer_list_display").show();
            delete data.StartingAndEndingTime;

            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_CDR_PEER).find(data).sort(sort).limit(pageSize).skip(begin).toArray(function (err, docs) {
                if (err) {
                    logger.app.info(err.stack);
                    result.success = false;
                    result.message = "Query cdr peer failure.";
                    callback(result);
                    return;
                }
                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_CDR_PEER).find(data).count(function (err, docCount) {
                    if (err) {
                        logger.app.info(err.stack);
                        result.success = false;
                        result.message = "Query cdr peer count failure.";
                        callback(result);
                        return;
                    }
                    if (data.ACTION_TYPE == 'login') {
                        //var busyTime = 0;
                        var BusyTimeData = new Array();
                        var cdrPeerData = {
                            BusyTimeData: BusyTimeData,
                            docs: docs
                        }
                        exports.getBusyTime(cdrPeerData, session, function (busyRes) {
                            if (!busyRes.success) {
                                result.message = "get busy time failure";
                                result.success = false;
                                callback(result);
                                return;
                            }
                            result.list = busyRes.BusyTimeData;
                            result.count = docCount;
                            result.success = true;
                            callback(result);
                        });
                    } else {
                        result.list = docs;
                        result.count = docCount;
                        result.success = true;
                        callback(result);
                    }
                });
            });
        }else{
            // $(".cdr_peer_list_display").hide();
            delete data.StartingAndEndingTime;

            var matchQueue = data;
            var groupQueue ={_id: "$AGENT","BEGIN_TIME":{"$min":"$BEGIN_TIME"},"END_TIME":{"$max":"$END_TIME"},"EXTEN_TYPE":{$first:"$EXTEN_TYPE"}} ;
            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_CDR_PEER).aggregate([{$match:matchQueue},{$group:groupQueue}]).sort(sort).skip(begin).limit(pageSize).toArray(function (err, docs){
                if (err) {
                    logger.app.info(err.stack);
                    result.success = false;
                    result.message = "Query cdr peer failure.";
                    callback(result);
                    return;
                }
                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_CDR_PEER).aggregate([{$match:matchQueue},{$group:groupQueue}],function (err, data) {
                    if (err) {
                        logger.app.info(err.stack);
                        result.success = false;
                        result.message = "Query cdr peer failure.";
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.list = docs;
                    result.count = data.length;
                    callback(result);
                })


            });
        }

    });



}

exports.getBusyTime = function (data, session, callback) {
    var result = {success: false};
    if (data.docs && data.docs.length > 0) {
        var busyData = data.docs.shift();
        var queryData = {
            AGENT: busyData.AGENT,
            ACTION_TYPE: 'busy',
            ASTERISK: session.user.pbx,
            ACCOUNT_ID: session.user.account
        }
        queryData.BEGIN_TIME = {"$gte": busyData.BEGIN_TIME, "$lte": busyData.END_TIME};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_CDR_PEER).find(queryData).toArray(function (err, docs) {
            if (err) {
                logger.app.info(err.stack);
                result.success = false;
                result.message = "Query cdr peer failure.";
                callback(result);
                return;
            }
            if (docs && docs.length > 0) {
                var busyTime = 0;
                for (var i = 0; i < docs.length; i++) {
                    var timeLength = calculateTalkTime(docs[i].BEGIN_TIME, docs[i].END_TIME);
                    busyTime += timeLength;
                }
                busyData.busyTimeLength = busyTime;
            } else {
                busyData.busyTimeLength = 0;
            }
            data.BusyTimeData.push(busyData);
            if (data.docs.length > 0) {
                exports.getBusyTime(data, session, callback);
            } else {
                result.success = true;
                result.BusyTimeData = data.BusyTimeData;
                callback(result);
            }
        });
    } else {
        result.success = true;
        callback(result);
    }


}

function calculateTalkTime(beginTime, endTime) {
    if (beginTime == null || endTime == null || beginTime == undefined || endTime == undefined) {
        return 0;
    }
    var begin = new Date(Date.parse(beginTime.replace(/-/g, "/")));
    var end = new Date(Date.parse(endTime.replace(/-/g, "/")));

    var time = end.getTime() - begin.getTime();
    return time;
}
