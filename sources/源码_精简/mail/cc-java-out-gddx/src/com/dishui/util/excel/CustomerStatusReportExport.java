package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;


public class CustomerStatusReportExport extends XssfWriter {
    private static final String REPORT_TABLE = "cc_customer_status_report";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        String account = (String) query.get("accountId");
        DBObject customerTepm = MongoProvider.findOne("customer_template",new BasicDBObject().append("account",account));
        DBObject statusObj = new BasicDBObject();
        if(customerTepm != null){
            statusObj =(DBObject)customerTepm.get("status");
        }
        Map<String, String> userMap=setUserDic(account);
        Map<Object,Object> map=statusObj.toMap();
        List<DBObject> heads = new ArrayList<DBObject>();
        Iterator iterator=map.keySet().iterator();
        while (iterator.hasNext()){
            String key=(String)iterator.next();
            Object value = map.get(key);
            heads.add(new BasicDBObject().append("key",key).append("name",value));
        }
        DBObject condition =new BasicDBObject();
        condition.put("account", account);
        if (query.get("user") != null && !query.get("user").equals("")) {
            condition.put("user", query.get("user"));
        }
        int rownum = 1;
        beginSheet();
        generateHeader(heads);
        List<DBObject> list = MongoProvider.findFromReportDb(REPORT_TABLE, condition);
        if (list.size() > 0) {
            for(int i=0 ; i< list.size();i++){
                insertRow(rownum);
                DBObject dataObj = list.get(i);
                String uid=(String)dataObj.get("user");
                String desc="";
                if(uid==null ||"NA".equals(uid)){
                    desc="无归属";
                }else{
                    desc=userMap.get(uid);
                }
                createCell(0,desc);
                for(int j =0 ;j < heads.size();j++){
                    Object value = dataObj.get((String) heads.get(j).get("key"));
                    if(value!= null && (Integer)value<0){
                        value = 0;
                    }
                    createCell(j+1 , value == null ? "0" : String.valueOf(value));
                }
                endRow();
                rownum++;
            }
        }
        endSheet();
    }

    private void generateHeader(List<DBObject> heads) throws Exception {
        insertRow(0);
        createCell(0,"座席");
        for (int i = 0; i < heads.size(); i++) {
            createCell(i+1, (String)heads.get(i).get("name"));
        }
        endRow();
    }
    private Map<String,String> setUserDic(String accountId){
        DBObject where=new BasicDBObject();
        where.put("account", accountId);
        where.put("product", "cc");
        List<DBObject> list= MongoProvider.find("bill", "platform_user", where);
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("displayName").toString());
        }
        return map;
    }

}
