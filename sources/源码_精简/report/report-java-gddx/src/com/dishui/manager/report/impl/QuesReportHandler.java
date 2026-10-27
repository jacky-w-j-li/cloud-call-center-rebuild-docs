package com.dishui.manager.report.impl;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.bson.Document;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.impl.ques.QuesAnswerReportHandler;
import com.dishui.manager.report.impl.ques.QuesResultReportHandler;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.mongodb.BasicDBObject;

/**
 * Created by yaxi on 15-11-12.
 */
public class QuesReportHandler implements EventListener {
    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(QuesReportHandler.class
            .getName());

    private boolean running = true;

    public QuesReportHandler() {
        Thread t = new Thread("QuesReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("ques_report_overflow_events", new BasicDBObject(), 10000);
                        if(list.size() > 0){
                            for(int i =0 ;i<list.size() ;i++){
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        }else{
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

    public void addToBuf(Event event) {
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        try{
            MongoProvider.insert("ques_report_log", EventUtil.convertToDocument(event));
            synchronized (eventBuffer) {
                if (eventBuffer.size() > 1000000) {
                    log.warning("account buffer is too large to cache any event");
                    //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                    MongoProvider.insert("ques_report_overflow_events", new Document());
                } else {
                    eventBuffer.add(event);
                }
                eventBuffer.notify();
            }
        }catch (Exception e){
            e.printStackTrace();
        }

    }

    private void handleEvent(Event event) {
    	System.out.println("ques event = [" + event.getType() + "]");
        try {
            if(event.getType().equalsIgnoreCase(EventType.QUES_COMPLATE)){
                QuesResultReportHandler.getInstance().newResult(event);
                QuesAnswerReportHandler.getInstance().newAnwser(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "QuesReportHandler handle event failed:"+event.toString(), e);
        }
    }

    public void close() {
        running = false;
    }
}
