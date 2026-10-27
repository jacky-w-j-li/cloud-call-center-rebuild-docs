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
import org.bson.Document;

import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 3/10/16.
 */
public class ApproveSurveyReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final String APPROVE_SURVEY_PREFIX = "approveSurvey";
    private static final Logger log = Logger.getLogger(ApproveSurveyReportHandler.class
            .getName());

    private boolean running = true;
    private Map<String, String> waitHandleInvestigateMap = new HashMap<String, String>();

    public ApproveSurveyReportHandler() {
        Thread t = new Thread("ApproveSurveyReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("cdr_approve_survey_report_overflow_events", new BasicDBObject(), 10000);
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
            log.warning("cdr_approve_survey buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_approve_survey_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_approve_survey_report_log", EventUtil.convertToDocument(event));
    }

    @Override
    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_approve_survey_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            String callSheetId = data.get("CALL_SHEET_ID").toString();
            if(event.getType().equals(CdrEventType.CDR_CALL)){
                if(data.get("STATUS") != null && data.get("STATUS").toString().equals("dealing")) {
                    if (data.get("CONNECT_TYPE").equals("normal") || data.get("CONNECT_TYPE").equals("dialout")) {
                        if (data.containsKey("INVESTIGATE") && data.get("INVESTIGATE") != null) {
                            doApproveSurvery(new BasicDBObject(data));
                        } else {
                            if (waitHandleInvestigateMap.containsKey(callSheetId) && waitHandleInvestigateMap.get(callSheetId) != null) {
                                data.put("INVESTIGATE", waitHandleInvestigateMap.get(callSheetId));
                                doApproveSurvery(new BasicDBObject(data));
                            } else {
                                BasicDBObject findInvest = new BasicDBObject();
                                findInvest.put("_id", callSheetId);
                                List<BasicDBObject> investList = MongoProvider.find("cdr_wait_handle_investigate", findInvest);
                                if (investList.size() > 0) {
                                    if(investList.get(0).get("INVESTIGATE") != null){
                                        data.put("INVESTIGATE", investList.get(0).get("INVESTIGATE"));
                                        doApproveSurvery(new BasicDBObject(data));
                                    }
                                }
                            }
                        }
                    }
                }
            }else if(event.getType().equals(CdrEventType.CDR_INVESTIGATE)){
                BasicDBObject findCdr = new BasicDBObject();
                findCdr.put("_id", data.get("CALL_SHEET_ID"));
                BasicDBObject oneCdr = MongoProvider.findOneFromApp(AccountUtil.getAccountDb(data.get("ACCOUNT_ID").toString()), data.get("ACCOUNT_ID")+"_c5_call_sheet", findCdr);
                if(oneCdr != null && data.get("INVESTIGATE") != null){
                    oneCdr.put("INVESTIGATE", data.get("INVESTIGATE"));
                    doApproveSurvery(oneCdr);
                }else{
                    waitHandleInvestigateMap.put(callSheetId, data.get("INVESTIGATE").toString());
                    Document tempInvestigate = new Document();
                    tempInvestigate.put("_id", callSheetId);
                    tempInvestigate.put("INVESTIGATE", data.get("INVESTIGATE"));
                    MongoProvider.insert("cdr_wait_handle_investigate", tempInvestigate);
                }
            }else{
                log.warning("ApproveSurveyReportHandler don't know event type." + event.getType());
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "ApproveSurveyReportHandler handle event failed", e);
        }
    }

    private void doApproveSurvery(BasicDBObject oneCdr){
        if (oneCdr.get("OFFERING_TIME") == null
                || oneCdr.get("END_TIME") == null
                || oneCdr.get("DISPOSAL_AGENT") == null
                || oneCdr.get("CONNECT_TYPE") == null
                || oneCdr.get("END_TIME") == null) {
            log.warning("ApproveSurvey OFFERING_TIME or END_TIME or DISPOSAL_AGENT or CONNECT_TYPE or END_TIME is null, cdr server restarted? \n" + oneCdr.toString());
            return;
        }
        int investigate = Integer.parseInt(oneCdr.get("INVESTIGATE").toString());
        String agentID = oneCdr.get("DISPOSAL_AGENT").toString();
        String type = oneCdr.get("CONNECT_TYPE").toString();
        String endTime = oneCdr.get("END_TIME").toString();

        BasicDBObject find = new BasicDBObject();
        find.put("ReportTime", Utils.getReportTime(endTime));
        find.put("AgentID", agentID);
        find.put("Type", type);

        List<BasicDBObject> list = MongoProvider.find("cdr_report_approve_survey", find);
        if(list.size() > 0){
            BasicDBObject update = new BasicDBObject();
            update.put("$inc",new Document(APPROVE_SURVEY_PREFIX + investigate, 1));
            MongoProvider.update("cdr_report_approve_survey", find, update, true);
        }else{
            Document doc = new Document();
            doc.put("AccountID", oneCdr.get("ACCOUNT_ID"));
            doc.put("ReportTime", Utils.getReportTime(endTime));
            doc.put("YearID", Utils.getYearID(endTime));
            doc.put("MonthID", Utils.getMonthID(endTime));
            doc.put("DayID", Utils.getDayID(endTime));
            doc.put("AgentID", agentID);
            doc.put("Type", type);

            doc.put(APPROVE_SURVEY_PREFIX + investigate, Integer.valueOf(1));
            MongoProvider.insert("cdr_report_approve_survey", doc);
        }
    }

    public void close() {
        running = false;
    }
}
