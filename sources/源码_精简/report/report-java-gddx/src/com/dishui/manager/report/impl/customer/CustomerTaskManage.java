package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.mongodb.BasicDBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;


public class CustomerTaskManage {
    private static final Logger log = Logger.getLogger(CustomerTaskManage.class.getName());
    private static final int LIMIT_NUM = 500; //每次从数据库里获取的条数
    private static Thread processor;
    private static CustomerTaskManage instance = null;

    private static final int queueNum = 1000;
    private ThreadPoolExecutor executor;

    private CustomerTaskManage() {
        instance = this;
        executor = new ThreadPoolExecutor(100, 100, 600, TimeUnit.SECONDS,new LinkedBlockingQueue<Runnable>(queueNum));
        processor = new Thread("CustomerTaskManage"){
            @Override
            public void run() {
                log.info("CustomerTaskManage start ...");
                while (true) {
                    try {
                        long time = System.currentTimeMillis();
                        BasicDBObject condition = new BasicDBObject();
                        condition.put("reportStatus", "ready");
                        List<BasicDBObject> eventList = MongoProvider.find(Constant.CUSTOMER_EVENT_TABLE, condition, LIMIT_NUM);
                        if(eventList == null || eventList.size() == 0) {
                            sleep(1000);
                            continue;
                        }
                        log.info("获取客户事件条数:"+eventList.size()+"条");
                        List<String> ids=new ArrayList<String>();
                        for (BasicDBObject dbObject : eventList) {
                            String id = String.valueOf(dbObject.get("_id"));
                            ids.add(id);
                        }
                        MongoConnect.getInstance().getDB().getCollection(Constant.CUSTOMER_EVENT_TABLE).withWriteConcern(WriteConcern.SAFE).updateMany(new BasicDBObject("_id", new BasicDBObject("$in", ids)),
                                new BasicDBObject("$set", new BasicDBObject("reportStatus", "deal")));
                        for (BasicDBObject dbObject : eventList) {
                            Event event = null;
                            try{
                                event = new Event(dbObject);
                                log.info("threadPool：" + executor.getPoolSize() + "，queue：" +
                                        executor.getQueue().size() + "，finish：" + executor.getCompletedTaskCount());

                                int size=executor.getQueue().size();
                                if(size>=queueNum-1){
                                    log.log(Level.INFO,"＝＝＝＝＝＝＝entry wait＝＝＝＝＝＝＝");
                                    executor.execute(new EventTask(event,processor));
                                    synchronized (processor){
                                        processor.wait();
                                    }
                                }else{
                                    executor.execute(new EventTask(event,processor));
                                }
                            }catch (Exception e){
                                e.printStackTrace();
                                log.log(Level.WARNING, e.getMessage() + dbObject.toString(), e);
                                if (dbObject != null) {
                                    try {
                                        MongoProvider.remove(Constant.CUSTOMER_EVENT_TABLE, new BasicDBObject("_id", dbObject.get("_id")));
                                        MongoProvider.insertDBObject("customer_event_error", dbObject);
                                    } catch (Exception exception) {
                                        exception.printStackTrace();
                                    }
                                }
                            }
                        }
                        long duration = System.currentTimeMillis() - time;
                        String msg = String.format("%s消耗时间[%d ms]", "process CustomerTaskManage", duration);
                        log.log(Level.INFO, msg);
                        sleep(5000);
                    } catch (Exception e) {
                        e.printStackTrace();
                        log.log(Level.WARNING, "process CustomerTaskManage exception! ", e);
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

    public static CustomerTaskManage getInstance() {
        if (instance == null) {
            new CustomerTaskManage();
        }
        return instance;
    }


    public void startHandleEvents(){
        processor.start();
    }

    private void handleEvent(Event event) {
//        System.out.println("event = [" + event.getType() + "]");
        try {
            if(event.getType().equalsIgnoreCase(EventType.CUST_ADD)){
                CustomerIncreaseReportHandler.newCustomer(event);
                CustomerStatusReportHandler.addStatus(event);
                CustomerSalesReportHandler.addToSales(event);
                CustomerOpportunityReportHandler.addToOpportunity(event);
                CustomerCommonReportHandler.addToCommon(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE)){
                CustomerIncreaseReportHandler.updateCustomerSource(event);
                CustomerStatusReportHandler.updateStatus(event);
                CustomerSalesReportHandler.updateToSales(event);
                CustomerCommonReportHandler.updateToCommon(event);
                CustomerCommonUserReportHandler.updateCommonUser(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_SOURCE)){
                CustomerIncreaseReportHandler.updateCustomerSource(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_STATUS)
                    ||event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_OWNER)){
                CustomerStatusReportHandler.updateStatus(event);
                CustomerSalesReportHandler.updateToSales(event);
                CustomerCommonReportHandler.updateToCommon(event);
                CustomerCommonUserReportHandler.updateCommonUser(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_DEL)){
                CustomerStatusReportHandler.delStatus(event);
                CustomerSalesReportHandler.delToSales(event);
                CustomerOpportunityReportHandler.delToOpportunity(event);
                CustomerCommonReportHandler.delCommon(event);
                CustomerCommonUserReportHandler.delCommonUser(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_CATEGORY)){
                CustomerSalesReportHandler.changeToSales(event);
                CustomerStatusReportHandler.updateStatus(event);
                CustomerCommonReportHandler.updateToCommon(event);
                CustomerCommonUserReportHandler.updateCommonUser(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_CONTACT_STATUS)){
                CustomerSalesReportHandler.updateSysStatus(event);
                CustomerOpportunityReportHandler.updateSysStatus(event);
                CustomerStatusReportHandler.updateStatus(event);
                CustomerCommonReportHandler.updateToCommon(event);
                CustomerCommonUserReportHandler.updateCommonUser(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_MERGE)){
                CustomerIncreaseReportHandler.updateCustomerSource(event);
                CustomerStatusReportHandler.updateStatus(event);
                CustomerSalesReportHandler.updateToSales(event);
                CustomerStatusReportHandler.delStatus(event);
                CustomerSalesReportHandler.delToSales(event);
                CustomerOpportunityReportHandler.delToOpportunity(event);
                CustomerCommonReportHandler.updateToCommon(event);
                CustomerCommonUserReportHandler.updateCommonUser(event);
                CustomerCommonReportHandler.delCommon(event);
                CustomerCommonUserReportHandler.delCommonUser(event);
            }

            CustomerChangeLogReportHandler.newChangeLog(event);
            MongoProvider.remove(Constant.CUSTOMER_EVENT_TABLE, new BasicDBObject("_id", event.getId()));
        } catch (Exception e) {
            log.log(Level.WARNING, "CustomerReportTask handle event failed", e);
        }
    }
    private class EventTask implements Runnable {
        private Event event;
        private Thread mainThread;
        public EventTask(Event event,Thread t){
            this.event=event;
            this.mainThread=t;
        }
        @Override
        public void run() {
            handleEvent(event);
            int size=executor.getQueue().size();
            synchronized (mainThread){
                if(size<queueNum){
                    mainThread.notify();
                }
            }
        }
    }
}
