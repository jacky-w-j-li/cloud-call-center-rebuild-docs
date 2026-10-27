package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.QueryOperators;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * Created by yaxi on 15-11-18.
 */
public class ImMessageReportExport extends XssfWriter {

    private String account;
    private static final String TABLE = "cc_im_message_report";
    private static final String REPORT_TYPE = "im_report_message";
    private static Map<String, String> platformMap = new HashMap<String, String>();
    private static Map<String, String> accessIdMap = new HashMap<String, String>();
    static{
        platformMap.put("pc", "网站咨询");
        platformMap.put("sdk", "App咨询");
        platformMap.put("weixin", "微信咨询");
        platformMap.put("wap", "wap站咨询");
    }

    public void getAccessIdsMap(){

        BasicDBObject condition = new BasicDBObject();
        condition.put("account", account);
        List<DBObject> configs = MongoProvider.find("app_kefu_im_config", condition);
        List<DBObject> weixinConfigs = MongoProvider.find("weixin","wxaccount", condition);
        if(configs != null){
            for(int i=0; i<configs.size(); i++){
                accessIdMap.put(configs.get(i).get("accessId").toString(), configs.get(i).get("name").toString());
            }
        }

        if(weixinConfigs != null){
            System.out.println(weixinConfigs);
            for(int i=0; i<weixinConfigs.size(); i++){
                accessIdMap.put(weixinConfigs.get(i).get("_id").toString(), weixinConfigs.get(i).get("nick_name").toString());
            }
        }

    }

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");

        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        getAccessIdsMap();

        List<ExportModelVo> heads = headMapper.get("Custom");
//        List<ExportModelVo> allHeads = headMapper.get("All");

        int rownum = 1;
        beginSheet();
        DBObject key = new BasicDBObject();
        key.put("platform", true);

        DBObject condition = new BasicDBObject();
        condition.put("account",account);
        ReportUtil.getReportTimeLower(query, condition);

        if(query.get("selectedAccessIdList") != null && !query.get("selectedAccessIdList").toString().equals("")){
            String accessIds = (String) query.get("selectedAccessIdList");
            String[] ids = accessIds.split(",");
            condition.put("accessId", new BasicDBObject(QueryOperators.IN, ids));
            key.put("accessId", true);
            key.removeField("platform");
        }
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
        // 总数字段列表
        ArrayList totalFieldList = new ArrayList();
        totalFieldList.add("responseTotalCount");
        totalFieldList.add("finishSessionCount");
        totalFieldList.add("sessionCount");
        totalFieldList.add("visitorCount");
        totalFieldList.add("messageCount");
        totalFieldList.add("robotMessageCount");
        totalFieldList.add("robotSessionCount");
        totalFieldList.add("robotVisitorCount");
        totalFieldList.add("sessionTotalTimeLength");
        totalFieldList.add("firstResponseTotalTimeLength");

        for(int t = 0; t < totalFieldList.size(); t++) {
            totalMap.put(totalFieldList.get(t).toString(), 0);
        }

        System.out.println(accessIdMap);
        for(int i = 0; i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);

            // 计算总数
            for (int t = 0; t < totalFieldList.size(); t++) {
                String totalFeild = totalFieldList.get(t).toString();
                totalMap.put(totalFeild, totalMap.get(totalFeild) + Float.valueOf(dbObject.get(totalFeild).toString()).intValue());
            }

            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                if(fieldId.equals("platform")){
                    if(key.get("accessId")!= null && (Boolean) key.get("accessId")){
                        System.out.println(dbObject.get("accessId"));
                        temp = accessIdMap.get(dbObject.get("accessId"));
                    }else{
                        temp = platformMap.get(dbObject.get(fieldId));
                    }
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
                }else if(temp!=null && fieldId.equals("sessionRate")){
                    createCell(j, dbObject.get(fieldId).toString() + "%");
                }else{
                    if(!fieldId.equals("platform")){
                        int num = Double.valueOf(temp.toString()).intValue();
                        createCell(j, temp==null?0 : num);
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
                        int averageSessionTimeLength = (int)Math.round((float)sessionTotalTimeLength / finishSessionCount );
                        createCell(j,ReportUtil.formatTime(averageSessionTimeLength));
                    }else{
                        createCell(j,ReportUtil.formatTime(0));
                    }

                }else if(fieldId.equals("averageFirstResponseTimeLength")){
                    if(responseTotalCount > 0){
                        int averageFirstResponseTimeLength = (int)Math.round((float)firstResponseTotalTimeLength / responseTotalCount);
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
