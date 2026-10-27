package com.dishui.bill.alert;

import com.dishui.bill.bill.AccountBillTask;
import com.dishui.bill.command.Fields;
import com.dishui.bill.db.model.Account;
import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.db.service.AccountService;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.HttpProvider;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AlertTask extends TimerTask {
    private static Logger log = Logger.getLogger(AlertTask.class.getName());

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            log.info("AlertTask hour::=============" + now.get(Calendar.HOUR_OF_DAY));
            if (now.get(Calendar.HOUR_OF_DAY) != 0) {
                return;
            }
            //zj num
            serviceNumWaitPayRecycle();
            deductServiceNumLegacy();
            //cc num
            serviceCCNumAlert();
            deductCCServiceNumLegacy();

            //free audit failure num
//            freeAuditServiceNum();
//            stopZJTryNumLegacy();
//            serviceZJNumRecycle();
//            serviceNumPresentAutoDelay();
//            licencePresentAutoDelay();
            //400号码 手动回收  不需要系统自动回收
//            num400Alert();
        } catch (Exception e) {
            log.log(Level.WARNING, "process serviceNum endTime exception! ", e);
            e.printStackTrace();
        }
    }


    private  void serviceNumWaitPayRecycle(){
        String now = Utils.getDefaultCurrentDate();
        log.log(Level.INFO,"start serviceNumWaitPayRecycle , date is :" + now);
        DBObject condition = new BasicDBObject().append("status", "waitPay").append("product","zj").append("endTime", new BasicDBObject().append("$lt", now));
        List<DBObject> numList = MongoProvider.find("platform_serviceNum", condition);
        for (int i = 0; i < numList.size(); i++) {
            try {
                DBObject current = numList.get(i);
                String num = (String) current.get("_id");
                String accountId = (String) current.get("account");
                if (current.get("endTime") != null) {
                    String endTime = (String) current.get("endTime");
                    int days = Utils.getBetweenDays(now, endTime);
                    if (days < 0) { //服务号到期
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "waitPayEnd");
                        notify.put("account", accountId);
                        notify.put("num", num);
                        MongoProvider.insert("bill_notify", notify);
//                        MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", num), new BasicDBObject("$inc", new BasicDBObject("failNum", 1)));
                        continue;
                    }
                } else {
                    log.log(Level.WARNING, "servicenum [" + num + "] no end time !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process serviceNum exception! ", e);
                e.printStackTrace();
            }
        }
        log.log(Level.INFO,"end serviceNumWaitPayRecycle["+ Utils.getDefaultCurrentDate() + "] ");
    }


    /**
     * 处理呼叫中心试用服务号的预警、到期和回收
     */
    private void serviceCCNumAlert() {
        BasicDBList conditionList = new BasicDBList();
        conditionList.add(null);
        conditionList.add("");
//        BasicDBList conditionList2 = new BasicDBList();
//        conditionList2.add("use");
//        conditionList2.add("try");
        DBObject condition = new BasicDBObject("type","normal").append("product","cc").append("status","try").append("endTime",new BasicDBObject().append("$nin",conditionList));
        List<DBObject> snlist = MongoProvider.find("platform_serviceNum", condition);
        for (int i = 0; i < snlist.size(); i++) {
            try {
                DBObject current = snlist.get(i);
                String num = (String) current.get("_id");
                String accountId = (String) current.get("account");
                if (current.get("endTime") != null) {
                    String endTime = (String) current.get("endTime");
                    String now = Utils.getDefaultCurrentDate();
                    int days = Utils.getBetweenDays(now, endTime);
                    if (days < 0) { //服务号到期
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "serviceNumEnd");
                        notify.put("account", accountId);
                        notify.put("num", num);
                        MongoProvider.insert("bill_notify", notify);
                        MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", num), new BasicDBObject("$inc", new BasicDBObject("failNum", 1)));
                        continue;
                    }

                } else {
                    log.log(Level.WARNING, "account[" + accountId + "] not found !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process serviceNum exception! ", e);
                e.printStackTrace();
            }
        }
    }


    /**
     * 处理总机还未到期号码的自动续费（处理完所有的任务后停用即可）
     */
    private void deductServiceNumLegacy(){
        String now = Utils.getDefaultCurrentDate();
        log.log(Level.INFO, "start deductServiceNumLegacy , date is :" + now);
        DBObject condition = new BasicDBObject().append("product", "zj").append("status","use").append("isOld","1").append("endTime", new BasicDBObject().append("$lt", now));
        List<DBObject> numList = MongoProvider.find("platform_serviceNum", condition);
        for(DBObject num : numList){
            try {
                String id=(String)num.get("_id");
                String account=(String)num.get("account");
                long monthRent=Double.valueOf(String.valueOf(num.get("monthRent"))).longValue();

                DBObject productDB= MongoProvider.findOne("platform_account_product", new BasicDBObject("_id", account + "_zj"));
                long concurrentPrice=Long.parseLong(String.valueOf(productDB.get("concurrentPrice")));
                long monthRentProxy=Double.valueOf(String.valueOf(num.get("monthRentProxy")==null?100000l:num.get("monthRentProxy"))).longValue();
                long concurrent=Long.parseLong(String.valueOf(num.get("concurrent")));
                long concurrentFee=concurrentPrice*(concurrent-1);
                long concurrentMinFee= Fields.ConcurrentPrice*(concurrent-1);

                MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", id), new BasicDBObject().append("$unset", new BasicDBObject("isOld", 1)));

                long monthFee=0l;
                long proxyFee=0l;
                int monthDay=getCurrentMonthLastDay();
                int leaveDay=getCurrentMonthLeaveDay(monthDay);
                monthFee=((monthRent+concurrentFee)/monthDay)*leaveDay;
                proxyFee+=(monthRent-monthRentProxy)+(concurrentFee-concurrentMinFee);


                DBObject accDB= MongoProvider.findOne("platform_account", new BasicDBObject("_id", account), new BasicDBObject("balance", 1).append("createMethod", 1).append("createUser", 1));
                long balance=Double.valueOf(String.valueOf(accDB.get("balance"))).longValue();
                long overdraw=accDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accDB.get("overdraw"))).longValue();
                long actualBalance=balance+overdraw;

                //String createMethod=(String)accDB.get("createMethod");
                //获取代理
                SystemUser proxy =AccountService.getProxy(account);
                String createUser = proxy==null ? null : proxy.getId();

                DBObject proxyUser=null;
                String proxyId="";
                String proxyIncome="0";
                if(createUser != null){
                    proxyUser= MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", createUser));
                    proxyId=createUser;
                }
                if(monthFee<=actualBalance){
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",-monthFee));

                    // 扣账户余额
                    // DBObject _accDB= MongoProvider.findAndModify("platform_account", new BasicDBObject("_id", account), _set, false);
                    AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(account, -(double)monthFee);
                    DBObject _accDB = consumeRes.normalAccount;

                    //给代理结算
                    if(proxyUser!=null){
                        long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                        long consume = proxyFee*percent/100;
                        proxyIncome= Utils.formatRound2Money(consume);
                        DBObject _setProxy = new BasicDBObject();
                        _setProxy.put("$inc",new BasicDBObject("balance",consume));
                        DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user", new BasicDBObject("_id", createUser), _setProxy, false);
                        //生成代理收入记录
                        _insertProxyIncome(_proxyDB,"snRenew",consume,id,account,leaveDay,concurrent);
                    }
                    //消费记录
                    String userPayId = _insertUserPay(_accDB,"snRenew",monthFee,id ,proxyIncome,proxyId,leaveDay,concurrent);
                    // 如果消费财务账户的余额，需要给消费记录绑定财务账户
                    if (consumeRes.hasConsumeFinanceAccount) {
                        AccountService.bindFinanceAccountToUserPay(userPayId, consumeRes.paidAccount.get("_id").toString());
                    }
                    AccountBillTask.syncZJMonthConcume2(account, monthFee, consumeRes);
                }else{
                    DBObject _inc = new BasicDBObject();
                    _inc.put("failNum",1);
                    DBObject _setNum = new BasicDBObject();
                    _setNum.put("status", "stop");
                    _setNum.put("planFlag", "");
    //                _setNum.put("endTime", "");
                    MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", id), new BasicDBObject("$inc", _inc).append("$set", _setNum));

                    //stop num  ,同步acs并发
                    DBObject notify = new BasicDBObject();
                    notify.put("_id", Utils.getUniqueid());
                    notify.put("type", "serviceNumEnd");
                    notify.put("account", account);
                    notify.put("num", id);
                    MongoProvider.insert("bill_notify", notify);
                }
            } catch (NumberFormatException e) {
                log.log(Level.WARNING, "process deductServiceNumLegacy exception! ", e);
                e.printStackTrace();
            }
        }
        log.log(Level.INFO,"end deductServiceNumLegacy["+ Utils.getDefaultCurrentDate() + "]");
    }
    public static String _insertUserPay(DBObject accDB,String flag,long totalFee,String nums,String income,String proxy,int leaveDay,long concurrent){
        String curretnTime= Utils.getCurrentDate();
        String _balance= Utils.formatRound2Money(Double.valueOf(String.valueOf(accDB.get("balance"))).longValue());
        String _totalFee= Utils.formatRound2Money(totalFee);
        DBObject temp=new BasicDBObject();
        String orderNo= IDGenerator.getNext(6);
        temp.put("_id",orderNo);
        temp.put("status","pay");
        temp.put("payType","balance");
        temp.put("money","0");
        temp.put("account",accDB.get("_id"));
        temp.put("create_time",curretnTime);
        temp.put("pay_time",curretnTime);
        temp.put("flag",flag);
        temp.put("totalFee",_totalFee+"");
        temp.put("balance",_totalFee+"");
        temp.put("product","zj");
        DBObject sn = new BasicDBObject();
        sn.put("serviceno",nums);
        sn.put("leaveDay",leaveDay);
        sn.put("concurrent",concurrent);
        temp.put("sn", sn);
        temp.put("income",income);
        temp.put("proxy",proxy);
        temp.put("currentBalance",_balance);
        temp.put("timestamp",System.currentTimeMillis());
        MongoProvider.insert("zj", "user_pay", temp);
        return orderNo;
    }
    public static void _insertProxyIncome(DBObject proxyDB,String flag,long totalFee,String nums,String account,int leaveDay,long concurrent){
        String income= Utils.formatRound2Money(totalFee);
        String _balanceProxy= Utils.formatRound2Money(Double.valueOf(String.valueOf(proxyDB.get("balance"))).longValue());
        String curretnTime= Utils.getCurrentDate();

        DBObject tempProxy=new BasicDBObject();
        String orderNoProxy="Ti"+ IDGenerator.getNext(6);
        tempProxy.put("_id",orderNoProxy);
        tempProxy.put("status","pay");
        tempProxy.put("income",income);
        tempProxy.put("account",account);
        tempProxy.put("create_time",curretnTime);
        tempProxy.put("pay_time",curretnTime);
        tempProxy.put("flag",flag);
        tempProxy.put("source","serviceNo");
        tempProxy.put("proxy",proxyDB.get("_id"));
        tempProxy.put("currentBalance",_balanceProxy);
        DBObject snProxy = new BasicDBObject();
        snProxy.put("serviceno",nums);
        snProxy.put("leaveDay",leaveDay);
        snProxy.put("concurrent",concurrent);
        tempProxy.put("sn", snProxy);
        tempProxy.put("timestamp",System.currentTimeMillis());

        MongoProvider.insert("bill_user_pay", tempProxy);
    }

    public static int getCurrentMonthLastDay(){
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.DATE, 1);
        calendar.roll(Calendar.DATE, -1);
        int maxDate = calendar.get(Calendar.DATE);
        return maxDate;
    }
    public static int getCurrentMonthLeaveDay(int total){
        Calendar calendar = Calendar.getInstance();
        return total-calendar.get(Calendar.DAY_OF_MONTH)+1;
//        return calendar.get(Calendar.DATE);
    }


    /**
     * 处理cc还未到期号码的自动续费（处理完所有的任务后停用即可）
     */
    private void deductCCServiceNumLegacy(){
        String now = Utils.getDefaultCurrentDate();
        log.log(Level.INFO, "start deductCCServiceNumLegacy , date is :" + now);
        DBObject condition = new BasicDBObject().append("product", "cc").append("status","use").append("isOld","1").append("endTime", new BasicDBObject().append("$lt", now));
        List<DBObject> numList = MongoProvider.find("platform_serviceNum", condition);
        for(DBObject num : numList){
            try {
                String id=(String)num.get("_id");
                String account=(String)num.get("account");
                long monthRent=Double.valueOf(String.valueOf(num.get("monthRent"))).longValue();

//                DBObject productDB= MongoProvider.findOne("platform_account_product", new BasicDBObject("_id", account + "_cc"));
                long monthRentProxy=Double.valueOf(String.valueOf(num.get("monthRentProxy")==null?100000l:num.get("monthRentProxy"))).longValue();

                MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", id), new BasicDBObject().append("$unset", new BasicDBObject("isOld", 1)));

                long monthFee=0l;
                long proxyFee=0l;
                int monthDay=getCurrentMonthLastDay();
                int leaveDay=getCurrentMonthLeaveDay(monthDay);
                monthFee=((monthRent)/monthDay)*leaveDay;
                proxyFee=(monthRent-monthRentProxy);


                DBObject accDB= MongoProvider.findOne("platform_account", new BasicDBObject("_id", account), new BasicDBObject("balance", 1).append("createMethod", 1).append("createUser", 1));
                long balance=Double.valueOf(String.valueOf(accDB.get("balance"))).longValue();
                long overdraw=accDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accDB.get("overdraw"))).longValue();
                long actualBalance=balance+overdraw;

                //String createMethod=(String)accDB.get("createMethod");
                //获取代理
                SystemUser proxy =AccountService.getProxy(account);
                String createUser = proxy==null ? null : proxy.getId();

                DBObject proxyUser=null;
                String proxyId="";
                String proxyIncome="0";
                if(createUser != null){
                    proxyUser= MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", createUser));
                    proxyId=createUser;
                }
                if(monthFee<=actualBalance){
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",-monthFee));
                    // DBObject _accDB= MongoProvider.findAndModify("platform_account", new BasicDBObject("_id", account), _set, false);
                    AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(account, -(double)monthFee);
                    DBObject _accDB = consumeRes.normalAccount;

                    //给代理结算
                    if(proxyUser!=null){
                        long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                        long consume = proxyFee*percent/100;
                        proxyIncome= Utils.formatRound2Money(consume);
                        DBObject _setProxy = new BasicDBObject();
                        _setProxy.put("$inc",new BasicDBObject("balance",consume));
                        DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user", new BasicDBObject("_id", createUser), _setProxy, false);
                        //生成代理收入记录
                        _insertProxyIncome(_proxyDB,"snRenew",consume,id,account,leaveDay,1);
                    }
                    //消费记录
                    String userPayId = _insertCCNumUserPay(_accDB,"snRenew",monthFee,id ,proxyIncome,proxyId,leaveDay);
                    if (consumeRes.hasConsumeFinanceAccount) {
                        AccountService.bindFinanceAccountToUserPay(userPayId, consumeRes.paidAccount.get("_id").toString());
                    }
                    AccountBillTask.syncCCMonthConcume2(account, monthFee, consumeRes);
                }else{
                    DBObject _inc = new BasicDBObject();
                    _inc.put("failNum",1);
                    DBObject _setNum = new BasicDBObject();
                    _setNum.put("status", "stop");
                    _setNum.put("planFlag", "");
                    //                _setNum.put("endTime", "");
                    MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", id), new BasicDBObject("$inc", _inc).append("$set", _setNum));

                    //stop num  ,同步acs并发
                    DBObject notify = new BasicDBObject();
                    notify.put("_id", Utils.getUniqueid());
                    notify.put("type", "serviceNumEnd");
                    notify.put("account", account);
                    notify.put("num", id);
                    MongoProvider.insert("bill_notify", notify);
                }
            } catch (NumberFormatException e) {
                log.log(Level.WARNING, "process deductCCServiceNumLegacy exception! ", e);
                e.printStackTrace();
            }
        }
        log.log(Level.INFO,"end deductCCServiceNumLegacy["+ Utils.getDefaultCurrentDate() + "]");
    }

    public static String _insertCCNumUserPay(DBObject accDB,String flag,long totalFee,String nums,String income,String proxy,int leaveDay){
        String curretnTime= Utils.getCurrentDate();
        String _balance= Utils.formatRound2Money(Double.valueOf(String.valueOf(accDB.get("balance"))).longValue());
        String _totalFee= Utils.formatRound2Money(totalFee);
        DBObject temp=new BasicDBObject();
        String orderNo= IDGenerator.getNext(6);
        temp.put("_id",orderNo);
        temp.put("status","pay");
        temp.put("payType","balance");
        temp.put("money","0");
        temp.put("account",accDB.get("_id"));
        temp.put("create_time",curretnTime);
        temp.put("pay_time",curretnTime);
        temp.put("flag",flag);
        temp.put("totalFee",_totalFee+"");
        temp.put("balance",_totalFee+"");
        temp.put("product","cc");
        DBObject sn = new BasicDBObject();
        sn.put("serviceno",nums);
        sn.put("leaveDay",leaveDay);
        sn.put("concurrent",1);
        temp.put("sn", sn);
        temp.put("income",income);
        temp.put("proxy",proxy);
        temp.put("currentBalance",_balance);
        temp.put("timestamp",System.currentTimeMillis());
        MongoProvider.insert("zj", "user_pay", temp);
        return orderNo;
    }


    /**
     * 释放未审核通过的号码    （废弃）
     */
    private void freeAuditServiceNum() {
        BasicDBList conditionList = new BasicDBList();
        conditionList.add(null);
        conditionList.add("");
        DBObject condition = new BasicDBObject("type","normal").append("status","unpass");
        List<DBObject> snlist = MongoProvider.find("platform_serviceNum", condition);
        for (int i = 0; i < snlist.size(); i++) {
            try {
                DBObject current = snlist.get(i);
                String num = (String) current.get("_id");
                MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", num), new BasicDBObject("$set",
                        new BasicDBObject("status", "free").append("account","").append("pbx","").append("product","").append("flag","").append("beginTime","").append("endTime","")));
            } catch (Exception e) {
                log.log(Level.WARNING, "process serviceNum exception! ", e);
                e.printStackTrace();
            }
        }
    }


    ////=============================================以下废弃===========================================================/////






    /**
     * 处理预警、到期、正式试用的400号码回收
     */
    private void num400Alert() {
        DBObject condition = new BasicDBObject().append("status", "use");
        List<DBObject> snlist = MongoProvider.find("platform_num400", condition);
        for (int i = 0; i < snlist.size(); i++) {
            try {
                DBObject current = snlist.get(i);
                String num = (String) current.get("_id");
                String accountId = (String) current.get("account");
//                DBObject accountObj = MongoProvider.findOne("platform_account", new BasicDBObject().append("_id", accountId));
//                if (accountObj != null) {
//                    int serviceNumAlert = 0;
//                    try {
//                        serviceNumAlert = Integer.parseInt(String.valueOf(accountObj.get("num400Alert")));
//                    } catch (Exception e) {
//                        e.printStackTrace();
//                    }
                if (current.get("endTime") != null) {
                    String endTime = (String) current.get("endTime");
                    String now = Utils.getDefaultCurrentDate();
                    int days = Utils.getBetweenDays(now, endTime);
                    if (days < 0 && Math.abs(days) == 1) {
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "num400End");
                        notify.put("account", accountId);
                        notify.put("num", num);
                        MongoProvider.insert("bill_notify", notify);
                        continue;
                    }

                    if(days < 0 && Math.abs(days) >= 30){ //400号资源需要释放
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "num400Drop");
                        notify.put("account", accountId);
                        notify.put("num", num);
                        MongoProvider.insert("bill_notify", notify);
                        continue;
                    }
//                        if (days <= serviceNumAlert  && (accountObj.get("alerted") == null || !(Boolean) accountObj.get("alerted"))) {
//                            DBObject notify = new BasicDBObject();
//                            notify.put("_id", Utils.getUniqueid());
//                            notify.put("type", "num400Alert");
//                            notify.put("account", accountId);
//                            notify.put("num", num);
//                            MongoProvider.insert("bill_notify", notify);
//                            MongoProvider.update("platform_account",new BasicDBObject().append("_id",accountId), new BasicDBObject().append("$set",new BasicDBObject().append("alerted",true)) );
//                            continue;
//                        }

//                    } else {
//                        log.log(Level.WARNING, "num400 [" + num + "] no end time !", new Exception());
//                    }
                } else {
                    log.log(Level.WARNING, "account[" + accountId + "] not found !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process num400 exception! ", e);
                e.printStackTrace();
            }
        }
    }

    /**
     * 总机旧的试用号码到期停用（处理完所有的任务后停用即可）
     */
    private void stopZJTryNumLegacy() {
        BasicDBList conditionList = new BasicDBList();
        conditionList.add(null);
        conditionList.add("");
        DBObject condition = new BasicDBObject("type","normal").append("product","zj").append("status", "try").append("endTime",new BasicDBObject().append("$nin",conditionList));
        List<DBObject> snlist = MongoProvider.find("platform_serviceNum", condition);
        for (int i = 0; i < snlist.size(); i++) {
            try {
                DBObject current = snlist.get(i);
                String num = (String) current.get("_id");
                String accountId = (String) current.get("account");
                DBObject accountObj = MongoProvider.findOne("platform_account", new BasicDBObject().append("_id", accountId));
                if (accountObj != null) {
                    if (current.get("endTime") != null) {
                        String endTime = (String) current.get("endTime");
                        String now = Utils.getDefaultCurrentDate();
                        int days = Utils.getBetweenDays(now, endTime);
                        if (days < 0) { //服务号到期
                            DBObject notify = new BasicDBObject();
                            notify.put("_id", Utils.getUniqueid());
                            notify.put("type", "serviceNumEnd");
                            notify.put("account", accountId);
                            notify.put("num", num);
                            MongoProvider.insert("bill_notify", notify);
                            MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", num), new BasicDBObject("$unset", new BasicDBObject("isOld", 1)).append("$inc", new BasicDBObject("failNum", 1)));
                        }
                    } else {
                        log.log(Level.WARNING, "servicenum [" + num + "] no end time !", new Exception());
                    }
                } else {
                    log.log(Level.WARNING, "account[" + accountId + "] not found !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process stopZJTryNumLegacy exception! ", e);
                e.printStackTrace();

            }
        }
    }

    /**
     * 总机试用号码到期自动回收
     */
    private void serviceZJNumRecycle(){
        String now = Utils.getDefaultCurrentDate();
        log.log(Level.INFO,"start recycle zj try serviceNum , date is :" + now);
        DBObject condition = new BasicDBObject().append("type", "try").append("product","zj").append("endTime", new BasicDBObject().append("$lt", now));//包含结束时间为空的
        List<DBObject> numList = MongoProvider.find("platform_serviceNum", condition);
        for(DBObject obj : numList){
            try{
                String url = AppConfig.getInstance().getVar("node.server.url") + "?action=pay.recycleZJTryNum&data={\"_id\":\""+obj.get("_id")+"\"}";
                log.log(Level.INFO,"send url :" + url);
                HttpProvider.sendGet(url);
            } catch (Exception e){
                log.log(Level.WARNING,"",e);
            }

        }
        log.log(Level.INFO,"end recycle zj try serviceNum["+ Utils.getDefaultCurrentDate() + "] ");
    }


    //wwh 呼叫中心服务号赠送状态自动延期
    private void serviceNumPresentAutoDelay(){
        String now = Utils.getDefaultCurrentDate();
//        String now="2014-11-15";//_id:54c84828bf2f78efb64c270f
        log.log(Level.INFO,"start serviceNumPresentAutoDelay , date is :" + now);
        DBObject condition = new BasicDBObject().append("status", "present").append("product","cc").append("endTime", new BasicDBObject("$lte",now));
        List<DBObject> numList = MongoProvider.find("platform_serviceNum", condition);
        for (int i = 0; i < numList.size(); i++) {
            try {
                DBObject current = numList.get(i);
                String num = (String) current.get("_id");
                if (current.get("endTime") != null) {
                    String endTime = Utils.addMonth(now,1);
                    MongoProvider.update("platform_serviceNum", new BasicDBObject("_id", num), new BasicDBObject("$set", new BasicDBObject("endTime", endTime)));
                    continue;
                } else {
                    log.log(Level.WARNING, "servicenum [" + num + "] no end time !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process serviceNum exception! ", e);
                e.printStackTrace();
            }
        }
        log.log(Level.INFO,"end serviceNumPresentAutoDelay["+ Utils.getDefaultCurrentDate() + "] ");
    }

    //wwh 呼叫中心licence赠送状态自动延期
    private void licencePresentAutoDelay(){
        String now = Utils.getDefaultCurrentDate();
//        String now="2014-12-11";//_id:54c846a6bf2f78efb64c270d
        log.log(Level.INFO,"start licencePresentAutoDelay , date is :" + now);
        DBObject condition = new BasicDBObject().append("status", "present").append("endDate", new BasicDBObject("$lte",now));
        List<DBObject> licenceList = MongoProvider.find("platform_licence", condition);
        for (int i = 0; i < licenceList.size(); i++) {
            try {
                DBObject current = licenceList.get(i);
                String id = (String) current.get("_id");
                if (current.get("endDate") != null) {
                    String endDate =Utils.addMonth(now,1);
                    MongoProvider.update("platform_licence", new BasicDBObject("_id", id), new BasicDBObject("$set", new BasicDBObject("endDate", endDate)));
                    continue;
                } else {
                    log.log(Level.WARNING, "licence [" + id + "] no endDate !", new Exception());
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process serviceNum exception! ", e);
                e.printStackTrace();
            }
        }
        log.log(Level.INFO,"end licencePresentAutoDelay["+ Utils.getDefaultCurrentDate() + "] ");
    }
}
