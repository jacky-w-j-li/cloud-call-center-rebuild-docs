var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var nodeUtil = require('util');
var logger = require('appLog');
var objectUtil = require('appUtil/ObjectUtil');
var httpProvider = require('appHttp');
var appConfig = require('appConfig').conf;
var syncHandler = require(__baseDir + '/dishui/common/platformSync');
var fields = require(__baseDir + '/dishui/common/Fields');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var lineHandler = require(__baseDir + '/dishui/config/ivr/DialoutLineHandler');
var phoneBarConfigHandler = require(__baseDir + '/dishui/config/ivr/PhoneBarConfigHandler');
var systemHandler = require(__baseDir + '/dishui/config/ivr/SystemHandler');
var userHandler = require(__baseDir + '/dishui/config/ivr/UserHandler');
var extensionHandler = require(__baseDir + '/dishui/config/ivr/ExtensionHandler.js');
var dialoutLineHandler = require(__baseDir + '/dishui/config/ivr/DialoutLineHandler.js');
var serviceNoHandler = require(__baseDir + '/dishui/config/ivr/ServiceNoHandler.js');
var phoneBarConfigHandler = require(__baseDir + '/dishui/config/ivr/PhoneBarConfigHandler.js');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');
var announcementHandler = require(__baseDir + '/dishui/config/ivr/AnnouncementHandler');
var textAnnouncementHandler = require(__baseDir + '/dishui/config/ivr/TextAnnouncementHandler.js');
var soundHandler = require(__baseDir + '/dishui/config/ivr/SoundHandler');
var ivrNodeHandler = require(__baseDir + '/dishui/config/ivr/IvrNodeHandler');
var callurlHandler = require(__baseDir + '/dishui/config/ivr/CallUrlHandler');
var validationHandler = require(__baseDir + '/dishui/config/ivr/ValidationHandler');
var routeHandler = require(__baseDir + '/dishui/config/ivr/RouteHandler');
var extensionpeerHandler = require(__baseDir + '/dishui/config/ivr/ExtensionPeerHandler');
var assignmentHandler = require(__baseDir + '/dishui/config/ivr/AssignmentHandler');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');
var varHandler = require(__baseDir + '/dishui/config/ivr/VarHandler');
var serviceNoHandler = require(__baseDir + '/dishui/config/ivr/ServiceNoHandler.js');
var blackListHandler = require(__baseDir + '/dishui/config/ivr/BlackListHandler.js');
var numHandler = require(__baseDir + '/dishui/config/ivr/NumHandler.js');
var dialoutLineHandler = require(__baseDir + '/dishui/config/ivr/DialoutLineHandler.js');
var roomHandler = require(__baseDir + '/dishui/config/ivr/RoomHandler.js');
var voiceMailHandler = require(__baseDir + '/dishui/config/ivr/VoiceMailHandler.js');
var satisfactionHandler = require(__baseDir + '/dishui/config/ivr/SatisfactionHandler');
var superDialJobNumHandler = require(__baseDir + '/dishui/config/ivr/SuperDialJobNumHandler');
var interfaceCalleventHandler = require(__baseDir + '/dishui/config/callEvent/CallEventHandler');
var ivrMenuHandler = require(__baseDir + '/dishui/config/ivr/IvrMenuHandler.js');
var encryptMd5Handler = require(__baseDir + '/dishui/config/ivr/EncryptMd5Handler.js');

var self = this;

exports.getAllAccountPbx = function (data, session, callback) {
    var result = {success: false};
    var queryData = {};
    var limit = 5;
    var skip = 0;
    var page = 1;
    if (data.limit) limit = data.limit;
    if (data.page) page = parseInt(data.page);
    skip = limit * (page - 1);
    var query = data.query;
    if (query) {
        queryData = {
            $or: [
                {_id: query},
                {name: new RegExp(query)},
                {company: new RegExp(query)}
            ]
        }
    }
    mongo.db().collection(fields.DB_C5_ACCOUNT).find(queryData, {sort: {"createTime": -1}, limit: limit, skip: skip}).toArray(function (err, doc) {
        if (!err) {
            mongo.db().collection(fields.DB_C5_ACCOUNT).count(queryData, function (err, count) {
                if (err) {
                    logger.app.error(err.stack);
                    result.message = 'Get account count failure.';
                    callback(result);
                    return;
                }
                result.list = doc;
                result.count = count;
                result.page = page;
                result.success = true;
                callback(result);
            });
        } else {
            logger.app.error(err.stack);
            result.message = 'db find all account pbx error';
            callback(result);
        }
    });
}

