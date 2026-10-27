package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.text.NumberFormat;


public class CustomerSaleReportExport extends XssfWriter {
    private static final String REPORT_TABLE = "cc_customer_opportunity_report";
    @Override
    public void generate(Map<String, Object> query) throws Exception {
        String timeType = (String) query.get("timeType");
        String account = (String) query.get("accountId");


        List<ExportModelVo> heads = getHeaders();
        NumberFormat currency = NumberFormat.getCurrencyInstance();


        int rownum = 1;
        beginSheet();
        generateHeader(heads);
        DBObject condition = new BasicDBObject();
        condition.put("account", account);
        BasicDBList list = null;

        if(timeType.equals("all")){
            DBObject key = new BasicDBObject("account",1);
            DBObject initial = new BasicDBObject();
            initial.put("total",0);
            initial.put("deal",0);
            initial.put("lost",0);
            initial.put("invalid",0);
            initial.put("money",0);
            StringBuffer aggregation = new StringBuffer();
            aggregation.append("function( curr, result ){")
                    .append("result.total += curr.total || 0;")
                    .append("result.deal += curr.deal || 0;")
                    .append("result.lost += curr.lost || 0;")
                    .append("result.invalid += curr.invalid || 0;")
                    .append("result.money += curr.money || 0;")
                    .append("}");
            StringBuffer finalize = new StringBuffer();
            list = MongoProvider.groupFromReportDb(REPORT_TABLE, key,condition,initial,aggregation.toString(),finalize.toString());

        }else if(timeType.equals("year")){
            String year = (String) query.get("yearReport");
            condition.put("year", year + "");
            DBObject key = new BasicDBObject("month",1);
            DBObject initial = new BasicDBObject();
            initial.put("total",0);
            initial.put("deal",0);
            initial.put("lost",0);
            initial.put("invalid",0);
            initial.put("money",0);
            StringBuffer aggregation = new StringBuffer();
            aggregation.append("function( curr, result ){")
                    .append("result.total += curr.total || 0;")
                    .append("result.deal += curr.deal || 0;")
                    .append("result.lost += curr.lost || 0;")
                    .append("result.invalid += curr.invalid || 0;")
                    .append("result.money += curr.money || 0;")
                    .append("}");
            StringBuffer finalize = new StringBuffer();
            list = MongoProvider.groupFromReportDb(REPORT_TABLE, key,condition,initial,aggregation.toString(),finalize.toString());

        }else if(timeType.equals("month")){
            String year = (String) query.get("yearReport");
            String month = (String) query.get("monthReport");
            condition.put("month", year + "" + month);
            DBObject key = new BasicDBObject("day",1);
            DBObject initial = new BasicDBObject();
            initial.put("total",0);
            initial.put("deal",0);
            initial.put("lost",0);
            initial.put("invalid",0);
            initial.put("money",0);
            StringBuffer aggregation = new StringBuffer();
            aggregation.append("function( curr, result ){")
                    .append("result.total += curr.total || 0;")
                    .append("result.deal += curr.deal || 0;")
                    .append("result.lost += curr.lost || 0;")
                    .append("result.invalid += curr.invalid || 0;")
                    .append("result.money += curr.money || 0;")
                    .append("}");
            StringBuffer finalize = new StringBuffer();
            list = MongoProvider.groupFromReportDb(REPORT_TABLE, key,condition,initial,aggregation.toString(),finalize.toString());
        }

        //write report begin//
        if(list == null) list = new BasicDBList();
        for(int i=0;i<list.size();i++){
            insertRow(rownum);
            DBObject dataObj = (BasicDBObject)list.get(i);
            if(timeType.equals("all")){
                createCell(0,"");
            }else if(timeType.equals("year")){
                createCell(0,(String)dataObj.get("month"));
            }else if(timeType.equals("month")){
                createCell(0,(String)dataObj.get("day"));
            }
            String total = "0";
            String deal = "0";
            String invalid = "0";
            String lost = "0";
            BigDecimal money = null;
            for(int m =0 ;m < heads.size();m++){
                Object temp= dataObj.get(heads.get(m).getFieldId());

                if(heads.get(m).getFieldId().equals("total")){
                    if(temp!=null){
                        total = String.valueOf(temp);
                    }
                    createCell(m+1,total);
                }else if( heads.get(m).getFieldId().equals("deal")){
                    if(temp!=null){
                        deal = String.valueOf(temp);
                    }
                    createCell(m+1,deal);
                }else if(heads.get(m).getFieldId().equals("invalid")){
                    if(temp!=null){
                        invalid = String.valueOf(temp);
                    }
                    createCell(m+1,invalid);
                }else if(heads.get(m).getFieldId().equals("lost")){
                    if(temp!=null){
                        lost = String.valueOf(temp);
                    }
                    createCell(m+1,lost);
                }else if(heads.get(m).getFieldId().equals("money")){
                    createCell(m+1,currency.format(money));
                }else if(heads.get(m).getFieldId().equals("dealRate")){
                    double num1 = Double.parseDouble(deal);
                    double num2 = Double.parseDouble(total);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
                    }
                }else if(heads.get(m).getFieldId().equals("lostRate")){
                    double num1 = Double.parseDouble(lost);
                    double num2 = Double.parseDouble(total);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
                    }
                }else if(heads.get(m).getFieldId().equals("invalidRate")){
                    double num1 = Double.parseDouble(invalid);
                    double num2 = Double.parseDouble(total);
                    if(num1>num2){
                        createCell(m+1,"100%");
                    }else{
                        if(num2==0){
                            createCell(m+1,"0%");
                        }else{
                            String rate = Math.round(num1 / num2 * 10000) / 100.00 + "%";
                            createCell(m+1,rate);
                        }
                    }

                }else if(heads.get(m).getFieldId().equals("aveRate")) {
                    if(dataObj.get("money")!=null){
                        BigDecimal bigDecimal = new BigDecimal(dataObj.get("money").toString());
                        money = bigDecimal.divide(new BigDecimal(10000));
                    }
                    double num1 = Double.parseDouble(deal);

                    if(num1==0){
                        createCell(m + 1, "0");
                    }else{
                        BigDecimal ave = money.divide(new BigDecimal(deal));
                        createCell(m + 1, currency.format(ave));
                    }
                }
            }
            endRow();
            rownum++;
        }
        //write report end//
        endSheet();

    }

    private void generateHeader(List<ExportModelVo> list) throws Exception {
        insertRow(0);
        createCell(0,"时间");
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
        field3.setFieldId("invalid");
        field3.setFieldName("无效数");
        field3.setDicName("invalid");
        list.add(field3);

        ExportModelVo field4 = new ExportModelVo();
        field4.setFieldId("lost");
        field4.setFieldName("丢单数");
        field4.setDicName("lost");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("dealRate");
        field5.setFieldName("成单率");
        field5.setDicName("dealRate");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("invalidRate");
        field6.setFieldName("无效率");
        field6.setDicName("invalidRate");
        list.add(field6);

        ExportModelVo field7 = new ExportModelVo();
        field7.setFieldId("lostRate");
        field7.setFieldName("丢单率");
        field7.setDicName("lostRate");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("aveRate");
        field8.setFieldName("单均产值");
        field8.setDicName("aveRate");
        list.add(field8);

        ExportModelVo field9 = new ExportModelVo();
        field9.setFieldId("money");
        field9.setFieldName("总产值");
        field9.setDicName("money");
        list.add(field9);

        return list;
    }



}
