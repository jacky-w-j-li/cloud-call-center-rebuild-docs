/**
 * Created by zhangyang on 16/4/28.
 */

/**
 * 路由定义
 * /get  获取
 * /post 修改
 * /put 添加
 * /del  删除
 *
 * url模型
 * /模块/控制文件/功能/数据
 */

var controllerPath = __baseDir + "/com";
var Thenjs = require("thenjs");
var routes = [];


var routePost = {
    didi: {
        phone: {
            bind: "",
            bindByNum: "",
            unbind: ""
        }
    },
    cc:{
        xiaohaoHz:{
            callRoute:""
        },
        xiaohaoSH:{
            callRoute:""
        }
    },
    dingzhi:{
        wkzf:{
            gsDispatch:"/:message"
        }
    },
    v20160818: {
        customer:{
            getTemplate:"/:account",
            insert: "/:account",
            update: "/:account",
            delete: "/:account",
            select: "/:account"
        },
        sso:{
            checkTokenLegal: "/:account",
                getToken: "/:account"
        },
        account:{
            getAccountInterInfo: "/:account",
            getCCAgentsByAcc:"/:account"
        },
        call:{
            dialout: "/:Account",
            hangup: "/:Account"
        },
        webChat:{
            queryWebchatSession: "/:account",
            queryWebchatMessage: "/:account"
        },
        sms: {
            getSmsTemplate: "/:account",
            sendInterfaceTemplateSms: "/:account"
        },
        user: {
            updateUser: "/:account",
            queryUserState: "/:account"
        },
        queue:{
            queryQueue: "/:account"
        },
        ability:{
            voiceVerifyStandard: "/:account"
        },
        blacknum:{
            saveBlackList:"/:account",
            delBlackList:"/:account"
        }
    }
}

var routeGet = {
    didi: {
        phone: {
            didiPbxGetBind: "/:num/:trunk_num",
            bind: "",
            bindByNum: "/:num/:A/:b",
            unbind: "/:id"
        }
    },
    cc: {
        cdr: {
            getById: "/:account/:callSheetId/:cdrVar"
        },
        xiaohao: {
            queryNum: "/:account/:number",
            queryTelNo: "/:telno",
            queryXHNum: "/:number",
            bind:"/:xhIms/:key/:telno/:telnoKey",
            calledBind:"/:xhIms/:key/:calledNo",
            unbind:"/:xhIms/:key"
        },
        xiaohaoHz:{
            getXHNum: "/:account/:number/:buinessType",
            bind:"/:account/:xhIms/:telA/:telB",
            unbind:"/:subscriptionId"
        },
        xiaohaoSH:{
            getXHNum: "/:account/:number/:buinessType",
            bind:"/:account/:xhIms/:telA/:telB",
            unbind:"/:subscriptionId"
        }
    },
    warning: {
        didi: {
            notify: "/:type/:status",
            notifyLine: "/:type/:status/:city_id"
        }
    },
    sso: {
        token:{
            checkTokenLegal: "/:token/:tokenId",
            getToken: "/:account/:exten/:password/:extentype/:timeStamp/:module"
        }
    },
    dingzhi: {
        wkzf: {
            allAgent:"/:limit/:skip",
            byEmpNoGetPhone: "/:exten",
            addEgentAndPhone: "/:agent/:phoneNum",
            deleteEgentAndPhone: "/:exten",
            updateEgentAndPhone: "/:agent/:phoneNum",
            queryAgentAndPhone:"/:account/:limit/:skip/:times",
            saveAgentAndPhone:"/:account/:exten/:phone",
            queryLatelyNum:"/:account/:phonenum",
            queryLatelyJjrNum:"/:account/:phonenum",
            hangupsmsdis:"/:message",
            gshangupsmsdis:"/:message",
            gsgettruecall:"/:message"
        },
        xinhj:{
            allAgent:"/:limit/:skip",
            byEmpNoGetPhone: "/:exten",
            addEgentAndPhone: "/:agent/:phoneNum",
            deleteEgentAndPhone: "/:exten",
            updateEgentAndPhone: "/:agent/:phoneNum"
        },
        dgdingcheng:{
            allPhone:""
        },
        groupAllGroup:{
            allGroup:""
        },
        register:{
            webSiteQueryAccountInfo:"/:name/:password",
            rl7mWebSiteYZMWebCallTryMobileVoiceCode:"/:mobile",
            rl7mWebSiteCryptonym:"/:mobile1/:mobile2"
        },
        baiduTakeout: {
            getCalledNumber: "/:callerNumber/:calledNumber/:callSheetID"
        },
        checkAccount:{
            checkAccount:"/:account"
        }
    },
    zbj: {
        zbj: {
            auth2:""
        }
    }
}

var routePut = {}

var routeDel = {}


var service = {
    init: function (server) {
        Thenjs(function (cont) {
            self.getRoutePath("", routePost);
            self.addRoutePath(routes, "post", server);
            routes.length = 0;
            cont();
        }).then(function (cont) {
            self.getRoutePath("", routeGet);
            self.addRoutePath(routes, "get", server);
            routes.length = 0;
            cont();
        }).then(function(cont){
            self.getRoutePath("", routePut);
            self.addRoutePath(routes, "put", server);
            routes.length = 0;
            cont();
        }).then(function(cont){
            self.getRoutePath("", routeDel);
            self.addRoutePath(routes, "del", server);
            routes.length = 0;
            cont();
        });
    }
}

var self = {
    addRoutePath: function (routes, method, server) {
        for (var i = 0; i < routes.length; i++) {
            var handler = self.getRouteHandler(routes[i]);
            if (handler) {
                server[method](routes[i], handler);
            }
        }
    },
    getRouteHandler: function (route) {
        var mods = route.split("/");
        mods = mods || [];
        if (mods.length >= 4) {

            var handlerStr = "require('" + controllerPath + '/' + mods[1] + '/' + mods[2] + "')." + mods[3];
            return eval(handlerStr);
        } else {
            log.app.error("init route [" + route + "] error!");
            return null;
        }
    },
    getRoutePath: function (prePath, route) {
        if (typeof route == "string" || route instanceof String) {
            if (route.length == 0) {
                routes.push(prePath);
            } else if (route.substring(0, 1) == "/") {
                routes.push(prePath + route);
            } else {
                routes.push(prePath + "/" + route);
            }
        } else {
            for (var key in route) {
                self.getRoutePath(prePath + "/" + key, route[key]);
            }
        }
    }
};

module.exports = service;