exports.queryAccountPbx = function (data, session, callback) {
    var result = {success: false};

    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).find(data).toArray(function (err, doc) {
        if (!err) {
            if (doc && doc.length > 0) {
                result.pbxes = doc[0].pbx;
            }
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'db find accountPbx exception!!';
            callback(result);
        }
    });
}

exports.saveAccountPbxToAcs = function(data , session , callback) {
    var result = {success: false};
    data.Action = "AccountAdd";
    delete data.NickName;
    var ivrData = {
        nodeData: data,
        isStoreDB: false
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Add or update accountPbx failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        result.data = data;
        result.success = true;
        callback(result);
    });
}

exports.saveAccountPbx = function (data, session, callback) {
    var result = {success: false};

    //TODO need delete
    data.accountId = data.Account;
    if(!data.DisplayName){
        data.DisplayName = session.account.name;
    }
    var nodeData = data;
    var ivrData = {
        nodeData: nodeData,
        dbData: {
            db:'bill',
            tableName: fields.DB_PLATFORM_ACCOUNT_PRODUCT,
            condition: {"_id": nodeData.Account+"_cc"}
        }
    };
    if (data.action === 'add' || data.action === 'update') {
        var action = data.action;
        delete data.action;
        exports.queryAccountPbx({'_id': nodeData.Account+"_cc", 'pbx.PBX': nodeData.PBX}, null, function (getAccountPbxResult) {
            if (getAccountPbxResult.success) {
                ivrData.nodeData.Action = "AccountAdd";
                if(getAccountPbxResult.pbxes && getAccountPbxResult.pbxes.length > 0){
                    var curPbx = null;
                    for(var i=0; i<getAccountPbxResult.pbxes.length ;i++){
                        if(getAccountPbxResult.pbxes[i].PBX == nodeData.PBX){
                            curPbx = getAccountPbxResult.pbxes[i];
                            break;
                        }
                    }
                    if(curPbx != null){
                        curPbx.NickName = nodeData.NickName;
                        curPbx.IsDialoutIntegration = nodeData.IsDialoutIntegration;
                        curPbx.IsTransferIntegration = nodeData.IsTransferIntegration;
                        curPbx.DispatcherResend = nodeData.DispatcherResend;
                        curPbx.DispatcherAccAndId = nodeData.DispatcherAccAndId;
                        curPbx.IsRecordChannelCdr = nodeData.IsRecordChannelCdr;
                        curPbx.PbxCustomArea = nodeData.PbxCustomArea;
                        nodeData = curPbx;
                    }
                    ivrData.dbData.condition['pbx.PBX'] = nodeData.PBX;
                    ivrData.dbData.updateData = {$set: {'pbx.$': nodeData}};
                }else{
                    ivrData.dbData.updateData = {$push: {pbx: nodeData}};
                }
//                ivrData.dbData.updateData = {"$set": {pbx: nodeData}};
                ivrHandler.saveOrUpdateIvr(ivrData, null, function (err, pbxData) {
                    if (err) {
                        result.message = "Save to account pbx to ACS failure!";
                        callback(result);
                        return;
                    }

                    if (action == 'add') {
                        lineHandler.initAccountLine(data, session, function (initRes) {
                            if (!initRes.success) {
                                callback(initRes);
                                return;
                            }
                            result.lines = initRes.list;
                            systemHandler.initDialJobNum(data, null, function(dialJobNumRes){
                                if (!dialJobNumRes.success) {
                                    result.success = false;
                                    result.message = 'Update dialjobnum failure: ' + nodeUtil.inspect(data);
                                    callback(result);
                                    return;
                                }
                                result.system = dialJobNumRes.data;
                                phoneBarConfigHandler.initPhoneBarConfig(data, null, function(phoneBarRes){
                                    if (!phoneBarRes.success) {
                                        result.success = false;
                                        result.message = 'Update phonebarconfig failure: ' + nodeUtil.inspect(data);
                                        callback(result);
                                        return;
                                    }

                                    result.success = true;
                                    result.data = nodeData;
                                    callback(result);
                                    return;
                                });
                            });
                        });
                    } else {
                        result.success = true;
                        result.data = nodeData;
                        callback(result);
                    }
                });
            } else {
                callback(getAccountPbxResult);
            }
        });
    } else if (data.action === 'delete') {
        delete data.action;
        ivrData.nodeData.Action = "AccountRemove";
        ivrData.dbData.isUpdate = true;
        ivrData.dbData.updateData = {$pull: {'pbx.PBX': nodeData.PBX}};
        ivrHandler.deleteIvr(ivrData, null, callback);
    } else {
        result.message = 'udpateAccountPbx unknow action!';
        callback(result);
    }

}

