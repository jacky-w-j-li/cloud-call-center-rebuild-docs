package com.dishui.model;

import com.dishui.assign.DBQueueThread;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBObject;
import com.mongodb.WriteConcern;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

/**
 * Created by zengyx on 16/8/7.
 */
public class PeerTaskQueue {
    public static final Logger log = Logger.getLogger(PeerTaskQueue.class.getName());
    public static int taskOverSize = 1000;
    static{
        if(AppConfig.getInstance().getVar("taskOverSize") != null){
            taskOverSize = Integer.parseInt(AppConfig.getInstance().getVar("taskOverSize"));
        }
    }
    /**
     * 任务队列
     * 双向队列
     */
    private  ConcurrentLinkedDeque<String> sessionList = new ConcurrentLinkedDeque<String>();
    /**
     * vip分配
     */
    private  ConcurrentLinkedDeque<String> vipSessionList = new ConcurrentLinkedDeque<String>();


    /**
     * account_peerId下的座席是否是可分配的状态, true为可分配, false为不可分配
     */
    private volatile boolean assignStatus;

    private String account;

    private String peerId;

    private boolean isReading;

    private  AtomicInteger size = new AtomicInteger(0);
    private  AtomicInteger dbSize = new AtomicInteger(0);

    /**
     * 控制是否写入数据库
     */
    private  AtomicBoolean  writeLock =  new AtomicBoolean(false);

    /**
     * 标志size变化的
     */
    private  AtomicBoolean sizeChangeFlag = new AtomicBoolean(false);

    public void setSizeChangeFlag(boolean flag){
        sizeChangeFlag.set(flag);
    }

    public boolean getSizeChangeFlag(){
        return sizeChangeFlag.get();
    }

    public  boolean isFull(){
        return size() >= taskOverSize;
    }

    public int size(){
        return sessionList.size();
    }
    public int vipListSize(){
        return vipSessionList.size();
    }

    public synchronized boolean isReading() {
        if(isReading){
            return true;
        }
        isReading = true;
        return false;
    }

    public void setReading(boolean reading) {
        isReading = reading;
    }

    public boolean isAssignStatus() {
        return assignStatus;
    }

    public void setAssignStatus(boolean assignStatus) {
        this.assignStatus = assignStatus;
    }

    public void addToHead(String ele){
        size.getAndIncrement();
        sessionList.addFirst(ele);
    }

    public String poll(){
        String sessionId = sessionList.poll();
        if(sessionId != null){
            setSizeChangeFlag(true);
            size.getAndDecrement();
        }

        //当小于一半的时候从数据库中去读取
        int limit = taskOverSize / 2;
        if((sessionList.size()+vipSessionList.size()) < limit && writeLock.get()){
            Map task = new HashMap<String, Object>();
            task.put("peerId", peerId);
            task.put("limit", limit);
            DBQueueThread.add(task);
        }
        return sessionId;
    }
    public String pollFromVipSessionList(){
    	String sessionId = vipSessionList.poll();
    	if(sessionId != null){
    		setSizeChangeFlag(true);
    		size.getAndDecrement();
    	}
    	
    	//当小于一半的时候从数据库中去读取
    	int limit = taskOverSize / 2;
    	if(sessionList.size()+vipSessionList.size() < limit && writeLock.get()){
    		Map task = new HashMap<String, Object>();
    		task.put("peerId", peerId);
    		task.put("limit", limit);
    		DBQueueThread.add(task);
    	}
    	return sessionId;
    }

    public void setWriteLock(boolean writeLock){
        this.writeLock.set(writeLock);
    }

    /**
     * 从数据库中取出来放到queue中
     */
    public void addToQueue(List sessionIds){
        sessionList.addAll(sessionIds);
    }
    
    public void addToVipAssignQueue(List sessionIds){
    	vipSessionList.addAll(sessionIds);
    }
    /**
     * 获取总的数量,包括在数据库中的
     * @return
     */
    public  int getTotalSize(){
        return size.get();
    }

    /**
     * 修改数据库的数量统计
     */
    public void changeDbSize(int num){
        dbSize.getAndAdd(num);
    }

    public void add(String sessionId){
        size.getAndIncrement();
        setSizeChangeFlag(true);
        log.info(peerId+": taskQueueSize:"+sessionList.size()+", totalSize:"+size.get()+"   taskOverSize:"+taskOverSize+"   sessionId:"+sessionId);
        if(writeLock.get()){
            addToDb(sessionId);
            return;
        }
        if(isFull()){
            setWriteLock(true);
            addToDb(sessionId);
        }else{
            sessionList.add(sessionId);
        }

    }
    public void addToVipList(String sessionId){
    	size.getAndIncrement();
    	setSizeChangeFlag(true);
    	log.info(peerId+": taskQueueVipSize:"+vipSessionList.size()+", totalSize:"+size.get()+"   taskOverSize:"+taskOverSize+"   sessionId:"+sessionId);
    	if(writeLock.get()){
    		addToDb(sessionId);
    		return;
    	}
    	if(isFull()){
    		setWriteLock(true);
    		addToDb(sessionId);
    	}else{
    		vipSessionList.add(sessionId);
    	}
    	
    }

    private void addToDb(String sessionId) {
        BasicDBObject insert = new BasicDBObject();
        insert.append("_id", sessionId);
        insert.append("peerId", peerId);
        insert.append("account", account);
        MongoProvider.insertByReportDbName(Constant.ASSIGN_DB, Constant.ASSIGN_OVER_QUEUE, insert, new WriteConcern(1));
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getPeerId() {
        return peerId;
    }

    public void setPeerId(String peerId) {
        this.peerId = peerId;
    }
    


	/**
     * 每次批量取一批数据出来
     * @return
     */
    public List<String> batchGetSessionList(int num){
        List<String> taskList = new ArrayList<String>();
        int size = num;
//        if(num>size()) {
//            size = size();
//        }
        for (int i = 0; i < size; i++) {
            String task = poll();
            if(task == null){
                break;
            }
            taskList.add(task);

        }
        log.info(peerId+": taskQueueSize:"+sessionList.size()+", totalSize:"+ this.size.get()+"   taskOverSize:"+taskOverSize);

        return taskList;
    }
    public List<String> batchGetVipSessionList(int num){
    	List<String> taskList = new ArrayList<String>();
    	int size = num;
    	for (int i = 0; i < size; i++) {
    		String task = pollFromVipSessionList();
    		if(task == null){
    			break;
    		}
    		taskList.add(task);
    		
    	}
    	log.info(peerId+": taskvipQueueSize:"+vipSessionList.size()+", totalSize:"+ this.size.get()+"   taskOverSize:"+taskOverSize);
    	
    	return taskList;
    }


    /**
     * 批量塞回队列中
     * @param surplist
     */
    public void batchSetToList(List<String> surplist){
        for(int i=surplist.size()-1; i>=0; i--){
            addToHead(surplist.get(i));
        }
    }
}
