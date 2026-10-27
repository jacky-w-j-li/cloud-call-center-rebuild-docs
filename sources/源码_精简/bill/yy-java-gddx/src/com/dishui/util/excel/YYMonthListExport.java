package com.dishui.util.excel;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class YYMonthListExport extends XssfWriter {
    private static Logger log = Logger.getLogger(LLMonthListExport.class.getName());
    public Map<String, Map<String, String>> dics = new HashMap<String, Map<String, String>>();


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        List<ExportModelVo> heads = getHeaders();
        //电子表格开始
        int rownum = 1;
        beginSheet();
        DBCollection collection = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_voiceVerify_consume");
        DBObject where = new BasicDBObject();
        where.putAll(query);
        DBCursor cursor = collection.find(where);
        genrateHeader(heads);

        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            for (int i = 0; i < heads.size(); i++) {
                Object temp = obj.get(heads.get(i).getFieldId());
                if ("yearMonth".equals(heads.get(i).getFieldId())) {
                    temp = "" + obj.get("year") + "-" + obj.get("month");
                } else if ("actualConsume".equals(heads.get(i).getFieldId())) {
                    temp = Utils.formatRound2Money(Long.valueOf(temp.toString()));
                }

                if (temp != null && heads.get(i).getDicName() != null && !heads.get(i).getDicName().equals("")) {
                    String desc = "";
                    createCell(i, desc);
                } else {
                    createCell(i, temp == null ? "" : temp.toString());
                }
            }
            endRow();
            rownum++;
        }

        //电子表格结束
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
        field1.setFieldId("yearMonth");
        field1.setFieldName("月份");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2 = new ExportModelVo();
        field2.setFieldId("actualConsume");
        field2.setFieldName("实际消费(元)");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3 = new ExportModelVo();
        field3.setFieldId("num");
        field3.setFieldName("语音验证码个数");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4 = new ExportModelVo();
        field4.setFieldId("minutes");
        field4.setFieldName("总时长(分钟)");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5 = new ExportModelVo();
        field5.setFieldId("createTime");
        field5.setFieldName("创建时间");
        field5.setDicName("");
        list.add(field5);

        return list;
    }

}
