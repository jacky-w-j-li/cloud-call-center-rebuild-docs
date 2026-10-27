/**
 * Created by yaxi on 2015-09-14.
 */
global.__baseDir = __dirname;
//var mongo = require('appDb/MongoDb');
//var utils = require('appUtil/Utils');
var httpProvider = require('appHttp');
//mongo.connectDb();
////vNm011iodVrbj635AADn
//
////var startTimeout = setInterval(function () {
////
////    if (require('appDb/MongoDb').db()) {
////        clearInterval(startTimeout);
////
////            dboper(mongo.db());
////
////
////        }
////
////    //}
////}, 500);
//
//function dboper(db){
//
//    mongo.db().collection("app_kefu_im_session").update({_id: 'b5a363f0-5c19-11e5-808d-531d99210bdc'},
//        {$set: {socketId: 'vNm011iodVrbj635AADn', port:'5002',serverIp: '115.29.10.194', isBreak: true}}, function(err, r){
//            console.log(JSON.stringify(r.result)+"----------");
//            //dboper(db)
//        });
//    //mongo.db().collection("app_kefu_im_session").update({_id: 'b5a363f0-5c19-11e5-808d-531d99210bdc'},
//    //    {$set: {isBreak: true, updatedTime: utils.getCurrentDate()}}, function(err, r){
//    //
//    //        console.log(JSON.stringify(r.result)+"+++++++++++");
//    //    });
//}
//
//
//console.log(utils.DateTime.getDifferenceTime(utils.getCurrentDate(), '2015-09-16 14:55:22'));
//var t1 = new Date().getTime();
for(var i=0; i<50; i++){

    httpProvider.sendPost("http://localhost:7700/assign","action=emailAssginByRound2&data="+JSON.stringify({peer:'10000332',account:'N00000000414'}), function(err,res){
        var res = JSON.parse(res.toString());
        console.log(res.agent);    });

    httpProvider.sendPost("http://localhost:7700/assign","action=emailAssginByRound2&data="+JSON.stringify({peer:'10000331',account:'N00000000420'}), function(err,res){
        var res = JSON.parse(res.toString());
        console.log(res.agent);
    });
}
//console.log(new Date().getTime() -t1);
//var currentAgentIndex = 5;
//if(currentAgentIndex == 5){
//    currentAgentIndex = -1;
//}
//if(currentAgentIndex <-1){
//    currentAgentIndex =-1;
//}
//var temp = currentAgentIndex;
//while(true){
//    currentAgentIndex = (currentAgentIndex +1) % 5;
//    console.log(currentAgentIndex);
//    //if(currentAgentIndex == temp){
//        if(temp == currentAgentIndex){
//        break;
//    }
//    //}
//    if(temp == -1 && currentAgentIndex == 4){
//        break;
//    }
//}
