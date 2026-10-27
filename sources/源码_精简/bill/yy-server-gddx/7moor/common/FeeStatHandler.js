var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    /**
     * 每月付费用户数统计
     * http://127.0.0.1:3000/command?command=statFee&key=7moorCommand&data={"year":"2015","month":"08"}
     * @param data
     * @param callback
     */
    statFee: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var year=data.year;
        var month=data.month;

        handler._statAccNumByMonth(year,month,function(rep){
            if(rep.success){
                result.payAccNum=rep.payAccNum;
                handler._statAccountByMonth(year,month,function(rep){
                    if(rep.success){
                        result.accNum=rep.accNum;
                        result.rate=utils.format2Decimal((result.payAccNum/result.accNum)*100)+"%";

                        handler._statPayFeeByMonth(year,month,function(rep){
                            if(rep.success){
                                result.payFee=utils.format2Decimal(rep.payFee);

                                handler._statAccActualFeeByMonth(year,month,function(rep){
                                    if(rep.success){
                                        result.totalFee=utils.format2Decimal(rep.totalFee);

                                        result.callFee=rep.callFee;
                                        result.zjNumFee=rep.zjNumFee;
                                        result.ccNumFee=rep.ccNumFee;
                                        result.licenceFee=rep.licenceFee;

                                        result.success=true;
                                        callback(result);
                                    }else{
                                        callback(rep);
                                    }
                                });
                            }else{
                                callback(rep);
                            }
                        });
                    }else{
                        callback(rep);
                    }
                });
            }else{
                callback(rep);
            }
        });
    },
    //每月付费用户数量
    _statAccNumByMonth:function(year,month,callback){
        var result = {success: false};
        var _date=new RegExp(year+month);
        var query={_id:_date};
        mongo.db("zj").collection("user_bank_pay").distinct("account", query, function (err, list) {
            if(!err){
                list=list||[];
                result.payAccNum=list.length;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    //当月产生消费的总用户数
    _statAccountByMonth:function(year,month,callback){
        var result = {success: false};
        var query={year:year,month:month,actualConsume:{$gt:0}};
        mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list) {
            if(!err){
                list=list||[];
                result.accNum=list.length;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
        /*        mongo.db("bill_data").collection("bill_call_consume").count(query,function(err,count){
         if(!err){
         result.accNum=count;
         result.success=true;
         callback(result);
         }else{
         logger.app.error(err);
         callback(result);
         }
         });*/
    },
    //每月账户充值总金额
    _statPayFeeByMonth:function(year,month,callback){
        var result = {success: false};
        var _date=new RegExp(year+month);
        var query={_id:_date};
        mongo.db("zj").collection("user_bank_pay").find(query).toArray(function(err,list){
            if(!err){
                list=list||[];
                var total=0;
                for(var i=0;i<list.length;i++){
                    var fee=list[i].money;
                    fee=parseFloat(fee);
                    total+=fee;
                }
                result.payFee=total;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    //每月账户金额实际消耗量
    _statAccActualFeeByMonth:function(year,month,callback){
        var result = {success: false};
        var query={year:year,month:month,actualConsume:{$gt:0}};
        mongo.db("bill_data").collection("bill_call_consume").find(query).toArray(function (err, list) {
            if(!err){
                list=list||[];
                var num= 0,zjNum=0;
                for(var i=0;i<list.length;i++){
                    var obj=list[i];
                    var val=obj.actualConsume;
                    var val2=obj.minConsume;
                    if(val>val2){
                        num+=val;
                    }else{
                        num+=val2;
                    }
                    if(obj.name=='zj'){
                        zjNum+=obj.monthRent
                    }
                }
                result.callFee=num/10000;
                result.zjNumFee=zjNum/10000;

                var _date=year+"-"+month+"-31";
                var query2={product:'cc',status:'use',endTime:{$gte:_date}};
                mongo.db().collection("platform_serviceNum").find(query2).toArray(function (err, list) {
                    if(!err) {
                        list = list || [];
                        var ccNum= 0;
                        for(var i=0;i<list.length;i++){
                            var obj=list[i];
                            var val=obj.monthRent;
                            ccNum+=val;
                        }
                        result.ccNumFee=ccNum/10000;

                        var query3={status:'use',endDate:{$gte:_date}};
                        mongo.db("bill").collection("platform_licence").find(query3).toArray(function (err, list) {
                            if(!err) {
                                list = list || [];
                                mongo.db("bill").collection("platform_licence").distinct("account", query3, function (err, aids) {
                                    if(!err){
                                        mongo.db("bill").collection("platform_account_product").find({'product':'cc',account:{$in:aids}}).toArray(function (err, productlist) {
                                            if(!err){
                                                productlist=productlist||[];

                                                var licenceFee= 0;
                                                for(var i=0;i<list.length;i++){
                                                    var obj=list[i];
                                                    var type=obj.licenceType;
                                                    var _num=obj.num;
                                                    var price=0;
                                                    for(var j=0;j<productlist.length;j++){
                                                        var product=productlist[j];
                                                        if(product.account==obj.account){
                                                            if(type=='enterprise'){
                                                                price=product.callinLicence;
                                                            }else if(type=='outcall'){
                                                                price=product.calloutLicence;
                                                            }else if(type=='monitor'){
                                                                price=product.monitorLicence;
                                                            }else if(type=='service'){
                                                                price=product.serviceLicence;
                                                            }
                                                            break;
                                                        }
                                                    }
                                                    licenceFee+=(price*_num)/10000;
                                                }
                                                result.licenceFee=licenceFee;
                                                result.totalFee=result.licenceFee+result.callFee+(result.zjNumFee||0)+result.ccNumFee;

                                                result.success=true;
                                                callback(result);
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });

            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },




    /**
     * 新增用户的留存情况
     * http://127.0.0.1:3000/command?command=statNewAcc&key=7moorCommand&data={"year":"2015","month":"01"}
     * {
          "success": true,
          "newAcc": 173, 当月新增充值用户数
          "leave": {},
          "message": "200 ok!"
        }
     * @param data
     * @param callback
     */
    statNewAcc: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var year=data.year;
        var month=data.month;
        handler._statNewAccByMonth(year,month,function(rep){
            callback(rep)
        })
    },
    _statNewAccByMonth:function(year,month,callback){
        var result = {success: false};
        var _date=new RegExp(year+month);
        var query={_id:_date};
        mongo.db("zj").collection("user_bank_pay").distinct("account", query, function (err, list) {
            if(!err){
                list=list||[];
                var total=0;
                var ids=[];
                var index=0;
                var findFirst=function(){
                    var aid=list[index];
                    if(aid){
                        var _date=year+"-"+month+"-01";
                        var q2={account:aid,pay_time:{$lt:_date}};
                        mongo.db("zj").collection("user_bank_pay").findOne(q2,function(err,row){
                            if(!err){
                                if(!row){
                                    total++;
                                    ids.push(aid);
                                }
                                index++;
                                findFirst();
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        })
                    }else{
                        result.newAcc=total;
                        console.info("total===="+total);
                        console.dir(ids);
                        handler._statLeaveAccByMonth(year,month,ids,function(rep){
                            if(rep.success){
                                result.leave=rep.leave;
                                result.success=true;
                                callback(result);
                            }else{
                                callback(rep);
                            }
                        })
                    }
                }
                findFirst();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _statLeaveAccByMonth:function(year,month,ids,callback){
        var result = {success: false};
        var _y=parseInt(year),_m=parseInt(month);
        var leave={};
        var idx=0;
        var checkMonth=function(){
            _m++;
            idx++;
            if(_m==13) {
                _y = 2015;
                _m = 1;
            }
            if(_m<=12){
                console.info("year===="+_y+",month===="+_m);
                if(_y<2015){
                    var _y1=_y+"",_m1=_m<10?"0"+_m:_m+"";
                    var query={account:{$in:ids},year:_y1,month:_m1,actualConsume:{$gt:0}};
                    mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list) {
                        if(!err){
                            list=list||[];
                            leave["Month"+idx]=list.length;
                            checkMonth();
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(_m<=8){
                        var _y1=_y+"",_m1=_m<10?"0"+_m:_m+"";
                        var query={account:{$in:ids},year:_y1,month:_m1,actualConsume:{$gt:0}};
                        mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list) {
                            if(!err){
                                list=list||[];
                                leave["Month"+idx]=list.length;
                                checkMonth();
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.leave=leave;
                        result.success=true;
                        callback(result);
                    }
                }

            }else{
                callback(result);
            }
        }
        if(ids.length>0){
            checkMonth();
        }else{
            result.message="ids is null";
            callback(result)
        }

        //var nowDate = new Date();
        //var months = utils.DateTime.getDateMonthSub(nowDate,endDate);
        //var date2 = utils.DateTime.dateAdd("M",months,nowDate);

    },
    /**
     * 统计每月客户流失（3个月未消费即流失,统计11月份的流失率，从8月来计算；即8月份的客户后三个月都未消费即是11月分的流失数量。）
     * http://127.0.0.1:3000/command?command=statLeaveFee&key=7moorCommand&data={"year":"2014","month":"06"}
     *  {
  "success": true,
  "accNum": 1173,//当月有消费的用户数
  "leaklist": [],
  "leaveNum": 1143,
  "num": 30 //流失数
  ｝
     * @param data
     * @param callback
     */
    statLeaveFee: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var year=data.year;
        var month=data.month;

        handler._statAccountByMonth2(year,month,function(rep){
            if(rep.success){
                result.accNum=rep.accNum;
                var list=rep.list;
                var aids=list;
                //for(var i=0;i<list.length;i++){
                //    var obj=list[i];
                //    aids.push(obj);
                //}


                var day=utils.DateTime.getDaysInOneMonth(year,month);

                var start=year+"-"+month+"-"+day+" 23:59:59";
                var date2=new Date(Date.parse(start.replace(/-/g,"/")));
                var endDate=utils.DateTime.dateAdd('M',3,date2);
                //var endDesc=utils.DateTime.getDateDesc(utils.DateTime.dateAdd('d',1,date2));
                endDate=utils.DateTime.getDateDesc(endDate)+" 23:59:59";


                var query={account:{$in:aids},createTime:{$gt:start,$lte:endDate},$or:[{actualConsume:{$gt:0}},{monthRent:{$gt:0}}]};
                mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list2) {
                    if(!err){
                        list2=list2||[];

                        var _start=year+"-"+month+"-"+day;
                        //var _end=endDesc;
                        console.info("_start===="+_start);
                        var query3={$or:[{account:{$in:aids},endDate:{$gt:_start}},{account:{$in:aids},status:{$in:['try','present']},endDate:{$lte:_start}}]}
                        mongo.db("bill").collection("platform_licence").find(query3,{fields:{account:1}}).toArray(function (err, list5) {
                            if(!err) {
                                list5 = list5 || [];
                                //console.dir(list5);
                                for (var i = 0; i < list5.length; i++) {
                                    var obj = list5[i];
                                    var num = 0;
                                    for (var j = 0; j < list2.length; j++) {
                                        var obj2 = list2[j];
                                        if (obj.account == obj2) {
                                            num++;
                                            break;
                                        }
                                    }
                                    if (num == 0) {
                                        list2.push(obj.account);
                                    }
                                }
                                //汇总有licence和话费消费的账号
                                console.info("list6===="+list2.length);
                                var leaklist = [];
                                for (var i = 0; i < list.length; i++) {
                                    var obj = list[i];
                                    var num = 0;
                                    for (var j = 0; j < list2.length; j++) {
                                        var obj2 = list2[j];
                                        if (obj == obj2) {
                                            num++;
                                            break;
                                        }
                                    }
                                    if (num == 0) {
                                        leaklist.push(obj);
                                    }
                                }

                                result.leaklist=leaklist;
                                result.leaveNum=list2.length;
                                result.num=list.length-list2.length;

                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });

                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                callback(rep);
            }
        });
    },

    _statAccountByMonth2:function(year,month,callback){
        var result = {success: false};
        var query={year:year,month:month,actualConsume:{$gt:0}};
        mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list) {
            if(!err){
                list=list||[];
                console.info("list len==="+list.length);
                //console.dir(list);
                var end=year+"-"+month+"-31";
                var start=year+"-"+month+"-01";
                var query3={status:'use',endDate:{$gte:end},beginDate:{$lte:start}};
                mongo.db("bill").collection("platform_licence").find(query3,{fields:{account:1}}).toArray(function (err, list2) {
                    if(!err){
                        list2=list2||[];
                        var list3=[];
                        for(var i=0;i<list2.length;i++){
                            var obj=list2[i];
                            var num=0;
                            for(var j=0;j<list.length;j++){
                                var obj2=list[j];
                                if(obj.account==obj2){
                                    num++;
                                    break;
                                }
                            }
                            if(num==0){
                                list.push(obj.account);
                            }
                        }
                        //汇总有licence和话费消费的账号
                        console.info("list2 len==="+list.length);
                        var idx=0;
                        var accounts=[];
                        //过滤掉从未充过值的客户
                        var checkPay=function(){
                            var aid=list[idx];
                            //console.info("aid==="+aid);
                            if(aid){
                                var q2={account:aid};
                                mongo.db("zj").collection("user_bank_pay").findOne(q2,function(err,row){
                                    if(!err && row){
                                        accounts.push(aid);
                                        idx++;
                                        checkPay()
                                    }else{
                                        //logger.app.error(err);
                                        idx++;
                                        checkPay();
                                    }
                                });
                            }else{
                                console.info("list3 len==="+accounts.length);
                                result.accNum=accounts.length;
                                result.list=accounts;
                                result.success=true;
                                callback(result);
                            }
                        }
                        checkPay();
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });


            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    /**
     * 每月有效用户数统计
     * http://127.0.0.1:3000/command?command=statFee2&key=7moorCommand&data={"year":"2015","month":"08"}
     * @param data
     * @param callback
     */
    statFee2: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var year=data.year;
        var month=data.month;


        handler._statAccountByMonth3(year,month,function(rep){
            if(rep.success){
                result.accNum=rep.accNum;
                result.list=rep.list;

                result.success=true;
                callback(result);
            }else{
                callback(rep);
            }
        });
    },
    _statAccountByMonth3:function(year,month,callback){
        var result = {success: false};
        var _y=parseInt(year),_m=parseInt(month);

        var _y0=_y,_m0=_m-2,_y1=_y,_m1=_m-1;

        if(_m0==0) {
            _y0 = _y-1;
            _m0 = 12;
        }else if(_m0==-1){
            _y0 = _y-1;
            _m0 = 11;
        }


        if(_m1==0) {
            _y1 = _y-1;
            _m1 = 12;
        }



        var y0=_y0+"",m0=_m0<10?"0"+_m0:_m0+"";
        var y1=_y1+"",m1=_m1<10?"0"+_m1:_m1+"";
        var start=y0+"-"+m0+"-01";
        var day=utils.DateTime.getDaysInOneMonth(y1,m1);
        var end=y1+"-"+m1+"-"+day+" 23:59:59";

        var query={createTime:{$gt:start,$lte:end},actualConsume:{$gt:0}};
        //var query={year:year,month:month,actualConsume:{$gt:0}};
        mongo.db("bill_data").collection("bill_call_consume").distinct("account", query, function (err, list) {
            if(!err){
                list=list||[];
                result.accNum=list.length;
                result.list=list;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 每月付费用户数统计
     * http://127.0.0.1:3000/command?command=statAccountMonthFee&key=7moorCommand&data={"year":"2015"}
     * @param data
     * @param callback
     */
    statAccountMonthFee: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var year=data.year;
        //var months=['07','08','09','10','11'];
        var months=['12'];


        mongo.db("bill").collection("platform_account").find({createTime:{$lt:"2015-12-01 00:00:00"}},{_id:1,name:1,companyName:1}).toArray(function (err, list) {
        //mongo.db("bill").collection("platform_account").find({_id:{$in:['N00000000143','N00000000170']}},{_id:1,name:1,companyName:1}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                var idx=0;
                var generateFee=function(){
                    var item=list[idx];
                    if(item){
                        mongo.db("bill_data").collection("temp_account_month_fee").insert(item,{w:1},function(err){
                            if(!err){
                                var idx2=0;
                                var generateMonthFee=function(){
                                    var _m=months[idx2];
                                    if(_m){
                                        handler._statAccActualFeeByMonth_2(item._id,year,_m,function(rep){
                                            if(rep.success){
                                                idx2++;
                                                generateMonthFee();
                                            }else{
                                                callback(rep);
                                            }
                                        });
                                    }else{
                                        idx++;
                                        generateFee();
                                    }
                                }
                                generateMonthFee();
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success=true;
                        callback(result)
                    }
                }
                generateFee();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    },
    _statAccActualFeeByMonth_2:function(account,year,month,callback){
        var result = {success: false};
        var query={account:account,year:year,month:month};
        mongo.db("bill_data").collection("bill_call_consume").find(query).toArray(function (err, list) {
            if(!err){
                list=list||[];
                var num= 0,zjNum=0;
                for(var i=0;i<list.length;i++){
                    var obj=list[i];
                    var val=obj.actualConsume;
                    var val2=obj.minConsume;
                    if(val>val2){
                        num+=val;
                    }else{
                        num+=val2;
                    }
                    if(obj.name=='zj'){
                        zjNum+=obj.monthRent
                    }
                }
                result.callFee=num/10000;
                result.zjNumFee=zjNum/10000;

                var _date=year+"-"+month+"-31";
                var _dateStart=year+"-"+month+"-01";
                var query2={account:account,product:'cc',status:'use',endTime:{$gte:_date},beginTime:{$lte:_dateStart}};
                mongo.db().collection("platform_serviceNum").find(query2).toArray(function (err, list) {
                    if(!err) {
                        list = list || [];
                        var ccNum= 0;
                        for(var i=0;i<list.length;i++){
                            var obj=list[i];
                            var val=obj.monthRent;
                            ccNum+=val;
                        }
                        result.ccNumFee=ccNum/10000;
                        var query3={account:account,status:'use',endDate:{$gte:_date},beginDate:{$lte:_dateStart}};
                        mongo.db("bill").collection("platform_licence").find(query3).toArray(function (err, list) {
                            if(!err) {
                                list = list || [];
                                mongo.db("bill").collection("platform_account_product").find({'product':'cc',account:account}).toArray(function (err, productlist) {
                                    if(!err){
                                        productlist=productlist||[];
                                        var licenceFee= 0;
                                        for(var i=0;i<list.length;i++){
                                            var obj=list[i];
                                            var type=obj.licenceType;
                                            var _num=obj.num;
                                            var price=0;
                                            for(var j=0;j<productlist.length;j++){
                                                var product=productlist[j];
                                                if(product.account==obj.account){
                                                    if(type=='enterprise'){
                                                        price=product.callinLicence;
                                                    }else if(type=='outcall'){
                                                        price=product.calloutLicence;
                                                    }else if(type=='monitor'){
                                                        price=product.monitorLicence;
                                                    }else if(type=='service'){
                                                        price=product.serviceLicence;
                                                    }
                                                    break;
                                                }
                                            }
                                            licenceFee+=(price*_num)/10000;
                                        }
                                        result.licenceFee=licenceFee;
                                        result.totalFee=(result.licenceFee||0)+(result.callFee||0)+(result.zjNumFee||0)+(result.ccNumFee||0);
                                        console.dir(result)
                                        var fieldName="fee"+month;
                                        var set={};
                                        set[fieldName]=utils.format2Decimal(result.totalFee);
                                        mongo.db("bill_data").collection("temp_account_month_fee").update({_id:account},{$set:set},function(err){
                                            if(!err){
                                                result.success=true;
                                                callback(result);
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        })
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });

            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    /**
     * http://127.0.0.1:3000/command?command=stat400LeaveFee&key=7moorCommand&data={}
     * @param data
     * @param callback
     */
    stat400LeaveFee: function (data,callback) {
        var result = {success: false};
        //data=JSON.parse(data);
        mongo.db("bill_data").collection("bill_call_consume").find({name:'400',isFee:null,proxy:{$nin:['',null]},createTime:{$lt:'2016-04-01 00:00:00'}},{_id:1,account:1,displayName:1,proxy:1,minConsume:1,actualConsume:1}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                var stats={};
                var ids=[];
                var idx=0;
                var generateFee=function(){
                    var item=list[idx];
                    if(item){
                        var pk=item._id;
                        var num=item.displayName;
                        var proxy=item.proxy;
                        var val=item.actualConsume;
                        var val2=item.minConsume;
                        var actualBalance=val2-val;
                        var min400ConsumeProxy=800000;
                        mongo.db("bill").collection("platform_num400").findOne({_id:num},function(err,num400){
                            if(!err){
                                if(num400){
                                    mongo.db("bill").collection("bill_system_user").findOne({_id:proxy},function(err,user){
                                        if(!err){
                                            if(user){
                                                var income=0;
                                                var num400Percent=user.num400Percent;
                                                if(num400.initFee){
                                                    min400ConsumeProxy=num400.min400ConsumeProxy||0;
                                                }
                                                if(val2<min400ConsumeProxy){
                                                    income=0;
                                                }else{
                                                    if(min400ConsumeProxy<val){
                                                        income=(actualBalance*num400Percent)/100;
                                                    }else{
                                                        income=((val2-min400ConsumeProxy)*num400Percent)/100;
                                                    }
                                                }
                                                console.info(user.name+" income====="+income)
                                                //console.info(" stats[proxy]====="+stats[proxy])
                                                if(typeof stats[proxy] !='undefined'){
                                                    stats[proxy]+=income;
                                                }else{
                                                    stats[proxy]=income;
                                                    ids.push(user.name);
                                                }
                                                idx++;
                                                generateFee();
                                                //mongo.db("bill_data").collection("bill_call_consume").update({_id:pk},{$set:{isRepaire:"1"}},{w:1},function(err){
                                                //    if(!err){
                                                //        console.info(" pk====="+pk)
                                                //        generateFee();
                                                //    }else{
                                                //        logger.app.error(err);
                                                //    }
                                                //})
                                            }else{
                                                idx++;
                                                generateFee();
                                            }
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    idx++;
                                    generateFee();
                                }
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success=true;
                        result.stats=stats;
                        result.ids=ids;
                        callback(result);
                    }
                }
                generateFee();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://127.0.0.1:3000/command?command=statAccountLeaveFee&key=7moorCommand&data={}
     * @param data
     * @param callback
     */
    statAccountLeaveFee: function (data,callback) {
        var result = {success: false};
        //data=JSON.parse(data);
        mongo.db("bill_data").collection("bill_call_consume").find({name:'cc',year:'2016',month:'04',minConsume:{$gt:1000000}},{_id:1,account:1,displayName:1,proxy:1,minConsume:1,actualConsume:1}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                var stats=[];
                var idx=0;
                var generateFee=function(){
                    var item=list[idx];
                    if(item){
                        var aid=item.account;
                        var val=item.actualConsume;
                        var val2=item.minConsume;

                        var q1={account:aid,flag:{$nin:['otherPay','hardwarePay','workPay']}};
                        mongo.db("zj").collection("user_bank_pay").find(q1).toArray(function(err,banks){
                            if(!err){
                                banks=banks||[];
                                var pays=0;
                                var consume=0;
                                for (var i = 0; i < banks.length; i++) {
                                    var obj = banks[i];
                                    pays+=parseFloat(obj.money||0);
                                }
                                var q2={account:aid,status:'pay',flag:{$in:['buyLicence','renewLicence','adjustLicenceNum']}};
                                mongo.db("zj").collection("user_pay").find(q2).toArray(function(err,list2){
                                    if(!err) {
                                        list2 = list2 || [];
                                        for (var i = 0; i < list2.length; i++) {
                                            var obj = list2[i];
                                            consume +=(parseFloat(obj.totalFee)||0);
                                        }
                                        var q3={account:aid};
                                        mongo.db("bill_data").collection("bill_call_consume").find(q3).toArray(function (err, list3) {
                                            if(!err) {
                                                list3 = list3 || [];
                                                for (var i = 0; i < list3.length; i++) {
                                                    var obj = list3[i];
                                                    var min=obj.minConsume;
                                                    var actualConsume=obj.actualConsume;
                                                    var monthRent=obj.monthRent;
                                                    var min2=actualConsume-min>0?actualConsume:min;
                                                    consume+=utils.formatTrueFee(min2+monthRent);
                                                }

                                                mongo.db("bill").collection("platform_account").findOne({_id:aid},function(err,acc){
                                                    if(!err){
                                                        var balance=utils.formatTrueFee(acc.balance);
                                                        var _data={account:aid,companyName:acc.companyName,pays:pays,consume:consume+balance,consume2:val2/10000+consume+balance,minConsume:val2/10000,actualConsume:val/10000};
                                                        if(_data.pays!=_data.consume){
                                                            _data.isCheck=true;
                                                            console.dir(_data);
                                                        }
                                                        stats.push(_data);
                                                        idx++;
                                                        generateFee();
                                                    }else{
                                                        logger.app.error(err);
                                                        callback(result);
                                                    }
                                                });
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        })
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success=true;
                        result.stats=stats;
                        callback(result);
                    }
                }
                generateFee();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }
};

module.exports = handler;