package com.dishui.bill.bill;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class CallBillTask extends TimerTask{
	private static Logger log = Logger.getLogger(CallBillTask.class.getName());
	@Override
	public void run() {
		if(BillMaster.callBillStatus) {
			log.log(Level.INFO,"call task is running ! return!");
			return;
		}
		log.log(Level.INFO,"start process call bill ...");
		long begin = new Date().getTime();
		BillMaster.callBillStatus = true;
		
		try{
			DBObject queryCondition = new BasicDBObject().append("ISDO", "0").append("END_TIME", new BasicDBObject().append("$ne", null));
			List<DBObject> callList = MongoProvider.find(BillMaster.DB_ACCOUNT_CALL, queryCondition);
			List<DBObject> accIds = MongoProvider.distinct(BillMaster.DB_ACCOUNT_CALL, "ACCOUNT_ID", queryCondition);
			List<DBObject> accountFees =  MongoProvider.find(BillMaster.DB_ACCOUNT_BALANCE, new BasicDBObject().append("_id", new BasicDBObject().append("$in", accIds)));
			Map<String,DBObject> feeMap = new HashMap<String, DBObject>();
			for(int i=0;i<accountFees.size();i++){
				feeMap.put((String)accountFees.get(i).get("_id"),accountFees.get(i));
			}
			for(DBObject callItem : callList){
				long callLength = Long.parseLong(callItem.get("CALL_TIME_LENGTH").toString());
				
				String accountId = (String)callItem.get("ACCOUNT_ID");
				Long minite = callLength%60 == 0 ?  callLength/60 : (int)(callLength/60 +1);
				long fee = Long.parseLong(feeMap.get(accountId).get("callFee").toString());
				long callFare = minite * fee;
				DBObject update = new BasicDBObject().append("$inc", new BasicDBObject().append("callConsume", callFare));
				MongoProvider.update(BillMaster.DB_ACCOUNT_BALANCE, new BasicDBObject().append("_id", accountId), update);
				update = new BasicDBObject();
				update.put("$set",new BasicDBObject().append("ISDO", "1").append("CALL_FARE", callFare).append("CALL_MINITES", minite).append("FARE_TIME", Utils.getCurrentDate()));
				MongoProvider.update(BillMaster.DB_ACCOUNT_CALL, new BasicDBObject().append("_id", callItem.get("_id")), update);
			}
			
			queryCondition = new BasicDBObject().append("ISDO", "1");
			callList = MongoProvider.find(BillMaster.DB_ACCOUNT_CALL, queryCondition);
			for(DBObject callItem : callList){
				MongoProvider.insert(BillMaster.DB_ACCOUNT_CALL_QUERY, callItem);
			}
			MongoProvider.remove(BillMaster.DB_ACCOUNT_CALL, queryCondition);
			long end = new Date().getTime();
			log.log(Level.INFO,"end process call bill,time:"+(end - begin)+" process call size :"+callList.size());
		}catch(Exception e){
			e.printStackTrace();
			log.log(Level.WARNING, "",e);
		}finally{
			BillMaster.callBillStatus = false;
		}
		
	}

}
