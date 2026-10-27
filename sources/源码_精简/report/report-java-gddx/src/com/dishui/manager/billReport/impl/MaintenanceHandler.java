package com.dishui.manager.billReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.BillEventType;
import com.dishui.manager.billReport.impl.maintenance.MaintenanceTeletrafficReportHandler;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/4/7.
 */
public class MaintenanceHandler implements EventListener {
    private static final Logger log = Logger.getLogger(MaintenanceHandler.class.getName());

    public Vector<Event> eventBuffer = new Vector<Event>();
    private boolean running = true;

    public MaintenanceHandler() {
        Thread t = new Thread("MaintenanceHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    private void doEvent() {
        while (running) {
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        List<BasicDBObject> list = MongoProvider.find("bill_maintenance_report_overflow_events", new BasicDBObject(), 10000);
                        if (list.size() > 0) {
                            for (int i = 0; i < list.size(); i++) {
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        } else {
                            eventBuffer.wait();
                        }
                    } else {
                        handleEvent(eventBuffer.remove(0));
                    }
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    @Override
    public void addToBuf(Event event) {
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        MongoProvider.insert("bill_maintenance_report_log", EventUtil.convertToDocument(event));
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("bill_maintenance_report_overflow_events", EventUtil.convertToDocument(event));
            } else {
                eventBuffer.add(event);
            }
            eventBuffer.notify();
        }
    }

    private void handleEvent(Event event) {
        try {
            if(event.getType().equalsIgnoreCase(BillEventType.COMPLETE_CALL)) {
                MaintenanceTeletrafficReportHandler.completeCall(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "BusinessReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }
}
