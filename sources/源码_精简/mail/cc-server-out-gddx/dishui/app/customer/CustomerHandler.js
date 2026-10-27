var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");
var accountHandler = require(__baseDir + '/dishui/config/account/AccountHandler');
var http = require('appHttp');
var config = require('appConfig').conf;
var fs = require('fs');
var emailHandler = require(__baseDir + '/dishui/app/email/EmailHandler');
var weixinHandler = require(__baseDir + '/dishui/app/weixin/WeixinHandler');
var webchatHandler = require(__baseDir + '/dishui/app/webchat/WebchatHandler');
var customerHistoryHandler = require(__baseDir + '/dishui/app/customer/CustomerHistoryHandler');
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
var callSheetHandler = require(__baseDir + '/dishui/app/callSheet/CallSheetHandler');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var appEvent = require("appEvent");
var userDic = require(__baseDir + '/dishui/app/user/UserHandler');
var thenjs =require("thenjs");

var batchMaxNum=10000;
var batchMaxMsg="一次最多操作10000条,请您过滤查询条件分批操作!";
var noForOwner="NA";

var checkPhone=function(data,session,callback){
    var result = {success: false};
    var tels=data.phone;
    var tels2=[];
    for(var i=0;i<tels.length;i++){
        tels2.push(tels[i].tel);
    }
    if(tels2.length<=0){
        result.success=true;
        callback(result);
        return;
    }
    var query={"phone.tel":{"$in":tels2}};
    if(data.isUpdae)query._id={"$ne":data._id};
    if(data.merge){//过滤掉要合并的客户号码
        query._id={"$nin":[data.custAId,data.custBId]};
    }

    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
        if (!err) {
            if (count==0) {
                result.success=true;
                callback(result);
            } else {
                result.message = 'phone is repeat!';
                result.code='1001';
                callback(result);
            }
        } else {
            logger.app.error(err);
            result.message = 'checkRepeat error!';
            callback(result);
        }
    });
}
var checkName=function(data,session,callback){
    var result = {success: false};
    if(!data.name){
        result.success=true;
        callback(result);
        return;
    }
    var query={"name":data.name};
    if(data.isUpdae)query._id={"$ne":data._id};
    if(data.merge){//过滤掉要合并的客户号码
        query._id={"$nin":[data.custAId,data.custBId]};
    }

    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
        if (!err) {
            if (count==0) {
                result.success=true;
                callback(result);
            } else {
                result.message = 'customer name is repeat!';
                result.code='1002';
                callback(result);
            }
        } else {
            logger.app.error(err);
            result.message = 'checkRepeat error!';
            callback(result);
        }
    });
}
var checkRepeat=function(data,session,callback){
    var result = {success: false};
    var dbType=data.dbType;
    if(!dbType){   //filter updateStatus,updateAction
        result.success=true;
        callback(result);
        return;
    }
    mongo.db().collection("customer_template").findOne({_id:dbType},function(err,doc){
        if (!err) {
            var isCheckPhone=doc.unique_phone;
            var isCheckName=doc.unique_name;
            if(isCheckPhone) { //合并客户不验证
                checkPhone(data,session,function(rep){
                    if(rep.success){
                        if(isCheckName){
                            checkName(data,session,function(rep){
                                callback(rep);
                            })
                        }else{
                            callback(rep);
                        }
                    }else{
                        callback(rep);
                    }
                });
            }else{
                if(isCheckName) {
                    checkName(data,session,function(rep){
                        callback(rep);
                    });
                }else{
                    result.success=true;
                    callback(result);
                }
            }

        } else {
            result.message = 'checkRepeat error!';
            logger.app.error(err);
            callback(result);
        }
    });

}
exports.addCustomer = function (data,session,callback) {
    var result = {success: false};
    var id=utils.UUID.generateUuid();
    var time=utils.getCurrentDate() ;

    //call deal info
    var dealSrc=data.dealSrc;
    delete data.dealSrc;
    var callTel=data.callTel;
    delete data.callTel;
    var callId=data.callId;
    delete data.callId;
    var category = data.category;
    delete data.category;

    var aid=session.user.account;
    var uid=session.user._id;
    data._id=id;
    data.createTime= time;
    data.creator =uid ;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    data.accountId=aid;
    data.sysStatus = "0";
    if(!data.categoryId){
        data.categoryId=noForOwner;
    }

    if(data.categoryId!=data.owner&&data.owner!=uid){
        data.isRead = true;
    }
    //var nowDate = new Date();
    //data.report_year = nowDate.getFullYear();
    //data.report_month = nowDate.getMonth() + 1;
    //data.report_day = nowDate.getDate();
    //data.report_date = time.substring(0, 10);

    checkRepeat(data,session,function(rep){
        if(rep.success){
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).insert(data,{w:1},function (err) {
                if (!err) {
                    if(category == "4"){
                        appEvent.emitCustomerAutoSeaEvent(data);
                    }
                    emitAgentNotify2Add(data,session);
                    var _p={};
                    _p._id = id;
                    _p.accountId = aid;
                    _p.tType ="add";
                    _p.uid=uid;
                    _p.status = data.status;
                    _p.source = data.custsource1;
                    _p.owner = data.owner;
                    _p.categoryId = data.categoryId;
                    _p.actionType = data.actionType;
                    _p.content = "";
                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_ADD, _p);
                    //add search index
                    var idxData={
                        _id : id,
                        account:aid,
                        name: data.name,
                        phone:data.phone,
                        notifyTime:'',
                        createTime:time
                    }
                    solrHandler.addIndex2Cust(idxData,function(){});

                    if(callId){
                        var ary=callId.split("_");
                        var _callId=ary[0];
                        var _param={
                            customerId:id,
                            callId:_callId,
                            phone:callTel,
                            dealSrc:dealSrc,
                            custName:data.name
                        }

                        if(dealSrc=='popupMail'){
                            emailHandler.locationCustomer(_param,session,function(){});
                        }else if(dealSrc=='popupWeixin'){
                            weixinHandler.locationCustomer(_param,session,function(){});
                        }else if(dealSrc=='popupWebchat'||dealSrc=='relocationWebchat'){
                            webchatHandler.locationCustomer(_param,session,function(){});
                        }else if(dealSrc=='relocationCall'){
                            callSheetHandler.locationCustomer2Add(_param,session,function(){});
                        }else if(dealSrc=='dialPopup'){
                            exports.callLocationCustomer(_param,session,function(rep2){});
                        }else if(dealSrc=='taskAgentAdd'){
                            exports.callLocationCustomer(_param,session,function(rep2){});
                        }else{
                            exports.callLocationCustomer(_param,session,function(rep2){});
                        }
                    }

                    exports.locationTelArea(data,session);
                    result.success = true;
                    result.data=data;
                    callback(result);
                } else {
                    logger.app.error('db insert error:' + err);
                    callback(result);
                }
            });
        } else{
            result=rep;
            callback(result);
        }
    }) ;
}

var emitCustomerUpdateEvent = function(data,doc,session){
    var _p = {};
    var accId =session.user.account;
    var oldCustSource = "无来源";
    var custSource = "无来源";
    var oldStatus = "";
    var status = "";
    var oldOwner = "无归属";
    var owner = "无归属";
    var category = "无归属";
    var oldCategory = "无归属";
    thenjs(function(cont){
        mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({account:accId},{fields:{status:1,source:1}},cont);
    }).then(function(cont,tempL){
        if(tempL) {
            var tmpLs = tempL;
            _p._id = data._id;
            _p.accountId = session.user.account;
            _p.uid = session.user._id;
            _p.createTime= doc.createTime;

            _p.oldName = doc.name;
            _p.oldStatus = doc.status;
            _p.oldCustSource = doc.custsource1;
            _p.oldOwner = doc.owner;
            _p.oldCategoryId = doc.categoryId;
            _p.oldPhone = doc.phone;
            _p.oldEmail = doc.email;

            _p.name = data.name;
            _p.status = data.status;
            _p.custSource = data.custsource1;
            _p.owner = data.owner;
            _p.categoryId = data.categoryId;
            _p.phone = data.phone;
            _p.email = data.email;

            if(!data.name){
                _p.name=doc.name;
            }
            if(!data.status) {
                _p.status = doc.status;
            }
            //console.info("data.custsource1===="+data.custsource1);
            if(typeof data.custsource1 == "undefined") {
                _p.custSource=doc.custsource1;
            }
            if(!data.owner){
                _p.owner = doc.owner;
            }
            if(!data.categoryId){
                _p.categoryId = doc.categoryId;
            }
            if(!data.phone){
                _p.phone = doc.phone;
            }
            if(!data.email){
                _p.email = doc.email;
            }

            var getAgentName=function(callback){
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({_id:{$in:[_p.owner,_p.oldOwner]}},{fields:{displayName:1}}).toArray(function (err, uList) {
                    if (!err) {
                        uList=uList||[];
                        var n=0;
                        for (var i = 0; i < uList.length; i++) {
                            if (uList[i]._id === _p.owner) {
                                owner = uList[i].displayName;
                                n++;
                            }else if(uList[i]._id === _p.oldOwner){
                                oldOwner = uList[i].displayName;
                                n++;
                            }
                            if(n>=2){
                                break;
                            }
                        }
                        if( typeof callback=='function'){
                            callback();
                        }
                    }
                });
            }
            var getPoolName = function(callback){
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({_id:{"$in":[_p.categoryId,_p.oldCategoryId]}}).toArray(function(err,poolList){
                    if(!err&&poolList){
                        var m = 0;
                        for(var i = 0;i<poolList.length;i++){
                            var pool= poolList[i];
                            if(_p.categoryId==pool._id){
                                category=pool.cName;
                                m++;
                            }
                            if(_p.oldCategoryId==pool._id){
                                oldCategory = pool.cName;
                                m++;
                            }
                            if(m==2){
                                break;
                            }
                        }
                        if( typeof callback=='function'){
                            callback();
                        }
                    }
                });
            }
            var setStatusName=function(){
                var _tmpl = tmpLs.status||{};
                oldStatus=_tmpl[_p.oldStatus]||'';
                status=_tmpl[_p.status]||'';
            }
            var setSourceName=function(){
                var _tmpl = tmpLs.source||[];
                for(var i=0;i<_tmpl.length;i++){
                    if(_tmpl[i].key == _p.oldCustSource){
                        oldCustSource = _tmpl[i].name;
                    }
                    if(_tmpl[i].key == _p.custSource){
                        custSource = _tmpl[i].name;
                    }
                }
            }
            var oldPhone = [];
            if(_p.oldPhone){
                if(_p.oldPhone.length>0){
                    for(var o=0;o<_p.oldPhone.length;o++){
                        var oo = _p.oldPhone[o];
                        oldPhone.push(oo.tel);
                    }
                }
            }
            var phone = [];
            if(_p.phone){
                if(_p.phone.length>0){
                    for(var p=0;p<_p.phone.length;p++){
                        var pp = _p.phone[p];
                        phone.push(pp.tel);
                    }
                }
            }
            var oldEmail = [];
            if(_p.oldEmail){
                if(_p.oldEmail.length>0){
                    for(var e=0;e<_p.oldEmail.length;e++){
                        var ee = _p.oldEmail[e];
                        oldEmail.push(ee.email);
                    }
                }
            }
            var email = [];
            if(_p.email){
                if(_p.email.length>0){
                    for(var em=0;em<_p.email.length;em++){
                        var ema = _p.email[em];
                        email.push(ema.email);
                    }
                }
            }
            var oldPhones  = "";
            var phones = "";
            var phoneContent = "";
            var setPhone = function() {
                var phoneLength1 = 0;
                if(_p.oldPhone){
                    phoneLength1 = _p.oldPhone.length
                }
                var phoneLength2 = 0;
                if(_p.phone){
                    phoneLength2 = _p.phone.length
                }
                if(phoneLength1==0&&phoneLength2!=0){
                    for (var j = 0; j < phoneLength2; j++) {
                        var p = _p.phone[j];
                        if (j == phoneLength2 - 1) {
                            phones += p.tel;
                        } else {
                            phones +=  p.tel + ";";
                        }
                    }
                    phoneContent = "联系人电话新增【"+phones+"】|";
                }
                if(phoneLength2==0&&phoneLength1!=0){
                    for (var i = 0; i < phoneLength1; i++) {
                        var oldP = _p.oldPhone[i];
                        if (i == phoneLength1 - 1) {
                            oldPhones += oldP.tel;
                        } else {
                            oldPhones +=  oldP.tel + ";";
                        }
                    }
                    phoneContent = "联系人电话【"+oldPhones+"】被删除|";
                }
                if(phoneLength1!=0&&phoneLength1==phoneLength2){
                    for (var i = 0; i < phoneLength1; i++) {
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                            if(oldP.tel!= p.tel){
                                oldPhones = oldP.tel;
                                phones = p.tel;
                                phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                            }
                    }
                }
                if(phoneLength1!=0&&phoneLength2!=0&&phoneLength1<phoneLength2){
                    for(var i=0;i<phoneLength1;i++){
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                        if(oldP.tel!= p.tel){
                            oldPhones = oldP.tel;
                            phones = p.tel;
                            phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                        }
                    }
                    phones = "";
                    for(var h=phoneLength1;h<phoneLength2;h++){
                        var p = _p.phone[h];
                        if(h==phoneLength2-1){
                            phones += p.tel;
                        }else{
                            phones += p.tel+";";
                        }
                    }
                    phoneContent += "联系人电话新增【"+phones+"】|";
                }
                if(phoneLength1!=0&&phoneLength2!=0&&phoneLength2<phoneLength1){
                    for(var i=0;i<phoneLength2;i++){
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                        if(oldP.tel!= p.tel){
                            oldPhones = oldP.tel;
                            phones = p.tel;
                            phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                        }
                    }
                    oldPhones = "";
                    for(var h = phoneLength2;h<phoneLength1;h++){
                        var oldP = _p.oldPhone[h];
                        if(h==phoneLength1-1){
                            oldPhones += oldP.tel;
                        }else{
                            oldPhones += oldP.tel+";";
                        }
                    }
                    phoneContent += "联系人电话【"+oldPhones+"】被删除|";
                }
            }
            var oldEmails = "";
            var emails = "";
            var emailContent = "";
            var setEmail = function(){
                var emailLength1 = 0;
                if(_p.oldEmail){
                    emailLength1 = _p.oldEmail.length;
                }
                var emailLength2 = 0;
                if(_p.email){
                    emailLength2 = _p.email.length;
                }
                if(emailLength1==0&&emailLength2!=0){
                    for (var j = 0; j < emailLength2; j++) {
                        var e = _p.email[j];
                        if (j == emailLength2 - 1) {
                            emails += e.email;
                        } else {
                            emails +=  e.email + ";";
                        }
                    }
                    emailContent = "联系人邮箱新增【"+emails+"】|";
                }
                if(emailLength2==0&&emailLength1!=0){
                    for (var i = 0; i < emailLength1; i++) {
                        var oldE = _p.oldEmail[i];
                        if (i == emailLength1 - 1) {
                            oldEmails += oldE.email;
                        } else {
                            oldEmails +=  oldE.email + ";";
                        }
                    }
                    emailContent = "联系人邮箱【"+oldEmails+"】被删除|";
                }
                if(emailLength1!=0&&emailLength1==emailLength2){
                    for (var i = 0; i < emailLength1; i++) {
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                }
                if(emailLength1!=0&&emailLength2!=0&&emailLength1<emailLength2){
                    for(var i=0;i<emailLength1;i++){
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                    emails = "";
                    for(var h=emailLength1;h<emailLength2;h++){
                        var e = _p.email[h];
                        if(h==emailLength2-1){
                            emails += e.email;
                        }else{
                            emails += e.email+";";
                        }
                    }
                    emailContent += "联系人邮箱新增【"+emails+"】|";
                }
                if(emailLength1!=0&&emailLength2!=0&&emailLength2<emailLength1){
                    for(var i=0;i<emailLength2;i++){
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                    oldEmails = "";
                    for(var h = emailLength2;h<emailLength1;h++){
                        var oldE = _p.oldEmail[h];
                        if(h==emailLength1-1){
                            oldEmails += oldE.email;
                        }else{
                            oldEmails += oldE.email+";";
                        }
                    }
                    emailContent += "联系人邮箱【"+oldEmails+"】被删除|";
                }
            }
            if (_p.oldName != _p.name|| _p.oldStatus != _p.status
                || _p.oldCustSource != _p.custSource || _p.oldOwner != _p.owner||oldPhone.sort().toString()!=phone.sort().toString()
                ||oldEmail.sort().toString()!=email.sort().toString()) {
                var content = "";
                    _p.tType="update";
                    if (_p.oldName != _p.name) {
                        content = content + "客户名称从【" + _p.oldName + "】变更为【" + _p.name + "】|";
                    }
                    if(oldPhone.sort().toString()!=phone.sort().toString()){
                        setPhone();
                        content = content + phoneContent;
                    }
                    if(oldEmail.sort().toString()!=email.sort().toString()){
                        setEmail();
                        content = content + emailContent;
                    }
                    if (_p.oldStatus != _p.status) {
                        setStatusName();
                        content = content + "状态从【" + oldStatus + "】变更为【" + status + "】|";
                    }
                    if(_p.oldCustSource != _p.custSource){
                        setSourceName();
                        content = content + "来源从【" + oldCustSource + "】变更为【" + custSource + "】|";
                    }
                    if (_p.oldOwner != _p.owner) {
                        if(_p.categoryId=="NA") {
                            if(_p.oldOwner==_p.oldCategoryId){
                                getPoolName(function(){
                                    content = content + "客户归属从【"+oldCategory+"】变更为【"+category+"】|";
                                    _p.content = content;
                                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE, _p);
                                })
                            }else{
                                getAgentName(function(){
                                    content = content + "客户归属从【" + oldOwner + "】变更为【"+owner+"】|";
                                    _p.content = content;
                                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE, _p);
                                })
                            }
                        }else{
                            if(_p.oldOwner==_p.oldCategoryId){
                                if(_p.owner == _p.categoryId){
                                    getPoolName(function(){
                                        content = content + "客户归属从【"+oldCategory+"】变更为【"+category+"】|";
                                        _p.content = content;
                                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE,_p);
                                    })
                                }else{
                                    getPoolName(function(){
                                        getAgentName(function(){
                                            content = content + "客户归属从【"+oldCategory+"】变更为【"+owner+"】|";
                                            _p.content = content;
                                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE,_p);
                                        })
                                    })
                                }
                            }else{
                                if(_p.categoryId==_p.oldCategoryId){
                                    if(_p.owner == _p.categoryId){
                                        getPoolName(function(){
                                            getAgentName(function(){
                                                content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】|";
                                                _p.content = content;
                                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE,_p);
                                            })
                                        })
                                    }else{
                                        getAgentName(function(){
                                            content = content + "客户归属人从【"+oldOwner+"】变更为【"+owner+"】|";
                                            _p.content = content;
                                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE,_p);
                                        })
                                    }
                                }else{
                                    getAgentName(function(){
                                        getPoolName(function(){
                                            content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】|";
                                            _p.content = content;
                                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE,_p);
                                        })
                                    })
                                }

                            }
                        }
                    }else{
                    _p.content = content;
                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE, _p);
                }
            }
        }
    }).fail(function(cont,err){
        logger.app.error(err);
    })
}

