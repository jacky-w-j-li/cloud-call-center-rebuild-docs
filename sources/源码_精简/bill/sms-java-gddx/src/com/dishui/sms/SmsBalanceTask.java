package com.dishui.sms;

import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.SmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Logger;

/**
 * Created by chenguang on 1/7/15.
 */
public class SmsBalanceTask extends TimerTask {
    private static Logger log = Logger.getLogger(SmsBalanceTask.class.getName());

    @Override
    public void run() {
        Map resMap = SmsUtil.getBalance();
        //{result=0, desc=, sms={amount=1.8, freeze=0.0, number=36}}
        if(resMap.get("result").toString().equals("0")){
            if(resMap.containsKey("sms")){
                Map<String,String> cur = (Map<String,String>)resMap.get("sms");
                DBObject doc = new BasicDBObject();
                doc.put("_id", Utils.getUniqueid());
                doc.put("st_amount", cur.get("amount"));
                doc.put("st_freeze", cur.get("freeze"));
                doc.put("st_number", cur.get("number"));
                doc.put("time", Utils.getCurrentDate());

                MongoProvider.insert("cc", "app_sms_balance", doc);

                float waringVal = Float.parseFloat(AppConfig.getInstance().getSmsBalanceWarning());
                if(Float.parseFloat(cur.get("amount")) <= waringVal){
                    DBObject mail = new BasicDBObject();
                    List<String> tolist = new ArrayList<String>();
                    tolist.add("yunwei@7moor.com");
                    List<String> cclist = new ArrayList<String>();
                    cclist.add("dev@7moor.com");
                    mail.put("toAddr", tolist);
                    mail.put("type","cdrWarning");
                    mail.put("subject","短信通道余额超过预警值");
                    mail.put("ccAddr", cclist);
                    mail.put("status","undeal");
                    mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
                    mail.put("content", "我们短信通道(大汉三通)余额小于预警值:"+waringVal
                            +"<br>当前余额 "+ cur.get("amount")
                            +"<br>冻结余额 "+ cur.get("freeze")
                            +"<br>剩余条数 "+ cur.get("number"));

                    MongoProvider.insert("bill_system_mail_send", mail);
                }
            }
        }else{
            log.warning("get sms balance failed! result="+resMap.get("result")+" desc="+resMap.get("desc"));
        }
    }
}