exports.addAccountPbx = function (data, session, callback) {
    data.dataMap = {
        DisplayName: data.DisplayName
    }
    syncHandler.sendBillEvent('addAccPbx', data, function (result) {
        callback(result);
    });

}

exports.updateAccountPbx = function (data, session, callback) {
    syncHandler.sendBillEvent('updateAccPbx', data, function (result) {
        callback(result);
    });
}

exports.addAccountPbxAgent = function (data, session, callback) {
    data.userId = "";
    data.dataMap = {
        type: 'agent'
    };
    syncHandler.sendBillEvent('addUpdateUser', data, function (result) {
        callback(result);
    });
}

exports.updateAccountPbxAgent = function (data, session, callback) {
    data.dataMap = {role: data.role};
    syncHandler.sendBillEvent('addUpdateUser', data, function (result) {
        callback(result);
    });
}

exports.changeAgentPbx = function (data, session, callback) {
    syncHandler.sendBillEvent('changeUserPbx', data, function (result) {
        callback(result);
    });
}

exports.stopAccountPbxAgent = function (data, session, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne(data, function (err, doc) {
        if (!err) {
            doc.userId = doc._id;
            doc.status = 'disable';
            self.updateAccountPbxAgent(doc, session, callback);
        } else {
            logger.app.error(err.stack);
            result.message = err.message;
            callback(result);
        }
    });
}

exports.startAccountPbxAgent = function (data, session, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne(data, function (err, doc) {
        if (!err) {
            doc.userId = doc._id;
            doc.status = 'enable';
            self.updateAccountPbxAgent(doc, session, callback);
        } else {
            logger.app.error(err.stack);
            result.message = err.message;
            callback(result);
        }
    });
}

exports.queryUserRole = function (data, session, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    utils.removeEmptyProperty(data);
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(data).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;

            mongo.db().collection(fields.DB_APP_ROLE).find({"accountId": result.list[0].account}).toArray(function (err, docs) {
                if (!err) {
                    result.roles = docs;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    callback({success: false, list: []});
                }
            });


        } else {
            logger.app.error(err.stack);
            callback({success: false, list: [], count: 0});
        }
    });
}

exports.queryAccountPbxAgent = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.pageSize;
    delete  data['pageSize'];
    var page = data.page;
    delete  data['page'];
    pageSize = pageSize || 5;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    data.type = fields.APP_USER_TYPE_AGENT;
    var query = data.query;
    delete data['query'];
    if (query) {
        condition = new RegExp(query);
        data.$or = [
            {name: condition},
            {exten: condition}
        ];
    }
    data.product = 'cc';

    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(data, {limit: limit, skip: skip, sort: {createTime: -1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).count(data, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err.stack);
            callback({success: false, list: [], count: 0});

        }
    });


}

