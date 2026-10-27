/**
 * Created by Administrator on 2016/2/24.
 * 在线咨询知识库
 */

var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/im/common/Fields');
var sessionHandler = require(__baseDir + '/im/SessionHandler');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;


exports.pullQAMsg = function (data, callback) {
    var result = { success: false };
    if(data.qaType == "getKmDetailInf"){
        sessionHandler.checkSession(data.sid, function (err, sessionData) {
            _impl.getKmDetail(data,sessionData,callback);
        });
    }else{
        _impl.getAccount(data, function (doc) {
            if (doc) {
                data.account  = doc.account;
                if(data.qaType == "queryCatalogListInf"){

                    _impl.queryCatalogList(data,callback);

                }else if(data.qaType == "queryItemListInf"){

                    _impl.queryItemList(data,callback);

                }else{

                }
            } else {
                result.message = "[" + data.sid + "]Session valid,send msg err" + err;
                callback(result);
            }
        });
    }

};


var _impl = {
    getAccount: function (data, callback) {
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, dbData){
            if (!err && dbData) {
                callback(dbData);
            } else {
                logger.app.error("[" + data.accessId + "]session valid,send msg err" + err);
                callback(null);
            }
        });
    },
    pullQAInfo :function(url, callback){
        var result = {success:false};
        console.log(url);
        httpProvider.sendGet(url, function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                if(res.success){
                    logger.app.info("success=============="+JSON.stringify(res));
                    result.success = true;
                    result.data = res;
                    callback(result);
                }else{
                    logger.app.warn('not found Catalog ');
                    result.message = "not found Catalog[" + url + "]";
                    callback(result);
                }
            } else {
                logger.app.error("err==============", err);
                result.message = "[" +url + "]Catalog valid,send msg err" + err;
                callback(result);
            }
        });
    },
    /**
     * 获取知识库目录，暂一层
     * @param sendData
     * @param callback
     */
    queryCatalogList : function (sendData, callback) {
        var result = {success : false};
        var url = config.qa_url+"?action=km.queryCatalogListInf";
        var query = {
            account: sendData.account
        };
        url += "&data=" + JSON.stringify(query);
        _impl.pullQAInfo(url,function(res){
            if(res.success){
                result.success     = true;
                result.qaType      = "queryItemListInf";
                result.catalogList = res.data.list;
                callback(result);
            }else{
                callback(result);
            }
        });
    },
    /**
     * 点击某个目录获取知识点
     * @param sendData
     * @param callback
     */
    queryItemList : function (sendData, callback) {
        var result = {success : false};
        var url = config.qa_url+"?action=km.queryItemListInf";
        var query = {
            account : sendData.account,
            cid     : sendData.cid,
            page    : sendData.page || 1,
            limit   : sendData.limit|| 30
        };
        url += "&data=" + JSON.stringify(query);
        _impl.pullQAInfo(url,function(res){
            if(res.success){
                result.success = true;
                result.qaType  = "getKmDetailInf";
                result.count   = res.data.count;
                result.list    = res.data.list;
                callback(result);
            }else{
                callback(result);
            }
        });
    },
    /**
     * 点击知识点获取明细
     * @param sendData
     * @param callback
     */
    getKmDetail : function (data,sessionData, callback) {
        var result = {success : true};
        callback(result);
        //Number.MAX_SAFE_INTEGER
        var message = {
            _id          : utils.UUID.generateUuid(),
            account      : sessionData.account,
            sid          : sessionData._id,
            platform     : sessionData.platform,
            when         : utils.getCurrentDateTime(),
            dateTime     : utils.getCurrentDate(),
            actionId     : utils.UUID.generateUuid(),
            action       : "sendImQAMsg",
            accessId     : sessionData.accessId,
            nickName     : sessionData.username,
            showHtml     : data.showHtml || false,
            notShow      : data.notShow,
            type         : "in",
            status       : "undeal",
            contentType  : "text",
            message      : data.content ,
            qaMsgId      : data.qaItemInfoId  //知识点id标识

        };
        for(var key in message){
            message[key] = encodeURIComponent(message[key]);
        }
        httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
            if (!err) {
                result.success = true;
            } else {
                result.success= false;
                logger.app.error("[%s, %s]error from dispather", "getKmDetail", data._aid);
                result.message =  "error from dispather";
            }
        });


    },
    /**
     * 按关键字检索知识库
     * @param sendData
     * @param callback
     */
    queryDicList : function (sendData, callback) {
        var result = {success : false};
        var url =  config.qa_url+"?action=km.queryCatalogListInf";
        var query = {
            account : sendData.account,
            key     : sendData.key,
            page    : sendData.page || 1,
            limit   : sendData.limit|| 10
        };
        url += "&data=" + JSON.stringify(query);
        _impl.pullQAInfo(url,function(res){
            if(res.success){
                result.success     = true;
                result.currentType = "queryDicListInf";
                result.nextType    = "queryDicListInf";
                result.count       = res.data.count;
                result.list        = res.data.list;
                callback(result);
            }else{
                callback(result);
            }
        });
    }


}
