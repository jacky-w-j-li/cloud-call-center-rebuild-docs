package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.CallConsume;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import com.dishui.bill.db.service.AccountService;

/**
 * Created by jackwong on 16/3/18.
 */
public class CallConsumeService {
    /**
     * 获取月账单
     *
     * @param acc 账户
     * @param month 月份 格式如:2016-01
     * @param product 产品 cc zj
     * @return
     */
    public static CallConsume getByAccMonthProduct(String acc,String month,String product,String num400){
        if(acc == null || month == null || product == null){
            return null;
        }

        String id = generateID(acc,month,product,num400);
        if(id == null){
            return null;
        }

        return get(id);
    }


    public static CallConsume get(String id){
        if(id == null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("_id",id);
        DBObject dbObject =MongoProvider.findOne(Constants.DB_BILL_DATA,Constants.DB_COLLECTION_BILL_CALL_CONSUME,condition);

        return CallConsume.fromDB(dbObject);

    }

    public static String generateID(String account,String month,String product,String num400){
        if(account == null || product == null || month == null){
            return null;
        }

        if(product.equals(Constants.PRODUCT_400)){
            return  account+"_"+month+"_"+Constants.PRODUCT_400+"_"+num400;
        }
        return account+"_"+month+"_"+product;
    }

    /**
     * 更新低消设置
     *
     * @param id
     * @param minConsume  对应产品的低消
     * @param presentMinute 对应产品的赠送分钟数(呼叫中心)
     */
    public static void updateMinConsume(String id,long minConsume,long presentMinute){
        if (id == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",id);
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("minConsume",minConsume).append("presentMinute",presentMinute));

        MongoProvider.updateOne(Constants.DB_BILL_DATA, Constants.DB_COLLECTION_BILL_CALL_CONSUME,condition,updateDoc, WriteConcern.SAFE);
    }

    /**
     * 更新剩余低消
     *
     * @param id
     * @param balance 低消余额
     * @param giveMinute 低消剩余分钟数(呼叫中心)
     */
    public static void updateRemainMinConsume(String id,long balance,long giveMinute){
        if (id == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",id);
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("balance",balance).append("giveMinute",giveMinute));

        MongoProvider.updateOne(Constants.DB_BILL_DATA, Constants.DB_COLLECTION_BILL_CALL_CONSUME,condition,updateDoc, WriteConcern.SAFE);
    }

    /**
     * 给账单绑定财务账户
     * @param id
     * @param financeAccountId
     */
    public static void bindFinanceAccount(String id, String financeAccountId) {
        if (id == null) {
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",id);
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject(AccountService.FinanceAccountFieldName, financeAccountId));

        MongoProvider.updateOne(Constants.DB_BILL_DATA, Constants.DB_COLLECTION_BILL_CALL_CONSUME,condition,updateDoc, WriteConcern.SAFE);
    }


}
