package com.dishui.report;

import com.dishui.db.mango.MongoConnect;

import java.util.Map;

/**
 * Created by jackwong on 16/1/12.
 */
public class EventReporter {
    public static void emitOperationReportEvent(EventData event){
        MongoConnect.getInstance().getReportDB().getCollection("bill_report_event").insert(event.toDB());
    }
}
