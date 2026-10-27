package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoConnect;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;

public class ReportDialoutTimeExport extends XssfWriter{

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		
		String accountId = query.get("accountId").toString();
		String timeType = query.get("TimeType").toString();
		
		Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders("call_report_callout_time", accountId);
		List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");
        
        int rownum = 1;
        beginSheet();
        
        BasicDBList groupList = new BasicDBList();
        groupList = this.queryDialoutTimeReport(query);
        List<Object> sortedList = new ArrayList<Object>();
        for(int i=0; i<groupList.size(); i++){
            DBObject object = (DBObject)groupList.get(i);
            if(timeType.equals("year")){
                object.put("ReportTime", object.get("MonthID"));
            }else if(timeType.equals("month")){
                object.put("ReportTime", object.get("DayID"));
            }else if(timeType.equals("day")){
                object.put("ReportTime", object.get("ReportTime"));
            }else if(timeType.equals("other")){
                object.put("ReportTime", object.get("DayID"));
            }
        }
        sortedList = ReportUtil.sortListByTime(groupList, "ReportTime");
        
        genrateHeader(heads);
        
        Map<String, Integer> totals = new HashMap<String, Integer>();
        List<String> sumList = new ArrayList<String>();
        List<String> sumTimeList = new ArrayList<String>();
        List<String> stringList = new ArrayList<String>();
        sumList.add("DealingCount");
        sumList.add("NotDealCount");
        sumList.add("LeakCount");
        sumList.add("AccessCount");
        sumTimeList.add("CallTimeLength");
        stringList.add("DealingRate");
        stringList.add("CallTimeLengthAvg");
        stringList.add("ReportTime");
        
        String fieldId = null;
        String allFieldId = null;
        for(int i=0; i<sortedList.size(); i++){
            DBObject obj = (DBObject)sortedList.get(i);
            insertRow(rownum);
            for(int j=0; j<heads.size(); j++){
                fieldId = heads.get(j).getFieldId();
                
                boolean timeTemp = fieldId.equalsIgnoreCase("CallTimeLength");
                                
                boolean countTemp = fieldId.equalsIgnoreCase("DealingCount") ||
                        fieldId.equalsIgnoreCase("NotDealCount") ||
                        fieldId.equalsIgnoreCase("LeakCount");
                
                Object temp = null;
                if(i == 0){
                    totals.put(fieldId, 0);
                }
                
                if(heads.get(j).getFieldId().equals("ReportTime")){
                    temp = obj.get(ReportUtil.getGroupTimeKey(timeType).toString());
                }else{
                    temp = obj.get(heads.get(j).getFieldId());
                }
                
                if(temp!=null && timeTemp){
                    int tempInt = Float.valueOf(obj.get(fieldId).toString()).intValue();
                    createCell(j,ReportUtil.formatTime(tempInt));
                }else if(temp!=null && heads.get(j).getFieldId().equals("ReportTime")){
                    createCell(j,temp.toString());
                }else if(temp!=null && countTemp){
                    createCell(j,temp==null?"":Float.valueOf(obj.get(fieldId).toString()).intValue()+"");
                }
                
                if(temp!=null && fieldId.equalsIgnoreCase("AccessCount")){
                	double a = (Double)obj.get("DealingCount");
                	double b = (Double)obj.get("NotDealCount");
                	double c = (Double)obj.get("LeakCount");
                	createCell(j, (a+b+c));
                }
                if(temp!=null && fieldId.equalsIgnoreCase("DealingRate")){
                    double a = (Double)obj.get("DealingCount");
                    double b = (Double)obj.get("AccessCount");
                    if(b == 0){
                        createCell(j,"0%");
                    }else{
                        createCell(j, Math.round(a/b*100) + "%");
                    }
                }
                
                if(temp!=null && fieldId.equalsIgnoreCase("CallTimeLengthAvg")){
                    int a = Float.valueOf(obj.get("CallTimeLength").toString()).intValue();
                    int b = Float.valueOf(obj.get("DealingCount").toString()).intValue();
                    if(b == 0){
                        createCell(j, ReportUtil.formatTime(0));
                    }else{
                        createCell(j, ReportUtil.formatTime(a/b));
                    }
                }
                
            }
            
            for(int b=0; b<allHeads.size(); b++){
                allFieldId = allHeads.get(b).getFieldId();
                if(!stringList.contains(allFieldId)){
                    if(i == 0){
                        totals.put(allFieldId, 0);
                    }
                    
                    if(sumList.contains(allFieldId)){
                        totals.put(allFieldId, totals.get(allFieldId) + Float.valueOf(obj.get(allFieldId).toString()).intValue());
                    }
                    if(sumTimeList.contains(allFieldId)){
                    	totals.put(allFieldId, totals.get(allFieldId) + Float.valueOf(obj.get(allFieldId).toString()).intValue());
                    }
                }
            }
            endRow();
            rownum++;
        }
        