var mergeCustAfter = function (data,session,callback){
    var result = {success: false};
    var custAId = data.custAId;
    var custBId = data.custBId;
    var query = {"customer":custAId};
    var setData = {$set:{"customer":custBId}};
    var mergeCusts = [];

    thenjs(function(cont){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":custAId},cont);
    }).then(function(cont,custA){
        if(custA){
            var sysStatus = custA.sysStatus;
            if(sysStatus=="5"||sysStatus=="6"||sysStatus=="7"||sysStatus=="8") {
                result.code = "1005";
                result.message = "The customer is in the state of being audited";
                callback(result);
            }else{
                mergeCusts[0] = custA;
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":custBId},cont);
            }
        }else{
            result.message = '未查询到客户A信息!';
            callback(result);
        }
    }).then(function(cont,custB){
        if(custB){
            mergeCusts[1] = custB;
            if(!mergeCusts[1].actionId && mergeCusts[0].actionId){
                result.noAction = true;
                result.actionId = mergeCusts[0].actionId;
                result.action = mergeCusts[0].action;
            }
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":custBId},cont);
        }else{
            result.message = '未查询到客户B信息!';
            callback(result);
        }
    }).then(function(cont){
        //修改联系历史表
        mongo.db(session).collection(session.user.account+fields.DB_HISTORY).update(query,setData,{multi:true},cont);
    }).then(function(cont){
        //修改工单
        mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_BUSINESS).update(query,setData,{multi:true},cont);
    }).then(function(cont){
        //修改工单历史
        mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_BUSINESS_HISTORY).update({"excuteData.customer":custAId},{$set:{"excuteData.customer":custBId}},{multi:true},cont);
    }).then(function(cont){
        //修改日志
        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).update({"custId": { $all: [custAId] } },{ $addToSet: {"custId": custBId } },{multi:true},cont);
    }).then(function(cont){
        //删除客户A
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).remove({"_id":custAId},function(err){
            if(!err){
                result.success=true;
                result.mergeCusts = mergeCusts;
                callback(result);
            }else{
                result.message = '删除客户失败!';
                logger.app.error(err);
                callback(result);
            }
        });
    }).fail(function(cont,err){
        logger.app.error(err);
    })
}

exports.claimCustomer = function(data,session,callback){
    var result = {success: false};
    var custId = data;
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:custId},function(err,docCustomer){
        if(!err){
            if(docCustomer){
                var docOwner = docCustomer.owner;
                var docCategoryId = docCustomer.categoryId;
                if(docOwner!=docCategoryId){
                    result.code="1006";
                    callback(result);
                }else{
                    var uid = session.user._id;
                    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id:docCustomer.categoryId},function(err,common){
                        if(!err&&common){
                            var managers = common.managers||[];
                            var members = common.members||[];
                            if(managers.indexOf(uid)!=-1||members.indexOf(uid)!=-1){
                                var time=utils.getCurrentDate();
                                if(uid!=docCustomer.owner){
                                    var sum = common.ruleNum;
                                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count({owner:uid,sysStatus:"0",categoryId:docCustomer.categoryId},function(err,count){
                                        if(!err){
                                            if(count<sum){
                                                var upData = {
                                                    isRead : true,
                                                    takeTime:time,
                                                    owner:uid
                                                };
                                                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:custId},{$set:upData},function(err){
                                                    if(!err){
                                                        result.success=true;
                                                        var _p = {};
                                                        var ownerName = "";
                                                        _p._id = docCustomer._id;
                                                        _p.accountId = session.user.account;
                                                        _p.tType = "claim";
                                                        _p.uid = session.user._id;
                                                        _p.owner = uid;
                                                        _p.oldStatus = docCustomer.status;
                                                        _p.status = docCustomer.status;
                                                        _p.oldOwner = docCustomer.owner;
                                                        _p.categoryId = docCustomer.categoryId;
                                                        _p.oldCategoryId = docCustomer.categoryId;
                                                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({_id:{$in:[_p.owner]}},{fields:{displayName:1}}).toArray(function (err, uList) {
                                                            if (!err) {
                                                                uList=uList||[];
                                                                for (var i = 0; i < uList.length; i++) {
                                                                    if (uList[i]._id === _p.owner) {
                                                                        ownerName = uList[i].displayName;
                                                                        break;
                                                                    }
                                                                }
                                                                _p.content = ownerName +"从【"+common.cName+"】领取客户";
                                                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                                                            }
                                                        });
                                                        callback(result);
                                                    }
                                                });
                                            }else{
                                                result.code = "1001";
                                                callback(result);
                                            }
                                        }else {
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            }else{
                                result.code = "1002";
                                callback(result);
                            }
                        }else{
                            result.message = 'claimCustomer error!';
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }
            }else{
                result.code="1007";
                callback(result);
            }
       }else{
           logger.app.error(err);
           callback(result);
       }

    });

}

/**
 * 从老数据中回填号码区域
 */
var resetCustPhoneArea=function(data,oldCust){
    var olds=oldCust.phone||[];
    var tels=data.phone||[];
    for (var i=0;i<tels.length;i++) {
        var tel=tels[i];
        var num=0;
        for (var j=0;j<olds.length;j++) {
            var obj=olds[j];
            if(tel.tel==obj.tel){
                tel.area=obj.area||'';
                num++;
                break;
            }
        }
        if(num==0){
            tel.area="";
        }
    }
}

exports.updateCustomer = function (data,session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    var id=data._id;
    data.isUpdae='update';
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;

    var currentSea=null;
    thenjs(function(cont){
        checkRepeat(data,session,function(rep){
            if(rep.success){
                delete data.isUpdae;
                delete data["_id"];
                cont(null,rep);
            }else{
                result=rep;
                callback(result);
            }
        });
    }).then(function(cont,rep){
        checkIsManager2Sea(data,session,function(rep2){
            if(rep2.success){
                cont(/*err,返回结果*/null,rep2);
            }else{
                callback(rep2);
            }
        });
    }).then(function(/*callback*/cont,/*返回结果*/rep){
        if(rep.currentSea){
            currentSea=rep.currentSea;
        }
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(data.categoryId!=noForOwner&&data.categoryId==data.owner){
            var sysStatus = doc.sysStatus;
            if(sysStatus=="5"||sysStatus=="6"||sysStatus=="7"||sysStatus=="8"){
                result.code = "1005";
                callback(result);
            }else{
                cont(null,doc);
            }
        }else{
            cont(null,doc);
        }
    }).then(function(cont,doc){
        if(data.owner!=noForOwner&&data.owner!=uid){
            data.isRead = true;
            cont(null,doc);
        }else{
            cont(null,doc);
        }
    }).then(function(cont,doc){
        if(doc){
            resetCustInfo2Sea(data,doc,session);
            var updateData = {$set:data};
            //重置区域字段
            resetCustPhoneArea(data,doc);
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        data._id = id;
        data.accountId=aid;
        var owner=data.owner;
        var categoryId=data.categoryId;
        var oldOwner=doc.owner;
        if(owner!=oldOwner && currentSea) {
            if(categoryId!=noForOwner && owner==categoryId && currentSea.category=='4'){//自动分配
                appEvent.emitCustomerAutoSeaEvent(data);
            }
        }
        emitAgentNotify(data,doc,currentSea,session);

        emitCustomerUpdateEvent(data,doc,session);
        //update search index
        if ((data.name && data.name != doc.name) || data.phone || data.notifyTime != doc.notifyTime) {
            var idxData = {
                _id: id,
                account: session.user.account,
                name: data.name || doc.name,
                phone: data.phone || doc.phone,
                notifyTime: data.notifyTime || doc.notifyTime,
                createTime: doc.createTime
            }
            if (data.actionType == fields.ACTION_NA) {
                idxData.notifyTime = "";
            }
            solrHandler.updateIndex2Cust(idxData, function () {
            });
        }
        exports.locationTelArea(data, session);

        result.success = true;
        result.data = data;
        callback(result);
    }).fail(function(cont,err){
        logger.app.error(err);
        callback(result);
    })
}

var emitUpdateCustomerStatusOrSource = function(data,doc,session){
    var _p = {};
    var accId =session.user.account;
    var oldCustSource = "";
    var custSource = "";
    var oldStatus = "";
    var status = "";
    thenjs(function(cont){
        mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({account:accId},{fields:{status:1,source:1}},cont);
    }).then(function(cont,tempL){
        if(tempL) {
            var tmpLs = tempL;
            _p._id = data._id;
            _p.accountId = session.user.account;
            _p.uid = session.user._id;
            _p.createTime= doc.createTime;

            _p.oldStatus = doc.status;
            _p.oldCustSource = doc.custsource1;
            _p.oldOwner = doc.owner;

            _p.status = data.status;
            _p.custSource = data.custsource1;
            _p.owner = doc.owner;
            _p.categoryId = doc.categoryId;
            _p.oldCategoryId = doc.categoryId;

            if(!data.status) {
                _p.status = doc.status;
            }
            //console.info("data.custsource1===="+data.custsource1);
            if(typeof data.custsource1 == "undefined") {
                _p.custSource=doc.custsource1;
            }

            var setStatusName=function(){
                var _tmpl = tmpLs.status||{};
                oldStatus=_tmpl[_p.oldStatus]||'';
                status=_tmpl[_p.status]||'';
            }
            var setSourceName=function(){
                var _tmpl = tmpLs.source||[];
                for(var i=0;i<_tmpl.length;i++){
                    if(_tmpl[i].key == _p.oldCustSource){
                        oldCustSource = _tmpl[i].name;
                    }
                    if(_tmpl[i].key == _p.custSource){
                        custSource = _tmpl[i].name;
                    }
                }
                if(_p.oldCustSource==""){
                    oldCustSource = "无来源";
                }
                if(_p.custSource==""){
                    custSource = "无来源";
                }
            }

                if (data.status) {//修改状态
                    _p.tType = "updateStatus";
                    if (_p.oldStatus != _p.status) {
                        setStatusName();
                        _p.content = "状态从【" + oldStatus + "】变更为【" + status + "】";
                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_STATUS, _p);
                    }
                }
                if (typeof data.custsource1 != "undefined") {//修改来源
                    _p.tType = "updateSource";
                    if (_p.oldCustSource != _p.custSource) {
                        setSourceName();
                        _p.content = "来源从【" + oldCustSource + "】变更为【" + custSource + "】";
                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_SOURCE, _p);
                    }
                }
        }
    }).fail(function(cont,err){
        logger.app.error(err);
    })
}
/**
 * 快捷修改客户状态或来源
 * @param data
 * @param session
 * @param callback
 */
exports.updateCustomerStatusOrSource = function (data,session,callback) {
    //console.dir(data);
    var result = {success: false};
    var query={"_id":data._id};
    var id=data._id;
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;

    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    delete data["_id"];

    thenjs(function(cont){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(doc){
            var updateData = {$set:data};
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        data._id = id;
        emitUpdateCustomerStatusOrSource(data,doc,session);

        result.success = true;
        result.data = data;
        callback(result);
    }).fail(function(cont,err){
        logger.app.error(err);
        callback(result);
    })
}


var emitCustomerUpdateCustForOwnerEvent = function(data,doc,session){
    var _p = {};
    var accId =session.user.account;
    _p._id = data._id;
    _p.accountId = accId;
    _p.uid = session.user._id;
    _p.createTime= doc.createTime;
    _p.oldCategoryId = doc.categoryId;
    var oldOwner = "无归属";
    var owner = "无归属";
    _p.category = data.category;
    _p.categoryId = data.categoryId;
    var category = "无归属";
    var oldCategory = "无归属";
    _p.owner = data.owner;
    _p.oldOwner = doc.owner;
    _p.oldStatus = doc.status;
    _p.status = doc.status;
    var getAgentName=function(callback){
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({_id:{$in:[_p.owner,_p.oldOwner]}},{fields:{displayName:1}}).toArray(function (err, uList) {
            if (!err) {
                uList=uList||[];
                var n=0;
                for (var i = 0; i < uList.length; i++) {
                    if (uList[i]._id === _p.owner) {
                        owner = uList[i].displayName;
                        n++;
                    }else if(uList[i]._id === _p.oldOwner){
                        oldOwner = uList[i].displayName;
                        n++;
                    }
                    if(n>=2){
                        break;
                    }
                }
                if( typeof callback=='function'){
                    callback();
                }
            }
        });
    }
    var getPoolName = function(callback){
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({_id:{"$in":[_p.categoryId,_p.oldCategoryId]}}).toArray(function(err,poolList){
                if(!err&&poolList){
                    var m = 0;
                    for(var i = 0;i<poolList.length;i++){
                        var pool= poolList[i];
                        if(_p.categoryId==pool._id){
                            category=pool.cName;
                            m++;
                        }
                        if(_p.oldCategoryId==pool._id){
                            oldCategory = pool.cName;
                            m++;
                        }
                        if(m==2){
                            break;
                        }
                    }
                    if( typeof callback=='function'){
                        callback();
                    }
                }
            });
    }
    if(_p.category){
        if(_p.categoryId == "NA"&&_p.oldOwner!="NA"){
                if(_p.oldOwner==_p.oldCategoryId){
                    _p.tType = "changePool";
                    getPoolName(function(){
                            _p.content = "客户归属从【"+oldCategory +"】变更为【"+category+"】";
                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                    })
                }else{
                    if(_p.oldCategoryId=="NA"){
                        _p.tType="updateOwner";
                        getAgentName(function(){
                            _p.content = "客户归属从【"+oldOwner+"】变更为【"+owner+"】";
                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_OWNER, _p);
                        })
                    }else{
                        _p.tType="updateOwner";
                        var content = "";
                        getPoolName(function(){
                            getAgentName(function(){
                                content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】";
                                _p.content = content;
                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_OWNER, _p);
                            })
                        })
                    }
                }
        }else{
            if(_p.oldOwner==_p.oldCategoryId){
                if(_p.categoryId!=_p.oldCategoryId){
                    _p.tType = "changePool";
                    getPoolName(function(){
                        _p.content = "客户归属从【"+oldCategory+"】变更为【"+category+"】";
                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                    })
                }
            }else{
                if(_p.oldCategoryId=="NA"){
                    _p.tType = "changePool";
                    getPoolName(function(){
                        getAgentName(function(){
                            _p.content = "客户归属从【"+oldOwner+"】变更为【"+category+"】";
                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                        })
                    })
                }else{
                    if(_p.categoryId == _p.oldCategoryId){
                        _p.tType="updateOwner";
                        getPoolName(function(){
                            getAgentName(function(){
                                _p.content = "客户归属从【"+oldOwner+"】变更为【"+category+"】";
                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_OWNER, _p);
                            })
                        })
                    }else{
                        _p.tType = "transferPool";
                        var content = "";
                        getPoolName(function(){
                            getAgentName(function(){
                                content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】";
                                _p.content = content;
                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                            })
                        })
                    }
                }
            }
        }
    }else{
        if(_p.oldOwner!= _p.owner){
            if(_p.oldOwner==_p.oldCategoryId){
                _p.tType="assign";
                getPoolName(function(){
                    getAgentName(function(){
                        _p.content = "客户归属从【"+oldCategory+"】变更为【"+owner+"】|";
                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_OWNER, _p);
                    })
                })
            }else {
                _p.tType = "updateOwner";
                getAgentName(function(){
                    _p.content = "客户归属从【" + oldOwner + "】变更为【" + owner + "】";
                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_OWNER, _p);
                })
            }
        }
    }
    }

/**
 * 客户信息页单独修改归属
 * @param data
 * @param session
 * @param callback
 */
