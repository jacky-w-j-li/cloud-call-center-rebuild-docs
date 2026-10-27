var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var Intl = require(__baseDir + '/models/Intl');
var Then = require("thenjs");

var handler = {
    findIntl: function(data,session,callback){
        var condition = data;
        Intl.find(condition,function(err,records){
            if(err){
                return callback({
                    success : false,
                    message : '查询国际长途失败',
                })
            }

            return callback({
                success : true,
                list : records,
            })
        });
    },
    queryIntl: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);

        Then()
            .parallel([
                function(cont){
                    Intl.findByPage(condition.query,condition.limit,condition.page,cont);
                },
                function(cont){
                    Intl.count(condition.query,cont);
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
                logger.app.error('query international failed',err);
                return callback({
                    success : false,
                    message : '查询国际长途失败,'+err.message,
                })
            })

    },
    updateIntl: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            line : data.line,
            code : data.code,
            dest : data.dest,
            price : utils.formatFee(data.price),
            priceWithTax : utils.formatFee(data.priceWithTax),
            memo : data.memo,
            updateUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        Intl.update(condition,{$set : update},function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新国际长途失败,"+err.message ;
                logger.app.error("update international failed",err);
            }
            callback(result);
        });
    },
    addIntl: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : data.line + "_" + data.code,
            line : data.line,
            code : data.code,
            dest : data.dest,
            price : utils.formatFee(data.price),
            priceWithTax : utils.formatFee(data.priceWithTax),
            memo : data.memo,
            createUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        Intl.add(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "添加国际长途失败,"+err.message;
                logger.app.error("add international failed",err);
            }
            callback(result);
        });
    },
    removeIntl: function(data,session,callback){
        var result = {success:false};

        Intl.remove(data._id,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除国际长途失败,"+err.message;
                logger.app.error("remove international failed",err);
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

                return data;
            }()};

        return condition;
    },
}

module.exports = handler;
