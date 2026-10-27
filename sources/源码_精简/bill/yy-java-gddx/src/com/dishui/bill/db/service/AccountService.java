package com.dishui.bill.db.service;

import com.alipay.util.DoubleUtil;
import com.dishui.bill.bill.BillMaster;
import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.Account;
import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBObject;
import com.mongodb.util.StringBuilderPool;

/**
 * Created by jackwong on 16/3/8.
 */
public class AccountService {
    /**
     * 账号余额增减
     *
     * @param accountId
     * @param incr
     */
    public static void incrBalance2Account(String accountId,long incr){
        if(accountId == null || incr == 0){
            return;
        }

        MongoProvider.update("platform_account", new BasicDBObject()
                        .append("_id", accountId),
                new BasicDBObject().append("$inc",new BasicDBObject().append("balance", incr)));
    }

    /**
     * 账户消费记录
     *
     * @param accountId
     * @param totalFee
     * @param income
     * @param currentBalance
     * @param proxyId
     * @param payType
     * @param payFlag
     * @param product
     */
    public static void saveConsumeRecord(String accountId, long totalFee, long income, long currentBalance, String proxyId, String payType, String payFlag, String product){
        String trueTotalFee = Utils.formatRound2Money(Double.valueOf(String.valueOf(totalFee)).longValue())+"";
        String trueIncome = Utils.formatRound2Money(Double.valueOf(String.valueOf(income)).longValue())+"";
        String currentTrueBalance = Utils.formatRound2Money(Double.valueOf(String.valueOf(currentBalance)).longValue())+"";

        String orderNo= IDGenerator.getNext(6);
        String nowStr = DateUtil.getCurrentTime();

        DBObject record=new BasicDBObject();
        record.put("_id",orderNo);
        record.put("status","pay");
        record.put("payType",payType);
        record.put("money","0");
        record.put("account",accountId);
        record.put("create_time",nowStr);
        record.put("pay_time",nowStr);
        record.put("flag",payFlag);
        record.put("totalFee",trueTotalFee);
        record.put("balance",trueTotalFee);
        record.put("currentBalance",currentTrueBalance);
        record.put("serviceFlag","");
        record.put("product",product);
        record.put("income",trueIncome);
        record.put("proxy",proxyId);

        MongoProvider.insert("zj",Constants.DB_COLLECTION_USER_PAY,record);
    }

    public static String saveConsumeRecordAndReturnId(String accountId, long totalFee, long income, long currentBalance, String proxyId, String payType, String payFlag, String product){
        String trueTotalFee = Utils.formatRound2Money(Double.valueOf(String.valueOf(totalFee)).longValue())+"";
        String trueIncome = Utils.formatRound2Money(Double.valueOf(String.valueOf(income)).longValue())+"";
        String currentTrueBalance = Utils.formatRound2Money(Double.valueOf(String.valueOf(currentBalance)).longValue())+"";

        String orderNo= IDGenerator.getNext(6);
        String nowStr = DateUtil.getCurrentTime();

        DBObject record=new BasicDBObject();
        record.put("_id",orderNo);
        record.put("status","pay");
        record.put("payType",payType);
        record.put("money","0");
        record.put("account",accountId);
        record.put("create_time",nowStr);
        record.put("pay_time",nowStr);
        record.put("flag",payFlag);
        record.put("totalFee",trueTotalFee);
        record.put("balance",trueTotalFee);
        record.put("currentBalance",currentTrueBalance);
        record.put("serviceFlag","");
        record.put("product",product);
        record.put("income",trueIncome);
        record.put("proxy",proxyId);

        MongoProvider.insert("zj",Constants.DB_COLLECTION_USER_PAY,record);

        return orderNo;
    }


    public static Account get(String id){
        if(id == null){
            return null;
        }
        BasicDBObject condition = new BasicDBObject("_id",id);

        DBObject dbAccount = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT,condition);

