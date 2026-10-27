package com.dishui.sms;

import com.dishui.bill.service.AppTimer;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.BYSmsUtil;
import com.dishui.util.SmsForbiddenWordCheckUtil;
import com.dishui.util.SmsUtil;
import com.dishui.util.YTXSmsUtil;
import com.dishui.ytx.CCPRestSDK;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by 景德亮 on 6/7/16.
 */
public class YTXYXSmsMaster {
    private static Logger log = Logger.getLogger(SmsMaster.class.getName());

    public static YTXYXSmsMaster instance;
    private Thread smsThread;
    private boolean running = true;
    private long waitTime = 1000;
    private boolean isSending = false;

    public static YTXYXSmsMaster getInstance(){
        if(instance == null){
            new YTXYXSmsMaster();
        }
        return instance;
    }

    private YTXYXSmsMaster(){
        instance = this;
        this.smsThread = new Thread("ytxyx sms send thread") {
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
                            log.log(Level.WARNING, "ytxyx sms process is still running!,wait ........");
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
        findNew.put("smsChannel","ytxyx");
        findNew.put("isBatch",new BasicDBObject("$ne", true));
        List<DBObject> list = MongoProvider.find("cc", "app_sms_send", findNew);
        if(list.size()>0){
            log.info("本次发送 "+list.size()+" 条 YTXYX sms------");
            for(int i=0 ;i<list.size() ;i++){
                DBObject curSms = list.get(i);
                String product = curSms.get("product").toString();
                String account = curSms.get("account").toString();
                DBObject find = new BasicDBObject();
                find.put("_id", curSms.get("_id").toString());
                MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",new BasicDBObject("m7Status","sendFail")));
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
                int count =Integer.valueOf(curSms.get("vars").toString());
                String[] datas = new String[count];
                for (int datasone = 0; datasone < count; datasone++) {
            		datas[datasone]= "";
				}
                for (int j = 1; j <= count; j++) {
                	if(curSms.get("smsTemplateVar"+j)!=null){
                		datas[j-1] = curSms.get("smsTemplateVar"+j).toString();
                	}else if(curSms.get("var"+j)!=null){
                		datas[j-1] = curSms.get("var"+j).toString();
                	}else if(curSms.get("importvar"+j)!=null){
                		datas[j-1] = curSms.get("importvar"+j).toString();
                	}
				}
                if(datas.length ==0){
                	datas =null;
                }
               
                Map resMap = YTXSmsUtil.sendSMS(curSms.get("smsChannel").toString(),curSms.get("num").toString(),curSms.get("ytxtemplateid").toString() ,datas);
              //sendSMS参数要改
                if(resMap.get("statusCode").toString().equals("000000")){
                    updateDoc.put("by_errordescription", "成功");
                    Map resMapmap =(Map) resMap.get("data");
                    Map resMapmapmap =(Map)resMapmap.get("templateSMS");
                    updateDoc.put("smsMessageSid", resMapmapmap.get("smsMessageSid"));
                    if(resMapmapmap.containsKey("dateCreated")){
                        updateDoc.put("by_sendTime", YTXSmsUtil.strtodate(resMapmapmap.get("dateCreated").toString()));
                    }
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    updateDoc.put("m7Status", "send");
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                    //to insert kou fei biao
                    MongoProvider.insert("bill_data", "bill_sms", curSms);
                }else{
                    updateDoc.put("by_errordescription","提交通道失败"+ resMap.get("statusCode").toString());
                    if(resMap.containsKey("dateCreated"))
                        updateDoc.put("by_sendTime", YTXSmsUtil.strtodate(resMap.get("dateCreated").toString()));
                    if(product.equals("cc")){
                        MongoProvider.update(account+"_sms", find, new BasicDBObject("$set",updateDoc), account);
                    }
                    updateDoc.put("m7Status", "sendFail");
                    MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                }
            }
        }

        findNew.put("m7Status", "ready");
        findNew.put("smsChannel","ytxyx");
        findNew.put("isBatch", true);
        List<DBObject> batchList = MongoProvider.find("cc", "app_sms_send", findNew);
        if(batchList.size()>0){
            log.info("本次发送 "+batchList.size()+" 条 群发 YTXYX sms------");
            for(int i=0 ;i<batchList.size() ;i++){
                DBObject curSms = batchList.get(i);
                String account = curSms.get("account").toString();
                String[] numArr = curSms.get("nums").toString().split(",");

                String checkResult = SmsForbiddenWordCheckUtil.checkWord(curSms.get("content").toString());
                if(!checkResult.equals("true")){
                    DBObject find = new BasicDBObject();
                    find.put("_id", curSms.get("_id").toString());
                    DBObject batchfind = new BasicDBObject("_id",curSms.get("_id"));
                    MongoProvider.update("cc", "app_sms_send", batchfind, new BasicDBObject("$set",new BasicDBObject("m7Status","sendFail")));
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
                    
                    if(count == 200 || j == numArr.length-1){
                    	int batchcount =Integer.valueOf(curSms.get("vars").toString());
                        String[] datas = new String[batchcount];
                    	for (int datasone = 0; datasone < batchcount; datasone++) {
                    		datas[datasone]= "";
						}
                        for (int k = 1; k <= batchcount; k++) {
                        	if(curSms.get("smsTemplateVar"+k)!=null){
                        		datas[k-1] = curSms.get("smsTemplateVar"+k).toString();
                        	}else if(curSms.get("var"+k)!=null){
                        		datas[k-1] = curSms.get("var"+k).toString();
                        	}else if(curSms.get("batchSmsTemplateVar"+k)!=null){
                        		datas[k-1] = curSms.get("batchSmsTemplateVar"+k).toString();
                        	}else if(curSms.get("importvar"+k)!=null){
                        		datas[k-1] = curSms.get("importvar"+k).toString();
                        	}
        				}
                        if(datas.length ==0){
                        	datas =null;
                        }
                        Map resMap = YTXSmsUtil.sendSMS(curSms.get("smsChannel").toString(),toSendNums.toString(), curSms.get("ytxtemplateid").toString(),datas);
                        //sendSMS参数要改
                        DBObject find = new BasicDBObject();
                        find.put("_id", curSms.get("_id").toString());
                        DBObject updateDoc = new BasicDBObject();
                        Map resMapmap =(Map) resMap.get("data");
                        Map resMapmapmap =(Map)resMapmap.get("templateSMS");
                        if(resMap.get("statusCode").toString().equals("000000")){
                            updateDoc.put("by_errordescription", "成功");
                            updateDoc.put("smsMessageSid", resMapmapmap.get("smsMessageSid"));
                            if(resMapmapmap.containsKey("dateCreated")){
                                updateDoc.put("by_sendTime", YTXSmsUtil.strtodate(resMapmapmap.get("dateCreated").toString()));
                            }
                            updateDoc.put("m7Status", "send");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("smsMessageSid", resMapmapmap.get("smsMessageSid"));
                                curSms.put("by_errordescription", "成功");
                                curSms.put("m7Status", "send");
                                if(resMapmapmap.containsKey("dateCreated")){
                                    curSms.put("by_sendTime", YTXSmsUtil.strtodate(resMapmapmap.get("dateCreated").toString()));
                                }
                                MongoProvider.insert(account+"_sms", curSms, account);
                                //to insert bill
                                MongoProvider.insert("bill_data", "bill_sms", curSms);
                            }
                        }else{
                            updateDoc.put("by_errordescription","提交通道失败" + resMap.get("statusCode").toString());
                            if(resMapmapmap.containsKey("dateCreated")){
                                updateDoc.put("by_sendTime", YTXSmsUtil.strtodate(resMapmapmap.get("dateCreated").toString()));
                            }
                            updateDoc.put("m7Status", "sendFail");
                            MongoProvider.update("cc", "app_sms_send", find, new BasicDBObject("$set",updateDoc));
                            for(int k=0 ;k<toSaveNums.size(); k++){
                                curSms.removeField("nums");
                                curSms.put("_id",Utils.getUniqueid());
                                curSms.put("num",toSaveNums.get(k));
                                curSms.put("m7Status", "send");
                                curSms.put("by_errordescription","提交通道失败" +resMap.get("statusCode").toString());
                                if(resMapmapmap.containsKey("dateCreated"))
                                    curSms.put("by_sendTime", YTXSmsUtil.strtodate(resMapmapmap.get("dateCreated").toString()));
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
