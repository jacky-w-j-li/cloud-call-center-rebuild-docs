package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Created by zhangyang on 15/11/24.
 */
public class BusinessAgentReportExport extends XssfWriter{
    private static final String REPORT_TYPE = "business_report_agent";
    private static final String REPORT_TABLE = "cc_business_agent_report";
    @Override
    public void generate(Map<String, Object> query) throws Exception {
        String account = (String) query.get("accountId");
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(REPORT_TYPE, account);
        List<ExportModelVo> heads = headMapper.get("Custom");

        List<DBObject> systemAgents = MongoProvider.find("bill","platform_user",new BasicDBObject("account",account));

        DBObject condition = getTimeConditon(query);
        Object obj=query.get("agent");
        condition.put("account", account);
        if(obj!=null){
            condition.put("agent",query.get("agent"));
        }
//        String agents = (String)query.get("selectedAgentList");
//        if(!"".equals(agents)){
//            String [] agentArray = agents.split(",");
//            List<String> agentList = Arrays.asList(agentArray);
//            condition.put("agent",new BasicDBObject("$in",agentList));
//        }
        int rownum = 1;
        beginSheet();
        generateHeader(heads);

        DBObject key = new BasicDBObject("agent",1);

        DBObject initial = new BasicDBObject();
        initial.put("create",0);
        initial.put("pick",0);
        initial.put("process",0);
        initial.put("processTimeCount",0);
        initial.put("assign",0);

        StringBuffer aggregation = new StringBuffer();
        aggregation.append("function( curr, result ){")
                .append("result.create += curr.create || 0;")
                .append("result.pick += curr.pick || 0;")
                .append("result.process += curr.process || 0;")
                .append("result.processTimeCount += curr.processTimeCount || 0;")
                .append("result.assign += curr.assign || 0;")
                .append("}");

        StringBuffer finalize = new StringBuffer();
        finalize.append("function(result){")
                .append("if(result.process > 0 ){")
                .append("result.processTimeAvg = Math.round(result.processTimeCount / result.process) ;")
                .append("}else{result.processTimeAvg = 0;}}");

        BasicDBList list = MongoProvider.groupFromReportDb(REPORT_TABLE, key, condition, initial, aggregation.toString(), finalize.toString());
        if(list == null) list = new BasicDBList();
        for(int i=0;i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            for(int m =0 ; m < heads.size();m++){
                String fieldId = heads.get(m).getFieldId();
                if(fieldId.equals("agent")){
                    createCell(m , getAgentName((String) dbObject.get(fieldId), systemAgents));
                }else if(fieldId.equals("processTimeAvg")){
                    createCell(m, ReportUtil.formatTime(dbObject.getInt(fieldId)));
                } else {
                    createCell(m , String.valueOf(dbObject.get(fieldId) == null? 0 : dbObject.get(fieldId)));
                }
            }
            endRow();
            rownum++;
        }

    }

    private String getAgentName(String flowId , List<DBObject> agents){
        for(int i=0 ;i< agents.size();i++){
            if(flowId.equals(agents.get(i).get("_id"))){
                return (String)agents.get(i).get("displayName");
            }
        }
        return flowId;

    }

    private void generateHeader(List<ExportModelVo> heads) throws  Exception{
        insertRow(0);
        for(int i=0;i<heads.size();i++){
            createCell(i,heads.get(i).getFieldName());
        }
        endRow();
    }


    private DBObject getTimeConditon(Map<String, Object> query) {
        DBObject condition = new BasicDBObject();
        if (query.get("timeType").equals("day")) {
            String year = (String) query.get("yearReport");
            String month = (String) query.get("monthReport");
            String day = (String) query.get("dayReport");
            condition.put("day", year + "" + month + "" + day);
        } else if (query.get("timeType").equals("month")) {
            String year = (String) query.get("yearReport");
            String month = (String) query.get("monthReport");
            condition.put("month", year + "" + month);
        } else if (query.get("timeType").equals("year")) {
            String year = (String) query.get("yearReport");
            condition.put("year", year + "");
        } else if (query.get("timeType").equals("other")) {
            String startTime = (String) query.get("StartTime");
            String endTime = (String) query.get("EndTime");
            condition.put("day", new BasicDBObject().append("$gte", startTime).append("$lte", endTime));
        }
        return condition;
    }
}
