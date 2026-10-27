var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var Industry = require(__baseDir + '/models/Industry');
var Then = require("thenjs");

var handler = {
    findIndustry: function(data,session,callback){
        var condition = data;
        Industry.find(condition,function(err,records){
            if(err){
                return callback({
                    success : false,
                    message : '查询行业失败',
                })
            }

            return callback({
                success : true,
                list : records,
            })
        });
    },
    queryIndustry: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);

        Then()
            .parallel([
                function(cont){
                    Industry.findByPage(condition.query,condition.limit,condition.page,cont);
                },
                function(cont){
                    Industry.count(condition.query,cont);
                }
            ])
            .then(function(cont,res){
                return callback({
                    success : true,
                    count : res[1],
                    list : res[0],
                });
            })
            .fail(function(cont,err){
                logger.app.error('query industry failed',err);
                return callback({
                    success : false,
                    message : '查询行业失败,'+err.message,
                })
            })

    },
    updateIndustry: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            memo : data.memo,
            name : data.name,
            parent : data.parent,
            categoryLevel : data.categoryLevel,
            updateUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        Industry.update(condition,{$set : update},function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新行业失败,"+err.message ;
                logger.app.error("update industry failed",err);
            }
            callback(result);
        });
    },
    addIndustry: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : utils.UUID.generateRandomId(),
            memo : data.memo,
            name : data.name,
            parent : data.parent,
            categoryLevel : data.categoryLevel,
            createUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        Industry.add(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "添加行业失败,"+err.message;
                logger.app.error("add industry failed",err);
            }
            callback(result);
        });
    },
    removeIndustry: function(data,session,callback){
        var result = {success:false};

        Industry.remove(data._id,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除行业失败,"+err.message;
                logger.app.error("remove industry failed",err);
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

                if(data.name){
                    data.name = new RegExp(data.name);
                }

                return data;
            }()};

        return condition;
    },
}

module.exports = handler;
