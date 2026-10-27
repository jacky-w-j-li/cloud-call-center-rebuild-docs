package com.dishui.bill.bill;


import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class RepairBillProxyFee {
    private static Logger log = Logger.getLogger(RepairBillProxyFee.class.getName());

    private static final String request_key = "84706874723d4d19a6c09084d2b69c13";

    /**
     * http://127.0.0.1:8888/service?Action=repaireProxyFee2&date=2015-04-30&key=84706874723d4d19a6c09084d2b69c13
     * @param action
     * @return
     */
    public  C5Response repaireProxyFee(C5Action action ){
        C5Response response = new C5Response(action);
        try{
            String date = action.getStringValue("date");
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
            generateTelFee(date);
            generate400TelFee(date);
            generateSmsFee(date);

            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    private void generateTelFee(/*2015-04-30*/String lastDate){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start ProxyTelFeeTasks , date is :" + now);
        DBObject condition = new BasicDBObject().append("date", lastDate).append("isFee",null);
        List<DBObject> list = MongoProvider.find("bill_call_income", condition);
        String lastTime=lastDate+" 23:59:59";
        for(DBObject obj : list){
            long _income= (Long)obj.get("income");
            String income=Utils.formatRound2Money(_income)+"";
            long _discount=obj.get("discount")==null?0l:(Long)obj.get("discount");
            String discount=Utils.formatRound2Money(_discount)+"";
//            String key=obj.get("_id").toString();
            String proxy=obj.get("account").toString();
            DBObject _set = new BasicDBObject();
            _set.put("$inc",new BasicDBObject("balance",_income));

            DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
            String balance=Utils.formatRound2Money(Long.valueOf(String.valueOf(_proxy.get("balance"))))+"";
            DBObject temp=new BasicDBObject();
            String orderNo= IDGenerator.getNext(6);
            orderNo="Ti"+  orderNo;
            temp.put("_id",orderNo);
            temp.put("status","pay");
            temp.put("income",income);
            temp.put("discount",discount);
            temp.put("account","");
            temp.put("create_time",now);
            temp.put("pay_time",lastTime);
            temp.put("flag","payCallFee");
            temp.put("source","payCallFee");
            temp.put("proxy",proxy);
            temp.put("currentBalance",balance);
            DBObject sn = new BasicDBObject();
            sn.put("localPhoneMinutes", obj.get("localPhoneMinutes"));
            sn.put("remotePhoneMinutes", obj.get("remotePhoneMinutes"));
            sn.put("localTelMinutes", obj.get("localTelMinutes"));
            sn.put("remoteTelMinutes", obj.get("remoteTelMinutes"));
            sn.put("calls", obj.get("calls"));
            temp.put("sn", sn);

            temp.put("year",obj.get("year"));
            temp.put("month",obj.get("month"));
            temp.put("dd",obj.get("dd"));
            temp.put("feeId",obj.get("_id"));
            temp.put("timestamp",System.currentTimeMillis());

            MongoProvider.insert("bill_user_pay",temp);
            MongoProvider.update("bill_call_income",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",new BasicDBObject("isFee","1")));
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end ProxyTelFeeTasks["+now + "] ");
    }
    private void generate400TelFee(String lastDate){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start Proxy400TelFeeTasks , date is :" + now);
        DBObject condition = new BasicDBObject().append("date", lastDate).append("isFee",null);
        List<DBObject> list = MongoProvider.find("bill_400_income", condition);
        String lastTime=lastDate+" 23:59:59";
        for(DBObject obj : list){
            long _income= (Long)obj.get("income");
            String income=Utils.formatRound2Money(_income)+"";
            long _discount=obj.get("discount")==null?0l:(Long)obj.get("discount");
            String discount=Utils.formatRound2Money(_discount)+"";
//            String key=obj.get("_id").toString();
            String proxy=obj.get("account").toString();
            DBObject _set = new BasicDBObject();
            _set.put("$inc",new BasicDBObject("balance",_income));
            DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
            String balance=Utils.formatRound2Money(Long.valueOf(String.valueOf(_proxy.get("balance"))))+"";
            DBObject temp=new BasicDBObject();
            String orderNo= IDGenerator.getNext(6);
            orderNo="Ti"+  orderNo;
            temp.put("_id",orderNo);
            temp.put("status","pay");
            temp.put("income",income);
            temp.put("discount",discount);
            temp.put("account","");
            temp.put("create_time",now);
            temp.put("pay_time",lastTime);
            temp.put("flag","payCall400Fee");
            temp.put("source","payCall400Fee");
            temp.put("proxy",proxy);
            temp.put("currentBalance",balance);
            DBObject sn = new BasicDBObject();
            sn.put("localMinutes", obj.get("localMinutes"));
            sn.put("remoteMinutes", obj.get("remoteMinutes"));
            sn.put("calls", obj.get("calls"));
            sn.put("serviceno", obj.get("num400"));
            temp.put("sn", sn);

            temp.put("year",obj.get("year"));
            temp.put("month",obj.get("month"));
            temp.put("dd",obj.get("dd"));
            temp.put("feeId",obj.get("_id"));
            temp.put("timestamp",System.currentTimeMillis());
            MongoProvider.insert("bill_user_pay",temp);

            MongoProvider.update("bill_400_income",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",new BasicDBObject("isFee","1")));
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end Proxy400TelFeeTasks["+now + "] ");
    }

    private void generateSmsFee(String lastDate){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start ProxySmsFeeTask , date is :" + now);
        boolean isFee=true;
        while(isFee){
            DBObject condition = new BasicDBObject().append("date", lastDate).append("isFee", null);
            List<DBObject> list = MongoConnect.getInstance().getDB("bill").getCollection("bill_sms_proxy_income").find(condition).limit(200).toArray();
            String lastTime=lastDate+" 23:59:59";
            if(list!=null&&list.size()>0){
                for(DBObject obj : list){
                    long _income= (Long)obj.get("income");
                    String income=Utils.formatRound2Money(_income)+"";
                    String proxy=obj.get("account").toString();
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",_income));

                    DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                    String balance=Utils.formatRound2Money(Long.valueOf(String.valueOf(_proxy.get("balance"))))+"";
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
                    temp.put("flag","paySmsFee");
                    temp.put("source","paySmsFee");
                    temp.put("proxy",proxy);
                    temp.put("currentBalance",balance);

                    DBObject sn = new BasicDBObject();
                    sn.put("num", obj.get("num"));
                    temp.put("sn", sn);

                    temp.put("year",obj.get("year"));
                    temp.put("month",obj.get("month"));
                    temp.put("dd",obj.get("dd"));
                    temp.put("feeId",obj.get("_id"));
                    temp.put("timestamp",System.currentTimeMillis());

                    MongoProvider.insert("bill_user_pay", temp);
                    MongoProvider.updateOne("bill_sms_proxy_income", new BasicDBObject("_id", obj.get("_id")),
                            new BasicDBObject().append("$set", new BasicDBObject().append("isFee", "1")), WriteConcern.SAFE);
                }
            }else{
                isFee=false;
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end ProxySmsFeeTask["+now + "] ");
    }

}
