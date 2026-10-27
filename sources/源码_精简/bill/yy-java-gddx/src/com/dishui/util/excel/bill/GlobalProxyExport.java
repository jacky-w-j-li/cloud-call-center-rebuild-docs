package com.dishui.util.excel.bill;

import com.dishui.bill.service.Utils;
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
 * Created by sG on 2015/10/2.
 */
public class GlobalProxyExport extends XssfWriter {
    private static Logger log = Logger.getLogger(GlobalProxyExport.class.getName());
    public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();

    public void generate(Map<String,Object> query) throws Exception {
        //创建一个集合，调用getHeaders()方法。来获取表头
        List<ExportModelVo> heads=getHeaders();
        //定义一个rownum变量来记录行数
        int rownum = 1;
        //定义 paySum计算总金额的
        double paySums = 0d;
        //电子表格开始
        beginSheet();
        //创建collection对象 获取对应数据库中数据表中的数据
        DBCollection collection = MongoConnect.getInstance().getDB().getCollection("bill_report_proxy_global");
        //创建一个基本数据库对象，存放数据
        DBObject where=new BasicDBObject();
        //调用这个方法可支持条件查询
        // setQueryCondition(query);
        //获取到信息，放进去
        where.putAll(query);
        //找到所对应的对象
        DBCursor cursor = collection.find(where).sort(new BasicDBObject().append("_id",1));
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
                    if ("payAcc".equals(heads.get(i).getFieldId())) {
                        //计算总金额
                        paySums += Double.parseDouble(String.valueOf(temp));
                    }
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
                    String desc=temp==null?"":temp.toString();
                    if(temp!=null && (heads.get(i).getFieldId().equals("consumption"))||temp!=null && (heads.get(i).getFieldId().equals("phonefee"))||temp!=null && (heads.get(i).getFieldId().equals("smsFee"))||temp!=null && (heads.get(i).getFieldId().equals("numberFee"))||temp!=null && (heads.get(i).getFieldId().equals("fourhundredFee"))||temp!=null && (heads.get(i).getFieldId().equals("channelfee"))){
                        //数值类型转换（对应当月运营成本）
                        desc= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    }
                    createCell(i,desc);
                }
            }
            endRow();//结束
            rownum++;//行数++
        }//while循环里面


        //创建统计行
        insertRow(rownum);
        endRow();
        endSheet();
    }
    //对应的表头的信息
    public List<ExportModelVo> getHeaders(){
        List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("_id");
        field1.setFieldName("编号");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("year");
        field2.setFieldName("年份");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("month");
        field3.setFieldName("月份");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("channelNum");
        field4.setFieldName("渠道总数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("payChannelNum");
        field5.setFieldName("付费渠道数");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("channelSum");
        field6.setFieldName("本月付费渠道数");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("channelfee");
        field7.setFieldName("本月渠道消费金额(元)");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("consumption");
        field8.setFieldName("本月坐席消费金额(元)");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("phonefee");
        field9.setFieldName("本月话费消费金额(元)");
        field9.setDicName("");
        list.add(field9);

        ExportModelVo field10=new ExportModelVo();
        field10.setFieldId("smsFee");
        field10.setFieldName("本月短信消费金额(元)");
        field10.setDicName("");
        list.add(field10);

        ExportModelVo field11=new ExportModelVo();
        field11.setFieldId("numberFee");
        field11.setFieldName("本月号码消费金额(元)");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12=new ExportModelVo();
        field12.setFieldId("fourhundredFee");
        field12.setFieldName("本月400消费金额(元)");
        field12.setDicName("");
        list.add(field12);

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
}
