package com.dishui.notify;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;
import com.mongodb.BasicDBList;

/**
 * Created by wangmeng on 2016/4/20.
 */
public class CustomerTimerTaskThread extends TimerTask{
    public List<ReportEvent> eventList = new ArrayList<ReportEvent>();
    private static Logger log= Logger.getLogger(CustomerTimerTaskThread.class.getName());
    public void run(){
        try {
            List<DBObject> poolList = MongoProvider.find("app_customer_pool",new BasicDBObject());
            for (int i = 0; i < poolList.size(); i++) {
                DBObject obj = poolList.get(i);
                String poolId = String.valueOf(obj.get("_id"));
                String account = String.valueOf(obj.get("account"));
                String category = String.valueOf(obj.get("category"));
                if(category.equalsIgnoreCase("1")||category.equalsIgnoreCase("2")){
                    continue;
                }
                Map<String, Object> recycleList = (HashMap<String, Object>) obj.get("recycle");
                int deNum = 0;
                int foNum = 0;
                for(String key : recycleList.keySet()){
                    if(key.equalsIgnoreCase("deNum")) {
                        if (!recycleList.get(key).toString().equalsIgnoreCase("")) {
                            deNum = Integer.parseInt(recycleList.get(key).toString());
                        }
                    }else if(key.equalsIgnoreCase("foNum")){
                        if(!recycleList.get(key).toString().equalsIgnoreCase("")){
                            foNum = Integer.parseInt(recycleList.get(key).toString());
                        }
                    }
                }
                DBObject condition = new BasicDBObject();
                condition.put("categoryId",poolId);
                condition.put("owner",new BasicDBObject().append("$nin",""));
                List<DBObject> customerList = MongoProvider.find(account+"_customer",condition,account);
                DBObject updateCondition = new BasicDBObject();
                DBObject updateDoc = new BasicDBObject();
                String time = DateUtil.getCurrentTime();
                List<String> idList = new ArrayList<String>();
                for(int j = 0;j<customerList.size();j++){
                    DBObject customer = customerList.get(j);
                    String sysStatus = String.valueOf(customer.get("sysStatus"));
                    String customerId = String.valueOf(customer.get("_id"));
                    String owner = String.valueOf(customer.get("owner"));
                    String lastContactTime = String.valueOf(customer.get("lastContactTime"));
                    String takeTime = String.valueOf(customer.get("takeTime"));
                    if(sysStatus.equalsIgnoreCase("0")){
                        if(deNum!=0) {
                            if (takeTime != null) {
                                String deTime = "";
                                if(category.equalsIgnoreCase("4")){
                                    deTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, deNum);
                                }else if(category.equalsIgnoreCase("3")||category.equalsIgnoreCase("0")){
                                    deTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.DATE, deNum+1);
                                }
                                if (DateUtil.parse(deTime).getTime() < DateUtil.parse(time).getTime() ){
                                    if(DateUtil.parse(lastContactTime).getTime() < DateUtil.parse(takeTime).getTime()){
                                        idList.add(customerId);
                                        addCustomerEvent(account,customerId,owner);
                                    }
                                }
                            }
                        }
                    }else if(sysStatus.equalsIgnoreCase("1")){
                        String notifyTime = String.valueOf(customer.get("notifyTime"));
                        if(notifyTime.equalsIgnoreCase(null)||notifyTime.equalsIgnoreCase("")){
                            if(foNum!=0){
                                if(takeTime != null){
                                    String foTime = "";
                                    if(category.equalsIgnoreCase("4")){
                                        foTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, foNum);
                                    }else if(category.equalsIgnoreCase("3")||category.equalsIgnoreCase("0")){
                                        foTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.DATE, foNum+1);
                                    }
                                    if(DateUtil.parse(foTime).getTime() < DateUtil.parse(time).getTime() ){
                                        if(DateUtil.parse(lastContactTime).getTime() < DateUtil.parse(takeTime).getTime()){
                                            idList.add(customerId);
                                            addCustomerEvent(account,customerId,owner);
                                        }
                                    }
                                }
                            }
                        }else{
                            if(foNum!=0){
                            if(takeTime != null){
                                String foTime = "";
                                if(category.equalsIgnoreCase("4")){
                                    foTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, foNum);
                                }else{
                                    foTime= DateUtil.addTime(DateUtil.parse(takeTime),"yyyy-MM-dd HH:mm:ss", Calendar.DATE, foNum+1);
                                }
                                if(DateUtil.parse(foTime).getTime() < DateUtil.parse(time).getTime() ){
                                    if(DateUtil.parse(lastContactTime).getTime() < DateUtil.parse(takeTime).getTime()) {
                                        idList.add(customerId);
                                        addCustomerEvent(account, customerId, owner);
                                    }
                                }
                                }
                            }
                        }
                    }
                }
                updateCondition.put("_id",new BasicDBObject().append("$in",idList));
                updateDoc.put("$set", new BasicDBObject().append("owner",""));
               MongoProvider.batchUpdate(account+"_customer", updateCondition, updateDoc,account);
                emitCustomerEvent();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private void addCustomerEvent (String account,String _id,String owner){
        ReportEvent event = new ReportEvent();
        event.setType("updateCustCategory");
        event.setAccount(account);
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", _id);
        event.addBusinessData("tType","claim");
        event.addBusinessData("content","客户回收");
        event.addBusinessData("user",owner);
        eventList.add(event);
    }
    private void emitCustomerEvent(){
        if(eventList.size() > 0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for(ReportEvent event : eventList){
                insertData.add(event.getDbObjectData());
            }
            MongoProvider.reportBatchInsert("customer_report_event", insertData);
            eventList.clear();
        }
    }

