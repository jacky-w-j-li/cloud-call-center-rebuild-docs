package com.dishui.manager.billReport.impl.proxy;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 */
public class ChannelProxyAnalyseReportHandler {
    private static final Logger log = Logger.getLogger(ChannelProxyAnalyseReportHandler.class.getName());

    /**
     * (管理员/代理)给代理充值
     *
     * 处理事件: 给代理充值proxyPay  管理员给企业充值accountPay
     *
     * @param event
     */
    public static void payProxy(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject userInfo = getUserInfo((String)map.get("proxy"));
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }
        String proxyId = userInfo.getString("_id");
        condition.put("_id",generateId(event,proxyId));
        condition.put("userId",proxyId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("totalPay",map.get("payNum"));

        log.info("proxy analyse - payProxy[userId:"+proxyId+"]");
        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ANALYSE_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc),true);
    }

    /**
     * (管理员/企业)给代理创建的企业充值 都算是代理付费
     *
     * 不包括代理给企业充值
     *
     * 处理事件: 给代理充值proxyPay  管理员给企业充值accountPay
     *
     * @param event
     */
    public static void payAccount(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        String account = event.getAccount();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }
        String proxyId = userInfo.getString("_id");
        condition.put("_id",generateId(event,proxyId));
        condition.put("userId",proxyId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("totalPay",map.get("payNum"));

        log.info("proxy analyse - payAccount[userId:"+proxyId+"]");
        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ANALYSE_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc),true);
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

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        String proxyId = userInfo.getString("_id");
        condition.put("_id",generateId(event,proxyId));
        condition.put("userId",proxyId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    public static void dailyTask(Event event) {
        List<BasicDBObject> dbUsers = MongoProvider.findFromApp("bill", Constant.APP_BILL_SYSTEM_USER, new BasicDBObject("status", "enable").append("proxyType","channel").append("realProxy",null));
        for (BasicDBObject dbUser : dbUsers) {
            //刷新渠道当月的Licence消费
            String userId = (String) dbUser.get("_id");
            try {
                refreshCurrentLicenceConsume(userId, event);
            } catch (ParseException e) {
                log.warning("refresh proxy analyse licence consume failed." + e.getMessage());
                e.printStackTrace();
            }

        }
    }

    public static void refreshCurrentLicenceConsume(String userId, Event event) throws ParseException {
        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0, reportTime.lastIndexOf(" "));

        List<String> accounts = getAccountListByUserId(userId);
        if(accounts == null || accounts.isEmpty()){
            return;
        }

        BasicDBList dbAccounts = new BasicDBList();
        dbAccounts.addAll(accounts);

        BasicDBObject licenceCondition = new BasicDBObject("status", "use")
                .append("licenceType",new BasicDBObject("$ne","outcall"))
                .append("licencePrice", new BasicDBObject("$exists", true))
                .append("account", new BasicDBObject("$in", dbAccounts))
                .append("beginDate",new BasicDBObject("$lte",theDayStr))
                .append("endDate",new BasicDBObject("$gte",theDayStr));

        List<BasicDBObject> licenceList = MongoProvider.findFromApp("bill", Constant.APP_PLATFORM_LICENCE, licenceCondition);
        if (licenceList == null || licenceList.isEmpty()) {
            return;
        }

        long licenceConsume = 0;
        for (BasicDBObject dbLicence : licenceList) {
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

        //累加到总计实际消费.
        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", new BasicDBObject("actualConsume",licenceConsume)), true);
    }

    private static BasicDBObject getUserInfo(String uid){
        if(uid == null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",uid);
        condition.put("status","enable");
        List<BasicDBObject> users=  MongoProvider.findFromApp("bill", Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());
        if(users!=null && users.size()>0){
            return users.get(0);
        }

        return null;
    }

    private static BasicDBObject getUserInfoByAccount(String aid){
        BasicDBObject account = getAccountInfo(aid);
        if(account==null){
            return null;
        }

        String creatorId = account.getString("createUser");
        BasicDBObject creator = getUserInfo(creatorId);

        return creator;
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

    private static String generateId(Event event,String proxyId){
        if(event==null || event.getMonthId()==null || proxyId == null){
            return null;
        }

        return event.getMonthId() + "-" +proxyId;
    }

    private static boolean isChannel(BasicDBObject userInfo){
        if(userInfo != null && userInfo.getString("proxyType") != null && userInfo.getString("proxyType").equalsIgnoreCase("channel")){
            return true;
        }
        return false;
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
        List<BasicDBObject> dbUserList = MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition);
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
