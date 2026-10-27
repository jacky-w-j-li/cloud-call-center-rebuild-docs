var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');

var handler = {
    getMenu: function (data, session, callback) {
        var type = session.user.type;
        mongo.db().collection(fields.DB_APP_MENU).findOne({type: type}, function (err, menu) {
            if (menu) {
                callback({success: true, data: menu});
            } else {
                callback({success: false});
            }
        });
    },
    getUsrMenu:function(data,session,callback){
        var roles=session.user.role||[];
        var query = {
            _id:{$in:roles}
        };
        var ids=[];
        var type=session.user.type;
        if(type=='admin'){
            mongo.db().collection(fields.DB_CC_APP_MENU).findOne({}, function (err, menus) {
                if (menus) {
                    menus=menus.menu||[];
                    callback({success: true, data: menus});
                } else {
                    callback({success: false});
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_ROLE).find(query).toArray(function (err, limits) {
                if (!err) {
                    limits = limits || [];
                    for (var i = 0; i < limits.length; i++) {
                        var o = limits[i];
                        ids=ids.concat(o.limits);
                    }
                    ids=handler._distinct(ids);
//                console.dir(ids)
                    mongo.db().collection(fields.DB_CC_APP_MENU).findOne({}, function (err, menus) {
                        if (menus) {
                            menus=menus.menu||[];
//                        console.dir(menus[0])
//                        userMenu=utils.deepClone(menus);
                            handler._recursiveMenu(menus,ids);
                            callback({success: true, data: menus});
                        } else {
                            callback({success: false});
                        }
                    });
                } else {
                    logger.app.error("getUsrMenu error", err);
                    callback(err);
                }
            });
        }


    },
    _recursiveMenu:function(menus,ids){
        var list=[];
        for (var i = 0; i < menus.length; i++) {
            var num=0;
            var menu = menus[i];
            for (var j = 0; j < ids.length; j++) {
                var id = ids[j];
                if(menu.id===id){
                    num++;
                }
            }
            if(num==0){
                list.push(i);
            }else{
                var children=menu.children;
                if(children && children.length>0){
                    handler._recursiveMenu(children,ids);
                }
            }
        }
        if(list.length>0){
            for (var i = 0; i < list.length; i++) {
                var idx = list[i]-i;
//                delete menus[idx]  array length no change
                menus.splice(idx,1);
            }
        }
    },
    _distinct:function(ary){
        var clone,newArr=[],n=0;
        if(ary.length<2)return ary;
        clone=ary;
        for(var i=0,len=ary.length;i<len;i++){
            for(var j=i+1,len2=clone.length;j<len2;j++){
                if(ary[i]!==clone[j]){
                    n++;
                }
            }
            if(n==(len-i-1)){
                newArr.push(ary[i])
            }
            n=0;
        }
        return newArr;
    },
    getUserFunc:function(data,callback){
        var roles=data||[];
        var query = {
            _id:{$in:roles}
        };
        var ids=[];
        var funcIds=[];
        var moduleScope={};
        var dataScope=[fields.data_scope_level,fields.data_scope_dept,fields.data_scope_deptLevel,fields.data_scope_all];
        mongo.db().collection(fields.DB_APP_ROLE).find(query).toArray(function (err, limits) {
            if (!err) {
                limits = limits || [];
                for (var i = 0; i < limits.length; i++) {
                    var o = limits[i];
                    ids=ids.concat(o.limits_in||[]);
                    var _scope= o.scope_in;
                    for(var k in _scope){
                        if(!moduleScope[k]){
                            moduleScope[k]= _scope[k];
                        }else{
                            if(dataScope.indexOf(moduleScope[k])<dataScope.indexOf(_scope[k])){
                                moduleScope[k]= _scope[k];
                            }
                        }
                    }
                }
                ids=handler._distinct(ids);
                for (var i = 0; i < ids.length; i++) {
                    var obj = ids[i];
                    if(obj.indexOf("func_")==0){
                        funcIds.push(obj);
                    }
                }

                funcIds=handler._distinct(funcIds);
                callback({success: true, funcIds: funcIds,allFun:ids,scope:moduleScope});
            } else {
                logger.app.error("getUsrMenu error", err);
                callback({success: false});
            }
        });
    },
    getUserInMenu:function(data,session,callback){
        var roles=session.user.role||[];
        var query = {
            _id:{$in:roles}
        };
        var ids=[];
        var type=session.user.type;
        if(type=='admin'){
            mongo.db().collection(fields.DB_CC_APP_MENU_IN).findOne({}, function (err, menus) {
                if (menus) {
                    menus=menus.menu||[];
                    callback({success: true, data: menus});
                } else {
                    callback({success: false});
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_ROLE).find(query).toArray(function (err, limits) {
                if (!err) {
                    limits = limits || [];
                    for (var i = 0; i < limits.length; i++) {
                        var o = limits[i];
                        ids=ids.concat(o.limits_in||[]);
                    }
                    ids=handler._distinct(ids);
                    mongo.db().collection(fields.DB_CC_APP_MENU_IN).findOne({}, function (err, menus) {
                        if (menus) {
                            menus=menus.menu||[];
//                        console.dir(menus[0])
//                        userMenu=utils.deepClone(menus);
                            /*                        var mappingIds=["km","webchat"];
                             for (var i = 0; i < ids.length; i++) {
                             var o = ids[i];
                             if(o=='monitor_agent_state'){
                             mappingIds.push("monitor");
                             }else if(o=='manager'){
                             mappingIds.push("config");
                             }
                             }
                             ids=ids.concat(mappingIds);*/
                            handler._recursiveMenu(menus,ids);
                            callback({success: true, data: menus});
                        } else {
                            callback({success: false});
                        }
                    });
                } else {
                    logger.app.error("getUsrMenu error", err);
                    callback(err);
                }
            });
        }
}

};


module.exports = handler;