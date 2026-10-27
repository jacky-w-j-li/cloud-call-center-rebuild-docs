package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;

public class AccountExport extends XssfWriter {
	private static Logger log = Logger.getLogger(AccountExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

	
	@Override
	public void generate(Map<String,Object> query) throws Exception {
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        String dbName= "bill";
		DBCollection collection = MongoConnect.getInstance().getDB(dbName).getCollection("platform_account");
		DBObject where=new BasicDBObject();
        Map<String,Object> query2=new HashMap<String, Object>();
		setQueryCondition(query2);
		where.putAll(query2);
		DBCursor cursor = collection.find(where).batchSize(10000);
		genrateHeader(heads);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());

				if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String desc="";
                    String dicName=heads.get(i).getDicName();
                    if(temp instanceof List){
                        StringBuffer checkStr=new StringBuffer();
                        BasicDBList checkVals=(BasicDBList)temp;
                        for(Object o : checkVals){
                            String t1=dics.get(dicName).get((String)o)==null?"":dics.get(dicName).get((String)o).toString();
                            checkStr.append(t1).append(",");
                        }
                        desc=checkStr.toString();
                        if(desc.lastIndexOf(",")!=-1){
                            desc=desc.substring(0,desc.length()-1);
                        }
                    }else{
                        desc=dics.get(dicName).get(temp);
                    }

					createCell(i,desc);
				}else{
					createCell(i,temp==null?"":temp.toString());
				}
				
				
			}
//			log.info(obj.toString());
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
		field1.setFieldId("name");
		field1.setFieldName("登录名");
		field1.setDicName("");
		list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("companyName");
        field2.setFieldName("公司名");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("createUser");
        field3.setFieldName("所属人");
        field3.setDicName("user");
        list.add(field3);

        ExportModelVo _field4=new ExportModelVo();
        _field4.setFieldId("status");
        _field4.setFieldName("状态");
        _field4.setDicName("status");
        list.add(_field4);


        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("businessTag");
        field5.setFieldName("标记");
        field5.setDicName("businessTag");
        list.add(field5);

		ExportModelVo field6=new ExportModelVo();
		field6.setFieldId("createTime");
		field6.setFieldName("创建时间");
		field6.setDicName("");
		list.add(field6);
		
		setFieldDic();
		return list;
	}
	public void setFieldDic(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("normal", "正式");
		map.put("newTry", "");
		map.put("stop", "");
		map.put("try", "");
		map.put("free", "");

		dics.put("status", map);
		setUserDic();
        setFlag();
	}
	public void setDialStatusDic(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("2", "未拨打");
		map.put("0", "未接听");
		map.put("1", "已接听");
		dics.put("taskDialStatus", map);
	}

	public void setFlag(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("service", "售后服务");
		map.put("work", "办公电话");
		map.put("study", "教育留学");
		map.put("express", "物流货运");
		map.put("outcall", "D1");
		map.put("batchcall", "D2");
		map.put("voicebatchcall", "D3");
		map.put("viewMobile", "T1");
		map.put("viewTel", "T2");
		map.put("leavWarn", "流失预警");
		map.put("fraud", "ZP");
		map.put("health", "保健品");
		map.put("collection", "收藏品");
		map.put("tryLeave", "试用流失");
		map.put("sms", "短信业务");
		map.put("customDialPlan", "拨号方案定制");
		map.put("l1", "L1");
		map.put("l2", "L2");
		map.put("l3", "L3");
		map.put("outbound", "外呼为主");
		dics.put("businessTag", map);
	}

    public void setUserDic(){
        DBObject where=new BasicDBObject();
        List<DBObject> list= MongoProvider.find("bill", "bill_system_user", where);
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("name").toString());
        }
        dics.put("user", map);
    }
    private void setQueryCondition(Map<String, Object> query){
        query.put("status", "normal");
        query.put("businessTag", "l3");
//        BasicDBList list=new BasicDBList();
//            list.add("invest"); //投资理财
//            list.add("collection"); //收藏品
//            list.add("health"); //保健品
//        DBObject db=new BasicDBObject("$in",list);
    }
}
