package com.dishui.util.excel;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class CdrDetailExport extends XssfWriter{
    private static Logger log = Logger.getLogger(CdrDetailExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();


    @Override
    public void generate(Map<String,Object> query) throws Exception {
//        account=query.get("account").toString();
        List<ExportModelVo> heads=getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        String monthId=(String)query.get("monthId");
        if(monthId==null)return;
        String[] ary=monthId.split("_");
        String month=ary[1];
        String product=ary[2];

        String table="";
        if("zj".equals(product)){
            table="bill_cdr_query_zj";
        }else if("cc".equals(product)){
            table="bill_cdr_query_cc";
        }else if("400".equals(product)){
            table="bill_cdr_query_400";
        }

        //author：zzx   查询数据库
        Map<String,Object> query_agent = new HashMap<String,Object>();
        String accountId = ary[0];
        query_agent.put("account",accountId);
        query_agent.put("product",product);
        DBObject where_agent = new BasicDBObject();
        where_agent.putAll(query_agent);
        List<DBObject> list_agent = MongoProvider.find("platform_user",where_agent);


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
                }else if("callAddr".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("callerProvince")+"-"+obj.get("callerCity");
                }else if("calledAddr".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("calleeProvince")+"-"+obj.get("calleeCity");
                }else if("agentDisplayName".equals(heads.get(i).getFieldId())){
                    String agentId = (String)obj.get("agentId");
                    DBObject dbAgent = checkAgentId(list_agent,agentId==null?"":agentId.toString());
                    temp = dbAgent == null ? "" : dbAgent.get("displayName");
                }else if("agentExten".equals(heads.get(i).getFieldId())){
                    String agentId = (String)obj.get("agentId");
                    DBObject dbAgent = checkAgentId(list_agent,agentId==null?"":agentId.toString());
                    temp = dbAgent == null ? "" : dbAgent.get("exten");
                }
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                    String dicName=heads.get(i).getDicName();
                    String desc="";
                    if("dialType".equals(dicName)){
                        if(temp.equals("normal")){
                            desc="普通来电";
                        }else if(temp.equals("dialout")){
                            desc="外呼去电";
                        }else if(temp.equals("transfer")){
                            desc="转接来电";
                        }else if(temp.equals("dialTransfer")){
                            desc="外呼转接";
                        }
                    }else if("isLocal".equals(dicName)){
                        if(temp.equals(true)){
                            desc="本地";
                        }else{
                            desc="长途";
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
        field1.setFieldId("beginTimeDisplay");
        field1.setFieldName("开始时间");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("callAddr");
        field2.setFieldName("主叫地");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("calledAddr");
        field3.setFieldName("被叫地");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("cid");
        field4.setFieldName("主叫号码");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("did");
        field5.setFieldName("被叫号码");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6 = new ExportModelVo();
        field6.setFieldId("agentDisplayName");
        field6.setFieldName("座席名称");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7 = new ExportModelVo();
        field7.setFieldId("agentExten");
        field7.setFieldName("座席工号");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("type");
        field8.setFieldName("呼叫类型");
        field8.setDicName("dialType");
        list.add(field8);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("isLocal");
        field9.setFieldName("通信类型");
        field9.setDicName("isLocal");
        list.add(field9);

        ExportModelVo field10=new ExportModelVo();
        field10.setFieldId("minutes");
        field10.setFieldName("时长(分钟)");
        field10.setDicName("");
        list.add(field10);

        ExportModelVo field11=new ExportModelVo();
        field11.setFieldId("seconds");
        field11.setFieldName("时长(秒)");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12=new ExportModelVo();
        field12.setFieldId("consume");
        field12.setFieldName("费用(元)");
        field12.setDicName("");
        list.add(field12);



        return list;
    }


    private void setQueryCondition(Map<String, Object> query,String month,String product){
        query.remove("monthId");
/*        if(query.get("combox")!=null){
            String value=query.get("combox").toString();
            if("400".equals(product)){
                query.put("cid", value);
            }else{
                query.put("did", value);
            }
//            BasicDBList combox=new  BasicDBList();
////            Pattern pattern= Pattern.compile(value);
//            DBObject c1=new BasicDBObject("cid",value);
//            DBObject c2=new BasicDBObject("did",value);
//            combox.add(c1);
//            combox.add(c2);
//            query.put("$or", combox);
            query.remove("combox");
        }*/

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
        query.put("endTimeDisplay", db);
        query.remove("beginTime");
        query.remove("endTime");

        if(query.get("dialType")!=null){
            query.put("type",query.get("dialType").toString());
        }
        query.remove("dialType");

    }

    private DBObject checkAgentId(List<DBObject> list_agent,String agentId) {
        for (int j = 0; j <list_agent.size() ; j++){
            String agentDB_id = list_agent.get(j).get("_id").toString();
            if (agentDB_id.equals(agentId)){
                return list_agent.get(j);
            }
        }
        return null;
    }
}