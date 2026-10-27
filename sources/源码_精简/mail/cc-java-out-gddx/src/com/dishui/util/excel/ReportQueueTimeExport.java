package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class ReportQueueTimeExport extends XssfWriter {

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
		String accountId = query.get("accountId").toString();
		//获取技能组对比报表的表头
		//List<ExportModelVo> heads=ReportUtil.getHeaders("call_report_queue_time",accountId);
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                "call_report_queue_time", accountId);
        List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject key = new BasicDBObject();
        String groupKey = ReportUtil.getGroupTimeKey(query.get("TimeType").toString());
        key.put(groupKey,true);
        
        DBObject condition = new BasicDBObject();
        condition.put("AccountID",accountId);
		ReportUtil.getReportTime(query, condition);
		//如果选择了技能组条件
		if(query.containsKey("currentQueue") && !query.get("currentQueue").toString().equals("")){
			condition.put("QueueID",query.get("currentQueue").toString());
		}
		
        DBObject inital = new BasicDBObject();
        inital.put("AccessCount", 0);
        inital.put("AcceptCount", 0);
        inital.put("AcceptIn20Count", 0);
        inital.put("AbandonIn6SumQueueLeak", 0);
        inital.put("AbandonMaxQueueTimeLength", 0);
        inital.put("AbandonMinQueueTimeLength", 0);
        inital.put("AbandonSumQueueTimeLength", 0);
        inital.put("AcceptMaxQueueTimeLength", 0);
        inital.put("AcceptMinQueueTimeLength", 0);
        inital.put("AcceptSumCallInTimeLength", 0);
        inital.put("AcceptSumQueueTimeLength", 0);
        
        StringBuilder reduce = new StringBuilder();
		reduce.append("function( curr, result ){")
			.append("result.AccessCount += curr.AccessCount;")
			.append("result.AcceptCount += curr.AcceptCount;")
			.append("result.AcceptIn20Count += curr.AcceptIn20Count;")
			.append("result.AbandonIn6SumQueueLeak += curr.AbandonIn6SumQueueLeak;")
			.append("if(curr.AbandonMaxQueueTimeLength > result.AbandonMaxQueueTimeLength){")
			.append("result.AbandonMaxQueueTimeLength = curr.AbandonMaxQueueTimeLength;")
			.append("}")
			.append("if(result.AbandonMinQueueTimeLength === 0){")
			.append("result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;")
			.append("}")
			.append("if(curr.AbandonMinQueueTimeLength <  result.AbandonMinQueueTimeLength){")
			.append("result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;")
			.append("}")
			.append("result.AbandonSumQueueTimeLength += curr.AbandonSumQueueTimeLength;")
			.append("if(curr.AcceptMaxQueueTimeLength > result.AcceptMaxQueueTimeLength){")
			.append("result.AcceptMaxQueueTimeLength = curr.AcceptMaxQueueTimeLength;")
			.append("}")
			.append("if(result.AcceptMinQueueTimeLength === 0){")
			.append("result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;")
			.append("}")
			.append("if(curr.AcceptMinQueueTimeLength <  result.AcceptMinQueueTimeLength){")
			.append("result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;")
			.append("}")
			.append("result.AcceptSumCallInTimeLength += curr.AcceptSumCallInTimeLength;")
			.append("result.AcceptSumQueueTimeLength += curr.AcceptSumQueueTimeLength;")
			.append("}");
        
	
		StringBuilder finalize = new StringBuilder();
		finalize.append("function(result){")
			.append("result.AcceptRate = Math.round(result.AcceptCount/result.AccessCount*100) + '%';")
			.append("result.AcceptAverageQueueTimeLength = Math.round(result.AcceptSumQueueTimeLength/result.AcceptCount);")
			.append("if(result.AccessCount-result.AcceptCount === 0){")
			.append("result.AbandonAverageQueueTimeLength = 0;")
			.append("}else{")
			.append("result.AbandonAverageQueueTimeLength = result.AbandonSumQueueTimeLength/(result.AccessCount-result.AcceptCount);")
			.append("}")
			.append("}");
        
