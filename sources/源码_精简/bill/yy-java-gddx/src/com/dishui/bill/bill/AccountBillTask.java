package com.dishui.bill.bill;

import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.command.Fields;
import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.*;
import com.dishui.bill.db.service.AccountService;
import com.dishui.bill.db.service.AccountService.ConsumeFinanceAccountBalanceRes;
import com.dishui.bill.db.service.CallConsumeService;
import com.dishui.bill.db.service.ProductService;
import com.dishui.bill.db.service.AccountOweFeeService;
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

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AccountBillTask extends TimerTask {
	private static Logger log = Logger.getLogger(AccountBillTask.class.getName());
    private static String deductMonthRent="deductMonthRent";

	@Override
	public void run() {
		if (BillMaster.accountBillStatus) {
			log.log(Level.INFO, "task is running ! return!");
			return;
		}
		Calendar now = Calendar.getInstance();
		if (now.get(Calendar.HOUR_OF_DAY) != 0) {     //for test
			return;
		}

		log.log(Level.INFO, "start process account bill ...");
		long begin = new Date().getTime();
		String currentDay = Utils.getDate("dd");
		if (!currentDay.equals("01")) {    //for test
			log.warning("Generate month bill on " + Utils.getCurrentDate()+ " ?");
			return;
		}
		try {
			BillMaster.accountBillStatus = true;
			startBill();
			long end = new Date().getTime();
            long duration = end - begin;
            String msg = String.format("%s消耗时间[%d ms]", "end process account bill", duration);
            log.info(msg);
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "", e);
		} finally {
			BillMaster.accountBillStatus = false;
		}
	}

	public void startBill() {
		String currentMonth = Utils.getDate("yyyy-MM");
		log.info("Start bill: " + currentMonth + "[" + Utils.getCurrentDate()+ "]");
		// 遍历所有账户
		boolean hasAccount = true;
		while (hasAccount) {
            //filter stop Account
			List<DBObject> accountlist = MongoProvider.getConection(BillMaster.DB_ACCOUNT)
					.find(new BasicDBObject().append("billTime",new BasicDBObject().append("$lt", currentMonth)).append("status", new BasicDBObject("$ne","stop"))).limit(200).toArray();
            //for test
//            List<DBObject> accountlist = MongoProvider.getConection(BillMaster.DB_ACCOUNT)
//                    .find(new BasicDBObject().append("billTime",new BasicDBObject().append("$lt", currentMonth)).append("_id", "N00000000170")).limit(200).toArray();
			if (accountlist != null && accountlist.size() != 0) {
				for (DBObject account : accountlist) {
                    String accountID = (String) account.get("_id");
                    try{
/*                        long balance=Long.parseLong(String.valueOf(account.get("balance")));
                        long overdraw=account.get("overdraw")==null?0l:Long.valueOf(String.valueOf(account.get("overdraw")));
                        long actualBalance=balance+overdraw;

                        boolean hasMoney=true; //zj无余额不扣低消和号码月租
                        if(actualBalance<=0){
                            hasMoney=false;
                        }*/
                        // 查询总机
                        initBill(account,"zj","");
                        // 查询呼叫中心
                        initBill(account,"cc","");
                        // 查询所有400号码，生成本月400话单
                        initBill(account,"400","");
                        //扣号码月租
                        deductZJNumFee(accountID);
                        deductCCNumFee(accountID);
                        // 更新账户的endTime，表示本月已经生成过了
                        MongoProvider.updateOne(BillMaster.DB_ACCOUNT,new BasicDBObject().append("_id", accountID),
                                new BasicDBObject().append("$set",new BasicDBObject().append("billTime",currentMonth)),WriteConcern.SAFE);
                    } catch (Exception e) {
                        e.printStackTrace();
                        log.log(Level.WARNING, accountID, e);
                    }
				}
			} else {
				hasAccount = false;
			}
		}
	}
    public synchronized static void initBill(DBObject accDB,String product,String num400) {
        Calendar now = Calendar.getInstance();
        String currentDay = Utils.getDate("dd");
        String currentMonth = Utils.getDate("yyyy-MM");
        String accountID = (String) accDB.get("_id");
        if (currentDay.equals("01") && now.get(Calendar.HOUR_OF_DAY) == 0) {
//        if (currentDay.equals("08")) { //for test
            if("zj".equals(product)){
                // 生成总机本月外呼话单
                DBObject zj = MongoProvider.findOne(
                        BillMaster.DB_ACCOUNT_PRODUCT, new BasicDBObject().append("_id", accountID + "_zj"));
                if (zj != null){
                    long minConsume = 0l;
                    if (zj.containsField("minConsume")) {
                        minConsume = Double.valueOf(String.valueOf(zj.get("minConsume"))).longValue();
                    }
                    createBill(accDB,currentMonth, "zj", "",minConsume);
                }
            }else if("400".equals(product)){
                // 查询所有400号码，生成本月400话单
                DBObject zj = MongoProvider.findOne(
                        BillMaster.DB_ACCOUNT_PRODUCT, new BasicDBObject().append("_id", accountID + "_zj"));

                List<DBObject> list400 = MongoProvider.find(BillMaster.DB_400, new BasicDBObject().append("account", accountID));
                if (list400.size() > 0) {
                    for (DBObject d400 : list400) {
                        String num = (String) d400.get("_id");
                        String product400 = (String) d400.get("product");
                        long minConsume = 0l;
                        if (d400.containsField("min400Consume")) {
                            minConsume = Double.valueOf(String.valueOf(d400.get("min400Consume"))).longValue();
                        }
                        if("zj".equals(product400)){
                            if(zj!=null){
                                createBill(accDB,currentMonth, "400", num,minConsume);
                            }
                        }else{ //for cc
                            createBill(accDB, currentMonth,"400", num, minConsume);
//                            long productBalance=Long.parseLong(String.valueOf(d400.get("balance")==null?"0":d400.get("balance")));
//                            if(productBalance<=0){
//                                createBill(accDB, currentMonth,"400", num, 0,false,false);
//                            }else{
//                            }
                        }
                    }
                }
            }else if("cc".equals(product)) {
                //查询呼叫中心,生成呼叫中心本月外呼话单
                DBObject cc = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT, new BasicDBObject().append("_id", accountID + "_cc"));
                if (cc != null) {
                    long minConsume = 0l;
                    String effectDate=String.valueOf(cc.get("effectDate")==null?"":cc.get("effectDate"));
//                    long productBalance=Long.parseLong(String.valueOf(cc.get("balance")==null?"0":cc.get("balance")));
                    if (cc.containsField("minConsume")) {
                        minConsume = Double.valueOf(String.valueOf(cc.get("minConsume"))).longValue();
                    }
                    if(!effectDate.equals("")){
                        int day=Utils.getBetweenDays2(currentMonth,effectDate);
                        if(day>0){ //未到期不扣
                            createBill(accDB, currentMonth, "cc", "", 0);
                            return;
                        }
                    }
                    createBill(accDB, currentMonth, "cc", "", minConsume);
                }
            }else{
                log.log(Level.WARNING, "不存在的产品");
            }
        }else{  //新开账号，不扣低消
            AccountBillTask.createBill(accDB, currentMonth, product, num400, 0);
        }
    }

    /**
     *
     * @param accDB
     * @param currentMonth
     * @param product : cc,zj,400
     * @param num400
     * @param minConsume
     */
	public static void createBill(DBObject accDB,String currentMonth, String product, String num400,long minConsume) {
        String accountID = (String) accDB.get("_id");
		DBObject bill = new BasicDBObject();
		String billID = accountID + "_" + currentMonth + "_" + product;
		if (product.equals("400")) {
			billID = accountID + "_" + currentMonth + "_" + product + "_"+ num400;
		}
		bill.put("_id", billID);
		bill.put("account", accountID);
		bill.put("accountType", "normal");
		bill.put("name", product);
		bill.put("displayName", num400);
		bill.put("year", Utils.getDate("yyyy"));
		bill.put("month", Utils.getDate("MM"));
		bill.put("calls", 0);
		bill.put("localMinutes", 0l);
		bill.put("remoteMinutes", 0l);
		bill.put("localSecond6", 0l);
		bill.put("remoteSecond6", 0l);
		bill.put("minConsume", minConsume);
		bill.put("balance", minConsume);
		bill.put("giveMinute", 0l);
		bill.put("presentMinute", 0l);

		bill.put("actualConsume", 0l);
		bill.put("monthRent", 0l);
		bill.put("discount", 0l);
		bill.put("createTime", Utils.getCurrentDate());


        if(accDB != null ){
            //获取代理
            SystemUser proxy = AccountService.getProxy((String)accDB.get("_id"));
            String createUser = proxy==null ? null : proxy.getId();

            if(createUser!=null){
                bill.put("proxy",createUser);
            }

        }
        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).insert(bill);

		// 给账户扣月低消
		if (minConsume > 0) {
           /* String accountCollection = BillMaster.DB_ACCOUNT_PRODUCT;
            String productId = accountID + "_" + product;
			if (product.equals("400")) {
				accountCollection = BillMaster.DB_400;
                productId = num400;
			}*/
            deductMinConsume(accountID,minConsume,num400,billID,product);
			log.info("Min consume "+product+": " + currentMonth + " " + minConsume + " of "+ accountID);
		}
	}

    /**
     * deductStatus:use,prevStop,stop
     * @param account
     */
    private static void deductMinConsume(String account,long minConsume,String num400,String billID,String product){
//        DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account));//重新取余额
//        long balance=Long.parseLong(String.valueOf(accDB.get("balance")));
//        long actualBalance=balance+overdraw;


        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_MINCONSUME,account)
                .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                .addBusinessItem(EventBusinessField.CHARGE_MONEY,minConsume));
        //累计消费
        AccountService.incrConsume(account,minConsume);

        //--- 扣除余额 ---//
        ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(account, -(double)minConsume);
        DBObject _accDB = consumeRes.paidAccount;

        if (consumeRes.hasConsumeFinanceAccount) {
            // 如果扣了财务账户的钱，那么关联财务账户到这个账单上
            AccountService.bindFinanceAccountToBillData(BillMaster.DB_CALL_CONSUME, billID, consumeRes.paidAccount.get("_id").toString());
        }

        long _balance=0l;
        num400=num400==null?"":num400;

        if("cc".equals(product)){ //cc赠送分钟数
            DBObject productDB=MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,new BasicDBObject("_id",account+"_cc"));
            long giveMinute = Long.valueOf(String.valueOf(productDB.get("giveMinute")==null?"0":productDB.get("giveMinute")));
            if(giveMinute>0){
                BasicDBObject updateCondition = null;
                if (consumeRes.hasConsumeFinanceAccount) {
                    updateCondition = new BasicDBObject("giveMinute",giveMinute)
                            .append("presentMinute",giveMinute)
                            .append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString());
                } else {
                    updateCondition = new BasicDBObject("giveMinute",giveMinute).append("presentMinute",giveMinute);
                }
                MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(new BasicDBObject().append("_id", billID),
                        new BasicDBObject("$set",updateCondition),false,false,WriteConcern.SAFE);
            }
        }

        //--- 扣除余额 ---//
        // DBObject _accInc=new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -minConsume));
        // DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_accInc,false);

