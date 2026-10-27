var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');

module.exports.addCustomerTemplate = function (action, session, callback) {
    var data = {
        _id: utils.UUID.generateUuid(),
        account: session.account.account,
        name: action.name,
        call_popup: true,
        unique_phone: false,
        unique_name: false,
        custom_fields: [],
        source:[],
        call_type: action.callType,
        template_type: action.type,
        create_user: session.user._id,
        create_date: utils.DateTime.getCurrentDateTime(),
        last_modified: utils.DateTime.getCurrentDateTime(),
        last_modified_user: session.user._id,
        maxCommon:fields.CUSTOMER_MAX_COMMONNUM,
        version:utils.generateVersion()

    }
    if (action.callType == 'in') {
        data.status = {
//            status0: 'VIP客户',
//            status1: '金牌客户',
//            status2: '银牌客户',
//            status3: '普通客户'
            status0: '普通客户',
            status1: '银牌客户',
            status2: '金牌客户',
            status3: 'VIP客户'
        };
    } else {
        data.status = {
            status0: '未拨打',
            status1: '兴趣',
            status2: '重点跟踪',
            status3: '成单',
            status4: '无兴趣',
            status5: '丢单',
            status6: '无效数据'
        };
    }

    if (action.type == 'company') {
        data.stable_fields = [
            {
                name:"name",
                value:"公司名称",
                required:"required",
                search:true
            },
            {
                name:"title",
                value:"描述",
                required:"",
                search:false
            },
            {
                name:"phone",
                value:"联系人电话",
                required:"",
                search:true
            },
            {
                name:"email",
                value:"联系人邮箱",
                required:"",
                search:false
            },
            {
                name:"weixin",
                value:"微信",
                required:"",
                search:false
            },
            {
                name:"province",
                value:"省",
                required:"",
                search:true
            },
            {
                name:"city",
                value:"市",
                required:"",
                search:true
            },
            {
                name:"address",
                value:"公司地址",
                required:"",
                search:false
            },
            {
                name:"note",
                value:"备注",
                required:"",
                search:false
            },
            {
                name:"web",
                value:"公司网站",
                required:"",
                search:false
            }
        ]
    } else {
        data.stable_fields = [
            {
                name:"name",
                value:"客户名称",
                required:"required",
                search:true
            },
            {
                name:"title",
                value:"职位",
                required:"",
                search:false
            },
            {
                name:"phone",
                value:"电话",
                required:"",
                search:true
            },
            {
                name:"email",
                value:"邮箱",
                required:"",
                search:false
            },
            {
                name:"weixin",
                value:"微信",
                required:"",
                search:false
            },
            {
                name:"province",
                value:"省",
                required:"",
                search:true
            },
            {
                name:"city",
                value:"市",
                required:"",
                search:true
            },
            {
                name:"address",
                value:"联系地址",
                required:"",
                search:false
            },
            {
                name:"note",
                value:"备注",
                required:"",
                search:false
            },
            {
                name:"sex",
                value:"性别",
                required:"",
                search:false
            },
            {
                name:"age",
                value:"年龄",
                required:"",
                search:false
            },
            {
                name:"birth",
                value:"生日",
                required:"",
                search:false
            }
        ]
    }

    mongo.db().collection('customer_template').insert(data, function (err, result) {
        if (err) {
            callback({success: false});
        } else {
            callback({success: true, data: data});
        }
    });
}

module.exports.getCustomerTemplate = function (action, session, callback) {
    var option = {
        sort:{create_date:1},
        limit: 1
    };
    var query = {
        account: session.account.account
    };
    mongo.db().collection('customer_template').find(query, option).toArray(function(err, docs){
        if(docs) {
            callback({success: true, data: docs});
        } else {
            callback({success: false});
        }
    });
}

module.exports.editStatus = function(action, session, callback){
    var query = {
        _id: action.id
    };
    var data = action.status;
    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            mongo.db().collection('customer_template').update(query, {$set: {status: data,version:version}}, function(err, result){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true, id: action.id});
                }
            });
        }
    })
}

