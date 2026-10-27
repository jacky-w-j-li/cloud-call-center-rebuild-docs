package com.dishui.bill.alert;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class NotifyTask extends TimerTask {
    private  Logger log = Logger.getLogger(NotifyTask.class.getName());
    private  final String day15="15";
    private  final String day7="7";
    private  final String day0="0";
    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            log.info("NotifyTask hour::=============" + now.get(Calendar.HOUR_OF_DAY));
            if (now.get(Calendar.HOUR_OF_DAY) != 7) {
                return;
            }

            serviceNumNotify();
            licenceNotify();
        } catch (Exception e) {
            log.log(Level.WARNING, "process NotifyTask  exception! ", e);
            e.printStackTrace();
        }
    }

    /**
     * 呼叫中心号码的到期预警
     */
    private void serviceNumNotify(){
        String now = Utils.getCurrentDate();
        log.log(Level.INFO,"start serviceNumNotify , date is :" + now);
        String currentDate= Utils.getDefaultCurrentDate();
        String endDate = Utils.getDayDate(15);
        DBObject time=new BasicDBObject("$gte",currentDate).append("$lte", endDate);
        DBObject condition = new BasicDBObject("product","cc").append("endTime", time).append("status",new BasicDBObject("$ne","present"));
        DBObject keys = new BasicDBObject().append("_id",1).append("account", 1).append("endTime", 1).append("notifyNum", 1).append("status", 1).append("product", 1);
        List<DBObject> list = MongoProvider.find("platform_serviceNum", condition, keys);
        Map<String,List<Map<String,String>>> map=new HashMap<String,List<Map<String,String>>>();
        for(DBObject obj : list){
            try {
                String _id=(String)obj.get("_id");
                String endTime=(String)obj.get("endTime");
                String account=(String)obj.get("account");
                String product=(String)obj.get("product");
                String status=(String)obj.get("status");
                int notifyNum=obj.get("notifyNum")==null?0:Integer.parseInt(String.valueOf(obj.get("notifyNum")));
                int day= Utils.getBetweenDays(currentDate, endTime);
                if(day==15 && notifyNum==0){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==7 && notifyNum<=1){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==0 && notifyNum<=2){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }

            } catch (Exception e) {
                log.log(Level.WARNING,"serviceNumNotify exception:"+e.getMessage());
                e.printStackTrace();
            }
        }
        Set<Map.Entry<String,List<Map<String,String>>>> set=map.entrySet();
        Iterator<Map.Entry<String,List<Map<String,String>>>> iterator=set.iterator();
        while(iterator.hasNext()){
            Map.Entry<String,List<Map<String,String>>> entry =iterator.next();
            List<Map<String,String>> nums =entry.getValue();
            MongoProvider.insert("bill_notify", new BasicDBObject()
                    .append("type", "ccNumAlert")
                    .append("account", entry.getKey())
                    .append("list", nums));
        }
        now = Utils.getCurrentDate();
        log.log(Level.INFO,"end serviceNumNotify["+now + "] ");
    }

    private void licenceNotify(){
        String now = Utils.getCurrentDate();
        log.log(Level.INFO,"start licenceNotify , date is :" + now);
        String currentDate= Utils.getDefaultCurrentDate();
        String endDate = Utils.getDayDate(15);
        DBObject time=new BasicDBObject("$gte",currentDate).append("$lte", endDate);
        DBObject condition = new BasicDBObject().append("endDate",time).append("status", "use");
        DBObject keys = new BasicDBObject().append("_id",1).append("account", 1).append("endDate", 1).append("licenceType", 1).append("notifyNum", 1);
        List<DBObject> list = MongoProvider.find("platform_licence", condition, keys);
        Map<String,List<Map<String,String>>> map=new HashMap<String,List<Map<String,String>>>();
        for(DBObject obj : list){
            try {
                String _id=(String)obj.get("_id");
                String account=(String)obj.get("account");
                String endTime=(String)obj.get("endDate");
                String licenceType=(String)obj.get("licenceType");
                int notifyNum=obj.get("notifyNum")==null?0:Integer.parseInt(String.valueOf(obj.get("notifyNum")));
                int day= Utils.getBetweenDays(currentDate, endTime);
                if(day==15 && notifyNum==0){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("id", _id);
                    sn.put("licenceType", licenceType);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==7 && notifyNum<=1){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("id", _id);
                    sn.put("licenceType", licenceType);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==0 && notifyNum<=2){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("id", _id);
                    sn.put("licenceType", licenceType);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }

            } catch (Exception e) {
                log.log(Level.WARNING,"licenceNotify exception:"+e.getMessage());
                e.printStackTrace();
            }
        }
        Set<Map.Entry<String,List<Map<String,String>>>> set=map.entrySet();
        Iterator<Map.Entry<String,List<Map<String,String>>>> iterator=set.iterator();
        while(iterator.hasNext()){
            Map.Entry<String,List<Map<String,String>>> entry =iterator.next();
            List<Map<String,String>> nums =entry.getValue();
            MongoProvider.insert("bill_notify", new BasicDBObject()
                    .append("type", "licenceAlert")
                    .append("account", entry.getKey())
                    .append("list", nums));
        }
        now = Utils.getCurrentDate();
        log.log(Level.INFO,"end licenceNotify["+now + "] ");
    }



    public static void main(String[] args) {
        String currentDate = Utils.getDefaultCurrentDate();
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, -15);
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        String date = df.format(calendar.getTime());
        System.out.println("day======"+date);

        long t=1005400/10000;
        System.out.println("t = [" + 1005400.0/10000 + "]");
    }

    /* private void serviceNumNotify2ZJ(){
        String now =Utils.getCurrentDate();
        log.log(Level.INFO,"start serviceNumNotify2ZJ , date is :" + now);
        String currentDate=Utils.getDefaultCurrentDate();
        String endDate = Utils.getDayDate(15);
        DBObject time=new BasicDBObject("$gte",currentDate).append("$lte", endDate);
        DBObject condition = new BasicDBObject().append("endTime",time).append("product","zj");
        DBObject keys = new BasicDBObject().append("_id", 1).append("account", 1).append("endTime", 1).append("notifyNum", 1).append("status", 1).append("monthRent", 1);
        List<DBObject> list = MongoProvider.find("platform_serviceNum", condition,keys);
        Map<String,List<Map<String,String>>> map=new HashMap<String,List<Map<String,String>>>();
        for(DBObject obj : list){
            try {
                String _id=(String)obj.get("_id");
                String endTime=(String)obj.get("endTime");
                String account=(String)obj.get("account");
                String status=(String)obj.get("status");
                int notifyNum=obj.get("notifyNum")==null?0:Integer.parseInt(String.valueOf(obj.get("notifyNum")));
                int day=Utils.getBetweenDays(currentDate,endTime);
                if(day==15 && notifyNum==0){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==7 && notifyNum<=1){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }else if(day==0 && notifyNum<=2){
                    if(!map.containsKey(account)){
                        map.put(account,new ArrayList<Map<String, String>>());
                    }
                    List snLlist=map.get(account);
                    Map<String,String> sn=new HashMap<String,String>();
                    sn.put("num", _id);
                    sn.put("endDate", endTime);
                    snLlist.add(sn);
                }

            } catch (Exception e) {
                log.log(Level.WARNING,"serviceNumNotify exception:"+e.getMessage());
                e.printStackTrace();
            }
        }
        Set<Map.Entry<String,List<Map<String,String>>>> set=map.entrySet();
        Iterator<Map.Entry<String,List<Map<String,String>>>> iterator=set.iterator();
        while(iterator.hasNext()){
            Map.Entry<String,List<Map<String,String>>> entry =iterator.next();
            List<Map<String,String>> nums =entry.getValue();
            String _aid=entry.getKey();
            DBObject accObj=MongoProvider.findOne("platform_account",new BasicDBObject("account",_aid),new BasicDBObject("balance",1));
            long balance=Long.valueOf(String.valueOf(accObj.get("balance")));
            long total=0l;
            for (int i = 0; i < nums.size(); i++) {
                Map<String,String> num=nums.get(i);
                String _num=num.get("num");
                long monthRent=Long.valueOf(String.valueOf(num.get("monthRent")));
                total+=monthRent;
            }
            if(total>balance){
                boolean isSuccess=sendNumBill(_aid,nums);
                if(isSuccess){
                    for (int i = 0; i < nums.size(); i++) {
                        Map<String,String> num=nums.get(i);
                        String _num=num.get("num");
                        DBObject _set = new BasicDBObject();
                        _set.put("$inc",new BasicDBObject("notifyNum",1));
                        MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",_num),_set);
                    }
                }
            }
        }
        now =Utils.getCurrentDate();
        log.log(Level.INFO,"end serviceNumNotify["+now + "] ");
    }*/
}
