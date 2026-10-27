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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 4/6/16.
 */
public class AgentHourCdrPeerReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(AgentHourCdrPeerReportHandler.class
            .getName());

    private boolean running = true;

    public AgentHourCdrPeerReportHandler() {
        Thread t = new Thread("AgentHourCdrPeerReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("cdr_agent_houre_cdr_peer_report_overflow_events", new BasicDBObject(), 10000);
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
                log.log(Level.INFO, "AgentHourCdrPeerReportHandler remove(0) eventBuffer size = "+ eventBuffer.size() + "  --------"+ this.toString());
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        if (eventBuffer.size() > 1000000) {
            log.warning("cdr_agent_houre_cdr_peer buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_agent_houre_cdr_peer_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        log.log(Level.INFO, "AgentHourCdrPeerReportHandler eventBuffer size = "+ eventBuffer.size() + "  ---"+ this.toString());
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_agent_houre_cdr_peer_report_log", EventUtil.convertToDocument(event));
    }

    @Override
    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_agent_houre_cdr_peer_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if(event.getType().equals(CdrEventType.CDR_PEER)){
                Object agentIDObj = data.get("AGENT");
                if (agentIDObj == null || data.get("END_TIME") == null) {
                    log.warning("AgentHour cdrPeer AGENT or END_TIME is null!\n" + data.toString());
                    return;
                }
                String agent = agentIDObj.toString();
                String account = data.get("ACCOUNT_ID").toString();
                String beginTime = data.get("BEGIN_TIME").toString();
                String endTime = data.get("END_TIME").toString();
                String reportTime = Utils.getReportTime(endTime);
                int allTimeLength = Utils.getTimeLength(beginTime, endTime);
                int recentlyTimeLength = Utils.getTimeLength(reportTime, endTime);

                String stateType = data.get("ACTION_TYPE").toString().toUpperCase();
                String busyType = "";
                if (stateType.equalsIgnoreCase("BUSY")) {
                    busyType = data.get("BUSY_TYPE").toString();
                    if (busyType.equals("0")) {
                        stateType = "IDLE";
                    } else if (busyType.equals("1")) {
                        stateType = "BUSY";
                    } else {
                        stateType = "STATE" + busyType;
                    }
                }
                if(recentlyTimeLength >= allTimeLength){
                    //未跨统计区间
                    int timeLength = 0;
                    if (busyType.equals("99")) {
                        BasicDBObject findOneCdr = new BasicDBObject();
                        findOneCdr.put("DISPOSAL_AGENT", agent);
                        findOneCdr.put("BEGIN_TIME", beginTime);
                        BasicDBObject agentCallSheet = MongoProvider.findOneFromApp(AccountUtil.getAccountDb(data.get("ACCOUNT_ID").toString()), data.get("ACCOUNT_ID") + "_c5_call_sheet", findOneCdr);
                        if (agentCallSheet != null) {
                            if(agentCallSheet.get("CALL_TIME_LENGTH") == null){
                                agentCallSheet.put("CALL_TIME_LENGTH", Utils.getTimeLength(agentCallSheet.get("BEGIN_TIME").toString(), agentCallSheet.get("END_TIME").toString()));
                            }
                            timeLength = allTimeLength - Integer.valueOf(agentCallSheet.get("CALL_TIME_LENGTH").toString());
                            try{
                                if(timeLength > 0){
                                    BasicDBObject find99cdr = new BasicDBObject();
                                    find99cdr.put("DISPOSAL_AGENT", agent);
                                    find99cdr.put("OFFERING_TIME", new BasicDBObject("$gte", beginTime.split(" ")[0]));
                                    find99cdr.put("BEGIN_TIME", new BasicDBObject("$gt", beginTime));
                                    find99cdr.put("END_TIME", new BasicDBObject("$lt", endTime));
                                    find99cdr.put("CALL_TIME_LENGTH", new BasicDBObject("$lt", timeLength));
                                    List<BasicDBObject> theList = MongoProvider.findFromApp(AccountUtil.getAccountDb(data.get("ACCOUNT_ID").toString()), data.get("ACCOUNT_ID")+"_c5_call_sheet",find99cdr);
                                    if(theList!=null && theList.size()>0){
                                        for(int i=0;i<theList.size();i++){
                                            int theCdrTimeLength = Integer.valueOf(theList.get(i).get("CALL_TIME_LENGTH").toString());
                                            if(beginTime.compareTo(theList.get(i).get("BEGIN_TIME").toString()) < 0 && endTime.compareTo(theList.get(i).get("END_TIME").toString()) > 0 && timeLength > theCdrTimeLength){
                                                timeLength = timeLength - theCdrTimeLength;
                                            }
                                        }
                                    }
                                }
                            }catch(Exception e){
                                log.log(Level.WARNING, "Collect agent hour report cdr peer deal peer 99 busy data error: \r\n"
                                        + data.toString() + "," + reportTime, e);
                            }
                        }
                    } else {
                        timeLength = Utils.getTimeLength(beginTime, endTime);
                    }
                    if (timeLength > 0) {
                        doCdrPeerDB(agent, Utils.getReportTime(endTime), stateType, account, timeLength);
                    }
                }else{
                    //跨统计区间的
                    int timeLength = 0;
                    if (busyType.equals("99")) {
                        BasicDBObject findOneCdr = new BasicDBObject();
                        findOneCdr.put("DISPOSAL_AGENT", agent);
                        findOneCdr.put("BEGIN_TIME", beginTime);
                        BasicDBObject agentCallSheet = MongoProvider.findOneFromApp(AccountUtil.getAccountDb(data.get("ACCOUNT_ID").toString()), data.get("ACCOUNT_ID") + "_c5_call_sheet", findOneCdr);
                        if (agentCallSheet != null) {
                            if(agentCallSheet.get("CALL_TIME_LENGTH") == null){
                                agentCallSheet.put("CALL_TIME_LENGTH", Utils.getTimeLength(agentCallSheet.get("BEGIN_TIME").toString(), agentCallSheet.get("END_TIME").toString()));
                            }
                            timeLength = allTimeLength - Integer.valueOf(agentCallSheet.get("CALL_TIME_LENGTH").toString());
                            try{
                                if(timeLength > 0){
                                    BasicDBObject find99cdr = new BasicDBObject();
                                    find99cdr.put("DISPOSAL_AGENT", agent);
                                    find99cdr.put("OFFERING_TIME", new BasicDBObject("$gte", beginTime.split(" ")[0]));
                                    find99cdr.put("BEGIN_TIME", new BasicDBObject("$gt", beginTime));
                                    find99cdr.put("END_TIME", new BasicDBObject("$lt", endTime));
                                    find99cdr.put("CALL_TIME_LENGTH", new BasicDBObject("$lt", timeLength));
                                    List<BasicDBObject> theList = MongoProvider.findFromApp(AccountUtil.getAccountDb(data.get("ACCOUNT_ID").toString()), data.get("ACCOUNT_ID")+"_c5_call_sheet",find99cdr);
                                    if(theList!=null && theList.size()>0){
                                        for(int i=0;i<theList.size();i++){
                                            int theCdrTimeLength = Integer.valueOf(theList.get(i).get("CALL_TIME_LENGTH").toString());
                                            if(beginTime.compareTo(theList.get(i).get("BEGIN_TIME").toString()) < 0 && endTime.compareTo(theList.get(i).get("END_TIME").toString()) > 0 && timeLength > theCdrTimeLength){
                                                timeLength = timeLength - theCdrTimeLength;
                                            }
                                        }
                                    }
                                }
                            }catch(Exception e){
                                log.log(Level.WARNING, "Collect agent hour report cdr peer deal peer 99 busy data error: \r\n"
                                        + data.toString() + "," + reportTime, e);
                            }
                        }
                        if (timeLength > 0) {
                            doCdrPeerDB(agent, Utils.getReportTime(endTime), stateType, account, timeLength);
                        }
                    } else {
                        int overflowTimeLength = allTimeLength - recentlyTimeLength;
                        doCdrPeerDB(agent, Utils.getReportTime(endTime), stateType, account, recentlyTimeLength);
                        if(overflowTimeLength < 1800){
                            String lastReportTime = Utils.getLastReportTime(endTime);
                            doCdrPeerDB(agent, lastReportTime, stateType, account, overflowTimeLength);
                        }else{
                            int overCount = overflowTimeLength/1800;
                            String currentlastReportTime = endTime;
                            for(int i=0; i<overCount;i++){
                                currentlastReportTime = Utils.getLastReportTime(currentlastReportTime);
                                doCdrPeerDB(agent, currentlastReportTime, stateType, account, 1800);
                            }
                            int lastestOverflowTimeLength  = overflowTimeLength - overCount * 1800;
                            if(lastestOverflowTimeLength > 0){
                                currentlastReportTime = Utils.getLastReportTime(currentlastReportTime);
                                doCdrPeerDB(agent, currentlastReportTime, stateType, account, lastestOverflowTimeLength);
                            }
                        }
                    }
                }
            }else{
                log.warning("AgentHourCdrPeerReportHandler don't know event type." + event.getType());
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "AgentHourCdrPeerReportHandler handle event failed", e);
        }
    }

    private void doCdrPeerDB(String agent, String reportTime, String stateType, String account,int timeLength){
        BasicDBObject find = new BasicDBObject();
        find.put("ReportTime", reportTime);
        find.put("AgentID", agent);
        List<BasicDBObject> list = MongoProvider.find("cdr_report_agent_houre", find);
        if(list.size() > 0){
            BasicDBObject update = new BasicDBObject();
            update.put("$inc", new BasicDBObject(stateType + "_TIME_LENGTH", timeLength));
            MongoProvider.update("cdr_report_agent_houre", find, update, true);
        }else{
            BasicDBObject doc = new BasicDBObject();
            doc.put("AccountID", account);
            doc.put("ReportTime", reportTime);
            doc.put("YearID", Utils.getYearID(reportTime));
            doc.put("MonthID", Utils.getMonthID(reportTime));
            doc.put("DayID", Utils.getDayID(reportTime));
            doc.put("AgentID", agent);
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
            doc.put(stateType + "_TIME_LENGTH", timeLength);
            MongoProvider.insertDBObject("cdr_report_agent_houre", doc);
        }
    }

    public void close() {
        running = false;
    }
}
