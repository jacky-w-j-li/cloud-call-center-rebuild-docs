package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.ListenerEventSource;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.logging.Logger;


public class CustomerTaskManage2 {
    private static final Logger log = Logger.getLogger(CustomerTaskManage2.class.getName());
    private static final int LIMIT_NUM = 1000; //每次从数据库里获取的条数
    private static Thread processor;
    private static CustomerTaskManage2 instance = null;
    private CustomerTaskManage2() {
        instance = this;
        processor = new Thread("CustomerTaskManage"){
            @Override
            public void run() {
                initEventHandler();
                while (true) {
                    BasicDBObject condition = new BasicDBObject();
                    condition.put("reportStatus", "ready");
                    List<BasicDBObject> eventList = null;
                    eventList = MongoProvider.find(Constant.CUSTOMER_EVENT_TABLE, condition, LIMIT_NUM);
                    log.info("获取客户事件条数:"+eventList.size()+"条");
                    for (BasicDBObject dbObject : eventList) {
                        Event event = null;
                        try{
                            event = new Event(dbObject);
                            ListenerEventSource.getInstance().addToCustomerListenerBuf(event);

                        }catch (Exception e){
                            e.printStackTrace();
                            log.warning(e.getMessage() + dbObject.toString());
                        }
                        MongoProvider.remove(Constant.CUSTOMER_EVENT_TABLE, new BasicDBObject("_id", dbObject.get("_id")));
                    }

                    try {
                        Thread.sleep(1000);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };
    };

    public static CustomerTaskManage2 getInstance() {
        if (instance == null) {
            new CustomerTaskManage2();
        }
        return instance;
    }


    private void initEventHandler() {
        CustomerReportTask cHandler = new CustomerReportTask();
        ListenerEventSource.getInstance().addCustomerListener(cHandler);
    }

    public void startHandleEvents(){
        processor.start();
    }


}
