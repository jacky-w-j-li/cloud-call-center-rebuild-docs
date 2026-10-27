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
 * Created by wangmeng on 2016/6/29.
 */

public class CustomerSaleRecycleThread extends Thread{
    public List<ReportEvent> eventList = new ArrayList<ReportEvent>();
    public Map<String,DBObject> owners = new HashMap<String,DBObject>();   //回收的时候统计需要提醒的客户。
    public List<DBObject> autoSeaList = new ArrayList<DBObject>();  //添加到自动分配列表中
    public List<DBObject> userList = new ArrayList<DBObject>(); //获取所有座席
    private static final String app_notify="app_notify";
    private static final String platform_user="platform_user";
    private static Logger log= Logger.getLogger(CustomerSaleRecycleThread.class.getName());

    public void run(){
        while(true){
            try {
                sleep(2000);
                List<DBObject> poolList = MongoProvider.find("app_customer_pool", new BasicDBObject("category","4"));
                userList = MongoProvider.find("bill",platform_user,new BasicDBObject(),new BasicDBObject("displayName","1"));
                if(poolList==null||poolList.size()==0){
                    sleep(3000);
                    continue;
                }
                for (int i = 0; i < poolList.size(); i++) {
                    DBObject obj = poolList.get(i);
                    String category = String.valueOf(obj.get("category"));
                    if(category.equals("4")){
                        String poolId = String.valueOf(obj.get("_id"));
                        String cName = String.valueOf(obj.get("cName"));
                        String account = String.valueOf(obj.get("account"));
                        Map<String, Object> recycleList = (HashMap<String, Object>) obj.get("recycle");
                        int deNum = 0;
                        for(String key : recycleList.keySet()){
                            if(key.equals("deNum")) {
                                if (!recycleList.get(key).toString().equals("")) {
                                    deNum = Integer.parseInt(recycleList.get(key).toString());
                                    break;
                                }
                            }
                        }
                        if(deNum!=0){
                            String time = DateUtil.getCurrentTime();
                            String deTime= DateUtil.addTime(DateUtil.parse(time), "yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, -deNum);
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
//                                System.out.println("customerlist.size======================================="+customerList.size());
                                if(customerList.size()==0||customerList==null){
                                    hasCustomer = false;
                                    break;
                                }
                                DBObject updateCondition = new BasicDBObject();
                                DBObject updateDoc = new BasicDBObject();
                                List<String> idList = new ArrayList<String>();
                                for(int j = 0;j<customerList.size();j++){
                                    DBObject customer = customerList.get(j);
                                    String customerId = String.valueOf(customer.get("_id"));
                                    String owner = String.valueOf(customer.get("owner"));
                                    String status = String.valueOf(customer.get("status"));
                                    idList.add(customerId);
                                    generateNotifyMap(owner,poolId,account);
                                    addCustomerEvent(account,customerId,owner,status,cName,poolId);
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
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
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

    private void addCustomerEvent (String account,String _id,String owner,String status,String cName,String poolId){
        ReportEvent event = new ReportEvent();
        event.setType("updateCustCategory");
        event.setAccount(account);
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", _id);
        event.addBusinessData("tType","recyclePool");
        String userName = getUserName(owner);
        event.addBusinessData("content","客户从【"+userName+"】回收到【"+cName+"】");
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
