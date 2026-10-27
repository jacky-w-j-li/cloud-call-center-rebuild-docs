package com.dishui.manager.billReport.impl.sales;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.result.UpdateResult;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/1/20.
 */
public class SalesPersonalReportHandler {

    private static final Logger log = Logger.getLogger(SalesPersonalReportHandler.class.getName());

    /**
     * 新开账户
     *
     * @param event
     */
    public static void newAccount(Event event){
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());


        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newOpenAccCount",1);

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(userId,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
    }

    /**
     * 停止账户
     *
     * @param event
     */
    public static void stopAccount(Event event){
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("awayAccCount",1);

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(userId,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
    }

    /**
     * 计费改变客户的代理
     * 需要判断客户的状态，看看是创建客户 还是 签约客户
     */
    public static void changeProxy(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        String agent = (String) map.get("newUser");
        String oldAgent = (String) map.get("oldUser");

        List<BasicDBObject> accountList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT, new BasicDBObject().append("_id", account));
        if (accountList.size() > 0) {
            DBObject findAccount = accountList.get(0);
            String accountStatus = (String) findAccount.get("status");
            if (agent != null && !agent.equalsIgnoreCase("")) {
                BasicDBObject condition = new BasicDBObject();
                condition.put("yearId", event.getYearId());
                condition.put("seasonId",event.getSeasonId());
                condition.put("monthId", event.getMonthId());

                String id = generateId(event,agent);
                condition.put("_id",id);
                condition.put("userId",agent);

                BasicDBObject incDoc = new BasicDBObject();
                if (accountStatus.equalsIgnoreCase("normal")) {
                    incDoc.put("newPayAccCount", 1);
                } else {
                    incDoc.put("newOpenAccCount", 1);
                }
                MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                refreshCurrentAccountNum(agent,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
            }
            if (oldAgent != null && !oldAgent.equalsIgnoreCase("")) {
                BasicDBObject condition = new BasicDBObject();
                condition.put("yearId", event.getYearId());
                condition.put("seasonId",event.getSeasonId());
                condition.put("monthId", event.getMonthId());

                String id = generateId(event,oldAgent);
                condition.put("_id",id);
                condition.put("userId",oldAgent);

                BasicDBObject incDoc = new BasicDBObject();
                if (accountStatus.equalsIgnoreCase("normal")) {
                    incDoc.put("newPayAccCount", -1);
                } else {
                    incDoc.put("newOpenAccCount", -1);
                }
                MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

                refreshCurrentAccountNum(oldAgent,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
            }
        }

    }

    /**
     * 新增付费账户
     * @param event
     */
    public static void newPayAccount(Event event){
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newPayAccCount",1);

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(userId,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
    }

    /**
     * 付费累计
     *
     * @param event
     */
    public static void pay(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        condition.put("pay.account",event.getAccount());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("pay.$.pay",map.get("payNum"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("pay.account", new BasicDBObject("$ne", event.getAccount()));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("pay", new BasicDBObject().append("account", event.getAccount()).append("pay", map.get("payNum")));
            MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }
        refreshCurrentAccountNum(userId,id,event.getYearId(),event.getSeasonId(),event.getMonthId());
    }

    /**
     * 实际消费累计-licence
     *
     * @param event
     */
//    public static void chargeLicence(Event event){
//        Map<String, Object> map = event.getBusinessData();
//        String account = event.getAccount();
//        BasicDBObject condition = new BasicDBObject();
//        condition.put("yearId", event.getYearId());
//        condition.put("seasonId",event.getSeasonId());
//        condition.put("monthId", event.getMonthId());
//
//        String userId = getUserIdByAccount(account);
//        if(userId == null){
//            return;
//        }
//        String id = generateId(event,userId);
//        condition.put("_id",id);
//        condition.put("userId",userId);
//
//        BasicDBObject incDoc = new BasicDBObject();
//        incDoc.put("licenceConsume",map.get("money"));
//
//        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//    }

    /**
     * 每日任务
     *
     * @param event
     */
    public static void dailyTask(Event event){
        List<BasicDBObject> dbUsers=  MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,new BasicDBObject("status","enable"),new BasicDBObject());
        for(DBObject dbUser : dbUsers){
            if(dbUser == null){
                continue;
            }

            //刷新个人当月的Licence消费
            String userId = (String)dbUser.get("_id");
            try {
                refreshCurrentLicenceConsume(userId,event);
            } catch (ParseException e) {
                log.warning("refresh personal licence consume failed." + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    public static void refreshCurrentLicenceConsume(String userId, Event event) throws ParseException {
        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0,reportTime.lastIndexOf(" "));

        List<String> accounts = getAccountListByUserId(userId);
        BasicDBList dbAccounts = new BasicDBList();
        dbAccounts.addAll(accounts);

        BasicDBObject licenceCondition = new BasicDBObject("status","use")
                .append("licenceType",new BasicDBObject("$ne","outcall"))
                .append("licencePrice",new BasicDBObject("$exists",true))
                .append("account",new BasicDBObject("$in",dbAccounts))
                .append("beginDate",new BasicDBObject("$lte",theDayStr))
                .append("endDate",new BasicDBObject("$gte",theDayStr));

        List<BasicDBObject> licenceList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_LICENCE,licenceCondition);
        if(licenceList == null || licenceList.isEmpty()){
            return;
        }

        long licenceConsume = 0;
        for(BasicDBObject dbLicence : licenceList){
            //平均每天licence消费
            double price = getLicencePrice(dbLicence.getString("licenceType"),dbLicence.getString("account"));
            double num = Utils.transDBNumberLong(dbLicence.get("num"));
            double dailyPrice = price * num / Utils.getDayCountInMonth(dateFormat.parse(theDayStr));

            licenceConsume += Math.round(dailyPrice);
        }

        if(licenceConsume == 0){
            return;
        }

        //更新到当前月报表记录
        String id = generateId(event,userId);
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());
        condition.put("_id",id);
        condition.put("userId",userId);

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("licenceConsume",licenceConsume)), true);

        //累加到总计实际消费.
        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", new BasicDBObject("actualConsume",licenceConsume)), true);
    }
    /**
     * 实际消费累计-外呼和400呼入
     *
     * @param event
     */
    public static void chargeCall(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("callConsume.$.callConsume",map.get("money"));
        condition.put("callConsume.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("callConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("callConsume", new BasicDBObject().append("product", map.get("product")).append("callConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }
    }

    /**
     * 实际消费累计-sms
     *
     * @param event
     */
    public static void chargeSMS(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("smsConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


    /**
     * 实际消费累计-流量
     *
     * @param event
     */
    public static void chargeFlow(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("flowConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 实际消费累计-语音验证码
     *
     * @param event
     */
    public static void chargeVoice(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("voiceConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 实际消费累计-购买服务号时,支付的当月剩余月租
     *
     * @param event
     */
    public static void chargeServiceNumber(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        condition.put("numberPay.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("numberPay.$.numberPay",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("numberPay.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("numberPay", new BasicDBObject().append("product", map.get("product")).append("numberPay", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }
    }

    /**
     * 实际消费累计-购买总机并发数时,支付的新增并发数的当月剩余月租
     *
     * @param event
     */
    public static void chargeConcurrent(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("concurrentPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
    }

    /**
     * 实际消费累计-扣低消
     *
     * @param event
     */
    public static void chargeMinConsume(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        condition.put("minConsume.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("minConsume.$.minConsume",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("minConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("minConsume", new BasicDBObject().append("product", map.get("product")).append("minConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }
    }

    /**
     * 实际消费累计-实施消费
     * @param event
     */
    public static void chargeWork(Event event) {
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("workPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
    }

    /**
     * 实际消费累计-硬件消费
     * @param event
     */
    public static void chargeHardware(Event event) {
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("hardwarePay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
    }

    /**
     * 实际消费累计-录音消费
     * @param event
     */
    public static void chargeTape(Event event) {
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("tapePay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
    }

    /**
     * 实际消费累计-其他消费
     * @param event
     */
    public static void chargeOther(Event event) {
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("otherPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
    }



    /**
     * 实际消费累计-扣月租
     *
     * @param event
     */
    public static void chargeRent(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        condition.put("rent.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("rent.$.rent",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("rent.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("rent", new BasicDBObject().append("product", map.get("product")).append("rent", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }
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

        String userId = getUserIdByAccount(account);
        if(userId == null){
            return;
        }
        String id = generateId(event,userId);
        condition.put("_id",id);
        condition.put("userId",userId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 刷新销售创建的付费企业数
     */
    private static void refreshCurrentAccountNum(String userId,String id,String yearId,String seasonId,String monthId){
        //查询销售/代理的所有付费企业数量
        long personalPayAccCount = MongoProvider.countFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status","normal").append("createUser",userId));

        //更新到当前月报表记录
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", yearId);
        condition.put("monthId", monthId);
        condition.put("seasonId",seasonId);
        condition.put("userId",userId);
        condition.put("_id",id);

        MongoProvider.update(Constant.BILL_SALES_PERSONAL_REPORT_TABLE, condition, new BasicDBObject("$set",new BasicDBObject("totalPayAccCount",personalPayAccCount)), true);
    }

    private static BasicDBObject getAccountInfo(String aid){
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",aid);
        List<BasicDBObject> accounts=  MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,condition,new BasicDBObject());
        if(accounts!=null && accounts.size()>0){
            return accounts.get(0);
        }

        return null;
    }


    private static BasicDBObject getUserInfo(String uid){
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",uid);
        condition.put("status","enable");
        List<BasicDBObject> users=  MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());
        if(users!=null && users.size()>0){
            return users.get(0);
        }

        return null;
    }

    private static String getUserIdByAccount(String aid){
        BasicDBObject account = getAccountInfo(aid);
        if(account==null){
            return null;
        }

        String creatorId = account.getString("createUser");
        BasicDBObject creator = getUserInfo(creatorId);
        if(creator==null){
            return null;
        }

        //如果是集团财务
        String realProxyId =  (String)creator.get("realProxy");
        if(realProxyId != null && !realProxyId.isEmpty()){
            BasicDBObject realProxy = getUserInfo(realProxyId);
            if(realProxy!=null){
                return realProxyId;
            }
        }

        return creatorId;
    }

    private static String generateId(Event event,String uid){
        if(event==null || event.getMonthId()==null || uid==null){
            return null;
        }
        return event.getMonthId()+'-'+uid;
    }

    private static List<String> getAccountListByUserId(String userId){
        if(userId == null){
            return Collections.emptyList();
        }

        List<String> res = new ArrayList<String>();

        BasicDBList userIds = new BasicDBList();
        userIds.add(userId);

        BasicDBObject condition = new BasicDBObject();
        condition.put("status","enable");
        condition.put("realProxy",userId);
        //加上集团财务的客户
        List<BasicDBObject> dbUserList = MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());
        if(dbUserList!=null && !dbUserList.isEmpty()){
            for(DBObject dbUser : dbUserList){
                String dbUserId = (String)dbUser.get("_id");
                userIds.add(dbUserId);
            }
        }

        List<BasicDBObject> dbAccountList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT, new BasicDBObject("createUser", new BasicDBObject("$in",userIds)));
        if(dbAccountList == null || dbAccountList.isEmpty()){
            return Collections.emptyList();
        }

        for(BasicDBObject dbAccount : dbAccountList){
            res.add((String)dbAccount.get("_id"));
        }

        return res;
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
