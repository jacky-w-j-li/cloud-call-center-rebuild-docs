package com.dishui.manager.billReport.impl.operation;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * 账户充值消费报表
 *
 * Created by jackwong on 16/3/23.
 */
public class OperationAccountPayChargeReportHandler {
    private static Logger log = Logger.getLogger(OperationAccountPayChargeReportHandler.class.getName());

    public static void pay(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        String account = event.getAccount();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String id = generateId(event,account);

        condition.put("_id",id);
        condition.put("account",account);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("pay",map.get("payNum"));

        MongoProvider.update(Constant.BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc),true);

        refreshCurrTotalPayConsumeAndBalance(id,account);
    }

    /**
     * 实际消费累计
     *
     * @param event
     */
    public static void charge(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String id = generateId(event,account);

        condition.put("_id",id);
        condition.put("account",account);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrTotalPayConsumeAndBalance(id,account);
    }

    public static void dailyTask(Event event){
        BasicDBList statusNINDoc = new BasicDBList();
        statusNINDoc.add("stop");
        statusNINDoc.add("free");
        List<BasicDBObject> dbAccountList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status",new BasicDBObject("$nin",statusNINDoc)));

        for(BasicDBObject dbAccount : dbAccountList) {
            String accountId =  (String)dbAccount.get("_id");
            if(accountId == null){
                continue;
            }

            try {
                refreshCurrentLicenceConsume(accountId,event);
            } catch (ParseException e) {
                log.warning("refresh operation account pay charge report licence consume failed." + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    public static void refreshCurrentLicenceConsume(String account,Event event) throws ParseException {
        if(account == null || event == null){
            return;
        }

        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0,reportTime.lastIndexOf(" "));

        BasicDBObject licenceCondition =new BasicDBObject("status","use")
                .append("licenceType",new BasicDBObject("$ne","outcall"))
                .append("licencePrice",new BasicDBObject("$exists",true))
                .append("account",account)
                .append("beginDate",new BasicDBObject("$lte",theDayStr))
                .append("endDate",new BasicDBObject("$gte",theDayStr));

        List<BasicDBObject> licenceList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_LICENCE,licenceCondition);
        if(licenceList == null || licenceList.isEmpty()){
            return;
        }

        long licenceConsume = 0;
        for(BasicDBObject dbLicence : licenceList){
            //每天licence消费
            double price = getLicencePrice(dbLicence.getString("licenceType"),dbLicence.getString("account"));
            double num = Utils.transDBNumberLong(dbLicence.get("num"));
            double dailyPrice = price * num / Utils.getDayCountInMonth(dateFormat.parse(theDayStr));

            licenceConsume += Math.round(dailyPrice);
        }

        if(licenceConsume == 0){
            return;
        }

        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String id = generateId(event,account);

        condition.put("_id",id);
        condition.put("account",account);


        //累计到实际消费
        MongoProvider.update(Constant.BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("actualConsume",licenceConsume)), true);
    }

    /**
     * 刷新账号当前的 累计充值,累计消费 和 当前余额
     *
     * @return
     */
    private static void refreshCurrTotalPayConsumeAndBalance(String id,String accountId){
        if(id == null || accountId == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject("_id",accountId);

        long totalPay = 0;
        long totalConsume = 0;
        long currBalance = 0;

        //当前累计充值,累计消费
        BasicDBObject dbAccountPayConsume = MongoProvider.findOneFromApp("bill", Constant.APP_PLATFORM_ACCOUNT_PAY_CONSUME,condition);
        if(dbAccountPayConsume != null) {
            Object dbTotalPay = dbAccountPayConsume.get("totalPay");
            Object dbTotalConsume = dbAccountPayConsume.get("totalConsume");

            totalPay = Utils.transDBNumberLong(dbTotalPay);
            totalConsume = Utils.transDBNumberLong(dbTotalConsume);
        }

        //当前余额
        BasicDBObject dbAccount = MongoProvider.findOneFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,condition);
        if(dbAccount != null){
            Object dbBalance = dbAccount.get("balance");

            currBalance = Utils.transDBNumberLong(dbBalance);
        }

        //更到报表
        condition.clear();
        condition.append("_id",id);

        BasicDBObject updateDoc = new BasicDBObject()
                .append("totalPay",totalPay)
                .append("totalConsume",totalConsume)
                .append("currBalance",currBalance);

        MongoProvider.update(Constant.BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT_TABLE, condition, new BasicDBObject("$set", updateDoc), false);
    }

    private static String generateId(Event event,String accountId){
        if(event==null || event.getMonthId()==null || accountId == null){
            return null;
        }

        return event.getMonthId() + "-" +accountId;
    }

    private static long getLicencePrice(String licenceType,String account){
        final String product = "cc";
        String productId = account + "_" + product;
        if(account == null || licenceType == null){
            return 0;
        }

        BasicDBObject dbProduct = MongoProvider.findOneFromApp("bill",Constant.PLATFORM_ACCOUNT_PRODUCT_TABLE,new BasicDBObject("_id",productId));
        if(licenceType.equalsIgnoreCase("service")){
            return Utils.transDBNumberLong(dbProduct.get("serviceLicence"));
        }else if(licenceType.equalsIgnoreCase("monitor")){
            return Utils.transDBNumberLong(dbProduct.get("monitorLicence"));
        }else if(licenceType.equalsIgnoreCase("enterprise")){
            return Utils.transDBNumberLong(dbProduct.get("callinLicence"));
        }

        return 0;
    }


}
