package com.dishui.util.excel;

import java.net.URLDecoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.report.ReportUtil;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class ReportQueueExport extends XssfWriter {


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        // TODO Auto-generated method stub
        String accountId = query.get("accountId").toString();
        //锟斤拷取锟斤拷锟斤拷锟斤拷员缺锟斤拷锟侥憋拷头
        //List<ExportModelVo> heads=ReportUtil.getHeaders("call_report_queue",accountId);
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                "call_report_queue", accountId);
        List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");
        //锟斤拷锟接憋拷锟绞?
        int rownum = 1;
        beginSheet();

        DBObject key = new BasicDBObject();
        key.put("QueueID", true);

        DBObject condition = new BasicDBObject();
        condition.put("AccountID",accountId);
        ReportUtil.getReportTime(query, condition);
        //锟斤拷锟窖★拷锟斤拷思锟斤拷锟斤拷锟斤拷锟斤拷锟?
        if(query.containsKey("selectedQueueList") && !query.get("selectedQueueList").toString().equals("")){
            String queues = query.get("selectedQueueList").toString();
            String[] queuesArray = queues.split(",");
            System.out.println(queuesArray);
            condition.put("QueueID",new BasicDBObject("$in",Arrays.asList(queuesArray)));
        }
        //锟斤拷询锟剿伙拷锟斤拷锟斤拷锟叫硷拷锟斤拷锟斤拷
        DBObject whereQueue = new BasicDBObject();
        whereQueue.put("Account", accountId);
        DBCursor queueCursor = MongoConnect.getInstance().getDB().getCollection("manager_ivr_skillgroup").find(whereQueue);
        Map<String,String> queueNameMap = new HashMap<String,String>();
        while (queueCursor.hasNext()) {
            DBObject obj = queueCursor.next();
            queueNameMap.put(obj.get("_id").toString(), obj.get("DisplayName").toString());
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
                .append("result.AcceptAverageQueueTimeLength = result.AcceptSumQueueTimeLength/result.AcceptCount;")
                .append("if(result.AccessCount-result.AcceptCount === 0){")
                .append("result.AbandonAverageQueueTimeLength = 0;")
                .append("}else{")
                .append("result.AbandonAverageQueueTimeLength = result.AbandonSumQueueTimeLength/(result.AccessCount-result.AcceptCount);")
                .append("}")
                .append("result.AcceptAverageCallInTimeLength = result.AcceptSumCallInTimeLength/result.AcceptCount;")
                .append("result.ServiceLevel = Math.round(result.AcceptIn20Count/result.AccessCount*10)/10;")
                .append("if( result.AccessCount-result.AbandonIn6SumQueueLeak === 0){")
                .append("result.AcceptRateNotIn6Leak = '0%';")
                .append("}else{")
                .append("result.AcceptRateNotIn6Leak = Math.round(result.AcceptCount/(result.AccessCount-result.AbandonIn6SumQueueLeak)*100) +'%';")
                .append("}")
                .append("}");

//        BasicDBList list = MongoProvider.group("app_report_queue_hour", key, condition, inital, reduce.toString(), finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb("cdr_report_queue_hour", key, condition, inital, reduce.toString(), finalize.toString());

        DBObject oneRow = null;
        String queueName = null;
        for (int i=0 ; i<list.size();i++){
            oneRow = (DBObject)list.get(i);
            queueName = queueNameMap.get(oneRow.get("QueueID").toString());
            oneRow.put("queue_name",queueName==null?"":queueName);
        }
        //sort list
        List<Object> sortList = ReportUtil.sortListByChinese(list,"queue_name");

        genrateHeader(heads);


        //锟斤拷杀锟斤拷
        String fileId = null;
        Map<String, Integer> totals = new HashMap<String, Integer>();
        List<String> sumList = new ArrayList<String>();
        List<String> maxList = new ArrayList<String>();
        List<String> minList = new ArrayList<String>();
        sumList.add("AccessCount");
        sumList.add("AcceptCount");
        sumList.add("AcceptIn20Count");
        sumList.add("AbandonIn6SumQueueLeak");
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
                temp = obj.get(fileId);
                if(temp!=null &&
                        (fileId.equals("AcceptAverageQueueTimeLength") ||
                                fileId.equals("AcceptMaxQueueTimeLength") ||
                                fileId.equals("AcceptMinQueueTimeLength") ||
                                fileId.equals("AbandonAverageQueueTimeLength") ||
                                fileId.equals("AbandonMaxQueueTimeLength") ||
                                fileId.equals("AbandonMinQueueTimeLength") ||
                                fileId.equals("AcceptAverageCallInTimeLength") ||
                                fileId.equals("AcceptAverageCallInTimeLength"))
                        ){
                    int tempInt = Float.valueOf(obj.get(fileId).toString()).intValue();
                    createCell(i,ReportUtil.formatTime(tempInt));
                }else if(temp!=null &&
                        (fileId.equals("AccessCount") ||
                                fileId.equals("AcceptCount") ||
                                fileId.equals("AcceptIn20Count") ||
                                fileId.equals("AbandonIn6SumQueueLeak"))){
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

            //锟斤拷头锟斤拷没锟叫碉拷锟斤拷锟斤拷
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
        //锟斤拷锟斤拷霞疲锟斤拷锟斤拷锟斤拷锟?
        if(sortList.size()>0){
            insertRow(rownum);
            for (int j = 0, jLen = heads.size(); j < jLen; j++) {
                fileId = heads.get(j).getFieldId();
                if(fileId.equals("queue_name")){
                    createCell(j, "\u5408\u8ba1");
                }else if(fileId.equals("AcceptRate")){
                    double a = totals.get("AcceptCount");
                    double b = totals.get("AccessCount");
                    createCell(j, Math.round(a/b*100) + "%");
                }else if(fileId.equals("ServiceLevel")){
                    double a = totals.get("AcceptIn20Count");
                    double b = totals.get("AccessCount");
                    createCell(j, Math.round(a/b*10)/10.0);
                }else if(fileId.equals("AcceptRateNotIn6Leak")){
                    if(totals.get("AccessCount")-totals.get("AbandonIn6SumQueueLeak") == 0){
                        createCell(j, "0%");
                    }else{
                        double a = totals.get("AcceptCount");
                        double b = totals.get("AccessCount");
                        double c = totals.get("AbandonIn6SumQueueLeak");
                        createCell(j, Math.round(a/(b-c)*100) + "%");
                    }
                }else if(fileId.equals("AcceptAverageQueueTimeLength")){//锟斤拷通平锟斤拷锟脚讹拷时锟斤拷AcceptAverageQueueTimeLength
                    if(totals.get("AcceptCount") != 0){
                        createCell(j, ReportUtil.formatTime(totals.get("AcceptSumQueueTimeLength")/totals.get("AcceptCount")));
                    }else{
                        createCell(j, ReportUtil.formatTime(0));
                    }
                }else if(fileId.equals("AbandonAverageQueueTimeLength")){//锟斤拷锟斤拷平锟斤拷锟脚讹拷时锟斤拷
                    if((totals.get("AccessCount") - totals.get("AcceptCount")) == 0){
                        createCell(j, ReportUtil.formatTime(0));
                    }else{
                        createCell(j, ReportUtil.formatTime(totals.get("AbandonSumQueueTimeLength")/(totals.get("AccessCount")-totals.get("AcceptCount"))));
                    }
                }else if(fileId.equals("AcceptAverageCallInTimeLength")){//平锟斤拷通锟斤拷时锟斤拷
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
        //锟斤拷锟接憋拷锟斤拷锟斤拷
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