exports.updateCustForOwner = function (data,session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    var id=data._id;
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;

    var _set={};
    var category=data.category;//1:无归属，2：主动领取公海，3:自动分配公海
    var categoryId=data.categoryId;
    var owner=data.owner;//包括所属人、公海、无归属的id
    if(category){
        _set.categoryId=owner;
        _set.owner=owner;
        if(category!='1'){
            _set.sysStatus="0";//默认
        }
        _set.takeTime = "";
    }else{//updater owner
        _set.owner=owner;
        _set.takeTime = time;
    }
    _set.lastUpdateTime=time;
    _set.lastUpdater=uid;


    var currentSea=null;
    thenjs(function(cont){
        checkIsManager2Sea(data,session,function(rep2){
            if(rep2.success){
                cont(null,rep2);
            }else{
                callback(rep2);
            }
        });
    }).then(function(cont,rep){
        if(rep.currentSea){
            currentSea=rep.currentSea;
        }
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(doc){
            if(category=="2"||category=="3"){
                var sysStatus = doc.sysStatus;
                if(sysStatus=="5"||sysStatus=="6"||sysStatus=="7"||sysStatus=="8"){
                    result.code = "1005";
                    result.message = "The customer is in the state of being audited";
                    callback(result);
                }else{
                    cont(null,doc);
                }
            }else{
                cont(null,doc);
            }
        }
    }).then(function(cont,doc){
        if(owner!=noForOwner&&owner!=uid){
            _set.isRead = true;
            cont(null,doc);
        }else{
            cont(null,doc);
        }
    }).then(function(cont,doc){
        if(doc){
            resetCustInfo2Sea(_set,doc,session);
            var updateData = {$set:_set};
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        _set._id=id;
        _set.accountId=aid;
        //console.dir(_set)
        var owner=_set.owner;
        var oldOwner=doc.owner;
        if(owner!=oldOwner && currentSea) {
            if(categoryId!=noForOwner && owner==categoryId && currentSea.category=='4'){//自动分配
                appEvent.emitCustomerAutoSeaEvent(_set);
            }
        }
        emitAgentNotify(data,doc,currentSea,session);
        emitCustomerUpdateCustForOwnerEvent(data,doc,session);

        result.success = true;
        result.data = _set;
        callback(result);
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })
}
/**
 * 补录通话时，关联的老客户没有这个号码,则更新到客户里
 *     "phone": [
 {
   "tel": "010435345",
   "memo": "",
   "area": "北京"
 }
 ],
 * @param data
 * @param session
 * @param callback
 */
exports.updateCustTelByCall = function (data,session,callback) {
    //console.dir(data)
    var result = {success: false};
    var query={_id:data._id};
    var id=data._id;
    var phone=data.phone||[];
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;

    if(phone.length<=0){
        return;
    }
    var _set={phone:phone};
    _set.lastUpdateTime=time;
    _set.lastUpdater=uid;

    data.isUpdae='update';
    thenjs(function(cont){
        checkRepeat(data,session,function(rep){
            if(rep.success){
                delete data.isUpdae;
                delete data["_id"];
                cont(null,rep);
            }else{
                result=rep;
                callback(result);
            }
        });
    }).then(function(cont,rep){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(doc){
            resetCustPhoneArea(data,doc);
            _set.phone=data.phone;
            var updateData = {$set:_set};
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        //update search index
        if (phone) {
            var idxData = {
                _id: id,
                account: aid,
                name: doc.name,
                phone: _set.phone ,
                notifyTime: doc.notifyTime,
                createTime: doc.createTime
            }
            solrHandler.updateIndex2Cust(idxData, function () {
            });
        }
        data._id = id;
        emitCustomerUpdateEvent(data,doc,session);
        exports.locationTelArea(data, session);

        result.success = true;
        result.data = _set;
        callback(result);
    }).fail(function(cont,err){
        logger.app.error(err);
        callback(result);
    })
}

/**
 * 通话补录，更新客户最新联系时间
 *
 通话是有效通话（已接听的），若客户有所属人且处理座席和所属人是同一人，且挂机时间大于lastContactTime ，则更新lastContactTime；
 如果客户跟进状态是“待跟进”，则更新为“跟进中”，并记录日志。
 * @param data
 * @param callItem
 * @param session
 */
exports.updateCustLastContactByCall = function (data,callItem,session) {
    //console.info("updateCustLastContactByCall====================")
    //console.dir(data)
    //console.dir(callItem)
    var result = {success: false};
    var query={_id:data.customerId};
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;

    var _set={};
    _set.lastUpdateTime=time;
    _set.lastUpdater=uid;

    var status=callItem.STATUS;
    //var beginTime=callItem.BEGIN_TIME;
    var endTime=callItem.END_TIME;
    var agent=callItem.DISPOSAL_AGENT||'';

    if(status=='dealing' && endTime && agent){
        thenjs(function(cont){
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
        }).then(function(cont,doc){
            if(doc){
                var owner=doc.owner;
                var sysStatus=doc.sysStatus;
                var lastContactTime=doc.lastContactTime||'';

                var _time=null;
                if(lastContactTime){
                    var time=utils.DateTime.getDifferenceTime(endTime,lastContactTime);
                    if(time>0){
                        _time=endTime;
                    }
                }else{
                    _time=endTime;
                }
                if(owner && owner==agent){
                    if(_time){
                        _set.lastContactTime=_time;
                    }
                    if(sysStatus=='0'){
                        _set.sysStatus="1";
                        var updateData = {$set:_set};
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,function(err){
                            if(err){
                                logger.app.error(err);
                            }else{
                                var eventData = {
                                    _id : doc._id,
                                    tType : "updateSysStatus",
                                    accountId:aid,
                                    uid : "system",
                                    sysStatus : "1",
                                    owner : owner,
                                    oldOwner:owner,
                                    status:doc.status,
                                    oldStatus:doc.status,
                                    categoryId:doc.categoryId,
                                    oldCategoryId:doc.oldCategoryId,
                                    //money:0,
                                    content : "跟进状态变更为【跟进中】"
                                }
                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CONTACT_STATUS, eventData);
                            }
                        })
                    }
                }
            }else{
                result.message = '未找到客户信息!';
            }
        }).fail(function(cont,err){
            logger.app.error(err);
        })
    }
}

/**
 * 联系计划更新到客户
 * @param data
 * @param session
 * @param callback
 */
exports.updateCustActionByNote = function (data,session,callback) {
    //console.dir(data)
    var result = {success: false};
    var query={_id:data._id};
    var id=data._id;
    delete data._id;
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;

    var _set=data;
    _set.lastUpdateTime=time;
    _set.lastUpdater=uid;

    thenjs(function(cont){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(doc){
            var updateData = {$set:_set};
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        //update search index
        if (data.notifyTime != doc.notifyTime) {
            var idxData = {
                _id: id,
                account: aid,
                name: doc.name,
                phone:doc.phone,
                notifyTime: data.notifyTime,
                createTime: doc.createTime
            }
            solrHandler.updateIndex2Cust(idxData, function () {
            });
        }

        result.success = true;
        result.data = _set;
        callback(result);
    }).fail(function(cont,err){
        logger.app.error(err);
        callback(result);
    })
}

var emitCustomerMergeEvent = function(data,mergeCusts,session){
    var _p = {};
    var accId =session.user.account;
    var custA = mergeCusts[0];
    var custB = mergeCusts[1];
    var nameA = custA.name;
    var nameB = custB.name;
    var oldCustSource = "无来源";
    var custSource = "无来源";
    var oldStatus = "";
    var status = "";
    var oldOwner = "无归属";
    var owner = "无归属";
    var oldCategory = "无归属";
    var category = "无归属";
    thenjs(function(cont){
        mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({account:accId},{fields:{status:1,source:1}},cont);
    }).then(function(cont,tempL){
        if(tempL) {
            var tmpLs = tempL;
            _p._id = custB._id;

            _p.accountId = session.user.account;
            _p.uid = session.user._id;
            _p.createTime= custB.createTime;

            _p.oldName = custB.name;
            _p.oldStatus = custB.status;
            _p.oldCustSource = custB.custsource1;
            _p.oldOwner = custB.owner;
            _p.oldCategoryId = custB.categoryId;
            _p.oldPhone = custB.phone;
            _p.oldEmail = custB.email;

            _p.name = data.name;
            _p.status = data.status;
            _p.custSource = data.custsource1;
            _p.owner = data.owner;
            _p.categoryId = data.categoryId;
            _p.phone = data.phone;
            _p.email = data.email;

            _p._delId = custA._id;
            _p.delStatus = custA.status;
            _p.delOwner = custA.owner;
            _p.delCategoryId = custA.categoryId;

            if(!data.name){
                _p.name=custB.name;
            }
            if(!data.status) {
                _p.status = custB.status;
            }
            //console.info("data.custsource1===="+data.custsource1);
            if(typeof data.custsource1 == "undefined") {
                _p.custSource=custB.custsource1;
            }
            if(!data.owner){
                _p.owner = custB.owner;
            }
            if(!data.categoryId){
                _p.categoryId = custB.categoryId;
            }
            if(!data.phone){
                _p.phone = custB.phone;
            }
            if(!data.email){
                _p.email = custB.email;
            }
            var getAgentName=function(callback){
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({_id:{$in:[_p.owner,_p.oldOwner]}},{fields:{displayName:1}}).toArray(function (err, uList) {
                    if (!err) {
                        uList=uList||[];
                        var n=0;
                        for (var i = 0; i < uList.length; i++) {
                            if (uList[i]._id === _p.owner) {
                                owner = uList[i].displayName;
                                n++;
                            }else if(uList[i]._id === _p.oldOwner){
                                oldOwner = uList[i].displayName;
                                n++;
                            }
                            if(n>=2){
                                break;
                            }
                        }
                        if( typeof callback=='function'){
                            callback();
                        }
                    }
                });
            }
            var getPoolName = function(callback){
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({_id:{"$in":[_p.categoryId,_p.oldCategoryId]}}).toArray(function(err,poolList){
                    if(!err&&poolList){
                        var m = 0;
                        for(var i = 0;i<poolList.length;i++){
                            var pool= poolList[i];
                            if(_p.categoryId==pool._id){
                                category=pool.cName;
                                m++;
                            }
                            if(_p.oldCategoryId==pool._id){
                                oldCategory = pool.cName;
                                m++;
                            }
                            if(m==2){
                                break;
                            }
                        }
                        if( typeof callback=='function'){
                            callback();
                        }
                    }
                });
            }
            var setStatusName=function(){
                var _tmpl = tmpLs.status||{};
                oldStatus=_tmpl[_p.oldStatus]||'';
                status=_tmpl[_p.status]||'';
            }
            var setSourceName=function(){
                var _tmpl = tmpLs.source||[];
                for(var i=0;i<_tmpl.length;i++){
                    if(_tmpl[i].key == _p.oldCustSource){
                        oldCustSource = _tmpl[i].name;
                    }
                    if(_tmpl[i].key == _p.custSource){
                        custSource = _tmpl[i].name;
                    }
                }
            }
            var oldPhone = [];
            if(_p.oldPhone){
                if(_p.oldPhone.length>0){
                    for(var o=0;o<_p.oldPhone.length;o++){
                        var oo = _p.oldPhone[o];
                        oldPhone.push(oo.tel);
                    }
                }
            }
            var phone = [];
            if(_p.phone){
                if(_p.phone.length>0){
                    for(var p=0;p<_p.phone.length;p++){
                        var pp = _p.phone[p];
                        phone.push(pp.tel);
                    }
                }
            }
            var oldEmail = [];
            if(_p.oldEmail){
                if(_p.oldEmail.length>0){
                    for(var e=0;e<_p.oldEmail.length;e++){
                        var ee = _p.oldEmail[e];
                        oldEmail.push(ee.email);
                    }
                }
            }
            var email = [];
            if(_p.email){
                if(_p.email.length>0){
                    for(var em=0;em<_p.email.length;em++){
                        var ema = _p.email[em];
                        email.push(ema.email);
                    }
                }
            }
            var oldPhones  = "";
            var phones = "";
            var phoneContent = "";
            var setPhone = function() {
                var phoneLength1 = 0;
                if(_p.oldPhone){
                    phoneLength1 = _p.oldPhone.length;
                }
                var phoneLength2 = 0;
                if(_p.phone){
                    phoneLength2 = _p.phone.length;
                }
                if(phoneLength1==0&&phoneLength2!=0){
                    for (var j = 0; j < phoneLength2; j++) {
                        var p = _p.phone[j];
                        if (j == phoneLength2 - 1) {
                            phones += p.tel;
                        } else {
                            phones +=  p.tel + ";";
                        }
                    }
                    phoneContent = "联系人电话新增【"+phones+"】|";
                }
                if(phoneLength2==0&&phoneLength1!=0){
                    for (var i = 0; i < phoneLength1; i++) {
                        var oldP = _p.oldPhone[i];
                        if (i == phoneLength1 - 1) {
                            oldPhones += oldP.tel;
                        } else {
                            oldPhones +=  oldP.tel + ";";
                        }
                    }
                    phoneContent = "联系人电话【"+oldPhones+"】被删除|";
                }
                if(phoneLength1!=0&&phoneLength1==phoneLength2){
                    for (var i = 0; i < phoneLength1; i++) {
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                        if(oldP.tel!= p.tel){
                            oldPhones = oldP.tel;
                            phones = p.tel;
                            phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                        }
                    }
                }
                if(phoneLength1!=0&&phoneLength2!=0&&phoneLength1<phoneLength2){
                    for(var i=0;i<phoneLength1;i++){
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                        if(oldP.tel!= p.tel){
                            oldPhones = oldP.tel;
                            phones = p.tel;
                            phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                        }
                    }
                    phones = "";
                    for(var h=phoneLength1;h<phoneLength2;h++){
                        var p = _p.phone[h];
                        if(h==phoneLength2-1){
                            phones += p.tel;
                        }else{
                            phones += p.tel+";";
                        }
                    }
                    phoneContent += "联系人电话新增【"+phones+"】|";
                }
                if(phoneLength1!=0&&phoneLength2!=0&&phoneLength2<phoneLength1){
                    for(var i=0;i<phoneLength2;i++){
                        var oldP = _p.oldPhone[i];
                        var p = _p.phone[i];
                        if(oldP.tel!= p.tel){
                            oldPhones = oldP.tel;
                            phones = p.tel;
                            phoneContent += "联系人电话【"+oldPhones+"】修改为【"+phones+"】|";
                        }
                    }
                    oldPhones = "";
                    for(var h = phoneLength2;h<phoneLength1;h++){
                        var oldP = _p.oldPhone[h];
                        if(h==phoneLength1-1){
                            oldPhones += oldP.tel;
                        }else{
                            oldPhones += oldP.tel+";";
                        }
                    }
                    phoneContent += "联系人电话【"+oldPhones+"】被删除|";
                }
            }
            var oldEmails = "";
            var emails = "";
            var emailContent = "";
            var setEmail = function(){
                var emailLength1 = 0;
                if(_p.oldEmail){
                    emailLength1 = _p.oldEmail.length;
                }
                var emailLength2 = 0;
                if(_p.email){
                    emailLength2 = _p.email.length;
                }
                if(emailLength1==0&&emailLength2!=0){
                    for (var j = 0; j < emailLength2; j++) {
                        var e = _p.email[j];
                        if (j == emailLength2 - 1) {
                            emails += e.email;
                        } else {
                            emails +=  e.email + ";";
                        }
                    }
                    emailContent = "联系人邮箱新增【"+emails+"】|";
                }
                if(emailLength2==0&&emailLength1!=0){
                    for (var i = 0; i < emailLength1; i++) {
                        var oldE = _p.oldEmail[i];
                        if (i == emailLength1 - 1) {
                            oldEmails += oldE.email;
                        } else {
                            oldEmails +=  oldE.email + ";";
                        }
                    }
                    emailContent = "联系人邮箱【"+oldEmails+"】被删除|";
                }
                if(emailLength1!=0&&emailLength1==emailLength2){
                    for (var i = 0; i < emailLength1; i++) {
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                }
                if(emailLength1!=0&&emailLength2!=0&&emailLength1<emailLength2){
                    for(var i=0;i<emailLength1;i++){
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                    emails = "";
                    for(var h=emailLength1;h<emailLength2;h++){
                        var e = _p.email[h];
                        if(h==emailLength2-1){
                            emails += e.email;
                        }else{
                            emails += e.email+";";
                        }
                    }
                    emailContent += "联系人邮箱新增【"+emails+"】|";
                }
                if(emailLength1!=0&&emailLength2!=0&&emailLength2<emailLength1){
                    for(var i=0;i<emailLength2;i++){
                        var oldE = _p.oldEmail[i];
                        var e = _p.email[i];
                        if(oldE.email!= e.email){
                            oldEmails = oldE.email;
                            emails = e.email;
                            emailContent += "联系人邮箱【"+oldEmails+"】修改为【"+emails+"】|";
                        }
                    }
                    oldEmails = "";
                    for(var h = emailLength2;h<emailLength1;h++){
                        var oldE = _p.oldEmail[h];
                        if(h==emailLength1-1){
                            oldEmails += oldE.email;
                        }else{
                            oldEmails += oldE.email+";";
                        }
                    }
                    emailContent += "联系人邮箱【"+oldEmails+"】被删除|";
                }
            }
                var content = "【"+nameA+"】合并到【"+nameB+"】|";
                    _p.tType="mergeCust";
                    if (_p.oldName != _p.name) {
                        content = content + "客户名称从【" + _p.oldName + "】变更为【" + _p.name + "】|";
                    }
                    if(oldPhone.sort().toString()!=phone.sort().toString()){
                        setPhone();
                        content = content + phoneContent;
                     }
                    if(oldEmail.sort().toString()!=email.sort().toString()){
                        setEmail();
                        content = content + emailContent;
                     }
                    if (_p.oldStatus != _p.status) {
                        setStatusName();
                        content = content + "状态从【" + oldStatus + "】变更为【" + status + "】|";
                    }
                    if(_p.oldCustSource != _p.custSource){
                        setSourceName();
                        content = content + "来源从【" + oldCustSource + "】变更为【" + custSource + "】|";
                    }
            if (_p.oldOwner != _p.owner) {
                if(_p.categoryId=="NA") {
                    if(_p.oldOwner==_p.oldCategoryId){
                        getPoolName(function(){
                            content = content + "客户归属从【"+oldCategory+"】变更为【"+category+"】|";
                            _p.content = content;
                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE, _p);
                        })
                    }else{
                        getAgentName(function(){
                            content = content + "客户归属从【" + oldOwner + "】变更为【"+owner+"】|";
                            _p.content = content;
                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE, _p);
                        })
                    }
                }else{
                    if(_p.oldOwner==_p.oldCategoryId){
                        if(_p.owner == _p.categoryId){
                            getPoolName(function(){
                                content = content + "客户归属从【"+oldCategory+"】变更为【"+category+"】|";
                                _p.content = content;
                                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE,_p);
                            })
                        }else{
                            getPoolName(function(){
                                getAgentName(function(){
                                    content = content + "客户归属从【"+oldCategory+"】变更为【"+owner+"】|";
                                    _p.content = content;
                                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE,_p);
                                })
                            })
                        }
                    }else{
                        if(_p.categoryId==_p.oldCategoryId){
                            if(_p.owner == _p.categoryId){
                                getPoolName(function(){
                                    getAgentName(function(){
                                        content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】|";
                                        _p.content = content;
                                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE,_p);
                                    })
                                })
                            }else{
                                getAgentName(function(){
                                    content = content + "客户归属人从【"+oldOwner+"】变更为【"+owner+"】|";
                                    _p.content = content;
                                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE,_p);
                                })
                            }
                        }else{
                            getAgentName(function(){
                                getPoolName(function(){
                                    content = content + "客户归属从【"+oldOwner+"】变更为【"+category+"】|";
                                    _p.content = content;
                                    appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE,_p);
                                })
                            })
                        }

                    }
                }
            }else{
                        _p.content = content;
                        appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_MERGE, _p);
                    }
        }
    }).fail(function(cont,err){
        logger.app.error(err);
    })
}

