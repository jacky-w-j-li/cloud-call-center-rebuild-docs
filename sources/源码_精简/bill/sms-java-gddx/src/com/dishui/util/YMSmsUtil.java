package com.dishui.util;

import java.util.ArrayList;
import java.util.Map;

/**
 * Created by chenguang on 2/6/15.
 */
public class YMSmsUtil {
    public static String spid = "4167";
    public static String account = "bjrlqb_hy";
    public static String password = "bjrlqb_hy";
    public static String url = "http://114.215.196.181:8870/sms/SendUtf.do";
    public static String reportUrl = "http://114.215.196.181:8000/sms/report.do";


    public static Map<String,String> send(String phone,String content) {
        YMSendSMS ss = new YMSendSMS();
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
        YMSendSMS ss = new YMSendSMS();
        ss.setSpId(spid);
        ss.setLoginName(account);
        ss.setPassword(password);
        ss.setServicesRequestAddRess(reportUrl);
        ArrayList<Map<String, String>> list = ss.getSMSReport();
        return list;
    }

    public static void main(String[] args) {
//        YMSmsUtil.send("18600030392","今天晚上来吃饭不呀？【七陌科技】");
        System.out.println(YMSmsUtil.getReport());

        String data = "result=1000&reports=1173496,15912312312,0,DELIVRD,20140510003507;1163699,15912312316,0,DELIVRD,20140510003509";
        try {
            System.out.println(HttpProvider.sendPost("http://127.0.0.1:8888/YMSmsService", data.getBytes("UTF-8"), 6000));
        } catch (Exception e) {

        }
    }
}
