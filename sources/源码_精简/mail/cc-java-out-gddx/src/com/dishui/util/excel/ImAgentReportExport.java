package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.log.SystemOutHandler;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by yaxi on 15-11-18.
 */
public class ImAgentReportExport extends XssfWriter {
    private String account;
    private static final String TABLE = "cc_im_agent_report";
    private static final String REPORT_TYPE = "im_report_agent";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");

        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        List<ExportModelVo> heads = headMapper.get("Custom");
//        List<ExportModelVo> allHeads = headMapper.get("All");

        //查询账户下所有坐席
        DBObject whereAgent = new BasicDBObject();
        whereAgent.put("account", account);
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
        System.out.println(agentNameMap.toString());

        int rownum = 1;
        beginSheet();
        DBObject key = new BasicDBObject();
        key.put("agentId", true);

        DBObject condition = new BasicDBObject();
        condition.put("account",account);
        if(query.containsKey("agentId") && !"".equals(query.get("agentId"))){
            condition.put("agentId", query.get("agentId"));
        }

        ReportUtil.getReportTimeLower(query, condition);

        DBObject inital = new BasicDBObject();
        inital.put("replyCount", 0);
        inital.put("sessionAccessCount", 0);
        inital.put("sessionCompleteCount", 0);
        inital.put("sessionRollOutCount", 0);
        inital.put("sessionRollInCount", 0);
        inital.put("sessionTotalTimeLength", 0);
        inital.put("firstResponseTotalTimeLength", 0);
        inital.put("responseTotalCount", 0);

        StringBuilder aggregation = new StringBuilder();
        aggregation.append("function( curr, result ){")
                .append("result.replyCount += curr.replyCount || 0;")
                .append("result.sessionAccessCount += curr.accessSessionCount || 0;")
                .append("result.messageCount += curr.messageCount || 0;")
                .append("result.sessionCompleteCount += curr.sessionCompleteCount || 0;")
                .append("result.sessionRollOutCount += curr.sessionRollOutCount || 0;")
                .append("result.sessionRollInCount += curr.sessionRollInCount || 0;")
                .append("result.sessionTotalTimeLength += curr.sessionToTalTimeLength || 0;")
                .append("result.firstResponseTotalTimeLength += curr.firstResponseTotalTimeLength || 0;")
                .append("result.responseTotalCount += curr.responseCount || 0;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")

                .append("if(result.sessionAccessCount + result.sessionRollInCount > 0 ){")
                .append("result.sessionCompleteRate =  Math.round(((result.sessionCompleteCount+ result.sessionRollOutCount) / (result.sessionAccessCount + result.sessionRollInCount)) * 100);")
                .append("}else{")
                .append("result.sessionCompleteRate = 0;")
                .append("}")

                .append("if(result.sessionCompleteCount+ result.sessionRollOutCount > 0 ){")
                .append("result.sessionAverageTimeLength = Math.round(result.sessionTotalTimeLength / (result.sessionCompleteCount+ result.sessionRollOutCount));")
                .append("}else{")
                .append("result.sessionAverageTimeLength = 0;")
                .append("}")

                .append("if(result.responseTotalCount > 0 ){")
                .append("result.averageFirstResponseTimeLength = Math.round(result.firstResponseTotalTimeLength / result.responseTotalCount);")
                .append("}else{")
                .append("result.averageFirstResponseTimeLength = 0;")
                .append("}")

                .append("};");
        BasicDBList list = MongoProvider.groupFromReportDb(TABLE, key, condition, inital, aggregation.toString(), finalize.toString());

        generateHeader(heads);
        if(list == null){
            list = new BasicDBList();
        }
        Map<String, Integer> totalMap = new HashMap<String, Integer>();
        totalMap.put("replyCount", 0);
        totalMap.put("sessionAccessCount", 0);
        totalMap.put("sessionCompleteCount", 0);
        totalMap.put("sessionRollOutCount", 0);
        totalMap.put("sessionRollInCount", 0);
        totalMap.put("sessionTotalTimeLength", 0);
        totalMap.put("sessionCompleteRate", 0);
        totalMap.put("firstResponseTotalTimeLength", 0);
        totalMap.put("responseTotalCount", 0);

