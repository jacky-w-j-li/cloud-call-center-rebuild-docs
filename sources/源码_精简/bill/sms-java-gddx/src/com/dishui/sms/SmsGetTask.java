package com.dishui.sms;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.SmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Logger;

/**
 * Created by chenguang on 1/7/15.
 */
public class SmsGetTask extends TimerTask {
    private static Logger log = Logger.getLogger(SmsGetTask.class.getName());

    @Override
    public void run() {
        Map resMap = SmsUtil.getSms();
        if(resMap.get("result").toString().equals("0")){
            if(resMap.containsKey("sms")){
                if(resMap.get("sms") instanceof Map){
                    Map<String,String> cur = (Map<String,String>)resMap.get("sms");
                    DBObject doc = new BasicDBObject();
                    doc.put("_id", Utils.getUniqueid());
                    doc.put("type", "receive");
                    doc.put("num", cur.get("phone"));
                    doc.put("content", cur.get("content"));
                    doc.put("st_subcode", cur.get("subcode"));
                    doc.put("st_delivertime", cur.get("delivertime"));
                    DBObject findAcc = new BasicDBObject();
                    findAcc.put("subcode", cur.get("subcode"));
                    DBObject accSignDoc = MongoProvider.findOne("cc", "app_sms_sign", findAcc);
                    String account = accSignDoc.get("account").toString();
                    doc.put("account", account);

                    MongoProvider.insert(account+"_sms", doc, account);
                }else if(resMap.get("sms") instanceof List) {
                    List<Map<String,String>> smsList = (List<Map<String,String>>)resMap.get("sms");
                    for(int i=0 ;i<smsList.size() ;i++){
                        Map<String,String> cur = smsList.get(i);
                        DBObject doc = new BasicDBObject();
                        doc.put("_id", Utils.getUniqueid());
                        doc.put("type", "receive");
                        doc.put("num", cur.get("phone"));
                        doc.put("content", cur.get("content"));
                        doc.put("st_subcode", cur.get("subcode"));
                        doc.put("st_delivertime", cur.get("delivertime"));
                        DBObject findAcc = new BasicDBObject();
                        findAcc.put("subcode", cur.get("subcode"));
                        DBObject accSignDoc = MongoProvider.findOne("cc", "app_sms_sign", findAcc);
                        String account = accSignDoc.get("account").toString();
                        doc.put("account", account);

                        MongoProvider.insert(account+"_sms", doc, account);
                    }
                }
            }
        }else{
            log.warning("get sms failed! result="+resMap.get("result")+" desc="+resMap.get("desc"));
        }
    }
}
