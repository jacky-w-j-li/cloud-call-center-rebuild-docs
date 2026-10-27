var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var dateUtils = require('appUtil/DateTime');
var logger = require('appLog');
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");
var handler = {
    sendInterfaceSms: function (data, callback) {
        var result = {success: false};
        if (!data.sign || data.sign == '') {
            result.flag = "01";
            result.message = "签名为空";
            callback(result);
            return;
        }
        if (!data.content || data.content == '') {
            result.flag = "02";
            result.message = "内容为空或内容过长";
            callback(result);
            return;
        }
        if (!data.num || data.num == '') {
            result.flag = "03";
            result.message = "手机号码为空";
            callback(result);
            return;
        }
        if (!data.account || data.account == '') {
            result.flag = "04";
            result.message = "账号为空";
            callback(result);
            return;
        }
        if (!data.password || data.password == '') {
            result.flag = "05";
            result.message = "密码为空";
            callback(result);
            return;
        }
        var numArr = null;
        if (data.num.indexOf(',') != -1) {
            numArr = data.num.split(',');
        }
        if (numArr && numArr.length > 3000) {
            result.flag = "06";
            result.message = "单次群发手机号码不能超过3000个，请检查号码数量";
            callback(result);
            return;
        }
        if (numArr) {
            for (var i = 0; i < numArr.length; i++) {
                var patrn = /^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
                if (!patrn.exec(numArr[i]) || numArr[i].length != 11) {
                    result.flag = "07";
                    result.message = "含有不正确的手机号码，请检查";
                    callback(result);
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
                callback(result);
                return;
            }
        }
        if ((data.content.length + data.sign.length + 2) > 66) {
            var n = 1;
            var nc = parseInt((data.content.length + data.sign.length - 66) / 66);
            var nv = (data.content.length + data.sign.length - 66) % 66;
            n += nc;
            if (nv > 0) {
                n += 1;
            }
            data.splitCount = n;
        } else {
            data.splitCount = 1;
        }
        var findSign = {account: data.account, name: '【' + data.sign + '】'};
        mongo.db('cc').collection(constants.DB.cc.app_sms_sign).findOne(findSign, function (err, signDoc) {
            if (!err) {
                if (signDoc) {
                    mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, accDoc) {
                        if (err) {
                            result.flag = "99";
                            result.message = "获取账号失败";
                            callback(result);
                            return;
                        }
                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: data.account + '_cc'}, function (err, accProDoc) {
                            if (err) {
                                result.flag = "99";
                                result.message = "获取账号cc产品失败";
                                callback(result);
                                return;
                            }
                            if (accProDoc) {
                                if (accProDoc.smsInterfacePassword) {
                                    if (data.password != accProDoc.smsInterfacePassword) {
                                        result.flag = "08";
                                        result.message = "短信接口密码错误";
                                        callback(result);
                                        return;
                                    }
                                } else {
                                    result.flag = "09";
                                    result.message = "您的账号未开通发短信HTTP接口";
                                    callback(result);
                                    return;
                                }
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
                                    callback(result);
                                    return;
                                }
                                mongo.db().collection(constants.DB.platform_sms_channel).findOne({forceSelect: true}, function (err, doc) {
                                    if (doc) {
                                        data.smsChannel = doc._id;
                                    } else {
                                        if (accProDoc.smsChannel) {
                                            data.smsChannel = accProDoc.smsChannel;
                                        } else {
                                            data.smsChannel = 'gdty';
                                        }
                                    }
                                    if (data.smsChannel == 'gd' || data.smsChannel == 'gdyzm' || data.smsChannel == 'ymnew' || data.smsChannel == 'jz') {
                                        if (data.content.length > 500) {
                                            result.flag = "02";
                                            result.message = "内容为空或内容过长";
                                            callback(result);
                                            return;
                                        }
                                    } else {
                                        if (data.content.length > 280) {
                                            result.flag = "02";
                                            result.message = "内容为空或内容过长";
                                            callback(result);
                                            return;
                                        }
                                    }
                                    data._id = utils.UUID.generateUuid();
                                    data.createUser = 'interface';
                                    data.m7Status = "ready";
                                    data.signDisplay = signDoc.name;
                                    data.sign = signDoc.subcode;
                                    data.submitTime = utils.DateTime.getCurrentDateTime();
                                    data.product = "cc";
                                    data.type = "send";
                                    if (data.isBatch) {
                                        delete data.num;
                                    }
                                    mongo.db('cc').collection(constants.DB.cc.app_sms_send).insert(data, function (err) {
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
                                                mongo.db(accProDoc.dataDB).collection(data.account + '_sms').insert(data, function (nerr) {
                                                    if (nerr) {
                                                        result.flag = '99';
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
                                });
                            } else {
                                result.flag = "99";
                                result.message = "未找到这个账号的呼叫中心产品";
                                callback(result);
                                return;
                            }
                        });
                    });
                } else {
                    result.flag = "11";
                    result.message = "此签名未备案";
                    callback(result);
                    return;
                }
            } else {
                result.flag = "99";
                result.message = "服务端内部错误";
                callback(result);
                return;
            }
        });
    },
    getSmsTemplate: function (data, callback) {
        var result = {success: false};
        if (!data.account || data.account == '') {
            result.flag = "04";
            result.message = "账号为空";
            callback(result);
            return;
        }
        if (!data.password || data.password == '') {
            result.flag = "05";
            result.message = "密码为空";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: data.account + '_cc'}, function (err, accProDoc) {
            if (err) {
                result.flag = "99";
                result.message = "获取账号cc产品失败";
                callback(result);
                return;
            }
            if (accProDoc) {
                if (accProDoc.templateSmsInterfacePassword) {
                    if (data.password != accProDoc.templateSmsInterfacePassword) {
                        result.flag = "08";
                        result.message = "短信接口密码错误";
                        callback(result);
                        return;
                    }
                } else {
                    result.flag = "09";
                    result.message = "您的账号未开通发短信HTTP接口";
                    callback(result);
                    return;
                }
                mongo.db('cc').collection(constants.DB.cc.app_sms_sign).find({account: data.account}).toArray(function (err, signList) {
                    if (err) {
                        result.flag = "99";
                        result.message = "获取账号短信模板失败";
                        callback(result);
                        return;
                    }
                    var signMap = {};
                    for (var i = 0; i < signList.length; i++) {
                        signMap[signList[i]._id] = signList[i];
                    }
                    mongo.db('cc').collection(constants.DB.cc.app_sms_template).find({account: data.account}, {
                        "name": 1,
                        "content": 1,
                        "sign": 1,
                        "num": 1,
                        "vars": 1
                    }).toArray(function (err, list) {
                        if (err) {
                            result.flag = "99";
                            result.message = "获取账号短信模板失败";
                            callback(result);
                            return;
                        }
                        for (var i = 0; i < list.length; i++) {
                            list[i].sign = signMap[list[i].sign].name;
                        }
                        result.success = true;
                        result.data = list;
                        callback(result);
                    });
                });
            } else {
                result.flag = "99";
                result.message = "未找到这个账号的呼叫中心产品";
                callback(result);
                return;
            }
        });
    },
    sendInterfaceTemplateSms: function (data, callback) {
        var result = {success: false};
        if (!data.templateNum || data.templateNum == '') {
            result.flag = "01";
            result.message = "模板编号为空";
            callback(result);
            return;
        }
        if (!data.num || data.num == '') {
            result.flag = "03";
            result.message = "手机号码为空";
            callback(result);
            return;
        }
        if (!data.account || data.account == '') {
            result.flag = "04";
            result.message = "账号为空";
            callback(result);
            return;
        }
        if (!data.hangupsms || data.hangupsms == '') {
            data.hangupsms = "";
            if (!data.password || data.password == '') {
                result.flag = "05";
                result.message = "密码为空";
                callback(result);
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
            callback(result);
            return;
        }
        if (numArr) {
            for (var i = 0; i < numArr.length; i++) {
                var patrn = /^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
                if (!patrn.exec(numArr[i]) || numArr[i].length != 11) {
                    result.flag = "07";
                    result.message = "含有不正确的手机号码，请检查";
                    callback(result);
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
                callback(result);
                return;
            }
        }
        var findtemplate = {_id: data.account + "_" + data.templateNum};
        mongo.db('cc').collection(constants.DB.cc.app_sms_template).findOne(findtemplate, function (err, templateDoc) {
            if (err) {
                result.flag = "99";
                result.message = "服务端内部错误";
                callback(result);
                return;
            }
            if (!templateDoc) {
                result.flag = "12";
                result.message = "未找到对应的短信模板";
                callback(result);
                return;
            }
            var findSign = {_id: templateDoc.sign};
            mongo.db('cc').collection(constants.DB.cc.app_sms_sign).findOne(findSign, function (err, signDoc) {
                if (!err) {
                    if (signDoc) {
                        mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, accDoc) {
                            if (err) {
                                result.flag = "99";
                                result.message = "获取账号失败";
                                callback(result);
                                return;
                            }
                            mongo.db().collection(constants.DB.platform_account_product).findOne({_id: data.account + '_cc'}, function (err, accProDoc) {
                                if (err) {
                                    result.flag = "99";
                                    result.message = "获取账号cc产品失败";
                                    callback(result);
                                    return;
                                }
                                if (accProDoc) {
                                    if (!data.hangupsms) {
                                        if (!accProDoc.templateSmsInterfacePassword) {
                                            result.flag = "09";
                                            result.message = "您的账号未开通发短信HTTP接口";
                                            callback(result);
                                            return;
                                        } else {
                                            if (data.password != accProDoc.templateSmsInterfacePassword) {
                                                result.flag = "08";
                                                result.message = "短信接口密码错误";
                                                callback(result);
                                                return;
                                            }
                                        }
                                    } else {
                                        if (data.hangupsms != utils.md5(data.account)) {
                                            if (!accProDoc.templateSmsInterfacePassword) {
                                                result.flag = "09";
                                                result.message = "您的账号未开通发短信HTTP接口";
                                                callback(result);
                                                return;
                                            } else {
                                                if (!data.password||data.password != accProDoc.templateSmsInterfacePassword) {
                                                    result.flag = "08";
                                                    result.message = "短信接口密码错误";
                                                    callback(result);
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
                                        }
                                    }
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
                                        callback(result);
                                        return;
                                    }
                                    //check templateSmsChannel
                                    if (templateDoc.smsChannel.length > 0) {
                                        data.smsChannel = templateDoc.smsChannel[0];
                                    } else {
                                        result.flag = "13";
                                        result.message = "此模板异常，无法发送短信";
                                        callback(result);
                                        return;
                                    }
                                    if (data.smsChannel == 'ymnew' || data.smsChannel == 'jz') {
                                        if (data.content.length > 500) {
                                            result.flag = "02";
                                            result.message = "内容为空或内容过长";
                                            callback(result);
                                            return;
                                        }
                                    } else {
                                        if (data.content.length > 280) {
                                            result.flag = "02";
                                            result.message = "内容为空或内容过长";
                                            callback(result);
                                            return;
                                        }
                                    }
                                    data._id = utils.UUID.generateUuid();
                                    data.createUser = 'interface';
                                    if (data.hangupsms == utils.md5(data.account)) {
                                        data.createUser = 'hangupSMS'
                                    }
                                    data.m7Status = "ready";
                                    data.signDisplay = signDoc.name;
                                    data.sign = signDoc.subcode;
                                    data.submitTime = utils.DateTime.getCurrentDateTime();
                                    data.product = "cc";
                                    data.type = "send";
                                    if (data.isBatch) {
                                        delete data.num;
                                    }
                                    if (!templateDoc.operatorStrategy) {
                                        insertSend(accProDoc,data,templateDoc,callback);
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
                                                var param = utils.matchingOperator(numArr[i]);
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
                                        recursive(accProDoc,numsArray,data,templateDoc,callback);
                                    }
                                } else {
                                    result.flag = "99";
                                    result.message = "未找到这个账号的呼叫中心产品";
                                    callback(result);
                                    return;
                                }
                            });
                        });
                    } else {
                        result.flag = "11";
                        result.message = "此签名未备案";
                        callback(result);
                        return;
                    }
                } else {
                    result.flag = "99";
                    result.message = "服务端内部错误";
                    callback(result);
                    return;
                }
            });
        });
    }
};
function recursive (accProDoc,obj,data,templateDoc,callback) {
    var result = {
        success: false
    }
    if (obj.length > 0) {
        data._id = utils.UUID.generateUuid();
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
}
function insertSend (accProDoc,data,templateDoc,callback) {
    var result = {
        success:false
    }
    if(data.smsChannel=='ytx'||data.smsChannel=='ytxyx'){
        var query = {_id:templateDoc._id};
        mongo.db().collection(constants.DB.bill_ytx_template_id).findOne(query, function (err,doc) {
            if(err){
                result.message = "query ytxid cc db failed!";
                result.errorNum = data.num;
                callback(result);
            }else {
                data.ytxtemplateid = doc.ytxtemplateid;
                mongo.db('cc').collection(constants.DB.cc.app_sms_send).insert(data, function (err) {
                    if (err) {
                        result.flag = '99';
                        result.message = "sms insert cc db failed!";
                        result.errorNum = data.num;
                        callback(result);
                    } else {
                        if (data.isBatch) {
                            result.success = true;
                            result.flag = '00';
                            result.msgid = data._id;
                            result.message = '短信提交成功';
                            callback(result);
                        } else {
                            mongo.db(accProDoc.dataDB).collection(data.account + '_sms').insert(data, function (nerr) {
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
        mongo.db('cc').collection(constants.DB.cc.app_sms_send).insert(data, function (err) {
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
                    mongo.db(accProDoc.dataDB).collection(data.account + '_sms').insert(data, function (nerr) {
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
};
module.exports = handler;

