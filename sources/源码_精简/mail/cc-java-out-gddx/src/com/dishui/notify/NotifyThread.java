package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class NotifyThread extends Thread {
    private static Logger log = Logger.getLogger(NotifyThread.class.getName());
    private static final String app_notify="app_notify";
    private static final String app_notify_error="app_notify_error";

    @Override
    public void run() {
        DBObject notifyObj = null;
        while (true) {
            try {
                notifyObj = MongoProvider.findOne(app_notify, new BasicDBObject());
                if (notifyObj == null) {
                    sleep(1000);
                    continue;
                }
                String type = (String) notifyObj.get("type");
                if (type.equals("saleChance")) {
                    if (!NotifyService.notifySaleChance((String) notifyObj.get("uid"), (String) notifyObj.get("cid"))) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("saleChanceManager")) {
                    if (!NotifyService.notifySaleChanceManager((List)notifyObj.get("uids"),(String) notifyObj.get("cid"))) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else {
                    MongoProvider.insert("app_notify_error", notifyObj);
                }
                MongoProvider.remove(app_notify, new BasicDBObject().append("_id", notifyObj.get("_id")));
            } catch (Exception e) {
                log.log(Level.WARNING, "process notify  exception! ", e);
                e.printStackTrace();
                if (notifyObj != null) {
                    try {
                        MongoProvider.insert(app_notify_error, notifyObj);
                        MongoProvider.remove(app_notify, new BasicDBObject().append("_id", notifyObj.get("_id")));
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