exports.processAccountPbxSyncEvent = function (data, callback) {
//exports.processAccountPbxSyncEvent = function(data, session, callback){
    var result = {success: false};

    var nodeData = {
        Account: data.accountId,
        PBX: data.sipConfigId,
        NickName: data.nickname,
        DisplayName: data.DisplayName,
        HttpDialoutPermit: data.isTransferIntegration,
        HttpTransferPermit: data.isDialoutIntegration
    }
    var ivrData = {
        nodeData: nodeData,
        dbData: {
            tableName: fields.DB_C5_ACCOUNT,
            condition: {"_id": nodeData.Account}
        }
    };

    if (data.action === 'add' || data.action === 'update') {
        exports.queryAccountPbx({'_id': nodeData.Account, 'pbx.PBX': nodeData.PBX}, null, function (getAccountPbxResult) {
            if (getAccountPbxResult.success) {
                ivrData.nodeData.Action = "AccountAdd";
                if (getAccountPbxResult.pbxes && getAccountPbxResult.pbxes.length > 0) {
                    ivrData.dbData.condition['pbx.PBX'] = nodeData.PBX;
                    ivrData.dbData.updateData = {$set: {'pbx.$': nodeData}};
                } else {
                    ivrData.dbData.updateData = {$push: {pbx: nodeData}};
                }
                ivrHandler.saveOrUpdateIvr(ivrData, null, function (err, pbxData) {
                    if (err) {
                        result.success = false;
                        result.message = "add or update pbx failure!";
                        callback(result);
                        return;
                    }
                    result.message = true;
                    callback(result);
                });
            } else {
                callback(getAccountPbxResult);
            }
        });
    } else if (data.action === 'delete') {
        ivrData.nodeData.Action = "AccountRemove";
        ivrData.dbData.isUpdate = true;
        ivrData.dbData.updateData = {$pull: {'pbx.PBX': nodeData.PBX}};
        ivrHandler.deleteIvr(ivrData, null, callback);
    } else {
        result.message = 'udpateAccountPbx unknow action!';
        callback(result);
    }
}

