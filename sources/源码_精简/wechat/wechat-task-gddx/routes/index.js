var xml2js        = require('xml2js');
var WXBizMsgCrypt = require('wechat-crypto');
var config        = require('../config');
var handle        = require('./handle');
var actions       = require('./action/action');
var accessToken   = require('./weixin/access_token');
var log           = require('appLog');
var wechatUtils   = require('./wechatUtils');
var utils         = require('appUtil/Utils');
var schedule      = require("node-schedule");
var db            = require('appDb/MongoDb');
var Thenjs = require("thenjs");
var appManager = require(__baseDir + "/7moor/appComponent/appManager");

/*
 * GET home page.
 */
module.exports = function(app) {

    var that = this;
    //that.cryptor = new WXBizMsgCrypt(config.token, config.encodingKey, config.appId);
    app.get('/', function(req, res) {
        //res.sendfile('./public/main.html');
        var action = req.query;
        res.render('index', { account: action.account,appId : action.appId});
    });

    app.get('/monitor', function(req, res) {
        res.end("200")
    });

    app.get('/command', function(req, res) {
        var action = req.query;
        actions(action, function(response){
            res.end(response);
        });
    });

    app.get('/action', function(req, res) {
        var action = req.query;
        actions(action, function(response){
            res.jsonp(response);
        });
    });

    app.get('/redirect/:account', function(req, res) {
        log.app.info('授权回调：'+req.params.account);
        accessToken.authCode(req, res);
    });

    app.post('/callback/:appId', function(req, res) {
        parsePost('callback',that, req, res, req.params.appId);
    });

    app.post('/authback/:appId', function(req, res) {
        parsePost('authback',that, req, res, req.params.appId);
    });
    app.get('/test', function(req, res) {
        res.end('success');
    });

    app.post('/command', function(req, res) {
        load(req, function (err, buf) {
            if (err) {
                req.end("error");
            }
            var data = buf.toString('utf-8');
            if (!data) {
                var emptyErr = new Error('Message body is empty');
                emptyErr.name = '7moor WeChat platform';
                res.end(emptyErr);
            }
            log.app.info('Get post action string: '+data);
            try{
                var action = JSON.parse(data);
                actions(action, function(response){
                    res.end(response);
                });
            } catch(e) {
                console.error(e);
                res.end('400');
            }

        });
    });
    app.post('/Icallback', function(req, res) {
        parsePostIcallback('Icallback',req,res);
    });
};
/**
 * 解密接受微信发送的消息
 * @param type
 * @param that
 * @param req
 * @param res
 * @param appId
 */
var parsePost = function(type, that, req, res, appId) {
    var signature = req.query.msg_signature;
    var timestamp = req.query.timestamp;
    var nonce = req.query.nonce;
    var cryptor ;
    var cryptors;
    Thenjs(function(cont){
        if(appId == "wx570bc396a51b8ff8"){ //发布监测公众号
            appManager.getAllComponentCryptor(function(err , ctrs){
                if(!err){
                    if(ctrs && !cryptors){
                        cryptors = ctrs;
                    }
                    cont(err);
                } else {
                    log.app.warn("get appId [" + appId + "] cryptors error!");
                }
            });
        } else {
            appManager.getAppCryptor(appId,function(err , ctr){
                if(!err){
                    if(ctr && !cryptor){
                        cryptor = ctr;
                    }
                    cont(err);
                } else {
                    log.app.warn("get appId [" + appId + "] cryptor error!");
                }
            });
        }
    }).then(function(cont){
        load(req, function (err, buf) {
            if (err) {
                req.end("error");
            }
            var xml = buf.toString('utf-8');
            if (!xml) {
                var emptyErr = new Error('body is empty');
                emptyErr.name = 'Wechat';
                res.end(emptyErr);
            }
            xml2js.parseString(xml, {trim: true}, function (err, result) {
                if (err) {
                    err.name = 'BadMessage' + err.name;
                    res.end(err);
                }
                var xml = formatMessage(result.xml);
                var encryptMessage = xml.Encrypt;
                if(cryptors){
                    for(var i=0;i<cryptors.length;i++){
                        if(signature == cryptors[i].getSignature(timestamp, nonce, encryptMessage)){
                            cryptor = cryptors[i];
                            break;
                        }
                    }
                }
                if (signature !== cryptor.getSignature(timestamp, nonce, encryptMessage)) {
                    //res.writeHead(401);
                    res.end('Invalid signature');
                    return;
                }
                if(cryptor.dbAppId){
                    req.dbAppId = cryptor.dbAppId;
                }
                var decrypted = cryptor.decrypt(encryptMessage);
                var messageWrapXml = decrypted.message;
                if (messageWrapXml === '') {
                    //res.writeHead(401);
                    res.end('Invalid corpid');
                }
                req.weixin_xml = messageWrapXml;
                xml2js.parseString(messageWrapXml, {trim: true}, function (err, result) {
                    if (err) {
                        err.name = 'BadMessage' + err.name;
                        return next(err);
                    }
                    req.weixin = formatMessage(result.xml);
                    distinctMsgId(req.weixin.MsgId,req.weixin.CreateTime,function(result){
                        if(result){
                            handle(type, req.weixin, req, res, appId);
                        }else{
                            req.end("MsgId is repeat");
                        }
                    });
                });
            });
        });
    });
};
/**
 * 解析第三方接口发送的消息
 * @param type
 * @param that
 * @param req
 * @param res
 * @param appId
 */
