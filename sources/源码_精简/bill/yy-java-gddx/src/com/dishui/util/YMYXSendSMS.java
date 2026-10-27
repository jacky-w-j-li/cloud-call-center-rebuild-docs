package com.dishui.util;

import com.dishui.bill.command.JSONReader;
import com.dishui.db.mango.MongoProvider;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

public class YMYXSendSMS {

    private static Logger log = Logger.getLogger(YMYXSendSMS.class.getName());

	private String encode = "UTF-8";
	public String getEncode() {
		return encode;
	}

	public void setEncode(String encode) {
		this.encode = encode;
	}

	// 服务器请求地址(需要加密);
	private String servicesRequestAddRess = "";

    //企业ID
    private String spId = "";
	// 登录的用户名;
	private String loginName = "";
	// 登录的密码;
	private String password = "";
	// 短信发送定时时间;
	private String sendTime;
	// 发送的手机号码;
	private String mobiles;
	// 发送的内容;
	private String content;

	public String getServicesRequestAddRess() {
		return servicesRequestAddRess;
	}

	public void setServicesRequestAddRess(String servicesRequestAddRess) {
		this.servicesRequestAddRess = servicesRequestAddRess;
	}
    public String getSendTime() { return sendTime; }

    public void setSendTime(String sendTime) { this.sendTime = sendTime; }

    public String getSpId() { return spId; }

    public void setSpId(String spId) { this.spId = spId; }

    public String getMobiles() { return mobiles; }

    public String getLoginName() { return loginName; }

    public void setLoginName(String loginName) { this.loginName = loginName; }

    public void setMobiles(String mobiles) { this.mobiles = mobiles; }

    public String getPassword() {
		return password;
	}

	public void setPassword(String password) { this.password = password; }

	public String getContent() {
		return content;
	}

	public void setContent(String content) { this.content = content; }

	// 发送短信;
	public Map<String, String> sendSMS() {
        Map<String, String> result = new HashMap<String, String>();
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
        try{
            String httpRes = HttpProvider.sendPost(getServicesRequestAddRess(), getRequestData().getBytes(encode), 30000);
            //{result:"1000",description:"发送短信成功",smsId:"100000000"}
            System.out.println("httpRes ="+ httpRes);
            HashMap<String,String> resMap = jsonToMap(httpRes);
            String status = resMap.get("result");
            String description = resMap.get("description");

            String smsId = "";
            if(resMap.containsKey("smsId"))
                smsId = resMap.get("smsId");

            if(status.equals("1000")){
                result.put("success", "true");
                result.put("by_errordescription", description);
                result.put("ymyx_msgid", smsId);
            }
            result.put("by_errordescription", description);
        }catch (Exception e){
            e.printStackTrace();
            log.warning("易米营销通道 发送短信失败!" + mobiles + " Exception:" + e);
        }
        return result;
	}

    // 获取短信报告--弃用;
    public ArrayList<Map<String, String>> getSMSReport() {
        ArrayList<Map<String, String>> resultList =  new ArrayList<Map<String, String>>();

        try{
            String httpRes = HttpProvider.sendPost(this.getServicesRequestAddRess(), this.getReportRequestData().getBytes(encode), 60000);

            HashMap<String, String> resMap = new HashMap<String, String>();
            if (httpRes != null && httpRes.indexOf('&') > -1) {
                String[] commands = httpRes.split("&");
                for (int i = 0; i < commands.length; i++) {
                    String[] command = commands[i].split("=");
                    if (command.length == 2)
                        resMap.put(command[0], command[1]);
                }
            }
            if(resMap.get("result") != null && resMap.get("result").equals("0")){
                if(resMap.containsKey("reports"))
                    resultList = jsonToArray(resMap.get("reports"));
            }
        }catch (Exception e) {
            e.printStackTrace();
            log.warning("获取易米营销 通短信报告失败!"+"Exception:"+e);
        }
        return resultList;
    }