exports.moveAccountPbx = function(data, session, callback) {
    var accountId = data.accountId;
    var oldsipConfigId = data.oldsipConfigId;
    var newsipConfigId = data.newsipConfigId;

    session = session || {};
    session.user = {
        _id: 'admin',
        account: accountId
    };
    session.account = {
        _id : accountId
    }
    logger.app.info('[Move pbx] Start to move pbx: ' + nodeUtil.inspect(data));
    logger.app.info('[Move pbx] update pbx ID on DB: ' + data.accountId);
    // 1.更新数据库，把此账户下所有PBX ID更新为新的PBX ID
    exports.updatePbxIDForMovePbx(data, session, function(updateIDResult){
        if (!updateIDResult.success) {
            logger.app.error('[Move pbx] failure! update target pbx ID failure from DB: ' + nodeUtil.inspect(data));
            callback(updateIDResult);
            return;
        }
        logger.app.info('[Move pbx] update pbx ID on DB success: ' + data.accountId);

        var moveData = {
            Account: data.accountId,
            PBX: data.newsipConfigId
        };
        exports.getPbxInfoByPbxId(moveData, session, function(pbxInfoResult){
            if (!pbxInfoResult.success) {
                logger.app.error('[Move pbx] failure! count not find pbx info.' + nodeUtil.inspect(data));
                pbxInfoResult.Reason = 401;
                exports.rollbackDBForMovePbx(data, session, function(){});
                callback(pbxInfoResult);
                return;
            }
            var pbxInfo = pbxInfoResult.accountPbx;

            systemHandler.getSatisfactionOptions(moveData, session, function(satOptionResult){
                // 查询满意度选项失败也不要影响迁移
                if (!satOptionResult.success) {
                    logger.app.error('Get satisfaction option failure, but continue moving: ' + nodeUtil.inspect(moveData));
                }

                logger.app.info('[Move pbx] Sync account pbx to ACS: ' + data.accountId);
                var satOptions = satOptionResult.data;
                if (satOptions) {
                    pbxInfo.SatisfactionOptions = satOptions;
                }
                exports.saveAccountPbxToAcs(pbxInfo,session,function(syncAccountPbxResult){
                    if (!syncAccountPbxResult.success) {
                        logger.app.error('[Move pbx] Sync account new pbx failure to ACS: ' + nodeUtil.inspect(data));
                        syncAccountPbxResult.reason = 502;
                        exports.rollbackDBForMovePbx(data, session, function(){});
                        callback(syncAccountPbxResult);
                        return;
                    }
                    logger.app.info('[Move pbx] Sync account new pbx to ACS success: ' + data.accountId);

                    var syncNodeArr = [
                        // 名单节点
                        {
                            nodeName: 'User',
                            handler: userHandler,
                            syncMethod: 'saveAccountUserToAcs',
                            queryCondition: {
                                account: data.accountId,
                                status:'enable',
                                pbx: data.newsipConfigId
                            }
                        },
                        {
                            nodeName: 'DialLine',
                            handler: dialoutLineHandler,
                            queryMethod: 'queryLine',
                            queryCondition: {
                                Account: data.accountId,
                                PBX: data.newsipConfigId,
                                Dialout:true
                            },
                            syncMethod: 'saveLineForIvrTools'
                        },
                        {
                            nodeName: 'XferLine',
                            handler: dialoutLineHandler,
                            queryMethod: 'queryLine',
                            queryCondition: {
                                Account: data.accountId,
                                PBX: data.newsipConfigId,
                                Dialout:false
                            },
                            syncMethod: 'saveLineForIvrTools'
                        },
                        {
                            nodeName: 'sip',
                            queryMethod: 'queryAllSipForIvrTools',
                            handler: extensionHandler,
                            syncMethod: 'saveSip',
                            queryCondition: {
                                Account: data.accountId,
                                PBX: data.newsipConfigId
                            }
                        },
                        {
                            nodeName: 'Sound',
                            handler: soundHandler,
                            queryMethod: 'querySound',
                            syncMethod: 'saveSoundData',
                            appendData: {
                                SendFile: true,
                                preUpdateSound:{}
                            },
                            beforeSyncEvent: function(soundNode) {
                                soundNode.DBFileName = soundNode.Filename.substring(0, soundNode.Filename.indexOf('.'));
                                return soundNode;
                            }
                        },
                        {
                            nodeName: 'Announcement',
                            handler: announcementHandler
                        },
                        {
                            nodeName: 'Schedule',
                            handler: scheduleHandler,
                            syncMethod: 'saveScheduleForIvrTools'
                        },
                        {
                            nodeName: 'BlackListNode',
                            handler: numHandler,
                            queryMethod: 'queryBlackListNode'
                        },
                        {
                            nodeName: 'BlackNum',
                            handler: blackListHandler,
                            syncMethod: 'saveBlackList'
                        },
                        {
                            nodeName: 'ServiceNo',
                            handler: serviceNoHandler,
                            syncMethod: 'saveServiceNoForIvrTools'
                        },
                        {
                            nodeName: 'PhoneBarConfig',
                            handler: phoneBarConfigHandler,
                            queryMethod: 'queryPhoneBarConfig',
                            queryCondition: {
                                Account: data.accountId,
                                PBX: data.newsipConfigId,
                                IsEnable: "1"
                            },
                            syncMethod: 'savePhoneBarConfigForIvrTools'
                        },
                        {
                            nodeName: 'Queue',
                            handler: skillgroupHandler,
                            syncMethod: 'processIvrQueue',
                            beforeSyncEvent: function(oneQueue){
                                oneQueue.action = 'update';
                                if(oneQueue.AssignMembers && oneQueue.AssignMembers.length>0){
                                    var memberStr = '[';
                                    for(var k =0; k<oneQueue.AssignMembers.length;k++){
                                        memberStr += '"'+oneQueue.AssignMembers[k].agentID+':'+oneQueue.AssignMembers[k].penalty+'"';
                                        if (k !== oneQueue.AssignMembers.length - 1) {
                                            memberStr += ',';
                                        }
                                    }
                                    memberStr += ']';
                                    oneQueue.MemberToken = memberStr;
                                }else{
                                    oneQueue.MemberToken = "[]";
                                }
                            }
                        },
                        {
                            nodeName: 'TextAnnouncement',
                            handler: textAnnouncementHandler
                        },
                        {
                            nodeName: 'Ivr',
                            handler: ivrNodeHandler,
                            queryMethod: 'queryIvrNode'
                        },
                        {
                            nodeName: 'Validation',
                            handler: validationHandler,
                            syncMethod: 'saveOrUpdateValidation'
                        },
                        {
                            nodeName: 'VoiceMail',
                            handler: voiceMailHandler
                        },
                        {
                            nodeName: 'Route',
                            handler: routeHandler
                        },
                        {
                            nodeName: 'Assignment',
                            handler: assignmentHandler
                        },
                        {
                            nodeName: 'CallUrl',
                            handler: callurlHandler
                        },
                        {
                            nodeName: 'Room',
                            handler: roomHandler
                        },
                        {
                            nodeName: 'ExtensionPeer',
                            handler: extensionpeerHandler
                        },
                        {
                            nodeName: 'Satisfaction',
                            handler: satisfactionHandler
                        },
                        {
                            nodeName: 'SuperDialJobNum',
                            handler: superDialJobNumHandler
                        },
                        {
                            nodeName: 'System',
                            handler: systemHandler,
                            queryMethod: 'querySystemForIvrTools',
                            syncMethod: 'updateSystem'
                        },
                        {
                            nodeName: 'CallEvent',
                            handler: interfaceCalleventHandler,
                            queryMethod: 'queryCallEventForIvrTools'
                        },
                        {
                            nodeName: 'IvrMenu',
                            handler: ivrMenuHandler
                        },
                        {
                            nodeName: 'EncryptMd5',
                            handler: encryptMd5Handler
                        }
                    ];

                    logger.app.info('[Move pbx] Sync nodes to ACS: ' + data.accountId);
                    var syncData = {
                        Account: data.accountId,
                        PBX: data.newsipConfigId
                    };
                    moveNodePbx(syncNodeArr, syncData, session, function(moveResult){
                        if (!moveResult.success) {
                            logger.app.error('Move pbx failure: ' + nodeUtil.inspect(data));
                            moveResult.reason = 503;
                            exports.rollbackForMovePbx(data, session, function(){});
                            callback(moveResult);
                            return;
                        }
                        logger.app.info('[Move pbx] Sync nodes to ACS success: ' + data.accountId);

                        logger.app.info('[Move pbx] Reload target pbx: ' + data.accountId);
                        //set Type to reload all
                        moveData.Type = 3;
                        ivrHandler.reloadIvr(moveData, session, function(reloadResult){
                            // Reload不成功，也不回滚
                            if (!reloadResult.success) {
                                logger.app.error('Reload failure for mov pbx: ' + nodeUtil.inspect(data));
                            } else {
                                logger.app.info('[Move pbx] Reload target pbx success: ' + data.accountId);
                            }

                            logger.app.info('[Move pbx] Remove old account pbx: ' + data.accountId);
                            var removeOldPbxData = {
                                Account: data.accountId,
                                PBX: data.oldsipConfigId,
                                SkipPeerEffect: true
                            };
                            exports.removeAccountPbxFromACS(removeOldPbxData, session, function(removeOldPbxData){
                                // 删除旧PBX错误，也不影响新PBX的使用，可以忽略错误
                                if (!removeOldPbxData.success) {
                                    logger.app.error('Remove old pbx failure: ' + nodeUtil.inspect(data));
                                } else {
                                    logger.app.info('[Move pbx] Remove old account pbx success: ' + data.accountId);
                                }
                                logger.app.info('[Move pbx] Move pbx success: ' + nodeUtil.inspect(data));
                                callback({success: true});
                            });
                        });
                    });
                });

            });

        });
    });
};

