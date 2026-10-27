package com.dishui.mongo.master;


import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/2/6.
 * 检查动态增长的库，检查每一张表的数据和索引。
 * 如果表中没有数据，无需建立索引，直接drop表。（这个过程其实只需要进行一次）
 * 如果表中有数据，则进行索引检查，如果索引和索引配置表中的索引不一样，则按照索引配置表，重建索引。
 * <p/>
 * <p/>
 * 保证数据的有效性，控制表的数据量。
 */
public class DataManager {
    private static Logger log = Logger.getLogger(DataManager.class.getName());
    private static String planDate = "";

    /**
     * 开始 处理 数据
     */
    public static void start() {
        log.info("dataManager: start check data......");
        long startTime = System.currentTimeMillis();
        planDate = "";
        Map<String, DBObject> indexConfig = getIndexConfig();

        if (indexConfig == null) {
            log.warning("dataManager:can not find available index config ....");
            log.warning("dataManager:finish check data by error!");
            return;
        }

        List<String> dbs = getAllDbs();
        if (dbs == null || dbs.size() == 0) {
            log.warning("dataManager:can not find available check dbs ....");
            log.warning("dataManager:finish check data by error!");
            return;
        }

        initConfig();

        for (int i = 0; i < dbs.size(); i++) {
            String dbName = dbs.get(i);
            List<String> collections = MongoProvider.getDbAllCollections(dbName);
            for(int m =0;m < collections.size();m++){
                String collectionName = collections.get(m);
                checkCollections(dbName,collectionName,indexConfig);
            }
        }
        long endTime = System.currentTimeMillis();

        log.info("dataManager:finish check data success! " + (endTime - startTime) + "ms");


    }

    private static void initConfig(){
        DBObject condition = new BasicDBObject();
        condition.put("master_key","db_index");
        DBObject config = MongoProvider.findOne("db_master",condition);
        if(config != null){
            String planDate = (String)config.get("plan_date");
            if(planDate != null){
                DataManager.planDate = planDate;
            }
        }
    }

    /**
     * 获取索引配置
     *
     * @return
     */
    private static Map<String, DBObject> getIndexConfig() {


        DBObject condition = new BasicDBObject();
        condition.put("enable", true);
        List<DBObject> configList = MongoProvider.find("cc", "account_db_index_config", condition);

        if (configList != null && configList.size() > 0) {
            Map<String, DBObject> configMap = new HashMap<String, DBObject>();
            for (int i = 0; i < configList.size(); i++) {
                DBObject obj = configList.get(i);
                configMap.put((String) obj.get("_id"), obj);
            }
            return configMap;
        } else {
            return null;
        }
    }


    /**
     * 检查表的数据和索引
     *
     * @param db
     * @param collection
     */
    private static void checkCollections(String db, String collection,Map<String, DBObject> indexConfig) {

        DBObject result = new BasicDBObject();
        String datastr = Utils.getDefaultCurrentDate();
        result.put("_id",db+"_"+collection+"_"+datastr);
        result.put("db",db);
        result.put("colleciton",collection);
        long count = MongoProvider.count(db,collection,null);
        result.put("count",count);
        result.put("checkTime",Utils.getCurrentDate());
        if(count == 0){
            result.put("level","notice");
            result.put("check","no need count");
            MongoProvider.insert("db_master_data_check_log",result);
            return;
        }
        String nowDate = Utils.getDefaultCurrentDate();
        if(!planDate.equals(nowDate)){
            DBObject colStatus = MongoProvider.findOne("db_master_data_status",new BasicDBObject().append("_id",collection));
            if(colStatus != null){
                String date = (String)colStatus.get("date");
                int days = Utils.getBetweenDays(date,Utils.getDefaultCurrentDate());
                if(days < 7){
                    result.put("level","info");
                    result.put("check","no need date");
                    MongoProvider.insert("db_master_data_check_log",result);
                    return;
                }

            }
        } else {
            log.info("get plandate [" + planDate + "] ! execute all collection reindex!");
        }

        List<DBObject> collectionsIndex = MongoProvider.getCollectionIndex(db,collection);
        String colNameKey = collection.substring(collection.indexOf("_") +1);
        DBObject indexObj = indexConfig.get(colNameKey);

        if(indexObj == null){//没有配置索引，忽略
            log.warning("dataManager:can not find collection ["+ colNameKey +"] index config ....");
            result.put("level","warning");
            result.put("check","no config index!");
            MongoProvider.insert("db_master_data_check_log",result);
            return;
        }

        List<DBObject> configIndexList = (List<DBObject>)indexObj.get("index");
        if(configIndexList != null  && configIndexList.size() > 0){

            List<DBObject> buildIndexs = new ArrayList<DBObject>();
            for (int i = 0; i < configIndexList.size(); i++) {
                DBObject oneIndex = configIndexList.get(i);
                if(!isExistIndex(oneIndex,collectionsIndex)){//索引不存在，需要重建索引
                    log.info("collection:" + db + "." + collection + "index:"  + getIndexString(oneIndex) + " not exist , require build!");
                    MongoProvider.ensureIndex(db,collection,oneIndex);
                    buildIndexs.add(oneIndex);
                }
            }
            if(buildIndexs.size() == 0){
                result.put("level","info");
                result.put("check","pass");
            } else {
                result.put("level","notice");
                result.put("check",buildIndexs);
            }

            MongoProvider.insert("db_master_data_check_log",result);
            MongoProvider.upsert("db_master_data_status", new BasicDBObject().append("_id",collection),new BasicDBObject().append("$set",new BasicDBObject().append("date",Utils.getDefaultCurrentDate())));
            return;

        } else{
            log.warning("dataManager:can not find collection ["+ colNameKey +"] index config ....");
            result.put("level","warning");
            result.put("check","no config index!");
            MongoProvider.insert("db_master_data_check_log",result);
            return;
        }
    }

    /**
     * 获取索引对象的字符串
     * @param oneIndex
     * @return
     */
    private static String getIndexString (DBObject oneIndex){
        if(oneIndex == null){
            return "";
        }
        String result = "{";
        Set<String> indexKeySet = oneIndex.keySet();
        for(String key:indexKeySet){
            if(!result.endsWith("{") && !result.endsWith(",")){
                result += ",";
            }
            String str = key + ":" + oneIndex.get(key);
            result += str;
        }

        result += "}";

        return result;

    }


    /**
     * 判断表是否存在某个索引
     * @return
     */
    private static boolean isExistIndex(DBObject configIndex, List<DBObject> indexInfo) {
        if (indexInfo == null) {
            return false;
        }
        Set<String> configKeySet = configIndex.keySet();
        for (int i = 0; i < indexInfo.size(); i++) {
            boolean flag = true;
            DBObject index = indexInfo.get(i);
            DBObject indexKey = (DBObject) index.get("key");
            Set<String> indexKeySet = indexKey.keySet();

            if (configKeySet.size() == indexKeySet.size()) {
                for (String key : indexKeySet) {
                    if (!configKeySet.contains(key) || indexKey.get(key) != configIndex.get(key)) {
                        flag = false;
                    }
                }
            } else {
                flag = false;
            }
            if (flag) {
                return true;
            }
        }
        return false;
    }


    /**
     * 获取多有的cc_data库
     *
     * @return
     */
    private static List<String> getAllDbs() {

        DBObject master = MongoProvider.findOne(DBMaster.DB_MASTER, new BasicDBObject().append("master_key", "db_status"));
        List<String> dbs = (List<String>) master.get("db_names");

        return dbs;
    }


}
