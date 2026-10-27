package com.dishui.manager.billReport.impl.sales;

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
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 消费分析报表
 *
 * ,因为之前是在销售报表下面,叫做"区域报表",所以类名是这样的.
 *
 * Created by zhangyang on 15/12/24.
 */
public class SalesAreaReportHandler {
    private static final Logger log = Logger.getLogger(SalesAreaReportHandler.class.getName());
    private static final String UNKOWN_AREA = "UNKOWN";

    /**
     * 新开账户
     *
     * @param event
     */
    public static void newAccount(Event event){
        //Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId", event.getMonthId());


        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newOpenAccCount",1);
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(area,event.getYearId(),event.getSeasonId(),event.getMonthId());
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("awayAccCount",1);
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(area,event.getYearId(),event.getSeasonId(),event.getMonthId());
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("newPayAccCount",1);
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        refreshCurrentAccountNum(area,event.getYearId(),event.getSeasonId(),event.getMonthId());
    }

//    /**
//     * 付费累计
//     *
//     * 包括 管理员/企业/代理 给企业充值
//     *
//     * 处理事件: 管理员/企业 给企业充值 accountPay
//     *          代理 给 企业充值 accountProxyPay
//     *
//     * @param event
//     */
//    public static void pay(Event event){
//        Map<String, Object> map = event.getBusinessData();
//        String account = event.getAccount();
//        BasicDBObject condition = new BasicDBObject();
//        condition.put("yearId", event.getYearId());
//        condition.put("seasonId",event.getSeasonId());
//        condition.put("monthId", event.getMonthId());
//
//        String area = getAreaByAccount(account);
//        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;
//        condition.put("pay.account",event.getAccount());
//
//
//        BasicDBObject incDoc = new BasicDBObject();
//        incDoc.put("pay.$.pay",map.get("payNum"));
//        condition.put("area",area);
//
//        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);
//
//        if(rs == null || rs.getMatchedCount() == 0) {
//            condition.put("pay.account", new BasicDBObject("$ne", event.getAccount()));
//            BasicDBObject pushDoc = new BasicDBObject();
//            pushDoc.put("pay", new BasicDBObject().append("account", event.getAccount()).append("pay", map.get("payNum")));
//            MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
//        }
//    }

    /**
     * 实际消费累计-licence
     *
     * @param event
     */
//    public static void chargeLicence(Event event){
//
//        Map<String, Object> map = event.getBusinessData();
//        String account = event.getAccount();
//        BasicDBObject condition = new BasicDBObject();
//        condition.put("yearId", event.getYearId());
//        condition.put("seasonId",event.getSeasonId());
//        condition.put("monthId", event.getMonthId());
//
//        String area = getAreaByAccount(account);
//        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;
//
//        BasicDBObject incDoc = new BasicDBObject();
//        incDoc.put("licenceConsume",map.get("money"));
//        condition.put("area",area);
//
//        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//    }

    /**
     * 每日任务
     *
     * @param event
     */
    public static void dailyTask(Event event){
        for(String area : Constant.AREA_LIST){
            //刷新区域内当月的Licence消费
            try {
                refreshCurrentLicenceConsume(area,event);
            } catch (ParseException e) {
                log.warning("refresh current licence consume failed." + e.getMessage());
                e.printStackTrace();
            }

        }

    }

