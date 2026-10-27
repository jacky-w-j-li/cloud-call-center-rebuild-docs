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
import com.mongodb.BasicDBList;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class LineDetailExport extends XssfWriter{
    private static Logger log = Logger.getLogger(LineDetailExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_call_line_detail");
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
                if(temp!=null&&("income".equals(heads.get(i).getFieldId()) | "cost".equals(heads.get(i).getFieldId()) | "earn".equals(heads.get(i).getFieldId()))){
                    temp=""+ Utils.formatRound2Money(Long.valueOf(temp.toString()));
                }else if("callAddr".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("callerProvince")+"-"+obj.get("callerCity");
                }else if("calledAddr".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("calleeProvince")+"-"+obj.get("calleeCity");
                }
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                     String dicName=heads.get(i).getDicName();
                     String desc="";
                     if("isLocal".equals(dicName)){
                        if(temp.equals(true)){
                            desc="本地";
                        }else{
                            desc="长途";
                        }
                     }else if("isIntl".equals(dicName)){
                         if(temp.equals(true)){
                             desc="是";
                         }else{
                             desc="否";
                         }
                     }else {
                         desc = dics.get(dicName).get(temp);
                     }
                    createCell(i,desc);
                }else if("isIntl".equals(heads.get(i).getDicName())){
                    String desc="否";
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
        field1.setFieldId("beginTimeDisplay");
        field1.setFieldName("开始时间");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("line");
        field3.setFieldName("线路名称");
        field3.setDicName("lineName");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("account");
        field4.setFieldName("客户编号");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("callAddr");
        field5.setFieldName("主叫地");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("calledAddr");
        field6.setFieldName("被叫地");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("cid");
        field7.setFieldName("主叫号码");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("did");
        field8.setFieldName("被叫号码");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("type");
        field9.setFieldName("呼叫类型");
        field9.setDicName("callTypeCC");
        list.add(field9);

        ExportModelVo field10=new ExportModelVo();
        field10.setFieldId("isLocal");
        field10.setFieldName("通信类型");
        field10.setDicName("isLocal");
        list.add(field10);

        ExportModelVo field15=new ExportModelVo();
        field15.setFieldId("isIntl");
        field15.setFieldName("国际长途");
        field15.setDicName("isIntl");
        list.add(field15);

        ExportModelVo field11=new ExportModelVo();
        field11.setFieldId("minutes");
        field11.setFieldName("时长(分钟)");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12=new ExportModelVo();
        field12.setFieldId("income");
        field12.setFieldName("代理收入(元)");
        field12.setDicName("");
        list.add(field12);

        ExportModelVo field13=new ExportModelVo();
        field13.setFieldId("cost");
        field13.setFieldName("成本(元)");
        field13.setDicName("");
        list.add(field13);

        ExportModelVo field14=new ExportModelVo();
        field14.setFieldId("earn");
        field14.setFieldName("利润(元)");
        field14.setDicName("");
        list.add(field14);


        setFieldDic();
        return list;
    }
    public void setFieldDic(){
        _setCallTypeCCDic();
        _setLineNameDic();
    }
    private void _setCallTypeCCDic(){
        List array=new ArrayList();
        array.add("callTypeCC");
        DBObject where=new BasicDBObject();
        where.put("codeType", new BasicDBObject("$in",array));
        List<DBObject> list= MongoProvider.find("bill_system_general_codes", where,new BasicDBObject().append("codeType",1).append("codeName",1).append("codeValue",1));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            String type=o.get("codeType").toString();
            if("callTypeCC".equals(type)){
                map.put(o.get("codeValue").toString(), o.get("codeName").toString());
            }
        }
        dics.put("callTypeCC", map);
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

            DBObject beginTimeDisplay=new BasicDBObject();
            if(start!=null){
                beginTimeDisplay.put("$gte", start.toString()+" 00:00:00");
                query.remove("begin");
            }
            if(end!=null){
                beginTimeDisplay.put("$lte", end.toString()+" 23:59:59");
                query.remove("end");
            }
            query.put("endTimeDisplay",beginTimeDisplay);
        }

    }


}
