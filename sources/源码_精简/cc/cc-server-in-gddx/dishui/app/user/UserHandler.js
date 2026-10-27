
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var nodeUtil = require('util');
var md5 = require('crypto/md5');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var objectUtil = require('appUtil/ObjectUtil');
var ivrUserHandler = require(__baseDir + '/dishui/config/ivr/UserHandler');

//var roles = require(__baseDir + '/dishui/manager/account/RoleHandler');
var cust = require(__baseDir + '/dishui/app/customer/CustomerHandler');

module.exports.getMenu = function(action, session, callback){
    var role = session.user.role;

    var type = session.user.type;
    var query = {
        _id:{"$in":role}
    };
    mongo.db().collection('app_role').find(query).toArray(function(err, roleData){
        if(roleData) {
            mongo.db().collection('app_menu').findOne({type: type}, function(err, menu){
                if(menu) {
                    var matchedMenu=[];
                    for (var i = 0; i < roleData.length; i++) {
                        var obj = roleData[i];
                        var tmp=checkMenu(menu.menu, obj.menu);
                        for(var j=0;j<tmp.length;j++){
                            if(!contains(matchedMenu, tmp[j])){
                                matchedMenu.push(tmp[j]) ;
                            }
                        }
                    }
                    callback({success:true, data: matchedMenu});
                } else {
                    callback({success: false});
                }
            });
        } else {
            callback({success: false});
        }
    });
}

checkMenu = function(menu, roleOfMenu) {
    var matchedMenu = [];
    for(var i in menu){
        var item = menu[i];
        if(item.type == 'node') {
            var subMenu = checkMenu(item.children, roleOfMenu);
            if(subMenu.length > 0) {
                item.children = subMenu;
                matchedMenu.push(item);
            }
        } else if(item.type == 'leaf') {
            if(contains(roleOfMenu, item.id)){
                matchedMenu.push(item);
            }
        }
    }
    return matchedMenu;
}

contains = function(array, value) {
    for(var i in array) {
        var item = array[i];
        if(item == value) {
            return true;
        }
    }
    return false;
}

checkMenuLeaf = function(menu) {
    var matchedMenu = {};
    for(var i in menu){
        var item = menu[i];
        if(item.type == 'node') {
            var subMenu=checkMenuLeaf(item.children);
            for(var j in subMenu){
                matchedMenu[j]=subMenu[j];
            }
        } else if(item.type == 'leaf') {
            matchedMenu[item.id]=item.name;
        }
    }
    return matchedMenu;
}

module.exports.getDicCache = function(action, session, callback){
    //get gloable dic
    var result = {success:false};
    mongo.db().collection(fields.DB_TBL_GENERAL_CODES).find({},{sort:{code_type:-1,code_order:1}}).toArray(function(err,docs){
        if(!err){
            docs = docs || [];
            var dicMap = {};
            dicMap=proceeCodeForMap(docs);
            mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).find({status:'enable'},{sort:{_id:-1}}).toArray(function(err,docs){
                if(!err){
                    docs = docs || [];
                    dicMap.pbx = docs;
                    //TODO
                    //province and city codes, name

                    //get pbx

                    //sip numbers of user

                    //get customer dic

                    //get task dic

                    //priority of data and action
                    var aid=session.user.account;

                    getAgentsInfo(aid,function(data){
                            if(data.success){
                                dicMap.agents=data.data||{};
                                cust.getTmplByAccId(aid,function(rep){
                                    if(rep.success){
                                        dicMap.custTmpls=rep.data||{};
                                        mongo.db().collection('app_menu').findOne({type:"agent"}, function(err, menu){
                                            if(!err) {
                                                var menus = checkMenuLeaf(menu.menu);
                                                dicMap.allmenu=menus||{};
                                                result.dicMap = dicMap;
                                                result.success = true;
                                                callback(result);
                                            }else{
                                                logger.app.error(err);
                                                result.message = 'get menu exception!!';
                                                callback(result);
                                            }

                                        });
                                    } else{
                                        callback(rep);
                                    }

                                })  ;

                            } else{
                                callback(data);
                            }
                    });



                }else{
                    logger.app.error(err);
                    result.message = 'db find pbx data exception!!';
                    callback(result);
                }
            });
        }else{
            logger.app.error(err);
            result.message = 'db find code data exception!!';
            callback(result);
        }
    });
    //fields
    //province and city codes, name

    //get pbx

    //sip numbers of user

    //get customer dic

    //get task dic

    //priority of data and action
}

function proceeCodeForMap(docs){
    docs = docs || [];
    var result = {};
    var keys =[];
    for(var i =0 ;i<docs.length;i++){
        var data = docs[i];
        if(keys.contains(data.code_type)){
            result[data.code_type].push(data);
        }else{
            keys.push(data.code_type);
            result[data.code_type] =[data];
        }
    }
    return result;
}

