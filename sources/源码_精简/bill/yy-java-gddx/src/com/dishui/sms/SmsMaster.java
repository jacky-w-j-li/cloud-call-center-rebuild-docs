package com.dishui.sms;

import com.dishui.bill.service.SmsTimer;
import com.dishui.bill.service.Utils;
import com.dishui.util.SmsUtil;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 1/20/15.
 */
public class SmsMaster {
    private static Logger log = Logger.getLogger(SmsMaster.class.getName());

    public static SmsMaster instance;
    private Thread smsThread;
    private SmsReportTask smsReportTask;
    private SmsGetTask smsGetTask;
    private SmsBalanceTask smsBalanceTask;
    private boolean running = true;
    private long waitTime = 1000;
    private boolean isSending = false;

    public static SmsMaster getInstance(){
        if(instance == null){
            new SmsMaster();
        }
        return instance;
    }

    private SmsMaster(){
        instance = this;
        this.smsThread = new Thread("sms send thread") {
            @Override
            public void run() {
                while (running) {
                    try {
                        if (!isSending) {
                            log.info("entry SMS Service send sms!");
                            isSending = true;
                            try {
                                processSmsSend();
                            } catch (Exception e) {
                                log.log(Level.WARNING, "", e);
                            } finally {
                                isSending = false;
                            }
                        } else {
                            log.log(Level.WARNING, "prev sms process is still running!,wait ........");
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
        smsReportTask = new SmsReportTask();
        SmsTimer.getInstance().scheduleAtFixedRate(smsReportTask ,new Date(), 40 * 1000);

        smsGetTask = new SmsGetTask();
        SmsTimer.getInstance().scheduleAtFixedRate(smsGetTask ,new Date(), 40 * 1000);

        smsBalanceTask = new SmsBalanceTask();
        SmsTimer.getInstance().scheduleAtFixedRate(smsBalanceTask ,new Date(), 6 * 60 * 60 * 1000);
    }

    public void processSmsSend() {
        log.info("开始发送sms===========");
        DBObject findNew = new BasicDBObject();
        findNew.put("m7Status","ready");
        List<DBObject> list = MongoProvider.find("cc", "app_sms_send", findNew);
        if(list.size()>0){
            for(int i=0 ;i<list.size() ;i++){
                DBObject curSms = list.get(i);
                String account = curSms.get("account").toString();
                String sign = "【超孚金融】";
                if(curSms.get("sign") != null){
                    DBObject signObj = MongoProvider.findOne("cc","app_sms_sign",new BasicDBObject("subcode",curSms.get("sign").toString()));
                    sign = signObj.get("name").toString();
                }
                Map resMap = SmsUtil.send(curSms.get("num").toString(),curSms.get("content").toString(),sign);
                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());
                if(resMap.get("result").toString().equals("0")){
                    DBObject updateDoc = new BasicDBObject();
                    updateDoc.put("st_result", resMap.get("result").toString());
                    updateDoc.put("st_msgid", resMap.get("msgid").toString());
                    updateDoc.put("m7Status", "send");
                    updateDoc.put("st_sendTime", Utils.getCurrentDate());
                    if(resMap.containsKey("desc")){
                        updateDoc.put("st_desc", resMap.get("desc").toString());
                    }
                    MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }else{
                    DBObject updateDoc = new BasicDBObject();
                    updateDoc.put("st_result", resMap.get("result").toString());
                    updateDoc.put("m7Status", resMap.get("sendFail").toString());
                    updateDoc.put("st_sendTime", Utils.getCurrentDate());
                    if(resMap.containsKey("desc")){
                        updateDoc.put("st_desc", resMap.get("desc").toString());
                    }
                    MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }
            }
        }
        log.info("结束发送sms===========");
    }
}