function moveNodePbx(syncNodeArr, data, session, callback) {
    var syncNodeInfo = syncNodeArr.shift();
    if (!syncNodeInfo) {
        callback({success: true});
    } else {
        logger.app.info('[Move pbx]Moving node [' + syncNodeInfo.nodeName + ']');
        var queryMethod = syncNodeInfo.queryMethod;
        if (!queryMethod) {
            queryMethod = 'query' + syncNodeInfo.nodeName;
        }
        var queryCondition = syncNodeInfo.queryCondition;
        if (!queryCondition) {
            queryCondition = data;
        }
        syncNodeInfo.handler[queryMethod](queryCondition, session, function(queryResult) {
            if (!queryResult.success) {
                logger.app.error('Query ' + syncNodeInfo.nodeName + ' data failure: ' + nodeUtil.inspect(data));
                callback(queryResult);
                return;
            }
            //某些节点，数据特殊处理
            if(syncNodeInfo.nodeName == 'PhoneBarConfig'){
                queryResult.list = [ {Account:queryCondition.Account,PBX:queryCondition.PBX,list:queryResult.list} ];
            }
            if(!queryResult.list){
                if(queryResult.data) queryResult.list = queryResult.data;
            }
            recurseSyncNode(queryResult.list, syncNodeInfo, session, function(syncResult) {
                if (!syncResult.success) {
                    callback(syncResult);
                    return;
                }

                logger.app.info('[Move pbx]Moving node [' + syncNodeInfo.nodeName + '] success.');
                moveNodePbx(syncNodeArr, data, session, callback);
            });


        });
    }
}