function getAgentsInfo(accId,callback){
    var result = {success: false};
    var agents={};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account:accId,product:'cc'}).toArray(function(err,docs){
        if(!err){
            result.success = true;
            for (var i = 0; i < docs.length; i++) {
                agents[docs[i]._id]=docs[i];
            }
            result.data=agents;
        }else{
            logger.app.error('db getAgentsInfo error:' + err.stack);
            result.message = '404 agents not found!';
        }
        callback(result) ;
    });
}

module.exports.getUserDic = function (session, callback) {
    var accountId = session.user.account;
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: accountId, product:'cc'},{sort:{exten:1}}).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}

exports.queryUser = function(data, session, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(data).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query user failure: " + nodeUtil.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.editUser = function (data, session, callback) {
    var result = {success:false};
    delete data.attachName;
    if(data.im_icon){
        data.im_icon = "http://7xj0za.com2.z0.glb.qiniucdn.com/" + data.im_icon;
    }
    exports.queryUser({_id:data._id}, null, function(queryResult){
        if(!queryResult.success) {
            callback(queryResult);
            return;
        }
        if(!queryResult.list || queryResult.list.length < 1){
            result.message = 'User not found: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        var user = queryResult.list[0];
        if(data.password){
            data.passwordLastUpdate = new Date().getTime();
            data.passwordLastUpdateTime = utils.getCurrentDate();
        }
        objectUtil.mixin(user, data);
        user.action = 'update';
        ivrUserHandler.updateUser(user, null, function(updateResult){
            if(!updateResult.success){
                callback(updateResult);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
//    var result = {success: false};
//    var action = 'action=editUser&json=' + JSON.stringify(data);
//    httpProvider.sendGet(config.managerServerUrl + "?" + action, function(err, res){
//        if(err) {
//            result.message = 'Sent require to manager server error: ' + data;
//            callback(result);
//            return;
//        }
//        var resData = JSON.parse(res.toString());
//        if(resData.resultCode != '0000') {
//            result.message = resData.resultMsg;
//            callback(result);
//            return;
//        }
//        result.success = true;
//        //console.dir(data);
//        callback(result);
//    });
}

exports.editUser2Im = function (data, callback) {
    var result = {success:false};
    exports.queryUser({_id:data._id}, null, function(queryResult){
        if(!queryResult.success) {
            callback(queryResult);
            return;
        }
        if(!queryResult.list || queryResult.list.length < 1){
            result.message = 'User not found: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        var user = queryResult.list[0];
        objectUtil.mixin(user, data);
        user.action = 'update';
        ivrUserHandler.updateUser(user, null, function(updateResult){
            if(!updateResult.success){
                callback(updateResult);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}


exports.setUserChannel = function (data, session, callback) {
    var result = {success:false};
    var uid=data._id;
    delete data._id;
    var query={_id:uid};
    mongo.db("bill").collection("platform_user").update(query,{$set:data},function (err) {
        if (!err) {
            result.success=true;
            callback(result);
        }else{
            logger.app.error(err);
            callback(err);
        }
    });
}

exports.getAccountInfo = function (data, session, callback) {
    var result = {success: false};
    var aid=session.user.account;

    var isOurSales=function(key){
        var ourSales=['mysales','hd','hn'];
        for (var i = 0; i < ourSales.length; i++) {
            var obj = ourSales[i];
            if(obj==key){
                return true;
            }
        }
        return false;
    }

    mongo.db("bill").collection("platform_account").findOne({_id:aid}, function (err, acc) {
        if (!err && acc) {
            var userId=acc.createUser;
            var createMethod=acc.createMethod;
            acc.salesUser=null;
            if(createMethod=='proxy'){
                mongo.db("bill").collection("bill_system_user").findOne({_id:userId},{fields:{name:1,linkManName:1,linkManEmail:1,linkManPhone:1,proxyType:1}},function (err, userDB) {
                    if (!err) {
                        if(userDB && isOurSales(userDB.proxyType)){
                            acc.salesUser=userDB;
                        }
                        result.row=acc;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(err);
                    }
                });
            }else{
                result.row=acc;
                result.success=true;
                callback(result);
            }
        }else{
            logger.app.error(err);
            callback(result);
        }
    });
}

exports.getToken = function (data, session, callback) {
    var result = {success:false};
    var uuid = utils.UUID.generateUuid();
    var loginName = data.loginName;
    var password = data.password;
    var userid = session.user._id;
    var account = session.account.account;
    var nowTime = utils.getCurrentDate();
    var timeStamp = new Date().getTime();

    var token = md5.hex_md5(uuid+account+loginName+password+timeStamp);

    var data = {
        _id : uuid,
        account : account,
        userid : userid,
        loginName : loginName,
        password : password,
        timeStamp : timeStamp,
        creatTime : nowTime,
        token : token
    };

    mongo.db("bill").collection(fields.DB_PLATFORM_TOKEN).insert(data,{w:1},function (err){
        if (!err) {
            result.success=true;
            result.token=token;
            result.tokenId=uuid;
            callback(result);
        }else{
            logger.app.error(err);
            callback(err);
        }
    });
}