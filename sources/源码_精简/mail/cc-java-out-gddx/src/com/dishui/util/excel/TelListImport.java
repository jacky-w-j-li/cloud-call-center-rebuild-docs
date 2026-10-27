package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.handler.ImportHandler;
import com.dishui.util.CommonUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;


public class TelListImport implements RowHandler {
    private static Logger logger = Logger.getLogger(TelListImport.class.getName());
    public final static String TB_AUTOCALL="app_autocall";
    public final static String TB_REPEAT="app_autocall_repeat";
//    public final int batchCount=1000;

    public List<DBObject> rows=null;
    public List<DBObject> repeatRows=null;
    private String accountId="";
    private String batchNo="";
    private boolean isPhone=false;

    public TelListImport(DBObject task){
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
//        System.out.println(cell);
        if(cell.equals("")){
            return;
        }
        row.put("num", CommonUtil.clearPhone(cell));

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

        if(rows.size()>0 &&rows.size()% ImportHandler.batchCount==0){
            try {
                Thread current = Thread.currentThread();
                current.sleep(1000);
//                logger.info("telList import thread:"+current.getName());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            MongoProvider.batchInsert("cc_autocall", TB_AUTOCALL, rows);
            rows.clear();
        }
        if(repeatRows.size()>0 && repeatRows.size()%ImportHandler.batchCount==0){
            try {
                Thread current = Thread.currentThread();
                current.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            MongoProvider.batchInsert("cc_autocall",TB_REPEAT, repeatRows);
            repeatRows.clear();
        }
    }
    private void checkPhone(String tel,DBObject row){
        if(rows.size()>0){
            for(DBObject obj : rows){
                if(tel.equals((String)obj.get("num"))){
                    row.put("reason","phone");
                    repeatRows.add(row);
                    return;
                }
            }
        }

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
            MongoProvider.batchInsert("cc_autocall",TB_AUTOCALL, rows);
            rows.clear();
        }
        if(repeatRows.size()>0){
            MongoProvider.batchInsert("cc_autocall",TB_REPEAT, repeatRows);
            repeatRows.clear();
        }
    }

    public long queryRepeatCount2Phone(String phone){
        if(phone==null) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("account",this.accountId);
        doc.put("num",phone);
        doc.put("called",false);
        long count= MongoProvider.count("cc_autocall",TB_AUTOCALL, doc);
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
