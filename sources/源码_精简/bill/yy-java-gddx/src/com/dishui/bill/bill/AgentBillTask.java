package com.dishui.bill.bill;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class AgentBillTask extends TimerTask{
	private static Logger log = Logger.getLogger(AgentBillTask.class.getName());
	@Override
	public void run() {
		if(BillMaster.agentBillStatus) {
			log.log(Level.INFO,"task is running ! return!");
			return;
		}
		Calendar now = Calendar.getInstance();
		if(now.get(Calendar.HOUR_OF_DAY) != 0){
			return;
		}
		log.log(Level.INFO,"start process agent bill ...");
		long begin = new Date().getTime();
		BillMaster.agentBillStatus = true;
		try{
			List<DBObject> accountlist = MongoProvider.find(BillMaster.DB_ACCOUNT,new BasicDBObject().append("status", "using").append("endTime",new BasicDBObject().append("$gte", Utils.getDefaultCurrentDate())));
			if(accountlist != null && accountlist.size()!= 0){
				for(DBObject account : accountlist){
					DBObject balance = MongoProvider.findOne(BillMaster.DB_ACCOUNT_BALANCE, new BasicDBObject().append("_id", account.get("_id")));
					MongoProvider.update(BillMaster.DB_ACCOUNT_BALANCE, new BasicDBObject().append("_id", account.get("_id")), new BasicDBObject().append("$inc",new BasicDBObject().append("agentConsume",Long.parseLong(String.valueOf(balance.get("agentFee"))) *Long.parseLong(String.valueOf(account.get("agentNum"))))));
					DBObject newBalance = MongoProvider.findOne(BillMaster.DB_ACCOUNT_BALANCE, new BasicDBObject().append("_id", account.get("_id")));
					DBObject log = new BasicDBObject();
					log.put("time", Utils.getCurrentDate());
					log.put("type", "agent");
					log.put("number", Long.parseLong(String.valueOf(balance.get("agentFee"))) *Long.parseLong(String.valueOf(account.get("agentNum"))));
					log.put("old", balance.get("agentConsume"));
					log.put("new", newBalance.get("agentConsume"));
					MongoProvider.insert(BillMaster.DB_ACCOUNT_BALANCE_SYS_LOG, log);
				}
			}
			long end = new Date().getTime();
			log.log(Level.INFO,"end process agent bill,time:"+(end - begin));
			
		}catch(Exception e){
			e.printStackTrace();
			log.log(Level.WARNING, "",e);
		}finally{
			BillMaster.agentBillStatus = false;
		}
	}
	
}
