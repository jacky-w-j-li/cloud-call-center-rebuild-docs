package com.dishui.sms;

import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.SmsTimer;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.GDTYSmsUtil;
import com.dishui.util.JXJMTZSendSMS;
import com.dishui.util.SmsForbiddenWordCheckUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 2/6/15.
 */
public class JXJMTZSmsMaster {
    private static Logger log = Logger.getLogger(JXJMTZSmsMaster.class.getName());

    public static JXJMTZSmsMaster instance;
    private Thread smsThread;
    private GDTYSmsReportTask smsReportTask;
    private boolean running = true;
    private long waitTime = 1000;
    private boolean isSending = false;

    public static JXJMTZSmsMaster getInstance(){
        if(instance == null){
            new JXJMTZSmsMaster();
        }
        return instance;
    }

    private JXJMTZSmsMaster(){
        instance = this;
        this.smsThread = new Thread("JXJMTZ sms send thread") {
            @Override
            public void run() {
                while (running) {
                    try {
                        if (!isSending) {
                            isSending = true;
                            try {
                                processSmsSend();
                            } catch (Exception e) {
                                log.log(Level.WARNING, "", e);
                            } finally {
                                isSending = false;
                            }
                        } else {
                            log.log(Level.WARNING, "prev JXJMTZ sms process is still running!,wait ........");
                        }
                    } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                    }
                    try {
                        sleep(waitTime);
                    } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                    }
                }
            }
        };
        this.smsThread.setDaemon(true);
        this.smsThread.start();

        if(AppConfig.getInstance().getSmsGdtyReport().equals("yes")){
            smsReportTask = new GDTYSmsReportTask();
            SmsTimer.getInstance().scheduleAtFixedRate(smsReportTask ,new Date(), 90 * 1000);
        }
    }

    public void processSmsSend() {
        DBObject findNew = new BasicDBObject();
        findNew.put("m7Status","ready");
        findNew.put("smsChannel","jxjmtz");
        findNew.put("isBatch",new BasicDBObject("$ne", true));
        List<DBObject> list = MongoProvider.find("cc", "app_sms_send", findNew);
        if(list.size()>0){
            log.info("本次发送 "+list.size()+" 条 JXJMTZ sms------");
            for(int i=0 ;i<list.size() ;i++){
                DBObject curSms = list.get(i);
                String product = curSms.get("product").toString();
                String account = curSms.get("account").toString();

                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());
                DBObject updateDoc = new BasicDBObject();

                String checkResult = JXJMTZSendSMS.checkContent(curSms.get("content").toString());
                if(!checkResult.equals("true")){
                    updateDoc.put("by_errordescription", "提交通道失败:含有违禁词("+checkResult+")");
                    updateDoc.put("m7Status", "forbiddenWord");
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    continue;
                }
                Map<String, String> resMap = JXJMTZSendSMS.sendSMS(curSms.get("num").toString(), curSms.get("content").toString() + curSms.get("signDisplay").toString());
                if(resMap.get("success").equals("true")){
                    updateDoc.put("by_errordescription", "成功");
                    updateDoc.put("m7Status", "send");
                    updateDoc.put("jxjmtz_msgid", resMap.get("jxjmtz_msgid"));
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    //to insert kou fei biao
                    MongoProvider.insert("bill_data", "bill_sms", curSms);
//                    if(resMap.containsKey("jxjmtz_remainpoint")){
//                        BasicDBObject updateRemain = new BasicDBObject("jxjmtz_remainpoint", resMap.get("jxjmtz_remainpoint"));
//                        MongoProvider.update("platform_sms_channel", new BasicDBObject("_id","jxjmtz"), new BasicDBObject("$set", updateRemain));
//                    }
                }else{
                    updateDoc.put("by_errordescription", "提交通道失败:"+resMap.get("desc"));
                    updateDoc.put("m7Status", "sendFail");

                    MongoProvider.update(account + "_sms", find, new BasicDBObject("$set", updateDoc), account);
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }
            }
        }

        findNew.put("m7Status", "ready");
        findNew.put("smsChannel","jxjmtz");
        findNew.put("isBatch", true);
        List<DBObject> batchList = MongoProvider.find("cc", "app_sms_send", findNew);
        if(batchList.size()>0){
            log.info("本次发送 "+batchList.size()+" 条 群发 JXJMTZ sms------");
            for(int i=0 ;i<batchList.size() ;i++){
                DBObject curSms = batchList.get(i);
                String account = curSms.get("account").toString();
                String[] numArr = curSms.get("nums").toString().split(",");

                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());

                String checkResult = JXJMTZSendSMS.checkContent(curSms.get("content").toString());
                if(!checkResult.equals("true")){
                    DBObject updateDoc = new BasicDBObject();
                    updateDoc.put("by_errordescription", "提交通道失败:含有违禁词("+checkResult+")");
                    updateDoc.put("m7Status", "forbiddenWord");
                    for(int j=0 ;j<numArr.length ;j++){
                        curSms.removeField("nums");
                        curSms.put("_id", Utils.getUniqueid());
                        curSms.put("num",numArr[j]);
                        curSms.put("m7Status", "forbiddenWord");
                        curSms.put("by_errordescription", "提交通道失败:含有违禁词("+checkResult+")");
                        MongoProvider.insert(account+"_sms", curSms, account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    continue;
                }
                int count = 0;
                StringBuilder toSendNums = new StringBuilder();
                ArrayList<String> toSaveNums = new ArrayList<String>();

                for(int j=0 ;j<numArr.length ;j++){
                    count++;
                    toSendNums.append(numArr[j]);
                    toSaveNums.add(numArr[j]);
                    if(count == 1000 || j == numArr.length-1){
                        Map<String, String> resMap = JXJMTZSendSMS.sendSMS(toSendNums.toString(), curSms.get("content").toString() + curSms.get("signDisplay").toString());
                        DBObject updateDoc = new BasicDBObject();
                        if(resMap.get("success").equals("true")){
                            updateDoc.put("by_errordescription", "成功");
                            updateDoc.put("m7Status", "send");
//                            updateDoc.put("jxjmtz_msgid", resMap.get("jxjmtz_msgid"));
                            DBObject updateDocSendId = new BasicDBObject();
                            updateDocSendId.put("$set",updateDoc);
                            updateDocSendId.put("$addToSet", new BasicDBObject("jxjmtz_msgid", resMap.get("jxjmtz_msgid")));
                            MongoProvider.update("cc", "app_sms_send", find, updateDocSendId);
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id", Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errordescription", "成功");
                                curSms.put("jxjmtz_msgid", resMap.get("jxjmtz_msgid"));

                                MongoProvider.insert(account+"_sms", curSms, account);
                                //to insert bill
                                MongoProvider.insert("bill_data", "bill_sms", curSms);
                            }
//                            if(resMap.containsKey("jxjmtz_remainpoint")){
//                                BasicDBObject updateRemain = new BasicDBObject("jxjmtz_remainpoint", resMap.get("jxjmtz_remainpoint"));
//                                MongoProvider.update("platform_sms_channel", new BasicDBObject("_id","jxjmtz"), new BasicDBObject("$set", updateRemain));
//                            }
                        }else{
                            updateDoc.put("by_errordescription", "提交通道失败" + resMap.get("desc"));
                            updateDoc.put("m7Status", "sendFail");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errordescription", "提交通道失败" + resMap.get("desc"));

                                MongoProvider.insert(account+"_sms", curSms, account);
                            }
                        }
                        //to send
                        count = 0;
                        toSendNums = new StringBuilder();
                        toSaveNums = new ArrayList<String>();
                    }else{
                        toSendNums.append(",");
                    }
                }
            }
        }
    }

}
