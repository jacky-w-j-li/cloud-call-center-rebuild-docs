var util = require("appUtil/Utils");
var log = require("appLog");
var http = require('appHttp');
var restUtil = require(__baseDir + '/com/common/restUtil');
var dateTimeUtil = require('appUtil/DateTime');
var mongo = require("appDb/MongoDb");
var uuid = require('appUtil/UUID');
var config = require('appConfig');
var service = {
    delBlackList:function(req, res, next){
        var result = {code:200,message:'success!'};
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return; 
                }
                var data = action.data;
                data.Account = data.account;
                delete data.account;
                var numformate = /^[0-9]*$/;
                var mobnumformate = new RegExp(/^((\d{11,12})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/);
                var datas = [];
                datas = data.BlackNum.split(/,/);
                data.BlackNum = datas;
                mongo.ccDb('bill').collection("platform_account_product").findOne({_id: data.Account + '_cc'}, function (err, dbAccount) {
                    if (err) {
                        result = {code : 500, message:'server has error!'};
                        util.sendStrResult(JSON.stringify(result), res, req.id());
                        return;
                    }else{
                        if (dbAccount.pbx.length == 0 ) {
                            result = {code : 402, message:'PBX is not found!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }else if(dbAccount.pbx.length > 1){
                            if(!data.PBX){
                                result = {code : 402, message:'PBX is not found!'};
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }
                        }else{
                            data.PBX = dbAccount.pbx[0].PBX;
                        }
                        if (!data.BlackNum || !data.Type) {
                            result = {code : 402, message:'BlackNum or Type not found!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        var errornummsg = "";
                        for (var i = 0, len = datas.length; i < len; i++) {
                            if (!mobnumformate.test(datas[i].toString())) {
                                errornummsg += datas[i] + " ";
                            }
                        }
                        if (errornummsg.length > 0) {
                            result = {code : 402, message:'BlackNum ' + errornummsg + 'is error!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        if (!numformate.test(data.Type.toString())) {
                            result = {code : 402, message:'Types is error!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        if (0 > parseInt(data.Type) || 2 < parseInt(data.Type)) {
                            result = {code : 402, message:'Type over Range!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        service.isExist(data, function (blackresult) {
                            if(blackresult.success){
                                if (data.BlackNum.length > 0) {
                                    var isexistnum = "";
                                    for (var i = 0, len = data.BlackNum.length; i < len; i++) {
                                        isexistnum += data.BlackNum[i] + ",";
                                    }
                                    isexistnum = isexistnum.substr(0, isexistnum.length - 1);
                                    result.badmessage = isexistnum + ' BlackNum not Exist!';
                                }
                                data.BlackNum = blackresult.list;
                                if (blackresult.list.length > 0) {
                                    service.deleteBlackList(data, function (resultinfo) {
                                        if (resultinfo.success) {
                                            var goodnews = "";
                                            for (var i = 0, len = data.BlackNum.length; i < len; i++) {
                                                goodnews += data.BlackNum[i].BlackNum + ",";
                                            }
                                            goodnews = goodnews.substr(0, goodnews.length - 1);
                                            result.goodmessage = goodnews + " is ok !";
                                        } else {
                                            result = {code : 500, message:resultinfo.message};
                                        }
                                        util.sendStrResult(JSON.stringify(result), res, req.id());
                                        return;
                                    });
                                } else {
                                    util.sendStrResult(JSON.stringify(result), res, req.id());
                                    return;
                                }
                            }else{
                                result = {code : 500, message:blackresult.message};
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }

                        });
                    }
                });
            }
        });
    },
    delExist:function (data, callback) {
        var result = {success: false};
        var sort = {UpdateTime: -1}
        var query = {Account:data.Account,
            BlackNum:{$in:data.BlackNum},
            Type:data.Type
        };
        mongo.ccDb('cc').collection("ivr_black_num").find(query).sort(sort).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                result.list = docs;
                if(docs.length>0){
                    for(var i = 0,len = docs.length;i<len;i++){
                        var Numindex = data.BlackNum.indexOf(docs[i]['Num']);
                        if(Numindex>=0){
                            data.BlackNum.splice(Numindex,1);
                        }
                    }
                }
                callback(result);
            } else {
                log.app.error(err.stack);
                result.message = 'Query back number failure: ' + util.inspect(data);
                result.success = false;
                callback(result);
            }
        });
    },
    deleteBlackList:function (data, callback) {
        var result = {success : false};
        if (data.Type == '0') {
            service.delRedNum(data, function(redNumRes){
                if (!redNumRes.success){
                    result.success = false;
                    result.message = redNumRes.message;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        } else if (data.Type == '1') {
            service.delInBLackNum(data, function(inBlackNumRes){
                if (!inBlackNumRes.success){
                    result.success = false;
                    result.message = inBlackNumRes.message;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        } else if (data.Type == '2') {
            service.delOutBlackNum(data, function(outBlackNumRes){
                if (!outBlackNumRes.success){
                    result.success = false;
                    result.message = outBlackNumRes.message;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        }
    },
    delRedNum : function(data, callback){
        var result = {success: false};
        var blacknums = [] ;
        for(var i = 0,len = data.BlackNum.length;i<len;i++){
            blacknums.push(data.BlackNum[i].BlackNum);
        }
        mongo.ccDb('cc').collection("ivr_black_num").find({Type: '0',Account: data.Account,BlackNum:{$nin:blacknums}}).toArray(function (err, docs) {
            if (err) {
                result.message = err;
                callback(result);
                return;
            }
            var endList = [];
            for (var i = 0; i < docs.length; i++) {
                endList.push(docs[i].Num);
            }
            var ivrData = {
                nodeData: {
                    Action: "RedListAdd",
                    PBX: data.PBX,
                    Account: data.Account,
                    List: endList.join(',')
                },
                isStoreDB: false
            };
            var url = config.ccService + '?action=restToDeleteIvr&json=' + JSON.stringify(ivrData);
            url = encodeURI(url);
            http.sendGet(url, function (err, res) {
                if (!err && res) {
                    try {
                        var res = JSON.parse(res);
                        if (res.success) {
                            mongo.ccDb('cc').collection('ivr_black_num').remove({Type: '0',Account: data.Account,BlackNum:{$in:blacknums}}, function (err) {
                                if (err) {
                                    result.success = false;
                                    result.message = err;
                                    callback(result);
                                    return;
                                }
                                result.data = data;
                                result.success = true;
                                callback(result);
                            });
                        } else {
                            result.message = res.message;
                            callback(result);
                        }
                    } catch (e) {
                        result.message = e;
                        callback(result);
                    }
                } else {
                    var error = err || new Error('request service error!');
                    result.message = error;
                    callback(result);
                }
            });
        });
    },
    delInBLackNum : function(data,callback){
        var result = {success: false};
        service.queryBlackNum({Account: data.Account, PBX: data.PBX, Type: data.Type}, function(blackRes){
            if (!blackRes.success) {
                result.success = false;
                result.message = blackRes.message;
                callback(result);
                return;
            }
            var assData = blackRes.list;
            for (var i = 0; i < assData.length; i++) {
                for(var j =0,len =data.BlackNum.length;j<len;j++ ){
                    if (assData[i].BlackNum == data.BlackNum[j].BlackNum) {
                        assData = assData.slice(0, i).concat(assData.slice(i+1, assData.length));
                    }
                }

            }
            service.queryBlackListNode ({Account : data.Account, PBX : data.PBX}, function(blackNodeRes){
                if (!blackNodeRes.success) {
                    result.success = false;
                    result.message = blackNodeRes.message;
                    callback(result);
                    return;
                }
                var blackNodes = {
                    list : blackNodeRes.data,
                    currentData : data,
                    assData : assData
                }
                service.batchDelBlackNum(blackNodes, function (updateRes) {
                    if (!updateRes.success) {
                        result.success = false;
                        result.message = updateRes.message;
                        callback(result);
                        return;
                    }else{
                        var condi={
                            Account:data.Account,
                            PBX:data.PBX,
                            Type:data.Type,
                            Num:{$nin:updateRes.nums.split(",")}
                        }
                        mongo.ccDb('cc').collection('ivr_black_num').remove(condi, function (err) {
                            if (err) {
                                result.success = false;
                                result.message = err;
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                        });
                    }
                });
            });
        });
    },
    batchDelBlackNum : function (data, callback) {
        var result = {success : false};
        if (data.list && data.list.length > 0) {
            var blackNode = {
                blackNodes:data.list,
                PBX:data.list[0].PBX
            };
            var ivrData = {
                isStoreDB: false,
                nodeData : blackNode
            }
            var blacknumList = '';
            for (var i = 0; i < data.assData.length; i++) {
                blacknumList += data.assData[i].BlackNum + ",";
            }
            ivrData.nodeData.list = blacknumList.substr(0, blacknumList.length - 1);
            ivrData.nodeData.Action = "BatchAddBlackList";
            var url = config.ccService;
            url = encodeURI(url);
            http.sendPost(url, 'action=restToDeleteIvr&json=' + JSON.stringify(ivrData), function (err, data) {
                if(!err){
                    var res = JSON.parse(data);
                    if(res.success){
                        result.success = true ;
                        result.nums =ivrData.nodeData.list;
                        log.app.info("addOrupdate blacklist success:" + res.message);
                    }else{
                        result.success = false ;
                        result.message = "addOrupdate blacklist fail!";
                        log.app.info("addOrupdate blacklist fail:" + res.message);
                    }
                }else{
                    result.success = false;
                    result.message = "addOrupdate blacklist fail!";
                    log.app.info('addOrupdate blacklist fail! '+err.message);
                }
                callback(result);
            });
        }
    },
    delOutBlackNum : function(data, callback){
        var result = {success: false};
        var nums = "";
        for(var i=0 ,len =data.BlackNum.length;i<len;i++){
            nums+=data.BlackNum[i].Num+",";
        }
        data.Exten = nums.substr(0,nums.length-1);
        var ivrData = {
            nodeData : data,
            isStoreDB: false
        }
        ivrData.nodeData.Action = "PeerRemove";
        ivrData.nodeData.Peer = "DialoutBlackList";
        var url = config.ccService + '?action=restToDeleteIvr&json=' + JSON.stringify(ivrData);
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.success) {
                        var comdi = {
                            BlackNum:{$in:data.Exten.split(",")},
                            Type:"2",
                            PBX: data.PBX,
                            Account:data.Account
                        }
                        mongo.ccDb('cc').collection('ivr_black_num').remove(comdi,{w: 1}, function (err) {
                            if (err) {
                                result.success = false;
                                result.message = err;
                                callback(result);
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        });
                    } else {
                        result.success = false;
                        result.message = "restTodeleteIvr interface fail!";
                        callback(result);
                    }
                } catch (e) {
                    result.success = false;
                    result.message = e;
                    callback(result);
                }
            } else {
                var error = err || new Error('request service error!');
                result.message = error;
                callback(result);
            }
        });
    },
    saveBlackList:function(req, res, next){
        var result = {code:200,message:'success!'};
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                data.Account = data.account;
                delete data.account;
                var numformate = /^[0-9]*$/;
                var mobnumformate = new RegExp(/^((\d{11,12})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/);
                var datas = [];
                datas = data.BlackNum.split(/,/);
                data.BlackNum = datas;
                mongo.ccDb('bill').collection("platform_account_product").findOne({_id: data.Account + '_cc',}, function (err, dbAccount) {
                    if (err) {
                        result = {code : 500, message:'server has error!'};
                        util.sendStrResult(JSON.stringify(result), res, req.id());
                        return;
                    }else{
                        if (dbAccount.pbx.length == 0 ) {
                            result = {code : 402, message:'PBX is not found!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }else if(dbAccount.pbx.length > 1){
                            if(!data.PBX){
                                result = {code : 402, message:'PBX is not found!'};
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }
                        }else{
                            data.PBX = dbAccount.pbx[0].PBX;
                        }
                        if (!data.BlackNum || !data.Type) {
                            result = {code : 402, message:'BlackNum or Type not found!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        var errornummsg = "";
                        for (var i = 0, len = datas.length; i < len; i++) {
                            if (!mobnumformate.test(datas[i].toString())) {
                                errornummsg += datas[i] + " ";
                            }
                        }
                        if (errornummsg.length > 0) {
                            result = {code : 402, message:'BlackNum ' + errornummsg + 'is error!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        if (!numformate.test(data.Type.toString())) {
                            result = {code : 402, message:'Types is error!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        if (0 > parseInt(data.Type) || 2 < parseInt(data.Type)) {
                            result = {code : 402, message:'Type over Range!'};
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }
                        service.isExist(data, function (blackresult) {
                            if(blackresult.success) {
                                var isexistnum = "";
                                for (var i = 0, len = blackresult.list.length; i < len; i++) {
                                    isexistnum += blackresult.list[i]['Num'] + ",";
                                }
                                if (blackresult.list.length > 0) {
                                    result.badmessage = isexistnum + ' BlackNum is Exist!';
                                }
                                if (data.BlackNum.length > 0) {
                                    service.saveeveBlackList(data, function (resultinfo) {
                                        if (resultinfo.success) {
                                            result.goodmessage = resultinfo.data.BlackNum + " is ok !";
                                        } else {
                                            result = {code : 500, message:resultinfo.message};
                                        }
                                        util.sendStrResult(JSON.stringify(result), res, req.id());
                                        return;
                                    });
                                } else {
                                    util.sendStrResult(JSON.stringify(result), res, req.id());
                                    return;
                                }
                            }else{
                                result = {code : 500, message:blackresult.message};
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }
                        });
                    }
                });
            }
        });
    },
    isExist:function (data, callback) {
        var result = {success: false};
        var sort = {UpdateTime: -1};
        var query = {
            Account:data.Account,
            BlackNum:{$in:data.BlackNum},
            Type:data.Type
        };
        mongo.ccDb('cc').collection("ivr_black_num").find(query).sort(sort).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                result.list = docs;
                if(docs.length>0){
                    for(var i = 0,len = docs.length;i<len;i++){
                        var Numindex = data.BlackNum.indexOf(docs[i]['Num']);
                        if(Numindex>=0){
                            data.BlackNum.splice(Numindex,1);
                        }
                    }
                }
                callback(result);
            } else {
                log.app.error(err.stack);
                result.message = 'Query back number failure: ' + util.inspect(data);
                result.success = false;
                callback(result);
            }
        });
    },
    saveeveBlackList:function (data, callback) {
        var result = {success: false};
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        data.UpdateUser = "interface";
            if (data.Type == '2') {
                service.saveOutBlackNum(data, function (outBlackNumRes) {
                    if (!outBlackNumRes.success) {
                        result.success = false;
                        result.message = outBlackNumRes.message;
                        callback(result);
                        return;
                    }
                    result.data = data;
                    result.success = true;
                    callback(result);
                });
            } else if (data.Type == '0') {
                service.saveRedNum(data,function (redNumRes) {
                    if (!redNumRes.success) {
                        result.success = false;
                        result.message = redNumRes.message;
                        callback(result);
                        return;
                    }
                    result.data = data;
                    result.success = true;
                    callback(result);
                });
            } else if (data.Type == '1') {
                service.saveInBlackNum(data, function (InBlackRes) {
                    if (!InBlackRes.success) {
                        result.success = false;
                        result.message = InBlackRes.message;
                        callback(result);
                        return;
                    }
                    result.data = data;
                    result.success = true;
                    callback(result);
                })
            }
    },
    saveOutBlackNum : function (data, callback) {
        var result = {success: false};
        delete data['Type'];
        var Nums = [];
        for(var i = 0,len = data.BlackNum.length;i<len;i++) {
            var singlenum = {
                Account: data.Account,
                BlackNum: data.BlackNum[i],
                Memo: "接口调用",
                Num: data.BlackNum[i],
                PBX: data.PBX,
                Type: "2",
                UpdateTime: data.UpdateTime,
                UpdateUser: data.UpdateUser,
                _id: uuid.generateRandomId()
            }
            Nums.push(singlenum);
        }
        data._id = uuid.generateRandomId();
        data.oldNum = null;
        data.BlackNum = data.BlackNum.join(",");
        data.Num = data.BlackNum;
        var ivrData = {
            nodeData: data,
            isStoreDB: false
        }
        ivrData.nodeData.Type = 'DialoutBlackList';
        ivrData.nodeData.Action = 'PeerAdd';
        ivrData.nodeData.Peer = 'BatchNumManage';
        var url = config.ccService + '?action=restToSaveOrUpdateIvr&json=' + JSON.stringify(ivrData);
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.success) {
                        mongo.ccDb('cc').collection('ivr_black_num').insert(Nums, function (err) {
                            if (err) {
                                result.success = false;
                                result.message = err;
                                callback(result);
                                return;
                            }
                            result.data = data;
                            result.success = true;
                            callback(result);
                        });
                    } else {
                        result.success = false;
                        result.message = "restToSaveOrUpdateIvr interface fail!";
                        callback(result);
                    }
                } catch (e) {
                    result.success = false;
                    result.message = e;
                    callback(result);
                }
            } else {
                var error = err || new Error('request service error!');
                result.message = error;
                // log.request.error("restToSaveOrUpdateIvr interface"+result.message);
                callback(result);
            }
        });
    },
    saveRedNum : function (data,callback) {
        var result = {success: false};
        var Nums = [];
        var numsid = [];
        for(var i = 0,len = data.BlackNum.length;i<len;i++){
            var singlenum ={
                Account:data.Account,
                BlackNum:data.BlackNum[i],
                Memo : "接口调用",
                Num:data.BlackNum[i],
                PBX:data.PBX,
                Type:"0",
                UpdateTime:data.UpdateTime,
                UpdateUser:data.UpdateUser,
                _id:uuid.generateRandomId()

            }
            numsid.push(singlenum._id);
            Nums.push(singlenum);
        }
        mongo.ccDb('cc').collection("ivr_black_num").find({Type: '0', Account: data.Account}).toArray(function (err, docs) {
            if (err) {
                result.message = err;
                callback(err);
                return;
            }
            var endList = [];
            for (var i = 0; i < docs.length; i++) {
                endList.push(docs[i].Num);
                var arrayindexof = data.BlackNum.indexOf(docs[i].Num);
                if(arrayindexof>=0){
                    data.BlackNum.splice(arrayindexof,1);
                }
            }
            endList = endList.concat(data.BlackNum);
            var ivrData = {
                nodeData: {
                    Action: "RedListAdd",
                    PBX: data.PBX,
                    Account: data.Account,
                    List: endList.join(',')
                },
                isStoreDB: false
            };
            var url = config.ccService + '?action=restToSaveOrUpdateIvr&json=' + JSON.stringify(ivrData);
            url = encodeURI(url);
            http.sendGet(url, function (err, res) {
                if (!err && res) {
                    try {
                        var res = JSON.parse(res);
                        if (res.success) {
                            mongo.ccDb('cc').collection('ivr_black_num').insert(Nums, function (err) {
                                if (err) {
                                    result.success = false;
                                    result.message = err;
                                    // log.app.error("saveRedNum mongodb insert:"+err);
                                    callback(err);
                                }
                                result.data = data;
                                result.success = true;
                                callback(result);
                            });
                        } else {
                            result.message = res.message;
                            callback(result);
                        }
                    } catch (e) {
                        result.message = e;
                        callback(result);
                    }
                } else {
                    var error = err || new Error('request service error!');
                    result.message = error;
                    // log.request.error("restToSaveOrUpdateIvr interface"+result.message);
                    callback(result);
                }
            });
        });
    },
    saveInBlackNum : function (data,callback) {
        var result = {success: false};
        if (!data._id) {
            data._id = uuid.generateRandomId();
        }
        data.Num = data.BlackNum;
        service.queryBlackNum({
            _id: {$ne: data._id},
            Account: data.Account,
            PBX: data.PBX,
            Type: data.Type
        }, function (blackRes) {
            if (!blackRes.success) {
                result.success = false;
                result.message = blackRes.message;
                callback(result);
                return;
            }
            var assData = blackRes.list;
            var Nums = [];
            for(var i = 0,len = data.BlackNum.length;i<len;i++) {
                var singlenum = {
                    Account: data.Account,
                    BlackNum: data.BlackNum[i],
                    Memo: "接口调用",
                    Num: data.BlackNum[i],
                    PBX: data.PBX,
                    Type: "1",
                    UpdateTime: data.UpdateTime,
                    UpdateUser: data.UpdateUser,
                    _id: uuid.generateRandomId()
                }
                Nums.push(singlenum);
            }
            assData = assData.concat(Nums);
            service.queryBlackListNode({Account: data.Account, PBX: data.PBX}, function (blackNodeRes) {
                if (!blackNodeRes.success) {
                    result.success = false;
                    result.message = blackNodeRes.message;
                    callback(result);
                    return;
                }
                var blackNodes = {
                    list: blackNodeRes.data,
                    currentData: data,
                    assData: assData
                }
                service.batchUpdateBlackNum(blackNodes, function (updateRes) {
                    if (!updateRes.success) {
                        result.success = false;
                        result.message = updateRes.message;
                        callback(result);
                        return;
                    }else{
                        mongo.ccDb('cc').collection('ivr_black_num').insert(Nums, function (err) {
                            if (err) {
                                result.success = false;
                                result.message = err;
                                callback(result);
                            }
                            result.success = true;
                            callback(result);
                        });
                    }
                });
            });
        });
    },
    queryBlackNum : function (data, callback) {
        var result = {success: false};
        var sort = {UpdateTime: -1}
        mongo.ccDb('cc').collection('ivr_black_num').find(data).sort(sort).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result);
            } else {
                log.app.error(err.stack);
                result.message = 'Query back number failure: ' + util.inspect(data);
                result.success = false;
                callback(result);
            }
        });
    },
    queryBlackListNode : function(data, callback) {
        mongo.ccDb('cc').collection('manager_ivr_black_list').find(data).toArray(function (err, docs) {
            var result = {success: false};
            if (!err) {
                result.data = docs;
                result.success = true;
                callback(result);
            } else {
                log.app.error(err.stack);
                result.message = 'Query black list node failure!';
                callback(result);
            }
        });
    },
    batchUpdateBlackNum : function (data, callback) {
        var result = {success: false};
        if (data.list && data.list.length > 0) {
            var blackNode = {
                blackNodes:data.list,
                PBX:data.list[0].PBX
            };
            var ivrData = {
                nodeData: blackNode,
                currentData: data.currentData,
                dbData: {
                    tableName: 'ivr_black_num'
                },
                isStoreDB: false
            }
            var blacknumList = '';
            for (var i = 0; i < data.assData.length; i++) {
                blacknumList += data.assData[i].BlackNum + ",";
            }
            ivrData.nodeData.list = blacknumList.substr(0, blacknumList.length - 1);
            ivrData.nodeData.Action = "BatchAddBlackList";
            var url = config.ccService;
            http.sendPost(url, 'action=restToSaveOrUpdateIvr&json=' + JSON.stringify(ivrData), function (err, data) {
                if (!err) {
                    var res = JSON.parse(data);
                    if(res.success){
                        result.success = true ;
                        log.app.info("addOrupdate blacklist success:" + res.message);
                    }else{
                        result.success = false ;
                        log.app.info("addOrupdate blacklist fail:" + res.message);
                    }

                }else{
                    result.success = false;
                    log.app.info('addOrupdate blacklist fail! '+err.message);
                }
                callback(result);
            });
        }
    }
}
module.exports = service;