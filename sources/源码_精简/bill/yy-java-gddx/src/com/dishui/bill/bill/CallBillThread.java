package com.dishui.bill.bill;

import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.db.model.Intl;
import com.dishui.bill.db.model.Product;
import com.dishui.bill.db.model.ProxyLineFee;
import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.db.service.AccountService;
import com.dishui.bill.db.service.IntlService;
import com.dishui.bill.db.service.ProductService;
import com.dishui.bill.db.service.ProxyLineFeeService;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.db.redis.RedisAPI;
import com.dishui.db.redis.RedisUtil;
import com.dishui.report.EventBusinessField;
import com.dishui.report.EventData;
import com.dishui.report.EventReporter;
import com.dishui.report.EventType;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

import net.sf.json.JSONObject;
public class CallBillThread extends Thread {
    private static Logger log = Logger.getLogger(CallBillThread.class.getName());

    private static final String PROXY_COLLECTION = "bill_system_user";
    private static final String BILL_CDR = "bill_cdr";
    private static final String STRATEGY_MINUTE = "minute";
    private static final String STRATEGY_MINUTE3 = "minute3";
    private static final String STRATEGY_SECOND6 = "second6";
    private static final String STRATEGY_MINUTE3_S6 = "minute3s6";
    private static final int dialCountPt=5;     //每个号码平台每天默认允许拨打次数为5次
    private static Map<String,Object> zhPbxStr;      		//账户pbx地址
    private static String ptPbxStr;      		            //平台pbx地址

//    private static final String LINE_STRATEGY_MINUTE = "minute";
//    private static final String LINE_STRATEGY_SECOND6 = "second6";
//    private static final String LINE_STRATEGY_TIETONG1 = "tietong1";
//    private static final String LINE_STRATEGY_TIETONG2 = "tietong2";

    //private static final String InternationalStrategy_tietong = "tietong";
//    private static final int queueMax = 5000;
//    private static List<String> callIds=new ArrayList<String>(queueMax);
    private static final int queueNum = 100;
    private ThreadPoolExecutor executor;

    @Override
    public void run() {
//		DBObject callObj = null;
        log.info("CallBillThread start ...");
        DBObject condition = new BasicDBObject();
        condition.put("isFee",new BasicDBObject("$exists",false));
        executor = new ThreadPoolExecutor(10, 10, 600, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<Runnable>(queueNum));
        Thread main=Thread.currentThread();
        while (true) {
            try {
                long time = System.currentTimeMillis();
//				callObj = MongoConnect.getInstance().getDB("bill_data").getCollection(BILL_CDR).findOne(condition);
                List<DBObject> cdrList = MongoProvider.getDb("bill_data").getCollection(BILL_CDR).find(condition).limit(10).toArray();
                if(cdrList == null || cdrList.size() == 0) {
                    sleep(1000);
                    continue;
                }
                List<String> ids=new ArrayList<String>();
                for (DBObject callObj : cdrList) {
                    String id = String.valueOf(callObj.get("_id"));
                    ids.add(id);
                }
                MongoConnect.getInstance().getDB("bill_data").getCollection(BILL_CDR).update(new BasicDBObject("_id",new BasicDBObject("$in",ids)),
                        new BasicDBObject("$set",new BasicDBObject("isFee","1")),false,true,WriteConcern.SAFE);
                for (DBObject callObj : cdrList) {
                    try {
//                    String pk = String.valueOf(callObj.get("_id"));
//                    MongoConnect.getInstance().getDB("bill_data").getCollection(BILL_CDR).update(new BasicDBObject("_id",pk),
//                            new BasicDBObject("$set",new BasicDBObject("isFee","1")),false,false,WriteConcern.SAFE);

                        //log.log(Level.INFO,"线程池中线程数目："+executor.getPoolSize()+"，队列中等待执行的任务数目："+
                        //        executor.getQueue().size()+"，已执行完的任务数目："+executor.getCompletedTaskCount());
                        if(String.valueOf(callObj.get("account")).equals("N00000002963")){
                            MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_query_N00000002963").insert(callObj);
                        }

                        int size=executor.getQueue().size();
                        if(size>=queueNum-1){
                            log.log(Level.INFO,"＝＝＝＝＝＝＝entry wait＝＝＝＝＝＝＝");
                            executor.execute(new ChargeTask(callObj,main));
                            synchronized (main){
                                main.wait();
                            }
                        }else{
                            executor.execute(new ChargeTask(callObj,main));
                        }
                    } catch (Exception e) {
                        log.log(Level.WARNING, "process cdr item exception! ", e);
                        e.printStackTrace();
                        if (callObj != null) {
                            try {
                                MongoConnect.getInstance().getDB("bill_data").getCollection(BILL_CDR).remove(
                                        new BasicDBObject().append("_id",callObj.get("_id")),WriteConcern.SAFE);
                                MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_error").insert(callObj);
                            } catch (Exception exception) {
                                exception.printStackTrace();
                            }
                        }
                    }
                }
//                long duration = System.currentTimeMillis() - time;
//                String msg = String.format("%s消耗时间[%d ms]", "all fee", duration);
//                log.log(Level.INFO,msg);
            } catch (Exception e) {
                log.log(Level.WARNING, "call bill thread global exception occur. ", e);
                e.printStackTrace();

                try {
                    sleep(1000);
                } catch (Exception exception) {
                    exception.printStackTrace();
                }
            }
        }
    }

    private void charge(String accountID, String product, String num400, FeeObject fee, DBObject callObject,boolean isAccFee/*是否从账户扣*/,DBObject productDB) {
        long time = System.currentTimeMillis();
        String currentMonth = Utils.getDate("yyyy-MM");
        String billID = accountID + "_" + currentMonth + "_" + product;
        String billProductID = accountID+"_"+product;
        String accountCollection = BillMaster.DB_ACCOUNT_PRODUCT;

        String aid=accountID;
        String _billProductID=billProductID;
        String _accountCollection=accountCollection;

        if(product.equals("400")) {
            billID = billID +"_" + num400;
            billProductID = num400;
            accountCollection = BillMaster.DB_400;
        }

        // 获取当月话单
        DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).findOne(
                new BasicDBObject().append("_id", billID));

