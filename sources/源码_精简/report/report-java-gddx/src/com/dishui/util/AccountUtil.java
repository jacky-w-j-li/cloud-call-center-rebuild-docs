package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.HashMap;


public class AccountUtil {
	private  static String Account_product = "platform_account_product";
	private static String Default_db = AppConfig.getInstance().getVar("db.name");
    private static HashMap<String,String> Acc_db_cache = new HashMap<String,String>();

    public static String getAccountDb(String accountId){
        if(Acc_db_cache.containsKey(accountId)){
            return Acc_db_cache.get(accountId);
        }else{
            DBObject dbAccount = MongoProvider.findOneFromApp("bill", Account_product, new BasicDBObject().append("_id", accountId + "_cc"));
            if(dbAccount != null){
                String dbname = (String) dbAccount.get("dataDB");
                Acc_db_cache.put(accountId,dbname);
                return dbname;
            }
            return Default_db;
        }
	}
}