module.exports.editFields = function(action, session, callback){
    var query = {
        _id: action.id
    };
    var data = action.fields;
    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            mongo.db().collection('customer_template').update(query, {$set: {stable_fields: data,version:version}}, function(err, result){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true, id: action.id});
                }
            });
        }
    })
}

module.exports.uniqueField = function(action, session, callback){
    var query = {
        _id: action.id
    };
    var field = action.field;
    var data = {};
    data[field] = action.unique;
    mongo.db().collection('customer_template').update(query, {$set: data}, function(err, result){
        if(err) {
            callback({success: false});
        } else {
            custHandler.recordLog({type:'updateTmpl',memo:"修改"+field+"为"+action.unique},session);
            callback({success: true, id: action.id});
        }
    });
}

module.exports.callPop = function(action, session, callback){
    var query = {
        _id: action.id
    };
    var field = 'call_popup';
    var data = {};
    data[field] = action.call_popup;
    mongo.db().collection('customer_template').update(query, {$set: data}, function(err, result){
        if(err) {
            callback({success: false});
        } else {
            callback({success: true, id: action.id});
        }
    });

}

module.exports.addCustomerField = function(action, session, callback) {
    var query = {
        _id: action.template
    };
    var choice={};
    if(action.choices) {
        for(var i=0;i<action.choices.length;i++){
            choice[""+i]=action.choices[i];
        }
    }else{
        choice=null;
    }
    var data = {
        _id: utils.UUID.generateUuid(),
        type: action.type,
        required: action.required,
        noupdate: action.noupdate,
        name: action.name,
        choices: choice
    };

    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            mongo.db().collection('customer_template').update(query, {$push: {custom_fields: data},$set:{"version":version}}, function(err, result){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true, _id: data._id});
                }
            });
        }
    })
}

module.exports.deleteCustomField = function(action, session, callback) {
    var query = {
        _id: action.template_id
    };
    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            mongo.db().collection('customer_template').update(query, {$pull: {custom_fields:{_id: action.field_id}},$set:{"version":version}}, function(err, result){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true});
                }
            });
        }
    })
}

module.exports.moveCustomField = function(action, session, callback) {
    var query = {
        _id: action.template_id
    }
    var moveUp = action.moveUp;
    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        var fields = doc.custom_fields;
        var index = 0;
        for(var i=0;i<fields.length;i++) {
            var field = fields[i];
            if(field._id == action.field_id) {
                index = i;
                break;
            }
        }
        if(moveUp) {
            if(index == 0) {
                callback({success: false});
            } else {
                var temp = fields[index - 1];
                fields[index - 1] = fields[index];
                fields[index] = temp;
                mongo.db().collection('customer_template').update(query, {$set: {custom_fields: fields}}, function(err, result){
                    if(err) {
                        callback({success: false});
                    } else {
                        callback({success: true, id: temp._id});
                    }
                });
            }
        } else {
            if(index == fields.length - 1) {
                callback({success: false});
            } else {
                var temp = fields[index + 1];
                fields[index + 1] = fields[index];
                fields[index] = temp;
                mongo.db().collection('customer_template').update(query, {$set: {custom_fields: fields}}, function(err, result){
                    if(err) {
                        callback({success: false});
                    } else {
                        callback({success: true, id: temp._id});
                    }
                });
            }
        }
    });
}
module.exports.editCustomField = function(action, session, callback) {
    var query = {
        _id: action.template_id,
        'custom_fields._id': action._id
    };
    var data = {
        _id: action._id,
        type: action.type,
        required: action.required,
        noupdate: action.noupdate,
        name: action.name,
        choices: action.choices
    };

    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            mongo.db().collection('customer_template').update(query, {$set: {'custom_fields.$': data,version:version}}, function(err, result){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true, _id: data._id});
                }
            });
        }
    });
}

