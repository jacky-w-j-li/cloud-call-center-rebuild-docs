var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
var pbxHandler = require(__baseDir + "/7moor/resource/PbxHandler");
var locationHandler = require(__baseDir + "/7moor/resource/LocationHandler");
var boardHandler = require(__baseDir + '/7moor/resource/BoardHandler');
var systemUserHandler = require(__baseDir + '/7moor/user/BillSystemUserHandler');
var hpLineHandler = require(__baseDir + '/7moor/resource/HpLineHandler');
var productHandler = require(__baseDir + '/7moor/product/ProductHandler');
var serviceNumHandler = require(__baseDir + '/7moor/account/BillServiceNoHandler');
//wwh
var lineHandler = require(__baseDir + '/7moor/resource/LineHandler');
var smsChannelHandler = require(__baseDir + '/7moor/resource/SmsChannelHandler');
var smsConfigHandler = require(__baseDir + '/7moor/sms/SmsConfigHandler');
var smsTemplateToCheckStatus=require(__baseDir + '/models/SmsTemplateToCheckStatus');

var Intl = require(__baseDir + '/models/Intl');
var Industry = require(__baseDir + '/models/Industry');

var gloabCacheConf = {
    pbx: pbxHandler.getPbxCache,
    ccPbx: pbxHandler.getCcPbxCache,
    location: locationHandler.getLocationCache,
    building: locationHandler.getBuildingCache,
    board: boardHandler.getBoardCache,
    ccBoard: boardHandler.getCcBoardCache,
    systemUser: systemUserHandler.getSystemUserDic,
    hpLine: hpLineHandler.getHpLineCache,
    product: productHandler.getProductCache,
    smsChannel:smsChannelHandler.getSmsChannelCache,
    role: systemUserHandler.getSystemRoleCache,
    serviceNum400: serviceNumHandler.queryServiceNum400Dic,
    serviceNum: serviceNumHandler.getServiceNumDic,
    smsTemplateToCheckStatus:smsTemplateToCheckStatus.getSmsTemplateToCheckStatusCache,

    line:lineHandler.getLineCache,//获得线路编号.线路名称   wwh
    intlCode: Intl.getCodeCache,
    industry: Industry.getCache,
    proxy: systemUserHandler.getSystemUserProxy,
    smsSign: smsConfigHandler.getSmsSignCache,
    proxyLeader: systemUserHandler.getSystemUserProxyLeader,
    proxyUserAllLower: systemUserHandler.getSystemProxyUserAllLower,
    zjOutRouteByPBX: boardHandler.getOutRouteByPBXCache,
};


