package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;
import com.mongodb.WriteConcern;
import com.mongodb.client.model.UpdateOptions;

import java.util.Map;
import java.util.logging.Logger;


public class CustomerStatusReportHandler {
    private static final Logger log = Logger.getLogger(CustomerStatusReportHandler.class.getName());
    private static String OWNER_NA = "NA";

    public static void addStatus(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;

        BasicDBObject condition = new BasicDBObject();
        String categoryId = map.get("categoryId").toString();
        String owner = map.get("owner").toString();
        if(owner.equals(categoryId)){
            owner = OWNER_NA;
        }
//        condition.put("_id", Utils.getUniqueid());
        condition.put("user", owner);
        condition.put("account", event.getAccount());

        String status = "";
        if(map.get("status") != null){
            status = (String)map.get("status");
        }
        BasicDBObject incDoc = new BasicDBObject();
        if(!status.equals("")){
            incDoc.put(status, 1);
            MongoProvider.update(Constant.CUSTOMER_STATUS_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }
    }


    public static void updateStatus(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
//        condition.put("user", map.get("owner"));
        condition.put("account", event.getAccount());

        String owner = (String)map.get("owner");
        if(owner==null) return;
        String oldOwner = "";
        if(map.get("oldOwner")!=null){
            oldOwner = (String)map.get("oldOwner");
        }else{
            oldOwner = owner;
        }
        String categoryId = "NA";
        String oldCategoryId = "NA";
        String status = "";
        String oldStatus = "";
        if(map!=null){
            if(map.get("categoryId")!=null){
                categoryId = (String)map.get("categoryId");
                if(owner.equals(categoryId)){
                    owner = OWNER_NA;
                }
            }
            if(map.get("oldCategoryId")!=null){
                oldCategoryId = (String)map.get("oldCategoryId");
                if(oldOwner.equals(oldCategoryId)){
                    oldOwner = OWNER_NA;
                }
            }
            if(map.get("status") != null){
                if(!map.get("status").equals("")){
                    status = (String)map.get("status");
                }
            }
            if(map.get("oldStatus") != null){
                if(!map.get("oldStatus").equals("")){
                    oldStatus = (String)map.get("oldStatus");
                }
            }
        }

//        if(owner.equals(oldOwner) && status.equals(oldStatus)){
//            return;
//        }
        if(!owner.equals(oldOwner)){
                if(!oldStatus.equals("")){
                    condition.put("user",oldOwner);
                    MongoProvider.update(Constant.CUSTOMER_STATUS_REPORT_TABLE, condition, new BasicDBObject("$inc", new BasicDBObject(oldStatus, -1)), true);

                }
                if(!status.equals("")){
                    condition.put("user", owner);
                    UpdateOptions updateOptions = new UpdateOptions();
                    updateOptions.upsert(true);
                    MongoConnect.getInstance().getDB().getCollection(Constant.CUSTOMER_STATUS_REPORT_TABLE).withWriteConcern(WriteConcern.SAFE).
                            updateOne(condition,new BasicDBObject("$inc", new BasicDBObject(status, 1)), updateOptions);

                }

        }else{
            if(!status.equals(oldStatus)){
                BasicDBObject incDoc = new BasicDBObject();
                if(!status.equals("")){
                    incDoc.put(status, 1);
                    if(!oldStatus.equals("")){
                        incDoc.put(oldStatus, -1);
                    }
                    condition.put("user", owner);
                    MongoProvider.update(Constant.CUSTOMER_STATUS_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        }
    }

    public static void delStatus(Event event){
        Map<String, Object> map = event.getBusinessData();
        String tType = (String)map.get("tType");

        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        String categoryId ="";
        String owner = "";
        String delOwner = "";
        String delCategoryId = "";
        String status = "";
        if(tType.equalsIgnoreCase("mergeCust")){
            delCategoryId = map.get("delCategoryId").toString();
            delOwner = map.get("delOwner").toString();
            if(delOwner.equals(delCategoryId)){
                delOwner = OWNER_NA;
            }
            condition.put("user",delOwner);
            if(map != null && map.get("delStatus") != null){
                if(!map.get("delStatus").equals("")){
                    status = (String)map.get("delStatus");
                }
            }
        }else{
            categoryId = map.get("categoryId").toString();
            owner = map.get("owner").toString();
            if(owner.equals(categoryId)){
                owner = OWNER_NA;
            }
            condition.put("user", owner);
            if(map != null && map.get("status") != null){
                if(!map.get("status").equals("")){
                    status = (String)map.get("status");
                }
            }
        }

        BasicDBObject incDoc = new BasicDBObject();
        if(!status.equals("")){
            incDoc.put(status, -1);
            MongoProvider.update(Constant.CUSTOMER_STATUS_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }
    }

}