exports.mergeCustomer = function (data,session,callback) {
    //console.dir(data);
    var result = {success: false};
    var query={"_id":data._id};
    var id=data._id;
    data.isUpdae='update';
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    var mergeCusts = [];
    var currentSea=null;
    thenjs(function(cont){
        data.merge = true; //合并客户标识
        checkRepeat(data,session,function(rep){
            if(rep.success){
                delete data.isUpdae;
                delete data["_id"];
                cont(null,rep);
            }else{
                result=rep;
                callback(result);
            }
        });
    }).then(function(cont,rep){
        delete data.merge; //
        checkIsManager2Sea(data,session,function(rep2){
            if(rep2.success){
                cont(/*err,返回结果*/null,rep2);
            }else{
                callback(rep2);
            }
        });
    }).then(function(cont,doc){
        if(doc){
            mergeCustAfter(data,session,function(rep){
                if(rep.success){
                    if(rep.noAction){
                        data.actionId = rep.actionId;
                        data.action = rep.action;
                        data.notifyTime = rep.notifyTime;
                        data.actionUser = rep.actionUser;
                        data.lastContactTime = rep.lastContactTime;
                    }
                    mergeCusts = rep.mergeCusts;
                    cont(null,doc);
                }else{
                    callback(rep);
                }
            })
        }
    }).then(function(/*callback*/cont,/*返回结果*/rep){
        if(rep.currentSea){
            currentSea=rep.currentSea;
        }
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,cont);
    }).then(function(cont,doc){
        if(doc){
            resetCustInfo2Sea(data,doc,session);
            var updateData = {$set:data};
            //重置区域字段
            resetCustPhoneArea(data,doc);

            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateData,{w:1},function(err){
                cont(err,doc)
            })
        }else{
            result.message = '未找到客户信息!';
            callback(result);
        }
    }).then(function(cont,doc){
        data._id = id;
        data.accountId=aid;
        var owner=data.owner;
        var categoryId=data.categoryId;
        var oldOwner=doc.owner;
        if(owner!=oldOwner && currentSea) {
            if(categoryId!=noForOwner && owner==categoryId && currentSea.category=='4'){//自动分配
                appEvent.emitCustomerAutoSeaEvent(data);
            }
        }

        emitCustomerMergeEvent(data,mergeCusts,session);
        //update search index
        if ((data.name && data.name != doc.name) || data.phone || data.notifyTime != doc.notifyTime) {
            var idxData = {
                _id: id,
                account: session.user.account,
                name: data.name || doc.name,
                phone: data.phone || doc.phone,
                notifyTime: data.notifyTime || doc.notifyTime,
                createTime: doc.createTime
            }
            if (data.actionType == fields.ACTION_NA) {
                idxData.notifyTime = "";
            }
            solrHandler.updateIndex2Cust(idxData, function () {
            });
        }
        exports.locationTelArea(data, session);

        result.success = true;
        result.data = data;
        callback(result);
    }).fail(function(cont,err){
        logger.app.error(err);
        callback(result);
    })
}


exports.updateFsInfo = function(fid,session){
    var result = {success: false};
    var query={_id:fid};
    mongo.db("cc_file").collection("fs.files").update(query,{$set:{'metadata.type':"storage"}},function(err){
        if(!err){
            result.success = true;
        }else{
            logger.app.error('updateFsInfo error:' + err);
        }
    });
}
exports.deleteCustomer = function(data,session,callback){
    var result = {success:false};
    var query={"_id":data._id};
    var set ={
        //delTag:"y"
    }
    var time=utils.getCurrentDate() ;
    var uid=session.user._id;
    set.lastUpdateTime=time;
    set.lastUpdater=uid;
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function(err,doc){
        if(!err && doc){
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).remove(query,function(err){
                if(!err){
                    var uid=session.user._id;
                    var timeStamp=utils.DateTime.getCurrentTimestamp();
                    var set={
                        _id:utils.UUID.generateUuid(),
                        createTime:time,
                        time:timeStamp,
                        type:fields.custLog_delete,
                        oldStatus:'',
                        newStatus:fields.custLog_delete,
                        operator:uid,
                        owner:doc.owner||'',
                        num:1,
                        custId:[doc._id]
                    }
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).insert(set,function(err){
                        if(err){
                            logger.app.error('record customer deleteCustomer log error:' + err);
                        }
                    });
                    var q1={customerId:{$in:query._id}};
                    mongo.db().collection(fields.DB_APP_NOTE).remove(q1, function (err) {
                        if (err) {
                            logger.app.error(err);
                        }
                    });
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error('deleteCustomer error:' + err);
                    result.message = 'deleteCustomer error!';
                    callback(result);
                }
            });

        }else{
            logger.app.error('deleteCustomer error:' + err);
            result.message = 'deleteCustomer error!';
            callback(result);
        }
    });
}
var extractFields=function(tmpl,item){
    var fields=[];
    for(var i in tmpl.stable_fields){
        var field = tmpl.stable_fields[i];
        var name = field.name;
        var value = field.value;
        if(name && name!='name' && name!='title' && name!='phone' && name!='email' && name!='weixin' ){
            fields.push({n:value,v:item[name]||'',t:'',k:name}) ;
        }else if(name=='phone'){
            item.phoneAlias=value;
        }else if(name=='email'){
            item.emailAlias=value;
        }else if(name=='weixin'){
            item.weixinAlias=value;
        }
    }
    if(tmpl.custom_fields && tmpl.custom_fields.length>0){
        for(var i=0;i<tmpl.custom_fields.length;i++){
            var obj=tmpl.custom_fields[i];
            if(obj.name){
                fields.push({n:obj.name,v:item[obj._id]||'',t:obj.type,k:obj._id}) ;
            }
        }
    }
    return fields;
}
exports.queryCustFields = function (data, session,callback) {
    var result = {success: false};
    if(!data){
        result.message = 'customer is null';
        callback(result);
        return;
    }
    mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({_id:data.dbType},function(err,item){
        if(!err){
            result.success = true;
            data.fields=extractFields(item,data)||[];
            result.data=data;
        }else{
            logger.app.error('db getTmplInfo error:' + err);
            result.message = '404 tmpl not found!';
        }
        callback(result);
    });
}

exports.queryCustInfo = function (data, session,callback) {
    var result = {success: false};
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:data._id},function(err,row){
        if(!err){
            if(!row){
                result.message = '404 customer not found!';
                result.code = '404';
                callback(result);
                return;
            }
            var findCustTemp = function (row,session,result,callback){
                mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({_id:row.dbType},function(err,item){
                    if(!err){
                        result.success = true;
                        row.fields=extractFields(item,row)||[];
                        result.data=row;
                        if(row.owner==session.user._id){
                            if(row.isRead){
                                var setData = {
                                    $set:{isRead:false}
                                };
                                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:data._id},setData,function(err){
                                    if(!err){
                                        result.isRead="notify";
                                    }else{
                                        logger.app.error(err);
                                    }
                                    callback(result);
                                });
                            }else{
                                callback(result);
                            }
                        }else{
                            callback(result);
                        }

                    }else{
                        logger.app.error('db getTmplInfo error:' + err);
                        result.message = '404 tmpl not found!';
                        callback(result);
                    }
                });
            }

            //获取客户回收时间
            var sysStatus = row.sysStatus;//系统状态
            var categoryId = row.categoryId;//公海id
            if(categoryId != "NA" && row.takeTime && sysStatus == "0"){ //待跟进
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({"_id":categoryId},function(err,common){
                    if(!err){
                        if(common.category == "3" || common.category == "0" ){//手动公海按天计算
                            row.recoveryTime = calcRecoveryTimeByDay(row,common,sysStatus);
                            findCustTemp(row,session,result,callback);
                        }else if(common.category == "4"){//自动公海按分钟计算
                            row.recoveryTime = calcRecoveryTimeByMinute(row,common,sysStatus);
                            findCustTemp(row,session,result,callback);
                        }else{
                            findCustTemp(row,session,result,callback);
                        }

                    }else{
                        logger.app.error('queryCommonById error:' + err);
                        callback(result);
                    }
                });
            }else if(categoryId != "NA" && row.takeTime && sysStatus == "1"){ //跟进中
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({"_id":categoryId},function(err,common){
                    if(!err){
                        if(common.category == "3" || common.category == "4"){//跟进中都按天计算
                            row.recoveryTime = calcRecoveryTimeByDay(row,common,sysStatus);
                            findCustTemp(row,session,result,callback);
                        }else{
                            findCustTemp(row,session,result,callback);
                        }
                    }else{
                        logger.app.error('queryCommonById error:' + err);
                        callback(result);
                    }
                });
            }else{
                findCustTemp(row,session,result,callback);
            }

        }else{
            logger.app.error('db queryCustInfo error:' + err);
            result.message = '404 customer not found!';
            callback(result);
        }
    });
}
exports.showCustomerAdd = function (data, session,callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_MENU).findOne({type:"agent"}, function(err, menu){
        if(!err) {
            result.success = true;
            result.data=!menu?'':menu.menu;
            callback(result);
        } else {
            logger.app.error('db showRoleAdd error:' + err);
            result.message = '404 function not found!';
            callback(result)
        }
    });
}

exports.showCustomerEdit= function (data, session,callback) {
    var result = {success: false};
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:data._id},function(err,row){
        if(!err){
            result.role=row;
            mongo.db().collection(fields.DB_APP_MENU).findOne({type:"agent"}, function(err, menu){
                if(!err) {
                    result.success = true;
                    result.data=!menu?'':menu.menu;
                    callback(result);
                } else {
                    logger.app.error('db showRoleEdit error:' + err);
                    result.message = '404 function not found!';
                    callback(result)
                }
            });
        }else{
            logger.app.error('db showRoleEdit error:' + err);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}

//custTmpl dic
exports.getTmplByAccId = function (session,callback) {
    var result = {success: false};
    var accId =session.user.account;
    mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).find({account:accId},{sort:{create_date:1}}).toArray(function(err,docs){
        if(!err){
            result.success = true;

            callback(null, docs || []);
        }else{
            logger.app.error('db getTmplInfo error:' + err);
            result.message = '404 tmpl not found!';
            callback(err) ;
        }
    });
}
exports.getTmplByDbType = function (data,session,callback) {
    var result = {success: false};
    var query={_id:data.dbType};
    mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne(query,function(err,doc){
        if(!err){
            result.success = true;
            callback(null, doc.status || {});
        }else{
            logger.app.error('db getTmplInfo error:' + err);
            result.message = '404 tmpl not found!';
            callback(err) ;
        }
    });
}
/****************************************customer action**************************************************/
exports.dealNote = function (data,session,callback) {
    var result = {success: false};
    var time=utils.getCurrentDate();
    var actionId=data.actionId;
    var query={"_id":data.actionId};
    //console.info("dealNote============");
    //console.dir(data)
    if(data.status == "1"){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:data._id},function(err,cust){
            if(!err&&cust){
                var lastContactTime = cust.lastContactTime || "";
                var doc={status:data.status,lastUpdateTime:time,lastContactTime:lastContactTime};;
                mongo.db().collection(fields.DB_APP_NOTE).findAndModify(query,[],{$set:doc},{new:true},function (err,action) {
                    if (!err) {
                        var temp={
                            actionId:'',
                            actionType:fields.ACTION_NA,
                            action:data.action,
                            notifyTime:data.notifyTime,
                            actionUser:"",
                            lastContactTime:time,
                            _id:data._id
                        }
                        exports.updateCustActionByNote(temp,session,callback);
                        var _his={
                            status:'finish',
                            lastUpdateTime:time,
                            endTime:time,
                            dispose:'完成计划'
                        }
                        customerHistoryHandler.updateHistory(actionId,_his,session,function(rep){});
                    } else {
                        logger.app.error('db dealNote error:' + err);
                        result.message = 'db dealNote error!'+err.message;
                        callback(result);
                    }
                });
            }else{
                //console.dir(err);
                logger.app.error('db dealNote error:' + err);
                result.message = 'db dealNote error!'+err.message;
                callback(result);
            }
        })
    }else if(data.status == "0"){
        var doc ={status:data.status,lastUpdateTime:time};
        mongo.db().collection(fields.DB_APP_NOTE).findAndModify(query,[],{$set:doc},{new:true},function (err,action) {
        if (!err) {
            var temp={
                actionId:data.actionId,
                actionType:fields.ACTION_DATE,
                action:data.action,
                notifyTime:data.notifyTime,
                actionUser:action.userId,
                lastContactTime:action.lastContactTime,
                _id:data._id
            }
            exports.updateCustActionByNote(temp,session,callback);

        } else {
            logger.app.error('db dealNote error:' + err);
            result.message = 'db dealNote error!'+err.message;
            callback(result);
        }
    });
    }
}
exports.updateNote = function (data,session,callback) {
    var result = {success: false};
    var time=utils.getCurrentDate();
    data.lastUpdateTime=time;
    var query={"_id":data._id};
    delete data["_id"];
    var notifyTime=data.notifyTime;
    var _t=utils.DateTime.getDifferenceTime(notifyTime+":00",utils.getCurrentDate())
    var _set={$set:data};
    if(_t>0){
        _set['$unset']={deal:1};
    }
    mongo.db().collection(fields.DB_APP_NOTE).update(query,_set,function (err) {
        if (!err) {
            result.success = true;
            var temp={
                actionId:query._id,
                action:data.remark,
                notifyTime:data.notifyTime,
                actionType:fields.ACTION_DATE,
                //lastContactTime:time,
                _id:data.customerId
            }
            exports.updateCustActionByNote(temp,session,callback);

            var _his={
                lastUpdateTime:time,
                comments:"["+data.notifyTime+"]"+data.remark
            }
            customerHistoryHandler.updateHistory(query._id,_his,session,function(rep){});
        } else {
            logger.app.error('db insert error:' + err.stack);
            result.message = 'db insert error!'+err.message;
            callback(result);
        }
    });
}
exports.getNote = function(data,session,callback){
    var result = {success:false};
    var find = {
        _id : data
    }
    mongo.db().collection(fields.DB_APP_NOTE).findOne(find,function(err,doc){
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        if(doc){
            result.data = doc;
        }else{
            result.data = '';
        }
        callback(result);
    })
}
exports.addNote = function (data,session,callback) {
    var result = {success: false};
//    var flag=data.flag;
    var time=utils.getCurrentDate();
    var item=data;
//    delete item['flag'];

    var id=utils.UUID.generateUuid();
    item._id=id;
    item.createTime=time;
    item.lastUpdateTime=time;
    item.status="0";//default is not complete

    mongo.db().collection(fields.DB_APP_NOTE).insert(item, function (err) {
        if (!err) {
            result.success = true;
            var temp={
                actionId:id,
                action:data.remark,
                notifyTime:data.notifyTime,
                actionType:fields.ACTION_DATE,
                actionUser:data.userId,
                //lastContactTime:time,
                _id:data.customerId
            }
            exports.updateCustActionByNote(temp,session,callback);

            var _his={
                _id:id,
                type:'note',
                customer:data.customerId,
                createTime:time,
                //businessType:'',
                agent:data.userId,
                status:"create",//create,finish
                lastUpdateTime:time,
                comments:"["+data.notifyTime+"]"+data.remark,
                beginTime:time,
                endTime:"",
                dispose:'创建计划'
            }
            customerHistoryHandler.addHistroy(_his,session,function(rep){});
        } else {
            logger.app.error('db insert error:' + err.stack);
            result.message = 'db insert error!'+err.message;
            callback(result);
        }
    });
}

exports.queryCustNote = function (data, session, callback) {
    var pageSize = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var limit = pageSize;
    var skip = (page - 1) * pageSize;

    if(!data.accountId)
        data.accountId=session.user.account;
    var condition = data;
    utils.removeEmptyProperty(condition);

    var result = {success: false};
    mongo.db().collection(fields.DB_APP_NOTE).find(condition, {sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_NOTE).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });

}

/****************************************customer manager**************************************************/
var updateOwner=function(owner,ids,ids1,session,count,timeStamp){
    var time=utils.getCurrentDate() ;
    var uid=session.user._id;

    if(ids.length>0){
        var data = {};
        data.lastUpdateTime=time;
        data.lastUpdater=uid;
        data.takeTime = time;
        data.isRead = true;
        data.owner = owner;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:{"$in":ids}},{$set:data},{multi: true},function(err){
            if(err){
                logger.app.error('updateOwner error:' + err);
            }
        })
    }

    if(ids1.length>0){
        var data = {};
        data.lastUpdateTime=time;
        data.lastUpdater=uid;
        data.takeTime = time;
        data.isRead = true;
        data.owner = owner;
        data.sysStatus="0";
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:{"$in":ids1}},{$set:data},{multi: true},function(err){
            if(err){
                logger.app.error('updateOwner error:' + err);
            }
        })
    }
}

exports.queryCustList = function (data, session, callback) {
    var query = data;
    utils.removeEmptyProperty(query);
    if(query.phone) {
        query["phone.tel"]=query.phone;
        delete query.phone;
    }
    query.accountId=session.user.account;
    var result = {success: false};
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
}
/**
 * 定位到多个客户查询
 * @param data
 * @param session
 * @param callback
 */
exports.queryPopupCustomer = function (data, session, callback) {
    var result = {success: false};
    var limit = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var skip = (page - 1) * limit;

    var query={};
    var src="";
    if(data.id){
        var ary=data.id.split("_");
        if(ary && ary.length>=2){
            src=ary[1];
        }
    }
    if(src=='callLocation'){//补录第一次查询
        query["phone.tel"]=data.phone;
    }else{
        var field=data.field;
        var combox=data.combox||'';
        combox=combox.replace(/(^\s+)|(\s+$)/g,"");

        if(combox){
            if (field=='phone') {
                query["phone.tel"] = combox;
            }else if(field=='email'){
                query["email.email"] = combox;
            }else if(field=='weixin'){
                query.$or=[{"weixin.num":combox},{"weixin.memo":combox}];
//                query["weixin.num"] = combox;
            }else if(field=='displayName'){
                //var regStr=utils.escapeRegex(combox);
                //query.name= new RegExp("^"+regStr);
            }
        }else{
            result.list = [];
            result.count = 0;
            result.success = true;
            callback(result);
            return;
        }
    }

    var _queryFun=function(){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }

    if(combox && field=='displayName'){
        query.name=combox;
        solrHandler.queryIndex2Cust(query,session,function(rep){
            if(rep.success){
                delete query.name;
                var ids=rep.ids;
                query._id={$in:ids};
                _queryFun();
            }else{
                logger.app.error("query solr index error");
                callback({success: false, list: [], count: 0});
            }
        });
    }else{
        _queryFun();
    }
}

