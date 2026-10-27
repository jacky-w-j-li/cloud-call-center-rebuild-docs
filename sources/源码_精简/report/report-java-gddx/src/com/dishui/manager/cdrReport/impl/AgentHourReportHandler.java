package com.dishui.manager.cdrReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.cdrReport.CdrEventType;
import com.dishui.manager.report.CdrEventListener;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.dishui.util.AccountUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.bson.Document;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 4/6/16.
 */
public class AgentHourReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(AgentHourReportHandler.class
            .getName());

    private boolean running = true;

    public AgentHourReportHandler() {
        Thread t = new Thread("AgentHourReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("cdr_agent_houre_report_overflow_events", new BasicDBObject(), 10000);
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
            log.warning("cdr_agent_houre buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_agent_houre_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notifyAll();
            }
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_agent_houre_report_log", EventUtil.convertToDocument(event));
    }

    @Override
    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_agent_houre_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if (data.get("OFFERING_TIME") == null || data.get("END_TIME") == null) {
                log.warning("AgentHour OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + data.toString());
                return;
            }
            Object agentIDObj = data.get("DISPOSAL_AGENT");
            if (agentIDObj == null || agentIDObj.toString().equals("")) {
                return;
            }
            String agentID = agentIDObj.toString();
            String endTime = data.get("END_TIME").toString();

            BasicDBObject find = new BasicDBObject();
            find.put("ReportTime", Utils.getReportTime(endTime));
            find.put("AgentID", agentID);
            List<BasicDBObject> list = MongoProvider.find("cdr_report_agent_houre", find);
            if(list.size() > 0){
                BasicDBObject doc = list.get(0);

                BasicDBObject update = new BasicDBObject();
                if(data.get("CONNECT_TYPE").equals("normal")){
                    doCallIn(data, doc);
                }else if(data.get("CONNECT_TYPE").equals("dialout")){
                    doCallOut(data, doc);
                }else if(data.get("CONNECT_TYPE").equals("transfer")){
                    doTransfer(data, doc);
                }
                doc.remove("_id");
                update.put("$set", doc);
                MongoProvider.update("cdr_report_agent_houre", find, update, true);
            }else{
                BasicDBObject doc = new BasicDBObject();
                doc.put("AccountID", data.get("ACCOUNT_ID"));
                doc.put("ReportTime", Utils.getReportTime(endTime));
                doc.put("YearID", Utils.getYearID(endTime));
                doc.put("MonthID", Utils.getMonthID(endTime));
                doc.put("DayID", Utils.getDayID(endTime));
                doc.put("AgentID", agentID);

                doc.put("CallInAccessCount", 0);
                doc.put("CallInAcceptCount", 0);
                doc.put("CallInTimeLength", 0);
                doc.put("CallOutAccessCount", 0);
                doc.put("CallOutAcceptCount", 0);
                doc.put("CallOutTimeLength", 0);
                doc.put("TransferAcceptCount", 0);
                doc.put("IDLE_TIME_LENGTH", 0);
                doc.put("BUSY_TIME_LENGTH", 0);
                doc.put("LOGIN_TIME_LENGTH", 0);
                doc.put("STATE2_TIME_LENGTH", 0);
                doc.put("STATE3_TIME_LENGTH", 0);
                doc.put("STATE4_TIME_LENGTH", 0);
                doc.put("STATE5_TIME_LENGTH", 0);
                doc.put("STATE6_TIME_LENGTH", 0);
                doc.put("STATE7_TIME_LENGTH", 0);
                doc.put("STATE8_TIME_LENGTH", 0);
                doc.put("STATE9_TIME_LENGTH", 0);
                doc.put("STATE99_TIME_LENGTH", 0);
                if(data.get("CONNECT_TYPE").equals("normal")){
                    doCallIn(data, doc);
                }else if(data.get("CONNECT_TYPE").equals("dialout")){
                    doCallOut(data, doc);
                }else if(data.get("CONNECT_TYPE").equals("transfer")){
                    doTransfer(data, doc);
                }
                MongoProvider.insertDBObject("cdr_report_agent_houre", doc);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "AgentHourReportHandler handle event failed", e);
        }
    }

    private void doCallIn(Map<String, Object> callInCallSheet, BasicDBObject doc){
        doc.put("CallInAccessCount", Integer.parseInt(doc.get("CallInAccessCount").toString()) + 1);
        if (callInCallSheet.get("STATUS") != null && callInCallSheet.get("STATUS").equals("dealing")) {
            doc.put("CallInAcceptCount", Integer.parseInt(doc.get("CallInAcceptCount").toString()) + 1);
            String beginTime = callInCallSheet.get("BEGIN_TIME").toString();
            String endTime = callInCallSheet.get("END_TIME").toString();
            int callInTimeLength = Utils.getTimeLength(beginTime, endTime);
            if (callInTimeLength > 0) {
                doc.put("CallInTimeLength", Integer.parseInt(doc.get("CallInTimeLength").toString()) + callInTimeLength);
            }
        }
    }

    private void doCallOut(Map<String, Object> callOutCallSheet, BasicDBObject doc){
        doc.put("CallOutAccessCount", Integer.parseInt(doc.get("CallOutAccessCount").toString()) + 1);
        if (callOutCallSheet.get("STATUS") != null && callOutCallSheet.get("STATUS").equals("dealing")) {
            doc.put("CallOutAcceptCount", Integer.parseInt(doc.get("CallOutAcceptCount").toString()) + 1);
            String beginTime = callOutCallSheet.get("BEGIN_TIME").toString();
            String endTime = callOutCallSheet.get("END_TIME").toString();
            int callOutTimeLength = Utils.getTimeLength(beginTime,endTime);
            if (callOutTimeLength > 0) {
                doc.put("CallOutTimeLength",Integer.parseInt(doc.get("CallOutTimeLength").toString())+ callOutTimeLength);
            }
        }
    }

    private void doTransfer(Map<String, Object> transferCallSheet, BasicDBObject doc){
        if (transferCallSheet.get("STATUS") != null && transferCallSheet.get("STATUS").equals("dealing")) {
            doc.put("TransferAcceptCount", Integer.parseInt(doc.get("TransferAcceptCount").toString()) + 1);
        }
    }

    public void close() {
        running = false;
    }
}
