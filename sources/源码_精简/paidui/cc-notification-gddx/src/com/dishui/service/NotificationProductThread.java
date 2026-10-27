package com.dishui.service;

import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.model.NotificationVO;
import com.dishui.utils.DateUtil;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;
import redis.clients.jedis.Tuple;

import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.logging.Logger;

/**
 * Created by zengyx on 16/10/9.
 *
 * 从redis队列里取数据出来进行分发
 */
public class NotificationProductThread implements Runnable {

    private static Logger log = Logger.getLogger(NotificationProductThread.class.getName());

    public static ConcurrentLinkedQueue<NotificationVO> queue = new ConcurrentLinkedQueue<NotificationVO>();

    private RedisAPI redis = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);

    public static void start(){
        new Thread(new NotificationProductThread(), "QueueConsumerThread").start();
    }

    @Override
    public void run() {
        log.info("notifictaion product thread start");

        while(true){
            try{
                long nowTime = DateUtil.getCurrentMs();
                Pipeline pip = redis.pipelined();
                pip.multi();
                Response<Set<Tuple>> sessionListResponse = pip.zrangeByScoreWithScores(RedisKeyConstant.NOTIFICATION,-1, nowTime);
                pip.zremrangeByScore(RedisKeyConstant.NOTIFICATION,-1,nowTime);
                pip.exec();
                redis.safeSync();
                Set<Tuple> notifications = sessionListResponse.get();
                if (notifications.size() > 0) {
                    log.info("获取提醒条数:" + notifications.size() + "条");
                }
                process(notifications);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }catch (Exception e){

            }

        }
    }

    /**
     * 处理提醒
     * @param notifications
     */
    private void process(Set<Tuple> notifications) {
        for(Tuple notification: notifications){
            double score = notification.getScore();
            String ele = notification.getElement();
            String[] infos = ele.split(":");
            NotificationVO notificationVO = new NotificationVO();
            notificationVO.setId(infos[1]);
            notificationVO.setScore(score);
            notificationVO.setType(infos[0]);
            queue.add(notificationVO);
            synchronized (queue){
                queue.notifyAll();
            }
        }
    }
}