//        String createMethod=(String)_accDB.get("createMethod");
//        String createUser=(String)_accDB.get("createUser");

        //获取代理
        SystemUser proxy =AccountService.getProxy(account);
        String createUser = proxy==null ? null : proxy.getId();

        long overdraw=_accDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(_accDB.get("overdraw"))).longValue();
        _balance=Double.valueOf(String.valueOf(_accDB.get("balance"))).longValue()+overdraw;//加透支

        //--- 如果超出透支额度，并欠费，生成一条欠费记录 ---//
        if(_balance<0 && createUser != null){
            long _balance2=Math.abs(_balance);
            long actualFee=minConsume>_balance2?_balance2:minConsume;

            DBObject owe = new BasicDBObject();
            owe.put("fee", -actualFee);
            owe.put("proxyFee", 0);
            owe.put("minConsume", minConsume);
            // owe.put("account", account);
            owe.put("account", _accDB.get("_id"));
            owe.put("proxy", createUser);
            owe.put("type", "minConsume");
            owe.put("num400", num400);
            owe.put("createTime", Utils.getCurrentDate());
            owe.put("status", "nodeal");
            owe.put("orderNo", billID);
            owe.put("product", product);

            MongoProvider.insert("bill_data", "platform_account_owe_fee", owe);
        }

        dialAlert(_accDB,_balance);
    }

    public static C5Response deductCCMinConsume(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String accountId = action.getStringValue("account");
            String currentMonth = Utils.getDate("yyyy-MM");

            // 获取当月话单
            CallConsume callConsume = CallConsumeService.getByAccMonthProduct(accountId,currentMonth,Constants.PRODUCT_CC,null);
            if(callConsume == null){
                response.setMessage("month call consume bill not found");
                response.setSucceed(false);
                response.addParameter("result", "404");

                return response;
            }
            if(callConsume.getMinConsume() != 0 || callConsume.getBalance() != 0 || callConsume.getPresentMinute() != 0){
                response.setMessage("month call consume minConsume has been set");
                response.setSucceed(false);
                response.addParameter("result", "403");

                return response;
            }

            // 获取产品
            Product product = ProductService.getByAccountAndProduct(accountId,Constants.PRODUCT_CC);
            if(product == null){
                response.setMessage("cc product not found");
                response.setSucceed(false);
                response.addParameter("result", "404");

                return response;
            }

            //账单低消设置
            long minConsume = product.getMinConsume();
            long presentMinute = product.getGiveMinute();

            CallConsumeService.updateMinConsume(callConsume.getId(),minConsume,presentMinute);

            long remainMinConsume = minConsume - callConsume.getActualConsume();
            remainMinConsume = remainMinConsume > 0 ? remainMinConsume : 0;
            if(presentMinute == 0){
                //未设置赠送分钟数,按实际剩余低消余额走
                CallConsumeService.updateRemainMinConsume(callConsume.getId(),remainMinConsume,0);
            }else{
                //设置了赠送分钟数,按赠送分钟数走,写了低消余额也没啥用
                long remainPresentMinute =  presentMinute - (callConsume.getLocalMinutes() + callConsume.getRemoteMinutes());
                remainPresentMinute = remainPresentMinute > 0 ? remainPresentMinute : 0;
                CallConsumeService.updateRemainMinConsume(callConsume.getId(),remainMinConsume,remainPresentMinute);
            }

            //如果实际消费已经超过低消就不需要再扣低消了.
            if(remainMinConsume <= 0){
                response.setSucceed(false);
                response.setMessage("实际消费已经超过低消");
                return response;
            }

            //扣余额
            // AccountService.incrBalance2Account(accountId,-remainMinConsume);
            // 扣余额的逻辑改为如下
            ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountId, -remainMinConsume);
            // 扣完余额之后，还需要调整的是如果当前是财务账户支付的余额，那么将此账单关联财务账户
            if (consumeRes.hasConsumeFinanceAccount) {
                CallConsumeService.bindFinanceAccount(callConsume.getId(), consumeRes.paidAccount.get("_id").toString());
            }

            //账户欠费记录
            // Account account = AccountService.get(accountId);
            SystemUser proxy =AccountService.getProxy(accountId);
            // long balanceWithOverdraw = account.getBalance()+account.getOverdraw();
            DBObject paidAccount = consumeRes.paidAccount;
            long balanceWithOverdraw = Double.valueOf(String.valueOf(paidAccount.get("balance"))).longValue() +
                    Double.valueOf(String.valueOf(paidAccount.get("overdraw"))).longValue();

            if(balanceWithOverdraw < 0 && proxy != null){
                long actualOweFee = remainMinConsume > Math.abs(balanceWithOverdraw) ? Math.abs(balanceWithOverdraw) : remainMinConsume;

                AccountOweFee oweFee = new AccountOweFee();
                // oweFee.setAccount(accountId);
                oweFee.setAccount(paidAccount.get("_id").toString()); // 欠费记录根据谁付了钱算谁的
                oweFee.setCreateTime(new Date());
                oweFee.setProduct(Constants.PRODUCT_CC);
                oweFee.setMinConsume(minConsume);
                oweFee.setFee(actualOweFee);
                oweFee.setOrderNo(callConsume.getId());
                oweFee.setProxy(proxy.getId());
                oweFee.setStatus(Constants.PROXY_OWE_FEE_STATUS_NO_DEAL);
                oweFee.setProxyFee(0);
                oweFee.setType(Constants.PROXY_OWE_FEE_TYPE_MINCONSUME);

                AccountOweFeeService.saveOweFee(oweFee);
            }

            //报表事件
            EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_MINCONSUME,accountId)
                    .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,Constants.PRODUCT_CC)
                    .addBusinessItem(EventBusinessField.CHARGE_MONEY,remainMinConsume));
            //累计消费
            AccountService.incrConsume(accountId,remainMinConsume);

            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }

        return response;
    }

    public static C5Response backoutCCMinConsume(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String accountId = action.getStringValue("account");
            String currentMonth = Utils.getDate("yyyy-MM");

            String callConsumeId = CallConsumeService.generateID(accountId,currentMonth,Constants.PRODUCT_CC,null);
            // 获取当月话单
            CallConsume callConsume = CallConsumeService.get(callConsumeId);

            // 如果没有找到话单则返回失败
            if(callConsume == null) {
                response.setMessage("month call consume bill not found");
                response.setSucceed(false);
                response.addParameter("result", "404");

                return response;
            }

            // 如果之前没有设置低消,不需要撤销
            if(callConsume.getMinConsume() == 0 && callConsume.getBalance() == 0){
                response.setMessage("month call consume minConsume has not been set");
                response.setSucceed(false);
                response.addParameter("result", "403");

                return response;
            }
            
            // 获取产品
            Product product = ProductService.getByAccountAndProduct(accountId,Constants.PRODUCT_CC);
            if(product == null){
                response.setMessage("cc product not found");
                response.setSucceed(false);
                response.addParameter("result", "404");

                return response;
            }

            long minConsume = callConsume.getMinConsume();//低消数额
            long remainMinConsume = minConsume - callConsume.getActualConsume();
            remainMinConsume = remainMinConsume < 0 ? 0 : remainMinConsume;

            //如果实际消费已经超过低消就不需要再撤销低消了.
            if(remainMinConsume <= 0){
                response.setSucceed(false);
                response.setMessage("实际消费已经超过低消");
                return response;
            }

            //账单清除低消
            CallConsumeService.updateMinConsume(callConsumeId,0,0);
            CallConsumeService.updateRemainMinConsume(callConsumeId,0,0);

            //账户欠费冲销
            SystemUser proxy =AccountService.getProxy(accountId);
            if(proxy!=null){
                List<AccountOweFee> accountOweFeeList = AccountOweFeeService.findByOrderNoTypeStatus(callConsumeId,Constants.PROXY_OWE_FEE_TYPE_MINCONSUME,Constants.PROXY_OWE_FEE_STATUS_NO_DEAL);
                if(accountOweFeeList != null && accountOweFeeList.size()>0){
                    AccountOweFee accountOweFee = accountOweFeeList.get(0);
                    AccountOweFeeService.setOweFeeDeal(accountOweFee.getId());
                }
            }

            //加余额
            // AccountService.incrBalance2Account(accountId,remainMinConsume);
            ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountId, remainMinConsume);
            if (consumeRes.hasConsumeFinanceAccount) {
                CallConsumeService.bindFinanceAccount(callConsume.getId(), consumeRes.paidAccount.get("_id").toString());
            }

            //报表冲销
            EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_MINCONSUME,accountId)
                    .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,Constants.PRODUCT_CC)
                    .addBusinessItem(EventBusinessField.CHARGE_MONEY,- remainMinConsume));
            //累计消费
            AccountService.incrConsume(accountId,-remainMinConsume);

            response.setSucceed(true);
        }catch(Exception e){
            e.printStackTrace();
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    /**
     * 扣除总机号码月租
     * @param account
     */
    private  void deductZJNumFee(String account){
        String curretnTime=Utils.getCurrentDate();
        String currentMonth=Utils.getDate("yyyy-MM");
        log.info("start deduct "+account+" zjNum: " + currentMonth + "[" + Utils.getCurrentDate() + "]");

        DBObject product=MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,new BasicDBObject("_id",account+"_zj"));

        if(product!=null){
            long concurrentPrice=product.get("concurrentPrice")==null?Fields.ConcurrentPrice: (long)Double.parseDouble(String.valueOf(product.get("concurrentPrice")));

            //处理号码的停用和减并发请求，统计在用号码总金额
            long numFee=0l;//号码总费用
            long numMinFee=0l;//代理返利部分
            List<String> useNumList=new ArrayList<String>();
            //isOld 旧的遗留数据
            List<DBObject> nums = MongoProvider.find("platform_serviceNum", new BasicDBObject("account", account).append("product", "zj").append("type", "normal").append("isOld", null)
                    , new BasicDBObject("monthRent", 1).append("monthRentProxy", 1).append("concurrent", 1).append("concurrentNew", 1).append("status", 1).append("failNum", 1).append("planFlag", 1));
            //汇总在用号码总价
            for(DBObject num:nums){
                String id=(String)num.get("_id");
                String status=(String)num.get("status");
                String planFlag=(String)num.get("planFlag");
                long monthRent=Double.valueOf(String.valueOf(num.get("monthRent"))).longValue();
                long monthRentProxy=Double.valueOf(String.valueOf(num.get("monthRentProxy")==null?100000:num.get("monthRentProxy"))).longValue();
                int concurrent=Integer.parseInt(String.valueOf(num.get("concurrent")==null?1:num.get("concurrent")));
                if("use".equals(status)){
                    if("stop".equals(planFlag)) {
                        countSnFailNum(id);
                        //stop num  ,同步acs并发
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "serviceNumEnd");
                        notify.put("account", account);
                        notify.put("num", id);
                        MongoProvider.insert("bill_notify", notify);
                    }else if("sysStop".equals(planFlag)){
                        countSnFailNum(id);
                        //stop num  ,同步acs并发
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "serviceNumEnd");
                        notify.put("account", account);
                        notify.put("num", id);
                        MongoProvider.insert("bill_notify", notify);
                    }else if("reduce".equals(planFlag)){
                        int concurrentNew=Integer.parseInt(String.valueOf(num.get("concurrentNew")));
                        long concurrentFee= concurrentPrice*(concurrentNew-1);
                        long concurrentMinFee= Fields.ConcurrentPrice*(concurrentNew-1);
                        //clear reduce info
                        DBObject _set = new BasicDBObject();
                        //                                _set.put("concurrentNew",0);
                        _set.put("concurrent",concurrentNew);
                        _set.put("planFlag","");
                        MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",id),new BasicDBObject("$set",_set));
                        //同步acs并发
                        DBObject notify = new BasicDBObject();
                        notify.put("_id", Utils.getUniqueid());
                        notify.put("type", "reduceConcurrent");
                        notify.put("concurrent", concurrentNew);
                        notify.put("num", id);
                        MongoProvider.insert("bill_notify", notify);

                        numFee+=(monthRent+concurrentFee);
                        numMinFee+=(monthRent-monthRentProxy)+(concurrentFee-concurrentMinFee);
                        useNumList.add(id);
                    }else{
                        long concurrentFee= concurrentPrice*(concurrent-1);
                        long concurrentMinFee= Fields.ConcurrentPrice*(concurrent-1);
                        numFee+=(monthRent+concurrentFee);
                        numMinFee+=(monthRent-monthRentProxy)+(concurrentFee-concurrentMinFee);
                        useNumList.add(id);
                    }
                }else if("stop".equals(status)){
                    countSnFailNum(id);
                }
            }
            DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account),new BasicDBObject("balance",1).append("createMethod",1).append("createUser", 1));
            long overdraw=accDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accDB.get("overdraw"))).longValue();

