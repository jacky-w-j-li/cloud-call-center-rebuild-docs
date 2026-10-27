package com.dishui.manager.billReport.impl.sales;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/1/8.
 * 销售考核报表
 * 考核每个销售的
 *
 * 销售   user
 * 所属地区  area
 * 团队   team
 * 创建客户数    create
 * 签约客户数    turnUsing
 * 新签客户回款   newPay
 * 老客户续费回款  oldPay
 * 系统回款总金额  systemPayCount
 * 硬件回款总金额  hardWarePayCount
 *
 * 另外，每个销售有自己的区域和团队 也是需要考虑的
 *
 */
public class SalesUserCheckReportHandler {
    private static final Logger log = Logger.getLogger(SalesUserCheckReportHandler.class.getName());

    /**
     * 创建新客户
     * 客户可能是属于某个销售的，也可能是属于代理的，所以需要确认
     */
    public static void newAccount(Event event){
        Map<String, Object> map = event.getBusinessData();

        String account = event.getAccount();
        String agent = getUserIdByAccount(account);
        if(agent == null || agent.equalsIgnoreCase("")){
            return;
        }

        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", event.getDayId() + "_" + agent);
        condition.put("user",agent);
        condition.put("year", event.getYearId());
        condition.put("season",event.getSeasonId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("create",1);

        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 客户转正
     * 相当于变为正式签约客户
     */
    public static void turnUsing(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        String agent = getUserIdByAccount(account);
        if(agent == null || agent.equalsIgnoreCase("")){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", event.getDayId()  + "_" + agent);
        condition.put("user",agent);
        condition.put("year", event.getYearId());
        condition.put("season",event.getSeasonId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("turnUsing",1);
        turnUsingAccount(condition,account,true);

        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 客户付费
     * 客户付费，需要判断是首次回款还是老客户回款
     */
    public static void accountPay(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        String agent = getUserIdByAccount(account);
        if(agent == null || agent.equalsIgnoreCase("")){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", event.getDayId() + "_" + agent);
        condition.put("user",agent);
        condition.put("year", event.getYearId());
        condition.put("season",event.getSeasonId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

//        BasicDBObject updateDoc = new BasicDBObject();
        Boolean isFirst = (Boolean)map.get("isFirst");
        Long payNum = Utils.transDBNumberLong(map.get("payNum"));
        payNum = payNum/10000;
//        String bank = (String)map.get("bank");
//        updateDoc.put("bank",bank);
//        String payKind = (String)map.get("payKind");
//        updateDoc.put("payKind",payKind);

        BasicDBObject incDoc = new BasicDBObject();

        if(isFirst!=null && isFirst){
            incDoc.put("newPay",payNum);
        } else{
            incDoc.put("oldPay",payNum);
        }
        incDoc.put("systemPayCount",payNum);

        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc",incDoc), true);
    }

    public static void chargeWork(Event event){
        commonCharge(event);
    }

    public static void chargeHardware(Event event){
        commonCharge(event);
    }

    public static void chargeTape(Event event){
        commonCharge(event);
    }

    public static void chargeOther(Event event){
        //commonCharge(event);
    }

    /**
     * 若最近一次回款是首次回款,则扣除新签客户回款,否则扣除老客户回款
     */
    private static void commonCharge(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        String agent = getUserIdByAccount(account);
        if(agent == null || agent.equalsIgnoreCase("")){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", event.getDayId() + "_" + agent);
        condition.put("user",agent);
        condition.put("year", event.getYearId());
        condition.put("season",event.getSeasonId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        Long money = Utils.transDBNumberLong(map.get("money"));
        money = money/10000;

        //汇总到硬件回款
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("hardWarePayCount",money);

        //判断本次扣费是来自于新签回款还是老客户续费回款
        //从回款中扣除
        boolean isFromFirstPay = isFromFirstPay(account);
        if(isFromFirstPay){
            incDoc.put("newPay",-money);
        } else{
            incDoc.put("oldPay",-money);
        }
        incDoc.put("systemPayCount",-money);

        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc",incDoc), true);

    }

    /**
     * 代理给客户充值
     * 代理包括全平台代理，需要判断代理是否是公司销售
     */
    public static void proxyPay(Event event){
        Map<String, Object> map = event.getBusinessData();
        String account = event.getAccount();
        String agent = getUserIdByAccount(account);
        if(agent == null || agent.equalsIgnoreCase("")){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", event.getDayId()  + "_" + agent);
        condition.put("user",agent);
        condition.put("year", event.getYearId());
        condition.put("season",event.getSeasonId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        Boolean isFirst = (Boolean)map.get("isFirst");
        Long payNum = Utils.transDBNumberLong(map.get("payNum"));
        payNum = payNum/10000;
        BasicDBObject incDoc = new BasicDBObject();
        if(isFirst!=null && isFirst){
            incDoc.put("newPay",payNum);
        } else {
            incDoc.put("oldPay",payNum);
        }

        incDoc.put("systemPayCount",payNum);


        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
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

        //这里需要这样,但是这种情况(集团账户换代理)实在太少,
        agent = getRealProxy(agent);//集团财务处理
        oldAgent = getRealProxy(oldAgent);//集团财务处理

        List<BasicDBObject> accountList = MongoProvider.findFromApp("bill",Constant.APP_PLATFORM_ACCOUNT, new BasicDBObject().append("_id", account));
        if (accountList.size() > 0) {
            DBObject findAccount = accountList.get(0);
            String accountStatus = (String)findAccount.get("status");
            if(agent != null && !agent.equalsIgnoreCase("")){
                BasicDBObject condition = new BasicDBObject();
                condition.put("_id", event.getDayId()  + "_" + agent);
                condition.put("user",agent);
                condition.put("year", event.getYearId());
                condition.put("season",event.getSeasonId());
                condition.put("month",event.getMonthId());
                condition.put("day",event.getDayId());
                BasicDBObject incDoc = new BasicDBObject();
                if(accountStatus.equalsIgnoreCase("normal")){
                    incDoc.put("turnUsing",1);
                    turnUsingAccount(condition,account,true);
                } else {
                    incDoc.put("create",1);
                }
                MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
            if(oldAgent != null && !oldAgent.equalsIgnoreCase("")){
                BasicDBObject condition = new BasicDBObject();
                condition.put("_id", event.getDayId()  + "_" + oldAgent);
                condition.put("user",oldAgent);
                condition.put("year", event.getYearId());
                condition.put("season",event.getSeasonId());
                condition.put("month",event.getMonthId());
                condition.put("day",event.getDayId());
                BasicDBObject incDoc = new BasicDBObject();
                if(accountStatus.equalsIgnoreCase("normal")){
                    incDoc.put("turnUsing",-1);
                    turnUsingAccount(condition,account,false);
                } else {
                    incDoc.put("create",-1);
                }
                MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        } else {
            log.log(Level.WARNING,"can not found platform account :" + account);
            return;
        }

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

    /**
     * 判断最近一次充值是否是首次回款
     *
     * @param accountId
     * @return
     */
    private static boolean isFromFirstPay(String accountId){
        if(accountId == null){
            return false;
        }

        BasicDBObject condition = new BasicDBObject("account",accountId);
        BasicDBObject sort = new BasicDBObject("pay_time",-1);
        BasicDBObject userPayRecord=  MongoProvider.findTopFromApp("zj",Constant.APP_USER_BANK_PAY,condition,sort);

        if(userPayRecord == null){
            return false;
        }

        Object dbIsFirstPay = userPayRecord.get("isFirstPay");
        return dbIsFirstPay==null ? false : Boolean.valueOf(String.valueOf(dbIsFirstPay));
    }

    /**
     * 销售新签客户,或者客户被签走.
     *
     * @param condition
     * @param accountId
     * @param newSign
     */
    private static void turnUsingAccount(BasicDBObject condition , String accountId , boolean newSign){
        if(condition == null || accountId == null){
            return;
        }

        condition = new BasicDBObject(condition);

        //加到客户列表
        //condition.put("turnUsingAccount.account", new BasicDBObject("$ne", accountId));
        BasicDBObject pushDoc = new BasicDBObject();
        pushDoc.put("turnUsingAccount", new BasicDBObject().append("account", accountId).append("newSign", newSign));
        MongoProvider.update(Constant.BILL_SALES_CHECK_REPORT_TABLE, condition, new BasicDBObject("$push", pushDoc), true);
    }


    private static String getRealProxy(String userId){
        if(userId == null){
            return null;
        }

        BasicDBObject user = getUserInfo(userId);
        if(user==null){
            return null;
        }

        //如果是集团财务
        String realProxyId =  (String)user.get("realProxy");
        if(realProxyId != null && !realProxyId.isEmpty()){
            BasicDBObject realProxy = getUserInfo(realProxyId);
            if(realProxy!=null){
                return realProxyId;
            }
        }

        return userId;
    }

}
