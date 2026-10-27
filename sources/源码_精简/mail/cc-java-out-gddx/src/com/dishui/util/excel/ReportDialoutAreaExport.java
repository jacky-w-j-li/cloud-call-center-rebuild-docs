package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.Arrays;
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

public class ReportDialoutAreaExport extends XssfWriter {

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        // TODO Auto-generated method stub
        String accountId = query.get("accountId").toString();
        //获取外呼地域报表的表头
        //List<ExportModelVo> heads=ReportUtil.getHeaders("call_report_queue",accountId);
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                "call_report_dialout_area", accountId);
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
        while(it.hasNext()){
        	String queryKey = (String) it.next();
        	if(queryKey.length()>10 && queryKey.substring(0, 9).equals("Province_")){
        		if(query.get(queryKey).toString().equals("true")){
        			proList.add(queryKey.substring(9));        			
        		}else{
        			proListFalse.add(queryKey.substring(9));
        		}
        	}
        }
        if(proList.size() > 0 || proListFalse.size() > 0){
        	condition.put("Province",new BasicDBObject("$in", proList));
        }

        DBObject inital = new BasicDBObject();
        inital.put("DealingCount", 0);
        inital.put("NotDealCount", 0);
        inital.put("LeakCount", 0);
        inital.put("CallTimeLength", 0);

        StringBuilder reduce = new StringBuilder();
        reduce.append("function( curr, result ){")
                .append("result.DealingCount += curr.DealingCount;")
                .append("result.NotDealCount += curr.NotDealCount;")
                .append("result.LeakCount += curr.LeakCount;")
                .append("result.CallTimeLength += curr.CallTimeLength;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")
                .append("result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount;")
                .append("if(result.AccessCount == 0){")
                .append("result.CallOutAcceptRate = 0;")
                .append("}else{")
                .append("result.CallOutAcceptRate = Math.round(result.DealingCount/result.AccessCount*100) + \"%\";")
                .append("}")
                .append("if(result.DealingCount == 0){")
                .append("result.CallOutAverageTimeLength = 0;")
                .append("}else{")
                .append("result.CallOutAverageTimeLength = Math.round(result.CallTimeLength/result.DealingCount);")
                .append("}")
                .append("}");

//        BasicDBList list = MongoProvider.group("app_report_call_out", key, condition, inital, reduce.toString(), finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb("cdr_report_call_out", key, condition, inital, reduce.toString(), finalize.toString());

        //sort list
        List<Object> sortList = ReportUtil.sortListByChinese(list,"Province");

        genrateHeader(heads);

        //生成表格
        String fileId = null;
        Map<String, Integer> totals = new HashMap<String, Integer>();
        List<String> sumList = new ArrayList<String>();
        sumList.add("AccessCount");
        sumList.add("DealingCount");
        sumList.add("LeakCount");
        sumList.add("NotDealCount");
        sumList.add("CallTimeLength");

        for(int j=0 ;j < sortList.size() ; j++){
            DBObject obj = (DBObject)sortList.get(j);
            insertRow(rownum);

            for(int i=0;i<heads.size();i++){
                fileId = heads.get(i).getFieldId();

                Object temp = null;
                temp = obj.get(fileId);
                if(temp!=null &&
                        (fileId.equals("CallTimeLength") ||
                         fileId.equals("CallOutAverageTimeLength"))
                        ){
                    int tempInt = Float.valueOf(obj.get(fileId).toString()).intValue();
                    createCell(i,ReportUtil.formatTime(tempInt));
                }else if(temp!=null &&
                        (fileId.equals("AccessCount") ||
                                fileId.equals("DealingCount") ||
                                fileId.equals("LeakCount") ||
                                fileId.equals("NotDealCount"))){
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
                }else if(fileId.equals("CallOutAcceptRate")){
                    double a = totals.get("DealingCount");
                    double b = totals.get("AccessCount");
                    createCell(j, Math.round(a/b*100) + "%");
                }else if(fileId.equals("CallOutAverageTimeLength")){
                    if(totals.get("DealingCount") != 0){
                        createCell(j, ReportUtil.formatTime(totals.get("CallTimeLength")/totals.get("DealingCount")));
                    }else{
                        createCell(j, ReportUtil.formatTime(0));
                    }
                }else if(fileId.equals("CallTimeLength")){
                    createCell(j, ReportUtil.formatTime(totals.get(fileId)));
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