//            String createMethod=(String)accDB.get("createMethod");
//            String createUser=(String)accDB.get("createUser");
            //获取代理
            SystemUser proxy =AccountService.getProxy(account);
            String createUser = proxy==null ? null : proxy.getId();

            DBObject proxyUser=null;
            String proxyId="";
            String proxyIncome="0";
            if(createUser != null){
                proxyUser=MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", createUser));
                proxyId=createUser;
            }

            if(useNumList.size()>0 && numFee>0){
                long _balance=0l;
                DBObject _set = new BasicDBObject();
                _set.put("$inc",new BasicDBObject("balance",-numFee));

                // 扣余额
                // DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_set,false);
                ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(account, -(double)numFee);
                DBObject _accDB = consumeRes.normalAccount;
                _balance=Double.valueOf(String.valueOf(consumeRes.paidAccount.get("balance"))).longValue()+overdraw;

                if(_balance>=0){
                    //给代理结算
                    if(proxyUser!=null){
                        long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                        long consume = numMinFee*percent/100;
                        proxyIncome=Utils.formatRound2Money(consume);
                        DBObject _setProxy = new BasicDBObject();
                        _setProxy.put("$inc",new BasicDBObject("balance",consume));
                        DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                        //生成代理收入记录
                        String orderNoProxy="Ti"+ IDGenerator.getNext(6);
                        _insertProxyIncome(_proxyDB,deductMonthRent,consume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,0);
                    }
                    //消费记录
                    String userPayId = _insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"zj");
                    if (consumeRes.hasConsumeFinanceAccount) {
                        AccountService.bindFinanceAccountToUserPay(userPayId, consumeRes.paidAccount.get("_id").toString());
                    }
                }else{
                    //消费记录
                    String orderNo=_insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"zj");
                    if (consumeRes.hasConsumeFinanceAccount) {
                        AccountService.bindFinanceAccountToUserPay(orderNo, consumeRes.paidAccount.get("_id").toString());
                    }
                    //生成一条代理的欠费记录
                    if(proxyUser!=null){
                        long _balance2=Math.abs(_balance);
                        long actualFee=numFee>_balance2?_balance2:numFee;
                        long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                        long proxyFee = numMinFee*percent/100;
                        //todo 透支
                        long consume =proxyFee*actualFee/numFee;
                        String orderNoProxy="Ti"+ IDGenerator.getNext(6);

                        DBObject owe = new BasicDBObject();
                        owe.put("fee",-actualFee);
                        owe.put("proxyFee",Math.abs(consume));
                        owe.put("account",account);
                        owe.put("proxy",createUser);
                        owe.put("type","monthRent");
                        owe.put("createTime",Utils.getCurrentDate());
                        owe.put("status","nodeal");
                        owe.put("orderNo",orderNo);
                        owe.put("product", "zj");
                        owe.put("incomeId", orderNoProxy);
                        MongoProvider.insert("bill_data","platform_account_owe_fee",owe);

                        long currentConsume = proxyFee*(numFee-actualFee)/numFee;
                        DBObject _setProxy = new BasicDBObject();
                        _setProxy.put("$inc",new BasicDBObject("balance",currentConsume));
                        DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                        //生成代理收入记录
                        _insertProxyIncome(_proxyDB,deductMonthRent,currentConsume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,actualFee);
                    }
                    //累计欠费次数，更新状态为预停用
                    DBObject _inc = new BasicDBObject();
                    _inc.put("failNum",1);
                    DBObject _setNum = new BasicDBObject();
                    _setNum.put("planFlag", "sysStop");
                    MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                            new BasicDBObject("$inc", _inc).append("$set", _setNum));
                }

                // dialAlert(_accDB,_balance);
                dialAlert(consumeRes.paidAccount, _balance);

                //累加账单月租
                syncZJMonthConcume2(account, numFee, consumeRes);
            }
        }
    }

    /**
     * 扣CC号码月租
     */
    private  void deductCCNumFee(String account){
        String curretnTime=Utils.getCurrentDate();
        String currentMonth=Utils.getDate("yyyy-MM");
        log.info("start deduct ccNum: " + currentMonth + "[" + Utils.getCurrentDate() + "]");

        //处理号码的停用请求，统计在用号码总金额
        long numFee=0l;//号码总费用
        long numMinFee=0l;//代理返利部分
        List<String> useNumList=new ArrayList<String>();
        //isOld 旧的遗留数据
        List<DBObject> nums = MongoProvider.find("platform_serviceNum", new BasicDBObject("account", account).append("product", "cc").append("type", "normal").append("isOld", null)
                , new BasicDBObject("monthRent", 1).append("monthRentProxy", 1).append("status", 1).append("failNum", 1).append("planFlag", 1));
        //汇总在用号码总价
        for(DBObject num:nums){
            String id=(String)num.get("_id");
            String status=(String)num.get("status");
            String planFlag=(String)num.get("planFlag");

            long monthRent=Double.valueOf(String.valueOf(num.get("monthRent"))).longValue();
            long monthRentProxy=Double.valueOf(String.valueOf(num.get("monthRentProxy")==null?100000:num.get("monthRentProxy"))).longValue();
            if("use".equals(status)){
                if("stop".equals(planFlag)) {
                    countSnFailNum(id);
                    //stop num  ,同步acs并发
                    DBObject notify = new BasicDBObject();
                    notify.put("_id", Utils.getUniqueid());
                    notify.put("type", "serviceNumEnd");
                    notify.put("account", account);
                    notify.put("num", id);
                    MongoProvider.insert("bill_notify", notify);
                }else if("sysStop".equals(planFlag)){
                    countSnFailNum(id);
                    //stop num  ,同步acs并发
                    DBObject notify = new BasicDBObject();
                    notify.put("_id", Utils.getUniqueid());
                    notify.put("type", "serviceNumEnd");
                    notify.put("account", account);
                    notify.put("num", id);
                    MongoProvider.insert("bill_notify", notify);
                }else{
                    numFee+=monthRent;
                    numMinFee+=monthRent-monthRentProxy;
                    useNumList.add(id);
                }
            }else if("stop".equals(status)){
                countSnFailNum(id);
            }
        }

        DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account),new BasicDBObject("balance",1).append("createMethod",1).append("createUser", 1));
        long balance=Double.valueOf(String.valueOf(accDB.get("balance"))).longValue();
        long overdraw=accDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accDB.get("overdraw"))).longValue();
        long actualBalance=balance+overdraw;

