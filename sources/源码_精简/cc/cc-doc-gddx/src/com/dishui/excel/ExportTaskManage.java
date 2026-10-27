package com.dishui.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by hotchwong on 16/9/19.
 */
public class ExportTaskManage{
    private static Logger log= Logger.getLogger(ExportTaskManage.class.getName());
    private static final String app_export_task="app_export_task";

    private static final int LIMIT_NUM = 10;
    private static Thread processor;
    private static ExportTaskManage instance = null;

    private static final int queueNum = 5;
    private ThreadPoolExecutor executor;

    private ExportTaskManage() {
        instance = this;
        executor = new ThreadPoolExecutor(10, 10, 600, TimeUnit.SECONDS,new LinkedBlockingQueue<Runnable>(queueNum));
        processor = new Thread("ExportTaskManage"){
            @Override
            public void run() {
                log.info("ExportTaskManage start ...");
                while (true) {
                    try {
                        long time = System.currentTimeMillis();
                        BasicDBObject condition = new BasicDBObject();
                        condition.put("flag", "start");
                        List<DBObject> eventList = MongoProvider.getConection(app_export_task).find(condition).limit(LIMIT_NUM).toArray();
                        if(eventList == null || eventList.size() == 0) {
                            sleep(2000);
                            continue;
                        }
                        for (DBObject dbObject : eventList) {
                            try{
                                String id = String.valueOf(dbObject.get("_id"));
                                String account = String.valueOf(dbObject.get("accountId"));
                                String type = String.valueOf(dbObject.get("type"));
                                updateTaskStatus(id,"export",null,null);

                                String queryJson = String.valueOf(dbObject.get("query"));
                                JSONReader reader = new JSONReader();
                                Map<String, Object> queryObj = (Map<String, Object>) reader.read(queryJson);

                                log.info("threadPool：" + executor.getPoolSize() + "，queue：" +
                                        executor.getQueue().size() + "，finish：" + executor.getCompletedTaskCount());

                                int size=executor.getQueue().size();
                                if(size>=queueNum-1){
                                    log.log(Level.INFO,"＝＝＝＝＝＝＝entry wait＝＝＝＝＝＝＝");
                                    executor.execute(new EventTask(id,type,queryObj,processor));
                                    synchronized (processor){
                                        processor.wait();
                                    }
                                }else{
                                    executor.execute(new EventTask(id,type,queryObj,processor));
                                }
                            }catch (Exception e){
                                e.printStackTrace();
                                log.log(Level.WARNING, e.getMessage() + dbObject.toString(), e);
                                if (dbObject != null) {
                                    try {
                                        updateTaskStatus(String.valueOf(dbObject.get("_id")),"failure",e.getMessage(),null);
                                    } catch (Exception exception) {
                                        exception.printStackTrace();
                                    }
                                }
                            }
                        }
                        long duration = System.currentTimeMillis() - time;
                        String msg = String.format("%s消耗时间[%d ms]", "process ExportTaskManage", duration);
                        log.log(Level.INFO, msg);
                    } catch (Exception e) {
                        e.printStackTrace();
                        log.log(Level.WARNING, "process ExportTaskManage exception! ", e);
                        try {
                            sleep(1000);
                        } catch (Exception exception) {
                            exception.printStackTrace();
                        }
                    }
                }
            }
        };
    };

    public static ExportTaskManage getInstance() {
        if (instance == null) {
            new ExportTaskManage();
        }
        return instance;
    }


    public void startHandleEvents(){
        processor.start();
    }

    private void updateTaskStatus(String tId,String flag,String failureMsg,String path){
        DBObject query=new BasicDBObject();
        query.put("_id",tId);
        Map map=new HashMap();
        DBObject task=new BasicDBObject();
        if(failureMsg!=null){
            task.put("reason",failureMsg);
        }
        if(path!=null){
            task.put("path",path);
        }
        task.put("flag",flag);
        map.put("$set", task);
        DBObject doc=new BasicDBObject(map);
        MongoProvider.updateOne(app_export_task, query, doc, WriteConcern.SAFE);
    }

    private void handleEvent(Map<String, Object> query,String id,String type) {
        try {
            if(type.equalsIgnoreCase("customer")){
                String handlerType="exportCustomer";
                query.put("handlerType",handlerType);
                XssfWriter writer = new CustomerExport();
                String fileName = writer.process("customerExport", query);
                String[] temp=fileName.split("\\|");
                String path=AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType+"&taskId="+id;
                log.info("exportCustomer path======"+path);
                updateTaskStatus(id,"finish",null,path);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "ExportTaskManage handle event failed", e);
        }
    }
    private class EventTask implements Runnable {
        private Map<String, Object> query;
        private Thread mainThread;
        private String type;
        private String id;
        public EventTask(String id,String type,Map<String, Object> query,Thread t){
            this.id=id;
            this.type=type;
            this.query=query;
            this.mainThread=t;
        }
        @Override
        public void run() {
            handleEvent(query,id,type);
            int size=executor.getQueue().size();
            synchronized (mainThread){
                if(size<queueNum){
                    mainThread.notify();
                }
            }
        }
    }
}
