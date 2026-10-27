package com.dishui.util;

import com.bcloud.msg.http.HttpSender;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.logging.Logger;

public class YMNewSendSMS {
    private static Logger log = Logger.getLogger(YMNewSendSMS.class.getName());

    public static String uri = "http://120.26.66.24/msg/HttpSendSM";//应用地址
    public static String batchUri = "http://120.26.66.24/msg/HttpBatchSendSM";//群发应用地址
    public static String account = "bjrlqm_hy";//账号
    public static String pswd = "bjrlqm_hy123";//密码
//    public static String mobiles = "18600030392";//手机号码，多个号码使用","分割
//    public static String content = "短信接口【七陌科技】";//短信内容
    public static boolean needstatus = true;//是否需要状态报告，需要true，不需要false
    public static String product = "";//产品ID
    public static String extno = "";//扩展码

    // 发送短信;
    public static Map<String, String> sendSMS(String phone,String content,String ext) {
        Map<String, String> result = new HashMap<String, String>();
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
        try{
            String returnString = HttpSender.batchSend(batchUri, account, pswd, phone, content, needstatus, product, ext);
            System.out.println(returnString);
            //20151106144801,0\n2021106144801768800\n
            String[] resArr = returnString.split("\n");

            if(resArr.length > 1){
                String[] subResArr = resArr[0].split(",");
                if(subResArr[1].equals("0")){
                    result.put("success", "true");
                    result.put("by_errordescription", "提交通道成功");
                    result.put("ym_msgid", resArr[1]);
                }else{
                    result.put("by_errordescription", subResArr[1]);
                }
            }else{
                String[] subResArr = resArr[0].split(",");
                result.put("by_errordescription", subResArr[1]);
            }
        }catch (Exception e){
            e.printStackTrace();
            log.warning("新易米通知通道 发送短信失败!" + phone + " Exception:" + e);
        }
        return result;
    }

    public static String handlerDeliverMessage(Hashtable<String, String> map){
        try {
            DBObject find = new BasicDBObject();
            find.put("smsChannel", "ymnew");
            find.put("ym_msgid", map.get("msgid"));
            DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
            if(sendDoc != null){
                DBObject findAcc = new BasicDBObject();
                findAcc.put("_id",sendDoc.get("account")+"_cc");

                DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                if(accDoc != null){
                    DBObject findSms = new BasicDBObject();
                    findSms.put("ym_msgid", map.get("msgid"));
                    findSms.put("num",  map.get("mobile"));
                    DBObject updateSms = new BasicDBObject();
                    if(map.get("status").equals("DELIVRD")){
                        updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机")
                                .append("m7Status","deliver").append("receivetime", map.get("reportTime")));
                    }else{
                        updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+map.get("status")).append("m7Status","undeliver"));
                    }
                    MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                }
            }
        } catch (Exception e) {
            log.warning("YMNEW handlerDeliverMessage: exception :"+e);
        }
        return "OK";
    }



	public static void main(String[] args) {
		String uri = "http://120.26.66.24/msg/HttpSendSM";//应用地址
        String batchUri = "http://120.26.66.24/msg/HttpBatchSendSM";//群发应用地址

		String account = "bjrlqm_hy";//账号
		String pswd = "bjrlqm_hy123";//密码
		String mobiles = "18600030392";//手机号码，多个号码使用","分割
		String content = "短信接口";//短信内容
		boolean needstatus = true;//是否需要状态报告，需要true，不需要false
		String product = "";//产品ID
		String extno = "";//扩展码
//		try {
//			String returnString = HttpSender.send(uri, account, pswd, mobiles, content, needstatus, product, extno);
//			System.out.println(returnString);
//			//TODO 处理返回值,参见HTTP协议文档
//		} catch (Exception e) {
//			//TODO 处理异常
//			e.printStackTrace();
//		}
		try {
			String returnString = HttpSender.batchSend(batchUri, account, pswd, mobiles, content, needstatus, product, extno);
			System.out.println(returnString);
            String[] resArr = returnString.split("\n");
            if(resArr.length > 1){
                String[] subResArr = resArr[0].split(",");
                if(subResArr[1].equals("0")){
                    System.out.printf("success");
                    System.out.printf(subResArr[0]);
                    System.out.printf(resArr[1]);
                }else{
                    System.out.printf("failed");
                    System.out.printf(subResArr[1]);
                }
            }else{
                String[] subResArr = resArr[0].split(",");
                System.out.printf("failed2");
                System.out.printf(subResArr[1]);
            }
			//TODO 处理返回值,参见HTTP协议文档
		} catch (Exception e) {
			//TODO 处理异常
			e.printStackTrace();
		}
	}
}
