package com.dishui.util.excel.bill;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.dishui.util.excel.XssfWriter;
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
 * Created by ZhnagYaLei on 2015/11/13.
 */
public class SalesAreaWeekExport extends XssfWriter {
    private static Logger log = Logger.getLogger(SalesAreaWeekExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_report_sales_area_week");
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

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("payAccSum");
        field2.setFieldName("总付费企业数");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("payAcc");
        field3.setFieldName("本周付费企业数");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("newPayAcc");
        field4.setFieldName("本周新增付费企业数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("paySum");
        field5.setFieldName("本周充值金额(元)");
        field5.setDicName("");
        list.add(field5);


        return list;
    }
}
