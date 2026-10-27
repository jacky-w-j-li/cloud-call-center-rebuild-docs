package com.dishui.server.handler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.excel.CustomerImport;
import com.dishui.util.excel.ExcelReadUtil;
import com.dishui.util.excel.QuickReplyListImport;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

public class QuickreplyImportTaskHandler implements Runnable{
    private static Logger logger = Logger.getLogger(QuickreplyImportTaskHandler.class.getName());
    private String accountId;
    private String moduleType;//区别邮件和在线咨询,模块类型:自定义模块,系统通用模块
    private String dbType;
    private String batchNo;
    private String taskId;
    private boolean keepRunning = false;
    private boolean isName=false;
    private boolean isPhone=false;
    public static int batchCount=1000;
//    private C5Response response;
	public QuickreplyImportTaskHandler(String accountId,String moduleType) throws InterruptedException{
        logger.info("start "+accountId+" import task");
        this.accountId=accountId;
        this.moduleType = moduleType;
        keepRunning=true;
        Thread t=new Thread(this,"import task["+accountId+"]");
        t.setDaemon(true);
        t.start();
		t.join();
//		ImportHandler.quickReplyImpTasks.remove(this.accountId);
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
                    if(type.equals("quickreply")){
                    	insertQuickReplyTaskDB(task);
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
                ImportHandler.quickReplyImpTasks.remove(this.accountId);
                logger.info("end "+accountId+" import task");
            }
        }
    }
    public String getAccountId() {
        return accountId;
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
        ExcelReadUtil.process(rowHandler,fileName,trueName);
        rowHandler.processEndRow();
    }
   
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
    
    private void insertQuickReplyTaskDB(DBObject task){
        String fileId=task.get("fileName").toString();
        String trueName=task.get("trueName").toString();
        updateTaskStatus(taskId,"import",null);
        QuickReplyListImport rowHandler=new QuickReplyListImport(task);
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }
}
