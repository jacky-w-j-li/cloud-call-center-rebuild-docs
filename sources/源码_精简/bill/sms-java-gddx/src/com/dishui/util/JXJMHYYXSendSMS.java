package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class JXJMHYYXSendSMS {
    private static Logger log = Logger.getLogger(JXJMHYYXSendSMS.class.getName());

    public static String url = "http://58.253.87.82:8718/smsgwhttp/sms/submit";//应用地址
    public static String ac = "106909126000";//下发接入号
    public static String spid = "570000";//企业账号
    public static String password = "ASDQWEWQ";//企业密码
    public static String mobiles = "15110157909";//手机号码，多个号码使用","分割
    public static String content = "您的验证码是：12345【七陌科技】";//短信内容
//    public static boolean needstatus = true;//是否需要状态报告，需要true，不需要false
//    public static String action = "send";//任务命令：发送接口
//    public static String actionCheck = "checkkeyword";//任务命令：校验内容接口
//    public static String extno = "";//扩展码
//    public static String sendTime = "";//发送时间：为空表示立即发送，定时发送格式2010-10-24 09:08:10

    // 发送短信;
    public static Map<String, String> sendSMS(String mobiles,String content) {
        Map<String, String> result = new HashMap<String, String>();
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc;
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
            try {
                DocumentBuilder db = dbf.newDocumentBuilder();
                InputStream is = URLConnIO.getSoapInputStream(url, getRequestData(mobiles, content).toString());
                doc = db.parse(is);

//                String returnstatus = doc.getElementsByTagName("returnsms").item(0).getFirstChild().getNodeValue();
                String resultFlag = doc.getElementsByTagName("result").item(0).getFirstChild().getNodeValue();
                String taskID = doc.getElementsByTagName("taskid").item(0).getFirstChild().getNodeValue();
                String desc = doc.getElementsByTagName("desc").item(0).getFirstChild().getNodeValue();

                if(resultFlag.equalsIgnoreCase("0")){
                    result.put("success", "true");
                    result.put("by_errordescription", "成功");
                    result.put("gd_msgid", taskID);
                }
                result.put("desc", desc);
                is.close();
            } catch (Exception e) {
                e.printStackTrace();
                log.warning("江西聚梦通知通道 发送短信失败!"+mobiles+" Exception:"+e);
            }
        return result;
    }

    // 拼接参数;
    private static StringBuffer getRequestData(String mobiles,String content) {
        StringBuffer requestAddRess = new StringBuffer();
        requestAddRess.append("ac=");
        requestAddRess.append(ac);
        requestAddRess.append("&spid=");
        requestAddRess.append(spid);
        requestAddRess.append("&password=");
        requestAddRess.append(password);
        if(!"".equals(mobiles)) {
            requestAddRess.append("&mobiles=");
            requestAddRess.append(mobiles);
        }
        requestAddRess.append("&content=");
        requestAddRess.append(content);

        return requestAddRess;
    }

    public static String handlerDeliverMessage(String str){
        try {
            str = URLDecoder.decode(str, "UTF-8");
            log.info("++++ JXJMHYYX URLDecoder= "+ str);
            HashMap<String,Object> map = (HashMap<String,Object>)SmsUtil.readStringXmlOut(str);
            ArrayList<HashMap<String,String>> list = null;
            if (map.get("report") instanceof List) {
                list = (ArrayList<HashMap<String,String>>)map.get("report");
            }else{
                list = new ArrayList<HashMap<String,String>>();
                list.add((HashMap<String,String>)map.get("report"));
            }
            for(int i=0;i<list.size();i++){
                DBObject find = new BasicDBObject();
                find.put("smsChannel", "jxjmtz");
                find.put("gd_msgid", list.get(i).get("taskid"));
                DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                if(sendDoc != null){
                    DBObject findAcc = new BasicDBObject();
                    findAcc.put("_id",sendDoc.get("account")+"_cc");

                    DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                    if(accDoc != null){
                        DBObject findSms = new BasicDBObject();
                        findSms.put("gd_msgid", list.get(i).get("taskid"));
                        findSms.put("num", list.get(i).get("mobile"));
                        DBObject updateSms = new BasicDBObject();
                        if(list.get(i).get("status").equals("0")){
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
                        }else{
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+list.get(i).get("errorcode")).append("m7Status","undeliver"));
                        }
                        MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "JXJMTZ handlerDeliverMessage:", e);
        }
        return "ok";
    }


    public static void main(String[] args) {
        //115.29.10.194   127.0.0.1
        InputStream is = URLConnIO.getSoapInputStream("http://127.0.0.1:8888/JXJMHYYXSmsService", "<?xml version=\"1.0\" encoding=\"utf-8\" ?>" +
                "<returnsms>" +
                "<report>" +
                "<mobile>13991553795</mobile>" +
                "<taskid>2016071214002200021</taskid>" +
                "<status>0</status>" +
                "<errcode>ok</errcode>" +
                "<receivetime>2016-07-12 14:00:27</receivetime>" +
                "</report>" +
//                "<statusbox>" +
//                "<mobile>15023239811</mobile>" +
//                "<taskid>1212</taskid>" +
//                "<status>10</status>" +
//                "<receivetime>2011-12-02 22:12:11</receivetime>" +
//                "<errorcode>DELIVRD</errorcode>" +
//                "</statusbox>" +
                "</returnsms>");

        try {
            String strResult = URLDecoder.decode(is.toString(), "UTF-8");
            System.out.printf(strResult);
//
//            sendSMS(mobiles,content);
        }catch (Exception e){

        }
    }
}
