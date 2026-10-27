var util = require("appUtil/Utils");
var log = require("appLog");
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/com/common/RedisKeyPrefix');
var rateLimitConfig = require(__baseDir + '/com/common/rateLimitConfig');

var service = {
    getTemplate : function(req, res){
        var result = {code:200, message:'success!'};
        restUtil.restAuthorization(req, res,function(authorization){
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","customer","getTemplate",data.account,function(rateLimitreply){
                   if(rateLimitreply.state){
                       mongo.ccDb("cc").collection("customer_template").findOne({account:data.account}, function(err, doc) {
                           if (err) {
                               result = {code:500, message:'server has error!'};
                               util.sendResult(result, res, req.id());
                               return;
                           }
                           if(doc){
                               var data = {};
                               data.version = doc.version;
                               data.template_type = doc.template_type;
                               data.status = doc.status;
                               data.source = [];
                               data.stable_fields = [];
                               data.custom_fields = [];
                               var source = doc.source;
                               for(var j=0 ;j<source.length; j++){
                                   data.source.push(source[j].name);
                               }
                               var stable_fields = doc.stable_fields;
                               for(var i=0; i<stable_fields.length; i++){
                                   var temp_stable_field = stable_fields[i];
                                   if(temp_stable_field.name == "phone"){
                                       temp_stable_field.example = JSON.parse('[{"tel" : "130xxxxxxxx","memo" : "备注"}]');
                                   }
                                   if(temp_stable_field.name == "email"){
                                       temp_stable_field.example = JSON.parse('[{"email" : "example@163.com","memo" : "备注"}]');
                                   }
                                   if(temp_stable_field.name == "weixin"){
                                       temp_stable_field.example = JSON.parse('[{"num" : "example001","memo" : "备注"}]');
                                   }
                                   delete temp_stable_field.search;
                                   delete temp_stable_field.noupdate;
                                   data.stable_fields.push(temp_stable_field);
                               }
                               var custom_fields = doc.custom_fields;
                               for(var k=0; k<custom_fields.length; k++){
                                   var temp_custom_fields = custom_fields[k];
                                   delete temp_custom_fields._id;
                                   delete temp_custom_fields.noupdate;
                                   data.custom_fields.push(temp_custom_fields);
                               }
                               result.data = data;
                               util.sendResult(result , res, req.id());
                               return;
                           }else{
                               result = {code : 400, message: 'Please check your parameters'};
                               util.sendResult(result , res, req.id());
                               return;
                           }
                       });
                   }else{
                       result = {code : 403, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                       util.sendResult(result, res, req.id());
                       return;
                   }
                });
            }
        });
    },
    insert: function(req, res){
        var result = {code:200, message:'success!'};
        restUtil.restAuthorization(req, res,function(authorization){
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","customer","insert",data.account,function(rateLimitreply){
                    if(rateLimitreply.state){
                        if(data.version && data.customers && data.customers.length>0){
                            var maxResultCount = rateLimitConfig["v20160818"]["customer"]["insert"].resultCount;
                            if(data.customers.length > maxResultCount){
                                result = {code:403, message:'Insert data amount is too many, max insert amount is '+maxResultCount};
                                util.sendResult(result, res, req.id());
                                return;
                            }else{
                                mongo.ccDb("cc").collection("customer_template").findOne({account:data.account}, function(err,doc) {
                                    if(err){
                                        result = {code:500, message:'server has error!'};
                                        util.sendResult(result, res, req.id());
                                        return;
                                    }
                                    if(doc && data.version == doc.version){
                                        var errorData = [];
                                        var count = 0;
                                        for(var i=0; i<data.customers.length; i++){
                                            self.checkAddCustomerData(data.customers[i],data.account,data.version,doc,function(reply){
                                                count += 1;
                                                if(reply.err){
                                                    errorData.push(reply.data);
                                                }
                                                if(count == data.customers.length){
                                                    if(errorData.length>0){
                                                        result.errorData = errorData;
                                                        result.code = 210;
                                                        result.message = "has some error data";
                                                        util.sendResult(result , res, req.id());
                                                        return;
                                                    }else{
                                                        util.sendResult(result , res, req.id());
                                                        return;
                                                    }

                                                }
                                            });
                                        }
                                    }else{
                                        result = {code : 400, message: 'Please check your parameters'};
                                        util.sendResult(result , res, req.id());
                                        return;
                                    }
                                });
                            }
                        }else{
                            result = {code : 400, message: 'Please check your parameters'};
                            util.sendResult(result , res, req.id());
                            return;
                        }
                    }else{
                        result = {code : 403, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                        util.sendResult(result, res, req.id());
                        return;
                    }

                });

            }
        });
    },
    update: function(req,res){
        var result = {code : 400, message: 'Please check your parameters'};
        restUtil.restAuthorization(req, res,function(authorization){
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","customer","update",data.account ,function(rateLimitreply){
                    if(rateLimitreply.state){
                        if(data.customer && data.customer._id && data.customer.version){
                            mongo.ccDb().collection("platform_account_product").findOne({account:data.account},function(err,accountProduct) {
                                if(err){
                                    result = {code:500, message:'server has error!'};
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                                if(accountProduct){
                                    mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").findOne({_id:data.customer._id},function(err,customer) {
                                        if (err) {
                                            result = {code:500, message:'server has error!'};
                                            util.sendResult(result, res, req.id());
                                            return;
                                        }
                                        if(customer){
                                            mongo.ccDb("cc").collection("customer_template").findOne({account:data.account,version:data.customer.version}, function(err,customerTemplate) {
                                                if(err){
                                                    result = {code:500, message:'server has error!'};
                                                    util.sendResult(result, res, req.id());
                                                    return;
                                                }
                                                if(customerTemplate){

                                                    var conditions = [];
                                                    var unique_phone = customerTemplate.unique_phone;
                                                    var unique_name = customerTemplate.unique_name;

                                                    if(unique_phone && data.customer.phone && data.customer.phone.length>0) {
                                                        var phoneCondition = {};
                                                        var phone = [];
                                                        for (var i = 0; i < data.customer.phone.length; i++) {
                                                            if(data.customer.phone[i].tel){
                                                                phone.push(data.customer.phone[i].tel);
                                                            }
                                                        }
                                                        phoneCondition["phone.tel"] = {
                                                            $in: phone
                                                        };
                                                        conditions.push(phoneCondition);
                                                    }

                                                    if(unique_name && data.customer.name){
                                                        conditions.push({
                                                            "name": data.customer.name
                                                        });
                                                    }

                                                    var queryCondition = {};
                                                    if(conditions.length > 0){
                                                        queryCondition = {"$or":conditions};
                                                    }

                                                    mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").find(queryCondition).toArray(function (err, docs) {
                                                        if(err){
                                                            result = {code:500, message:'server has error!'};
                                                            util.sendResult(result, res, req.id());
                                                            return;
                                                        }
                                                        if(conditions.length > 0 && docs && docs.length>0){
                                                            result.message = 'this phone or name is already exist';
                                                            util.sendResult(result , res, req.id());
                                                            return;
                                                        }else{
                                                            var update = {
                                                                $set: {
                                                                    lastUpdateTime: util.getCurrentDate,
                                                                    custsource1: "",
                                                                    phone : [],
                                                                    email : [],
                                                                    weixin :[]
                                                                }
                                                            };
                                                            restUtil.checkProvinceCity(data.customer.province,data.customer.city,function(areaResult){

                                                                //source 来源
                                                                if(data.customer.source){
                                                                    var source = customerTemplate.source;
                                                                    if(source){
                                                                        for(var i=0; i<source.length; i++){
                                                                            if(data.customer.source == source[i].name){
                                                                                update.$set.custsource1 = source[i].key;
                                                                            }
                                                                        }
                                                                    }else{
                                                                        result.message = 'field source error';
                                                                        util.sendResult(result , res, req.id());
                                                                        return;
                                                                    }
                                                                }

                                                                //status 客户状态
                                                                if(data.customer.status){
                                                                    var status = customerTemplate.status;
                                                                    update.$set.status = "";
                                                                    for(var key in status){
                                                                        if(data.customer.status == key){
                                                                            update.$set.status == key;
                                                                        }
                                                                    }
                                                                    if(update.$set.status.status == ""){
                                                                        result.message = 'field status error';
                                                                        util.sendResult(result , res, req.id());
                                                                        return;
                                                                    }
                                                                }else{
                                                                    update.$set.status = "status0";
                                                                }

                                                                //customer_fields 客户自定义字段
                                                                var custom_fields = customerTemplate.custom_fields;
                                                                for(var i=0; i<custom_fields.length; i++) {
                                                                    var temp_custom_field = custom_fields[i];
                                                                    if(!temp_custom_field.noupdate){
                                                                        if(temp_custom_field.required){
                                                                            if(temp_custom_field.type == "dropdown" || temp_custom_field.type == "radio"){
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    update.$set[temp_custom_field._id] = "";
                                                                                    var choices =  temp_custom_field.choices;
                                                                                    for(var key in choices){
                                                                                        if(key == data.customer[temp_custom_field.name]){
                                                                                            update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_custom_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else if(temp_custom_field.type == "checkbox"){
                                                                                if(data.customer[temp_custom_field.name] && data.customer[temp_custom_field.name].length > 0) {
                                                                                    update.$set[temp_custom_field._id] = [];
                                                                                    var choices = temp_custom_field.choices;
                                                                                    var data_checkbox_fields = data.customer[temp_custom_field.name];
                                                                                    var keys = [];
                                                                                    for(var key in choices){
                                                                                        keys.push(key);
                                                                                    }
                                                                                    for(var j=0; j<data_checkbox_fields.length; j++){
                                                                                        for(var k=0; k<keys.length; k++){
                                                                                            if(data_checkbox_fields[j] == keys[k]){
                                                                                                keys.splice(k,1);
                                                                                                update.$set[temp_custom_field._id].push(data_checkbox_fields[j]);
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id].length != data_checkbox_fields.length){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_custom_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else if(temp_custom_field.type == "date"){
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    update.$set[temp_custom_field._id] = "";
                                                                                    if(util.isDateType(data.customer[temp_custom_field.name])){
                                                                                        update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_custom_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }

                                                                            }else if(temp_custom_field.type == "number"){
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    update.$set[temp_custom_field._id] = "";
                                                                                    if(util.isNum(data.customer[temp_custom_field.name])){
                                                                                        update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_custom_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                }else{
                                                                                    result.message = 'field ' + temp_custom_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }
                                                                        }else{
                                                                            if(temp_custom_field.type == "dropdown" || temp_custom_field.type == "radio"){
                                                                                update.$set[temp_custom_field._id] = "";
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    var choices = temp_custom_field.choices;
                                                                                    for(var key in choices){
                                                                                        if(key == data.customer[temp_custom_field.name]){
                                                                                            update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }else if(temp_custom_field.type == "checkbox"){
                                                                                update.$set[temp_custom_field._id] = [];
                                                                                if(data.customer[temp_custom_field.name] && data.customer[temp_custom_field.name].length > 0) {
                                                                                    var choices = temp_custom_field.choices;
                                                                                    var data_checkbox_fields = data.customer[temp_custom_field.name];
                                                                                    var keys = [];
                                                                                    for(var key in choices){
                                                                                        keys.push(key);
                                                                                    }
                                                                                    for(var j=0; j<data_checkbox_fields.length; j++){
                                                                                        for(var k=0; k<keys.length; k++){
                                                                                            if(data_checkbox_fields[j] == keys[k]){
                                                                                                keys.splice(k,1);
                                                                                                update.$set[temp_custom_field._id].push(data_checkbox_fields[j]);
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id].length != data_checkbox_fields.length){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }else if(temp_custom_field.type == "date"){
                                                                                update.$set[temp_custom_field._id] = "";
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    if(util.isDateType(data.customer[temp_custom_field.name])){
                                                                                        update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }else if(temp_custom_field.type == "number"){
                                                                                if(data.customer[temp_custom_field.name]){
                                                                                    update.$set[temp_custom_field._id] = "";
                                                                                    if(util.isNum(data.customer[temp_custom_field.name])){
                                                                                        update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name];
                                                                                    }
                                                                                    if(update.$set[temp_custom_field._id] == ""){
                                                                                        result.message = 'field ' + temp_custom_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }else{
                                                                                update.$set[temp_custom_field._id] = data.customer[temp_custom_field.name] || "";
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                                                //stable_fields 固定字段
                                                                var stable_fields = customerTemplate.stable_fields;
                                                                for(var i=0; i<stable_fields.length; i++){
                                                                    var temp_stable_field = stable_fields[i];
                                                                    if(!temp_stable_field.noupdate){
                                                                        if(temp_stable_field.name == 'phone'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer.phone && data.customer.phone.length>0){
                                                                                    for(var j=0; j<data.customer.phone.length; j++){
                                                                                        if(data.customer.phone[j].tel){
                                                                                            var tempPhone = {};
                                                                                            tempPhone.tel = data.customer.phone[j].tel;
                                                                                            tempPhone.memo = data.customer.phone[j].memo || "";
                                                                                            update.$set.phone.push(tempPhone);
                                                                                        }else{
                                                                                            result.message = 'field ' + temp_stable_field.name +' error';
                                                                                            util.sendResult(result, res, req.id());
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                if(data.customer.phone && data.customer.phone.length>0){
                                                                                    for(var j=0; j<data.customer.phone.length; j++){
                                                                                        if(data.customer.phone[j].tel){
                                                                                            var tempPhone = {};
                                                                                            tempPhone.tel = data.customer.phone[j].tel;
                                                                                            tempPhone.memo = data.customer.phone[j].memo || "";
                                                                                            update.$set.phone.push(tempPhone);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }else if(temp_stable_field.name == 'email'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer.email && data.customer.email.length>0){
                                                                                    for(var j=0; j<data.customer.email.length; j++){
                                                                                        if(data.customer.email[j].email){
                                                                                            var tempEmail = {};
                                                                                            tempEmail.email = data.customer.email[j].email;
                                                                                            tempPhone.memo = data.customer.email[j].memo || "";
                                                                                            update.$set.email.push(tempEmail);
                                                                                        }else{
                                                                                            result.message = 'field ' + temp_stable_field.name +' error';
                                                                                            util.sendResult(result , res, req.id());
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                if(data.customer.email && data.customer.email.length>0){
                                                                                    for(var j=0; j<data.customer.email.length; j++){
                                                                                        if(data.customer.email[j].email){
                                                                                            var tempEmail = {};
                                                                                            tempEmail.email = data.customer.email[j].email;
                                                                                            tempPhone.memo = data.customer.email[j].memo || "";
                                                                                            update.$set.email.push(tempEmail);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }else if(temp_stable_field.name == 'weixin'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer.weixin && data.customer.weixin.length>0){
                                                                                    for(var j=0; j<data.customer.weixin.length; j++){
                                                                                        if(data.customer.weixin[j].num){
                                                                                            var tempWeixin = {};
                                                                                            tempWeixin.num = data.customer.weixin[j].num;
                                                                                            tempWeixin.memo = data.customer.weixin[j].memo || "";
                                                                                            update.$set.weixin.push(tempWeixin);
                                                                                        }else{
                                                                                            result.message = 'field ' + temp_stable_field.name +' error';
                                                                                            util.sendResult(result , res, req.id());
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                }else{                                                                                            result.message = 'field' + temp_stable_field.name +'err';
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                if(data.customer.weixin && data.customer.weixin.length>0){
                                                                                    for(var j=0; j<data.customer.weixin.length; j++){
                                                                                        if(data.customer.weixin[j].num){
                                                                                            var tempWeixin = {};
                                                                                            tempWeixin.num = data.customer.weixin[j].num;
                                                                                            tempWeixin.memo = data.customer.weixin[j].memo || "";
                                                                                            update.$set.weixin.push(tempWeixin);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }else if(temp_stable_field.name == 'birth'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer.birth){
                                                                                    if(util.isDateType(data.customer.birth)){
                                                                                        update.$set.birth = data.customer.birth;
                                                                                    }else{
                                                                                        result.message = 'field ' + temp_stable_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                update.$set.birth = "";
                                                                                if(data.customer.birth){
                                                                                    if(util.isDateType(data.customer.birth)){
                                                                                        update.$set.birth = data.customer.birth;
                                                                                    }else{
                                                                                        result.message = 'field ' + temp_stable_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }else if(temp_stable_field.name == 'sex'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer.sex == "0" || data.customer.sex == "1"){
                                                                                    update.$set.sex = data.customer.sex;
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                if(data.customer.sex){
                                                                                    if(data.customer.sex == "0" || data.customer.sex == "1"){
                                                                                        update.$set.sex = data.customer.sex;
                                                                                    }else{
                                                                                        result.message = 'field ' + temp_stable_field.name +' error';
                                                                                        util.sendResult(result , res, req.id());
                                                                                        return;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }else if(temp_stable_field.name == 'name' || temp_stable_field.name == 'title' ||
                                                                            temp_stable_field.name == 'address' || temp_stable_field.name == 'note' ||
                                                                            temp_stable_field.name == 'age' || temp_stable_field.name == 'web'){
                                                                            if(temp_stable_field.required){
                                                                                if(data.customer[temp_stable_field.name]){
                                                                                    update.$set[temp_stable_field.name] = data.customer[temp_stable_field.name];
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                update.$set[temp_stable_field.name] = data.customer[temp_stable_field.name] || "";
                                                                            }
                                                                        }else if(temp_stable_field.name == 'province'){
                                                                            if(temp_stable_field.required){
                                                                                if(areaResult.provinceKey){
                                                                                    update.$set.province = areaResult.provinceKey;
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                update.$set.province = areaResult.provinceKey || "";
                                                                            }
                                                                        }else if(temp_stable_field.name == 'city'){
                                                                            if(temp_stable_field.required){
                                                                                if(areaResult.cityKey){
                                                                                    update.$set.city = areaResult.cityKey;
                                                                                }else{
                                                                                    result.message = 'field ' + temp_stable_field.name +' error';
                                                                                    util.sendResult(result , res, req.id());
                                                                                    return;
                                                                                }
                                                                            }else{
                                                                                update.$set.city = areaResult.cityKey || "";
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                if(data.customer.owner){
                                                                    mongo.ccDb().collection("platform_user").findOne({"account" : data.account, "exten": data.customer.owner},function(err, owner) {
                                                                        if (err) {
                                                                            result = {code:500, message:'server has error!'};
                                                                            util.sendResult(result, res, req.id());
                                                                            return;
                                                                        }
                                                                        if (owner) {
                                                                            update.$set.owner = owner._id;
                                                                        }
                                                                        mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").update({_id: data.customer._id}, update, function (err) {
                                                                            if (err) {
                                                                                result = {code:500, message:'server has error!'};
                                                                                util.sendResult(result, res, req.id());
                                                                                return;
                                                                            }
                                                                            result = {code:200, message:'success!'};
                                                                            util.sendResult(result, res, req.id());
                                                                            return;
                                                                        });
                                                                    });
                                                                }else{
                                                                    mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").update({_id: data.customer._id}, update, function (err) {
                                                                        if (err) {
                                                                            result = {code:500, message:'server has error!'};
                                                                            util.sendResult(result, res, req.id());
                                                                            return;
                                                                        }
                                                                        result = {code:200, message:'success!'};
                                                                        util.sendResult(result, res, req.id());
                                                                        return;
                                                                    });
                                                                }
                                                            });
                                                        }

                                                    });
                                                }else{
                                                    util.sendResult(result , res, req.id());
                                                    return;
                                                }
                                            });
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    });
                                }else{
                                    util.sendResult(result , res, req.id());
                                    return;
                                }
                            });
                        }else{
                            util.sendResult(result , res, req.id());
                            return;
                        }

                    }else{
                        result = {code : 403, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }
        });
    },

    delete: function(req,res){
        var result = {code: 400, message: 'Please check your parameters'};
        restUtil.restAuthorization(req, res,function(authorization){
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","customer","delete",data.account,function(rateLimitreply){
                   if(rateLimitreply.state){
                       if(data.ids && data.ids.length>0){
                           var maxResultCount = rateLimitConfig["v20160818"]["customer"]["delete"].resultCount;
                           if(data.ids.length > maxResultCount){
                               result = {code:403, message:'Delete data amount is too many, max delete amount is '+maxResultCount};
                               util.sendResult(result, res, req.id());
                               return;
                           }else{
                               mongo.ccDb().collection("platform_account_product").findOne({account:data.account},function(err,accountProduct) {
                                   if (err) {
                                       result = {code:500, message:'server has error!'};
                                       util.sendResult(result, res, req.id());
                                       return;
                                   }
                                   if(accountProduct){
                                       var errorData = {};
                                       errorData.ids = [];
                                       var count = 0;
                                       var safeDel = accountProduct.safeDel||"0";
                                       if(safeDel == "1"){
                                           var dtime = util.getCurrentDate();
                                           for(var i=0; i<data.ids.length; i++){
                                               (function(i){
                                                   mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").findOne({_id:data.ids[i]},function(err,doc){
                                                       if(err) {
                                                           result = {code:500, message:'server has error!'};
                                                           util.sendResult(result, res, req.id());
                                                           return;
                                                       }
                                                       if(doc){
                                                           doc.dtime = dtime;
                                                           mongo.ccDb("cc").collection("app_customer_delstore").insert(doc,function(err){
                                                               if(err){
                                                                   result = {code:500, message:'server has error!'};
                                                                   util.sendResult(result, res, req.id());
                                                                   return;
                                                               }else{
                                                                   mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").remove({_id: doc._id}, function (err) {
                                                                       count += 1;
                                                                       if(err){
                                                                           result = {code:500, message:'server has error!'};
                                                                           util.sendResult(result, res, req.id());
                                                                           return;
                                                                       }
                                                                       if(count == data.ids.length){
                                                                           if(errorData.ids.length>0){
                                                                               result.errotData = errorData;
                                                                               result.code = 210;
                                                                               result.message = "has some error data";
                                                                               util.sendResult(result, res, req.id());
                                                                               return;
                                                                           }else{
                                                                               result = {code:200, message:'success!'};
                                                                               util.sendResult(result, res, req.id());
                                                                               return;
                                                                           }
                                                                       }
                                                                   });
                                                               }
                                                           });



                                                       }else{
                                                           count += 1;
                                                           errorData.ids.push(data.ids[i]);
                                                           if(count == data.ids.length){
                                                               result.errotData = errorData;
                                                               result.code = 210;
                                                               result.message = "has some error data";
                                                               util.sendResult(result, res, req.id());
                                                               return;
                                                           }
                                                       }
                                                   });
                                               })(i);
                                           }
                                       }else{
                                           for(var i=0; i<data.ids.length; i++){
                                               (function(i){
                                                   mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").findOne({_id:data.ids[i]},function(err,doc){
                                                       if(err) {
                                                           result = {code:500, message:'server has error!'};
                                                           util.sendResult(result, res, req.id());
                                                           return;
                                                       }
                                                       if(doc){
                                                           mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").remove({_id: doc._id}, function (err) {
                                                               count += 1;
                                                               if(err){
                                                                   result = {code:500, message:'server has error!'};
                                                                   util.sendResult(result, res, req.id());
                                                                   return;
                                                               }
                                                               if(count == data.ids.length){
                                                                   if(errorData.ids.length>0){
                                                                       result.errotData = errorData;
                                                                       result.code = 210;
                                                                       result.message = "has some error data";
                                                                       util.sendResult(result, res, req.id());
                                                                       return;
                                                                   }else{
                                                                       result = {code:200, message:'success!'};
                                                                       util.sendResult(result, res, req.id());
                                                                       return;
                                                                   }
                                                               }
                                                           });
                                                       }else{
                                                           count += 1;
                                                           errorData.ids.push(data.ids[i]);
                                                           if(count == data.ids.length){
                                                               result.errotData = errorData;
                                                               result.code = 210;
                                                               result.message = "has some error data";
                                                               util.sendResult(result, res, req.id());
                                                               return;
                                                           }
                                                       }
                                                   });
                                               })(i);
                                           }
                                       }
                                   }else{
                                       util.sendResult(result , res, req.id());
                                       return;
                                   }

                               });
                           }
                       }else{
                           util.sendResult(result , res, req.id());
                           return;
                       }
                   }else{
                       result = {code:403, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                       util.sendResult(result, res, req.id());
                       return;
                   }
                });

            }
        });
    },
    select: function(req,res){
        var result = {code: 400, message: 'Please check your parameters'};
        restUtil.restAuthorization(req, res,function(authorization){
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","customer","select",data.account,function(rateLimitreply){
                    if(rateLimitreply.state){
                        if(data.version){
                            mongo.ccDb().collection("platform_account_product").findOne({account:data.account},function(err,accountProduct){
                                if(err) {
                                    result = {code:500, message:'server has error!'};
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                                if(accountProduct){
                                    var condition = {};
                                    condition.accountId = data.account;
                                    if(data.beginCreateTime && data.endCreateTime){
                                        if(util.isDateType(data.beginCreateTime) && util.isDateType(data.endCreateTime)
                                            && data.endCreateTime > data.beginCreateTime){
                                            condition.createTime = {
                                                $gte: data.beginCreateTime + " 00:00:00",
                                                $lte: data.endCreateTime + " 00:00:00"
                                            };
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    }else if(data.beginCreateTime && !data.endCreateTime){
                                        if(util.isDateType(data.beginCreateTime)){
                                            condition.createTime = {
                                                $gte: data.beginCreateTime + " 00:00:00"
                                            };
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    }else if(!data.beginCreateTime && data.endCreateTime){
                                        if(util.isDateType(data.endCreateTime)){
                                            condition.createTime = {
                                                $lte: data.endCreateTime + " 00:00:00"
                                            };
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    }

                                    if(data._id){
                                        condition._id = data._id;
                                    }

                                    if(data.name){
                                        condition.name = data.name;
                                    }

                                    if(data.phone){
                                        condition["phone.tel"] = data.phone;
                                    }

                                    var maxResultCount = rateLimitConfig["v20160818"]["customer"]["select"].resultCount;
                                    var limit = maxResultCount;
                                    var page = 1;

                                   if(data.page){
                                        if(util.isNum(data.page)){
                                            page = data.page;
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    }
                                    if(data.pageSize){
                                        if(util.isNum(data.pageSize)){
                                            if(data.pageSize > maxResultCount){
                                                util.sendResult(result , res, req.id());
                                                return;
                                            }else{
                                                limit =  data.pageSize;
                                            }
                                        }else{
                                            util.sendResult(result , res, req.id());
                                            return;
                                        }
                                    }
                                    var skip = (page - 1) * limit;

                                    mongo.ccDb(accountProduct.dataDB).collection(data.account+"_customer").find(condition,{sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                                        if(err){
                                            result = {code:500, message:'server has error!'};
                                            util.sendResult(result, res, req.id());
                                            return;
                                        }
                                        if(docs){
                                            result = {code:200, message:'success!'};
                                            if(docs.length>0){
                                                mongo.ccDb("cc").collection("app_optiondic").findOne({accountId:"system"}, function(err,optiondic) {
                                                    if(err){
                                                        result = {code:500, message:'server has error!'};
                                                        util.sendResult(result, res, req.id());
                                                        return;
                                                    }
                                                    if(optiondic){
                                                        var provinceOptions = optiondic.options;
                                                        mongo.ccDb("cc").collection("customer_template").findOne({account:data.account,version:data.version}, function(err, template) {
                                                            if(err){
                                                                result = {code:500, message:'server has error!'};
                                                                util.sendResult(result, res, req.id());
                                                                return;
                                                            }
                                                            if(template){

                                                                var source  = template.source;
                                                                var resultCustomers = [];

                                                                for(var i=0; i<docs.length; i++){
                                                                    var resultCustomer = {};
                                                                    var tempCustomer = docs[i];
                                                                    var custsource1 = tempCustomer.custsource1;

                                                                    resultCustomer._id = docs[i]._id;
                                                                    resultCustomer.status = docs[i].status;
                                                                    resultCustomer.name = docs[i].name;
                                                                    resultCustomer.title = docs[i].title;
                                                                    resultCustomer.phone = docs[i].phone;
                                                                    resultCustomer.email = docs[i].email;
                                                                    resultCustomer.weixin = docs[i].weixin;
                                                                    resultCustomer.province = docs[i].province;
                                                                    resultCustomer.city = docs[i].city;
                                                                    resultCustomer.address = docs[i].address;
                                                                    resultCustomer.note = docs[i].note;
                                                                    resultCustomer.web = docs[i].web;
                                                                    resultCustomer.createTime = docs[i].createTime;
                                                                    resultCustomer.lastUpdateTime = docs[i].lastUpdateTime;

                                                                    if(template.template_type === "personal"){
                                                                        resultCustomer.sex = docs[i].sex;
                                                                        resultCustomer.age = docs[i].age;
                                                                        resultCustomer.birth = docs[i].birth;
                                                                    }


                                                                    if(custsource1){
                                                                        for(var k=0; k<source.length; k++){
                                                                            if(source[k].key == custsource1){
                                                                                resultCustomer.source = source[k].name;
                                                                                break;
                                                                            }
                                                                        }
                                                                    }

                                                                    if(template.custom_fields && template.custom_fields.length>0){
                                                                        var custom_fields = template.custom_fields;
                                                                        for(var j=0; j<custom_fields.length; j++){
                                                                            var temp_custom_field = custom_fields[j];
                                                                            resultCustomer[temp_custom_field.name] = docs[i][temp_custom_field._id];
                                                                        }

                                                                    }

                                                                    if(docs[i].province){
                                                                        for(var k=0;k<provinceOptions.length;k++){
                                                                            if(docs[i].province == provinceOptions[k].key ){
                                                                                var provinceName = provinceOptions[k].name;
                                                                                if(docs[i].city){
                                                                                    var cityOptions = provinceOptions[k].options;
                                                                                    for(var m=0;m<cityOptions.length;m++){
                                                                                        if(docs[i].city == cityOptions[m].key){
                                                                                            resultCustomer.city = cityOptions[m].name;
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                    resultCustomer.province = provinceName;
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }

                                                                    }
                                                                    resultCustomers.push(resultCustomer);
                                                                }

                                                            }
                                                            var resultData =  {};
                                                            resultData.count = resultCustomers.length;
                                                            resultData.customers = resultCustomers;
                                                            result.data = resultData;
                                                            util.sendResult(result, res, req.id());
                                                            return;
                                                        });
                                                    }
                                                });
                                            }else{
                                                var resultData =  {};
                                                resultData.count = docs.length;
                                                result.data = resultData;
                                                util.sendResult(result, res, req.id());
                                                return;
                                            }
                                        }
                                    });

                                }else{
                                    util.sendResult(result , res, req.id());
                                    return;
                                }
                            });
                        }else{
                            util.sendResult(result , res, req.id());
                            return;
                        }
                    }else{
                        result = {code : 400, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }
        });

    }
};



var self = {
    checkAddCustomerData: function(data,account,version,doc,callback){
        var reply = {err:true};

        var conditions = [];
        var unique_phone = doc.unique_phone;
        var unique_name = doc.unique_name;

        if(unique_phone && data.phone && data.phone.length>0) {
            var phoneCondition = {};
            var phone = [];
            for (var i = 0; i < data.phone.length; i++) {
                if(data.phone[i].tel){
                    phone.push(data.phone[i].tel);
                }
            }
            phoneCondition["phone.tel"] = {
                $in: phone
            };
            conditions.push(phoneCondition);
        }

        if(unique_name && data.name){
            conditions.push({
                "name": data.name
            });
        }

        var queryCondition = {};
        if(conditions.length > 0){
            queryCondition = {"$or":conditions};
        }

        mongo.ccDb().collection("platform_account_product").findOne({account:account},function(err,accountProduct) {
            if(err){
                result = {code:500, message:'server has error!'};
                util.sendResult(result, res, req.id());
                callback(reply);
                return;
            }
            if(accountProduct){
                mongo.ccDb(accountProduct.dataDB).collection(account+"_customer").find(queryCondition).toArray(function (err, docs) {
                    if(err){
                        result = {code:500, message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        callback(reply);
                        return;
                    }
                    if(conditions.length>0 && docs && docs.length>0){
                        data.errMessage = 'this phone or name is already exist';
                        reply.data = data;
                        callback(reply);
                        return;
                    }else{
                        var customerData = {};
                        customerData._id = util.UUID.generateUuid();
                        customerData.dbType = doc._id;
                        customerData.sysStatus = "0";
                        customerData.categoryId = "NA";
                        customerData.accountId = account;
                        customerData.actionType = "self";
                        customerData.custsource1 = "" ;
                        customerData.createTime = util.getCurrentDate();
                        customerData.lastUpdateTime = util.getCurrentDate();
                        customerData.attachs = [];
                        customerData.phone = [];
                        customerData.email = [];
                        customerData.weixin = [];

                        restUtil.checkProvinceCity(data.province,data.city,function(areaResult){

                            //source 来源
                            if(data.source){
                                var source = doc.source;
                                if(source){
                                    for(var i=0; i<source.length; i++){
                                        if(data.source == source[i].name){
                                            customerData.custsource1 = source[i].key;
                                            break;
                                        }
                                    }
                                }else{
                                    data.errMessage = 'field source error';
                                    reply.data = data;
                                    callback(reply);
                                    return;
                                }
                            }

                            //status 客户状态
                            if(data.status){
                                var status = doc.status;
                                customerData.status = "";
                                for(var key in status){
                                    if(data.status == key){
                                        customerData.status = key;
                                        break;
                                    }
                                }
                                if(customerData.status == ""){
                                    data.errMessage = 'field status error';
                                    reply.data = data;
                                    callback(reply);
                                    return;
                                }
                            }else{
                                customerData.status = "status0";
                            }

                            //customer_fields 客户自定义字段
                            var custom_fields = doc.custom_fields;
                            for(var i=0; i<custom_fields.length; i++) {
                                var temp_custom_field = custom_fields[i];
                                if(temp_custom_field.required){
                                    if(temp_custom_field.type == "dropdown" || temp_custom_field.type == "radio"){
                                        if(data[temp_custom_field.name]){
                                            customerData[temp_custom_field._id] = "";
                                            var choices =  temp_custom_field.choices;
                                            for(var key in choices){
                                                if(key == data[temp_custom_field.name]){
                                                    customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                                    break;
                                                }
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_custom_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else if(temp_custom_field.type == "checkbox"){
                                        if(data[temp_custom_field.name] && data[temp_custom_field.name].length > 0) {
                                            customerData[temp_custom_field._id] = [];
                                            var choices = temp_custom_field.choices;
                                            var data_checkbox_fields = data[temp_custom_field.name];
                                            var keys = [];
                                            for(var key in choices){
                                                keys.push(key);
                                            }
                                            for(var j=0; j<data_checkbox_fields.length; j++){
                                                for(var k=0; k<keys.length; k++){
                                                    if(data_checkbox_fields[j] == keys[k]){
                                                        keys.splice(k,1);
                                                        customerData[temp_custom_field._id].push(data_checkbox_fields[j]);
                                                        break;
                                                    }
                                                }
                                            }
                                            if(customerData[temp_custom_field._id].length != data_checkbox_fields.length){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_custom_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else if(temp_custom_field.type == "date"){
                                        if(data[temp_custom_field.name]){
                                            customerData[temp_custom_field._id] = "";
                                            if(util.isDateType(data[temp_custom_field.name])){
                                                customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_custom_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }

                                    }else if(temp_custom_field.type == "number"){
                                        if(data[temp_custom_field.name]){
                                            customerData[temp_custom_field._id] = "";
                                            if(util.isNum(data[temp_custom_field.name])){
                                                customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_custom_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        if(data[temp_custom_field.name]){
                                            customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                        }else{
                                            data.errMessage = 'field ' + temp_custom_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }
                                }else{
                                    if(temp_custom_field.type == "dropdown" || temp_custom_field.type == "radio"){
                                        customerData[temp_custom_field._id] = "";
                                        if(data[temp_custom_field.name]){
                                            var choices = temp_custom_field.choices;
                                            for(var key in choices){
                                                if(key == data[temp_custom_field.name]){
                                                    customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                                    break;
                                                }
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }else if(temp_custom_field.type == "checkbox"){
                                        customerData[temp_custom_field._id] = [];
                                        if(data[temp_custom_field.name] && data[temp_custom_field.name].length > 0) {
                                            var choices = temp_custom_field.choices;
                                            var data_checkbox_fields = data[temp_custom_field.name];
                                            var keys = [];
                                            for(var key in choices){
                                                keys.push(key);
                                            }
                                            for(var j=0; j<data_checkbox_fields.length; j++){
                                                for(var k=0; k<keys.length; k++){
                                                    if(data_checkbox_fields[j] == keys[k]){
                                                        keys.splice(k,1);
                                                        customerData[temp_custom_field._id].push(data_checkbox_fields[j]);
                                                        break;
                                                    }
                                                }
                                            }
                                            if(customerData[temp_custom_field._id].length != data_checkbox_fields.length){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }else if(temp_custom_field.type == "date"){
                                        customerData[temp_custom_field._id] = "";
                                        if(data[temp_custom_field.name]){
                                            if(util.isDateType(data[temp_custom_field.name])){
                                                customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }else if(temp_custom_field.type == "number"){
                                        if(data[temp_custom_field.name]){
                                            customerData[temp_custom_field._id] = "";
                                            if(util.isNum(data[temp_custom_field.name])){
                                                customerData[temp_custom_field._id] = data[temp_custom_field.name];
                                            }
                                            if(customerData[temp_custom_field._id] == ""){
                                                data.errMessage = 'field ' + temp_custom_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }else{
                                        customerData[temp_custom_field._id] = data[temp_custom_field.name] || "";
                                    }
                                }
                            }

                            //stable_fields 固定字段
                            var stable_fields = doc.stable_fields;
                            for(var i=0; i<stable_fields.length; i++){
                                var temp_stable_field = stable_fields[i];
                                if(temp_stable_field.name == 'phone'){
                                    if(temp_stable_field.required){
                                        if(data.phone && data.phone.length>0){
                                            for(var j=0; j<data.phone.length; j++){
                                                if(data.phone[j].tel){
                                                    var tempPhone = {};
                                                    tempPhone.tel = data.phone[j].tel;
                                                    tempPhone.memo = data.phone[j].memo || "";
                                                    customerData.phone.push(tempPhone);
                                                }else{
                                                    data.errMessage = 'field ' + temp_stable_field.name +' error';
                                                    reply.data = data;
                                                    callback(reply);
                                                    return;
                                                }
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        if(data.phone && data.phone.length>0){
                                            for(var j=0; j<data.phone.length; j++){
                                                if(data.phone[j].tel){
                                                    var tempPhone = {};
                                                    tempPhone.tel = data.phone[j].tel;
                                                    tempPhone.memo = data.phone[j].memo || "";
                                                    customerData.phone.push(tempPhone);
                                                }
                                            }
                                        }
                                    }
                                }else if(temp_stable_field.name == 'email'){
                                    if(temp_stable_field.required){
                                        if(data.email && data.email.length>0){
                                            for(var j=0; j<data.email.length; j++){
                                                if(data.email[j].email){
                                                    var tempEmail = {};
                                                    tempEmail.email = data.email[j].email;
                                                    tempPhone.memo = data.email[j].memo || "";
                                                    customerData.email.push(tempEmail);
                                                }else{
                                                    data.errMessage = 'field ' + temp_stable_field.name +' error';
                                                    reply.data = data;
                                                    callback(reply);
                                                    return;
                                                }
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        if(data.email && data.email.length>0){
                                            for(var j=0; j<data.email.length; j++){
                                                if(data.email[j].email){
                                                    var tempEmail = {};
                                                    tempEmail.email = data.email[j].email;
                                                    tempPhone.memo = data.email[j].memo || "";
                                                    customerData.email.push(tempEmail);
                                                }
                                            }
                                        }
                                    }
                                }else if(temp_stable_field.name == 'weixin'){
                                    if(temp_stable_field.required){
                                        if(data.weixin && data.weixin.length>0){
                                            for(var j=0; j<data.weixin.length; j++){
                                                if(data.weixin[j].num){
                                                    var tempWeixin = {};
                                                    tempWeixin.num = data.weixin[j].num;
                                                    tempWeixin.memo = data.weixin[j].memo || "";
                                                    customerData.weixin.push(tempWeixin);
                                                }else{
                                                    data.errMessage = 'field ' + temp_stable_field.name + ' error';
                                                    reply.data = data;
                                                    callback(reply);
                                                    return;
                                                }
                                            }
                                        }else{
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        if(data.weixin && data.weixin.length>0){
                                            for(var j=0; j<data.weixin.length; j++){
                                                if(data.weixin[j].num){
                                                    var tempWeixin = {};
                                                    tempWeixin.num = data.weixin[j].num;
                                                    tempWeixin.memo = data.weixin[j].memo || "";
                                                    customerData.weixin.push(tempWeixin);
                                                }
                                            }
                                        }
                                    }
                                }else if(temp_stable_field.name == 'birth'){
                                    if(temp_stable_field.required){
                                        if(data.birth){
                                            if(util.isDateType(data.birth)){
                                                customerData.birth = data.birth;
                                            }else{
                                                data.errMessage = 'field ' + temp_stable_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        customerData.birth = "";
                                        if(data.birth){
                                            if(util.isDateType(data.birth)){
                                                customerData.birth = data.birth;
                                            }else{
                                                data.errMessage = 'field ' + temp_stable_field.name +' error';
                                                reply.data = data;
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }

                                }else if(temp_stable_field.name == 'sex'){
                                    if(temp_stable_field.required){
                                        if(data.sex == "0" || data.sex == "1"){
                                            customerData.sex = data.sex;
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        if(data.sex){
                                            if(data.sex == "0" || data.sex == "1"){
                                                customerData.sex = data.sex;
                                            }else{
                                                callback(reply);
                                                return;
                                            }
                                        }
                                    }
                                }else if(temp_stable_field.name == 'name' || temp_stable_field.name == 'title' ||
                                    temp_stable_field.name == 'address' || temp_stable_field.name == 'note' ||
                                    temp_stable_field.name == 'age' ||  temp_stable_field.name == 'web'){
                                    if(temp_stable_field.required){
                                        if(data[temp_stable_field.name]){
                                            customerData[temp_stable_field.name] = data[temp_stable_field.name];
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        customerData[temp_stable_field.name] = data[temp_stable_field.name] || "";
                                    }
                                }else if(temp_stable_field.name == 'province'){
                                    if(temp_stable_field.required){
                                        if(areaResult.provinceKey){
                                            customerData.province = areaResult.provinceKey;
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        customerData.province = areaResult.provinceKey || "";
                                    }
                                }else if(temp_stable_field.name == 'city'){
                                    if(temp_stable_field.required){
                                        if(areaResult.cityKey){
                                            customerData.city = areaResult.cityKey;
                                        }else{
                                            data.errMessage = 'field ' + temp_stable_field.name +' error';
                                            reply.data = data;
                                            callback(reply);
                                            return;
                                        }
                                    }else{
                                        customerData.city = areaResult.cityKey || "";
                                    }
                                }
                            }
                            
                            if(data.owner){
                                mongo.ccDb().collection("platform_user").findOne({"account" : account, "exten": data.owner},function(err, owner){
                                    if(err){
                                        result = {code:500, message:'server has error!'};
                                        util.sendResult(result, res, req.id());
                                        callback(reply);
                                        return;
                                    }
                                    if(owner){
                                        customerData.owner = owner._id;
                                    }
                                    mongo.ccDb(accountProduct.dataDB).collection(account+"_customer").insert(customerData, function (err) {
                                        if (err) {
                                            result = {code:500, message:'server has error!'};
                                            util.sendResult(result, res, req.id());
                                            callback(reply);
                                            return;
                                        }
                                        reply.err = false;
                                        callback(reply);
                                        return;
                                    });
                                });
                            }else{
                                mongo.ccDb(accountProduct.dataDB).collection(account+"_customer").insert(customerData, function (err) {
                                    if (err) {
                                        result = {code:500, message:'server has error!'};
                                        util.sendResult(result, res, req.id());
                                        callback(reply);
                                        return;
                                    }
                                    reply.err = false;
                                    callback(reply);
                                    return;
                                });
                            }
                        });
                    }

                });
            }else{
                callback(reply);
                return;
            }
        });



    }

};

module.exports = service;
