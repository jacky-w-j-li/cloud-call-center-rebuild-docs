package com.dishui.util.excel.handler;

import java.util.Map;

import com.dishui.db.mango.MongoConnect;
import com.dishui.util.excel.XssfWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class BillTelRecordExport extends XssfWriter{
	public static String DB_TEL_RECORD = "call_sheet_bill_query";
	@Override
	public void generate(Map<String, Object> query) throws Exception {
		DBObject condition=new BasicDBObject();
		condition.putAll(query);
		DBCollection collection = MongoConnect.getInstance().getDB().getCollection(DB_TEL_RECORD);
		DBCursor cursor = collection.find(condition);
		//电子表格开始
		int rownum = 1;
		beginSheet();
		String [] headers = {"账户编号","主叫号码","被叫号码","呼叫类型","开始时间","结束时间","通话时长(秒)","通话时长(分)","呼叫地区(省)","呼叫地区(市)","扣费金额"};
		String [] values = {"ACCOUNT_ID","CALL_NO","CALLED_NO","CALL_TYPE","BEGIN_TIME","END_TIME","CALL_TIME_LENGTH","CALL_MINITES","CALLEE_PROVICE","CALLEE_CITY","CALL_FARE"};
		genrateHeader(headers);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<values.length;i++){
				String value = String.valueOf(obj.get(values[i]));
				if(values[i].equals("CALL_FARE")){
					value = String.valueOf(Long.parseLong(value)/1000);
				}
				createCell(i,value);
			}
			endRow();
			rownum++;
		}
		endSheet();
	}
	
	public void genrateHeader(String[] headers) throws Exception{
		insertRow(0);
		for(int i=0;i<headers.length;i++){
			createCell(i,headers[i]);
		}
		endRow();		
	}

}
