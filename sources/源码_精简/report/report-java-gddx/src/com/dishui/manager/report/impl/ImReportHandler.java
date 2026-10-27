package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.impl.im.*;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;
import org.bson.Document;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-12.
 */
public class ImReportHandler implements EventListener {
    public Vector<Event> eventBuffer = new Vector<Event>();
    public static String threadNum = AppConfig.getInstance().getVar("imThreadNum");

    private static final Logger log = Logger.getLogger(ImReportHandler.class
            .getName());

    private boolean running = true;

    public ImReportHandler() {
        int num = Integer.parseInt(threadNum);
        while (num > 0) {
            Thread t = new Thread("ImReportHandler buffer thread") {
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
                    List<BasicDBObject> list = MongoProvider.find("im_report_overflow_events", new BasicDBObject(), 10000);
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
            MongoProvider.insert("im_report_log_2", EventUtil.convertToDocument(event));
//            log.info("im_report_log"+ event.toString());
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("im_report_overflow_events", new Document());
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
            if (event.getType().equalsIgnoreCase(EventType.IM_NEW_SESSION)) {
                ImMessageReportHandler.getInstance().newSession(event);
                ImAccessIdReportHandler.getInstance().newSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_NEW_VISITOR)) {
                ImMessageReportHandler.getInstance().newVisitor(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_NEW_MSG_IN)) {
                ImMessageReportHandler.getInstance().newMsgIn(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_REDIRECT_SESSION)) {
                ImAgentReportHandler.getInstance().redirectSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_CONVERT_MANUAL)) {
                ImMessageReportHandler.getInstance().convertManual(event);
                ImAccessIdReportHandler.getInstance().convertManual(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_FIRST_REPLY)) {
                ImMessageReportHandler.getInstance().firstReply(event);
                ImAgentReportHandler.getInstance().firstReply(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_CLOSE_SESSION)) {
                ImMessageReportHandler.getInstance().closeSession(event);
                ImAgentReportHandler.getInstance().closeSession(event);
                ImBusinessReportHandler.getInstance().closeSession(event);
                ImAccessIdReportHandler.getInstance().closeSession(event);
                ImCsrReportHandler.getInstance().closeSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_NEW_MSG_OUT)) {
                ImAgentReportHandler.getInstance().newMsgOut(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_ACCESS_SESSION)) {
                ImAgentReportHandler.getInstance().accessSession(event);
                ImAccessIdReportHandler.getInstance().accessSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_REDUCE_SESSION)) {
//                ImMessageReportHandler.getInstance().reduceSession(event);
//                ImAgentReportHandler.getInstance().reduceSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_CSR)) {
                ImCsrReportHandler.getInstance().pushSatisfaction(event);
            } else if (event.getType().equalsIgnoreCase(EventType.IM_LOST_SESSION)) {
                ImMessageReportHandler.getInstance().lostSession(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "ImReportHandler handle event failed:" + event.toString(), e);
        }
    }

    public void close() {
        running = false;
    }
}