function recurseSyncNode(nodeList, syncNodeInfo, session, callback) {
    var node = nodeList.shift();
    if (!node) {
        callback({success:true});
    } else {
        var syncMethod = syncNodeInfo.syncMethod;
        if (!syncMethod) {
            syncMethod = 'addOrUpdate' + syncNodeInfo.nodeName;
        }
        node.SynAcsSign = '1';
        if (syncNodeInfo.appendData) {
            objectUtil.mixin(node, syncNodeInfo.appendData);
        }
        if (syncNodeInfo.beforeSyncEvent) {
            syncNodeInfo.beforeSyncEvent(node);
        }
        syncNodeInfo.handler[syncMethod](node, session, function(syncResult){
            if (!syncResult.success) {
                logger.app.error('Sync ' + syncNodeInfo.nodeName + ' failure: ' + nodeUtil.inspect(node));
                callback(syncResult);
                return;
            }

            recurseSyncNode(nodeList, syncNodeInfo, session, callback);
        });
    }
}

exports.updatePbxIDForMovePbx = function(data, session, callback){
    var result = {success: false};
    mongo.db('bill').eval('movePbxProcedure({accountId:"' + data.accountId + '",oldsipConfigId:"'+ data.oldsipConfigId +
        '",newsipConfigId:"'+data.newsipConfigId+'"})', function(err, res){
        if (err) {
            result.Reason = '501';
            callback(result);
            return;
        }
        mongo.db().eval('movePbxProcedure({accountId:"' + data.accountId + '",oldsipConfigId:"'+ data.oldsipConfigId +
            '",newsipConfigId:"'+data.newsipConfigId+'"})', function(err, res){
            if (err) {
                result.Reason = '502';
                //rollback bill db
                mongo.db('bll').eval('movePbxProcedure({accountId:"' + data.accountId + '",oldsipConfigId:"'+ data.newsipConfigId +
                    '",newsipConfigId:"'+data.oldsipConfigId+'"})', function(err, res){});
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
};

exports.getPbxInfoByPbxId = function(data, session, callback) {
    var result = {success: false};
    exports.queryAccountPbx({_id:data.Account+'_cc'}, session, function(queryResult){
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }
        var pbxes = queryResult.pbxes;
        result.accountPbx = null;
        if (pbxes.length > 0) {
            var pbx = null;
            for (var i= 0,len=pbxes.length;i<len;i++) {
                pbx = pbxes[i];
                if (pbx.PBX === data.PBX) {
                    result.accountPbx = {};
                    if(pbx.NickName)
                        result.accountPbx.NickName = pbx.NickName;
                    if(pbx.IsDialoutIntegration)
                        result.accountPbx.IsDialoutIntegration = pbx.IsDialoutIntegration;
                    if(pbx.IsTransferIntegration)
                        result.accountPbx.IsTransferIntegration = pbx.IsTransferIntegration;
                    if(pbx.Account)
                        result.accountPbx.Account = pbx.Account;
                    if(pbx.PBX)
                        result.accountPbx.PBX = pbx.PBX;
                    if(pbx.DisplayName)
                        result.accountPbx.DisplayName = pbx.DisplayName;
                    if(pbx.AccountId)
                        result.accountPbx.AccountId = pbx.AccountId;
                    if(pbx.SmartAutoCallCount)
                        result.accountPbx.AutoCallStrategy = pbx.SmartAutoCallCount;
                    break;
                }
            }
        }
        result.success = true;
        callback(result);
    });
};

exports.rollbackDBForMovePbx = function(data, session, callback){
    var accountId = data.accountId;
    var oldsipConfigId = data.oldsipConfigId;
    var newsipConfigId = data.newsipConfigId;
    var rollbackDBData = {
        accountId: accountId,
        oldsipConfigId: newsipConfigId,
        newsipConfigId: oldsipConfigId
    };
    exports.updatePbxIDForMovePbx(rollbackDBData, null, function(rollbackDBResult) {
        if (!rollbackDBResult.success) {
            logger.app.error('Roll back database for move pbx failure: ' + nodeUtil.inspect(rollbackDBData));
        } else {
            logger.app.error('[Move pbx] Roll back database for move pbx success: ' + nodeUtil.inspect(rollbackDBData));
        }
        callback();
    });
}

exports.removeAccountPbxFromACS = function(data, session, callback){
    var result = {success: false};
    data.Action = 'AccountRemove';
    var ivrData = {
        nodeData: data,
        isStoreDB: false,
        isOnlyReload: true
    };
    ivrHandler.deleteIvr(ivrData, session, function(removeResult){
        if (!removeResult.success) {
            logger.app.error('Remove account pbx from ACS failure: ' + nodeUtil.inspect(data));
            callback(removeResult);
            return;
        }
        logger.app.info('Account pbx has remove! ' + nodeUtil.inspect(data));
        result.success = true;
        callback(result);
    });
};

exports.rollbackForMovePbx = function(data, session, callback){
    var accountId = data.accountId;
    var oldsipConfigId = data.oldsipConfigId;
    var newsipConfigId = data.newsipConfigId;
    exports.rollbackDBForMovePbx(data, session, function(){
        var removeNewPbxData = {
            Account: accountId,
            PBX: newsipConfigId
        };
        exports.removeAccountPbxFromACS(removeNewPbxData, session, function(removeNewPbxData){
            if (!removeNewPbxData.success) {
                logger.app.error('Remove new pbx for roll back move pbx failure: ' + nodeUtil.inspect(removeNewPbxData));
            } else {
                logger.app.error('[Move pbx] Remove new pbx for roll back move pbx success: ' + nodeUtil.inspect(removeNewPbxData));
            }

            callback();
        });
    });
};

exports.modifyAccountName = function(data, callback){
    var result = {success: false};
    var session = {
        user:{
            account:data.account
        }
    };
    exports.queryAccountPbx({account:data.account,product:'cc'}, session, function(res){
        if(res.success){
            if(res.pbxes && res.pbxes.length>0){
                exports.curModifyAccountName(data.name, res.pbxes, function(curRes){
                    if(curRes.success){
                        result.success = true;
                    }else{
                        result.message = 'sync ass failed!';
                    }
                    callback(result);
                })
            }else{
                result.message = 'account not has pbx!';
                callback(result);
                return;
            }
        }else{
            result.message = 'find account pbx failed!';
            callback(result);
            return;
        }
    })
}

exports.curModifyAccountName = function(name, pbxes ,callback){
    var result = {success: false};
    if(pbxes.length>0){
        var curPbx = pbxes.pop();
        console.log("===="+curPbx.DisplayName);
        curPbx.DisplayName = name;
        var session = {};
        exports.saveAccountPbxToAcsForModifyAccountName(curPbx,pbxes,session,function(saveRes){
            if(saveRes.success){
                exports.curModifyAccountName(saveRes.data.DisplayName, saveRes.pbxes, callback);
            }else{
                callback(result);
                return;
            }
        })
    }else{
        result.success = true;
        callback(result)
        return
    }
}

exports.saveAccountPbxToAcsForModifyAccountName = function(data, pbxes, session , callback) {
    var result = {success: false};
    data.Action = "AccountAdd";
    delete data.NickName;
    var ivrData = {
        nodeData: data,
        isStoreDB: false
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Add or update accountPbx failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        result.pbxes = pbxes;
        result.data = data;
        result.success = true;
        callback(result);
    });
}

exports.checkPbxLoadInfo = function(data, session, callback){
    var result = {
        success: false
    }
    var find = {
        product: 'cc',
        status: 'enable'
    }
    if(data.pbxId.split('.').length == 3){
        find.pbx = {$in:[ data.pbxId+'.0',data.pbxId+'.1',data.pbxId+'.2',data.pbxId+'.3',data.pbxId+'.4',
            data.pbxId+'.5',data.pbxId+'.6',data.pbxId+'.7',data.pbxId+'.8',data.pbxId+'.9',
        ]};
    }else{
        find.pbx = data.pbxId;
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).count(find,function(err,count){
        if(!err){
            result.success = true;
            result.loadCount = count;
        }else{
            result.success = false;
            result.message = 'find db failed!';
        }
        callback(result);
    })
}