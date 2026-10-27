package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.exception.SaxParserHeadException;
import com.dishui.manager.service.Utils;
import com.dishui.server.handler.ImportHandler;
import com.dishui.util.CommonUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CustomerTaskImport implements RowHandler {
    private static final String CUSTOMER_SAMPLE="_customer_sample";
    private static final String CUSTOMER_DIAL_TASK="customer_dial_task";
    private static final String CUSTOMER_SAMPLE_REPEAT="customer_sample_repeat";

    public List<String> heads=null;
    public Map<String,String> phones=new HashMap<String,String>();
    public List<DBObject> rows=null;
    public List<DBObject> repeatRows=null;
//    private int curSumRow = 0;
    private String accountId="";
    private String userId="";
    private String batchNo="";
    private String taskId="";
    private String filterType="global";//global，allPlan，plan
    private String memo="";
    private String owner="";
    private String status="";
    public CustomerTaskImport(DBObject task){
        rows=new ArrayList<DBObject>();
        repeatRows=new ArrayList<DBObject>();
        accountId=task.get("accountId").toString();
        userId=task.get("creator").toString();
        taskId=task.get("taskId").toString();
        batchNo=task.get("batchNo").toString();
        status=task.get("status").toString();
        filterType=(String)task.get("isPhone");
        heads=(ArrayList)task.get("heads");
    }
    private void addBlankCell(List<String> collist){
        int len=heads.size();
        int len2=collist.size();
        if(len2<len){
            for (int i = 0; i <len-len2 ; i++) {
                collist.add("");
            }
        }
    }
    @Override
    public void processRow(int sheetIndex, int curRow, List<String> collist) {
        if(heads==null) return;
        if(curRow==0) return;//clear row head
//        if(curSumRow >= 10000){
//            throw new SaxParserHeadException("501","导入数据超出1万条");
//        }
//        curSumRow ++;//累计总数
        addBlankCell(collist);
        DBObject row=new BasicDBObject();
//        String[] tels=null;
        List<String> telList=new ArrayList<String>();

        for (int i = 0; i < heads.size(); i++) {
            String field=heads.get(i);
            if("".equals(field)){
                continue;
            }
            String cell=collist.get(i);
            if(cell==null)cell="";
            cell=cell.trim();

            if("phone".equals(field)){
                if(cell.equals("")){   // 忽略没号码的
                    return;
                }
                BasicDBList l=new BasicDBList();
//                tels=cell.split(",|，|/|\\\\|、");
//                if(tels!=null && tels.length>0){
//                    for (int j = 0; j < tels.length; j++) {
//                        if(!"".equals(tels[j].trim())){
//                            String tempTel= CommonUtil.clearPhone(tels[j].trim());
//                            telList.add(tempTel);
//                            DBObject phone=new BasicDBObject();
//                            phone.put("tel", tempTel);
//                            phone.put("memo", "");
//                            l.add(phone);
//                        }
//                    }
//            }

                    if(!"".equals(cell.trim())){
                        String tempTel= CommonUtil.clearPhone(cell.trim());
                        telList.add(tempTel);
                        row.put(field, tempTel);
                    }
                continue;
            }
//            if("note".equals(field)){
//                row.put("memo",cell);
//                continue;
//            }
            row.put(field, cell);
        }
        String id= Utils.getUniqueid();
        String time= Utils.getCurrentDate();
        row.put("_id", id);
        row.put("createTime", time);
        row.put("account", this.accountId);
        row.put("batchNo", this.batchNo);
        row.put("creator", this.userId);
        row.put("owner", "NA");
        row.put("taskId", this.taskId);
        row.put("dialStatus","NA");
        row.put("dialTag","NA");
        long duration = System.currentTimeMillis();
        row.put("lastTime",duration);
        checkPhone(telList.toArray(new String[telList.size()]),row,this.filterType);

        if(rows.size()>0 &&rows.size()% ImportHandler.batchCount==0){
            MongoProvider.batchInsert(this.accountId + CUSTOMER_SAMPLE, rows, this.accountId);
            //累加外呼任务客户
            DBObject updateCondition = new BasicDBObject().append("_id", taskId);
            DBObject updateDoc = new BasicDBObject();
            updateDoc.put("$set", new BasicDBObject().append("lastTime", Utils.getCurrentDate()));
            updateDoc.put("$inc", new BasicDBObject().append("total", rows.size()));
            MongoProvider.update(CUSTOMER_DIAL_TASK, updateCondition, updateDoc);
            rows.clear();

        }
        if(repeatRows.size()>0 && repeatRows.size()% ImportHandler.batchCount==0){
            MongoProvider.batchInsert(CUSTOMER_SAMPLE_REPEAT, repeatRows);
            repeatRows.clear();
        }
    }
    private void checkPhone(String[] tels,DBObject row,String type){
        int repeatNum=0;
        if(tels!=null && tels.length>0){
            for (int j = 0; j < tels.length; j++) {//check selfrepeat
                if(phones.get(tels[j])!=null){
                    if(repeatNum>0){
                        break;
                    }
                    row.put("reason","phone");
                    repeatRows.add(row);
                    repeatNum++;
                }else{
                    phones.put(tels[j], "");
                }
            }
        }

        if(repeatNum==0){
            long num=0;
            if(type.equals("global")){
                num=filterSample(tels);
                if(num==0){
                    num=filterCustomerByPhone(tels);
                }
            }else if(type.equals("allPlan")){
                num=filterSample(tels);
            }else if(type.equals("plan")){
                num=filterSingleSample(tels);
            }
            if(num>0){
                row.put("reason","phone");
                repeatRows.add(row);
                repeatNum++;
            }else{
                rows.add(row);

            }
        }
    }

    public void processEndRow() {
        if(rows.size()>0){
            MongoProvider.batchInsert(this.accountId + CUSTOMER_SAMPLE, rows, this.accountId);
            //累加外呼任务客户
            DBObject updateCondition = new BasicDBObject().append("_id", taskId);
            DBObject updateDoc = new BasicDBObject();
            updateDoc.put("$set", new BasicDBObject().append("lastTime", Utils.getCurrentDate()));
            updateDoc.put("$inc", new BasicDBObject().append("total", rows.size()));
            MongoProvider.update(CUSTOMER_DIAL_TASK, updateCondition, updateDoc);
            rows.clear();
        }
        if(repeatRows.size()>0){
            MongoProvider.batchInsert(CUSTOMER_SAMPLE_REPEAT, repeatRows);
            repeatRows.clear();
        }
        phones.clear();
    }

    public DBObject getCustTmpl(String id){
        DBObject result= MongoProvider.findOne("customer_template", new BasicDBObject("_id", id));
        return result;
    }

    public long filterSingleSample(String[] phone){
        if(phone==null || phone.length<=0) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("taskId",this.taskId);
        doc.put("phone",new BasicDBObject("$in",phone));
        long count= MongoProvider.count(this.accountId + CUSTOMER_SAMPLE, doc, this.accountId);
        return count;
    }
    public long filterSample(String[] phone){
        if(phone==null || phone.length<=0) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("phone",new BasicDBObject("$in",phone));
        long count= MongoProvider.count(this.accountId + CUSTOMER_SAMPLE, doc, this.accountId);
        return count;
    }
    public long filterCustomerByPhone(String[] phone){
        if(phone==null || phone.length<=0) return 0;
        DBObject doc=new BasicDBObject();
        doc.put("phone.tel",new BasicDBObject("$in",phone));
        long count= MongoProvider.count(this.accountId + "_customer", doc, this.accountId);
        return count;
    }
}
