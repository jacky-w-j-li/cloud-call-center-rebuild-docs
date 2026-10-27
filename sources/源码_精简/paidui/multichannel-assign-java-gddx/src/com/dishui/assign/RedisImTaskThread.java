package com.dishui.assign;

import com.dishui.AppServiceStartup;
import com.dishui.db.mango.MongoProvider;
import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.model.Constant;
import com.dishui.model.PeerTaskQueue;
import com.mongodb.BasicDBObject;
import com.mongodb.QueryOperators;
import com.mongodb.WriteConcern;
import com.mongodb.client.model.UpdateOneModel;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;

import java.math.BigDecimal;
import java.util.*;
import java.util.logging.Logger;

import org.apache.commons.lang.StringUtils;

/**
 * Created by zengyx on 16/8/7.
 */
public class RedisImTaskThread implements Runnable{
    private static final Logger log = Logger.getLogger(RedisImTaskThread.class.getName());
    private RedisAPI redis = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);

    public static void start(){
        new Thread(new RedisImTaskThread(), "Thread-redis-queue").start();
    }

    @Override
    public void run() {
        while(true){
            try{
                Pipeline pip = redis.pipelined();
                pip.multi();
                Response<Set<String>> sessionListResponse = pip.zrange(RedisKeyConstant.REDIS_IM_ASSIGN_TASK,0,Constant.BATCH_PICK_SIZE-1);
                pip.zremrangeByRank(RedisKeyConstant.REDIS_IM_ASSIGN_TASK,0,Constant.BATCH_PICK_SIZE-1);
                pip.exec();
                redis.safeSync();

                Set<String> sessionList = sessionListResponse.get();
                if(!sessionList.isEmpty()){
                    List<UpdateOneModel<BasicDBObject>> updateOneModels = new ArrayList<UpdateOneModel<BasicDBObject>>();

                    for(Iterator<String> iterator = sessionList.iterator(); iterator.hasNext();){
                        try{

                            String sessionInfo = iterator.next();
                            String[] infos = sessionInfo.split(",",-1);
                            String account = infos[0];
                            String peerId = infos[1];
                            String sessionId = infos[2];
                            String sid = infos[3];
                            String vipAgent = "";
                            if(infos.length>4){
                            	vipAgent = infos[4];
                            }

                            //紧急修复bug
                            if(vipAgent.length() < 10){
                                vipAgent = "";
                            }
                            

                            if(AppServiceStartup.queueMap.containsKey(peerId)){
                                PeerTaskQueue queue = AppServiceStartup.queueMap.get(peerId);
                                if(StringUtils.isNotEmpty(vipAgent)){
                                	queue.addToVipList(sessionId+","+sid+","+vipAgent);	
                                }else{
                                	queue.add(sessionId+","+sid+","+vipAgent);	
                                }
                                
                            }else{
                                PeerTaskQueue queue = new PeerTaskQueue();
                                queue.setAssignStatus(true);
                                queue.setAccount(account);
                                queue.setPeerId(peerId);
                                if(StringUtils.isNotEmpty(vipAgent)){
                                	queue.addToVipList(sessionId+","+sid+","+vipAgent);	
                                }else{
                                	queue.add(sessionId+","+sid+","+vipAgent);
                                }
                                AppServiceStartup.queueMap.put(peerId, queue);
                            }
                            BasicDBObject filter = new BasicDBObject("_id", sessionId).append("account", account);
                            BasicDBObject update = new BasicDBObject("$unset", new BasicDBObject("redisRecordDelayTime", 1));
                            UpdateOneModel updateOneModel = new UpdateOneModel(filter, update);
                            updateOneModels.add(updateOneModel);
                        }catch (Exception e){
                            e.printStackTrace();
                        }

                    }
                    //定时
                    if(updateOneModels.size() > 0){
                        MongoProvider.bulkWrite("cc", Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,updateOneModels, new WriteConcern(1));
                    }

                }else{
                    Thread.sleep(1000);
                }
            }catch (Exception e){
                e.printStackTrace();
            }


        }
    }

    /**
     * 启动时初始化数据
     */
    public static void initData() {
            RedisAPI rds = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);
            //直接drop掉表
            MongoProvider.dropReportDBTable(Constant.ASSIGN_DB, Constant.ASSIGN_OVER_QUEUE);
            int page = 1;
            int limit = 1000;
            int skip = 0;

            while(true){
                try{
                    skip = (page-1)*1000;
                    //只初始化一个月内的数据
                    long milis = 864000000l; //10天
                    long timeCon = new Date().getTime() - milis;
                    List<BasicDBObject> sessions = MongoProvider.find(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
                            new BasicDBObject("status", "undeal").append("toPeer", new BasicDBObject(QueryOperators.NE, null)).
                                    append("createTimeStamp",new BasicDBObject(QueryOperators.GTE, timeCon)),new BasicDBObject("_id", 1).append("account", 1).
                                    append("toPeer", 1).append("createTimeStamp", 1).append("manualTime", 1).append("sid",1), skip, limit);
                    for(int i=0; i<sessions.size(); i++){
                        try{
                            BasicDBObject dbObject = sessions.get(i);
                            String sessionId = dbObject.get("_id").toString();
                            String sid = dbObject.get("sid").toString();
                            String account = dbObject.get("account").toString();
                            String toPeer = dbObject.get("toPeer").toString();
                            long timeStamp = 0;
                            if(dbObject.get("manualTime")!=null){
                                String manualTimeStampStr = dbObject.get("manualTime").toString();
                                BigDecimal bigDecimal2 = new BigDecimal(manualTimeStampStr);
                                timeStamp = Long.parseLong(bigDecimal2.toPlainString());
                            }else{
                                String createTimeStampStr = dbObject.get("createTimeStamp").toString();
                                BigDecimal bigDecimal = new BigDecimal(createTimeStampStr);
                                timeStamp = Long.parseLong(bigDecimal.toPlainString());
                            }
                            rds.zadd(RedisKeyConstant.REDIS_IM_ASSIGN_TASK, timeStamp, account+","+toPeer+","+sessionId+","+sid);
                        }catch (Exception e){
                            e.printStackTrace();
                        }

                    }
                    if(sessions.size() < 1000){
                        break;
                    }
                    page++ ;
                }catch (Exception e){
                    e.printStackTrace();
                }
            }

    }
}
