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

public class FeeCustExport extends XssfWriter{
	private static Logger log = Logger.getLogger(FeeCustExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();
	

	@Override
	public void generate(Map<String,Object> query) throws Exception {
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        double moneySum = 0d;
        beginSheet();
        DBObject where=new BasicDBObject();
        setQueryCondition(query);
        where.putAll(query);

        String[] proxyIdArr = where.get("proxy")==null?null:where.get("proxy").toString().split(",");
        List<String> proxyIdList = Arrays.asList(proxyIdArr);
        if(proxyIdList!=null){
            where.removeField("proxy");
        }

        DBCollection collection = MongoConnect.getInstance().getDB("zj").getCollection("user_bank_pay");
        DBCursor cursor = collection.find(where);
        //获取符合条件的所有账户的所属人id
        List<DBObject> userList = getCreateUser(cursor);
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            String accId = obj.get("account") == null ? "" : obj.get("account").toString();
            for (DBObject acc : userList) {
                String accId2 = acc.get("_id") == null ? "" : acc.get("_id").toString();
                if (accId2.equals(accId)) {
                    String createUser = acc.get("createUser") == null ? "" : acc.get("createUser").toString();
                    obj.put("createUser", createUser);
                }
            }
            if (proxyIdList != null) {
                if (obj.get("createUser")!=null && proxyIdList.contains(obj.get("createUser").toString())) {
                    insertRow(rownum);
                    for (int i = 0; i < heads.size(); i++) {
                        Object temp = obj.get(heads.get(i).getFieldId());
                        if ("money".equals(heads.get(i).getFieldId())) {
                            moneySum += Double.parseDouble(String.valueOf(temp));
                        }
                        if (temp != null && heads.get(i).getDicName() != null && !heads.get(i).getDicName().equals("")) {
                            String dicName = heads.get(i).getDicName();
                            String desc = dics.get(dicName).get(temp);
                            createCell(i, desc);
                        } else {
                            createCell(i, temp == null ? "" : temp.toString());
                        }
                    }
                    endRow();
                    rownum++;
                }
            } else {
                insertRow(rownum);
                for (int i = 0; i < heads.size(); i++) {
                    Object temp = obj.get(heads.get(i).getFieldId());
                    if ("money".equals(heads.get(i).getFieldId())) {
                        moneySum += Double.parseDouble(String.valueOf(temp));
                    }
                    if (temp != null && heads.get(i).getDicName() != null && !heads.get(i).getDicName().equals("")) {
                        String dicName = heads.get(i).getDicName();
                        String desc = dics.get(dicName).get(temp);
                        createCell(i, desc);
                    } else {
                        createCell(i, temp == null ? "" : temp.toString());
                    }
                }
                endRow();
                rownum++;
            }
        }
        //创建统计行
        insertRow(rownum);
        //保留两位小数
        java.text.DecimalFormat df=new java.text.DecimalFormat("#.00");
//        DecimalFormat df = new DecimalFormat("######0.00");
        String money = df.format(moneySum);
        int len=heads.size();
        for(int i=0;i<len;i++){
            if(i==len-2){
                createCell(i, "共" + (rownum-1) + "条记录");
            }else if(i==len-1){
                createCell(i,"总金额"+money+"(元)");
            } else{
                createCell(i,"");
            }
        }
        endRow();
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
        field1.setFieldId("_id");
        field1.setFieldName("流水号");
        field1.setDicName("");
        list.add(field1);

//        ExportModelVo field2=new ExportModelVo();
//        field2.setFieldId("accountName");
//        field2.setFieldName("账户名称");
//        field2.setDicName("");
//        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("account");
        field3.setFieldName("公司名称");
        field3.setDicName("accCompanyName");
        list.add(field3);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("createUser");
        field9.setFieldName("代理");
        field9.setDicName("sysUser");
        list.add(field9);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("product");
        field4.setFieldName("产品");
        field4.setDicName("productType");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("flag");
        field5.setFieldName("充值类型");
        field5.setDicName("userPayType");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("bank");
        field6.setFieldName("支付方式");
        field6.setDicName("payBank");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("pay_time");
        field7.setFieldName("充值时间");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("money");
        field8.setFieldName("充值金额(元)");
        field8.setDicName("");
        list.add(field8);

        setFieldDic();
		return list;
	}
    public void setFieldDic(){
        _setCommonDic();
        _setAccountDic();
        _setSysUserDic();
    }
    private void _setCommonDic(){
        List array=new ArrayList();
        array.add("userPayType");
        array.add("productType");
        array.add("payBank");
        DBObject where=new BasicDBObject();
        where.put("codeType", new BasicDBObject("$in",array));
        List<DBObject> list= MongoProvider.find("bill_system_general_codes", where,new BasicDBObject().append("codeType",1).append("codeName",1).append("codeValue",1));
        Map<String,String> map1=new HashMap<String,String>();
        Map<String,String> map2=new HashMap<String,String>();
        Map<String,String> map3=new HashMap<String,String>();
        for (DBObject o : list) {
            String type=o.get("codeType").toString();
            if("userPayType".equals(type)){
                map1.put(o.get("codeValue").toString(), o.get("codeName").toString());
            }else if("productType".equals(type)){
                map2.put(o.get("codeValue").toString(), o.get("codeName").toString());
            }else if("payBank".equals(type)){
                map3.put(o.get("codeValue").toString(), o.get("codeName").toString());
            }
        }
        dics.put("userPayType", map1);
        dics.put("productType", map2);
        dics.put("payBank", map3);
    }

    private void _setAccountDic(){
        DBObject where=new BasicDBObject();
        List<DBObject> list= MongoProvider.find("platform_account", where,new BasicDBObject().append("_id",1).append("companyName",1));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("companyName")==null?"":o.get("companyName").toString());
        }
        dics.put("accCompanyName", map);
    }
    private  void _setSysUserDic(){
        DBObject where=new BasicDBObject();
        where.put("status","enable");
        where.put("identity","proxy");
        List<DBObject> list2= MongoProvider.find("bill_system_user", where,new BasicDBObject().append("_id",1).append("name",1));
        Map<String,String> map2=new HashMap<String,String>();
        for (DBObject o : list2) {
            map2.put(o.get("_id").toString(), o.get("name")==null?"":o.get("name").toString());
        }
        dics.put("sysUser", map2);
    }
//    public void _setProductDic(){
//        Map<String,String> map=new HashMap<String,String>();
//        map.put("zj", "企业总机");
//        map.put("cc", "呼叫中心");
//        dics.put("product", map);
//    }
	private void setQueryCondition(Map<String, Object> query){
        if(query.containsKey("begin")||query.containsKey("end")){
            Object start=query.get("begin");
            Object end=query.get("end");

            DBObject payTime=new BasicDBObject();
            if(start!=null){
                payTime.put("$gte", start.toString()+" 00:00:00");
                query.remove("begin");
            }
            if(end!=null){
                payTime.put("$lte", end.toString()+" 23:59:59");
                query.remove("end");
            }
            query.put("pay_time",payTime);
        }

	}
    private  List<DBObject>  getCreateUser(DBCursor cursor){
        List<String> list=new ArrayList<String>();
        for(DBObject obj : cursor){
            String temp=obj.get("account") == null?"":obj.get("account").toString();
            list.add(temp);
        }
        DBObject condition = new BasicDBObject().append("_id",new BasicDBObject("$in",list));
        List<DBObject> numList = MongoProvider.find("platform_account",condition,new BasicDBObject().append("_id",1).append("createUser",1));

        return numList;
    }
}