//        String createMethod=(String)accDB.get("createMethod");
//        String createUser=(String)accDB.get("createUser");
        //获取代理
        SystemUser proxy =AccountService.getProxy(account);
        String createUser = proxy==null ? null : proxy.getId();

        DBObject proxyUser=null;
        String proxyId="";
        String proxyIncome="0";
        if(createUser != null){
            proxyUser=MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", createUser));
            proxyId=createUser;
        }
        long _balance=actualBalance;
        if(useNumList.size()>0 && numFee>0){
            DBObject _set = new BasicDBObject();
            _set.put("$inc",new BasicDBObject("balance",-numFee));

            // 扣余额
            // DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_set,false);
            AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(account, -numFee);
            DBObject _accDB = consumeRes.normalAccount;
            // _balance=Double.valueOf(String.valueOf(_accDB.get("balance"))).longValue()+overdraw;
            _balance=Double.valueOf(String.valueOf(consumeRes.paidAccount.get("balance"))).longValue()+overdraw;

            if(_balance>=0){
                //给代理结算
                if(proxyUser!=null){
                    long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                    long consume = numMinFee*percent/100;
                    proxyIncome=Utils.formatRound2Money(consume);
                    DBObject _setProxy = new BasicDBObject();
                    _setProxy.put("$inc",new BasicDBObject("balance",consume));
                    DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                    //生成代理收入记录
                    String orderNoProxy="Ti"+ IDGenerator.getNext(6);
                    _insertProxyIncome(_proxyDB,deductMonthRent,consume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,0);
                }
                //消费记录
                String userPayId = _insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"cc");
                if (consumeRes.hasConsumeFinanceAccount) {
                    AccountService.bindFinanceAccountToUserPay(userPayId, consumeRes.paidAccount.get("_id").toString());
                }
            }else{
                //消费记录
                String orderNo=_insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"cc");
                if (consumeRes.hasConsumeFinanceAccount) {
                    AccountService.bindFinanceAccountToUserPay(orderNo, consumeRes.paidAccount.get("_id").toString());
                }
                //生成一条代理的欠费记录
                if(proxyUser!=null){
                    long _balance2=Math.abs(_balance);
                    long actualFee=numFee>_balance2?_balance2:numFee;
                    long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                    long proxyFee = numMinFee*percent/100;
                    long consume =proxyFee*actualFee/numFee;
                    String orderNoProxy="Ti"+ IDGenerator.getNext(6);

                    DBObject owe = new BasicDBObject();
                    owe.put("fee",-actualFee);
                    owe.put("proxyFee",Math.abs(consume));
                    owe.put("account",account);
                    owe.put("proxy",createUser);
                    owe.put("type","monthRent");
                    owe.put("createTime",Utils.getCurrentDate());
                    owe.put("status","nodeal");
                    owe.put("orderNo",orderNo);
                    owe.put("product", "cc");
                    owe.put("incomeId", orderNoProxy);
                    MongoProvider.insert("bill_data","platform_account_owe_fee",owe);

                    long currentConsume = proxyFee*(numFee-actualFee)/numFee;
                    DBObject _setProxy = new BasicDBObject();
                    _setProxy.put("$inc",new BasicDBObject("balance",currentConsume));
                    DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                    //生成代理收入记录
                    _insertProxyIncome(_proxyDB,deductMonthRent,currentConsume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,actualFee);
                }
                //累计欠费次数，更新状态为预停用
                DBObject _inc = new BasicDBObject();
                _inc.put("failNum",1);
                DBObject _setNum = new BasicDBObject();
                _setNum.put("planFlag", "sysStop");
                MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                        new BasicDBObject("$inc", _inc).append("$set", _setNum));
            }

            // dialAlert(_accDB,_balance);
            dialAlert(consumeRes.paidAccount,_balance);
            //累加账单月租
            syncCCMonthConcume2(account,numFee, consumeRes);
        }

        //账号自动扣费不足累加次数
        if(_balance<0){
            DBObject _inc = new BasicDBObject();
            _inc.put("failNum", 1);//每次都累加
            MongoProvider.update(BillMaster.DB_ACCOUNT, new BasicDBObject("_id", account),new BasicDBObject("$inc", _inc));
        }

