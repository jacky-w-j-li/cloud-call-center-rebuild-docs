package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class CustomerCommonAgentReportExport extends XssfWriter {
    private static final String REPORT_TABLE = "cc_customer_common_user_report";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        NumberFormat currency = NumberFormat.getCurrencyInstance();
        String account = (String) query.get("accountId");
        String categoryId = (String)query.get("categoryId");

        Map<String, String> userMap=setUserDic(account);

        List<ExportModelVo> heads = getHeaders();
        DBObject condition = getTimeConditon(query);
        condition.put("account", account);
        condition.put("categoryId",categoryId);
        int rownum = 1;
        beginSheet();
        generateHeader(heads);

        DBObject key = new BasicDBObject("user",1);

        DBObject initial = new BasicDBObject();
        initial.put("assign",0);
        initial.put("recycle",0);

        StringBuffer aggregation = new StringBuffer();
        aggregation.append("function( curr, result ){")
                .append("result.assign += curr.assign || 0;")
                .append("result.recycle += curr.recycle || 0;")
                .append("}");

        StringBuffer finalize = new StringBuffer();

        BasicDBList list = MongoProvider.groupFromReportDb(REPORT_TABLE, key,condition,initial,aggregation.toString(),finalize.toString());
        if(list == null) list = new BasicDBList();
        for(int i=0;i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            String uid=(String)dbObject.get("user");
            String desc="";
            if(uid==null ||"NA".equals(uid)){
                desc="无归属";
            }else{
                desc=userMap.get(uid);
            }
            createCell(0,desc);
            double assign = 0;
            double recycle = 0;
            for(int m = 0 ; m < heads.size();m++){
                Object temp= dbObject.get(heads.get(m).getFieldId());
                    if(temp!=null && heads.get(m).getFieldId().equals("assign")){
                        assign =Double.parseDouble(String.valueOf(temp));
                        createCell(m+1,assign);
                    }else if(temp!=null && heads.get(m).getFieldId().equals("recycle")){
                        recycle = Double.parseDouble(String.valueOf(temp));
                        createCell(m+1,recycle);
                    }else{
                        createCell(m+1, temp == null ? "0" : String.valueOf(temp));
                    }
            }
            endRow();
            rownum++;
        }
        endSheet();
    }

    private void generateHeader(List<ExportModelVo> list) throws Exception {
        insertRow(0);
        createCell(0,"座席");
        for (int i = 0; i < list.size(); i++) {
            createCell(i+1,list.get(i).getFieldName());
        }
        endRow();
    }
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("assign");
        field1.setFieldName("分配/领取");
        field1.setDicName("assign");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("recycle");
        field2.setFieldName("回收");
        field2.setDicName("recycle");
        list.add(field2);
        return list;
    }
    private Map<String,String> setUserDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        where.put("product", "cc");
        List<DBObject> list= MongoProvider.find("bill", "platform_user", where,new BasicDBObject("displayName","1"));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("displayName").toString());
        }
        return map;
    }

    private DBObject getTimeConditon(Map<String, Object> query) {
        DBObject condition = new BasicDBObject();
        if(query.get("user")!=null){
            condition.put("user",query.get("user"));
        }
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
            String queryStarTimeDay = startTime.substring(0,10).replaceAll("-","");
            String queryEndTimeDay = endTime.substring(0,10).replaceAll("-","");
            condition.put("day", new BasicDBObject().append("$gte", queryStarTimeDay).append("$lte", queryEndTimeDay));
        }
        return condition;
    }

}
