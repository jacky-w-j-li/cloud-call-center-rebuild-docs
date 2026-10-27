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


public class CustomerCommonReportExport extends XssfWriter {
    private static final String REPORT_TABLE = "cc_customer_common_report";
    @Override
    public void generate(Map<String, Object> query) throws Exception {
        NumberFormat currency = NumberFormat.getCurrencyInstance();
        String account = (String) query.get("accountId");

        Map<String, String> categoryMap=setCategoryDic(account);

        List<ExportModelVo> heads = getHeaders();
        DBObject condition = getTimeConditon(query);
        condition.put("account", account);
        int rownum = 1;
        beginSheet();
        generateHeader(heads);

        DBObject key = new BasicDBObject("categoryId",1);

        DBObject initial = new BasicDBObject();
        initial.put("add",0);
        initial.put("assign",0);
        initial.put("surplus",0);
        StringBuffer aggregation = new StringBuffer();
        aggregation.append("function( curr, result ){")
                .append("result.add += curr.add || 0;")
                .append("result.assign += curr.assign || 0;")
                .append("result.surplus += curr.surplus || 0;")
                .append("}");

        StringBuffer finalize = new StringBuffer();

        BasicDBList list = MongoProvider.groupFromReportDb(REPORT_TABLE, key,condition,initial,aggregation.toString(),finalize.toString());
        if(list == null) list = new BasicDBList();
        for(int i=0;i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            String uid=(String)dbObject.get("categoryId");
            String desc="";
            if(uid==null ||"NA".equals(uid)){
                desc="无归属";
            }else{
                desc=categoryMap.get(uid);
            }
            createCell(0,desc);
            double add = 0;
            double assign = 0;
            double surplus = 0;
            for(int m = 0 ; m < heads.size();m++){
                Object temp= dbObject.get(heads.get(m).getFieldId());
                if(temp!=null && heads.get(m).getFieldId().equals("add")){
                    System.out.println("sasdfasdfasdf================="+String.valueOf(temp));
                    add = Double.parseDouble(String.valueOf(temp));
                    createCell(m+1,add);
                }else if(temp!=null && heads.get(m).getFieldId().equals("assign")){
                    assign = Double.parseDouble(String.valueOf(temp));
                    createCell(m+1,assign);
                }else if(temp!=null && heads.get(m).getFieldId().equals("surplus")){
                    surplus = Double.parseDouble(String.valueOf(temp));
                    if(surplus<0) {
                        createCell(m+1,0);
                    }else{
                        createCell(m+1,surplus);
                    }
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
        createCell(0,"公海");
        for (int i = 0; i < list.size(); i++) {
            createCell(i+1,list.get(i).getFieldName());
        }
        endRow();
    }
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("add");
        field1.setFieldName("新录入");
        field1.setDicName("add");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("assign");
        field2.setFieldName("分配/领取");
        field2.setDicName("assign");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("surplus");
        field3.setFieldName("剩余");
        field3.setDicName("surplus");
        list.add(field3);

        return list;
    }
    private Map<String,String> setCategoryDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        List<DBObject> list= MongoProvider.find("app_customer_pool", where,new BasicDBObject("cName","1"));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("cName").toString());
        }
        return map;
    }

    private DBObject getTimeConditon(Map<String, Object> query) {
        DBObject condition = new BasicDBObject();
        if(query.get("categoryId")!=null){
            condition.put("categoryId",query.get("categoryId"));
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
