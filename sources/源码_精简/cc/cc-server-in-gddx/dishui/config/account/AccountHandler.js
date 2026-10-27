var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var accountLog = require(__baseDir + '/dishui/config/account/AccountLogHandler');
var accountDB = require(__baseDir + '/dishui/config/account/AccountDbHandler');
var assHandler = require(__baseDir + '/dishui/common/billInterface/assServiceHandler');


var handler = {
    queryAccount: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        utils.removeEmptyProperty(data);
        var condition = data;
        if (query) {
            condition = {
                $or: [
                    {_id: query},
                    {name: new RegExp(query)},
                    {company: new RegExp(query)}
                ]
            }
        }
        var result = {success: false};
        mongo.db().collection(fields.DB_C5_ACCOUNT).find(condition, {limit: limit, skip: skip, sort: {createTime: -1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_C5_ACCOUNT).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });

    },
    queryAccountById: function (data, session, callback) {
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(data, function (err, row) {
            if (!err) {
                result.success = true;
                result.data = row;
            } else {
                logger.app.error('db getAccount error:' + err.stack);
                result.message = '404 account not found!';
            }
            callback(result);
        });
    },
    queryAccountOperateLog: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var result = {success: false};
        mongo.db().collection("account_operate_log").find(data, {limit: limit, skip: skip, sort: {time: -1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection("account_operate_log").count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    updateAccountInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error('updateAccountInfo error:', err);
            }
            callback(result);
        });
    },
    rebuildIndex: function (data, callback) {
        accountDB.rebuildIndex(callback);
    },
    addAccount: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_C5_ACCOUNT).findOne({name: data.name}, function (err, doc) {
            if (!err) {
                if (!doc) {
                    mongo.db().collection(fields.DB_MASTER).findOne({master_key: "db_status"}, function (err, master) {
                        if (master) {
                            utils.BusinessUtil.getAccountId(function (err, id) {
                                if (!err) {
                                    data._id = id;
                                    data.status = 'tryout';
                                    data.createTime = utils.getCurrentDate();
                                    data.agentNum = 0;
                                    data.endTime = "";
                                    data.dataDB = master.db_current;
                                    mongo.db().collection(fields.DB_C5_ACCOUNT).insert(data, function (err) {
                                        if (!err) {
                                            var log = {
                                                _id: utils.UUID.generateUuid(),
                                                account: id,
                                                action: "create",
                                                data: {}
                                            };
                                            accountLog.addLog(log, session);
                                            billHandler.addAccountBillInfo({_id: id}, session, function (addResult) {
                                                if (addResult.success) {
                                                    result.success = true;
                                                    accountDB.initDb(id, master.db_current);
                                                }
                                                callback(result);
                                            });

                                        } else {
                                            logger.app.error('db insert error:' + err.stack);
                                            result.message = 'db insert error!' + err.message;
                                            callback(result);
                                        }

                                    });
                                } else {
                                    logger.app.error(err.stack);
                                    result.message = 'faild to generate accountId!';
                                    callback(result);
                                }
                            });
                        } else {
                            result.message = "can not init account db!";
                            callback(result);
                        }
                    });
                } else {
                    result.message = 'account is exists!';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                callback(result);
            }
        });

    },
    transformUsing: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.status = 'using';
        mongo.db().collection(fields.DB_C5_ACCOUNT).findOne({_id: id}, function (err, dbAccount) {
            if (dbAccount && dbAccount.pbx && dbAccount.pbx.PBX) {
                mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
                    if (!err) {
                        var log = {
                            _id: utils.UUID.generateUuid(),
                            account: id,
                            action: 'transformUsing',
                            data: data
                        };
                        accountLog.addLog(log, session);
                        assHandler.notifyAssUpdateLicense(id, function (err, res) {
                            if (!err && res.Succeed) {
                                result.success = true;
                            } else {
                                result.message = "数据修改成功，同步ass失败，请再试！";
                            }
                            callback(result);
                        });

                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                result.message = "账户无pbx信息，无法转正。";
                callback(result);
            }
        });
    },
    transformStop: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.status = "stop";
        data.endTime = utils.DateTime.getCurrentDate();
        mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                var log = {
                    _id: utils.UUID.generateUuid(),
                    account: id,
                    action: "transformStop",
                    data: data
                };
                accountLog.addLog(log, session);
                result.success = true;
                callback(result);
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    transformStart: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.status = "using";
        billHandler.getAccountAgentEndTime({_id: id, beginTime: utils.DateTime.getCurrentDate()}, session, function (response) {
            if (response.success) {
                data.endTime = response.endTime;
                mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
                    if (!err) {
                        var log = {
                            _id: utils.UUID.generateUuid(),
                            account: id,
                            action: "transformStart",
                            data: data
                        };
                        accountLog.addLog(log, session);
                        assHandler.notifyAssUpdateLicense(id, function (err, res) {
                            if (!err && res.Succeed) {
                                result.success = true;
                            } else {
                                result.message = "数据修改成功，同步ass失败，请再试！";
                            }
                            callback(result);
                        });
//                        result.success = true;
//                        callback(result);
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            }
        });
    },
    accountSetAgentNum: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        billHandler.getAccountAgentEndTime({_id: id, agentNum: data.agentNum}, session, function (response) {
            if (response.success) {
                data.endTime = response.endTime;
                mongo.db().collection(fields.DB_C5_ACCOUNT).findOne({_id: id}, function (err, doc) {
                    if (!err) {
                        data.oldAgentNum = doc.agentNum;
                        mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
                            if (!err) {
                                var log = {
                                    _id: utils.UUID.generateUuid(),
                                    account: id,
                                    action: "setAgentNum",
                                    data: data
                                };
                                accountLog.addLog(log, session);
                                assHandler.notifyAssUpdateLicense(id, function (err, res) {
                                    if (!err && res.Succeed) {
                                        result.success = true;
                                    } else {
                                        result.message = "数据修改成功，同步ass失败，请再试！";
                                    }
                                    callback(result);
                                });
//                                result.success = true;
//                                callback(result);
                            } else {
                                logger.app.error("", err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }

                });

            }
        });
    },
    accountSetCurrentNum: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var type = data.concurrentType;
        if (type == "normal") {
            delete data.callInLimit;
            delete data.callOutLimit;
        }

        mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                var log = {
                    _id: utils.UUID.generateUuid(),
                    account: id,
                    action: "setConcurrentNum",
                    data: data
                };
                accountLog.addLog(log, session);
                assHandler.notifyAssUpdateLicense(id, function (err, res) {
                    if (!err && res.Succeed) {
                        result.success = true;
                    } else {
                        result.message = "数据修改成功，同步ass失败，请再试！";
                    }
                    callback(result);
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    getAccountById : function (data, session,callback) {
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id:data._id+'_cc'},function(err,row){
            if(!err && row){
                result.success = true;
                result.data=row;
                callback(result);
            }else{
                err = err || new Error("");
                logger.app.error('db getAccount error:' + err);
                result.message = '404 account not found!';
                callback(result);
            }
        });
    },
    queryAllAccount : function (data, session,callback) {
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).find({product:'cc'},{'_id':1,'account':1}).toArray(function(err,docs){
            if(!err){
                result.success = true;
                var accountArray = [];
                for(var i=0;i<docs.length;i++){
                    accountArray.push(docs[i].account);
                }
                mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).find({_id:{$in:accountArray}},{'_id':1,'name':1,'companyName':1,'status':1}).toArray(function(err,docs){
                    if(!err){
                        result.success = true;
                        result.data=docs;
                        callback(result);
                    }else{
                        logger.app.error('db getAllAccount error:' + err.stack);
                        result.message = 'db getAllAccount error!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error('db getAllAccount error:' + err.stack);
                result.message = 'db getAllAccount error!';
                callback(result);
            }
        });
    },
    //saveMultiChannelPublicConfig: function(data, session, callback){
    //    var result = {success: false};
    //
    //    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).update({account: session.user.account, product: 'cc'},
    //        {$set: {imMaxDealCount: data.imMaxDealCount}}, function(err){
    //        if(!err){
    //            mongo.db().collection(fields.DB_APP_SESSION).update({'user.account':session.user.account},
    //                {$set: {'account.imMaxDealCount': data.imMaxDealCount}}, {multi:true}, function(err){});
    //
    //            result.success = true;
    //            callback(result);
    //        }else{
    //            logger.app.error('db saveMultiChannelPublicConfig error:' + err.stack);
    //            result.message = 'db saveMultiChannelPublicConfig error!';
    //            callback(result);
    //        }
    //    });
    //},
    updateAccountBaseInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db("bill").collection("platform_account").findAndModify({_id: id},[],{$set: data},{new:true},function (err,doc) {
            if (!err) {
                //console.dir(doc)
                result.success = true;
                result.row=doc;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    saveNotifyConfig: function (data, session, callback) {
        var result = {success: false};
        var id =session.account._id;
        data.dialAlert=data.dialAlert||0;
        data.dialAlert=parseInt(data.dialAlert,10);
        mongo.db("bill").collection("platform_account").findOne({_id: id}, function (err, dbAccount) {
            if (!err) {
                if (dbAccount && (dbAccount.dialAlert != data.dialAlert)) {
                    mongo.db("bill").collection("platform_account").update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: dbAccount._id,
                                user: dbAccount._id,
                                type: "balanceAlert"
                            };
                            var content = "";
                            if (dbAccount.dialAlert != data.dialAlert) {
                                content += "账号余额预警由【" + (dbAccount.dialAlert || 0) + "】改为【" + data.dialAlert + "】";
                            }
                            history.content = content;
                            mongo.db("bill").collection("bill_operate_log").insert(history);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("saveAlertConfig error! ", err);
                            result.message = "保存配置失败！";
                            callback(result);
                        }
                    });
                } else {
                    result.success = true;
                    callback(result);
                }

            } else {
                logger.app.error("saveAlertConfig error! ", err);
                result.message = "保存配置失败！";
                callback(result);
            }
        });
    },
    getAccountInfoById:function(id,session,callback){
        var result = {success: false};
        var query={_id:id};
        mongo.db("bill").collection("platform_account").findOne(query,function(err,row){
            if(!err){
                result.row=row;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    updateTokenConfig:function(data,session,callback) {
        var result = {success: false};
        var query={_id:data._id};
        mongo.db("bill").collection("platform_account_product").update(query,{$set: {tokenCheck: data.tokenCheck}},function(err){
            if(!err){
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }

}

module.exports = handler;
