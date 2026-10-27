package com.dishui.util;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Created by chenguang on 2/6/15.
 */
public class YMYXSmsUtil {
    public static String spid = "4187";
    public static String account = "bjrlqb_yx";
    public static String password = "bjrlqb_yx";
    public static String url = "http://114.215.196.181:8870/sms/SendUtf.do";
    public static String reportUrl = "http://114.215.196.181:8000/sms/report.do";


    public static Map<String,String> send(String phone,String content) {
        YMYXSendSMS ss = new YMYXSendSMS();
        ss.setSpId(spid);
        ss.setLoginName(account);
        ss.setPassword(password);
        ss.setContent(content);
        ss.setMobiles(phone);
        ss.setServicesRequestAddRess(url);
        Map<String, String> map = ss.sendSMS();
        return map;
    }

    public static ArrayList<Map<String, String>> getReport(){
        YMYXSendSMS ss = new YMYXSendSMS();
        ss.setSpId(spid);
        ss.setLoginName(account);
        ss.setPassword(password);
        ss.setServicesRequestAddRess(reportUrl);
        ArrayList<Map<String, String>> list = ss.getSMSReport();
        return list;
    }

    public static void main(String[] args) {
//        YMSmsUtil.send("18600030392","今天晚上来吃饭不呀？【七陌科技】");
        String httpRes = "result=0&confirm_time=2015-03-18 17:36:55&id=2396039&replys=" +
                "[{\"callmdn\":\"10690*******\",\"mdn\":\"13812345678\",\"content\":\"上行回复1\",\"reply_time\":\"2015-01-01 18:43:41\",\"subport\":\"12345\"}," +
                "{\"callmdn\":\"10690*******\",\"mdn\":\"13812345678\",\"content\":\"上行回复2\",\"reply_time\":\"2015-01-02 18:47:39\",\"subport\":\"12346\"}]";

        HashMap<String,String> resMap = new HashMap<String, String>();
        if (httpRes != null && httpRes.indexOf('&') > -1) {
            String[] commands = httpRes.split("&");
            for (int i = 0; i < commands.length; i++) {
                String[] command = commands[i].split("=");
                if (command.length == 2)
                    resMap.put(command[0], command[1]);
            }
        }
        System.out.println(resMap);

        System.out.println(jsonToArray(resMap.get("replys")));

//        String abc = "{result:\"1000\",description:\"短信发送成功\",smsId:\"171359443\"}";
//        JSONReader jr = new JSONReader();
//        try {
//
//            Gson gson = new Gson();
//            HashMap<String,String> resMap = jsonToMap(abc);
//
//            System.out.println("abc="+resMap);
//        } catch (Exception e) {
//            e.printStackTrace();
//        }

    }
    public static HashMap<String, String> jsonToMap(String result) {
        HashMap<String, String> hashMap = new HashMap<String, String>();
        JsonParser parser = new JsonParser();
        JsonObject asJsonObject = parser.parse(result).getAsJsonObject();

        Set<Map.Entry<String, JsonElement>> entrySet = asJsonObject.entrySet();
        for (Map.Entry<String, JsonElement> m : entrySet) {
            hashMap.put(m.getKey(),m.getValue().getAsString());
        }
        return hashMap;
    }

    public static ArrayList<HashMap<String, String>> jsonToArray(String result) {
        JsonParser parser = new JsonParser();
        JsonArray asJsonArray = parser.parse(result).getAsJsonArray();

        ArrayList<HashMap<String, String>> arrayList = new ArrayList<HashMap<String, String>>();
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
