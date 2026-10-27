package com.dishui.notify;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;


public class CustomerSaleChanceThread extends Thread{
    private static Logger log= Logger.getLogger(CustomerSaleChanceThread.class.getName());
    private static final String app_customer_sale_event="app_customer_sale_event";
    private static final String app_customer_sale_event_wait="app_customer_sale_event_wait";
    private static final String app_customer_pool="app_customer_pool";
    private static final String app_customer_pool_assign="app_customer_pool_assign";
    private static final String app_push_client="app_push_client";
    private static final String platform_user="platform_user";
    private static final String app_notify="app_notify";
    private static final String app_customer_titket="app_customer_titket";
//    public static List<ReportEvent> eventList = new ArrayList<ReportEvent>();
    private static Random random = new Random();

    public void run(){
        while (true){
            try {
                DBObject condition = new BasicDBObject();
                condition.put("status",new BasicDBObject("$exists",false));
                List<DBObject> list = MongoProvider.getConection(app_customer_sale_event).find(condition).limit(50).toArray();
                if(list==null || list.size()==0){
                    sleep(3000);
                    continue;
                }
                for (int i = 0; i < list.size(); i++) {
                    long time = System.currentTimeMillis();
                    DBObject obj = list.get(i);
                    String id = String.valueOf(obj.get("_id"));
                    String cid = String.valueOf(obj.get("cid"));
                    String account = String.valueOf(obj.get("account"));
                    String saleId = String.valueOf(obj.get("saleId")); //公海id

                    DBObject custItem= MongoProvider.findOne(account + "_customer", new BasicDBObject("_id", cid),account,new BasicDBObject("owner",1).append("categoryId",1).append("aNum",1).append("status",1));//考虑分配过程中归属被改变
                    if(custItem==null){
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        continue;
                    }
                    int aNum =custItem.get("aNum")==null?0:Integer.valueOf(custItem.get("aNum")+""); //0为首次分配,首次分配才会消耗券
                    String categoryId = String.valueOf(custItem.get("categoryId"));
                    String owner = String.valueOf(custItem.get("owner"));
                    String cStatus = String.valueOf(custItem.get("status"));
                    if(!owner.equals(categoryId)){//已经分配所属人则忽略
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        continue;
                    }

                    DBObject salePool= MongoProvider.findOne(app_customer_pool, new BasicDBObject("_id", saleId));
                    if(salePool==null){//容错处理
                        MongoProvider.insert(app_customer_sale_event_wait, obj);
                        MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        continue;
                    }
                    List<String> managers=(List<String>)salePool.get("managers");
                    List<String> members=(List<String>)salePool.get("members");
                    List<String> assigns=(List<String>)salePool.get("assigns");
                    if(assigns==null){
                        assigns=new ArrayList<String>();
                    }
                    String strategy = (String)salePool.get("strategy");  // 0：当日最少 ，1：轮流
                    String cName = (String)salePool.get("cName");
                    if(members==null || members.size()==0){
                        DBObject setData=new BasicDBObject("status","wait");
                        setData.put("reason","1");//无成员
                        MongoProvider.updateOne(app_customer_sale_event,new BasicDBObject("_id", id),new BasicDBObject("$set",setData),WriteConcern.SAFE);
                        continue;
                    }

                    if("1".equals(strategy)){
                        List<String>  minusUser=minusUser(members,assigns);
                        DBObject query=new BasicDBObject("_id",new BasicDBObject("$in",minusUser)).append("user.status","enable");
                        List<DBObject> onlineUsers= MongoProvider.find(app_push_client, query,new BasicDBObject("_id",1));
                        if(onlineUsers==null || onlineUsers.size()==0){
                            MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$set", new BasicDBObject("assigns", new BasicDBList()))); //reset
                            if(assigns.size()>0){ //新一轮
                                DBObject _query=new BasicDBObject("_id",new BasicDBObject("$in",assigns)).append("user.status","enable");
                                onlineUsers= MongoProvider.find(app_push_client, _query,new BasicDBObject("_id",1));
                                assigns = new ArrayList<String>();;
                            }else{
                                DBObject setData=new BasicDBObject("status","wait");
                                setData.put("reason","0");//离线
                                MongoProvider.updateOne(app_customer_sale_event,new BasicDBObject("_id", id),new BasicDBObject("$set",setData),WriteConcern.SAFE);

                                //todo notify manager
                                MongoProvider.insert(app_notify, new BasicDBObject()
                                        .append("type", "saleChanceManager")
                                        .append("account", account)
                                        .append("saleId", saleId)
                                        .append("cid", cid)
                                        .append("uids", managers));
                                continue;
                            }
                        }
                        List<String> userIds=new ArrayList<String>();
                        for (int j = 0; j <onlineUsers.size(); j++) {
                            userIds.add((String)onlineUsers.get(j).get("_id"));
                        }
                        List<DBObject> users= MongoProvider.find("bill", platform_user, new BasicDBObject("_id", new BasicDBObject("$in", userIds)).append("getCustFlag", null),
                                new BasicDBObject("displayName",1).append("score",1).append("punishCust",1));    //开启自动领取的在线座席 (getCustFlag,"0"：关)
                        if(users==null || users.size()==0){
                            DBObject setData=new BasicDBObject("status","wait");
                            setData.put("reason","2");//用户关闭了领取
                            MongoProvider.updateOne(app_customer_sale_event,new BasicDBObject("_id", id),new BasicDBObject("$set",setData),WriteConcern.SAFE);
                            MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$set", new BasicDBObject("assigns",new BasicDBList())));
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
                        if(l1.size()>0 && l2.size()>0 && aNum==0){
                            //有券的不记录assigns
                            int idx=0;
                            if(l1.size()>1){   //随机分配
                                idx=random.nextInt(l1.size());
                            }
                            DBObject _user=l1.get(idx);
                            String uid=(String)_user.get("_id");
                            String displayName = (String)_user.get("displayName");
                            assignCustomer(uid,account,cid,displayName,cName,saleId,cStatus);
                            syncUser(uid,"plus","");
                            syncTitket("1",account,uid,cid);
                            //todo notify user
                            MongoProvider.insert(app_notify, new BasicDBObject()
                                    .append("type", "saleChance")
                                    .append("account", account)
                                    .append("saleId", saleId)
                                    .append("cid", cid)
                                    .append("uid", uid));

                            MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        }else{
//                            List<DBObject> l3=new ArrayList<DBObject>();
//                            if(l1.size()>0){
//                                l3=l1;
//                            }else{
//                                l3=l2;
//                            }

                            int idx=0;
                            if(users.size()>1){   //随机分配
                                idx=random.nextInt(users.size());
                            }
                            DBObject _user=users.get(idx);
                            String uid=(String)_user.get("_id");
                            String displayName = (String)_user.get("displayName");
                            List<String> punishCusts=(List<String>)_user.get("punishCust");//同一个商机只消耗一个罚券
                            if(punishCusts==null){
                                punishCusts=new ArrayList<String>();
                            }
                            int score=_user.get("score")==null?0:Integer.valueOf(_user.get("score")+"");
                            if(score<0 && !punishCusts.contains(cid) && aNum==0){ //消耗罚券，不分配客户（若下次分配score为0的时候，同一个商机也是可以领取到的）
                                syncUser(uid,"punish",cid);
                                syncTitket("0",account,uid,cid);
                                if(assigns.size()+1==members.size()){//一轮结束
                                    MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$set", new BasicDBObject("assigns",new BasicDBList()))); //reset
                                }else{
                                    MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$push", new BasicDBObject("assigns",uid)));
                                }
                                continue;
                            }else{
                                assignCustomer(uid,account,cid,displayName,cName,saleId,cStatus);
                                syncUser(uid,"","");
                                //todo notify user
                                MongoProvider.insert(app_notify, new BasicDBObject()
                                        .append("type", "saleChance")
                                        .append("account", account)
                                        .append("saleId", saleId)
                                        .append("cid", cid)
                                        .append("uid", uid));

                                if(assigns.size()+1==members.size()){//一轮结束
                                    MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$set", new BasicDBObject("assigns",new BasicDBList()))); //reset
                                }else{
                                    MongoProvider.update(app_customer_pool, new BasicDBObject("_id", saleId), new BasicDBObject("$push", new BasicDBObject("assigns",uid)));
                                }
                                MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                            }
                        }
                    }else{
                        //当日最少
                        DBObject query1=new BasicDBObject("account",account).append("poolId",saleId);
                        List<DBObject> assignUser= MongoProvider.find(app_customer_pool_assign, query1);
                        Map<String,DBObject>  assignMap=new HashMap<String, DBObject>();
                        List<String> assignUids=new ArrayList<String>();
                        for (int j = 0; j <assignUser.size(); j++) {
                            String _uid=(String)assignUser.get(j).get("uid");
                            assignUids.add(_uid);
                            assignMap.put(_uid,assignUser.get(j));
                        }
                        List<String>  minusUser=minusUser(members,assignUids);
                        if(minusUser.size()>0){//有新加入的成员
                            List<DBObject> userList=new ArrayList<DBObject>();
                            for (String uid:minusUser){
                                DBObject userData=new BasicDBObject("account",account).append("poolId",saleId).append("uid", uid).append("num", 0);
                                userList.add(userData);
                            }
                            MongoProvider.batchInsert("cc",app_customer_pool_assign,userList,WriteConcern.SAFE);
                        }

                        DBObject query=new BasicDBObject("_id",new BasicDBObject("$in",members)).append("user.status","enable");
                        List<DBObject> onlineUsers= MongoProvider.find(app_push_client, query,new BasicDBObject("_id",1));
                        if(onlineUsers==null || onlineUsers.size()==0){
                            DBObject setData=new BasicDBObject("status","wait");
                            setData.put("reason","0");//离线
                            MongoProvider.updateOne(app_customer_sale_event,new BasicDBObject("_id", id),new BasicDBObject("$set",setData),WriteConcern.SAFE);
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
                        List<DBObject> users= MongoProvider.find("bill", platform_user, new BasicDBObject("_id", new BasicDBObject("$in", userIds)).append("getCustFlag", null),
                                new BasicDBObject("displayName",1).append("score",1).append("punishCust",1));    //开启自动领取的在线座席 (getCustFlag,"0"：关)
                        if(users==null || users.size()==0){
                            DBObject setData=new BasicDBObject("status","wait");
                            setData.put("reason","2");//用户关闭了领取
                            MongoProvider.updateOne(app_customer_sale_event,new BasicDBObject("_id", id),new BasicDBObject("$set",setData),WriteConcern.SAFE);
                            //todo notify manager
                            MongoProvider.insert(app_notify, new BasicDBObject()
                                    .append("type", "saleChanceManager")
                                    .append("account", account)
                                    .append("saleId", saleId)
                                    .append("cid", cid)
                                    .append("uids", managers));
                            continue;
                        }

                        for (int j = 0; j <users.size(); j++) {
                            String _id=(String)users.get(j).get("_id");
                            if(assignMap.containsKey(_id)){
                                DBObject user=assignMap.get(_id);
                                users.get(j).put("dayCust", user.get("num"));
                            }else{
                                users.get(j).put("dayCust", 0);
                            }
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
                        if(l1.size()>0 && l2.size()>0 && aNum==0){  //存在两种score的用户,才消耗券，优先有奖券的
                            int idx=0;
                            if(l1.size()>1){   //随机分配
                                idx=random.nextInt(l1.size());
                            }
                            DBObject _user=l1.get(idx);
                            String uid=(String)_user.get("_id");
                            String displayName=(String)_user.get("displayName");
                            assignCustomer(uid,account,cid,displayName,cName,saleId,cStatus);
                            syncUser(uid,"plus","");
                            syncTitket("1",account,uid,cid);

                            //todo notify user
                            MongoProvider.insert(app_notify, new BasicDBObject()
                                    .append("type", "saleChance")
                                    .append("account", account)
                                    .append("saleId", saleId)
                                    .append("cid", cid)
                                    .append("uid", uid));

                            MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                        }else{
//                            List<DBObject> l3=new ArrayList<DBObject>();
//                            if(l1.size()>0){
//                                l3=l1;
//                            }else{
//                                l3=l2;
//                            }
                            List<DBObject> sub=getFirstBubbleList(users,"dayCust");  //按每日商机数排序获得最小的子集
                            int idx=0;
                            if(sub.size()>1){   //随机分配
                                idx=random.nextInt(sub.size());
                            }
                            DBObject _user=sub.get(idx);
                            String uid=(String)_user.get("_id");
                            String displayName = (String)_user.get("displayName");
                            List<String> punishCusts=(List<String>)_user.get("punishCust");
                            if(punishCusts==null){
                                punishCusts=new ArrayList<String>();
                            }
                            int score=_user.get("score")==null?0:Integer.valueOf(_user.get("score")+"");
                            if(score<0 && !punishCusts.contains(cid) && aNum==0){ //消耗罚券，不分配客户（若下次分配score为0的时候，同一个商机也是可以领取到的）
                                syncUser(uid,"punish",cid);
                                syncTitket("0",account,uid,cid);
                                DBObject _query=new BasicDBObject("account",account).append("poolId",saleId).append("uid", uid);
                                MongoProvider.update(app_customer_pool_assign,_query, new BasicDBObject("$inc", new BasicDBObject("num",1)));
                                continue;
                            }else{
                                assignCustomer(uid,account,cid,displayName,cName,saleId,cStatus);
                                syncUser(uid,"","");
                                DBObject _query=new BasicDBObject("account",account).append("poolId",saleId).append("uid", uid);
                                MongoProvider.update(app_customer_pool_assign,_query, new BasicDBObject("$inc", new BasicDBObject("num",1)));
                                //todo notify user
                                MongoProvider.insert(app_notify, new BasicDBObject()
                                        .append("type", "saleChance")
                                        .append("account", account)
                                        .append("saleId", saleId)
                                        .append("cid", cid)
                                        .append("uid", uid));

                                MongoProvider.remove(app_customer_sale_event, new BasicDBObject("_id", id));
                            }
                        }
                    }
                    long duration = System.currentTimeMillis() - time;
                    String msg = String.format("%s消耗时间[%d ms]", "deal pool event", duration);
                    log.log(Level.INFO,msg);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }




    private  static  void assignCustomer(String uid,String account,String custId,String displayName,String cName,String saleId,String cStatus){
        DBObject query=new BasicDBObject("_id",custId);
        String time= Utils.getCurrentDate();
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();
        obj.put("owner",uid);
        obj.put("takeTime",time);//分配商机时间
        obj.put("isRead",true);//设置为未读
        map.put("$set", obj);
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("aNum", 1);
        map.put("$inc", incDoc);  //累加分配次数

        DBObject doc=new BasicDBObject(map);
        MongoProvider.update(account + "_customer", query, doc, account);
        addCustomerEvent(account,custId,uid,displayName,cName,saleId,cStatus);
    }

    private static void addCustomerEvent (String account,String _id,String owner,String displayName,String cName,String saleId,String cStatus){
        long time1 = System.currentTimeMillis();
//        DBObject query=new BasicDBObject("_id",_id);
//        DBObject customer = MongoProvider.findOne(account+"_customer",query,account,new BasicDBObject("status","1"));
        ReportEvent event = new ReportEvent();
        event.setType("updateCustCategory");
        event.setAccount(account);
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", _id);
        event.addBusinessData("tType", "autoAssignPool");
        event.addBusinessData("content", "客户归属从【"+cName+"】变更为【"+displayName+"】");
        event.addBusinessData("owner", owner);
        event.addBusinessData("oldOwner","NA");
        event.addBusinessData("user","system");
        event.addBusinessData("status",cStatus);
        event.addBusinessData("oldStatus",cStatus);
        event.addBusinessData("categoryId",saleId);
        event.addBusinessData("oldCategoryId",saleId);
        long lastTime = DateUtil.getCurrentMs();
        event.addBusinessData("lastTime",lastTime);
        MongoProvider.reportInsert("customer_report_event", event.getDbObjectData());
        long _duration3 = System.currentTimeMillis() - time1;
        log.log(Level.INFO, String.format("%s消耗时间[%d ms]", "addCustomerEvent::", _duration3));
    }

//    private static void emitCustomerEvent(){
//        if(eventList.size() > 0){
//            List<DBObject> insertData = new ArrayList<DBObject>();
//            for(ReportEvent event : eventList){
//                insertData.add(event.getDbObjectData());
//            }
//            MongoProvider.reportBatchInsert("customer_report_event", insertData);
//            eventList.clear();
//        }
//    }

    /**
     * 奖券不累加dayCust，罚券累计每日商机数，实际不分配商机
     * @param uid
     * @param type
     * @param custId
     */
    private  static  void syncUser(String uid,String type,String custId){
        DBObject query=new BasicDBObject("_id",uid);
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();

        if("plus".equals(type)){
            obj.put("score",-1);
            obj.put("totalCust",1);
        }else if("punish".equals(type)){
            obj.put("score",1);
            map.put("$push",new BasicDBObject("punishCust",custId));
        }else{//普通
            obj.put("totalCust",1);
        }
        map.put("$inc", obj);
        DBObject doc=new BasicDBObject(map);
        MongoProvider.updateByDB("bill", platform_user, query, doc);
    }

    private  static  void syncTitket(/*0:罚，1:奖*/String type,String account,String uid,String cid){
        DBObject titket = MongoProvider.findOne(app_customer_titket, new BasicDBObject("account", account).append("user", uid).append("type", type).append("status", "1"));
        if(titket==null)return;
        String time= Utils.getCurrentDate();
        DBObject query=new BasicDBObject("_id",titket.get("_id"));
        Map map=new HashMap();
        DBObject obj=new BasicDBObject();
        obj.put("status","2");
        obj.put("useTime",time);
        obj.put("customerId",cid);
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


    private List<String>  minusUser(List<String>  alls, List<String>  assigns) {
        List<String> list = new ArrayList<String>();
        for (String uid : alls) {
            if (!assigns.contains(uid)) {
                list.add(uid);
            }
        }
        return list;
    }

    /**
     * 座席都离线的情况下产生未分配的商机，在有人上线或开启自动领取商机的开关后触发
     * @param action
     * @return
     */
    public static C5Response handleSalesWait(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String aid = action.getStringValue("account");
            DBObject condition=new BasicDBObject();
            condition.put("account",aid);
            condition.put("status","wait");

            Map<String,DBObject> map=new HashMap<String,DBObject>();
            map.put("$unset", new BasicDBObject("status",1));
            map.put("$inc", new BasicDBObject().append("num", 1));  //累加分配次数

            MongoConnect.getInstance().getDB().getCollection(app_customer_sale_event).update(condition, new BasicDBObject(map), false, true);

            response.setSucceed(true);
            return response;
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "handleSalesWait failed", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            if(e instanceof BaseRuntimeException){
                response.addParameter("code", ((BaseRuntimeException) e).getErrorCode());
            }
            response.addParameter("result", "500");
            return response;
        }
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
