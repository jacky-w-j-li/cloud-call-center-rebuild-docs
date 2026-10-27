package com.dishui.util.excel;

import java.sql.Array;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

public class CdrExport extends XssfWriter {
	private static Logger log = Logger.getLogger(CdrExport.class.getName());

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
		//获取技能组对比报表的表头
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject where=new BasicDBObject();
        
		String DBName = query.get("dataDB").toString();
		String accountId = query.get("accountId").toString();
		String CollectionName = accountId + "_c5_call_sheet";
		
		String cdrType = query.get("cdrExportType").toString();
		
		if(cdrType.equalsIgnoreCase("notdeal_call_sheet")){
			DBName = null;
			CollectionName = "c5_call_sheet_leak";
			where.put("ACCOUNT_ID", accountId);
		}else if(cdrType.equalsIgnoreCase("my_call_sheet")){
			where.put("DISPOSAL_AGENT", query.get("user").toString());
		}else if(cdrType.equalsIgnoreCase("my_notdeal_call_sheet")){
			List list = new ArrayList();
			list.add(new BasicDBObject("DISPOSAL_AGENT",query.get("user").toString()));
			list.add(new BasicDBObject("CALLBACK_AGENT",query.get("user").toString()));
			where.put("$or", list);
			DBName = null;
			CollectionName = "c5_call_sheet_leak";
			where.put("ACCOUNT_ID", accountId);
		}
			
        //解析查询条件
        if(query.get("OFFERING_TIME") != null && !query.get("OFFERING_TIME").equals("")){
            where.put("OFFERING_TIME",query.get("OFFERING_TIME"));
        }
        if(query.get("CALL_NO") != null && !query.get("CALL_NO").equals("")){
            where.put("CALL_NO",query.get("CALL_NO"));
        }
        if(query.get("CALLED_NO") != null && !query.get("CALLED_NO").equals("")){
            where.put("CALLED_NO",query.get("CALLED_NO"));
        }
        if(query.get("ERROR_MEMO") != null && !query.get("ERROR_MEMO").equals("")){
        	where.put("ERROR_MEMO", query.get("ERROR_MEMO"));
        }
        if(query.get("LEAK_TYPE") != null && !query.get("LEAK_TYPE").equals("")){
        	where.put("LEAK_TYPE", query.get("LEAK_TYPE"));
        }
        if(query.get("DISPOSAL_AGENT") != null && !query.get("DISPOSAL_AGENT").equals("")){
        	where.put("DISPOSAL_AGENT", query.get("DISPOSAL_AGENT"));
        }
        if(query.get("CONNECT_TYPE") != null && !query.get("CONNECT_TYPE").equals("")){
        	where.put("CONNECT_TYPE", query.get("CONNECT_TYPE"));
        }
        if(query.get("STATUS") != null && !query.get("STATUS").equals("")){
        	where.put("STATUS", query.get("STATUS"));
        }
        if(query.get("INVESTIGATE") != null && !query.get("INVESTIGATE").equals("")){
        	where.put("INVESTIGATE", query.get("INVESTIGATE"));
        }
        if(query.get("QUICK_QUERY_NUM") != null && !query.get("QUICK_QUERY_NUM").equals("")){
            where.put("QUICK_QUERY_NUM", query.get("QUICK_QUERY_NUM"));
        }
        boolean isSearchDate = false;
        DBObject dateCondition = new BasicDBObject();
        if(query.get("BEGIN_TIME") != null && !query.get("BEGIN_TIME").equals("")){
        	dateCondition.put("$gte",query.get("BEGIN_TIME"));
        	isSearchDate = true;
        }
        if(query.get("END_TIME") != null && !query.get("END_TIME").equals("")) {
        	dateCondition.put("$lte", query.get("END_TIME"));
        	isSearchDate = true;
        }
        if(isSearchDate) {
        	where.put("OFFERING_TIME", dateCondition);
        }
        if(query.get("QUALITY_GRADE_BEGIN") != null && !query.get("QUALITY_GRADE_BEGIN").equals("")
    			&& query.get("QUALITY_GRADE_END") != null && !query.get("QUALITY_GRADE_END").equals("")){
        	DBObject timeCondition = new BasicDBObject();
        	timeCondition.put("$gte", Double.parseDouble(query.get("QUALITY_GRADE_BEGIN").toString()));
        	timeCondition.put("$lte", Double.parseDouble(query.get("QUALITY_GRADE_END").toString()));
        	where.put("QUALITY_GRADE", timeCondition);
        }else if((query.get("QUALITY_GRADE_BEGIN") != null && !query.get("QUALITY_GRADE_BEGIN").equals("")) 
        		&& (query.get("QUALITY_GRADE_END") == null || query.get("QUALITY_GRADE_END").equals(""))){
        	where.put("$gte", Double.parseDouble(query.get("QUALITY_GRADE_BEGIN").toString()));
        }else if((query.get("QUALITY_GRADE_BEGIN") == null || query.get("QUALITY_GRADE_BEGIN").equals(""))
        		&& (query.get("QUALITY_GRADE_END") != null && !query.get("QUALITY_GRADE_END").equals(""))){
	    	where.put("$lte", Double.parseDouble(query.get("QUALITY_GRADE_END").toString()));
        }

