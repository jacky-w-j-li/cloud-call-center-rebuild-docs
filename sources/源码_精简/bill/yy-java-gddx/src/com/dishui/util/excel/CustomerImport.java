package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.bill.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
 
public class CustomerImport implements RowHandler {
	public final int batchCount=1000;
	public List<String> heads=null;
	public Map<String,Map<String,String>> dicitem=new HashMap<String,Map<String,String>>();
	public Map<String,String> phones=new HashMap<String,String>();
	public Map<String,String> names=new HashMap<String,String>();

	
	public List<DBObject> rows=null;
	public List<DBObject> repeatRows=null;
//	private String template="";
	private String accountId="";
	private String userId="";
	private String batchNo="";
	private String dbType="";
	private String status="";
	private String source1="";
	private boolean isName=false;
	private boolean isPhone=false;
	public CustomerImport(DBObject task){
		rows=new ArrayList<DBObject>();
		repeatRows=new ArrayList<DBObject>();
		accountId=task.get("accountId").toString();
		userId=task.get("creator").toString();
		batchNo=task.get("batchNo").toString();
		dbType=task.get("dbType").toString();
		status=task.get("status").toString();
		if(task.get("source1")!=null){
			source1=task.get("source1").toString();
		}
		DBObject tmpl=getCustTmpl(this.dbType);
		isName=(Boolean)tmpl.get("unique_name");
		isPhone=(Boolean)tmpl.get("unique_phone");
		
		heads=(ArrayList)task.get("heads");

		setFieldDic(dbType);
	}
	private void addBlankCell(List<String> collist){
		int len=heads.size();
		int len2=collist.size();
		if(len2<len){
			for (int i = 0; i <len-len2 ; i++) {
				collist.add("");
			}
		}
	}
	@Override
	public void processRow(int sheetIndex, int curRow, List<String> collist) {
		if(heads==null) return;
		if(curRow==0) return;//clear row head
		addBlankCell(collist);
        boolean hasName=true;
		boolean isStatu=false;
		boolean isSource=false;
		DBObject row=new BasicDBObject();
		String[] tels=null;
		for (int i = 0; i < heads.size(); i++) {
			String field=heads.get(i);
			if("".equals(field)){
				continue;
			}
			if("status".equals(field)){
				isStatu=true;
			}else if("source1".equals(field)){
				isSource=true;
			}
			String cell=collist.get(i);
			if(cell==null)cell="";
            cell=cell.trim();
            if("name".equals(field) && "".equals(cell)){
                hasName=false;
            }
			if("phone".equals(field)){
				BasicDBList l=new BasicDBList();
				tels=cell.split(",");
				if(tels!=null && tels.length>0){
					for (int j = 0; j < tels.length; j++) {
						if(!"".equals(tels[j].trim())){
							DBObject phone=new BasicDBObject();
							phone.put("tel", tels[j].trim());
							phone.put("memo", "");
							l.add(phone);
						}
					}
					row.put(field, l);
				}
				continue;
			}
            if(dicitem.containsKey(field)){
				Map<String,String> set=dicitem.get(field);
                if(set==null){
                	throw new BaseRuntimeException("1001","dic is not exists:"+field);
                }
				Set<Entry<String,String>> set2=set.entrySet();
				Iterator<Entry<String,String>> itr=set2.iterator();
				while(itr.hasNext()){
                    Entry<String,String> entry =itr.next();
					if(cell.equals(entry.getValue())){
						cell=entry.getKey();
						break;
					}
				}
			}			
			row.put(field, cell);
		}
		String custId=Utils.getUniqueid();
		String time=Utils.getCurrentDate();
		row.put("_id", custId);
		row.put("createTime", time);
		row.put("accountId", this.accountId);
		row.put("owner", this.userId);
		row.put("dbType", this.dbType);
		row.put("batchNo", this.batchNo);
		row.put("actionType", "self");
		if(!isStatu){
			row.put("status", this.status);
		}
		if(!isSource){
			row.put("custsource1", this.source1);
		}

        if(!hasName){  //repeat reason:name,phone,noname
            row.put("reason","noname");
            repeatRows.add(row);
        } else{
            if(!isName && !isPhone){
                rows.add(row);
            }else{
                if(isPhone && isName){
                    checkPhone(tels,row,2);
                }else if(isPhone){
                    checkPhone(tels,row,1);
                }else if(isName){
                    checkName(row);
                }
            }
        }

		if(rows.size()>0 &&rows.size()%batchCount==0){
			MongoProvider.batchInsert(this.accountId+"_customer", rows,this.accountId);
			rows.clear();

		}
		if(repeatRows.size()>0 && repeatRows.size()%batchCount==0){
			MongoProvider.batchInsert("app_customer_repeat", repeatRows);
			repeatRows.clear();
		}
	}
	private void checkPhone(String[] tels,DBObject row,int flag){
		int repeatNum=0;
		if(tels!=null && tels.length>0){
			for (int j = 0; j < tels.length; j++) {//check selfrepeat
				if(phones.get(tels[j])!=null){
                    row.put("reason","phone");
					repeatRows.add(row);
					repeatNum++;
				}else{
					phones.put(tels[j], "");
				}
			}			
		}

		if(repeatNum==0){
			long num=queryRepeatCount2Phone(tels);
			if(num>0){
                row.put("reason","phone");
				repeatRows.add(row);
				repeatNum++;
			}else{
				if(flag==1){
					rows.add(row);
				}else{
					checkName(row);
				}
			}
		}		
	}
	private void checkName(DBObject row){
		int repeatNum=0;
		String name="";
		if(row.get("name")!=null){
			name=row.get("name").toString();
			if(names.get(name)!=null){
                row.put("reason","name");
				repeatRows.add(row);
				repeatNum++;
			}else{
				names.put(name, "");
			}			
		}

		if(repeatNum==0){
			long num=queryRepeatCount2Name(name);
			if(num>0){
                row.put("reason","name");
				repeatRows.add(row);
			}else{
				rows.add(row);
			}
		}		
	}
	public void processEndRow() {
		if(rows.size()>0){
			MongoProvider.batchInsert(this.accountId+"_customer", rows,this.accountId);
			rows.clear();
		}
		if(repeatRows.size()>0){
			MongoProvider.batchInsert("app_customer_repeat", repeatRows);
			repeatRows.clear();
		}
		phones.clear();
		names.clear();
	}
	

