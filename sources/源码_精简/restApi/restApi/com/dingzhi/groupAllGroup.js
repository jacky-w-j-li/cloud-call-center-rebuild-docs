var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    allGroup: function(req, res, next){
        var result = "404";
        mongo.db('dingzhi').collection("by_on_duty").find().toArray(function(err, aDoc){
            if(aDoc){
                var call =  aDoc[0].Call;
                var Charging =  aDoc[0].Charging;
                var Customer =  aDoc[0].Customer;
                var ElectricPin =  aDoc[0].ElectricPin;
                var indexWeek = aDoc[0].indexWeek   //索引周
                var indexNumber = aDoc[0].indexNumber   //参数参数
                var d1 = new Date();
                var d2 = new Date();
                d2.setMonth(0);
                d2.setDate(1);
                var rq = d1-d2;
                var s1 = Math.ceil(rq/(24*60*60*1000));//本年的第多少天
                //计算今天是第多少周
                var thisDay = new Date();
                var FullYear = d1.getFullYear();//本年年份
                var firstDay = new Date(FullYear,0,1);//今年的第一天
                var dayWeek = thisDay.getDay();//今天周几
                if(dayWeek == 0){dayWeek = 7;}
                startWeek = firstDay.getDay();//本年第一天周几
                if(startWeek == 0){startWeek = 7;};
                var s2 = Math.ceil(((thisDay.getTime()-firstDay.getTime())/(24*60*60*1000)+startWeek-dayWeek)/7);
                var s3 = d1.getDay();//今天是周几
                var result = {};
                //云客服组
                if(s3 == 1 ||s3 == 2){
                    result.groupMember2 = Customer[1];
                    result.Substitution2 = Customer[2];
                }else if(s3 == 3 ||s3 == 4){
                    result.groupMember2 = Customer[3];
                    result.Substitution2 = Customer[5];
                }else if(s3 == 5 ||s3 == 6){
                    result.groupMember2 = Customer[2];
                    result.Substitution2 = Customer[4];
                }else{
                    result.groupMember2 = Customer[4];
                    result.Substitution2 = Customer[5];
                }

                //计费组
                if(s3 == 1 ||s3 == 2 ||s3 == 3 ||s3 == 4 ||s3 == 5 ) {
                    result.groupMember4 = Charging[1];
                    result.Substitution4 = Charging[3];
                }else{
                    result.groupMember4 = Charging[2];
                    result.Substitution4 = Charging[3];
                }
                //通话组
                if(s2 ==indexWeek ){
                    //如果是本周
                    result.groupMember1 = call[indexNumber];

                    var nextNumber = parseInt(indexNumber)+1;
                    if(nextNumber>6){
                        nextNumber = 1;
                    }
                    result.Substitution1 = call[nextNumber];
                }else{
                    //如果是下一周
                    var indexNumber =indexNumber+1;
                    if(indexNumber>6) {
                        indexNumber = 1;
                    }
                        mongo.db('dingzhi').collection("by_on_duty").update({_id: "1480129002"}, {$set:{indexNumber: indexNumber}}, function (err) {
                            if(err){
                                log.app.info(" request["+req.id()+"] body ["+"lastUseNum update failed"+"]");
                            }
                        });
                        mongo.db('dingzhi').collection("by_on_duty").update({_id: "1480129002"}, {$set:{indexWeek: s2}}, function (err) {
                            if(err){
                                log.app.info(" request["+req.id()+"] body ["+"lastUseNum update failed"+"]");
                            }
                        });

                    result.groupMember1 = call[indexNumber];
                    var nextNumber = indexNumber+1;
                    if(nextNumber>6){
                        nextNumber = 1;
                    }
                    result.Substitution1 = call[nextNumber];
                }
                //电销组
                var b = s2%2;
                if(b==0){
                    result.groupMember3 = ElectricPin[2];
                    result.Substitution3 =ElectricPin[3];
                }else{
                    result.groupMember3 = ElectricPin[1];
                    result.Substitution3 =ElectricPin[3];
                };
                util.sendStrResult(JSON.stringify(result), res, req.id());
                return next();
            }else{
                util.sendStrResult(result, res, req.id());
                return;
            }
        });
    }





};

var self = {
    parsePostActionData: function(req){
        var action = {};
        if (typeof req.body == "object") {
            log.app.info(" request["+req.id()+"] body ["+JSON.stringify(req.body) +"]");
        }else{
            log.app.info(" request["+req.id()+"] body ["+req.body +"]");
        }
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            if (typeof req.body == "object") {
                action.data = query;
            }else{
                action.data = JSON.parse(query);
            }
        } catch (e) {
            action.err = e.message;
            log.app.error("json parse error:",e);
        }
        return action;
    }
}

module.exports = service;
