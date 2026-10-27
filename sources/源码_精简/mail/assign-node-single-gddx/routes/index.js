var logger = require("appLog");
var actionHandler = require('./actionHandler');
var utils = require('appUtil/Utils');
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.assignAction = function (req, res){
    var reqData = parseActionData(req);
    //logger.app.info("get request[" + reqData._aid + "]" +
    //    " from [" + utils.getReqIp(req) + "]:" + JSON.stringify(reqData));

    if(reqData.err){
        utils.sendError(reqData.err, reqData._aid, res);
        return;
    }
    actionHandler.handleAction(reqData, res);
};

/**
 *
 * {
 *   action:"xxxx",
 *   data:{
 *
 *   }
 * }
 *
 * @param req
 * @returns {{}}
 */
function parseActionData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    var query = {};
    try {
        if(req.method == 'POST'){
            query = req.body;
        }else{
            query = req.query;
        };
        if (query.action && query.data) {
            action.name = query.action;
            action.data = JSON.parse(query.data);

        }else{
            action.err = 'param error! your shoud check your param!';
        }
    } catch (e) {
        logger.app.error("json request error", e);
        action.err = e.message;
    }
    return action;
}



