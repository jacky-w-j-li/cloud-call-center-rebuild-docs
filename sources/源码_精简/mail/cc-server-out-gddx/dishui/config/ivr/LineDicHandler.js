var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');

var handler = {
    getLineDic : function(session,callback){
        //用account去查创建人，如果创建人是代理，检查这个代理的数据权限是仅自己的资源，则只给他的机柜的线路信息.
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne({_id:session.user.account},{createUser:1},function(err,doc){
            if(!err){
                mongo.db('bill').collection(fields.DB_BILL_SYSTEM_USER).findOne({_id:doc.createUser},function(err,createDoc){
                    if(!err){
                        var findBoard = {};
                        if(createDoc.identity == 'proxy' && createDoc.numScope == 'me'){
                            findBoard.owner = createDoc._id;
                        }
                        mongo.db('bill').collection(fields.DB_PLATFORM_CC_BOARD).find(findBoard).toArray(function(err,boardDocs){
                            if(!err){
                                var pbxIn = [];
                                var boardMap = {};
                                for(var i=0;i<boardDocs.length;i++){
                                    pbxIn.push(boardDocs[i]._id);
                                    boardMap[boardDocs[i]._id] = boardDocs[i];
                                }
                                var findpbx = {boardId:{$in:pbxIn}};
                                mongo.db('bill').collection(fields.DB_PLATFORM_CC_BOARD_OUTROUTE).find(findpbx).toArray(function(err,docs){
                                    if(!err){
                                        for(var j=0 ;j<docs.length;j++){
                                            if(!boardMap[docs[j].boardId].routes){
                                                boardMap[docs[j].boardId].routes = [];
                                            }
                                            boardMap[docs[j].boardId].routes.push(docs[j]);
                                        }
                                        callback(null,boardMap || []);
                                    }else{
                                        callback(err);
                                    }
                                });
                            }else{
                                callback(err);
                            }
                        });
                    }else{
                        callback(err);
                    }
                });
            }else{
                callback(err);
            }
        });
    }
};


module.exports = handler;