    public static String handlerDeliverMessage(String str){
        try {
            str = URLDecoder.decode(str, "UTF-8");
            log.info("YMYX++++URLDecoder= "+ str);
            String[] allReportArr = str.split("&");
            if(allReportArr.length == 2){
                if(allReportArr[0].split("=")[1].equals("1000")){
                    if(allReportArr[1].split("=")[1].length() > 0 ){
                        String[] reportArr = allReportArr[1].split("=")[1].split(";");

                        for(int i=0 ;i<reportArr.length ;i++){
                            String[] item = reportArr[i].split(",");
                            DBObject find = new BasicDBObject();
                            find.put("smsChannel", "ymyx");
                            find.put("ymyx_msgid", item[0]);
                            DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                            if(sendDoc != null){
                                DBObject findAcc = new BasicDBObject();
                                findAcc.put("_id",sendDoc.get("account")+"_cc");

                                DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                                if(accDoc != null){
                                    DBObject findSms = new BasicDBObject();
                                    findSms.put("ymyx_msgid", item[0]);
                                    findSms.put("num", item[1]);
                                    DBObject updateSms = new BasicDBObject();
                                    if(item[2].equals("0")){
                                        updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机")
                                                .append("m7Status","deliver").append("receivetime", item[4]));
                                    }else{
                                        updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+item[3]).append("m7Status","undeliver"));
                                    }
                                    MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warning("YMYX handlerDeliverMessage: exception :"+e);
        }
        return "OK";
    }

	// 拼接参数;
	private String getRequestData() {
		StringBuffer requestAddRess = new StringBuffer();
		requestAddRess.append("spId=");
        requestAddRess.append(this.spId);
        requestAddRess.append("&loginName=");
        requestAddRess.append(this.loginName);
        requestAddRess.append("&password=");
		requestAddRess.append(this.password);
		requestAddRess.append("&content=");
		requestAddRess.append(this.content);
		requestAddRess.append("&mobiles=");
		requestAddRess.append(this.mobiles);
        requestAddRess.append("&reserve=");
        requestAddRess.append("&subPort=");
        System.out.println(requestAddRess.toString());
        return requestAddRess.toString();
	}

    // 拼接获取报告参数;
    private String getReportRequestData() {
        StringBuffer requestAddRess = new StringBuffer();
        requestAddRess.append("spId=");
        requestAddRess.append(this.spId);
        requestAddRess.append("&loginName=");
        requestAddRess.append(this.loginName);
        requestAddRess.append("&password=");
        requestAddRess.append(this.password);
        return requestAddRess.toString();
    }

    public HashMap<String, String> jsonToMap(String result) {
        HashMap<String, String> hashMap = new HashMap<String, String>();
        JsonParser parser = new JsonParser();
        JsonObject asJsonObject = parser.parse(result).getAsJsonObject();
        Set<Map.Entry<String, JsonElement>> entrySet = asJsonObject.entrySet();
        for (Map.Entry<String, JsonElement> m : entrySet) {
            hashMap.put(m.getKey(),m.getValue().getAsString());
        }
        return hashMap;
    }

    public ArrayList< Map<String, String>> jsonToArray(String result) {
        JsonParser parser = new JsonParser();
        JsonArray asJsonArray = parser.parse(result).getAsJsonArray();

        ArrayList<Map<String, String>> arrayList = new ArrayList<Map<String, String>>();
        for (JsonElement j : asJsonArray) {
            Set<Map.Entry<String, JsonElement>> entrySet = j.getAsJsonObject().entrySet();
            HashMap<String, String> hashMap = new HashMap<String, String>();
            for (Map.Entry<String, JsonElement> m2 : entrySet) {
                hashMap.put(m2.getKey(), m2.getValue().getAsString());
            }
            arrayList.add(hashMap);
        }
        return arrayList;
    }
}