	public void setFieldDic(String tmplId){
		DBObject model=getCustTmpl(tmplId);
		Map<String,String> map=new HashMap<String,String>();
		BasicDBObject status=(BasicDBObject)model.get("status");
		map.put(status.getString("status0")==null?"":status.getString("status0").toString(),"status0");
		map.put(status.getString("status1")==null?"":status.getString("status1").toString(),"status1");
		map.put(status.getString("status2")==null?"":status.getString("status2").toString(),"status2");
		map.put(status.getString("status3")==null?"":status.getString("status3").toString(),"status3");
		map.put(status.getString("status4")==null?"":status.getString("status4").toString(),"status4");
		map.put(status.getString("status5")==null?"":status.getString("status5").toString(),"status5");
		map.put(status.getString("status6")==null?"":status.getString("status6").toString(),"status6");
		map.put(status.getString("status7")==null?"":status.getString("status7").toString(),"status7");
		map.put(status.getString("status8")==null?"":status.getString("status8").toString(),"status8");
		map.put(status.getString("status9")==null?"":status.getString("status9").toString(),"status9");
		dicitem.put("status", map);
		
		BasicDBList rows =(BasicDBList)model.get("custom_fields");
		for (Object obj : rows) {
			BasicDBObject row =(BasicDBObject)obj;
			String type=row.getString("type");
			String dic=row.getString("_id");
			if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
				BasicDBObject choices=(BasicDBObject)row.get("choices");
				Iterator iterator=choices.keySet().iterator();
				Map<String,String> map2=new HashMap<String,String>();
				while(iterator.hasNext()){
					String key=(String)iterator.next();
					String value=choices.getString(key);
					map2.put(key, value);
				}
				dicitem.put(dic, map2);
			}
		}
	}
	
	public DBObject getCustTmpl(String id){
		DBObject result= MongoProvider.findOne("customer_template", new BasicDBObject("_id",id));
		return result;
	}
	
	public long queryRepeatCount2Name(String custName){
		DBObject doc=new BasicDBObject();
		doc.put("accountId",this.accountId);
		doc.put("dbType",this.dbType);
		doc.put("name",custName);		
		long count=MongoProvider.count(this.accountId+"_customer", doc, this.accountId);
		return count;
	}
	public long queryRepeatCount2Phone(String[] phone){
		if(phone==null || phone.length<=0) return 0;
		DBObject doc=new BasicDBObject();
		doc.put("accountId",this.accountId);
		doc.put("dbType",this.dbType);
		doc.put("phone.tel",new BasicDBObject("$in",phone));
		long count=MongoProvider.count(this.accountId+"_customer", doc, this.accountId);
		return count;
	}	
	
	public boolean isName() {
		return isName;
	}
	public void setName(boolean isName) {
		this.isName = isName;
	}
	public boolean isPhone() {
		return isPhone;
	}
	public void setPhone(boolean isPhone) {
		this.isPhone = isPhone;
	}

	public static void main(String[] args) {

	}
}
