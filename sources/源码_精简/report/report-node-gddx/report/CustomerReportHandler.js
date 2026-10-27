/**
 * Created by yaxi on 2015-11-10.
 */

var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var reportHandler = require('./ReportHandler');

/**
 * 客户增长报表，放弃表头配置，因为表头是动态的。之后再考虑动态表头的实现。
 * @param data
 * @param callback
 */
exports.queryCustomerIncreaseReport = function (data, callback) {
    var result = {success: false};
    //reportHandler.getTableHeader({reportType: data.query.reportType, account: data.account},function(headerRes){
    //    if(!headerRes.success){
    //        callback(result);
    //        return;
    //    }
    //    result.tableHeader = headerRes.data;
    if (data.query.timeType == "month") {
        var condition = {
            account: data.account,
            month: data.query.yearReport + "" + data.query.monthReport
        };
        mongo.db().collection(fields.DB_CUSTOMER_INCREASE_REPORT).find(condition).toArray(function (err, docs) {
            if (!err) {
                result.data = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    } else { //year
       var condition = {
           account: data.account,
           year: data.query.yearReport + ""
       };
        var keys = data.keys || [];


        var group ={
            _id:"$month",
            unknow : {$sum:"$unknow"}
        };
        for(var i=0;i<keys.length;i++){
            group[keys[i]]={$sum:"$"+keys[i]};
        }


        mongo.db().collection(fields.DB_CUSTOMER_INCREASE_REPORT).aggregate({$match:condition},{$group:group},function(err , docs){
            if(!err){
                var docs = docs ||[];
                for(var i =0;i<docs.length;i++){
                    var day = docs[i]._id;
                    delete docs[i]._id;
                    docs[i].day = day;
                }
                result.data = docs;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
                return;
            }
        });


    }


    //});
};

exports.queryCustomerStatusReport = function (data, callback) {
    var result = {success: false};
    var condition = {
        account: data.account
    };
    exports.setUserLevelCondition2Cust(condition,'user',data);
    mongo.db().collection(fields.DB_CUSTOMER_STATUS_REPORT).find(condition).toArray(function (err, docs) {
        if (!err) {
            result.list = docs || [];
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
};

exports.getLowUserArrayByParentId = function(parentId,agentList/*账号所有坐席信息*/,agentArray/*存储下级ID的集合*/){
    var getMyAgent=function(pid){
        for (var i = 0; i < agentList.length; i++) {
            var obj = agentList[i];
            if(obj.parentId && obj.parentId==pid){
                agentArray.push(obj._id);
                getMyAgent(obj._id);
            }
        }
    }
    getMyAgent(parentId);
}

exports.setUserLevelCondition2Cust = function(query,field,session){
    var noExistVal="noExistVal";
    var scope=session.user.moduleUsers.customer;
    var lowUsers=scope||[];
    if(scope!="all"){
        if(query[field]){//指定所属范围查询条件
                if(typeof query[field] =='string') {
                    var count = 0;
                    for (var i = 0; i < lowUsers.length; i++) {
                        var uid = lowUsers[i];
                        if (uid == query[field]) {
                            count++;
                            break;
                        }
                    }
                    if (count == 0) {//没有权限则查不到结果
                        query[field] = noExistVal;
                    }
                }else{
                    query[field]=noExistVal;
                }
        }else{
            query[field]={$in:lowUsers};
        }
    }
}

exports.queryCustomerSaleAgentReport = function (data,callback) {
    var result = {success: false};
    var query = data.query;
    reportHandler.queryUser({account:data.account}, function(userRes){
        if(!userRes.success){
            callback(result);
            return;
        }
        result.agents = userRes.list;
        var keys = {
            "user":1
        }
        var condition = {
            account : data.account
        }
        if(query.timeType == "year"){
            condition.year = query.yearReport;
        }else if(query.timeType == "month"){
            condition.month = query.yearReport+query.monthReport;
        }else if(query.timeType == "day"){
            condition.day = query.yearReport+query.monthReport+query.dayReport;
        }else if(query.timeType == "other"){
            if(query.StartTime && query.EndTime){
                var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                var queryEndTimeDay = query.EndTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$gte":queryStarTimeDay,"$lte":queryEndTimeDay};
            }else if(query.StartTime){
                var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$gte":queryStarTimeDay};
            }else if(query.EndTime){
                var queryEndTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$lte":queryEndTimeDay};
            }

        }
        if(data != 'customer_report_sale_agent' && "selectedAgentList" in query && query.selectedAgentList != ""){
            var agents = query.selectedAgentList.split(',');

            if(query.includeSubordinate){
                var agentChooseList = query.selectedAgentList.split(',');
                var agentList = userRes.list;

                for(var i=0 ;i<agentChooseList.length;i++){
                    var agent_id = agentChooseList[i];
                    exports.getLowUserArrayByParentId(agent_id,agentList,agents);
                }

            }
            if(data.user.type == "admin" || data.user.moduleUsers.customer == 'all'){
                condition.user = {'$in' : agents};
            }else{
                var lowUsers = data.user.moduleUsers.customer||[];
                if(lowUsers && lowUsers.length >0){
                    var inAgents = [];
                    for(var i=0 ;i<agents.length;i++){
                        for(var j=0;j<lowUsers.length;j++){
                            if(lowUsers[j] == agents[i]){
                                inAgents.push(agents[i]);
                            }
                        }
                    }
                    condition.user = {'$in' : inAgents};
                }
            }
        }else{
            exports.setUserLevelCondition2Cust(condition,'user',data);
        }
        var initial = {
            total:0,
            deal:0,
            lost:0,
            invalid:0,
            money:0,
            recycle:0
        }
        //聚合函数
        var reduce = function( curr, result ){
            result.total += curr.total||0;
            result.deal += curr.deal||0;
            result.lost += curr.lost||0;
            result.invalid += curr.invalid||0;
            result.money += curr.money||0;
            result.recycle += curr.recycle||0;
        }
        mongo.db().collection(fields.DB_CUSTOMER_SALES_REPORT).group(keys,condition,initial,reduce,function (err, docs) {
            if (!err) {
                result.data = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });

    });

    };
exports.queryCustomerSaleReport = function(data,callback){
    var result = {success: false};
    if(data.query.timeType == "month"){
        var condition = {
            account: data.account,
            month: data.query.yearReport + "" + data.query.monthReport
        };
        mongo.db().collection(fields.DB_CUSTOMER_OPPORTUNITY_REPORT).find(condition).toArray(function (err, docs) {
            if (!err) {
                result.data = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }else if(data.query.timeType == 'year'){
        var keys = [];
        keys.push("total");
        keys.push("deal");
        keys.push("invalid");
        keys.push("lost");
        keys.push("money");
        var group ={
            _id:"$month"
        };
        var condition = {
            account: data.account,
            year: data.query.yearReport + ""
        };
        for(var i=0;i<keys.length;i++){
            group[keys[i]]={$sum:"$"+keys[i]};
        }
        mongo.db().collection(fields.DB_CUSTOMER_OPPORTUNITY_REPORT).aggregate({$match:condition},{$group:group},function(err , docs){
            if(!err){
                var docs = docs ||[];
                for(var i =0;i<docs.length;i++){
                    var day = docs[i]._id;
                    delete docs[i]._id;
                    docs[i].day = day;
                }
                result.data = docs;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
                return;
            }
        });
    }else if(data.query.timeType=='all'){
        var keys = {
            account:1
        }
        var condition = {
            account: data.account
        };
        var initial = {
            total:0,
            deal:0,
            lost:0,
            invalid:0,
            money:0
        }
        //聚合函数
        var reduce = function( curr, result ){
            result.total += curr.total||0;
            result.deal += curr.deal||0;
            result.lost += curr.lost||0;
            result.invalid += curr.invalid||0;
            result.money += curr.money||0;
        }
        mongo.db().collection(fields.DB_CUSTOMER_OPPORTUNITY_REPORT).group(keys,condition,initial,reduce,{},{},{},function (err, docs) {
            if (!err) {
                result.data = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }
};
exports.queryCustomerCommonReport = function(data,callback){
    var query = data.query;
    var result = {success: false};
    var keys = {
        "categoryId":1
    }
    var condition = {
        account : data.account
    }
    if(query.timeType == "year"){
        condition.year = query.yearReport;
    }else if(query.timeType == "month"){
        condition.month = query.yearReport+query.monthReport;
    }else if(query.timeType == "day"){
        condition.day = query.yearReport+query.monthReport+query.dayReport;
    }else if(query.timeType == "other"){
        if(query.StartTime && query.EndTime){
            var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            var queryEndTimeDay = query.EndTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$gte":queryStarTimeDay,"$lte":queryEndTimeDay};
        }else if(query.StartTime){
            var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$gte":queryStarTimeDay};
        }else if(query.EndTime){
            var queryEndTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$lte":queryEndTimeDay};
        }

    }
    if(data != 'customer_report_common' && query.selectedPoolList && query.selectedPoolList != ""){
        var pools = query.selectedPoolList.split(',');
        condition.categoryId = {'$in' : pools};
    }
    var initial = {
        add:0,
        assign:0,
        surplus:0
    }
    //聚合函数
    var reduce = function( curr, result ){
        result.add += curr.add||0;
        result.assign += curr.assign||0;
        result.surplus += curr.surplus||0;
    }
    mongo.db().collection(fields.DB_CUSTOMER_COMMON_REPORT).group(keys,condition,initial,reduce,function (err, docs) {
        if (!err) {
            result.data = docs || [];
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
};

exports.queryCustomerCommonAgentReport = function(data,callback){
    var query = data.query;
    var categoryId = query.categoryId;
    var result = {success: false};
    reportHandler.queryUser({account:data.account}, function(userRes){
        if(!userRes.success){
            callback(result);
            return;
        }
        result.agents = userRes.list;
        var keys = {
            "user":1
        }
        var condition = {
            account : data.account,
            categoryId: categoryId
        }
        if(query.timeType == "year"){
            condition.year = query.yearReport;
        }else if(query.timeType == "month"){
            condition.month = query.yearReport+query.monthReport;
        }else if(query.timeType == "day"){
            condition.day = query.yearReport+query.monthReport+query.dayReport;
        }else if(query.timeType == "other"){
            if(query.StartTime && query.EndTime){
                var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                var queryEndTimeDay = query.EndTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$gte":queryStarTimeDay,"$lte":queryEndTimeDay};
            }else if(query.StartTime){
                var queryStarTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$gte":queryStarTimeDay};
            }else if(query.EndTime){
                var queryEndTimeDay = query.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
                condition.day = {"$lte":queryEndTimeDay};
            }

        }
        if(data != 'customer_report_common_agent' &&  query.selectedAgentList && query.selectedAgentList != ""){
            var agents = query.selectedAgentList.split(',');

            if(query.includeSubordinate){
                var agentChooseList = query.selectedAgentList.split(',');
                var agentList = userRes.list;

                for(var i=0 ;i<agentChooseList.length;i++){
                    var agent_id = agentChooseList[i];
                    exports.getLowUserArrayByParentId(agent_id,agentList,agents);
                }

            }
            if(data.user.type == "admin" || data.user.moduleUsers.customer == 'all'){
                condition.user = {'$in' : agents};
            }else{
                var lowUsers = data.user.moduleUsers.customer||[];
                if(lowUsers && lowUsers.length >0){
                    var inAgents = [];
                    for(var i=0 ;i<agents.length;i++){
                        for(var j=0;j<lowUsers.length;j++){
                            if(lowUsers[j] == agents[i]){
                                inAgents.push(agents[i]);
                            }
                        }
                    }
                    condition.user = {'$in' : inAgents};
                }
            }
        }else{
            exports.setUserLevelCondition2Cust(condition,'user',data);
        }
        var initial = {
            assign:0,
            recycle:0
        }
        //聚合函数
        var reduce = function( curr, result ){
            result.assign += curr.assign||0;
            result.recycle += curr.recycle||0;
        }
        mongo.db().collection(fields.DB_CUSTOMER_COMMON_USER_REPORT).group(keys,condition,initial,reduce,function (err, docs) {
            if (!err) {
                result.data = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });

    });
};

exports.queryChangeLogReport = function(data,callback){
    var result ={success:false};
    var page=data.page;
    delete data.page;
    var limit = data.limit||20;
    delete data.limit;
    var condition = data;
    utils.removeEmptyProperty(condition);
    var skip = (page - 1) * limit;

    mongo.db().collection(fields.DB_CUSTOMER_CHANGE_LOG).find(condition,{sort:{lastTime : -1},limit: limit, skip: skip}).toArray(function(err , docs){
        if(!err){
            result.list = docs || [];
            result.success = true;
            callback(result);
        }else{
            logger.app.error(err);
            callback(result);
        }
    });
};