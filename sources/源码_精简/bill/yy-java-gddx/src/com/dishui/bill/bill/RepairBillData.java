package com.dishui.bill.bill;


import com.dishui.bill.db.model.Intl;
import com.dishui.bill.db.model.Product;
import com.dishui.bill.db.service.IntlService;
import com.dishui.bill.db.service.ProductService;
import com.dishui.bill.db.service.ProxyLineFeeService;
import com.dishui.bill.db.model.ProxyLineFee;
import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.report.EventBusinessField;
import com.dishui.report.EventData;
import com.dishui.report.EventReporter;
import com.dishui.report.EventType;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class RepairBillData {
    private static Logger log = Logger.getLogger(RepairBillData.class.getName());

    private static final String STRATEGY_MINUTE = "minute";
    private static final String STRATEGY_MINUTE3 = "minute3";
    private static final String STRATEGY_SECOND6 = "second6";
    //private static final String InternationalStrategy_tietong = "tietong";
    private static final String request_key = "84706874723d4d19a6c09084d2b69c12";

    /**
     * http://127.0.0.1:8888/service?Action=repaireLineFee&account=N00000000170&product=cc&key=84706874723d4d19a6c09084d2b69c12
     * @param action
     * @return
     */
    public  C5Response repaireLineFee(C5Action action ){
        C5Response response = new C5Response(action);
        try{
            String account = action.getStringValue("account");
            String product = action.getStringValue("product");
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
            DBObject condition = new BasicDBObject("account",account).append("isFee",null);
            boolean hasRecord=true;
            DBObject prod = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,new BasicDBObject().append("_id", account + "_" + product));
            while (hasRecord){
                List<DBObject> list = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_error").find(condition).limit(200).toArray();
                if(list!=null && list.size()>0){
                    for (DBObject callObject : list) {
//                        try {
//                            String product=String.valueOf(callObject.get("product"));
                            //transfer|dialout
                            String type = String.valueOf(callObject.get("type"));
                            FeeObject fee = countFee(prod, callObject, type);
                            chargeLineFee(product,fee,callObject);
                            MongoProvider.updateOne("bill_data","bill_cdr_error",new BasicDBObject().append("_id", callObject.get("_id")),
                                    new BasicDBObject().append("$set",new BasicDBObject().append("isFee","1")), WriteConcern.SAFE);
//                        } catch (Exception e) {
//                            e.printStackTrace();
//                        }
                    }
                }else{
                    hasRecord=false;
                }
            }
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }
    private void chargeLineFee(String product,FeeObject fee, DBObject callObject) {
        String lineID = String.valueOf(callObject.get("line")==null?"":callObject.get("line"));
        DBObject line = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_PLATFORM_LINE).findOne(new BasicDBObject().append("_id", lineID));
        if(line==null){//不是我们的线路
            //todo  insert error
//            MongoConnect.getInstance().getDB("bill_data").getCollection("bill_line_error").insert(callObject);
            return;
        }

//        String currentDate = Utils.getDate("yyyy-MM-dd");
        String currentDate= String.valueOf(callObject.get("endTimeDisplay")==null?"":callObject.get("endTimeDisplay"));
        currentDate=currentDate.substring(0,10);
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
            if(intl != null) {
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
            //strategy = (String) account.get("internationalStrategy");
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
                intlNo = intlFee.getCode();
                intlArea = intlFee.getCode();


                callObject.put("calleeProvince", intlArea);
                callObject.put("calleeCity", intlArea);
                callObject.put("calleeDistrictNo", intlNo);
                feeObject.setLocal(false);
            } else {
                log.info("未配置的国际长途号码 " + did);
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



    /**
     * 代理资费未设置计费异常，补录代理的每日通话统计
     * http://127.0.0.1:8888/service?Action=repaireProxyFee&proxy=a1dd9130-d68e-11e4-96d4-7fdedd49329a&product=cc&key=84706874723d4d19a6c09084d2b69c12
     * @param action
     * @return
     */
    public  C5Response repaireProxyFee(C5Action action ){
        C5Response response = new C5Response(action);
        try{
            String proxy = action.getStringValue("proxy");
            String product = action.getStringValue("product");
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
            DBObject condition = new BasicDBObject("proxy",proxy).append("isFee",null);
            boolean hasRecord=true;

            while (hasRecord){
                List<DBObject> list = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_error").find(condition).limit(200).toArray();
                if(list!=null && list.size()>0){
                    for (DBObject callObject : list) {
//                        try {
//                            String product=String.valueOf(callObject.get("product"));
                        //transfer|dialout
                        String account=String.valueOf(callObject.get("account"));
                        String proxyID = String.valueOf(callObject.get("proxy"));
                        DBObject prod = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT, new BasicDBObject().append("_id", account + "_" + product));
                        String type = String.valueOf(callObject.get("type"));
                        FeeObject fee = countFee(prod, callObject, type);
                        chargeProxyFee(proxyID, fee, callObject);
                        callObject.removeField("income");
                        MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr_query_"+product).insert(callObject);

                        MongoProvider.updateOne("bill_data","bill_cdr_error",new BasicDBObject().append("_id", callObject.get("_id")),
                                new BasicDBObject().append("$set",new BasicDBObject().append("isFee","1")), WriteConcern.SAFE);
//                        } catch (Exception e) {
//                            e.printStackTrace();
//                        }
                    }
                }else{
                    hasRecord=false;
                }
            }
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    private void chargeProxyFee(String proxyID, FeeObject fee, DBObject callObject) {
        String callDate=String.valueOf(callObject.get("endTimeDisplay"));

        String currentDate = callDate.substring(0, 10);
        String billID = proxyID + "_" + currentDate;
        DBObject bill = MongoConnect.getInstance().getDB("bill")
                .getCollection(BillMaster.DB_CALL_INCOME).findOne(new BasicDBObject().append("_id", billID));
        //如果找不到代理的话单，则生成当天话单
        if(bill == null) {
            createProxyBill(proxyID, currentDate);
        }

//        DBObject account = MongoConnect.getInstance().getDB("bill")
//                .getCollection("bill_system_user").findOne(new BasicDBObject().append("_id", proxyID));

        //找到线路资费
        String lineId = (String)callObject.get("line");
        ProxyLineFee lineFee = ProxyLineFeeService.getFee(proxyID,lineId);

        String countMinutes = "localPhoneMinutes";
        long consume = 0l;
        int percent = lineFee.getDialPercent();//Integer.valueOf(String.valueOf(account.get("dialPercent")));

        if(fee.isIntl()) {
            countMinutes = "intlMinutes";
            percent = lineFee.getIntlPercent();//Integer.valueOf(String.valueOf(account.get("intlPercent")));
            String did = (String) callObject.get("did");
            //DBObject internationalFee = (DBObject) account.get("internationalFee");
//            long fee1 = lineFee.getIntlFee1();//Long.valueOf(String.valueOf(internationalFee.get("fee1")));
//            long fee2 = lineFee.getIntlFee2();//Long.valueOf(String.valueOf(internationalFee.get("fee2")));
//            long fee3 = lineFee.getIntlFee3();//Long.valueOf(String.valueOf(internationalFee.get("fee3")));
//            if (did.startsWith("00852") || did.startsWith("00853") || did.startsWith("00886")) {
//                consume = fee.getFee() - fee.getMinutes() * fee1;
//            } else if (did.startsWith("001")) {
//                consume = fee.getFee() - fee.getMinutes() * fee2;
//            } else {
//                consume = fee.getFee() - fee.getMinutes() * fee3;
//            }
            consume = fee.getFee(); //- fee.getMinutes() * lineFee.getIntlFee(did);
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

    public static void createProxyBill(String proxyID, String currentDate) {
        DBObject bill = new BasicDBObject();
        String billID = proxyID + "_" + currentDate;
        bill.put("_id", billID);
        bill.put("account", proxyID);
//        bill.put("year", Utils.getDate("yyyy"));
//        bill.put("month", Utils.getDate("MM"));
//        bill.put("dd", Utils.getDate("dd"));
        bill.put("year", currentDate.substring(0,4));
        bill.put("month", currentDate.substring(5,7));
        bill.put("dd", currentDate.substring(8));
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

    /**
     * 代理资费未设置计费异常，补录代理的收入
     * http://127.0.0.1:8888/service?Action=repaireProxyTelIncome&proxy=a1dd9130-d68e-11e4-96d4-7fdedd49329a&date=2015-04-16&key=84706874723d4d19a6c09084d2b69c12
     * @param action
     * @return
     */
    public  C5Response repaireProxyTelIncome(C5Action action ){
        C5Response response = new C5Response(action);
        try{
            String proxyId = action.getStringValue("proxy");
            String date = action.getStringValue("date");
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
            String now =Utils.getCurrentDate();
//        String lastDate = Utils.getLastDate();
            log.log(Level.INFO, "start repaireProxyTelIncome , date is :" + now);
            DBObject condition = new BasicDBObject().append("date", new BasicDBObject().append("$lte", date)).append("account", proxyId).append("isFee",null);
            List<DBObject> list = MongoProvider.find("bill_call_income", condition);

            for(DBObject obj : list){
                String incomeDate=String.valueOf(obj.get("date"));
                String incomeTime=incomeDate+" 23:59:59";
                long _income= (Long)obj.get("income");
                String income=Utils.formatRound2Money(_income)+"";
                long _discount=obj.get("discount")==null?0l:(Long)obj.get("discount");
                String discount=Utils.formatRound2Money(_discount)+"";
//            String key=obj.get("_id").toString();
                String proxy=obj.get("account").toString();
                DBObject _set = new BasicDBObject();
                _set.put("$inc",new BasicDBObject("balance",_income));

                DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                String balance=Utils.formatRound2Money(Long.valueOf(String.valueOf(_proxy.get("balance"))))+"";
                DBObject temp=new BasicDBObject();
                String orderNo= IDGenerator.getNext(6);
                orderNo="Ti"+  orderNo;
                temp.put("_id",orderNo);
                temp.put("status","pay");
                temp.put("income",income);
                temp.put("discount",discount);
                temp.put("account","");
                temp.put("create_time",incomeTime);
                temp.put("pay_time",incomeTime);
                temp.put("flag","payCallFee");
                temp.put("source","payCallFee");
                temp.put("proxy",proxy);
                temp.put("currentBalance",balance);
                DBObject sn = new BasicDBObject();
                sn.put("localPhoneMinutes", obj.get("localPhoneMinutes"));
                sn.put("remotePhoneMinutes", obj.get("remotePhoneMinutes"));
                sn.put("localTelMinutes", obj.get("localTelMinutes"));
                sn.put("remoteTelMinutes", obj.get("remoteTelMinutes"));
                sn.put("calls", obj.get("calls"));
                temp.put("sn", sn);

                temp.put("year",obj.get("year"));
                temp.put("month",obj.get("month"));
                temp.put("dd",obj.get("dd"));
                temp.put("feeId",obj.get("_id"));

                try {
                    SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                    Date _date = format.parse(incomeTime);
                    temp.put("timestamp",_date.getTime());
                } catch (ParseException e) {
                    e.printStackTrace();
                }
                MongoProvider.insert("bill_user_pay",temp);
                MongoProvider.update("bill_call_income",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",new BasicDBObject("isFee","1")));
            }
            now =Utils.getCurrentDate();
            log.log(Level.INFO, "end repaireProxyTelIncome[" + now + "] ");
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;

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


    /**
     * http://127.0.0.1:8888/service?Action=repaireMinconsumeFee&key=84706874723d4d19a6c09084d2b69c12
     * @param action
     * @return
     */

    public  C5Response repaireMinconsumeFee(C5Action action ){
        C5Response response = new C5Response(action);
        try{
            String key = action.getStringValue("key");
            if(!request_key.equals(key)){
                log.info("非法的key");
                response.setSucceed(false);
                response.addParameter("result", "500");
                return response;
            }
            DBObject condition = new BasicDBObject("pay_time","2015-05-03 23:59:59").append("source","payCallMin");
            List<DBObject> list = MongoConnect.getInstance().getDB("bill").getCollection("bill_user_pay").find(condition).toArray();
            if(list!=null && list.size()>0) {
                for (DBObject callObject : list) {
                    String account = String.valueOf(callObject.get("account"));
                    String income = String.valueOf(callObject.get("income"));
                    long _income = Math.round(Double.valueOf(income) * 10000);

                    String proxyID = String.valueOf(callObject.get("proxy"));
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc", new BasicDBObject("balance", -_income));
                    DBObject _proxy = MongoProvider.findAndModify("bill_system_user", new BasicDBObject("_id", proxyID), _set, false);

                    MongoProvider.updateOne("bill", "bill_user_pay", new BasicDBObject().append("_id", callObject.get("_id")),
                            new BasicDBObject().append("$set", new BasicDBObject().append("proxy", "err_" + proxyID)), WriteConcern.SAFE);
                }
            }
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }
}
