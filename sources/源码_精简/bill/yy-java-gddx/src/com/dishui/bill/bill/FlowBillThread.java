package com.dishui.bill.bill;

import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.db.service.AccountService;
import com.dishui.bill.db.service.CallConsumeService;
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

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class FlowBillThread extends Thread {
	private static Logger log = Logger.getLogger(FlowBillThread.class.getName());

	private static final String PROXY_COLLECTION = "bill_system_user";
    private static final String bill_flow = "bill_flowPackage";
    private static final String bill_flow_repeat = "bill_flow_repeat";
    private static final String bill_flow_consume = "bill_flow_consume";
    private static final int queueMax = 5000;
    private static List<String> flowIds=new ArrayList<String>(queueMax);
    @Override
	public void run() {
		DBObject flowObj = null;
		DBObject condition = new BasicDBObject();
		while (true) {
			try {
                flowObj = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow).findOne(condition);
				if (flowObj == null) {
                    sleep(1000);
					continue;
				}
				String pk = String.valueOf(flowObj.get("_id"));
                if(flowIds.contains(pk)){
                    MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow).remove(
                            new BasicDBObject().append("_id", pk), WriteConcern.SAFE);
                    MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow_repeat).insert(flowObj);
                    continue;
                }else{
                    if(flowIds.size()>=queueMax){
                        flowIds.remove(0);
                    }
                    flowIds.add(pk);
                }
				String accountID = String.valueOf(flowObj.get("account"));
                FeeObject fee = countFee(flowObj);
                charge(accountID,fee, flowObj);

                flowObj.removeField("income");
				MongoConnect.getInstance().getDB("bill_data").getCollection("bill_flow_detail").insert(flowObj);
				MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow).remove(
                        new BasicDBObject().append("_id", flowObj.get("_id")), WriteConcern.SAFE);

			} catch (Exception e) {
				log.log(Level.WARNING, "process sms bill exception! ", e);
				e.printStackTrace();
				if (flowObj != null) {
					try {
						MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow).remove(
								new BasicDBObject().append("_id",flowObj.get("_id")),WriteConcern.SAFE);
						MongoConnect.getInstance().getDB("bill_data").getCollection("bill_flow_error").insert(flowObj);
					} catch (Exception exception) {
						exception.printStackTrace();
					}
				}
				try {
					sleep(1000);
				} catch (Exception exception) {
					exception.printStackTrace();
				}
			}
		}
	}

	private void charge(String accountID,FeeObject fee, DBObject flowObj) {
        String product="ll";
		String currentMonth = Utils.getDate("yyyy-MM");
		String billID = accountID + "_" + currentMonth + "_" + product;
//		String billProductID = accountID+"_"+product;
		// 获取当月账单
		DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow_consume).findOne(
				new BasicDBObject().append("_id", billID));
		
		// 如果没有找到账单，则生成
		if(bill == null) {
            createFlowBill(accountID,currentMonth,product);
			bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow_consume).findOne(
					new BasicDBObject().append("_id", billID));
		}

        long consume=fee.getFee();
