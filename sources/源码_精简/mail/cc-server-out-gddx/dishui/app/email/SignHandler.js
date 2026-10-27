var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;


var handler = {
    querySignList: function (data, session, callback) {
        var result = {success: false};
        var condition = data||{};
        condition.account=session.account.account;
        condition.uid=session.user._id;
        utils.removeEmptyProperty(condition);

        mongo.db().collection(fields.DB_APP_MAILSIGN).find(condition,{sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result)
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    // dic
    getSignByUser:function(session,callback){
        var result = {success: false};
        var aid = session.account.account;
        var query ={
            account:aid,
            uid:session.user._id
        };
        mongo.db().collection(fields.DB_APP_MAILSIGN).find(query).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                callback(null, docs || []);
            } else {
                logger.app.error("getSignByUser error", err);
                callback(err);
            }
        });
    },
    _checkName:function(data,session,callback){
        var result = {success: false};
        var aid = session.account.account;
        var uid=session.user._id
        if(!data.name){
            result.success=true;
            callback(result);
            return;
        }
        var query={account:aid,uid:uid,name:data.name};
        if(data.isUpdae)query._id={"$ne":data._id};
        mongo.db().collection(fields.DB_APP_MAILSIGN).count(query, function (err, count) {
            if (!err) {
                if (count==0) {
                    result.success=true;
                    callback(result);
                } else {
                    result.message = '签名名称重复';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'checkName error!';
                callback(result);
            }
        });
    },
    insertSign : function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        var uid=session.user._id;
        data._id=id;
        data.account=aid;
        data.uid=uid;
        data.createTime= time;
        data.lastTime=time;
        data.isDefault=false;

        handler._checkName(data,session,function(checkRep){
            if(checkRep.success){
                mongo.db().collection(fields.DB_APP_MAILSIGN).insert(data,function(err){
                    if (!err) {
                        result.row=data;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('insertSign error:' + err.stack);
                        result.message = 'insertSign error!'+err.message;
                        callback(result);
                    }
                })
            } else{
                callback(checkRep);
            }
        });

    },
    updateSign: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account.account;
        var query={_id:data._id};
        var time=utils.DateTime.getCurrentDateTime();
        data.lastTime= time;
        data.isUpdae='update';
        handler._checkName(data,session,function(checkRep){
            if(checkRep.success){
                delete data.isUpdae;
                delete data._id;
                mongo.db().collection(fields.DB_APP_MAILSIGN).update(query,{$set:data},function (err) {
                    if (!err) {
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err.stack);
                        result.message = 'updateSign error!';
                        callback(result);
                    }
                });
            } else{
                callback(checkRep);
            }
        });
    },
    setSignDefault: function (data, session, callback) {
        var result = {success: false};
        var query={_id:data._id};
        var aid = session.account.account;
        var uid=session.user._id;
        var time=utils.DateTime.getCurrentDateTime();
        mongo.db().collection(fields.DB_APP_MAILSIGN).update({account:aid,uid:uid},{$set:{isDefault:false,lastTime:time}},{multi: true,w:1},function (err) {
            if (!err) {
                mongo.db().collection(fields.DB_APP_MAILSIGN).update(query,{$set:{isDefault:true,lastTime:time}},function (err) {
                    if(!err){
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err.stack);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err.stack);
                result.message = 'setSignDefault error!';
                callback(result);
            }
        });

    },
    removeSign: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id:data._id};
        mongo.db().collection(fields.DB_APP_MAILSIGN).remove(condition,function (err) {
            if (!err) {
                result.success=true;
                callback(result);
            } else {
                logger.app.error("removeSign error", err);
                callback(result);
            }
        });

    },
    getSignById:function(data,session,callback){
        var result = {success: false};
        var query={
            _id:data._id
        }
        mongo.db().collection(fields.DB_APP_MAILSIGN).findOne(query,function (err, doc) {
            if (!err) {
                result.success = true;
                result.row = doc;
                callback(result);
            } else {
                logger.app.error("getSignById error", err);
                callback(result);
            }
        });
    }

};

module.exports = handler;
