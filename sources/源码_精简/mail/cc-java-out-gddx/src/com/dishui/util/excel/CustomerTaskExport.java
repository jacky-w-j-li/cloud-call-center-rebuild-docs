package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;

public class CustomerTaskExport extends XssfWriter {
	private static Logger log = Logger.getLogger(CustomerTaskExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();
	
	private String accountId;
	

	
	@Override
	public void generate(Map<String,Object> query) throws Exception {
		accountId=query.get("account").toString();
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        String dbName= MongoProvider.getAccountDB(accountId);
		DBCollection collection = MongoConnect.getInstance().getDB(dbName).getCollection(accountId+"_customer_sample");
		DBObject where=new BasicDBObject();
		where.putAll(query);
		DBCursor cursor = collection.find(where);
		genrateHeader(heads);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				createCell(i,temp==null?"":temp.toString());
			}
			endRow();
			rownum++;
		}
        //电子表格结束
        endSheet();
        cursor.close();
	}
	
	public void genrateHeader(List<ExportModelVo> list) throws Exception{
		insertRow(0);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();		
	}

	public List<ExportModelVo> getHeaders(){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();

		ExportModelVo field1=new ExportModelVo();
		field1.setFieldId("phone");
		field1.setFieldName("联系电话");
		field1.setDicName("phone");
		list.add(field1);


		ExportModelVo field2=new ExportModelVo();
		field2.setFieldId("name");
		field2.setFieldName("客户名称");
		field2.setDicName("name");
		list.add(field2);

		ExportModelVo field3=new ExportModelVo();
		field3.setFieldId("title");
		field3.setFieldName("描述");
		field3.setDicName("title");
		list.add(field3);

		return list;
	}
}
