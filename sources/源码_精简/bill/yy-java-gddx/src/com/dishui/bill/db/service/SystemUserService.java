package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.text.ParseException;
import java.util.Calendar;
import java.util.Date;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/2/29.
 */
public class SystemUserService {
    private static Logger logger = Logger.getLogger(SystemUserService.class.getName());

    public static void incrProxyBalance(String proxy,long income){
        DBObject incr = new BasicDBObject("$inc",new BasicDBObject("balance",income));
        DBObject condition = new BasicDBObject("_id",proxy).append("identity","proxy");

        MongoProvider.findAndModify(Constants.DB_COLLECTION_SYSTEM_USER,condition,incr,false);
    }

    public static void saveProxyIncomeRecord(String accountId,String proxy,long income, long currentBalance,String flag,String source){
        String currentTrueBalance = Utils.formatRound2Money(Double.valueOf(String.valueOf(currentBalance)).longValue())+"";
        String trueIncome = Utils.formatRound2Money(Double.valueOf(String.valueOf(income)).longValue())+"";

        String orderNo= IDGenerator.getNext(6);
        Calendar now = Calendar.getInstance();
        String nowStr = DateUtil.getCurrentTime();

        DBObject record=new BasicDBObject();
        record.put("_id",orderNo);
        record.put("status","pay");
        record.put("income",trueIncome);
        record.put("discount","0");
        record.put("account",accountId);
        record.put("create_time",nowStr);
        record.put("pay_time",nowStr);
        record.put("flag",flag);
        record.put("source",source);
        record.put("proxy",proxy);
        record.put("currentBalance",currentTrueBalance);
        record.put("year",now.get(Calendar.YEAR));
        record.put("month",now.get(Calendar.MONTH)+1);
        record.put("dd",now.get(Calendar.DAY_OF_MONTH));
        record.put("timestamp",System.currentTimeMillis());

        MongoProvider.insert(Constants.DB_COLLECTION_BILL_USER_PAY, record);
    }

    public static SystemUser get(String id){
        if(id == null){
            return null;
        }
        BasicDBObject condition = new BasicDBObject("_id",id).append("status",Constants.SYSTEM_USER_STATUS_ENABLE);

        DBObject dbSystemUser = MongoProvider.findOne(Constants.DB_COLLECTION_SYSTEM_USER,condition);

        try {
            return SystemUser.fromDB(dbSystemUser);
        }catch (ParseException e){
            logger.warning(e.getMessage());
        }

        return null;
    }
}
