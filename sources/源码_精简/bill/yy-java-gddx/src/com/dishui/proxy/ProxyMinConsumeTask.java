package com.dishui.proxy;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;


import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ProxyMinConsumeTask extends TimerTask {
    private static Logger log = Logger.getLogger(ProxyMinConsumeTask.class.getName());

    @Override
    public void run() {
        try {
            String time =Utils.getCurrentDate();
            Calendar now = Calendar.getInstance();
            log.info("ProxyMinConsumeTask time="+time+",day="+now.get(Calendar.DAY_OF_MONTH));
            if (now.get(Calendar.DAY_OF_MONTH) != 1) {
                return;
            }
            generate400MinConsume();
            generateZJMinConsume();
            generateCCMinConsume();
        } catch (Exception e) {
            log.log(Level.WARNING, "process ProxyMinConsumeTask  exception! ", e);
            e.printStackTrace();
        }
    }

    private void generate400MinConsume(){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start generate400MinConsume , date is :" + now);
        String lastMonth = Utils.getLastMonth();
//        lastMonth = "2015-04";//for test
        String[] ary=lastMonth.split("-");
        DBObject condition = new BasicDBObject().append("name", "400").append("isFee",null)
                .append("year", ary[0]).append("month", ary[1]);
//                .append("year", new BasicDBObject("$lte",ary[0])).append("month", new BasicDBObject("$lte",ary[1]));
        List<DBObject> list = MongoProvider.find("bill_data","bill_call_consume", condition);
        String lastTime=Utils.getLastDate()+" 23:59:59";
//        lastTime="2015-04-30 23:59:59";
        for(DBObject obj : list){
            try {
                Object _obj=obj.get("proxy");
                if(_obj==null){
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data", "bill_call_consume", new BasicDBObject("_id", obj.get("_id")), new BasicDBObject("$set", temp2));
                    continue;
                }
                String proxy=_obj.toString();
                String displayName=(String)obj.get("displayName");
                long minConsume= (Long)obj.get("minConsume");
                long actualConsume= (Long)obj.get("actualConsume");
                long balance=minConsume-actualConsume;

                if(balance>0 && proxy!=null && !"".equals(proxy)){ //for proxy
    //                DBObject acc=MongoProvider.findOne("platform_account",new BasicDBObject("_id",accountId));
                    DBObject num400=MongoProvider.findOne("platform_num400",new BasicDBObject("_id",displayName));
                    DBObject user=MongoProvider.findOne("bill_system_user",new BasicDBObject("_id",proxy));
                    int num400Percent=Integer.parseInt(String.valueOf(user.get("num400Percent")));
                    long min400ConsumeProxy=800000l;// 没值则设为80
                    if(num400.get("initFee")!=null){
                        DBObject _initFee=(DBObject)num400.get("initFee");
                        if(_initFee.get("min400ConsumeProxy")!=null){
                            min400ConsumeProxy=Double.valueOf(String.valueOf(_initFee.get("min400ConsumeProxy"))).longValue();
                        }
                    }
                    long income=0l;
                    long oweMin=getOweMinConsume((String) obj.get("_id"));
                    long actualBalance=0l;
                    String orderNo= IDGenerator.getNext(6);
                    orderNo="Ti"+  orderNo;
                    if(minConsume<min400ConsumeProxy){
                        DBObject error = new BasicDBObject();
                        error.put("minConsume",minConsume);
                        error.put("min400ConsumeProxy", min400ConsumeProxy);
                        error.put("proxy", proxy);
                        error.put("num400", displayName);
                        error.put("account", obj.get("account"));
                        MongoProvider.insert("bill_data","bill_400_consume_error",error);
                        log.log(Level.WARNING,"["+displayName + "]代理低消大于客户低消！");
                        continue;
                    }else{
                        if(min400ConsumeProxy<actualConsume){
                            actualBalance=balance;
                            income=(actualBalance*num400Percent)/100;
                        }else{
                            actualBalance=minConsume-min400ConsumeProxy;
                            income=(actualBalance*num400Percent)/100;

                        }
                        if(oweMin>0){
                            actualBalance=actualBalance-oweMin; //减去欠费的
                            long oweProxyFee=0l;
                            if(actualBalance>0){   //返还扣除的费用，计算未返还的费用
                                long _income=(actualBalance*num400Percent)/100;
                                oweProxyFee = income-_income;
                                //欠费的充值再返
                                MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                        new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId",orderNo)));
                            }else{  //本次无返还
                                oweProxyFee =income;
                                MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                        new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId","")));
                                continue;
                            }
                        }
                    }
                    income=(actualBalance*num400Percent)/100;
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",income));
                    DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                    String proxyBalance=Utils.formatRound2Money(Double.valueOf(String.valueOf(_proxy.get("balance"))).longValue())+"";
                    DBObject temp=new BasicDBObject();

                    temp.put("_id",orderNo);
                    temp.put("status","pay");
                    temp.put("income",Utils.formatRound2Money(income)+"");
                    temp.put("account",obj.get("account"));
                    temp.put("create_time",now);
                    temp.put("pay_time",lastTime);
                    temp.put("flag","payCall400Min");
                    temp.put("source","payCallMin");
                    temp.put("proxy",proxy);
                    temp.put("currentBalance",proxyBalance);
                    DBObject sn = new BasicDBObject();
                    sn.put("serviceno",obj.get("displayName"));
                    sn.put("localMinutes", obj.get("localMinutes"));
                    sn.put("remoteMinutes", obj.get("remoteMinutes"));
                    sn.put("localSecond6", obj.get("localTelMinutes"));
                    sn.put("remoteSecond6", obj.get("remoteTelMinutes"));
                    String _minConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("minConsume"))))+"";
                    String _actualConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("actualConsume"))))+"";
                    String _oweMin=Utils.formatRound2Money(oweMin)+"";
                    sn.put("minConsume", _minConsume+"");
                    sn.put("actualConsume", _actualConsume+"");
                    sn.put("oweMin", _oweMin+"");//客户欠的费用
                    sn.put("calls", obj.get("calls"));
                    temp.put("sn", sn);

                    temp.put("year",obj.get("year"));
                    temp.put("month",obj.get("month"));
                    temp.put("feeId",obj.get("_id"));
                    temp.put("timestamp",System.currentTimeMillis());

                    MongoProvider.insert("bill_user_pay",temp);

                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }else{
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }
            } catch (Exception e) {
                log.log(Level.WARNING,"generate400MinConsume error:"+e.getMessage(),e);
                e.printStackTrace();
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end generate400MinConsume["+now + "] ");
    }

    private void generateZJMinConsume(){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start generateZJMinConsume , date is :" + now);
        String lastMonth = Utils.getLastMonth();
//        lastMonth = "2015-04";//for test
        String[] ary=lastMonth.split("-");
        DBObject condition = new BasicDBObject().append("name", "zj")
                .append("year", ary[0]).append("month", ary[1]).append("isFee",null);
        List<DBObject> list = MongoProvider.find("bill_data","bill_call_consume", condition);
        String lastTime=Utils.getLastDate()+" 23:59:59";
//        lastTime="2015-04-30 23:59:59";
        for(DBObject obj : list){
            try {
                Object _obj=obj.get("proxy");
                if(_obj==null){
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                    continue;
                }
                String proxy=_obj.toString();
                long minConsume= (Long)obj.get("minConsume");
                long actualConsume= (Long)obj.get("actualConsume");
                long balance=minConsume-actualConsume;

                if(balance>0 && proxy!=null && !"".equals(proxy)){ //for proxy
                    DBObject user=MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", proxy));
                    int dialPercent=Integer.parseInt(String.valueOf(user.get("dialPercent")));
                    long income=(balance*dialPercent)/100;
                    String orderNo= IDGenerator.getNext(6);
                    orderNo="Ti"+  orderNo;

                    //判断是否有扣低消欠费的记录
                    long oweMin=getOweMinConsume((String)obj.get("_id"));
                    long actualBalance=balance;
                    if(oweMin>0){
                        actualBalance=balance-oweMin;
                        long oweProxyFee=0l;
                        if(actualBalance>0){   //返还扣除的费用，计算未返还的费用
                            long _income=(actualBalance*dialPercent)/100;
                            oweProxyFee = income-_income;
                            MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                    new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId",orderNo)));
                        }else{  //本次无返还
                            oweProxyFee =income;
                            MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                    new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId","")));
                            continue;
                        }
                    }
                    income=(actualBalance*dialPercent)/100;
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",income));
                    DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                    String proxyBalance=Utils.formatRound2Money(Long.valueOf(String.valueOf(_proxy.get("balance"))))+"";
                    DBObject temp=new BasicDBObject();

                    temp.put("_id",orderNo);
                    temp.put("status","pay");
                    temp.put("income",Utils.formatRound2Money(income)+"");
                    temp.put("account",obj.get("account"));
                    temp.put("create_time",now);
                    temp.put("pay_time",lastTime);
                    temp.put("flag","payCallZJMin");
                    temp.put("source","payCallMin");
                    temp.put("proxy",proxy);
                    temp.put("currentBalance",proxyBalance);
                    DBObject sn = new BasicDBObject();
                    sn.put("localMinutes", obj.get("localMinutes"));
                    sn.put("remoteMinutes", obj.get("remoteMinutes"));
                    String _minConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("minConsume"))))+"";
                    String _actualConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("actualConsume"))))+"";
                    String _oweMin=Utils.formatRound2Money(oweMin)+"";
                    sn.put("minConsume", _minConsume+"");
                    sn.put("actualConsume", _actualConsume+"");
                    sn.put("oweMin", _oweMin+"");
                    sn.put("calls", obj.get("calls"));
                    temp.put("sn", sn);

                    temp.put("year",obj.get("year"));
                    temp.put("month",obj.get("month"));
                    temp.put("feeId",obj.get("_id"));
                    temp.put("timestamp",System.currentTimeMillis());

                    MongoProvider.insert("bill_user_pay",temp);

                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }else{
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }
            } catch (Exception e) {
                log.log(Level.WARNING,"generateZJMinConsume error:"+e.getMessage());
                e.printStackTrace();
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end generateZJMinConsume["+now + "] ");
    }

    private void generateCCMinConsume(){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start generateCCMinConsume , date is :" + now);
        String lastMonth = Utils.getLastMonth();
//        lastMonth = "2015-04";//for test
        String[] ary=lastMonth.split("-");
        DBObject condition = new BasicDBObject().append("name", "cc")
                .append("year", ary[0]).append("month", ary[1]).append("isFee",null);
        List<DBObject> list = MongoProvider.find("bill_data","bill_call_consume", condition);
        String lastTime=Utils.getLastDate()+" 23:59:59";
//        lastTime="2015-04-30 23:59:59";
        for(DBObject obj : list){
            try {
                Object _obj=obj.get("proxy");
                if(_obj==null){
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                    continue;
                }
                String proxy=_obj.toString();
                long minConsume= (Long)obj.get("minConsume");
                long actualConsume= (Long)obj.get("actualConsume");
                long balance=minConsume-actualConsume;
                if(balance>0 && proxy!=null && !"".equals(proxy)){ //for proxy
                    DBObject user=MongoProvider.findOne("bill_system_user",new BasicDBObject("_id",proxy));
                    int dialPercent=Integer.parseInt(String.valueOf(user.get("dialPercent")==null?"0":user.get("dialPercent")));
                    long income=(balance*dialPercent)/100;
                    String orderNo= IDGenerator.getNext(6);
                    orderNo="Ti"+  orderNo;

                    //判断是否有扣低消欠费的记录
                    long oweMin=getOweMinConsume((String)obj.get("_id"));
                    long actualBalance=balance;
                    if(oweMin>0){
                        actualBalance=balance-oweMin;
                        long oweProxyFee=0l;
                        if(actualBalance>0){   //返还扣除的费用，计算未返还的费用
                            long _income=(actualBalance*dialPercent)/100;
                            oweProxyFee = income-_income;
                            MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                    new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId",orderNo)));
                        }else{  //本次无返还
                            oweProxyFee =income;
                            MongoProvider.update("bill_data","platform_account_owe_fee",new BasicDBObject().append("orderNo",obj.get("_id")),
                                    new BasicDBObject("$set",new BasicDBObject("flag","oweProxy").append("proxyFee",oweProxyFee).append("incomeId","")));
                            continue;
                        }
                    }

                    income=(actualBalance*dialPercent)/100;
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("balance",income));
                    DBObject _proxy=MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id",proxy),_set,false);
                    String proxyBalance=Utils.formatRound2Money(Double.valueOf(String.valueOf(_proxy.get("balance"))).longValue())+"";
                    DBObject temp=new BasicDBObject();
                    temp.put("_id",orderNo);
                    temp.put("status","pay");
                    temp.put("income",Utils.formatRound2Money(income)+"");
                    temp.put("account",obj.get("account"));
                    temp.put("create_time",now);
                    temp.put("pay_time",lastTime);
                    temp.put("flag","payCallCCMin");
                    temp.put("source","payCallMin");
                    temp.put("proxy",proxy);
                    temp.put("currentBalance",proxyBalance);
                    DBObject sn = new BasicDBObject();
                    sn.put("localMinutes", obj.get("localMinutes"));
                    sn.put("remoteMinutes", obj.get("remoteMinutes"));
                    String _minConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("minConsume"))))+"";
                    String _actualConsume=Utils.formatRound2Money(Long.valueOf(String.valueOf(obj.get("actualConsume"))))+"";
                    String _oweMin=Utils.formatRound2Money(oweMin)+"";
                    sn.put("minConsume", _minConsume+"");
                    sn.put("actualConsume", _actualConsume+"");
                    sn.put("oweMin", _oweMin+"");
                    sn.put("calls", obj.get("calls"));
                    temp.put("sn", sn);

                    temp.put("year",obj.get("year"));
                    temp.put("month",obj.get("month"));
                    temp.put("feeId",obj.get("_id"));
                    temp.put("timestamp",System.currentTimeMillis());

                    MongoProvider.insert("bill_user_pay",temp);

                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }else{
                    DBObject temp2=new BasicDBObject();
                    temp2.put("isFee","1");
                    MongoProvider.update("bill_data","bill_call_consume",new BasicDBObject("_id",obj.get("_id")),new BasicDBObject("$set",temp2));
                }
            } catch (Exception e) {
                log.log(Level.WARNING,"generateCCMinConsume error:"+e.getMessage());
                e.printStackTrace();
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end generateCCMinConsume["+now + "] ");
    }

    /**
     * 得到该账单低消的欠代理结算的费用，根据实际消费来结算
     * @param billId
     * @return
     */
    private long getOweMinConsume(/*账单id*/String billId){
        DBObject oweFee = MongoProvider.findOne("bill_data", "platform_account_owe_fee", new BasicDBObject().append("orderNo", billId).append("status", "nodeal"));
        long owe=0l;
        if(oweFee!=null){
            owe=Double.valueOf(String.valueOf(oweFee.get("fee"))).longValue();
        }
        owe=Math.abs(owe);
        return owe;
    }
}
