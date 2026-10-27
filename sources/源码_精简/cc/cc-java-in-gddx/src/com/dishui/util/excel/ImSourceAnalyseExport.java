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

/**
 * Created by zengyx on 16/5/19.
 * 来源分析报表
 */
public class ImSourceAnalyseExport extends XssfWriter{

    private String account;
    private String seoSourceSearch;
    private static final String TABLE = "cc_im_message_report";


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");
        seoSourceSearch=(String) query.get("seoSourceSearch");
        String reportType = (String)query.get("reportType");
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                reportType, account);
        List<ExportModelVo> heads = headMapper.get("Custom");
        int rownum = 1;
        beginSheet();
        DBObject key = new BasicDBObject();
        String keyType = reportType.split("_")[3];
        key.put(keyType, true);
        if(reportType.equals("im_report_session_seoKeywords")){
            key.put("seoSource", true);
        }

        DBObject condition = new BasicDBObject();
        
        condition.put("account",account);
        if((reportType.equals("im_report_session_seoKeywords"))&&!seoSourceSearch.equals("")&&seoSourceSearch!=null){
        	if(!seoSourceSearch.equals("全部")){
        		condition.put("seoSource",seoSourceSearch);
        	}else{
                condition.put(keyType,new BasicDBObject(QueryOperators.NE,null));
        	}
        }
        condition.put(keyType,new BasicDBObject(QueryOperators.NE,null));
        ReportUtil.getReportTimeLower(query, condition);
        boolean flag = (reportType.equals("im_report_session_fromUrl") || reportType.equals("im_report_session_seoKeywords"));


        DBObject inital = new BasicDBObject();
        
        inital.put("sessionCount", 0);
        inital.put("manualSessionCount", 0);
        inital.put("convertManualCount", 0);
        inital.put("lostSessionCount", 0);
        inital.put("robotSessionCount", 0);
        inital.put("urlTitle", "");

        StringBuilder aggregation = new StringBuilder();
        aggregation.append("function( curr, result ){")
                .append("result.manualSessionCount += curr.sessionCount || 0;")
                .append("result.convertManualCount += curr.convertManualCount || 0;")
                .append("result.lostSessionCount += curr.lostSessionCount || 0;")
                .append("result.robotSessionCount += curr.robotSessionCount || 0;")
                .append("result.urlTitle = curr.urlTitle || null;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")
                .append("result.sessionCount =  (result.manualSessionCount + result.robotSessionCount) - result.convertManualCount;")
                .append("};");
        System.out.println(condition.toString());
        System.out.println(inital.toString());
        System.out.println(aggregation.toString());
        System.out.println(finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb(TABLE, key, condition, inital, aggregation.toString(), finalize.toString());
        generateHeader(heads);
        if(list == null){
            list = new BasicDBList();
        }
        for(int i = 0; i<list.size();i++){
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            if(dbObject.get(heads.get(0).getFieldId()) == null || dbObject.get(heads.get(0).getFieldId()).toString().equals("")){
                continue;
            }
            insertRow(rownum);
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                temp = dbObject.get(fieldId);
                if("fromUrl".equals(fieldId) && dbObject.get("urlTitle")!=null){
                	temp=dbObject.get("urlTitle");
                }
                createCell(j, temp==null?"" : temp.toString());
            }
            endRow();
            rownum++;
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