exports.resetStatus = function (data, session,callback) {
    var result = {success: false};
    var query={"_id":data._id};

    var time=utils.getCurrentDate() ;
    var uid=session.user._id;
    var updateSet={
        lastUpdateTime:time,
        lastUpdater:uid,
        status:'status0'
    }
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:updateSet},function(err){
        if(!err){
            result.success = true;
            callback(result);
        }else{
            logger.app.error('db resetStatus error:' + err.stack);
            callback(result);
        }
    });
}

exports.useCustomerOwner = function (data, session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    var uid=session.user._id;
//    var _query={
//        type:fields.custLog_use,
//        owner:uid
//    }
    var _query={
        owner:uid,
        //delTag:null,
        status:fields.CUSTOMER_DEFAULT_STATUS
    }

    var occupyTaskHandler = function(updateSet,doc,session,callbackRep){
        var result2 = {success: false};
        if(!doc.taskId){//不存在taskId返回
            result2.success = true;
            callbackRep(result2);
        }else{
            var updateOwner = updateSet.owner;
            mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).findOne({_id: doc.taskId+"_"+updateOwner},function(err, taskUser) {
                if (!err && taskUser) {
                    var upData = {$set:{lastUpdater:updateSet.lastUpdater,lastUpdateTime:updateSet.lastUpdateTime},$inc:{}};
                    upData.$inc["total"] = 1;
                    upData.$inc[doc.status] = 1;
                    mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).update({_id:doc.taskId+"_"+updateOwner},upData,function(err){
                        if(!err){
                            var upData2 = {$set:{lastUpdater:updateSet.lastUpdater,lastTime:updateSet.lastUpdateTime},
                                           $inc:{assigned:1}};
                            mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:doc.taskId},upData2,function(err){
                                if(!err){
                                    result2.success = true;
                                    callbackRep(result2);
                                }else{
                                    logger.app.error('db update task error:' + err.stack);
                                    callbackRep(result2);
                                }
                            });
                        }else{
                            logger.app.error('db update task user error:' + err.stack);
                            callbackRep(result2);
                        }
                    });
                } else {
                    result2.message = '无法占用:您不是客户所在外呼任务的参与座席!';
                    callbackRep(result2);
                }
            });
        }
    };

//    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).count(_query,function(err,num){
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(_query,function(err,num){
        if(!err){
            mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({_id:data.dbType},function(err,tmpl){
                if(!err && tmpl){
                    var max=tmpl.maxCommon||fields.CUSTOMER_MAX_COMMONNUM;
                    if(num>=max){
                        result.message="您最多可占用客户数为"+max+"个";
                        logger.app.error(err);
                        callback(result);
                    }else{
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function(err,doc){
                            if(!err && doc){
                                var message="";
                                if(doc.owner){
                                    if(doc.owner && doc.owner==uid){
                                        message="你已经占用该客户";
                                    }else{
                                        message="该客户已经被抢用";
                                    }
                                    result.message=message;
                                    callback(result);
                                }else{
                                    var time=utils.getCurrentDate() ;
                                    var updateSet={
                                        lastUpdateTime:time,
                                        lastUpdater:uid,
                                        owner:uid
                                    }
                                    //添加对外呼任务的支持
                                    occupyTaskHandler(updateSet,doc,session,function(rep2){
                                        if(rep2.success){
                                            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:updateSet},function(err){
                                                if(!err){
                                                    var id=utils.UUID.generateUuid();
                                                    var time=utils.getCurrentDate() ;
                                                    var timeStamp=utils.DateTime.getCurrentTimestamp();
                                                    var uid=session.user._id;
                                                    var set={
                                                        _id:id,
                                                        createTime:time,
                                                        time:timeStamp,
                                                        type:fields.custLog_use,
                                                        oldStatus:'',
                                                        newStatus:fields.custLog_use,
                                                        operator:uid,
                                                        owner:uid,
                                                        num:1,
                                                        custId:[doc._id]
                                                    }
                                                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).insert(set,function(err){
                                                        if(err){
                                                            logger.app.error('record customer useCustomerOwner log error:' + err.stack);
                                                        }
                                                    });
                                                    result.success = true;
                                                    callback(result);
                                                }else{
                                                    logger.app.error('useCustomerOwner error:' + err.stack);
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            result=rep2;
                                            callback(result);
                                        }
                                    });
                                }
                            }else{
                                logger.app.error('useCustomerOwner error:' + err.stack);
                                callback(result);
                            }
                        });
                    }
                }else{
                    result.message="客户数据库不存在";
                    logger.app.error(err);
                    callback(result);
                }
            });
        }else{
            logger.app.error(err);
            callback(result);
        }
    });
}


exports.freeCustomerOwner = function (data, session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    //添加外呼任务支持
    var _freeHandler=function(doc,updateSet,callbackRep){
        var result2 = {success: false};
        if(!doc.taskId){
            result2.success = true;
            callbackRep(result2);
        }else{
            var taskId = doc.taskId;
            var upData = {$set:{lastUpdateTime:updateSet.lastUpdateTime,lastUpdater:updateSet.lastUpdater},$inc:{total:-1}};
            upData.$inc[doc.status]=-1;
            if (doc.taskCalled) {
                upData.$inc["called"] = -1;
                if (doc.taskCalled == "1") {
                    upData.$inc["linked"] = -1;
                }
            }
            mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).update({_id:taskId+"_"+updateSet.lastUpdater},upData,function(err){
               if(!err){
                   var upData2 = {$set:{lastTime:updateSet.lastUpdateTime,lastUpdater:updateSet.lastUpdater},$inc:{assigned:-1}};
                   mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:taskId},upData2,function(err){
                       if(!err){
                           result2.success = true;
                           callbackRep(result2);
                       }else{
                           logger.app.error('freeCustomerOwner update task user error:' + err.stack);
                           callbackRep(result2);
                       }
                   });
               } else{
                   logger.app.error('freeCustomerOwner update task error:' + err.stack);
                   callbackRep(result2);
               }
            });
        }
    };
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function(err,doc){
        if(!err && doc){
            var owner=doc.owner;
            var time=utils.getCurrentDate();
            var uid=session.user._id;
            var updateSet={
                lastUpdateTime:time,
                lastUpdater:uid,
                owner:''
            }
            //添加外呼任务支持
            _freeHandler(doc,updateSet,function(rep){
                if(rep.success){
                    var updateSet2={$set:updateSet};
                    if(doc.taskCalled){
                        updateSet2.$unset={};
                        updateSet2.$unset["taskCalled"] = 1;
                    }
                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,updateSet2,function(err){
                        if(!err){
                            var id=utils.UUID.generateUuid();
                            var time=utils.getCurrentDate() ;
                            var timeStamp=utils.DateTime.getCurrentTimestamp();
                            var uid=session.user._id;
                            var set={
                                _id:id,
                                createTime:time,
                                time:timeStamp,
                                type:fields.custLog_giveUp,
                                oldStatus:'',
                                newStatus:fields.custLog_giveUp,
                                operator:uid,
                                owner:owner,
                                num:1,
                                custId:[doc._id]
                            }
                            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).insert(set,function(err){
                                if(err){
                                    logger.app.error('record customer freeCustomerOwner log error:' + err.stack);
                                }
                            });
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error('freeCustomerOwner error:' + err.stack);
                            callback(result);
                        }
                    });
                }else{
                    callback(result);
                }
            });
        }else{
            logger.app.error('freeCustomerOwner error:' + err.stack);
            callback(result);
        }
    });
}


/**
 * 新增客户、弹屏、未接来电、补录客户关联cdr
 * @param data
 * @param session
 * @param callback
 */
exports.callLocationCustomer = function(data, session, callback){
    var result = {success:false};
    var callId=data.callId;//callsheetId
    var cid=data.customerId;
    var uid=session.user._id;
    var phone=data.phone;
    var dealSrc=data.dealSrc;
    var time=utils.getCurrentDate();
    var query = {
        _id :cid
    }
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function(err,doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }else{
            if(doc){
                var customerName=doc.name;
                var taskId = null;
                var taskCalled = null;
                var owner = doc.owner;
                if(doc.taskId)
                    taskId = doc.taskId;
                if(doc.taskCalled)
                    taskCalled = doc.taskCalled;
                if(dealSrc=="popup"){//弹屏新增客户和选择老客户、定位多个客户都在此同步通话记录和历史
                    var relationData={
                        _id:callId,
                        customerId:cid,
                        customerName:customerName,
                        createTime:time,
                        owner: owner
                    };
                    if(taskId)
                        relationData.taskId = doc.taskId;
                    if(taskCalled)
                        relationData.taskCalled = doc.taskCalled;
                    mongo.db().collection(fields.DB_CDR_CUSTOMER_RELATION).insert(relationData,function(err){
                        if(err){
                            logger.app.error('addCustomer insert cdr_customer_relation error:' + err.stack);
                        }
                    });
                    var condition = {
                        CALL_SHEET_ID : callId
                    }
                    var updateData = {
                        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                    }
                    mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:callId},[],updateData,{new:true},function (err,cdrItem) {
                        if (err) {
                            logger.app.error(err);
                            callback(result);
                            return;
                        }else{
                            callSheetHandler.upsertCustHistory(cdrItem,session,function(rep){});
                            result.success = true;
                            callback(result);
                        }
                    });
                }else if(dealSrc=="dialPopup"){//外呼弹屏
                    var key=uid+"_"+ phone;
                    var updateData = {
                        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                    }
                    mongo.db(session).collection(session.user.account+'_c5_call_sheet').findOne({_id:callId},function(err,item){
                        if (err) {
                            logger.app.error(err);
                            callback(result);
                        }else{
                            if(item){
                                mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:callId},[],updateData,{new:true},function (err,cdrItem) {
                                    if (err) {
                                        logger.app.error(err);
                                        callback(result);
                                        return;
                                    }else{
                                        callSheetHandler.upsertCustHistory(cdrItem,session,function(rep){});
                                        result.success = true;
                                        callback(result);
                                    }
                                });
                            }else{
                                var relationData={
                                    _id:key,
                                    customerId:cid,
                                    customerName:customerName,
                                    createTime:time,
                                    owner:owner
                                };
                                if(taskId)
                                    relationData.taskId = doc.taskId;
                                if(taskCalled)
                                    relationData.taskCalled = doc.taskCalled;
                                mongo.db().collection(fields.DB_CDR_CUSTOMER_RELATION).insert(relationData,function(err){
                                    if(err){
                                        logger.app.error('insert cdr_customer_relation error:' + err.stack);
                                    }
                                });
                                result.success = true;
                                callback(result);
                            }
                        }
                    });
                }else if(dealSrc=="taskAgentAdd"){//外呼任务
                    var key=uid+"_"+ phone;
                    var updateData = {
                        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                    }
                    mongo.db(session).collection(session.user.account+'_c5_call_sheet').findOne({_id:callId},function(err,item){
                        if (err) {
                            logger.app.error(err);
                            callback(result);
                        }else{
                            if(item){
                                mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:callId},[],updateData,{new:true},function (err,cdrItem) {
                                    if (err) {
                                        logger.app.error(err);
                                        callback(result);
                                        return;
                                    }else{
                                        callSheetHandler.upsertCustHistory(cdrItem,session,function(rep){});
                                        result.success = true;
                                        callback(result);
                                    }
                                });
                            }else{
                                var relationData={
                                    _id:key,
                                    customerId:cid,
                                    customerName:customerName,
                                    createTime:time,
                                    owner:owner
                                };
                                if(taskId)
                                    relationData.taskId = doc.taskId;
                                if(taskCalled)
                                    relationData.taskCalled = doc.taskCalled;
                                mongo.db().collection(fields.DB_CDR_CUSTOMER_RELATION).insert(relationData,function(err){
                                    if(err){
                                        logger.app.error('insert cdr_customer_relation error:' + err.stack);
                                    }
                                });
                                result.success = true;
                                callback(result);
                            }
                        }
                    });
                }else if(dealSrc=="customerLeak"){//未接来电-回电处理
                    var key=uid+"_"+ phone;
                    var condition = {
                        RECALLFLAG : key
                    }

                    //update leak table
                    var leakCondition = {
//                        NEW_CUSTOMER_ID : data.CALL_SHEET_ID
                        CALL_NO:phone
                    }
                    var leakSet = {
                        "$set" : {NEW_CUSTOMER_ID : cid , NEW_CUSTOMER_NAME : customerName}
                    }
                    mongo.db(session).collection(session.user.account + fields.DB_CALL_SHEET_LEAK).update(leakCondition,leakSet,function(err){
                        if (err) {
                            logger.app.error(err);
//                            callback(result);
                        }
                    });

                    var updateData = {
                        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName,RECALLFLAG: ""}
                    }
                    mongo.db(session).collection(session.user.account+'_c5_call_sheet').findOne(condition,function(err,item){
                        if (err) {
                            logger.app.error(err);
                            callback(result);
                        }else{
                            if(item){//find direct update
                                mongo.db(session).collection(session.user.account+'_c5_call_sheet').update({CALL_SHEET_ID:item.CALL_SHEET_ID},updateData,function(err){
                                    if (err) {
                                        logger.app.error(err);
                                        callback(result);
                                        return;
                                    }else{
                                        result.success = true;
                                        callback(result);
                                    }
                                });
                            }else{
                                var relationData={
                                    _id:key,
                                    customerId:cid,
                                    customerName:customerName,
                                    createTime:time,
                                    owner:owner
                                };
                                if(taskId)
                                    relationData.taskId = doc.taskId;
                                if(taskCalled)
                                    relationData.taskCalled = doc.taskCalled;
                                mongo.db().collection(fields.DB_CDR_CUSTOMER_RELATION).insert(relationData,function(err){
                                    if(err){
                                        logger.app.error('addCustomer insert cdr_customer_relation error:' + err.stack);
                                    }
                                });
                                result.success = true;
                                callback(result);
                            }
                        }
                    });
                }else{//补录客户
                    var isOld=data.isOld;
                    if(isOld && isOld=='select_old'){//选择老客户,判断是否有该号码
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,row){
                            if(!err && row && phone){
                                var isExists=false;
                                if(row.phone && row.phone.length>0){
                                    for (var i = 0; i < row.phone.length; i++) {
                                        var obj = row.phone[i];
                                        var tel=obj.tel;
                                        if(tel==phone){
                                            isExists=true;
                                        }
                                    }
                                }
                                if(!isExists){//不存在则关联
                                    var _param={
                                        _id:cid,
                                        tel:phone
                                    }
                                    exports.addCustomerTel(_param,session,function(rep){
                                        if(rep.success){
                                            var condition = {
                                                CALL_SHEET_ID : callId
                                            }
                                            var updateData = {
                                                "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                                            }
                                            mongo.db(session).collection(session.user.account+'_c5_call_sheet').update(condition,updateData,function(err){
                                                if (err) {
                                                    logger.app.error(err);
                                                    callback(result);
                                                    return;
                                                }else{
                                                    result.success = true;
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            callback(rep);
                                        }
                                    })
                                }else{
                                    var condition = {
                                        CALL_SHEET_ID : callId
                                    }
                                    var updateData = {
                                        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                                    }
                                    mongo.db(session).collection(session.user.account+'_c5_call_sheet').update(condition,updateData,function(err){
                                        if (err) {
                                            logger.app.error(err);
                                            callback(result);
                                            return;
                                        }else{
                                            result.success = true;
                                            callback(result);
                                        }
                                    });
                                }
                            }else{
                                logger.app.error(err);
                                result.message="不存在的客户！";
                                callback(result);
                            }
                        });
                    }else{
                        var condition = {
                            CALL_SHEET_ID : callId
                        }
                        var updateData = {
                            "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : customerName }
                        }
                        mongo.db(session).collection(session.user.account+'_c5_call_sheet').update(condition,updateData,function(err){
                            if (err) {
                                logger.app.error(err);
                                callback(result);
                                return;
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        });
                    }
                }
            }else{
                result.success = true;
                callback(result);
            }
        }

    });
}
exports.addCustomerTel = function (data, session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    data.isUpdae='update';
    var time=utils.getCurrentDate() ;
    var uid=session.user._id;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    data.phone=[{tel:data.tel}];
    //添加外呼任务支持
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function(err,doc){
        if(!err){
            data.taskId = doc.taskId;
            checkRepeat(data,session,function(rep){
                if(rep.success){
                    delete data.isUpdae;
                    delete data["_id"];
                    delete data["taskId"];
                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$push:{phone:{tel:data.tel,memo:''}}},function(err){
                        if(!err){
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else{
                    result=rep;
                    callback(result);
                }
            }) ;
        }else{
            logger.app.error(err);
            callback(result);
        }
    });

}
exports.delCustomerAttach = function (data, session,callback) {
    var result = {success: false};
    var aid=session.user.account;
    var fileId=data.fileId;
    var set={attachs:data.attachs};
    if(data._id){
        mongo.db(session).collection(aid+fields.DB_C5_CUSTOMER).update({_id:data._id},{$set:set}, function (err){
            if (!err) {
                qiniuHandler.delFile({key:fileId},session,function(){});
                result.success = true;
                callback(result);
            } else {
                logger.app.error('delCustomerAttach error:' + err.stack);
                result.message = 'delCustomerAttach error!'+err.message;
                callback(result);
            }
        });
    }else{
        result.success = true;
        callback(result);
    }
/*    mongo.removeFileFromDb(fileId, function (err){
        if (!err) {

        } else {
            logger.app.error('delCustomerAttach error:' + err.stack);
            result.message = 'delCustomerAttach error!';
            callback(result);
        }
    });*/
}
exports.transferImg = function (data, session,callback) {
    var url = config.ccServiceUrl+'?Action=img&Method=customer&file='+data.fileName+'&trueName='+data.trueName+'&account='+data.account;;
    url=encodeURI(url);
    http.sendGet(url,function(err,res){
        if(!err && res){
            try{
                var res = JSON.parse(res);
                if(res.Succeed){
                    res.success = true;
                    logger.request.info("transferImg return result==="+res.isSuccess);
                    callback(res);
                }else{
                    callback(res);
                }
            }catch (e) {
                logger.request.error(e);
                callback(e);
            }
        }else{
            var error = err || new Error('request transferImg error!');
            logger.request.error(error);
            callback(error);
        }
    });
}
exports.getCustomerOwnerEmpNo = function (data , callback) {
    var result = {success : false};
    var accountId = data.accountId, callNo = data.callNo;
    accountHandler.getAccountById({_id:accountId},null,function(accountResult){
        if(accountResult.success){
            var account = accountResult.data;
            var dbName = account.dataDB;
            mongo.db(dbName).collection(accountId +fields.DB_C5_CUSTOMER).findOne({'phone.tel':callNo},function (err , customer){
                if(!err && customer){
                    var owner = customer.owner || "";
                    mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id:owner},function(err,user){
                        if(!err && user){
                            result.success = true;
                            result.empNo = user.exten;
                            callback(result);
                        } else {
                            result.message = "user is not found by id:[" + owner + "]";
                            logger.app.warn("user is not found by id:[" + owner + "]");
                            callback(result);
                        }
                    });

                } else {
                    result.message = "customer is not found by callNo:[" + callNo + "]";
                    logger.app.warn("customer is not found by callNo:[" + callNo + "]");
                    callback(result);
                }
            });
        } else {
            result.message = "account is not found:[" + accountId + "]";
            logger.app.warn("account is not found:[" + accountId + "]");
            callback(result);
        }
    });
}

