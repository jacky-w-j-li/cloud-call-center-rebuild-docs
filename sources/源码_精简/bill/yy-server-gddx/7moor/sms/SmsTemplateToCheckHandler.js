
var logger = require('appLog');
var utils = require('appUtil/Utils');
var datetime = require('appUtil/DateTime');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");


exports.getSmsSignDic = function (session, callback) {
    var query = {
        account: session.user.account
    };
    mongo.db('cc').collection('app_sms_sign').find(query).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

exports.getSmsTemlateDic = function (session, callback) {
    var query = {
        account: session.user.account
    };
    mongo.db('cc').collection('app_sms_template').find(query).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

exports.postSmsTemplate = function(data,session,callback){
    var result = {'success':false};
    data.account = session.account._id;
    mongo.db('cc').collection('app_sms_template').find({account:data.account},{num:1}).toArray(function (err, docs) {
        var max = 0;
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        for(var i=0;i<docs.length;i++){
            var now = parseInt(docs[i].num);
            if( now >= max){
                max = now ;
            }
        }
        data.num = max + 1;
        data._id = data.account + '_' +data.num;
        data.messages = [];
        data.status = 0 ;
        data.createTime = data.createTime || datetime.getCurrentDateTime();
        data.lastUpdateTime = datetime.getCurrentDateTime();
        data.vars = getVarsFromStr(data.content);
        mongo.db('cc').collection('app_sms_template').insert(data,function(err){
            if(!err){
                result.success = true;
            }else{
                logger.app.error("postSmsTemplate error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    });
}
exports.updateSmsTemplateToCheck = function(data,session,callback){
    var result = {'success':false};
    data.vars = getVarsFromStr(data.content);
    var newData = {$set:{sign:data.sign,name:data.name,content:data.content,vars:data.vars,templateType:data.templateType}};
    mongo.db('cc').collection('app_sms_template').update({_id:data._id},newData,function(err){
        if(!err){
            result.success = true;
        }else{
            logger.app.error("updateSmsTemplateToCheck error!", err);
            result.message = "db error!";
        }
        callback(result);
    });
}
exports.querySmsTemplateToCheck = function(data,session,callback){
    var result = {success: false};
    var sort = {createTime: -1};
    var begin = 0;
    var pageSize = 10;
    if (data.pageSize) {
        pageSize = parseInt(data.pageSize);
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    data = formatCondition(data);
    delete data.page;
    delete data.pageSize;
    utils.removeEmptyProperty(data);
    if (data.submitTime) {
        data.createTime = data.submitTime;
        delete data.submitTime;
    }
    data.account = session.account._id;
    if(data.name){
        data.name = new RegExp("^.*"+data.name+".*");
    }
    mongo.db('cc').collection('app_sms_template').find(data, {sort: sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db('cc').collection('app_sms_template').find(data, {sort: sort}).count(function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}
exports.querySmsTemplateToCheckMessage = function(data,session,callback){
    mongo.db('cc').collection('app_sms_template').findOne({_id:data},function(err,doc){
        var result = {success:false};
        if(!err){
            result.data = doc;
            result.success = true;
        }
        callback(result);
    });
}
exports.addSmsTemplateToCheckMessages = function(data,session,callback){
    var result = {success:false};
    mongo.db('cc').collection('app_sms_template').findOne({_id:data._id},function(err,doc){
        if(!err){
            var messages = [];
            for(var a=0;a<doc.messages.length;a++){
                messages.push(doc.messages[a]);
            }
            messages.push({from:data.from,time:data.time,content:data.content});
            var newData = {$set:{messages:messages}};
            mongo.db('cc').collection('app_sms_template').update({_id:data._id},newData,function(err){
                if(!err){
                    result.success = true;
                    callback(result);
                }
            });
        }
    });

}
exports.cancelSmsTemplateToCheck = function(data,session,callback){
    var result = {success:false};
    var newData = {$set:{status:3}};
    mongo.db('cc').collection('app_sms_template').update({_id:data._id},newData,function(err){
        if(!err){
            result.success = true;
        }
        callback(result);
    });
}
exports.getCCDicCodes = function(data,session,callback){
    var result = {success:false};
    mongo.db('cc').collection('app_dic_codes').find({code_type:data.code_type}).toArray(function(err,docs){
        if(!err){
            result.success = true;
            result.list = docs;
        }
        callback(result);
    });
}
exports.getAccountSigns = function(data,session,callback){
    var result = {success:false};
    mongo.db('cc').collection('app_sms_sign').find({account:data.account}).toArray(function(err,docs){
        if(!err){
            result.success = true;
            result.list = docs;
        }
        callback(result);
    });
}
function formatCondition(data) {
    if (data.BEGIN_TIME || data.END_TIME) {
        data.submitTime = {};
        if (data.BEGIN_TIME) {
            data.submitTime["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if (data.END_TIME) {
            data.submitTime["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    return data;
}
function getVarsFromStr(str){
    if(str.indexOf('{') == -1 || str.indexOf('}') == -1){
        return 0;
    }
    var pattern = /\{[0-9]{1,2}\}/g;
    var res = str.match(pattern);
    return res.length;
}