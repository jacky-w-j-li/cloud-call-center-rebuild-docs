package com.dishui.manager.billReport.impl.proxy;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.client.result.UpdateResult;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 */
public class ChannelProxyAllReportHandler {
    private static final Logger log = Logger.getLogger(ChannelProxyAllReportHandler.class.getName());


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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfo((String)map.get("proxy"));
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }
        String proxyId = userInfo.getString("_id");

        log.info("proxy all - payProxy[userId:"+proxyId+"]");
        commonPay(proxyId,event,condition);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }
        String proxyId = userInfo.getString("_id");

        log.info("proxy all - payAccount[userId:"+proxyId+"]");
        commonPay(proxyId,event,condition);
    }

    private static void commonPay(String proxyId,Event event,BasicDBObject condition){
        Map<String,Object> map = event.getBusinessData();

        condition.put("proxyPay.proxy",proxyId);

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("proxyPay.$.proxyPay",map.get("payNum"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("proxyPay.proxy", new BasicDBObject("$ne", proxyId));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("proxyPay", new BasicDBObject().append("proxy", proxyId).append("proxyPay", map.get("payNum")));
            MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
        }

        refreshCurrentChannelNum(event.getMonthId(),event.getYearId(),event.getSeasonId(),event.getMonthId());
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
//        condition.put("_id",event.getMonthId());
//
//        BasicDBObject userInfo = getUserInfoByAccount(account);
//        if(!isChannel(userInfo)){//不统计非渠道账户事件
//            return;
//        }
//
//        BasicDBObject incDoc = new BasicDBObject();
//        incDoc.put("licenceConsume",map.get("money"));
//
//        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//    }

    public static void dailyTask(Event event){

        try {
            refreshCurrentLicenceConsume(event);
        } catch (ParseException e) {
            log.warning("refresh channel proxy all report licence consume failed." + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void refreshCurrentLicenceConsume(Event event) throws ParseException {
        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0,reportTime.lastIndexOf(" "));

        List<String> accounts = getAllAccountOfChannel();
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
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());
        condition.put("_id",event.getMonthId());

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("licenceConsume",licenceConsume)), true);
        //累计到实际消费
        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("actualConsume",licenceConsume)), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("callConsume.$.callConsume",map.get("money"));
        condition.put("callConsume.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("callConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("callConsume", new BasicDBObject().append("product", map.get("product")).append("callConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("smsConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("flowConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("voiceConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        condition.put("numberPay.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("numberPay.$.numberPay",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("numberPay.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("numberPay", new BasicDBObject().append("product", map.get("product")).append("numberPay", map.get("money")));
            MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("concurrentPay",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }
        condition.put("minConsume.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("minConsume.$.minConsume",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("minConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("minConsume", new BasicDBObject().append("product", map.get("product")).append("minConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("workPay",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("hardwarePay",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("tapePay",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("otherPay",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        condition.put("rent.product",map.get("product"));

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("rent.$.rent",map.get("money"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("rent.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("rent", new BasicDBObject().append("product", map.get("product")).append("rent", map.get("money")));
            MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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
        condition.put("_id",event.getMonthId());

        BasicDBObject userInfo = getUserInfoByAccount(account);
        if(!isChannel(userInfo)){//不统计非渠道账户事件
            return;
        }

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 刷新总渠道数 和 付费渠道数
     *
     * 所有代理企业中存在付费企业的渠道,都算做付费渠道.
     * 代理付过费,但是还没有付费企业的代理 也算付费代理.
     *
     * @param id
     * @param yearId
     * @param seasonId
     * @param monthId
     */
    public static void refreshCurrentChannelNum(String id,String yearId,String seasonId,String monthId){
        //查询所有渠道
        List<BasicDBObject> channelDBObjList = MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,new BasicDBObject("status","enable").append("proxyType","channel"));
        if(channelDBObjList == null || channelDBObjList.size()==0){
            return;
        }
        int channelTotalCount = 0;//渠道总数
        int payChannelTotalCount = 0;//付费渠道总数

        List<String> allChannelIdList = new ArrayList<String>();
        for(BasicDBObject channelDBObj : channelDBObjList){
            allChannelIdList.add(channelDBObj.getString("_id"));
        }

        //查询所有付费企业的创建者
        Set<String> payChannelSet = new HashSet<String>();
        List<BasicDBObject> normalAccCreatorDBObjList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status","normal").append("createUser",new BasicDBObject("$exists",true)),new BasicDBObject("createUser",1));
        if(normalAccCreatorDBObjList!=null){
            for(BasicDBObject normalAccCreatorDBObj : normalAccCreatorDBObjList){
                String createUserId = normalAccCreatorDBObj.getString("createUser");
                if(allChannelIdList.contains(createUserId)){//如果创建者是渠道,则算作付费渠道
                    payChannelSet.add(createUserId);
                }
            }
        }

        //代理付过费,但是还没有付费企业的代理 也算付费代理
        List<String> otherChannelIdList = new ArrayList<String>();
        for(String channelId : allChannelIdList){
            if(!payChannelSet.contains(channelId)){
                otherChannelIdList.add(channelId);
            }
        }

        for(String channelId : otherChannelIdList){
            int payRecordsSize = MongoProvider.findFromApp("bill",Constant.APP_BILL_USER_PAY,new BasicDBObject("proxy",channelId)).size();
            if(payRecordsSize!=0){
                payChannelSet.add(channelId);
            }
        }



        channelTotalCount = allChannelIdList.size();
        payChannelTotalCount = payChannelSet.size();

        //更新到当前月报表记录
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", yearId);
        condition.put("seasonId",seasonId);
        condition.put("monthId", monthId);
        condition.put("_id",id);

        MongoProvider.update(Constant.BILL_CHANNEL_PROXY_ALL_REPORT_TABLE, condition, new BasicDBObject("$set",new BasicDBObject("channelTotalCount",channelTotalCount).append("payChannelTotalCount",payChannelTotalCount)), true);
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
        if(uid == null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",uid);
        condition.put("status","enable");
        List<BasicDBObject> users=  MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());
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

    private static boolean isChannel(BasicDBObject userInfo){
        if(userInfo != null && userInfo.getString("proxyType") != null && userInfo.getString("proxyType").equalsIgnoreCase("channel") && userInfo.getString("realProxy") == null){
            return true;
        }
        return false;
    }

    private static List<String> getAllAccountOfChannel(){
        List<String> res = new ArrayList<String>();

        //查询所有渠道,
        List<BasicDBObject> dbChannels = MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,new BasicDBObject("status","enable").append("proxyType","channel").append("realProxy",null));
        if(dbChannels == null || dbChannels.isEmpty()){
            return Collections.emptyList();
        }
        BasicDBList channelIdsCondition = new BasicDBList();
        for(BasicDBObject dbChannel : dbChannels){
            String channelId = (String)dbChannel.get("_id");
            channelIdsCondition.add(channelId);
        }

        //查询当前企业总数
        BasicDBList statusNINDoc = new BasicDBList();
        statusNINDoc.add("stop");
        statusNINDoc.add("free");
        List<BasicDBObject> dbAccountList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status",new BasicDBObject("$nin",statusNINDoc)).append("createUser",new BasicDBObject("$in",channelIdsCondition)));

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
