var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var _ = require('underscore');

var handler = {
    getLicenceList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        delete data['limit'];
        var page = data.page || 1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data || {};
        condition.account = session.account._id;
        utils.removeEmptyProperty(condition);

        mongo.db().collection(constants.DB.platform_licence).find(condition, {
            sort: {createTime: -1},
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_licence).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.currentDate = utils.DateTime.getCurrentDate();
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getAllLicenceList: function (data, session, callback) {
        var result = {success: false};
        var condition = data || {};
        condition.account = session.account._id;
        utils.removeEmptyProperty(condition);

        mongo.db().collection(constants.DB.platform_licence).find(condition, {sort: {createTime: -1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.currentDate = utils.DateTime.getCurrentDate();
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getLicenceCount: function (data, session, callback) {
        var result = {success: false};
        var condition = {};
        condition.account = session.account._id;
        mongo.db().collection(constants.DB.platform_licence).count(condition, function (err, count) {
            if (!err) {
                result.count = count;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getLicenceById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_licence).findOne({_id: data._id}, function (err, dbLicense) {
            if (!err && dbLicense) {
                result.license = dbLicense;
                result.success = true;
                callback(result);
            } else {
                logger.app.error("can not found licnese!");
                callback(result);
            }
        });
    },

    pay2Licence: function (data, callback) {
        var result = {success: false};
        var time = utils.DateTime.getCurrentDateTime();

//        var payType=data.payType;
        //var presentMonth = parseInt(data.presentMonth,10);
        //var num = parseInt(data.num,10);
//        var balance=utils.formatFee(parseFloat(data.balance));
//        var totalFee=utils.formatFee(parseFloat(data.totalFee));
        var payFlag = data.flag;
        if (payFlag == constants.payFlag.buyLicence) {//已废弃
            var month = parseInt(data.month, 10);
            var start = data.beginDate + " 00:00:00";
            var date = new Date(Date.parse(start.replace(/-/g, "/")));
            var endTime = utils.DateTime.getMonthDay(date, month);
            endTime = utils.DateTime.getDateDesc(endTime);
            var set = {
                _id: utils.UUID.generateUuid(),
                account: data.account,
                licenceType: data.licenceType,
                licencePrice: data.licencePrice,
                beginDate: data.beginDate,
                endDate: endTime,
                num: data.num,
                createTime: time,
                lastUpdateTime: time,
                pbx: data.pbx,
                status: constants.licenceStatus.use
//                proxy:data.proxy||''
            };
            mongo.db().collection(constants.DB.platform_licence).insert(set, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else if (payFlag == constants.payFlag.renewLicence) {
            var month = parseInt(data.month, 10);
            var query = {_id: data._id};
            mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
                if (!err) {
                    var start = row.endDate + " 00:00:00";
                    var currentDate = utils.DateTime.getCurrentDate();
                    var beginDate = null;
                    //已经过期,重置起始时间
                    if(row.endDate < currentDate){
                        start = currentDate + " 00:00:00";
                        beginDate = currentDate;
                    }

                    var date2 = new Date(Date.parse(start.replace(/-/g, "/")));
                    var endTime = utils.DateTime.getMonthDay(date2, month);
                    endTime = utils.DateTime.getDateDesc(endTime);
                    var set = {
                        status: constants.licenceStatus.use,
                        endDate: endTime,
                        lastUpdateTime: time,
                        notifyNum: 0
                    };
                    if(beginDate){
                        set.beginDate = beginDate;
                    }
                    mongo.db().collection(constants.DB.platform_licence).update(query, {$set: set}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error(err.stack);
                    callback(result);
                }
            });
        } else if (payFlag == constants.payFlag.adjustLicenceNum) {
            var changeNum = parseInt(data.changeNum, 10);
            var query = {_id: data._id};
            mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
                if (!err) {
                    var oldNum = parseInt(row.num, 10);
                    var set = {
                        //status:constants.licenceStatus.use,
                        lastUpdateTime: time
                        //notifyNum:0
                    };
                    if (row.status == 'try') {
                        set.num = oldNum + changeNum;
                    } else {
                        set.status = constants.licenceStatus.use;
                        if (changeNum >= 0) {
                            set.num = oldNum + changeNum;
                            //set.effectDate = "";
                        } else {
                            //set.numNew = oldNum+changeNum;//减少后的数量
                            //set.effectDate = row.endDate;//设置生效时间为原来的到期时间
                            set.num = oldNum + changeNum;
                        }
                    }

                    mongo.db().collection(constants.DB.platform_licence).update(query, {$set: set}, function (err) {
                        if (!err) {
                            if (changeNum != 0) {
                                var log = {
                                    _id: utils.UUID.generateUuid(),
                                    licence: data._id,
                                    licenceType: data.licenceType,
                                    account: data.account,
                                    num: changeNum,
                                    type: 'add',
                                    createTime: utils.DateTime.getCurrentDateTime(),
                                    operator: data.operator
                                };
                                if (changeNum < 0) {
                                    log.type = "reduce";
                                }
                                mongo.db().collection(constants.DB.log_adjust_licence).insert(log);
                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error(err.stack);
                    callback(result);
                }
            });
        } else {
            result.message = "payFlag is null";
            callback(result);
        }
    },
    addLicence2Test: function (data, session, callback) {
        var num1 = data.num;
        var account1 = session.account._id;
        var result = {success: false};
        var time = utils.DateTime.getCurrentDateTime();
        var beginTime = utils.DateTime.getCurrentDate();
        var date = new Date();
        var endTime = utils.DateTime.dateAdd('d', 10, date);
        endTime = utils.DateTime.getDateDesc(endTime);
        var set = {
            _id: utils.UUID.generateUuid(),
            account: session.account._id,
            licenceType: data.licenceType,
            licencePrice: data.licencePrice,
            beginDate: beginTime,
            endDate: endTime,
            num: data.num,
            serviceNum: data.serviceNum,
            channelCount: data.channelCount,
            createTime: time,
            lastUpdateTime: time,
            pbx: data.pbx,
            status: constants.licenceStatus.try
        };
        if (data.licenceType == "outcall") {
            delete set.licencePrice;
            delete set.endDate;
            set.status = constants.licenceStatus.use;
        }
        if (data.licenceType == "service_p") {
            set.status = constants.licenceStatus.present;
            set.num = 2;
        }

        var query = {
            licenceType: data.licenceType,
            account: session.account._id
        };
        var identity = session.account.billIdentity;
        mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, oneLicence) {
            if (!err) {
                var hasLimit=utils.isHasLimit(session,"func_licence_add_more");
                if(hasLimit){
                //if (identity == 'admin' || identity == 'operation') {
                    mongo.db().collection(constants.DB.platform_licence).insert(set,{w:1},function (err, instance) {
                        if (!err) {

                            // 添加延期licence操作记录
                            data.account = session.account._id;
                            data.createTime = time;
                            data._id = instance.ops[0]._id;
                            console.log(instance);
                            handler.generateLicenceOpRecord(handler.generateLicenceOpData(data, session), function (err) {
                                if (err) {
                                    logger.app.error('生成licence操作记录失败', err);
                                }
                                else {}
                            });

                            if (data.licenceType == "outcall") {
                                handler._processOutCallMinConsume(account1);
                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    if (oneLicence) {
                        result.message = "您已经添加过该版本的licence";
                        callback(result);
                    } else {
                        mongo.db().collection(constants.DB.platform_licence).insert(set,{w:1}, function (err, instance) {
                            if (!err) {
                                // 添加延期licence操作记录
                                data.account = session.account._id;
                                data.createTime = time;
                                data._id = instance.ops[0]._id;
                                handler.generateLicenceOpRecord(handler.generateLicenceOpData(data, session), function (err) {
                                    if (err) {
                                        logger.app.error('生成licence操作记录失败', err);
                                    }
                                    else {}
                                });

                                if (data.licenceType == "outcall") {
                                    handler._processOutCallMinConsume(account1);
                                }
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _processOutCallMinConsume: function (account) {
        mongo.db().collection(constants.DB.platform_licence).find({account: account, status: "use", licenceType: "outcall"}).toArray(function (err, doc) {
            if (!err) {
                doc=doc||[];
                var sumNum = 0;
                for (var i = 0; i < doc.length; i++) {
                    sumNum += parseInt(doc[i].num);
                }
                var id = account + "_cc";
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, dbProduct) {
                    if (!err && dbProduct) {
                        if (dbProduct.calloutLicenceStrategy == 'licencePrice') {
                            var price = dbProduct.calloutLicence || 0;
                            var minute = dbProduct.calloutMinute || 0;
                            var minConsume = price * sumNum;
                            var giveMinute = minute * sumNum;
                            var update = {
                                minConsume: minConsume,
                                giveMinute: giveMinute
                            };
                            mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: update});
                        }
                    } else {
                        logger.app.error("not found account product !");
                    }
                });
            }else{
                logger.app.error(err);
            }
        })
    },
    updateLicence2Test: function (data, session, callback) {
        var result = {success: false};
        var time = utils.DateTime.getCurrentDateTime();
        var aid = session.account._id;
        var day = parseInt(data.day, 10);
        var num = data.num;
        var query = {_id: data._id};
        //var identitys = constants.identitys.join(" ");
        //identitys+=" service";
        //if (identitys.indexOf(session.account.billIdentity) == -1) {
        //    result.message = "禁止该操作！";
        //    callback(result);
        //    return;
        //}
        var hasLimit=utils.isHasLimit(session,"func_licence_delay_try");
        if(!hasLimit){
            result.message="禁止该操作！";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
            if (!err && row) {
                //if (row.status != constants.licenceStatus.try) {
                if (row.licenceType =="outcall") {
                    result.message = "电销版本不需要延期";
                    callback(result);
                    return;
                }
                var start = row.endDate + " 00:00:00";
                var date2 = new Date(Date.parse(start.replace(/-/g, "/")));
                var endDate = utils.DateTime.dateAdd('d', day, date2);
                endDate = utils.DateTime.getDateDesc(endDate);
                var set = {
                    num: num,
                    endDate: endDate,
                    lastUpdateTime: time
                };
                mongo.db().collection(constants.DB.platform_licence).update(query, {$set: set}, function (err) {
                    if (!err) {
                        var id = utils.UUID.generateUuid();
                        var record = {
                            _id: id,
                            resource: row._id,
                            createTime: time,
                            account: row.account,
                            status: 'delayTest',
                            type: "licence",
                            operator: session.account.billLoginName,
                            memo: "延期" + day + "天，到期日期为" + endDate + "，licence数量更改为" + num
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);

                        // 添加延期licence操作记录
                        handler.generateLicenceOpRecord(handler.generateLicenceOpData(data, session), function (err) {
                            if (err) {
                                logger.app.error('生成licence操作记录失败', err);
                            }
                            else {}
                        });

                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _initTime: function (date) {
        var date2 = date.replace(/-/g, "");
        date2 = parseInt(date2, 10);
        return date2;
    },
    resetLicenceTime: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account._id;

        var resetTime = data.resetTime;//获取到的设置时间
        //var resetTime2=handler._initTime(resetTime);//用于与现在时间time2比较
        var time = utils.DateTime.getCurrentDateTime();//更新时间
        //var time2=handler._initTime(time);

        var sn = data._id;
        var query = {_id: sn};
        var identitys = constants.identitys.join(" ");
        if (identitys.indexOf(session.account.billIdentity) == -1) {
            result.message = "禁止该操作！";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
            if (!err && row) {
                var set = {
                    endDate: resetTime,
                    lastUpdateTime: time
                };
                //licence不需要停用功能,并且重置时间只对试用和正用状态起作用,所以需要判断重置日期是否小于今天的日期和licence状态
                //2015.1.22 不需要判断状态和重置日期
                //if(row.status!=constants.licenceStatus.try && row.status!=constants.licenceStatus.use){
                //    result.message="请选择试用或正用的licence";
                //    callback(result);
                //    return;
                //}else if(resetTime2<=time2){
                //    result.message="重置的日期不能小于或等于今天的日期";
                //    callback(result);
                //    return;
                //}
                mongo.db().collection(constants.DB.platform_licence).update(query, {$set: set}, function (err) {
                    if (!err) {
                        var id = utils.UUID.generateUuid();
                        var record = {
                            _id: id,
                            resource: row._id,
                            createTime: time,
                            account: row.account,
                            status: 'restEndDate',
                            type: "licence",
                            operator: session.account.billLoginName,
                            memo: "重置Licence到期时间为" + resetTime
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    changeLicenceStatus: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account._id;
        var changeStatus = data.changeStatus;//获取到的设置状态
        var time = utils.DateTime.getCurrentDateTime();//更新时间
        var sn = data._id;
        var query = {_id: sn};

        //var identitys = constants.identitys.join(" ");
        //identitys+=" service";
        //if (identitys.indexOf(session.account.billIdentity) == -1) {
        //    result.message = "禁止该操作！";
        //    callback(result);
        //    return;
        //}
        var hasLimit=utils.isHasLimit(session,"func_licence_change_status");
        if(!hasLimit){
            result.message="禁止该操作！";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
            if (!err && row) {
                if (row.status == constants.licenceStatus.use && changeStatus == constants.licenceStatus.try) {
                    result.message = "在用状态不能变更为试用状态!";
                    callback(result);
                    return;
                }
                var set = {
                    status: changeStatus,
                    lastUpdateTime: time
                };
                mongo.db().collection(constants.DB.platform_licence).update(query, {$set: set}, function (err) {
                    if (!err) {
                        var id = utils.UUID.generateUuid();
                        var record = {
                            _id: id,
                            resource: row._id,
                            createTime: time,
                            account: row.account,
                            status: 'changeStatus',
                            type: "licence",
                            operator: session.account.billLoginName,
                            memo: "变更licence的状态为" + changeStatus
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);

                        // 添加延期licence操作记录
                        handler.generateLicenceOpRecord(handler.generateLicenceOpData(data, session), function (err) {
                            if (err) {
                                logger.app.error('生成licence操作记录失败', err);
                            }
                            else {}
                        });

                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    deleteLicence: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account._id;
        var currentDate = utils.DateTime.getCurrentDateTime();
        var sn = data._id;
        var query = {_id: sn};

        mongo.db().collection(constants.DB.platform_licence).findOne(query, function (err, row) {
            if (!err && row) {
                mongo.db().collection(constants.DB.platform_licence).remove(query, {w: 1}, function (err) {
                    if (!err) {
                        if (row.licenceType == "outcall") {
                            mongo.db().collection(constants.DB.platform_licence).find({account: aid, status: "use", licenceType: "outcall"}).toArray(function (err, doc) {
                                if(!err){
                                    doc=doc||[];
                                    var sumNum = 0;
                                    var id = aid + "_cc";
                                    for (var i = 0; i < doc.length; i++) {
                                        sumNum += parseInt(doc[i].num);
                                    }
                                    mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, dbProduct) {
                                        if (!err && dbProduct) {
                                            if (dbProduct.calloutLicenceStrategy == 'licencePrice') {
                                                var price = dbProduct.calloutLicence || 0;
                                                var minute = dbProduct.calloutMinute || 0;
                                                var minConsume = price * sumNum;
                                                var giveMinute = minute * sumNum;
                                                var update = {
                                                    minConsume: minConsume,
                                                    giveMinute: giveMinute
                                                };
                                                mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: update});
                                            }
                                        } else {
                                            logger.app.error("not found account product !");
                                        }
                                    })
                                }else{
                                    logger.app.error(err);
                                }
                            })
                        }
                        var id = utils.UUID.generateUuid();
                        var record = {
                            _id: id,
                            resource: row._id,
                            createTime: currentDate,
                            account: row.account,
                            status: 'delete',
                            type: "licence",
                            operator: session.account.billLoginName || aid,
                            memo: "删除licence"
                        };

                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);

                        // 添加延期licence操作记录
                        handler.generateLicenceOpRecord(handler.generateLicenceOpData(data, session), function (err) {
                            if (err) {
                                logger.app.error('生成licence操作记录失败', err);
                            }
                            else {}
                        });

                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * licence操作类型
     */
    LicenceOpType: {
        AdjustNum: 'adjustNum',
        Renew: 'renew',
        Delete: 'delete',
        Delay: 'delay',
        ChangeState: 'changeState',
        Create: 'create'
    },
    LicenceOpTypeMap: {
        adjustNum: '调整数量',
        renew: '续费',
        delete: '删除',
        delay: '延时',
        changeState: '更新状态',
        create: '添加'
    },
    /**
     * 将应用程序数据转换为操作记录数据
     * @param data
     * @param callback
     */
    generateLicenceOpData: function (data, session) {
        var record = {
            licence: data._id,
            account: data.account,
            operator: session.account.operator,
            createTime: (new Date()).format('yyyy-MM-dd hh:mm:ss'),
            licenceType: data.licenceType,
            operatorName: session.account.billLoginName || session.account.name,
            licenceCreateTime: data.createTime
        };

        switch (data.flag) {
            case 'adjustLicenceNum': {
                // 调整数量
                record.type = handler.LicenceOpType.AdjustNum;
                record.detail = '调整licence数量为' + data.num + '个';
                return record;
            }
            case 'delay': {
                // 延期
                record.type = handler.LicenceOpType.Delay;
                record.detail = 'licence延期' + data.day + '天';
                return record;
            }
            case 'changeStatus': {
                // 变更状态
                var status = '在用';
                if (data.changeStatus === 'try') {
                    status = '试用';
                }
                if (data.changeStatus === 'present') {
                    status = '赠送';
                }
                record.type = handler.LicenceOpType.ChangeState;
                record.detail = 'licence更新为' + status + '状态';
                return record;
            }
            case 'renewLicence': {
                // 续费
                record.type = handler.LicenceOpType.Renew;
                record.detail = '从'+ data.endDate +'续费' + data.month + '个月，消费' + data.totalFee + '元';
                return record;
            }
            case 'delete': {
                // 删除
                record.type = handler.LicenceOpType.Delete;
                record.detail = '删除licence';
                return record;
            }
            case 'buyLicence': {
                // 创建
                record.type = handler.LicenceOpType.Create;
                record.detail = '添加licence';
                return record;
            }
            default: {
                record.errorMessages = 'licence操作类型未知，无法录入操作记录';
                return record;
            }
        }
    },
    /**
     * 生成licence操作记录
     * @param data
     * @param callback
     */
    generateLicenceOpRecord: function (data, callback) {
        if (data.errorMessages) {
            logger.app.error(data.errorMessages);
            return;
        }

        /**
         * db schema
         * // 以下数据偏向于备份
         * licence      操作的licence的id
         * account      licence关联账户id
         * type         操作类型
         * operator     操作人id
         * createTime   创建时间
         * // 以下数据便于查找时显示
         * licenceType  licence类型
         * licenceCreateTime licence创建时间
         * detail       操作详情
         * operatorName 操作人名称
         */
        if (_.isString(data.licence) &&
            _.isString(data.account) &&
            _.isString(data.type) &&
            _.isString(handler.LicenceOpTypeMap[data.type]) &&
            _.isString(data.operator) &&
            _.isString(data.createTime) &&
            _.isString(data.licenceType) &&
            _.isString(data.licenceCreateTime) &&
            _.isString(data.detail) &&
            _.isString(data.operatorName)) {
            mongo.db().collection(constants.DB.platform_license_op_record).insert(data, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
        else {
            logger.app.error('缺少参数导致生成licence操作记录失败');
        }
    },
    /**
     * licence操作记录查询
     * @param data
     * @param callback
     */
    queryLicenceOpRecords: function (data, session, callback) {
        // 查询条件准备
        var result = { success: false };
        var pageSize = data.limit || 10;
        delete data['limit'];
        var page = data.page || 1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data || {};
        condition.account = session.account._id;
        utils.removeEmptyProperty(condition);

        // 查询
        mongo.db().collection(constants.DB.platform_license_op_record).find(condition, {
            sort: {createTime: -1},
            limit: limit,
            skip: skip
        }).toArray(function (err, records) {
            if (err) {
                logger.app.error(err);
                callback(result);
            }
            else {
                mongo.db().collection(constants.DB.platform_license_op_record).count(condition, function (err, count) {
                    if (err) {
                        logger.app.error(err);
                        callback(result);
                    }
                    else {
                        result.count = count;
                        result.list = records;
                        result.currentDate = utils.DateTime.getCurrentDate();
                        result.success = true;
                        callback(result);
                    }
                });
            }
        });
    }
};

module.exports = handler;
