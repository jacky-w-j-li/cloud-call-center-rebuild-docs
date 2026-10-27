package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.impl.mail.MailAgentReportHandler;
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
 * Created by wangyn on 2016-9-6 .
 */
public class MailReportHandler implements EventListener {
    public Vector<Event> eventBuffer = new Vector<Event>();

    public static String threadNum = AppConfig.getInstance().getVar("mailThreadNum");
    private static final Logger log = Logger.getLogger(MailReportHandler.class.getName());

    private boolean running = true;

    public MailReportHandler() {
        int num = Integer.parseInt(threadNum);
        while (num > 0) {
            log.info("MailReportHandler thread "+num +"start");
            Thread t = new Thread("MailReportHandler buffer thread") {
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
                    List<BasicDBObject> list = MongoProvider.find("mail_report_overflow_events", new BasicDBObject(),
                            10000);
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
        // 入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        try {
            MongoProvider.insert("mail_report_log", EventUtil.convertToDocument(event));

            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                // 每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("mail_report_overflow_events", new Document());
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
            if (event.getType().equalsIgnoreCase(EventType.MAIL_NEW_OUT)) {
                MailAgentReportHandler.getInstance().newMailOut(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_REDIRECT_SESSION)) {
                MailAgentReportHandler.getInstance().redirectSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_FIRST_REPLY)) {
                MailAgentReportHandler.getInstance().firstReply(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_CLOSE_SESSION)) {
                MailAgentReportHandler.getInstance().closeSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_ACCESS_SESSION)) {
                MailAgentReportHandler.getInstance().accessSession(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_SOCKET_PUSH_DISCONNECT)) {
                MailAgentReportHandler.getInstance().mailSocketPushDisconnected(event);
            } else if (event.getType().equalsIgnoreCase(EventType.MAIL_AUTO_CLAIM_LENGTH)) {
                MailAgentReportHandler.getInstance().mailAutoClaimStatus(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "MailReportHandler handle event failed:" + event.toString(), e);
        }
    }

    public void close() {
        running = false;
    }
}
