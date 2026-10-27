package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;

/**
 * Created by cx on 2016/9/29.
 */
public class CollectInfoHandler extends TimerTask {

    private static Logger logger = Logger.getLogger(CollectInfoHandler.class.getName());


    public static void getCollectInfo() {
        List<DBObject> infoList = MongoProvider.findFromReportDb("cc_collect","collect_agent_pc_info", new BasicDBObject());
        String[] config = {"resolution","version","area","os"};
        ArrayList<String> configList = new ArrayList<String>(Arrays.asList(config));

        for(int i=0;i<configList.size();i++){
            disposeInfoList(infoList,configList.get(i));
        }
    }
    public static  void disposeInfoList(List<DBObject> infoList,String type){
        DBObject bucketsData = initBucketsList(infoList,type);
        List<DBObject> list = (ArrayList)bucketsData.get("list");
        List<DBObject> bucketsAscData = initBucketsSortList(list,"asc");
        saveDataToMongo(bucketsAscData,Integer.parseInt(bucketsData.get("count").toString()),type+"_asc","asc");
        List<DBObject> bucketsDescData = initBucketsSortList(list,"desc");
        saveDataToMongo(bucketsDescData,Integer.parseInt(bucketsData.get("count").toString()),type+"_desc","desc");

    }
    public static DBObject initBucketsList(List<DBObject> infoList,String type) {
        DBObject bucketsData = new BasicDBObject();
        DBObject data = new BasicDBObject();
        List <DBObject> list = new ArrayList<DBObject>();
        Integer count = 0;
        for(int i=0;i<infoList.size();i++){
            List<String> keyList = (ArrayList)infoList.get(i).get(type);
            for(int m=0;m<keyList.size();m++){
                count++;
                String key = keyList.get(m);
                Boolean flag = true;
                if(list.size()==0){
                    data.put("key",key);
                    data.put("doc_count",1);
                    list.add(data);

                }else{
                    for(int j=0;j<list.size();j++){
                        if(key.equals(list.get(j).get("key").toString())){
                            list.get(j).put("doc_count",Integer.parseInt(list.get(j).get("doc_count").toString())+1);
                            flag = false;
                            break;
                        }
                    }
                    if(flag){
                        data = new BasicDBObject() ;
                        data.put("key",key);
                        data.put("doc_count",1);
                        list.add(data);

                    }
                }
            }




        }
        bucketsData.put("list",list);
        bucketsData.put("count",count);
        return bucketsData;
    }


    public static List<DBObject> initBucketsSortList (List<DBObject> list,String sort) {
        Boolean condition = false;

        for (int i = 1; i < list.size(); i++){
            for (int j = 0; j < list.size()-i; j++){
                if(sort.equals("asc")) {
                    condition = Integer.parseInt(list.get(j).get("doc_count").toString())
                            > Integer.parseInt(list.get(j+1).get("doc_count").toString());
                }else{
                    condition = Integer.parseInt(list.get(j).get("doc_count").toString())
                            < Integer.parseInt(list.get(j+1).get("doc_count").toString());
                }
                if (condition) {
                    DBObject temp = list.get(j);
                    DBObject temp1 = new BasicDBObject();
                    temp1.put("key",list.get(j+1).get("key").toString());
                    temp1.put("doc_count",list.get(j+1).get("doc_count").toString());
                    list.set(j,temp1);
                    DBObject temp2 = new BasicDBObject();
                    temp2.put("key",temp.get("key").toString());
                    temp2.put("doc_count",temp.get("doc_count").toString());
                    list.set(j+1,temp2);
                }
            }
        }
        return list;
    }

    public static void saveDataToMongo(List<DBObject> list,Integer count,String id,String sort){
        DBObject data = new BasicDBObject();
        data.put("doc_count",count);
        DBObject top = new BasicDBObject();
        top.put("buckets",list);
        top.put("sum_other_doc_count",count);
        data.put("top",top);
        data.put("order",sort);
        data.put("source","cc-server-in");
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());
        calendar.add(Calendar.DAY_OF_MONTH, -1);
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        data.put("date",df.format(calendar.getTime()));
        MongoProvider.reportUpdate("cc_collect","agg_agent_pc_info", new BasicDBObject("_id",id),
                new BasicDBObject("$set",data),true,true);
    }

    @Override
    public void run() {
        getCollectInfo();
    }

}
