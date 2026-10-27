var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var uuid = require('appUtil/UUID');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var querystring = require('querystring');
var httpProvider = require("appHttp");
var fields = require(__baseDir + '/dishui/common/Fields');
var pbxHandler = require(__baseDir + '/dishui/config/ivr/PbxHandler');
var announcementHandler = require(__baseDir + '/dishui/config/ivr/AnnouncementHandler');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');
var ivrUserHandler = require(__baseDir + '/dishui/config/ivr/UserHandler.js');
var soundHandler = require(__baseDir + '/dishui/config/ivr/SoundHandler');
var ivrNodeHandler = require(__baseDir + '/dishui/config/ivr/IvrNodeHandler');
var callurlHandler = require(__baseDir + '/dishui/config/ivr/CallUrlHandler');
var validationHandler = require(__baseDir + '/dishui/config/ivr/ValidationHandler');
var routeHandler = require(__baseDir + '/dishui/config/ivr/RouteHandler');
var businessUtil = require('appUtil/BusinessUtil');
var extensionpeerHandler = require(__baseDir + '/dishui/config/ivr/ExtensionPeerHandler');
var assignmentHandler = require(__baseDir + '/dishui/config/ivr/AssignmentHandler');
var systemHandler = require(__baseDir + '/dishui/config/ivr/SystemHandler');
var extensionHandler = require(__baseDir + '/dishui/config/ivr/ExtensionHandler.js');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');
var ivrFlowHandler = require(__baseDir + '/dishui/config/ivr/IvrFlowHandler');
var varHandler = require(__baseDir + '/dishui/config/ivr/VarHandler');
var textAnnouncementHandler = require(__baseDir + '/dishui/config/ivr/TextAnnouncementHandler.js');
var serviceNoHandler = require(__baseDir + '/dishui/config/ivr/ServiceNoHandler.js');
var blackListHandler = require(__baseDir + '/dishui/config/ivr/BlackListHandler.js');
var phoneBarConfigHandler = require(__baseDir + '/dishui/config/ivr/PhoneBarConfigHandler.js');
var dialoutLineHandler = require(__baseDir + '/dishui/config/ivr/DialoutLineHandler.js');
var encryptMd5Handler = require(__baseDir + '/dishui/config/ivr/EncryptMd5Handler.js');
var roomHandler = require(__baseDir + '/dishui/config/ivr/RoomHandler.js');
var ivrMenuHandler = require(__baseDir + '/dishui/config/ivr/IvrMenuHandler.js');
var voiceMailHandler = require(__baseDir + '/dishui/config/ivr/VoiceMailHandler.js');
var satisfactionHandler = require(__baseDir + '/dishui/config/ivr/SatisfactionHandler');
var superDialJobNumHandler = require(__baseDir + '/dishui/config/ivr/SuperDialJobNumHandler');
var accountPbxHandler = require(__baseDir + '/dishui/config/account/AccountPbxHandler');
var userHandler = require(__baseDir + '/dishui/config/ivr/UserHandler');
var accountHandler = require(__baseDir + '/dishui/config/account/AccountHandler');
var interfaceCalleventHandler = require(__baseDir + '/dishui/config/callEvent/CallEventHandler');

exports.saveOrUpdateIvr = function (data, session, callback) {
    var errorMessage = "";
    pbxHandler.queryPbx({"_id": data.nodeData.PBX}, session, function (queryResult) {
        if (!queryResult.success) {
            callback(new Error(queryResult.message));
            return;
        }

        var pbx = null;
        if (queryResult.pbx && queryResult.pbx.length > 0) {
            pbx = queryResult.pbx[0];
        } else {
            errorMessage = "PBX not found: " + data.nodeData.PBX;
            logger.app.error(errorMessage);
            callback(new Error(errorMessage));
            return;
        }
        data.nodeData.Command = "Action";
        data.nodeData.ActionID = data.nodeData.Action + Math.random();
        convertToAcsData(data.nodeData);
        //acsData = toRequireString(acsData);
        if (data.nodeData.NotSynAcs) {
            delete data.nodeData.NotSynAcs;
            saveToDB(data, function (err, nodeData) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, nodeData);
            });
        } else if (data.nodeData.SendFile) {
            delete data.nodeData.SendFile;
            data.pbx = pbx;
            sendFileToACS(data, session, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                saveToDB(data, function (err, nodeData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, nodeData);
                });
            });
        } else {
            var url = pbx.configAddr;
            if(data.nodeData.IsQiniuMusic && data.nodeData.IsQiniuMusic == 'yes'){
                if(url.slice(-1) === '/'){
                    url = url.slice(0,-1);
                }
                url += "/command?";
                url += querystring.stringify(data.nodeData);
            }
            httpProvider.sendPost(url, data.nodeData, function (err, resData) {
                if (err) {
                    logger.app.error(err);
                    callback(err);
                    return;
                }
                resData = JSON.parse(resData.toString());
                if (!resData.Succeed) {
                    errorMessage = "Synchronize ACS failure: " + resData.Message;
                    logger.app.error(errorMessage);
                    callback(new Error(errorMessage));
                    return;
                }
                if (data.synAcsSign == '1' || data.nodeData.SynAcsSign == '1' || data.nodeData.synAcsSign == '1') {
                    callback(null, "success");
                    return;
                }else{
                    saveToDB(data, function (err, nodeData) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, nodeData);
                    });
                }
            });
        }
    });
};

