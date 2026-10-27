package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;
import com.mongodb.Mongo;
import com.mongodb.client.result.UpdateResult;

import java.util.Map;
import java.util.logging.Logger;


public class CustomerCommonUserReportHandler {
    private static final Logger log = Logger.getLogger(CustomerCommonUserReportHandler.class.getName());
    private static String OWNER_NA = "NA";
    private static String CATEGORY_NA = "NA";

    /**
     cc_customer_common_user_report（）
     {
     "_id" : ObjectId("56e27530839d8045862e3dbd"),
     "account" : "N00000000143",
     "day" : "20151203",
     "month" : "201512",
     "year" : "2015",
     "categoryId" : "",
     "uid" : "",
     "assign" : 0,
     "recycle" : 0
     }
     * @param event
     */
    public static void updateCommonUser(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;
        String tType =  (String)map.get("tType");
        String owner =  (String)map.get("owner");
        String oldOwner = (String)map.get("oldOwner");
        String categoryId = (String)map.get("categoryId");
        String oldCategoryId = (String)map.get("oldCategoryId");
        if(owner==null)return;
        if(oldOwner==null)return;
        if(categoryId==null)return;
        if(oldCategoryId==null)return;
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        if(tType.equals("claim")||tType.equals("autoAssignPool")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId",categoryId);
            condition.put("user", owner);
            incDoc.put("assign",1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if(tType.equals("assign")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId",categoryId);
            if(oldOwner.equals(oldCategoryId)){
                condition.put("user", owner);
                incDoc.put("assign",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }else{
                condition.put("user",oldOwner);
                incDoc.put("assign",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

                condition.put("user",owner);
                incDoc.put("assign",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }

        }else if(tType.equals("update")||tType.equals("updateOwner")){
            if(oldCategoryId.equals("NA")&&oldOwner.equals("NA")&&categoryId.equals(owner))return;
            if(categoryId.equals("NA")&&owner.equals("NA")){
                if(!oldCategoryId.equals(oldOwner)){
                    condition.put("categoryId",oldCategoryId);
                    condition.put("user",oldOwner);
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }else if(!owner.equals(categoryId)){
                condition.put("categoryId",categoryId);
                condition.put("user", owner);
                incDoc.put("assign",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                if(!oldOwner.equals(oldCategoryId)){
                    condition.put("categoryId",oldCategoryId);
                    condition.put("user",oldOwner);
                    incDoc = new BasicDBObject();
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }else{
                if(oldCategoryId.equals("NA"))return;
                if(!oldOwner.equals(categoryId)){
                    condition.put("categoryId",categoryId);
                    condition.put("user",oldOwner);
                    incDoc.put("recycle",1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        }else if(tType.equals("mergeCust")){
            if(!owner.equals(categoryId)){
                if(!oldCategoryId.equals("NA")&&!oldCategoryId.equals(oldOwner)&&!oldOwner.equals(owner)){
                    condition.put("categoryId",oldCategoryId);
                    condition.put("user",oldOwner);
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                    if(!owner.equals("NA")){
                        condition.put("categoryId",categoryId);
                        condition.put("user",owner);
                        incDoc.put("assign",1);
                        MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                    }
                }
            }else{
                if(owner.equals("NA")){
                    condition.put("categoryId",oldCategoryId);
                    condition.put("user",oldOwner);
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }else if(!oldCategoryId.equals(oldOwner)&&!oldCategoryId.equals("NA")){
                    condition.put("categoryId",oldCategoryId);
                    condition.put("user",oldOwner);
                    incDoc.put("recycle",1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        }else if(tType.equals("recyclePool")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId",categoryId);
            condition.put("user", oldOwner);
            incDoc.put("recycle",1);
            MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if(tType.equals("updateSysStatus")){
            if(categoryId.equals("NA"))return;
            condition.put("categoryId",categoryId);
            if(oldCategoryId.equals("NA"))return;
            String status = (String)map.get("sysStatus");
            if(status.equals("0")||status.equals("2")||status.equals("4")){
                if(!oldOwner.equals(oldCategoryId)&&owner.equals(categoryId)&&!oldCategoryId.equals(categoryId)){
                    condition.put("categoryId",oldCategoryId);
                }
                condition.put("user",oldOwner);
                incDoc.put("recycle",1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }else if(tType.equals("changePool")){
            condition.put("categoryId",categoryId);
            if(!oldCategoryId.equals(oldOwner) && categoryId.equals(owner)){
                condition.put("user",oldOwner);
                if(!oldCategoryId.equals(categoryId)){
                    condition.put("categoryId",oldCategoryId);
                }
                if(categoryId.equals("NA")){
                    incDoc.put("assign",-1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }else{
                    incDoc.put("recycle",1);
                    MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        }else if(tType.equals("transferPool")){
            condition.put("categoryId",categoryId);
            if(!oldCategoryId.equals(oldOwner) && categoryId.equals(owner)){
                condition.put("user",oldOwner);
                incDoc.put("recycle",1);
                if(!oldCategoryId.equals(categoryId)){
                    condition.put("categoryId",oldCategoryId);
                }
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }

    }


    public static void delCommonUser(Event event){
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
            condition.put("user",delOwner);
            BasicDBObject incDoc = new BasicDBObject();
            if(delCategoryId.equals(CATEGORY_NA))return;
            if(delOwner.equals(OWNER_NA))return;
            if(!delOwner.equals(delCategoryId)){
                incDoc.put("del",1);
                incDoc.put("assign",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }else{
            String owner = (String)map.get("owner");
            String categoryId = (String)map.get("categoryId");
            condition.put("categoryId",categoryId);
            condition.put("user",owner);
            BasicDBObject incDoc = new BasicDBObject();
            if(categoryId.equals(CATEGORY_NA))return;
            if(owner.equals(OWNER_NA)) return;
            if(!owner.equals(categoryId)){
                incDoc.put("del", 1);
                incDoc.put("assign",-1);
                MongoProvider.update(Constant.CUSTOMER_COMMON_USER_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }

    }


}
