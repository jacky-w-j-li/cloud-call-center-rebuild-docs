package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import com.dishui.model.ExportModelVo;
import com.dishui.model.PhoneBarVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.dishui.util.report.*;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;


public class ReportAgentExport extends XssfWriter {

    public void generate(Map<String, Object> query) throws Exception {
        //List<ExportModelVo> heads = new ArrayList<ExportModelVo>();
        String TimeType = query.get("TimeType").toString();
        String accountId = query.get("accountId").toString();
        String sipConfigId = query.get("pbx").toString();

        Map<String, List<ExportModelVo>> headMapper = new HashMap<String, List<ExportModelVo>>();
        if(query.containsKey("selectedAgentList")){
            headMapper=ReportUtil.getExportHeaders("call_report_agent", accountId);
        }else{
            headMapper=ReportUtil.getExportHeaders("call_report_agent_time", accountId);
        }
        List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");

        int rownum = 1;
        beginSheet();

        int p = 0;
        for(ExportModelVo n: allHeads){
            if(n.getFieldId().equalsIgnoreCase("ShowPhoneBarStatus")){
                break;
            }
            p++;
        }
        allHeads.remove(p);
        boolean isPhonebar = false;
        int k = 0;
        for(ExportModelVo n: heads){
            if(n.getFieldId().equalsIgnoreCase("ShowPhoneBarStatus")){
                isPhonebar = true;
                break;
            }
            k++;
        }
        DBObject allfind = new BasicDBObject();
        allfind.put("Account", accountId);
        allfind.put("PBX", sipConfigId);
        List<DBObject> allPhonebars = MongoProvider.find("manager_ivr_phonebar_config", allfind);
        for(DBObject phonebar:allPhonebars){
            PhoneBarVo phone = new PhoneBarVo();
            phone.mapRow(phonebar.toMap());
            if(phone.getIsEnable().equals("1") && !phone.getPhoneBarItemName().equals("空闲总时长")){
                ExportModelVo vo = new ExportModelVo();
                vo.setFieldId(phone.getPhoneBarItemId());
                vo.setFieldName(phone.getPhoneBarItemName());
                vo.setDicName("");
                //heads.add(vo);
                allHeads.add(vo);
            }
        }
        if(isPhonebar == true){
            heads.remove(k);
            DBObject find = new BasicDBObject();
            find.put("Account", accountId);
            find.put("PBX", sipConfigId);
            List<DBObject> phonebars = MongoProvider.find("manager_ivr_phonebar_config", find);
            for(DBObject phonebar:phonebars){
                PhoneBarVo phone = new PhoneBarVo();
                phone.mapRow(phonebar.toMap());
                if(phone.getIsEnable().equals("1") && !phone.getPhoneBarItemName().equals("\u7a7a\u95f2\u603b\u65f6\u957f")){
                    ExportModelVo vo = new ExportModelVo();
                    vo.setFieldId(phone.getPhoneBarItemId());
                    vo.setFieldName(phone.getPhoneBarItemName());
                    vo.setDicName("");
                    heads.add(vo);
                    //allHeads.add(vo);
                }
            }
        }
        //查询账户下所有坐席
        DBObject whereAgent = new BasicDBObject();
        whereAgent.put("account", accountId);
        whereAgent.put("product", "cc");
        DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
        Map<String,String> agentNameMap = new HashMap<String,String>();
        Map<String,String> agentEmpnoMap = new HashMap<String,String>();
        while (agentCursor.hasNext()) {
            DBObject obj = agentCursor.next();
            String tmpName = "";
            if(obj.get("displayName")!=null){
                tmpName = obj.get("displayName").toString();
            }
            agentNameMap.put(obj.get("_id").toString(), tmpName);
            agentEmpnoMap.put(obj.get("_id").toString(), obj.get("exten").toString());
        }

        BasicDBList groupList = new BasicDBList();
        BasicDBList groupAgentList = new BasicDBList();
        List<Object> sortedList = new ArrayList<Object>();
        if(query.containsKey("selectedAgentList")){
        	groupAgentList = this.queryReport(query);
            for(int i=0; i<groupAgentList.size(); i++){
                DBObject object = (DBObject)groupAgentList.get(i);
                String agentName = null;
                String agentEmpno = null;
                agentName = agentNameMap.get(object.get("AgentID").toString());
                agentEmpno = agentEmpnoMap.get(object.get("AgentID").toString());
                object.put("agent_name",agentName==null?"":agentName);
                object.put("exten",agentEmpno==null?"":agentEmpno);
                //groupAgentList.add(object);
            }
            sortedList = ReportUtil.sortListByChinese(groupAgentList, "agent_name");
        }else{
            groupList = this.queryTimeReport(query);
            for(int i=0; i<groupList.size(); i++){
                DBObject object = (DBObject)groupList.get(i);
                if(TimeType.equals("year")){
                    object.put("show_time", object.get("MonthID"));
                }else if(TimeType.equals("month")){
                    object.put("show_time", object.get("DayID"));
                }else if(TimeType.equals("day")){
                    object.put("show_time", object.get("ReportTime"));
                }else if (TimeType.equals("other_half_hour")){
                    object.put("show_time", object.get("ReportTime"));
                }else if (TimeType.equals("other")){
                	object.put("show_time", object.get("DayID"));
                }
                //groupList.add(object);
            }
            sortedList = ReportUtil.sortListByTime(groupList, "show_time");
        }
        genrateHeader(heads);

        Map<String, Integer> totals = new HashMap<String, Integer>();
        List<String> sumTimeList = new ArrayList<String>();
        List<String> stringList = new ArrayList<String>();
        sumTimeList.add("CallInTimeLength");
        sumTimeList.add("CallOutTimeLength");
        sumTimeList.add("LOGIN_TIME_LENGTH");
        sumTimeList.add("BUSY_TIME_LENGTH");
        sumTimeList.add("IDLE_TIME_LENGTH");
        sumTimeList.add("STATE2_TIME_LENGTH");
        sumTimeList.add("STATE3_TIME_LENGTH");
        sumTimeList.add("STATE4_TIME_LENGTH");
        sumTimeList.add("STATE5_TIME_LENGTH");
        sumTimeList.add("STATE6_TIME_LENGTH");
        sumTimeList.add("STATE7_TIME_LENGTH");
        sumTimeList.add("STATE8_TIME_LENGTH");
        sumTimeList.add("STATE9_TIME_LENGTH");
        sumTimeList.add("STATE99_TIME_LENGTH");
        stringList.add("CallInAcceptRate");
        stringList.add("AgentUtilization");
        stringList.add("AverageHourCallCount");
        stringList.add("CallInAverageTimeLength");
        stringList.add("CallOutAverageTimeLength");
        stringList.add("agent_name");
        stringList.add("exten");
        stringList.add("show_time");

        String fieldId = null;
        int value = 0;
        String allFieldId = null;
        for(int i=0; i<sortedList.size(); i++){
            DBObject obj = (DBObject)sortedList.get(i);
            insertRow(rownum);
            for(int j=0; j<heads.size(); j++){
                fieldId = heads.get(j).getFieldId();
                boolean timeTemp =
                        fieldId.equalsIgnoreCase("CallInTimeLength") ||
                                fieldId.equalsIgnoreCase("CallOutTimeLength") ||
                                fieldId.equalsIgnoreCase("LOGIN_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("BUSY_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("IDLE_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE2_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE3_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE4_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE5_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE6_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE7_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE8_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE9_TIME_LENGTH") ||
                                fieldId.equalsIgnoreCase("STATE99_TIME_LENGTH");
                boolean countTemp = fieldId.equalsIgnoreCase("CallInAcceptCount") ||
                        fieldId.equalsIgnoreCase("CallInAccessCount") ||
                        fieldId.equalsIgnoreCase("CallOutAccessCount") ||
                        fieldId.equalsIgnoreCase("CallOutAcceptCount") ||
                        fieldId.equalsIgnoreCase("TransferAcceptCount");
                Object temp = null;
                if(i == 0){
                    totals.put(fieldId, 0);
                }
                if(query.containsKey("selectedAgentList")){
                    if(fieldId.equals("agent_name")){
                        temp = obj.get("AgentID");
                    }else{
                        temp = obj.get(fieldId);
                    }
                }else{
                    if(heads.get(j).getFieldId().equals("show_time")){
                        temp = obj.get(ReportUtil.getGroupTimeKey(TimeType).toString());
                    }else{
                        temp = obj.get(heads.get(j).getFieldId());
                    }
                }

                if(temp!=null && timeTemp){
                    int tempInt = Float.valueOf(obj.get(fieldId).toString()).intValue();
                    createCell(j,ReportUtil.formatTime(tempInt));
                    //totals.put(fieldId, totals.get(fieldId) + tempInt);
                }else if(temp != null && heads.get(j).getFieldId().equals("agent_name")){
                    if(agentNameMap.containsKey(temp.toString())){
                        createCell(j,agentNameMap.get(temp.toString()));
                    }else{
                        createCell(j,"");
                    }
                }else if(temp != null && heads.get(j).getFieldId().equals("exten")){
                	createCell(j,temp.toString());
                }else if(temp!=null && heads.get(j).getFieldId().equals("show_time")){
                    createCell(j,temp.toString());
                }else if(temp!=null && countTemp){
                    createCell(j,temp==null?"":Float.valueOf(obj.get(fieldId).toString()).intValue()+"");
                    //totals.put(fieldId, totals.get(fieldId) + Float.valueOf(obj.get(fieldId).toString()).intValue());
                }

                if(temp!=null && fieldId.equalsIgnoreCase("CallInAcceptRate")){
                    double a = (Double)obj.get("CallInAcceptCount");
                    double b = (Double)obj.get("CallInAccessCount");
                    if(b == 0){
                        createCell(j,"0%");
                    }else{
                        createCell(j, Math.round(a/b*100) + "%");
                    }
                }
                if(temp!=null && fieldId.equalsIgnoreCase("AgentUtilization")){
                    createCell(j, (String)obj.get("AgentUtilization"));
//                    double a = (Double)obj.get("CallInTimeLength");
//                    double b = (Double)obj.get("STATE99_TIME_LENGTH");
//                    double c = (Double)obj.get("BUSY_TIME_LENGTH");
//                    double d = (Double)obj.get("CallOutTimeLength");
//                    double e = (Double)obj.get("LOGIN_TIME_LENGTH");
//                    if(e == 0){
//                        createCell(j,"0%");
//                    }else{
//                        if(Math.round((a+b+c+d)/e*100) > 100){
//                            createCell(j,"100%");
//                        }else{
//                            createCell(j, Math.round((a+b+c+d)/e*100) + "%");
//                        }
//                    }
                }
                if(temp!=null && fieldId.equalsIgnoreCase("AverageHourCallCount")){
                    double a = (Double)obj.get("CallInAcceptCount");
                    double b = (Double)obj.get("CallOutAcceptCount");
                    double c = (Double)obj.get("LOGIN_TIME_LENGTH");
                    if(c == 0){
                        createCell(j, 0);
                    }else if(c <= 1800l){
                        createCell(j, a+b);
                    }else{
                        createCell(j, Math.round((a+b)*1800/c));
                    }
                }
                if(temp!=null && fieldId.equalsIgnoreCase("CallInAverageTimeLength")){
                    float a = Float.valueOf(obj.get("CallInTimeLength").toString());
                    int b = Float.valueOf(obj.get("CallInAcceptCount").toString()).intValue();
                    if(b == 0){
                        createCell(j, ReportUtil.formatTime(0));
                    }else{
                        createCell(j, ReportUtil.formatTime(Math.round(a/b)));
                    }
                }
                if(temp!=null && fieldId.equalsIgnoreCase("CallOutAverageTimeLength")){
                    float a = Float.valueOf(obj.get("CallOutTimeLength").toString());
                    int b = Float.valueOf(obj.get("CallOutAcceptCount").toString()).intValue();
                    if(b == 0){
                        createCell(j, ReportUtil.formatTime(0));
                    }else{
                        createCell(j, ReportUtil.formatTime(Math.round(a/b)));
                    }
                }
                if(temp!=null && fieldId.equalsIgnoreCase("CallInNotDealCount")){
                	double a = (Double)obj.get("CallInAcceptCount");
                	double b = (Double)obj.get("CallInAccessCount");
                	createCell(j, b-a);
                }
            }

            for(int b=0; b<allHeads.size(); b++){
                allFieldId = allHeads.get(b).getFieldId();
                if(!stringList.contains(allFieldId)){
                    if(i == 0){
                        totals.put(allFieldId, 0);
                    }

                    int allTempInt = Float.valueOf(obj.get(allFieldId).toString()).intValue();
                    totals.put(allFieldId, totals.get(allFieldId) + allTempInt);
                }
            }
//            if(!totals.containsKey("BUSY_TIME_LENGTH")){
//                totals.put("BUSY_TIME_LENGTH", 0);
//            }
//            totals.put("BUSY_TIME_LENGTH", totals.get("BUSY_TIME_LENGTH") + Float.valueOf(obj.get("BUSY_TIME_LENGTH").toString()).intValue());
//            if(!totals.containsKey("STATE99_TIME_LENGTH")){
//                totals.put("STATE99_TIME_LENGTH", 0);
//            }
//            totals.put("STATE99_TIME_LENGTH", totals.get("STATE99_TIME_LENGTH") + Float.valueOf(obj.get("STATE99_TIME_LENGTH").toString()).intValue());

            endRow();
            rownum++;
        }

        if(sortedList.size()>0){
            insertRow(rownum);
            for (int m = 0; m < heads.size(); m++) {
                fieldId = heads.get(m).getFieldId();
                if (fieldId.equals("agent_name") || fieldId.equals("show_time")) {
                    createCell(m, "\u5408\u8ba1");
                }else if(fieldId.equals("exten")){
                	createCell(m, "");
                }else if(fieldId.equals("AgentUtilization")){
                    double a = totals.get("CallInTimeLength");
                    double b = totals.get("STATE99_TIME_LENGTH");
                    double b2 = totals.containsKey("STATE2_TIME_LENGTH")?totals.get("STATE2_TIME_LENGTH"):0;
                    double b3 = totals.containsKey("STATE3_TIME_LENGTH")?totals.get("STATE3_TIME_LENGTH"):0;
                    double b4 = totals.containsKey("STATE4_TIME_LENGTH")?totals.get("STATE4_TIME_LENGTH"):0;
                    double b5 = totals.containsKey("STATE5_TIME_LENGTH")?totals.get("STATE5_TIME_LENGTH"):0;
                    double b6 = totals.containsKey("STATE6_TIME_LENGTH")?totals.get("STATE6_TIME_LENGTH"):0;
                    double b7 = totals.containsKey("STATE7_TIME_LENGTH")?totals.get("STATE7_TIME_LENGTH"):0;
                    double b8 = totals.containsKey("STATE8_TIME_LENGTH")?totals.get("STATE8_TIME_LENGTH"):0;
                    double c = totals.get("BUSY_TIME_LENGTH");
                    double d = totals.get("CallOutTimeLength");
                    double e = totals.get("LOGIN_TIME_LENGTH");
                    if(e == 0){
                        createCell(m,"0%");
                    }else{
                        if(Math.round((a+b+d)/(e-(b2+b3+b4+b5+b6+b7+b8))*100) > 100){
                            createCell(m,"100%");
                        }else{
                            createCell(m, Math.round((a+b+d)/(e-(b2+b3+b4+b5+b6+b7+b8))*100) + "%");
                        }
                    }
                }else if(fieldId.equalsIgnoreCase("CallInAcceptRate")){
                    double a = totals.get("CallInAcceptCount");
                    double b = totals.get("CallInAccessCount");
                    if(b == 0){
                        createCell(m,"0%");
                    }else{
                        createCell(m, Math.round(a/b*100) + "%");
                    }
                }else if(fieldId.equals("AverageHourCallCount")){
                    double a = totals.get("CallInAcceptCount");
                    double b = totals.get("CallOutAcceptCount");
                    double c = totals.get("LOGIN_TIME_LENGTH");
                    if(c == 0){
                        createCell(m, 0);
                    }else if(c <= 1800l){
                        createCell(m, a+b);
                    }else{
                        createCell(m, Math.round((a+b)*1800/c));
                    }
                }else if(fieldId.equalsIgnoreCase("CallInAverageTimeLength")){
                    float a = totals.get("CallInTimeLength");
                    int b = totals.get("CallInAcceptCount");
                    if(b == 0){
                        createCell(m, ReportUtil.formatTime(0));
                    }else{
                        createCell(m, ReportUtil.formatTime(Math.round(a/b)));
                    }
                }else if(fieldId.equalsIgnoreCase("CallOutAverageTimeLength")){
                    float a = totals.get("CallOutTimeLength");
                    int b = totals.get("CallOutAcceptCount");
                    if(b == 0){
                        createCell(m, ReportUtil.formatTime(0));
                    }else{
                        createCell(m, ReportUtil.formatTime(Math.round(a/b)));
                    }
                }else if(fieldId.equalsIgnoreCase("CallInNotDealCount")){
                	int a = totals.get("CallInAcceptCount");
                    int b = totals.get("CallInAccessCount");
                    createCell(m, b-a);
                }else if(sumTimeList.contains(fieldId)){
                    createCell(m, ReportUtil.formatTime(totals.get(fieldId)));
                }else{
                    createCell(m, totals.get(fieldId));
                }
            }
            endRow();
        }
        endSheet();
    }

	private BasicDBList queryReport(Map<String, Object> queryData) {
		String accountId = queryData.get("accountId").toString();
		String userId = queryData.get("user").toString();
		String userType = queryData.get("userType").toString();
		BasicDBObject key = new BasicDBObject();
		BasicDBObject condition = new BasicDBObject();
    	key.append("AgentID", 1);
    	ReportUtil.getReportTime(queryData, condition);
    	condition.append("AccountID", accountId);
        if(queryData.containsKey("AgentID")){
            condition.append("AgentID", queryData.get("AgentID"));
        }

        BasicDBObject initial = new BasicDBObject();
    	initial.append("CallInAcceptCount", 0);
    	initial.append("CallInAccessCount", 0);
    	initial.append("CallOutAccessCount", 0);
    	initial.append("CallOutAcceptCount", 0);
    	initial.append("TransferAcceptCount", 0);
    	initial.append("CallInTimeLength", 0);
    	initial.append("CallOutTimeLength", 0);
    	initial.append("LOGIN_TIME_LENGTH", 0);
    	initial.append("BUSY_TIME_LENGTH", 0);
    	initial.append("IDLE_TIME_LENGTH", 0);
    	initial.append("STATE2_TIME_LENGTH", 0);
    	initial.append("STATE3_TIME_LENGTH", 0);
    	initial.append("STATE4_TIME_LENGTH", 0);
    	initial.append("STATE5_TIME_LENGTH", 0);
    	initial.append("STATE6_TIME_LENGTH", 0);
    	initial.append("STATE7_TIME_LENGTH", 0);
    	initial.append("STATE8_TIME_LENGTH", 0);
    	initial.append("STATE9_TIME_LENGTH", 0);
    	initial.append("STATE99_TIME_LENGTH", 0);
    	
    	String reduce = "function (obj, prev) { " + 
    			"prev.CallInAcceptCount += obj.CallInAcceptCount;" +
    			"prev.CallInAccessCount += obj.CallInAccessCount;" +
    			"prev.CallOutAccessCount += obj.CallOutAccessCount;" +
    			"prev.CallOutAcceptCount += obj.CallOutAcceptCount;" +
    			"prev.TransferAcceptCount += obj.TransferAcceptCount;" +
    			"prev.CallInTimeLength += obj.CallInTimeLength;" +
    			"prev.CallOutTimeLength += obj.CallOutTimeLength;" +
    			"prev.LOGIN_TIME_LENGTH += obj.LOGIN_TIME_LENGTH;" +
    			"prev.BUSY_TIME_LENGTH += obj.BUSY_TIME_LENGTH;" +
    			"prev.IDLE_TIME_LENGTH += obj.IDLE_TIME_LENGTH;" +
    			"prev.STATE2_TIME_LENGTH += obj.STATE2_TIME_LENGTH;" +
    			"prev.STATE3_TIME_LENGTH += obj.STATE3_TIME_LENGTH;" +
    			"prev.STATE4_TIME_LENGTH += obj.STATE4_TIME_LENGTH;" +
    			"prev.STATE5_TIME_LENGTH += obj.STATE5_TIME_LENGTH;" +
    			"prev.STATE6_TIME_LENGTH += obj.STATE6_TIME_LENGTH;" +
    			"prev.STATE7_TIME_LENGTH += obj.STATE7_TIME_LENGTH;" +
    			"prev.STATE8_TIME_LENGTH += obj.STATE8_TIME_LENGTH;" +
    			"prev.STATE9_TIME_LENGTH += obj.STATE9_TIME_LENGTH;" +
    			"prev.STATE99_TIME_LENGTH += obj.STATE99_TIME_LENGTH;}";
    	
    	String finalize = "function(prev){" +
    			"if(prev.CallInAccessCount == 0){" +
    			"prev.CallInAcceptRate = '0%';}else{" +
    			"prev.CallInAcceptRate = Math.round(prev.CallInAcceptCount/prev.CallInAccessCount*100)+'%';}" + 
    			"if(prev.CallInAcceptCount == 0){" +
    			"prev.CallInAverageTimeLength = 0;}else{" +
    			"prev.CallInAverageTimeLength = Math.round(prev.CallInTimeLength/prev.CallInAcceptCount);}" +
    			"if(prev.CallOutAcceptCount == 0){" +
    			"prev.CallOutAverageTimeLength = 0;}else{" +
    			"prev.CallOutAverageTimeLength = Math.round(prev.CallOutTimeLength/prev.CallOutAcceptCount);}" +
    			"if(prev.LOGIN_TIME_LENGTH == 0){" +
    			"prev.AverageHourCallCount = 0;prev.AgentUtilization = '0%';}" +
                "else if(prev.LOGIN_TIME_LENGTH <= 1800){ prev.AverageHourCallCount = prev.CallInAcceptCount + prev.CallOutAcceptCount;" +
                "prev.AgentUtilization = Math.round((prev.CallInTimeLength + prev.CallOutTimeLength + prev.STATE99_TIME_LENGTH)/(prev.LOGIN_TIME_LENGTH - (prev.STATE2_TIME_LENGTH + prev.STATE3_TIME_LENGTH +" +
                "prev.STATE4_TIME_LENGTH + prev.STATE5_TIME_LENGTH + prev.STATE6_TIME_LENGTH + prev.STATE7_TIME_LENGTH + prev.STATE8_TIME_LENGTH + prev.STATE9_TIME_LENGTH))* 100) + '%';" +
                "}else{" +
    			"prev.AverageHourCallCount = Math.round((prev.CallInAcceptCount + prev.CallOutAcceptCount) * 1800/prev.LOGIN_TIME_LENGTH);" +
    			"prev.AgentUtilization = Math.round((prev.CallInTimeLength + prev.CallOutTimeLength + prev.STATE99_TIME_LENGTH)/(prev.LOGIN_TIME_LENGTH - (prev.STATE2_TIME_LENGTH + prev.STATE3_TIME_LENGTH +" +
                "prev.STATE4_TIME_LENGTH + prev.STATE5_TIME_LENGTH + prev.STATE6_TIME_LENGTH + prev.STATE7_TIME_LENGTH + prev.STATE8_TIME_LENGTH + prev.STATE9_TIME_LENGTH))* 100) + '%';" +
    			"if(parseInt(prev.AgentUtilization) > 100){prev.AgentUtilization = '100%';}}" +
    			"prev.CallInNotDealCount = prev.CallInAccessCount - prev.CallInAcceptCount;}";
    	
//    	DBCollection collection = MongoConnect.getInstance().getDB().getCollection("app_report_agent_houre");
        DBCollection collection = MongoConnect.getInstance().getReportDB().getCollection("cdr_report_agent_houre");
        BasicDBList groupList = (BasicDBList)collection.group(key, condition, initial, reduce, finalize);
		return groupList;
	}
	
	private BasicDBList queryTimeReport(Map<String, Object> queryData) {
		String agentId = queryData.get("AgentID").toString();
		String TimeType = queryData.get("TimeType").toString();
		BasicDBObject key = new BasicDBObject();
		BasicDBObject condition = new BasicDBObject();
		key.append(ReportUtil.getGroupTimeKey(TimeType), 1);
    	//key.append("AgentID", 1);
    	ReportUtil.getReportTime(queryData, condition);
    	condition.append("AgentID", agentId);
    	
        BasicDBObject initial = new BasicDBObject();
    	initial.append("CallInAcceptCount", 0);
    	initial.append("CallInAccessCount", 0);
    	initial.append("CallOutAccessCount", 0);
    	initial.append("CallOutAcceptCount", 0);
    	initial.append("TransferAcceptCount", 0);
    	initial.append("CallInTimeLength", 0);
    	initial.append("CallOutTimeLength", 0);
    	initial.append("LOGIN_TIME_LENGTH", 0);
    	initial.append("BUSY_TIME_LENGTH", 0);
    	initial.append("IDLE_TIME_LENGTH", 0);
    	initial.append("STATE2_TIME_LENGTH", 0);
    	initial.append("STATE3_TIME_LENGTH", 0);
    	initial.append("STATE4_TIME_LENGTH", 0);
    	initial.append("STATE5_TIME_LENGTH", 0);
    	initial.append("STATE6_TIME_LENGTH", 0);
    	initial.append("STATE7_TIME_LENGTH", 0);
    	initial.append("STATE8_TIME_LENGTH", 0);
    	initial.append("STATE9_TIME_LENGTH", 0);
    	initial.append("STATE99_TIME_LENGTH", 0);
    	
    	String reduce = "function (obj, prev) { " + 
    			"prev.CallInAcceptCount += obj.CallInAcceptCount;" +
    			"prev.CallInAccessCount += obj.CallInAccessCount;" +
    			"prev.CallOutAccessCount += obj.CallOutAccessCount;" +
    			"prev.CallOutAcceptCount += obj.CallOutAcceptCount;" +
    			"prev.TransferAcceptCount += obj.TransferAcceptCount;" +
    			"prev.CallInTimeLength += obj.CallInTimeLength;" +
    			"prev.CallOutTimeLength += obj.CallOutTimeLength;" +
    			"prev.LOGIN_TIME_LENGTH += obj.LOGIN_TIME_LENGTH;" +
    			"prev.BUSY_TIME_LENGTH += obj.BUSY_TIME_LENGTH;" +
    			"prev.IDLE_TIME_LENGTH += obj.IDLE_TIME_LENGTH;" +
    			"prev.STATE2_TIME_LENGTH += obj.STATE2_TIME_LENGTH;" +
    			"prev.STATE3_TIME_LENGTH += obj.STATE3_TIME_LENGTH;" +
    			"prev.STATE4_TIME_LENGTH += obj.STATE4_TIME_LENGTH;" +
    			"prev.STATE5_TIME_LENGTH += obj.STATE5_TIME_LENGTH;" +
    			"prev.STATE6_TIME_LENGTH += obj.STATE6_TIME_LENGTH;" +
    			"prev.STATE7_TIME_LENGTH += obj.STATE7_TIME_LENGTH;" +
    			"prev.STATE8_TIME_LENGTH += obj.STATE8_TIME_LENGTH;" +
    			"prev.STATE9_TIME_LENGTH += obj.STATE9_TIME_LENGTH;" +
    			"prev.STATE99_TIME_LENGTH += obj.STATE99_TIME_LENGTH;}";
    	
    	String finalize = "function(prev){" +
    			"if(prev.CallInAccessCount == 0){" +
    			"prev.CallInAcceptRate = '0%';}else{" +
    			"prev.CallInAcceptRate = Math.round(prev.CallInAcceptCount/prev.CallInAccessCount*100)+'%';}" + 
    			"if(prev.CallInAcceptCount == 0){" +
    			"prev.CallInAverageTimeLength = 0;}else{" +
    			"prev.CallInAverageTimeLength = Math.round(prev.CallInTimeLength/prev.CallInAcceptCount);}" +
          "if(prev.CallOutAcceptCount == 0){" +
    			"prev.CallOutAverageTimeLength = 0;}else{" +
    			"prev.CallOutAverageTimeLength = Math.round(prev.CallOutTimeLength/prev.CallOutAcceptCount);}" +
    			"if(prev.LOGIN_TIME_LENGTH == 0){" +
    			"prev.AverageHourCallCount = 0;prev.AgentUtilization = '0%';}else{" +
    			"prev.AverageHourCallCount = Math.round((prev.CallInAcceptCount + prev.CallOutAcceptCount) * 1800/prev.LOGIN_TIME_LENGTH);" +
    			"prev.AgentUtilization = Math.round((prev.CallInTimeLength + prev.STATE99_TIME_LENGTH + prev.BUSY_TIME_LENGTH + prev.CallOutTimeLength)/prev.LOGIN_TIME_LENGTH * 100) + '%';" +
    			"if(parseInt(prev.AgentUtilization) > 100){prev.AgentUtilization = '100%';}}" +
    			"prev.CallInNotDealCount = prev.CallInAccessCount - prev.CallInAcceptCount;}";
    	
//    	DBCollection collection = MongoConnect.getInstance().getDB().getCollection("app_report_agent_houre");
        DBCollection collection = MongoConnect.getInstance().getReportDB().getCollection("cdr_report_agent_houre");
		BasicDBList groupList = (BasicDBList)collection.group(key, condition, initial, reduce, finalize);
		return groupList;
	}
	
	public void genrateHeader(List<ExportModelVo> list) throws Exception{
		insertRow(0);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();		
	}
}
