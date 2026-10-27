var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var httpProvider = require("appHttp");
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");

exports.exportXls = function(data, session, callback){
    var method=data.Method;
    var query=data.Query;
    var url = config.serviceUrl+'?Action=export&Method='+method+'&Query=' + JSON.stringify(query);
    logger.request.info(session.account._id + ' begin export excel access app Service!',url);
    url=encodeURI(url);
    httpProvider.sendGet(url,function(err,res){
        if(!err && res){
            try{
                var res = JSON.parse(res);
                if(res.Succeed){
                    res.success = true;
                    callback(res);
                }else{
                    callback(new Error('request service error!'));
                }
            }catch (e) {
                logger.request.error(e);
                callback(e);
            }
        }else{
            var error = err || new Error('request service error!');
            logger.request.error(error);
            callback(error);
        }
    });
}

//账户->充值查询->客户充值->导出   feeRecord2Cust.js
//新加   话单->线路成本&线路话单明细->导出   lineFee.js    lineDetail.js
//系统用户导出     系统->用户管理   systemUser.js
//我的财务-->收支明细-->导出FinanceDeta.js
exports.exportBillXls = function(data, session, callback){
    var method=data.Method;
    delete data.Method;
    var query=data;
    var uid=session.user._id;
    var identify=session.user.identity;
    /*if(method=='exportFeeCust'){
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }else if(method=='exportLineFee'){
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }else if(method=='exportLineDetail'){
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }else if(method=='exportSystemUser'){
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }else if(method=='exportFinancedetail'){//2015-10-21
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }else if(method=='exportMonthreportTable'){//2015-11-10
        if( identify== constants.systemUserIndentity.proxy){
            query.proxy=session.user._id;
        }
    }*/
    var doQuery = function(){
        var url = config.serviceUrl+'?Action=export&Method='+method+'&Query=' + JSON.stringify(query);
        logger.request.info(uid + ' begin export excel access bill Service!',url);
        url=encodeURI(url);
        httpProvider.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        callback(res);
                    }else{
                        callback(new Error('request service error!'));
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                callback(error);
            }
        });
    };

    var getUserAllLower = function(userId,callback){
        mongo.db().collection(constants.DB.system_user).find({identity:"proxy",parent:{$nin:[null,'']}},{fields:{_id:1,parent:1}}).toArray(function(err , users){
            var result = [userId];
            if(!err){
                users = users || [];
                var getUserLower = function (uid){
                    for(var i=0;i<users.length;i++){
                        var obj = users[i];
                        if(obj.parent == uid){
                            result.push(obj._id);
                            getUserLower(obj._id);
                        }
                    }
                }
                getUserLower(userId);
                callback(result);
            } else {
                callback(result);
            }

        });
    };


    if(identify== constants.systemUserIndentity.proxy && !query.proxy &&  ['exportFeeCust','exportLineFee','exportLineDetail','exportSystemUser','exportFinancedetail','exportMonthreportTable'].indexOf(method) > -1){
        getUserAllLower(session.user._id,function(userIds){
            query.proxy = userIds.join(',');
            doQuery();
        });
    }else{
        doQuery();
    }

}

