package com.dishui.manager.cdrReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.CdrEventListener;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 3/10/16.
 */
public class CallInReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(CallInReportHandler.class
            .getName());

    private boolean running = true;

    public CallInReportHandler() {
        Thread t = new Thread("CallInReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("cdr_call_in_report_overflow_events", new BasicDBObject(), 10000);
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
            log.warning("cdr_call_in buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_call_in_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_call_in_report_log", EventUtil.convertToDocument(event));
    }

    @Override
    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_call_in_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if(data.get("CONNECT_TYPE").equals("normal")){
                if (data.get("OFFERING_TIME") == null || data.get("END_TIME") == null) {
                    log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + data.toString());
                    return;
                }
                String serviceNo = data.get("CALLED_NO").toString();
                String endTime = data.get("END_TIME").toString();
                String province = data.get("PROVINCE").toString();
                if(province.equals("")){
                    province = "未知号段";
                }
                String district = data.get("DISTRICT").toString();
                if(district.equals("")){
                    district = "未知号段";
                }
                BasicDBObject find = new BasicDBObject();
                find.put("AccountID", data.get("ACCOUNT_ID"));
                find.put("ReportTime", Utils.getReportTime(endTime));
                find.put("Service", serviceNo);
                find.put("Province", province);
                find.put("City", district);

                String status = data.get("STATUS").toString();
                int DealingCount = 0;
                int NotDealCount = 0;
                int QueueLeakCount = 0;
                int LeakCount = 0;
                int VoicemailCount = 0;
                int BlackListCount = 0;
                if (status.equals("dealing")) {
                    DealingCount++;
                } else if (status.equals("notDeal")) {
                    NotDealCount++;
                } else if (status.equals("queueLeak")) {
                    QueueLeakCount++;
                } else if (status.equals("leak")) {
                    LeakCount++;
                } else if (status.equals("voicemail")) {
                    VoicemailCount++;
                } else if (status.equals("blackList")) {
                    BlackListCount++;
                } else {
                    log.warning("CallInReportHandler Unknow call sheet status: \r\n" + data.toString());
                    return;
                }

                List<BasicDBObject> list = MongoProvider.find("cdr_report_service_call_in", find);
                if(list.size() > 0){
                    BasicDBObject update = new BasicDBObject();
                    if(DealingCount > 0)
                        update.put("$inc",new Document("DealingCount", 1));
                    if(NotDealCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("NotDealCount", 1);
                        }else{
                            update.put("$inc",new Document("NotDealCount", 1));
                        }
                    }
                    if(QueueLeakCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("QueueLeakCount", 1);
                        }else{
                            update.put("$inc",new Document("QueueLeakCount", 1));
                        }
                    }
                    if(LeakCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("LeakCount", 1);
                        }else{
                            update.put("$inc",new Document("LeakCount", 1));
                        }
                    }
                    if(VoicemailCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("VoicemailCount", 1);
                        }else{
                            update.put("$inc",new Document("VoicemailCount", 1));
                        }
                    }
                    if(BlackListCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("BlackListCount", 1);
                        }else{
                            update.put("$inc",new Document("BlackListCount", 1));
                        }
                    }
                    MongoProvider.update("cdr_report_service_call_in", find, update, true);
                }else{
                    Document doc = new Document();
                    doc.put("AccountID", data.get("ACCOUNT_ID"));
                    doc.put("Service", serviceNo);
                    doc.put("ReportTime", Utils.getReportTime(endTime));
                    doc.put("YearID", Utils.getYearID(endTime));
                    doc.put("MonthID", Utils.getMonthID(endTime));
                    doc.put("DayID", Utils.getDayID(endTime));
                    doc.put("Province", province);
                    doc.put("City", district);

                    doc.put("DealingCount", DealingCount);
                    doc.put("NotDealCount", NotDealCount);
                    doc.put("QueueLeakCount", QueueLeakCount);
                    doc.put("LeakCount", LeakCount);
                    doc.put("VoicemailCount", VoicemailCount);
                    doc.put("BlackListCount", BlackListCount);
                    MongoProvider.insert("cdr_report_service_call_in", doc);
                    //补充当天空白时间段
                    fixTodayBeforeReport(data.get("ACCOUNT_ID").toString(), serviceNo, endTime);
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "CallInReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }

    private void fixTodayBeforeReport(String account, String serviceNo, String endTime){
        String lastReportTime = Utils.getLastReportTime(endTime);
        if(Utils.getDefaultCurrentDate().equals(lastReportTime.split(" ")[0])){
            BasicDBObject find = new BasicDBObject();
            find.put("AccountID", account);
            find.put("ReportTime", new BasicDBObject("$lte", lastReportTime));
            find.put("Service", serviceNo);
            find.put("DayID", Utils.getDayID(endTime));
            List<BasicDBObject>  list = MongoProvider.find("cdr_report_service_call_in", find, new BasicDBObject("ReportTime", -1), 1);
            if(list.size() > 0){
                if(list.get(0).get("ReportTime").toString().compareTo(lastReportTime) < 0) {
                    log.log(Level.INFO, "call in fixTodayBeforeReport one time "+account+":" + lastReportTime);
                    Document doc = new Document();
                    doc.put("AccountID", account);
                    doc.put("Service", serviceNo);
                    doc.put("ReportTime", lastReportTime);
                    doc.put("YearID", Utils.getYearID(lastReportTime));
                    doc.put("MonthID", Utils.getMonthID(lastReportTime));
                    doc.put("DayID", Utils.getDayID(lastReportTime));
                    doc.put("Province", "未知号段");
                    doc.put("City", "未知号段");

                    doc.put("DealingCount", 0);
                    doc.put("NotDealCount", 0);
                    doc.put("QueueLeakCount", 0);
                    doc.put("LeakCount", 0);
                    doc.put("VoicemailCount", 0);
                    doc.put("BlackListCount", 0);
                    MongoProvider.insert("cdr_report_service_call_in", doc);
                    //递归补充空白时间段
                    fixTodayBeforeReport(account, serviceNo, lastReportTime);
                }
            }
        }
    }

//    public static void main(String[] args) {
//        String time = "2016-03-10 11:59:59";
//
//        String[] dayArr = time.split(" ");
//        String[] timeArr = dayArr[1].split(":");
//        String result = dayArr[0] + " ";
//        int min = Integer.parseInt(timeArr[1]);
//
//        if(min >= 0 && min < 30){
//            result += timeArr[0] + ":00:00";
//        }else if(min >= 30){
//            result += timeArr[0] + ":30:00";
//        }
//
//        System.out.println(result);
//    }
}
