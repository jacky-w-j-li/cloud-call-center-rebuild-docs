var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');

var handler = {
    getPbxDic : function(session,callback){
        //用account去查创建人，如果创建人是代理，检查这个代理的数据权限是仅自己的资源，则只给他所有的pbx信息.
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne({_id:session.user.account},{createUser:1},function(err,doc){
            if(!err){
                mongo.db('bill').collection(fields.DB_BILL_SYSTEM_USER).findOne({_id:doc.createUser},function(err,createDoc){
                    if(!err){
                        if(createDoc.identity == 'proxy'){
                            if(createDoc.numScope == 'me'){
                                mongo.db('bill').collection(fields.DB_PLATFORM_CC_BOARD).find({owner:createDoc._id}).toArray(function(err,boardDocs){
                                    if(!err){
                                        var pbxIn = [];
                                        for(var i=0;i<boardDocs.length;i++){
                                            pbxIn.push(boardDocs[i]._id);
                                        }
                                        var findpbx = {board:{$in:pbxIn},status:'enable'};
                                        mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).find(findpbx).toArray(function(err,docs){
                                            if(!err){
                                                callback(null,docs || []);
                                            }else{
                                                callback(err);
                                            }
                                        });
                                    }else{
                                        callback(err);
                                    }
                                });
                            }else{
                                mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).find({status:'enable'}).toArray(function(err,docs){
                                    if(!err){
                                        callback(null,docs || []);
                                    }else{
                                        callback(err);
                                    }
                                });
                            }
                        }else{
                            mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).find({status:'enable'}).toArray(function(err,docs){
                                if(!err){
                                    callback(null,docs || []);
                                }else{
                                    callback(err);
                                }
                            });
                        }
                    }else{
                        callback(err);
                    }
                });
            }else{
                callback(err);
            }
        });
    }
}


module.exports = handler;