//        log.info("end deduct ccNum: " + currentMonth + "[" + Utils.getCurrentDate() + "]");
    }

    public static void countSnFailNum(String num){
        DBObject _set = new BasicDBObject();
        _set.put("failNum",1);
        MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",num),new BasicDBObject("$inc",_set));
    }

    /**
     * 话费预警
     * @param accDB
     * @param _balance
     */
    public static void dialAlert(DBObject accDB,long _balance){
        String account = (String) accDB.get("_id");
        int notifyNum=accDB.get("notifyNum")==null?0:Integer.parseInt(String.valueOf(accDB.get("notifyNum")));
        long dialAlert = Long.valueOf(String.valueOf(accDB.get("dialAlert")==null?"0":accDB.get("dialAlert")))*10000;

        if(_balance>0 && _balance<=dialAlert && notifyNum==0 ){
            _insertNotify(account,"",_balance,dialAlert);
        }else if(_balance<=0 && notifyNum<=1){
            _insertOweFeeNotify(account,"",_balance);
        }
    }




    /**
     * 扣cc低消 （作废）
     * @param account
     * @param minConsume
     * @param num400
     * @param billID
     * @param product
     * @param productId
     * @param collection
     */
    private static void deductCCMinConsume(String account,long minConsume,String num400,String billID,
                                           String product,String productId,String collection){
        num400=num400==null?"":num400;
        DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account));
        //String createMethod=(String)accDB.get("createMethod");
        //String createUser=(String)accDB.get("createUser");
        //获取代理
        SystemUser proxy =AccountService.getProxy(account);
        String createUser = proxy==null ? null : proxy.getId();

        long balance=Long.parseLong(String.valueOf(accDB.get("balance")));
        long overdraw=accDB.get("overdraw")==null?0l:Long.valueOf(String.valueOf(accDB.get("overdraw")));
        long actualBalance=balance+overdraw;

        DBObject productDB=MongoProvider.findOne(collection,new BasicDBObject("_id",productId));
        long giveMinute = Long.valueOf(String.valueOf(productDB.get("giveMinute")==null?"0":productDB.get("giveMinute")));

        if("cc".equals(product) && giveMinute>0){ //cc赠送分钟数
            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(new BasicDBObject().append("_id", billID),
                    new BasicDBObject("$set",new BasicDBObject("giveMinute",giveMinute).append("presentMinute",giveMinute)),false,false,WriteConcern.SAFE);
        }

        long _balance=0l;
        if(minConsume<=actualBalance){
            DBObject _productInc=new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -minConsume));
            // 废弃
            DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_productInc,false);
            _balance=Long.parseLong(String.valueOf(_accDB.get("balance")));
        }else{
            DBObject _productInc=new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -minConsume));
            // 废弃
            DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_productInc,false);
            _balance=Long.parseLong(String.valueOf(_accDB.get("balance")));
            //生成一条代理的欠费记录
            if (createUser != null) {
                DBObject owe = new BasicDBObject();
                owe.put("fee", _balance);
                owe.put("proxyFee", 0);
                owe.put("minConsume", minConsume);
                owe.put("account", account);
                owe.put("proxy", createUser);
                owe.put("type", "minConsume");
                owe.put("num400", num400);
                owe.put("createTime", Utils.getCurrentDate());
                owe.put("status", "nodeal");
                owe.put("orderNo", billID);
                owe.put("product", "cc");

                MongoProvider.insert("bill_data", "platform_account_owe_fee", owe);
            }