    public static void refreshCurrentLicenceConsume(String area, Event event) throws ParseException {
        String reportTime = event.getReportTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        String theDayStr = reportTime.substring(0,reportTime.lastIndexOf(" "));

        List<String> accounts = getAccountListByArea(area);
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
        condition.put("area",area);

        log.log(Level.INFO,"licence consume : [event:" + event.toString() + ",area:" + area +",consume:" + licenceConsume + "]");

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc",new BasicDBObject("licenceConsume",licenceConsume)), true);

        //累加到总计实际消费.
        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", new BasicDBObject("actualConsume",licenceConsume)), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("callConsume.$.callConsume",map.get("money"));
        condition.put("callConsume.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("callConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("callConsume", new BasicDBObject().append("product", map.get("product")).append("callConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("smsConsume",map.get("money"));
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("flowConsume",map.get("money"));
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("voiceConsume",map.get("money"));
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("numberPay.$.numberPay",map.get("money"));
        condition.put("numberPay.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("numberPay.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("numberPay", new BasicDBObject().append("product", map.get("product")).append("numberPay", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("concurrentPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("minConsume.$.minConsume",map.get("money"));
        condition.put("minConsume.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("minConsume.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("minConsume", new BasicDBObject().append("product", map.get("product")).append("minConsume", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("workPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("hardwarePay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("tapePay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("otherPay",map.get("money"));

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        condition.put("area",area);
        incDoc.put("rent.$.rent",map.get("money"));
        condition.put("rent.product",map.get("product"));

        UpdateResult rs = MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc),false);

        if(rs == null || rs.getMatchedCount() == 0) {
            condition.put("rent.product", new BasicDBObject("$ne", map.get("product")));
            BasicDBObject pushDoc = new BasicDBObject();
            pushDoc.put("rent", new BasicDBObject().append("product", map.get("product")).append("rent", map.get("money")));
            MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
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

        String area = getAreaByAccount(account);
        area = area == null || area.isEmpty() ? UNKOWN_AREA : area;

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("actualConsume",map.get("money"));
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 刷新区域内付费企业数
     */
    private static void refreshCurrentAccountNum(String area,String yearId,String seasonId,String monthId){
        //查询该区域的所有代理
        List<BasicDBObject> areaUsers = getUserListByArea(area);
        BasicDBList areaCondition = new BasicDBList();
        if(areaUsers!=null){
            for(BasicDBObject user:areaUsers){
                areaCondition.add(user.get("_id"));
            }
        }

        //查询区域内所有付费企业数量
        long areaPayAccCount = MongoProvider.countFromApp("bill",Constant.APP_PLATFORM_ACCOUNT,new BasicDBObject("status","normal").append("createUser",new BasicDBObject("$in",areaCondition)));

        //更新到当前月报表记录
        BasicDBObject condition = new BasicDBObject();
        condition.put("yearId", yearId);
        condition.put("monthId", monthId);
        condition.put("seasonId",seasonId);
        condition.put("area",area);

        MongoProvider.update(Constant.BILL_SALES_AREA_REPORT_TABLE, condition, new BasicDBObject("$set",new BasicDBObject("totalPayAccCount",areaPayAccCount)), true);
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

    private static List<BasicDBObject> getUserListByArea(String area){
        BasicDBObject condition = new BasicDBObject();

        if(area.equals(UNKOWN_AREA)){
            BasicDBList inDoc = new BasicDBList();
            inDoc.add("");
            inDoc.add(null);
            condition.put("proxyType",new BasicDBObject("$in",inDoc));
        }else{
            condition.put("proxyType",area);
        }
        condition.put("status","enable");
        condition.put("realProxy",null);

        List<BasicDBObject> users=  MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());

        //加上集团账户的代理
        List<BasicDBObject> financeList = getAllGroupFinanceList();
        List<BasicDBObject> addFinanceList = new ArrayList<BasicDBObject>();
        if(financeList!=null){
            for(BasicDBObject dbFinance : financeList){
                String realProxyId = (String)dbFinance.get("realProxy");
                for(BasicDBObject dbUser : users){
                    String userId = (String)dbUser.get("_id");
                    if(realProxyId.equals(userId)){
                        addFinanceList.add(dbFinance);
                    }
                }
            }
        }

        users.addAll(addFinanceList);

        return users;
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

    private static String getAreaByAccount(String aid){
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
                return (String)realProxy.get("proxyType");
            }
        }

        return creator.getString("proxyType");
    }

    private static List<BasicDBObject> getAllGroupFinanceList(){
        BasicDBObject condition = new BasicDBObject();

        BasicDBList ninList = new BasicDBList();
        ninList.add(null);
        ninList.add("");
        condition.put("realProxy",new BasicDBObject("$nin",ninList));

        List<BasicDBObject> users=  MongoProvider.findFromApp("bill",Constant.APP_BILL_SYSTEM_USER,condition,new BasicDBObject());

        return users;
    }

    private static List<String> getAccountListByArea(String area) {
        List<String> res = new ArrayList<String>();

        //查询该区域的所有代理
        List<BasicDBObject> areaUsers = getUserListByArea(area);
        BasicDBList areaCondition = new BasicDBList();
        if (areaUsers == null || areaUsers.isEmpty()) {
            return Collections.emptyList();
        }
        for (BasicDBObject user : areaUsers) {
            areaCondition.add(user.get("_id"));
        }


        //查询区域内所有付费企业数量
        List<BasicDBObject> dbAccountList = MongoProvider.findFromApp("bill", Constant.APP_PLATFORM_ACCOUNT, new BasicDBObject("createUser", new BasicDBObject("$in", areaCondition)));

        if (dbAccountList == null || dbAccountList.isEmpty()) {
            return Collections.emptyList();
        }

        for (BasicDBObject dbObj : dbAccountList) {
            if (dbObj == null) {
                continue;
            }
            String accountID = (String) dbObj.get("_id");
            if (accountID != null) {
                res.add(accountID);
            }
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
