//just as java's import
var fields = require(__baseDir + '/dishui/common/Fields');
var managerBase = __baseDir + '/dishui/manager/';
var userHandler = require(__baseDir + '/dishui/manager/user/UserHandler');
var accountHandler = require(__baseDir + '/dishui/manager/account/AccountHandler');
var appUtil = require('appUtil');
var session = require('appSession');
var logger = require('appLog');

exports.handle1 = function (req, res) {
    var query = req.query;
    var action = query.Action;
    var sessionId = query.SessionID;
    var data = null;
    try {
        data = JSON.parse(query.data);
    } catch (e) {
        logger.app.error("json parse error:" + e);
    }
    if (!action || !data) {
        appUtil.send500(res);
        return;
    }
    if (sessionId) {
        session.checkSession(sessionId, function (checkResult) {
            if (checkResult) {
                data.sessionId = sessionId;
                routeAction(action, data, res);
            } else {
                appUtil.sessionTimeout(res);
            }
        });
    } else if (action == fields.Login) {
        userHandler.handleLogin(data, res);
    } else {
        appUtil.send403(res);
    }

}

exports.handle = function (req, res) {
    var path = req.path;
    path = path.substring(path.indexOf('/',2)+1);
    if (path.indexOf('/') == -1) {
        if (path == fields.Login) {
            var data = parseData(req.query);
            if (data) {
                userHandler.handleLogin(data, res);
            } else {
                appUtil.send500(res);
            }

        } else {
            appUtil.send403(res);
        }
    } else {
        var data = parseData(req.query);
        if (data) {
            if(data.sessionId ){
                session.checkSession(data.sessionId, function (checkResult) {
                    if (checkResult) {
                        try{
                            var process = getProcess(path);
                            var module = require(managerBase+process.dir);
                            eval("module."+process.method+"(data,res)");
                        }catch (e){
                            logger.app.error(e);
                            appUtil.send500(res);
                        }
                    } else {
                        appUtil.sessionTimeout(res);
                    }
                });
            }else{
                appUtil.send403(res);
            }

        } else {
            appUtil.send500(res);
        }
    }
}

function getProcess(path) {
    var dir = path.substring(0, path.lastIndexOf('/'));
    var method = path.substring(path.lastIndexOf('/') + 1);
    var result = {dir: dir, method: method};
    return result;
}

function parseData(query) {
    var data = null;
    try {
        data = JSON.parse(query.data);
        //just for ext
        if(query.data.limit)data.limit=query.data.limit;
        if(query.data.page)data.page=query.data.page;
        //end for ext
    } catch (e) {
        logger.app.error("json parse error:" + e);
    }
    return data;
}


function routeAction(action, data, res) {
    if (action == fields.Test) {
        userHandler.handleTest(data, res);
    } else if (action == fields.GetClientDicCache) {
        userHandler.getClientDicCache(data, res);
    } else if (action == fields.QueryAccount) {
        accountHandler.queryAccount(data, res);
    } else {
        res.send("unkonw action!");
    }
}


