var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var fs = require("fs");

var handler = {
    getDicById: function (data, session, callback) {
        var result = {success: false};
        var query={_id:data._id};
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.row = row;
            } else {
                logger.app.error(err);
            }
            callback(result);
        });
    },
    getDicByType: function (data, session, callback) {
        var result = {success: false};
        var type=data.type;
        var query={account:session.user.account,type:type};
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.row = row;
            } else {
                logger.app.error(err);
            }
            callback(result);
        });
    },
    //set default dic
    saveDic: function (data, session, callback) {
        var result = {success: false};
        var item=data;
        var id=utils.UUID.generateUuid();
        var time=utils.getCurrentDate();

        item._id=id;
        item.createTime=time;
        item.account=session.user.account;
        //item.type="webchat";
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).insert(item, function (err) {
            if (!err) {
                result.success = true;
                result.row = item;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _getItemField:function(level){
        var field="options";
        var ary=level.split("_");
        var len=ary.length;
        if(len==1){
            field="options";
        }else if(len==2){
            field="options."+ary[0]+".options";
        }else if(len==3){
            field="options."+ary[0]+".options."+ary[1]+".options";
        }
        return field;
    },
    _getItemUpdateField:function(level){
        var field="options.name";
        var ary=level.split("_");
        var len=ary.length;
        if(len==1){
            field="options."+ary[0]+".name";
        }else if(len==2){
            field="options."+ary[0]+".options."+ary[1]+".name";
        }else if(len==3){
            field="options."+ary[0]+".options."+ary[1]+".options."+ary[2]+".name";
        }
        return field;
    },
    saveDicItem: function (data, session, callback) {
        var result = {success: false};
        var item={};
        if(!data._id){//首次创建字典
            handler.getDicByType(data,session,function(rep){
                if(rep.success){
                    if(!rep.row){
                        var id=utils.UUID.generateUuid();
                        var time=utils.getCurrentDate();
                        item._id=id;
                        item.createTime=time;
                        item.account=session.user.account;
                        item.options=[{key:data.key,name:data.name}];
                        item.type="webchat";
                        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).insert(item, function (err) {
                            if (!err) {
                                result.success = true;
                                result.row = item;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.message="字典已经被他人创建，请重新登录进行配置！";
                        callback(result);
                    }
                }else{
                    callback(result);
                }
            })
        }else{
            var query={_id:data._id};
            var flag=data.flag;
            var level=data.level;
            if(flag=='add'){
                var param={key:data.key,name:data.name};
                var field=handler._getItemField(level);
                var _set={};
                _set[field]=param;
                mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findAndModify(query,[],{$push: _set}, {new:true},function (err,row) {
                    if (!err) {
                        result.success = true;
                        result.row = row;
                    } else {
                        logger.app.error(err);
                    }
                    callback(result);
                });
            }else{
                var field=handler._getItemUpdateField(level);
                console.info("field=="+field);
                var _set={};
                _set[field]=data.name;
                mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findAndModify(query,[],{$set: _set}, {new:true},function (err,row) {
                    if (!err) {
                        result.success = true;
                        result.row = row;
                    } else {
                        logger.app.error(err);
                    }
                    callback(result);
                });
            }
        }
    },
    delDicItem: function (data, session, callback) {
        var result = {success: false};
        var query={_id:data._id};
        var level=data.level;
        var param={key:data.key};

        var field=handler._getItemField(level);
        var _set={};
        _set[field]=param;
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findAndModify(query,[],{$pull: _set}, {new:true},function (err,row) {
            if (!err) {
                result.success = true;
                result.row = row;
            } else {
                logger.app.error(err);
            }
            callback(result);
        });
    },

    //for dic
    getChannelDic : function (session, callback) {
        var accountId = session.user.account;
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).find({account: accountId},{}).toArray(function (err, docs) {
            if (!err) {
                callback(null, docs || []);
            } else {
                callback(err);
            }
        });
    },

    //for csr 客户端满意度配置
    getCSRDic : function(data,session,callback){
        var result = {success: false};
        var type=data.type;
        var query={account:session.user.account,type:type};
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.row = row;
            } else {
                logger.app.error(err);
            }
            callback(result);
        });
    },
    saveCSRDic : function(data,session,callback){
        if(data._id == '_#_id#_'){
            data._id = '';
        }
        data.options = sortObj(data.options,'index','asc');
        var query={account:session.user.account,type:'webchatCSR'};
        mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findOne(query, function (err, row) {
            if (!err && row && row._id) {
                data._id = row._id;
            }
            var result = {success: false};
            var item=data;

            if(!item._id){
                var id=utils.UUID.generateUuid();
                var time=utils.getCurrentDate();

                item._id=id;
                item.createTime=time;
                item.account=session.user.account;
                //item.type="webchat";
                mongo.db().collection(fields.DB_APP_CHANNEL_DIC).insert(item, function (err) {
                    if (!err) {
                        result.success = true;
                        result.row = item;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                var query={_id:item._id};
                delete item._id;
                mongo.db().collection(fields.DB_APP_CHANNEL_DIC).update(query, {$set: item}, function (err) {
                    if (!err) {
                        result.success = true;
                    } else {
                        logger.app.error(err);
                    }
                    callback(result);
                });
            }
        });
    }


}

/**
 * 对象数组快速排序
 * @param arr Array 对象数组
 * @param key string 用于排序的属性
 * @param dir asc升序、desc降序
 * @example:
 * sort([{name:'b',id:12},{name:'c',id:21},{name:'a',id:2}],'id','desc')
 */
var sortObj=function(arr,key,dir){
    key=key||'_id';
    dir=dir||'asc';
    if (arr.length == 0) return [];

    var left = new Array();
    var right = new Array();
    var pivot = arr[0][key];//分割值
    var pivotObj = arr[0];//存储值

    if(dir==='asc'){//升序
        for (var i = 1; i < arr.length; i++) {
            arr[i][key] < pivot ? left.push(arr[i]): right.push(arr[i]);
        }
    }else{//降序
        for (var i = 1; i < arr.length; i++) {
            arr[i][key] > pivot ? left.push(arr[i]): right.push(arr[i]);
        }
    }
    return sortObj(left,key,dir).concat(pivotObj, sortObj(right,key,dir));
}

module.exports = handler;
