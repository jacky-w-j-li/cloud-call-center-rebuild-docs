package com.dishui.sms;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.SmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Logger;

/**
 * Created by chenguang on 1/7/15.
 */
public class SmsReportTask extends TimerTask {
    private static Logger log = Logger.getLogger(SmsReportTask.class.getName());

    @Override
    public void run() {
        Map resMap = SmsUtil.getReport();
        if(resMap.get("result").toString().equals("0")){
            if(resMap.containsKey("report")){
                if(resMap.get("report") instanceof Map){
                    Map<String,String> cur = (Map<String,String>)resMap.get("report");
                    String msgid = cur.get("msgid");

                    DBObject find = new BasicDBObject();
                    find.put("st_msgid", msgid);
                    DBObject curSms = MongoProvider.findOne("cc", "app_sms_send",find);
                    if(curSms == null){
                       return;
                    }
                    DBObject setDoc = new BasicDBObject();
                    setDoc.put("st_wgcode", cur.get("wgcode"));
                    setDoc.put("st_time", cur.get("time"));
                    setDoc.put("st_phone", cur.get("phone"));
                    setDoc.put("st_desc", cur.get("desc"));
                    setDoc.put("st_status", cur.get("status"));
                    DBObject numReport = new BasicDBObject();
                    numReport.put(cur.get("phone"), setDoc);
                    if(cur.get("status").equals("0")){
                        numReport.put("m7Status", "success");
                    }else{
                        numReport.put("m7Status", "fail");
                    }
                    String account = curSms.get("account").toString();
                    MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",numReport), account);
                    MongoConnect.getInstance().getDB("cc").getCollection("app_sms_send").remove(find);
                    if(cur.get("status").equals("0")){
                        DBObject billDoc = new BasicDBObject();
                        billDoc.put("_id", Utils.getUniqueid());
                        billDoc.put("reportTime", cur.get("time"));
                        billDoc.put("num", cur.get("phone"));
                        billDoc.put("account", curSms.get("account"));
                        billDoc.put("content", curSms.get("content"));
                        billDoc.put("submitTime", curSms.get("submitTime"));
                        billDoc.put("st_msgid", msgid);
                        billDoc.put("smsId", curSms.get("_id"));
                        billDoc.put("product", curSms.get("product"));
                        MongoProvider.insert("bill_data","bill_sms",billDoc);
                    }
                }else if(resMap.get("report") instanceof List){
                    List<Map<String,String>> reportList = (List<Map<String,String>>)resMap.get("report");
                    for(int i=0 ;i<reportList.size() ;i++){
                        Map<String,String> cur = reportList.get(i);
                        String msgid = cur.get("msgid");
                        DBObject find = new BasicDBObject();
                        find.put("st_msgid", msgid);
                        DBObject curSms = MongoProvider.findOne("cc", "app_sms_send",find);
                        if(curSms == null){
                            continue;
                        }
                        DBObject setDoc = new BasicDBObject();
                        setDoc.put("st_wgcode", cur.get("wgcode"));
                        setDoc.put("st_time", cur.get("time"));
                        setDoc.put("st_phone", cur.get("phone"));
                        setDoc.put("st_desc", cur.get("desc"));
                        setDoc.put("st_status", cur.get("status"));
                        DBObject numReport = new BasicDBObject();
                        numReport.put(cur.get("phone"), setDoc);
                        if(cur.get("status").equals("0")){
                            numReport.put("m7Status", "success");
                        }else{
                            numReport.put("m7Status", "fail");
                        }
                        String account = curSms.get("account").toString();
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",numReport), account);
                        MongoConnect.getInstance().getDB("cc").getCollection("app_sms_send").remove(find);
                        if(cur.get("status").equals("0")){
                            DBObject billDoc = new BasicDBObject();
                            billDoc.put("_id", Utils.getUniqueid());
                            billDoc.put("reportTime", cur.get("time"));
                            billDoc.put("num", cur.get("phone"));
                            billDoc.put("account", curSms.get("account"));
                            billDoc.put("content", curSms.get("content"));
                            billDoc.put("submitTime", curSms.get("submitTime"));
                            billDoc.put("st_msgid", msgid);
                            billDoc.put("smsId", curSms.get("_id"));
                            billDoc.put("product", curSms.get("product"));
                            MongoProvider.insert("bill_data","bill_sms",billDoc);
                        }
                    }
                }
            }
        }else{
            log.warning("get sms report failed! result="+resMap.get("result")+" desc="+resMap.get("desc"));
        }
    }
}
