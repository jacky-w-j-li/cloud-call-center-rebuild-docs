package com.dishui.server.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.excel.*;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;


public class ImportTaskHandler implements Runnable{
    private static Logger logger = Logger.getLogger(ImportTaskHandler.class.getName());
    private String accountId;
    private String dbType;
    private String batchNo;
    private String taskId;
    private boolean stopFlag = false;
    private boolean keepRunning = false;
    private boolean isName=false;
    private boolean isPhone=false;
    public static int batchCount=1000;
    public ImportTaskHandler(String accountId){
        logger.info("start "+accountId+" import task");
        this.accountId=accountId;
        keepRunning=true;
        DBObject doc=new BasicDBObject();
        doc.put("account",this.accountId);
        doc.put("product","cc");
        Thread t=new Thread(this,"import task["+accountId+"]");
        t.setDaemon(true);
        t.start();
    }
    @Override
    public void run() {
        while(keepRunning){
            List<DBObject> tasks=queryTask();
            if(tasks.size()>0){
                try {
                    DBObject task=tasks.remove(0);
                    String type=(String)task.get("type");
                    taskId=(String)task.get("_id");
                    logger.info(accountId+":::task[id]====== "+taskId);
                    if(type.equals("tellist")){
//                        insertTelDB(task); //旧的批量外呼，已做废
                    }else if(type.equals("telTasklist")){
                        insertTelTaskDB(task);
                    }else if(type.equals("questionnaire")){
                        insertQuestionnaireDB(task);
                    }else if(type.equals("customerTask")){
                        insertCustomerTaskDB(task);
                    }else if(type.equals("sms")){
                        insertSmsTaskDB(task);
                    }else if(type.equals("templateSms")){
                        insertTemplateSmsTaskDB(task);
                    }else{
                        insertCustomerDB(task);
                    }
                    updateTaskStatus(taskId,"finish",null);
                } catch (Exception e) {
                    e.printStackTrace();
                    logger.log(Level.WARNING,e.getMessage());
                    updateTaskStatus(taskId,"failure",e.getMessage());
                }
            }else{
                keepRunning=false;
                ImportHandler.impTasks.remove(this.accountId);
                logger.info("end "+accountId+" import task");
            }

        }
    }
    public String getAccountId() {
        return accountId;
    }
    public void setStopFlag(boolean stopFlag) {
        this.stopFlag = stopFlag;
    }
    public boolean getStopFlag() {
        return this.stopFlag;
    }
    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }
    public void processTask(){

    }
    //parse excel and insert db
    private void insertCustomerDB(DBObject task){/*_id,batchNo,fileName,accountId,flag,heads,dic,status,source1,source2,dbType*/
        String fileName=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
        dbType=task.get("dbType").toString();
//		batchNo=task.get("batchNo").toString();
        updateTaskStatus(taskId,"import",null);
        CustomerImport rowHandler=new CustomerImport(task);
        this.isName=rowHandler.isName();
        this.isPhone=rowHandler.isPhone();
//		String path=AppConfig.getInstance().getVar("file.dir")+fileName;
        ExcelReadUtil.processCustomer(rowHandler,fileName,trueName);
        rowHandler.processEndRow();
    }
    //解析外呼任务导入客户文件并插入到数据库
    private void insertCustomerTaskDB(DBObject task){/*_id,taskId,batchNo,fileName,accountId,flag,heads,dic,status,source1,source2,dbType*/
        String fileName=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
//        dbType=task.get("dbType").toString();
//		batchNo=task.get("batchNo").toString();

        updateTaskStatus(taskId,"import",null);
        CustomerTaskImport rowHandler=new CustomerTaskImport(task);
//        this.isName=rowHandler.isName();
//        this.isPhone=rowHandler.isPhone();
//		String path=AppConfig.getInstance().getVar("file.dir")+fileName;
        ExcelReadUtil.process(rowHandler,fileName,trueName);
        rowHandler.processEndRow();
    }
//	private void filterRepeat(String batchNo){
//		updateTaskStatus(batchNo,"filter");
//		DBObject query= new BasicDBObject();
//		query.put("accountId", this.accountId);
//		query.put("batchNo", batchNo);
//		List<DBObject> result=MongoProvider.find("app_customer_temp",query);
//		if(this.isPhone){
//		}
//		if(this.isName){
//		}
//	}

//	private void insertCustomer(String batchNo){
//		updateTaskStatus(batchNo,"import");
//		
//	}
//	private void insertCustomerRepeat(){
//		
//	}
    /**
     * flag:start,import,finish,failure
     */
    private void updateTaskStatus(String tId,String flag,String failureMsg){
        DBObject query=new BasicDBObject();
//		query.put("accountId",this.accountId);
//		query.put("batchNo",batchNo);
        query.put("_id",tId);
        Map map=new HashMap();
        DBObject task=new BasicDBObject();
        task.put("reason",failureMsg==null?"":failureMsg);
        task.put("flag",flag);
        map.put("$set", task);
        DBObject doc=new BasicDBObject(map);
//		MongoProvider.update("app_import_task", query, doc);
        MongoProvider.updateOne("app_import_task", query, doc, WriteConcern.SAFE);
//        logger.info("end updateTaskStatus::: query="+query+",map==="+map);
    }
    private List<DBObject> queryTask(){
        DBObject doc=new BasicDBObject();
        doc.put("accountId",this.accountId);
        doc.put("flag","start");
        List<DBObject> result=MongoProvider.find("app_import_task", doc);
        return result;
    }

    private void insertTelDB(DBObject task){
        String fileId=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
//        batchNo=task.get("batchNo").toString();
        updateTaskStatus(taskId,"import",null);
        TelListImport rowHandler=new TelListImport(task);
        this.isPhone=rowHandler.isPhone();
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }
    private void insertTelTaskDB(DBObject task){
        String fileId=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
//        batchNo=task.get("batchNo").toString();
        updateTaskStatus(taskId,"import",null);
        TelTaskListImport rowHandler=new TelTaskListImport(task);
        this.isPhone=rowHandler.isPhone();
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }
    private void insertQuestionnaireDB(DBObject task){
        String fileName=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
        dbType=task.get("dbType").toString();
//        batchNo=task.get("batchNo").toString();

        updateTaskStatus(taskId,"import",null);
        QuestionnaireImport rowHandler=new QuestionnaireImport(task);
        ExcelReadUtil.process(rowHandler, fileName,trueName);
        rowHandler.processEndRow();
    }
    private void insertSmsTaskDB(DBObject task){
        String fileId=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
//        batchNo=task.get("batchNo").toString();
        updateTaskStatus(taskId,"import",null);
        SmsListImport rowHandler=new SmsListImport(task);
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }
    private void insertTemplateSmsTaskDB(DBObject task){
        String fileId=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
        updateTaskStatus(taskId,"import",null);
        DBObject acc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",task.get("accountId")+"_cc"));
        if(acc != null && acc.get("smsSplitBaseNum") != null){
            task.put("smsSplitBaseNum", Integer.parseInt(acc.get("smsSplitBaseNum").toString()) );
        }
        SmsTemplateListImport rowHandler=new SmsTemplateListImport(task);
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }
}