        for(int i = 0; i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                if(fieldId.equals("agentName")){
                    temp = agentNameMap.get(dbObject.get("agentId")) +"["+ agentEmpnoMap.get(dbObject.get("agentId"))+"]";
                }else{
                    temp = dbObject.get(fieldId);
                }

                if(temp!=null && (fieldId.equals("sessionAverageTimeLength") ||
                        fieldId.equals("averageFirstResponseTimeLength"))){
                    String tempStr = temp.toString();
                    int second = 0;
                    if(tempStr.contains(".")){
                        second = Integer.parseInt(tempStr.substring(0,tempStr.indexOf(".")));
                    }else{
                        if(!tempStr.equalsIgnoreCase("NaN")){
                            second = Integer.valueOf(tempStr);
                        }
                    }
                    createCell(j, ReportUtil.formatTime(second));
//                    totalMap.put("sessionTotalTimeLength", totalMap.get("sessionTotalTimeLength") + Float.valueOf(dbObject.get("sessionTotalTimeLength").toString()).intValue());
                    if(fieldId.equals("sessionAverageTimeLength")){
                        totalMap.put("sessionTotalTimeLength", totalMap.get("sessionTotalTimeLength") + Float.valueOf(dbObject.get("sessionTotalTimeLength").toString()).intValue());
                    }else if(fieldId.equals("averageFirstResponseTimeLength")){
                        totalMap.put("firstResponseTotalTimeLength", totalMap.get("firstResponseTotalTimeLength") + Float.valueOf(dbObject.get("firstResponseTotalTimeLength").toString()).intValue());
                        totalMap.put("responseTotalCount", totalMap.get("responseTotalCount") + Float.valueOf(dbObject.get("responseTotalCount").toString()).intValue());
                    }
                }else if(temp!=null && fieldId.equals("sessionCompleteRate")){
                    createCell(j, dbObject.get(fieldId).toString() + "%");
                }else{
                    System.out.println(fieldId);
                    if(!fieldId.equals("agentName")){
                        createCell(j, temp==null?0 : Double.valueOf(temp.toString()).intValue());
                        totalMap.put(fieldId, totalMap.get(fieldId) +(temp==null?0 : Double.valueOf(temp.toString()).intValue()));
                    }else{
                        createCell(j, temp==null?"" : temp.toString());
                    }
                }
            }
            endRow();
            rownum++;
        }

        if(list.size() > 0){
            insertRow(rownum);
            System.out.println(totalMap.toString());
            int sessionAccessCount = totalMap.get("sessionAccessCount");
            int sessionCompleteCount = totalMap.get("sessionCompleteCount");
            int sessionRollOutCount = totalMap.get("sessionRollOutCount");
            int sessionRollInCount = totalMap.get("sessionRollInCount");
            int sessionTotalTimeLength = totalMap.get("sessionTotalTimeLength");
            int firstResponseTotalTimeLength = totalMap.get("firstResponseTotalTimeLength");
            int responseTotalCount = totalMap.get("responseTotalCount");
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                if(fieldId.equals("agentName")){
                    createCell(j, "\u5408\u8ba1");
                }else if(fieldId.equals("sessionAverageTimeLength")){
                    int averageSessionTimeLength = 0;
                    if(sessionCompleteCount + sessionRollOutCount > 0){
                        averageSessionTimeLength = Math.round(sessionTotalTimeLength / (sessionCompleteCount + sessionRollOutCount));
                    }
                    createCell(j,ReportUtil.formatTime(averageSessionTimeLength));
                }else if(fieldId.equals("averageFirstResponseTimeLength")){
                    if(responseTotalCount > 0){
                        int averageFirstResponseTimeLength = Math.round(firstResponseTotalTimeLength / responseTotalCount);
                        createCell(j,ReportUtil.formatTime(averageFirstResponseTimeLength));
                    }else{
                        createCell(j,ReportUtil.formatTime(0));
                    }

                }else if(fieldId.equals("sessionCompleteRate")){
                    double sessionCompleteRate = 0;
                    if(sessionAccessCount + sessionRollInCount > 0){
                        sessionCompleteRate  = Math.round(((double)(sessionCompleteCount + sessionRollOutCount)/ (sessionAccessCount + sessionRollInCount))* 100 );
                    }
                    createCell(j,sessionCompleteRate + "%");
                }else{
                    createCell(j, totalMap.get(fieldId).toString());
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
}