        // 如果没有找到话单（当月新开账户不会自动生成），则生成
        if(bill == null) {
//			AccountBillTask.createBill(accountID, currentMonth, product, num400, 0,false);
            DBObject accDB = MongoProvider.findOne(BillMaster.DB_ACCOUNT, new BasicDBObject().append("_id", aid));
            AccountBillTask.initBill(accDB,product,num400);
            bill = MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).findOne(
                    new BasicDBObject().append("_id", billID));
        }

        long giveMinuteProduct = Long.valueOf(String.valueOf(bill.get("presentMinute") == null ? "0" : bill.get("presentMinute")));
        // 检查低消还有没有余额，有的话扣除，没有的话扣账户余额
        long balance = Double.valueOf(String.valueOf(bill.get("balance"))).longValue();
        long minConsume = Double.valueOf(String.valueOf(bill.get("minConsume"))).longValue();
        String countMinutes = fee.isLocal?"localMinutes":"remoteMinutes";
        String countSecond6 = fee.isLocal?"localSecond6":"remoteSecond6";

        if("cc".equals(product) && minConsume>0 && giveMinuteProduct>0 ){//呼叫中心设低消后按赠送分钟数去扣,扣完再扣余额
            if(fee.isIntl()){//设置了分钟数套餐的情况下，国际长途直接扣账号余额独立结算
//                MongoProvider
//                        .update("platform_account", new BasicDBObject().append(
//                                "_id", aid), new BasicDBObject().append(
//                                "$inc",
//                                new BasicDBObject().append("balance", -fee.getFee())));
                AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(aid, -fee.getFee());

                //发送消费事件
                EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_CALL,aid)
                        .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                        .addBusinessItem(EventBusinessField.CHARGE_MONEY,fee.getFee()));
                //累计消费
                AccountService.incrConsume(aid,fee.getFee());


                MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                        new BasicDBObject().append("_id", billID),
                        new BasicDBObject().append("$inc", new BasicDBObject()
                                .append("calls", 1)
                                .append("intlConsume", fee.getFee())
                                .append("discount", fee.getDiscount())
                                .append(countMinutes, fee.getMinutes())
                                .append(countSecond6, fee.getSeconds6())));

                // 如果是扣除财务账户的钱，则给账单绑定财务账户
                if (consumeRes.hasConsumeFinanceAccount) {
                    MongoConnect.getInstance().getDB("bill_data")
                            .getCollection(BillMaster.DB_CALL_CONSUME)
                            .update(
                                new BasicDBObject().append("_id", billID),
                                new BasicDBObject()
                                        .append("$set", new BasicDBObject()
                                        .append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString()))
                            );
                }
            } else{
                long giveMinute = Long.valueOf(String.valueOf(bill.get("giveMinute")==null?"0":bill.get("giveMinute")));
                long minutes=fee.getMinutes();
                long seconds6=fee.getSeconds6();
                long dialPrice= minConsume/giveMinuteProduct;//套餐内单价

                if (giveMinute - minutes >= 0) {
                    //根据分钟数折算费用
                    long _fee=dialPrice*minutes;//当前通话费用
                    fee.setFee(_fee);
                    callObject.put("consume", _fee);
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                            new BasicDBObject().append("_id", billID),
                            new BasicDBObject().append("$inc",
                                    new BasicDBObject().append("giveMinute", -minutes)
                                            .append("calls", 1)
                                            .append("actualConsume", fee.getFee())
                                            .append("discount", fee.getDiscount())
                                            .append(countMinutes, fee.getMinutes())
                                            .append(countSecond6, fee.getSeconds6())));
                }else if (giveMinute > 0) {
                    long leaveMinutes=minutes-giveMinute;
                    long _fee=dialPrice*giveMinute;
                    long _seconds=Long.valueOf(String.valueOf(callObject.get("seconds")))-(giveMinute*60);
                    long _seconds6 = new Double(Math.ceil(_seconds / 6.0)).longValue();
                    long _minutes = leaveMinutes;
                    //重设按资费计费的时长
                    callObject.put("seconds6", _seconds6);
                    callObject.put("minutes", _minutes);
                    FeeObject feeNew = countFee(productDB, callObject, product);
                    long _consume = feeNew.getFee() +_fee;
                    fee.setFee(_consume);
                    callObject.put("consume", _consume);

                    callObject.put("seconds6", seconds6);
                    callObject.put("minutes", minutes);
                    // 扣话单
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                            new BasicDBObject().append("_id", billID),
                            new BasicDBObject().append("$inc",
                                    new BasicDBObject().append("giveMinute", -giveMinute)
                                            .append("calls", 1)
                                            .append("actualConsume", fee.getFee())
                                            .append("discount", fee.getDiscount())
                                            .append(countMinutes, fee.getMinutes())
                                            .append(countSecond6, fee.getSeconds6())));
                    //扣账号余额
                    // MongoProvider.update("platform_account", new BasicDBObject()
                    //         .append("_id", aid), new BasicDBObject().append(
                    //         "$inc",new BasicDBObject().append("balance", -feeNew.getFee())));
                    AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(aid, -feeNew.getFee());
                    if (consumeRes.hasConsumeFinanceAccount) {
                        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                                new BasicDBObject().append("_id", billID),
                                new BasicDBObject().append("$set",
                                        new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())
                                                ));
                    }

                    //发送消费事件
                    EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_CALL,aid)
                            .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                            .addBusinessItem(EventBusinessField.CHARGE_MONEY,feeNew.getFee()));
                    //累计消费
                    AccountService.incrConsume(aid,feeNew.getFee());
                }else{
                    //扣账号余额
                    // MongoProvider.update("platform_account", new BasicDBObject()
                    //         .append("_id", aid), new BasicDBObject().append(
                    //         "$inc",new BasicDBObject().append("balance", -fee.getFee())));
                    AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(aid, -fee.getFee());
                    if (consumeRes.hasConsumeFinanceAccount) {
                        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                                new BasicDBObject().append("_id", billID),
                                new BasicDBObject().append("$set",
                                        new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())
                                ));
                    }

                    //发送消费事件
                    EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_CALL,aid)
                            .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                            .addBusinessItem(EventBusinessField.CHARGE_MONEY,fee.getFee()));
                    //累计消费
                    AccountService.incrConsume(aid,fee.getFee());

                    // 更新话单实际消费
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                            new BasicDBObject().append("_id", billID),
                            new BasicDBObject().append("$inc", new BasicDBObject()
                                    .append("calls", 1)
                                    .append("actualConsume", fee.getFee())
                                    .append("discount", fee.getDiscount())
                                    .append(countMinutes, fee.getMinutes())
                                    .append(countSecond6, fee.getSeconds6())));
                }
            }
        }else{
            // 余额够本次扣费(注意这里是低销余额)
            if (balance - fee.getFee() >= 0) {
                MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                        new BasicDBObject().append("_id", billID),
                        new BasicDBObject().append("$inc",
                                new BasicDBObject().append("balance", -fee.getFee())
                                        .append("calls", 1)
                                        .append("actualConsume", fee.getFee())
                                        .append("discount", fee.getDiscount())
                                        .append(countMinutes, fee.getMinutes())
                                        .append(countSecond6, fee.getSeconds6())));
            }
            // 余额不够本次扣费，将余额扣到0，剩余部分扣账户
            else if (balance > 0) {
                long consume1 = fee.getFee() - balance;
                // 扣话单
                MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                        new BasicDBObject().append("_id", billID),
                        new BasicDBObject().append("$inc",
                                new BasicDBObject().append("balance", -balance)
                                        .append("calls", 1)
                                        .append("actualConsume", fee.getFee())
                                        .append("discount", fee.getDiscount())
                                        .append(countMinutes, fee.getMinutes())
                                        .append(countSecond6, fee.getSeconds6())));
                // 扣账户
                // MongoProvider
                //         .update("platform_account", new BasicDBObject().append(
                //                 "_id", aid), new BasicDBObject().append(
                //                 "$inc",
                //                 new BasicDBObject().append("balance", -consume1)));
                AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(aid, -consume1);
                if (consumeRes.hasConsumeFinanceAccount) {
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                            new BasicDBObject().append("_id", billID),
                            new BasicDBObject().append("$set",
                                    new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())
                            ));
                }


                //发送消费事件
                EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_CALL,aid)
                        .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                        .addBusinessItem(EventBusinessField.CHARGE_MONEY,consume1));
                //累计消费
                AccountService.incrConsume(aid,consume1);

//                if(isAccFee){
//                }else{
//                    MongoProvider.update(accountCollection, new BasicDBObject()
//                            .append("_id", billProductID), new BasicDBObject().append(
//                            "$inc",
//                            new BasicDBObject().append("balance", -consume1)));
//                }
            }
            // 余额为0，扣账户
            else {
                // 扣账户
                // MongoProvider
                //         .update("platform_account", new BasicDBObject().append(
                //                 "_id", aid), new BasicDBObject().append(
                //                 "$inc",
                //                 new BasicDBObject().append("balance", -fee.getFee())));
                AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(aid, -fee.getFee());
                if (consumeRes.hasConsumeFinanceAccount) {
                    MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                            new BasicDBObject().append("_id", billID),
                            new BasicDBObject().append("$set",
                                    new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())
                            ));
                }

                //发送消费事件
                EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_CALL,aid)
                        .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                        .addBusinessItem(EventBusinessField.CHARGE_MONEY,fee.getFee()));
                //累计消费
                AccountService.incrConsume(aid,fee.getFee());


                // 更新话单实际消费
                MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                        new BasicDBObject().append("_id", billID),
                        new BasicDBObject().append("$inc", new BasicDBObject()
                                .append("calls", 1)
                                .append("actualConsume", fee.getFee())
                                .append("discount", fee.getDiscount())
                                .append(countMinutes, fee.getMinutes())
                                .append(countSecond6, fee.getSeconds6())));
            }
        }

        DBObject account = MongoProvider.findOne(BillMaster.DB_ACCOUNT,new BasicDBObject().append("_id", accountID));
        long overdraw=account.get("overdraw")==null?0l:Double.valueOf(String.valueOf(account.get("overdraw"))).longValue();

        //检查话费余额，禁止外呼
//		DBObject res =  MongoProvider.findOne(accountCollection, new BasicDBObject().append("_id", billProductID),
//				new BasicDBObject("notifyNum",1).append("balance", 1));


        long balance1 = Double.valueOf(String.valueOf(account.get("balance"))).longValue()+overdraw;
        //禁止外呼
        String detail = "";
        String _product = product;
        if(product.contains("_")){
            String[] a = product.split("_");
            _product = a[0];
            detail = a[1];
        }
        if(balance1 < 0) {
            MongoProvider.insert("bill_notify", new BasicDBObject()
                    .append("type", "callOver")
                    .append("account", accountID)
                    .append("isProxy", false)
                    .append("product", _product)
                    .append("detail", detail));
        }
        //预警
        AccountBillTask.dialAlert(account,balance1);