        if(sortedList.size()>0){
            insertRow(rownum);
            for (int m = 0; m < heads.size(); m++) {
                fieldId = heads.get(m).getFieldId();
                if (fieldId.equals("ReportTime")) {
                    createCell(m, "\u5408\u8ba1");
                }else if(fieldId.equalsIgnoreCase("AccessCount")){
                	int a = totals.get("DealingCount");
                	int b = totals.get("NotDealCount");
                	int c = totals.get("LeakCount");
                	createCell(m, (a+b+c));
                }else if(fieldId.equalsIgnoreCase("DealingRate")){
                    double a = totals.get("DealingCount");
                    double b = totals.get("AccessCount");
                    if(b == 0){
                        createCell(m,"0%");
                    }else{
                        createCell(m, Math.round(a/b*100) + "%");
                    }
                }else if(fieldId.equalsIgnoreCase("CallTimeLengthAvg")){
                    int a = totals.get("CallTimeLength");
                    int b = totals.get("DealingCount");
                    if(b == 0){
                        createCell(m, ReportUtil.formatTime(0));
                    }else{
                        createCell(m, ReportUtil.formatTime(a/b));
                    }
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

	private BasicDBList queryDialoutTimeReport(Map<String, Object> queryData) {
		
		String timeType = queryData.get("TimeType").toString();
		BasicDBObject key = new BasicDBObject();
		key.append(ReportUtil.getGroupTimeKey(timeType), 1);
		
		BasicDBObject condition = new BasicDBObject();
    	ReportUtil.getReportTime(queryData, condition);
    	String accountId = queryData.get("accountId").toString();
    	condition.append("AccountID", accountId);
    	
    	BasicDBObject initial = new BasicDBObject();
    	initial.append("DealingCount", 0);
    	initial.append("NotDealCount", 0);
    	initial.append("LeakCount", 0);
    	initial.append("CallTimeLength", 0);
    	
    	String reduce = "function (obj, prev) { " + 
    			"prev.DealingCount += obj.DealingCount;" +
    			"prev.NotDealCount += obj.NotDealCount;" +
    			"prev.LeakCount += obj.LeakCount;" +
    			"prev.CallTimeLength += obj.CallTimeLength;}";
    	
    	String finalize = "function(prev){" +
    			"prev.AccessCount = prev.DealingCount + prev.NotDealCount + prev.LeakCount;" +
    			"if(prev.AccessCount == 0){" +
    			"prev.DealingRate = '0%';}else{" +
    			"prev.DealingRate = Math.round(prev.DealingCount/prev.AccessCount*100)+'%';}" +
    			"if(prev.DealingCount == 0){" +
    			"prev.CallTimeLengthAvg = 0;}else{" +
    			"prev.CallTimeLengthAvg = prev.CallTimeLength/prev.DealingCount;}}";

        DBCollection collection = MongoConnect.getInstance().getReportDB().getCollection("cdr_report_call_out");
//    	DBCollection collection = MongoConnect.getInstance().getDB().getCollection("app_report_call_out");
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