function sendFileToACS(data, session, callback) {
    var pbx = data.pbx;
    delete data.pbx;
    var dbFileName = data.nodeData.DBFileName;
    delete data.nodeData.DBFileName;

    mongo.readFileFromDb(dbFileName, function(err,fileData,info){
        if(err) {
            callback(err);
            return;
        }
        var url = querystring.stringify(data.nodeData);
        if(pbx.configAddr.slice(-1) === '/'){
            pbx.configAddr = pbx.configAddr.slice(0,-1);
        }
        httpProvider.sendDBFile(pbx.configAddr + '/command?' + url, fileData, function (err, resultData) {
            if (err) {
                callback(err);
                return;
            }
            var resultData = JSON.parse(resultData.toString());
            if (!resultData.Succeed) {
                var errorMessage = "Synchronize ACS failure: " + resultData.Message;
                logger.app.error(errorMessage);
                callback(new Error(errorMessage));
                return;
            }
            callback(null);
        });
    });
}

function saveToDB(data, callback) {
    delete data.nodeData['Action'];
    delete data.nodeData['Command'];
    delete data.nodeData['ActionID'];
    if (data.isStoreDB === undefined || data.isStoreDB) {
        var condition = null;
        if (data.currentData) {
            data.nodeData = data.currentData;
        }
        if (data.dbData.condition) {
            condition = data.dbData.condition;
        } else {
            condition = {"Account": data.nodeData.Account};
            if (data.nodeData.Exten) {
                condition.Exten = data.nodeData.Exten;
            }
            if (data.nodeData.PBX) {
                condition.PBX = data.nodeData.PBX;
            }
            if (data.nodeData._id) {
                condition._id = data.nodeData._id;
            }
        }
        var currentId = null;
        var updateData = null;
        //一些节点的语音恢复成默认语音要入库。因为前一步同步ass的时候，如果是默认语音，就不传Filename了（Filename已经被删了），入库时要加上Filename
        if(data.dbData.tableName == 'manager_ivr_announcement' || data.dbData.tableName == 'manager_ivr_validation'
            || data.dbData.tableName == 'manager_ivr_ivr' || data.dbData.tableName == 'manager_ivr_callurl'){
            if(!('Filename' in data.nodeData)){
                data.nodeData.Filename = '';
            }
        }
        //技能组的等待音乐和提示音，如果是默认，则没有Music和MusicClass,如果库的时候要有在这加上
        if(data.dbData.tableName == 'manager_ivr_skillgroup'){
            if(!('Music' in data.nodeData)){
                data.nodeData.Music = '';
            }
            if(!('MusicClass' in data.nodeData)){
                data.nodeData.MusicClass = '';
            }
        }
        if (data.dbData.updateData) {
            updateData = data.dbData.updateData;
        } else {
            if (data.nodeData._id) {
                currentId = data.nodeData._id;
                delete data.nodeData._id;
            }
            if (data.isAdd) {
                data.nodeData._id = uuid.generateUuid();
                updateData = data.nodeData;
            } else {
                updateData = {"$set": data.nodeData};
            }
        }
        var updateParam = {upsert: true};
        if (data.dbData.updateParam) {
            updateParam = data.dbData.updateParam;
        }
        if (data.nodeData.Type == 'DialoutBlackList') {
            data.nodeData.Type = '2';
        }
        updateParam['w'] = 1;
        if(data.dbData.db && data.dbData.db!=''){
            mongo.db(data.dbData.db).collection(data.dbData.tableName).update(condition,
                updateData, updateParam, function (err) {
                    if (err) {
                        logger.app.error(err);
                        callback(err);
                        return;
                    }
                    if (currentId) {
                        data.nodeData._id = currentId;
                    }
                    callback(null, data.nodeData);
                });
        }else{
            mongo.db().collection(data.dbData.tableName).update(condition,
                updateData, updateParam, function (err) {
                    if (err) {
                        logger.app.error(err);
                        callback(err);
                        return;
                    }
                    if (currentId) {
                        data.nodeData._id = currentId;
                    }
                    callback(null, data.nodeData);
                });
        }

    } else {
        callback(null, data.nodeData);
    }
}