//        long duration = System.currentTimeMillis() - time;
//        String msg = String.format("%s消耗时间[%d ms]", "call fee", duration);
//        log.info(msg);
        //给代理返钱

        SystemUser proxy = AccountService.getProxy(aid);
        String proxyID = proxy==null ? null : proxy.getId();
        if (proxyID != null) {
            callObject.put("proxy", proxyID);
            if(product.equals("400")) {
                chargeProxy400Fee(proxyID, num400, fee, callObject);
            } else {
                chargeProxyFee(proxyID, fee, callObject);
            }
        }
//        duration = System.currentTimeMillis() - time;
//        msg = String.format("%s消耗时间[%d ms]", "proxy fee", duration);
//        log.info(msg);
        //计算线路成本
        if(product.equals("zj")||product.equals("cc")){
            try {
                chargeLineFee(fee,callObject,product);
            } catch (Exception e) {
                e.printStackTrace();
                MongoConnect.getInstance().getDB("bill_data").getCollection("bill_line_error").insert(callObject);
            }
        }
//        long duration = System.currentTimeMillis() - time;
//        String msg = String.format("%s消耗时间[%d ms]", "charge fee", duration);
//        log.log(Level.INFO,msg);
    }
    private FeeObject countFee(DBObject account, DBObject callObject, String type) {
        FeeObject feeObject = new FeeObject();
        long fee = 0;
        long minutes = Long.valueOf(String.valueOf(callObject.get("minutes")));
        long seconds6 = Long.valueOf(String.valueOf(callObject.get("seconds6")));
        feeObject.setMinutes(minutes);
        feeObject.setSeconds6(seconds6);
        String calleeDistrictNo = String.valueOf(callObject.get("calleeDistrictNo"));
        String callerDistrictNo = String.valueOf(callObject.get("callerDistrictNo"));
        feeObject.setLocal(callerDistrictNo.equals(calleeDistrictNo));
        String strategyType = "dialFeeStrategy";
        String feeType = "dialFee";
        if(type.equals("400")) {
            strategyType = "dial400FeeStrategy";
            feeType = "dial400Fee";
        } else if (type.equals("transfer")) {
            strategyType = "transferFeeStrategy";
            feeType = "transferFee";
            if(!account.containsField("transferFeeStrategy")) {
                strategyType = "dialFeeStrategy";
                feeType = "dialFee";
            }
        }

        String did = (String)callObject.get("did");
        if(did.startsWith("400")) {
            feeObject.setLocal(true);
        }
        feeObject.setPhone(Utils.isMobileNo(did));
        String strategy="";
        long discount=0l;
//        if(did.startsWith("01017991")){//for test
        if(did.startsWith("00")) {//国际长途
            feeObject.setIntl(true);
            Product.IntlFee intlFee = ProductService.getIntlFeeByNumber(did,(String)account.get("_id"));
            //DBObject internationalFee = (DBObject) account.get("internationalFee");
            //if (InternationalStrategy_tietong.equals(strategy)) {
            strategy = "international";
            if(intlFee != null){
//                long fee1 = Long.valueOf(String.valueOf(internationalFee.get("fee1")));
//                long fee2 = Long.valueOf(String.valueOf(internationalFee.get("fee2")));
//                long fee3 = Long.valueOf(String.valueOf(internationalFee.get("fee3")));
                String intlArea = "";
                String intlNo = "";
//                if (did.startsWith("00852") || did.startsWith("00853") || did.startsWith("00886")) {
//                    fee = minutes * fee1;
//                    intlArea = "港/澳/台";
//                    intlNo = did.substring(0, 5);
//                } else if (did.startsWith("001")) {
//                    fee = minutes * fee2;
//                    intlArea = "美国/加拿大";
//                    intlNo = "001";
//                } else {
//                    fee = minutes * fee3;
//                    intlArea = "其他国家";
//                    intlNo = "other";
//                }

                fee = minutes * intlFee.getPrice();
                Intl intl = IntlService.getByNumberAndLine(did,(String)callObject.get("line"));
                if(intl != null){
                    intlArea = intl.getDest();
                    intlNo = intl.getCode();
                }

                callObject.put("calleeProvince", intlArea);
                callObject.put("calleeCity", "");
                callObject.put("calleeDistrictNo", intlNo);
                feeObject.setLocal(false);
            } else {
                log.warning("不被允许的国际长途 [productId : " + account.get("_id")+"]");
            }
        }else if(did.startsWith("800")){
            feeObject.set800(true);
            feeObject.setDiscount(0);
            fee=0l;
        }else{
            strategy = String.valueOf(account.get(strategyType));
            DBObject dialFee = (DBObject) account.get(feeType);
            discount=account.get("discount")==null?0l:Long.valueOf(String.valueOf(account.get("discount")));
            discount=discount*minutes;
            feeObject.setDiscount(discount);
            if (strategy.equals(STRATEGY_MINUTE)) {
                long remotePrice = Long.valueOf(String.valueOf(dialFee.get("remote")));
                long localPrice = Long.valueOf(String.valueOf(dialFee.get("local")));
                if(type.equals("400")){
                    if (feeObject.isLocal) {// 市话
                        fee = localPrice * minutes;
                    }else {// 长途
                        fee = remotePrice * minutes;
                    }
                }else{
                    long remoteTelPrice = Long.valueOf(String.valueOf(dialFee.get("remoteTel")));
                    long localTelPrice = Long.valueOf(String.valueOf(dialFee.get("localTel")));
                    if (feeObject.isLocal) {// 市话
                        if(feeObject.isPhone){
                            fee = localPrice * minutes;
                        }else{
                            fee = localTelPrice * minutes;
                        }
                    }else {// 长途
                        if(feeObject.isPhone){
                            fee = remotePrice * minutes;
                        }else{
                            fee = remoteTelPrice * minutes;
                        }
                    }
                }
            } else if (strategy.equals(STRATEGY_MINUTE3)) {
                long remotePrice = Long.valueOf(String.valueOf(dialFee.get("remote")));
                long localPrice = Long.valueOf(String.valueOf(dialFee.get("local")));
                long prefixMin = Long.valueOf(String.valueOf(dialFee.get("prefixMin")));
                // 市话
                if (feeObject.isLocal) {
                    long after3m = minutes - 3;
                    if (after3m < 0) {
                        after3m = 0;
                    }
                    fee = prefixMin + after3m * localPrice;
                }
                // 长途
                else {
                    fee = remotePrice * minutes;
                }
            } else if (strategy.equals(STRATEGY_SECOND6)) {
                long remotePrice = Long.valueOf(String.valueOf(dialFee.get("remote")));
                long localPrice = Long.valueOf(String.valueOf(dialFee.get("local")));
                // 市话
                if (feeObject.isLocal) {
                    fee = localPrice * seconds6;
                }
                // 长途
                else {
                    fee = remotePrice * seconds6;
                }
            } else if (strategy.equals(STRATEGY_MINUTE3_S6)) {
                long remotePrice = Long.valueOf(String.valueOf(dialFee.get("remote")));
                long localPrice = Long.valueOf(String.valueOf(dialFee.get("local")));
                long prefixMin = Long.valueOf(String.valueOf(dialFee.get("prefixMin")));
                // 市话
                if (feeObject.isLocal) {
                    long after3m = minutes - 3;
                    if (after3m < 0) {
                        after3m = 0;
                    }
                    fee = prefixMin + after3m * localPrice;
                }
                // 长途
                else {
                    fee = remotePrice * seconds6;
                }
            }
        }
        feeObject.setStrategy(strategy);
        feeObject.setFee(fee);
        callObject.put("isLocal", feeObject.isLocal);
        callObject.put("isIntl", feeObject.isIntl());
        callObject.put("feeStrategy", strategy);
        callObject.put("consume", fee);
        callObject.put("discount", discount);
        return feeObject;
    }

    private void chargeProxyFee(String proxyID, FeeObject fee, DBObject callObject) {
        String currentDate = Utils.getDate("yyyy-MM-dd");
        String billID = proxyID + "_" + currentDate;
        DBObject bill = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_CALL_INCOME).findOne(new BasicDBObject().append("_id", billID));
        //如果找不到代理的话单，则生成当天话单
        if(bill == null) {
            createProxyBill(proxyID, currentDate);
        }

        DBObject account = MongoConnect.getInstance().getDB("bill")
                .getCollection(PROXY_COLLECTION).findOne(new BasicDBObject().append("_id", proxyID));

        //找到线路资费
        String lineId = (String)callObject.get("line");
        ProxyLineFee lineFee = ProxyLineFeeService.getFee(proxyID,lineId);

        String countMinutes = "localPhoneMinutes";
        long consume = 0l;
        int percent = lineFee.getDialPercent();//Integer.valueOf(String.valueOf(account.get("dialPercent")));

        if(fee.isIntl()) {
            countMinutes = "intlMinutes";
            percent = lineFee.getIntlPercent(); //Integer.valueOf(String.valueOf(account.get("intlPercent")));
            //String did = (String) callObject.get("did");
            //DBObject internationalFee = (DBObject) account.get("internationalFee");
            //long fee1 = lineFee.getIntlFee1();//Long.valueOf(String.valueOf(internationalFee.get("fee1")));
            //long fee2 = lineFee.getIntlFee2();//Long.valueOf(String.valueOf(internationalFee.get("fee2")));
            //long fee3 = lineFee.getIntlFee3();//Long.valueOf(String.valueOf(internationalFee.get("fee3")));
//            if (did.startsWith("00852") || did.startsWith("00853") || did.startsWith("00886")) {
//                consume = fee.getFee() - fee.getMinutes() * fee1;
//            } else if (did.startsWith("001")) {
//                consume = fee.getFee() - fee.getMinutes() * fee2;
//            } else {
//                consume = fee.getFee() - fee.getMinutes() * fee3;
//            }
            consume = fee.getFee();// - fee.getMinutes() * lineFee.getIntlFee(did);
        }else if(fee.is800){
            consume=0l;
        }else{
            if(fee.isLocal) {
                //本地手机
                if(fee.isPhone) {
                    //DBObject dialFee = (DBObject) account.get("dialFee");
                    long price = lineFee.getLocal();//Long.valueOf(String.valueOf(dialFee.get("local")));
                    consume = fee.getFee() - fee.getMinutes()*price;
                }
                //本地固话
                else {
                    countMinutes = "localTelMinutes";
                    //DBObject dialFee = (DBObject) account.get("dialFee");
                    long price = lineFee.getLocalTel();//Long.valueOf(String.valueOf(dialFee.get("localTel")));
                    consume = fee.getFee() - fee.getMinutes()*price;
                }
            } else {
                //外地手机
                if(fee.isPhone) {
                    countMinutes = "remotePhoneMinutes";
                    //DBObject dialFee = (DBObject) account.get("dialFee");
                    long price = lineFee.getRemote();//Long.valueOf(String.valueOf(dialFee.get("remote")));
                    consume = fee.getFee() - fee.getMinutes()*price;
                }
                //外地固话
                else {
                    countMinutes = "remoteTelMinutes";
                    //DBObject dialFee = (DBObject) account.get("dialFee");
                    long price = lineFee.getRemoteTel();//Long.valueOf(String.valueOf(dialFee.get("remoteTel")));
                    consume = fee.getFee() - fee.getMinutes()*price;
                }
            }
        }

        long discount=fee.getDiscount();
        if(discount>0){
            consume=consume-discount;
        }
        consume = consume*percent/100;
        consume=consume+discount;//折扣结算给代理
        MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_INCOME).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc",
                        new BasicDBObject().append("income", consume)
                                .append("calls", 1)
                                .append("discount", discount)
                                .append(countMinutes, fee.getMinutes())
                ));
        callObject.put("income", consume);
        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_PROXY_DETAIL).insert(callObject);
        callObject.removeField("proxy");
    }

    private void chargeProxy400Fee(String proxyID, String num400, FeeObject fee, DBObject callObject) {
        String currentDate = Utils.getDate("yyyy-MM-dd");
        String billID = proxyID+ "_" + num400 + "_" + currentDate;
        //找当天代理的400话单
        DBObject bill = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_400_INCOME).findOne(new BasicDBObject().append("_id", billID));
        //如果找不到代理的话单，则生成当天话单
        if(bill == null) {
            createProxy400Bill(proxyID, num400, currentDate);
        }

        DBObject account = MongoConnect.getInstance().getDB("bill")
                .getCollection(PROXY_COLLECTION).findOne(new BasicDBObject().append("_id", proxyID));

        //找到线路资费
        String lineId = (String)callObject.get("line");
        ProxyLineFee lineFee = ProxyLineFeeService.getFee(proxyID,lineId);

        String countMinutes = "localMinutes";
        long consume = 0l;
        int percent = lineFee.getNum400Percent();//Integer.valueOf(String.valueOf(account.get("num400Percent")));
        //DBObject dialFee = (DBObject) account.get("dial400Fee");
        if(fee.isLocal) {
            //本地呼入
            long price = lineFee.getNum400Local();//Long.valueOf(String.valueOf(dialFee.get("local")));
            consume = fee.getFee() - fee.getMinutes()*price;
        } else {
            //外地呼入
            countMinutes = "remoteMinutes";
            long price = lineFee.getNum400Remote();//Long.valueOf(String.valueOf(dialFee.get("remote")));
            consume = fee.getFee() - fee.getMinutes()*price;
        }
        long discount=fee.getDiscount();
        if(discount>0){
            consume=consume-discount;
        }
        consume = consume*percent/100;
        consume=consume+discount;//折扣结算给代理
        MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_400_INCOME).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc",
                        new BasicDBObject().append("income", consume)
                                .append("calls", 1)
                                .append("discount", discount)
                                .append(countMinutes, fee.getMinutes())
                ));
        callObject.put("income", consume);
        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_DETAIL).insert(callObject);
        callObject.removeField("proxy");
        callObject.removeField("income");

        try{
            String callEventUrl = String.valueOf(account.get("callEventUrl")==null?"":account.get("callEventUrl"));
            callEventUrl=callEventUrl.trim().toLowerCase();
            if(!"".equals(callEventUrl) && callEventUrl.startsWith("http")){
                createProxyCallEvent(proxyID,callEventUrl,callObject);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void createProxyBill(String proxyID,
                                       String currentDate) {
        DBObject bill = new BasicDBObject();
        String billID = proxyID + "_" + currentDate;
        bill.put("_id", billID);
        bill.put("account", proxyID);
        bill.put("year", Utils.getDate("yyyy"));
        bill.put("month", Utils.getDate("MM"));
        bill.put("dd", Utils.getDate("dd"));
        bill.put("date", currentDate);
        bill.put("calls", 0);
        bill.put("localPhoneMinutes", 0l);
        bill.put("remotePhoneMinutes", 0l);
        bill.put("localTelMinutes", 0l);
        bill.put("remoteTelMinutes", 0l);
        bill.put("intlMinutes", 0l);
        bill.put("income", 0l);
        bill.put("discount", 0l);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_INCOME).insert(bill);
    }

    public static void createProxy400Bill(String proxyID, String num400,
                                          String currentDate) {
        DBObject bill = new BasicDBObject();
        String billID = proxyID +"_"+ num400 + "_" + currentDate;
        bill.put("_id", billID);
        bill.put("account", proxyID);
        bill.put("num400", num400);
        bill.put("year", Utils.getDate("yyyy"));
        bill.put("month", Utils.getDate("MM"));
        bill.put("dd", Utils.getDate("dd"));
        bill.put("date", currentDate);
        bill.put("calls", 0);
        bill.put("localMinutes", 0l);
        bill.put("remoteMinutes", 0l);
        bill.put("income", 0l);
        bill.put("discount", 0l);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_400_INCOME).insert(bill);
    }

    private void chargeLineFee(FeeObject fee, DBObject callObject,String product) {
        String lineID = String.valueOf(callObject.get("line")==null?"":callObject.get("line"));
        DBObject line = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_PLATFORM_LINE).findOne(new BasicDBObject().append("_id", lineID));
        if(line==null){//不是我们的线路
            //todo  insert error
//            MongoConnect.getInstance().getDB("bill_data").getCollection("bill_line_error").insert(callObject);
            return;
        }

        String currentDate = Utils.getDate("yyyy-MM-dd");
        String billID = lineID + "_" + currentDate;
        DBObject bill = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_CALL_LINE).findOne(new BasicDBObject().append("_id", billID));
        //如果找不到今天的话单，则生成当天话单
        if(bill == null) {
            createLineBill(lineID, currentDate);
        }
