package com.dishui.util;

import java.text.Format;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class IDGenerator {
	private static final String ID_MAX="user_id_max";
	
    public static String getNext(String prefix,String accountId,int len){
    	String id=prefix+accountId;
		Format f = new SimpleDateFormat("yyyyMMdd");
		String date = f.format(new Date());
		id+=date;
		long max=IDGenerator.genNextNumber(id);
		StringBuffer maxStr=new StringBuffer();
		for (int i = 0; i <len; i++) {
			maxStr.append("0");
		}
		String maxId=accountId+prefix+date+maxStr.toString().substring(0, len-String.valueOf(max).length())+String.valueOf(max);
		return maxId;
    }
	private synchronized static long genNextNumber(String sequenceId){
		DBObject query = new BasicDBObject();
		query.put("_id", sequenceId);
		DBObject obj= MongoProvider.findOne(IDGenerator.ID_MAX, query);
		DBObject data = new BasicDBObject();
		long max=1L;
		if(obj!=null){
			max=(Long)obj.get("max");
			max++;
			data.put("max", max);
			MongoProvider.update(IDGenerator.ID_MAX, query, new BasicDBObject("$set", data));
		}else{
			data.put("_id", sequenceId);
			data.put("max", max);
			MongoProvider.insert(IDGenerator.ID_MAX, data);
		}
		return max;
	}
}