//            DBObject _inc = new BasicDBObject();
//            _inc.put("failNum", 1);//每次都累加
//            MongoProvider.update(collection, new BasicDBObject("_id", productId),new BasicDBObject("$inc", _inc));
        }
        long notifyNum=Long.parseLong(String.valueOf(productDB.get("notifyNum")==null?"0":productDB.get("notifyNum")));
        long dialAlertCC = Long.valueOf(String.valueOf(accDB.get("dialAlertCC")==null?"0":accDB.get("dialAlertCC")))*10000;
        long dialAlert400 = Long.valueOf(String.valueOf(accDB.get("dialAlert400")==null?"0":accDB.get("dialAlert400")))*10000;
        if (product.equals("400")){
            if(_balance>0 && _balance<=dialAlert400 && notifyNum==0){
                AccountBillTask._insertNotify(collection, productId, account, product, _balance, dialAlert400);
            }else if(_balance<=0 && notifyNum<=1){
                AccountBillTask._insertOweFeeNotify(collection, productId, account, product, _balance);
            }
        }else{
            if(_balance>0 && _balance<=dialAlertCC && notifyNum==0){
                AccountBillTask._insertNotify(collection, productId, account, product, _balance, dialAlertCC);
            }else if(_balance<=0 && notifyNum<=1){
                AccountBillTask._insertOweFeeNotify(collection, productId, account, product, _balance);
            }
        }
    }

    /**
     * 扣号码月租       （作废）
     */
    private  void deductZJNumFee2(){
        String curretnTime=Utils.getCurrentDate();
        String currentMonth=Utils.getDate("yyyy-MM");
        log.info("start deduct zjNum: " + currentMonth + "[" + Utils.getCurrentDate() + "]");
        boolean hasZJ=true;
        while (hasZJ){
            DBObject query=new BasicDBObject("product","zj");
            query.put("billTime",new BasicDBObject().append("$lt", currentMonth));
            DBObject keys=new BasicDBObject("account",1).append("concurrentPrice",1).append("deductStatus", 1).append("failNum",1).append("notifyNum",1);
            List<DBObject> products=MongoProvider.getConection(BillMaster.DB_ACCOUNT_PRODUCT).find(query,keys).limit(200).toArray();

            if(products!=null && products.size()>0){
                for(DBObject product:products){
                    String productId=(String)product.get("_id");
                    try {
                        String deductStatus=product.get("deductStatus")==null?"":(String)product.get("deductStatus");
                        String account=(String)product.get("account");
                        long concurrentPrice=product.get("concurrentPrice")==null?Fields.ConcurrentPrice:Long.parseLong(String.valueOf(product.get("concurrentPrice")));
                        //处理号码的停用和减并发请求，统计在用号码总金额
                        long numFee=0l;//号码总费用
                        long numMinFee=0l;//代理返利部分
                        List<String> useNumList=new ArrayList<String>();
                        //isOld 旧的遗留数据
                        List<DBObject> nums = MongoProvider.find("platform_serviceNum", new BasicDBObject("account", account).append("product", "zj").append("type", "normal").append("isOld", null)
                                , new BasicDBObject("monthRent", 1).append("monthRentProxy", 1).append("concurrent", 1).append("concurrentNew", 1).append("status", 1).append("failNum", 1).append("planFlag", 1));
                        //汇总在用号码总价
                        for(DBObject num:nums){
                            String id=(String)num.get("_id");
                            String status=(String)num.get("status");
                            String planFlag=(String)num.get("planFlag");
                            long monthRent=Long.parseLong(String.valueOf(num.get("monthRent")));
                            long monthRentProxy=Long.parseLong(String.valueOf(num.get("monthRentProxy")==null?100000:num.get("monthRentProxy")));
                            int concurrent=Integer.parseInt(String.valueOf(num.get("concurrent")==null?1:num.get("concurrent")));
                            if("use".equals(status)){
                                if("stop".equals(planFlag)) {
                                    //stop num  ,同步acs并发
                                    DBObject notify = new BasicDBObject();
                                    notify.put("_id", Utils.getUniqueid());
                                    notify.put("type", "serviceNumEnd");
                                    notify.put("account", account);
                                    notify.put("num", id);
                                    MongoProvider.insert("bill_notify", notify);
                                }else if("sysStop".equals(planFlag)){
                                    DBObject _set = new BasicDBObject();
                                    _set.put("failNum",1);
                                    MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",id),new BasicDBObject("$inc",_set));

                                    //stop num  ,同步acs并发
                                    DBObject notify = new BasicDBObject();
                                    notify.put("_id", Utils.getUniqueid());
                                    notify.put("type", "serviceNumEnd");
                                    notify.put("account", account);
                                    notify.put("num", id);
                                    MongoProvider.insert("bill_notify", notify);
                                }else if("reduce".equals(planFlag)){
                                    int concurrentNew=Integer.parseInt(String.valueOf(num.get("concurrentNew")));
                                    long concurrentFee= concurrentPrice*(concurrentNew-1);
                                    long concurrentMinFee= Fields.ConcurrentPrice*(concurrentNew-1);
                                    //clear reduce info
                                    DBObject _set = new BasicDBObject();
    //                                _set.put("concurrentNew",0);
                                    _set.put("concurrent",concurrentNew);
                                    _set.put("planFlag","");
                                    MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",id),new BasicDBObject("$set",_set));
                                    //同步acs并发
                                    DBObject notify = new BasicDBObject();
                                    notify.put("_id", Utils.getUniqueid());
                                    notify.put("type", "reduceConcurrent");
                                    notify.put("concurrent", concurrentNew);
                                    notify.put("num", id);
                                    MongoProvider.insert("bill_notify", notify);

                                    numFee+=(monthRent+concurrentFee);
                                    numMinFee+=(monthRent-monthRentProxy)+(concurrentFee-concurrentMinFee);
                                    useNumList.add(id);
                                }else{
                                    long concurrentFee= concurrentPrice*(concurrent-1);
                                    long concurrentMinFee= Fields.ConcurrentPrice*(concurrent-1);
                                    numFee+=(monthRent+concurrentFee);
                                    numMinFee+=(monthRent-monthRentProxy)+(concurrentFee-concurrentMinFee);
                                    useNumList.add(id);
                                }
                            }else if("stop".equals(status)){
                                DBObject _set = new BasicDBObject();
                                _set.put("failNum",1);
                                MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",id),new BasicDBObject("$inc",_set));
                            }
                        }

                        DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account),new BasicDBObject("balance",1).append("createMethod",1).append("createUser", 1));
                        long balance=Long.parseLong(String.valueOf(accDB.get("balance")));
                        long overdraw=accDB.get("overdraw")==null?0l:Long.valueOf(String.valueOf(accDB.get("overdraw")));
                        long actualBalance=balance+overdraw;

//                        String createMethod=(String)accDB.get("createMethod");
//                        String createUser=(String)accDB.get("createUser");
                        //获取代理
                        SystemUser proxy =AccountService.getProxy(account);
                        String createUser = proxy==null ? null : proxy.getId();

                        DBObject proxyUser=null;
                        String proxyId="";
                        String proxyIncome="0";
                        if(createUser != null){
                            proxyUser=MongoProvider.findOne("bill_system_user", new BasicDBObject("_id", createUser));
                            proxyId=createUser;
                        }

//                    log.info("deductZJNumFee product deductStatus======="+deductStatus);
                        if(useNumList.size()>0){
                            if("prevStop".equals(deductStatus)) {//扣低消后余额不足(增加为0的情况)
                                if(numFee>0){
                                    DBObject _set = new BasicDBObject();
                                    _set.put("$inc",new BasicDBObject("balance",-numFee));
                                    // 废弃
                                    DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_set,false);
                                    //消费记录
                                    String orderNo=_insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"zj");
                                    //生成一条代理的欠费记录
                                    if(proxyUser!=null){
                                        long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                                        long consume = numMinFee*percent/100;
                                        DBObject owe = new BasicDBObject();
                                        owe.put("fee",-numFee);
                                        owe.put("proxyFee",consume);
                                        owe.put("account",account);
                                        owe.put("proxy",createUser);
                                        owe.put("type","monthRent");
                                        owe.put("createTime",curretnTime);
                                        owe.put("status","nodeal");
                                        owe.put("orderNo",orderNo);
                                        owe.put("product", "zj");
                                        owe.put("incomeId", "");
                                        MongoProvider.insert("bill_data","platform_account_owe_fee",owe);
                                    }
                                }

                                //累计欠费次数，更新状态为预停用
                                DBObject _inc = new BasicDBObject();
                                _inc.put("failNum",1);
                                DBObject _setNum = new BasicDBObject();
                                _setNum.put("planFlag", "sysStop");
                                MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                                        new BasicDBObject("$inc", _inc).append("$set", _setNum));
                            }else if("stop".equals(deductStatus)){    //扣低消账号余额为0或负
                                DBObject _inc = new BasicDBObject();
                                _inc.put("failNum",1);
                                DBObject _setNum = new BasicDBObject();
                                _setNum.put("status", "stop");
                                _setNum.put("planFlag", "");
                                MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                                        new BasicDBObject("$inc", _inc).append("$set", _setNum));
                                numFee=0l;//reset num totalFee
                                for(String id:useNumList){
                                    //stop num  ,同步acs并发
                                    DBObject notify = new BasicDBObject();
                                    notify.put("_id", Utils.getUniqueid());
                                    notify.put("type", "serviceNumEnd");
                                    notify.put("account", account);
                                    notify.put("num", id);
                                    MongoProvider.insert("bill_notify", notify);
                                }
                            }else{   //扣低消账号余额大于0
                                long _balance=0l;
                                if(numFee<=actualBalance){
                                    if(numFee>0){
                                        DBObject _set = new BasicDBObject();
                                        _set.put("$inc",new BasicDBObject("balance",-numFee));
                                        // 废弃
                                        DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_set,false);
                                        _balance=Long.parseLong(String.valueOf(_accDB.get("balance")));
                                        //给代理结算
                                        if(proxyUser!=null){
                                            long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                                            long consume = numMinFee*percent/100;
                                            proxyIncome=Utils.formatRound2Money(consume);
                                            DBObject _setProxy = new BasicDBObject();
                                            _setProxy.put("$inc",new BasicDBObject("balance",consume));
                                            DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                                            //生成代理收入记录
                                            String orderNoProxy="Ti"+ IDGenerator.getNext(6);
                                            _insertProxyIncome(_proxyDB,deductMonthRent,consume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,0);
                                        }
                                        //消费记录
                                        _insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"zj");
                                    }
                                }else{
                                    if(actualBalance>0){ //扣为负数
                                        DBObject _set = new BasicDBObject();
                                        _set.put("$inc",new BasicDBObject("balance",-numFee));
                                        // 废弃
                                        DBObject _accDB= MongoProvider.findAndModify("platform_account",new BasicDBObject("_id", account),_set,false);
                                        _balance=Long.parseLong(String.valueOf(_accDB.get("balance")));
                                        //消费记录
                                        String orderNo=_insertUserPay(_accDB,deductMonthRent,numFee,Arrays.toString(useNumList.toArray()),proxyIncome,proxyId,"zj");
                                        //生成一条代理的欠费记录
                                        if(proxyUser!=null){
                                            long percent=Long.valueOf(String.valueOf(proxyUser.get("monthRentPercent")==null?0:proxyUser.get("monthRentPercent")));
                                            long proxyFee = numMinFee*percent/100;
                                            //                                    long consume = _balance*percent/100;
                                            long consume =proxyFee*_balance/numFee;
                                            String orderNoProxy="Ti"+ IDGenerator.getNext(6);

                                            DBObject owe = new BasicDBObject();
                                            owe.put("fee",_balance);
                                            owe.put("proxyFee",Math.abs(consume));
                                            owe.put("account",account);
                                            owe.put("proxy",createUser);
                                            owe.put("type","monthRent");
                                            owe.put("createTime",Utils.getCurrentDate());
                                            owe.put("status","nodeal");
                                            owe.put("orderNo",orderNo);
                                            owe.put("product", "zj");
                                            owe.put("incomeId", orderNoProxy);
                                            MongoProvider.insert("bill_data","platform_account_owe_fee",owe);

                                            //                                    long currentConsume = (numFee+_balance)*percent/100;
                                            long currentConsume = proxyFee*(numFee+_balance)/numFee;
                                            DBObject _setProxy = new BasicDBObject();
                                            _setProxy.put("$inc",new BasicDBObject("balance",currentConsume));
                                            DBObject _proxyDB= MongoProvider.findAndModify("bill_system_user",new BasicDBObject("_id", createUser),_setProxy,false);
                                            //生成代理收入记录
                                            _insertProxyIncome(_proxyDB,deductMonthRent,currentConsume,Arrays.toString(useNumList.toArray()),account,orderNoProxy,Math.abs(_balance));
                                        }
                                        //累计欠费次数，更新状态为预停用
                                        DBObject _inc = new BasicDBObject();
                                        _inc.put("failNum",1);
                                        DBObject _setNum = new BasicDBObject();
                                        _setNum.put("planFlag", "sysStop");
                                        MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                                                new BasicDBObject("$inc", _inc).append("$set", _setNum));

                                    }else{   //无余额直接停用号码
                                        DBObject _inc = new BasicDBObject();
                                        _inc.put("failNum",1);
                                        DBObject _setNum = new BasicDBObject();
                                        _setNum.put("status", "stop");
                                        _setNum.put("planFlag", "");
                                        MongoProvider.batchUpdate("platform_serviceNum", new BasicDBObject("_id", new BasicDBObject("$in", useNumList)),
                                                new BasicDBObject("$inc", _inc).append("$set", _setNum));
                                        numFee=0l;//reset num totalFee
                                        for(String id:useNumList){
                                            //stop num  ,同步acs并发
                                            DBObject notify = new BasicDBObject();
                                            notify.put("_id", Utils.getUniqueid());
                                            notify.put("type", "serviceNumEnd");
                                            notify.put("account", account);
                                            notify.put("num", id);
                                            MongoProvider.insert("bill_notify", notify);
                                        }
                                    }
                                }

                                long dialAlertZJ = Long.valueOf(String.valueOf(accDB.get("dialAlertZJ")==null?"0":accDB.get("dialAlertZJ")))*10000;
                                int notifyNum=product.get("notifyNum")==null?0:Integer.parseInt(String.valueOf(product.get("notifyNum")));
                                _balance+=overdraw;
                                if(_balance>0 && _balance<=dialAlertZJ && notifyNum==0 ){
                                    _insertNotify(account,"zj",_balance,dialAlertZJ);
                                }else if(_balance<=0 && notifyNum<=1){
                                    _insertOweFeeNotify(account,"zj",_balance);
                                }
                            }
                        }

                        //累加账单月租(废弃)
                        syncZJMonthConcume2(account,numFee);
                        DBObject _setProduct = new BasicDBObject("billTime", currentMonth);
                        MongoProvider.updateOne(BillMaster.DB_ACCOUNT_PRODUCT, new BasicDBObject("_id", productId), new BasicDBObject("$set", _setProduct), WriteConcern.SAFE);
                    } catch (Exception e) {
                        log.log(Level.WARNING,"deduct zjNum ["+productId+"] error!",e);
                        e.printStackTrace();
                    }
                }
            }else{
                hasZJ = false;
            }
        }
        log.info("end deduct zjNum: " + currentMonth + "[" + Utils.getCurrentDate() + "]");
    }


    public static void _insertNotify(String productTable,String productId,String account,String product,long balance,long limit){
        DBObject _set= new BasicDBObject();
        _set.put("$inc", new BasicDBObject("notifyNum", 1));
        MongoProvider.update(productTable,new BasicDBObject("_id",productId),_set);
        MongoProvider.insert("bill_notify", new BasicDBObject()
                .append("type", "dialAlert")
                .append("account", account)
                .append("product", product)
                .append("balance", balance / 10000.0+"")
                .append("limit", limit / 10000.0+""));
    }
    public static void _insertOweFeeNotify(String productTable,String productId,String account,String product,long balance){
        DBObject _set= new BasicDBObject();
        _set.put("$inc", new BasicDBObject("notifyNum", 1));
        MongoProvider.update(productTable,new BasicDBObject("_id",productId),_set);
        MongoProvider.insert("bill_notify", new BasicDBObject()
                .append("type", "oweAlert")
                .append("account", account)
                .append("product", product)
                .append("balance", balance / 10000.0+""));
    }
    public static void _insertNotify(String account,String product,long balance,long limit){
        DBObject _set= new BasicDBObject();
        _set.put("$inc", new BasicDBObject("notifyNum", 1));
        MongoProvider.update("platform_account",new BasicDBObject("_id",account),_set);

        MongoProvider.insert("bill_notify", new BasicDBObject()
                .append("type", "dialAlert")
                .append("account", account)
                .append("product", product)
                .append("balance", balance / 10000.0+"")
                .append("limit", limit / 10000.0+""));
    }
    public static void _insertOweFeeNotify(String account,String product,long balance){
        DBObject _set= new BasicDBObject();
        _set.put("$inc", new BasicDBObject("notifyNum", 1));
        MongoProvider.update("platform_account",new BasicDBObject("_id",account),_set);

        MongoProvider.insert("bill_notify", new BasicDBObject()
                .append("type", "oweAlert")
                .append("account", account)
                .append("product", product)
                .append("balance", balance / 10000.0+""));
    }
    public static String _insertUserPay(DBObject accDB,String flag,long totalFee,String nums,String income,String proxy,String product){
        String curretnTime=Utils.getCurrentDate();
        String _balance=Utils.formatRound2Money(Double.valueOf(String.valueOf(accDB.get("balance"))).longValue());
        String _totalFee=Utils.formatRound2Money(totalFee);
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
        temp.put("product",product);
        DBObject sn = new BasicDBObject();
        sn.put("serviceno",nums);
        temp.put("sn", sn);
        temp.put("income",income);
        temp.put("proxy",proxy);
        temp.put("currentBalance",_balance);
        temp.put("timestamp",System.currentTimeMillis());
        MongoProvider.insert("zj","user_pay",temp);
        return orderNo;
    }
    public static void _insertProxyIncome(DBObject proxyDB,String flag,long totalFee,String nums,String account,String incomeId,long oweFee){
        String income=Utils.formatRound2Money(totalFee);
        String _oweFee=Utils.formatRound2Money(oweFee);
        String _balanceProxy=Utils.formatRound2Money(Double.valueOf(String.valueOf(proxyDB.get("balance"))).longValue());
        String curretnTime=Utils.getCurrentDate();

        DBObject tempProxy=new BasicDBObject();
//        String orderNoProxy="Ti"+ IDGenerator.getNext(6);
        tempProxy.put("_id",incomeId);
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
        snProxy.put("oweMin", _oweFee);
        snProxy.put("serviceno",nums);
        tempProxy.put("sn", snProxy);
        tempProxy.put("timestamp",System.currentTimeMillis());

        MongoProvider.insert("bill_user_pay",tempProxy);
    }

    /**
     * for yy-server
     * @param action
     * @return
     */
    public static C5Response syncZJMonthConcume(C5Action action ){
        C5Response response = new C5Response(action);
        String billID="";
        try{
            String account = action.getStringValue("account");
            long monthRent=Long.valueOf(action.getStringValue("monthRent"));
            String product="zj";
            String currentMonth = Utils.getDate("yyyy-MM");
            billID= account + "_" + currentMonth + "_"+product ;

            // 获取当月账单
            DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).findOne(
                    new BasicDBObject().append("_id", billID));
            if(bill == null) {
                DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account));
                AccountBillTask.createBill(accDB, currentMonth, product, "", 0);
            }
            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc", new BasicDBObject()
                            .append("monthRent", monthRent)));

            // 关联财务账户(如果一个账户有财务账户)
            AccountService.bindAccountsFinanceAccountToBillData(BillMaster.DB_CALL_CONSUME, billID, account);

            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "syncZJMonthConcume["+billID+"] failed", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    /**
     * for yy-server
     * @param action
     * @return
     */
    public static C5Response syncCCMonthConcume(C5Action action ){
        C5Response response = new C5Response(action);
        String billID="";
        try{
            String account = action.getStringValue("account");
            long monthRent=Long.valueOf(action.getStringValue("monthRent"));
            String product="cc";
            String currentMonth = Utils.getDate("yyyy-MM");
            billID= account + "_" + currentMonth + "_"+product ;

            // 获取当月账单
            DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).findOne(
                    new BasicDBObject().append("_id", billID));
            if(bill == null) {
                DBObject accDB=MongoProvider.findOne("platform_account",new BasicDBObject("_id",account));
                AccountBillTask.createBill(accDB, currentMonth, product, "", 0);
            }
            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc", new BasicDBObject()
                            .append("monthRent", monthRent)));

            // 关联财务账户(如果一个账户有财务账户)
            AccountService.bindAccountsFinanceAccountToBillData(BillMaster.DB_CALL_CONSUME, billID, account);

            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "syncCCMonthConcume["+billID+"] failed", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }
    public static void syncZJMonthConcume2(String account,long monthRent ){
            String product="zj";
            String currentMonth = Utils.getDate("yyyy-MM");
            String billID = account + "_" + currentMonth + "_"+product ;

            MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$inc", new BasicDBObject().append("monthRent", monthRent)));

        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_RENT,account)
                        .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,EventBusinessField.CHARGE_PRODUCT_ZJ)
                        .addBusinessItem(EventBusinessField.CHARGE_MONEY,monthRent));
        //累计消费
        AccountService.incrConsume(account,monthRent);

    }
    public static void syncZJMonthConcume2(String account,long monthRent, AccountService.ConsumeFinanceAccountBalanceRes consumeBalanceRes){
        String product="zj";
        String currentMonth = Utils.getDate("yyyy-MM");
        String billID = account + "_" + currentMonth + "_"+product ;

        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc", new BasicDBObject().append("monthRent", monthRent)));

        if (consumeBalanceRes.hasConsumeFinanceAccount) {
            AccountService.bindFinanceAccountToBillData(BillMaster.DB_CALL_CONSUME, billID, consumeBalanceRes.paidAccount.get("_id").toString());
        }

        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_RENT,account)
                .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,EventBusinessField.CHARGE_PRODUCT_ZJ)
                .addBusinessItem(EventBusinessField.CHARGE_MONEY,monthRent));
        //累计消费
        AccountService.incrConsume(account,monthRent);
    }
    public static void syncCCMonthConcume2(String account,long monthRent ){
        String product="cc";
        String currentMonth = Utils.getDate("yyyy-MM");
        String billID = account + "_" + currentMonth + "_"+product ;

        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc", new BasicDBObject().append("monthRent", monthRent)));

        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_RENT,account)
                .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,EventBusinessField.CHARGE_PRODUCT_CC)
                .addBusinessItem(EventBusinessField.CHARGE_MONEY,monthRent));
        //累计消费
        AccountService.incrConsume(account,monthRent);

    }
    public static void syncCCMonthConcume2(String account,long monthRent, AccountService.ConsumeFinanceAccountBalanceRes consumeBalanceRes){
        String product="cc";
        String currentMonth = Utils.getDate("yyyy-MM");
        String billID = account + "_" + currentMonth + "_"+product ;

        MongoConnect.getInstance().getDB("bill_data").getCollection(BillMaster.DB_CALL_CONSUME).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc", new BasicDBObject().append("monthRent", monthRent)));

        if (consumeBalanceRes.hasConsumeFinanceAccount) {
            AccountService.bindFinanceAccountToBillData(BillMaster.DB_CALL_CONSUME, billID, consumeBalanceRes.paidAccount.get("_id").toString());
        }

        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_RENT,account)
                .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,EventBusinessField.CHARGE_PRODUCT_CC)
                .addBusinessItem(EventBusinessField.CHARGE_MONEY,monthRent));
        //累计消费
        AccountService.incrConsume(account,monthRent);

    }



}