//    public void recycleCustomerCommon(){
//        try {
//            DBObject condition = new BasicDBObject();
//            List<DBObject> commonList = MongoProvider.find("app_customer_pool",condition);
//            for (int i = 0; i < commonList.size(); i++) {
//                DBObject obj = commonList.get(i);
//                String commonId = String.valueOf(obj.get("_id"));
//                String account = String.valueOf(obj.get("account"));
//                Map<String, Object> recycleList = (HashMap<String, Object>) obj.get("recycle");
//                DBObject updateCondition = new BasicDBObject();
//                DBObject updateDoc = new BasicDBObject();
//                for(String key : recycleList.keySet()){
//                    if(key == "deNum"){
//                        if(recycleList.get(key).toString()!=""){
//                            int dt =  Integer.parseInt(recycleList.get(key).toString());
//                            String deTime= DateUtil.addTime(new Date(),"yyyy-MM-dd HH:mm:ss", Calendar.DATE, -dt);
//                            updateCondition.put("categoryId",commonId);
//                            updateCondition.put("lastContactTime",new BasicDBObject("$lt",deTime));
//                            updateDoc.put("$set", new BasicDBObject().append("owner",""));
//                        }
//                    }else if(key == "foNum"){
//                        if(recycleList.get(key).toString()!=""){
//                            int dt =  Integer.parseInt(recycleList.get(key).toString());
//                            String foTime= DateUtil.addTime(new Date(),"yyyy-MM-dd HH:mm:ss", Calendar.DATE, -dt);
//                            BasicDBList combox=new BasicDBList();
//                            DBObject c1=new BasicDBObject("notifyTime",null);
//                            DBObject c2=new BasicDBObject("notifyTime",new BasicDBObject("$lt",foTime));
//                            combox.add(c1);
//                            combox.add(c2);
//                            updateCondition.put("$or",combox);
//                        }
//                    }
//                    MongoProvider.batchUpdate(account+"_customer", updateCondition, updateDoc,account);
//
//                }
//            }
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
//
//    public void recycleSaleChance(){
//        try {
//            DBObject condition = new BasicDBObject();
//            List<DBObject> chanceList = MongoProvider.find("app_customer_sale_chance",condition);
//            for (int i = 0; i < chanceList.size(); i++) {
//                DBObject obj = chanceList.get(i);
//                String chanceId = String.valueOf(obj.get("_id"));
//                String account = String.valueOf(obj.get("account"));
//                Map<String, Object> recycleList = (HashMap<String, Object>) obj.get("recycle");
//                for(String key : recycleList.keySet()){
//                    int dt =  Integer.parseInt(recycleList.get(key).toString());
//                    String time= DateUtil.addTime(new Date(),"yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, -dt);
//                    DBObject updateCondition = new BasicDBObject();
//                    updateCondition.put("categoryId",chanceId);
//                    updateCondition.put("lastContactTime",new BasicDBObject("$lt",time));
//                    updateCondition.put("status",key);
//                    DBObject updateDoc = new BasicDBObject();
//                    updateDoc.put("$set", new BasicDBObject().append("owner",""));
//
//                    MongoProvider.batchUpdate(account+"_customer", updateCondition, updateDoc,account);
//                }
//            }
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
}
