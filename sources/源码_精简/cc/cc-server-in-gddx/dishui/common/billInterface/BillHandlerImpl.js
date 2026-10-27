/**
 * Created with JetBrains WebStorm.
 * User: zhangyang
 * Date: 13-7-2
 * Time: 上午11:51
 * To change this template use File | Settings | File Templates.
 */
//var httpProvider = require('appHttp');
//var utils = require('appUtil/Utils');
//var mongo = require('appDb/MongoDb');
//var appConfig = require('appConfig').conf;
//var fields = require(__baseDir + '/dishui/common/Fields');
//
//
//exports.billLoginByUser = function(data,callback){
//    var result = {success:false};
//    var session = {_id:utils.UUID.generateUuid()};
//    console.log();
//    var user = {
//        _id:session._id,
//        accountId:data.accountId,
//        loginName:data.username,
//        mobile:data.mobilePhone,
//        name:data.userChName,
//        email : data.email,
//        type:data.type,
//        role:['billManager']
//    };
//    session.user = user;
//    session.timeFlush = utils.DateTime.getCurrentTimestamp();
//    mongo.db().collection(fields.DB_APP_SESSION).save(session,function(err){
//        if(!err){
//            result.success = true;
//            result.sessionId = session._id;
//            callback(result);
//        }else{
//            result.message = 'get session error!';
//            callback(result);
//        }
//    });
//}

