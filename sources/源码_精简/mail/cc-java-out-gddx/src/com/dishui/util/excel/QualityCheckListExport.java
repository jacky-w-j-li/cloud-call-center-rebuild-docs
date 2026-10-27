package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class QualityCheckListExport extends XssfWriter {
	private static Logger log = Logger.getLogger(QualityCheckListExport.class.getName());

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
		//获取表头
		List<ExportModelVo> heads=getHeaders();
        DBObject findTemplate = new BasicDBObject("_id",query.get("TEMPLATE"));
        DBObject curTemplate = MongoConnect.getInstance().getDB().getCollection("manager_quality_check_config").findOne(findTemplate);

        float Ab = Float.parseFloat(curTemplate.get("A-begin").toString());
        float Bb = Float.parseFloat(curTemplate.get("B-begin").toString());
        float Be = Float.parseFloat(curTemplate.get("B-end").toString());
        float Cb = Float.parseFloat(curTemplate.get("C-begin").toString());
        float Ce = Float.parseFloat(curTemplate.get("C-end").toString());
        float De = Float.parseFloat(curTemplate.get("D-end").toString());

        List<DBObject> tempConfigList = (ArrayList<DBObject>)curTemplate.get("config");
        for(int i=0 ; i < tempConfigList.size(); i++) {
            ExportModelVo tvo=new ExportModelVo();
		    tvo.setFieldId(tempConfigList.get(i).get("order").toString());
		    tvo.setFieldName(tempConfigList.get(i).get("name").toString()+"("+tempConfigList.get(i).get("weight").toString()+"%)");
		    tvo.setDicName("");
		    heads.add(tvo);
        }

	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject where=new BasicDBObject();

		String accountId = query.get("accountId").toString();
		String CollectionName = "app_call_sheet_quality_check";

			
        //解析查询条件
        if(query.get("TEMPLATE") != null && !query.get("TEMPLATE").equals("")){
            where.put("TEMPLATE", query.get("TEMPLATE"));
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
        if(query.get("DISPOSAL_AGENT") != null && !query.get("DISPOSAL_AGENT").equals("")){
        	where.put("DISPOSAL_AGENT", query.get("DISPOSAL_AGENT"));
        }
        if(query.get("CONNECT_TYPE") != null && !query.get("CONNECT_TYPE").equals("")){
        	where.put("CONNECT_TYPE", query.get("CONNECT_TYPE"));
        }
        if(query.get("INVESTIGATE") != null && !query.get("INVESTIGATE").equals("")){
        	where.put("INVESTIGATE", query.get("INVESTIGATE"));
        }
        if(query.get("GRADE_USER") != null && !query.get("GRADE_USER").equals("")){
            where.put("GRADE_USER", query.get("GRADE_USER"));
        }
        if(query.get("LEVEL") != null && !query.get("LEVEL").equals("")){
            String curLevel = query.get("LEVEL").toString();
            if(curLevel.equals("A")){
                where.put("GRADE_AMOUNT", new BasicDBObject("$gte", Ab - 0.5));
            }else if(curLevel.equals("B")){
                where.put("GRADE_AMOUNT", new BasicDBObject("$gte", Bb - 0.5).append("$lte", Be + 0.4));
            }else if(curLevel.equals("C")){
                where.put("GRADE_AMOUNT", new BasicDBObject("$gte", Cb - 0.5).append("$lte", Ce +0.4));
            }else if(curLevel.equals("D")){
                where.put("GRADE_AMOUNT", new BasicDBObject("$lte", De + 0.4));
            }
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

        if(query.get("GRADE_CONFIG") != null && !query.get("GRADE_CONFIG").equals("")) {
            DBObject gradeCondition = null;
            String configId = query.get("GRADE_CONFIG").toString();
            if(query.get("GRADE_MIN") != null && !query.get("GRADE_MIN").equals("")){
                float gradeMin = Float.parseFloat(query.get("GRADE_MIN").toString());
                if(gradeMin >= 0) {
                    if(gradeCondition == null){
                        gradeCondition = new BasicDBObject();
                    }
                    gradeCondition.put("$gte", gradeMin);
                }
            }
            if(query.get("GRADE_MAX") != null && !query.get("GRADE_MAX").equals("")){
                float gradeMax = Float.parseFloat(query.get("GRADE_MAX").toString());
                if(gradeMax >= 0) {
                    if(gradeCondition == null){
                        gradeCondition = new BasicDBObject();
                    }
                    gradeCondition.put("$lte", gradeMax);
                }
            }
            if(gradeCondition != null) {
                where.put(configId, gradeCondition);
            }
        }

		DBCollection collection = MongoConnect.getInstance().getDB().getCollection(CollectionName);

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
			agentNameMap.put(obj.get("_id").toString(), obj.get("displayName").toString()+"["+obj.get("exten").toString()+"]");
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
        //查询技能组
        DBObject whereQueue = new BasicDBObject();
        whereInvest.put("Account", accountId);
        DBCursor queueCursor = MongoConnect.getInstance().getDB().getCollection("manager_ivr_skillgroup").find(whereQueue);
        Map<String,String> queueNameMap = new HashMap<String,String>();
        while (queueCursor.hasNext()) {
            DBObject obj = queueCursor.next();
            queueNameMap.put(obj.get("Exten").toString(), obj.get("DisplayName").toString());
        }
		
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			//计算通话时长
			obj.put("TALK_TIME",formatTime(Integer.parseInt(obj.get("CALL_TIME_LENGTH").toString())));
			
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
				}else if(heads.get(i).getFieldId().equals("GRADE_USER")){
                    if(obj.get("GRADE_USER") != null){
                        String agentId = obj.get("GRADE_USER").toString();
                        if(agentNameMap.containsKey(agentId)){
                            createCell(i,agentNameMap.get(agentId));
                        }else{
                            createCell(i,"");
                        }
                    }
                }else if(heads.get(i).getFieldId().equals("CHECK_LEVEL")){
                    if(obj.get("GRADE_AMOUNT") != null){
                        float amonut = Math.round(Float.parseFloat(obj.get("GRADE_AMOUNT").toString()));
                        if(amonut >= Ab){
                            createCell(i, "优秀");
                        }else if(amonut >= Bb && amonut <= Be){
                            createCell(i, "合格");
                        }else if(amonut >= Cb && amonut <= Ce){
                            createCell(i, "提醒");
                        }else if(amonut <= De){
                            createCell(i, "不合格");
                        }
                    }
                }else if(heads.get(i).getFieldId().equals("ERROR_MEMO")){
                    if(obj.get("ERROR_MEMO") != null){
                        String queueId = obj.get("ERROR_MEMO").toString();
                        if(queueNameMap.containsKey(queueId)){
                            createCell(i,queueNameMap.get(queueId));
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

        ExportModelVo vo7=new ExportModelVo();
        vo7.setFieldId("DISPOSAL_AGENT");
        vo7.setFieldName("接听座席");
        vo7.setDicName("");
        list.add(vo7);

        ExportModelVo vo3=new ExportModelVo();
        vo3.setFieldId("CONNECT_TYPE");
        vo3.setFieldName("呼叫类型");
        vo3.setDicName("");
        list.add(vo3);

        ExportModelVo vo9=new ExportModelVo();
        vo9.setFieldId("ERROR_MEMO");
        vo9.setFieldName("呼入技能组");
        vo9.setDicName("");
        list.add(vo9);

        ExportModelVo vo10=new ExportModelVo();
        vo10.setFieldId("INVESTIGATE");
        vo10.setFieldName("满意度");
        vo10.setDicName("");
        list.add(vo10);

		ExportModelVo vo4=new ExportModelVo();
		vo4.setFieldId("OFFERING_TIME");
		vo4.setFieldName("呼叫时间");
		vo4.setDicName("");
		list.add(vo4);
		
		ExportModelVo vo6=new ExportModelVo();
		vo6.setFieldId("TALK_TIME");
		vo6.setFieldName("通话时长");
		vo6.setDicName("");
		list.add(vo6);

        ExportModelVo vo18=new ExportModelVo();
        vo18.setFieldId("GRADE_USER");
        vo18.setFieldName("质检人员");
        vo18.setDicName("");
        list.add(vo18);

		ExportModelVo vo8=new ExportModelVo();
		vo8.setFieldId("CHECK_LEVEL");
		vo8.setFieldName("评级");
		vo8.setDicName("");
		list.add(vo8);

        ExportModelVo vo19=new ExportModelVo();
        vo19.setFieldId("GRADE_AMOUNT");
        vo19.setFieldName("质检得分");
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
