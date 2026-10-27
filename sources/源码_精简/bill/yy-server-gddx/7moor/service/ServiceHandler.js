var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var fs = require("fs");
var config = require('appConfig');
var httpProvider = require("appHttp");
var boardHandler = require(__baseDir + "/7moor/resource/BoardHandler");

var handler = {
    canDialout: function (data, callback) {
        var result = {success: false};
        var id = data.account;
        var product = data.product;
        //var _id = id + "_" + product;

        mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, dbAccount) {
            if (!err && dbAccount) {
                var balance = dbAccount.balance || 0;
                var overdraw = dbAccount.overdraw || 0;
                balance+=overdraw;
                if (balance > 0) {
                    result.canDialout = true;
                } else {
                    result.canDialout = false;
                }
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("can not found account", err);
                result.message = "can not found account!";
                callback(result);
            }
        });

/*        if(product=='zj'){
        }else{
            mongo.db().collection(constants.DB.platform_account_product).findOne({_id: _id}, function (err, dbProduct) {
                if (!err && dbProduct) {
                    var balance = dbProduct.balance || 0;
                    if (balance > 0) {
                        result.canDialout = true;
                    } else {
                        result.canDialout = false;
                    }
                    result.success = true;
                    callback(result);

                } else {
                    logger.app.warn("can not found account", err);
                    result.message = "can not found account!";
                    callback(result);
                }

            });
        }*/
    },
    /**
     *  获取呼入路由
     *  cc 和 zj  通用路由处理
     *  http://127.0.0.1:3000/public?action=service.getCallInRoute&data={"callNum":"01058010003","pbxId":"10.1.1.100"}
     */
    getCallInRoute: function (data, callback) {
        var result = {success: false};
        result.is400 = false;
        if (data.callNum && data.pbxId) {
            var num = data.callNum;
            var formPbx = data.pbxId;
            mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id: num,status:{$nin:['free','stop','stopTry']}}, function (err, dbNum) {
                if (!err && dbNum) {
                    if (dbNum.bind400) {
                        var num400 = dbNum.bind400;
                        result.is400 = true;
                        result.num = num400;
                        mongo.db().collection(constants.DB.platform_num400).findOne({_id: num400}, function (err, dbNum400) {
                            if (!err && dbNum400) {
                                result.account = dbNum400.account;
                                if (dbNum400.pbx) {
                                    impl._getPbxRouteAddr(formPbx,dbNum400.pbx,function(err,addr){
                                        if(!err){
                                            result.success = true;
                                            result.route = addr;
                                            result.status = "200";
                                            callback(result);
                                        } else {
                                            logger.app.warn("get pbx["+dbNum400.pbx+"] route addr error!");
                                            result.message = "pbx route addr not found!";
                                            result.status = "404";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.warn("num400[" + num400 + "] not found pbx!");
                                    result.message = "num400 pbx not found!";
                                    result.status = "404";
                                    callback(result);
                                }
                            } else {
                                logger.app.warn("found num400[" + num400 + "] from db error !");
                                result.message = "num400  not found!";
                                result.status = "404";
                                callback(result);
                            }
                        });
                    } else {
                        result.account = dbNum.account;
                        if(dbNum.pbx){
                            impl._getPbxRouteAddr(formPbx,dbNum.pbx,function(err,addr){
                                if(!err){
                                    result.success = true;
                                    result.route = addr;
                                    result.status = "200";
                                    callback(result);
                                } else {
                                    logger.app.warn("get pbx["+dbNum.pbx+"] route addr error!");
                                    result.message = "pbx route addr not found!";
                                    result.status = "404";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.warn("serviceNum[" + num + "] not found pbx!");
                            result.message = "serviceNum pbx not found!";
                            result.status = "404";
                            callback(result);
                        }
                    }

                } else {
                    logger.app.warn("found num[" + num + "] form db error", err);
                    result.message = "callNum not found!!";
                    result.status = "404";
                    callback(result);
                }
            });
        } else {
            result.message = "params not found!";
            result.status = "404",
            callback(result);
        }
    },
    billAlert: function (data, callback) {
        var result = {success: false};
        var type = data.type;
        switch (type) {
            case "outCall":
                impl.outCallAlert(data, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    }
                });
                break;
            case "serviceNum":
                impl.serviceNumAlert(data, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    }
                });
                break;
            case "num400":
                impl.num400Alert(data, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    }
                });
                break;
            default :
                logger.app.error("billAlert unknow type[" + type + "] error!", new Error(""));
                callback(result);
        }
    },
    gatewaySip: function (data, callback) {
        var result = {success: false};
        var action = data.action;
        delete data.action;
        switch (action) {
            case "query":
                var user = data.user;
                mongo.db().collection(constants.DB.platform_sipNum).findOne({status: "using", user: user, type: "gateway"}, function (err, dbSipNum) {
                    if (dbSipNum) {
                        result.success = true;
                        result.sip = dbSipNum;
                    } else {
                        result.message = "not found sipNum";
                    }
                    callback(result);
                });
                break;
            case "bind":
                var user = data.user, sipNum = data.sip;
                if (user && sipNum) {
                    mongo.db().collection(constants.DB.platform_sipNum).update({status: "using", user: user, type: "gateway"}, {$set: {user: ""}},{w:1},function(err){
                        if(!err){
                            mongo.db().collection(constants.DB.platform_sipNum).update({_id: sipNum}, {$set: {user: user}});
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error("update inRoute exception!", err);
                            result.message = "clear user  sip error";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "user or sip is empty!";
                    callback(result);
                }
                break;
            default :
                logger.app.error("gatewaySip unknow action[" + action + "] error!", new Error(""));
                result.message = "gatewaySip unknow action[" + action + "] error!";
                callback(result);
        }

    },
    /**
     * cc 选择服务号时，生效呼入路由
     * @param data
     * @param callback
     */
//    effectCCRoute: function (data, callback) {
//        var result = {success: false};
//        result.success = true;
//        callback(result);
////
////        var pbx = data.pbx || "";
////        var number = data.number || "";
////        mongo.db().collection(constants.DB.platform_cc_pbx).findOne({_id: pbx}, function (err, dbPbx) {
////            if (!err && dbPbx) {
////                var board = dbPbx.board;
////                mongo.db().collection(constants.DB.platform_cc_board_inRoute).findOne({number: number}, function (err, dbRoute) {
////                    if (!err) {
////                        if (dbRoute) {
////                            mongo.db().collection(constants.DB.platform_cc_board_inRoute).update({number: number}, {boardId: board, pbx: pbx}, function (err) {
////                                if (!err) {
////                                    boardHandler.effectRoute({type: "in", boardId: board}, {}, function (proResult) {
////                                        if (proResult.success) {
////                                            result.success = true;
////                                            callback(result);
////                                        } else {
////                                            logger.app.error("effect inRoute exception!", new Error());
////                                            result.message = "effect inRoute exception!";
////                                            callback(result);
////                                        }
////                                    });
////                                } else {
////                                    logger.app.error("update inRoute exception!", err);
////                                    result.message = "update inRoute exception!";
////                                    callback(result);
////                                }
////                            });
////                        } else {
////                            var data = {
////                                _id: utils.UUID.generateUuid(),
////                                boardId: board,
////                                number: number,
////                                pbx: pbx,
////                                createTime: utils.DateTime.getCurrentDateTime(),
////                                lastUpdateTime: utils.DateTime.getCurrentDateTime()
////                            };
////                            mongo.db().collection(constants.DB.platform_cc_board_inRoute).insert(data, function (err) {
////                                if (!err) {
////                                    boardHandler.effectRoute({type: "in", boardId: board}, {}, function (proResult) {
////                                        if (proResult.success) {
////                                            result.success = true;
////                                            callback(result);
////                                        } else {
////                                            logger.app.error("effect inRoute exception!", new Error());
////                                            result.message = "effect inRoute exception!";
////                                            callback(result);
////                                        }
////                                    });
////                                } else {
////                                    logger.app.error("insert inRoute exception!", err);
////                                    result.message = "insert inRoute exception!";
////                                    callback(result);
////                                }
////                            });
////                        }
////                    } else {
////                        logger.app.error("check inroute error!", err);
////                        result.message = "check inroute error!";
////                        callback(result);
////                    }
////                });
////            } else {
////                logger.app.error("can not found pbx info", err);
////                result.message = "can not found pbx info!";
////                callback(result);
////            }
////        });
//
//    },
    /**
     * ass 欠费调这个
     http://localhost:3000/public?action=service.hasFare&data={"account":"N00000000152","type":"1"}
     {
       "success": true,
       "data": {
         "call": 0
       },
       "message": "200 ok!"
     }
     * @param data
     * @param callback
     */
    hasFare: function (data, callback) {
        var hasFare = data.account;
        var type = data.type;
        var result = {success: false};
        var key = hasFare + "_" + constants.product.cc;
        var condition = {_id: key};
        mongo.db().collection(constants.DB.platform_account).findOne({_id:hasFare}, function (err, dbAccount) {
            if (!err && dbAccount) {
                var balance = dbAccount.balance || 0;
                var overdraw = dbAccount.overdraw || 0;
                balance+=overdraw;

                var info = {call: 0};
                if (balance >= 0) {
                    info.call = 1;
                }
                result.success = true;
                result.data = info;
                callback(result);
            } else {
                logger.app.warn("can not found account", err);
                result.message = "can not found account!";
                callback(result);
            }
        });
/*        mongo.db().collection("platform_account_product").findOne(condition, function (err, product) {
            if (!err && product) {
                var info = {call: 0};
                var balance = utils.formatTrueFee(product.balance);
                if (balance >= 0) {
                    info.call = 1;
                }
                result.success = true;
                result.data = info;
                callback(result);
            } else {
                result.message = "account is not found!";
                callback(result);
            }
        });*/
    },
    /**
     http://localhost:3000/public?action=service.queryLicenseCount&data={"account":"N00000000152","pbx":"1.1.1.100"}
     {
       "success": true,
       "data": {
         "enterprise": 0,
         "outcall": 0,
         "MaxOutboundCalls": 10,
         "MaxIncomingCalls": 10,
         "AutoCallStrategy": "static",
         "SmartAutoCallCount": 1
       },
       "message": "200 ok!"
     }
     * @param data
     * @param callback
     */
    queryLicenseCount: function (data, callback) {
        var result = {success: false};
        var virtualLicence =10000;
        var account = data.account;
        var defaultVal=2;
        var id = account + "_" + constants.product.cc;
        var condition = {
            _id: id
        };
        var pbx = data.pbx;

        var today = utils.DateTime.getCurrentDate();
        var date=today.substring(5);
        mongo.db().collection("platform_account_product").findOne(condition, function (err, product) {
            if (!err && product) {
                var info = {
                    service: 0,
                    monitor: 0,
//                    enterprise: 0,
//                    business: 0,
//                    ext: 0,
//                    order: 0,
//                    standard: 0,
                    enterprise: 0,
                    outcall: 0,
                    MaxOutboundCalls: defaultVal,
                    MaxIncomingCalls: defaultVal
                };

                var pbxs = product.pbx || [];
                var pbxInfo = {};
                for (var i = 0; i < pbxs.length; i++) {
                    var obj = pbxs[i];
                    if (obj.PBX == pbx) {
                        pbxInfo = obj;
                        break;
                    }
                }
                info.MaxIncomingCalls = pbxInfo.maxInbound || defaultVal;
                info.MaxOutboundCalls = pbxInfo.maxOutbound || defaultVal;
                info.AutoCallStrategy = pbxInfo.AutoCallStrategy || "static";
                info.SmartAutoCallCount = pbxInfo.SmartAutoCallCount || 1;
                var _query = {
                    account: account,
                    pbx: pbx
                };
                handler._queryAgentLicence(_query, function (rep) {
                    if (rep.success) {
                        info.outcall = rep.outcall;
                        info.enterprise = rep.enterprise;
                        info.monitor = rep.monitor;
                        info.service = rep.service;

                        var total=info.outcall+info.enterprise+info.monitor+info.service;
                        if(total>0 && !pbxInfo.maxInbound){
                            info.MaxIncomingCalls=Math.ceil(total*1.5);
                        }

                        if(date=='05-15'){
                            info.outcall = virtualLicence;
                            info.enterprise = virtualLicence;
                            info.monitor = virtualLicence;
                            info.service = virtualLicence;

                            var record = {
                                _id: account+"_"+today,
                                date: today
                            };
                            mongo.db().collection("bill_customer_service_day").insert(record);
                        }

                        result.success = true;
                        result.data = info;
                        callback(result);

                    } else {
                        callback(rep);
                    }
                });
//                var nowDate = utils.DateTime.getCurrentDate();
                /*if (account.status == "tryout" && account.expireTime >= nowDate) {
                 info.standard = -1;
                 var type = account.concurrentType || "normal";
                 if (type == "custom") {
                 info.MaxIncomingCalls = account.callInLimit || -1;
                 info.MaxOutboundCalls = account.callOutLimit || -1;
                 } else {
                 info.MaxIncomingCalls = 2;
                 info.MaxOutboundCalls = -1;
                 }

                 } else if (account.status == "using" && (account.endTime >= nowDate || account.endTime == "")) {
                 info.standard = account.agentNum;
                 var type = account.concurrentType || "normal";
                 if (type == "custom") {
                 info.MaxIncomingCalls = account.callInLimit || -1;
                 info.MaxOutboundCalls = account.callOutLimit || -1;
                 } else {
                 info.MaxIncomingCalls = Math.ceil(account.agentNum * agentConcurrentNum);
                 //                        info.MaxOutboundCalls = Math.ceil(account.agentNum * agentConcurrentNum);
                 info.MaxOutboundCalls = -1;
                 }
                 }*/

            } else {
                result.message = "account is not found!";
                callback(result);
            }
        });
    },
    /**
     * standard 标准版
     * dialout 外呼版
     *
     * @param data
     * @param callback
     * @private
     */
    _queryAgentLicence: function (data, callback) {
        var result = {success: false};
        var current = utils.DateTime.getCurrentDate();
        var condition = {
            account: data.account,
            pbx: data.pbx,
            $or: [
                {status:{$in:['use','try']},endDate:{$gte: current},beginDate:{$lte: current}},
                {status:'use',licenceType:constants.licenceType.outcall,beginDate:{$lte: current},endDate:{$in:[null,'']}},
                {status:constants.licenceStatus.present}
            ]
        };
        mongo.db().collection("platform_licence").find(condition).toArray(function (err, docs) {
            if (!err) {
                docs=docs||[]
                var enterprise = 0;
                var outcall = 0;
                var monitor = 0;
                var service = 0;
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    var num = parseInt(obj.num, 10);
                    if (obj.licenceType == constants.licenceType.enterprise) {
                        enterprise += num;
                    } else if (obj.licenceType == constants.licenceType.outcall) {
                        outcall += num;
                    } else if(obj.licenceType == constants.licenceType.monitor){
                        monitor += num;
                    } else if (obj.licenceType == constants.licenceType.service){
                        service += num;
                    } else if (obj.licenceType == constants.licenceType.service_p){
                        service += num;
                    }
                }
                result.success = true;
                result.outcall = outcall;
                result.enterprise = enterprise;
                result.monitor = monitor;
                result.service = service;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     http://localhost:3000/public?action=service.updateCallLimit&data={"account":"N00000000152","pbx":"1.1.1.100","limit":"10"}
     http://localhost:3000/public?action=service.updateCallLimit&data={"account":"N00000000152","pbx":"1.1.1.100","autoCallStrategy":"smart","smartAutoCallCount":"1"}
     {
          "success": false,
          "message": "数据修改成功，同步ass失败，请再试！"
        }
     * @param data
     * @param callback
     */
    updateCallLimit: function (data, callback) {
        var result = {success: false};
        var account = data.account;
        var pbx = data.pbx;
        var key = account + "_" + constants.product.cc;
        var condition = {_id: key};
        mongo.db().collection(constants.DB.platform_account_product).findOne(condition, function (err, product) {
            if (!err && product) {
                var pbxs = product.pbx || [];
                var set = {};
                for (var i = 0; i < pbxs.length; i++) {
                    var obj = pbxs[i];
                    if (obj.PBX == data.pbx) {
                        set = obj;
                        break;
                    }
                }
                if (data.limit || data.limit === 0) {
                    set.maxInbound = parseInt(data.limit, 10);
                }
                mongo.db().collection(constants.DB.platform_account_product).update({_id: key, 'pbx.PBX': data.pbx}, {$set: {'pbx.$': set}}, function (err) {
                    if (!err) {
                        handler.notifyAssUpdateLicense(account, pbx, function (err, res) {
                            if (!err && res.Succeed) {
                                result.success = true;
                            } else {
                                result.message = "数据修改成功，同步ass失败，请再试！";
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error(err.stack);
                        result.message = 'updateCallLimit error!';
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err.stack);
                result.message = 'updateCallLimit error!';
                callback(result);
            }
        });
    },
    notifyAssUpdateLicense: function (account, pbx, callback) {
        var postdata = {
            Command: "Action",
            Action: "ToUpdateLisence",
            ActionID: utils.UUID.generateUuid(),
            PBX: pbx,
            Account: account
        };
        mongo.db().collection(constants.DB.platform_cc_pbx).findOne({_id: pbx}, function (err, queryPbx) {
            if (!err && queryPbx) {
                httpProvider.sendPost(queryPbx.configAddr, postdata, function (err, data) {
                    if (!err) {
                        logger.app.info("notify ass get response:" + data);
                        data = JSON.parse(data);
                    }
                    callback(err, data);
                });
            } else {
                logger.app.error("db error!", err || new Error("can not fount pbx!"));
                callback(err || new Error("can not fount pbx!"));
            }

        });
    },
    /**
     http://localhost:3000/public?action=service.getMobileCodeInfo&data={"prefix":"1860029"}
     {
       "success": true,
       "data": {
         "areaCode": "010",
         "province": "北京",
         "city": "北京"
       },
       "message": "200 ok!"
     }
     * @param data
     * @param callback
     */
    getMobileCodeInfo: function (data, callback) {
        var result = {success: false};
        var prefix = data.prefix;
        mongo.db().collection("tbl_mobile_code").findOne({_id: prefix}, function (err, row) {
            if (!err) {
                if (row) {
                    var doc = {
                        areaCode: row.area_code,
                        province: row.province,
                        city: row.city
                    }
                    result.data = doc;
                    result.success = true;
                    callback(result);
                } else {
                    var url = config.serviceUrl + '?Action=getMobileCode&mobile=' + prefix;
                    url = encodeURI(url);
                    httpProvider.sendGet(url, function (err, res) {
                        if (!err && res) {
                            try {
                                var res = JSON.parse(res);
                                if (res.Succeed) {
                                    var doc = {
                                        areaCode: res.area_code,
                                        province: res.province,
                                        city: res.city
                                    }
                                    result.data = doc;
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "request getMobileCode  错误";
                                    callback(result);
                                }
                            } catch (e) {
                                logger.request.error(e);
                                result.message = "request getMobileCode 异常";
                                callback(result);
                            }
                        } else {
                            logger.request.error(error);
                            result.message = "request getMobileCode 异常";
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err);
                result.message = "getMobileCodeInfo请求db异常";
                callback(result);
            }

        });
    },
    /**
     * {"Account":"N00000000143","PBX":"1.1.1.101","MonitorDuration":"99","Action":"AccountExtenUpdate","Command":"Action","ActionID":"AccountExtenUpdate0.23787350137718022"}
     * @param account
     * @param pbx
     * @param callback
     */
    setCCRecord: function (recordStore,account, pbx, callback) {
        var postdata = {
            Command: "Action",
            Action: "AccountExtenUpdate",
            ActionID: utils.UUID.generateUuid(),
            PBX: pbx,
            Account: account,
            MonitorDuration:recordStore+""
        };
        mongo.db().collection(constants.DB.platform_cc_pbx).findOne({_id: pbx}, function (err, queryPbx) {
            if (!err && queryPbx) {
                httpProvider.sendPost(queryPbx.configAddr, postdata, function (err, data) {
                    if (!err) {
                        logger.app.info("notify ass get response:" + data);
                        data = JSON.parse(data);
                    }
                    callback(err, data);
                });
            } else {
                logger.app.error("db error!", err || new Error("can not fount pbx!"));
                callback(err || new Error("can not fount pbx!"));
            }

        });
    },
    queryGroupAccountExten : function(data, callback){
        var result = {isHas : false};
        mongo.db().collection(constants.DB.platform_group_account_relation).findOne({accountList: data.account}, function (err, relationDoc) {
            if(err){
                callback(result);
                return;
            }
            if(relationDoc) {
                var findAgent = {account:{'$in': relationDoc.accountList}, exten:data.exten};
                var agentReturnDoc = {exten:1,pbx:1,product:1,account:1};
                mongo.db().collection(constants.DB.platform_user).findOne(findAgent, agentReturnDoc, function (err, userDoc) {
                    if(err){
                        callback(result);
                        return;
                    }
                    if(userDoc){
                        result.isHas = true;
                        result.doc = userDoc;
                        var pbxTableName = constants.DB.platform_cc_pbx;
                        if(userDoc.product == 'zj'){
                            pbxTableName = constants.DB.platform_pbx;
                        }
                        mongo.db().collection(pbxTableName).findOne({_id: userDoc.pbx}, {sipAddr:1}, function (err, pbxDoc) {
                            if(err){
                                callback(result);
                                return;
                            }
                            if(pbxDoc){
                                result.doc.sipAddr = pbxDoc.sipAddr;
                                result.success =true;
                                callback(result);
                                return;
                            }else{
                                result.message = 'agent pbx not found!';
                                callback(result);
                                return;
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                        return;
                    }
                });
            } else {
                var findAgent = {account:data.account, exten:data.exten};
                var agentReturnDoc = {exten:1,pbx:1,product:1,account:1};
                mongo.db().collection(constants.DB.platform_user).findOne(findAgent, agentReturnDoc, function (err, userDoc) {
                    if(err){
                        callback(result);
                        return;
                    }
                    if(userDoc){
                        result.isHas = true;
                        result.doc = userDoc;
                        var pbxTableName = constants.DB.platform_cc_pbx;
                        if(userDoc.product == 'zj'){
                            pbxTableName = constants.DB.platform_pbx;
                        }
                        mongo.db().collection(pbxTableName).findOne({_id: userDoc.pbx}, {sipAddr:1}, function (err, pbxDoc) {
                            if(err){
                                callback(result);
                                return;
                            }
                            if(pbxDoc){
                                result.doc.sipAddr = pbxDoc.sipAddr;
                                result.success =true;
                                callback(result);
                                return;
                            }else{
                                result.message = 'agent pbx not found!';
                                callback(result);
                                return;
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                        return;
                    }

                });
            }
        });
    },
    /**
     *  http://127.0.0.1:3000/command?command=notifyGetAccLicence&key=7moorCommand&data={"date":"2016-05-15"}
     * @param data
     * @param callback
     */
    notifyGetAccLicence: function (data, callback) {
        var result = {success: false};
        var date=data.date;
        mongo.db().collection("bill_customer_service_day").find({date:date}).toArray(function (err, docs) {
            if (!err) {
                docs=docs||[];
                var idx=0;
                var notifyAcs=function(){
                    var obj=docs[idx];
                    if(obj){
                        var ary=obj._id.split("_");
                        var account=ary[0];
                        var id = account + "_" + constants.product.cc;
                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, product) {
                            if (!err && product) {
                                var pbxs = product.pbx || [];
                                for (var i = 0; i < pbxs.length; i++) {
                                    var obj = pbxs[i];
                                    handler.notifyAssUpdateLicense(account, obj.PBX, function (err, res) {
                                        if (!err && res.Succeed) {

                                        } else {
                                            mongo.db().collection("bill_customer_service_day_error").insert(obj);
                                        }
                                    });
                                }
                                idx++;
                                notifyAcs();
                            } else {
                                logger.app.error(err);
                                idx++;
                                notifyAcs();
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                notifyAcs();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    }
};


var impl = {
    serviceNumAlert: function (data, callback) {
        var account = data.account, num = data.num;
        mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id: num}, function (err, dbNum) {
            if (!err) {
                var endTime = dbNum.endTime;
//                var days = utils.DateTime.getBetweenDays(endTime,null);
                mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, dbAccount) {
                    if (!err) {
                        var company = dbAccount.companyName;
                        var mail = dbAccount.linkManEmail;
                        var msg = "您的企业号码 " + num + " 将于<span style='color: red;'>" + endTime + "</span>到期";
                        var sendMail = {
                            toAddr: [mail],
                            subject: "容联七陌",
                            type: "billAlert",
                            ccAddr: [config.proxyMail],
                            status: "undeal"
                        };
                        fs.readFile(__baseDir + "/views/mailTmp/billAlert.html", function (err, data) {
                            if (!err) {
                                data = new String(data);
                                data = data.replace(/_#company#_/, company);
                                data = data.replace(/_#content#_/, msg);
                                sendMail.content = data;
                                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                                    if (!err) {
                                        callback(null);
                                    } else {
                                        logger.app.error("insert to send mail to db error!", err);
                                        callback(err);
                                    }
                                });
                            } else {
                                logger.app.error("mail templete[billAlert] not found!", err);
                                callback(err);
                            }
                        });
                    } else {
                        callback(err);
                    }
                });
            } else {
                logger.app.error("serviceNumAlert found num error!", err);
                callback(err);
            }
        });

    },
    num400Alert: function (data, callback) {
        var account = data.account, num = data.num;
        mongo.db().collection(constants.DB.platform_num400).findOne({_id: num}, function (err, dbNum) {
            if (!err) {
                var endTime = dbNum.endTime;
                mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, dbAccount) {
                    if (!err) {
                        var company = dbAccount.companyName;
                        var mail = dbAccount.linkManEmail;
                        var msg = "您的400号码 " + num + " 将于<span style='color: red;'>" + endTime + "</span>到期";
                        var sendMail = {
                            toAddr: [mail],
                            subject: "容联七陌",
                            type: "billAlert",
                            ccAddr: [config.proxyMail],
                            status: "undeal"
                        };
                        fs.readFile(__baseDir + "/views/mailTmp/billAlert.html", function (err, data) {
                            if (!err) {
                                data = new String(data);
                                data = data.replace(/_#company#_/, company);
                                data = data.replace(/_#content#_/, msg);
                                sendMail.content = data;
                                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                                    if (!err) {
                                        callback(null);
                                    } else {
                                        logger.app.error("insert to send mail to db error!", err);
                                        callback(err);
                                    }
                                });
                            } else {
                                logger.app.error("mail templete[billAlert] not found!", err);
                                callback(err);
                            }
                        });
                    } else {
                        callback(err);
                    }
                });
            } else {
                logger.app.error("serviceNumAlert found num error!", err);
                callback(err);
            }
        });
    },
    outCallAlert: function (data, callback) {
        var account = data.account;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, dbAccount) {
            if (!err) {
                var outCall = dbAccount.outCallMinutes || 0;
                var mail = dbAccount.linkManEmail;
                var company = dbAccount.companyName;
                var msg = "您的外呼时长仅剩<span style='color: red;'>" + outCall + "</span>分钟";
                var sendMail = {
                    toAddr: [mail],
                    subject: "容联七陌",
                    type: "billAlert",
                    ccAddr: [config.proxyMail],
                    status: "undeal"
                };
                fs.readFile(__baseDir + "/views/mailTmp/billAlert.html", function (err, data) {
                    if (!err) {
                        data = new String(data);
                        data = data.replace(/_#company#_/, company);
                        data = data.replace(/_#content#_/, msg);
                        sendMail.content = data;
                        mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                            if (!err) {
                                callback(null);
                            } else {
                                logger.app.error("insert to send mail to db error!", err);
                                callback(err);
                            }
                        });
                    } else {
                        logger.app.error("mail templete[billAlert] not found!", err);
                        callback(err);
                    }
                });
            } else {
                logger.app.error("outCallAlert found account error!", err);
                callback(err);
            }
        });
    }
};


var impl = {
    _getPbxRouteAddr: function (fromPbx, toPbx, callback) {
        var from = {};
        var to = {};
        impl._getPbxInfo(fromPbx, function (err, result) {
            if (!err) {
                from = result;
                impl._getPbxInfo(toPbx, function (err, result) {
                    if (!err) {
                        to = result;
                        if(from.product == to.product && from.board == to.board){
                            callback(null , to.inAddr);
                        } else {
                            callback(null , to.outAddr);
                        }
                    } else {
                        callback(err);
                    }
                });
            } else {
                from = {product:'null', board:'null'};
                impl._getPbxInfo(toPbx, function (err, result) {
                    if (!err) {
                        to = result;
                        if(from.product == to.product && from.board == to.board){
                            callback(null , to.inAddr);
                        } else {
                            callback(null , to.outAddr);
                        }
                    } else {
                        callback(err);
                    }
                });
                //callback(err);
            }
        });

    },
    _getPbxInfo: function (pbx, callback) {
        var result = {};
        mongo.db().collection(constants.DB.platform_cc_pbx).findOne({_id: pbx}, function (err, dbPbx) {
            if (!err && dbPbx) {
                result.product = "cc";
                result.board = dbPbx.board;
                result.inAddr = dbPbx.routeIp + ":" + dbPbx.routePort;
                result.outAddr = dbPbx.sipAddr;
                callback(null, result);
            } else {
                mongo.db().collection(constants.DB.platform_pbx).findOne({_id: pbx}, function (err, dbPbx) {
                    if (!err && dbPbx) {
                        result.product = "zj";
                        result.board = dbPbx.board;
                        result.inAddr = dbPbx.routeIp + ":" + dbPbx.routePort;
                        result.outAddr = dbPbx.sipAddr;
                        callback(null, result);
                    } else {
                        callback(new Error(""));
                    }
                });
            }
        });
    }
}

module.exports = handler;