//        String dialFeeStrategy = (String) line.get("dialFeeStrategy");
//        String lineType = (String) line.get("type");
        DBObject dialFee = (DBObject) line.get("dialFee");
        long consume = 0l;
        long income = 0l;
        long minutes = fee.getMinutes();
        long seconds6 =fee.getSeconds6();
        long totalFee  =fee.getFee();
//        long proxyIncome = Long.valueOf(String.valueOf(callObject.get("income")==null?"0":callObject.get("income")));
        if(fee.isIntl()){    //&& Fields.lineType_international.equals(lineType)
            String code = (String)callObject.get("calleeDistrictNo");
            String did = (String)callObject.get("did");
            Intl intl = IntlService.getByLineAndCode(lineID,code);
            //TODO 用户中心统计了 美加 港澳台 其他 三地的国际长途时间和数量.统计数据展示 和 统计方法 需要修改.
            String countMinutes = "otherMinutes";
            String countCalls = "otherCalls";
            if(intl != null){
                consume = minutes * intl.getPriceWithTax();
            }
            income = totalFee - consume;

            MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_LINE).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc",
                            new BasicDBObject().append("cost", consume)
                                    .append("calls", 1)
                                    .append("earn", income)
                                    .append(countMinutes, minutes)
                                    .append(countCalls, 1)
                    ));
        }else if(fee.is800()){
            consume=0l;
            income=0l;
            String countMinutes = fee.isLocal?(fee.isPhone?"localPhoneMinutes":"localTelMinutes"):(fee.isPhone?"remotePhoneMinutes":"remoteTelMinutes");
            String countSecond6 = fee.isLocal?(fee.isPhone?"localPhoneSecond6":"localTelSecond6"):(fee.isPhone?"remotePhoneSecond6":"remoteTelSecond6");
            String countCalls = fee.isLocal?(fee.isPhone?"localPhoneCalls":"localTelCalls"):(fee.isPhone?"remotePhoneCalls":"remoteTelCalls");
            MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_LINE).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc",
                            new BasicDBObject().append("cost", consume)
                                    .append("calls", 1)
                                    .append("earn", income)
                                    .append(countMinutes, minutes)
                                    .append(countSecond6, seconds6)
                                    .append(countCalls, 1)
                    ));
        }else{
            String countMinutes = fee.isLocal?(fee.isPhone?"localPhoneMinutes":"localTelMinutes"):(fee.isPhone?"remotePhoneMinutes":"remoteTelMinutes");
            String countSecond6 = fee.isLocal?(fee.isPhone?"localPhoneSecond6":"localTelSecond6"):(fee.isPhone?"remotePhoneSecond6":"remoteTelSecond6");
            String countCalls = fee.isLocal?(fee.isPhone?"localPhoneCalls":"localTelCalls"):(fee.isPhone?"remotePhoneCalls":"remoteTelCalls");
            if(fee.isLocal) {
                if(fee.isPhone) {//本地手机
                    String strategy = (String) dialFee.get("localStrategy");
                    long price = Long.valueOf(String.valueOf(dialFee.get("local")));
                    if(strategy.equals(STRATEGY_MINUTE)){
                        consume =  minutes*price;
                    }else if(strategy.equals(STRATEGY_MINUTE3)){
                        long prefix = Long.valueOf(String.valueOf(dialFee.get("localPrefix")));
                        long after3m = minutes - 3;
                        if (after3m < 0) {
                            after3m = 0;
                        }
                        consume = prefix + after3m * price;
                    }else if(strategy.equals(STRATEGY_SECOND6)){
                        consume =  seconds6*price;
                    }
                }else {//本地固话
                    String strategy = (String) dialFee.get("localTelStrategy");
                    long price = Long.valueOf(String.valueOf(dialFee.get("localTel")));
                    if(strategy.equals(STRATEGY_MINUTE)){
                        consume =  minutes*price;
                    }else if(strategy.equals(STRATEGY_MINUTE3)){
                        long prefix = Long.valueOf(String.valueOf(dialFee.get("localTelPrefix")));
                        long after3m = minutes - 3;
                        if (after3m < 0) {
                            after3m = 0;
                        }
                        consume = prefix + after3m * price;
                    }else if(strategy.equals(STRATEGY_SECOND6)){
                        consume =  seconds6*price;
                    }
                }
            } else {
                if(fee.isPhone) {//外地手机
                    String strategy = (String) dialFee.get("remoteStrategy");
                    long price = Long.valueOf(String.valueOf(dialFee.get("remote")));
                    if (strategy.equals(STRATEGY_MINUTE)) {
                        consume = minutes * price;
                    } else if (strategy.equals(STRATEGY_MINUTE3)) {
                        long prefix = Long.valueOf(String.valueOf(dialFee.get("remotePrefix")));
                        long after3m = minutes - 3;
                        if (after3m < 0) {
                            after3m = 0;
                        }
                        consume = prefix + after3m * price;
                    } else if (strategy.equals(STRATEGY_SECOND6)) {
                        consume = seconds6 * price;
                    }
                }else {//外地固话
                    String strategy = (String) dialFee.get("remoteTelStrategy");
                    long price = Long.valueOf(String.valueOf(dialFee.get("remoteTel")));
                    if(strategy.equals(STRATEGY_MINUTE)){
                        consume =  minutes*price;
                    }else if(strategy.equals(STRATEGY_MINUTE3)){
                        long prefix = Long.valueOf(String.valueOf(dialFee.get("remoteTelPrefix")));
                        long after3m = minutes - 3;
                        if (after3m < 0) {
                            after3m = 0;
                        }
                        consume = prefix + after3m * price;
                    }else if(strategy.equals(STRATEGY_SECOND6)){
                        consume =  seconds6*price;
                    }
                }
            }
            income = totalFee - consume;
            MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_LINE).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc",
                            new BasicDBObject().append("cost", consume)
                                    .append("calls", 1)
                                    .append("earn", income)
                                    .append(countMinutes, minutes)
                                    .append(countSecond6, seconds6)
                                    .append(countCalls, 1)
                    ));
        }

        //报表事件
        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_COST_CALL,"")
                .addBusinessItem(EventBusinessField.CHARGE_COST_PRODUCT,product)
                .addBusinessItem(EventBusinessField.CHARGE_COST_COST,consume)
                .addBusinessItem(EventBusinessField.CHARGE_COST_TOTALFEE,fee.getFee()));

        callObject.put("cost", consume);
        callObject.put("earn", income);
        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_LINE_DETAIL).insert(callObject);
        callObject.removeField("cost");
        callObject.removeField("earn");
    }
    public static void createLineBill(String lineId,String currentDate) {
        DBObject bill = new BasicDBObject();
        String billID = lineId + "_" + currentDate;
        bill.put("_id", billID);
        bill.put("line", lineId);
        bill.put("year", Utils.getDate("yyyy"));
        bill.put("month", Utils.getDate("MM"));
        bill.put("dd", Utils.getDate("dd"));
        bill.put("date", currentDate);
        bill.put("calls", 0);
        bill.put("localPhoneCalls", 0l);
        bill.put("remotePhoneCalls", 0l);
        bill.put("localTelCalls", 0l);
        bill.put("remoteTelCalls", 0l);

        bill.put("localPhoneMinutes", 0l);
        bill.put("remotePhoneMinutes", 0l);
        bill.put("localTelMinutes", 0l);
        bill.put("remoteTelMinutes", 0l);

        bill.put("localPhoneSecond6", 0l);
        bill.put("remotePhoneSecond6", 0l);
        bill.put("localTelSecond6", 0l);
        bill.put("remoteTelSecond6", 0l);
        bill.put("mjMinutes", 0l);
        bill.put("mjCalls", 0l);
        bill.put("gatMinutes", 0l);
        bill.put("gatCalls", 0l);
        bill.put("otherMinutes", 0l); //其他
        bill.put("otherCalls", 0l);

        bill.put("cost", 0l);
        bill.put("earn", 0l);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill").getCollection(BillMaster.DB_CALL_LINE).insert(bill);
    }
    public static void createProxyCallEvent(String proxyID,String url,DBObject callObject) {
        DBObject bill = new BasicDBObject();
        bill.put("_id", callObject.get("_id"));
        bill.put("cid", callObject.get("cid"));
        bill.put("did", callObject.get("did"));
        bill.put("beginTime", callObject.get("beginTimeDisplay"));
        bill.put("endTime", callObject.get("endTimeDisplay"));
        bill.put("callerProvince", callObject.get("callerProvince"));
        bill.put("callerCity", callObject.get("callerCity"));
        bill.put("callerDistrictNo", callObject.get("callerDistrictNo"));
        bill.put("account", callObject.get("account"));
        bill.put("proxy", proxyID);
        bill.put("url", url);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_400_PROXY_CALLEVENT).insert(bill);
    }

    public  void processCallItem(DBObject callObj){
        String accountID = String.valueOf(callObj.get("account"));
        String _beginTime = String.valueOf(callObj.get("beginTime"));
        String _endTime = String.valueOf(callObj.get("endTime"));
        String _line = (String)callObj.get("line");

        //zj|400|cc
        String product = String.valueOf(callObj.get("product"));
        //transfer|dialout
        String type = String.valueOf(callObj.get("type"));

        double beginTime = Double.parseDouble(_beginTime);
        double endTime = Double.parseDouble(_endTime);
        long millisecond = new Double(Math.ceil(endTime - beginTime)).longValue();
        long seconds = millisecond;
        long seconds6 = new Double(Math.ceil(seconds / 6.0)).longValue();
        long minutes = new Double(Math.ceil(seconds / 60.0)).longValue();
        callObj.put("seconds", seconds);
        callObj.put("seconds6", seconds6);
        callObj.put("minutes", minutes);

        EventReporter.emitOperationReportEvent(new EventData(EventType.COMPLETE_CALL,accountID)
                .addBusinessItem(EventBusinessField.COMPLETE_CALL_MILLISECONDS,new Double((endTime - beginTime)*1000).longValue())
                .addBusinessItem(EventBusinessField.COMPLETE_CALL_LINE,_line));
//                log.info("账号"+accountID+" start fee,product=="+product+",callId===="+pk);
//				计算账户应扣除的钱
        // 400呼入
        if (product.equals("400")) {
            String num400 = String.valueOf(callObj.get("did"));
            DBObject obj400 = MongoProvider.findOne(BillMaster.DB_400,new BasicDBObject().append("_id", num400));
            if(obj400 != null) {
                String product400 = String.valueOf(obj400.get("product"));
                FeeObject fee = countFee(obj400, callObj, product);
                if("zj".equals(product400)){
                    charge(accountID, product, num400, fee, callObj,true,obj400);
                }else{
                    charge(accountID, product, num400, fee, callObj,false,obj400);
                }
            } else {
                log.warning(accountID+"_"+num400+" not found!");
            }
        } else {
            String did = (String)callObj.get("did");
            DBObject prod = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,
                    new BasicDBObject().append("_id", accountID + "_" + product));
            if(prod != null) {
                FeeObject fee = countFee(prod, callObj, type);
                if("zj".equals(product)){
                    charge(accountID, product, "", fee, callObj,true,prod);
                }else{
                    charge(accountID, product, "", fee, callObj,false,prod);
                }
            } else {
                log.warning(accountID+"_"+product+" not found!");
            }


            //每日外呼统计
            String today = Utils.getDate("yyyy-MM-dd");
            DBObject updateDoc = new BasicDBObject();
            updateDoc.put("$inc", new BasicDBObject("callOut",1));
            MongoConnect.getInstance().getDB("bill").getCollection("web_site_cdr_count")
                    .update(new BasicDBObject("_id",today), updateDoc, true, false);

            log.log(Level.INFO,"call type=................... "+type);
            if(!type.equals("transfer")){
                //zhPbxStr=getAllZhPbx();
                //ptPbxStr=getPlatformPbx();
                checkedCallSum(did,accountID);
            }
//            int num=RedisUtil.getTelDialStat(did);
//            if(num>=5){
//                MongoProvider.insert("bill_notify", new BasicDBObject()
//                        .append("type", "telDialCountAlert")
//                        .append("account", accountID)
//                        .append("num",num));
//            }
        }
        callObj.removeField("income");
        MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_query_"+product).insert(callObj);
        MongoConnect.getInstance().getDB("bill_data").getCollection(BILL_CDR).remove(
                new BasicDBObject().append("_id", callObj.get("_id")), WriteConcern.SAFE);

    }

    private class FeeObject {
        boolean isLocal = true;
        boolean isPhone = true;
        boolean isIntl = false;
        boolean is800 = false;
        String strategy = "minute";
        long fee = 0l;
        long minutes;
        long seconds6 = 0l;
        long discount=0l;
        public boolean isLocal() {
            return isLocal;
        }
        public void setLocal(boolean isLocal) {
            this.isLocal = isLocal;
        }
        public long getFee() {
            return fee;
        }
        public void setFee(long fee) {
            this.fee = fee;
        }
        public long getMinutes() {
            return minutes;
        }
        public void setMinutes(long minutes) {
            this.minutes = minutes;
        }
        public String getStrategy() {
            return strategy;
        }
        public void setStrategy(String strategy) {
            this.strategy = strategy;
        }
        public long getSeconds6() {
            return seconds6;
        }
        public void setSeconds6(long seconds6) {
            this.seconds6 = seconds6;
        }
        public boolean isPhone() {
            return isPhone;
        }
        public void setPhone(boolean isPhone) {
            this.isPhone = isPhone;
        }

        public boolean isIntl() {
            return isIntl;
        }

        public void setIntl(boolean isIntl) {
            this.isIntl = isIntl;
        }

        public long getDiscount() {
            return discount;
        }
        public void setDiscount(long discount) {
            this.discount = discount;
        }

        public boolean is800() {
            return is800;
        }

        public void set800(boolean is800) {
            this.is800 = is800;
        }
    }

    private class ChargeTask implements Runnable {
        private DBObject callObj;
        private Thread billThread;
        public ChargeTask(DBObject callObj,Thread t){
            this.callObj=callObj;
            this.billThread=t;
        }
        @Override
        public void run() {
            try{
                processCallItem(callObj);
                int size=executor.getQueue().size();
//            log.log(Level.INFO,"pool wait queue size===== "+size);
                synchronized (billThread){
                    if(size<queueNum){
                        billThread.notify();
                    }
                }
            }catch(Exception e){
                MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_error").insert(callObj);
                log.log(Level.WARNING, "error occur while charging cdr.callObj. account:"+callObj.get("account"), e);
            }

        }
    }

    /**
     * 获取单个账户拨打次数
     * @param accountID
     * @return
     */
    public static List<DBObject> getZhFeildDbById(String accountID){
        DBObject condition = new BasicDBObject().append("_id", accountID);
        List<DBObject> zhOneList = MongoProvider.find("bill","platform_account",condition);
        return zhOneList;
    }


    /**
     * 拨号计数(平台、账户)
     * @param did
     * @param accountID
     */
    public static void checkedCallSum(String did,String accountID){

        //根据account_id查询该账户是否设置拨号次数
        List<DBObject> zhListById=getZhFeildDbById(accountID);
        if(zhListById.get(0).get("callSum")!=null&&Integer.parseInt(zhListById.get(0).get("callSum").toString())>0){
            //账号拨打次数
            int zhListCount=Integer.parseInt(zhListById.get(0).get("callSum").toString());
            log.log(Level.WARNING,"zhListCount="+zhListCount);
            //reids 计数次数
            int zh_sum= RedisUtil.CallSum(did,"zh_",accountID+"_");
            log.log(Level.WARNING,"redisZhSum="+zh_sum);
            if(zh_sum==zhListCount){
                log.log(Level.WARNING,"maxSumOver");
                sendToPbx(accountID, did, "account",zhListById);
            }
        }/*else{
            //平台拨号次数限制
            //reids 计数次数
            log.log(Level.WARNING,"redis before  pingtaibohaojishu  accountID===="+accountID);
            int pt_sum= RedisUtil.CallSum(did,"pt_","");
            log.log(Level.WARNING,"redis pt_sum===="+pt_sum+"accountID="+accountID+"did=="+did+"type==pingtai");
            //System.out.println("pt_sum="+pt_sum);
            //默认设置每个号码只能拨打5次(设置平台拨号次数)
            if(pt_sum>=dialCountPt){
                // System.out.println("send message to pbx.. 超出平台拨打次数限制");
                sendToPbx(accountID, did, "pingtai",zhListById);
            }

        }*/


    }

    /**
     * 通知pbx
     * @param accountID
     * @param CallNumber
     * @param type
     * @param zhListById
     */
    public static void sendToPbx(String accountID,String CallNumber,String type, List<DBObject> zhListById){
        try {
            //账户拨号
            if(type.equals("account")){
                String  singleAccountData = "{\"Command\":\"Action\"," +
                        "\"Action\":\"NumCallToManyLimit\"," +
                        "\"ActionID\":\""+Utils.getUniqueid()+"\"," +
                        "\"accounts\":" +
                        "[{" +
                        "\"account\":\""+accountID+"\"," +
                        "\"on-off\":\"off\"" +
                        "}]," +
                        "\"CallNumber\":\""+CallNumber+"\"" +
                        "}\r\n";//限制账号接口
                String pbxStr=getPbxByAccountId(accountID);
                for(String pbxAddr:pbxStr.split(",")){
                    //通知单个账户的所属pbx
                    log.log(Level.WARNING," to pbx singleAccountData  post ====="+singleAccountData);
                    String result= HttpProvider.sendPost(pbxAddr, singleAccountData);
                    JSONObject obj = JSONObject.fromObject(result);
                    if(obj.get("Succeed").toString().equals("false")){
                        log.log(Level.WARNING,"httpSendPost failed="+result+" pbxAddr="+pbxAddr);
                    }
                }
            }/*else{
                log.log(Level.WARNING,"pingtaibohaojishu  to pbx......");
                //通知平台所有pbx
                for(int j=0;j<ptPbxStr.split(",").length;j++){
                    String pbx_addr=ptPbxStr.split(",")[j];
                    String on_off="off";
                    //平台拨号
                    String  pt_data = "{\"Command\":\"Action\"," +
                            "\"Action\":\"NumCallToManyLimit\"," +
                            "\"ActionID\":\""+Utils.getUniqueid()+"\"," +
                            "\"CallNumber\":\""+CallNumber+"\"," +
                            "\"on-off\":\""+on_off+"\"" +
                            "}\r\n";//账号
                    pbx_addr="http://120.55.72.213:7789";
                    log.log(Level.WARNING,"pingtaibohaojishu  to pbx pt_data  post ====="+pt_data);
                    String result= HttpProvider.sendPost(pbx_addr, pt_data);
                    log.log(Level.WARNING,"pt  1262 http_sendPost="+result);
                }
                log.log(Level.WARNING,"zhPbxStr====="+zhPbxStr);
                for(int i=0;i<zhPbxStr.get("pbxArr").toString().split(",").length;i++){
                    String pbx_addr=zhPbxStr.get("pbxArr").toString().split(",")[i];
                    String query_accountId=zhPbxStr.get("pbxAccountId").toString().split(",")[i];
                    //获取redis 计数
                    int value=RedisUtil.getCallCountByKey(CallNumber, "zh_", query_accountId+"_");

                    //根据accountId 获取改账号的最大拨打次数
                    List<DBObject> zhList=getZhFeildDbById(query_accountId);
                    int callSum=Integer.parseInt(zhList.get(0).get("callSum").toString());
                    String on_off="";

                    if(value>=callSum){
                        on_off="off";
                    }else{
                        on_off="on";
                    }

                    //账户拨号
                    String  zh_data = "{\"Command\":\"Action\"," +
                            "\"Action\":\"NumCallToManyLimit\"," +
                            "\"ActionID\":\""+Utils.getUniqueid()+"\"," +
                            "\"accounts\":" +
                            "[{" +
                            "\"account\":\""+query_accountId+"\"," +
                            "\"on-off\":\""+on_off+"\"" +
                            "}]," +
                            "\"CallNumber\":\""+CallNumber+"\"" +
                            "}\r\n";//限制账号接口

                    pbx_addr="http://120.55.72.213:7789";
                    log.log(Level.WARNING,"pingtaibohaojishu  to pbx zh_data  post ====="+zh_data);
                    String result= HttpProvider.sendPost(pbx_addr, zh_data);
                    log.log(Level.WARNING,"all zh 1298 http_sendPost="+result);
                }

            }*/

        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            log.log(Level.WARNING,"sendToPbx exception,please checed pbx address",e);
        }
    }


    /**
     * 获取所有账户pbx
     */
    public static Map<String,Object> getAllZhPbx(){
        String pbxArr="";
        String pbxAccountId="";
        Map<String,Object> zhPbxMap=new HashMap<String, Object>();
        try {
            DBObject acc_condition = new BasicDBObject("callSum",new BasicDBObject("$gt" , 0 ));
            List<String> zh_list=new ArrayList<String>();
            List<DBObject> acc_list = MongoProvider.find("bill","platform_account",acc_condition);
            for(int i=0; i<acc_list.size();i++){
                String id=acc_list.get(i).get("_id").toString();
                zh_list.add(id);
            }
            //查出所有设置拨号次数账号的
            //db.getCollection('platform_account_product').find({"pbx" : {"$exists":true},"product" : "cc","account":{"$in":["N00000000092","N00000000143"]}})
            //根据accountId 查询 product 为cc 的pbx数组
            DBObject condition = new BasicDBObject("pbx",  new BasicDBObject("$exists",true)).append("product","cc").append("account",new BasicDBObject("$in",zh_list));
            List<DBObject> productListObj = MongoProvider.find("bill","platform_account_product",condition);
            for(DBObject pbxList:productListObj ){

                String pbxListArr=pbxList.get("pbx").toString();
                String[] arr=pbxListArr.split("} ,");
                for(String pbxValue:arr){
                    pbxValue=pbxValue+"}]";
                    JSONObject obj = JSONObject.fromObject(pbxValue.substring(pbxListArr.indexOf("[")+1,pbxValue.lastIndexOf("]")));

                    //根据PBXid 在platform_cc_pbx表中获取 pbx ip地址 configAddr
                    DBObject pbx_condition = new BasicDBObject().append("_id",obj.get("PBX").toString());
                    List<DBObject> pbxListObj = MongoProvider.find("bill","platform_cc_pbx",pbx_condition);
                    //获取 PBX中的 PBXID
                    for(DBObject pbxAddress :pbxListObj){
                        String id=obj.get("AccountId").toString();
                        String configAddr= pbxAddress.get("configAddr").toString();
                        pbxArr+=configAddr+",";
                        pbxAccountId+=id+",";

                    }
                }
            }
            pbxArr=pbxArr.substring(0,pbxArr.lastIndexOf(","));
            pbxAccountId=pbxAccountId.substring(0,pbxAccountId.lastIndexOf(","));
            zhPbxMap.put("pbxArr", pbxArr);
            zhPbxMap.put("pbxAccountId", pbxAccountId);
            log.log(Level.WARNING," all pbx configAddr="+pbxArr);
        } catch (Exception e) {
            // TODO: handle exception
            log.log(Level.WARNING," getAllPbx exception",e);
        }
        return zhPbxMap;
    }

    /**
     * 根据accountId获取pbx地址
     * @param accountId
     * @return
     */
    public static String getPbxByAccountId(String accountId){
        String pbxArr="";
        try {
            //根据accountid和 product 获取当前pbx
            DBObject productCondition = new BasicDBObject().append("account", accountId).append("product", "cc");
            List<DBObject> productListObj = MongoProvider.find("bill","platform_account_product",productCondition);
            List<String> pbx_list=new ArrayList<String>();
            String pbxListArr=productListObj.get(0).get("pbx").toString();
            String[] arr=pbxListArr.split("} ,");

            for(String pbxValue:arr){
                pbxValue=pbxValue+"}]";
                JSONObject obj = JSONObject.fromObject(pbxValue.substring(pbxListArr.indexOf("[")+1,pbxValue.lastIndexOf("]")));
                pbx_list.add(obj.get("PBX").toString());
            }

            DBObject pbxCondition = new BasicDBObject().append("_id", new BasicDBObject("$in",pbx_list));
            List<DBObject> pbxListObj = MongoProvider.find("bill","platform_cc_pbx",pbxCondition);
            for(DBObject pbxList :pbxListObj){
                String configAddr= pbxList.get("configAddr").toString();
                pbxArr+=configAddr+",";
            }
            pbxArr=pbxArr.substring(0,pbxArr.lastIndexOf(","));
            log.log(Level.WARNING," accountId pbx configAddr  ="+pbxArr);

        } catch (Exception e) {
            // TODO: handle exception
            log.log(Level.WARNING," getPbxByAccountId exception, this accountId="+accountId,e);
        }
        return pbxArr;
    }


    /**
     * 获取全平台pbx
     * @return
     */
    public static String getPlatformPbx(){
        String pbxArr="";
        try {
            DBObject pbx_condition = new BasicDBObject();
            List<DBObject> pbxListObj = MongoProvider.find("bill","platform_cc_pbx",pbx_condition);
            for(DBObject pbxList :pbxListObj){
                String configAddr= pbxList.get("configAddr").toString();
                pbxArr+=configAddr+",";
            }
            pbxArr=pbxArr.substring(0,pbxArr.lastIndexOf(","));

        } catch (Exception e) {
            // TODO: handle exception
            log.log(Level.WARNING," getPlatformPbx exception",e);
        }
        return pbxArr;
    }


    /**
     * 根据accountid  和 callNumber 开放单号码拨号计数权限
     * @param action
     * @return
     */
    public static C5Response changeSingleCallSumToPbx(C5Action action){
        C5Response response = new C5Response(action);
        String pbxStr="";
        String accountID="";
        String CallNumber="";
        try {
            accountID = action.getStringValue("account");
            CallNumber = action.getStringValue("CallNumber");

            if(accountID == null||("").equals(accountID)||CallNumber==null||("").equals(CallNumber)){
                response.setMessage("param is not found,please checked");
                response.setSucceed(false);
                response.addParameter("result", "404");
                return response;
            }

            String  singleAccountData = "{\"Command\":\"Action\"," +
                    "\"Action\":\"NumCallToManyLimit\"," +
                    "\"ActionID\":\""+Utils.getUniqueid()+"\"," +
                    "\"accounts\":" +
                    "[{" +
                    "\"account\":\""+accountID+"\"," +
                    "\"on-off\":\"on\"" +
                    "}]," +
                    "\"CallNumber\":\""+CallNumber+"\"" +
                    "}\r\n";//限制账号接口
            pbxStr=getPbxByAccountId(accountID);

            for(String pbxAddr:pbxStr.split(",")){
                //通知单个账户的所属pbx
                log.log(Level.WARNING,"to pbx singleAccountData  post ====="+singleAccountData);
                String result= HttpProvider.sendPost(pbxAddr, singleAccountData);
                JSONObject obj = JSONObject.fromObject(result);
                if(obj.get("Succeed").toString().equals("true")){
                    response.setSucceed(true);
                }else{
                    response.setMessage("send to pbx false");
                    response.setSucceed(false);
                    response.addParameter("result", "404");
                    log.log(Level.WARNING,"httpSendPost failed="+result+" pbxAddr="+pbxAddr);
                }

            }
        } catch (Exception e) {
            // TODO Auto-generated catch block
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
            e.printStackTrace();
            log.log(Level.WARNING,"pbx can't find ,pbxStr="+pbxStr+",accountID="+accountID+",CallNumber="+CallNumber);
        }

        return response;
    }


    /**
     * 根据accountid 开放该账户下的号码的拨号计数权限
     * @param action
     * @return
     */
    public static C5Response changeCallSumByAccount(C5Action action) {
        C5Response response = new C5Response(action);
        String accountId="";
        String pbxStr="";
        try {
            accountId = action.getStringValue("account");
            List<Object> list = RedisUtil.queryRedisByAccountId(accountId);
            if(list.size()>0){
                for (int i = 0; i < list.size(); i++) {
                    String one_list = list.get(i).toString();
                    JSONObject obj = JSONObject.fromObject(one_list);
                    // zh_N00000000143_13439236004
                    String key = obj.get("reids-key").toString();
                    String value = obj.get("redis-value").toString();
                    String CallNumber = key.substring(key.lastIndexOf("_")+1);
                    String zh_data = "{\"Command\":\"Action\","
                            + "\"Action\":\"NumCallToManyLimit\","
                            + "\"ActionID\":\"" + Utils.getUniqueid() + "\","
                            + "\"accounts\":" + "[{" + "\"account\":\"" + accountId
                            + "\"," + "\"on-off\":\"on\"" + "}],"
                            + "\"CallNumber\":\"" + CallNumber + "\"" + "}\r\n";// 限制账号接口
                    pbxStr = getPbxByAccountId(accountId);
                    if(pbxStr!=null&&pbxStr.length()>0){
                        for (String pbxAddr : pbxStr.split(",")) {
                            // 通知单个账户的所属pbx
                            String result = HttpProvider.sendPost(pbxAddr,zh_data);
                            JSONObject result_str = JSONObject.fromObject(result);
                            if (result_str.get("Succeed").toString().equals("true")) {
                                response.setSucceed(true);
                            } else {
                                response.setSucceed(false);
                                response.addParameter("result", "404");
                                log.log(Level.WARNING, "send to pbx false 404, pbxAddr="+pbxAddr+"accountId="+pbxAddr+"callNumber="+CallNumber);
                            }
                        }
                    }else{
                        log.log(Level.WARNING, " account product pbx could not find,please check this account product,accountId="+accountId);
                    }
                }
            }else{
                response.setMessage("this account no set redis call sum");
                response.setSucceed(false);
                response.addParameter("result", "403");
                log.log(Level.WARNING, " no redis message,accountId="+accountId);
            }

        } catch (Exception e) {
            // TODO: handle exception
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
            e.printStackTrace();
            log.log(Level.WARNING,"pbx can't find ,pbxStr="+pbxStr+"accountID="+accountId);

        }
        return response;
    }


    /**
     * 根据accountId获取pbx地址
     * @param accountId
     * @return
     */
    public static  List<DBObject>  getPbxListByAccountId(String accountId){
        String pbxArr="";
        List<DBObject> pbxListObj=null;
        try {
            //根据accountid和 product 获取当前pbx
            DBObject productCondition = new BasicDBObject().append("account", accountId).append("product", "cc");
            List<DBObject> productListObj = MongoProvider.find("bill","platform_account_product",productCondition);
            List<String> pbx_list=new ArrayList<String>();
            String pbxListArr=productListObj.get(0).get("pbx").toString();
            String[] arr=pbxListArr.split("} ,");

            for(String pbxValue:arr){
                pbxValue=pbxValue+"}]";
                JSONObject obj = JSONObject.fromObject(pbxValue.substring(pbxListArr.indexOf("[")+1,pbxValue.lastIndexOf("]")));
                pbx_list.add(obj.get("PBX").toString());
            }

            DBObject pbxCondition = new BasicDBObject().append("_id", new BasicDBObject("$in",pbx_list));
            pbxListObj = MongoProvider.find("bill","platform_cc_pbx",pbxCondition);

        } catch (Exception e) {
            // TODO: handle exception
            log.log(Level.WARNING," getPbxByAccountId exception, this accountId="+accountId,e);
        }
        return pbxListObj;
    }
    
    /**
     * 设置录音权限
     * @param action
     * @return
     */
	public static C5Response setCCRecordRights(C5Action action) {
		C5Response response = new C5Response(action);
		List<DBObject> pbxStr = null;
		String accountID = "";
		String pbxAddr = "";
		String pbxId = "";
		String RecorderforbiddenData = "";
		Boolean flag;
		try {
			accountID = action.getStringValue("account");
			flag=Boolean.valueOf(action.getStringValue("isRecording").toString());
			if (accountID == null || ("").equals(accountID)) {
				response.setMessage("params not found,please checked");
				response.setSucceed(false);
				response.addParameter("result", "404");
				return response;
			}

			pbxStr = getPbxListByAccountId(accountID);
			for (int i = 0; i < pbxStr.size(); i++) {
		
				pbxAddr = pbxStr.get(i).get("configAddr").toString();
				pbxId = pbxStr.get(i).get("_id").toString();
				if(flag==null){
					flag=true;
				}
				RecorderforbiddenData = "{\"Command\":\"Action\","
						+ "\"Action\":\"Recorderforbidden\","
						+ "\"ActionID\":\"" + Utils.getUniqueid() + "\","
						+ "\"pbx\":\""+pbxId+"\","
						+ "\"account\":\""+accountID+"\"," 
						+ "\"forbid\":"+ flag 
						+ "}\r\n";
				
				String result = HttpProvider.sendPost(pbxAddr,RecorderforbiddenData);
				JSONObject obj = JSONObject.fromObject(result);
				if (obj.get("Succeed").toString().equals("true")) {
					response.setSucceed(true);
					response.addParameter("result", "200");
				} else {
					response.setMessage("setCCRecordRights  pbx false");
					response.setSucceed(false);
					response.addParameter("result", "404");
					log.log(Level.WARNING, "setCCRecordRights post failed=" + result+ " pbxAddr=" + pbxAddr);
				}

			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			response.addParameter("result", "500");
			e.printStackTrace();
			log.log(Level.WARNING, "pbx can't find ,pbxStr=" + pbxStr+ ",accountID=" + accountID);
		}

		return response;
	}
    


    public static String getPtPbxStr() {
        return ptPbxStr;
    }

    public static void setPtPbxStr(String ptPbxStr) {
        CallBillThread.ptPbxStr = ptPbxStr;
    }


    public static Map<String, Object> getZhPbxStr() {
        return zhPbxStr;
    }

    public static void setZhPbxStr(Map<String, Object> zhPbxStr) {
        CallBillThread.zhPbxStr = zhPbxStr;
    }
}
