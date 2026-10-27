package com.dishui.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;

public class CustomerExport extends XssfWriter {
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
        String dbName= MongoProvider.getAccountDB(accountId);
		DBCollection collection = MongoConnect.getInstance().getDB(dbName).getCollection(accountId+"_customer");
		DBObject where=new BasicDBObject();
		setQueryCondition(query);
		where.putAll(query);
		DBCursor cursor = collection.find(where).batchSize(10000);
		genrateHeader(heads);
        log.info("cursor.size()====" + cursor.size());
        Runtime run = Runtime.getRuntime();
        long max1 = run.maxMemory();
        long total1 = run.totalMemory();
        long free1 = run.freeMemory();
        long usable1 = max1 - total1 + free1;
        log.info("generate 最大可用内存 = " + usable1/1024/1024+"M");
        int num=0;
		while (cursor.hasNext()) {
            long time = System.currentTimeMillis();
			DBObject obj = cursor.next();
//            long duration = System.currentTimeMillis() - time;
//            if(duration>100){
//                num++;
//                System.out.println("batch========================"+num);
//                String msg = String.format("%s消耗时间[%d ms]", "parse sheet", duration);
//                log.info(msg);
//            }

			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				//外呼任务和拨打状态
				if(obj.get("taskCalled")==null && obj.get("taskId")!=null){
					obj.put("taskCalled","2");
				}
				if(temp!=null && heads.get(i).getFieldId().equals("phone")){
					BasicDBList tels=(BasicDBList)temp;
					StringBuffer phone=new StringBuffer();
					for(Object tel : tels){
                        String _memo=(String)((BasicDBObject)tel).get("memo");
                        String _tel=(String)((BasicDBObject)tel).get("tel");
                        if(_memo!=null&&!_memo.trim().equals("")){
                            phone.append(_tel+"|"+_memo).append(",");
                        }else{
                            phone.append(_tel).append(",");
                        }
					}
					String p=phone.toString();
					if(p.lastIndexOf(",")!=-1){
						p=p.substring(0, p.length() - 1);
					}
					createCell(i,p);
                }else if(temp!=null && heads.get(i).getFieldId().equals("email") && !"".equals(temp)){
                    if(temp instanceof String){
                        createCell(i,temp==null?"":temp.toString());
                    }else{
                        BasicDBList emails=(BasicDBList)temp;
                        StringBuffer email=new StringBuffer();
                        for(Object field : emails){
                            String _memo=(String)((BasicDBObject)field).get("memo");
                            String _mail=(String)((BasicDBObject)field).get("email");
                            if(_memo!=null&&!_memo.trim().equals("")){
                                email.append(_mail+"|"+_memo).append(",");
                            }else{
                                email.append(_mail).append(",");
                            }
//                            email.append(((BasicDBObject)field).get("email").toString()).append(",");
                        }
                        String p=email.toString();
                        if(p.lastIndexOf(",")!=-1){
                            p=p.substring(0,p.length()-1);
                        }
                        createCell(i,p);
                    }
                }else if(temp!=null && heads.get(i).getFieldId().equals("weixin")){
                    BasicDBList weixins=(BasicDBList)temp;
                    StringBuffer weixin=new StringBuffer();
                    for(Object field : weixins){
                        String _memo=(String)((BasicDBObject)field).get("memo");
                        String _num=(String)((BasicDBObject)field).get("num");
                        if(_memo!=null&&!_memo.trim().equals("")){
                            weixin.append(_num+"|"+_memo).append(",");
                        }else{
                            weixin.append(_num).append(",");
                        }
//                        weixin.append(((BasicDBObject)field).get("num").toString()).append(",");
                    }
                    String p=weixin.toString();
                    if(p.lastIndexOf(",")!=-1){
                        p=p.substring(0,p.length()-1);
                    }
                    createCell(i,p);
				}else if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
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
            if(rownum%10000==0){
//                log.info("当前线程名字：" + Thread.currentThread().getName() + " ID:" + Thread.currentThread().getId());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
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
	
	public List<ExportModelVo> getHeaders(String tmplId){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();
		DBObject model= MongoProvider.findOne("customer_template", new BasicDBObject("_id", tmplId));

//		BasicDBObject stable=(BasicDBObject)model.get("stable_fields");
		BasicDBList stable=(BasicDBList)model.get("stable_fields");
		BasicDBList rows =(BasicDBList)model.get("custom_fields");
		BasicDBList source=(BasicDBList)model.get("source");
		
		
		Iterator iterator=stable.keySet().iterator();
		while(iterator.hasNext()){
			String key=(String)iterator.next();
			BasicDBObject field =(BasicDBObject)stable.get(key);
			String name =(String)field.get("name");
			String value =(String)field.get("value");
			ExportModelVo vo=new ExportModelVo();
			vo.setFieldId(name);
			vo.setFieldName(value);
			vo.setDicName("");
			if("sex".equals(name)){
				vo.setDicName("sex");
			}else if("province".equals(name)){
				vo.setDicName("province");
			}else if("city".equals(name)){
				vo.setDicName("city");
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
		field5.setFieldName("归属");
		field5.setDicName("user");
		list.add(field5);

        ExportModelVo _field5=new ExportModelVo();
        _field5.setFieldId("owner");
        _field5.setFieldName("所属人工号");
        _field5.setDicName("empNo");
        list.add(_field5);

		ExportModelVo field8=new ExportModelVo();
		field8.setFieldId("taskId");
		field8.setFieldName("外呼任务");
		field8.setDicName("taskName");
		list.add(field8);

		ExportModelVo field9=new ExportModelVo();
		field9.setFieldId("taskCalled");
		field9.setFieldName("拨打状态");
		field9.setDicName("taskDialStatus");
		list.add(field9);

		if(source!=null && source.size()>0){
			ExportModelVo field2=new ExportModelVo();
			field2.setFieldId("custsource1");
			field2.setFieldName("数据来源");
			field2.setDicName("source1");
			
			list.add(field2);
		}

		ExportModelVo field10=new ExportModelVo();
		field10.setFieldId("sysStatus");
		field10.setFieldName("跟进状态");
		field10.setDicName("sysStatus");
		list.add(field10);
		ExportModelVo field11=new ExportModelVo();
		field11.setFieldId("categoryId");
		field11.setFieldName("公海来源");
		field11.setDicName("category");
		list.add(field11);
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
        setSysDic();
		//外呼任务和拨打状态
		setDialStatusDic();
		setTaskDic();
	}
	public void setDialStatusDic(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("2", "未拨打");
		map.put("0", "未接听");
		map.put("1", "已接听");
		dics.put("taskDialStatus", map);
	}
	public void setTaskDic(){
		DBObject where=new BasicDBObject();
		List<DBObject> list= MongoProvider.find("cc", "customer_task", where);
		Map<String,String> map=new HashMap<String,String>();
		if(list!=null){
			for(int i=0;i<list.size();i++){
				DBObject j = list.get(i);
				map.put(j.get("_id").toString(),j.get("taskName").toString());
			}
		}
		dics.put("taskName", map);
	}
	public void setSex(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("0", "男");
		map.put("1", "女");
		dics.put("sex", map);
	}
	public void setSysDic(){
		DBObject where=new BasicDBObject();
		where.put("_id", "d7b9c68a-b50f-21d1-d5fd-41ea93f5f49c");
        DBObject dic= MongoProvider.findOne("app_optiondic", where);
		Map<String,String> map=new HashMap<String,String>();
		Map<String,String> map2=new HashMap<String,String>();
        if(dic!=null){
            List<DBObject> options=(List<DBObject>)dic.get("options");
            for (DBObject o : options) {
                map.put(o.get("key").toString(), o.get("name").toString());
                List<DBObject> options2=(List<DBObject>)o.get("options");
                for (DBObject o2 : options2) {
                    map2.put(o2.get("key").toString(), o2.get("name").toString());
                }
            }
        }

		dics.put("province", map);
		dics.put("city", map2);
	}
    public void setUserDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        where.put("product", "cc");
        List<DBObject> list= MongoProvider.find("bill", "platform_user", where);
        Map<String,String> map=new HashMap<String,String>();
        Map<String,String> map2=new HashMap<String,String>();
		Map<String,String> map3= new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("displayName").toString());
            map2.put(o.get("_id").toString(), o.get("exten").toString());
        }
		DBObject condition = new BasicDBObject();
		condition.put("account",accountId);
		List<DBObject> poolList = MongoProvider.find("cc", "app_customer_pool", condition);
		for(DBObject c : poolList){
			map.put(c.get("_id").toString(),c.get("cName").toString());
		}
		DBObject query = new BasicDBObject();
		query.put("code_type","sys_status");
		List<DBObject> dicList = MongoProvider.find("cc", "app_dic_codes", query);
		for(DBObject q:dicList){
			map3.put(q.get("code_value").toString(),q.get("code_name").toString());
		}
        dics.put("user", map);
		dics.put("category",map);
        dics.put("empNo", map2);
		dics.put("sysStatus",map3);
    }
    private void setQueryCondition(Map<String, Object> query){
        query.remove("menu");
        query.remove("dbType");
        query.remove("accountId");
//        query.put("delTag", null);
		//外呼任务和拨打状态
		if(query.get("taskCalled")!=null){
			if("2".equals(query.get("taskCalled"))){
				query.put("taskCalled",new BasicDBObject("$exists",false));
			}
			if(query.get("taskId")==null){
				query.put("taskId",new BasicDBObject("$exists",true));
			}
		}

        List<String> fields=new ArrayList<String>();
        Iterator<String> iterator=query.keySet().iterator();
        while(iterator.hasNext()){
            String field=iterator.next();
            if(field.indexOf("begin_date")!=-1 || field.indexOf("end_date")!=-1){
                fields.add(field.substring(0, field.indexOf("_")));
            }
            Object values=query.get(field);
            if(values instanceof List){
                if(((List)values).size()>0){
                    DBObject db=new BasicDBObject("$all",values);
                    query.put(field, db);
                }
            }
        }
        Set<String> set=new HashSet<String>();
        set.addAll(fields);
        for (String field : set) {
            DBObject db=new BasicDBObject();
            if(query.containsKey(field+"_begin_date") && query.containsKey(field+"_end_date")){
                String val1=query.get(field+"_begin_date").toString();
                String val2=query.get(field+"_end_date").toString();
                db.put("$gte", val1);
                db.put("$lte", val2);
            }else if(query.containsKey(field+"_begin_date")){
                String val=query.get(field+"_begin_date").toString();
                db.put("$gte", val);
            }else if(query.containsKey(field+"_end_date")){
                String val=query.get(field+"_end_date").toString();
                db.put("$lte", val);
            }
            query.put(field, db);
            query.remove(field+"_begin_date");
            query.remove(field+"_end_date");
        }

//        if(query.get("combox")!=null){
//            String value=query.get("combox").toString();
//            BasicDBList combox=new BasicDBList();
//            String _value= CommonUtil.escapeRegex(value);
//            Pattern pattern= Pattern.compile("^"+_value);
//            DBObject c1=new BasicDBObject("name",pattern);
//            DBObject c2=new BasicDBObject("phone.tel",value);
//            combox.add(c1);
//            combox.add(c2);
//            query.put("$or", combox);
//            query.remove("combox");
//        }
        if(query.get("owner")!=null && query.get("owner").toString().equals("empty")){
            BasicDBList list=new BasicDBList();
            list.add("");
            list.add(null);
            DBObject db=new BasicDBObject("$in",list);
            query.put("owner", db);
        }
		if(query.get("email")!=null){
			String val = query.get("email").toString();
			query.put("email.email",val);
			query.remove("email");
		}
		if(query.get("phone")!=null){
			String val = query.get("phone").toString();
			query.put("phone.tel",val);
			query.remove("phone");
		}
//        if(query.get("name")!=null){
//            String value=query.get("name").toString();
//            String _value= CommonUtil.escapeRegex(value);
//            Pattern pattern= Pattern.compile("^"+_value);
//            query.put("name",pattern);
//        }

        if(query.get("custsource1")!=null && query.get("custsource1").equals("NA")){
            query.put("custsource1","");
        }

        if(query.get("weixin")!=null){
            String val = query.get("weixin").toString();
            BasicDBList combox=new BasicDBList();
            DBObject c1=new BasicDBObject("weixin.num",val);
            DBObject c2=new BasicDBObject("weixin.memo",val);
            combox.add(c1);
            combox.add(c2);
            query.put("$or", combox);
//            query.put("weixin.num",val);
            query.remove("weixin");
        }

    }
}
