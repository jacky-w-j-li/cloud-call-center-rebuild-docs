package com.dishui.util;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import com.dishui.ytx.CCPRestSDK;
import com.dishui.ytx.SingleCCPRestSDK;

/**
 * Created by jingdeliang on 14/7/16.
 */
public class YTXSmsUtil {
	public static String ip = "app.cloopen.com";
	public static String port = "8883";
	public static String acc = "aaf98f894ecd7d6a014ed906116b12bc";
	public static String accAuth = "be7d06a2c2314ec9bae18c9655b9798d";
	public static String ytxappId = "8a216da854ff8dcc0155054e58a5091a";
	public static String ytxyxappId = "8a216da85607361a0156075237130034";


    public static Map<String,String> sendSMS(String smstype,String phone,String templateid,String[] datas) {
    	CCPRestSDK ccpsdk = SingleCCPRestSDK.getInstance();
    	ccpsdk.init(ip, port);
    	ccpsdk.setAccount(acc, accAuth);
    	//备案透传号码APPId
    	if(smstype.equals("ytx")){
    		ccpsdk.setAppId(ytxappId);
    	}else if(smstype.equals("ytxyx")){
    		ccpsdk.setAppId(ytxyxappId);
    	}
        Map map = ccpsdk.sendTemplateSMS(phone,templateid,datas);
        return map;
    }
    public static String strtodate(String date){
    	StringBuffer sbstr =new StringBuffer();
        sbstr.append(date.substring(0,4)+"-");
        sbstr.append(date.substring(4,6)+"-");
        sbstr.append(date.substring(6,8)+" ");
        sbstr.append(date.substring(8,10)+":");
        sbstr.append(date.substring(10,12)+":");
        sbstr.append(date.substring(12,14));
    	return sbstr.toString();
    }
}
