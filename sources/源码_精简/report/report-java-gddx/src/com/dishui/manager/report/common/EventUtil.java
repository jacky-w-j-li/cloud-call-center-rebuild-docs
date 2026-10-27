package com.dishui.manager.report.common;

import com.dishui.manager.report.model.Event;
import org.bson.Document;

import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/**
 * Created by yaxi on 15-11-12.
 */
public class EventUtil {

    public static Document convertToDocument(Event event){
        Document document = new Document();
        document.append("_id", event.getId());
        document.append("account", event.getAccount());
        document.append("reportTime", event.getReportTime());
        document.append("reportStatus", event.getReportStatus());
        document.append("type", event.getType());
        Document document1 = new Document();
        for(Iterator iterator = event.getBusinessData().entrySet().iterator(); iterator.hasNext();){
            Map.Entry<String, Object> entry = (Map.Entry<String, Object>) iterator.next();
            String key = entry.getKey();
            Object value = entry.getValue();
            document1.append(key, value);
        }
        document.append("businessData", document1);
        return document;
    }
}