exports.reloadIvr = function (data, session, callback) {
    var result = {success: false};
    var errorMessage = null;
    //console.debug(data);
    pbxHandler.queryPbx({"_id": data.PBX}, session, function (queryResult) {
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }

        var pbx = null;
        if (queryResult.pbx && queryResult.pbx.length > 0) {
            pbx = queryResult.pbx[0];
        } else {
            errorMessage = "PBX not found: " + data.PBX;
            logger.app.error(errorMessage);
            result.message = errorMessage;
            result.success = false;
            return;
        }

        var peerEffect = {
            Command: "Action",
            Action: "PeerEffect",
            PBX: data.PBX,
            Account: data.Account
        };
        peerEffect.ActionID = peerEffect.Action + Math.random();
        if (data.Peer) {
            peerEffect.Peer = data.Peer;
        }
        httpProvider.sendPost(pbx.configAddr, peerEffect, function (err, resData) {
            if (err) {
                logger.app.error(err);
                result.success = false;
                result.message = err.message;
                callback(result);
                return;
            }
            resData = JSON.parse(resData.toString());
            if (!resData.Succeed) {
                errorMessage = "ACS effect peer failure: " + resData.Message;
                logger.app.error(errorMessage);
                result.message = errorMessage;
                result.success = false;
                return;
            }
            data.Command = "Action";
            data.Action = "Reload";
            data.ActionID = data.Action + Math.random();
            if('Type' in data){
                if(data.Type != 0 && data.Type != 3){
                    data.Type = 2;
                }
            }else{
                data.Type = 2;
            }
            httpProvider.sendPost(pbx.configAddr, data, function (err, resData) {
                if (err) {
                    logger.app.error(err);
                    result.success = false;
                    result.message = err.message;
                    callback(result);
                    return;
                }
                resData = JSON.parse(resData.toString());
                if (!resData.Succeed) {
                    errorMessage = "ACS reload failure: " + resData.Message;
                    logger.app.error(errorMessage);
                    result.message = errorMessage;
                    result.success = false;
                    return;
                }
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.onlyReloadIvr = function (data, session, callback) {
    var result = {success: false};
    var errorMessage = null;
    pbxHandler.queryPbx({"_id": data.PBX}, session, function (queryResult) {
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }
        var pbx = null;
        if (queryResult.pbx && queryResult.pbx.length > 0) {
            pbx = queryResult.pbx[0];
        } else {
            errorMessage = "PBX not found: " + data.PBX;
            logger.app.error(errorMessage);
            result.message = errorMessage;
            result.success = false;
            return;
        }
        data.Command = "Action";
        data.Action = "Reload";
        data.ActionID = data.Action + Math.random();
        data.Type = 3;
        httpProvider.sendPost(pbx.configAddr, data, function (err, resData) {
            if (err) {
                logger.app.error(err);
                result.success = false;
                result.message = err.message;
                callback(result);
                return;
            }
            resData = JSON.parse(resData.toString());
            if (!resData.Succeed) {
                errorMessage = "ACS reload failure: " + resData.Message;
                logger.app.error(errorMessage);
                result.message = errorMessage;
                result.success = false;
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}

exports.deleteIvr = function (data, session, callback) {
    var result = {success: false};
    pbxHandler.queryPbx({"_id": data.nodeData.PBX}, session, function (queryResult) {
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }
        var pbx = {};
        if (queryResult && queryResult.pbx.length > 0) {
            for (var i in queryResult.pbx) {
                if (queryResult.pbx[i]._id === data.nodeData.PBX) {
                    pbx = queryResult.pbx[i];
                }
            }
        } else {
            pbx = queryResult.pbx[0];
        }
        data.nodeData.Command = "Action";
        data.nodeData.ActionID = data.nodeData.Action + Math.random();
        convertToAcsData(data.nodeData);
        //acsData = toRequireString(acsData);
        httpProvider.sendPost(pbx.configAddr, data.nodeData, function (err, resData) {
            if (err) {
                logger.app.error(err.stack);
                result.success = false;
                result.message = "Synchronize ACS failure!";
                callback(result);
                return;
            }
            resData = JSON.parse(resData.toString());
            if (!resData.Succeed) {
                result.success = false;
                result.message = "Synchronize ACS failure: " + resData.message;
                logger.app.error(result.message);
                callback(result);
                return;
            }
            if(data.isOnlyReload){
                exports.onlyReloadIvr(data.nodeData, session, function (reloadResult) {
                    if (!reloadResult.success) {
                        logger.app.error('Reload ivr failure after delete node: ' + data.DisplayName + ' - ' + data.Exten);
                    }else{
                        result.success = true;
                        callback(result);
                    }
                })
            }else{
                exports.reloadIvr(data.nodeData, session, function (reloadResult) {});
                if (data.isStoreDB === undefined || data.isStoreDB) {
                    if(!data.dbData.noUpdateDB){
                        if (data.currentData) {
                            data.nodeData = data.currentData;
                        }
                        var condition = null;
                        if (data.dbData.condition) {
                            condition = data.dbData.condition;
                        } else {
                            condition = {"Account": data.nodeData.Account};
                            if (data.nodeData.Exten) {
                                condition.Exten = data.nodeData.Exten;
                            }
                            if (data.nodeData._id) {
                                condition._id = data.nodeData._id;
                            }
                        }
                        if (data.dbData.isUpdate) {
                            var updateData = null;
                            if (data.dbData.updateData) {
                                updateData = data.dbData.updateData;
                            } else {
                                updateData = {$set: data.nodeData};
                            }
                            mongo.db().collection(data.dbData.tableName).update(condition,
                                updateData, {w: 1}, function (err, data) {
                                    if (err) {
                                        result.success = false;
                                        result.message = "Delete node from DB failure!";
                                        callback(result);
                                    } else {
                                        result.success = true;
                                        callback(result);
                                    }
                                });
                        } else {
                            mongo.db().collection(data.dbData.tableName).remove(condition, {w: 1}, function (err, data) {
                                if (err) {
                                    result.success = true;
                                    callback(result);
                                    return;
                                }
                                result.success = true;
                                callback(result);
                            });
                        }
                    }
                }else {
                    result.success = true;
                    callback(result);
                }
            }
        });
    });
};

exports.getAllNodesByPbx = function (data, session, callback) {
    var result = {success: false};
    var allNodes = {};
    data.ServiceNo = null;
    announcementHandler.queryAnnouncement(data, session, function (annRes) {
        if (!annRes.success) {
            callback(result);
            return;
        }
        delete data.ServiceNo;
        allNodes.ivr_node_announcement = annRes.list;
        skillgroupHandler.queryQueue(data, session, function (skRes) {
            if (!skRes.success) {
                callback(result);
                return;
            }
            allNodes.ivr_node_queue = skRes.list;
            var userData = {
                account: data.Account,
                pbx: data.PBX
            };
            ivrUserHandler.queryUser(userData, session, function (userRes) {
                if (!userRes.success) {
                    callback(result);
                    return;
                }
                allNodes.account_user = userRes.list;
                ivrNodeHandler.queryIvrNode(data, session, function (ivrRes) {
                    if (!ivrRes.success) {
                        callback(result);
                        return;
                    }
                    allNodes.ivr_node_ivr = ivrRes.list;
                    callurlHandler.queryCallUrl(data, session, function (urlRes) {
                        if (!urlRes.success) {
                            callback(result);
                            return;
                        }
                        allNodes.ivr_node_call_url = urlRes.list;
                        validationHandler.queryValidation(data, session, function (valiRes) {
                            if (!valiRes.success) {
                                callback(result);
                                return;
                            }
                            allNodes.ivr_node_validation = valiRes.list;
                            routeHandler.queryRoute(data, session, function (routeRes) {
                                if (!routeRes.success) {
                                    callback(result);
                                    return;
                                }
                                allNodes.ivr_node_route = routeRes.list;
                                extensionpeerHandler.queryExtensionPeer(data, session, function (extensionRes) {
                                    if (!extensionRes.success) {
                                        callback(result);
                                        return;
                                    }
                                    allNodes.ivr_node_extension_peer = extensionRes.list;
                                    assignmentHandler.queryAssignment(data, session, function (assignmentRes) {
                                        if (!assignmentRes.success) {
                                            callback(result);
                                            return;
                                        }
                                        allNodes.ivr_node_assignment = assignmentRes.list;
                                        systemHandler.querySystem(data, session, function (sysRes) {
                                            if (!sysRes.success) {
                                                callback(result);
                                                return;
                                            }
                                            allNodes.system = sysRes.list;
                                            extensionHandler.querySip(data, session, function (sipRes) {
                                                if (!sipRes.success) {
                                                    callback(result);
                                                    return;
                                                }
//                                                sipRes.list = sipRes.list.map(function (item) {
//                                                    if (item.ExtenType == 'sip') {
//                                                        item.SipTypeName = '软电话';
//                                                    } else if (item.ExtenType == 'gateway') {
//                                                        item.SipTypeName = '网关';
//                                                    } else {
//                                                        item.SipTypeName = '直线';
//                                                    }
//                                                    return item;
//                                                });
                                                allNodes.ivr_sip = sipRes.list;
                                                scheduleHandler.querySchedule(data, session, function (scheduleRes) {
                                                    if (!scheduleRes.success) {
                                                        callback(result);
                                                        return;
                                                    }
                                                    allNodes.ivr_schedule = scheduleRes.list;
                                                    ivrFlowHandler.queryFlow(data, session, function (flowRes) {
                                                        result.allFlows = flowRes.list;
                                                        var findVar = {
                                                            '$or': [{Account:'admin'}, {Account:data.Account, PBX:data.PBX}]
                                                        }
                                                        varHandler.queryVar(findVar, session, function (varRes) {
                                                            allNodes.vars = varRes.list;
                                                            textAnnouncementHandler.queryTextAnnouncement(data, session, function (textAnnouncementRes) {
                                                                if (!textAnnouncementRes.success) {
                                                                    callback(result);
                                                                    return;
                                                                }
                                                                allNodes.ivr_node_text_announcement = textAnnouncementRes.list;
                                                                serviceNoHandler.queryServiceNo(data, session, function (serviceNoRes) {
//                                                                    serviceNoRes.list = serviceNoRes.list.map(function (item) {
//                                                                        if (item.Type == 'normal') {
//                                                                            item.NoTypeName = '普通';
//                                                                        }
//                                                                        if (item.Type == 'batchDialout') {
//                                                                            item.NoTypeName = '批量外呼';
//                                                                        }
//                                                                        delete item.Update;
//                                                                        return item;
//                                                                    });
                                                                    //result.allServiceNos = serviceNoRes.list;
                                                                    allNodes.ivr_service_no = serviceNoRes.list;
                                                                    blackListHandler.queryBlackNum(data, session, function (blacklistRes) {
                                                                        if (!blacklistRes.success) {
                                                                            callback(result);
                                                                            return;
                                                                        }
                                                                        result.allBlackList = blacklistRes.list;
                                                                        phoneBarConfigHandler.queryPhoneBarConfig(data, session, function (phonebarRes) {
                                                                            if (!phonebarRes.success) {
                                                                                callback(result);
                                                                                return;
                                                                            }
                                                                            result.allPhoneBarConfig = phonebarRes.list;
                                                                            dialoutLineHandler.queryLine(data, session, function(lineRes){
                                                                                if(!lineRes.success){
                                                                                    callback(lineRes);
                                                                                    return;
                                                                                }
                                                                                allNodes.ivr_line = lineRes.list;
                                                                                soundHandler.querySound(data, session, function(soundRes){
                                                                                    if(!soundRes.success){
                                                                                        callback(soundRes);
                                                                                        return;
                                                                                    }
                                                                                    allNodes.ivr_sound = soundRes.list;
                                                                                    roomHandler.queryRoom(data, session, function(roomRes){
                                                                                        if(!roomRes.success){
                                                                                            callback(roomRes);
                                                                                            return;
                                                                                        }
                                                                                        allNodes.ivr_node_room = roomRes.list;
                                                                                        voiceMailHandler.queryVoiceMail(data, session, function(voiceMailRes){
                                                                                            if(!roomRes.success){
                                                                                                callback(roomRes);
                                                                                                return;
                                                                                            }
                                                                                            allNodes.ivr_node_voice_mail = voiceMailRes.list;
                                                                                            satisfactionHandler.querySatisfaction(data, session, function(satisRes) {
                                                                                                if (!satisRes.success) {
                                                                                                    callback(satisRes);
                                                                                                    return;
                                                                                                }
                                                                                                allNodes.ivr_node_satisfaction = satisRes.list;
                                                                                                serviceNoHandler.queryAvailableServiceNo(data, session, function(avilServiceNores){
                                                                                                    if (!avilServiceNores.success) {
                                                                                                        callback(avilServiceNores);
                                                                                                        return;
                                                                                                    }
                                                                                                    allNodes.ivr_available_service_no = avilServiceNores.list;
                                                                                                    superDialJobNumHandler.querySuperDialJobNum(data, session, function(superDialRes){

                                                                                                        allNodes.ivr_node_superDialJobNum = superDialRes.list;
                                                                                                        ivrMenuHandler.queryIvrMenu(data, session, function(ivrMenuRes){
                                                                                                            if (!ivrMenuRes.success) {
                                                                                                                callback(ivrMenuRes);
                                                                                                                return;
                                                                                                            }
                                                                                                            allNodes.ivr_node_ivr_menu = ivrMenuRes.list;
                                                                                                            encryptMd5Handler.queryEncryptMd5(data, session, function(encryptMd5Res){
                                                                                                                if (!encryptMd5Res.success) {
                                                                                                                    callback(encryptMd5Res);
                                                                                                                    return;
                                                                                                                }
                                                                                                                allNodes.ivr_node_encrypt_md5 = encryptMd5Res.list;
                                                                                                                result.data = allNodes;
                                                                                                                result.success = true;
                                                                                                                callback(result);
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

exports.getIvrExten = function (data, session, callback) {
    if (data._id) {
        var queryDefault = {
            Account: data.Account,
            PBX: data.PBX
        }
        if (data._id) {
            queryDefault._id = data._id;
        }
        var tableName = data.TableName;
        delete data.TableName;
        mongo.db().collection(tableName).findOne(queryDefault, function (err, doc) {
            if (err) {
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            if (!doc) {
                businessUtil.getIvrId(data.Account, function (err, IvrExtenData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, {Exten: IvrExtenData.ivrId, isExists: false});
                });
            } else {
                callback(null, {Exten: doc.Exten, isExists: true, doc: doc}, true, doc._id);
            }
        });
    } else {
        businessUtil.getIvrId(data.Account, function (err, IvrExtenData) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, {Exten: IvrExtenData.ivrId, isExists: false});
        });
    }
}

exports.ivrToolsSave = function(data, session, callback){
    var result = {success:false};
    var nodeTypeArr = data.NodeArr;
    var findNode ={Account:data.Account};

    var saveId = data.SaveId;
    exports.ivrToolsSaveRecord(data,session,function(err){
        if(err){
            result.message = 'insert ivrToolsSave to db failed!';
            callback(result);
            return;
        }
        //begin save nodes.
        for(var i=0 ; i<nodeTypeArr.length ; i++){

            if(nodeTypeArr[i] === 'ivr_node_announcement'){
                announcementHandler.queryAnnouncement(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_announcement',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save announcementNode: '+findRes.list[j].DisplayName);
                                    console.log('begin save announcementNode: '+findRes.list[j].DisplayName);
                                    //don't save to db ,only syn ass.
                                    findRes.list[j].synAcsSign = '1';
                                    announcementHandler.addOrUpdateAnnouncement(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save announcementNode: failed!' + saveRes.message);
                                            console.log('save announcementNode: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_announcement',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_node_text_announcement'){
                textAnnouncementHandler.queryTextAnnouncement(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_text_announcement',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save textAnnouncementNode: '+findRes.list[j].DisplayName);
                                    console.log('begin save textAnnouncementNode: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    textAnnouncementHandler.addOrUpdateTextAnnouncement(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save textAnnouncementNode: failed!' + saveRes.message);
                                            console.log('save textAnnouncementNode: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_text_announcement',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_node_ivr'){
                ivrNodeHandler.queryIvrNode(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_ivr',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_ivr: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_ivr: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    ivrNodeHandler.addOrUpdateIvr(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_ivr: failed!' + saveRes.message);
                                            console.log('save ivr_node_ivr: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_ivr',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_node_validation'){
                validationHandler.queryValidation(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_validation',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_validation: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_validation: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    validationHandler.saveOrUpdateValidation(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_validation: failed!' + saveRes.message);
                                            console.log('save ivr_node_validation: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_validation',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_node_voicemail'){
                voiceMailHandler.queryVoiceMail(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_voicemail',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_voicemail: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_voicemail: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    voiceMailHandler.addOrUpdateVoiceMail(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_voicemail: failed!' + saveRes.message);
                                            console.log('save ivr_node_voicemail: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_voicemail',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_route'){
                routeHandler.queryRoute(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_route',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_route: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_route: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    routeHandler.addOrUpdateRoute(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_route: failed!' + saveRes.message);
                                            console.log('save ivr_node_route: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_route',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_assignment'){
                assignmentHandler.queryAssignment(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_assignment',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_assignment: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_assignment: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    assignmentHandler.addOrUpdateAssignment(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_assignment: failed!' + saveRes.message);
                                            console.log('save ivr_node_assignment: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_assignment',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_callurl'){
                callurlHandler.queryCallUrl(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_assignment',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_assignment: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_assignment: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    callurlHandler.addOrUpdateCallUrl(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_assignment: failed!' + saveRes.message);
                                            console.log('save ivr_node_assignment: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_assignment',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_encrypt_md5'){
                encryptMd5Handler.queryEncryptMd5(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_encrypt_md5',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_encrypt_md5: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_encrypt_md5: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    encryptMd5Handler.addOrUpdateEncryptMd5(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_encrypt_md5: failed!' + saveRes.message);
                                            console.log('save ivr_node_encrypt_md5: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_encrypt_md5',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_room'){
                roomHandler.queryRoom(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_room',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_room: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_room: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    roomHandler.addOrUpdateRoom(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_room: failed!' + saveRes.message);
                                            console.log('save ivr_node_room: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_room',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_extension_peer'){
                extensionpeerHandler.queryExtensionPeer(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_extension_peer',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_extension_peer: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_extension_peer: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    extensionpeerHandler.addOrUpdateExtensionPeer(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_extension_peer: failed!' + saveRes.message);
                                            console.log('save ivr_node_extension_peer: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_extension_peer',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_satisfaction'){
                satisfactionHandler.querySatisfaction(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_satisfaction',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_satisfaction: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_satisfaction: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    satisfactionHandler.addOrUpdateSatisfaction(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_satisfaction: failed!' + saveRes.message);
                                            console.log('save ivr_node_satisfaction: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_satisfaction',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_ivr_menu'){
                ivrMenuHandler.queryIvrMenu(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_ivr_menu',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_ivr_menu: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_ivr_menu: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    ivrMenuHandler.addOrUpdateIvrMenu(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_ivr_menu: failed!' + saveRes.message);
                                            console.log('save ivr_node_ivr_menu: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_ivr_menu',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'system'){
                systemHandler.querySystemForIvrTools(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'system',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save system: '+findRes.list[j].DisplayName);
                                    console.log('begin save system: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    systemHandler.updateSystem(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save system: failed!' + saveRes.message);
                                            console.log('save system: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'system',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_blacklist'){
                blackListHandler.queryBlackNum(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_blacklist',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_blacklist: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_blacklist: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    blackListHandler.saveBlackList(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_blacklist: failed!' + saveRes.message);
                                            console.log('save ivr_blacklist: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_blacklist',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_account'){
                accountPbxHandler.queryAccountPbx({'_id':findNode.Account+"_cc"},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_account',total:findRes.pbxes.length},session,function(err){
                            if(findRes.pbxes && findRes.pbxes.length > 0){
                                for(var j=0 ;j<findRes.pbxes.length ; j++){
                                    logger.app.info('begin save ivr_account: '+findRes.pbxes[j].DisplayName);
                                    console.log('begin save ivr_account: '+findRes.pbxes[j].DisplayName);
                                    accountPbxHandler.saveAccountPbxToAcs(findRes.pbxes[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_account: failed!' + saveRes.message);
                                            console.log('save ivr_account: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_account',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_node_queue'){
                skillgroupHandler.queryQueue(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_queue',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_queue: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_queue: '+findRes.list[j].DisplayName);
                                    findRes.list[j].action = 'update';
                                    if(findRes.list[j].AssignMembers && findRes.list[j].AssignMembers.length>0){
                                        var memberStr = '[';
                                        for(var k =0; k<findRes.list[j].AssignMembers.length;k++){
                                            memberStr += '"'+findRes.list[j].AssignMembers[k].agentID+':'+findRes.list[j].AssignMembers[k].penalty+'"';
                                            if (k !== findRes.list[j].AssignMembers.length - 1) {
                                                memberStr += ',';
                                            }
                                        }
                                        memberStr += ']';
                                        findRes.list[j].MemberToken = memberStr;
                                    }else{
                                        findRes.list[j].MemberToken = "[]";
                                    }
                                    skillgroupHandler.processIvrQueue(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_queue: failed!' + saveRes.message);
                                            console.log('save ivr_node_queue: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_queue',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_account_user'){
                userHandler.queryUser({'account':findNode.Account,'status':'enable'},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_account_user',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_account_user: '+findRes.list[j].displayName);
                                    console.log('begin save ivr_account_user: '+findRes.list[j].displayName);
                                    userHandler.saveAccountUserToAcs(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_account_user: failed!' + saveRes.message);
                                            console.log('save ivr_account_user: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_account_user',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'c5_extension_config'){
                extensionHandler.queryAllSipForIvrTools(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'c5_extension_config',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save c5_extension_config: '+findRes.list[j].DisplayName);
                                    console.log('begin save c5_extension_config: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';

                                    extensionHandler.saveSip(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save c5_extension_config: failed!' + saveRes.message);
                                            console.log('save c5_extension_config: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'c5_extension_config',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_phonebar_config'){
                accountPbxHandler.queryAccountPbx({'_id':findNode.Account+'_cc'},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_phonebar_config',total:findRes.pbxes.length},session,function(err){
                            if(findRes.pbxes && findRes.pbxes.length > 0){
                                for(var j=0 ;j<findRes.pbxes.length ; j++){
                                    logger.app.info('begin save ivr_phonebar_config: '+findRes.pbxes[j].DisplayName);
                                    console.log('begin save ivr_phonebar_config: '+findRes.pbxes[j].DisplayName);
                                    phoneBarConfigHandler.queryPhoneBarConfig({Account:findRes.Account , PBX:findRes.pbxes[j].PBX , IsEnable: "1"},session,function(phoneBarList){
                                        if(phoneBarList.success){
                                            phoneBarConfigHandler.savePhoneBarConfigForIvrTools({Account:phoneBarList.list[0].Account,PBX:phoneBarList.list[0].PBX,list:phoneBarList.list},session,function(saveRes){
                                                if(!saveRes.success){
                                                    logger.app.error('save ivr_phonebar_config: failed!' + saveRes.message);
                                                    console.log('save ivr_phonebar_config: failed!' + saveRes.message);
                                                }
                                                exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_phonebar_config',node:saveRes.data},session,function(err){});
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'dial_line'){
                accountPbxHandler.queryAccountPbx({'account':findNode.Account,product:'cc'},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'dial_line',total:findRes.pbxes.length},session,function(err){
                            if(findRes.pbxes && findRes.pbxes.length > 0){
                                for(var j=0 ;j<findRes.pbxes.length ; j++){
                                    var curAccount = findRes.pbxes[j].Account;
                                    var curPBX = findRes.pbxes[j].PBX;
                                    logger.app.info('begin save dial_line: '+findRes.pbxes[j].DisplayName);
                                    console.log('begin save dial_line: '+findRes.pbxes[j].DisplayName);
                                    dialoutLineHandler.queryLine({'Account':findNode.Account,PBX:findRes.pbxes[j].PBX,Dialout:true},session,function(lineRes){
                                        if(lineRes.success){
                                            if(lineRes.list.length>0){
                                                var lineVo = {
                                                    Account:lineRes.list[0].Account,
                                                    PBX:lineRes.list[0].PBX,
                                                    Exten:lineRes.list[0].Exten,
                                                    DidNum:lineRes.list[0].DidNum,
                                                    Dialout:lineRes.list[0].Dialout
                                                };
                                                dialoutLineHandler.saveLineForIvrTools(lineVo,session,function(saveRes){
                                                    if(!saveRes.success){
                                                        logger.app.error('save dial_line: failed!' + saveRes.message);
                                                        console.log('save dial_line: failed!' + saveRes.message);
                                                    }
                                                    exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'dial_line',node:saveRes.data},session,function(err){});
                                                });
                                            }else{
                                                exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'dial_line',node:{Account:curAccount,PBX:curPBX}},session,function(err){});
                                            }
                                        }else{
                                            logger.app.error('save dial_line: failed!' + lineRes.message);
                                            console.log('save dial_line: failed!' + lineRes.message);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'xfer_line'){
                accountPbxHandler.queryAccountPbx({'account':findNode.Account,product:'cc'},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'xfer_line',total:findRes.pbxes.length},session,function(err){
                            if(findRes.pbxes && findRes.pbxes.length > 0){
                                for(var j=0 ;j<findRes.pbxes.length ; j++){
                                    var curAccount = findRes.pbxes[j].Account;
                                    var curPBX = findRes.pbxes[j].PBX;
                                    logger.app.info('begin save xfer_line: '+findRes.pbxes[j].DisplayName);
                                    console.log('begin save xfer_line: '+findRes.pbxes[j].DisplayName);
                                    dialoutLineHandler.queryLine({Account:findNode.Account,PBX:findRes.pbxes[j].PBX,Dialout:false},session,function(lineRes){
                                        if(lineRes.success){
                                            if(lineRes.list.length>0){
                                                var lineVo = {
                                                    Account:lineRes.list[0].Account,
                                                    PBX:lineRes.list[0].PBX,
                                                    Exten:lineRes.list[0].Exten,
                                                    DidNum:lineRes.list[0].DidNum,
                                                    Dialout:lineRes.list[0].Dialout
                                                };
                                                dialoutLineHandler.saveLineForIvrTools(lineVo,session,function(saveRes){
                                                    if(!saveRes.success){
                                                        logger.app.error('save xfer_line: failed!' + saveRes.message);
                                                        console.log('save xfer_line: failed!' + saveRes.message);
                                                    }
                                                    exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'xfer_line',node:saveRes.data},session,function(err){});
                                                });
                                            }else{
                                                exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'xfer_line',node:{Account:curAccount,PBX:curPBX}},session,function(err){});
                                            }
                                        }else{
                                            logger.app.error('save dial_line: failed!' + lineRes.message);
                                            console.log('save dial_line: failed!' + lineRes.message);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_service_no'){
                serviceNoHandler.queryServiceNo({Account:findNode.Account},session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_service_no',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_service_no: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_service_no: '+findRes.list[j].DisplayName);
                                    serviceNoHandler.saveServiceNoForIvrTools(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_service_no: failed!' + saveRes.message);
                                            console.log('save ivr_service_no: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_service_no',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else if(nodeTypeArr[i] === 'ivr_schedule'){
                scheduleHandler.querySchedule(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_schedule',total:findRes.list.length},session,function(err){

                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_schedule: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_schedule: '+findRes.list[j].DisplayName);
                                    scheduleHandler.saveScheduleForIvrTools(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_schedule: failed!' + saveRes.message);
                                            console.log('save ivr_schedule: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_schedule',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'satisfaction_options'){
                //查出账户的所有pbx进行保存ivr选项
                accountHandler.getAccountById({_id:findNode.Account}, session, function(findRes){
                    if(findRes.success){
                        var pbxList = findRes.data.pbx;
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'satisfaction_options',total:pbxList.length},session,function(err){
                            if(pbxList && pbxList.length > 0){
                                for(var j=0 ;j<pbxList.length ; j++){
                                    logger.app.info('begin save satisfaction_options: '+pbxList[j].PBX);
                                    console.log('begin save satisfaction_options: '+pbxList[j].PBX);
                                    pbxList[j].synAcsSign = '1';
                                    systemHandler.saveOptionToPbx(pbxList[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save satisfaction_options: failed!' + saveRes.message);
                                            console.log('save satisfaction_options: failed!' + saveRes.message);
                                        }
                                        var endData = {saveId:saveId,nodeType:'satisfaction_options',node:{Account:findRes.data.account}};
                                        exports.ivrToolsUpdateRecord(endData,session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_node_superDialJobNum'){
                superDialJobNumHandler.querySuperDialJobNum(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_node_superDialJobNum',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_node_superDialJobNum: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_node_superDialJobNum: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    superDialJobNumHandler.addOrUpdateSuperDialJobNum(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_node_superDialJobNum: failed!' + saveRes.message);
                                            console.log('save ivr_node_superDialJobNum: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_node_superDialJobNum',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_call_event'){
                interfaceCalleventHandler.queryCallEventForIvrTools(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_call_event',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_call_event: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_call_event: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    interfaceCalleventHandler.addOrUpdateCallEvent(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_call_event: failed!' + saveRes.message);
                                            console.log('save ivr_call_event: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_call_event',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }else if(nodeTypeArr[i] === 'ivr_sound'){
                soundHandler.querySound(findNode,session,function(findRes){
                    if(findRes.success){
                        exports.ivrToolsUpdateRecordTotal({saveId:saveId,nodeType:'ivr_sound',total:findRes.list.length},session,function(err){
                            if(findRes.list && findRes.list.length > 0){
                                for(var j=0 ;j<findRes.list.length ; j++){
                                    logger.app.info('begin save ivr_sound: '+findRes.list[j].DisplayName);
                                    console.log('begin save ivr_sound: '+findRes.list[j].DisplayName);
                                    findRes.list[j].synAcsSign = '1';
                                    objectUtil.mixin(findRes.list[j],
                                        { SendFile: true,
                                          preUpdateSound:{} });
                                    findRes.list[j].DBFileName = findRes.list[j].Filename.substring(0, findRes.list[j].Filename.indexOf('.'));
                                    soundHandler.saveSoundData(findRes.list[j],session,function(saveRes){
                                        if(!saveRes.success){
                                            logger.app.error('save ivr_sound: failed!' + saveRes.message);
                                            console.log('save ivr_sound: failed!' + saveRes.message);
                                        }
                                        exports.ivrToolsUpdateRecord({saveId:saveId,nodeType:'ivr_sound',node:saveRes.data},session,function(err){});
                                    });
                                }
                            }
                        });
                    }
                });
            }
        }
    });

    result.success = true;
    callback(result);
}
//每次保存ivr工具，在数据库加入一条记录
exports.ivrToolsSaveRecord = function(data, session, callback){
    var doc = {
        Account: data.Account,
        SaveId : data.SaveId,
        NodeArr : {},
        PBX : [],
        Time : utils.getCurrentDate()
    }
    for(var i=0 ; i<data.NodeArr.length ; i++){
        doc.NodeArr[data.NodeArr[i]] = 0;
        doc.NodeArr[data.NodeArr[i]+'_success'] = 0;
    }
    mongo.db().collection(fields.DB_IVR_TOOLS_UTIL).insert(doc, function (err) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        callback(err);
    });
};
//此方法用来更新数据库记录，存入每一种节点的 总数
exports.ivrToolsUpdateRecordTotal = function(data, session, callback){
    var find = {SaveId: data.saveId};
    var doc = {'$set':{}};
    doc['$set']['NodeArr.'+data.nodeType] = data.total;

    mongo.db().collection(fields.DB_IVR_TOOLS_UTIL).update(find , doc , function (err) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        callback(err);
    });
}
//此方法用来更新数据库记录，成功保存一个节点 计数器加1总数
exports.ivrToolsUpdateRecord = function(data, session, callback){
    var find = {SaveId: data.saveId};
    var doc = { '$inc':{},'$addToSet':{} };
    doc['$inc']['NodeArr.'+data.nodeType+'_success'] = 1;
    if(data.node){
        if(data.node.PBX){
            doc['$addToSet']['PBX'] = data.node.PBX+'_'+data.node.Account;
        }
        mongo.db().collection(fields.DB_IVR_TOOLS_UTIL).update(find , doc , function (err) {
            if (err) {
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            callback(err);
        });
    }
}
//前台轮询，保存结果方法。
exports.ivrToolsSaveStatus = function(data, session, callback){
    var result ={
        success:false
    }
    var find = {
        SaveId : data.SaveId
    };
    mongo.db().collection(fields.DB_IVR_TOOLS_UTIL).findOne(find, function (err,doc) {
        if (err) {
            logger.app.error(err.stack);
            result.message = '查询保存结果失败！';
            callback(result);
            return;
        }
        result.success = true;
        result.data = doc;
        callback(result);
    });
};

function toRequireString(data) {
    var arr = [];
    arr.push('{');
    for (var k in data) {
        arr.push('"');
        arr.push(k);
        arr.push('"');
        arr.push(':');
        arr.push('"');
        arr.push(data[k]);
        arr.push('"');
        arr.push(',');
    }
    if (arr[arr.length - 1] == ',') {
        delete arr[arr.length - 1];
    }
    arr.push('}');
    return arr.join('');
}

function convertToAcsData(data) {
    var firstLetter;
    var charCode;
    for (var k in data) {
        if (k != 'call-limit' && k != 'status' && k!='oldNum') {
            firstLetter = k.substr(0, 1);
            charCode = firstLetter.charCodeAt(0);
            if (charCode > 96 && charCode < 123) {
                firstLetter = String.fromCharCode((charCode - 32));
                data[firstLetter + k.substring(1)] = data[k];
                delete data[k];
            }
        }
    }
}