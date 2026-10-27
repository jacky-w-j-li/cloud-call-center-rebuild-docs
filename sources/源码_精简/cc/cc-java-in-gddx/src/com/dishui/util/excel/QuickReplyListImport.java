package com.dishui.util.excel;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;

import net.sf.json.JSONArray;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.Fields;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class QuickReplyListImport implements RowHandler{
	public final static String DB_SMS_QUICKREPLY = "app_multi_channel_system_quickreply";
	public final static String DB_SMS_QUICKREPLY_TAGS = "app_multi_channel_system_quickreply_tags";
	public List<String> heads=null;
	public Map</*fieldId*/String,Map<String,String>> dicitem=new HashMap<String,Map<String,String>>();

	public List<DBObject> rows=null;
	public List<DBObject> repeatRows=null;
    public List<ReportEvent> eventList = null;

	private String accountId="";
	private String moduleType="";
	public QuickReplyListImport(DBObject task){
		rows=new ArrayList<DBObject>();
		repeatRows=new ArrayList<DBObject>();
		accountId=task.get("accountId").toString();
		moduleType=task.get(Fields.MODULETYPE).toString();
		//heads=(ArrayList)task.get("heads");

	}
	
	Map<String,Integer> tagsCountMap = new HashMap<String,Integer>();
	@Override
	public void processRow(int sheetIndex, int curRow, List<String> collist) {
		Map<String,String> condition = new HashMap<String,String>();
		Map<String,String> conditionreply = new HashMap<String,String>();
		condition.put("account",this.accountId);
		conditionreply.put("account",this.accountId);
		//if(heads==null) return;
		if(curRow==0) return;//clear row head
		DBObject row=new BasicDBObject();
		String[] tagsNameArray=null;
		List<Map<String,String>> tagsArray=new ArrayList<Map<String,String>>();
			String content = collist.get(0);
			String tagsName = collist.get(1);
			if(tagsName==null || tagsName=="")tagsName="其它";
			tagsName=tagsName.trim();
			tagsNameArray = tagsName.split(",|，|/|\\\\|、");
			conditionreply.put("content", content);
			
			if(tagsNameArray!=null && tagsNameArray.length>0){
				String time= Utils.getCurrentDate();
				DBObject dbObject = MongoProvider.findOne(DB_SMS_QUICKREPLY, new BasicDBObject(conditionreply));
				//查看是否已经在rows中
				boolean isExsitOfExcel = false;
				for(DBObject r : rows){
					if(content!=null && content.equals( r.get("content"))){
						isExsitOfExcel =true;
					}
				}
				if(dbObject!=null){
			        String jsonArrayData = dbObject.get("tags").toString();
			        JSONArray jsonArray = JSONArray.fromObject(jsonArrayData);
			        List<Map<String,String>> tagsList = (List)jsonArray; 
			        for(int i=0;i<tagsList.size();i++){
			        	tagsArray.add(tagsList.get(i));
			        }
			        dealTags(tagsNameArray,condition, tagsArray, true);
					row.put("_id", dbObject.get("_id"));
			        row.put("account", this.accountId);
			        row.put("content",content);
			        row.put("tags",tagsArray);
			        row.put("updatedTime",time);
			        row.put("moduleType", this.moduleType);
			        repeatRows.add(row);
				}else if (!isExsitOfExcel){
					dealTags(tagsNameArray,condition, tagsArray, false);
					String id= Utils.getUniqueid();
					row.put("_id", id);
					row.put("account", this.accountId);
					row.put("content",content);
					row.put("tags",tagsArray);
					row.put("updatedTime",time);
					row.put("moduleType", this.moduleType);
					rows.add(row);
				}
			}
    }
	
	public void dealTags(String[] tagsNameArray,Map<String,String> condition,List<Map<String,String>> tagsArray,boolean flag){
	for(int j=0;j<tagsNameArray.length;j++){
		Map<String,String> tagsMap = new HashMap<String,String>();
		condition.put("name",tagsNameArray[j]);
		DBObject object = MongoProvider.findOne(DB_SMS_QUICKREPLY_TAGS, new BasicDBObject(condition));
		if(object!=null){
			String id=(String)object.get("_id");
        	String name = (String)object.get("name");
        	tagsMap.put("_id",id);
        	tagsMap.put("name",name);
        	if(tagsCountMap.get(id)!=null){
        		if(!flag){
        			tagsCountMap.put(id, tagsCountMap.get(id)+1);
        		}else{
        			tagsCountMap.put(id, tagsCountMap.get(id));
        		}
        	}else{
        		//tagsCountMap.put(id,0); jinjj修改
        		if(!flag){
        			tagsCountMap.put(id,1);
        		}else{
        			tagsCountMap.put(id,0);
        		}
        		
        	}
        	if(!flag){
        		tagsArray.add(tagsMap);
        	}
			}else{
			DBObject objectMap = new BasicDBObject();
        	String id=Utils.getUniqueid();
        	objectMap.put("_id",id);
        	objectMap.put("account", this.accountId);
        	objectMap.put("name", tagsNameArray[j]);
        	objectMap.put("count", 0);
        	objectMap.put("updatedTime",Utils.getCurrentDate());
        	objectMap.put("moduleType", this.moduleType);
        	MongoProvider.insert(DB_SMS_QUICKREPLY_TAGS,objectMap);
        	tagsMap.put("_id",id);
        	tagsMap.put("name",tagsNameArray[j]);
        	tagsCountMap.put(id, 1);
        	tagsArray.add(tagsMap);
			}
		}
	} 

	public void processEndRow() {
		if(repeatRows.size()>0){
			for (int i=0;i<repeatRows.size();i++) {
				DBObject setDoc =new BasicDBObject();
				DBObject setData =new BasicDBObject();
				setData.put("content",repeatRows.get(i).get("content"));
				setData.put("tags",repeatRows.get(i).get("tags"));
				setData.put("updatedTime",repeatRows.get(i).get("updatedTime"));
				setDoc.put("$set", setData);
				String id = (String)repeatRows.get(i).get("_id");
				MongoProvider.update(DB_SMS_QUICKREPLY, new BasicDBObject("_id",id),setDoc);
				}
			 repeatRows.clear();
		}
		if(rows.size()>0){
            MongoProvider.batchInsert(DB_SMS_QUICKREPLY, rows);
            rows.clear();
        }
		if(tagsCountMap!=null && tagsCountMap.size()>0){
		for (Map.Entry<String, Integer> entry : tagsCountMap.entrySet()) {
//			System.out.println("key= " + entry.getKey() + " and value= " + entry.getValue());
			DBObject setDoc =new BasicDBObject();
			setDoc.put("$inc", new BasicDBObject().append("count",entry.getValue()));
			MongoProvider.update(DB_SMS_QUICKREPLY_TAGS, new BasicDBObject("_id",entry.getKey()),setDoc);
			}
		}
	}
	
}
