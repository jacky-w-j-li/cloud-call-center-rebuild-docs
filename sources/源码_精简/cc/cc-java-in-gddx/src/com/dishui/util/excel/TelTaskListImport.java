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


public class TelTaskListImport implements RowHandler {
    private static Logger logger = Logger.getLogger(TelListImport.class.getName());
    public final static String TB_AUTOCALL="app_autocall_import";
    public final static String TB_REPEAT="app_autocall_repeat_new";
//    public final int batchCount=1000;

    public List<DBObject> rows=null;
    public List<DBObject> repeatRows=null;
    private String accountId="";
    private String batchNo="";
    private String taskId="";
    private String taskName="";
    private boolean isPhone=false;

    public TelTaskListImport(DBObject task){
        rows=new ArrayList<DBObject>();
        repeatRows=new ArrayList<DBObject>();
        accountId=task.get("accountId").toString();
        batchNo=task.get("batchNo").toString();
        taskId=task.get("taskId").toString();
        taskName=task.get("taskName").toString();
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
        row.put("taskId", this.taskId);
        row.put("taskName", this.taskName);
//        row.put("called", false);
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
                updateBdTaskNum(rows.size());
                updateImportTaskImpNum(rows.size());
//                logger.info("telList import thread:"+current.getName());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
//            Thread current = Thread.currentThread();
//            logger.info("telList import thread:"+current.getName());
/*            int start=0;
            int end=100;
            for (int i = 0; i <10 ; i++) {
                if(end>rows.size()){
                    end=rows.size();
                }
//                System.out.println("start="+start+",end=="+end);
                DealDB t=new DealDB(rows.subList(start,end));
                t.start();
                start+=100;
                end+=100;
            }*/
//            updateBdTaskNum(rows.size());
//            updateImportTaskImpNum(rows.size());
            MongoProvider.batchInsert("cc_autocall", TB_AUTOCALL, rows);
            rows.clear();
        }
        if(repeatRows.size()>0 && repeatRows.size()%ImportHandler.batchCount==0){
            try {
                Thread current = Thread.currentThread();
                current.sleep(1000);
                updateImportTaskRepeatNum(repeatRows.size());
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
            /*int threadCount=10;
            int start=0;
            int count=rows.size()/threadCount;
            int end=count;
            for (int i = 0; i <threadCount ; i++) {
                if(end>rows.size()){
                    end=rows.size();
                }
//                System.out.println("start="+start+",end=="+end);
                DealDB2 t=new DealDB2(rows.subList(start,end));
                t.start();
                start+=count;
                end+=count;
            }*/
            MongoProvider.batchInsert("cc_autocall",TB_AUTOCALL, rows);
            updateBdTaskNum(rows.size());
            updateImportTaskImpNum(rows.size());
            rows.clear();
        }
        if(repeatRows.size()>0){
            MongoProvider.batchInsert("cc_autocall",TB_REPEAT, repeatRows);
            updateImportTaskRepeatNum(repeatRows.size());
            repeatRows.clear();
        }
    }

    public long queryRepeatCount2Phone(String phone){
        if(phone==null) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("account",this.accountId);
        doc.put("num",phone);
        long count= MongoProvider.count("cc_autocall",TB_AUTOCALL, doc);
        return count;
    }
    private void updateBdTaskNum(int num){
        DBObject query=new BasicDBObject();
        query.put("_id",this.taskId);
        DBObject doc=new BasicDBObject();
        doc.put("$inc",new BasicDBObject("total",num));
        MongoProvider.updateByDB("cc_autocall_task","app_autocall_task",query,doc);
    }
    private void updateImportTaskImpNum(int num){
        DBObject query=new BasicDBObject();
        query.put("accountId",this.accountId);
        query.put("batchNo",this.batchNo);
        DBObject doc=new BasicDBObject();
        doc.put("$inc",new BasicDBObject("impNum",num));
        MongoProvider.update("app_import_task",query,doc);
    }
    private void updateImportTaskRepeatNum(int num){
        DBObject query=new BasicDBObject();
        query.put("accountId",this.accountId);
        query.put("batchNo",this.batchNo);
        DBObject doc=new BasicDBObject();
        doc.put("$inc",new BasicDBObject("repeatNum",num));
        MongoProvider.update("app_import_task",query,doc);
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
/*

class DealDB extends Thread{
    List<DBObject> _rows=new ArrayList<DBObject>();
    public  DealDB(List<DBObject> list){
        _rows.addAll(list);
//        System.out.println((_rows==list)+"----"+_rows.hashCode()+"----"+list.hashCode());
    }
    public void run(){
        System.out.println(currentThread().getName()+"----"+_rows.size());
        MongoProvider.batchInsert("cc_autocall", TelTaskListImport.TB_AUTOCALL, _rows);
        _rows=null;
    }
}

class DealDB2 extends Thread{
    List<DBObject> _rows=new ArrayList<DBObject>();
    int count=100;
    public  DealDB2(List<DBObject> list){
        _rows.addAll(list);
    }
    public void saveDB(){
    }
    public void run(){
        System.out.println(currentThread().getName()+"----"+_rows.size());
        int start=0;
        int end=count;
        int num=_rows.size()/count;
        for (int i = 0; i <num ; i++) {
            if(end>_rows.size()){
                end=_rows.size();
            }
            MongoProvider.batchInsert("cc_autocall", TelTaskListImport.TB_AUTOCALL, _rows.subList(start,end));
            try {
                sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            start+=count;
            end+=count;
        }

    }
}*/
