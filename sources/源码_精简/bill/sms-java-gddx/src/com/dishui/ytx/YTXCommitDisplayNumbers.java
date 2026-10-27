package com.dishui.ytx;

import com.dishui.db.mango.MongoProvider;
import com.dishui.server.http.AppHttpHandler;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

public class YTXCommitDisplayNumbers {

    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());
    public static String ip = "app.cloopen.com";
    public static String port = "8883";
    public static String acc = "8a48b55149efe6a20149f05ba6b600c4";
    public static String accAuth = "068dd1d1591e42b4aba4a7ba6a1891a5";
    public static String appId = "aaf98f8949f05c080149f06a372f0019";


    public static boolean commitNumbers(String beginNum ,String endNum){
        HashMap<String, Object> result = null;
        //初始化SDK
        CCPRestSDK restAPI = new CCPRestSDK();
        restAPI.init(ip, port);
        restAPI.setAccount(acc, accAuth);
        //备案透传号码APPId
        restAPI.setAppId(appId);

        String cur = beginNum;
        String end = endNum;
        List<String> numList = new ArrayList<String>();
        int times = 0;
        while(Long.parseLong(cur) <= Long.parseLong(end)){
            times++;
            numList.add(cur);
            if(cur.equals(end) || times == 50){
                result = restAPI.commitDisplayNumbers(numList);
                if("000000".equals(result.get("statusCode"))){
                    //正常返回输出data包体信息（map）
                    HashMap<String,Object> data = (HashMap<String, Object>) result.get("data");
                    Set<String> keySet = data.keySet();
                    for(String key:keySet){
                        Object object = data.get(key);
                    }
                }else{
                    //异常返回输出错误码和错误信息
                    System.out.println("错误码=" + result.get("statusCode") +" 错误信息= "+result.get("statusMsg"));
                    log.log(Level.WARNING, "提交云通讯主叫号码异常：错误码=" + result.get("statusCode") +" 错误信息= "
                            +result.get("statusMsg")+" 号码list="+numList);
                    return false;
                }
                numList.clear();
                times = 0;
            }
            cur = "0" + (Long.parseLong(cur) + 1) + "";
        }
        DBObject doc = new BasicDBObject();
        doc.put("time", DateUtil.getCurrentTime());
        doc.put("begin", beginNum);
        doc.put("end", endNum);
        doc.put("ytxApp", "aaf98f8949f05c080149f06a372f0019");
        MongoProvider.insert("ytx_commit_display_numbers",doc);
        return true;
    }

    public static boolean commitNumbersNewapp(String beginNum ,String endNum){
        String newAcc = "aaf98f894ecd7d6a014ed906116b12bc";
        String newAccAuth = "be7d06a2c2314ec9bae18c9655b9798d";
        String newAppId = "8a48b5515262482501527bbd65ee2e03";
        HashMap<String, Object> result = null;
        //初始化SDK
        CCPRestSDK restAPI = new CCPRestSDK();
        restAPI.init(ip, port);
        restAPI.setAccount(newAcc, newAccAuth);
        //备案透传号码APPId
        restAPI.setAppId(newAppId);

        String cur = beginNum;
        String end = endNum;
        List<String> numList = new ArrayList<String>();
        int times = 0;
        while(Long.parseLong(cur) <= Long.parseLong(end)){
            times++;
            numList.add(cur);
            if(cur.equals(end) || times == 50){
                result = restAPI.commitDisplayNumbers(numList);
                if("000000".equals(result.get("statusCode"))){
                    //正常返回输出data包体信息（map）
                    HashMap<String,Object> data = (HashMap<String, Object>) result.get("data");
                    Set<String> keySet = data.keySet();
                    for(String key:keySet){
                        Object object = data.get(key);
                    }
                }else{
                    //异常返回输出错误码和错误信息
                    System.out.println("错误码=" + result.get("statusCode") +" 错误信息= "+result.get("statusMsg"));
                    log.log(Level.WARNING, "提交(新应用)云通讯主叫号码异常：错误码=" + result.get("statusCode") +" 错误信息= "
                            +result.get("statusMsg")+" 号码list="+numList);
                    return false;
                }
                numList.clear();
                times = 0;
            }
            cur = "0" + (Long.parseLong(cur) + 1) + "";
        }
        DBObject doc = new BasicDBObject();
        doc.put("time", DateUtil.getCurrentTime());
        doc.put("begin", beginNum);
        doc.put("end", endNum);
        doc.put("ytxApp", "8a48b5515262482501527bbd65ee2e03");
        MongoProvider.insert("ytx_commit_display_numbers",doc);
        return true;
    }

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		HashMap<String, Object> result = null;
        //初始化SDK
        CCPRestSDK restAPI = new CCPRestSDK();
        restAPI.init(ip, port);
        restAPI.setAccount("8a48b55149efe6a20149f05ba6b600c4", "068dd1d1591e42b4aba4a7ba6a1891a5");
        //备案透传号码APPId
        restAPI.setAppId("aaf98f8949f05c080149f06a372f0019");

//----------------------批量 区间
//        String cur = "020"+"62722000";
//        String end = "020"+"62722999";
//        List<String> numList = new ArrayList<String>();
//        int times = 0;
//        while(Long.parseLong(cur) <= Long.parseLong(end)){
//            times++;
//            numList.add(cur);
//            if(cur.equals(end) || times == 50){
//                System.out.println(cur);
//                result = restAPI.commitDisplayNumbers(numList);
//                System.out.println("SDKTestSendCommitDisplayNumbers result=" + result);
//                if("000000".equals(result.get("statusCode"))){
//                    //正常返回输出data包体信息（map）
//                    HashMap<String,Object> data = (HashMap<String, Object>) result.get("data");
//                    Set<String> keySet = data.keySet();
//                    for(String key:keySet){
//                        Object object = data.get(key);
//                        System.out.println(key +" = "+object);
//                    }
//                }else{
//                    //异常返回输出错误码和错误信息
//                    System.out.println("错误码=" + result.get("statusCode") +" 错误信息= "+result.get("statusMsg"));
//                }
//                numList.clear();
//                times = 0;
//            }
//            cur = "0" + (Long.parseLong(cur) + 1) + "";
//        }
//---------------------------单独透传
        List<String> numList = new ArrayList<String>();
        numList.add("01062128638");
//        numList.add("13911739487");
//        numList.add("18500697291");
//        numList.add("15010027605");
//        numList.add("18101093532");
//        numList.add("13521660363");
//        numList.add("13520759074");
//        numList.add("15311908125");
//        numList.add("13693190744");
//        numList.add("15711402335");
//        numList.add("18600342990");
//        numList.add("15600531483");
//        numList.add("13426409903");
//        numList.add("15510291676");
//        numList.add("13681220219");
//        numList.add("13811210414");
//        numList.add("13240299882");
//        numList.add("13522309758");
//        numList.add("18031211611");
        result = restAPI.commitDisplayNumbers(numList);
		System.out.println("SDKTestSendCommitDisplayNumbers result=" + result);
		if("000000".equals(result.get("statusCode"))){
			//正常返回输出data包体信息（map）
			HashMap<String,Object> data = (HashMap<String, Object>) result.get("data");
			Set<String> keySet = data.keySet();
			for(String key:keySet){
				Object object = data.get(key);
				System.out.println(key +" = "+object);
			}
		}else{
			//异常返回输出错误码和错误信息
			System.out.println("错误码=" + result.get("statusCode") +" 错误信息= "+result.get("statusMsg"));
		}


	}

}
