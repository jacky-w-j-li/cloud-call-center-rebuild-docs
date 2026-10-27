package com.dishui.manager.billReport.impl.operation;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.client.result.UpdateResult;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 */
public class OperationMonthReportHandler {
    private static final Logger log = Logger.getLogger(OperationMonthReportHandler.class.getName());

    /**
     * 新开账户
     *
     * @param event
     */
    public static void newAccount(Event event){
        //Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newOpenAccCount",1);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum();
    }

    /**
     * 停止账户
     *
     * @param event
     */
    public static void stopAccount(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("awayAccCount",1);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum();
    }

    /**
     * 重开账户
     *
     * @param event
     */
    public static void reopenAccount(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("awayAccCount",-1);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum();
    }

    /**
     * 新增付费账户
     * @param event
     */
    public static void newPayAccount(Event event){
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newPayAccCount",1);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum();
    }

    /**
     * 付费累计
     *
     * @param event
     */
    public static void pay(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        condition.put("pay.account",event.getAccount());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("pay.$.pay",map.get("payNum"));
        UpdateResult rs = MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("pay.account", new BasicDBObject("$ne", event.getAccount()));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("pay", new BasicDBObject().append("account", event.getAccount()).append("pay", map.get("payNum")));
            MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }

        //分类累计费用: 系统,实施,硬件,其他
//        if(map.get("useFor") != null) {
//            condition.clear();//清空条件
//            condition.put("yearId", event.getYearId());
//            condition.put("monthId", event.getMonthId());
//            String useFor = (String)map.get("useFor");
//
//            condition.put("catePay.category",useFor);
//
//            BasicDBObject categoryPayIncDoc = new BasicDBObject();
//            categoryPayIncDoc.put("catePay.$.catePay",map.get("payNum"));
//
//            UpdateResult categoryPayRs =MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", categoryPayIncDoc),false);
//            if(categoryPayRs == null || categoryPayRs.getMatchedCount() == 0){
//                condition.put("catePay.category", new BasicDBObject("$ne", useFor));
//                BasicDBObject pushDoc = new BasicDBObject();
//                pushDoc.put("catePay", new BasicDBObject().append("category", useFor).append("catePay", map.get("payNum")));
//                MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
//            }
//        }else {
//            log.warning("unrecognized pay category for account " + event.getAccount());
//        }
    }

    /**
     * 实际消费累计
     *
     * @param event
     */
    public static void charge(Event event){
        String account = event.getAccount();
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());


        long chargeAccount = 0;
        //本月消费账户//////////////////////////////////////////
        BasicDBObject chargeAccountCondition = new BasicDBObject();
        chargeAccountCondition.append("_id",event.getMonthId());
        chargeAccountCondition.put("charge.account",  account);

        BasicDBObject dbChargeAccount = MongoProvider.findOne(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE,chargeAccountCondition);
        if(dbChargeAccount == null){
            chargeAccountCondition.put("charge.account", new BasicDBObject("$ne", account));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("charge", new BasicDBObject().append("account", account));
            MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE, chargeAccountCondition, new BasicDBObject("$push", pushDoc), true);
        }

        chargeAccountCondition.removeField("charge.account");
        dbChargeAccount = MongoProvider.findOne(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE,chargeAccountCondition);
        if(dbChargeAccount != null){
            BasicDBList dbCharge = (BasicDBList) dbChargeAccount.get("charge");
            chargeAccount = dbCharge.size();
        }
        //////////////////////////////////////////////////////


        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));
        BasicDBObject setDoc = new BasicDBObject();
        setDoc.put("consumeCount",chargeAccount);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc).append("$set",setDoc), true);
    }

    public static void dailyTask(Event event){
        try {
            refreshCurrentLicenceConsume(event);
        } catch (ParseException e) {
            log.warning("refresh month report licence consume failed." + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void refreshCurrentLicenceConsume(Event event) throws ParseException {
        if(event == null){
            return;
        }

        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0,reportTime.lastIndexOf(" "));

        BasicDBObject licenceCondition =new BasicDBObject("status","use")
                    .append("licenceType",new BasicDBObject("$ne","outcall"))
                    .append("licencePrice",new BasicDBObject("$exists",true))
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

            if(dailyPrice > 0) {
                String account = (String) dbLicence.get("account");
                if (account != null) {
                    //本月消费账户//////////////////////////////////////////
                    BasicDBObject chargeAccountCondition = new BasicDBObject();
                    chargeAccountCondition.append("_id", event.getMonthId());
                    chargeAccountCondition.put("charge.account", account);

                    BasicDBObject dbChargeAccount = MongoProvider.findOne(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE, chargeAccountCondition);
                    if (dbChargeAccount == null) {
                        chargeAccountCondition.put("charge.account", new BasicDBObject("$ne", account));
                        BasicDBObject pushDoc = new BasicDBObject();
                        pushDoc.put("charge", new BasicDBObject().append("account", account));
                        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE, chargeAccountCondition, new BasicDBObject("$push", pushDoc), true);
                    }
                }
            }
        }

        if(licenceConsume == 0){
            return;
        }

        //更新到当前月报表记录
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        log.log(Level.INFO,"licence consume : [event:" + event.toString() +",consume:" + licenceConsume + "]");

        //累计到实际消费
        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("actualConsume",licenceConsume)), true);

        //更新本月消费账户
        long chargeAccount = 0;
        BasicDBObject dbChargeAccount = MongoProvider.findOne(Constant.BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE,new BasicDBObject("_id",event.getMonthId()));
        if(dbChargeAccount != null){
            BasicDBList dbCharge = (BasicDBList) dbChargeAccount.get("charge");
            chargeAccount = dbCharge.size();
        }
        //////////////////////////////////////////////////////
        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$set",new BasicDBObject("consumeCount",chargeAccount)), true);
    }

    /**
     * 运营成本累计
     *
     * @param event
     */
    public static void chargeCost(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("operCost",map.get("cost"));

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 刷新当前企业总数和付费企业总数
     */
    private static void refreshCurrentAccountNum(){
        String currDate = DateUtil.getCurrentDate();
        String[] ymdArr = currDate.split("-");

        String yearId = ymdArr[0];
        String mothId = yearId + ymdArr[1];

        //查询当前企业总数
        BasicDBList statusNINDoc = new BasicDBList();
        statusNINDoc.add("stop");
        statusNINDoc.add("free");
        long totalAccCount = MongoProvider.countFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status",new BasicDBObject("$nin",statusNINDoc)));

        //查询付费企业总数
        long totalPayAccCount = MongoProvider.countFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status","normal"));

        //更新到当前月报表记录
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", yearId);
        condition.put("monthId", mothId);

        MongoProvider.update(Constant.BILL_OPER_MONTH_REPORT_TABLE, condition, new BasicDBObject("$set",new BasicDBObject("totalAccCount",totalAccCount).append("totalPayAccCount",totalPayAccCount)), true);
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
