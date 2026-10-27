package com.dishui.util;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Created by jingdeliang on 14/7/16.
 */
public class WSPSSmsUtil {
    public static String userName = "93294";
    public static String passWord = "bnm136!";
    public static String url = "http://183.61.109.140:9801/CASServer/SmsAPI/SendMessage.jsp";


    public static Map<String,String> sendSMS(String phone,String content) {
        WSPSSendSMS wspssend = new WSPSSendSMS();
        wspssend.setUserid(userName);
        wspssend.setPassword(passWord);
        wspssend.setSendtime("");
        wspssend.setDestnumbers(phone);
        wspssend.setMsg(content);
        wspssend.setUrl(url);
        Map<String, String> map = wspssend.sendSMS();
        return map;
    }

}