//////// for 客服版

var filterCustomerSeas = function(session){
    var allSeas=session.user.allSeas||[];
    var userId = session.user._id;
    var managerIds=[];

    for(var i=0;i<allSeas.length;i++){
        var pool = allSeas[i];
        var category = pool.category;
        var managers = pool.managers;
        var members = pool.members;

        if(category=="0"||category=="3"){
            if(managers.indexOf(userId)!=-1||members.indexOf(userId)!=-1){
                managerIds.push(pool._id);
            }
        }
    }

    return managerIds;
}

exports.setExportQueryPageCondition = function(query,session){
    setQueryPageCondition2In(query,session);
}

var setQueryPageCondition2In=function(query,session) {
    var menu = query.menu;
    delete query.menu;
    var noExistVal="noExistVal";
    if (menu == 'customer_seas') {
        var managerIds=filterCustomerSeas(session);
        if (query.quickSearch) {
            if(managerIds.indexOf(query.quickSearch)!=-1){
                query.owner = query.quickSearch;
            }else{
                query.owner = noExistVal;
            }
        }else{
            if(query.owner){
                if(managerIds.indexOf(query.owner)!=-1){
                    query.owner = query.owner;
                }else{
                    query.owner = noExistVal;
                }
            }else{
                query.owner ={$in:managerIds};
            }
        }
    }else if(menu=='customer_my'){
        query.owner=session.user._id;
        if(query.quickSearch){
            if(query.quickSearch=="isFollow"){
                query.sysStatus= "0";
            }else if(query.quickSearch=="isProject"){
                query.actionType='date';
            }else if(query.quickSearch=="totalNotify"){
                var time = utils.DateTime.getCurrentDate();
                var startTime = time+ " 00:00:00";
                var endTime = time + " 23:59:59";
                query.notifyTime = {"$gte":startTime,"$lte":endTime};
            }
        }
    }else if(menu=='customer_all'){
        if(query.quickSearch){
            query.owner=query.quickSearch;
            utils.setUserLevelCondition2Cust(query,'owner',session);
        }else{
            //高级搜索-所属范围控件查询
            utils.setUserLevelCondition(query,"owner","customer",session)
        }
    }

    delete query.limit;
    delete query.page;
    delete query.page;
    delete query.dbType;
    delete query.quickSearch;

    utils.removeEmptyProperty(query);
    //query.delTag=null;
    for(var k in query){
        if((query[k] instanceof Array) && query[k].length>0){
            query[k]={$all:query[k]};
        }
    }
    //if(query.combox){
    //    var regStr=utils.escapeRegex(query.combox);
    //    query.$or=[{name:new RegExp("^"+regStr)},{"phone.tel":query.combox}];
    //    delete query.combox;
    //}
    if(query.sysStatus == "3"){
        query.sysStatus = {$in:["3","9","11"]}
    }

    if(query.email) {
        query["email.email"]=query.email;
        delete query.email;
    }
    if(query.phone){
        query["phone.tel"]=query.phone;
        delete query.phone;
    }
    //if(query.name){
    //    var regStr=utils.escapeRegex(query.name);
    //    query.name=new RegExp("^"+regStr);
    //}

    if(query.weixin){
        query.$or=[{"weixin.num":query.weixin},{"weixin.memo":query.weixin}];
//        query["weixin.num"]=query.weixin;
        delete query.weixin;
    }
    if(query.custsource1=='NA'){
        query.custsource1 = {$in:["",null]};
    }

    utils.setDateTimeCondition(query);
}
/**
 * 判断用户是否有查询该公海数据的权限(成员或管理员) 弃用
 * @param cont
 * @param query
 * @param session
 */
var setQueryPoolCondition = function(cont,query,session){
    var menu = query.menu;
    delete query.menu;
    if(menu=='customer_my'){
        cont(null,query);
        return;
    }

    if(query.categoryId){
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id:query.categoryId},function(err,pool){
            if(!err&&pool){
                var managers = pool.managers;
                var members = pool.members;
                var userId = session.user._id;
                if(managers.indexOf(userId)!=-1||members.indexOf(userId)!=-1){
                    if(menu=="customer_seas"){
                            query.owner = pool._id;
                    }else{
                        query.categoryId  = pool._id;
                    }
                }else{
                    query.categoryId = null;
                }
            }
            cont(null,query);
        });
    }else{
        var ary = [];
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({account:session.account.account}).toArray(function(err,poolList){
            if(!err&&poolList){
                for(var i=0;i<poolList.length;i++){
                    var pool = poolList[i];
                    var cate = pool.category;
                    var managers = pool.managers;
                    var members = pool.members;
                    var userId = session.user._id;
                    if(menu=="customer_seas"){
                        if(cate=="0"||cate=="3"){
                            if(managers.indexOf(userId)!=-1||members.indexOf(userId)!=-1){
                                ary.push(pool._id);
                            }
                        }
                    }else{
                        if(managers.indexOf(userId)!=-1||members.indexOf(userId)!=-1){
                            ary.push(pool._id);
                        }
                    }
                }
                if(menu=="customer_seas"){
                    query.owner = {"$in":ary};
                }else{
                    ary.push("NA");
                    query.categoryId = {"$in":ary};
                }
                cont(null,query);
            }
        })
    }
}

exports.queryCustPage2In= function (data, session, callback) {
    var result = {success: false};
    var query =data||{};
//    var menu=data.menu;
    var sort={createTime:-1};
    var limit = data.limit||10;
    var page = data.page||1;
    var skip = (page - 1) * limit;
    delete data.limit;
    delete data.page;
    thenjs(function(cont){
        setQueryPageCondition2In(query,session);
        cont(null,query);
    }).then(function(cont,query){
        if(query.combox||query.name){
            var notify=false;
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    notify=rep.notify;
                    query._id={$in:ids};
                    result.notify = notify;
                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:sort,limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })

}

var emitDelCustEvent = function(customerList,session){
    var _eventList=[];
    for (var i = 0; i < customerList.length; i++) {
        var obj1 = customerList[i];
        var _p={};
        _p.accountId = session.user.account;
        _p._id = obj1._id;
        _p.uid=session.user._id;
        _p.status = obj1.status;
        _p.oldStatus = obj1.status;
        _p.owner = obj1.owner;
        _p.oldOwner = obj1.owner;
        _p.categoryId = obj1.categoryId;
        _p.oldCategoryId = obj1.categoryId;
        _p.tType = "del";
        _p.content = "";
        _eventList.push(_p);
    }
    appEvent.emitCustomerReportEventList(appEvent.EventType.CUST_DEL,_eventList);
}

exports.delCustQuery2In = function(data,session,callback){
    var result = {success:false};
    var time=utils.getCurrentDate();
    var uid=session.user._id;
    var aid=session.user.account;
    var batchMaxNum = 10000;
    var query=data;

   thenjs(function(cont){
       var queryJson=JSON.stringify(data);
       queryJson=queryJson.replace(/&/gm, "amp;");
       setQueryPageCondition2In(data,session);
       cont(null,query);
   }).then(function(cont,query){
       if(data.combox||data.name){
           solrHandler.queryIndex2Cust(data,session,function(rep){
               if(rep.success){
                   delete data.combox;
                   delete data.name;
                   var ids=rep.ids;
                   data._id={$in:ids};
                   cont(null,query);
               }else{
                   logger.app.error("query solr index error");
                   callback(result);
               }
           });
       }else{
           cont(null,query);
       }
   }).then(function(cont,query){
       var safeDel=session.account.safeDel||"0";
       console.info("delCustQuery2In safeDel==="+safeDel);
       mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(data,{sort:{createTime:-1},limit: batchMaxNum,fields:{owner:1,status:1,name:1,phone:1,createTime:1,lastUpdateTime:1,dbType:1,batchNo:1,custsource1:1,actionType:1,account:1,categoryId:1}}).toArray(function (err, docs) {
           if (!err) {
               var list=docs||[];
               var total=list.length;
               var oldOwnerNum={};
               var custIds=[];
               for(var i=0;i<list.length;i++){
                   var doc = list[i];
                   custIds.push(doc._id);
                   if(!oldOwnerNum[doc.owner]){
                       oldOwnerNum[doc.owner]={num:1,custIds:[doc._id]};
                   }else{
                       oldOwnerNum[doc.owner].num++;
                       oldOwnerNum[doc.owner].custIds.push(doc._id);
                   }
               }
               var idxData={
                   ids :custIds
               }
               //if(total>10000){
               //    var url = config.ccServiceUrl+'?Action=deleteCustomer&Method=customer&account='+aid+"&safeDel="+safeDel+'&query='+queryJson+'&uid='+uid;
               //    url=encodeURI(url);
               //    http.sendGet(url,function(err,res){
               //        if(!err && res){
               //            try{
               //                //console.dir(res);
               //                var res = JSON.parse(res);
               //                if(res.Succeed){
               //                    solrHandler.deleteIndex2Cust(idxData,function(){});
               //                    result.success = true;
               //                    callback(result);
               //                    //callback(res);
               //                }else{
               //                    callback(result);
               //                }
               //            }catch (e) {
               //                logger.request.error(e);
               //                callback(e);
               //            }
               //        }else{
               //            var error = err || new Error('request deleteCustomer error!');
               //            logger.request.error(error);
               //            callback(error);
               //        }
               //    });
               //}else{
                   var q0={_id:{$in:custIds}};
                   if(safeDel=="1"){
                       for (var i = 0; i < list.length; i++) {
                           var obj = list[i];
                           //obj.account=aid;
                           obj.dtime=utils.getCurrentDate();
                       }
                       var len=list.length;
                       var total=Math.ceil(len/1000);
                       var last=len%1000;
                       var bakIdx=0;
                       //console.info("total=="+total+",last===="+last);
                       var backup=function(){
                           if(bakIdx<total){
                               var start=bakIdx*1000;
                               var end=start+1000;
                               if(bakIdx==total-1 && last>0){
                                   end = start+last;
                               }
                               var subList=[];
                               for (var i = start; i < end; i++) {
                                   subList.push(list[i]);
                               }
                               //console.dir(subList)
                               mongo.db("cc").collection("app_customer_delstore").insert(subList,function(err){
                                   if(!err){
                                       bakIdx++;
                                       backup();
                                   }else{
                                       logger.app.error(err);
                                       callback(result);
                                   }
                               })
                           }else{
                               console.info("backup end");
                               mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).remove(q0, function(err){
                                   if(!err){
                                       emitDelCustEvent(list,session);
                                       solrHandler.deleteIndex2Cust(idxData,function(){});
                                       var q1={customerId:{$in:custIds}};
                                       mongo.db().collection(fields.DB_APP_NOTE).remove(q1, function (err) {
                                           if (err) {
                                               logger.app.error(err);
                                           }
                                       });
                                       mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).remove(q1, function(err){
                                           if (err) {
                                               logger.app.error(err);
                                           }
                                       });
                                       //result.success = true;
                                       //callback(result);
                                   }else{
                                       logger.app.error('delCustQuery error:' + err);
                                       result.message = 'delCustQuery error!';
                                       callback(result);
                                   }
                               });
                           }
                       }
                       backup();

                       result.success = true;
                       callback(result);
                   }else{
                       mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).remove(q0, function(err){
                           if(!err){
                               emitDelCustEvent(list,session);
                               solrHandler.deleteIndex2Cust(idxData,function(){});

                               var q1={customerId:{$in:custIds}};
                               mongo.db().collection(fields.DB_APP_NOTE).remove(q1, function (err) {
                                   if (err) {
                                       logger.app.error(err);
                                   }
                               });
                               mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).remove(q1, function(err){
                                   if (err) {
                                       logger.app.error(err);
                                   }
                               });
                               result.success = true;
                               callback(result);
                           }else{
                               logger.app.error('delCustQuery error:' + err);
                               result.message = 'delCustQuery error!';
                               callback(result);
                           }
                       });
                   }
               //}

               if(total >= batchMaxNum){
                   exports.recordLog({type:"batchDelete",memo:"删除"+batchMaxNum+"条,safeDel:"+safeDel},session);
               }else{
                   exports.recordLog({type:"batchDelete",memo:"删除"+total+"条,safeDel:"+safeDel},session);
               }
           }else{
               logger.app.error('delCustQuery error:' + err);
               result.message = 'delCustQuery error!';
               callback(result);
           }
       });
   }).fail(function(cont,err){
       //console.log(err);
       logger.app.error(err);
       callback(result);
   })

}


var emitCustUpdateEvent=function(eventList,newOwner,userMap,type,session){
    var oldName = "";
    var name = "";
    var _eventList=[];
    for (var i = 0; i < eventList.length; i++) {
        var obj = eventList[i];
        if(obj.owner==newOwner) continue;
        var _p={};
        _p._id = obj._id;
        _p.accountId = session.account.account;
        _p.oldOwner=obj.owner;
        _p.owner=newOwner;
        _p.uid=session.user._id;
        _p.oldStatus  = obj.status;
        _p.status = obj.status;
        _p.tType=type;
        _p.oldCategoryId = obj.categoryId;
        _p.categoryId = obj.categoryId;

        if(type=="assign"){
            oldName=userMap[_p.oldOwner]||"无归属";
            name =userMap[_p.owner]||"无归属";
            _p.content = "客户归属从【"+oldName+"】变更为【"+name+"】";
        }else if(type=="clearOwner"){
            oldName = userMap[_p.oldOwner]||"无归属";
            _p.content = "客户归属从【"+oldName+"】变更为【无归属】";
        }
        _eventList.push(_p);
    }
    appEvent.emitCustomerReportEventList(appEvent.EventType.CUST_UPDATE_OWNER,_eventList);
}

