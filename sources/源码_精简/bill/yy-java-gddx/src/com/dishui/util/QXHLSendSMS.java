package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;


public class QXHLSendSMS {
    private static final Logger log = Logger.getLogger(QXHLSendSMS.class.getName());
    private static String account="7moor_HY";
    private static String password="7moor_790";
    private static String server_url="http://vip.qixinhl.com/dx/push/sendMessage.action";

    public static void main(String args[])
    {
        String data = "<?xml version='1.0' encoding='UTF-8'?>" +
                "<reports>" +
                "  <report>" +
                "    <channel>164</channel>" +
                "    <msgId>352007</msgId>" +
                "    <status>1</status>" +
                "    <phoneNum>13920919774</phoneNum>" +
                "    <receiveTime>2013-04-24 09:41:00</receiveTime>" +
                "    <memo>DELIVRD</memo>" +
                "  </report>" +

                "</reports>";
        try {
            HashMap<String,Object> map = (HashMap<String,Object>)SmsUtil.readStringXmlOut(data);
            System.out.println(map);
//            System.out.println(HttpProvider.sendPost("http://115.29.10.194:8888/QXHLSmsService", data));
        } catch (Exception e) {
            e.printStackTrace();
        }
//        String DesMobiles="18600030392";
//        Map<String, String> testSmsResponse = QXHLSendSMS.sendSms(DesMobiles, "【七陌科技】陈光，您好，您的订单已处理请关闭，订单号：789654258！");
//        System.out.println("测试发送响应为："+testSmsResponse);
    }

    public static Map<String, String> sendSms(String DesMobile, String Content){
        Map<String, String> resMap = new HashMap<String, String>();
        resMap.put("success", "false");
        resMap.put("desc", "提交通道通信异常");

        try{
            String url = server_url + "?account="+account+"&password="+password+"&content="+Content+"&sendTime=&phoneNums="+DesMobile;
            System.out.println("发送的内容为："+url);

            String response = HttpProvider.sendGet(url);

            System.out.println(response);
            String[] resArray = response.split(";");
            if(resArray.length >= 1){
                HashMap<String,String> tmpMap = new HashMap<String, String>();
                for(int i=0;i<resArray.length;i++){
                    if(resArray[i].split("=").length > 1){
                        tmpMap.put(resArray[i].split("=")[0],resArray[i].split("=")[1]);
                    }
                }
                if(tmpMap.get("message").equals("0")){
                    resMap.put("success", "true");
                    resMap.put("gd_msgid", tmpMap.get("batchNumber"));
                    resMap.remove("desc");
                }else{
                    switch(Integer.parseInt(tmpMap.get("message")))
                    {
                        case 1:resMap.put("desc", "系统暂停发送短信");
                            break;
                        case 2:resMap.put("desc", "用户名或密码错误");
                            break;
                        case 3:resMap.put("desc", "没有分配通道组");
                            break;
                        case 4:resMap.put("desc", "必要属性为空或填写不合法");
                            break;
                        case 5:resMap.put("desc", "余额不足");
                            break;
                        case 6:resMap.put("desc", "短信包含敏感词");
                            break;
                        case 7:resMap.put("desc", "没有权限");
                            break;
                        case 8:resMap.put("desc", "推送地址为空");
                            break;
                        case 9:resMap.put("desc", "系统错误");
                            break;
                    }
                }
            }
        }catch (Exception e){
            log.log(Level.WARNING,"qxhl sms send has exception :",e);
        }
		return resMap;
    }

    public static String handlerDeliverMessage(String str){
            try {
                str = URLDecoder.decode(str, "UTF-8");
                log.info("++++ qxhl URLDecoder= "+ str);
                HashMap<String,Object> map = (HashMap<String,Object>)SmsUtil.readStringXmlOut(str);
                if(map.size() != 0){
                    ArrayList<HashMap<String,String>> list = null;
                    if (map.get("report") instanceof List) {
                        list = (ArrayList<HashMap<String,String>>)map.get("report");
                    }else{
                        list = new ArrayList<HashMap<String,String>>();
                        list.add((HashMap<String,String>)map.get("report"));
                    }
                    for(int i=0;i<list.size();i++){
                        DBObject find = new BasicDBObject();
                        find.put("smsChannel", "qxhl");
                        find.put("gd_msgid", list.get(i).get("msgId"));
                        DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                        if(sendDoc != null){
                            DBObject findAcc = new BasicDBObject();
                            findAcc.put("_id",sendDoc.get("account")+"_cc");

                            DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                            if(accDoc != null){
                                DBObject findSms = new BasicDBObject();
                                findSms.put("gd_msgid", list.get(i).get("msgId"));
                                findSms.put("num", list.get(i).get("phoneNum"));
                                DBObject updateSms = new BasicDBObject();
                                if(list.get(i).get("status").equals("1")){
                                    updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
                                }else{
                                    updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+list.get(i).get("memo")).append("m7Status","undeliver"));
                                }
                                MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "qxhl handlerDeliverMessage:", e);
            }
        return "ok";
    }
}

