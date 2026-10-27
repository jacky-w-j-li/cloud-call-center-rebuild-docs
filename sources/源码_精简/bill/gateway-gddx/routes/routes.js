/**
 * Created by zhangyang on 15/4/30.
 */
var utils = require('appUtil/Utils');
var config = require('appConfig').conf;
var logger = require('appLog');
var mailHandler = require("./mailHandler");
var messageHandler = require("./messageHandler");
var statusHandler = require("./statusHandler");
var weixinHandler = require("./weixinHandler");
var weixinMenuHandler = require('./weixinMenuHandler');
var imHandler = require('./imHandler');
var newMailHandler = require('./newMailHandler');
var notifyHandler = require('./notifyHandler')
var weixinCustomServiceHandler = require('./weixinCustomServiceHandler');

var handler = {
    routeMail: function (req, res) {
        var action = impl.parseMailData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        mailHandler.handle(action, res);

    },
    routeWeixin: function (req, res) {
        var action = impl.parseWeixinData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinHandler.handle(action, res);
    },
    routeIm: function (req, res) {
        var action = impl.parseImData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        imHandler.handle(action, res);
    },
    routeNewIm: function (req, res){
        var action = impl.parseNewImData(req);
        logger.app.info("get request action[" + action._id + " | " + JSON.stringify(action) + "] from[" + utils.getReqIp(req) + "]");
        if(action.err){
            utils.sendError(action.err, res, action._id);
            return;
        }
        imHandler.handle(action, res);
    },
    routeSendMessage: function (req, res) {
        var message = impl.parseMessageData(req);
        logger.app.info("get request action[" + message._id + " | " + message.type + "] from[" + utils.getReqIp(req) + "]");
        if (message.err) {
            utils.sendError(message.err, res, message._id);
            return;
        }
        messageHandler.handle(message, res);
    },
    routeStatus: function (req, res) {
        var message = impl.parseStatusData(req);
        logger.app.info("get request action[" + message._id + " | " + message.type + "] from[" + utils.getReqIp(req) + "]");
        if (message.err) {
            utils.sendError(message.err, res, message._id);
            return;
        }
        statusHandler.handle(message, res);
    },
    routesWeixinMenu:function(req, res) {
        var action = impl.parseWeixinMenuData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinMenuHandler.handle(action, res);
    },
    routesSaveMaterial:function(req, res) {
        var action = impl.parseSaveMaterialData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinMenuHandler.handle(action, res);
    },
    routesSaveNewsMaterial:function(req, res) {
        var action = impl.parseSaveNewsMaterialData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinMenuHandler.handle(action, res);
    },
    routesUpdateNewsMaterial:function(req, res) {
        var action = impl.parseUpdateNewsMaterialData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinMenuHandler.handle(action, res);
    },
    routesGetMaterial:function(req, res) {
        var action = impl.parseGetNewsByMediaIdData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinMenuHandler.handle(action, res);
    },
    routeNewMail: function(req, res) {
        var action = impl.parseNewMailData(req);
        action.name = "newMail";
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        newMailHandler.handle(action, res);
    },
    routeNotify: function(req, res) {
        var action = impl.parseNotifyData(req);
        logger.app.info("get request action[" + action._id + " | " + action.name + "] from[" + utils.getReqIp(req) + "]");
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        notifyHandler.handle(action, res);
    },
    routeSendMail: function(req, res) {
        var action = impl.parseSendMailData(req);
            logger.app.info("send newMail action[" + action._id + " | " + action.name +"] from[" + utils.getReqIp(req) + "]");
            if (action.err) {
                utils.sendError(action.err, res, action._id);
                return;
        }
        newMailHandler.handle(action, res);
    },
    routeWeixinCustomService: function (req, res) {
        var action = impl.parseWeixinData(req);
        logger.app.info('custom service action[' + action._id + ' | ' + action.name + '] from [' + utils.getReqIp(req) + ']');
        if (action.err) {
            utils.sendError(action.err, res, action._id);
            return;
        }
        weixinCustomServiceHandler.handle(action, res);
    }
}


