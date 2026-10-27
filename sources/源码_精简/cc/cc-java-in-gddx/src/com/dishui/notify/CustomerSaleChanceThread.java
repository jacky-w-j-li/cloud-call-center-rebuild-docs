package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;


public class CustomerSaleChanceThread extends Thread{
    private static Logger log= Logger.getLogger(CustomerSaleChanceThread.class.getName());
    private static final String app_customer_sale_event="app_customer_sale_event";
    private static final String app_customer_sale_event_wait="app_customer_sale_event_wait";
    private static final String app_customer_pool="app_customer_pool";
    private static final String app_push_client="app_push_client";
    private static final String platform_user="platform_user";
    private static final String app_notify="app_notify";
    private static final String app_customer_titket="app_customer_titket";
    public static List<ReportEvent> eventList = new ArrayList<ReportEvent>();
    private static Random random = new Random();
    public void run(){
        while (true){
            try {
                String time= Utils.getCurrentDate();
                List<DBObject> list = MongoProvider.getConection(app_customer_sale_event).find().limit(50).toArray();
                if(list==null || list.size()==0){
                    sleep(10000);
                    continue;
                }

                for (int i = 0; i < list.size(); i++) {
                    DBObject obj = list.get(i);
                    String id = String.valueOf(obj.get("_id"));
                    String cid = String.valueOf(obj.get("cid"));
                    String account = String.valueOf(obj.get("account"));
                    String saleId = String.valueOf(obj.get("saleId"));

                    DBObject salePool= MongoProvider.findOne(app_customer_pool, new BasicDBObject("_id", saleId));
                    if(salePool==null){
                        MongoProvider.insert(app_customer_sale_event_wait, obj);
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        continue;
                    }
                    BasicDBList managers=(BasicDBList)salePool.get("managers");
                    BasicDBList members=(BasicDBList)salePool.get("members");
                    if(members==null || members.size()==0){
                        obj.put("reason","1");//无成员
                        MongoProvider.insert(app_customer_sale_event_wait, obj);
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        continue;
                    }
                    DBObject query=new BasicDBObject("_id",new BasicDBObject("$in",members)).append("status",new BasicDBObject("$ne","close"));

                    List<DBObject> onlineUsers= MongoProvider.find(app_push_client, query);
                    if(onlineUsers==null || onlineUsers.size()==0){
                        obj.put("reason","0");//离线
                        MongoProvider.insert(app_customer_sale_event_wait, obj);
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        //todo notify manager
                        MongoProvider.insert(app_notify, new BasicDBObject()
                                .append("type", "saleChanceManager")
                                .append("account", account)
                                .append("saleId", saleId)
                                .append("cid", cid)
                                .append("uids", managers));
                        continue;
                    }
                    List<String> userIds=new ArrayList<String>();
                    for (int j = 0; j <onlineUsers.size(); j++) {
                        userIds.add((String)onlineUsers.get(j).get("_id"));
                    }
                    List<DBObject> users= MongoProvider.find("bill", platform_user, new BasicDBObject("_id", new BasicDBObject("$in", userIds)).append("getCustFlag", null));    //开启自动领取的在线座席 (getCustFlag,"1"：关)
                    if(users==null || users.size()==0){
                        obj.put("reason","2");//用户关闭了领取
                        MongoProvider.insert(app_customer_sale_event_wait, obj);
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        //todo notify manager
                        MongoProvider.insert(app_notify, new BasicDBObject()
                                .append("type", "saleChanceManager")
                                .append("account", account)
                                .append("saleId", saleId)
                                .append("cid", cid)
                                .append("uids", managers));
                        continue;
                    }

                    List<DBObject> l1=new ArrayList<DBObject>();//有奖励的座席
                    List<DBObject> l2=new ArrayList<DBObject>();
                    for(DBObject user:users){
                        int score=user.get("score")==null?0:Integer.valueOf(user.get("score")+"");
                        if(score>0){
                            l1.add(user);
                        }else{
                            l2.add(user);
                        }
                    }

                    if(l1.size()>0 && l2.size()>0){//存在两种score的用户,才消耗券，优先有奖券的
                        bubbleSort(l1,"dayCust");//按日商机数从小到大排序
                        DBObject _user= l1.get(0);
                        String uid=(String)_user.get("_id");
                        assignCustomer(uid,account,cid,saleId);
                        syncUser(uid,"plus","");
                        syncTitket("1");
                        //todo notify user
                        MongoProvider.insert(app_notify, new BasicDBObject()
                                .append("type", "saleChance")
                                .append("account", account)
                                .append("saleId", saleId)
                                .append("cid", cid)
                                .append("uid", uid));

                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                    }else{
                        List<DBObject> l3=new ArrayList<DBObject>();
                        if(l1.size()>0){
                            l3=l1;
                        }else{
                            l3=l2;
                        }
                        List<DBObject> sub=getFirstBubbleList(l3,"dayCust");  //先按每日商机数排序获得最小的子集
                        List<DBObject> sub2=getFirstBubbleList(sub,"weekCust");//再按每周商机数获得总数最小的子集
                        int idx=0;
                        if(sub2.size()>1){   //随机分配
                            idx=random.nextInt(sub2.size());
                        }
                        DBObject _user=sub.get(idx);
                        String uid=(String)_user.get("_id");
                        int score=_user.get("score")==null?0:Integer.valueOf(_user.get("score")+"");
                        if(score<0){ //消耗罚券，不分配客户（若下次分配score为0的时候，同一个商机也是可以领取到的）
                            syncUser(uid,"punish",cid);
                            syncTitket("0");
                        }else{
                            assignCustomer(uid,account,cid,saleId);
                            syncUser(uid,"","");
                            //todo notify user
                            MongoProvider.insert(app_notify, new BasicDBObject()
                                    .append("type", "saleChance")
                                    .append("account", account)
                                    .append("saleId", saleId)
                                    .append("cid", cid)
                                    .append("uid", uid));
                        }

                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    private  static  void assignCustomer(String uid,String account,String custId,String saleId){
        DBObject query=new BasicDBObject("_id",custId);
        String time= Utils.getCurrentDate();
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();
        obj.put("owner",uid);
        obj.put("taskTime",time);//分配商机时间
        obj.put("categoryId",saleId);
        map.put("$set", obj);
        DBObject doc=new BasicDBObject(map);
        addCustomerEvent(account,custId,uid);
        MongoProvider.update(account + "_customer", query, doc, account);
        emitCustomerEvent();
    }

    private static void addCustomerEvent (String account,String _id,String owner){
        ReportEvent event = new ReportEvent();
        event.setType("updateCustCategory");
        event.setAccount(account);
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", _id);
        event.addBusinessData("tType","autoAssignPool");
        event.addBusinessData("content","分配客户");
        event.addBusinessData("user",owner);
        eventList.add(event);
    }

    private static void emitCustomerEvent(){
        if(eventList.size() > 0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for(ReportEvent event : eventList){
                insertData.add(event.getDbObjectData());
            }
            MongoProvider.reportBatchInsert("customer_report_event", insertData);
            eventList.clear();
        }
    }

    private  static  void syncUser(String uid,String type,String custId){
        DBObject query=new BasicDBObject("_id",uid);
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();
        obj.put("dayCust",1);
        if("plus".equals(type)){
            obj.put("score",-1);
            obj.put("weekCust",1);
            obj.put("totalCust",1);
        }else if("punish".equals(type)){
            obj.put("score",1);
            query.put("punishCust",new BasicDBObject("$ne",custId));
            map.put("$push",new BasicDBObject("punishCust",custId));
        }else{//普通
            obj.put("weekCust",1);
            obj.put("totalCust",1);
        }
        map.put("$inc", obj);
        DBObject doc=new BasicDBObject(map);
        MongoProvider.updateByDB("bill", platform_user, query, doc);
    }

    private  static  void syncTitket(/*0:罚，1:奖*/String type){
        DBObject titket = MongoProvider.findOne(app_customer_titket, new BasicDBObject("type", type).append("status", "1"));
        if(titket==null)return;
        String time= Utils.getCurrentDate();
        DBObject query=new BasicDBObject("_id",titket.get("_id"));
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();
        obj.put("status","2");
        obj.put("useTime",time);

        map.put("$set", obj);
        DBObject doc=new BasicDBObject(map);
        MongoProvider.update(app_customer_titket, query, doc);
    }

    private static void bubbleSort(List<DBObject> list, String sortKey){   //从小到大
        DBObject temp;
        int len=list.size();
        for (int i = 0; i < len-1; i++) {
            for (int j = i+1; j < len; j++) {
                int a=list.get(i).get(sortKey)==null?0:Integer.valueOf(list.get(i).get(sortKey)+"");
                int b=list.get(j).get(sortKey)==null?0:Integer.valueOf(list.get(j).get(sortKey)+"");
                if(a>b){
                    temp=list.get(i);
                    list.set(i,list.get(j));
                    list.set(j,temp);
                }
            }
        }
    }

    private static List<DBObject> getFirstBubbleList(List<DBObject> list, String sortKey){
        DBObject temp;
        int len=list.size();
        for (int i = 0; i < len-1; i++) {
            for (int j = i+1; j < len; j++) {
                int a=list.get(i).get(sortKey)==null?0:Integer.valueOf(list.get(i).get(sortKey)+"");
                int b=list.get(j).get(sortKey)==null?0:Integer.valueOf(list.get(j).get(sortKey)+"");
                if(a>b){
                    temp=list.get(i);
                    list.set(i,list.get(j));
                    list.set(j,temp);
                }
            }
        }
        List<DBObject> subList=new ArrayList<DBObject>();
        int first=0;
        for (int i = 0; i < list.size(); i++) {
            int score=list.get(i).get(sortKey)==null?0:Integer.valueOf(list.get(i).get(sortKey)+"");
            if(i==0){
                first=score;
            }
            if(score==first){
                subList.add(list.get(i));
            }
        }

        return subList;
    }


    private static String getWeekOfDate(String date) throws ParseException {
        String[] weekDays = {"星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"};
        Calendar cal = Calendar.getInstance();
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        cal.setTime(format.parse(date));
        int w = cal.get(Calendar.DAY_OF_WEEK) - 1;
        if (w < 0)
            w = 0;
        return weekDays[w];
    }

    public static void main(String[] args) {
        int max=20;
        int min=10;

//        for (int i = 0; i < 100; i++) {
//            System.out.println(random.nextInt(11));
//            System.out.println(random.nextInt(max)%(max-min+1) + min);

//        }
        try {
            System.out.println(getWeekOfDate("2016-05-09 00:00:00"));
        } catch (ParseException e) {
            e.printStackTrace();
        }

    }
}
