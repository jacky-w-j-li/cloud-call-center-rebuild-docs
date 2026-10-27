var utils = require('appUtil/Utils');
var logger = require('appLog');

var textHandler = require(__baseDir + "/7moor/weixin/msgHandler/TextHandler");
var imageHandler = require(__baseDir + "/7moor/weixin/msgHandler/ImageHandler");
var voiceHandler = require(__baseDir + "/7moor/weixin/msgHandler/VoiceHandler");
var videoHandler = require(__baseDir + "/7moor/weixin/msgHandler/VideoHandler");
var locationHandler = require(__baseDir + "/7moor/weixin/msgHandler/LocationHandler");
var linkHandler = require(__baseDir + "/7moor/weixin/msgHandler/LinkHandler");
var eventHandler = require(__baseDir + "/7moor/weixin/EventHandler");


var handlers = {
    text: textHandler.handle,
    image : imageHandler.handle,
    voice : voiceHandler.handle,
    video : videoHandler.handle,
    location : locationHandler.handle,
    link : linkHandler.handle,
    event : eventHandler.handle
}

var handler = {
    handleAction: function (data, callback) {
        var msgType = data.MsgType;
        console.log(data);
        if (msgType) {
            var msgHandler = handlers[msgType];
            if (msgHandler) {
                msgHandler(data,callback);
            } else {
                logger.app.error("can not found msg handler["+msgType+"]!", new Error("can not found msg handler!"));
            }
        } else {
            console.log("msg type is empty!");
            logger.app.error("msg type is empty!", new Error("msg type is empty!"));
        }
    }
};

module.exports = handler;