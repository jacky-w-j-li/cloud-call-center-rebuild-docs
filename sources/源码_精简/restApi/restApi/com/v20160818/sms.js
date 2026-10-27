var util = require("appUtil/Utils");
var log = require("appLog");
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/com/common/RedisKeyPrefix');
var rateLimitConfig = require(__baseDir + '/com/common/rateLimitConfig');

var service = {
    getSmsTemplate: function (req,res) {
        var result = {success: false};
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var data = action.data;
                if (!data.account || data.account == '') {
                    result.flag = "04";
                    result.message = "账号为空";
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (!data.password || data.password == '') {
                    result.flag = "05";
                    result.message = "密码为空";
                    util.sendResult(result, res, req.id());
                    return;
                }
                mongo.ccDb().collection("platform_account_product").findOne({_id: data.account + '_cc'}, function (err, accProDoc) {
                    if (err) {
                        result.flag = "99";
                        result.message = "获取账号cc产品失败";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if (accProDoc) {
                        if (accProDoc.templateSmsInterfacePassword) {
                            if (data.password != accProDoc.templateSmsInterfacePassword) {
                                result.flag = "08";
                                result.message = "短信接口密码错误";
                                util.sendResult(result, res, req.id());
                                return;
                            }
                        } else {
                            result.flag = "09";
                            result.message = "您的账号未开通发短信HTTP接口";
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        mongo.ccDb('cc').collection("app_sms_sign").find({account: data.account}).toArray(function (err, signList) {
                            if (err) {
                                result.flag = "99";
                                result.message = "获取账号短信模板失败";
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            var signMap = {};
                            for (var i = 0; i < signList.length; i++) {
                                signMap[signList[i]._id] = signList[i];
                            }
                            mongo.ccDb('cc').collection("app_sms_template").find({account: data.account,status:1}, {
                                "name": 1,
                                "content": 1,
                                "sign": 1,
                                "num": 1,
                                "vars": 1
                            }).toArray(function (err, list) {
                                if (err) {
                                    result.flag = "99";
                                    result.message = "获取账号短信模板失败";
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                                for (var i = 0; i < list.length; i++) {
                                    list[i].sign = signMap[list[i].sign].name;
                                }
                                result.success = true;
                                result.data = list;
                                util.sendResult(result, res, req.id());
                                return;
                            });
                        });
                    } else {
                        result.flag = "99";
                        result.message = "未找到这个账号的呼叫中心产品";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }
        });
    },
    sendInterfaceTemplateSms: function (req,res) {
        var result = {success: false};
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var data = action.data;
                if (!data.templateNum || data.templateNum == '') {
                    result.flag = "01";
                    result.message = "模板编号为空";
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (!data.num || data.num == '') {
                    result.flag = "03";
                    result.message = "手机号码为空";
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (!data.account || data.account == '') {
                    result.flag = "04";
                    result.message = "账号为空";
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (!data.hangupsms || data.hangupsms == '') {
                    data.hangupsms = "";
                    if (!data.password || data.password == '') {
                        result.flag = "05";
                        result.message = "密码为空";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                }
                var numArr = null;
                if (data.num.indexOf(',') != -1) {
                    numArr = data.num.split(',');
                }
                if (numArr && numArr.length > 3000) {
                    result.flag = "06";
                    result.message = "单次群发手机号码不能超过3000个，请检查号码数量";
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (numArr) {
                    for (var i = 0; i < numArr.length; i++) {
                        var patrn = /^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
                        if (!patrn.exec(numArr[i]) || numArr[i].length != 11) {
                            result.flag = "07";
                            result.message = "含有不正确的手机号码，请检查";
                            util.sendResult(result, res, req.id());
                            return;
                        }
                    }
                    data.isBatch = true;
                    data.numCount = numArr.length;
                    data.nums = data.num;
                } else {
                    var patrn = /^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
                    if (!patrn.exec(data.num) || data.num.length != 11) {
                        result.flag = "07";
                        result.message = "含有不正确的手机号码，请检查";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                }
                var findtemplate = {_id: data.account + "_" + data.templateNum,status:1};
                mongo.ccDb('cc').collection("app_sms_template").findOne(findtemplate, function (err, templateDoc) {
                    if (err) {
                        result.flag = "99";
                        result.message = "服务端内部错误";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if (!templateDoc) {
                        result.flag = "12";
                        result.message = "未找到对应的短信模板";
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    var findSign = {_id: templateDoc.sign};
                    mongo.ccDb('cc').collection("app_sms_sign").findOne(findSign, function (err, signDoc) {
                        if (!err) {
                            if (signDoc) {
                                mongo.ccDb().collection("platform_account").findOne({_id: data.account}, function (err, accDoc) {
                                    if (err) {
                                        result.flag = "99";
                                        result.message = "获取账号失败";
                                        util.sendResult(result, res, req.id());
                                        return;
                                    }
                                    mongo.ccDb().collection("platform_account_product").findOne({_id: data.account + '_cc'}, function (err, accProDoc) {
                                        if (err) {
                                            result.flag = "99";
                                            result.message = "获取账号cc产品失败";
                                            util.sendResult(result, res, req.id());
                                            return;
                                        }
                                        if (accProDoc) {
                                            if (!data.hangupsms) {
                                                if (!accProDoc.templateSmsInterfacePassword) {
                                                    result.flag = "09";
                                                    result.message = "您的账号未开通发短信HTTP接口";
                                                    util.sendResult(result, res, req.id());
                                                    return;
                                                } else {
                                                    if (data.password != accProDoc.templateSmsInterfacePassword) {
                                                        result.flag = "08";
                                                        result.message = "短信接口密码错误";
                                                        util.sendResult(result, res, req.id());
                                                        return;
                                                    }
                                                }
                                            } else {
                                                if (data.hangupsms != util.md5(data.account)) {
                                                    if (!accProDoc.templateSmsInterfacePassword) {
                                                        result.flag = "09";
                                                        result.message = "您的账号未开通发短信HTTP接口";
                                                        util.sendResult(result, res, req.id());
                                                        return;
                                                    } else {
                                                        if (!data.password||data.password != accProDoc.templateSmsInterfacePassword) {
                                                            result.flag = "08";
                                                            result.message = "短信接口密码错误";
                                                            util.sendResult(result, res, req.id());
                                                            return;
                                                        }
                                                    }

                                                }
                                            }

                                            //拼接内容
                                            data.content = templateDoc.content;
                                            data.template = data.content;

                                            for (var i = 1; i <= templateDoc.vars; i++) {
                                                if (data['var' + i]) {
                                                    data.content = data.content.replace('{' + i + '}', data['var' + i]);
                                                }else{
                                                    data.content = data.content.replace('{' + i + '}', "");
                                                }
                                            }
                                            data.content = self.delSpecialChar(data.content).trim();//data.content  为短信模板的内容
                                            data.content = data.content.replace(/\r\n/g,"").replace(/\n/g,"").replace(/\s/g,"").replace(/\[/g,'').replace(/\]/g,'').replace(/{\d+?}/g,'****');

                                            data.vars = templateDoc.vars;
                                            var smsSplitBaseNum = 66;
                                            if(accProDoc.smsSplitBaseNum){
                                                smsSplitBaseNum = accProDoc.smsSplitBaseNum;
                                            }
                                            if ((data.content.length + signDoc.name.length) > smsSplitBaseNum) {
                                                var n = 1;
                                                var nc = parseInt((data.content.length + signDoc.name.length - smsSplitBaseNum) / smsSplitBaseNum);
                                                var nv = (data.content.length + signDoc.name.length - smsSplitBaseNum) % smsSplitBaseNum;
                                                n += nc;
                                                if (nv > 0) {
                                                    n += 1;
                                                }
                                                data.splitCount = n;
                                            } else {
                                                data.splitCount = 1;
                                            }
                                            //check banlance
                                            var smsFee = 1000;
                                            if (accProDoc.smsFee) {
                                                smsFee = accProDoc.smsFee;
                                            }
                                            var money = 0;
                                            if (data.isBatch) {
                                                money = data.numCount * data.splitCount * smsFee;
                                            } else {
                                                money = data.splitCount * smsFee;
                                            }
                                            var realBalance = accDoc.balance;
                                            if (accDoc.overdraw) {
                                                realBalance = realBalance + accDoc.overdraw;
                                            }
                                            if (money > realBalance) {
                                                result.flag = "10";
                                                result.message = "资费不足，无法该条发送短信";
                                                util.sendResult(result, res, req.id());
                                                return;
                                            }
                                            //check templateSmsChannel
                                            if (templateDoc.smsChannel.length > 0) {
                                                data.smsChannel = templateDoc.smsChannel[0];
                                            } else {
                                                result.flag = "13";
                                                result.message = "此模板异常，无法发送短信";
                                                util.sendResult(result, res, req.id());
                                                return;
                                            }
                                            if (data.smsChannel == 'ymnew' || data.smsChannel == 'jz') {
                                                if (data.content.length > 500) {
                                                    result.flag = "02";
                                                    result.message = "内容为空或内容过长";
                                                    util.sendResult(result, res, req.id());
                                                    return;
                                                }
                                            } else {
                                                if (data.content.length > 280) {
                                                    result.flag = "02";
                                                    result.message = "内容为空或内容过长";
                                                    util.sendResult(result, res, req.id());
                                                    return;
                                                }
                                            }
                                            data._id = util.UUID.generateUuid();
                                            data.createUser = 'interface';
                                            if (data.hangupsms == util.md5(data.account)) {
                                                data.createUser = 'hangupSMS'
                                            }
                                            data.m7Status = "ready";
                                            data.signDisplay = signDoc.name;
                                            data.sign = signDoc.subcode;
                                            data.submitTime = util.DateTime.getCurrentDateTime();
                                            data.product = "cc";
                                            data.type = "send";
                                            if (data.isBatch) {
                                                delete data.num;
                                            }
                                            if (!templateDoc.operatorStrategy) {
                                                self.insertSend(accProDoc,data,templateDoc,function (callback) {
                                                    util.sendResult(callback, res, req.id());
                                                    return;
                                                });
                                            } else {
                                                var numsArray = [];
                                                var numArr = null;
                                                var yd_num = "";
                                                var dx_num = "";
                                                var lt_num = "";
                                                var def_num = "";
                                                var ydChannel = templateDoc.yd_smsChannel;
                                                var dxChannel = templateDoc.dx_smsChannel;
                                                var ltChannel = templateDoc.lt_smsChannel;
                                                var dfChannel = templateDoc.df_smsChannel;
                                                if (data.nums) {
                                                    numArr = data.nums.split(",");
                                                }
                                                if (data.num) {
                                                    numArr = data.num.split(",");
                                                }
                                                if (numArr && numArr.length > 0) {
                                                    for (var i = 0; i < numArr.length; i++) {
                                                        var param = util.matchingOperator(numArr[i]);
                                                        if ("yd_smsChannel" == param) {
                                                            yd_num += numArr[i]+",";
                                                        } else if ("dx_smsChannel" == param) {
                                                            dx_num += numArr[i]+",";
                                                        } else if ("lt_smsChannel" == param) {
                                                            lt_num += numArr[i]+",";
                                                        } else if ("def_smsChannel" == param) {
                                                            def_num += numArr[i]+",";
                                                        }
                                                    }
                                                }
                                                if (yd_num) {
                                                    numsArray.push(yd_num.substr(0,yd_num.lastIndexOf(","))+"_"+ydChannel);
                                                }
                                                if (dx_num) {
                                                    numsArray.push(dx_num.substr(0,dx_num.lastIndexOf(","))+"_"+dxChannel);
                                                }
                                                if (lt_num) {
                                                    numsArray.push(lt_num.substr(0,lt_num.lastIndexOf(","))+"_"+ltChannel);
                                                }
                                                if (def_num) {
                                                    numsArray.push(def_num.substr(0,def_num.lastIndexOf(","))+"_"+dfChannel);
                                                }
                                                self.recursive(accProDoc,numsArray,data,templateDoc,function (callback) {
                                                    util.sendResult(callback, res, req.id());
                                                    return;
                                                });
                                            }
                                        } else {
                                            result.flag = "99";
                                            result.message = "未找到这个账号的呼叫中心产品";
                                            util.sendResult(result, res, req.id());
                                            return;
                                        }
                                    });
                                });
                            } else {
                                result.flag = "11";
                                result.message = "此签名未备案";
                                util.sendResult(result, res, req.id());
                                return;
                            }
                        } else {
                            result.flag = "99";
                            result.message = "服务端内部错误";
                            util.sendResult(result, res, req.id());
                            return;
                        }
                    });
                });
            }
        });
    }
};

var self = {
    insertSend: function (accProDoc,data,templateDoc,callback) {
        var result = {success:false};
        if(data.smsChannel=='ytx'||data.smsChannel=='ytxyx' || data.smsChannel=='ytxyzm'){
            var query = {_id:templateDoc._id};
            mongo.ccDb().collection("ytx_template_id").findOne(query, function (err,doc) {
                if(err){
                    result.message = "query ytxid cc db failed!";
                    result.errorNum = data.num;
                    callback(result);
                }else {
                    data.ytxtemplateid = doc.ytxtemplateid;
                    mongo.ccDb('cc').collection("app_sms_send").insert(data, function (err) {
                        if (err) {
                            result.flag = '99';
                            result.message = "sms insert cc db failed!";
                            callback(result);
                        } else {
                            if (data.isBatch) {
                                result.success = true;
                                result.flag = '00';
                                result.msgid = data._id;
                                result.message = '短信提交成功';
                                callback(result);
                            } else {
                                mongo.ccDb(accProDoc.dataDB).collection(data.account + '_sms').insert(data, function (nerr) {
                                    if (nerr) {
                                        result.flag = '99';
                                        result.errorNum = data.num;
                                        result.message = "sms insert account_sms db failed!";
                                    } else {
                                        result.success = true;
                                        result.flag = '00';
                                        result.msgid = data._id;
                                        result.message = '短信提交成功';
                                    }
                                    callback(result);
                                });
                            }
                        }
                    });
                }
            });
        }else{
            mongo.ccDb('cc').collection("app_sms_send").insert(data, function (err) {
                if (err) {
                    result.flag = '99';
                    result.errorNum = data.num;
                    result.message = "sms insert cc db failed!";
                    callback(result);
                } else {
                    if (data.isBatch) {
                        result.success = true;
                        result.flag = '00';
                        result.msgid = data._id;
                        result.message = '短信提交成功';
                        callback(result);
                    } else {
                        mongo.ccDb(accProDoc.dataDB).collection(data.account + '_sms').insert(data, function (nerr) {
                            if (nerr) {
                                result.flag = '99';
                                result.errorNum = data.num;
                                result.message = "sms insert account_sms db failed!";
                            } else {
                                result.success = true;
                                result.flag = '00';
                                result.msgid = data._id;
                                result.message = '短信提交成功';
                            }
                            callback(result);
                        });
                    }
                }
            });
        }
    },
    recursive: function (accProDoc,obj,data,templateDoc,callback){
        var result = { success: false };
        if (obj.length > 0) {
            data._id = util.UUID.generateUuid();
            if (data.nums) {
                data.nums = obj[0].split("_")[0];
                if (data.nums.indexOf(",") != -1) {
                    var arr = data.nums.split(",");
                    data.numCount = arr.length;
                } else {
                    data.numCount = 1;
                }
            }
            if (data.num) {
                data.num = obj[0].split("_")[0];
                if (data.num.indexOf(",") != -1) {
                    var arr = data.num.split(",");
                    data.numCount = arr.length;
                } else {
                    data.numCount = 1;
                }
            }

            data.smsChannel = obj[0].split("_")[1];
            insertSend(accProDoc,data,templateDoc,function (res) {
                if (!res.success) {
                    callback(res);
                } else {
                    obj.splice(0,1);
                    recursive (accProDoc,obj,data,templateDoc,callback);
                }
            });
        } else {
            result.success = true;
            result.flag = '00';
            result.message = '短信提交成功';
            callback(result);
        }
    },
    delSpecialChar: function (content) {
        content = content.replace(/\\'/g,"'");
        content = content.replace(/\\"/g,'"');
        var contentarr = content.split('"');
        var str = "";
        var str2 = "";
        for(var j = 0;j< contentarr.length-1;j++){
            str+=contentarr[j]+(j%2?'”':'“');
        }
        str+=contentarr[j];
        contentarr = str.split("'");
        for(var j = 0;j<contentarr.length-1;j++){
            str2 += contentarr[j]+(j%2?'’':'‘');
        }
        str2 +=contentarr[j];
        var reg1 = new RegExp("<[^<]*>", "gi")
        str2 = str2.replace(reg1,'');
        var reg2 = new RegExp("</", "gi")
        str2 = str2.replace(reg2,'');
        if(str2.substr(str2.length-1,1) == '\\'&&str2.substr(str2.length-2,2) != '\\\\'){
            str2 = str2+'\\'
        }
        return str2
    }
};

module.exports = service;