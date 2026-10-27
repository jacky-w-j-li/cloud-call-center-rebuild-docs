var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appHttp = require('appHttp');
var constants = require(__baseDir + "/7moor/utils/Constants");
var ServiceNumWhiteList = require(__baseDir + '/models/ServiceNumWhiteList');
var Then = require("thenjs");

var handler = {
    queryServiceNumWhiteList: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);

        Then()
            .parallel([
                function(cont){
                    ServiceNumWhiteList.findByPage(condition.query,condition.limit,condition.page,cont);
                },
                function(cont){
                    ServiceNumWhiteList.count(condition.query,cont);
                },
                function (cont) {
                    ServiceNumWhiteList.find(condition.query,cont);
                },
                function (cont) {
                    ServiceNumWhiteList.findAllPbx(cont);
                }
            ])
            .then(function(cont,res){

                var numList="";
                for(var i=0;i<res[2].length;i++){
                    numList+=res[2][i]._id+","
                }
                numList=numList.substring(0,numList.lastIndexOf(","));
                var postdata = {
                    Command: "Action",
                    Action: "PlatformBlackNum",
                    ActionID: utils.UUID.generateUuid(),
                    allblacklistnumber:numList
                };

               for(var i=0;i<res[3].length;i++){
                  var  configAddr=res[3][i].configAddr;
                    //configAddr="http://120.55.72.213:7789/";
                    appHttp.sendPost(configAddr, postdata, function (err, data) {
                    });
                }

                return callback({
                    success : true,
                    count : res[1],
                    list : res[0]
                });


            })
            .fail(function(cont,err){
                logger.app.error('query serviceNumWhiteList failed',err);
                return callback({
                    success : false,
                    message : '查询号码白名单失败,'+err.message,
                })
            })

    },
    updateServiceNumWhiteList: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            operator : data.operator,
            memo : data.memo,
            updateUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        ServiceNumWhiteList.update(condition,{$set : update},function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新号码白名单失败,"+err.message ;
                logger.app.error("update serviceNumWhiteList failed",err);
            }
            callback(result);
        });
    },
    addServiceNumWhiteList: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : data._id,
            operator : data.operator,
            memo : data.memo,
            createUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        ServiceNumWhiteList.add(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "添加号码白名单失败,"+err.message;
                logger.app.error("add serviceNumWhiteList failed",err);
            }
            callback(result);
        });
    },
    removeServiceNumWhiteList: function(data,session,callback){
        var result = {success:false};

        ServiceNumWhiteList.remove(data._id,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除号码白名单失败,"+err.message;
                logger.app.error("remove serviceNumWhiteList failed",err);
            }
            callback(result);
        });
    },
};

var _impl = {
    _extractGridCondition : function(data){
        var condition = {
            limit : data.limit || 10,
            page  : data.page || 1,
            query : function(){
                delete data.limit;
                delete data.page;

                data._id = new RegExp(data._id);

                return data;
            }()};

        return condition;
    },

}

module.exports = handler;
