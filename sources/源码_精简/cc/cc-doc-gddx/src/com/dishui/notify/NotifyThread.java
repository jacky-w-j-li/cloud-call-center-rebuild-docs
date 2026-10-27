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
                if(type.equals("saleChance")||type.equals("batchCustRecyle")||type.equals("approvalBusiness")||type.equals("batchUpdateOwner")||
                        type.equals("updateOwner") ||type.equals("assignOut")||type.equals("assign")||type.equals("batchAssignOut")||
                        type.equals("batchAssign")||type.equals("batchImportAssign")){
                    String uid = notifyObj.get("uid").toString();
                    if(type.equals("approvalBusiness")){
                        uid = notifyObj.get("sourceOwner").toString();
                    }
                    DBObject userRemind = MongoProvider.findOne("bill", "platform_user",new BasicDBObject("_id",uid));
                    if(userRemind!=null&&userRemind.containsField("custRemind")){
                        String custRemind = userRemind.get("custRemind").toString();
                        if(custRemind.equals("0")){
                            MongoProvider.remove(app_notify, new BasicDBObject().append("_id", notifyObj.get("_id")));
                            continue;
                        }
                    }
                }
                if (type.equals("saleChance")) {
                    if (!NotifyService.notifySaleChance(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("saleChanceManager")) {
                    if (!NotifyService.notifySaleChanceManager(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }

                } else if (type.equals("custRecyle")) {//废弃
//                    if (!NotifyService.notifyCustRecyle((String) notifyObj.get("uid"), (String) notifyObj.get("cid"),(String) notifyObj.get("sysStatus"))) {
//                        MongoProvider.insert(app_notify_error, notifyObj);
//                    }
                } else if(type.equals("batchCustRecyle")){
                    if(!NotifyService.notifyBtachCustRecyle(notifyObj)){
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("approvalBusiness")) {
                    if (!NotifyService.notifyApprovalBusiness(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("batchUpdateOwner")) {
                    if (!NotifyService.updateCustomerCategory(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("updateOwner")) {
                    if (!NotifyService.notifyCustAdminRecyle(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("assignOut")) {
                    if (!NotifyService.notifyCustAdminAssignOut(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("assign")) {
                    if (!NotifyService.notifyCustAdminAssign(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("batchAssignOut")) {
                    if (!NotifyService.notifyCustAdminBatchAssignOut(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if (type.equals("batchAssign")) {
                    if (!NotifyService.notifyCustAdminBatchAssign(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                } else if(type.equals("batchImportAssign")){
                    if (!NotifyService.notifyCustBatchImportAssign(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                }else if(type.equals("businessUser")){
                    if (!NotifyService.notifyBusinessUser(notifyObj)) {
                        MongoProvider.insert(app_notify_error, notifyObj);
                    }
                }
                else {
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


