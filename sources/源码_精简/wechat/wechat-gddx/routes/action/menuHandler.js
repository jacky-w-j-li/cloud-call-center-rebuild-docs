/**
 * 对外提供公众号对菜单的操作
 */
var fs     = require('fs');
var log    = require('appLog');
var config = require('../../config');
var db     = require('appDb/MongoDb');
var menu   = require('../weixin/menu');

/**
 * 获取微信公众号的菜单
 * @param action
 * @param callback
 */
module.exports.getMenu = function(action,callback){
    var query = {
        _id: action.appid
    }
    db.db().collection('wxaccount').findOne(query,['authorizer_access_token','menu'],function(err,doc){
        if(doc){
            var menus = doc.menu;
            if(menus && menus.button.length>0){//数据库存在菜单
                var cursor =  db.db().collection('click').find({appid: action.appid},['eventKey','content']);
                cursor.toArray(function (err, docs) {
                    if (docs) {
                        for(var i=0;i<menus.button.length;i++){
                            if(menus.button[i].type == 'click'){
                                var key1 = menus.button[i].key;
                                for (var n = 0; n < docs.length; n++) {
                                    var eventKey1 = docs[n].eventKey;
                                    var content1  = docs[n].content;
                                    if(eventKey1 == key1){
                                        menus.button[i].key = content1;
                                        menus.button[i]["robot"] = eventKey1 == "robot" ? true : false;
                                        break;
                                    }
                                }
                            }else if(menus.button[i].sub_button){
                                for(var j=0;j<menus.button[i].sub_button.length;j++){
                                    if(menus.button[i].sub_button[j].type == 'click'){
                                        var key2 = menus.button[i].sub_button[j].key;
                                        for (var n = 0; n < docs.length;n++) {
                                            var eventKey1 = docs[n].eventKey;
                                            var content1 = docs[n].content;
                                            if(eventKey1 == key2){
                                                menus.button[i].sub_button[j].key = content1;
                                                menus.button[i].sub_button[j]["robot"] = eventKey1 == "robot" ? true : false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        callback(JSON.stringify(menus));
                    }
                });
            }else{
                var accessToken = doc.authorizer_access_token;
                menu.get(accessToken,function(result){
                    update_wx_menus(action.appid,result);
                    callback(JSON.stringify(result.menu));
                });
            }
        }else{
            log.app.warn(err);
            callback(JSON.stringify({success:false}));
        }
    });

}

/**
 * 创建微信公众号的菜单
 * @param action
 * @param callback
 */
function createMenu(action, callback){
    var query = {
        _id: action.appid
    };
    console.log(action);
    db.db().collection('wxaccount').findOne(query, ['authorizer_access_token','menu'], function(err, doc) {
        if(doc){
            var accessToken = doc.authorizer_access_token;
            menu.delete(accessToken,function(result){
                if(result){
                    var postData = JSON.parse(decodeURIComponent(action.menus));
                    if(postData!=null && postData.button.length>0){
                        menu.create(postData,accessToken,function(result1){
                            if(result1){
                                log.app.info('创建菜单成功');
                                update_wx_menus(action.appid,{menu:postData});
                                callback({success:true});
                            }else{
                                callback({success:false});
                            }
                        });
                    }else{
                        update_wx_menus(action.appid,{menu:''});
                        callback({success:true});
                    }
                }else{
                    callback({success:false});
                }
            });
        }else {
            log.app.warn(err);
            callback({success:false});
        }
    });

}
/**
 * 保存全部菜单
 * @param action 接受的参数
 * @param callback 回调函数
 */
module.exports.saveMenu = function(action,callback){
    createMenu(action,function(doc){
        if(doc.success){
            saveClick(action,callback);
        }else{
            callback(JSON.stringify({success:false}));
        }
    });


}
/**
 * 更新微信公众号的菜单
 * @param appId
 * @param menus
 */
var update_wx_menus = function(appId,menu){
    var query  = {
        _id: appId
    }
    db.db().collection('wxaccount').update(query,{$set: menu});
}

/**
 * 保存菜单的点击事件
 * @param action
 * @param callback
 */
var saveClick = function(action,callback){
    var query = {
        appid:action.appid
    }
    db.db().collection('click').remove(query,{w:1},function(err,doc){
        var clicks = JSON.parse(decodeURIComponent(action.events));
        db.db().collection('click').insert(clicks,function(err){
            if(err){
                log.app.warn(err);
                callback(JSON.stringify({success:false}));
            }else{
                log.app.info('保存事件成功');
                callback(JSON.stringify({success:true}));
            }
        });

    });
}





