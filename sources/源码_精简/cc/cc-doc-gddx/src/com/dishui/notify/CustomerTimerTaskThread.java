package com.dishui.notify;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Logger;


/**
 * Created by wangmeng on 2016/4/20.
 * TimerTask
 */

public class CustomerTimerTaskThread extends TimerTask{
    public List<ReportEvent> eventList = new ArrayList<ReportEvent>();
    public Map<String,DBObject> owners = new HashMap<String,DBObject>();   //回收的时候统计需要提醒的客户。
    public List<DBObject> autoSeaList = new ArrayList<DBObject>();  //添加到自动分配列表中
    public List<DBObject> userList = new ArrayList<DBObject>();  //获取所有的座席
    private static final String app_notify="app_notify";
    private static final String platform_user="platform_user";
    private static Logger log= Logger.getLogger(CustomerTimerTaskThread.class.getName());

    public void run(){
            try {
                List categoryList = new ArrayList();
                categoryList.add("1");
                categoryList.add("2");
                List<DBObject> poolList = MongoProvider.find("app_customer_pool", new BasicDBObject().append("category",new BasicDBObject("$nin",categoryList)));
                userList = MongoProvider.find("bill",platform_user,new BasicDBObject(),new BasicDBObject("displayName","1"));
                for (int i = 0; i < poolList.size(); i++) {
                    DBObject obj = poolList.get(i);
                    String poolId = String.valueOf(obj.get("_id"));
                    String cName = String.valueOf(obj.get("cName"));
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
                    String time = DateUtil.getCurrentTime();
                    DBObject updateCondition = new BasicDBObject();
                    DBObject updateDoc = new BasicDBObject();
                    List<String> idList = new ArrayList<String>();
                    if(category.equals("4")){
                        if(foNum>0){
                            String foTime = "";
                            foTime= DateUtil.addTime(DateUtil.parse(time), "yyyy-MM-dd", Calendar.DATE, -(foNum))+" 00:00:00";
                            DBObject condition = new BasicDBObject();
                            condition.put("categoryId",poolId);
                            List<String> ownerList = new ArrayList<String>();
                            ownerList.add("NA");
                            ownerList.add(poolId);
                            condition.put("owner",new BasicDBObject().append("$nin",ownerList));
                            condition.put("sysStatus","1");
                            condition.put("lastContactTime",new BasicDBObject().append("$lte",foTime));
                            boolean hasCustomer = true;
                            while(hasCustomer){
                                List<DBObject> customerList = MongoProvider.find(account + "_customer", condition, new BasicDBObject().append("owner","1").append("status","1"), account,10000);
                                if(customerList==null||customerList.size()==0){
                                    hasCustomer = false;
                                    break;
                                }
                                for(int j=0;j<customerList.size();j++){
                                    DBObject customer = customerList.get(j);
                                    String customerId = String.valueOf(customer.get("_id"));
                                    String owner = String.valueOf(customer.get("owner"));
                                    String status = String.valueOf(customer.get("status"));
                                    idList.add(customerId);
                                    generateNotifyMap(owner,poolId,account);
                                    String userName = getUserName(owner);
                                    String content = "客户从【"+userName+"】回收到【"+cName+"】|系统状态从【跟进中】变更为【待跟进】|";
                                    addCustomerEvent(account,customerId,owner,status,content,poolId);
                                    DBObject autoSale = new BasicDBObject();
                                    autoSale.put("_id", Utils.getUniqueid());
                                    autoSale.put("cid",customerId);
                                    autoSale.put("saleId",poolId);
                                    autoSale.put("account",account);
                                    autoSale.put("time",Utils.getCurrentDate());
                                    autoSeaList.add(autoSale);
                                }
                                if(idList.size()>0){
                                    updateCondition.put("_id",new BasicDBObject().append("$in",idList));
                                    updateDoc.put("$set", new BasicDBObject().append("owner",poolId).append("sysStatus","0").append("takeTime","").append("isRead",false));
                                    MongoProvider.batchUpdate(account + "_customer", updateCondition, updateDoc, account);
                                    emitCustomerEvent();
                                }
                            }
                        }
                    }else if(category.equals("3")||category.equals("0")){
                        if(deNum>0){
                            String deTime = "";
                            deTime= DateUtil.addTime(DateUtil.parse(time), "yyyy-MM-dd", Calendar.DATE, -(deNum))+" 00:00:00";
                            DBObject condition = new BasicDBObject();
                            condition.put("categoryId",poolId);
                            List<String> ownerList = new ArrayList<String>();
                            ownerList.add("NA");
                            ownerList.add(poolId);
                            condition.put("owner",new BasicDBObject().append("$nin",ownerList));
                            condition.put("sysStatus","0");
                            condition.put("takeTime",new BasicDBObject().append("$lte",deTime));
                            boolean hasCustomer = true;
                            while(hasCustomer){
                                List<DBObject> customerList = MongoProvider.find(account + "_customer", condition,new BasicDBObject().append("owner","1").append("status","1"), account,10000);
                                if(customerList==null||customerList.size()==0){
                                    hasCustomer = false;
                                    break;
                                }
                                for(int j=0;j<customerList.size();j++){
                                    DBObject customer = customerList.get(j);
                                    String customerId = String.valueOf(customer.get("_id"));
                                    String owner = String.valueOf(customer.get("owner"));
                                    String status = String.valueOf(customer.get("status"));
                                    idList.add(customerId);
                                    generateNotifyMap(owner,poolId,account);
                                    String userName = getUserName(owner);
                                    String content = "客户从【"+userName+"】回收到【"+cName+"】";
                                    addCustomerEvent(account,customerId,owner,status,content,poolId);
                                }
                                if(idList.size()>0){
                                    updateCondition.put("_id",new BasicDBObject().append("$in",idList));
                                    updateDoc.put("$set", new BasicDBObject().append("owner",poolId).append("sysStatus","0").append("takeTime","").append("isRead",false));
                                    MongoProvider.batchUpdate(account + "_customer", updateCondition, updateDoc, account);
                                    emitCustomerEvent();
                                }
                            }

                        }
                        if(foNum>0){
                            String foTime = "";
                            foTime = DateUtil.addTime(DateUtil.parse(time), "yyyy-MM-dd", Calendar.DATE, -(foNum))+" 00:00:00";
                            DBObject condition1 = new BasicDBObject();
                            condition1.put("categoryId",poolId);
                            List<String> ownerList1 = new ArrayList<String>();
                            ownerList1.add("NA");
                            ownerList1.add(poolId);
                            condition1.put("owner",new BasicDBObject().append("$nin",ownerList1));
                            condition1.put("sysStatus","1");
                            condition1.put("lastContactTime",new BasicDBObject().append("$lte",foTime));
                            boolean hasCustomer = true;
                            while(hasCustomer){
                                List<DBObject> customerList1 = MongoProvider.find(account + "_customer", condition1,new BasicDBObject().append("owner","1").append("status","1"), account,10000);
                                if(customerList1==null||customerList1.size()==0){
                                    hasCustomer=false;
                                    break;
                                }
                                for(int j=0;j<customerList1.size();j++){
                                    DBObject customer = customerList1.get(j);
                                    String customerId = String.valueOf(customer.get("_id"));
                                    String owner = String.valueOf(customer.get("owner"));
                                    String status = String.valueOf(customer.get("status"));
                                    idList.add(customerId);
                                    generateNotifyMap(owner,poolId,account);
                                    String userName = getUserName(owner);
                                    String content = "客户从【"+userName+"】回收到【"+cName+"】|系统状态从【跟进中】变更为【待跟进】|";
                                    addCustomerEvent(account,customerId,owner,status,content,poolId);
                                }
                                if(idList.size()>0){
                                    updateCondition.put("_id",new BasicDBObject().append("$in",idList));
                                    updateDoc.put("$set", new BasicDBObject().append("owner",poolId).append("sysStatus","0").append("takeTime","").append("isRead",false));
                                    MongoProvider.batchUpdate(account + "_customer", updateCondition, updateDoc, account);
                                    emitCustomerEvent();
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

    private void generateNotifyMap(String owner,String poolId,String account){
        if(owners.get(owner)==null){
            DBObject ownerObject = new BasicDBObject();
            ownerObject.put("uid",owner);
            ownerObject.put("categoryId",poolId);
            ownerObject.put("num","1");
            ownerObject.put("type","batchCustRecyle");
            ownerObject.put("account",account);
            owners.put(owner,ownerObject);
        }else{
            DBObject oObject = owners.get(owner);
            int num = Integer.parseInt(oObject.get("num").toString());
            num++;
            oObject.put("num",num+"");
            owners.put(owner,oObject);
        }
    }

    private void addCustomerEvent (String account,String _id,String owner,String status,String content,String poolId){
        ReportEvent event = new ReportEvent();
        event.setType("updateCustCategory");
        event.setAccount(account);
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", _id);
        event.addBusinessData("tType","recyclePool");
        event.addBusinessData("content",content);
        event.addBusinessData("oldOwner",owner);
        event.addBusinessData("user","system");
        event.addBusinessData("owner",poolId);
        event.addBusinessData("status",status);
        event.addBusinessData("oldStatus",status);
        event.addBusinessData("categoryId",poolId);
        event.addBusinessData("oldCategoryId",poolId);
        long lastTime = DateUtil.getCurrentMs();
        event.addBusinessData("lastTime",lastTime);
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
        if(owners.size()>0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for (String key : owners.keySet()) {
                DBObject ownerDBObject = owners.get(key);
                insertData.add(ownerDBObject);
            }
            MongoProvider.batchInsert("app_notify",insertData);
            owners.clear();
        }
        if(autoSeaList.size()>0){
            MongoProvider.batchInsert("app_customer_sale_event",autoSeaList);
            autoSeaList.clear();
        }
    }
    //获取到座席姓名
    public String getUserName(String userId){
        String userName  = "已删除座席";
        for(int i=0;i<userList.size();i++){
            DBObject dbObject = userList.get(i);
            String id = dbObject.get("_id").toString();
            if(userId.equals(id)){
                String displayName = dbObject.get("displayName").toString();
                userName = displayName;
                break;
            }
        }
        return userName;
    }

}
