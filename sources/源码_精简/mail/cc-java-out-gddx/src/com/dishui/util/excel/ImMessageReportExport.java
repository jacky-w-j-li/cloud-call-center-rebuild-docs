package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by yaxi on 15-11-18.
 */
public class ImMessageReportExport extends XssfWriter {

    private String account;
    private static final String TABLE = "cc_im_message_report";
    private static final String REPORT_TYPE = "im_report_message";
    private static Map<String, String> platformMap = new HashMap<String, String>();
    static{
        platformMap.put("pc", "网站咨询");
        platformMap.put("sdk", "App咨询");
        platformMap.put("weixin", "微信咨询");
        platformMap.put("wap", "wap站咨询");
    }

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");

        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        List<ExportModelVo> heads = headMapper.get("Custom");
//        List<ExportModelVo> allHeads = headMapper.get("All");

        int rownum = 1;
        beginSheet();
        DBObject key = new BasicDBObject();
        key.put("platform", true);

        DBObject condition = new BasicDBObject();
        condition.put("account",account);
        ReportUtil.getReportTimeLower(query, condition);

        DBObject inital = new BasicDBObject();
        inital.put("sessionCount", 0);
        inital.put("visitorCount", 0);
        inital.put("messageCount", 0);
        inital.put("finishSessionCount", 0);
        inital.put("robotMessageCount", 0);
        inital.put("robotVisitorCount", 0);
        inital.put("robotSessionCount", 0);
        inital.put("sessionTotalTimeLength", 0);
        inital.put("firstResponseTotalTimeLength", 0);
        inital.put("responseTotalCount", 0);
        inital.put("sessionRate", 0);

        StringBuilder aggregation = new StringBuilder();
        aggregation.append("function( curr, result ){")
                .append("result.sessionCount += curr.sessionCount || 0;")
                .append("result.visitorCount += curr.visitorCount || 0;")
                .append("result.finishSessionCount += curr.finishSessionCount || 0;")
                .append("result.messageCount += curr.messageCount || 0;")
                .append("result.robotMessageCount += curr.robotMessageCount || 0;")
                .append("result.robotVisitorCount += curr.robotVisitorCount || 0;")
                .append("result.robotSessionCount += curr.robotSessionCount || 0;")
                .append("result.sessionTotalTimeLength += curr.sessionTotalTimeLength || 0;")
                .append("result.firstResponseTotalTimeLength += curr.firstResponseTotalTimeLength || 0;")
                .append("result.responseTotalCount += curr.responseCount || 0;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")
                .append("if(result.sessionCount > 0 ){")
                .append("result.sessionRate =  Math.round((result.responseTotalCount / result.sessionCount) * 100);")
                .append("}else{")
                .append("result.sessionRate = 0;")
                .append("}")

                .append("if(result.finishSessionCount > 0 ){")
                .append("result.averageSessionTimeLength = Math.round(result.sessionTotalTimeLength / result.finishSessionCount);")
                .append("}else{")
                .append("result.averageSessionTimeLength = 0;")
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
        totalMap.put("sessionTotalTimeLength", 0);
        totalMap.put("firstResponseTotalTimeLength", 0);
        totalMap.put("responseTotalCount", 0);
        totalMap.put("finishSessionCount", 0);
        totalMap.put("sessionCount", 0);
        totalMap.put("visitorCount", 0);
        totalMap.put("messageCount", 0);
        totalMap.put("robotMessageCount", 0);
        totalMap.put("robotSessionCount", 0);
        totalMap.put("robotVisitorCount", 0);
        totalMap.put("sessionTotalTimeLength", 0);
        totalMap.put("firstResponseTotalTimeLength", 0);
        for(int i = 0; i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                if(fieldId.equals("platform")){
                    temp = platformMap.get(dbObject.get(fieldId));
                }else{
                    temp = dbObject.get(fieldId);
                }

                if(temp!=null && (fieldId.equals("averageSessionTimeLength") ||
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
                    if(fieldId.equals("averageSessionTimeLength")){
                        totalMap.put("sessionTotalTimeLength", totalMap.get("sessionTotalTimeLength") + Float.valueOf(dbObject.get("sessionTotalTimeLength").toString()).intValue());
                        totalMap.put("finishSessionCount", totalMap.get("finishSessionCount") + Float.valueOf(dbObject.get("finishSessionCount").toString()).intValue());
                    }else if(fieldId.equals("averageFirstResponseTimeLength")){
                        totalMap.put("firstResponseTotalTimeLength", totalMap.get("firstResponseTotalTimeLength") + Float.valueOf(dbObject.get("firstResponseTotalTimeLength").toString()).intValue());
                        totalMap.put("responseTotalCount", totalMap.get("responseTotalCount") + Float.valueOf(dbObject.get("responseTotalCount").toString()).intValue());
                    }

                }else if(temp!=null && fieldId.equals("sessionRate")){
                    createCell(j, dbObject.get(fieldId).toString() + "%");
                }else{
                    if(!fieldId.equals("platform")){
                        int num = Double.valueOf(temp.toString()).intValue();
                        createCell(j, temp==null?0 : num);
                        totalMap.put(fieldId, totalMap.get(fieldId) + Float.valueOf(dbObject.get(fieldId).toString()).intValue());
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
            int sessionCount = totalMap.get("sessionCount");
            int responseTotalCount = totalMap.get("responseTotalCount");
            int finishSessionCount = totalMap.get("finishSessionCount");
            int sessionTotalTimeLength = totalMap.get("sessionTotalTimeLength");
            int firstResponseTotalTimeLength = totalMap.get("firstResponseTotalTimeLength");
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                if(fieldId.equals("platform")){
                    createCell(j, "\u5408\u8ba1");
                }else if(fieldId.equals("averageSessionTimeLength")){
                    if(finishSessionCount > 0){
                        int averageSessionTimeLength = Math.round(sessionTotalTimeLength / finishSessionCount );
                        createCell(j,ReportUtil.formatTime(averageSessionTimeLength));
                    }else{
                        createCell(j,ReportUtil.formatTime(0));
                    }

                }else if(fieldId.equals("averageFirstResponseTimeLength")){
                    if(responseTotalCount > 0){
                        int averageFirstResponseTimeLength = Math.round(firstResponseTotalTimeLength / responseTotalCount);
                        createCell(j,ReportUtil.formatTime(averageFirstResponseTimeLength));
                    }else{
                        createCell(j,ReportUtil.formatTime(0));
                    }

                }else if(fieldId.equals("sessionRate")){
                    if(sessionCount > 0){
                        double sessionRate = Math.round(((double)responseTotalCount / sessionCount ) * 100);
                        createCell(j, Double.valueOf(sessionRate) + "%");
                    }else{
                        createCell(j,"0%");
                    }

                }else{
                    createCell(j, Double.valueOf(totalMap.get(fieldId)).toString());
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
