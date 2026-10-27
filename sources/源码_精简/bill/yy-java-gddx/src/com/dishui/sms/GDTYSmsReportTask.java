package com.dishui.sms;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.GDTYSmsUtil;
import com.dishui.util.SmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 1/7/15.
 */
public class GDTYSmsReportTask extends TimerTask {
    private static Logger log = Logger.getLogger(GDTYSmsReportTask.class.getName());

    @Override
    public void run() {
        try{
            ArrayList<Map<String, String>> reportList = GDTYSmsUtil.getReport();
            log.info("国度通用通道 获取短信状态报告: "+reportList);
            for(int i=0;i<reportList.size();i++){
                Map<String, String> curMap = reportList.get(i);
                DBObject find = new BasicDBObject();
                find.put("smsChannel", "gdty");
                find.put("gdty_msgid", curMap.get("taskid"));
                DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                if(sendDoc != null){
                    DBObject findAcc = new BasicDBObject();
                    findAcc.put("_id",sendDoc.get("account")+"_cc");

                    DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                    if(accDoc != null){
                        DBObject findSms = new BasicDBObject();
                        findSms.put("gdty_msgid", curMap.get("taskid"));
                        findSms.put("num", curMap.get("mobile"));
                        DBObject updateSms = new BasicDBObject();
                        if(curMap.get("status").equals("10")){
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机")
                                    .append("m7Status","deliver").append("receivetime",curMap.get("receivetime")));
                        }else{
                            updateSms.put("$set", new BasicDBObject("by_errordescription",
                                    "状态"+curMap.get("errorcode")).append("m7Status","undeliver"));
                        }
                        MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                    }
                }
            }
        }catch (Exception e){
            log.log(Level.WARNING, "GDTYSmsReportTask has exception", e);
        }
    }
}
