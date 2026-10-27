package com.dishui.util;

import com.dishui.bill.command.JSONReader;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;


public class JXFXSendSMS {
    private static final Logger log = Logger.getLogger(JXFXSendSMS.class.getName());
    private static String username="bjrlqm";
    private static String password="NJf7SCtX";
    private static String server_url="http://api.app2e.com/smsBigSend.api.php";

    public static void main(String args[])
    {
//        String DesMobiles="18600030392,17051100392";
//        Map<String, Object> testSmsResponse = JXFXSendSMS.sendSms(DesMobiles, "【兴隆】您好，您的验证码是:561236","");
//        System.out.println("测试发送响应为："+testSmsResponse);

        String str = "mid=%5B%223187b3e09d78c128%2CDELIVRD%22%5D";
        JXFXSendSMS.handlerDeliverMessage(str);
    }

    public static Map<String, Object> sendSms(String DesMobile, String Content,String extnum){
        Map<String, Object> resMap = new HashMap<String, Object>();
        resMap.put("success", "false");
        resMap.put("desc", "提交通道通信异常");

        try{
            String data = "username="+username+"&pwd="+SmsUtil.MD5Encode(password)+"&msg="+Content+"&sendTime=&p="+DesMobile+"&isUrlEncode=no&charSetStr=utf&extnum="+extnum;
            System.out.println("发送的内容为："+data);

            String response = HttpProvider.sendPost(server_url, data);
            System.out.println(response);
            JSONReader jr = new JSONReader();
            HashMap<String, Object> tmpMap = null;
            tmpMap = (HashMap<String, Object>)jr.read(response);

            //{"status":100,"count":1,"list":[{"p":"18600030392","mid":"8a49e9b50ee8d248"}]}
            String status = tmpMap.get("status").toString();

            if(status.equals("100")){
                resMap.put("success", "true");
                ArrayList<HashMap<String,String>> tmpList = (ArrayList<HashMap<String,String>>)tmpMap.get("list");
                ArrayList<String> endList = new ArrayList<String>();
                HashMap<String, String> endMap = new HashMap<String, String>();
                for(int i=0; i<tmpList.size(); i++){
                    endList.add(tmpList.get(i).get("mid"));
                    endMap.put(tmpList.get(i).get("p"), tmpList.get(i).get("mid"));
                }
                resMap.put("gd_msgid", endList);
                resMap.put("jxfx_map", endMap);
                resMap.remove("desc");
            }else{
                switch(Integer.parseInt(status))
                {
                    case 101:resMap.put("desc", "参数错误");
                        break;
                    case 102:resMap.put("desc", "号码错误");
                        break;
                    case 103:resMap.put("desc", "当日余量不足");
                        break;
                    case 104:resMap.put("desc", "请求超时");
                        break;
                    case 105:resMap.put("desc", "用户余量不足");
                        break;
                    case 106:resMap.put("desc", "非法用户");
                        break;
                    case 107:resMap.put("desc", "提交号码超限");
                        break;
                    case 111:resMap.put("desc", "签名不合法");
                        break;
                    case 120:resMap.put("desc", "内容长度超长，请不要超过500个字");
                        break;
                    case 121:resMap.put("desc", "内容中有屏蔽词");
                        break;
                    case 131:resMap.put("desc", "IP非法");
                        break;
                }
            }

        }catch (Exception e){
            log.warning("JXFX sms send has exception :"+e);
        }
		return resMap;
    }

    public static String handlerDeliverMessage(String str){
            try {
                str = URLDecoder.decode(str, "GBK");
                log.info("++++JXFX URLDecoder= "+ str);
                str = str.substring(4);
                JSONReader jr = new JSONReader();
                ArrayList<String> reports = (ArrayList<String>)jr.read(str);

                for(int i=0 ;i<reports.size() ;i++){
                    String[] item = reports.get(i).split(",");

                    DBObject find = new BasicDBObject();
                    find.put("smsChannel", "jxfx");
                    find.put("gd_msgid", item[0]);
                    DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                    if(sendDoc != null){
                        DBObject findAcc = new BasicDBObject();
                        findAcc.put("_id",sendDoc.get("account")+"_cc");

                        DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                        if(accDoc != null){
                            DBObject findSms = new BasicDBObject();
                            findSms.put("gd_msgid", item[0]);
                            findSms.put("smsChannel", "jxfx");
                            DBObject updateSms = new BasicDBObject();
                            if(item[1].equals("DELIVRD")){
                                updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
                            }else{
                                updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+item[1]).append("m7Status","undeliver"));
                            }
                            MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                        }
                   }
                }

            } catch (Exception e) {
                log.log(Level.WARNING,"handlerDeliverMessage: exception :", e);
            }
        return "{\"status\":1}";
    }
}

