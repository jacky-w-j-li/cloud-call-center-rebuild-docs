package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.service.AppConfig;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;


public class AccountUtil {
	private  static String Account_product = "platform_account_product";
	private static  String Default_db = AppConfig.getInstance().getVar("db.name");
	
	public static String getAccountDb(String accountId){
		DBObject dbAccount = MongoProvider.findOne(Account_product, new BasicDBObject().append("_id", accountId+"_cc"));
		if(dbAccount != null){
			String dbname = (String) dbAccount.get("dataDB");
			return dbname;
		}
		return Default_db;
	}
}
