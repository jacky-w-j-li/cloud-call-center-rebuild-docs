package com.dishui.ip.db;

import com.dishui.db.mango.MongoProvider;
import com.dishui.ip.Constants;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by jackwong on 16/3/15.
 */
public class IPService {
    public static IPConfig getConfig(){
        DBObject dbIPConfig = MongoProvider.findOne(Constants.DB_IP,Constants.DB_COLLECTION_IP_CONFIG,new BasicDBObject());

        return IPConfig.fromDB(dbIPConfig);
    }

    public static void batchSave(List<IP> ipList,String collection) {
        if(ipList == null || ipList.isEmpty()){
            return;
        }

        List<DBObject> dbObjList = new ArrayList<DBObject>();
        for(IP ip : ipList){
            dbObjList.add(ip.toDB());
        }

        MongoProvider.batchInsert(Constants.DB_IP,collection,dbObjList);
    }

    public static void dropIPPool(){
        MongoProvider.dropCollection(Constants.DB_IP,Constants.DB_COLLECTION_IP_POOL);
    }

    public static void createIPPoolIndex(String collection){
        BasicDBObject indexDOC = new BasicDBObject();
        indexDOC.append("ip_start",1)
                .append("ip_end",1);

        MongoProvider.ensureIndex(Constants.DB_IP,collection,indexDOC);
    }

    public static void transTempIPPool(){
        MongoProvider.renameCollection(Constants.DB_IP,Constants.DB_COLLECTION_TEMP_IP_POOL,Constants.DB_COLLECTION_IP_POOL,true);
    }

    public static void updateVersion(String remoteVersion,int count) {
        BasicDBObject condition = new BasicDBObject();
        BasicDBObject updateDoc = new BasicDBObject("$set",new BasicDBObject("version",remoteVersion).append("updateTime", DateUtil.getCurrentTime()).append("count",count));

        MongoProvider.updateOne(Constants.DB_IP,Constants.DB_COLLECTION_IP_CONFIG,condition,updateDoc,WriteConcern.SAFE);
    }
}
