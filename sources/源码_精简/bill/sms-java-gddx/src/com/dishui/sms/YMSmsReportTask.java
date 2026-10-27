package com.dishui.sms;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.GDTYSmsUtil;
import com.dishui.util.YMSmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Logger;

/**
 * Created by chenguang on 20/7/15.
 */
public class YMSmsReportTask extends TimerTask {
    private static Logger log = Logger.getLogger(YMSmsReportTask.class.getName());

    @Override
    public void run() {
        ArrayList<Map<String, String>> reportList = YMSmsUtil.getReport();
        if(reportList.size()>0){
            log.info("易米通道 获取短信状态报告: "+reportList);
        }
        for(int i=0;i<reportList.size();i++){
            Map<String, String> curMap = reportList.get(i);
            DBObject find = new BasicDBObject();
            find.put("ym_msgid", curMap.get("smsId"));
            find.put("smsChannel", "ym");
            DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
            if(sendDoc != null){
                DBObject findAcc = new BasicDBObject();
                findAcc.put("_id",sendDoc.get("account")+"_cc");

                DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                if(accDoc != null){
                    DBObject findSms = new BasicDBObject();
                    findSms.put("ym_msgid", curMap.get("smsId"));
                    findSms.put("num", curMap.get("mdn"));
                    DBObject updateSms = new BasicDBObject();
                    if(curMap.get("status").equals("0")){
                        updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机")
                                .append("m7Status","deliver").append("receivetime",curMap.get("arrive_time")));
                    }else{
                        updateSms.put("$set", new BasicDBObject("by_errordescription",
                                "状态"+curMap.get("status")+curMap.get("statdesc")).append("m7Status","undeliver"));
                    }
                    MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                }
            }
        }
    }
}
