package com.dishui.util.excel.bill;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.excel.XssfWriter;
import com.mongodb.*;

import javax.management.Query;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * Created User feng
 * Created by sG on 2015/10/22.
 */
public class FinanceDetailExport extends XssfWriter{
    private static Logger log = Logger.getLogger(FinanceDetailExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

    public void generate(Map<String,Object> query) throws Exception {
        //创建一个集合，调用getHeaders()方法。来获取表头
        List<ExportModelVo> heads=getHeaders();
        //定义一个rownum变量来记录行数
        int rownum = 1;
        //定义 moneySum计算总金额的
        double moneySum = 0d;
        //电子表格开始
        beginSheet();
        //创建collection对象 获取对应数据库中数据表中的数据
        DBCollection collection = MongoConnect.getInstance().getDB().getCollection("bill_user_pay");
        //创建一个基本数据库对象，存放数据
        DBObject where=new BasicDBObject();
        //调用这个方法可支持条件查询
        setQueryCondition(query);
        //获取到信息，放进去
        where.putAll(query);
        //找到所对应的对象
        DBCursor cursor = collection.find(where);
        //通过这个方法，把表头加载到Excel中
        genrateHeader(heads);
        //循环cursor里面的数据
        while(cursor.hasNext()){
            //找到下一个元素
            DBObject obj = cursor.next();
            //插入行数
            insertRow(rownum);
            //循环表头
            for(int i=0;i<heads.size();i++){
                //创建一个对象把获取到表头信息放到里面
                Object temp=obj.get(heads.get(i).getFieldId());
                if(temp!=null){
                    if ("currentBalance".equals(heads.get(i).getFieldId())) {
                        //计算总金额
                        moneySum += Double.parseDouble(String.valueOf(temp));
                    }
                }
                //查询收支类型
                if(temp!=null && heads.get(i).getFieldId().equals("source")&& heads.get(i).getDicName().equals("") ){
                    String desc="";
                    if(temp.equals("serviceNo")||temp.equals("licence")||temp.equals("payCallFee")||temp.equals("backoutPay")||temp.equals("payCall400Fee")||temp.equals("payCallMin")||temp.equals("pay")||temp.equals("systemPay")||temp.equals("paySmsFee")||temp.equals("oweFee")){
                        desc="收入";
                    }else if(temp.equals("proxyWithDraw")||temp.equals("payAccount")){
                        desc="支出";
                    }
                    createCell(i, desc);
                }
                //判断有没有到字典（DicName），有走if 没有走 else
                if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
                  String dicName=heads.get(i).getDicName();
                    String desc="";
                    if(dics.get(dicName)!=null){
                         desc=dics.get(dicName).get((String)temp);
                    }
                    createCell(i,desc);
                }else{
                    createCell(i,temp==null?"":temp.toString());
                }
            }
            endRow();//结束
            rownum++;//行数++
        }//while循环里面


        //创建统计行
        insertRow(rownum);
        //格式转换/保留两位小数
        java.text.DecimalFormat df=new java.text.DecimalFormat("#.00");
        String money = df.format(moneySum);
        //获取heads中条数
        int len=heads.size();
        for(int i=0;i<len;i++){
            if(i==len-2){//判断输出一共有多上条  意思就是行数
                createCell(i, "共" + (rownum-1) + "条记录");
            }else if(i==len-1){//记录总金额
                createCell(i,"总金额"+money+"(元)");
            }else{
                createCell(i,"");
            }
        }
        //结束行
        endRow();
        //电子表格结束
        endSheet();
    }
    //对应的表头的信息
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("pay_time");
        field1.setFieldName("入账时间");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("_id");
        field2.setFieldName("流水号");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("account");
        field3.setFieldName("所属客户");
        field3.setDicName("accountName");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("source");
        field4.setFieldName("资金来源");
        field4.setDicName("proxySource");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("source");
        field5.setFieldName("收支类型");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("income");
        field6.setFieldName("收支金额");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("currentBalance");
        field7.setFieldName("账户余额");
        field7.setDicName("");
        list.add(field7);
        setFieldDic();
        return list;
    }
    //加载表头的方法
    public void genrateHeader(List<ExportModelVo> list) throws Exception{
        insertRow(0);
        for(int i=0;i<list.size();i++){
            createCell(i,list.get(i).getFieldName());
        }
        endRow();
    }
    //指定开始结束时间(通过条件查询)
    private void setQueryCondition(Map<String, Object> query){
        //通过时间查询
        if(query.containsKey("begin")||query.containsKey("end")){
            Object start=query.get("begin");
            Object end=query.get("end");

            DBObject  payTime=new BasicDBObject();
            if(start!=null){
                payTime.put("$gte", start.toString()+" 00:00:00");
                query.remove("begin");
            }
            if(end!=null){
                payTime.put("$lte", end.toString()+" 23:59:59");
                query.remove("end");
            }
            query.put("pay_time", payTime);
        }
        //来查询收支类型
        if(query.containsKey("financeType")) {
            String financeType =(String) query.get("financeType");
            if (financeType.equals("in")) {
                BasicDBList list=new  BasicDBList();
                list.add("serviceNo");
                list.add("licence");
                list.add("payCallFee");
                list.add("backoutPay");
                list.add("payCall400Fee");
                list.add("payCallMin");
                list.add("pay");
                list.add("systemPay");
                list.add("paySmsFee");
                list.add("oweFee");
                query.put("source",new BasicDBObject("$in",list) );
            }else if(financeType.equals("out")) {
                BasicDBList list=new  BasicDBList();
                list.add("proxyWithDraw");
                list.add("payAccount");
                query.put("source",new BasicDBObject("$in",list) );
            }
            query.remove("financeType");
        }

    }
    //自定义
    public void setFieldDic(){
        _setCommonDic();
        _setAccountDic();
        //_setfinance();
    }
    //通过这个方法获取下拉框资金来源里面的值
    private void _setCommonDic(){
        List array=new ArrayList();
        array.add("proxySource");//资金来源
        DBObject where=new BasicDBObject();
        where.put("codeType", new BasicDBObject("$in",array));
        List<DBObject> list= MongoProvider.find("bill_system_general_codes", where,new BasicDBObject().append("codeType",1).append("codeName",1).append("codeValue",1));
        Map<String,String> map1=new HashMap<String,String>();
        for (DBObject o : list) {
            String type=o.get("codeType").toString();
            if("proxySource".equals(type)){
                map1.put(o.get("codeValue").toString(), o.get("codeName").toString());
            }
        }
        dics.put("proxySource", map1);
    }
    //获取用户
    private void _setAccountDic(){
        DBObject where=new BasicDBObject();
        List<DBObject> list= MongoProvider.find("platform_account", where,new BasicDBObject().append("_id",1).append("name",1));
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("_id").toString(), o.get("name")==null?"":o.get("name").toString());
        }
        dics.put("accountName", map);
    }
}
