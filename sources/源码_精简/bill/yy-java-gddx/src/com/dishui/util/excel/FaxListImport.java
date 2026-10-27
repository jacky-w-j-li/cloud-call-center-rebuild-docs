package com.dishui.util.excel;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;

public class FaxListImport implements RowHandler{
    public final static String TB_AUTOFAX="platform_autofax";
    public final static String TB_REPEAT="user_fax_repeat";
    public final int batchCount=1000;

    public List<DBObject> rows=null;
    public List<DBObject> repeatRows=null;
    private String accountId="";
    private String batchNo="";
    private boolean isPhone=false;

    public FaxListImport(DBObject task){
        rows=new ArrayList<DBObject>();
        repeatRows=new ArrayList<DBObject>();
        accountId=task.get("accountId").toString();
        batchNo=task.get("batchNo").toString();
        isPhone=(Boolean)task.get("isPhone");
    }

    @Override
    public void processRow(int sheetIndex, int curRow, List<String> collist) {
        DBObject row=new BasicDBObject();
        String cell=collist.get(0);
        if(cell==null)cell="";
        cell=cell.trim();
        row.put("num", cell);

        String id= Utils.getUniqueid();
        String time=Utils.getCurrentDate();
        row.put("_id", id);
        row.put("account", this.accountId);
        row.put("batchNo", this.batchNo);
        row.put("called", false);
        row.put("reason", "none");
//        row.put("createTime", time);

        if(!isPhone){
            rows.add(row);
        }else{
            checkPhone(cell,row);
        }

        if(rows.size()>0 &&rows.size()%batchCount==0){
            MongoProvider.batchInsert(TB_AUTOFAX, rows);
            rows.clear();
        }
        if(repeatRows.size()>0 && repeatRows.size()%batchCount==0){
            MongoProvider.batchInsert(TB_REPEAT, repeatRows);
            repeatRows.clear();
        }
    }
    private void checkPhone(String tel,DBObject row){
        long num=queryRepeatCount2Phone(tel);
        if(num>0){
            row.put("reason","phone");
            repeatRows.add(row);
        }else{
            rows.add(row);
        }
    }

    public void processEndRow() {
        if(rows.size()>0){
            MongoProvider.batchInsert(TB_AUTOFAX, rows);
            rows.clear();
        }
        if(repeatRows.size()>0){
            MongoProvider.batchInsert(TB_REPEAT, repeatRows);
            repeatRows.clear();
        }
    }

    public long queryRepeatCount2Phone(String phone){
        if(phone==null) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("account",this.accountId);
        doc.put("num",phone);
        doc.put("called",false);
        long count=MongoProvider.count(TB_AUTOFAX, doc);
        return count;
    }

    public boolean isPhone() {
        return isPhone;
    }
    public void setPhone(boolean isPhone) {
        this.isPhone = isPhone;
    }

    public static void main(String[] args) {

    }
}
