package com.dishui.util.excel;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by wwh on 2015/1/26.
 */
public class SmsMonthExport extends XssfWriter{
    private static Logger log = Logger.getLogger(SmsMonthExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_sms_consume");
        DBObject where=new BasicDBObject();
//        setQueryCondition(query);
//        query.remove("name");
        String name=(String)query.get("name");
        if("smsZJ".equals(name)){
            query.put("name","zj");
        }else if("smsCC".equals(name)){
            query.put("name","cc");
        }
        where.putAll(query);
        DBCursor cursor = collection.find(where);
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for(int i=0;i<heads.size();i++){
                Object temp=obj.get(heads.get(i).getFieldId());
                if("yearMonth".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("year")+"-"+obj.get("month");
                }else if("actualConsume".equals(heads.get(i).getFieldId())){
                    temp= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                }
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    if("name".equals(dicName)){
                        if(temp.equals("cc")){
                            desc="呼叫中心";
                        }else if(temp.equals("zj")){
                            desc="企业总机";
                        }
                    }
                    createCell(i,desc);
                }else{
                    createCell(i,temp==null?"":temp.toString());
                }
            }
            endRow();
            rownum++;
        }

        //电子表格结束
        endSheet();
    }
    public void genrateHeader(List<ExportModelVo> list) throws Exception{
        insertRow(0);
        for(int i=0;i<list.size();i++){
            createCell(i,list.get(i).getFieldName());
        }
        endRow();
    }
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("yearMonth");
        field1.setFieldName("月份");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("account");
        field2.setFieldName("账户编号");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("name");
        field3.setFieldName("产品名称");
        field3.setDicName("name");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("num");
        field4.setFieldName("短信数量(条)");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("createTime");
        field5.setFieldName("创建时间");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("actualConsume");
        field6.setFieldName("实际消费");
        field6.setDicName("");
        list.add(field6);

        return list;
    }

    private void setQueryCondition(Map<String, Object> query){

    }

}
