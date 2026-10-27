package com.dishui.assign;

import com.dishui.db.mango.MongoProvider;
import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.model.Constant;
import com.mongodb.BasicDBObject;
import com.mongodb.QueryOperators;
import com.mongodb.WriteConcern;
import com.mongodb.client.model.UpdateOneModel;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by zengyx on 16/8/25.
 * 当cc服务断开时,处理断开那一瞬间没有插入到redis的数据
 *
 */
public class CCExceptionProcessorThread implements Runnable {
    private RedisAPI rds = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);

    /**
     *
     */
    public static void start(){
        new Thread(new CCExceptionProcessorThread(), "CCExceptionProcessorThread").start();
    }


    @Override
    public void run() {
        while(true){
            try{

                long nowTime = System.currentTimeMillis();

                //查找5分钟之前的数据
                List<BasicDBObject> sessions = MongoProvider.find(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
                        new BasicDBObject("status", "undeal").append("redisRecordDelayTime",
                                new BasicDBObject(QueryOperators.LT, nowTime- 120000)),new BasicDBObject("_id", 1).append("account", 1).
                                append("toPeer", 1).append("createTimeStamp", 1).append("manualTime", 1).append("sid", 1), 0, -1);

                for(int i=0; i<sessions.size(); i++){
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

                }

            }catch (Exception e){
                e.printStackTrace();
            }
            try {
                Thread.sleep(15000);  //休眠15s
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