var systemHandler = {
    getClientMenu: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_menu).findOne({}, function (err, doc) {
            if (!err && doc) {
                result.success = true;
                result.menu = doc;
                callback(result);
            } else {
                logger.app.warn("get system menu error", err);
                result.message = "获取菜单信息失败!";
                callback(result);
            }
        });
    },
    getClientDicCache: function (data, session, callback) {
        var result = {success: false};
        var cacheType = data.type;
        delete data.type;
        if (cacheType) {
            if (gloabCacheConf[cacheType]) {
                gloabCacheConf[cacheType](data, session, function (err, data) {
                    if (!err) {
                        result.success = true;
                        result.key = cacheType;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error('getCache[' + cacheType + '] error!', err);
                        result.message = 'getCache[' + cacheType + '] error!';
                        callback(result);
                    }
                });
            }else{
                data.codeType = cacheType;

                impl.getGeneralCodesCache(data, function (err, map) {
                    if (!err) {
                        result.success = true;
                        result.key = cacheType;
                        result.data = map[cacheType];
                        callback(result);
                    } else {
                        logger.app.warn('dicCache error!', err);
                        result.message = 'getGeneralCodesCache error!';
                        callback(result);
                    }

                });

            }
        } else {
            impl.getGeneralCodesCache({}, function (err, map) {
                if (!err) {
                    result.success = true;
                    result.dicMap = map;
                    callback(result);
                } else {
                    logger.app.warn('dicCache error!', err);
                    result.message = 'getGeneralCodesCache error!';
                    callback(result);
                }

            });
        }
    },
    initApproveSurvey: function (data, session, callback) {
        var result = {success: false};
        var options = new Array();
        var optionData1 = {
            name: '满意',
            key: utils.UUID.generateUuid(),
            state: '2'
        }
        var optionData1ChildArray = new Array();
        var optionData1Child = {
            name: '1',
            key: utils.UUID.generateUuid(),
            options: [],
            state: '2'
        }
        optionData1ChildArray.push(optionData1Child);
        optionData1.options = optionData1ChildArray;
        options.push(optionData1);
        var optionData2 = {
            name: '不满意',
            key: utils.UUID.generateUuid(),
            state: '2'
        }
        var optionData2ChildArray = new Array();
        var optionData2Child = {
            name: '2',
            key: utils.UUID.generateUuid(),
            options: [],
            state: '2'
        }
        optionData2ChildArray.push(optionData2Child);
        optionData2.options = optionData2ChildArray;
        options.push(optionData2);
        var currentData = {
            //accountId: session.user.accountId,
            accountId: data._id,
            cascade: '2',
            name: '满意度调查选项',
            headers: {'0': '满意度选项', '1': '满意值'},
            options: options,
            _id: utils.UUID.generateUuid()
        }
        mongo.db("cc").collection(constants.DB.cc_app_optiondic).insert(currentData, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.err('init approve survey failed' + currentData);
                callback(result);
            }
        });
    },
    initQualityCheckOption: function (data, session, callback) {
        var result = {success: false};

        var insertData = {
            "_id":utils.UUID.generateUuid(),
            "A-begin" : "95",
            "B-begin" : "80",
            "B-end":"94",
            "C-begin":"60",
            "C-end":"79",
            "D-end":"59",
            "account":data._id,
            "config":[
                {
                    "order" : 1,
                    "name" : "专业水平",
                    "weight" : "40"
                },
                {
                    "order" : 2,
                    "name" : "态度语气",
                    "weight" : "30"
                },
                {
                    "order" : 3,
                    "name" : "解决程度",
                    "weight" : "30"
                }
            ],
            "enable" : true,
            "memo" : "",
            "name" : "默认质检模板",
            "updateTime" : utils.DateTime.getCurrentDateTime(),
            "updateUser" : "system"
        };

//        var options = new Array();
//        var optionData1 = {
//            _id : utils.UUID.generateUuid(),
//            ACCOUNT: data._id,
//            ORDER: "1",
//            NAME: '专业水平',
//            WEIGHT: '40'
//        }
//        options.push(optionData1);
//        var optionData2 = {
//            _id : utils.UUID.generateUuid(),
//            ACCOUNT: data._id,
//            ORDER: "2",
//            NAME: '态度语气',
//            WEIGHT: '30'
//        }
//        options.push(optionData2);
//        var optionData3 = {
//            _id : utils.UUID.generateUuid(),
//            ACCOUNT: data._id,
//            ORDER: "3",
//            NAME: '解决程度',
//            WEIGHT: '30'
//        }
//        options.push(optionData3);

        mongo.db("cc").collection(constants.DB.cc_manager_quality_check_config).insert(insertData, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = 'init quality check option failure';
                callback(result);
            }
        });
    }

}

var impl = {
    getGeneralCodesCache: function (data, callback) {
        mongo.db().collection(constants.DB.system_general_codes).find(data, {sort: {codeType: -1, codeOrder: 1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var dicMap = impl.proceeCodeForMap(docs);
                callback(null, dicMap);
            } else {
                callback(err);
            }
        });
    },


    proceeCodeForMap: function (docs) {
        docs = docs || [];
        var result = {};
        var keys = [];
        for (var i = 0; i < docs.length; i++) {
            var data = docs[i];
            if (keys.contains(data.codeType)) {
                result[data.codeType].push(data);
            } else {
                keys.push(data.codeType);
                result[data.codeType] = [data];
            }
        }
        return result;
    }
};

module.exports = systemHandler;
