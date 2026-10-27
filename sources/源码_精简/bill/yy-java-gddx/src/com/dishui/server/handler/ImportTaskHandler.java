package com.dishui.server.handler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.excel.CustomerImport;
import com.dishui.util.excel.ExcelReadUtil;
import com.dishui.util.excel.FaxListImport;
import com.dishui.util.excel.TelListImport;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;



public class ImportTaskHandler implements Runnable{
	private static Logger logger = Logger.getLogger(ImportTaskHandler.class.getName());
    private static final String TB_IMPORT_TASK="user_import_task";
	private String accountId;
	private String dbType;
	private String batchNo;
	private boolean keepRunning = false;
	private boolean isName=false;
	private boolean isPhone=false;
	public ImportTaskHandler(String accountId){
		this.accountId=accountId;
		keepRunning=true;
		Thread t=new Thread(this,"import task["+accountId+"]");
		t.setDaemon(true);
		t.start();
	}
	@Override
	public void run() {
		List<DBObject> tasks=queryTask();
		while(keepRunning){
			if(tasks.size()>0){
				try {
					DBObject task=tasks.remove(0);
                    String type=(String)task.get("type");
                    if(type.equals("tellist")){
                        insertTelDB(task);
                    }else if(type.equals("faxlist")){
                        insertFaxDB(task);
                    }else{
                        insertCustomerDB(task);
                    }

                    updateTaskStatus(batchNo,"finish",null);
				} catch (Exception e) {
					e.printStackTrace();
					updateTaskStatus(batchNo,"failure",e.getMessage());
				}
			}else{
				keepRunning=false;
				ImportHandler.impTasks.remove(this.accountId);		
			}

		}
	}

	//parse excel and insert db
	private void insertCustomerDB(DBObject task){
		String fileId=task.get("fileId").toString();
		String trueName=task.get("trueName").toString();
		dbType=task.get("dbType").toString();
		batchNo=task.get("batchNo").toString();
		
		updateTaskStatus(batchNo,"import",null);
		CustomerImport rowHandler=new CustomerImport(task);
		this.isName=rowHandler.isName();
		this.isPhone=rowHandler.isPhone();
//		String path=AppConfig.getInstance().getVar("file.dir")+fileName;
		ExcelReadUtil.process(rowHandler, fileId,trueName);
		rowHandler.processEndRow();
	}
    private void insertTelDB(DBObject task){
        String fileId=task.get("fileId").toString();
        String trueName=task.get("trueName").toString();
        batchNo=task.get("batchNo").toString();
        updateTaskStatus(batchNo,"import",null);
        TelListImport rowHandler=new TelListImport(task);
        this.isPhone=rowHandler.isPhone();
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }

    private void insertFaxDB(DBObject task){
        String fileId=task.get("numberFileId").toString();
        String trueName=task.get("numTrueName").toString();
        batchNo=task.get("batchNo").toString();
        updateTaskStatus(batchNo,"import",null);
        FaxListImport rowHandler=new FaxListImport(task);
        this.isPhone=rowHandler.isPhone();
        ExcelReadUtil.process(rowHandler,fileId,trueName);
        rowHandler.processEndRow();
    }

    /**
     * flag:start,import,finish,failure
     */
    private void updateTaskStatus(String batchNo,String flag,String failureMsg){
        DBObject query=new BasicDBObject();
        query.put("accountId",this.accountId);
        query.put("batchNo",batchNo);
        Map map=new HashMap();
        DBObject task=new BasicDBObject();
        task.put("reason",failureMsg==null?"":failureMsg);
        task.put("flag",flag);
        map.put("$set", task);
        DBObject doc=new BasicDBObject(map);
        MongoProvider.update(TB_IMPORT_TASK, query, doc);
    }
    private List<DBObject> queryTask(){
        DBObject doc=new BasicDBObject();
        doc.put("accountId",this.accountId);
        doc.put("flag","start");
        List<DBObject> result=MongoProvider.find(TB_IMPORT_TASK, doc);
        return result;
    }

    public String getAccountId() {
        return accountId;
    }
    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

}