module.exports.editSource = function(action, session, callback) {
    var query = {
        _id: action.id
    };
    for(var i=0;i<action.source.length;i++){
        var item=action.source[i];
        if(!item.key){
            item.key= utils.UUID.generateUuid();
        }
    }
    var data = {
        source: action.source
    };
    mongo.db().collection('customer_template').findOne(query, function(err, doc){
        if(err){
            callback({success: false});
        }else{
            var version = utils.generateVersion(doc.version);
            data.version = version;
            mongo.db().collection('customer_template').update(query, {$set: data}, function(err){
                if(err) {
                    callback({success: false});
                } else {
                    callback({success: true, data: data.source});
                }
            });
        }
    });

}

module.exports.editCompetitors = function(action, session, callback) {
    var query = {
        _id: action.id
    };
    for(var i=0;i<action.competitors.length;i++){
        var item=action.competitors[i];
        if(!item.key){
            item.key= utils.UUID.generateUuid();
        }
    }
    var data = {
        competitors: action.competitors
    };

    mongo.db().collection('customer_template').update(query, {$set: data}, function(err){
        if(err) {
            callback({success: false});
        } else {
            callback({success: true, data: data.competitors});
        }
    });
}

module.exports.setAutoSave = function(action, session, callback){
    var query = {
        _id: session.account.account+"_cc"
    };
    var data={autoSave:action.autoSave};
    mongo.db("bill").collection('platform_account_product').update(query, {$set: data}, function(err){
        if(err) {
            callback({success: false});
        } else {
            callback({success: true});
        }
    });
}
//module.exports.saveMaxCommon = function(action, session, callback) {
//    var query = {
//        _id: action._id
//    };
//    var max= parseInt(action.maxCommon,10);
//    var data = {
//        maxCommon:max
//    };
//
//    mongo.db().collection('customer_template').update(query, {$set: data}, function(err){
//        if(err) {
//            callback({success: false});
//        } else {
//            callback({success: true, data: max});
//        }
//    });
//}
/**
 * 初始化商机统计数据
 * @param action
 * @param session
 * @param callback
 */
