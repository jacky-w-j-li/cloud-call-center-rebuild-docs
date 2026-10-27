package com.dishui.util.excel;


import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class CallRecordExport extends XssfWriter{
    private static Logger log = Logger.getLogger(CallRecordExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

    private String accountId;
    private String dbType;

    @Override
    public void generate(Map<String, Object> query) throws Exception {
//        String accountDB = (String)query.get("dataDB");
        dbType=query.get("dbType").toString();
        accountId=query.get("accountId").toString();
        query.remove("accountId");

        List<ExportModelVo> heads=getHeaders(dbType);
        //电子表格开始
        int rownum = 1;
        beginSheet();
        String dbName=MongoProvider.getAccountDB(accountId);
        DBCollection collection = MongoConnect.getInstance().getDB(dbName).getCollection(accountId+"_call_record");
        DBObject where=new BasicDBObject();
        setQueryCondition(query);
        where.putAll(query);
        DBCursor cursor = collection.find(where);
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for(int i=0;i<heads.size();i++){
                String fid=heads.get(i).getFieldId();
                Object temp=obj.get(fid);
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String desc="";
                    String dicName=heads.get(i).getDicName();
                    if(temp instanceof List){
                        StringBuffer checkStr=new StringBuffer();
                        BasicDBList checkVals=(BasicDBList)temp;
                        for(Object o : checkVals){
                            String t1=dics.get(dicName).get((String)o)==null?"":dics.get(dicName).get((String)o).toString();
                            checkStr.append(t1).append(",");
                        }
                        desc=checkStr.toString();
                        if(desc.lastIndexOf(",")!=-1){
                            desc=desc.substring(0,desc.length()-1);
                        }
                    }else{
//                        log.info("dicName==========="+dicName+"  "+temp+" "+dics.get(dicName));
                        desc=dics.get(dicName).get(temp);
                    }

                    createCell(i,desc);
                }else{
                    String val=(temp==null)?"":temp.toString();
                    if("recordAddr".equals(fid) && val.length()>0){
                         val=val.substring(val.lastIndexOf("/")+1);
                    }
                    createCell(i,val);
                }


            }
//			log.info(obj.toString());
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
    public List<ExportModelVo> getHeaders(String tmplId){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();
        DBObject model=MongoProvider.findOne("callRecord_template", new BasicDBObject("_id",tmplId));
        BasicDBList rows = (BasicDBList)model.get("custom_fields");

//        ExportModelVo field1=new ExportModelVo();
//        field1.setFieldId("dbType");
//        field1.setFieldName("登记单类型");
//        field1.setDicName("dbType");
//        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("custName");
        field2.setFieldName("客户");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("callNo");
        field3.setFieldName("号码");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("type");
        field5.setFieldName("类型");
        field5.setDicName("types");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("creator");
        field6.setFieldName("创建人");
        field6.setDicName("user");
        list.add(field6);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("createTime");
        field4.setFieldName("创建时间");
        list.add(field4);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("callTime");
        field7.setFieldName("振铃时间");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("recordAddr");
        field8.setFieldName("录音地址");
        list.add(field8);


        for (Object obj : rows) {
            BasicDBObject row =(BasicDBObject)obj;
            String type=row.getString("type");
            String dic=row.getString("_id");
            String name=row.getString("name");
            ExportModelVo vo=new ExportModelVo();
            vo.setFieldId(dic);
            vo.setFieldName(name);
            if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
                vo.setDicName(dic);
            }else{
                vo.setDicName("");
            }
            list.add(vo);
            if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
                BasicDBObject choices=(BasicDBObject)row.get("choices");
                Iterator iterator2=choices.keySet().iterator();
                Map<String,String> map2=new HashMap<String,String>();
                while(iterator2.hasNext()){

                    String key=(String)iterator2.next();
                    String value=choices.getString(key);
                    map2.put(key, value);
                }
                dics.put(dic, map2);
            }
        }
        setFieldDic(model);
        return list;
    }
    public void setFieldDic(DBObject model){
        Map<String,String> map2=new HashMap<String,String>();
        BasicDBList types=(BasicDBList)model.get("types");
        if(types!=null){
            for (Object obj : types) {
                DBObject item=(BasicDBObject)obj;
                map2.put(item.get("key").toString(), item.get("name").toString());
            }
            dics.put("types", map2);
        }
        setUserDic(this.accountId);
    }
    public void setUserDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        where.put("product", "cc");
        List<DBObject> list=MongoProvider.find("platform_user", where);
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("displayName").toString());
        }
        dics.put("user", map);
    }

    private void setQueryCondition(Map<String, Object> query){
        List<String> fields=new ArrayList<String>();
        DBObject db=new BasicDBObject();
        int count=0;
        if(query.containsKey("BEGIN_TIME")){
            String val=query.get("BEGIN_TIME").toString();
            db.put("$gte", val);
            count++;
        }
        if(query.containsKey("END_TIME")){
            String val=query.get("END_TIME").toString();
            db.put("$lte", val);
            count++;
        }
        if(count>0){
            query.put("createTime", db);
            query.remove("BEGIN_TIME");
            query.remove("END_TIME");
        }


    }
}
