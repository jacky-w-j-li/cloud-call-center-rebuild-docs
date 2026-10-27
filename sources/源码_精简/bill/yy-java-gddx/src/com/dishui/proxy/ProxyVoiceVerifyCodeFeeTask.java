package com.dishui.proxy;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ProxyVoiceVerifyCodeFeeTask extends TimerTask {
    private static Logger log = Logger.getLogger(ProxyVoiceVerifyCodeFeeTask.class.getName());

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            log.info("ProxyVoiceVerifyCodeFeeTask hour::============="+now.get(Calendar.HOUR_OF_DAY));
            generateVoiceFee();
        } catch (Exception e) {
            log.log(Level.WARNING, "process ProxyVoiceVerifyCodeFeeTask exception! ", e);
            e.printStackTrace();
        }
    }

    private void generateVoiceFee(){
        String now =Utils.getCurrentDate();
        String lastDate = Utils.getLastDate();
//        lastDate="2016-01-15";
        log.log(Level.INFO,"start ProxyVoiceVerifyCodeFeeTask , date is :" + now);
        boolean isFee=true;
        while(isFee){
            DBObject condition = new BasicDBObject().append("date", lastDate).append("isFee", null);
            List<DBObject> list = MongoConnect.getInstance().getDB("bill").getCollection("bill_voiceVerify_proxy_income").find(condition).limit(200).toArray();
            String lastTime=lastDate+" 23:59:59";
            if(list!=null&&list.size()>0){
                for(DBObject obj : list){
                    long _income= (Long)obj.get("income");
                    String income=Utils.formatRound2Money(_income)+"";
                    String proxy=obj.get("account").toString();
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",_income));

                    DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                    String balance=Utils.formatRound2Money(Double.valueOf(String.valueOf(_proxy.get("balance"))).longValue())+"";
                    DBObject temp=new BasicDBObject();
                    String orderNo= IDGenerator.getNext(6);
                    orderNo="Ti"+  orderNo;
                    temp.put("_id",orderNo);
                    temp.put("status","pay");
                    temp.put("income",income);
                    temp.put("discount","0");
                    temp.put("account","");
                    temp.put("create_time",now);
                    temp.put("pay_time",lastTime);
                    temp.put("flag","payVoiceVerifyFee");
                    temp.put("source","payVoiceVerifyFee");
                    temp.put("proxy",proxy);
                    temp.put("currentBalance",balance);

                    DBObject sn = new BasicDBObject();
                    sn.put("minutes", obj.get("minutes"));
                    sn.put("seconds", obj.get("seconds"));
                    temp.put("sn", sn);

                    temp.put("year",obj.get("year"));
                    temp.put("month",obj.get("month"));
                    temp.put("dd",obj.get("dd"));
                    temp.put("feeId",obj.get("_id"));
                    temp.put("timestamp",System.currentTimeMillis());

                    MongoProvider.insert("bill_user_pay", temp);
                    MongoProvider.updateOne("bill_voiceVerify_proxy_income", new BasicDBObject("_id", obj.get("_id")),
                            new BasicDBObject().append("$set", new BasicDBObject().append("isFee", "1")), WriteConcern.SAFE);
                }
            }else{
                isFee=false;
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end ProxyVoiceVerifyCodeFeeTask["+now + "] ");
    }

}
