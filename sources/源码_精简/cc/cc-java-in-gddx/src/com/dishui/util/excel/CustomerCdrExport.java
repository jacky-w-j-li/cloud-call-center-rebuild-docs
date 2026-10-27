package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class CustomerCdrExport extends XssfWriter {
	private static Logger log = Logger.getLogger(CustomerCdrExport.class.getName());

    private String accountId;

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub

        accountId=query.get("accountId").toString();
        String dbName= MongoProvider.getAccountDB(accountId);
        DBObject whereCust=new BasicDBObject();
        setQueryCondition(query);
        whereCust.putAll(query);
        List<DBObject> custIdList = MongoProvider.find(dbName, accountId+"_customer", whereCust, new BasicDBObject("_id",1));
        ArrayList<String> idList = new ArrayList<String>();
        for(int i=0; i<custIdList.size() ; i++){
            idList.add(custIdList.get(i).get("_id").toString());
        }
		//获取技能组对比报表的表头
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject where=new BasicDBObject();
        where.put("CUSTOMER_ID",new BasicDBObject("$in",idList));
		String CollectionName = accountId + "_c5_call_sheet";

		DBCollection collection = null;
		if(dbName == null){
			collection = MongoConnect.getInstance().getDB().getCollection(CollectionName);
		}else{
			collection = MongoConnect.getInstance().getDB(dbName).getCollection(CollectionName);
		}
		DBObject sort = new BasicDBObject("OFFERING_TIME",-1);
		DBCursor cursor = collection.find(where).sort(sort);
		genrateHeader(heads);
		
		//查询账户下所有坐席
		DBObject whereAgent = new BasicDBObject();
		whereAgent.put("account", accountId);
        whereAgent.put("product","cc");
		DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
		Map<String,String> agentNameMap = new HashMap<String,String>();
        Map<String,String> agentExtenMap = new HashMap<String,String>();
		while (agentCursor.hasNext()) {
			DBObject obj = agentCursor.next();
			agentNameMap.put(obj.get("_id").toString(), obj.get("displayName").toString());
            agentExtenMap.put(obj.get("_id").toString(), obj.get("exten").toString());
		}
		//查询满意度配置项
		DBObject whereInvest = new BasicDBObject();
		whereInvest.put("accountId", accountId);
		whereInvest.put("name", "满意度调查选项");
		DBCursor investCursor = MongoConnect.getInstance().getDB().getCollection("app_optiondic").find(whereInvest);
		Map<String,String> investNameMap = new HashMap<String,String>();
		while (investCursor.hasNext()) {
            DBObject obj = investCursor.next();
            List<DBObject> opitons= (List<DBObject>)obj.get("options");
            for (DBObject one : opitons) {
                List<DBObject> childOptions = (List<DBObject>)one.get("options");

                investNameMap.put(childOptions.get(0).get("name").toString(), one.get("name").toString());
            }
		}
		
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			//计算通话时长
			String beginTime = null;
			String endTime = null;
			if(obj.get("BEGIN_TIME") != null){
				beginTime = obj.get("BEGIN_TIME").toString(); 
			}
			if(obj.get("END_TIME") != null){
				endTime = obj.get("END_TIME").toString();
			}
			obj.put("TALK_TIME",calculateTalkTime(beginTime,endTime));
			
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				
				if(temp!=null && heads.get(i).getFieldId().equals("CONNECT_TYPE")){
					if(temp.toString().equalsIgnoreCase("normal")){
						createCell(i,"普通来电");
					}else if(temp.toString().equalsIgnoreCase("dialout")){
						createCell(i,"外呼去电");
					}else if(temp.toString().equalsIgnoreCase("transfer")){
						createCell(i,"转接来电");
					}else if(temp.toString().equalsIgnoreCase("dialTransfer")){
						createCell(i,"外呼转接");
					}else if(temp.toString().equalsIgnoreCase("none")){
						createCell(i,"未知");
					}else{
						createCell(i,"");
					}
				}else if(temp!=null && heads.get(i).getFieldId().equals("STATUS")){
					if(temp.toString().equalsIgnoreCase("dealing")){
						createCell(i,"已接听");
					}else if(temp.toString().equalsIgnoreCase("notDeal")){
						createCell(i,"振铃未接听");
					}else if(temp.toString().equalsIgnoreCase("leak")){
						createCell(i,"ivr");
					}else if(temp.toString().equalsIgnoreCase("voicemail")){
						createCell(i,"已留言");
					}else if(temp.toString().equalsIgnoreCase("queueLeak")){
                        createCell(i,"排队放弃");
                    }else if(temp.toString().equalsIgnoreCase("blackList")){
                        createCell(i,"黑名单");
                    }else{
						createCell(i,"");
					}
				}else if(temp!=null && heads.get(i).getFieldId().equals("QUEUE_TIME_LENGTH")){
					createCell(i, formatTime(Integer.parseInt(temp.toString())) );
					
				}else if(temp!=null && heads.get(i).getFieldId().equals("DISPOSAL_AGENT")){
					if(agentNameMap.containsKey(temp.toString())){
						createCell(i,agentNameMap.get(temp.toString()));
					}else{
						createCell(i,"");
					}
				}else if(temp!=null && heads.get(i).getFieldId().equals("INVESTIGATE")){
					if(investNameMap.containsKey(temp.toString())){
						createCell(i,investNameMap.get(temp.toString()));
					}else{
						createCell(i,"");
					}
				}else if(temp!=null && heads.get(i).getFieldId().equals("KEY_TAG")){
                    if(temp.toString().equals("true")){
                        createCell(i,"是");
                    }else{
                        createCell(i,"");
                    }
				}else if(heads.get(i).getFieldId().equals("EXTEN")){
                    if(obj.get("DISPOSAL_AGENT") != null){
                        String agentId = obj.get("DISPOSAL_AGENT").toString();
                        if(agentExtenMap.containsKey(agentId)){
                            createCell(i,agentExtenMap.get(agentId));
                        }else{
                            createCell(i,"");
                        }
                    }
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
		
		ExportModelVo vo=new ExportModelVo();
		vo.setFieldId("CUSTOMER_NAME");
		vo.setFieldName("定位客户");
		vo.setDicName("");
		list.add(vo);
		
		ExportModelVo vo1=new ExportModelVo();
		vo1.setFieldId("CALL_NO");
		vo1.setFieldName("主叫号码");
		vo1.setDicName("");
		list.add(vo1);

		ExportModelVo vo2=new ExportModelVo();
		vo2.setFieldId("CALLED_NO");
		vo2.setFieldName("被叫号码");
		vo2.setDicName("");
		list.add(vo2);

		ExportModelVo vo3=new ExportModelVo();
		vo3.setFieldId("CONNECT_TYPE");
		vo3.setFieldName("呼叫类型");
		vo3.setDicName("");
		list.add(vo3);

		ExportModelVo vo4=new ExportModelVo();
		vo4.setFieldId("OFFERING_TIME");
		vo4.setFieldName("呼叫时间");
		vo4.setDicName("");
		list.add(vo4);
		
		ExportModelVo vo5=new ExportModelVo();
		vo5.setFieldId("BEGIN_TIME");
		vo5.setFieldName("摘机时间");
		vo5.setDicName("");
		list.add(vo5);
		
		ExportModelVo vo6=new ExportModelVo();
		vo6.setFieldId("TALK_TIME");
		vo6.setFieldName("通话时长");
		vo6.setDicName("");
		list.add(vo6);
		
		ExportModelVo vo7=new ExportModelVo();
		vo7.setFieldId("DISPOSAL_AGENT");
		vo7.setFieldName("接听座席");
		vo7.setDicName("");
		list.add(vo7);

        ExportModelVo vo18=new ExportModelVo();
        vo18.setFieldId("EXTEN");
        vo18.setFieldName("座席工号");
        vo18.setDicName("");
        list.add(vo18);

		ExportModelVo vo8=new ExportModelVo();
		vo8.setFieldId("STATUS");
		vo8.setFieldName("处理状态");
		vo8.setDicName("");
		list.add(vo8);
		
		ExportModelVo vo9=new ExportModelVo();
		vo9.setFieldId("QUEUE_NAME");
		vo9.setFieldName("呼入技能组");
		vo9.setDicName("");
		list.add(vo9);
		
//		ExportModelVo vo10=new ExportModelVo();
//		vo10.setFieldId("CUSTOMER_NAME");
//		vo10.setFieldName("终结节点");
//		vo10.setDicName("");
//		list.add(vo10);
		
		ExportModelVo vo11=new ExportModelVo();
		vo11.setFieldId("INVESTIGATE");
		vo11.setFieldName("满意度");
		vo11.setDicName("");
		list.add(vo11);

        ExportModelVo vo16=new ExportModelVo();
        vo16.setFieldId("PROVINCE");
        vo16.setFieldName("省份");
        vo16.setDicName("");
        list.add(vo16);

        ExportModelVo vo17=new ExportModelVo();
        vo17.setFieldId("DISTRICT");
        vo17.setFieldName("城市");
        vo17.setDicName("");
        list.add(vo17);

        ExportModelVo vo15=new ExportModelVo();
		vo15.setFieldId("KEY_TAG");
		vo15.setFieldName("标记");
		vo15.setDicName("");
		list.add(vo15);
		
//		ExportModelVo vo14=new ExportModelVo();
//		vo14.setFieldId("QUALITY_GRADE");
//		vo14.setFieldName("质检评分");
//		vo14.setDicName("");
//		list.add(vo14);
		
		ExportModelVo vo12=new ExportModelVo();
		vo12.setFieldId("QUEUE_TIME_LENGTH");
		vo12.setFieldName("排队时长");
		vo12.setDicName("");
		list.add(vo12);
		
		ExportModelVo vo13=new ExportModelVo();
		vo13.setFieldId("END_TIME");
		vo13.setFieldName("挂机时间");
		vo13.setDicName("");
		list.add(vo13);

        ExportModelVo vo19=new ExportModelVo();
        vo19.setFieldId("COMMENTS");
        vo19.setFieldName("备注");
        vo19.setDicName("");
        list.add(vo19);
			
		return list;
	}
	
	public String calculateTalkTime(String beginTimeStr,String endTimeStr){
		if(beginTimeStr == null || beginTimeStr.equals("") || endTimeStr == null || endTimeStr.equals("") ){
			return "00:00:00";
		}
		SimpleDateFormat formatDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Long beginTime = null;
        Long endTime = null;
        try {
            beginTime = formatDate.parse(beginTimeStr).getTime();
            endTime = formatDate.parse(endTimeStr).getTime();

		    } catch (Exception e) {
		        e.printStackTrace();
		        log.log(Level.WARNING,"calculateTalkTime error!",e);
		    }
        
        int hours=(int) ((endTime - beginTime)/3600000);
        int minutes=(int) (((endTime - beginTime)/1000-hours*3600)/60);
        int second=(int) ((endTime - beginTime)/1000-hours*3600-minutes*60);
        String hoursStr = String.valueOf(hours);
        String minutesStr = String.valueOf(minutes);
        String secondStr = String.valueOf(second);
        if(hours < 10){
        	hoursStr =  "0" + hoursStr;
        }
        if(minutes < 10){
        	minutesStr = "0" + minutesStr;
        }
        if(second < 10){
        	secondStr = "0" + secondStr;
        }
        return hoursStr+":"+minutesStr+":"+secondStr;
	}
	
	public String formatTime(int seconds){
		String result = "00:00:00";
		String hourStr = null;
		String minuteStr = null;
		String secondStr = null;
		if(seconds > 0){
	        int hour = seconds / 3600;
	        int minute = (seconds % 3600) / 60;
	        int second = seconds % 60;
	        if(hour < 10){
	            hourStr = "0" + hour;
	        }else{
	        	hourStr = "" + hour;
	        }
	        if(minute < 10){
	            minuteStr = "0" + minute;
	        }else{
	        	minuteStr = "" + minute;
	        }
	        if(second < 10){
	            secondStr = "0" + second;
	        }else{
	        	secondStr = "" + second;
	        }
	        result = hourStr + ":" + minuteStr + ":" + secondStr;
	    }
	    return result;
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

        if(query.get("combox")!=null){
            String value=query.get("combox").toString();
            BasicDBList combox=new  BasicDBList();
            Pattern pattern= Pattern.compile(value);
            DBObject c1=new BasicDBObject("name",pattern);
            DBObject c2=new BasicDBObject("phone.tel",value);
            combox.add(c1);
            combox.add(c2);
            query.put("$or", combox);
            query.remove("combox");
        }
        if(query.get("owner")!=null && query.get("owner").toString().equals("empty")){
            BasicDBList  list=new  BasicDBList();
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
        if(query.get("weixin")!=null){
            String val = query.get("weixin").toString();
            BasicDBList  combox=new  BasicDBList();
            DBObject c1=new BasicDBObject("weixin.num",val);
            DBObject c2=new BasicDBObject("weixin.memo",val);
            combox.add(c1);
            combox.add(c2);
            query.put("$or", combox);
            query.remove("weixin");
        }
    }
}
