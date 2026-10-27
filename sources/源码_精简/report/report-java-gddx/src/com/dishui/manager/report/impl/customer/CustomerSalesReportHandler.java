package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;


public class CustomerSalesReportHandler {
    private static final Logger log = Logger.getLogger(CustomerSalesReportHandler.class.getName());
    private static String OWNER_NA = "NA";

    private  static boolean checkSysStatus(String status){
        if("0".equals(status)||"2".equals(status)||"3".equals(status)||"4".equals(status)||"8".equals(status)){
            return true;
        }
        return false;
    }
    private  static boolean checkDeal(String status){
        if ("3".equals(status)) {
            return true;
        }
        return false;
    }
    private  static String getSysStatusAlias(String status){
        String field="";
        if("4".equals(status)){
            field="lost";
        }else if("3".equals(status)){
            field="deal";
        }else if("2".equals(status)){
            field="invalid";
        }
        return field;
    }

    /**
     * {
     "_id" : ObjectId("56e27530839d8045862e3dbd"),
     "account" : "N00000000143",
     "user" : "59518670-3f0c-11e4-b73a-e12552db917d",
     "day" : "20151203",
     "month" : "201512",
     "year" : "2015",
     "deal" : 0,
     "lost" : 0,
     "invalid" : 0,
     "money":0,    //回款金额
     assign:0,
     assignOut:0,  //分配出去
     selfAdd:0, //自建
     claim:0, //领取
     giveUp:0,  //放弃
     recycle:0,//回收
     del:0,   //删除
     total:0//每日商机总数
     }
     * @param event
     */
    public static void addToSales(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;
        String owner =  (String)map.get("owner");
        String actionType =  (String)map.get("actionType");
        String categoryId = (String)map.get("categoryId");
        if(owner==null||owner.equals(OWNER_NA))return;
        if(owner.equals(categoryId))return;
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("user", owner);
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        if("self".equals(actionType)){
            incDoc.put("selfAdd", 1);
        }else{
            incDoc.put("assign", 1);
        }
        incDoc.put("total", 1);

        MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }
    /**
     * 修改跟进状态
     * @param event
     */
    public static void updateSysStatus(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("user", map.get("oldOwner"));
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        Double money = Double.valueOf(map.get("money")==null?"0":map.get("money").toString())*10000;
        long  _money= money.longValue();


        String status = "";
        String field=  "";
        if(map != null && map.get("sysStatus") != null){
            status = (String)map.get("sysStatus");
            if(checkSysStatus(status)){
                field=getSysStatusAlias(status);
            }else{
                return;
            }
        }
        BasicDBObject incDoc = new BasicDBObject();
        if("0".equals(status)){
            incDoc.put("recycle",1);
            incDoc.put("total",-1);
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if("8".equals(status)){
            incDoc.put("money", _money);
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else{
            incDoc.put(field, 1);
            if(checkDeal(status)){
                incDoc.put("money", _money);
            }else{
                incDoc.put("recycle",1);
                incDoc.put("total",-1);
            }
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }
    }

    public static void updateToSales(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
//        condition.put("user", map.get("owner"));
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        String oldOwner =  (String)map.get("oldOwner");
        String owner =  (String)map.get("owner");
        String oldCategoryId = (String)map.get("oldCategoryId");
        String categoryId = (String)map.get("categoryId");
        if(owner == null) return;
        if(oldOwner == null) return;
//        String tType = (String)map.get("tType");
//       if("clearOwner".equalsIgnoreCase(tType)){
//            condition.put("user",oldOwner);
//            BasicDBObject incDoc = new BasicDBObject();
//            incDoc.put("recycle", 1);
//            incDoc.put("total", -1);
//            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//        }else{
//
//       }
            if(owner!=oldOwner){
                condition.put("user", oldOwner);
                BasicDBObject incDoc = new BasicDBObject();
                incDoc.put("assignOut", 1);
                incDoc.put("total", -1);
                if(!oldOwner.equals(OWNER_NA)&&!oldOwner.equals(oldCategoryId)){
                    MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition,new BasicDBObject("$inc", incDoc), true);
                }
                condition.put("user", owner);
                incDoc = new BasicDBObject();
                incDoc.put("assign", 1);
                incDoc.put("total", 1);
                if(!owner.equals(OWNER_NA)&&!owner.equals(categoryId)){
                    MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
    }


//    public static void leaveSeaToSales(Event event){
//        Map<String, Object> map = event.getBusinessData();
//        String oldOwner =  (String)map.get("oldOwner");
//        BasicDBObject condition = new BasicDBObject();
//        condition.put("user",oldOwner);
//        condition.put("account", event.getAccount());
//        condition.put("day", event.getDayId());
//        condition.put("year", event.getYearId());
//        condition.put("month",event.getMonthId());
//
//        BasicDBObject incDoc = new BasicDBObject();
//        incDoc.put("recycle", 1);
//        incDoc.put("total", -1);
//        MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//
//    }
    public static void changeToSales(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();


        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        String tType =  (String)map.get("tType");

        if("claim".equalsIgnoreCase(tType)){
            String owner = (String)map.get("owner");
            if(owner.equals(OWNER_NA)){
                return;
            }
            condition.put("user",owner);
            BasicDBObject incDoc = new BasicDBObject();
            incDoc.put("claim", 1);
            incDoc.put("total", 1);
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if("autoAssignPool".equalsIgnoreCase(tType)){
            String owner = (String)map.get("owner");
            if(owner.equals(OWNER_NA)){
                return;
            }
            condition.put("user",owner);
            BasicDBObject incDoc = new BasicDBObject();
            incDoc = new BasicDBObject();
            incDoc.put("assign", 1);
            incDoc.put("total", 1);
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if("recyclePool".equalsIgnoreCase(tType)){
            String owner = (String)map.get("oldOwner");
            if(owner.equals(OWNER_NA)){
                return;
            }
            condition.put("user",owner);
            BasicDBObject incDoc = new BasicDBObject();
            incDoc.put("recycle", 1);
            incDoc.put("total", -1);
            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else if("changePool".equalsIgnoreCase(tType)){
            String owner = (String)map.get("oldOwner");
            if(owner.equals(OWNER_NA)){
                return;
            }
            condition.put("user",owner);
            String oldCategoryId = map.get("oldCategoryId").toString();
           if(!owner.equals(oldCategoryId)){
               BasicDBObject incDoc = new BasicDBObject();
               incDoc.put("assignOut", 1);
               incDoc.put("total", -1);
               MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
           }
        }else if("transferPool".equalsIgnoreCase(tType)){
            String owner = (String)map.get("oldOwner");
            if(owner.equals(OWNER_NA)){
                return;
            }
            condition.put("user",owner);
            String oldCategoryId = map.get("oldCategoryId").toString();
            if(!owner.equals(oldCategoryId)){
                BasicDBObject incDoc = new BasicDBObject();
                incDoc.put("assignOut", 1);
                incDoc.put("total", -1);
                MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
            }
        }
        // else if("giveUp".equalsIgnoreCase(tType)){
//            BasicDBObject incDoc = new BasicDBObject();
//            incDoc.put("giveUp", 1);
//            incDoc.put("total", -1);
//            MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
//        }
    }
    public static void delToSales(Event event){
        Map<String, Object> map = event.getBusinessData();
        String tType = (String)map.get("tType");
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("del", 1);
        incDoc.put("total", -1);
        if(tType.equalsIgnoreCase("mergeCust")){
            String delOwner = map.get("delOwner").toString();
            String delCategoryId = map.get("delCategoryId").toString();
            if(delOwner.equals(OWNER_NA)||delOwner.equals(delCategoryId))return;
            condition.put("user", delOwner);
        }else{
            String owner = map.get("owner").toString();
            String categoryId = map.get("categoryId").toString();
            if(owner.equals(OWNER_NA)||owner.equals(categoryId))return;
            condition.put("user", owner);
        }
        MongoProvider.update(Constant.CUSTOMER_SALES_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


}
