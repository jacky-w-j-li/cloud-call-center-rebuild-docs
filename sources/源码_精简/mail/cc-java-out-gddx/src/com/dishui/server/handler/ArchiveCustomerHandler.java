package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by wangmeng on 16/03/10.
 */
public class ArchiveCustomerHandler {
    private static Logger log = Logger.getLogger(ArchiveCustomerHandler.class.getName());
    private Thread archiveThread ;
    public static ArchiveCustomerHandler instance;
    public static boolean isSleep = false;

    public static ArchiveCustomerHandler getInstance(){
        if (instance == null)
            new ArchiveCustomerHandler();
        return instance;
    }

    public ArchiveCustomerHandler(){
        instance = this;
        this.archiveThread = new Thread("customer archive") {
            public void run() {
                while (true) {
                   boolean result = archiveTask();
                    try {
                        if(!result){
                            isSleep = true;
                            sleep(10000);
                            isSleep = false;
                        }
                    } catch (Exception e) {
                        isSleep = false;
                        e.printStackTrace();
                    }
                }
            }
        };
        this.archiveThread.start();
    }

    /**
     * 归档已关闭任务客户
     * 由于归档客户的数量比较大，所以需要开线程进行处理。
     * 具体步骤
     * 收到请求后，先入库   app_customer_archive_task。
     * 如果归档线程空闲，则直接启动线程归档。
     * 如果归档线程正在运行，则排队等待。
     * @param action
     * @return
     */
    public static C5Response archiveCustomer(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String account = action.getStringValue("account");
            String taskId = action.getStringValue("taskId");
            String userId = action.getStringValue("uid");
            DBObject obj = new BasicDBObject();
            obj.put("account",account);
            obj.put("taskId",taskId);
            obj.put("user",userId);
            obj.put("status","wait");
            obj.put("archiveCount",0);
            obj.put("createTime", DateUtil.getCurrentTime());
            MongoProvider.insert("app_customer_archive_task", obj);
            if(instance != null && isSleep){
                instance.archiveThread.interrupt();
            }
            response.setSucceed(true);
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "archive customer error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    /**
     * 归档数据
     */
    protected boolean archiveTask(){
        try{
            DBObject object =  MongoProvider.findOne("app_customer_archive_task", new BasicDBObject().append("status", "wait"));
            if(object != null){
                long time = System.currentTimeMillis();
                long archiveCount = 0;
                while (true){
                    String account = (String)object.get("account");
                    String taskId = (String)object.get("taskId");
                    String userId = (String)object.get("user");
                    DBObject condition=new BasicDBObject();
                    condition.put("account",account);
                    condition.put("taskId",taskId);
                    List<DBObject> idList = new ArrayList<DBObject>();
                    idList =  MongoProvider.find(account + "_customer_sample",condition, new BasicDBObject(), account, 10000);
                    if(idList == null || idList.size() == 0){
                        long duration = System.currentTimeMillis() - time;
                        String msg = String.format("%s消耗时间[%d ms]", "batch del customer", duration);
                        log.info(msg);
                        DBObject updateData = new BasicDBObject();
                        DBObject setData = new BasicDBObject();
                        setData.put("status","finish");
                        setData.put("duration",duration);
                        updateData.put("$set",setData);
                        MongoProvider.update("app_customer_archive_task", new BasicDBObject().append("_id", object.get("_id")), updateData);

                        DBObject updateData1 = new BasicDBObject();
                        DBObject setData1 = new BasicDBObject();
                        String updateTime= Utils.getCurrentDate();
                        setData1.put("status","archive");
                        setData1.put("lastUpdateTime",updateTime);
                        setData1.put("lastUpdater",userId);
                        updateData1.put("$set",setData1);
                        MongoProvider.update("customer_dial_task", new BasicDBObject().append("_id", taskId), updateData1);
                        break;
                    }

                    List<String> ids = new ArrayList<String>();
                    for(DBObject obj : idList){
                        ids.add((String)obj.get("_id"));
                    }
                        int len=idList.size();
                        int last=len%1000;
                        int total=last==0?len/1000:len/1000+1;
//                        System.out.println("len==="+len+",total==="+total+",last==="+last);
                        for (int i = 0; i < total; i++) {
                            int start=i*1000;
                            int end=start+1000;
                            if(i==total-1 && last>0){
                                end=start+last;
                            }
                            MongoProvider.batchInsert("cc","customer_sample_archive",idList.subList(start,end));
                        }

                    DBObject archiveCondition = new BasicDBObject();
                    archiveCondition = new BasicDBObject();
                    archiveCondition.put("_id",new BasicDBObject().append("$in",ids));
                    MongoProvider.remove(account + "_customer_sample", archiveCondition, account);
                    //update
                    DBObject updateData = new BasicDBObject();
                    DBObject setData = new BasicDBObject();
                    setData.put("status","doing");
                    archiveCount += ids.size();
                    setData.put("archiveCount",archiveCount);
                    updateData.put("$set",setData);
                    MongoProvider.update("app_customer_archive_task", new BasicDBObject().append("_id", object.get("_id")), updateData);
                }

                return true;
            } else {
                return false;
            }

        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING,"",e);

        }
        return false;
    }

}