exports.saveCustAssign2In = function (data,session,callback){
    var result = {success:false};
    var total=data.total;
    var maxNum = 10000; //maxNum超过1W就不再执行
    if(total > maxNum){
        result.maxNum = true;
    }
    var owners=data.owners;
    var query=data.query;
    thenjs(function(cont){
        setQueryPageCondition2In(query,session);
        cont(null,query);
    }).then(function(cont,query){
        if(query.combox||query.name){
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    query._id={$in:ids};
                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){
        var timeStamp=utils.DateTime.getCurrentTimestamp();
        var account=session.user.account;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1},limit: maxNum,fields:{owner:1,status:1,sysStatus:1,categoryId:1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var ids=[];
                    var ids1 = [];
                    var skip=0;
                    var oldOwnerNum={};
                    var calcNum = 0;
                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: account, product:'cc'},{sort: {exten: 1},fields:{displayName:1}}).toArray(function (err, uList) {
                        if(!err){
                            var uMap={};
                            uList.forEach(function(obj){
                                uMap[obj._id]=obj.displayName;
                            })

                            for(var i=0;i<owners.length;i++){
                                var count=owners[i].count;

                                //if(calcNum >= maxNum){ //如果累加值已经大于等于1W,直接跳出循环
                                //    result.maxNum = true;
                                //}else if(count >= maxNum){ //如果第一个客户直接分配了大于等于1W的数据则只添加1W条
                                //    count = maxNum;
                                //}else if((calcNum + count) > maxNum){ //如果累加值加上当前数量大于1W,只增加少于1W的部分,使总数等于1W
                                //    count = count - ((calcNum + count) - maxNum);
                                //}
                                //calcNum += count;

                                var owner= owners[i].owner;
                                var eventList=[];
                                for (var j = skip; j < skip+count; j++) {
                                    var doc = docs[j];
                                    var sysStatus = doc.sysStatus;
                                    if(sysStatus=="2"||sysStatus=="4"){
                                        ids1.push(doc._id);
                                    }else{
                                        ids.push(doc._id);
                                    }
                                    if(!oldOwnerNum[doc.owner]){
                                        oldOwnerNum[doc.owner]={num:1,custIds:[doc._id]};
                                    }else{
                                        oldOwnerNum[doc.owner].num++;
                                        oldOwnerNum[doc.owner].custIds.push(doc._id);
                                    }
                                    eventList.push(doc);
                                }

                                updateOwner(owner,ids,ids1,session,count,timeStamp);
                                emitCustUpdateEvent(eventList,owner,uMap,"assign",session);
                                ids=[];
                                skip+=count;
                            }

                            emitBatchAssignAgentNotify(owners,oldOwnerNum,session);
                        }else {
                            logger.app.error(err);
                            callback({success: false, list: [], count: 0});
                        }
                    });
                    result.success = true;
                    if(total >= maxNum){
                        exports.recordLog({type:'assign',memo:"分配"+maxNum+"条"},session);
                    }else{
                        exports.recordLog({type:'assign',memo:"分配"+total+"条"},session);
                    }
                }else{
                    logger.app.error('saveCustAssign data is change');
                    result.code = '1001';
                }
                callback(result);
            }else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })
}
exports.delCustOwner2In = function(data,session,callback){
//    setQueryPageCondition(data);
//    utils.setUserLevelCondition(data,'owner',session);
    setQueryPageCondition2In(data,session);
    //utils.setUserLevelCondition(data,'owner',session,true);
    var result = {success:false};
    var account=session.user.account;
    var _delOwnerFun=function(){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(data, {sort:{createTime:-1},fields:{owner:1,status:1}}).toArray(function (err, docs) {
            if (!err) {
                var list=docs||[];
                //var oldOwnerNum={};
                //for(var i=0;i<list.length;i++){
                //    var doc = list[i];
                //    if(!oldOwnerNum[doc.owner]){
                //        oldOwnerNum[doc.owner]={num:1,custIds:[doc._id]};
                //    }else{
                //        oldOwnerNum[doc.owner].num++;
                //        oldOwnerNum[doc.owner].custIds.push(doc._id);
                //    }
                //}
                var time=utils.getCurrentDate() ;
                var uid=session.user._id;
                var updateSet={
                    lastUpdateTime:time,
                    lastUpdater:uid,
                    owner:""
                }
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(data,{$set:updateSet},{multi: true}, function(err2){
                    if(!err2){
                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: account, product:'cc'},{sort: {exten: 1},fields:{displayName:1}}).toArray(function (err, uList) {
                            if(!err){
                                var uMap={};
                                uList.forEach(function(obj){
                                    uMap[obj._id]=obj.displayName;
                                })
                                emitCustUpdateEvent(list,"",uMap,"clearOwner",session);

                                exports.recordLog({type:'clearOwner',memo:"清空"+list.length+"条"},session);
                                result.success=true;
                                callback(result);
                            }else {
                                logger.app.error('delCustOwner error:' + err.stack);
                                result.message = 'delCustOwner error!';
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error('delCustOwner error:' + err2.stack);
                        result.message = 'delCustOwner error!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error('delCustOwner error:' + err.stack);
                result.message = 'delCustOwner error!';
                callback(result);
            }
        });
    }
    if(data.combox||data.name){
        solrHandler.queryIndex2Cust(data,session,function(rep){
            if(rep.success){
                delete data.combox;
                delete data.name;
                var ids=rep.ids;
                data._id={$in:ids};
                _delOwnerFun();
            }else{
                logger.app.error("query solr index error");
                callback(result);
            }
        });
    }else{
        _delOwnerFun();
    }
}
var emitCustUpdateStatusEvent=function(eventList,status,session){
    var account = session.account.account;
    mongo.db().collection(fields.DB_CUSTOMER_TEMPLATE).findOne({account:account},{fields:{status:1,source:1}},function(err,tempL) {
        if(!err){
            var _eventList=[];
            for (var i = 0; i < eventList.length; i++) {
                var obj = eventList[i];
                if(obj.status==status) continue;
                var oldName = "";
                var name = "";
                var _p = {};
                _p._id = obj._id;
                _p.accountId = account;
                _p.oldStatus = obj.status;
                _p.status = status;
                _p.uid=session.user._id;
                _p.oldOwner = obj.owner;
                _p.owner = obj.owner;
                _p.tType="batchUpdateStatus";
                _p.categoryId = obj.categoryId;
                _p.oldCategoryId = obj.categoryId;
                var _tmpl=tempL.status||{};
                oldName = _tmpl[_p.oldStatus];
                name = _tmpl[_p.status];
                _p.content = "状态从【"+oldName+"】变更为【"+name+"】";
                _eventList.push(_p);
            }
            appEvent.emitCustomerReportEventList(appEvent.EventType.CUST_UPDATE_STATUS, _eventList);
        }
    });

}

exports.batchUpdateStatus2In = function(data,session,callback){
    var result = {success:false};
    var total=data.total;
    var status=data.status;
    var query=data.query;
    thenjs(function(cont){
        setQueryPageCondition2In(query,session);
        cont(null,query);
    }).then(function(cont,query){
        if(query.combox||query.name){
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    query._id={$in:ids};
                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback(result);
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){

        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1},fields:{owner:1,status:1,categoryId:1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var list=docs||[];
                    //var oldOwnerNum={};
                    //for(var i=0;i<list.length;i++){
                    //    var doc = list[i];
                    //    if(!oldOwnerNum[doc.owner]){
                    //        oldOwnerNum[doc.owner]={num:1,custIds:[doc._id]};
                    //    }else{
                    //        oldOwnerNum[doc.owner].num++;
                    //        oldOwnerNum[doc.owner].custIds.push(doc._id);
                    //    }
                    //}
                    var time=utils.getCurrentDate();
                    var uid=session.user._id;
                    var updateSet={
                        lastUpdateTime:time,
                        lastUpdater:uid,
                        status:data.status
                    }
                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:updateSet},{multi: true},function(err2){
                        if(!err2){
                            emitCustUpdateStatusEvent(list,data.status,session);
                            exports.recordLog({type:'batchUpdateStatus',memo:"修改状态"+total+"条"},session);
                            result.success=true;
                            callback(result);
                        } else {
                            logger.app.error('batchUpdateStatus error:' + err2.stack);
                            result.message = 'batchUpdateStatus error!';
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error('batchUpdateStatus data is change');
                    result.code = '1001';
                    callback(result);
                }
            }else{
                logger.app.error('batchUpdateStatus error:' + err.stack);
                result.message = 'batchUpdateStatus error!';
                callback(result);
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })


}

/**
 * 更新客户号码的归属地
 * @param data
 * @param session
 * @param flag
 */
exports.locationTelArea = function (data, session) {
    var _id=data._id;
    var tels=data.phone||[];
    //console.dir(tels)
    if(tels.length==0){
        return;
    }
    tels.forEach(function(obj){
        if(!obj.area){
            var _param={_id:_id,tel:obj.tel}
            exports.updateTelArea(_param,session,function(){});
        }
    })
}

exports.updateTelArea = function (data, session,callback) {
    var result = {success: false};
    //var time=utils.getCurrentDate() ;
    //var uid=session.user._id;
    //data.lastUpdateTime=time;
    //data.lastUpdater=uid;

    var tel=data.tel;
    var clearReg=/[^\d]*/g;
    var tel2=tel.replace(clearReg,"");
    //console.info("updateTelArea:::tel2======"+tel2);

    var query={_id:data._id,"phone.tel":tel};
    var mobile=/1[3,4,5,7,8][0-9]{9}/;
    var prefix="";

    var updateCustomerArea=function(area){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:{'phone.$.area':area}},function(err){
            if(!err){
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }
    if(mobile.test(tel2)){
        prefix=tel2.substring(0,7);
        var json={prefix:prefix};

        var url = config.yyBillUrl+'?action=service.getMobileCodeInfo&data='+JSON.stringify(json);
        url=encodeURI(url);
        http.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.success){
                        res.success = true;
                        res.data=res.data||{};
                        var province=res.data.province;
                        var city=res.data.city;
                        var area=province+city;
                        if(city==province){
                            area=province;
                        }
                        updateCustomerArea(area);
                        callback(res);
                    }else{
                        callback(res);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request getMobileCodeInfo error!');
                logger.request.error(error);
                callback(error);
            }
        });
    }else{
        var area3=['010','020','021','023','024','025','027','028','029'];
        var _area=area3.join("-");

        if(_area.indexOf(tel2.substring(0,3))!=-1){
            prefix=tel2.substring(0,3);
        }else{
            prefix=tel2.substring(0,4);
        }
        var reg=new RegExp("^"+prefix);
        mongo.db("bill").collection("tbl_city").findOne({_id: reg}, function (err, city) {
            if(!err && city){
                mongo.db("bill").collection("tbl_province").findOne({_id: city.pid}, function (err, province) {
                    if(!err && province){
                        var area=province.n+city.n;
                        if(city.n==province.n){
                            area=province.n;
                        }
                        updateCustomerArea(area);
                    }else{
                        logger.request.error(err);
                        callback(err);
                    }
                })
            }else{
                logger.request.error(err);
                callback(err);
            }
        })
    }
}

exports.recordLog = function (data,session) {
    var time=utils.getCurrentDate();
    var aid=session.user.account;
    var uid=session.user._id;
    //var id=utils.UUID.generateUuid();
    var _set={
        aid:aid,
        uid:uid,
        time:time,
        type:data.type,
        memo:data.memo
    }
    mongo.db().collection("customer_operater_log").insert(_set,function(err){
        if(err){
            logger.app.error(err);
        }
    });
}

exports.upCustomerLastContactTime = function(data,session,callback){
    var now = utils.DateTime.getCurrentDateTime();
    var setData = {
        lastContactTime:now,
        isAssign:false
    };
        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id:data.customer},{$set:setData},function(err){
            if(!err){
                callback(err);
            }
        });

}

exports.addQuickSearch = function(data,session,callback){
    var result = {success:false};
    data._id = utils.UUID.generateUuid();
    data.createTime = utils.getCurrentDate();
    data.account = session.user.account;
    data.createUser = session.user._id;
    var query = data.query;
    utils.removeEmptyProperty(query);
    if(query["phone.tel"]){
        query.phone=query["phone.tel"];
        delete query["phone.tel"];
    }

    var q = {account:data.account,kName:data.kName,createUser:session.user._id};
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).findOne(q,function(err,qSearch){
        if(!err&&!qSearch){
            mongo.db().collection(fields.DB_APP_QUICK_SEARCH).insert(data,{w:1},function(err){
                if(!err){
                    result.success = true;
                    result.data = data;
                    callback(result);
                }
            })
        }else{
            result.message = '自定义快捷搜索名称已存在，请重新输入!';
            callback(result);
        }
    })
}

exports.upQuickSearch = function(data,session,callback){
    var result = {success:false};
    var kId = data.kId;
    delete data['kId'];
    var q = {_id:kId};
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).count(q,function(err,count){
       if(!err&&count>0){
           mongo.db().collection(fields.DB_APP_QUICK_SEARCH).update(q,{$set:data},function(err){
               if(!err){
                   result.success = true;
                   mongo.db().collection(fields.DB_APP_QUICK_SEARCH).findOne(q,function(err,qSearch){
                       if(!err&&qSearch){
                           result.data = qSearch;
                           callback(result);
                       }else{
                           logger.app.error('upQuickSearch error:'+err);
                           callback(result);
                       }
                   });
               }else{
                   logger.app.error('upQuickSearch error:'+err);
                   callback(result);
               }
           });
       }else{
           logger.app.error('upQuickSearch error:'+err);
           callback(result);
       }
    });
}

exports.queryQuickSearchTmpl = function(session,callback){
    var result = {success:false};
    var uid = session.user._id;
    var account = session.account.account;
    var query = {account:account,createUser:uid};
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).find(query,{sort:{createTime:1}}).toArray(function(err,qsList){
        if(!err){
            result.success = true;
            callback(null, qsList || []);
        }else{
            logger.app.error('queryQuickSearchTmpl error:'+err);
            callback(err);
        }
    });
}

exports.queryQuickSearchById = function(data,session,callback){
    var result = {success:false};
    var id = data._id;
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).findOne({_id:id},function(err,qSearch){
       if(!err&&qSearch){
           result.data = qSearch;
           result.success =true;
           callback(result);
       }else{
           logger.app.error('queryQuickSearchById error:'+err);
           callback(result);
       }
    });
}

exports.queryQuickSearch = function(data,session,callback){
    var result = {success:false};
    var page = data.page|| 1;
    delete data['page'];
    var limit = data.limit || 10;
    delete data['limit'];
    var skip = (page - 1) * limit;
    var uid = session.user._id;
    var query = {"account":session.user.account,createUser:uid};
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).find(query,{sort: {createTime:-1}, limit: limit, skip: skip}).toArray(function(err,qSearchList){
        if(!err){
            var list = qSearchList || [];
            mongo.db().collection(fields.DB_APP_QUICK_SEARCH).count(query, function (err, count) {
                if(!err){
                    result.count = count;
                    result.list = list;
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error('queryQuickSearch error:' + err);
                    callback(result);
                }
            });
        }else{
            logger.app.error('queryQuickSearch error:' + err);
            callback(result) ;
        }
    });
}
//撞单查询
exports.queryHitSingleSearch = function(data,session,callback){
    var result = {success:false};
    var page = data.page|| 1;
    delete data['page'];
    var limit = data.limit || 10;
    delete data['limit'];
    var skip = (page - 1) * limit;
    var query = data||{};
    thenjs(function(cont){
        if(query.combox||query.name){
            var notify=false;
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    notify=rep.notify;
                    query._id={$in:ids};
                    result.notify = notify;
                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1},limit: limit, skip: skip,fields:{name:1,owner:1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })
}

exports.deleteQuickSearch = function(data,session,callback){
    var result = {success:false};
    var query = {_id:data.kId};
    mongo.db().collection(fields.DB_APP_QUICK_SEARCH).findOne(query,function(err,qSearch){
        if(!err&&qSearch){
            mongo.db().collection(fields.DB_APP_QUICK_SEARCH).remove(query,function(err){
                if(!err){
                    result.success  = true;
                    callback(result);
                }else{
                    logger.app.error('deleteQuickSearch error:' + err);
                    callback(result);
                }
            });
        }else{
            logger.app.error('deleteQuickSearch error:' + err);
            callback(result);
        }
    });
}

//查询客户导出列表
exports.queryExportTaskSearch = function(data,session,callback){
    var result = {success:false};
    var page = data.page|| 1;
    delete data['page'];
    var limit = data.limit || 10;
    delete data['limit'];
    var skip = (page - 1) * limit;
    var uid = session.user._id;
    var query = {"accountId":session.user.account,type:"customer",creator:session.user._id};
    mongo.db().collection(fields.DB_APP_EXPORT_TASK).find(query,{sort: {createTime:-1}, limit: limit, skip: skip}).toArray(function(err,qTaskList){
        if(!err){
            var list = qTaskList || [];
            mongo.db().collection(fields.DB_APP_EXPORT_TASK).count(query, function (err, count) {
                if(!err){
                    result.count = count;
                    result.list = list;
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error('queryExportTaskSearch error:' + err);
                    callback(result);
                }
            });
        }else{
            logger.app.error('queryExportTaskSearch error:' + err);
            callback(result) ;
        }
    });
}

var emitCustomerbatchUpDateCatory = function(data,docs,session){
    var uid = session.user._id;
    var account = session.user.account;
    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({account:account,managers:uid},{sort: {category: 1},fields:{cName:1}}).toArray(function(err,poolList){
        if(!err&&poolList){
            var poolMap={};
            var poolId = "NA";
            var category = "";
            poolList.forEach(function(obj){
                poolMap[obj._id]=obj.cName;
                if(obj._id == data.categoryId){
                    poolId = obj._id;
                    category = obj.category;
                }
            });
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account:account},{fields:{displayName:1}}).toArray(function (err, uList) {
                if(!err&&uList){
                    var nameMap = {};
                    uList.forEach(function(obj){
                        nameMap[obj._id]=obj.displayName;
                    });
                    var _eventList=[];
                    var _seaEventList = [];

                    var notifyMap = {};

                    for(var i = 0;i<docs.length;i++){
                        var doc = docs[i];
                        var _p = {};
                        _p._id = doc._id;
                        _p.accountId = account;
                        _p.tType ="changePool";
                        _p.uid=uid;
                        _p.oldOwner = doc.owner;
                        _p.oldCategoryId = doc.categoryId;
                        _p.categoryId = data.categoryId;
                        _p.oldStatus = doc.status;
                        _p.status = doc.status;
                        _p.owner = data.categoryId;
                        if(category=="4"){
                            var p = {};
                            p._id = doc._id;
                            p.accountId = account;
                            p.owner = data.categoryId;
                            _seaEventList.push(p);
                        }
                        //生成推送数据
                        generateNotifyMap(doc,notifyMap,poolId);
                        if(_p.oldOwner!=_p.owner){
                        if(_p.oldOwner!=_p.oldCategoryId){
                            var oldName = nameMap[_p.oldOwner] ||"无归属";
                            var pName = poolMap[_p.categoryId]||"无归属";
                            _p.content = "客户归属从【"+oldName+"】转移为【"+pName+"】";
                            _eventList.push(_p);
                        }else{
                            var oldPname = poolMap[_p.oldCategoryId]||"无归属";
                            var pName = poolMap[_p.categoryId]||"无归属";
                            _p.content = "客户归属从【"+oldPname+"】转移为【"+pName+"】";
                            _eventList.push(_p);
                        }
                        }
                    }

                    //插入到notify表
                    if(!isEmpty(notifyMap)){
                        var bulkWrite =[];
                        for(var item in notifyMap){
                            var notify = notifyMap[item];
                            var notifyInfo = {
                                _id:utils.UUID.generateUuid(),
                                cid:uid,
                                poolId:poolId,
                                uid:item,
                                custCount:notify.custIds.length,
                                type:"batchUpdateOwner"
                            }
                            var query = { insertOne : notifyInfo};
                            bulkWrite.push(query);
                        }
                        mongo.db().collection(fields.DB_APP_NOTIFY).bulkWrite(bulkWrite,function(err) {
                            if (err)  {
                                logger.app.error('db notify error:' + err.stack);
                            }
                        });
                    }
                    //
                    appEvent.emitCustomerReportEventList(appEvent.EventType.CUST_UPDATE_CATEGORY,_eventList);
                    appEvent.emitCustomerAutoSeaEventList(_seaEventList);


                }
            });
        }
    });

};

