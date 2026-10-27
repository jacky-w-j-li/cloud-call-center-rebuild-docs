package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;


public class CustomerCommonReportHandler {
    private static final Logger log = Logger.getLogger(CustomerCommonReportHandler.class.getName());
    private static String CATEGORY_NA = "NA";
    private static String OWNER_NA = "NA";

    /**
     * {
     "_id" : ObjectId("56e27530839d8045862e3dbd"),
     "account" : "N00000000143",
     "categoryId" : "59518670-3f0c-11e4-b73a-e12552db917d",
     "day" : "20151203",
     "month" : "201512",
     "year" : "2015",
     "add" : 0,
     "assign" : 0,
     "leave" : 0,
     }
     * @param event
     */
    public static void addToCommon(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;
        String owner = (String)map.get("owner");
        String categoryId = (String)map.get("categoryId");
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("categoryId",categoryId);
        if(categoryId.equals(CATEGORY_NA)) return;
        if(owner.equals(categoryId)){
            BasicDBObject incDoc = new BasicDBObject();
            incDoc.put("add", 1);
            incDoc.put("surplus",1);
            incDoc.put("total",1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }
    }

    public static void updateToCommon(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        String tType =  (String)map.get("tType");
        String oldOwner =  (String)map.get("oldOwner");
        String oldCategoryId = (String)map.get("oldCategoryId");
        String owner = (String)map.get("owner");
        String categoryId = (String)map.get("categoryId");
        if(owner==null)return;
        if(oldOwner==null)return;
        if(categoryId==null)return;
        if(oldCategoryId==null)return;
        BasicDBObject incDoc = new BasicDBObject();
        if(tType.equals("changePool")){
            if(oldCategoryId.equals("NA")&&!categoryId.equals("NA")){
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                incDoc.put("transfer",1);
                incDoc.put("total",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else if(!categoryId.equals("NA")&&oldCategoryId.equals(categoryId)&&!oldOwner.equals(oldCategoryId)&&owner.equals(categoryId)){
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                incDoc.put("transfer",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else if(!categoryId.equals("NA")&&!oldCategoryId.equals(categoryId)&&owner.equals(categoryId)){
                if(oldCategoryId.equals(oldOwner)&&!oldCategoryId.equals("NA")){
                    condition.put("categoryId",oldCategoryId);
                    incDoc.put("surplus",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                incDoc.put("transfer",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else if(!oldCategoryId.equals("NA")&&categoryId.equals("NA")&&owner.equals("NA")){
                condition.put("categoryId",oldCategoryId);
                if(oldCategoryId.equals(oldOwner)){
                    incDoc.put("surplus",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }else{
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }

            }
        }else if(tType.equals("autoAssignPool")||tType.equals("claim")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId", categoryId);
            incDoc.put("assign", 1);
            incDoc.put("surplus",-1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if(tType.equals("assign")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId", categoryId);
            if(!oldOwner.equals(oldCategoryId))return;
            incDoc.put("assign", 1);
            incDoc.put("surplus",-1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if(tType.equals("recyclePool")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId",categoryId);
            incDoc.put("surplus",1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if(tType.equals("update")||tType.equals("updateOwner")||tType.equals("mergeCust")){
            if(oldCategoryId.equals("NA")&&!categoryId.equals("NA")){
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                incDoc.put("transfer",1);
                incDoc.put("total",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc),true);
            }else if(!categoryId.equals("NA")&&owner.equals(categoryId)&&!oldCategoryId.equals(categoryId)){
                if(oldOwner.equals(oldCategoryId)&&!oldCategoryId.equals("NA")){
                    condition.put("categoryId",oldCategoryId);
                    incDoc.put("surplus",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc), true);
                }
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                incDoc.put("transfer",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);


            }else if(!categoryId.equals("NA")&&oldCategoryId.equals(categoryId)&&oldOwner.equals(oldCategoryId)&&!owner.equals(categoryId)){
                condition.put("categoryId",oldCategoryId);
                incDoc.put("assign", 1);
                incDoc.put("surplus",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc), true);
            }else if(!categoryId.equals("NA")&&oldCategoryId.equals(categoryId)&&!oldOwner.equals(oldCategoryId)&&owner.equals(categoryId)){
                condition.put("categoryId",oldCategoryId);
                incDoc.put("surplus",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc), true);
            }else if(!oldCategoryId.equals("NA")&&categoryId.equals("NA")&&owner.equals("NA")){
                if(oldOwner.equals(oldCategoryId)){
                    condition.put("categoryId",oldCategoryId);
                    incDoc.put("surplus",-1);
                    incDoc.put("total",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc), true);
                }else{
                    condition.put("categoryId",oldCategoryId);
                    incDoc.put("total",-1);
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE,condition,new BasicDBObject("$inc", incDoc), true);
                }
            }
        }else if(tType.equals("updateSysStatus")){
            if(categoryId.equals("NA"))return;
            String status = (String)map.get("sysStatus");
            if(status.equals("0")||status.equals("2")||status.equals("4")){
                condition.put("categoryId",categoryId);
                incDoc.put("surplus",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }else if(tType.equals("transferPool")){
            if(!categoryId.equals("NA")&&owner.equals(categoryId)&&!oldCategoryId.equals(categoryId)) {
                if (oldOwner.equals(oldCategoryId) && !oldCategoryId.equals("NA")) {
                    condition.put("categoryId", oldCategoryId);
                    incDoc.put("surplus", -1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
                condition.put("categoryId", categoryId);
                incDoc.put("surplus", 1);
                incDoc.put("transfer", 1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }

    }

    public static void delCommon(Event event){
        Map<String, Object> map = event.getBusinessData();
        String tType = (String)map.get("tType");
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        if(tType.equals("mergeCust")){
            String delOwner = map.get("delOwner").toString();
            String delCategoryId = map.get("delCategoryId").toString();
            condition.put("categoryId",delCategoryId);
            BasicDBObject incDoc = new BasicDBObject();
            if(delCategoryId.equals(CATEGORY_NA))return;
            if(delOwner.equals(delCategoryId)){
                incDoc.put("del",1);
                incDoc.put("surplus",-1);
                incDoc.put("total",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else{
                incDoc.put("del",1);
                incDoc.put("assign",-1);
                incDoc.put("total",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }else{
            String owner = (String)map.get("owner");
            String categoryId = (String)map.get("categoryId");
            condition.put("categoryId",categoryId);
            BasicDBObject incDoc = new BasicDBObject();
            if(categoryId.equals(CATEGORY_NA))return;
            if(owner.equals(categoryId)){
                incDoc.put("del", 1);
                incDoc.put("surplus",-1);
                incDoc.put("total",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else{
                incDoc.put("del",1);
                incDoc.put("assign",-1);
                incDoc.put("total",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }
    }
}
