/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-21
 * Time: 下午5:52
 * To change this template use File | Settings | File Templates.
 */
//global.__baseDir = __dirname;
var Logger = require('appLog');

/**
 * 日志改成不写文件，写入数据库。

 * 目前日志分为4种级别，info/debug/warn/error
 * 分为2种类型：app/request
 *  app:应用的一般处理日志
 *  request:应用和其他平台交互时，请求第三方接口的日志，记录时需要记录url，方便之后查询。
 *
 *  之后可以考虑加入db日志。
 *  访问日志，由于使用了express，只有express才能准确的拿到日志，不过它不支持db，只支持文件。
 *
 * warn 和 error 可以传入error对象
 *
 * 之前的代码不用改，调用都是一样的，就error的记录可能出问题，大家先不用管。
 */

//for general log
/**
 * 记录日志的时候，如果发生error，尽量把error写入log，日志会记录下error得错误堆栈，这样通过日志定位问题会比较快。
 */
Logger.app.info("test this is test log");
Logger.app.debug("this is a debug log");
Logger.app.warn("this is a warn log",new Error("a error"));
Logger.app.error("error msg",new Error("this ia a error!"));

//for request url log
/**
 * 每次发起请求，尽量吧请求日志记录下来，有据可查。
 */
Logger.request.info("this is a info","http://www.baidu.com");
Logger.request.debug("this is a debug","${url}");
Logger.request.warn("this is a warn","${url}",new Error("error"));
Logger.request.error("this is a error","${url}",new Error("error"));



//global.__baseDir = __dirname;
//
//exports.testDb = function(){
//    var mongo = require('appDb/MongoDb');
//    mongo.db().collection('test').insert({name:"test",desc:"test"},function(err,doc){
//        if(err){
//           console.log(err.stack);
//        }
//    });
//    var session = {accountDb:'app_20130722'};
//    mongo.db(session).collection('test').insert({name:"test",desc:"test"},function(err,doc){
//        if(err){
//            console.log(err.stack);
//        }
//    });
//}


//var date = new Date();
//var year = date.getFullYear();
//var month = date.getMonth();
//var day = date.getDate();
//
//var hour = date.getHours();
//var minites = date.getMinutes();
//var second = date.getSeconds();
//
//console.log(year+"|"+month+"|"+day+"|"+hour+"|"+minites+"|"+second+"|");
//month = month+1>9?month+1:'0'+(month+1);
//day = day>9?day:'0'+day;
//hour = hour>9?hour:'0'+hour;
//minites = minites>9?minites:'0'+minites;
//second = second>9?second:'0'+second;
//
//console.log(year+"-"+month+"-"+day+" "+hour+":"+minites+":"+second);
//
//
//var dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
//console.log(dateStr);

//var httpProvider = require('appHttp');
//var util = require('appUtil/Utils');
//
//util.BusinessUtil.getIvrId('3242424',function(err,data){
//    if(!err){
//        console.log(data);
//    }
//});
//util.BusinessUtil.getSkillGroupNum(function(err,num){
//    if(!err){
//        console.log(num);
//    }
//});
//
//util.BusinessUtil.getSipNum(2,function(err,num){
//    if(!err){
//        console.log(num);
//    }
//});
//httpProvider.sendGet('http://www.baidu.com', function (err, res) {
//    if (err) {
//        console.log('error:', err, '\nHeaders:\n',res ? res.headers : null);
//    } else {
//        console.log('Headers:\n', res.headers,'\nBody:\n', res.body.toString());
//    }
//});

//var recive = 0;
//for(var i=0;i<100000;i++){
//    console.log("send request :++++++++++++++++++++++++++++++++"+i);
//    httpProvider.sendGet('http://10.8.15.222:3000/manager/Login?data={"username":"zhangyang","password":"123abc"}', function (err, res) {
//        recive ++;
//        if (err) {
//            console.log('error:', err, '\nHeaders:\n',res ? res.headers : null);
//        } else {
//
//            console.log("recive reqeuest:==========================="+recive);
//            //console.log('Headers:\n', res.headers,'\nBody:\n', res.body.toString());
//        }
//    });
//}
//var json = JSON.stringify({interType:"billLoginByUser",data:{fdsf:"sfdsf"}});
//httpProvider.sendPost('http://localhost:3000/service','type=billInterface&data='+json, function (err, res) {
//    if (err) {
//        console.log('error:', err, '\nHeaders:\n',res ? res.headers : null);
//    } else {
//        console.log('Headers:\n', res.headers,'\nBody:\n', res.body);
//    }
//});
//path = require('path');
//var dir = ' E:\webStorme\newappServer';
//console.log(dir);
//console.log(dir.split(path.sep).join('/'));

//console.log(require('appUtil').UUID.generateUuid());


