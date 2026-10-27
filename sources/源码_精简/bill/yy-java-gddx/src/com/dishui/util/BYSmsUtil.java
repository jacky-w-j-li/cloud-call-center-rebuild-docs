package com.dishui.util;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Created by chenguang on 2/6/15.
 */
public class BYSmsUtil {
    public static String userName = "649138";
    public static String passWord = "F8022321429A8733A2306008C73B080E";
    public static String url = "http://sms.c8686.com/Api/BayouSmsApiEx.aspx";


    public static Map<String,String> send(String phone,String content) {
        BYSendSMS ss = new BYSendSMS();
        ss.setUsername(userName);
        ss.setPassword(passWord);
        ss.setMessage(content);
        ss.setMobiles(phone);
        ss.setServicesRequestAddRess(url);
        ss.setSmstype(0);
        ss.setTimerid("0");
        ss.setTimertype(0);
        Map<String, String> map = ss.sendSMS();
//        Iterator<Map.Entry<String, String>> it = map.entrySet().iterator();
//        while(it.hasNext()){
//            System.out.println(it.next());
//        }
        return map;
    }

}
