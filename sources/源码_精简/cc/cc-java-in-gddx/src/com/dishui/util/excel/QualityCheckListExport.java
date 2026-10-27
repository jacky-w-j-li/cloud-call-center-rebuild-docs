package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
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
        DBObject findTemplate = new BasicDBObject("_id",query.get("TEMPLATE"));
        DBObject curTemplate = MongoConnect.getInstance().getDB().getCollection("manager_quality_check_config").findOne(findTemplate);
        List<ExportModelVo> heads=getHeaders();
        List<DBObject> tempConfigList = (ArrayList<DBObject>)curTemplate.get("config");

	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        if(curTemplate.get("type") == null){
        	ExportModelVo vo8=new ExportModelVo();
    		vo8.setFieldId("CHECK_LEVEL");
    		vo8.setFieldName("评级");
    		vo8.setDicName("");
    		heads.add(vo8);

            ExportModelVo vo19=new ExportModelVo();
            vo19.setFieldId("GRADE_AMOUNT");
            vo19.setFieldName("质检得分");
            vo19.setDicName("");
            heads.add(vo19);
            
            float Ab = Float.parseFloat(curTemplate.get("A-begin").toString());
            float Bb = Float.parseFloat(curTemplate.get("B-begin").toString());
            float Be = Float.parseFloat(curTemplate.get("B-end").toString());
            float Cb = Float.parseFloat(curTemplate.get("C-begin").toString());
            float Ce = Float.parseFloat(curTemplate.get("C-end").toString());
            float De = Float.parseFloat(curTemplate.get("D-end").toString());
            
            for(int i=0 ; i < tempConfigList.size(); i++) {
            	ExportModelVo tvo=new ExportModelVo();
            	tvo.setFieldId(tempConfigList.get(i).get("order").toString());
            	tvo.setFieldName(tempConfigList.get(i).get("name").toString()+"("+tempConfigList.get(i).get("weight").toString()+"%)");
            	tvo.setDicName("");
            	heads.add(tvo);
            }
            ExportModelVo vo110=new ExportModelVo();
            vo110.setFieldId("COMMENTS");
            vo110.setFieldName("点评内容");
            vo110.setDicName("");
            heads.add(vo110);
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
            	where.put("ERROR_MEMO", strtolist(query.get("ERROR_MEMO").toString()));
            }
            if(query.get("DISPOSAL_AGENT") != null && !query.get("DISPOSAL_AGENT").equals("")){
            	if(query.get("includeSubordinate") != null && !query.get("includeSubordinate").equals("")){
            		if(Boolean.valueOf(query.get("includeSubordinate").toString())){
            			DBObject whereAgent = new BasicDBObject();
                		whereAgent.put("account", accountId);
                        whereAgent.put("product","cc");
                		DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
                		String curagent = query.get("DISPOSAL_AGENT").toString();
                		StringBuffer allagent = new StringBuffer(curagent);
                		getloweragent(curagent.substring(1,curagent.length()),agentCursor,allagent);
                		where.put("DISPOSAL_AGENT",strtolist(allagent.toString()));
            		}else{
            			where.put("DISPOSAL_AGENT",strtolist(query.get("DISPOSAL_AGENT").toString()));
            		}
            	}else{
            		where.put("DISPOSAL_AGENT", strtolist(query.get("DISPOSAL_AGENT").toString()));
            	}
            }
            if(query.get("CONNECT_TYPE") != null && !query.get("CONNECT_TYPE").equals("")){
            	where.put("CONNECT_TYPE", strtolist(query.get("CONNECT_TYPE").toString()));
            }
            if(query.get("INVESTIGATE") != null && !query.get("INVESTIGATE").equals("")){
            	where.put("INVESTIGATE", query.get("INVESTIGATE"));
            }
            if(query.get("GRADE_USER") != null && !query.get("GRADE_USER").equals("")){
                where.put("GRADE_USER", strtolist(query.get("GRADE_USER").toString()));
            }
            if(query.get("TASK_ID") != null && !query.get("TASK_ID").equals("")){
                where.put("TASK_ID", query.get("TASK_ID"));
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
            if(query.get("CHECK_BEGIN_TIME") != null && !query.get("CHECK_BEGIN_TIME").equals("")
        			&& query.get("CHECK_END_TIME") != null && !query.get("CHECK_END_TIME").equals("")){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$gte", query.get("CHECK_BEGIN_TIME").toString());
            	timeCondition.put("$lte", query.get("CHECK_END_TIME").toString());
            	where.put("GRADE_TIME", timeCondition);
            }else if((query.get("CHECK_BEGIN_TIME") != null && !query.get("CHECK_BEGIN_TIME").equals("")) 
            		&& (query.get("CHECK_END_TIME") == null || query.get("CHECK_END_TIME").equals(""))){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$gte", query.get("CHECK_BEGIN_TIME").toString());
            	where.put("GRADE_TIME", timeCondition);
            }else if((query.get("CHECK_BEGIN_TIME") == null || query.get("CHECK_BEGIN_TIME").equals(""))
            		&& (query.get("CHECK_END_TIME") != null && !query.get("CHECK_END_TIME").equals(""))){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$lte", query.get("CHECK_END_TIME").toString());
    	    	where.put("GRADE_TIME", timeCondition);
            }

            if(query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals("")
                    && query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals("")){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$gte", query.get("CALL_TIME_LENGTH_BEGIN").toString());
                timeCondition.put("$lte", query.get("CALL_TIME_LENGTH_END").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }else if((query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                    && (query.get("CALL_TIME_LENGTH_END") == null || query.get("CALL_TIME_LENGTH_END").equals(""))){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$gte", query.get("CALL_TIME_LENGTH_BEGIN").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }else if((query.get("CALL_TIME_LENGTH_BEGIN") == null || query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                    && (query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals(""))){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$lte", query.get("CALL_TIME_LENGTH_END").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }

            if(query.get("GRADE_CONFIG") != null) {
                DBObject gradeCondition = null;
                String configId = query.get("GRADE_CONFIG").toString();
                if(configId.equals("")){configId = "GRADE_AMOUNT";}
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

    		DBObject sort = new BasicDBObject("GRADE_TIME",-1);
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
                    }else if(heads.get(i).getFieldId().equals("COMMENTS")){
                        if(obj.get("COMMENTS") != null){
                            String COMMENTS = obj.get("COMMENTS").toString();
                            if(COMMENTS.length()>0){
                                createCell(i,COMMENTS);
                            }else{
                                createCell(i,"");
                            }
                        }
                    }else{
                        createCell(i,temp==null?"":temp.toString());
                    }
    				
    			}
//    			log.info(obj.toString());
    			endRow();
    			rownum++;
    		}
        }else{
        	int floors = Integer.valueOf(query.get("floors").toString());
        	for(int i_1=0 ; i_1 < tempConfigList.size(); i_1++) {
            	ExportModelVo tvo_1=new ExportModelVo();
            	tvo_1.setFieldId(tempConfigList.get(i_1).get("name").toString());
            	tvo_1.setFieldName(tempConfigList.get(i_1).get("value").toString());
            	tvo_1.setDicName("");
            	heads.add(tvo_1);
            	if(floors==1){continue;}
            	List<DBObject> i_1_child = ((List<DBObject>)tempConfigList.get(i_1).get("child"));
            	for(int i_2=0 ; i_2 < i_1_child.size(); i_2++) {
                	ExportModelVo tvo_2=new ExportModelVo();
                	tvo_2.setFieldId(i_1_child.get(i_2).get("name").toString());
                	tvo_2.setFieldName(i_1_child.get(i_2).get("value").toString());
                	tvo_2.setDicName("");
                	heads.add(tvo_2);
                	if(floors==2){continue;}
                	List<DBObject> i_2_child = ((List<DBObject>)i_1_child.get(i_2).get("child"));
                	for(int i_3=0 ; i_3 < i_2_child.size(); i_3++) {
                    	ExportModelVo tvo_3=new ExportModelVo();
                    	tvo_3.setFieldId(i_2_child.get(i_3).get("name").toString());
                    	tvo_3.setFieldName(i_2_child.get(i_3).get("value").toString());
                    	tvo_3.setDicName("");
                    	heads.add(tvo_3);
                    	if(floors==3){continue;}
                    	List<DBObject> i_3_child = ((List<DBObject>)i_2_child.get(i_3).get("child"));
                    	for(int i_4=0 ; i_4 < i_3_child.size(); i_4++) {
                        	ExportModelVo tvo_4=new ExportModelVo();
                        	tvo_4.setFieldId(i_3_child.get(i_4).get("name").toString());
                        	tvo_4.setFieldName(i_3_child.get(i_4).get("value").toString());
                        	tvo_4.setDicName("");
                        	heads.add(tvo_4);
                        	if(floors==4){continue;}
                        	List<DBObject> i_4_child = ((List<DBObject>)i_3_child.get(i_4).get("child"));
                        	for(int i_5=0 ; i_5 < i_4_child.size(); i_5++) {
                            	ExportModelVo tvo_5=new ExportModelVo();
                            	tvo_5.setFieldId(i_4_child.get(i_5).get("name").toString());
                            	tvo_5.setFieldName(i_4_child.get(i_5).get("value").toString());
                            	tvo_5.setDicName("");
                            	heads.add(tvo_5);
                            	if(floors==5){continue;}
                            	List<DBObject> i_5_child = ((List<DBObject>)i_4_child.get(i_5).get("child"));
                            	for(int i_6=0 ; i_6 < i_5_child.size(); i_6++) {
                                	ExportModelVo tvo_6=new ExportModelVo();
                                	tvo_6.setFieldId(i_5_child.get(i_6).get("name").toString());
                                	tvo_6.setFieldName(i_5_child.get(i_6).get("value").toString());
                                	tvo_6.setDicName("");
                                	heads.add(tvo_6);
                                	if(floors==6){continue;}
                                	List<DBObject> i_6_child = ((List<DBObject>)i_5_child.get(i_6).get("child"));
                                	for(int i_7=0 ; i_7 < i_6_child.size(); i_7++) {
                                    	ExportModelVo tvo_7=new ExportModelVo();
                                    	tvo_7.setFieldId(i_6_child.get(i_7).get("name").toString());
                                    	tvo_7.setFieldName(i_6_child.get(i_7).get("value").toString());
                                    	tvo_7.setDicName("");
                                    	heads.add(tvo_7);
                                    	if(floors==7){continue;}
                                    	List<DBObject> i_7_child = ((List<DBObject>)i_6_child.get(i_7).get("child"));
                                    	for(int i_8=0 ; i_8 < i_7_child.size(); i_8++) {
                                        	ExportModelVo tvo_8=new ExportModelVo();
                                        	tvo_8.setFieldId(i_7_child.get(i_8).get("name").toString());
                                        	tvo_8.setFieldName(i_7_child.get(i_8).get("value").toString());
                                        	tvo_8.setDicName("");
                                        	heads.add(tvo_8);
                                        	if(floors==8){continue;}
                                        	List<DBObject> i_8_child = ((List<DBObject>)i_7_child.get(i_8).get("child"));
                                        	for(int i_9=0 ; i_9 < i_8_child.size(); i_9++) {
                                            	ExportModelVo tvo_9=new ExportModelVo();
                                            	tvo_9.setFieldId(i_8_child.get(i_9).get("name").toString());
                                            	tvo_9.setFieldName(i_8_child.get(i_9).get("value").toString());
                                            	tvo_9.setDicName("");
                                            	heads.add(tvo_9);
                                            	if(floors==9){continue;}
                                            	List<DBObject> i_9_child = ((List<DBObject>)i_8_child.get(i_9).get("child"));
                                            	for(int i_10=0 ; i_10 < i_9_child.size(); i_10++) {
                                                	ExportModelVo tvo_10=new ExportModelVo();
                                                	tvo_10.setFieldId(i_9_child.get(i_10).get("name").toString());
                                                	tvo_10.setFieldName(i_9_child.get(i_10).get("value").toString());
                                                	tvo_10.setDicName("");
                                                	heads.add(tvo_10);
                                                	
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        	ExportModelVo vo8=new ExportModelVo();
    		vo8.setFieldId("amount");
    		vo8.setFieldName("整体");
    		vo8.setDicName("");
    		heads.add(vo8);
    		ExportModelVo vo110=new ExportModelVo();
            vo110.setFieldId("COMMENTS");
            vo110.setFieldName("点评内容");
            vo110.setDicName("");
            heads.add(vo110);
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
            	
            	where.put("ERROR_MEMO",strtolist(query.get("ERROR_MEMO").toString()));
            }
            if(query.get("DISPOSAL_AGENT") != null && !query.get("DISPOSAL_AGENT").equals("")){
            	if(query.get("includeSubordinate") != null && !query.get("includeSubordinate").equals("")){
            		if(Boolean.valueOf(query.get("includeSubordinate").toString())){
            			DBObject whereAgent = new BasicDBObject();
                		whereAgent.put("account", accountId);
                        whereAgent.put("product","cc");
                		DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
                		String curagent = query.get("DISPOSAL_AGENT").toString();
                		StringBuffer allagent = new StringBuffer(curagent);
                		getloweragent(curagent.substring(1,curagent.length()),agentCursor,allagent);
                		where.put("DISPOSAL_AGENT",strtolist(allagent.toString()));
            		}else{
            			where.put("DISPOSAL_AGENT",strtolist(query.get("DISPOSAL_AGENT").toString()));
            		}
            	}else{
            		where.put("DISPOSAL_AGENT", strtolist(query.get("DISPOSAL_AGENT").toString()));
            	}
            }
            
            if(query.get("CONNECT_TYPE") != null && !query.get("CONNECT_TYPE").equals("")){
            	where.put("CONNECT_TYPE", strtolist(query.get("CONNECT_TYPE").toString()));
            }
            if(query.get("INVESTIGATE") != null && !query.get("INVESTIGATE").equals("")){
            	where.put("INVESTIGATE", query.get("INVESTIGATE"));
            }
            if(query.get("GRADE_USER") != null && !query.get("GRADE_USER").equals("")){
                where.put("GRADE_USER", strtolist(query.get("GRADE_USER").toString()));
            }
            if(query.get("TASK_ID") != null && !query.get("TASK_ID").equals("")){
                where.put("TASK_ID", query.get("TASK_ID"));
            }
            if(query.get("amount") != null && !query.get("amount").equals("")){
                where.put("GRADE_AMOUNT.amount", query.get("amount"));
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
            if(query.get("CHECK_BEGIN_TIME") != null && !query.get("CHECK_BEGIN_TIME").equals("")
        			&& query.get("CHECK_END_TIME") != null && !query.get("CHECK_END_TIME").equals("")){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$gte", query.get("CHECK_BEGIN_TIME").toString());
            	timeCondition.put("$lte", query.get("CHECK_END_TIME").toString());
            	where.put("GRADE_TIME", timeCondition);
            }else if((query.get("CHECK_BEGIN_TIME") != null && !query.get("CHECK_BEGIN_TIME").equals("")) 
            		&& (query.get("CHECK_END_TIME") == null || query.get("CHECK_END_TIME").equals(""))){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$gte", query.get("CHECK_BEGIN_TIME").toString());
            	where.put("GRADE_TIME", timeCondition);
            }else if((query.get("CHECK_BEGIN_TIME") == null || query.get("CHECK_BEGIN_TIME").equals(""))
            		&& (query.get("CHECK_END_TIME") != null && !query.get("CHECK_END_TIME").equals(""))){
            	DBObject timeCondition = new BasicDBObject();
            	timeCondition.put("$lte", query.get("CHECK_END_TIME").toString());
    	    	where.put("GRADE_TIME", timeCondition);
            }

            if(query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals("")
                    && query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals("")){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$gte", query.get("CALL_TIME_LENGTH_BEGIN").toString());
                timeCondition.put("$lte", query.get("CALL_TIME_LENGTH_END").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }else if((query.get("CALL_TIME_LENGTH_BEGIN") != null && !query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                    && (query.get("CALL_TIME_LENGTH_END") == null || query.get("CALL_TIME_LENGTH_END").equals(""))){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$gte", query.get("CALL_TIME_LENGTH_BEGIN").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }else if((query.get("CALL_TIME_LENGTH_BEGIN") == null || query.get("CALL_TIME_LENGTH_BEGIN").equals(""))
                    && (query.get("CALL_TIME_LENGTH_END") != null && !query.get("CALL_TIME_LENGTH_END").equals(""))){
                DBObject timeCondition = new BasicDBObject();
                timeCondition.put("$lte", query.get("CALL_TIME_LENGTH_END").toString());
                where.put("CALL_TIME_LENGTH", timeCondition);
            }

            

    		DBCollection collection = MongoConnect.getInstance().getDB().getCollection(CollectionName);

    		DBObject sort = new BasicDBObject("GRADE_TIME",-1);
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
                    }else if(heads.get(i).getFieldId().equals("ERROR_MEMO")){
                        if(obj.get("ERROR_MEMO") != null){
                            String queueId = obj.get("ERROR_MEMO").toString();
                            if(queueNameMap.containsKey(queueId)){
                                createCell(i,queueNameMap.get(queueId));
                            }else{
                                createCell(i,"");
                            }
                        }
                    }else if(heads.get(i).getFieldId().toString().startsWith("config_name")||heads.get(i).getFieldId().toString().startsWith("amount")){
                    	if(obj.get("GRADE_AMOUNT") != null){
                    		DBObject grade_amount = (DBObject) obj.get("GRADE_AMOUNT");
                            if(grade_amount.get(heads.get(i).getFieldId().toString())!=null){
                            	String amount =grade_amount.get(heads.get(i).getFieldId().toString()).toString();
                            	if(amount.equals("yes")){
                            		createCell(i,"通过");
                            	}else if(amount.equals("no")){
                            		createCell(i,"不通过");
                            	}else if(amount.equals("dont")){
                            		createCell(i,"不涉及");
                            	}
                            }else{
                                createCell(i,"");
                            }
                        }
                    }else if(heads.get(i).getFieldId().equals("COMMENTS")){
                        if(obj.get("COMMENTS") != null){
                            String COMMENTS = obj.get("COMMENTS").toString();
                            if(COMMENTS.length()>0){
                                createCell(i,COMMENTS);
                            }else{
                                createCell(i,"");
                            }
                        }
                    }else{
                        createCell(i,temp==null?"":temp.toString());
                    }
    			}
//    			log.info(obj.toString());
    			endRow();
    			rownum++;
    		}
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
	
	public BasicDBObject strtolist(String allagent){
		String[] strs=allagent.split("\\,");
		List<String> strslist=Arrays.asList(strs);
		return new BasicDBObject("$in",strslist );
		
	}
	private void getloweragent(String curagent,DBCursor allagent,StringBuffer curallagent){
		for (DBObject obj : allagent) {
			if(obj.get("parentId") == null){continue;}
			if(curagent.equals(obj.get("parentId").toString())){
				curallagent.append(","+obj.get("_id").toString());
				getloweragent(obj.get("_id").toString(), allagent,curallagent);
			}
		}
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
		
		ExportModelVo vo5=new ExportModelVo();
		vo5.setFieldId("GRADE_TIME");
		vo5.setFieldName("质检时间");
		vo5.setDicName("");
		list.add(vo5);
		
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
