package com.dishui.util.excel.handler;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.excel.XssfWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class BillTelRecordExport extends XssfWriter {
    public static String DB_TEL_RECORD = "call_sheet_bill_query";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        DBObject condition = new BasicDBObject();
        condition.putAll(query);
        DBCollection collection = MongoConnect.getInstance().getDB().getCollection(DB_TEL_RECORD);
        List<DBObject> accoundIds = collection.distinct("ACCOUNT_ID", condition);
        List<DBObject> lingList = MongoProvider.find("manager_server_board_gatewayRoute",new BasicDBObject());
        DBObject accountCondition = new BasicDBObject();
        accountCondition.put("_id", new BasicDBObject().append("$in", accoundIds));
        List<DBObject> accounts = MongoProvider.find("app_account", accountCondition);
        Map<String, DBObject> accountMap = new HashMap<String, DBObject>();
        for (DBObject obj : accounts) {
            accountMap.put((String) obj.get("_id"), obj);
        }
        Map<String,DBObject> lineMap = new HashMap<String,DBObject>();
        for(DBObject obj : lingList){
            lineMap.put((String) obj.get("number"),obj);
        }
        DBCursor cursor = collection.find(condition);
        //电子表格开始
        int rownum = 1;
        beginSheet();
        String[] headers = {"账户编号", "账户名称", "公司名称", "主叫号码", "被叫号码", "呼叫类型","呼叫线路", "开始时间", "结束时间", "通话时长(秒)", "通话时长(分)","通话时长(6秒)", "呼叫地区(省)", "呼叫地区(市)", "扣费金额"};
        String[] values = {"ACCOUNT_ID", "ACCOUNT_NAME", "ACCOUNT_COMPANY", "CALL_NO", "CALLED_NO", "CALL_TYPE","CALL_LINE", "BEGIN_TIME", "END_TIME", "CALL_TIME_LENGTH", "CALL_MINITES","CALL_SEC6", "CALLEE_PROVICE", "CALLEE_CITY", "CALL_FARE"};
        genrateHeader(headers);
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            insertRow(rownum);
            String accountId = String.valueOf(obj.get(values[0]));
            for (int i = 0; i < values.length; i++) {
                String value = String.valueOf(obj.get(values[i]));
                if (values[i].equals("CALL_FARE")) {
                    value = String.valueOf(Long.parseLong(value) / 1000.0);
                    BigDecimal mData = new BigDecimal(value).setScale(2, BigDecimal.ROUND_HALF_UP);
                    value = mData.toString();
                } else if (values[i].equals("ACCOUNT_NAME")) {
                    value = String.valueOf(accountMap.get(accountId).get("name"));
                } else if (values[i].equals("ACCOUNT_COMPANY")) {
                    value = String.valueOf(accountMap.get(accountId).get("company"));
                } else if (values[i].equals("CALL_LINE")){
                    value = String.valueOf(lineMap.get(value).get("name"));
                }
                createCell(i, value);
            }
            endRow();
            rownum++;
        }
        endSheet();
    }

    public void genrateHeader(String[] headers) throws Exception {
        insertRow(0);
        for (int i = 0; i < headers.length; i++) {
            createCell(i, headers[i]);
        }
        endRow();
    }

}
