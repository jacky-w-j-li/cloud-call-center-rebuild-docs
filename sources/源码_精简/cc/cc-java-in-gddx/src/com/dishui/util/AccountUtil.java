package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;


public class AccountUtil {
	private  static String Account_product_db = "platform_account_product";
	private static  String Default_db = AppConfig.getInstance().getVar("db.name");
	
	public static String getAccountDb(String accountId){
        String id=accountId+"_"+"cc";
		DBObject dbAccount = MongoProvider.findOne("bill" , Account_product_db, new BasicDBObject().append("_id", id));
		if(dbAccount != null){
			String dbname = (String) dbAccount.get("dataDB");
			return dbname;
		}
		return Default_db;
	}
}