var impl = {
    parseStatusData: function (req) {
        var message = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            var requestData = JSON.parse(query.data);
            if (requestData.type) {
                message._id = requestData._id || utils.UUID.generateUuid();
                message.type = requestData.type;
                delete requestData.type;
                message.data = requestData;
            } else {
                message.err = "type is required!";
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            message.err = e.message;
        }
        return message;
    },

    parseMessageData: function (req) {
        var message = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info("parseMessageData:"+query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.msgType && requestData._id) {
                message._id = requestData._id;
                message.type = requestData.msgType;
                delete requestData.msgType;
                message.data = requestData;

            } else {
                message.err = "msgType and _id is required!";
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            message.err = e.message;
        }
        return message;
    },
    parseImData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info(query);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },

    parseNewImData: function (req) {
        var action = {};
        var query = req.query;
        if (req.method = 'POST') {
            query = req.body;
        }
        try {
            var requestData = undefined;
            if(query.data){
                requestData  = JSON.parse(query.data);
            }else{
                requestData = query;
            }

            if(requestData.action){
                action._id = requestData.actionId || utils.UUID.generateUuid();
                action.name = requestData.action;
                delete requestData.action;
                delete requestData.actionId;
                action.data = requestData;
                if(action.data.content){
                    action.data.message = action.data.content;
                    delete action.data.content;
                }
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("query str:"+JSON.stringify(query));
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },

    parseWeixinData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info(query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseMailData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                delete requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'not found action!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseWeixinMenuData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info(query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseSaveMaterialData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info("gateway-------parseSaveMaterialData:"+query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseSaveNewsMaterialData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info("gateway-------parseSaveNewsMaterialData:"+query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseUpdateNewsMaterialData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info("gateway-------parseUpdateNewsMaterialData:"+query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseGetNewsByMediaIdData: function (req) {
        var action = {};
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            logger.app.info("gateway-------parseGetNewsByMediaIdData:"+query.data);
            var requestData = JSON.parse(query.data);
            if (requestData.action && requestData._id) {
                action._id = requestData._id;
                action.name = requestData.action;
                delete requestData.action;
                action.data = requestData;
            } else {
                action.err = 'action and _id is required!';
            }

        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseNewMailData: function (req) {
        var action = {};
        action._id = utils.UUID.generateUuid();
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        try {
            action.name = 'newMail';
            logger.app.info(query.data);
            if (query.data) {
                if(query.data.substr(query.data.length-2,2) == '\n'){
                    query.data = query.data.substring(0,query.data.length-2);
                }
                logger.app.info(query.data);
                action.data = JSON.parse(query.data);
            } else {
                action.data = JSON.parse(query);
            }
        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },

    parseNotifyData: function (req) {
        var action = {};
        action._id = utils.UUID.generateUuid();
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        try {
            if (query.data) {
                if(query.data.substr(query.data.length-2,2) == '\n'){
                    query.data = query.data.substring(0,query.data.length-2);
                }
                logger.app.info(query.data);
                action.data = JSON.parse(query.data);
            } else {
                action.data = JSON.parse(query);
            }
            action.name = action.data.type;
        } catch (e) {
            logger.app.error("json parse error:", e);
            action.err = e.message;
        }
        return action;
    },
    parseSendMailData: function (req) {
        var action = {};
        action._id = utils.UUID.generateUuid();
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        try {
            var requestData = undefined;
console.log(query.data);
            if (query.data) {
                if(query.data.substr(query.data.length-2,2) == '\r\n'){
                    query.data = query.data.substring(0,query.data.length-2);
                }
                requestData = JSON.parse(query.data);
            }
            action.name = requestData.action;
            delete requestData.action;
            action.data = requestData;
        } catch (e) {
            logger.app.error("json parse error: " + e);
            action.err = e.message;
        }
        return action;
    }
};


module.exports = handler;
