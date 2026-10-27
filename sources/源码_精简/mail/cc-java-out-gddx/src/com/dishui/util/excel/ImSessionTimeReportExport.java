package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ImSessionTimeReportExport extends XssfWriter {
	private String account;
	private static final String REPORT_TYPE = "im_report_session_time";
	private static final String REPORT_TABLE = "cc_im_message_report";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");

        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        List<ExportModelVo> heads = headMapper.get("Custom");

        int rownum = 1;
        beginSheet();
        
        DBObject key = new BasicDBObject();
        String groupKey = getGroupTimeKey(query.get("timeType").toString());
        key.put(groupKey,true);

        DBObject condition = new BasicDBObject();
        condition.put("account",account);
        ReportUtil.getReportTimeLower(query, condition);

        DBObject inital = new BasicDBObject();
        inital.put("sessionCount", 0);
        inital.put("robotSessionCount", 0);
        inital.put("convertManualCount", 0);
        inital.put("manualSessionCount", 0);
        inital.put("goodCount", 0);
        inital.put("badCount", 0);
        inital.put("mediumCount", 0);
        inital.put("lostSessionCount", 0);

        StringBuilder aggregation = new StringBuilder();
        aggregation.append("function( curr, result ){")
                .append("result.manualSessionCount += curr.sessionCount || 0;")
                .append("result.robotSessionCount += curr.robotSessionCount || 0;")
                .append("result.convertManualCount += curr.convertManualCount || 0;")
                .append("result.goodCount += curr.goodCount || 0;")
                .append("result.badCount += curr.badCount || 0;")
                .append("result.mediumCount += curr.mediumCount || 0;")
                .append("result.lostSessionCount += curr.lostSessionCount || 0;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")
                .append("result.sessionCount =  (result.manualSessionCount + result.robotSessionCount)-result.convertManualCount;")
                .append("};");
        BasicDBList newList = MongoProvider.groupFromReportDb(REPORT_TABLE, key, condition, inital, aggregation.toString(), finalize.toString());
		System.out.println(newList);
        generateHeader(heads);
        
       for (int i = 0; i < newList.size(); i++) {
    	   if(((DBObject)newList.get(i)).get(groupKey) == null){
    		   newList.remove(i);
			}
	  }
        
        if(newList == null){
        	newList = new BasicDBList();
        }
        BasicDBList list = new BasicDBList();
        boolean flag = true;
        if(newList.size()>0){
        	DBObject item0 = (DBObject)newList.get(0);
        	if("monthId".equals(groupKey)){
            	String year = item0.get(groupKey).toString().substring(0, 4);
            	List<String> months = new ArrayList<String>();
            	for(int i = 1;i<=12;i++){
            		if(i<10){
            			months.add(year+"0"+i);
            		}else{
            			months.add(year+i);
            		}
            	}
            	for (String string : months) {
            		DBObject obj = new BasicDBObject();
            		for (Object object : newList) {
            			if(((DBObject)object).get(groupKey)!=null && ((DBObject)object).get(groupKey).equals(string)){
                			list.add(object);
                			flag = false;
            				break;
            			}else{
            				flag = true;
            			}
            		}
            		obj.put("monthId", string);
            		obj.put("sessionCount", 0);
            		obj.put("robotSessionCount", 0);
            		obj.put("convertManualCount", 0);
            		obj.put("manualSessionCount", 0);
					obj.put("goodCount", 0);
					obj.put("badCount", 0);
					obj.put("mediumCount", 0);
					obj.put("lostSessionCount", 0);
            		list.add(obj);
    			}
            	
    		}else if("dayId".equals(groupKey) && "month".equals(query.get("timeType").toString())){
            	String year = item0.get(groupKey).toString().substring(0, 6);
            	List<String> dayList = new ArrayList<String>();
            	for(int i = 1;i<=31;i++){
            		if(i<10){
            			dayList.add(year+"0"+i);
            		}else{
            			dayList.add(year+i);
            		}
            	}
            	for (String string : dayList) {
            		DBObject obj = new BasicDBObject();
            		for (Object object : newList) {
                		if(((DBObject)object).get(groupKey)!=null && ((DBObject)object).get(groupKey).equals(string)){
                			list.add(object);
                			flag = false;
            				break;
            			}else{
            				flag = true;
            			}
            		}
            		if(flag){
            			obj.put("dayId", string);
                		obj.put("sessionCount", 0);
                		obj.put("robotSessionCount", 0);
                		obj.put("convertManualCount", 0);
                		obj.put("manualSessionCount", 0);
						obj.put("goodCount", 0);
						obj.put("badCount", 0);
						obj.put("mediumCount", 0);
						obj.put("lostSessionCount", 0);
                		list.add(obj);
            		}
    			}
    		}else if("hourId".equals(groupKey)){
            	String year = item0.get(groupKey).toString().substring(0, 8);
            	List<String> dayList = new ArrayList<String>();
            	for(int i = 0;i<=23;i++){
            		if(i<10){
            			dayList.add(year+"0"+i);
            		}else{
            			dayList.add(year+i);
            		}
            	}
            	for (String string : dayList) {
            		DBObject obj = new BasicDBObject();
            		for (Object object : newList) {
                		if(((DBObject)object).get(groupKey)!=null && ((DBObject)object).get(groupKey).equals(string)){
                			list.add(object);
                			flag = false;
            				break;
            			}else{
            				flag = true;
            			}
            		}
            		if(flag){
            			obj.put("hourId", string);
                		obj.put("sessionCount", 0);
                		obj.put("robotSessionCount", 0);
                		obj.put("convertManualCount", 0);
                		obj.put("manualSessionCount", 0);
						obj.put("goodCount", 0);
						obj.put("badCount", 0);
						obj.put("mediumCount", 0);
						obj.put("lostSessionCount", 0);
                		list.add(obj);
            		}
    			}
    		}else{
    			 list = newList;
    		}
        }
        
        
        Map<String, Integer> totalMap = new HashMap<String, Integer>();
        totalMap.put("sessionCount", 0);//TotalCount
        totalMap.put("robotSessionCount", 0);
        totalMap.put("convertManualCount", 0);
        totalMap.put("manualSessionCount", 0);
		totalMap.put("goodCount", 0);
		totalMap.put("badCount", 0);
		totalMap.put("mediumCount", 0);
		totalMap.put("lostSessionCount", 0);
        for(int i = 0; i<list.size();i++){
        	DBObject obj = (DBObject)list.get(i);
			insertRow(rownum);
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                Object reportTime = obj.get(groupKey);
                
                if(fieldId.equals("reportTime")){
                	if(reportTime != null){
    					if("monthId".equals(groupKey)){
    						temp = reportTime.toString().substring(0, 4)+"-"+reportTime.toString().substring(4, 6);
    					}else if("dayId".equals(groupKey)){
    						temp = reportTime.toString().substring(0, 4)+"-"+reportTime.toString().substring(4, 6)+"-"+reportTime.toString().substring(6, 8);
    					}else{
    						temp = reportTime.toString().substring(0, 4)+"-"+reportTime.toString().substring(4, 6)+"-"
    						+reportTime.toString().substring(6, 8)+" "+reportTime.toString().substring(8, 10)+":00:00";
    					}
                    }
					System.out.println(temp);
				}else{
					temp = obj.get(heads.get(j).getFieldId());
					
					totalMap.put(fieldId, totalMap.get(fieldId)+Float.valueOf(temp== null ? "0" : String.valueOf(temp)).intValue());
				}
                createCell(j, temp==null?"" : temp.toString());
            }
            endRow();
            rownum++;
        }
        if(list.size() > 0){
            insertRow(rownum);
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                if(fieldId.equals("reportTime")){
                    createCell(j, "\u5408\u8ba1");
                }else{
                    createCell(j, Integer.valueOf(totalMap.get(fieldId)).toString());
                }
            }
            endRow();
        }
        endSheet();
    }


    public void generateHeader(List<ExportModelVo> list) throws Exception{
        insertRow(0);
        for(int i=0;i<list.size();i++){
            createCell(i,list.get(i).getFieldName());
        }
        endRow();
    }
    
    public static String getGroupTimeKey(String reportTimeType) {
        if (reportTimeType.equals("day") || reportTimeType.equals("time")) {
            return "hourId";
        } else if (reportTimeType.equals("month")) {
            return "dayId";
        } else if (reportTimeType.equals("year")) {
            return "monthId";
        } else if (reportTimeType.equals("other")){
        	return "dayId";
        }
        return "";
    }
}