//        BasicDBList list = MongoProvider.group("app_report_queue_hour", key, condition, inital, reduce.toString(), finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb("cdr_report_queue_hour", key, condition, inital, reduce.toString(), finalize.toString());

        //sort list
        List<Object> sortList = ReportUtil.sortListByTime(list,groupKey);

		genrateHeader(heads);
		
		//生成表格
		String fileId = null;
		Map<String, Integer> totals = new HashMap<String, Integer>();
		List<String> sumList = new ArrayList<String>();
		List<String> maxList = new ArrayList<String>();
		List<String> minList = new ArrayList<String>();
		sumList.add("AccessCount");
		sumList.add("AcceptCount");
		sumList.add("AcceptIn20Count");
		maxList.add("AcceptMaxQueueTimeLength");
		maxList.add("AbandonMaxQueueTimeLength");
		minList.add("AcceptMinQueueTimeLength");
		minList.add("AbandonMinQueueTimeLength");
		
		for(int j=0 ;j < sortList.size() ; j++){
			DBObject obj = (DBObject)sortList.get(j);
			insertRow(rownum);

			for(int i=0;i<heads.size();i++){
				fileId = heads.get(i).getFieldId();
				Object temp = null;
				if(heads.get(i).getFieldId().equals("ReportTime")){
					temp = obj.get(groupKey);
				}else{
					temp = obj.get(heads.get(i).getFieldId());
				}
				
				if(temp!=null && 
						(heads.get(i).getFieldId().equals("AcceptAverageQueueTimeLength") ||
						 heads.get(i).getFieldId().equals("AcceptMaxQueueTimeLength") ||
						 heads.get(i).getFieldId().equals("AcceptMinQueueTimeLength") ||
						 heads.get(i).getFieldId().equals("AbandonAverageQueueTimeLength") ||
						 heads.get(i).getFieldId().equals("AbandonMaxQueueTimeLength") ||
						 heads.get(i).getFieldId().equals("AbandonMinQueueTimeLength") )
					){
					String tempStr = temp.toString();
					int second = 0;
					if(tempStr.contains(".")){
						second = Integer.parseInt(tempStr.substring(0,tempStr.indexOf(".")));						
					}else{
						if(!tempStr.equalsIgnoreCase("NaN")){
							second = Integer.valueOf(tempStr);							
						}
					}
					createCell(i,ReportUtil.formatTime(second));
				}else if(temp!=null && 
						(fileId.equals("AccessCount") ||
						 fileId.equals("AcceptCount") ||
						 fileId.equals("AcceptIn20Count"))){
					createCell(i,temp==null?"":Float.valueOf(obj.get(fileId).toString()).intValue()+"");
				}else{
					createCell(i,temp==null?"":temp.toString());
				}
			}

            for (int k = 0, jLen = allHeads.size(); k < jLen; k++) {
                fileId = allHeads.get(k).getFieldId();

                if (j == 0) {
                    totals.put(fileId, 0);
                }
                if(sumList.contains(fileId)){
                    totals.put(fileId, totals.get(fileId) + Float.valueOf(obj.get(fileId).toString()).intValue());
                }
                if(maxList.contains(fileId)){
                    int value = Float.valueOf(obj.get(fileId).toString()).intValue();
                    if( value > totals.get(fileId)){
                        totals.put(fileId, value);
                    }
                }
                if(minList.contains(fileId)){
                    int value = Float.valueOf(obj.get(fileId).toString()).intValue();
                    if(value != 0){
                        if(totals.get(fileId) == 0){
                            totals.put(fileId,value);
                        }
                        if(value < totals.get(fileId)){
                            totals.put(fileId, value);
                        }
                    }
                }
            }
			//表头里没有的三项
			if(!totals.containsKey("AcceptSumQueueTimeLength")){
				totals.put("AcceptSumQueueTimeLength", 0);
			}			
			totals.put("AcceptSumQueueTimeLength", totals.get("AcceptSumQueueTimeLength") + Float.valueOf(obj.get("AcceptSumQueueTimeLength").toString()).intValue());				
			
			if(!totals.containsKey("AcceptSumCallInTimeLength")){
				totals.put("AcceptSumCallInTimeLength", 0);
			}				
			totals.put("AcceptSumCallInTimeLength", totals.get("AcceptSumCallInTimeLength") + Float.valueOf(obj.get("AcceptSumCallInTimeLength").toString()).intValue());				
			
			if(!totals.containsKey("AbandonSumQueueTimeLength")){
				totals.put("AbandonSumQueueTimeLength", 0);
			}			
			totals.put("AbandonSumQueueTimeLength", totals.get("AbandonSumQueueTimeLength") + Float.valueOf(obj.get("AbandonSumQueueTimeLength").toString()).intValue());				

			endRow();
			rownum++;
		}
		//计算合计，插入表格
		if(sortList.size()>0){
			insertRow(rownum);
			for (int j = 0, jLen = heads.size(); j < jLen; j++) {
				fileId = heads.get(j).getFieldId();
				if(fileId.equals("ReportTime")){
                    createCell(j, "\u5408\u8ba1");
                }else if(fileId.equals("AcceptRate")){
					double a = totals.get("AcceptCount");
					double b = totals.get("AccessCount");
					createCell(j, Math.round(a/b*100) + "%");
				}else if(fileId.equals("AcceptAverageQueueTimeLength")){//接通平均排队时长AcceptAverageQueueTimeLength
					if(totals.get("AcceptCount") != 0){
                        createCell(j, ReportUtil.formatTime(totals.get("AcceptSumQueueTimeLength")/totals.get("AcceptCount")));
                    }else{
                        createCell(j, ReportUtil.formatTime(0));
                    }
				}else if(fileId.equals("AbandonAverageQueueTimeLength")){//放弃平均排队时长
					if((totals.get("AccessCount") - totals.get("AcceptCount")) == 0){
						createCell(j, ReportUtil.formatTime(0));	
					}else{
						createCell(j, ReportUtil.formatTime(totals.get("AbandonSumQueueTimeLength")/(totals.get("AccessCount")-totals.get("AcceptCount"))));
					}
				}else if(fileId.equals("AcceptAverageCallInTimeLength")){//平均通话时长
					 if(totals.get("AcceptCount") != 0){
	                        createCell(j, ReportUtil.formatTime(totals.get("AcceptSumCallInTimeLength")/totals.get("AcceptCount")));
	                    }else{
	                        createCell(j, ReportUtil.formatTime(0));
	                    }
				}
				else{
					if(maxList.contains(fileId) || minList.contains(fileId)){
						createCell(j, ReportUtil.formatTime(totals.get(fileId)));	
					}else{
						createCell(j, totals.get(fileId));											
					}
				}
			}
			endRow();	
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
}
