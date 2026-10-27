//just as java's import
var fields = require(__baseDir+'/dishui/common/Fields');
var appBase = __baseDir + '/dishui/app/';
var userHandler = require(__baseDir+'/dishui/app/user/UserHandler');
var appUtil = require('appUtil');
var session = require('appSession');
var logger = require('appLog');

exports.handle = function(req,res){
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
                            var module = require(appBase+process.dir);
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

exports.handle1 = function (req, res) {
    var query = req.query;
    var action = query.Action;
    var sessionId = query.SessionID;
    var data = null;
    try{
        data = JSON.parse(query.data);
    }catch (e){
        console.log("json parse error:"+e);
    }
    if(!action || !data ){
        appUtil.send500(res);
        return;
    }
    if(sessionId){
        session.checkSession(sessionId,function(checkResult){
            if(checkResult){
                data.sessionId = sessionId;
                routeAction(action,data,res);
            }else{
                appUtil.sessionTimeout(res);
            }
        });
    }else if(action == fields.Login){
        userHandler.handleLogin(data,res);
    }else{
        appUtil.send403(res);
    }

}

function routeAction(action,data,res){
    if(action == fields.Test){
        userHandler.handleTest(data,res);
    }else{
        res.send("unkonw action!");
    }
}


