package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.impl.business.BusinessAgentReportHandler;
import com.dishui.manager.report.impl.business.BusinessAnalyseReportHandler;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 11/8/15.
 * 业务分析报表类
 */
public class BusinessReportHandler implements EventListener {

    public static String threadNum = AppConfig.getInstance().getVar("businessThreadNum");

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(BusinessReportHandler.class
            .getName());

    private boolean running = true;

    public BusinessReportHandler() {
        int num = Integer.parseInt(threadNum);
        while (num > 0) {
            Thread t = new Thread("BusinessReportHandler buffer thread") {
                public void run() {
                    doEvent();
                }
            };
            t.start();
            num--;
        }

    }

    private void doEvent() {
        while (running) {
            try {

                if (eventBuffer.size() == 0) {
                    List<BasicDBObject> list = MongoProvider.find("business_report_overflow_events", new BasicDBObject(), 10000);
                    if (list.size() > 0) {
                        for (int i = 0; i < list.size(); i++) {
                            Event tmpEvent = new Event(list.get(i));
                            eventBuffer.add(tmpEvent);
                        }
                    } else {
                        synchronized (eventBuffer) {
                            eventBuffer.wait();
                        }
                    }
                } else {
                    handleEvent(eventBuffer.remove(0));
                }

            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        try {
            MongoProvider.insert("business_report_log", EventUtil.convertToDocument(event));

            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("business_report_overflow_events", EventUtil.convertToDocument(event));
            } else {

                eventBuffer.add(event);
            }
            synchronized (eventBuffer) {
                eventBuffer.notify();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    private void handleEvent(Event event) {
        try {
            if (event.getType().equalsIgnoreCase(EventType.BUS_NEW_BUSINESS)) {
                BusinessAnalyseReportHandler.create(event);
                BusinessAgentReportHandler.create(event);
            } else if (event.getType().equalsIgnoreCase(EventType.BUS_NEXT_STEP_BUSINESS)) {
                BusinessAnalyseReportHandler.nextStep(event);
                BusinessAgentReportHandler.nextStep(event);
            } else if (event.getType().equalsIgnoreCase(EventType.BUS_CANCEL_BUSINESS)) {
                //todo
            } else if (event.getType().equalsIgnoreCase(EventType.BUS_FINISH_BUSINESS)) {
                BusinessAnalyseReportHandler.finish(event);
            } else if (event.getType().equalsIgnoreCase(EventType.BUS_PICK_BUSINESS)) {
                BusinessAnalyseReportHandler.pick(event);
                BusinessAgentReportHandler.pick(event);
            } else if (event.getType().equalsIgnoreCase(EventType.BUS_ASSIGN_BUSINESS)) {
                BusinessAgentReportHandler.assign(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "BusinessReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }
}
