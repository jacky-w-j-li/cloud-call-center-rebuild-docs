package com.m7.cc.auto.call.clear;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ClearCdrTask extends TimerTask {
	private Logger log = Logger.getLogger(ClearCdrTask.class.getName());

	public void run() {
		try {
			SimpleDateFormat formatter = new SimpleDateFormat("HH");
			if(Integer.parseInt(formatter.format(new Date())) == 3){
				SimpleDateFormat delFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				BasicDBObject findAcc = new BasicDBObject("cdrClearDuration", new BasicDBObject("$ne", null));
				List<DBObject> accList = MongoProvider.getInstance().find(Fields.DB_NAME_BILL, Fields.DB_PLATFORM_ACCOUNT_PRODUCT,  findAcc);
				log.log(Level.WARNING, "Begin clear cdr accountList=" + accList);
				for(int i=0 ; i<accList.size() ;i++){
					DBObject oneAcc = accList.get(i);
					int duration = Integer.parseInt(oneAcc.get("cdrClearDuration").toString());
					boolean keepDealing = false;
					if(oneAcc.get("cdrClearKeepDealing") != null){
						keepDealing = Boolean.parseBoolean(oneAcc.get("cdrClearKeepDealing").toString());
					}
					if(oneAcc.get("dataDB") == null)
						continue;
					String accountId = oneAcc.get("account").toString();
					if(oneAcc.get("dataDB") == null)
						continue;
					String accountDB = oneAcc.get("dataDB").toString();
					if(duration != -1){
						String beginDelDate = delFormatter.format(new Date(System.currentTimeMillis() - duration*24*60*60*1000l));
						log.log(Level.WARNING, "Begin clear cdr account="+accountId+" $lt=" + beginDelDate);
						//begin del cdr
						BasicDBObject cdrCon = new BasicDBObject();
						cdrCon.put("OFFERING_TIME", new BasicDBObject("$lt", beginDelDate));
						if(keepDealing){
							ArrayList<String> ninList = new ArrayList<String>();
							ninList.add("dealing");
							ninList.add("voicemail");
							cdrCon.put("STATUS", new BasicDBObject("$nin", ninList));							
						}
						MongoProvider.getInstance().remove(accountDB, accountId+"_c5_call_sheet", cdrCon);
						//begin del leakcdr
						BasicDBObject leakCdrCon = new BasicDBObject("NEW_OFFERING_TIME",new BasicDBObject("$lt", beginDelDate));
						MongoProvider.getInstance().remove(accountDB, accountId+"_c5_call_sheet_leak", leakCdrCon);
						//begin del cdr_peer
						BasicDBObject peerCon = new BasicDBObject("BEGIN_TIME",new BasicDBObject("$lt", beginDelDate));
						MongoProvider.getInstance().remove(accountDB, accountId+"_cdr_peer", peerCon);
						log.log(Level.WARNING, "Success clear cdr account="+accountId+" $lt=" + beginDelDate);
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}
	public static void main(String[] args) {
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		System.out.println(System.currentTimeMillis());
		System.out.println(new Date(System.currentTimeMillis() - 31*24*60*60*1000l));
		System.out.println(formatter.format(new Date(System.currentTimeMillis() - 31*24*60*60*1000l)));
	}
}
