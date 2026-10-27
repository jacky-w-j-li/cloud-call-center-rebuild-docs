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
public class SmsDetailExport extends XssfWriter{
    private static Logger log = Logger.getLogger(SmsDetailExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        String monthId=(String)query.get("monthId");
        if(monthId==null)return;
        String[] ary=monthId.split("_");
        String month=ary[1];
        String product=ary[2];
        String table="bill_sms_detail_cc";
        if(product.equals("zj")){
            table="bill_sms_detail_zj";
        }
        DBCollection collection = MongoConnect.getInstance().getDB("bill_data").getCollection(table);
        DBObject where=new BasicDBObject();
        setQueryCondition(query,month,product);
        where.putAll(query);
        DBCursor cursor = collection.find(where);
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for(int i=0;i<heads.size();i++){
                Object temp=obj.get(heads.get(i).getFieldId());
                if("consume".equals(heads.get(i).getFieldId())){
                    temp= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                }
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    if("productType".equals(dicName)){
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
        field1.setFieldId("account");
        field1.setFieldName("账户编号");
        field1.setDicName("");
        list.add(field1);

//        ExportModelVo field2=new ExportModelVo();
//        field2.setFieldId("reportTime");
//        field2.setFieldName("发出时间");
//        field2.setDicName("");
//        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("submitTime");
        field3.setFieldName("提交时间");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("num");
        field4.setFieldName("接收方号码");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("product");
        field5.setFieldName("产品类型");
        field5.setDicName("productType");
        list.add(field5);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("splitCount");
        field2.setFieldName("拆分条数");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("consume");
        field6.setFieldName("费用");
        field6.setDicName("");
        list.add(field6);

        return list;
    }
    private void setQueryCondition(Map<String, Object> query,String month,String product){
        query.remove("monthId");
        if(query.get("combox")!=null){
            String value=query.get("combox").toString();
            query.remove("combox");
            query.put("num",value);
        }
        query.put("product",product);
        DBObject db=new BasicDBObject();
        db.put("$gte", month+"-01 00:00:00");
        db.put("$lte", month+"-31 23:59:59");
        if(query.containsKey("beginTime")){
            String val1=query.get("beginTime").toString()+" 00:00:00";
            db.put("$gte", val1);
        }
        if(query.containsKey("endTime")) {
            String val1 = query.get("endTime").toString()+" 23:59:59";
            db.put("$lte", val1);
        }
        query.put("submitTime", db);
        query.remove("beginTime");
        query.remove("endTime");
    }

}
