package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/10/29.
 */
public class DeleteCustomerHandler {
    private static Logger log = Logger.getLogger(DeleteCustomerHandler.class.getName());
    private Thread deleteThread ;
    public static DeleteCustomerHandler instance;
    public static boolean isSleep = false;
    public static List<DBObject> uList = new ArrayList<DBObject>();
    public static DeleteCustomerHandler getInstance(){
        if (instance == null)
            new DeleteCustomerHandler();
        return instance;
    }

    public DeleteCustomerHandler(){
        instance = this;
        this.deleteThread = new Thread("customer delete") {
            public void run() {
                while (true) {
                   boolean result = deleteTask();
                    try {
                        if(!result){
                            isSleep = true;
                            sleep(10000);
                            isSleep = false;
                        }
                    } catch (Exception e) {
                        isSleep = false;
                        e.printStackTrace();
                    }
                }
            }
        };
        this.deleteThread.start();
    }

    /**
     * 删除平台客户
     * 由于删除客户的数量比较大，所以需要开线程进行处理。
     * 具体步骤
     * 收到请求后，先入库   app_customer_delete_task。
     * 如果删除线程空闲，则直接启动线程删除。
     * 如果删除线程正在运行，则排队等待。
     * @param action
     * @return
     */
    public static C5Response deleteCustomer(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String account = action.getStringValue("account");
            String safeDel = action.getStringValue("safeDel");
            String json = action.getStringValue("query");
            json = URLDecoder.decode(json, "UTF-8");
            DBObject doc=new BasicDBObject();
            doc.put("account",account);
            doc.put("product","cc");
            uList=MongoProvider.find("bill","platform_user", doc);
            DBObject obj = new BasicDBObject();
            obj.put("account",account);
            obj.put("status","wait");
            obj.put("deleteCount",0);
            obj.put("query",json);
            obj.put("safeDel",safeDel);
            obj.put("createTime", DateUtil.getCurrentTime());
            MongoProvider.insert("app_customer_delete_task", obj);
            if(instance != null && isSleep){
                instance.deleteThread.interrupt();
            }
            response.setSucceed(true);
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "delete customer error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    /**
     * 删除数据
     */
    protected boolean deleteTask(){
        try{
            DBObject object =  MongoProvider.findOne("app_customer_delete_task", new BasicDBObject().append("status", "wait"));
            if(object != null){
                long time = System.currentTimeMillis();
                long deleteCount = 0;
                while (true){
                    String account = (String)object.get("account");
                    String safeDel = (String)object.get("safeDel");
                    String json = (String)object.get("query");
                    String uid = (String)object.get("uid");
//                    DBObject condition = new BasicDBObject().append("delTag","y");
                    JSONReader jsonReader = new JSONReader();
                    HashMap<String, Object> map = (HashMap<String, Object>) jsonReader.read(json);
                    setQueryCondition(map);
                    DBObject condition=new BasicDBObject();
                    condition.putAll(map);
                    List<DBObject> idList = new ArrayList<DBObject>();
                    if("1".equals(safeDel)){
                        idList =  MongoProvider.find(account + "_customer", condition, new BasicDBObject(), account, 10000);
                    }else {
                        idList = MongoProvider.find(account + "_customer", condition, new BasicDBObject().append("_id", 1).append("owner",1).append("status",1), account, 10000);
                    }
                    if(idList == null || idList.size() == 0){
                        long duration = System.currentTimeMillis() - time;
                        String msg = String.format("%s消耗时间[%d ms]", "batch del customer", duration);
                        log.info(msg);

                        DBObject updateData = new BasicDBObject();
                        DBObject setData = new BasicDBObject();
                        setData.put("status","finish");
                        setData.put("duration",duration);
                        updateData.put("$set",setData);
                        MongoProvider.update("app_customer_delete_task", new BasicDBObject().append("_id", object.get("_id")), updateData);
                        break;
                    }

                    List<ReportEvent> eventList = new ArrayList<ReportEvent>();
                    List<String> ids = new ArrayList<String>();
                    for(DBObject obj : idList){
                        ids.add((String)obj.get("_id"));
                        addCustomerStatusEvent(eventList,obj,uid);
                        emitCustomerEvent(eventList);
                    }

                    if("1".equals(safeDel)){
                        for(DBObject obj : idList){
//                            obj.put("account",account);
                            obj.put("dtime", Utils.getCurrentDate());
                        }
                        int len=idList.size();
                        int last=len%1000;
                        int total=last==0?len/1000:len/1000+1;
//                        System.out.println("len==="+len+",total==="+total+",last==="+last);
                        for (int i = 0; i < total; i++) {
                            int start=i*1000;
                            int end=start+1000;
                            if(i==total-1 && last>0){
                                end=start+last;
                            }
                            MongoProvider.batchInsert("cc","app_customer_delstore",idList.subList(start,end));
                        }
                    }

                    DBObject deleteCondition = new BasicDBObject();
                    //delete im
                    deleteCondition.put("customerId",new BasicDBObject().append("$in",ids));
                    MongoProvider.remove("app_im_customer_relation", deleteCondition);
                    //delete note
                    deleteCondition.put("customerId",new BasicDBObject().append("$in",ids));
                    MongoProvider.remove("app_note", deleteCondition);
                    //delete customer
                    deleteCondition = new BasicDBObject();
                    deleteCondition.put("_id",new BasicDBObject().append("$in",ids));
                    MongoProvider.remove(account + "_customer", deleteCondition, account);
                    //update
                    DBObject updateData = new BasicDBObject();
                    DBObject setData = new BasicDBObject();
                    setData.put("status","doing");
                    deleteCount += ids.size();
                    setData.put("deleteCount",deleteCount);
                    updateData.put("$set",setData);
                    MongoProvider.update("app_customer_delete_task", new BasicDBObject().append("_id", object.get("_id")), updateData);
                }

                return true;
            } else {
                return false;
            }

        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING,"",e);

        }
        return false;
    }
    private void addCustomerStatusEvent (List<ReportEvent> eventList ,DBObject row,String uid){
        ReportEvent event = new ReportEvent();
        event.setType("status_del");
        event.setAccount((String) row.get("accountId"));
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", (String) row.get("_id"));
        String owner = row.get("owner") == null ? "":(String)row.get("owner");
        event.addBusinessData("owner",owner);
        event.addBusinessData("status",(String) row.get("status"));
        event.addBusinessData("tType","del");
        event.addBusinessData("user",uid);
        eventList.add(event);
    }
    private void emitCustomerEvent(List<ReportEvent> eventList){
        if(eventList.size() > 0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for(ReportEvent event : eventList){
                insertData.add(event.getDbObjectData());
            }
            MongoProvider.reportBatchInsert("app_report_event", insertData);
            eventList.clear();
        }
    }
    private static void setQueryCondition(Map<String, Object> query){
        query.remove("menu");
        query.remove("dbType");
        query.remove("accountId");
//        query.put("delTag", null);

        List<String> fields=new ArrayList<String>();
        Iterator<String> iterator=query.keySet().iterator();
        while(iterator.hasNext()){
            String field=iterator.next();
            if(field.indexOf("begin_date")!=-1 || field.indexOf("end_date")!=-1){
                fields.add(field.substring(0, field.indexOf("_")));
            }
            Object values=query.get(field);
            if(values instanceof List){
                if(((List)values).size()>0){
                    DBObject db=new BasicDBObject("$all",values);
                    query.put(field, db);
                }
            }
        }
        Set<String> set=new HashSet<String>();
        set.addAll(fields);
        for (String field : set) {
            DBObject db=new BasicDBObject();
            if(query.containsKey(field+"_begin_date") && query.containsKey(field+"_end_date")){
                String val1=query.get(field+"_begin_date").toString();
                String val2=query.get(field+"_end_date").toString();
                db.put("$gte", val1);
                db.put("$lte", val2);
            }else if(query.containsKey(field+"_begin_date")){
                String val=query.get(field+"_begin_date").toString();
                db.put("$gte", val);
            }else if(query.containsKey(field+"_end_date")){
                String val=query.get(field+"_end_date").toString();
                db.put("$lte", val);
            }
            query.put(field, db);
            query.remove(field+"_begin_date");
            query.remove(field+"_end_date");
        }

//        if(query.get("combox")!=null){
//            String value=query.get("combox").toString();
//            BasicDBList combox=new BasicDBList();
//            String _value= CommonUtil.escapeRegex(value);
//            Pattern pattern= Pattern.compile("^"+_value);
//            DBObject c1=new BasicDBObject("name",pattern);
//            DBObject c2=new BasicDBObject("phone.tel",value);
//            combox.add(c1);
//            combox.add(c2);
//            query.put("$or", combox);
//            query.remove("combox");
//        }
        if(query.get("owner")!=null && query.get("owner").toString().equals("empty")){
            BasicDBList list=new BasicDBList();
            list.add("");
            list.add(null);
            DBObject db=new BasicDBObject("$in",list);
            query.put("owner", db);
        }
        if(query.get("email")!=null){
            String val = query.get("email").toString();
            query.put("email.email",val);
            query.remove("email");
        }
        if(query.get("phone")!=null){
            String val = query.get("phone").toString();
            query.put("phone.tel",val);
            query.remove("phone");
        }
//        if(query.get("name")!=null){
//            String value=query.get("name").toString();
//            String _value= CommonUtil.escapeRegex(value);
//            Pattern pattern= Pattern.compile("^"+_value);
//            query.put("name",pattern);
//        }
        if(query.get("weixin")!=null){
            String val = query.get("weixin").toString();
            BasicDBList combox=new BasicDBList();
            DBObject c1=new BasicDBObject("weixin.num",val);
            DBObject c2=new BasicDBObject("weixin.memo",val);
            combox.add(c1);
            combox.add(c2);
            query.put("$or", combox);
//            query.put("weixin.num",val);
            query.remove("weixin");
        }

    }
}
