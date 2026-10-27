package com.dishui.util;

import java.util.ArrayList;
import java.util.Map;

/**
 * Created by chenguang on 12/19/15.
 */
public class GDTYNewSmsUtil {
    public static String userid = "103";
    public static String account = "qmmstz";
    public static String password = "qm123456";
    public static String url = "http://116.255.153.10:7788/sms.aspx";
    public static String reportUrl = "http://116.255.153.10:7788/statusApi.aspx";


    public static Map<String,String> send(String phone,String content) {
        GDTYSendSMS ss = new GDTYSendSMS();
        ss.setUserid(userid);
        ss.setAccount(account);
        ss.setPassword(password);
        ss.setContent(content);
        ss.setMobile(phone);
        ss.setServicesRequestAddRess(url);
        Map<String, String> map = ss.sendSMS();
        return map;
    }

    public static Map<String,String> send(String phone,String content,String extno) {
        GDTYSendSMS ss = new GDTYSendSMS();
        ss.setUserid(userid);
        ss.setAccount(account);
        ss.setPassword(password);
        ss.setContent(content);
        ss.setMobile(phone);
        ss.setExtno(extno);
        ss.setServicesRequestAddRess(url);
        Map<String, String> map = ss.sendSMS();
        return map;
    }

    public static ArrayList<Map<String, String>> getReport(){
        GDTYSendSMS ss = new GDTYSendSMS();
        ss.setUserid(userid);
        ss.setAccount(account);
        ss.setPassword(password);
        ss.setServicesRequestAddRess(reportUrl);
        ArrayList<Map<String, String>> list = ss.getSMSReport();
        return list;
    }
}
