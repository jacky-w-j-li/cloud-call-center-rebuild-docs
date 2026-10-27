package com.dishui.util.excel.bill;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.excel.XssfWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Logger;

public class WeekOperationExport extends XssfWriter{
    private static Logger log = Logger.getLogger(WeekOperationExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_report_business_week");
        DBObject where=new BasicDBObject();
        where.putAll(query);
        DBCursor cursor = collection.find(where).sort(new BasicDBObject().append("beginTime",1));
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for(int i=0;i<heads.size();i++){
                Object temp=obj.get(heads.get(i).getFieldId());
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    desc=dics.get(dicName).get(temp);
                    createCell(i,desc);
                }else{
                    String desc=temp==null?"":temp.toString();
                    if(temp!=null && (heads.get(i).getFieldId().equals("lineCost") )){
                        desc= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    }
                    createCell(i,desc);
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
        field1.setFieldId("beginTime");
        field1.setFieldName("开始时间");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("newAcc");
        field3.setFieldName("本周新增企业数");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("newPayAcc");
        field4.setFieldName("本周新增付费企业数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field11=new ExportModelVo();
        field11.setFieldId("payAcc");
        field11.setFieldName("本周付费企业数");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12=new ExportModelVo();
        field12.setFieldId("paySum");
        field12.setFieldName("本周充值金额");
        field12.setDicName("");
        list.add(field12);

        ExportModelVo field13=new ExportModelVo();
        field13.setFieldId("lineCost");
        field13.setFieldName("本周运营商成本");
        field13.setDicName("");
        list.add(field13);

        return list;
    }

}
