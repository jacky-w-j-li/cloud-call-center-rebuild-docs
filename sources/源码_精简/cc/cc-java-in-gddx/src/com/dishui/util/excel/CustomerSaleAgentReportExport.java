package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.math.BigDecimal;
import java.text.NumberFormat;


import java.util.*;


public class CustomerSaleAgentReportExport extends XssfWriter {
    private static final String REPORT_TABLE = "cc_customer_sales_report";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        NumberFormat currency = NumberFormat.getCurrencyInstance();
        String account = (String) query.get("accountId");

        Map<String, String> userMap=setUserDic(account);

        List<ExportModelVo> heads = getHeaders();
        DBObject condition = getTimeConditon(query);
        condition.put("account", account);
        int rownum = 1;
        beginSheet();
        generateHeader(heads);

        DBObject key = new BasicDBObject("user",1);

        DBObject initial = new BasicDBObject();
        initial.put("total",0);
        initial.put("deal",0);
        initial.put("lost",0);
        initial.put("invalid",0);
        initial.put("money",0);
        initial.put("recycle",0);

        StringBuffer aggregation = new StringBuffer();
        aggregation.append("function( curr, result ){")
                .append("result.total += curr.total || 0;")
                .append("result.deal += curr.deal || 0;")
                .append("result.lost += curr.lost || 0;")
                .append("result.invalid += curr.invalid || 0;")
                .append("result.money += curr.money || 0;")
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
            String total = "0";
            String deal = "0";
            String invalid = "0";
            String lost = "0";
            BigDecimal money = null;
            for(int m = 0 ; m < heads.size();m++){
                Object temp= dbObject.get(heads.get(m).getFieldId());
                if(temp!=null && heads.get(m).getFieldId().equals("total")){
                    total = String.valueOf(temp);
                    createCell(m+1,total);
                }else if(temp!=null && heads.get(m).getFieldId().equals("deal")){
                    deal = String.valueOf(temp);
                    createCell(m+1,deal);
                }else if(temp!=null && heads.get(m).getFieldId().equals("invalid")){
                    invalid = String.valueOf(temp);
                    createCell(m+1,invalid);
                }else if(temp!=null && heads.get(m).getFieldId().equals("lost")){
                    lost = String.valueOf(temp);
                    createCell(m+1,lost);
                }else if(temp!=null&&heads.get(m).getFieldId().equals("money")){
                    BigDecimal bigDecimal = new BigDecimal(String.valueOf(temp));
                    money = bigDecimal.divide(new BigDecimal(10000));
                    createCell(m+1,currency.format(money));
                }else if(heads.get(m).getFieldId().equals("dealRate")){
                    double num1 = Double.parseDouble(deal);
                    double num2 = Double.parseDouble(total);
                    double num3 = Double.parseDouble(invalid);
                    double num4 = Double.parseDouble(lost);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            num2 = num2+num3+num4;
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
                    }
                }else if(heads.get(m).getFieldId().equals("lostRate")){
                    double num1 = Double.parseDouble(lost);
                    double num2 = Double.parseDouble(total);
                    double num3 = Double.parseDouble(invalid);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            num2 = num2+ num1+num3;
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
                    }
                }else if(heads.get(m).getFieldId().equals("invalidRate")){
                    double num1 = Double.parseDouble(invalid);
                    double num2 = Double.parseDouble(total);
                    double num3 = Double.parseDouble(lost);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            num2 = num2+ num1+num3;
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
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
        createCell(0,"座席");
        for (int i = 0; i < list.size(); i++) {
            createCell(i+1,list.get(i).getFieldName());
        }
        endRow();
    }
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("total");
        field1.setFieldName("商机数");
        field1.setDicName("total");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("deal");
        field2.setFieldName("成单数");
        field2.setDicName("deal");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("lost");
        field3.setFieldName("丢单数");
        field3.setDicName("lost");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("invalid");
        field4.setFieldName("无效数");
        field4.setDicName("invalid");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("recycle");
        field5.setFieldName("回收数");
        field5.setDicName("recycle");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("money");
        field6.setFieldName("回款金额");
        field6.setDicName("money");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("dealRate");
        field7.setFieldName("成单率");
        field7.setDicName("dealRate");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("lostRate");
        field8.setFieldName("丢单率");
        field8.setDicName("lostRate");
        list.add(field8);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("invalidRate");
        field9.setFieldName("无效率");
        field9.setDicName("invalidRate");
        list.add(field9);

        return list;
    }
    private Map<String,String> setUserDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        where.put("product", "cc");
        List<DBObject> list= MongoProvider.find("bill", "platform_user", where);
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
