package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class RelayAreaReportExport extends XssfWriter {


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        // TODO Auto-generated method stub
        String accountId = query.get("accountId").toString();
        //获取外呼地域报表的表头
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                "call_report_relay_area", accountId);
        List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");
        //电子表格开始
        int rownum = 1;
        beginSheet();

        DBObject key = new BasicDBObject();
        key.put("Province", true);

        DBObject condition = new BasicDBObject();
        condition.put("AccountID",accountId);
        ReportUtil.getReportTime(query, condition);

        Iterator it = query.keySet().iterator();
        List<String> proList = new ArrayList<String>();
        List<String> proListFalse = new ArrayList<String>();
        List<String> serviceList = new ArrayList<String>();
        List<String> serviceListFalse = new ArrayList<String>();
        while(it.hasNext()){
        	String queryKey = (String) it.next();
        	if(queryKey.length()>10 && queryKey.substring(0, 9).equals("Province_")){
        		if(query.get(queryKey).toString().equals("true")){
        			proList.add(queryKey.substring(9));        			
        		}else{
        			proListFalse.add(queryKey.substring(9));
        		}
        	}
            if(queryKey.length()>11 && queryKey.substring(0, 10).equals("ServiceNo_")){
                if(query.get(queryKey).toString().equals("true")){
                    serviceList.add(queryKey.substring(10));
                }else{
                    serviceListFalse.add(queryKey.substring(10));
                }
            }
        }
        if(proList.size() > 0 || proListFalse.size() > 0){
            condition.put("Province",new BasicDBObject("$in", proList));
        }
        if(serviceListFalse.size() > 0 &&  Boolean.parseBoolean(query.get("delete_call_serverNo").toString())){
            condition.put("Service", new BasicDBObject("$nin", serviceListFalse));
        }else if(serviceList.size() > 0 || serviceListFalse.size() > 0){
            condition.put("Service", new BasicDBObject("$in", serviceList));
        }

        BasicDBObject initial = new BasicDBObject();
		initial.put("DealingCount", 0);
		initial.put("NotDealCount", 0);
		initial.put("LeakCount", 0);
		initial.put("QueueLeakCount", 0);
		initial.put("BlackListCount", 0);
		initial.put("VoicemailCount", 0);

		StringBuilder reduce = new StringBuilder();
		reduce.append("function( curr, result ){")
				.append("result.DealingCount += curr.DealingCount;")
				.append("result.NotDealCount += curr.NotDealCount;")
				.append("result.LeakCount += curr.LeakCount;")
				.append("result.QueueLeakCount += curr.QueueLeakCount;")
				.append("result.BlackListCount += curr.BlackListCount;")
				.append("result.VoicemailCount += curr.VoicemailCount;")
				.append("}");

		StringBuilder finalize = new StringBuilder();
		finalize.append("function(result){")
				.append("result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount+result.QueueLeakCount+result.BlackListCount+result.VoicemailCount;}");
		
//		BasicDBList list = MongoProvider.group("app_report_service_call_in", key,
//				condition, initial, reduce.toString(), finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb("cdr_report_service_call_in", key,
                condition, initial, reduce.toString(), finalize.toString());


        //sort list
        List<Object> sortList = ReportUtil.sortListByChinese(list,"Province");

        genrateHeader(heads);

        //生成表格
        String fileId = null;
        Map<String, Integer> totals = new HashMap<String, Integer>();
        List<String> sumList = new ArrayList<String>();
        sumList.add("DealingCount");
        sumList.add("NotDealCount");
        sumList.add("LeakCount");
        sumList.add("QueueLeakCount");
        sumList.add("BlackListCount");
        sumList.add("VoicemailCount");
        sumList.add("AccessCount");

        for(int j=0 ;j < sortList.size() ; j++){
            DBObject obj = (DBObject)sortList.get(j);
            insertRow(rownum);

            for(int i=0;i<heads.size();i++){
                fileId = heads.get(i).getFieldId();

                Object temp = null;
                temp = obj.get(fileId);
                if(temp!=null &&
                        (fileId.equals("DealingCount") ||
                                fileId.equals("NotDealCount") ||
                                fileId.equals("LeakCount") ||
                                fileId.equals("QueueLeakCount") ||
                                fileId.equals("BlackListCount") ||
                                fileId.equals("VoicemailCount") ||
                                fileId.equals("AccessCount"))){
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
            }

            endRow();
            rownum++;
        }
        //生成合计
        if(sortList.size()>0){
            insertRow(rownum);
            for (int j = 0, jLen = heads.size(); j < jLen; j++) {
                fileId = heads.get(j).getFieldId();

                if(fileId.equals("Province")){
                    createCell(j, "\u5408\u8ba1");
                }else{
                    createCell(j, totals.get(fileId));
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
