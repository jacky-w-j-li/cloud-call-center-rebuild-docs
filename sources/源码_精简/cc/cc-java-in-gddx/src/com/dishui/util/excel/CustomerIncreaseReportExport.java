package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created by zhangyang on 15/11/24.
 */
public class CustomerIncreaseReportExport extends XssfWriter {
    private static final String REPORT_TYPE = "customer_report_increase";
    private static final String REPORT_TABLE = "cc_customer_increase_report";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        String timeType = (String) query.get("timeType");
        String account = (String) query.get("accountId");
//        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(REPORT_TYPE, account);
//        List<ExportModelVo> heads = headMapper.get("Custom");
        //get customer config source
        DBObject customerTepm = MongoProvider.findOne("customer_template",new BasicDBObject().append("account",account));
        List<DBObject> sources = new ArrayList<DBObject>();
        if(customerTepm != null){
            sources = (List<DBObject>) customerTepm.get("source");
        }
        DBObject condition = getTimeConditon(query);
        condition.put("account", account);
        int rownum = 1;
        beginSheet();
        generateHeader(sources);
        if (timeType.equals("month")) {
            List<DBObject> list = MongoProvider.findFromReportDb(REPORT_TABLE, condition);
            if (list.size() > 0) {
                for(int i=0 ; i< list.size();i++){
                    insertRow(rownum);
                    DBObject dataObj = list.get(i);
                    createCell(0,(String)dataObj.get("day"));
                    for(int m =0 ;m < sources.size();m++){
                        Object value = dataObj.get((String) sources.get(m).get("key"));
                        if(value!= null && (Integer)value<0){
                            value = 0;
                        }
                        createCell(m+1 , value == null ? "0" : String.valueOf(value));
                    }
                    Object unknow = dataObj.get("unknow");
                    createCell(sources.size()+1,unknow == null ? "0" : String.valueOf(unknow));
                    endRow();
                    rownum++;
                }
            }
        } else {
            DBObject group = new BasicDBObject();
            group.put("_id","$month");
            group.put("unknow",new BasicDBObject().append("$sum","$unknow"));
            for(int i= 0;i<sources.size();i++){
                group.put((String)sources.get(i).get("key"),new BasicDBObject().append("$sum","$"+(String)sources.get(i).get("key")));
            }


            DBObject sort = new BasicDBObject("$sort", new BasicDBObject("month",1));

            List<DBObject> list = MongoProvider.aggregateFromReportDb(REPORT_TABLE,new BasicDBObject("$match",condition),new BasicDBObject("$group",group),sort);
            if (list.size() > 0){
                for(int i= 0 ; i< list.size();i++){
                    insertRow(rownum);
                    DBObject dataObj = list.get(i);
                    createCell(0,(String)dataObj.get("_id"));
                    for(int m =0 ;m < sources.size();m++){
                        Object value = dataObj.get((String) sources.get(m).get("key"));
                        if(value!= null && (Integer)value<0){
                            value = 0;
                        }
                        createCell(m+1 , value == null ? "0" : String.valueOf(value));
                    }
                    Object unknow = dataObj.get("unknow");
                    createCell(sources.size()+1,unknow == null ? "0" : String.valueOf(unknow));
                    endRow();
                    rownum++;
                }
            }

        }
        endSheet();
    }

    private void generateHeader(List<DBObject> heads) throws Exception {
        insertRow(0);
        createCell(0,"时间");
        for (int i = 0; i < heads.size(); i++) {
            createCell(i+1, (String)heads.get(i).get("name"));
        }
        createCell(heads.size()+1,"未知来源");
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
