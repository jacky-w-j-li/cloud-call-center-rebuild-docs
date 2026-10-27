package com.dishui.sms;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.GDTYNewSmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 12/19/15.
 */
public class GDTYNewSmsReportTask extends TimerTask {
    private static Logger log = Logger.getLogger(GDTYNewSmsReportTask.class.getName());

    @Override
    public void run() {
        try{
            ArrayList<Map<String, String>> reportList = GDTYNewSmsUtil.getReport();
            log.info("新国度通用通道 获取短信状态报告: "+reportList);
            for(int i=0;i<reportList.size();i++){
                Map<String, String> curMap = reportList.get(i);
                DBObject find = new BasicDBObject();
                find.put("smsChannel", "gdtynew");
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
            log.log(Level.WARNING, "GDTYNewSmsReportTask has exception", e);
        }
    }
}
