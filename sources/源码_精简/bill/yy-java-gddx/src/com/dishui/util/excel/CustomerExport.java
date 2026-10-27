package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;
import java.util.regex.Pattern;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class CustomerExport extends XssfWriter{
	private static Logger log = Logger.getLogger(CustomerExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();
	
	private String accountId;
	private String dbType;
	

	
	@Override
	public void generate(Map<String,Object> query) throws Exception {
		dbType=query.get("dbType").toString();
		accountId=query.get("accountId").toString();
		List<ExportModelVo> heads=getHeaders(dbType);
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        String dbName=MongoProvider.getAccountDB(accountId);
		DBCollection collection = MongoConnect.getInstance().getDB(dbName).getCollection(accountId+"_customer");
		DBObject where=new BasicDBObject();
		setQueryCondition(query);
		where.putAll(query);
		DBCursor cursor = collection.find(where);
		genrateHeader(heads);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
//				System.out.println("------cell-----"+obj.get(heads.get(i).getFieldId()));
				Object temp=obj.get(heads.get(i).getFieldId());
				if(temp!=null && heads.get(i).getFieldId().equals("phone")){
					BasicDBList tels=(BasicDBList)temp;
					StringBuffer phone=new StringBuffer();
					for(Object tel : tels){
						phone.append(((BasicDBObject)tel).get("tel").toString()).append(",");
					}
					String p=phone.toString();
					if(p.lastIndexOf(",")!=-1){
						p=p.substring(0,p.length()-1);
					}
//					System.out.println("------cell2-----"+phone.toString());
					createCell(i,p);
				}else if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
					String dicName=heads.get(i).getDicName();
					String desc=dics.get(dicName).get(temp);
					createCell(i,desc);
				}else{
					createCell(i,temp==null?"":temp.toString());
				}
				
				
			}
//			System.out.println("--------row----------");
//			log.info(obj.toString());
			endRow();
			rownum++;
		}

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
	
	public List<ExportModelVo> getHeaders(String tmplId){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();
		DBObject model=MongoProvider.findOne("customer_template", new BasicDBObject("_id",tmplId));

		BasicDBObject stable=(BasicDBObject)model.get("stable_fields");
		BasicDBList rows =(BasicDBList)model.get("custom_fields");
		BasicDBList source=(BasicDBList)model.get("source");
		
		
		Iterator iterator=stable.keySet().iterator();
		while(iterator.hasNext()){
			String key=(String)iterator.next();
			String name=stable.getString(key);
			ExportModelVo vo=new ExportModelVo();
			vo.setFieldId(key);
			vo.setFieldName(name);
			vo.setDicName("");
			if("sex".equals(key)){
				vo.setDicName("sex");
			}
			list.add(vo);	
		}
		
		ExportModelVo field1=new ExportModelVo();
		field1.setFieldId("status");
		field1.setFieldName("客户状态");
		field1.setDicName("custstatus");
		list.add(field1);
		
		ExportModelVo field5=new ExportModelVo();
		field5.setFieldId("owner");
		field5.setFieldName("所属人");
		field5.setDicName("user");
		list.add(field5);
		
		if(source!=null && source.size()>0){
			ExportModelVo field2=new ExportModelVo();
			field2.setFieldId("custsource1");
			field2.setFieldName("数据来源");
			field2.setDicName("source1");
			
			list.add(field2);
		}
		
		for (Object obj : rows) {
			BasicDBObject row =(BasicDBObject)obj;
			String type=row.getString("type");
			String dic=row.getString("_id");
			String name=row.getString("name");
			ExportModelVo vo=new ExportModelVo();
			vo.setFieldId(dic);
			vo.setFieldName(name);
			if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
				vo.setDicName(dic);
			}else{
				vo.setDicName("");
			}
			list.add(vo);
			if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
				BasicDBObject choices=(BasicDBObject)row.get("choices");
				Iterator iterator2=choices.keySet().iterator();
				Map<String,String> map2=new HashMap<String,String>();
				while(iterator2.hasNext()){
					
					String key=(String)iterator2.next();
					String value=choices.getString(key);
					map2.put(key, value);
				}
				dics.put(dic, map2);
			}
		}
        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("creator");
        field7.setFieldName("创建人");
        field7.setDicName("user");
        list.add(field7);
		ExportModelVo field6=new ExportModelVo();
		field6.setFieldId("createTime");
		field6.setFieldName("创建时间");
		field6.setDicName("");
		list.add(field6);
		
		setFieldDic(model);
		return list;
	}
	public void setFieldDic(DBObject model){
		Map<String,String> map=new HashMap<String,String>();
		BasicDBObject status=(BasicDBObject)model.get("status");
		map.put("status0", status.getString("status0")==null?"":status.getString("status0").toString());
		map.put("status1", status.getString("status1")==null?"":status.getString("status1").toString());
		map.put("status2", status.getString("status2")==null?"":status.getString("status2").toString());
		map.put("status3", status.getString("status3")==null?"":status.getString("status3").toString());
		map.put("status4", status.getString("status4")==null?"":status.getString("status4").toString());
		map.put("status5", status.getString("status5")==null?"":status.getString("status5").toString());
		map.put("status6", status.getString("status6")==null?"":status.getString("status6").toString());
		map.put("status7", status.getString("status7")==null?"":status.getString("status7").toString());
		map.put("status8", status.getString("status8")==null?"":status.getString("status8").toString());
		map.put("status9", status.getString("status9")==null?"":status.getString("status9").toString());
		
		dics.put("custstatus", map);
		
		Map<String,String> map2=new HashMap<String,String>();
		BasicDBList source=(BasicDBList)model.get("source");
		if(source!=null){
			for (Object obj : source) {
				DBObject item=(BasicDBObject)obj;
				map2.put(item.get("key").toString(), item.get("name").toString());
			}
			dics.put("source1", map2);
		}
		setSex();
		setUserDic(this.accountId);
	}
	public void setSex(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("0", "男");
		map.put("1", "女");
		dics.put("sex", map);
	}
	public void setUserDic(String accountId){
		DBObject where=new BasicDBObject();
		where.put("accountId", accountId);
		List<DBObject> list=MongoProvider.find("app_user", where);
		Map<String,String> map=new HashMap<String,String>();
		for (DBObject o : list) {
			map.put(o.get("_id").toString(), o.get("name").toString());
		}
		dics.put("user", map);
	}
	
	private void setQueryCondition(Map<String, Object> query){
		  if(query.get("combox")!=null){
			  String value=query.get("combox").toString();
			  BasicDBList  combox=new  BasicDBList();
			  Pattern pattern= Pattern.compile(value);
			  DBObject c1=new BasicDBObject("name",pattern);
			  DBObject c2=new BasicDBObject("phone.tel",value);
			  combox.add(c1);
			  combox.add(c2);
			  query.put("$or", combox);
			  query.remove("combox");
		    }
		    List<String> fields=new ArrayList<String>();
		    Iterator<String> iterator=query.keySet().iterator();
		    while(iterator.hasNext()){
		    	String field=iterator.next();
		         if(field.indexOf("begin_date")!=-1 || field.indexOf("end_date")!=-1){
		             fields.add(field.substring(0, field.indexOf("_")));
		         }
		    }
		    Set<String> set=new HashSet<String>();
		    set.addAll(fields);
		    for (String field : set) {
		    	DBObject db=new BasicDBObject();
		        if(query.containsKey(field+"_begin_date") && query.containsKey(field+"_end_date")){
		        	String val1=query.get(field+"_begin_date").toString()+(query.get(field+"_begin_time")==null?"":" "+query.get(field+"_begin_time").toString());
		        	String val2=query.get(field+"_end_date").toString()+(query.get(field+"_end_time")==null?"":" "+query.get(field+"_end_time").toString());
		        	db.put("$gte", val1);
		        	db.put("$lte", val2);
		        }else if(query.containsKey(field+"_begin_date")){
		        	String val=query.get(field+"_begin_date").toString()+(query.get(field+"_begin_time")==null?"":" "+query.get(field+"_begin_time").toString());
		        	db.put("$gte", val);
		        }else if(query.containsKey(field+"_end_date")){
		        	String val=query.get(field+"_end_date").toString()+(query.get(field+"_end_time")==null?"":" "+query.get(field+"_end_time").toString());
		        	db.put("$lte", val);
		        }
		        query.put(field, db);
		        query.remove(field+"_begin_date");
		        query.remove(field+"_end_date");
		        query.remove(field+"_begin_time");
		        query.remove(field+"_end_time");
			}
	}
}
