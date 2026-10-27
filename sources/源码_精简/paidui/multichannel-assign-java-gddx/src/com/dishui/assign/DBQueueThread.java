package com.dishui.assign;

import com.dishui.AppServiceStartup;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.Constant;
import com.dishui.model.PeerTaskQueue;
import com.mongodb.BasicDBObject;
import com.mongodb.QueryOperators;
import com.mongodb.WriteConcern;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.apache.commons.lang.StringUtils;

/**
 * Created by zengyx on 16/8/25.
 * 每个技能组的queue的size有大小限制,当满了后直接写入数据库.
 * 当queue中消耗到一半的时候,从数据库中读取数据出来写入queue中.
 *
 */
public class DBQueueThread implements Runnable {

    public static Queue<Map<String, Object>> queue = new ConcurrentLinkedQueue<Map<String, Object>>();

    public static void start(){
        new Thread(new DBQueueThread(), "DB-queue-thread").start();
    }

    @Override
    public void run() {

        while(true){
            try{
                Map<String, Object> task = queue.poll();
                if(task!=null){
                    String peerId = (String) task.get("peerId");
                    int limit = (Integer) task.get("limit");
                    BasicDBObject find = new BasicDBObject("peerId", peerId);
                    List<BasicDBObject> sessionIds = MongoProvider.findFromReportDbName(Constant.ASSIGN_DB,
                            Constant.ASSIGN_OVER_QUEUE, find, new BasicDBObject("$natural",1), limit);
                    List<String> ids = new ArrayList<String>();
                    List<String> idsToVipList = new ArrayList<String>();
                    for(int i=0; i<sessionIds.size(); i++){
                    	String sessionIdStr = sessionIds.get(i).get("_id").toString();
                    	
                    	String[] infos = sessionIdStr.split(",",-1);
                    	String vipAgentId = infos[2];
                    	if(StringUtils.isNotEmpty(vipAgentId)){
                    		idsToVipList.add(sessionIdStr);
                    	}else{
                    		ids.add(sessionIdStr);
                    	}
                    }
                    PeerTaskQueue peerTaskQueue = AppServiceStartup.queueMap.get(peerId);
                    if(peerTaskQueue == null){
                        continue;
                    }
                    peerTaskQueue.addToQueue(ids);
                    deleteFromDb(ids);
                    peerTaskQueue.addToVipAssignQueue(idsToVipList);
                    deleteFromDb(idsToVipList);
                    //重新直接入queue
                    if(ids.size() < limit/2){
                        peerTaskQueue.setWriteLock(false);

                        BasicDBObject find2 = new BasicDBObject("peerId", peerId);
                        List<BasicDBObject> sessionIds2 = MongoProvider.findFromReportDbName(Constant.ASSIGN_DB,
                                Constant.ASSIGN_OVER_QUEUE, find2, new BasicDBObject("$natural",1), -1);
                        List<String> ids2 = new ArrayList<String>();
                        List<String> idsVipAssign= new ArrayList<String>();
                        for(int i=0; i<sessionIds2.size(); i++){
                        	String sessionIdStr = sessionIds2.get(i).get("_id").toString();
                        	String[] infos = sessionIdStr.split(",",-1);
                        	String vipAgentId = infos[2];
                        	if(StringUtils.isNotEmpty(vipAgentId)){
                        		idsVipAssign.add(sessionIdStr);
                        	}else{
                        		ids2.add(sessionIdStr);
                        	}
                        }
                        peerTaskQueue.addToQueue(ids2);
                        deleteFromDb(ids2);
                        peerTaskQueue.addToVipAssignQueue(idsVipAssign);
                        deleteFromDb(idsVipAssign);
                    }


                }
                if(queue.size() <=0){
                    synchronized (queue){
                        queue.wait();
                    }
                }
            }catch (Exception e){
                e.printStackTrace();
            }
        }
    }

    private void deleteFromDb(List<String> sessionIds) {
        MongoProvider.removeManyFromReportDbName(Constant.ASSIGN_DB, Constant.ASSIGN_OVER_QUEUE,
                new BasicDBObject("_id", new BasicDBObject(QueryOperators.IN, sessionIds)), new WriteConcern(1));

    }

    public static void add(Map<String, Object> task){
        queue.add(task);
        synchronized (queue){
            queue.notify();
        }

    }
}
