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

public class JXJMYXSendSMS {
    private static Logger log = Logger.getLogger(JXJMYXSendSMS.class.getName());

    public static String url = "http://139.224.60.78:8888/sms.aspx";//应用地址（UTF-8）
//    public static String url = "http://116.255.238.178:5566/sms.aspx";//应用地址（UTF-8）
//    public static String batchUri = "http://120.26.66.24/msg/HttpBatchSendSM";//群发应用地址
    public static String userid = "5461";//企业ID
    public static String account = "北京容联七陌营销";//账号
    public static String password = "123456";//密码
//    public static String mobiles = "15110157909";//手机号码，多个号码使用","分割
//    public static String content = "我们是容联七陌科技，感谢您的支持！【七陌科技】";//短信内容
//    public static boolean needstatus = true;//是否需要状态报告，需要true，不需要false
    public static String action = "send";//任务命令：发送接口
    public static String actionCheck = "checkkeyword";//任务命令：校验内容接口
    public static String extno = "";//扩展码
    public static String sendTime = "";//发送时间：为空表示立即发送，定时发送格式2010-10-24 09:08:10

    // 发送短信;
    public static Map<String, String> sendSMS(String mobile,String content) {
        Map<String, String> result = new HashMap<String, String>();
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc;
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
            try {
                DocumentBuilder db = dbf.newDocumentBuilder();
                InputStream is = URLConnIO.getSoapInputStream(url, getRequestData(mobile,content).toString());
                doc = db.parse(is);

                String returnstatus = doc.getElementsByTagName("returnstatus").item(0).getFirstChild().getNodeValue();
                String message = doc.getElementsByTagName("message").item(0).getFirstChild().getNodeValue();
                String remainpoint = doc.getElementsByTagName("remainpoint").item(0).getFirstChild().getNodeValue();
                String taskID = doc.getElementsByTagName("taskID").item(0).getFirstChild().getNodeValue();
                String successCounts = doc.getElementsByTagName("successCounts").item(0).getFirstChild().getNodeValue();

                if(returnstatus.equalsIgnoreCase("Success")){
                    result.put("success", "true");
                    result.put("by_errordescription", "成功");
                    result.put("jxjmyx_msgid", taskID);
                    result.put("jxjmyx_remainpoint", remainpoint);
                }
                result.put("desc", message);
                is.close();
            } catch (Exception e) {
                e.printStackTrace();
                log.warning("江西聚梦营销通道 发送短信失败!"+mobile+" Exception:"+e);
            }
        return result;
    }

    // 拼接参数;
    private static StringBuffer getRequestData(String mobile,String content) {
        StringBuffer requestAddRess = new StringBuffer();
        requestAddRess.append("userid=");
        requestAddRess.append(userid);
        requestAddRess.append("&account=");
        requestAddRess.append(account);
        requestAddRess.append("&password=");
        requestAddRess.append(password);
        if(!"".equals(mobile)) {
            requestAddRess.append("&mobile=");
            requestAddRess.append(mobile);
            requestAddRess.append("&action=");
            requestAddRess.append(action);
        }else{
            requestAddRess.append("&action=");
            requestAddRess.append(actionCheck);
        }
        requestAddRess.append("&content=");
        requestAddRess.append(content);
        if(extno != null){
            requestAddRess.append("&extno=");
            requestAddRess.append(extno);
        }
        return requestAddRess;
    }


    // 发送内容校验;
    public static String checkContent(String content) {
        String result = "true";
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc;
        try {
            DocumentBuilder db = dbf.newDocumentBuilder();
            InputStream is = URLConnIO.getSoapInputStream(url, getRequestData("", content).toString());
            doc = db.parse(is);

            String message = doc.getElementsByTagName("message").item(0).getFirstChild().getNodeValue();

            if(message.equalsIgnoreCase("没有包含屏蔽词")){//未包含非法字符
                result = "true";
            }else{
                result = message;
            }
            is.close();
        } catch (Exception e) {
            e.printStackTrace();
            log.warning("江西聚梦营销通道 校验短信内容失败! Exception:"+e);
        }
        return result;
    }

    public static String handlerDeliverMessage(String str){
        try {
            str = URLDecoder.decode(str, "UTF-8");
            log.info("++++ JXJMYX URLDecoder= "+ str);
            HashMap<String,Object> map = (HashMap<String,Object>)SmsUtil.readStringXmlOut(str);
            ArrayList<HashMap<String,String>> list = null;
            if(map.size() != 0){
                if (map.get("statusbox") instanceof List) {
                    list = (ArrayList<HashMap<String,String>>)map.get("statusbox");
                }else{
                    list = new ArrayList<HashMap<String,String>>();
                    list.add((HashMap<String,String>)map.get("statusbox"));
                }
                for(int i=0;i<list.size();i++){
                    DBObject find = new BasicDBObject();
                    find.put("smsChannel", "jxjmyx");
                    find.put("jxjmyx_msgid", list.get(i).get("taskid"));
                    DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                    if(sendDoc != null){
                        DBObject findAcc = new BasicDBObject();
                        findAcc.put("_id",sendDoc.get("account")+"_cc");

                        DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                        if(accDoc != null){
                            DBObject findSms = new BasicDBObject();
                            findSms.put("jxjmyx_msgid", list.get(i).get("taskid"));
                            findSms.put("num", list.get(i).get("mobile"));
                            DBObject updateSms = new BasicDBObject();
                            if(list.get(i).get("status").equals("10")){
                                updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
                            }else{
                                updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+list.get(i).get("errorcode")).append("m7Status","undeliver"));
                            }
                            MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "JXJMYX handlerDeliverMessage:", e);
        }
        return "ok";
    }

}
