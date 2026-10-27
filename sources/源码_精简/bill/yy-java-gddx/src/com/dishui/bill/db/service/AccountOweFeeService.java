package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.AccountOweFee;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/3/18.
 */
public class AccountOweFeeService {
    private static final Logger logger = Logger.getLogger(AccountOweFeeService.class.getName());

    public static List<AccountOweFee> findByOrderNoTypeStatus(String orderNo, String type, String status){
        if(orderNo == null || type == null || status == null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("orderNo",orderNo).append("type",type).append("status",status);
        List<DBObject> dbAccountOweFeeList = MongoProvider.find(Constants.DB_BILL_DATA, Constants.DB_COLLECTION_PLATFORM_ACCOUNT_OWE_FEE,condition);

        if(dbAccountOweFeeList==null || dbAccountOweFeeList.size() == 0){
            return null;
        }

        List<AccountOweFee> accountOweFeeList = new ArrayList<AccountOweFee>();
        try {
            for (DBObject dbAccountOweFee : dbAccountOweFeeList) {
                accountOweFeeList.add(AccountOweFee.fromDB(dbAccountOweFee));
            }
        }catch(Exception e){
            logger.warning("read account owe fee from db obj failed " + e.getMessage());
            return null;
        }

        return accountOweFeeList;
    }

    public static void setOweFeeDeal(String id){
        if(id == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",new ObjectId(id));
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("status",Constants.PROXY_OWE_FEE_STATUS_DEAL));

        MongoProvider.updateOne(Constants.DB_BILL_DATA,Constants.DB_COLLECTION_PLATFORM_ACCOUNT_OWE_FEE,condition,updateDoc, WriteConcern.SAFE);
    }

    public static void saveOweFee(AccountOweFee oweFee) {
        if(oweFee == null){
            return;
        }

        MongoProvider.insert(Constants.DB_BILL_DATA,Constants.DB_COLLECTION_PLATFORM_ACCOUNT_OWE_FEE,oweFee.toDB());
    }
}
