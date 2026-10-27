package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by shenjc on 11/07/16.
 */
public class JXJMHYYXSmsUtil {
    public static String spid = "570000";
    public static String password = "ASDQWEWQ";
    public static String url = "http://58.253.87.82:8718/smsgwhttp/sms/report";
    private static Logger log = Logger.getLogger(JXJMHYYXSmsUtil.class.getName());


    public static Map<String,String> getReport() {

        try{

            log.warning("开始获取江西聚梦直连会员营销短信报告!");
            String httpRes = HttpProvider.sendPost(url, getRequestData().toString().getBytes(), 60000);
            log.info("++++ JXJMHYYX getReport= "+ httpRes);
            HashMap<String,Object> map = (HashMap<String,Object>)SmsUtil.readStringXmlOut(httpRes);
            if(map.size() != 0){
                ArrayList<HashMap<String,String>> list = null;
                if (map.get("report") instanceof List) {
                    list = (ArrayList<HashMap<String,String>>)map.get("report");
                }else{
                    list = new ArrayList<HashMap<String,String>>();
                    list.add((HashMap<String,String>)map.get("report"));
                }
                log.info("++++ JXJMHYYX 本次共获取到"+ list.size()+ "条数据 ++++");
                for(int i=0;i<list.size();i++){
                    DBObject find = new BasicDBObject();
                    find.put("smsChannel", "jxjmhyyx");
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
                                updateSms.put("$set", new BasicDBObject("by_errordescription", "状态:发送失败（"+list.get(i).get("status")+"）").append("m7Status","undeliver"));
                            }
                            MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                        }
                    }
                }
            }
        }catch (Exception e){
            log.log(Level.WARNING, "JXJMHYYXSmsReportTask has exception", e);
        }



        Map<String,String> map = null;

        return map;
    }


    // 拼接参数;
    private static StringBuffer getRequestData() {
        StringBuffer requestAddRess = new StringBuffer();
        requestAddRess.append("spid=");
        requestAddRess.append(spid);
        requestAddRess.append("&password=");
        requestAddRess.append(password);
        return requestAddRess;
    }
}
