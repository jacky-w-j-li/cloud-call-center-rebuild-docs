package com.dishui.sms;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.SmsForbiddenWordCheckUtil;
import com.dishui.util.YMZPNewSendSMS;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 20/7/15.
 */
public class YMZPNewSmsMaster {
    private static Logger log = Logger.getLogger(YMZPNewSmsMaster.class.getName());

    public static YMZPNewSmsMaster instance;
    private Thread smsThread;
    private boolean running = true;
    private long waitTime = 1000;
    private boolean isSending = false;

    public static YMZPNewSmsMaster getInstance(){
        if(instance == null){
            new YMZPNewSmsMaster();
        }
        return instance;
    }

    private YMZPNewSmsMaster(){
        instance = this;
        this.smsThread = new Thread("YMZPNEW sms send thread") {
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
                            log.log(Level.WARNING, "prev YMZPNEW sms process is still running!,wait ........");
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
    }

    public void processSmsSend() {
        DBObject findNew = new BasicDBObject();
        findNew.put("m7Status","ready");
        findNew.put("smsChannel","ymzpnew");
        findNew.put("isBatch",new BasicDBObject("$ne", true));
        List<DBObject> list = MongoProvider.find("cc", "app_sms_send", findNew);
        if(list.size()>0){
            log.info("本次发送 "+list.size()+" 条 YMZPNEW sms------");
            for(int i=0 ;i<list.size() ;i++){
                DBObject curSms = list.get(i);
                String product = curSms.get("product").toString();
                String account = curSms.get("account").toString();

                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());
                DBObject updateDoc = new BasicDBObject();

                String checkResult = SmsForbiddenWordCheckUtil.checkWord(curSms.get("content").toString());
                if(!checkResult.equals("true")){
                    updateDoc.put("by_errordescription", "提交通道失败:含有违禁词("+checkResult+")");
                    updateDoc.put("m7Status", "forbiddenWord");
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    continue;
                }
                Map<String, String> resMap = YMZPNewSendSMS.sendSMS(curSms.get("num").toString(), curSms.get("content").toString() + curSms.get("signDisplay").toString());
                if(resMap.get("success").equals("true")){
                    updateDoc.put("by_errordescription", resMap.get("by_errordescription"));
                    updateDoc.put("m7Status", "send");
                    updateDoc.put("ym_msgid", resMap.get("ym_msgid"));
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    //to insert kou fei biao
                    MongoProvider.insert("bill_data", "bill_sms", curSms);
                }else{
                    updateDoc.put("by_errordescription", "提交通道失败:"+resMap.get("by_errordescription"));
                    updateDoc.put("m7Status", "sendFail");

                    MongoProvider.update(account + "_sms", find, new BasicDBObject("$set", updateDoc), account);
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }
            }
        }

        findNew.put("m7Status", "ready");
        findNew.put("smsChannel","ymzpnew");
        findNew.put("isBatch", true);
        List<DBObject> batchList = MongoProvider.find("cc", "app_sms_send", findNew);
        if(batchList.size()>0){
            log.info("本次发送 "+batchList.size()+" 条 群发 YMZPNEW sms------");
            for(int i=0 ;i<batchList.size() ;i++){
                DBObject curSms = batchList.get(i);
                String account = curSms.get("account").toString();
                String[] numArr = curSms.get("nums").toString().split(",");

                String checkResult = SmsForbiddenWordCheckUtil.checkWord(curSms.get("content").toString());
                if(!checkResult.equals("true")){
                    DBObject find = new BasicDBObject();
                    find.put("_id", curSms.get("_id").toString());
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

                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());
                for(int j=0 ;j<numArr.length ;j++){
                    count++;
                    toSendNums.append(numArr[j]);
                    toSaveNums.add(numArr[j]);
                    if(count == 1000 || j == numArr.length-1){
                        Map resMap = YMZPNewSendSMS.sendSMS(toSendNums.toString(), curSms.get("content").toString()+curSms.get("signDisplay").toString());
                        DBObject updateDoc = new BasicDBObject();
                        if(resMap.get("success").equals("true")){
                            updateDoc.put("by_errordescription", resMap.get("by_errordescription"));
                            updateDoc.put("m7Status", "send");
//                            updateDoc.put("ym_msgid", resMap.get("ym_msgid"));
                            DBObject updateDocSendId = new BasicDBObject();
                            updateDocSendId.put("$set",updateDoc);
                            updateDocSendId.put("$addToSet", new BasicDBObject("ym_msgid", resMap.get("ym_msgid")));
                            MongoProvider.update("cc", "app_sms_send", find,updateDocSendId);
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id", Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errordescription", "成功");
                                curSms.put("ym_msgid", resMap.get("ym_msgid"));

                                MongoProvider.insert(account+"_sms", curSms, account);
                                //to insert bill
                                MongoProvider.insert("bill_data", "bill_sms", curSms);
                            }
                        }else{
                            updateDoc.put("by_errordescription", "提交通道失败" + resMap.get("by_errordescription"));
                            updateDoc.put("m7Status", "sendFail");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errordescription", "提交通道失败" + resMap.get("by_errordescription"));

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