var parsePostIcallback = function(type,req, res) {
    load(req, function (err, buf) {
        if (err) {
            req.end("error");
        }
        var data = buf.toString('utf-8');
        if (!data) {
            var emptyErr = new Error('Message body is empty');
            emptyErr.name = '7moor WeChat platform';
            res.end(emptyErr);
        }
        //log.app.info('Get post action string: '+data);
        try{
            var action = JSON.parse(data);
            var query = {
                from: 'Icallback',
                _id : action.app_id
            }
            db.db().collection('wxaccount').findOne(query, ['authorizer_access_token'], function(err, doc) {
                if(err){
                    res.end('Invalid signature');
                    return;
                }
                if(doc){
                    var signature = wechatUtils.getSignature(doc.authorizer_access_token,action.timestamp,action.nonce,action.open_id);
                    if (action.msg_signature !== signature) {
                        res.end('Invalid signature');
                        return;
                    }
                    handle('Icallback',action, req, res,action.app_id);
                }
            });
        } catch(e) {
            log.app.error(e);
        }
    });
};

var load = function (stream, callback) {
    var buffers = [];
    stream.on('data', function (trunk) {
        buffers.push(trunk);
    });
    stream.on('end', function () {
        callback(null, Buffer.concat(buffers));
    });
    stream.once('error', callback);
};

/*!
 * 将xml2js解析出来的对象转换成直接可访问的对象
 */
var formatMessage = function (result) {
    var message = {};
    if (typeof result === 'object') {
        for (var key in result) {
            if (result[key].length === 1) {
                var val = result[key][0];
                if (typeof val === 'object') {
                    message[key] = formatMessage(val);
                } else {
                    message[key] = (val || '').trim();
                }
            } else {
                message = result[key].map(formatMessage);
            }
        }
    }
    return message;
};

/**
 * 对接受微信公众号推送的消息进行去重
 */
var distinctMsgId = function(msgId,timestamp,callback){
    db.db().collection('wx_msg').insert({_id:msgId,timestamp:parseInt(timestamp)},function(err){
        if(!err){
            callback(true);
        }else{
            if(JSON.stringify(err).indexOf('duplicate key error')>=0){//主键重复
                log.app.error('插入消息错误  '+err);
                callback(false);
            }else{
                callback(true);
            }
        }
    });
};
/**
 * 定时删除微信发送的msg信息
 */
module.exports.refreshWXMsg = function(){
    var rule = new schedule.RecurrenceRule();
    rule.second = 1;
    var j = schedule.scheduleJob(rule, function(){
        var currentTime = Math.ceil(utils.getCurrentDateTimeInt());
        var needRefresh = currentTime - 10;//保留十秒之内的数据
        log.app.info('更新微信msg...');
        db.db().collection('wx_msg').remove({timestamp: {$lt: needRefresh}},function(err){
            if(err){
                log.app.warn('更新微信msg出错...'+err);
            }
        });

    });
}
