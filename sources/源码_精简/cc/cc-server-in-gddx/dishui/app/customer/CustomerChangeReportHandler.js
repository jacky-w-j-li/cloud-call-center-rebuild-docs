var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var customerHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');

var handler = {
    getCustChanageReport: function (data, session, callback) {
        var result = {success: false};
//        var pageSize = data.limit||10;
//        delete data['limit'];
//        var page = data.page||1;
//        delete data['page'];
//        var limit = pageSize;
//        var skip = (page - 1) * pageSize;
        var aid=session.user.account;
        var query = data||{};
        var dbType=query.dbType;
        delete query.dbType;
        if(query.beginDate){
            query.createTime={$gte:query.beginDate};
        }
        if(query.endDate){
            if(!query.createTime){
                query.createTime={};
            }
            query.createTime['$lte']=query.endDate;
        }

        utils.removeEmptyProperty(query);

        var condition=query;
        var keys = ['owner'];
        var init = {assign:0,assignOut:0,selfCreate:0,use:0,giveUp:0,delete:0,custArray:{}};

        var reduce = function (obj, prev) {
            var custArray=prev.custArray;
//            var ary_assign=[fields.custLog_assign,fields.custLog_updateOwner2Add,fields.custLog_import_assign];
//            var ary_create=[fields.custLog_import,fields.custLog_selfCreate];
//            var ary_assignOut=[fields.custLog_assignOut,fields.custLog_clearOwner,fields.custLog_updateOwner2Reduce];
//            var ary_delete=[fields.custLog_delete,fields.custLog_batchDelete];
            var ary_assign=["assign","updateOwner2Add","import_assign"];
            var ary_create=["import","selfCreate"];
            var ary_assignOut=["assignOut","clearOwner","updateOwner2Reduce"];
            var ary_delete=["delete","batchDelete"];
            var newStatus = obj.newStatus;
            var type = obj.type;
            var time = obj.time;
            var num = obj.num||0;
            var cid=obj.custId;
            if(type=="updateStatus"){
                prev[newStatus]+=num;
                var _cid=cid[0];
                var _obj=custArray[_cid];
                if(_obj){
                    if(_obj.t<time){
                        prev[_obj.s]-=_obj.n;
                        _obj={t:time,n:num,s:newStatus};
                    }
                }else{
                    custArray[_cid] ={t:time,n:num,s:newStatus};
                }
            }else{
                if(ary_assign.join(" ").indexOf(type)!=-1){
                    prev['assign']+=num;
                }else if(ary_create.join(" ").indexOf(type)!=-1){
                    prev['selfCreate']+=num;
                }else if(ary_assignOut.join(" ").indexOf(type)!=-1){
                    prev['assignOut']+=num;
                }else if(ary_delete.join(" ").indexOf(type)!=-1){
                    prev['delete']+=num;
                }else{
                    prev[type]+=num;
                }
            }
        };
/*        var transferPercent=function(num, total) {
            var digit=0+"%";
            if(total>0){
                digit=Math.round(num/total * 10000)/100.00+"%";
            }
            return digit;
        }*/

        customerHandler.getTmplByDbType({dbType:dbType},session, function (err, custStatus) {
            if (!err) {
                for (var status in custStatus) {
                    init[status] = 0;
                }
//                console.dir(init)
                mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).group(keys, condition, init, reduce, function (err, list) {
                    if(!err){
                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: aid, product:'cc'}).toArray(function (err, users) {
                            if (!err) {
                                users=users||[];
                                for (var i = 0; i < list.length; i++) {
                                    var item = list[i];
                                    for (var j = 0; j < users.length; j++) {
                                        var _u = users[j];
                                        if(_u._id==item.owner){
                                            item.agent= _u.displayName;
                                            item.exten= _u.exten;
                                            break;
                                        }
                                    }
                                }
                                var sort=function(ary){
                                    var flag = false;
                                    for(var i = 0; i < ary.length -1; i++) {
                                        for(var j = 0; j < ary.length - i -1;j++) {
                                            var a=parseInt(ary[j].exten);
                                            var b=parseInt(ary[j+1].exten);
                                            if(a>b) {
                                                var temp = ary[j];
                                                ary[j] = ary[j+1];
                                                ary[j+1] = temp;
                                                flag = true;
                                            }
                                        }
                                        if(flag) {
                                            flag = false;
                                        } else {
                                            break;
                                        }
                                    }
                                }
                                sort(list);
                                result.list=list;
                                result.success=true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });

    }

};

module.exports = handler;
