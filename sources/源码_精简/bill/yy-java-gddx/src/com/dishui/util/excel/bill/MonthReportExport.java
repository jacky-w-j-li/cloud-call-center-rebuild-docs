package com.dishui.util.excel.bill;

import com.dishui.bill.service.Utils;
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
public class MonthReportExport extends XssfWriter {
    private static Logger log = Logger.getLogger(MonthReportExport.class.getName());
    public Map<String, Map<String, String>> dics = new HashMap<String, Map<String, String>>();

    public void generate(Map<String, Object> query) throws Exception {
        List<ExportModelVo> heads = getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_report_business_month");
        DBObject where = new BasicDBObject();
        where.putAll(query);
        DBCursor cursor = collection.find(where).sort(new BasicDBObject().append("_id", 1));
        genrateHeader(heads);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for (int i = 0; i < heads.size(); i++) {
                Object temp = obj.get(heads.get(i).getFieldId());
                if (temp != null && heads.get(i).getDicName() != null && !heads.get(i).getDicName().equals("")) {
                    String dicName = heads.get(i).getDicName();
                    String desc = "";
                    desc = dics.get(dicName).get(temp);
                    createCell(i, desc);
                } else {
                    String desc = temp == null ? "" : temp.toString();
                    if (temp != null && (heads.get(i).getFieldId().equals("lineCost")) || temp != null && (heads.get(i).getFieldId().equals("payUse"))) {
                        desc = Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    }
                    createCell(i, desc);
                }
            }
            endRow();
            rownum++;
        }

        //电子表格结束
        endSheet();

    }

    //对应的表头的信息
    public List<ExportModelVo> getHeaders() {
        List<ExportModelVo> list = new ArrayList<ExportModelVo>();

        ExportModelVo field1 = new ExportModelVo();
        field1.setFieldId("_id");
        field1.setFieldName("编号");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2 = new ExportModelVo();
        field2.setFieldId("year");
        field2.setFieldName("年份");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3 = new ExportModelVo();
        field3.setFieldId("month");
        field3.setFieldName("月份");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4 = new ExportModelVo();
        field4.setFieldId("newAcc");
        field4.setFieldName("当月新增企业数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5 = new ExportModelVo();
        field5.setFieldId("lostAcc");
        field5.setFieldName("当月流失企业数");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6 = new ExportModelVo();
        field6.setFieldId("newPayAcc");
        field6.setFieldName("当月新增付费企业数");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7 = new ExportModelVo();
        field7.setFieldId("payAcc");
        field7.setFieldName("当月付费企业数");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8 = new ExportModelVo();
        field8.setFieldId("payAccSum");
        field8.setFieldName("付费企业总数");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field9 = new ExportModelVo();
        field9.setFieldId("accSum");
        field9.setFieldName("企业总数");
        field9.setDicName("");
        list.add(field9);

        ExportModelVo field10 = new ExportModelVo();
        field10.setFieldId("payRate");
        field10.setFieldName("付费率");
        field10.setDicName("");
        list.add(field10);

        ExportModelVo field11 = new ExportModelVo();
        field11.setFieldId("paySum");
        field11.setFieldName("充值总金额");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12 = new ExportModelVo();
        field12.setFieldId("payUse");
        field12.setFieldName("实际消费金额");
        field12.setDicName("");
        list.add(field12);

        ExportModelVo field13 = new ExportModelVo();
        field13.setFieldId("lineCost");
        field13.setFieldName("当月运营成本");
        field13.setDicName("");
        list.add(field13);

        return list;
    }

    //加载表头的方法
    public void genrateHeader(List<ExportModelVo> list) throws Exception {
        insertRow(0);
        for (int i = 0; i < list.size(); i++) {
            createCell(i, list.get(i).getFieldName());
        }
        endRow();
    }
}
