/**
 * req pre process
 */


var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");
var log = require("appLog");
var util = require("appUtil/Utils");

var whiteList = [
    "/zbj/zbj/auth2"
];


var service = {
    service: function (req, res, next) {
        var version = "";
        var interface = "/";
        if(req.url && req.url.split('/').length == 5){
            version = req.url.split('/')[1];
        }else{
            var endIndex = req.url.indexOf('?') > -1?req.url.indexOf('?'):req.url.length;
            interface = req.url.substring(0, endIndex);
        }
        var ipAddr = self.getRepIp(req);
        Thenjs(function(cont){
            self.printReqData(req , ipAddr);
            mongo.db().collection("access_ip").findOne({_id:ipAddr},cont);
        }).then(function(cont , dbIp){
            if(dbIp){
                req.trustIp = true;
                next();
            } else {
                var find = {
                    begin: {$lte: self.ipFixZore(ipAddr)},
                    end: {$gte: self.ipFixZore(ipAddr)}
                };
                mongo.db().collection("access_ip").findOne(find,cont);
            }
        }).then(function(cont , dbIpZone){
            if(dbIpZone){
                req.trustIp = true;
                next();
            }else if(version == "v20160818"){
                next();
            }else if(whiteList.indexOf(interface) > -1){
                next();
            }else {
                util.send403(res,req.id());
            }
            cont(null);
        }).fail(function(err){
            util.send500(res,req.id());
        });
    }
};

var self = {
    printReqData : function(req , ip ){
        log.app.info( req.method +" request["+req.id()+"] form [" + ip + "] for url [" + req.url +"]");
    },
    getRepIp: function (req) {
        var ipAddress;
        var forwardedIpsStr = req.header('x-forwarded-for');
        if (forwardedIpsStr) {
            var forwardedIps = forwardedIpsStr.split(',');
            ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
            ipAddress = req.connection.remoteAddress;
        }
        if(ipAddress && ipAddress.lastIndexOf(":")!= -1){
            ipAddress = ipAddress.substring(ipAddress.lastIndexOf(":")+1);
        }
        return ipAddress;
    },
    ipFixZore : function(ip){
        var segArr = ip.split('.');
        var ip = '';
        segArr.forEach(function(seg){
            ip += util.pad(seg,3);
            ip+='.';
        });
        ip = ip.slice(0,-1);
        return ip;
    }
}


module.exports = service;


