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
 * Created by Administrator on 2015/10/1.
 */
public class SalesPersonalMonthExport extends XssfWriter {

    private static Logger log = Logger.getLogger(SalesPersonalMonthExport.class.getName());
    public Map<String, Map<String, String>> dics = new HashMap<String, Map<String, String>>();


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        List<ExportModelVo> heads = getHeaders();
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("bill_sales_personal_month");
        DBObject where = new BasicDBObject();
        where.putAll(query);
        DBCursor cursor = collection.find(where).sort(new BasicDBObject().append("month", 1));
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
                    if (temp != null && (heads.get(i).getFieldId().equals("licensesFee")) || temp != null && (heads.get(i).getFieldId().equals("callFee")) || temp != null && (heads.get(i).getFieldId().equals("smsFee")) || temp != null && (heads.get(i).getFieldId().equals("numberFee")) || temp != null && (heads.get(i).getFieldId().equals("consumSum"))||temp != null && (heads.get(i).getFieldId().equals("400consume"))) {
                        desc = Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    }
                    createCell(i, desc);
                }
            }
            endRow();
            rownum++;
        }

        endSheet();

    }

    public void genrateHeader(List<ExportModelVo> list) throws Exception {
        insertRow(0);
        for (int i = 0; i < list.size(); i++) {
            createCell(i, list.get(i).getFieldName());
        }
        endRow();
    }

    public List<ExportModelVo> getHeaders() {
        List<ExportModelVo> list = new ArrayList<ExportModelVo>();

        ExportModelVo field1 = new ExportModelVo();
        field1.setFieldId("salesName");
        field1.setFieldName("名称");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2 = new ExportModelVo();
        field2.setFieldId("month");
        field2.setFieldName("月份");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3 = new ExportModelVo();
        field3.setFieldId("payAccSum");
        field3.setFieldName("总付费企业数");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4 = new ExportModelVo();
        field4.setFieldId("currentMonthPayAcc");
        field4.setFieldName("本月付费企业数");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5 = new ExportModelVo();
        field5.setFieldId("newCurrentPayAcc");
        field5.setFieldName("本月新增付费企业数");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6 = new ExportModelVo();
        field6.setFieldId("rechargeMoney");
        field6.setFieldName("本月充值金额(元)");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7 = new ExportModelVo();
        field7.setFieldId("consumSum");
        field7.setFieldName("本月消费金额(元)");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8 = new ExportModelVo();
        field8.setFieldId("licensesFee");
        field8.setFieldName("本月坐席消费金额(元)");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field9 = new ExportModelVo();
        field9.setFieldId("callFee");
        field9.setFieldName("本月话费(元)");
        field9.setDicName("");
        list.add(field9);

        ExportModelVo field10 = new ExportModelVo();
        field10.setFieldId("smsFee");
        field10.setFieldName("本月短信费(元)");
        field10.setDicName("");
        list.add(field10);

        ExportModelVo field11 = new ExportModelVo();
        field11.setFieldId("numberFee");
        field11.setFieldName("本月号码费(元)");
        field11.setDicName("");
        list.add(field11);

        ExportModelVo field12 = new ExportModelVo();
        field12.setFieldId("400consume");
        field12.setFieldName("本月400消费(元)");
        field12.setDicName("");
        list.add(field12);

        return list;
    }
}
