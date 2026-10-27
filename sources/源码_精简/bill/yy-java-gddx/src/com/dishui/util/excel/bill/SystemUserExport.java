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

public class SystemUserExport extends XssfWriter{
    private static Logger log = Logger.getLogger(SystemUserExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_system_user");
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

                if(temp!=null && heads.get(i).getDicName().equals("statusType")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    if(temp.equals("enable")){
                        desc="在用";
                    }else if(temp.equals("disable")){
                        desc="停用";
                    }else {
                        desc="未知";
                    }
                    createCell(i, desc);
                }else if(temp!=null && (heads.get(i).getFieldId().equals("balance") | heads.get(i).getFieldId().equals("overdraw"))){
                    String desc= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    createCell(i,desc);
                }else if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    if(heads.get(i).getDicName().equals("role")){
                        Map<String,String> map=new HashMap<String,String>();
                        map=dics.get(dicName);
                        if(map.keySet().contains(temp)){
                            desc = dics.get(dicName).get(temp);
                        }
                    }else{
                        desc = dics.get(dicName).get(temp);
                    }
                    createCell(i, desc);
                }
                else{
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
        field1.setFieldId("name");
        field1.setFieldName("用户名称");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("loginName");
        field2.setFieldName("登录名");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("identity");
        field3.setFieldName("角色");
        field3.setDicName("role");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("createTime");
        field4.setFieldName("创建时间");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("status");
        field5.setFieldName("状态");
        field5.setDicName("statusType");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("balance");
        field6.setFieldName("余额(元)");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("overdraw");
        field7.setFieldName("透支额度(元)");
        field7.setDicName("");
        list.add(field7);


        setFieldDic();
        return list;
    }
    public void setFieldDic(){
        _setCommonDic();
        _setStatusType();
    }
    private void _setCommonDic(){
        Map<String,String> map=new HashMap<String,String>();
        List<DBObject> list= MongoProvider.find("bill_system_user_role",new BasicDBObject(),new BasicDBObject().append("_id", 1).append("name",1));
        for (DBObject o : list) {
                map.put(o.get("_id").toString(), o.get("name").toString());
        }
        dics.put("role", map);
    }
    private void _setStatusType(){
        Map<String,String> map=new HashMap<String,String>();
        map.put("enable","在用");
        map.put("disable","停用");
        dics.put("statusType", map);
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
