package com.dishui.bill.bill;

import com.dishui.bill.command.Fields;
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
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SmslBillThread extends Thread {
	private static Logger log = Logger.getLogger(SmslBillThread.class.getName());

	private static final String PROXY_COLLECTION = "bill_system_user";
    private static final String bill_sms_consume = "bill_sms_consume";
    private static final String bill_sms_proxy_income = "bill_sms_proxy_income";
    private static final String bill_sms_proxy_detail = "bill_sms_proxy_detail";
	private static final String platform_sms_channel = "platform_sms_channel";
	private static final String bill_sms_channel = "bill_sms_channel";
	private static final String bill_sms_channel_detail = "bill_sms_channel_detail";

    private static final int queueMax = 5000;
    private static final long smsPrice = 1000l;
    private static List<String> smsIds=new ArrayList<String>(queueMax);
    @Override
	public void run() {
		DBObject smsObj = null;
		DBObject condition = new BasicDBObject();
		while (true) {
			try {
                smsObj = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms").findOne(condition);
				if (smsObj == null) {
                    sleep(1000);
					continue;
				}
				String pk = String.valueOf(smsObj.get("_id"));
                if(smsIds.contains(pk)){
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms").remove(
                            new BasicDBObject().append("_id", pk), WriteConcern.SAFE);
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms_repeat").insert(smsObj);
                    continue;
                }else{
                    if(smsIds.size()>=queueMax){
                        smsIds.remove(0);
                    }
                    smsIds.add(pk);
                }
				String accountID = String.valueOf(smsObj.get("account"));
//				String sendTime = String.valueOf(smsObj.get("reportTime"));
                String product = String.valueOf(smsObj.get("product")==null?Fields.product_cc:smsObj.get("product"));
//                if(Fields.product_zj.equals(product)){
//                    log.warning("暂不支持总机的短信功能");
//                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms_error").insert(smsObj);
//                    continue;
//                }
                String productId=accountID + "_" + product;
                DBObject prod = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,new BasicDBObject().append("_id",productId));
                if(prod != null) {
                    FeeObject fee = countFee(prod, smsObj);
                    charge(accountID, product,fee, smsObj,prod);
                } else {
                    log.warning(productId+" not found!");
                }
                smsObj.removeField("income");
				MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms_detail_"+product).insert(smsObj);
				MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms").remove(
                        new BasicDBObject().append("_id", smsObj.get("_id")), WriteConcern.SAFE);

			} catch (Exception e) {
				log.log(Level.WARNING, "process sms bill exception! ", e);
				e.printStackTrace();
				if (smsObj != null) {
					try {
						MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms").remove(
								new BasicDBObject().append("_id",smsObj.get("_id")),WriteConcern.SAFE);
						MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms_error").insert(smsObj);
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

	private void charge(String accountID,String product,FeeObject fee, DBObject smsObj,DBObject productDB) {
		String currentMonth = Utils.getDate("yyyy-MM");
		String billID = accountID + "_" + currentMonth + "_" + product;
//		String billProductID = accountID+"_"+product;
        long smsNum = Long.valueOf(String.valueOf(smsObj.get("splitCount")==null?"1":smsObj.get("splitCount")));
		// 获取当月短信账单
		DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_consume).findOne(
				new BasicDBObject().append("_id", billID));
		
		// 如果没有找到账单，则生成
		if(bill == null) {
            createSmsBill(accountID,currentMonth,product);
			bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_consume).findOne(
					new BasicDBObject().append("_id", billID));
		}

        long consume=fee.getFee();
		long discount = fee.getDiscount();
        MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_consume).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc",new BasicDBObject().append("actualConsume", consume).append("num", smsNum).append("discount",discount)));


		EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_SMS,accountID)
				.addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
				.addBusinessItem(EventBusinessField.CHARGE_MONEY,consume));
		//累计消费
		AccountService.incrConsume(accountID,consume);

		// 扣余额
        // DBObject _productInc= new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -consume));
        // DBObject accountDB=MongoProvider.findAndModify(BillMaster.DB_ACCOUNT,new BasicDBObject().append("_id", accountID),_productInc,false);
		AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountID, -consume);
		if (consumeRes.hasConsumeFinanceAccount) {
			MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_consume).update(
					new BasicDBObject().append("_id", billID),
					new BasicDBObject().append("$set",new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())));

		}
		DBObject accountDB = consumeRes.paidAccount; // 这里是留给预警用的数据，谁支付了，就用这个账号检查预警问题

		long overdraw=accountDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accountDB.get("overdraw"))).longValue();
        //检查话费余额，发送短信端进行欠费控制
        if(accountDB != null) {
            long balance = Double.valueOf(String.valueOf(accountDB.get("balance"))).longValue();
            balance = balance+overdraw;
            //禁止外呼
/*            String detail = "";
			if(balance < 0) {
				MongoProvider.insert("bill_notify", new BasicDBObject()
				.append("type", "callOver")
				.append("account", accountID)
				.append("isProxy", false)
				.append("product", product)
				.append("detail", detail));
			}*/
			//预警
            AccountBillTask.dialAlert(accountDB,balance);
		}
        //预警
		//给代理返钱
		SystemUser proxy = AccountService.getProxy(accountID);
		String proxyID = proxy==null ? null : proxy.getId();
		if (proxyID != null) {
            smsObj.put("proxy", proxyID);
            chargeProxyFee(proxyID, fee, smsObj);
		}

		//计算短信成本
		this.chargeChannelCost(fee,smsObj,product);

	}
	private FeeObject countFee(DBObject product, DBObject smsObj) {
		FeeObject feeObject = new FeeObject();
		long fee = Long.valueOf(String.valueOf(product.get("smsFee")==null?smsPrice:product.get("smsFee")));
		long discount = Long.valueOf(String.valueOf(product.get("smsDiscount")==null?"0":product.get("smsDiscount")));
        long smsNum = Long.valueOf(String.valueOf(smsObj.get("splitCount")==null?"1":smsObj.get("splitCount")));
		discount = discount*smsNum;
        fee=fee*smsNum;
		feeObject.setFee(fee);
		feeObject.setDiscount(discount);
        smsObj.put("consume", fee);
		smsObj.put("discount", discount);
		return feeObject;
	}
	
	private void chargeProxyFee(String proxyID, FeeObject fee, DBObject smsObj) {
		String currentDate = Utils.getDate("yyyy-MM-dd");
		String billID = proxyID + "_" + currentDate;
		DBObject bill = MongoConnect.getInstance().getDB("bill")
				.getCollection(bill_sms_proxy_income).findOne(new BasicDBObject().append("_id", billID));
		//如果找不到代理的话单，则生成当天话单
		if(bill == null) {
			createProxyBill(proxyID, currentDate);
		}
		
		DBObject account = MongoConnect.getInstance().getDB("bill")
				.getCollection(PROXY_COLLECTION).findOne(new BasicDBObject().append("_id", proxyID));
		long consume = 0l;
        int percent = Integer.valueOf(String.valueOf(account.get("smsPercent")==null?"0":account.get("smsPercent")));
        long proxySmsFee = Long.valueOf(String.valueOf(account.get("smsFee")==null?smsPrice:account.get("smsFee")));
        long smsNum = Long.valueOf(String.valueOf(smsObj.get("splitCount")==null?"1":smsObj.get("splitCount")));
        consume = fee.getFee() - (proxySmsFee*smsNum);
		long discount=fee.getDiscount();
		if(discount>0){
			consume=consume-discount;
		}
		consume = consume*percent/100;
		consume = consume +discount;//折扣结算给代理
		MongoConnect.getInstance().getDB("bill").getCollection(bill_sms_proxy_income).update(
				new BasicDBObject().append("_id", billID),
				new BasicDBObject().append("$inc",
						new BasicDBObject().append("income", consume).append("num", smsNum).append("discount", discount)));
        smsObj.put("income", consume);
		MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_proxy_detail).insert(smsObj);
        smsObj.removeField("proxy");
	}

	public static void createProxyBill(String proxyID,String currentDate) {
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
		MongoConnect.getInstance().getDB("bill").getCollection(bill_sms_proxy_income).insert(bill);
	}
	
    public static void createSmsBill(String accountID,String currentMonth,String product) {
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
        MongoConnect.getInstance().getDB("bill_data").getCollection(SmslBillThread.bill_sms_consume).insert(bill);
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

	private void chargeChannelCost(FeeObject fee,DBObject smsObj,String product){
		if(smsObj.get("account")==null){
			return;
		}

		String account = (String)smsObj.get("account");

		String productId = account+"_"+product;
		DBObject productObj = MongoConnect.getInstance().getDB().getCollection(BillMaster.DB_ACCOUNT_PRODUCT).findOne(new BasicDBObject("_id",productId));
		if(productObj==null){
			log.warning(productId + "not found!");
			return;
		}

		if(productObj.get("smsChannel")==null){
			log.warning(productId+ " smsChannel not set");
			return;
		}

		String smsChannelId = (String)productObj.get("smsChannel");
		DBObject smsChannel = MongoConnect.getInstance().getDB().getCollection(platform_sms_channel).findOne(new BasicDBObject("_id",smsChannelId));
		if(smsChannel==null){
			log.warning(smsChannelId + "not found!");
			return;
		}

		String currentDate = Utils.getDefaultCurrentDate();
		String billId = smsChannelId+"_"+currentDate;
		DBObject billSmsChannel = MongoConnect.getInstance().getDB().getCollection(bill_sms_channel).findOne(new BasicDBObject("_id",billId));
		if(billSmsChannel==null){
			createSmsChannelBill(smsChannelId,currentDate);
		}

		String splitCountStr = smsObj.get("splitCount")==null?"1":String.valueOf(smsObj.get("splitCount"));
		long splitCount = Long.valueOf(splitCountStr);

		String priceStr = smsChannel.get("price")==null?"0":String.valueOf(smsChannel.get("price"));
		long price = Long.valueOf(priceStr);
		long totalFee = fee.getFee();
		long cost = splitCount*price;
		long earn = totalFee - cost;

		//短信账单
		BasicDBObject incDoc = new BasicDBObject("count",splitCount).append("cost",cost).append("earn",earn);
		MongoConnect.getInstance().getDB("bill").getCollection(bill_sms_channel).update(new BasicDBObject("_id",billId),new BasicDBObject("$inc",incDoc));
		//短信账单明细
		smsObj.put("cost",cost);
		smsObj.put("earn",earn);
		MongoConnect.getInstance().getDB("bill_data").getCollection(bill_sms_channel_detail).insert(smsObj);
		smsObj.removeField("cost");
		smsObj.removeField("earn");

		//报表事件
		EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_COST_SMS,account)
				.addBusinessItem(EventBusinessField.CHARGE_COST_PRODUCT,product)
				.addBusinessItem(EventBusinessField.CHARGE_COST_COST,cost)
				.addBusinessItem(EventBusinessField.CHARGE_COST_TOTALFEE,totalFee));

	}

	public static void createSmsChannelBill(String smsChannelId,String currentDate) {
		DBObject bill = new BasicDBObject();
		String billID = smsChannelId + "_" + currentDate;
		bill.put("_id", billID);
		bill.put("channel", smsChannelId);
		bill.put("year", Utils.getDate("yyyy"));
		bill.put("month", Utils.getDate("MM"));
		bill.put("dd", Utils.getDate("dd"));
		bill.put("date", currentDate);
		bill.put("count", 0);
		bill.put("cost", 0l);
		bill.put("earn",0l);
		bill.put("createTime", Utils.getCurrentDate());
		MongoConnect.getInstance().getDB("bill").getCollection(bill_sms_channel).insert(bill);
	}
}
