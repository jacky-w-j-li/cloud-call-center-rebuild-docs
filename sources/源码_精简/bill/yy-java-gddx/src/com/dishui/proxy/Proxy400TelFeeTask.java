package com.dishui.proxy;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Proxy400TelFeeTask extends TimerTask {
    private static Logger log = Logger.getLogger(Proxy400TelFeeTask.class.getName());

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            log.info("Proxy400TelFeeTask hour::============="+now.get(Calendar.HOUR_OF_DAY));
            generate400TelFee();
        } catch (Exception e) {
            log.log(Level.WARNING, "process Proxy400TelFeeTask  exception! ", e);
            e.printStackTrace();
        }
    }

    private void generate400TelFee(){
        String now =Utils.getCurrentDate();
        String lastDate = Utils.getLastDate();
//        lastDate="2016-01-15";
//        String lastDate = Utils.getDefaultCurrentDate();
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
            String balance=Utils.formatRound2Money(Double.valueOf(String.valueOf(_proxy.get("balance"))).longValue())+"";
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

}
