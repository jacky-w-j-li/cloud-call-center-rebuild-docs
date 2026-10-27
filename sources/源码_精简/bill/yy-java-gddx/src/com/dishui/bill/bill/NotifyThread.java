package com.dishui.bill.bill;

import com.dishui.bill.alert.AlertService;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.logging.Level;
import java.util.logging.Logger;

public class NotifyThread extends Thread {
    private static Logger log = Logger.getLogger(NotifyThread.class.getName());

    @Override
    public void run() {
        DBObject notifyObj = null;
        while (true) {
            try {
                notifyObj = MongoProvider.findOne("bill_notify", new BasicDBObject());
                if (notifyObj == null) {
                    sleep(1000);
                    continue;
                }
                String type = (String) notifyObj.get("type");
                if (type.equals("voicemail")) {
                    if (!AlertService.notifyNewVoicemail((String) notifyObj.get("id"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("outCallAlert")) {
                    if (!AlertService.outCallAlert((String) notifyObj.get("account"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("callOver")) {
                    if (!AlertService.callOver(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("serviceNumAlert")) {
                    if (!AlertService.serviceNumAlert((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("serviceNumEnd")) {
                    if (!AlertService.serviceNumEnd((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("num400End")) {
                    if (!AlertService.num400End((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("num400Alert")) {
                    if (!AlertService.num400Alert((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("serviceNumDrop")) {
                    if (!AlertService.serviceNumDrop((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("num400Drop")) {
                    if (!AlertService.num400Drop((String) notifyObj.get("account"), (String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("dialAlert")) {
                    if (!AlertService.dialAlert(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("oweAlert")) {
                    if (!AlertService.oweAlert(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("reduceConcurrent")) {
                    if (!AlertService.reduceConcurrent(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("licenceAlert")) {
                    if (!AlertService.licenceAlert(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("ccNumAlert")) {
                    if (!AlertService.ccNumAlert(notifyObj)) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("waitPayEnd")) {
                    if (!AlertService.waitPayEnd((String) notifyObj.get("num"))) {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                    }
                } else if (type.equals("telDialCountAlert")) {
//                    if (!AlertService.telDialCountAlert(notifyObj)) {
//                        MongoProvider.insert("bill_notify_error", notifyObj);
//                    }
                } else {
                    MongoProvider.insert("bill_notify_error", notifyObj);
                }
                MongoProvider.remove("bill_notify", new BasicDBObject().append("_id", notifyObj.get("_id")));
            } catch (Exception e) {
                log.log(Level.WARNING, "process notify  exception! ", e);
                e.printStackTrace();
                if (notifyObj != null) {
                    try {
                        MongoProvider.insert("bill_notify_error", notifyObj);
                        MongoProvider.remove("bill_notify", new BasicDBObject().append("_id", notifyObj.get("_id")));
                    } catch (Exception exception) {
                        exception.printStackTrace();
                    }
                }
                try {
                    sleep(1000);
                } catch (Exception exception) {
                    exception.printStackTrace();
                }
            }
        }
    }
}