//		long discount = fee.getDiscount();
        MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow_consume).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc",new BasicDBObject().append("actualConsume", consume).append("num", 1)));


        EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_FLOW,accountID)
                .addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
                .addBusinessItem(EventBusinessField.CHARGE_MONEY,consume));
        //累计消费
        AccountService.incrConsume(accountID,consume);

        // 扣余额
        // DBObject _setInc= new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -consume));
        // DBObject account=MongoProvider.findAndModify(BillMaster.DB_ACCOUNT,new BasicDBObject().append("_id", accountID),_setInc,false);
        AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountID, -consume);
        if (consumeRes.hasConsumeFinanceAccount) {
            MongoConnect.getInstance().getDB("bill_data").getCollection(bill_flow_consume).update(
                    new BasicDBObject().append("_id", billID),
                    new BasicDBObject().append("$set",new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())));
        }
        DBObject account = consumeRes.paidAccount;

        //检查话费余额，禁止外呼
        if(account != null) {
            long overdraw=account.get("overdraw")==null?0l:Double.valueOf(String.valueOf(account.get("overdraw"))).longValue();
            long balance = Double.valueOf(String.valueOf(account.get("balance"))).longValue();
            balance = balance+overdraw;
			//预警
            AccountBillTask.dialAlert(account,balance);
		}

        //给代理返钱
        SystemUser proxy = AccountService.getProxy(accountID);
        String proxyID = proxy==null ? null : proxy.getId();
        if (proxyID != null) {
            try {
                flowObj.put("proxy", proxyID);
                chargeProxyFee(accountID,proxyID, fee, flowObj);
            }catch (Exception ex){
                ex.printStackTrace();
                log.log(Level.WARNING, "process proxy fee exception! ", ex);
            }
		}

	}
	private FeeObject countFee(DBObject flowObj) {
		FeeObject feeObject = new FeeObject();
		long fee = Long.valueOf(String.valueOf(flowObj.get("fee")==null?0:flowObj.get("fee")));
		feeObject.setFee(fee);
        flowObj.put("consume", fee);
//        flowObj.put("discount", 0);
		return feeObject;
	}

	private void chargeProxyFee(String accountID,String proxyID, FeeObject fee, DBObject flowObj) {
        DBObject sendData= (DBObject) flowObj.get("sendData");
        if(sendData==null)return;
        String flow=(String)sendData.get("sn");
/*
        DBObject productDb = MongoConnect.getInstance().getDB("bill")
                .getCollection("platform_account_product").findOne(new BasicDBObject().append("_id", accountID+"_ll"));
        DBObject custFlowFee = (DBObject) productDb.get("fee");
        if(custFlowFee==null)return;
        long fee1 = Long.valueOf(String.valueOf(custFlowFee.get(flow)));
*/
        long consume = 0l;
		DBObject proxyDb = MongoConnect.getInstance().getDB("bill")
				.getCollection("bill_system_user").findOne(new BasicDBObject().append("_id", proxyID));
        int percent = Integer.valueOf(String.valueOf(proxyDb.get("flowPercent")==null?"0":proxyDb.get("flowPercent")));

        DBObject proxyFlowFee = (DBObject) proxyDb.get("fee");
        if(proxyFlowFee==null)return;
        long fee2 = Long.valueOf(String.valueOf(proxyFlowFee.get(flow)));
        consume = fee.getFee() - fee2;
		long discount=fee.getDiscount();
		if(discount>0){
			consume=consume-discount;
		}
		consume = consume*percent/100;
		consume = consume +discount;//折扣结算给代理

        String proxyIncome= Utils.formatRound2Money(consume);
        DBObject _setProxy = new BasicDBObject();
        _setProxy.put("$inc",new BasicDBObject("balance",consume));
        proxyDb= MongoProvider.findAndModify("bill_system_user", new BasicDBObject("_id", proxyID), _setProxy, false);
        //生成代理收入记录
        _insertProxyIncome(proxyDb,proxyIncome,accountID,flow);
        //消费记录
        DBObject accountDB=MongoProvider.findOne(BillMaster.DB_ACCOUNT, new BasicDBObject().append("_id", accountID));
        _insertUserPay(accountDB, consume, proxyIncome, proxyID, flow);
	}


    public static void _insertProxyIncome(DBObject proxyDB,String income,String account,String flow) {
        String _balanceProxy = Utils.formatRound2Money(Double.valueOf(String.valueOf(proxyDB.get("balance"))).longValue());
        String curretnTime = Utils.getCurrentDate();

        DBObject tempProxy = new BasicDBObject();
        String orderNoProxy = "Ti" + IDGenerator.getNext(6);
        tempProxy.put("_id", orderNoProxy);
        tempProxy.put("status", "pay");
        tempProxy.put("income", income);
        tempProxy.put("account", account);
        tempProxy.put("create_time", curretnTime);
        tempProxy.put("pay_time", curretnTime);
        tempProxy.put("flag", "payFlow");
        tempProxy.put("source", "payFlow");
        tempProxy.put("proxy", proxyDB.get("_id"));
        tempProxy.put("currentBalance", _balanceProxy);
        DBObject snProxy = new BasicDBObject();
        snProxy.put("flow", flow);
        tempProxy.put("sn", snProxy);
        tempProxy.put("timestamp", System.currentTimeMillis());

        MongoProvider.insert("bill_user_pay", tempProxy);
    }
    public static void _insertUserPay(DBObject accDB,long totalFee,String income,String proxy,String flow){
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
        temp.put("flag","payFlow");
        temp.put("totalFee",_totalFee+"");
        temp.put("balance",_totalFee+"");
        temp.put("product","ll");
        DBObject sn = new BasicDBObject();
        sn.put("flow",flow);
        temp.put("sn", sn);
        temp.put("income",income);
        temp.put("proxy",proxy);
        temp.put("currentBalance",_balance);
        temp.put("timestamp",System.currentTimeMillis());
        MongoProvider.insert("zj", "user_pay", temp);
    }

   /* public static void createProxyBill(String proxyID,String currentDate) {
		DBObject bill = new BasicDBObject();
		String billID = proxyID + "_" + currentDate;
		bill.put("_id", billID);
		bill.put("account", proxyID);
		bill.put("year", Utils.getDate("yyyy"));
		bill.put("month", Utils.getDate("MM"));
		bill.put("dd", Utils.getDate("dd"));
		bill.put("date", currentDate);
		bill.put("num", 0l);
		bill.put("income", 0l);
		bill.put("discount", 0l);
		bill.put("createTime", Utils.getCurrentDate());
		MongoConnect.getInstance().getDB("bill").getCollection(bill_flow_proxy_income).insert(bill);
	}*/
	
    public static void createFlowBill(String accountID,String currentMonth,String product) {
        DBObject bill = new BasicDBObject();
        String billID = accountID + "_" + currentMonth + "_" + product;
        bill.put("_id", billID);
        bill.put("account", accountID);
        bill.put("name", product);
        bill.put("year", Utils.getDate("yyyy"));
        bill.put("month", Utils.getDate("MM"));
        bill.put("num", 0);
		bill.put("discount", 0l);
        bill.put("actualConsume", 0);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill_data").getCollection(FlowBillThread.bill_flow_consume).insert(bill);
    }
	private class FeeObject {
		long fee = 0l;
		long discount = 0l;
		public long getFee() {
			return fee;
		}
		public void setFee(long fee) {
			this.fee = fee;
		}
		public  void setDiscount(long discount){
			this.discount = discount;
		}
		public  long getDiscount(){
			return discount;
		}
    }
}