module.exports.initSalesReport = function(data, callback){
    var result = {success: false};
    var agent = data.agent ;
    var account = data.account ;
    //查询dbName
    mongo.db("bill").collection("platform_account_product").findOne({_id: account + "_cc"}, function (err, doc) {
        if (!err) {
            if (doc) {
                var dbName = doc.dataDB;
                //根据all或座席工号查出座席
                if(agent != "all"){
                    mongo.db("bill").collection("platform_user").findOne({"account":account,"exten": agent},{fields:{"_id":1}}, function (err, agentDoc) {
                        if(agentDoc){
                            var queryCust = {};
                            mongo.db(dbName).collection(account + fields.DB_C5_CUSTOMER).find(queryCust,{sort: {createTime: -1},fields:{owner:1,categoryId:1}}).toArray(function(err,docs){
                                if(!err){
                                    var agentCount = 0,accountCount = 0;
                                    //循环客户表查出账户和座席商机数据
                                    if(docs.length != 0){
                                        for(var i=0; i<docs.length; i++){
                                            var customer = docs[i];
                                            accountCount += 1;
                                            if(customer.owner == agentDoc._id){
                                                agentCount += 1;
                                            }
                                        }
                                    }
                                    //插入到座席商机数据到统计表
                                    var currentDateArray  = utils.DateTime.getFormatDateStr(new Date()).split("-");
                                    var year = currentDateArray[0];
                                    var month = currentDateArray[0] + currentDateArray[1];
                                    var day = currentDateArray[0] + currentDateArray[1] + currentDateArray[2];

                                    //先删除再插入
                                    var reportQuery = {"account" : data.account,"day":day};
                                    mongo.reportDb().collection(fields.CC_CUSTOMER_OPPORTUNITY_REPORT).remove(reportQuery,{w:1},function(err){
                                        if(!err){
                                            //插入汇总数据表
                                            var insertData = {
                                                "account" : data.account,
                                                "year":year,
                                                "month":month,
                                                "day":day,
                                                "total":accountCount
                                            };
                                            mongo.reportDb().collection(fields.CC_CUSTOMER_OPPORTUNITY_REPORT).insert(insertData,function(err){
                                                if(!err){
                                                    reportQuery.user = agentDoc._id;
                                                    mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).remove(reportQuery,{w:1},function(err){
                                                        if(!err){
                                                            var insertData = {
                                                                "account" : data.account,
                                                                "year":year,
                                                                "month":month,
                                                                "user":agentDoc._id,
                                                                "day":day,
                                                                "total":agentCount
                                                            };
                                                            mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).insert(insertData,function(err){
                                                                if(!err){
                                                                    result.success = true;
                                                                    callback(result);
                                                                }else{
                                                                    logger.app.error(err);
                                                                    callback(result);
                                                                }
                                                            });
                                                        }else{
                                                            logger.app.error(err);
                                                            callback(result);
                                                        }
                                                    })
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    })
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            })
                        }else{
                            result.message = "未查找到座席信息";
                            callback(result);
                        }
                    });
                }else{
                    //初始化所有人 agent == all
                    var queryCust = {};
                    mongo.db(dbName).collection(account + fields.DB_C5_CUSTOMER).find(queryCust,{sort: {createTime: -1},fields:{owner:1,categoryId:1}}).toArray(function(err,docs){
                        if(!err){
                            //循环客户表查出账户和座席商机数据
                            if(docs.length != 0){
                                var agentsMap = {};
                                var currentDateArray  = utils.DateTime.getFormatDateStr(new Date()).split("-");
                                var year = currentDateArray[0];
                                var month = currentDateArray[0] + currentDateArray[1];
                                var day = currentDateArray[0] + currentDateArray[1] + currentDateArray[2];
                                var accountCount = 0;//商机总数

                                //循环查找出每个座席对应的数据
                                for(var i=0; i<docs.length; i++){
                                    var customer = docs[i];
                                    var agentMapDoc = {"account":account,"year":year,"month":month,"day":day,total:0};
                                    accountCount += 1;
                                    if(customer.owner && (customer.owner != customer.categoryId)){
                                        if(!agentsMap[customer.owner]){
                                            agentMapDoc.total += 1;
                                            agentsMap[customer.owner] = agentMapDoc
                                        }else{
                                            agentsMap[customer.owner].total += 1;
                                        }
                                    }
                                }

                                //插入到总表
                                //先删除再插入
                                var reportQuery = {"account" : data.account,"day":day};
                                mongo.reportDb().collection(fields.CC_CUSTOMER_OPPORTUNITY_REPORT).remove(reportQuery,{w:1},function(err){
                                    if(!err){
                                        //插入汇总数据表
                                        var insertData = {
                                            "account" : data.account,
                                            "year":year,
                                            "month":month,
                                            "day":day,
                                            "total":accountCount
                                        };
                                        mongo.reportDb().collection(fields.CC_CUSTOMER_OPPORTUNITY_REPORT).insert(insertData,function(err){
                                            if(!err){

                                                //删除所有座席今天的统计记录
                                                mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).remove(reportQuery,{w:1},function(err){
                                                    if(!err){
                                                        //插入今天统计数据
                                                        var bulkWrite =[];
                                                        for(var item in agentsMap){
                                                            var obj = agentsMap[item];
                                                            var insertData = {
                                                                "account" : obj.account,
                                                                "year":obj.year,
                                                                "month":obj.month,
                                                                "user":item,
                                                                "day":obj.day,
                                                                "total":obj.total
                                                            };
                                                            var query = { insertOne : insertData};
                                                            bulkWrite.push(query);
                                                        }

                                                        if(bulkWrite.length != 0){
                                                            mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).bulkWrite(bulkWrite,function(err){
                                                                if(!err){
                                                                    result.success = true;
                                                                    callback(result);
                                                                }else{
                                                                    logger.app.error(err);
                                                                    callback(result);
                                                                }
                                                            });
                                                        }else{
                                                            result.message = "未找到客户信息";
                                                            callback(result);
                                                        }
                                                    }else{
                                                        logger.app.error(err);
                                                        callback(result);
                                                    }
                                                })

                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        })
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });

                            }else{
                                result.message = "未找到客户信息";
                                callback(result);
                            }
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }
            }else{
                result.message = "未查找到账号信息";
                callback(result);
            }
        }else {
            logger.app.error(err);
            callback(result);
        }
    })

}
