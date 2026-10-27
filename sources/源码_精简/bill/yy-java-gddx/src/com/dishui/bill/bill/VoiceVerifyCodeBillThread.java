package com.dishui.bill.bill;

import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.db.service.AccountService;
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

public class VoiceVerifyCodeBillThread extends Thread {
	private static Logger log = Logger.getLogger(VoiceVerifyCodeBillThread.class.getName());

	private static final String PROXY_COLLECTION = "bill_system_user";
    private static final String bill_voiceVerify_consume = "bill_voiceVerify_consume";
    private static final String bill_voiceVerify_proxy_income = "bill_voiceVerify_proxy_income";
    private static final String bill_voiceVerify_proxy_detail = "bill_voiceVerify_proxy_detail";
    private static final int queueMax = 5000;
    private static final long voicePrice = 600l;
    private static List<String> voiceIds=new ArrayList<String>(queueMax);
    @Override
	public void run() {
		DBObject voiceObj = null;
		DBObject condition = new BasicDBObject();
		while (true) {
			try {
                voiceObj = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify").findOne(condition);
				if (voiceObj == null) {
                    sleep(1000);
					continue;
				}
				String pk = String.valueOf(voiceObj.get("_id"));
                if(voiceIds.contains(pk)){
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify").remove(
                            new BasicDBObject().append("_id", pk), WriteConcern.SAFE);
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify_repeat").insert(voiceObj);
                    continue;
                }else{
                    if(voiceIds.size()>=queueMax){
                        voiceIds.remove(0);
                    }
                    voiceIds.add(pk);
                }
				String accountID = String.valueOf(voiceObj.get("account"));
                String product = "yy";
                String productId=accountID + "_" + product;
                DBObject prod = MongoProvider.findOne(BillMaster.DB_ACCOUNT_PRODUCT,new BasicDBObject().append("_id",productId));
                if(prod != null) {
                    FeeObject fee = countFee(prod, voiceObj);
                    charge(accountID, product,fee, voiceObj);
                    voiceObj.removeField("income");
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify_detail").insert(voiceObj);
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify").remove(
                            new BasicDBObject().append("_id", voiceObj.get("_id")), WriteConcern.SAFE);
                } else {
                    log.warning(productId+" not found!");
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify").remove(
                            new BasicDBObject().append("_id",voiceObj.get("_id")),WriteConcern.SAFE);
                    MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify_error").insert(voiceObj);
                }
			} catch (Exception e) {
				log.log(Level.WARNING, "process sms bill exception! ", e);
				e.printStackTrace();
				if (voiceObj != null) {
					try {
						MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify").remove(
								new BasicDBObject().append("_id",voiceObj.get("_id")),WriteConcern.SAFE);
						MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify_error").insert(voiceObj);
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

	private void charge(String accountID,String product,FeeObject fee, DBObject voiceObj) {
		String currentMonth = Utils.getDate("yyyy-MM");
		String billID = accountID + "_" + currentMonth + "_" + product;
		// 获取当月短信账单
		DBObject bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_voiceVerify_consume).findOne(
				new BasicDBObject().append("_id", billID));
		
		// 如果没有找到账单，则生成
		if(bill == null) {
            createVoiceVerifyBill(accountID, currentMonth, product);
			bill = MongoConnect.getInstance().getDB("bill_data").getCollection(bill_voiceVerify_consume).findOne(
					new BasicDBObject().append("_id", billID));
		}

        long consume=fee.getFee();
		long discount = fee.getDiscount();
        MongoConnect.getInstance().getDB("bill_data").getCollection(bill_voiceVerify_consume).update(
                new BasicDBObject().append("_id", billID),
                new BasicDBObject().append("$inc",new BasicDBObject().append("actualConsume", consume).append("num", 1)
                        .append("minutes", fee.getMinutes()).append("seconds", fee.getSeconds())
                        .append("discount",discount)));


		EventReporter.emitOperationReportEvent(new EventData(EventType.CHARGE_VOICE,accountID)
				.addBusinessItem(EventBusinessField.CHARGE_PRODUCT,product)
				.addBusinessItem(EventBusinessField.CHARGE_MONEY,consume));
		//累计消费
		AccountService.incrConsume(accountID,consume);

		// 扣余额
        // DBObject _inc= new BasicDBObject().append("$inc",new BasicDBObject().append("balance", -consume));
        // DBObject accountDB=MongoProvider.findAndModify(BillMaster.DB_ACCOUNT,new BasicDBObject().append("_id", accountID),_inc,false);
		AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountID, -consume);
		if (consumeRes.hasConsumeFinanceAccount) {
			MongoConnect.getInstance().getDB("bill_data").getCollection(bill_voiceVerify_consume).update(
					new BasicDBObject().append("_id", billID),
					new BasicDBObject().append("$set",new BasicDBObject().append(AccountService.FinanceAccountFieldName, consumeRes.paidAccount.get("_id").toString())));
		}
		DBObject accountDB = consumeRes.paidAccount;

        long overdraw=accountDB.get("overdraw")==null?0l:Double.valueOf(String.valueOf(accountDB.get("overdraw"))).longValue();
        //检查话费余额，调用语音验证码接口端进行欠费控制
        if(accountDB != null) {
            long balance = Double.valueOf(String.valueOf(accountDB.get("balance"))).longValue();
            balance = balance+overdraw;
			//预警
            AccountBillTask.dialAlert(accountDB,balance);
		}
		//给代理返钱
		SystemUser proxy = AccountService.getProxy(accountID);
		String proxyID = proxy==null ? null : proxy.getId();
		if (proxyID != null) {
            voiceObj.put("proxy", proxyID);
            chargeProxyFee(proxyID, fee, voiceObj);
		}

	}
	private FeeObject countFee(DBObject product, DBObject voiceObj) {
		FeeObject feeObject = new FeeObject();
		long fee = Long.valueOf(String.valueOf(product.get("voiceFee")==null?voicePrice:product.get("voiceFee")));
        DBObject callback=(DBObject)voiceObj.get("callback_request");
        long duration=0l;
        if(callback!=null){
            duration=Long.valueOf(String.valueOf(callback.get("duration")==null?"0":callback.get("duration")));
        }
        long minutes = new Double(Math.ceil(duration / 60.0)).longValue();
        fee=fee*minutes;
		feeObject.setSeconds(duration);
		feeObject.setMinutes(minutes);
        feeObject.setFee(fee);
        voiceObj.put("consume", fee);
        voiceObj.put("minutes", minutes);
        voiceObj.put("seconds", duration);
		return feeObject;
	}
	
	private void chargeProxyFee(String proxyID, FeeObject fee, DBObject voiceObj) {
		String currentDate = Utils.getDate("yyyy-MM-dd");
		String billID = proxyID + "_" + currentDate;
		DBObject bill = MongoConnect.getInstance().getDB("bill")
				.getCollection(bill_voiceVerify_proxy_income).findOne(new BasicDBObject().append("_id", billID));
		//如果找不到代理的话单，则生成当天话单
		if(bill == null) {
			createProxyBill(proxyID, currentDate);
		}
		
		DBObject proxyUser = MongoConnect.getInstance().getDB("bill")
				.getCollection(PROXY_COLLECTION).findOne(new BasicDBObject().append("_id", proxyID));
		long consume = 0l;
        int percent = Integer.valueOf(String.valueOf(proxyUser.get("voicePercent")==null?"0":proxyUser.get("voicePercent")));
        long proxyVoiceFee = Long.valueOf(String.valueOf(proxyUser.get("voiceFee")==null?voicePrice:proxyUser.get("voiceFee")));
        long minutes=fee.getMinutes();
        consume = fee.getFee() - (proxyVoiceFee*minutes);
		long discount=fee.getDiscount();
		if(discount>0){
			consume=consume-discount;
		}
		consume = consume*percent/100;
		consume = consume +discount;//折扣结算给代理
		MongoConnect.getInstance().getDB("bill").getCollection(bill_voiceVerify_proxy_income).update(
				new BasicDBObject().append("_id", billID),
				new BasicDBObject().append("$inc",
						new BasicDBObject().append("income", consume).append("num", 1)
                                .append("minutes", fee.getMinutes()).append("seconds", fee.getSeconds())
                                .append("discount", discount)));
        voiceObj.put("income", consume);
		MongoConnect.getInstance().getDB("bill_data").getCollection(bill_voiceVerify_proxy_detail).insert(voiceObj);
        voiceObj.removeField("proxy");
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
        bill.put("minutes", 0l);
        bill.put("seconds", 0l);
		bill.put("income", 0l);
		bill.put("discount", 0l);
		bill.put("createTime", Utils.getCurrentDate());
		MongoConnect.getInstance().getDB("bill").getCollection(bill_voiceVerify_proxy_income).insert(bill);
	}
	
    public static void createVoiceVerifyBill(String accountID,String currentMonth,String product) {
        DBObject bill = new BasicDBObject();
        String billID = accountID + "_" + currentMonth + "_" + product;
        bill.put("_id", billID);
        bill.put("account", accountID);
        bill.put("name", product);
        bill.put("year", Utils.getDate("yyyy"));
        bill.put("month", Utils.getDate("MM"));
        bill.put("num", 0);
        bill.put("minutes", 0l);
        bill.put("seconds", 0l);
		bill.put("discount", 0l);
        bill.put("actualConsume", 0);
        bill.put("createTime", Utils.getCurrentDate());
        MongoConnect.getInstance().getDB("bill_data").getCollection(VoiceVerifyCodeBillThread.bill_voiceVerify_consume).insert(bill);
    }


	private class FeeObject {
		long fee = 0l;
		long discount = 0l;
        long minutes=0l;
        long seconds=0l;

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

        public long getMinutes() {
            return minutes;
        }

        public void setMinutes(long minutes) {
            this.minutes = minutes;
        }

        public long getSeconds() {
            return seconds;
        }

        public void setSeconds(long seconds) {
            this.seconds = seconds;
        }
    }
}