        if(query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals("")
                && query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals("")){
            DBObject timeCondition = new BasicDBObject();
            timeCondition.put("$gte", Double.parseDouble(query.get("CALL_TIME_LENGTH_BEGIN").toString()));
            timeCondition.put("$lte", Double.parseDouble(query.get("CALL_TIME_LENGTH_END").toString()));
            where.put("CALL_TIME_LENGTH", timeCondition);
        }else if((query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                && (query.get("CALL_TIME_LENGTH_END") == null || query.get("CALL_TIME_LENGTH_END").equals(""))){
            DBObject timeCondition = new BasicDBObject();
            timeCondition.put("$gte", Double.parseDouble(query.get("CALL_TIME_LENGTH_BEGIN").toString()));
            where.put("CALL_TIME_LENGTH", timeCondition);
        }else if((query.get("CALL_TIME_LENGTH_BEGIN") == null || query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                && (query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals(""))){
            DBObject timeCondition = new BasicDBObject();
            timeCondition.put("$lte", Double.parseDouble(query.get("CALL_TIME_LENGTH_END").toString()));
            where.put("CALL_TIME_LENGTH", timeCondition);
        }

        if(query.get("KEY_TAG") != null && !query.get("KEY_TAG").equals("")) {
            if(query.get("KEY_TAG").equals("true")){
                where.put("KEY_TAG", true);
            }else{
                ArrayList keyTagFalseList = new ArrayList();
                keyTagFalseList.add(null);
                where.put("KEY_TAG",new BasicDBObject("$in",keyTagFalseList));
            }
        }

        if(query.get("CUSTOMER_NAME") != null && !query.get("CUSTOMER_NAME").equals("")) {
            if(query.get("CUSTOMER_NAME").equals("true")){
                where.put("CUSTOMER_ID", new BasicDBObject("$ne","00000000000000000000"));
            }else{
                where.put("CUSTOMER_NAME",query.get("CUSTOMER_NAME"));
                where.put("CUSTOMER_ID","00000000000000000000");
            }
        }
        if(query.get("combox") != null && !query.get("combox").equals("")) {
            String value=query.get("combox").toString();
            BasicDBList  combox=new  BasicDBList();
            DBObject c1=new BasicDBObject("CALL_NO",value);
            DBObject c2=new BasicDBObject("CALLED_NO",value);
            combox.add(c1);
            combox.add(c2);
            where.put("$or", combox);
            query.remove("combox");
        }

        Object idObj=query.get("_id");
        if(idObj != null && !idObj.equals("")) {
//            BasicDBList list=new BasicDBList();
//            DBObject db=new BasicDBObject("$in",list);
            where.put("_id",idObj);
        }
		DBCollection collection = null;
		if(DBName == null){
			collection = MongoConnect.getInstance().getDB().getCollection(CollectionName);
		}else{
			collection = MongoConnect.getInstance().getDB(DBName).getCollection(CollectionName);			
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
}
