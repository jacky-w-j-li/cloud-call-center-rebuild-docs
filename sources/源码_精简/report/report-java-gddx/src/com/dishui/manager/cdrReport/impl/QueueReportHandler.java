package com.dishui.manager.cdrReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.CdrEventListener;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.bson.Document;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 3/29/16.
 */
public class QueueReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(QueueReportHandler.class
            .getName());
    private static Map<String, String> queueIDMap = new HashMap<String, String>();

    private boolean running = true;

    public QueueReportHandler() {
        Thread t = new Thread("QueueReportHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    private void doEvent() {
        while (running) {
            Event event = null;
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        List<BasicDBObject> list = MongoProvider.find("cdr_queue_report_overflow_events", new BasicDBObject(), 10000);
                        if(list.size() > 0){
                            for(int i =0 ;i<list.size() ;i++){
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        }else{
                            eventBuffer.wait();
                        }
                    } else {
                        event = eventBuffer.remove(0);
                    }
                }
                if(event != null)
                    handleEvent(event);
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        if (eventBuffer.size() > 1000000) {
            log.warning("cdr_queue buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_queue_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_queue_report_log", EventUtil.convertToDocument(event));
    }

    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_queue_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if(data.get("CONNECT_TYPE").equals("normal")){
                Object queueNoObj = data.get("ERROR_MEMO");
                if (queueNoObj == null || "".equals(queueNoObj.toString())) {
                    return;
                }
                if (data.get("OFFERING_TIME") == null
                        || data.get("END_TIME") == null) {
                    log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + data.toString());
                    return;
                }
                String queueID = queueIDMap.get(queueNoObj.toString());
                if (queueID == null) {
                    BasicDBObject queueIDFind = new BasicDBObject();
                    queueIDFind.put("Exten", queueNoObj.toString());
                    List<BasicDBObject> queueIDList = MongoProvider.findFromApp("cc", "manager_ivr_skillgroup", queueIDFind, new BasicDBObject("_id", 1));
                    if (queueIDList.size() > 0) {
                        queueIDMap.put(queueNoObj.toString(), queueIDList.get(0).get("_id").toString());
                        queueID = queueIDMap.get(queueNoObj.toString());
                    }
                }
                if (queueID == null) {
                    return;
                }
                String status = data.get("STATUS").toString();

                int queueTimeLength = 0;
                if (data.get("QUEUE_TIME") != null) {
                    if(data.get("QUEUE_TIME_LENGTH") != null){
                        queueTimeLength = Integer.valueOf(data.get("QUEUE_TIME_LENGTH").toString());
                    } else {
                        queueTimeLength = 21;
                    }
                } else if (data.get("ERROR_MEMO") != null) {
                    queueTimeLength = 21;
                }
                String endTime = data.get("END_TIME").toString();
                BasicDBObject find = new BasicDBObject();
                find.put("AccountID", data.get("ACCOUNT_ID"));
                find.put("ReportTime", Utils.getReportTime(endTime));
                find.put("QueueID", queueID);

                List<BasicDBObject> list = MongoProvider.find("cdr_report_queue_hour", find);
                if(list.size() > 0){
                    DBObject curReprot = list.get(0);
                    int AccessCount = Integer.parseInt(curReprot.get("AccessCount").toString());
                    int AcceptCount = Integer.parseInt(curReprot.get("AcceptCount").toString());
                    int AcceptIn20Count = Integer.parseInt(curReprot.get("AcceptIn20Count").toString());
                    int AbandonIn6SumQueueLeak = Integer.parseInt(curReprot.get("AbandonIn6SumQueueLeak").toString());
                    int AbandonMaxQueueTimeLength = Integer.parseInt(curReprot.get("AbandonMaxQueueTimeLength").toString());
                    int AbandonMinQueueTimeLength = Integer.parseInt(curReprot.get("AbandonMinQueueTimeLength").toString());
                    int AbandonSumQueueTimeLength = Integer.parseInt(curReprot.get("AbandonSumQueueTimeLength").toString());
                    int AcceptMaxQueueTimeLength = Integer.parseInt(curReprot.get("AcceptMaxQueueTimeLength").toString());
                    int AcceptMinQueueTimeLength = Integer.parseInt(curReprot.get("AcceptMinQueueTimeLength").toString());
                    int AcceptSumCallInTimeLength = Integer.parseInt(curReprot.get("AcceptSumCallInTimeLength").toString());
                    int AcceptSumQueueTimeLength = Integer.parseInt(curReprot.get("AcceptSumQueueTimeLength").toString());

                    AccessCount = AccessCount + 1;
                    if (status.equals("dealing")) {
                        AcceptCount = AcceptCount + 1;
                        if (queueTimeLength <= 20) {
                            AcceptIn20Count = AcceptIn20Count + 1;
                        }
                        AcceptSumQueueTimeLength = AcceptSumQueueTimeLength + queueTimeLength;
                        if (queueTimeLength > AcceptMaxQueueTimeLength) {
                            AcceptMaxQueueTimeLength = queueTimeLength;
                        }
                        if (AcceptMinQueueTimeLength <= 0 || queueTimeLength < AcceptMinQueueTimeLength) {
                            AcceptMinQueueTimeLength = queueTimeLength;
                        }

                        if (data.get("BEGIN_TIME") != null) {
                            int callTimeLength= 0;
                            Object timeLengthObj = data.get("CALL_TIME_LENGTH");
                            if (timeLengthObj == null) {
                                callTimeLength = Utils.getTimeLength(data.get("BEGIN_TIME").toString(),
                                        data.get("END_TIME").toString());
                            } else {
                                callTimeLength = Integer.valueOf(timeLengthObj.toString());
                            }
                            if (callTimeLength > 0) {
                                AcceptSumCallInTimeLength = AcceptSumCallInTimeLength + callTimeLength;
                            }
                        } else {
                            log.warning("Call sheet status is dealing, but begin time is null: "
                                    + data.get("CALL_SHEET_ID")
                                    .toString());
                        }
                    } else if (status.equals("queueLeak") || status.equals("notDeal")) {
                        AbandonSumQueueTimeLength = AbandonSumQueueTimeLength + queueTimeLength;
                        if (queueTimeLength > AbandonMaxQueueTimeLength) {
                            AbandonMaxQueueTimeLength = queueTimeLength;
                        }
                        if (AbandonMinQueueTimeLength <= 0 || queueTimeLength < AbandonMinQueueTimeLength) {
                            AbandonMinQueueTimeLength = queueTimeLength;
                        }
                        if (status.equals("queueLeak") && queueTimeLength < 6) {
                            AbandonIn6SumQueueLeak = AbandonIn6SumQueueLeak + 1;
                        }
                    }
                    BasicDBObject set = new BasicDBObject();
                    BasicDBObject update = new BasicDBObject();
                    update.put("AccessCount", AccessCount);
                    update.put("AcceptCount", AcceptCount);
                    update.put("AcceptIn20Count", AcceptIn20Count);
                    update.put("AbandonIn6SumQueueLeak", AbandonIn6SumQueueLeak);
                    update.put("AbandonMaxQueueTimeLength", AbandonMaxQueueTimeLength);
                    update.put("AbandonMinQueueTimeLength", AbandonMinQueueTimeLength);
                    update.put("AbandonSumQueueTimeLength", AbandonSumQueueTimeLength);
                    update.put("AcceptMaxQueueTimeLength", AcceptMaxQueueTimeLength);
                    update.put("AcceptMinQueueTimeLength", AcceptMinQueueTimeLength);
                    update.put("AcceptSumCallInTimeLength", AcceptSumCallInTimeLength);
                    update.put("AcceptSumQueueTimeLength", AcceptSumQueueTimeLength);
                    set.put("$set", update);
                    MongoProvider.update("cdr_report_queue_hour", find, set, true);
                }else{
                    //add new report
                    int AccessCount = 0;
                    int AcceptCount = 0;
                    int AcceptIn20Count = 0;
                    int AbandonIn6SumQueueLeak = 0;
                    int AbandonMaxQueueTimeLength = 0;
                    int AbandonMinQueueTimeLength = 0;
                    int AbandonSumQueueTimeLength = 0;
                    int AcceptMaxQueueTimeLength = 0;
                    int AcceptMinQueueTimeLength = 0;
                    int AcceptSumCallInTimeLength = 0;
                    int AcceptSumQueueTimeLength = 0;

                    AccessCount++;
                    if (status.equals("dealing")) {
                        AcceptCount++;
                        if (queueTimeLength <= 20) {
                            AcceptIn20Count++;
                        }
                        AcceptSumQueueTimeLength = queueTimeLength;
                        AcceptMaxQueueTimeLength = queueTimeLength;
                        AcceptMinQueueTimeLength = queueTimeLength;
                        if (data.get("BEGIN_TIME") != null) {
                            int callTimeLength = 0;
                            Object timeLengthObj = data.get("CALL_TIME_LENGTH");
                            if (timeLengthObj == null) {
                                callTimeLength = Utils.getTimeLength(data.get("BEGIN_TIME").toString(),
                                        data.get("END_TIME").toString());
                            } else {
                                callTimeLength = Integer.valueOf(timeLengthObj.toString());
                            }
                            if (callTimeLength > 0) {
                                AcceptSumCallInTimeLength = callTimeLength;
                            }
                        } else {
                            log.warning("Call sheet status is dealing, but begin time is null: "
                                    + data.get("CALL_SHEET_ID")
                                    .toString());
                        }
                    } else if (status.equals("queueLeak") || status.equals("notDeal")) {
                        AbandonSumQueueTimeLength = queueTimeLength;
                        AbandonMaxQueueTimeLength = queueTimeLength;
                        AbandonMinQueueTimeLength = queueTimeLength;
                        if (status.equals("queueLeak") && queueTimeLength < 6) {
                            AbandonIn6SumQueueLeak++;
                        }
                    }
                    Document doc = new Document();
                    doc.put("AccountID", data.get("ACCOUNT_ID"));
                    doc.put("ReportTime", Utils.getReportTime(endTime));
                    doc.put("YearID", Utils.getYearID(endTime));
                    doc.put("MonthID", Utils.getMonthID(endTime));
                    doc.put("DayID", Utils.getDayID(endTime));
                    doc.put("QueueID", queueID);

                    doc.put("AccessCount", AccessCount);
                    doc.put("AcceptCount", AcceptCount);
                    doc.put("AcceptIn20Count", AcceptIn20Count);
                    doc.put("AbandonIn6SumQueueLeak", AbandonIn6SumQueueLeak);
                    doc.put("AcceptSumQueueTimeLength", AcceptSumQueueTimeLength);
                    doc.put("AcceptSumCallInTimeLength", AcceptSumCallInTimeLength);
                    doc.put("AcceptMinQueueTimeLength", AcceptMinQueueTimeLength);
                    doc.put("AcceptMaxQueueTimeLength", AcceptMaxQueueTimeLength);
                    doc.put("AbandonSumQueueTimeLength", AbandonSumQueueTimeLength);
                    doc.put("AbandonMinQueueTimeLength", AbandonMinQueueTimeLength);
                    doc.put("AbandonMaxQueueTimeLength", AbandonMaxQueueTimeLength);
                    MongoProvider.insert("cdr_report_queue_hour", doc);
                    //补充当天空白时间段
                    fixTodayBeforeReport(data.get("ACCOUNT_ID").toString(), queueID, endTime);
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "QueueReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }

    private void fixTodayBeforeReport(String account, String queueID, String endTime){
        String lastReportTime = Utils.getLastReportTime(endTime);
        if(Utils.getDefaultCurrentDate().equals(lastReportTime.split(" ")[0])){
            BasicDBObject find = new BasicDBObject();
            find.put("QueueID", queueID);
            find.put("ReportTime", new BasicDBObject("$lte", lastReportTime));
            find.put("DayID", Utils.getDayID(endTime));
            List<BasicDBObject> list = MongoProvider.find("cdr_report_queue_hour", find, new BasicDBObject("ReportTime", -1), 1);
            if(list.size() > 0){
                if(list.get(0).get("ReportTime").toString().compareTo(lastReportTime) < 0){
                    log.log(Level.INFO, "queue fixTodayBeforeReport one time :" + lastReportTime);
                    Document doc = new Document();
                    doc.put("AccountID", account);
                    doc.put("QueueID", queueID);
                    doc.put("ReportTime", lastReportTime);
                    doc.put("YearID", Utils.getYearID(lastReportTime));
                    doc.put("MonthID", Utils.getMonthID(lastReportTime));
                    doc.put("DayID", Utils.getDayID(lastReportTime));

                    doc.put("AccessCount", 0);
                    doc.put("AcceptCount", 0);
                    doc.put("AcceptIn20Count", 0);
                    doc.put("AbandonIn6SumQueueLeak", 0);
                    doc.put("AcceptSumQueueTimeLength", 0);
                    doc.put("AcceptSumCallInTimeLength", 0);
                    doc.put("AcceptMinQueueTimeLength", 0);
                    doc.put("AcceptMaxQueueTimeLength", 0);
                    doc.put("AbandonSumQueueTimeLength", 0);
                    doc.put("AbandonMinQueueTimeLength", 0);
                    doc.put("AbandonMaxQueueTimeLength", 0);
                    MongoProvider.insert("cdr_report_queue_hour", doc);
                    //递归补充空白时间段
                    fixTodayBeforeReport(account, queueID, lastReportTime);
                }
            }
        }
    }
}
