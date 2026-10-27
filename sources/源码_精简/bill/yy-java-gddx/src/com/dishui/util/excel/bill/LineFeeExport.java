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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class LineFeeExport extends XssfWriter{
    private static Logger log = Logger.getLogger(LineFeeExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_call_line");
        DBObject where=new BasicDBObject();
        setQueryCondition(query);
        where.putAll(query);
        DBCursor cursor = collection.find(where);
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
                    if(temp!=null && (heads.get(i).getFieldId().equals("cost") | heads.get(i).getFieldId().equals("earn"))){
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
        field1.setFieldId("createTime");
        field1.setFieldName("创建时间");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("line");
        field3.setFieldName("线路名称");
        field3.setDicName("lineName");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("calls");
        field4.setFieldName("通话数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field11=new ExportModelVo();
        field11.setFieldId("localPhoneCalls");
        field11.setFieldName("本地手机通话数");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12=new ExportModelVo();
        field12.setFieldId("remotePhoneCalls");
        field12.setFieldName("长途手机通话数");
        field12.setDicName("");
        list.add(field12);

        ExportModelVo field13=new ExportModelVo();
        field13.setFieldId("localTelCalls");
        field13.setFieldName("本地固话通话数");
        field13.setDicName("");
        list.add(field13);

        ExportModelVo field14=new ExportModelVo();
        field14.setFieldId("remoteTelCalls");
        field14.setFieldName("长途固话通话数");
        field14.setDicName("");
        list.add(field14);

        ExportModelVo field15=new ExportModelVo();
        field15.setFieldId("mjCalls");
        field15.setFieldName("美国/加拿大通话数");
        field15.setDicName("");
        list.add(field15);

        ExportModelVo field16=new ExportModelVo();
        field16.setFieldId("gatCalls");
        field16.setFieldName("港/澳/台通话数");
        field16.setDicName("");
        list.add(field16);

        ExportModelVo field17=new ExportModelVo();
        field17.setFieldId("otherCalls");
        field17.setFieldName("其他地区通话数");
        field17.setDicName("");
        list.add(field17);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("localPhoneMinutes");
        field5.setFieldName("本地手机(分钟)");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("remotePhoneMinutes");
        field6.setFieldName("长途手机(分钟)");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("localTelMinutes");
        field7.setFieldName("本地固话(分钟)");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("remoteTelMinutes");
        field8.setFieldName("长途固话(分钟)");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field18=new ExportModelVo();
        field18.setFieldId("mjMinutes");
        field18.setFieldName("美国/加拿大(分钟)");
        field18.setDicName("");
        list.add(field18);

        ExportModelVo field19=new ExportModelVo();
        field19.setFieldId("gatMinutes");
        field19.setFieldName("港/澳/台(分钟)");
        field19.setDicName("");
        list.add(field19);

        ExportModelVo field20=new ExportModelVo();
        field20.setFieldId("otherMinutes");
        field20.setFieldName("其他地区(分钟)");
        field20.setDicName("");
        list.add(field20);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("cost");
        field9.setFieldName("成本(元)");
        field9.setDicName("");
        list.add(field9);

        ExportModelVo field10=new ExportModelVo();
        field10.setFieldId("earn");
        field10.setFieldName("利润(元)");
        field10.setDicName("");
        list.add(field10);

        setFieldDic();
        return list;
    }
    public void setFieldDic(){
        _setLineNameDic();
    }
    private void _setLineNameDic(){
        List array=new ArrayList();
        List<DBObject> list= MongoProvider.find("platform_line",new BasicDBObject(),new BasicDBObject().append("_id",1).append("name",1));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("name").toString());
        }
        dics.put("lineName", map);
    }
    private void setQueryCondition(Map<String, Object> query){
        if(query.containsKey("begin")||query.containsKey("end")){
            Object start=query.get("begin");
            Object end=query.get("end");

            DBObject createTime=new BasicDBObject();
            if(start!=null){
                createTime.put("$gte", start.toString()+" 00:00:00");
                query.remove("begin");
            }
            if(end!=null){
                createTime.put("$lte", end.toString()+" 23:59:59");
                query.remove("end");
            }
            query.put("createTime",createTime);
        }

    }
}