        return Account.fromDB(dbAccount);
    }

    /**
     * 获得创建者
     *
     * @param accountId
     * @return
     */
    public static SystemUser getCreateUser(String accountId){
        if(accountId == null){
            return null;
        }
        BasicDBObject condition = new BasicDBObject("_id",accountId);

        DBObject dbAccount = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT,condition);
        if(dbAccount == null){
            return null;
        }

        Account account =  Account.fromDB(dbAccount);
        if(account == null){
            return null;
        }

        String createUserId = account.getCreateUser();

        return SystemUserService.get(createUserId);
    }

    /**
     * 获取账户所属代理,若所属创建人是集团财务,则获取真正的代理
     *
     * @param accountId
     * @return
     */
    public static SystemUser getProxy(String accountId){
        if(accountId == null){
            return null;
        }
        SystemUser createUser = getCreateUser(accountId);

        if(createUser == null){
            return null;
        }

        if(createUser.getIdentity().equals(Constants.SYSTEM_USER_IDENTITY_PROXY)){
            //优先返回 实际代理
            String realProxyId = createUser.getRealProxy();
            if(realProxyId != null && !realProxyId.isEmpty()){
                SystemUser realProxy = SystemUserService.get(realProxyId);
                if(realProxy!=null && realProxy.getIdentity().equals(Constants.SYSTEM_USER_IDENTITY_PROXY)){
                    return realProxy;
                }
            }

            return createUser;
        }


        return null;
    }

    /**
     * 累计消费
     *
     * @param accountId
     * @param consume
     */
    public static void incrConsume(String accountId,long consume){
        if(accountId == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",accountId);
        BasicDBObject updateDoc = new BasicDBObject("$inc",new BasicDBObject("totalConsume",consume));

        MongoProvider.upsert(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PAY_CONSUME,condition,updateDoc);
    }

    public static String FinanceAccountFieldName = "financeAccount";

    /**
     * 余额消费优先从绑定的财务账户上扣除
     * @param accountId
     * @param fee
     * @return
     */
    public static ConsumeFinanceAccountBalanceRes consumeFinanceAccountBalance(String accountId, double fee) {
        // 判断应该花谁的钱，目前的策略是能花财务账户的钱就不花普通账户的钱
        DBObject prevAccount = MongoProvider.findOne("platform_account", new BasicDBObject("_id", accountId));
        DBObject financeAccount = null;
        DBObject paidAccount = null;
        if (prevAccount.get(FinanceAccountFieldName) != null) {
            financeAccount = MongoProvider.findOne("platform_account", new BasicDBObject("_id", prevAccount.get(FinanceAccountFieldName).toString()));
        }
        DBObject updateCondition = new BasicDBObject().append("$inc", new BasicDBObject().append("balance", fee));
        if (financeAccount != null) {
//            if (Double.valueOf(String.valueOf(financeAccount.get("balance"))).longValue() - fee < 0
//                    && Double.valueOf(String.valueOf(prevAccount.get("balance"))).longValue() - fee > 0) {
//                // 消费自己的钱
//                paidAccount = MongoProvider.findAndModify("platform_account", new BasicDBObject("_id", accountId), updateCondition, false);
//                return new ConsumeFinanceAccountBalanceRes(false, paidAccount, paidAccount);
//            } else {
                // 消费财务账户的钱
                paidAccount = MongoProvider.findAndModify("platform_account", new BasicDBObject("_id", financeAccount.get("_id")), updateCondition, false);
                return new ConsumeFinanceAccountBalanceRes(true, paidAccount, prevAccount);
//            }
        } else {
            // 消费自己的钱（没有财务账户）
            paidAccount = MongoProvider.findAndModify("platform_account", new BasicDBObject("_id", accountId), updateCondition, false);
            return new ConsumeFinanceAccountBalanceRes(false, paidAccount, paidAccount);
        }
    }

    public static class ConsumeFinanceAccountBalanceRes {
        public boolean hasConsumeFinanceAccount;
        public DBObject paidAccount;
        public DBObject normalAccount;

        public ConsumeFinanceAccountBalanceRes(boolean hasConsumeFinanceAccount, DBObject paidAccount, DBObject normalAccount) {
            this.hasConsumeFinanceAccount = hasConsumeFinanceAccount;
            this.paidAccount = paidAccount;
            this.normalAccount = normalAccount;
        }
    }

    /**
     * 给账单绑定财务账户
     * @param userPayId
     * @param financeAccountId
     */
    public static void bindFinanceAccountToUserPay(String userPayId, String financeAccountId) {
        MongoConnect.getInstance().getDB("zj")
                .getCollection("user_pay")
                .update(
                    new BasicDBObject().append("_id", userPayId),
                    new BasicDBObject().append("$set", new BasicDBObject().append(FinanceAccountFieldName, financeAccountId))
                );
    }

    /**
     * 给账单绑定财务账户(传入的财务账户id)
     * @param billId
     * @param financeAccountId
     */
    public static void bindFinanceAccountToBillData(String collectionName, String billId, String financeAccountId) {
        MongoConnect.getInstance().getDB("bill_data")
                .getCollection(collectionName)
                .update(
                    new BasicDBObject().append("_id", billId),
                    new BasicDBObject().append("$set", new BasicDBObject().append(FinanceAccountFieldName, financeAccountId))
                );
    }

    /**
     * 绑定普通账户的财务账户到账单上
     * @param collectionName
     * @param billId
     * @param accountId
     */
    public static boolean bindAccountsFinanceAccountToBillData(String collectionName, String billId, String accountId) {
        DBObject account = MongoProvider.findOne("platform_account", new BasicDBObject("_id", accountId));
        if (account.get(FinanceAccountFieldName) != null) {
            MongoConnect.getInstance().getDB("bill_data")
                    .getCollection(collectionName)
                    .update(
                            new BasicDBObject().append("_id", billId),
                            new BasicDBObject().append("$set", new BasicDBObject().append(FinanceAccountFieldName, account.get(FinanceAccountFieldName).toString()))
                    );
            return true;
        } else {
            return false;
        }
    }

    /**
     * 查看用户余额是否足够
     * @param accountId
     * @param fee
     */
    public static boolean hasEnoughBalance(String accountId, double fee) {
        DBObject account = MongoProvider.findOne("platform_account", new BasicDBObject("_id", accountId));
        DBObject financeAccount = null;
        if (account.get(FinanceAccountFieldName) != null) {
            financeAccount = MongoProvider.findOne("platform_account", new BasicDBObject("_id", account.get(FinanceAccountFieldName).toString()));
        }

        double accountPayAbility = Double.parseDouble(account.get("balance").toString()) + Double.parseDouble(account.get("overdraw").toString());

        if (financeAccount != null) {
            double financeAccountPayAbility = Double.parseDouble(financeAccount.get("balance").toString()) + Double.parseDouble(financeAccount.get("overdraw").toString());

            if (accountPayAbility < fee && financeAccountPayAbility < fee) {
                return false;
            }

            return true;
        } else {

            if (accountPayAbility < fee) {
                return false;
            }

            return true;
        }

    }

}
