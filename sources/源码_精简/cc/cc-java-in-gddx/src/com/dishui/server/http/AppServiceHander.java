package com.dishui.server.http;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.dishui.util.DateUtil;

public class AppServiceHander {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());
    public static String idTable = "id_generator";
    public static String sipTable = "extension_config";
    public static String skillGroupTable = "skillgroup";
    public static String ivrIdTable = "ivr_id";
    public static String businessNumTable = "business_num";
    public static String serviceNumTable = "app_serviceNum";
    public static String TYPE_ACCOUNT = "accountId";
    public static String TYPE_SIP = "sipNum";
    public static String TYPE_SKILLGROUP = "skillgroupNum";
    public static String STATUS_USING = "using";
    public static String STATUS_FREE = "free";
    public static long TIME_OUT_CHECK = 10 * 60 * 1000;
    public static long BASIC_IVR_ID = 10001;

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

    public static synchronized C5Response getSipNum(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            int nums = 1;
            if (action.hasKey("num"))
                nums = action.getIntValue("num");
            long timestamp = System.currentTimeMillis() - TIME_OUT_CHECK;
            List<DBObject> freeNums = MongoProvider.find(sipTable, new BasicDBObject().append("status", STATUS_FREE).append("timestamp", new BasicDBObject().append("$lte", timestamp)));
            if (freeNums != null && freeNums.size() > nums) {
                String numStr = "";
                for (int i = 0; i < nums; i++) {
                    DBObject obj = freeNums.get(i);
                    numStr += obj.get("_id") + "|";
                    MongoProvider.update(sipTable, new BasicDBObject().append("_id", obj.get("_id")), new BasicDBObject().append("$set", new BasicDBObject()
                            .append("timestamp", System.currentTimeMillis())));
                }
                numStr = numStr.substring(0, numStr.length() - 1);
                response.setSucceed(true);
                response.addParameter("number", numStr);
            } else {
                DBObject condition = new BasicDBObject();
                condition.put("type", TYPE_SIP);
                DBObject config = MongoProvider.find(idTable, condition).get(0);
                long currentid = (Long) config.get("currentId");
                long length = (Long) config.get("length");
                String prefix = (String) config.get("prefix");
                String currentStr = String.valueOf(currentid);
                String numStr = "";
                for (int i = 0; i < nums; i++) {
                    currentid++;
                    if (currentStr.startsWith(prefix) && currentStr.length() == length) {
                        MongoProvider.insert(sipTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()));
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
                MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SIP), new BasicDBObject().append("$set", update));
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
            String firstId = String.valueOf(currentid + 1);
            long length = (Long) config.get("length");
            String prefix = (String) config.get("prefix");
            String currentStr = String.valueOf(currentid);
            //String numStr = "";
            for (int i = 0; i < nums; i++) {
                currentid++;
                currentStr = String.valueOf(currentid);
                if (currentStr.startsWith(prefix) && currentStr.length() == length) {
                    MongoProvider.insert(sipTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()));
                    //numStr += (currentid + "|");
                } else {
                    response.setSucceed(false);
                    response.addParameter("result", "404");
                    response.setMessage("no enough  number");
                    return response;
                }
            }
            //numStr = numStr.substring(0, numStr.length() - 1);
            DBObject update = new BasicDBObject().append("currentId", currentid);
            MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SIP), new BasicDBObject().append("$set", update));
            response.setSucceed(true);
            response.addParameter("number", firstId);
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
                            new BasicDBObject().append("timestamp", System.currentTimeMillis())));
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
                String currentStr = String.valueOf(currentid);
                String numStr = "";
                for (int i = 0; i < nums; i++) {
                    currentid++;
                    if (currentStr.startsWith(prefix) && currentStr.length() == length) {
                        MongoProvider.insert(skillGroupTable, new BasicDBObject().append("_id", currentid + "").append("status", STATUS_FREE).append("timestamp", System.currentTimeMillis()));
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
                MongoProvider.update(idTable, new BasicDBObject().append("type", TYPE_SKILLGROUP), new BasicDBObject().append("$set", update));
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
            String accountId = action.getStringValue("account");
            String num = action.getStringValue("num");
            DBObject queryCondition = new BasicDBObject().append("_id", num);
            DBObject numObj = MongoProvider.findOne(serviceNumTable, queryCondition);
            if (numObj != null) {
                if (numObj.get("status").equals("free") || numObj.get("account").equals(accountId)) {
                    DBObject updateCondition = new BasicDBObject().append("_id", num);
                    MongoProvider.update(serviceNumTable, updateCondition, new BasicDBObject().append("$set", new BasicDBObject().append("status", "use").append("account", accountId)));
                    response.setSucceed(true);
                    response.addParameter("result", "200");
                    response.addParameter("num", num);
                } else {
                    response.setMessage("serviceNum not found!");
                    response.setSucceed(true);
                    response.addParameter("result", "400");
                }
            } else {
                response.setMessage("serviceNum not found!");
                response.setSucceed(true);
                response.addParameter("result", "400");
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
        try{
            String code = action.getStringValue("code");
            DBObject appConfig = MongoProvider.findOne("platform_taobao_config",new BasicDBObject().append("_id","taobaoFuwu"));
            if(code != null && appConfig != null){
                String url = (String)appConfig.get("authUrl");
                String appKey = (String)appConfig.get("appKey");
                String secret = (String)appConfig.get("appSecret");
                String rediectUrl = (String)appConfig.get("redirectUrl");

                Map<String,String> paramsMap = new HashMap<String,String>();
                paramsMap.put("client_id",appKey);
                paramsMap.put("client_secret",secret);
                paramsMap.put("grant_type","authorization_code");
                paramsMap.put("code",code);
                paramsMap.put("redirect_uri",rediectUrl);
                paramsMap.put("view","web");

                Set<String> keySet = paramsMap.keySet();
                Iterator<String> it = keySet.iterator();
                String requestData = "";
                while (it.hasNext()){
                    String key = it.next();
                    String value = paramsMap.get(key);
                    requestData += key + "=" + value + "&";
                }
                if(requestData.length() > 1)
                    requestData = requestData.substring(0,requestData.length() -1);

                log.log(Level.INFO,"request taobao data:" + requestData);

//                String responseString = TaobaodHttpUtil


            } else {

            }


        } catch (Exception e){

        }
        return response;
    }

    public static synchronized C5Response getBusinessNum(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String account = action.getStringValue("account");
            String nowStr = DateUtil.getCurrentDate();
            String [] nowStrArray = nowStr.split("-");
            nowStr = nowStrArray[0] + nowStrArray[1]+nowStrArray[2];
            DBObject condition = new BasicDBObject().append("date",nowStr).append("account",account);
            DBObject todayNum = MongoProvider.findOne(businessNumTable,condition);
            if(todayNum == null){
                String numStr = "00001";
                MongoProvider.insert(businessNumTable,new BasicDBObject().append("date",nowStr).append("num",1).append("account",account));
                response.setSucceed(true);
                response.addParameter("num",nowStr+numStr);
            } else {
                int num = Integer.parseInt(String.valueOf(todayNum.get("num")));
                num ++;
                MongoProvider.update(businessNumTable,condition,new BasicDBObject().append("$set",new BasicDBObject().append("num",num)));
                String numStr = String.valueOf(num);
                while (numStr.length() < 5){
                    numStr = "0" + numStr;
                }
                response.setSucceed(true);
                response.addParameter("num",nowStr+numStr);
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING,"",e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

}
