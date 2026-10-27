package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Vector;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 11/8/15.
 */
public class CustomerReportTask implements EventListener {
    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(CustomerReportTask.class.getName());

    private boolean running = true;
    private static final int queueNum = 100;
    private ThreadPoolExecutor executor;

    public CustomerReportTask() {
        executor = new ThreadPoolExecutor(20, 20, 600, TimeUnit.SECONDS,new LinkedBlockingQueue<Runnable>(queueNum));
        Thread t = new Thread("CustomerReportTask buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    private void doEvent() {
        Thread main= Thread.currentThread();
        while (running) {
            try {
                log.info("eventBuffer.size()==="+eventBuffer.size());
                if (eventBuffer.size() == 0) {
                    List<BasicDBObject> list = MongoProvider.find("customer_report_overflow_events", new BasicDBObject(), 10000);
                    if(list.size() > 0){
                        for(int i =0 ;i<list.size() ;i++){
                            Event tmpEvent = new Event(list.get(i));
                            eventBuffer.add(tmpEvent);
                        }
                    }else{
                        main.sleep(1000);
                        continue;
                    }
                } else {
                    Event item=eventBuffer.remove(0);
                    log.log(Level.INFO,"线程池中线程数目："+executor.getPoolSize()+"，队列中等待执行的任务数目："+
                            executor.getQueue().size()+"，已执行完的任务数目："+executor.getCompletedTaskCount());

                    int size=executor.getQueue().size();
                    if(size>=queueNum-1){
                        log.log(Level.INFO,"＝＝＝＝＝＝＝entry wait＝＝＝＝＝＝＝");
                        executor.execute(new EventTask(item,main));
                        synchronized (main){
                            main.wait();
                        }
                    }else{
                        executor.execute(new EventTask(item,main));
                    }
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        MongoProvider.insert("customer_report_log", EventUtil.convertToDocument(event));
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("customer buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("customer_report_overflow_events", EventUtil.convertToDocument(event));
            } else {
                eventBuffer.add(event);
            }
//            eventBuffer.notify();
        }
    }

    private void handleEvent(Event event) {
//        System.out.println("event = [" + event.getType() + "]");
        try {
            if(event.getType().equalsIgnoreCase(EventType.CUST_ADD)){
                CustomerIncreaseReportHandler.newCustomer(event);
                CustomerStatusReportHandler.addStatus(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE)){
                CustomerIncreaseReportHandler.updateCustomerSource(event);
                CustomerStatusReportHandler.updateStatus(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_SOURCE)){
                CustomerIncreaseReportHandler.updateCustomerSource(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_STATUS)
                    ||event.getType().equalsIgnoreCase(EventType.CUST_UPDATE_OWNER)){
                CustomerStatusReportHandler.updateStatus(event);
            }else if(event.getType().equalsIgnoreCase(EventType.CUST_DEL)){
                CustomerStatusReportHandler.delStatus(event);
            }

            CustomerChangeLogReportHandler.newChangeLog(event);
        } catch (Exception e) {
            log.log(Level.WARNING, "CustomerReportTask handle event failed", e);
        }
    }

    public void close() {
        running = false;
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
