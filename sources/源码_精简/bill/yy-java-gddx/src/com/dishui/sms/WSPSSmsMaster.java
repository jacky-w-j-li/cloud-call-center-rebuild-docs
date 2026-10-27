package com.dishui.sms;

import com.dishui.bill.service.AppTimer;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.BYSmsUtil;
import com.dishui.util.SmsForbiddenWordCheckUtil;
import com.dishui.util.SmsUtil;
import com.dishui.util.WSPSSendSMS;
import com.dishui.util.WSPSSmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 2/6/15.
 */
public class WSPSSmsMaster {
    private static Logger log = Logger.getLogger(WSPSSmsMaster.class.getName());

    public static WSPSSmsMaster instance;
    private Thread smsThread;
    private boolean running = true;
    private long waitTime = 1000;
    private boolean isSending = false;

    public static WSPSSmsMaster getInstance(){
        if(instance == null){
            new WSPSSmsMaster();
        }
        return instance;
    }

    private WSPSSmsMaster(){
        instance = this;
        this.smsThread = new Thread("by sms send thread") {
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
    }

    public void processSmsSend() {
    	
        DBObject findNew = new BasicDBObject();
        findNew.put("m7Status","ready");
        findNew.put("smsChannel","wsps");
        findNew.put("isBatch",new BasicDBObject("$ne", true));
        List<DBObject> list = MongoProvider.find("cc", "app_sms_send", findNew);
        if(list.size()>0){
            log.info("本次发送 "+list.size()+" 条 WSPS sms------");
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
                Map resMap = WSPSSmsUtil.sendSMS(curSms.get("num").toString(),curSms.get("content").toString()+curSms.get("signDisplay").toString());
                Date date=new Date();
                DateFormat format=new SimpleDateFormat("yyyy-MM-ddHH:mm:ss");
                String time=format.format(date);
                if(resMap.get("return").toString().equals("0")){
                	updateDoc.put("wsps_msgid", resMap.get("wsps_msgid").toString());
                    updateDoc.put("by_errorcode", resMap.get("return").toString());
                    updateDoc.put("by_errordescription", resMap.get("info").toString());
                    updateDoc.put("by_sendTime", time);
                    updateDoc.put("m7Status", "send");
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    //to insert kou fei biao
                    MongoProvider.insert("bill_data", "bill_sms", curSms);
                }else{
                    updateDoc.put("by_errorcode", resMap.get("return").toString());
                    updateDoc.put("by_errordescription", resMap.get("info").toString());
                    updateDoc.put("by_sendTime", time);
                    updateDoc.put("m7Status", "sendFail");

                    MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }
            }
        }

        findNew.put("m7Status", "ready");
        findNew.put("smsChannel","wsps");
        findNew.put("isBatch", true);
        List<DBObject> batchList = MongoProvider.find("cc", "app_sms_send", findNew);
        if(batchList.size()>0){
            log.info("本次发送 "+batchList.size()+" 条 群发 WSPS sms------");
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
                for(int j=0 ;j<numArr.length ;j++){
                    count++;
                    toSendNums.append(numArr[j]);
                    toSaveNums.add(numArr[j]);
                    if(count == 1000 || j == numArr.length-1){
                    	Map resMap = WSPSSmsUtil.sendSMS(curSms.get("nums").toString(),curSms.get("content").toString()+curSms.get("signDisplay").toString());
                        DBObject find = new BasicDBObject();
                        find.put("_id", curSms.get("_id").toString());
                        DBObject updateDoc = new BasicDBObject();
                        Date date=new Date();
                        DateFormat format=new SimpleDateFormat("yyyy-MM-ddHH:mm:ss");
                        String time=format.format(date);
                        if(resMap.get("return").toString().equals("0")){
                        	updateDoc.put("wsps_msgid", resMap.get("wsps_msgid").toString());
                            updateDoc.put("by_errorcode", resMap.get("return").toString());
                            updateDoc.put("by_errordescription", resMap.get("info").toString());
                            updateDoc.put("by_sendTime", time);
                            updateDoc.put("m7Status", "send");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errorcode", resMap.get("return").toString());
                                curSms.put("by_errordescription", resMap.get("info").toString());
                                curSms.put("by_sendTime", time);
                                MongoProvider.insert(account+"_sms", curSms, account);
                                //to insert bill
                                MongoProvider.insert("bill_data", "bill_sms", curSms);
                            }
                        }else{
                            updateDoc.put("by_errorcode", resMap.get("return").toString());
                            updateDoc.put("by_errordescription", resMap.get("info").toString());
                            updateDoc.put("by_sendTime", time);
                            updateDoc.put("m7Status", "sendFail");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errorcode", resMap.get("return").toString());
                                curSms.put("by_errordescription", resMap.get("info").toString());
                                if(resMap.containsKey("time"))
                                    curSms.put("by_sendTime", time);
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
