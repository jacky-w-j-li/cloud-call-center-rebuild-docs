/**
 * Created by yaxi on 2016-01-19.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");


exports.insertOneFaq = function(data, session, callback){
    var result = {success: false};
    data.account = session.user.account;
    data.insertTime = utils.getCurrentDate();
    data.updatedTime = utils.getCurrentDate();
    data.updator = session.user._id;
    data._id = utils.UUID.generateUuid();
    mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).insert(data, function (err) {
        if (!err) {
            result.success = true;
        } else {
            logger.app.error('db faq insert error:' + JSON.stringify(data) + "-" + err.stack);
            result.message = 'db faq insert error!' + err.message;

        }
        callback(result);
    });
};

exports.updateFaqById = function(data, session, callback){
    var result = {success: false};
    var update = {question: data.question, answer: data.answer, type: data.type, assign: data.assign}

    mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).update({_id: data._id}, {$set:update}, function(err){
        if (!err) {
            result.success = true;
        } else {
            logger.app.error('db faq update error:' + JSON.stringify(data) + "-" + err.stack);
            result.message = 'db faq update error!' + err.message;

        }

        callback(result);
    });
};

exports.queryFaq = function(data, session, callback){
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;

    if(!condition.account){
        condition.account = session.user.account;
    }
    utils.removeEmptyProperty(condition);
    mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function(err, docs){
        if(!err){
            result.success = true;
            result.list = docs;
            mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            logger.app.error('db faq find error:' + JSON.stringify(data) + "-" + err.stack);
            result.message = 'db faq find error!' + err.message;
            result.list = [];
            result.count = 0;
            callback(result);
        }

    });
};

exports.queryFaqById = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).findOne(data).toArray(function(err, faq){
        if(!err){
            result.success = true;
            result.faq = faq;
        }else{
            logger.app.error('db faq findOne error:' + JSON.stringify(data) + "-" + err.stack);
            result.message = 'db faq findOne error!' + err.message;

        }
        callback(result);
    });
};

exports.deleteFaqById = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_FAQ).deleteOne(data, function(err){
        if(!err){
            result.success = true;
        }else{
            logger.app.error('db faq deleteOne error:' + JSON.stringify(data) + "-" + err.stack);
            result.message = 'db faq deleteOne error!' + err.message;
        }
        callback(result);
    })
}



