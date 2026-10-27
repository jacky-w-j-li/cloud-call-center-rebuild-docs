package com.dishui.util.excel;

import java.net.URLDecoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.command.JSONReader;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class ReportQueueExport extends XssfWriter {

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
		//获取技能组对比报表的表头
		List<ExportModelVo> heads=getHeaders("call_report_queue",(String)query.get("accountId"));
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject where=new BasicDBObject();
		where.put("AccountID",query.get("AccountID").toString());
		
        //解析查询条件
        if(query.get("data") != null){
        	String timeData = query.get("data").toString();
        	JSONReader jsonReader = new JSONReader();
        	timeData = URLDecoder.decode(timeData, "UTF-8");
        	HashMap<String, String> timeDataMap = (HashMap<String, String>) jsonReader.read(timeData);
        	String TimeType = timeDataMap.get("TimeType").toString();
        	
        	String monthStr = "";
        	if(timeDataMap.get("monthReport") != null){
        		int month = Integer.parseInt(timeDataMap.get("monthReport"));
        		if(month<10){
        			monthStr = "0" + month;        			
        		}else{
        			monthStr = month+""; 
        		}
        	}
        	
        	if(TimeType.equalsIgnoreCase("day")){
        		where.put("DayID", timeDataMap.get("yearReport") + monthStr + timeDataMap.get("dayReport"));
        	}else if(TimeType.equalsIgnoreCase("month")){
        		where.put("MonthID", timeDataMap.get("yearReport") + monthStr);
        	}else if(TimeType.equalsIgnoreCase("year")){
        		where.put("YearID", timeDataMap.get("yearReport"));
        	}else if(TimeType.equalsIgnoreCase("time")){
        		where.put("ReportTime", timeDataMap.get("timeReport"));
        	}
        }else{
        	SimpleDateFormat df = new SimpleDateFormat("yyyyMMdd");
        	where.put("DayID", df.format(new Date()));
        }
        
		DBCollection collection = MongoConnect.getInstance().getDB().getCollection("manager_report_queue_hour");
		DBCursor cursor = collection.find(where);
		genrateHeader(heads);
		
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				System.out.println("------cell-----"+obj.get(heads.get(i).getFieldId()));
				Object temp=obj.get(heads.get(i).getFieldId());
				
				
				if(temp!=null && heads.get(i).getFieldId().equals("phone")){
					BasicDBList tels=(BasicDBList)temp;
					StringBuffer phone=new StringBuffer();
					for(Object tel : tels){
						phone.append(((BasicDBObject)tel).get("tel").toString()).append(" ");
					}
					System.out.println("------cell2-----"+phone.toString());
					createCell(i,phone.toString());
				}else{
					createCell(i,temp==null?"":temp.toString());
				}
				
			}
			System.out.println("--------row----------");
//			log.info(obj.toString());
			endRow();
			rownum++;
		}
//        MongoProvider.cursorQuery("c5_customer", null);
//        for (int rownum = 0; rownum < 100000; rownum++) {
//        	//插入新行
//            insertRow(rownum);
//            //建立新单元格,索引值从0开始,表示第一列
//            createCell(0, "合理");
////            createCell(1, 34343.123456789);
////            createCell(2, "23.67%");
////            createCell(3, "12:12:23");
////            createCell(4, "2010-10-11 12:12:23");
////            createCell(5, "true");
////            createCell(6, "false");
//          
//            //结束行
//            endRow();
//        }
        //电子表格结束
        endSheet();

	}
	
	public void genrateHeader(List<ExportModelVo> list) throws Exception{
		insertRow(0);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();		
	}
	public List<ExportModelVo> getHeaders(String tmplId,String accountId){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();
		
		DBObject model = null;
		DBObject find = new BasicDBObject();
		find.put("Type",tmplId);
		find.put("Account",accountId);
		List<DBObject> models=MongoProvider.find("manager_report_table_header_config", find);
		if(models.size() >= 1){
			model = models.get(0);
		}else{
			//无自定义表头，那么取 系统默认表头
			find.put("Account","system");
			model=MongoProvider.findOne("manager_report_table_header_config", find);
		}

		List<BasicDBObject> stable=(List<BasicDBObject>)model.get("Config");
		//BasicDBList rows =(BasicDBList)model.get("custom_fields");
		
		for(int i=0 ;i<stable.size();i++){
			if((Boolean)stable.get(i).get("show")){
				String key=(String)stable.get(i).get("name");
				String name=(String)stable.get(i).get("displayname");
				ExportModelVo vo=new ExportModelVo();
				vo.setFieldId(key);
				vo.setFieldName(name);
				vo.setDicName("");
				list.add(vo);
			}
		}
		//Iterator iterator=stable.keySet().iterator();
//		while(iterator.hasNext()){
//			String key=(String)iterator.next();
//			String name=stable.getString(key);
//			ExportModelVo vo=new ExportModelVo();
//			vo.setFieldId(key);
//			vo.setFieldName(name);
//			vo.setDicName("");
//			list.add(vo);	
//		}
//		for (Object obj : rows) {
//			BasicDBObject row =(BasicDBObject)obj;
//			BasicDBList cols=(BasicDBList)row.get("cols");
//			for(Object obj2:cols){
//				BasicDBObject col =(BasicDBObject)obj2;
//				BasicDBList fields=(BasicDBList)col.get("fields");
//				for(int i=0;i<fields.size();i++){
//					BasicDBObject field =(BasicDBObject)fields.get(i);
//					ExportModelVo vo=new ExportModelVo();
//					vo.setFieldId(field.getString("_id"));
//					vo.setFieldName(field.getString("name"));
//					vo.setDicName(field.getString("dic"));
//					list.add(vo);
//				}
//			}
//		}
		System.out.println("-----get Headers-----------"+list);
		
		return list;
	}
	
	
	public void setQueryClause(Map<String,Object> query){
		if(query==null) return;
		if(query.containsKey("accountId")){
			
		}
	}

}
