package com.dishui.server.http;

import java.net.URLDecoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.bill.command.JSONReader;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.util.AiMuNeiYiHttpClientUtil;
import com.dishui.util.HttpProvider;
import com.dishui.util.SmsForbiddenWordCheckUtil;
import com.dishui.util.SmsUtil;
import com.dishui.ytx.YTXCommitDisplayNumbers;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

public class AppServiceHander {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());
    public static String idTable = "id_generator";
    public static String sipTable = "platform_sipNum";
    public static String skillGroupTable = "platform_queue";
    public static String serviceNumTable = "platform_serviceNum";
    public static String serviceNum400 = "platform_num400";
    public static String platformAccount = "platform_account";
    public static String ivrIdTable = "ivr_id";
    public static String TYPE_ACCOUNT = "accountId";
    public static String TYPE_SIP = "sipNum";
    public static String TYPE_SKILLGROUP = "skillgroupNum";
    public static String STATUS_USING = "using";
    public static String STATUS_FREE = "free";
    public static long TIME_OUT_CHECK = 10 * 60 * 1000;
    public static long BASIC_IVR_ID = 10001;
    public static String platfomrCode="platform_code";//对应的表名
    public static String TYPE_SMSCODE="sms";//对应着类型

    public static synchronized C5Response getAccountId(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            DBObject condition = new BasicDBObject();
            condition.put("type", TYPE_ACCOUNT);
            DBObject config = MongoProvider.find(idTable, condition).get(0);
            long currentid = (Long) config.get("currentId");
            long length = (Long) config.get("length");
            String prefix = (String) config.get("prefix");

            currentid++;
            String currentStr = String.valueOf(currentid);
            if (currentStr.length() <= length) {
                DBObject update = new BasicDBObject().append("currentId", currentid);
                MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_ACCOUNT), new BasicDBObject().append("$set", update));
            } else {
                response.setSucceed(false);
                response.addParameter("result", "404");
                response.setMessage("no enough  number");
                return response;
            }
            for (int i = currentStr.length(); i < length; i++) {
                currentStr = "0" + currentStr;
            }

            response.setSucceed(true);
            response.addParameter("number", prefix + currentStr);

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static  C5Response getMobileCode(C5Action action){
        C5Response response = new C5Response(action);
        try {
            String mobile = action.getStringValue("mobile");
            if(mobile != null && mobile.length() == 7){
                String url = AppConfig.getInstance().getVar("mobile.url");
                url = url.replace("__mobile",mobile);
                String result = HttpProvider.sendGet(url);
                JSONReader reader = new JSONReader();
                Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
                String queryResult = (String)resultObj.get("QueryResult");
                if(queryResult.equals("True")){
                    String mobileCode = (String) resultObj.get("Mobile");
                    String  Corp = (String) resultObj.get("Corp");
                    String Province = (String) resultObj.get("Province");
                    String City = (String) resultObj.get("City");
                    String AreaCode = (String) resultObj.get("AreaCode");
                    String PostCode = (String) resultObj.get("PostCode");
                    String to = (String) resultObj.get("TO");
                    String card = (String) resultObj.get("Card");

                    DBObject insert = new BasicDBObject();
                    insert.put("_id",mobileCode);
                    insert.put("province",Province);
                    insert.put("city",City);
                    insert.put("area_code",AreaCode);
                    insert.put("post_code",PostCode);
                    insert.put("corp",Corp);
                    insert.put("card",to + card);

                    if(AreaCode != null && !"".equals(AreaCode)){
                        MongoProvider.insert("tbl_mobile_code",insert);
                        response.addParameter("_id",mobileCode);
                        response.addParameter("province",Province);
                        response.addParameter("city",City);
                        response.addParameter("area_code",AreaCode);
                        response.setSucceed(true);
                    } else {
                        response.setMessage("404");
                    }
                } else {
                    log.log(Level.WARNING,"can not found mobile code [" + mobile + "]");
                    DBObject error = new BasicDBObject().append("_id",mobile).append("time",Utils.getCurrentDate());
                    MongoProvider.insert("tbl_mobile_code_error", error);
                }

            } else {
                response.setMessage("mobile format error!");
            }

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING,"fond mobile code error!");
            String mobile = null;
            try {
                mobile = action.getStringValue("mobile");
                DBObject error = new BasicDBObject().append("_id",mobile).append("time", Utils.getCurrentDate());
                MongoProvider.insert("tbl_mobile_code_error", error);
            } catch (Exception e1) {
                e1.printStackTrace();
            }

        }

        return response;

    }

    public static synchronized C5Response getSipNum(C5Action action) {
       return getSeriesSipNum(action);
//        C5Response response = new C5Response(action);
//        try {
//            int nums = 1;
//            if (action.hasKey("num"))
//                nums = action.getIntValue("num");
//            long timestamp = System.currentTimeMillis() - TIME_OUT_CHECK;
//            List<DBObject> freeNums = MongoProvider.find(sipTable, new BasicDBObject().append("status", STATUS_FREE).append("timestamp", new BasicDBObject().append("$lte", timestamp)));
//            if (freeNums != null && freeNums.size() > nums) {
//                String numStr = "";
//                for (int i = 0; i < nums; i++) {
//                    DBObject obj = freeNums.get(i);
//                    numStr += obj.get("_id") + "|";
//                    MongoProvider.update(sipTable, new BasicDBObject().append("_id", obj.get("_id")), new BasicDBObject().append("$set", new BasicDBObject()
//                            .append("timestamp", System.currentTimeMillis())));
//                }
//                numStr = numStr.substring(0, numStr.length() - 1);
//                response.setSucceed(true);
//                response.addParameter("number", numStr);
//            } else {
//                DBObject condition = new BasicDBObject();
//                condition.put("type", TYPE_SIP);
//                DBObject config = MongoProvider.find(idTable, condition).get(0);
//                long currentid = (Long) config.get("currentId");
//                long length = (Long) config.get("length");
//                String prefix = (String) config.get("prefix");
//                String numStr = "";
//                for (int i = 0; i < nums; i++) {
//                    currentid++;
//                    String currentStr = String.valueOf(currentid);
//                    if (currentStr.startsWith(prefix) && currentStr.length() == length) {
//                        MongoProvider.insert(sipTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()));
//                        numStr += (currentStr + "|");
//                    } else {
//                        response.setSucceed(false);
//                        response.addParameter("result", "404");
//                        response.setMessage("no enough  number");
//                        return response;
//                    }
//                }
//                numStr = numStr.substring(0, numStr.length() - 1);
//                DBObject update = new BasicDBObject().append("currentId", currentid);
//                MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SIP), new BasicDBObject().append("$set", update));
//                response.setSucceed(true);
//                response.addParameter("number", numStr);
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//            log.log(Level.WARNING, "", e);
//            response.setSucceed(false);
//            response.addParameter("result", "500");
//            response.setMessage(e.getMessage());
//        }
//        return response;
    }

    public static synchronized C5Response getSeriesSipNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            int nums = 1;
            if (action.hasKey("num"))
                nums = action.getIntValue("num");

            DBObject condition = new BasicDBObject();
            condition.put("type", TYPE_SIP);
            DBObject config = MongoProvider.find(idTable, condition).get(0);
            long currentid = (Long) config.get("currentId");
            Long length = (Long) config.get("length");
            String prefix = (String) config.get("prefix");
            String currentStr = String.valueOf(currentid);
            String numStr = "";
            for (int i = 0; i < nums; i++) {
                currentid++;
                currentStr = String.valueOf(currentid);
                if (currentStr.startsWith(prefix) && currentStr.length() == length) {
                    MongoProvider.insert(sipTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()),WriteConcern.FSYNC_SAFE);
                    numStr += (currentid + "|");
                } else {
                    response.setSucceed(false);
                    response.addParameter("result", "404");
                    response.setMessage("no enough  number");
                    return response;
                }
            }
            numStr = numStr.substring(0, numStr.length() - 1);
            DBObject update = new BasicDBObject().append("currentId", currentid);
            MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SIP), new BasicDBObject().append("$set", update),WriteConcern.FSYNC_SAFE);
            response.setSucceed(true);
            response.addParameter("number", numStr);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response getSkillGroupNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            int nums = 1;
            if (action.hasKey("num"))
                nums = action.getIntValue("num");
            long timestamp = System.currentTimeMillis() - TIME_OUT_CHECK;
            List<DBObject> freeNums = MongoProvider.find(skillGroupTable, new BasicDBObject().append("status", STATUS_FREE).append("timestamp", new BasicDBObject().append("$lte", timestamp)));
            if (freeNums != null && freeNums.size() > nums) {
                String numStr = "";
                for (int i = 0; i < nums; i++) {
                    DBObject obj = freeNums.get(i);
                    numStr += obj.get("_id") + "|";
                    MongoProvider.update(skillGroupTable, new BasicDBObject().append("_id", obj.get("_id")), new BasicDBObject().append("$set",
                            new BasicDBObject().append("timestamp", System.currentTimeMillis())), new WriteConcern(1));
                }
                numStr = numStr.substring(0, numStr.length() - 1);
                response.setSucceed(true);
                response.addParameter("number", numStr);
            } else {
                DBObject condition = new BasicDBObject();
                condition.put("type", TYPE_SKILLGROUP);
                DBObject config = MongoProvider.find(idTable, condition).get(0);
                long currentid = (Long) config.get("currentId");
                long length = (Long) config.get("length");
                String prefix = (String) config.get("prefix");
                String numStr = "";
                for (int i = 0; i < nums; i++) {
                    currentid++;
                    String currentStr = String.valueOf(currentid);
                    if (currentStr.startsWith(prefix) && currentStr.length() == length) {
                        MongoProvider.insert(skillGroupTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()), new WriteConcern(1));
                        numStr += (currentStr + "|");
                    } else {
                        response.setSucceed(false);
                        response.addParameter("result", "404");
                        response.setMessage("no enough  number");
                        return response;
                    }
                }
                numStr = numStr.substring(0, numStr.length() - 1);
                DBObject update = new BasicDBObject().append("currentId", currentid);
                MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SKILLGROUP), new BasicDBObject().append("$set", update), new WriteConcern(1));
                response.setSucceed(true);
                response.addParameter("number", numStr);
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response getIvrId(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String account = action.getStringValue("account");
            if (account != null && !"".equals(account)) {
                DBObject condition = new BasicDBObject().append("_id", account);
                DBObject dbIvr = MongoProvider.findOne(ivrIdTable, condition);
                DBObject result = null;
                if (dbIvr != null) {
                    DBObject update = new BasicDBObject().append("$inc", new BasicDBObject().append("ivrId", 1));
                    result = MongoProvider.findAndModify(ivrIdTable, condition, update, true);
                } else {
                    result = new BasicDBObject().append("_id", account).append("ivrId", BASIC_IVR_ID);
                    MongoProvider.insert(ivrIdTable, result);
                }
                if (result != null) {
                    response.setSucceed(true);
                    response.addParameter("account", result.get("_id"));
                    response.addParameter("ivrId", result.get("ivrId"));
                } else {
                    response.setMessage("query data error!");
                    response.setSucceed(false);
                    response.addParameter("result", "500");
                }
            } else {
                response.setMessage("account id is null");
                response.setSucceed(false);
                response.addParameter("result", "500");
            }

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response useServiceNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String num = action.getStringValue("num");

            DBObject queryCondition = new BasicDBObject().append("_id", num).append("status", "free");
            DBObject numObj = MongoProvider.findOne(serviceNumTable, queryCondition);
            if (numObj != null) {
                DBObject updateData = new BasicDBObject().append("status", "ready").append("readyTime", Utils.getCurrentDate());
                DBObject updateCondition = new BasicDBObject().append("_id", num);

                MongoProvider.update(serviceNumTable, updateCondition, new BasicDBObject().append("$set", updateData), WriteConcern.FSYNC_SAFE);
                response.setSucceed(true);
                response.addParameter("result", "200");
            } else {
                response.setMessage("serviceNum not found!");
                response.setSucceed(false);
                response.addParameter("result", "404");
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response userNum400(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String num = action.getStringValue("num");
            DBObject queryCondition = new BasicDBObject().append("_id", num).append("status", "free");
            DBObject numObj = MongoProvider.findOne(serviceNum400, queryCondition);
            if (numObj != null) {
                DBObject updateData = new BasicDBObject().append("status", "ready").append("readyTime", Utils.getCurrentDate());
                DBObject updateCondition = new BasicDBObject().append("_id", num);

                MongoProvider.update(serviceNum400, updateCondition, new BasicDBObject().append("$set", updateData), WriteConcern.FSYNC_SAFE);
                response.setSucceed(true);
                response.addParameter("result", "200");
            } else {
                response.setMessage("serviceNum not found!");
                response.setSucceed(false);
                response.addParameter("result", "404");
            }

        } catch (Exception e){

        }
        return response;
    }

    public static synchronized C5Response releaseServiceNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String num = action.getStringValue("num");
            DBObject queryCondition = new BasicDBObject().append("_id", num).append("status", "use");
            DBObject numObj = MongoProvider.findOne(serviceNumTable, queryCondition);
            if (numObj != null) {
                DBObject updateCondition = new BasicDBObject().append("_id", num);
                MongoProvider.update(serviceNumTable, updateCondition, new BasicDBObject().append("$set", new BasicDBObject().append("status", "free").append("account", "")));
            }
            response.setSucceed(true);
            response.addParameter("result", "200");
            response.addParameter("num", num);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }


    public static C5Response taobao(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String code = action.getStringValue("code");
            DBObject appConfig = MongoProvider.findOne("platform_taobao_config", new BasicDBObject().append("_id", "taobaoFuwu"));
            if (code != null && appConfig != null) {
                String url = (String) appConfig.get("authUrl");
                String appKey = (String) appConfig.get("appKey");
                String secret = (String) appConfig.get("appSecret");
                String rediectUrl = (String) appConfig.get("redirectUrl");

                Map<String, String> paramsMap = new HashMap<String, String>();
                paramsMap.put("client_id", appKey);
                paramsMap.put("client_secret", secret);
                paramsMap.put("grant_type", "authorization_code");
                paramsMap.put("code", code);
                paramsMap.put("redirect_uri", rediectUrl);
                paramsMap.put("view", "web");

                Set<String> keySet = paramsMap.keySet();
                Iterator<String> it = keySet.iterator();
                String requestData = "";
                while (it.hasNext()) {
                    String key = it.next();
                    String value = paramsMap.get(key);
                    requestData += key + "=" + value + "&";
                }
                if (requestData.length() > 1)
                    requestData = requestData.substring(0, requestData.length() - 1);

                log.log(Level.INFO, "request taobao data:" + requestData);
                String responseString = HttpProvider.sendPost(url, requestData.getBytes(), 10000);
                log.log(Level.INFO, "get rsponse from taobao:" + responseString);

                if (responseString != null) {
                    responseString = URLDecoder.decode(responseString, "UTF-8");
                    JSONReader reader = new JSONReader();
                    Map<String, Object> data = (Map<String, Object>) reader.read(responseString);
                    response.setSucceed(true);
                    response.setValues(data);
                } else {
                    response.setMessage("get empty from taobao!");
                }
            } else {
                response.setMessage("config and code not found!");
            }


        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage("error");
        }
        return response;
    }
    public static synchronized C5Response buyServiceNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String num = action.getStringValue("num");
            String account = action.getStringValue("account");
            String product = action.getStringValue("product");

            DBObject queryCondition = new BasicDBObject().append("_id", num).append("status", "free");
            DBObject numObj = MongoProvider.findOne(serviceNumTable, queryCondition);
            if (numObj != null) {
                DBObject updateData = new BasicDBObject().append("status", "use").append("account", account).append("product",product);
                DBObject updateCondition = new BasicDBObject().append("_id", num);

                MongoProvider.update(serviceNumTable, updateCondition, new BasicDBObject().append("$set", updateData), WriteConcern.SAFE);
                response.setSucceed(true);
                response.addParameter("result", "200");
            } else {
                response.setMessage("serviceNum not found!");
                response.setSucceed(false);
                response.addParameter("result", "404");
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response HandlerSms(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String actionName = action.getStringValue("Action");
            Map map = null;
            if(actionName.equals("send")){
                map = SmsUtil.send(action.getStringValue("phone"),action.getStringValue("content"),action.getStringValue("sign"));
                log.log(Level.WARNING, "send sms=="+map.toString());
            }else if(actionName.equals("getReport")){
                map = SmsUtil.getReport(action.getStringValue("msgid"));
                log.log(Level.WARNING, "send sms=="+map.toString());
            }else if(actionName.equals("getBalance")){
                map = SmsUtil.getBalance();
                log.log(Level.WARNING, "send sms=="+map.toString());
            }else if(actionName.equals("getSms")){
                map = SmsUtil.getSms();
                log.log(Level.WARNING, "send sms=="+map.toString());
            }
            response.setSucceed(true);
            response.setValues(map);

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response HandlerYTXCommitDisplayNumbers(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String beginNum = action.getStringValue("begin");
            String endNum = action.getStringValue("end");
            if(action.hasKey("newapp")){
                if(YTXCommitDisplayNumbers.commitNumbersNewapp(beginNum,endNum)){
                    response.setSucceed(true);
                }else{
                    response.setSucceed(false);
                }
            }else{
                if(YTXCommitDisplayNumbers.commitNumbers(beginNum,endNum)){
                    response.setSucceed(true);
                }else{
                    response.setSucceed(false);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    //对应着短信签名subcode
    public static synchronized C5Response getSmscodeId(C5Action action) {
        //这里获取相应数据
        C5Response response = new C5Response(action);
        try {
            DBObject condition = new BasicDBObject();
//            DBObject config = MongoProvider.find(platfomrCode, condition).get(0);
            condition = new BasicDBObject().append("type", "sms");
            DBObject update = new BasicDBObject().append("$inc", new BasicDBObject().append("num", 1));
            DBObject result = MongoProvider.findAndModify(platfomrCode, condition, update, false);
            String num=result.get("num").toString();
            //不够4位数 用0补齐
            for (int i = num.length(); i < 4; i++) {
                num = "0" + num;
            }
            if (result != null) {
                response.setSucceed(true);
                response.addParameter("num", num);
            } else {
                response.setMessage("query data error!");
                response.setSucceed(false);
                response.addParameter("result", "500");
            }

        } catch (Exception e) {//捕获异常
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static synchronized C5Response  getSmsTempleteId(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String account = action.getStringValue("account");
            DBObject condition = new BasicDBObject().append("_id", account);
            DBObject result = MongoProvider.findOne(platformAccount,condition);
            if(result != null){
                int num = 1;
                if(result.get("smsTempleteNum") != null){
                    int smsTempleteNum = (Integer)result.get("smsTempleteNum");
                   num = smsTempleteNum + 1;
                }
                MongoProvider.update(platformAccount,condition,new BasicDBObject().append("$inc",new BasicDBObject().append("smsTempleteNum",1)));
                response.setSucceed(true);
                response.addParameter("num", num);

            } else {
                response.setMessage("query data error!");
                response.setSucceed(false);
                response.addParameter("result", "500");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static C5Response getAiMuNeiYiCustInfo(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String num = action.getStringValue("num");
            String result = AiMuNeiYiHttpClientUtil.post("http://124.207.152.79:8080/aimer/userinfo", "mobile={mobile:'" + num + "'}");
            System.out.println(result);

            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            response.setSucceed(true);
            response.addParameter("data", resultObj);
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static C5Response smsWordsCheck(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String content = action.getStringValue("content");
            String result = SmsForbiddenWordCheckUtil.checkWord(content);
            System.out.println(result);
            response.setSucceed(true);
            response.addParameter("data", result);
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }
}
