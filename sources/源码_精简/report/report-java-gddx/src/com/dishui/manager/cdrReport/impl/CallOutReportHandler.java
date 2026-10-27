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
 * Created by chenguang on 3/15/16.
 */
public class CallOutReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(CallOutReportHandler.class
            .getName());

    private boolean running = true;

    public CallOutReportHandler() {
        Thread t = new Thread("CallOutReportHandler buffer thread") {
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
                        List<BasicDBObject> list = MongoProvider.find("cdr_call_out_report_overflow_events", new BasicDBObject(), 10000);
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
            log.warning("cdr_call_out buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_call_out_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_call_out_report_log", EventUtil.convertToDocument(event));
    }

    public void addToBufList(ArrayList<Event> eventList) {
            synchronized (eventBuffer) {
                eventBuffer.addAll(eventList);
                eventBuffer.notify();
            }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_call_out_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if(data.get("CONNECT_TYPE").equals("dialout")){
                if (data.get("OFFERING_TIME") == null
                        || data.get("END_TIME") == null) {
                    log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + data.toString());
                    return;
                }
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
                find.put("Province", province);
                find.put("City", district);

                String status = data.get("STATUS").toString();
                int DealingCount = 0;
                int NotDealCount = 0;
                int LeakCount = 0;
                int CallTimeLength = 0;
                if (status.equals("dealing")) {
                    DealingCount++;
                } else if (status.equals("notDeal")) {
                    NotDealCount++;
                } else if (status.equals("leak")) {
                    LeakCount++;
                } else {
                    log.warning("CallOutReportHandler Unknow call sheet status: \r\n" + data.toString());
                    return;
                }
                if (status.equals("dealing")) {
                    String beginTime = data.get("BEGIN_TIME")
                            .toString();
                    CallTimeLength = Utils.getTimeLength(beginTime, endTime);
                    CallTimeLength = CallTimeLength > 0 ? CallTimeLength : 0;
                }
                List<BasicDBObject> list = MongoProvider.find("cdr_report_call_out", find);
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
                    if(LeakCount > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("LeakCount", 1);
                        }else{
                            update.put("$inc",new Document("LeakCount", 1));
                        }
                    }
                    if(CallTimeLength > 0){
                        if(update.containsField("$inc")){
                            ((Document)update.get("$inc")).put("CallTimeLength", CallTimeLength);
                        }else{
                            update.put("$inc",new Document("CallTimeLength", CallTimeLength));
                        }
                    }
                    MongoProvider.update("cdr_report_call_out", find, update, true);
                }else{
                    Document doc = new Document();
                    doc.put("AccountID", data.get("ACCOUNT_ID"));
                    doc.put("ReportTime", Utils.getReportTime(endTime));
                    doc.put("YearID", Utils.getYearID(endTime));
                    doc.put("MonthID", Utils.getMonthID(endTime));
                    doc.put("DayID", Utils.getDayID(endTime));
                    doc.put("Province", province);
                    doc.put("City", district);

                    doc.put("DealingCount", DealingCount);
                    doc.put("NotDealCount", NotDealCount);
                    doc.put("LeakCount", LeakCount);
                    doc.put("CallTimeLength", CallTimeLength);
                    MongoProvider.insert("cdr_report_call_out", doc);
                    //补充当天空白时间段
                    fixTodayBeforeReport(data.get("ACCOUNT_ID").toString(), endTime);
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "CallOutReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }

    private void fixTodayBeforeReport(String account, String endTime){
        String lastReportTime = Utils.getLastReportTime(endTime);
        if(Utils.getDefaultCurrentDate().equals(lastReportTime.split(" ")[0])){
            BasicDBObject find = new BasicDBObject();
            find.put("AccountID", account);
            find.put("ReportTime", new BasicDBObject("$lte", lastReportTime));
            find.put("DayID", Utils.getDayID(endTime));

            List<BasicDBObject> list = MongoProvider.find("cdr_report_call_out", find, new BasicDBObject("ReportTime", -1), 1);
            if(list.size() > 0){
                if(list.get(0).get("ReportTime").toString().compareTo(lastReportTime) < 0){
                    log.log(Level.INFO, "call out fixTodayBeforeReport one time "+account+":" + lastReportTime);
                    Document doc = new Document();
                    doc.put("AccountID", account);
                    doc.put("ReportTime", lastReportTime);
                    doc.put("YearID", Utils.getYearID(lastReportTime));
                    doc.put("MonthID", Utils.getMonthID(lastReportTime));
                    doc.put("DayID", Utils.getDayID(lastReportTime));
                    doc.put("Province", "未知号段");
                    doc.put("City", "未知号段");

                    doc.put("DealingCount", 0);
                    doc.put("NotDealCount", 0);
                    doc.put("LeakCount", 0);
                    doc.put("CallTimeLength", 0);
                    MongoProvider.insert("cdr_report_call_out", doc);
                    //递归补充空白时间段
                    fixTodayBeforeReport(account, lastReportTime);
                }
            }
//            if(one == null){
//                Document doc = new Document();
//                doc.put("AccountID", account);
//                doc.put("ReportTime", lastReportTime);
//                doc.put("YearID", Utils.getYearID(lastReportTime));
//                doc.put("MonthID", Utils.getMonthID(lastReportTime));
//                doc.put("DayID", Utils.getDayID(lastReportTime));
//                doc.put("Province", "未知号段");
//                doc.put("City", "未知号段");
//
//                doc.put("DealingCount", 0);
//                doc.put("NotDealCount", 0);
//                doc.put("LeakCount", 0);
//                doc.put("CallTimeLength", 0);
//                MongoProvider.insert("cdr_report_call_out", doc);
//                //递归补充空白时间段
//                fixTodayBeforeReport(account, lastReportTime);
//            }
        }
    }

}