exports.batchUpdateCustomerCategory = function(data,session,callback){
    var result = {success:false};
    var total=data.total;
    var categoryId = data.categoryId;
    var query=data.query;
    thenjs(function(cont){
        setQueryPageCondition2In(query,session);
        cont(null,query);
    }).then(function(cont,query){
        if(query.combox||query.name){
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    query._id={$in:ids};

                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback(result);
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){
        var account=session.user.account;
        mongo.db(session).collection(account+fields.DB_C5_CUSTOMER).find(query,{sort:{createTime:-1},fields:{owner:1,categoryId:1,name:1,status:1,sysStatus:1}}).toArray(function (err,docs) {
            if (!err&&docs) {
                if(total == docs.length){
                    var isCheck = true;
                    for(var i=0;i<docs.length;i++){
                        var doc = docs[i];
                        var sysStatus = doc.sysStatus;
                        if(sysStatus=="5"||sysStatus=="6"||sysStatus=="7"||sysStatus=="8"){
                            isCheck = false;
                            break;
                        }
                    }
                    if(isCheck) {
                        var updateSet = {};
                        var time = utils.getCurrentDate();
                        var uid = session.user._id;
                        if (categoryId == "NA") {
                            updateSet = {
                                lastUpdateTime: time,
                                lastUpdater: uid,
                                categoryId: "NA",
                                owner: "NA"
                            };
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update(query, {$set: updateSet}, {multi: true}, function (err2) {
                                if (!err2) {
                                    result.success = true;
                                    emitCustomerbatchUpDateCatory(data, docs, session);
                                    callback(result);
                                } else {
                                    logger.app.error('batchUpdateCustomerCategory error:' + err2.stack);
                                    result.message = 'batchUpdateCustomerCategory error!';
                                    callback(result);
                                }
                            });
                        } else {
                            updateSet = {
                                lastUpdateTime: time,
                                lastUpdater: uid,
                                categoryId: categoryId,
                                owner: categoryId,
                                sysStatus: "0",

                            };
                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id: categoryId}, function (err, pool) {
                                if (!err) {
                                    var managers = pool.managers;
                                    if (managers.indexOf(uid) != -1) {
                                        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update(query, {$set: updateSet}, {multi: true}, function (err2) {
                                            if (!err2) {
                                                result.success = true;
                                                emitCustomerbatchUpDateCatory(data, docs, session);
                                                callback(result);
                                            } else {
                                                logger.app.error('batchUpdateCustomerCategory error:' + err2.stack);
                                                result.message = 'batchUpdateCustomerCategory error!';
                                                callback(result);
                                            }
                                        });
                                    } else {
                                        result.code = "1002";
                                        callback(result);
                                    }
                                } else {
                                    logger.app.error('batchUpdateCustomerCategory error:' + err.stack);
                                    callback(result);
                                }
                            });
                        }
                    }else{
                        result.code="1005";
                        result.message = "The customer is in the state of being audited";
                        callback(result);
                    }
                }else{
                    logger.app.error('batchUpdateCustomerCategory data is change');
                    result.code = '1001';
                    callback(result);
                }
            }else{
                logger.app.error('batchUpdateCustomerCategory error:' + err.stack);
                result.message = 'batchUpdateCustomerCategory error!';
                callback(result);
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })

}

//取消联系计划
exports.cancelPlanning = function(data,session,callback){
    var result = {success:false};
    var total=data.total;
    var query=data.query;
    thenjs(function(cont){
        setQueryPageCondition2In(query,session);
        cont(null,query);
    }).then(function(cont,query){
        if(query.combox||query.name){
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    query._id={$in:ids};
                    cont(null,query);
                }else{
                    logger.app.error("query solr index error");
                    callback(result);
                }
            });
        }else{
            cont(null,query);
        }
    }).then(function(cont,query){
        var account=session.user.account;
        var time = utils.getCurrentDate();
        var uid = session.user._id;
        mongo.db(session).collection(account+fields.DB_C5_CUSTOMER).distinct("_id",query,function (err,docs) {
            if (!err) {
                if(docs){
                    if(total == docs.length){
                        var q1 = {"customerId":{"$in":docs},"status":"0"};
                        var up={status:"99",lastUpdateTime:time};
                        mongo.db().collection(fields.DB_APP_NOTE).update(q1,{"$set":up},{multi:true},function(err1){
                            if(!err1){
                                var updateSet = {
                                    lastUpdateTime: time,
                                    lastUpdater: uid,
                                    actionType: fields.ACTION_NA,
                                    actionId: "",
                                    action:"",
                                    notifyTime:"",
                                    actionUser:""
                                };
                                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update(query, {$set: updateSet}, {multi: true}, function (err2) {
                                    if (!err2) {
                                        var q = {"customer":{"$in":docs},"status":"create","type":"note"};
                                        var upSet = {
                                            status:"cancel",
                                            dispose:"取消计划",
                                            lastUpdateTime: time
                                           };
                                        mongo.db(session).collection(session.user.account+fields.DB_HISTORY).update(q,{$set:upSet},{multi:true},function(err3){
                                            if(!err3){
                                                result.success = true;
                                                callback(result);
                                            }else{
                                                logger.app.error('cancelPlanning error:' + err2.stack);
                                                result.message = 'cancelPlanning error!';
                                                callback(result);
                                            }
                                        })
                                    } else {
                                        logger.app.error('cancelPlanning error:' + err2.stack);
                                        result.message = 'cancelPlanning error!';
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error('cancelPlanning error:' + err2.stack);
                                result.message = 'cancelPlanning error!';
                                callback(result);
                            }
                        })
                    }else{
                        logger.app.error('cancelPlanning data is change');
                        result.code = '1001';
                        callback(result);
                    }
                }else{
                    logger.app.error('cancelPlanning error:' + err.stack);
                    result.message = 'cancelPlanning error!';
                    callback(result);
                }
            }else{
                logger.app.error('cancelPlanning error:' + err.stack);
                result.message = 'cancelPlanning error!';
                callback(result);
            }
        });
    }).fail(function(cont,err){
        //console.log(err);
        logger.app.error(err);
        callback(result);
    })
}

exports.queryCustCategorysDic =function(session,callback){
    var result = {success:false};
    var uid = session.user._id;
    var account = session.user.account;
    var query = {account:account};
    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find(query,{sort:{category:1}}).toArray(function(err,list){
        if(!err){
            result.success = true;
            callback(null, list || []);
        }else{
            logger.app.error('queryCustCategorysDic error:'+err);
            callback(err);
        }
    })
}


exports.querySalesStatistics =function(data,session,callback){
    var result = {success:false};
    var keys = {"user":1};
    var condition = {"user":session.user._id};
    if(data.timeType == "year"){
        condition.year = data.yearReport;
    }else if(data.timeType == "month"){
        condition.month = data.yearReport+data.monthReport;
    }else if(data.timeType == "day"){
        condition.day = data.yearReport+data.monthReport+data.dayReport;
    }else if(data.timeType == "other"){
        if(data.StartTime && data.EndTime){
            var queryStarTimeDay = data.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            var queryEndTimeDay = data.EndTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$gte":queryStarTimeDay,"$lte":queryEndTimeDay};
        }else if(data.StartTime){
            var queryStarTimeDay = data.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$gte":queryStarTimeDay};
        }else if(data.EndTime){
            var queryEndTimeDay = data.StartTime.substring(0,10).replace(new RegExp(/-/g),'');
            condition.day = {"$lte":queryEndTimeDay};
        }

    }
    var reduce = function ( curr, result ) {
        result.total += curr.total||0;
        result.deal += curr.deal||0;
        result.money += curr.money||0;
        result.lost += curr.lost||0;
        result.invalid += curr.invalid||0;
    };
    var initial =  { total:0,deal:0,money:0,lost:0,invalid:0};
    mongo.reportDb().collection(fields.CC_CUSTOMER_SALES_REPORT).group(keys, condition, initial, reduce ,function(err,docs){
        if(!err){
            if(docs.length == 0){
                var sales = {total:0,deal:0,money:0,lost:0,invalid:0};
                result.sales = sales;
            }else{
                result.sales = docs[0];
            }
            result.success = true;
            callback(result);
        }else{
            logger.app.error('queryCustCategorysDic error:'+err);
            result.message = "queryCustCategorysDic error";
            callback(err);
        }
    });
}
/**
 * 是否是公海的管理员
 * @param data
 * @param session
 * @param callback
 */
var checkIsManager2Sea = function(data,session,callback){
    var result = {success: false};
    var uid = session.user._id;
    var owner=data.owner;
    var categoryId=data.categoryId;
/*    if(!owner){//其他操作（修改状态或来源等）
        result.success = true;
        callback(result);
        return;
    }*/
    if(categoryId!=noForOwner && owner==categoryId){//改为公海
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id:categoryId,managers:uid},function(err,doc){
            if(!err){
                if(doc){
                    result.currentSea=doc;
                    result.success=true;
                    callback(result);
                }else{
                    result.message="没有此公海的权限！";
                    callback(result);
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }else{
        result.success = true;
        callback(result);
    }
}
/**
 *
 * 放入公海，跟进状态重置为默认
 * 公海改为所属人，算作分配
 * @param data
 * @param oldCust
 * @param session
 * @param callback
 */
var resetCustInfo2Sea = function(data,oldCust,session){
    //var result = {success:false};
    var owner=data.owner;
    var categoryId=data.categoryId;
    var oldOwner=oldCust.owner;
    if(owner!=oldOwner) {
        if(categoryId!=noForOwner && owner==categoryId){
            data.sysStatus = '0';
        }else if(categoryId!=noForOwner && owner!=categoryId){//算分配
        }
    }
}

var generateNotifyMap = function(customer,notifyMap,poolId){
    if(customer.owner != "NA" ){
        if(!notifyMap[customer.owner]){
            notifyMap[customer.owner] = {"uid":customer.owner,"poolId":poolId,"custIds":[customer._id]};
        }else{
            notifyMap[customer.owner].custIds.push(customer._id);
        }
    }
}
var isEmpty = function (obj) {
    for (var name in obj)
    {
        return false;
    }
    return true;
};
/**
 * 归属变化的提醒
 * @param data
 * @param oldCust
 * @param currentSea
 * @param session
 */
var emitAgentNotify = function(data,oldCust,currentSea,session){
    var cid=oldCust._id;
    var aid=session.user.account;
    var currentUid=session.user._id;
    var owner=data.owner;
    var categoryId=data.categoryId;
    var oldOwner=oldCust.owner;
    var oldCategoryId=oldCust.categoryId;
    console.info("emitAgentNotify=====");

    if(owner!=oldOwner && owner!=currentUid) {//归属改变，且不是改为自己
        if(oldOwner!=oldCategoryId){//未改之前有所属人
            if(owner==categoryId && currentSea){//公海
                var notifyInfo = {
                    type:"updateOwner",
                    cid:cid,
                    account:aid,
                    uid:oldOwner,
                    categoryId:categoryId
                }
                mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                    if(err){
                        logger.app.error('db insert app_notify error:' + err);
                    }
                });
            }else if(owner==noForOwner){//无归属
                var notifyInfo = {
                    type:"updateOwner",
                    cid:cid,
                    account:aid,
                    uid:oldOwner,
                    categoryId:categoryId
                }
                mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                    if(err){
                        logger.app.error('db insert app_notify error:' + err);
                    }
                });
            }else if(owner!=categoryId){//其他座席
                var notifyInfo = {
                    type:"assignOut",//分配出去
                    cid:cid,
                    account:aid,
                    uid:oldOwner,
                    categoryId:categoryId
                }
                mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                    if(err){
                        logger.app.error('db insert app_notify error:' + err);
                    }
                });

                var notifyInfo = {
                    type:"assign",//分配
                    cid:cid,
                    account:aid,
                    uid:owner,
                    categoryId:categoryId
                }
                mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                    if(err){
                        logger.app.error('db insert app_notify error:' + err);
                    }
                });
            }
        }else{
            if(owner!=categoryId){//任意归属改为所属人，算分配
                var notifyInfo = {
                    type:"assign",//分配
                    cid:cid,
                    account:aid,
                    uid:owner,
                    categoryId:categoryId
                }
                mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                    if(err){
                        logger.app.error('db insert app_notify error:' + err);
                    }
                });
            }
        }
    }
}
/**
 * 增加客户的提醒
 * @param data
 * @param session
 */
var emitAgentNotify2Add = function(data,session){
    var cid=data._id;
    var aid=session.user.account;
    var currentUid=session.user._id;
    var owner=data.owner;
    var categoryId=data.categoryId;
    console.info("emitAgentNotify2Add=====");
    if(owner!=categoryId && owner!=currentUid) {//指定所属人且不是自己
        var notifyInfo = {
            type:"assign",//分配
            cid:cid,
            account:aid,
            uid:owner,
            categoryId:categoryId
        }
        mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
            if(err){
                logger.app.error('db insert app_notify error:' + err);
            }
        });
    }
}


var emitBatchAssignAgentNotify = function(agents,oldAgents,session){
    var aid=session.user.account;
    var currentUid=session.user._id;
    console.info("emitBatchAssignAgentNotify=====");
    var insertNotify=function(type,uid,num){
        var notifyInfo = {
            type:type,
            account:aid,
            uid:uid,
            num:num
        }
        mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
            if(err){
                logger.app.error('db insert app_notify error:' + err);
            }
        });
    }
    for(var agentId in oldAgents){
        var obj=oldAgents[agentId];
        insertNotify("batchAssignOut",agentId,obj.num+"");
    }

    for(var i=0;i<agents.length;i++){
        var count=agents[i].count;
        var owner= agents[i].owner;
        insertNotify("batchAssign",owner,count+"");
    }
}


/**
 * 登录后判断是否要触发未分配商机的处理
 * @param data
 * @param session
 */
exports.emitCustSaleWait = function (data,session) {
    var getCustFlag=session.user.getCustFlag||null;
    if(data.getCustFlag){//设置上线传此值为true
        getCustFlag=null;
    }
    var aid=session.user.account;
    var uid=session.user._id;
    var time=utils.getCurrentDate();
    //console.info("emitCustSaleWait======"+getCustFlag)
    if(getCustFlag==null){
        mongo.db().collection("app_customer_sale_event").count({account:aid,status:'wait'},function(err,count){
            if(!err){
                if(count>0){
                    var url = config.kmdoc_url+'?Action=handleSalesWait&account='+aid;
                    url=encodeURI(url);
                    http.sendGet(url, function(err, result){
                        if(!err && result){
                            try{
                                var res = JSON.parse(result);
                                if(res.Succeed){
                                }else{
                                    logger.app.error(new Error('request cc-doc error!'));
                                }
                            }catch (e) {
                                logger.request.error(e);
                            }
                        }else{
                            var error = err || new Error('request  cc-doc  error!');
                            logger.request.error(error);
                        }
                    });
                }
            }else{
                logger.app.error(err);
            }
        });
    }
}

//商机分配回收提醒  开：1，关 ：0
exports.settingCustRemind = function(data,session,callback){
    var result = {success:false};
    var setData = {$set:{"custRemind":data}};
    if(data == "1"){
        setData = {$unset:{"custRemind":1}};
    }
    var query = {"_id":session.user._id};
    query.account = session.account.account;
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query,setData,function(err){
        if (!err) {
            result.success = true;
            callback(result);
        } else {
            logger.app.error('settingCustRemind error:' + err.stack);
            result.message = "settingCustRemind error";
            callback(result);
        }
    })
}

//联系计划提醒开关    开：1 ，关：0       //暂时搁置
exports.settingPlanRemind = function(data,session,callback){
    var result = {success:false};
    var setData = {$set:{"planRemind":data}};
    if(data == "1"){
        setData  = {$unset:{"planRemind":1}};
    }
    var query = {"_id":session.user._id};
    query.account = session.account.account;
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query,setData,function(err){
        if(!err){
            result.success = true;
            callback(result);
        }else{
            logger.app.error('settingNotifyRemind error:' + err.stack);
            result.message = "settingNotifyRemind error";
            callback(result);
        }
    })
}


/*exports.batchUpdateActionUser = function(data,session,callback){ //for gejie
    var result = {success:false};
    var query={
        status:"0"
    }
    mongo.db().collection("app_note").find(query, {sort: {createTime: -1},fields:{_id:1,userId:1,accountId:1,customerId:1}}).toArray(function (err, docs) {
        if (!err) {
            docs=docs||[];
            for (var i = 0; i < docs.length; i++) {
                var note = docs[i];
//                console.info("111==="+note.accountId);
                var updateCustomer=function(note){
                    mongo.db("bill").collection("platform_account_product").findOne({_id:note.accountId+"_cc"},function(err,product){
                        if(!err){
//                            console.info(note.accountId+fields.DB_C5_CUSTOMER);
                            var db=product.dataDB;
                            mongo.db(db).collection(note.accountId+fields.DB_C5_CUSTOMER).update({_id:note.customerId},{$set:{actionUser:note.userId}},function(err){
                                if(err){
                                    logger.app.error(err);
                                }
                            })
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }
                updateCustomer(note);
            }
            result.success=true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}*/
var calcRecoveryTimeByDay = function(row,common,sysStatus){
    var lastContactTime = row.lastContactTime;//最后联系时间
    var takeTime = row.takeTime; //领取时间
    var dayNum = 0;//等于0不回收
    var recTime = new Date();
    recTime.setHours(0);
    recTime.setMinutes(0);
    recTime.setSeconds(0);
    if(sysStatus == "0"){
        if(!common.recycle.deNum || common.recycle.deNum == "0"){
            dayNum = 0;
        }else{
            dayNum = parseInt(common.recycle.deNum);
        }
        if(dayNum == 0) return 0;
        takeTime = takeTime.replace(/-/g,"/");
        var takeDate = new Date(takeTime);
        recTime.setDate(takeDate.getDate()+ (dayNum+1));
        var reultTime = recTime - new Date();
        return reultTime;
    }else if(sysStatus == "1"){
        if(!common.recycle.foNum || common.recycle.foNum == "0"){
            dayNum = 0;
        }else{
            dayNum = parseInt(common.recycle.foNum);
        }
        if(dayNum == 0) return 0;
        lastContactTime = lastContactTime.replace(/-/g,"/");
        var lastContcatDate = new Date(lastContactTime);
        recTime.setDate(lastContcatDate.getDate()+ (dayNum+1));
        var reultTime = recTime - new Date();
        return reultTime;
    }
}

var calcRecoveryTimeByMinute = function(row,common,sysStatus){
    var lastContactTime = row.lastContactTime;//最后联系时间
    var takeTime = row.takeTime; //领取时间
    var dayNum = 0;//等于0不回收
    if(sysStatus == "0"){
        if(!common.recycle.deNum || common.recycle.deNum == "0"){
            dayNum = 0;
        }else{
            dayNum = parseInt(common.recycle.deNum);
        }
        if(dayNum == 0) return 0;
        //待跟进按分钟处理,而且不用判断lastContactTime
        takeTime = takeTime.replace(/-/g,"/");
        var takeDate = new Date(takeTime);
        takeDate.setMinutes(takeDate.getMinutes() + dayNum);
        var reultTime = takeDate - new Date();
        return reultTime;

    }else if(sysStatus == "1"){
        if(!common.recycle.foNum || common.recycle.foNum == "0"){
            dayNum = 0;
        }else{
            dayNum = parseInt(common.recycle.foNum);
        }
        if(dayNum == 0) return 0;
        //跟进中按天处理
        var recTime = new Date();
        recTime.setHours(0);
        recTime.setMinutes(0);
        recTime.setSeconds(0);
        lastContactTime = lastContactTime.replace(/-/g,"/");
        var lastContcatDate = new Date(lastContactTime);
        recTime.setDate(lastContcatDate.getDate()+ (dayNum+1));
        var reultTime = recTime - new Date();
        return reultTime;
    }
}

