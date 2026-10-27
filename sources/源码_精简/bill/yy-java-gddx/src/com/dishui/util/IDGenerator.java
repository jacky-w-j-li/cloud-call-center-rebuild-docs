package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.Format;
import java.text.SimpleDateFormat;
import java.util.Date;

public class IDGenerator {
	private static final String ID_MAX="user_id_max";
	
    public static String getNext(int len){
//    	String id=prefix+accountId;
		Format f = new SimpleDateFormat("yyyyMMdd");
		String date = f.format(new Date());
		long max= IDGenerator.genNextNumber(date);
		StringBuffer maxStr=new StringBuffer();
		for (int i = 0; i <len; i++) {
			maxStr.append("0");
		}
		String maxId=date+maxStr.toString().substring(0, len-String.valueOf(max).length())+String.valueOf(max);
		return maxId;
    }
	private synchronized static long genNextNumber(String sequenceId){
		DBObject query = new BasicDBObject();
		query.put("_id", sequenceId);
		DBObject obj= MongoProvider.findOne("zj",IDGenerator.ID_MAX, query);
		DBObject data = new BasicDBObject();
		long max=1L;
		if(obj!=null){
			max=(Long)obj.get("max");
			max++;
			data.put("max", max);
			MongoProvider.update("zj",IDGenerator.ID_MAX, query, new BasicDBObject("$set", data));
		}else{
			data.put("_id", sequenceId);
			data.put("max", max);
			MongoProvider.insert("zj",IDGenerator.ID_MAX, data);
		}
		return max;
	}
}
