package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.CustFee;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/3/8.
 */
public class CustFeeService {
    private static Logger logger = Logger.getLogger(CustFeeService.class.getName());

    public static List<CustFee> getAutoRenewInUseCustFeeList(String accountId){
        if(accountId==null){
            return null;
        }

        List<CustFee> custFeeList = new ArrayList<CustFee>();

        BasicDBObject condition = new BasicDBObject("_id",accountId+"_custFee");
        condition.append("custFees",
                new BasicDBObject("$elemMatch",
                new BasicDBObject("state",Constants.CUSTFEE_STATE_NORMAL).append("autoRenew",true)));
        DBObject dbProduct = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition);

        if(dbProduct == null){
            return null;
        }

        BasicDBList dbCustFeeList = (BasicDBList) dbProduct.get("custFees");
        if(dbCustFeeList != null && dbCustFeeList.size()>0){
            for (Object dbCustFee : dbCustFeeList) {
                try {
                    if(dbCustFee != null){
                        CustFee custFee = CustFee.fromDB((DBObject) dbCustFee);
                        custFeeList.add(custFee);
                    }
                } catch (Exception e) {
                    logger.warning("illegal custFee in db found [account:"+accountId+"]");
                    e.printStackTrace();
                }
            }
        }

        return custFeeList;
    }

    public static List<String> getAllAccountIdsOpenedCustFee(){
        List<String> accountIdList = new ArrayList<String>();

        BasicDBObject condition = new BasicDBObject("_id",new BasicDBObject("$regex",".*_custFee"));
        BasicDBObject keys = new BasicDBObject("account",1);

        List<DBObject> dbAccountIdList = MongoProvider.find(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition,keys);
        if(dbAccountIdList!=null){
            for (DBObject dbProduct : dbAccountIdList) {
                String accountId = (String)dbProduct.get("account");
                accountIdList.add(accountId);
            }
        }


        return accountIdList;
    }

    public static int getCustFeePoundage(String accountId){
        if(accountId == null){
            return 0;
        }

        BasicDBObject condition = new BasicDBObject("_id",accountId+"_custFee");
        DBObject dbProduct = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition);

        Object dbPoundage = dbProduct.get("poundage");
        return dbPoundage == null ? 0 : Integer.valueOf(String.valueOf(dbPoundage));
    }

    public static void updateAutoRenewEndTime(String accountId,String custFeeId,Date autoRenewEndTime){
        if(accountId == null || custFeeId == null || autoRenewEndTime == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",accountId+"_custFee");
        condition.append("custFees",
                new BasicDBObject("$elemMatch",
                new BasicDBObject("state",Constants.CUSTFEE_STATE_NORMAL).append("autoRenew",true).append("id",custFeeId)));
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("custFees.$.autoRenewEndTime", DateUtil.getFormatTime(autoRenewEndTime)));

        MongoProvider.updateOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition,updateDoc, WriteConcern.SAFE);

    }

    public static void updateState(String accountId,String custFeeId,String state){
        if(accountId == null || custFeeId == null || state == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",accountId+"_custFee");
        condition.append("custFees",
                new BasicDBObject("$elemMatch",
                new BasicDBObject().append("id",custFeeId)));
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("custFees.$.state", state));

        MongoProvider.updateOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition,updateDoc, WriteConcern.SAFE);

    }

}
