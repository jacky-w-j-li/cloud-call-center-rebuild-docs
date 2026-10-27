package com.dishui.assign;

import com.dishui.AppServiceStartup;
import com.dishui.db.mango.MongoProvider;
import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.manager.service.AppConfig;
import com.dishui.model.*;
import com.dishui.server.http.AppServiceHander;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.*;
import com.mongodb.client.result.UpdateResult;
import com.mongodb.util.JSON;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.*;
import java.util.logging.Logger;

import org.apache.commons.lang.StringUtils;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by zengyx on 16/5/20.
 */
public class PeerAssignThread implements Runnable {
    private static final Logger log = Logger.getLogger(PeerAssignThread.class.getName());

    public static final String PRIORITY = "priority";
    public static final String MINIMUN = "least";
    public static final String ROUNDROBIN = "queue";
    public static final String RANDOM = "random";
    public static final String BATCH = "batch";
//    private String strategy; //技能组的策略

    private RedisAPI redis = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);

    public static void start(int threadNum) {
        while (threadNum > 0) {
            log.info("Thread-assign-" + threadNum +" start...");
            new Thread(new PeerAssignThread(), "Thread-assign-" + threadNum).start();
            threadNum--;
        }
    }

    /**
     * 取map中的数据,并且
     */
    @Override
    public void run() {
        while (true) {
            try{
                process();
            }catch (Exception e){
                e.printStackTrace();
            }


        }
    }

    /**
     * 分配处理
     */
    private void process(){
        boolean sleepFlag = true;
        for (Iterator iterator = AppServiceStartup.queueMap.keySet().iterator(); iterator.hasNext(); ) {
            long startTime = System.currentTimeMillis();
            String peerId = (String) iterator.next();

            PeerTaskQueue taskQueue = AppServiceStartup.queueMap.get(peerId);
            
            if(taskQueue == null){
                continue;
            }
            int taskCount = taskQueue.getTotalSize();
            if(taskCount <= 0){
                continue;
            }
            
            BasicDBObject peerQueue = null;
            peerQueue = getMailQueue(peerId);
            if(peerQueue == null){
                taskQueue.setAssignStatus(false);
                taskQueue.setReading(false);
                continue;
            }
            String strategy = peerQueue.get("AssignRule") == null ? RANDOM : peerQueue.get("AssignRule").toString();
            boolean memory = peerQueue.get("IsMemory") == null? false: Boolean.parseBoolean(peerQueue.get("IsMemory").toString());
            int memoryMinutes = peerQueue.get("MemoryTime") == null? 0: Integer.parseInt(peerQueue.get("MemoryTime").toString());
            int memorySeconds = 0;
            try{
                memorySeconds = memoryMinutes * 60;
            }catch (Exception e){

            }
            
            
            //vip分配
            if(taskQueue.vipListSize()>0){
            	processVipAssign(peerId, taskQueue, memory, memorySeconds); 
            	continue;
            }
            
            //座席处于饱和状态,跳过该队列
            if (!taskQueue.isAssignStatus()) {
                continue;
            }
            
            if (taskQueue.isReading()) {
                continue;
            }
            
            int pValue = 0;//这个值为每次可以批量分配的一个阀值
            try {
                BasicDBList agentIdList = (BasicDBList) peerQueue.get("AssignMembers");
                List<String> agentIds = new ArrayList<String>();
                Map<String, BasicDBObject> clients = new HashMap<String, BasicDBObject>();
                List<BasicDBObject> onlineClients = new ArrayList<BasicDBObject>();
                Map<String, Object> priorityMap = new HashMap<String, Object>();
                if (agentIdList != null || agentIdList.size() == 0) {
                    onlineClients = getOnlineAgents(agentIdList, agentIds, clients, onlineClients, priorityMap);
                } else {
                    taskQueue.setAssignStatus(false);
                    taskQueue.setReading(false);
                    log.info("setAssignStatus=false agentIdList.size="+agentIdList.size()+"peerId="+peerId);
                    continue;
                }


                List<BasicDBObject> resultAgents = new ArrayList<BasicDBObject>();

                
                if(memory){
                    if (processMemoryAssign(peerId, taskQueue, memory, memorySeconds, clients, onlineClients)) continue;
                }
                if(strategy.equals(RANDOM) || strategy.equals(ROUNDROBIN)) {

                    pValue = getBatchNumWithRandomOrRoundRobin(clients, resultAgents, pValue, taskCount, peerId, strategy, memory);
                    if (pValue <= 0 || resultAgents.size() <= 0) {
                        //睡眠的标志
                        taskQueue.setAssignStatus(false);
                        taskQueue.setReading(false);
                        log.info("setAssignStatus=false pValue="+pValue+"resultAgents.size="+resultAgents.size()+"peerId="+peerId);
                        continue;
                    }else{
                        sleepFlag = false;
                    }

                    //处理pValue=1的情况,并且taskCount不够分一轮时,取部分数据出来处理
                    if (pValue == 1 && taskCount < resultAgents.size()) {
                        resultAgents = resultAgents.subList(0, (int) taskCount);
                    }

                    for (int i = 0; i < resultAgents.size(); i++) {
                        List<String> tasks = taskQueue.batchGetSessionList(pValue);
                        List<String> surplusList = assignTasksToAgent(tasks, resultAgents.get(i), taskQueue.getAccount(), peerId, memory, memorySeconds,false);
                        if (surplusList.size() > 0) {
                            taskQueue.batchSetToList(surplusList);
                        }
                        if (strategy.equals(ROUNDROBIN) && tasks.size() > 0) {
                            AppServiceHander.peerMap.put(peerId, resultAgents.get(i).get("_id").toString());
                        }
                    }

                } else if (strategy.equals(PRIORITY)) {
                    pValue = getResultAgentsWithPriority(clients, resultAgents, pValue, taskCount, peerId, memory);

                    if (pValue>0) {
                        sleepFlag = false;
                    }else{
                        taskQueue.setAssignStatus(false);
                        taskQueue.setReading(false);
                        continue;
                    }

                    //处理pValue=1的情况,并且taskCount不够分一轮时,取部分数据出来处理
                    if (pValue == 1 && taskCount < resultAgents.size()) {
                        resultAgents = resultAgents.subList(0, (int) taskCount);
                    }
                    for (int i = 0; i < resultAgents.size(); i++) {
                        List<String> tasks = taskQueue.batchGetSessionList(pValue);
                        List<String> surplusList = assignTasksToAgent(tasks, resultAgents.get(i), taskQueue.getAccount(), peerId, memory, memorySeconds,false);
                        if (surplusList.size() > 0) {
                            taskQueue.batchSetToList(surplusList);
                        }
                        if (tasks.size() > 0) {
                            AppServiceHander.peerMap.put(peerId, resultAgents.get(i).get("_id").toString());
                        }
                    }
                } else if (strategy.equals(MINIMUN)) {
                    pValue = sortAgentsWithMinimumStrategy(clients, resultAgents, memory);
                    if (pValue>0) {
                        sleepFlag = false;
                    }else{
                        taskQueue.setAssignStatus(false);
                        taskQueue.setReading(false);
                        continue;
                    }

                    //处理pValue=1的情况,并且taskCount不够分一轮时,取部分数据出来处理
                    if (pValue == 1 && taskCount < resultAgents.size()) {
                        resultAgents = resultAgents.subList(0, (int) taskCount);
                    }
                    for (int i = 0; i < resultAgents.size(); i++) {
                        List<String> tasks = taskQueue.batchGetSessionList(pValue);
                        List<String> surplusList = assignTasksToAgent(tasks, resultAgents.get(i), taskQueue.getAccount(), peerId, memory,memorySeconds,false);
                        if (surplusList.size() > 0) {
                            taskQueue.batchSetToList(surplusList);
                        }
                    }
                }

                taskQueue.setReading(false);
                //只有当数据条数变化的时候才需要去通知座席待领取数
                if(taskQueue.getSizeChangeFlag()){
                    taskQueue.setSizeChangeFlag(false);
                    notifyAgent(onlineClients, taskQueue.getAccount());

                }
                log.info("one assign count:"+(System.currentTimeMillis() - startTime)+"ms");
            } catch (Exception e) {
                taskQueue.setReading(false);
                e.printStackTrace();
            }

        }
        if(sleepFlag){
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    
	private boolean processMemoryAssign(String peerId, PeerTaskQueue taskQueue, boolean memory, int memorySeconds, Map<String, BasicDBObject> clients, List<BasicDBObject> onlineClients) {
        List<String> tasks = taskQueue.batchGetSessionList(1);
        if(tasks.size() > 0){
            String task = tasks.get(0);
            String[] sessionInfo = task.split(",",-1);
            String uid = null;
    		if(sessionInfo.length >=2){
    			uid = sessionInfo[1];
    		}
            if(uid!=null){
                String memoryAgent = redis.get(RedisKeyConstant.IM_ASSIGN_MEMORY+uid);
                if(memoryAgent != null && clients.containsKey(memoryAgent)){

                    //  16/9/21 去循环座席所在的多个技能组是否有达到饱和的,饱和则不分配
                    boolean isCanAssign = isCanAssign(memoryAgent, taskQueue.getAccount(), peerId);
                    if(isCanAssign){
                        assignTasksToAgent(tasks, clients.get(memoryAgent), taskQueue.getAccount(), peerId, memory, memorySeconds,false);
                        taskQueue.setReading(false);
                        //只有当数据条数变化的时候才需要去通知座席待领取数
                        if(taskQueue.getSizeChangeFlag()){
                            taskQueue.setSizeChangeFlag(false);
                            notifyAgent(onlineClients, taskQueue.getAccount());
                        }
                        return true;
                    }else{
                        taskQueue.batchSetToList(tasks);
                    }
                }else{
                    taskQueue.batchSetToList(tasks);
                }
            }else{
                taskQueue.batchSetToList(tasks);
            }

        }
        return false;
    }
    
    /**
     * 处理专属坐席分配
     * @param peerId
     * @param taskQueue
     * @param memorySeconds 
     * @param memory 
     * @param clients
     * @param onlineClients
     * @return
     */
    private boolean processVipAssign(String peerId, PeerTaskQueue taskQueue, boolean memory, int memorySeconds) {
    	List<String> tasks = taskQueue.batchGetVipSessionList(1);
    	Set<String> sessionInfos = new HashSet<String>();
    	if(tasks.size() > 0){
    		String task = tasks.get(0);
    		sessionInfos.add(task);
    		String[] sessionInfo = task.split(",",-1);
    		String sessionId = sessionInfo[0];
    		String vipAgentId = null;
    		if(sessionInfo.length == 3){
    			vipAgentId = sessionInfo[2];
    		}
    		if(StringUtils.isNotEmpty(vipAgentId)){
    			BasicDBObject agentInfo = getOnlineAgentInfo(vipAgentId);
    			if(vipAgentId != null && isCanVipAssign(vipAgentId) && agentInfo!=null){
					assignTasksToAgent(tasks, agentInfo, taskQueue.getAccount(), peerId, memory, memorySeconds,true);
					return true;
    			}else{
    				vipAssignFailed(taskQueue,sessionInfos);
    			}
    		}else{
    			vipAssignFailed(taskQueue,sessionInfos);
    		}
    	}
    	return false;
    }

    private void vipAssignFailed(PeerTaskQueue taskQueue, Set<String> sessionInfos){
		PushVO pushVO = new PushVO("", sessionInfos, taskQueue.getAccount(), "", 0,Constant.PUSHVOTYPE_VIPASSIGNFAILED);
        PushQueue.add(pushVO);
    }
    
    
    /**
     * 技能组获取
     * @param peerId
     * @return
     */
    private BasicDBObject getMailQueue(String peerId) {
        BasicDBObject peerQueue;
        String queue = redis.get(RedisKeyConstant.MULTICHANNEL_SKILLGROUP + peerId);
        if (queue == null || queue.equals(RedisKeyConstant.REDIS_FAIL)) {
            BasicDBObject condition = new BasicDBObject();
            condition.put("Exten", peerId);
            peerQueue = MongoProvider.findOne(Constant.DB_APP_MAIL_QUEUE, condition);
            if (peerQueue != null) {
                redis.set(RedisKeyConstant.MULTICHANNEL_SKILLGROUP + peerId, JSON.serialize(peerQueue));
            }
        } else {
            peerQueue = (BasicDBObject) JSON.parse(queue);
        }
        return peerQueue;
    }

    /**
     * 封装数据
     * @param agentIdList 技能组座席列表
     * @param agentIds 技能组座席id列表
     * @param clients 在线,且开关开着的技能组
     * @param onlineClients 在线的技能组
     * @param priorityMap 座席优先级对应的map结构
     * @return
     */
    private List<BasicDBObject> getOnlineAgents(BasicDBList agentIdList, List<String> agentIds, Map<String, BasicDBObject> clients, List<BasicDBObject> onlineClients, Map<String, Object> priorityMap) {
        boolean getFromRedis = true;
        String[] redisAgents = new String[agentIdList.size()];
        for (int i = 0; i < agentIdList.size(); i++) {
            Map<String, Object> agentMap = (Map<String, Object>) agentIdList.get(i);
            String agentId = (String) agentMap.get("agentID");
            agentIds.add(agentId);
            redisAgents[i] = RedisKeyConstant.ONLINE_AGENT_INFO + agentId;
            priorityMap.put(agentId, agentMap.get("penalty"));
        }
        List<String> agents = redis.mget(redisAgents);
        for (int i = 0; i < agents.size(); i++) {
            String client = agents.get(i);
            if (client != null && client.equals(RedisKeyConstant.REDIS_FAIL)) {
                getFromRedis = false;
                break;
            }
            if (client != null && !client.equals("nil")) {
                BasicDBObject clientObj = (BasicDBObject) JSON.parse(client);
                onlineClients.add(clientObj);
                if (clientObj.get("status") == null || clientObj.get("status").toString().equals("open")) {
                    clientObj.put("priority", priorityMap.get(clientObj.get("_id")));
                    clients.put(clientObj.get("_id").toString(), clientObj);
                }
            }
        }

        if (!getFromRedis) {
            BasicDBObject pushCondition = new BasicDBObject();
            pushCondition.put("_id", new BasicDBObject(QueryOperators.IN, agentIds));
            onlineClients = MongoProvider.find(Constant.DB_APP_PUSH_CLIENT, pushCondition);
            if (onlineClients != null) {
                for (int i = 0; i < onlineClients.size(); i++) {
                    if (onlineClients.get(i).get("status") != null && onlineClients.get(i).get("status").toString().equals("close")) {
                        continue;
                    }
                    onlineClients.get(i).put("priority", priorityMap.get(onlineClients.get(i).get("_id")));
                    clients.put(onlineClients.get(i).get("_id").toString(), onlineClients.get(i));
                }
            }
        }
        return onlineClients;
    }

    private boolean isCanVipAssign(String agentId){
    	boolean getFromRedis = true;
    	boolean isCan = false;
    	String key  = RedisKeyConstant.ONLINE_AGENT_INFO + agentId;
    	String client = redis.get(key);
        if (client != null && client.equals(RedisKeyConstant.REDIS_FAIL)) {
            getFromRedis = false;
        }else{
        	if (client != null && !client.equals("nil")) {
                BasicDBObject clientObj = (BasicDBObject) JSON.parse(client);
                if (clientObj.get("status") == null || clientObj.get("status").toString().equals("open")) {
                	isCan =  true;
                }
            }
        }
        if (!getFromRedis) {
            BasicDBObject pushCondition = new BasicDBObject();
            pushCondition.put("_id",agentId);
            BasicDBObject agentObj = MongoProvider.findOne(Constant.DB_APP_PUSH_CLIENT, pushCondition);
            if (agentObj != null) {
                    if (agentObj.get("status") != null && agentObj.get("status").toString().equals("close")) {
                    	isCan = false;
                    }else{
                    	isCan = true;
                    }
            }else{
            	isCan = false;
            }
        }
        return isCan;
    }
    private BasicDBObject getOnlineAgentInfo(String agentId){
    	boolean getFromRedis = true;
    	BasicDBObject agentInfo = null;
    	String key  = RedisKeyConstant.ONLINE_AGENT_INFO + agentId;
    	String client = redis.get(key);
        if (client != null && client.equals(RedisKeyConstant.REDIS_FAIL)) {
            getFromRedis = false;
        }else{
        	if (client != null && !client.equals("nil")) {
        		agentInfo = (BasicDBObject) JSON.parse(client);
            }
        }
        if (!getFromRedis) {
            BasicDBObject pushCondition = new BasicDBObject();
            pushCondition.put("_id",agentId);
            agentInfo = MongoProvider.findOne(Constant.DB_APP_PUSH_CLIENT, pushCondition);
        }
        return agentInfo;
    }
    
    /**
     * 判断是否可以分配给该座席
     * 要判断该座席所处的其它技能组是否已经达到饱和,如果达到饱和了,则不能继续分给该座席了,因为要对其它的访客公平
     * @return
     */
    private boolean isCanAssign(String agent, String account, String peerId){
        List<String> peerList = null;
         if(!AppServiceStartup.agentPeerMap.containsKey(agent)){
            peerList = getAgentPeers(agent, account);
            AppServiceStartup.agentPeerMap.put(agent, peerList);
        }else{
            peerList = AppServiceStartup.agentPeerMap.get(agent);
        }
        for(int i=0;i<peerList.size(); i++){
            String peer = peerList.get(i);
            if(!peer.equals(peerId)){
                if(AppServiceStartup.queueMap.get(peer) !=null && !AppServiceStartup.queueMap.get(peer).isAssignStatus() && AppServiceStartup.queueMap.get(peer).getTotalSize() > 0){
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 获取座席所在的所有技能组号
     * @return
     */
    private List<String> getAgentPeers(String agent, String account){
        List<String> peerList = new ArrayList<String>();
        List<BasicDBObject> list = MongoProvider.find(Constant.DB_APP_MAIL_QUEUE, new BasicDBObject("AssignMembers.agentID", agent).append("Account", account));

        for(int i=0; i<list.size(); i++){
            peerList.add(list.get(i).get("Exten").toString());
        }
        return peerList;
    }

    /**
      * 将待处理的数目推送给各个座席
      *
      */
    private void notifyAgent(List<BasicDBObject> clients, String account) {
        HashMap<String, List<String>> dataMap = new HashMap<String, List<String>>();
        for (int i = 0; i < clients.size(); i++) {
            BasicDBObject agent = clients.get(i);
            String ipPort = new StringBuilder(agent.get("pushServerIp").toString()).append(":").append(agent.get("pushServerPort").toString()).toString();
            HashMap<String, Object> condition = new HashMap<String, Object>();
            condition.put("account", account);
            condition.put("agentId", agent.get("_id").toString());
            Object[] peers = getAgentPeers(condition);
            condition.put("toPeer", new BasicDBObject("$in", peers));
            long undealNum = getUndealNum(condition);
            String value = new StringBuilder(agent.get("_id").toString()).append(":").append(undealNum).toString();
            if (dataMap.containsKey(ipPort)) {
                dataMap.get(ipPort).add(value);
            } else {
                List<String> list = new ArrayList<String>();
                list.add(value);
                dataMap.put(ipPort, list);
            }

        }
        batchPushUndealNumToAgent(dataMap);

    }

    private Object[] getAgentPeers(HashMap<String, Object> condition) {
        BasicDBObject dbObject = new BasicDBObject();
        dbObject.put("Account", condition.get("account"));
        dbObject.put("AssignMembers.agentID", condition.get("agentId"));
        List<BasicDBObject> result = MongoProvider.find(Constant.DB_APP_MAIL_QUEUE, dbObject);
        List<String> peers = new ArrayList<String>();
        for (int i = 0; i < result.size(); i++) {
            peers.add(result.get(i).get("Exten").toString());
        }
        return peers.toArray();
    }

    private long getUndealNum(HashMap<String, Object> condition) {
        BasicDBObject dbObject = new BasicDBObject();
        dbObject.put("account", condition.get("account"));
        dbObject.put("toPeer", condition.get("toPeer"));
        dbObject.put("status", "undeal");
        long count = MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, dbObject);
        return count;
    }

    /**
     * 批量推送待领取的数量给技能组下的所有座席
     */
    private void batchPushUndealNumToAgent(Map pushMap) {
        try {
            for (Iterator iterator = pushMap.keySet().iterator(); iterator.hasNext(); ) {
                String ipPort = (String) iterator.next();
                List<String> agentList = (List<String>) pushMap.get(ipPort);
                Hashtable<String, Object> dataMap = new Hashtable<String, Object>();
                dataMap.put("type", "refreshUndealNum");
                Hashtable<String, Object> subMap = new Hashtable<String, Object>();
                subMap.put("Event", "NewNotify");
                subMap.put("Data", dataMap);
                Hashtable<String, Object> map = new Hashtable<String, Object>();
                map.put("userId", agentList);
                map.put("eventData", subMap);
                String url = "http://" + ipPort + "/batchPush" ;
//                log.info("push msg to pushServer:" + url);
                String result = HttpProvider.sendPost(url, ("msg="+URLEncoder.encode(JSON.serialize(map), "UTF-8")).getBytes());
            }

        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
      * 确认数据满足条件
      *
      * @param agent
      * @return
      */
    private int getSignal(String agent, int taskSize, boolean memory,boolean vipAssign) {

        if(!AppServiceStartup.agentMap.containsKey(agent)){
            synchronized (AppServiceStartup.agentMap){
                if(!AppServiceStartup.agentMap.containsKey(agent)){
                    AppServiceStartup.agentMap.put(agent, new Object());
                }
            }
        }
        synchronized (AppServiceStartup.agentMap.get(agent)) {
            if((memory || vipAssign) && taskSize>0){
                Pipeline pip = redis.pipelined();
                pip.incrBy(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + agent, 1);
                pip.incrBy(RedisKeyConstant.AGENT_IM_DEALED_COUNT + agent, 1);
                redis.safeSync();
                return 0;
            }
            String currAgentStr = redis.get(RedisKeyConstant.ONLINE_AGENT_INFO + agent);
            BasicDBObject currAgent = (BasicDBObject) JSON.parse(currAgentStr);
            BasicDBObject user = (BasicDBObject) currAgent.get("user");
            String imMaxDealCountStr = "10";
            if (user.get("imDealCount") != null) {
                imMaxDealCountStr = user.get("imDealCount").toString();
            }
            int imDealCount = Integer.parseInt(imMaxDealCountStr);

            String redisResult = redis.get(
                    RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + agent);
            if(StringUtils.isEmpty(redisResult)){
                redisResult = "0";
            }
            int currDealNum = Integer.parseInt(redisResult);
            if (currDealNum >= imDealCount) {
                return -taskSize;
            } else {
                int incNum = 0;
                int spareSize = imDealCount - currDealNum;
                if (spareSize > taskSize) {
                    incNum = taskSize;
                } else {
                    incNum = spareSize;
                }
                Pipeline pip = redis.pipelined();
                pip.incrBy(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + agent, incNum);
                pip.incrBy(RedisKeyConstant.AGENT_IM_DEALED_COUNT + agent, incNum);
                redis.safeSync();
//                redis.incrBy(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + agent, incNum);
//                redis.incrBy(RedisKeyConstant.AGENT_IM_DEALED_COUNT + agent, incNum);

                return spareSize - taskSize > 0 ? 0: spareSize-taskSize;
            }
        }
    }

    /**
      * 批量分配任务给座席
      *  @param tasks
      * @param agentObj
     * @param account
     * @param peerId
     */
    private List<String> assignTasksToAgent(List<String> tasks, BasicDBObject agentObj, String account, String peerId, boolean memory, int memorySeconds,boolean vipAssign) {
        String agent = agentObj.get("_id").toString();
        int signal = getSignal(agentObj.get("_id").toString(), tasks.size(), memory,vipAssign);
        List<String> surplusList = new ArrayList<String>();
        if (signal <= 0) {
            surplusList = tasks.subList(tasks.size() - Math.abs(signal), tasks.size());
        }
        if (tasks.size() - Math.abs(signal) <= 0) {
            return surplusList;
        }

        Set<String> sessionIds = new HashSet<String>();
        for (int i = 0; i < tasks.size() - Math.abs(signal); i++) {
            sessionIds.add(tasks.get(i).split(",")[0]);
//            String thisClaimVersion = Math.random() + "_" + DateUtil.getCurrentMs();
//            BasicDBObject updateSessionCondition = new BasicDBObject();
//            updateSessionCondition.put("_id", tasks.get(i));
//            updateSessionCondition.put("account", account);
//            BasicDBObject setOP = new BasicDBObject();
//            setOP.put("$set", new BasicDBObject("user", agent)
//                    .append("status", "deal").append("type", "webchat").append("lastClaimTime", DateUtil.getCurrentMs())
//                    .append("autoClaimVersion", thisClaimVersion).append("beginTime", DateUtil.getCurrentTime()).append("agentClaimTime", DateUtil.getCurrentMs()));
//            setOP.put("$addToSet", new BasicDBObject("history", new BasicDBObject("user", agent)
//                    .append("time", DateUtil.getCurrentTime())
//                    .append("type", "claim")));
//            MongoProvider.updateOne(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, updateSessionCondition, setOP, new WriteConcern(1));
        }
        String thisClaimVersion = Math.random() + "_" + DateUtil.getCurrentMs();
        BasicDBObject updateSessionCondition2 = new BasicDBObject();
        updateSessionCondition2.put("_id", new BasicDBObject(QueryOperators.IN, sessionIds));
        updateSessionCondition2.put("account", account);
        updateSessionCondition2.put("status", "undeal");
        BasicDBObject setOP = new BasicDBObject();
        setOP.put("$set", new BasicDBObject("user", agent)
                .append("status", "deal").append("type", "webchat").append("lastClaimTime", DateUtil.getCurrentMs())
                .append("autoClaimVersion", thisClaimVersion).append("beginTime", DateUtil.getCurrentTime()).append("agentClaimTime", DateUtil.getCurrentMs()).append("startCustomerWaitTimeStamp", DateUtil.getCurrentMs()));
        setOP.put("$addToSet", new BasicDBObject("history", new BasicDBObject("user", agent)
                .append("time", DateUtil.getCurrentTime())
                .append("type", "claim")));

        UpdateResult result = MongoProvider.updateMulti(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, updateSessionCondition2, setOP, new WriteConcern(1));

        if(result != null){
            //实际满足条件被更新的并没有这么多,则要减去该座席里redis的值
            if(result.getModifiedCount() < sessionIds.size()){
                int decr = sessionIds.size() - (int)result.getModifiedCount();
                Pipeline pip = redis.pipelined();
                pip.decrBy(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + agent, decr);
                pip.decrBy(RedisKeyConstant.AGENT_IM_DEALED_COUNT + agent, decr);
                redis.safeSync();
            }
        }

        //TODO 通知业务线程来处理后续的业务操作

        PushVO pushVO = new PushVO(agent, sessionIds, account, peerId, memorySeconds);
        PushQueue.add(pushVO);
        return surplusList;
    }

    /**
     * 最少策略,给处理最少的进行一个排序
     *
     * @param clients
     * @param resultList
     */
    private int sortAgentsWithMinimumStrategy(Map<String,BasicDBObject> clients, List<BasicDBObject> resultList, boolean memory) {
        if(clients.size() == 0){
            return -1;
        }
        int pValue = 0;
        int minimumNum = -1; ///计算所有座席还能够接入的会话数总和
        List<BasicDBObject> matchAgents = new ArrayList<BasicDBObject>();
        for (Map.Entry<String, BasicDBObject> entry : clients.entrySet()) {
            BasicDBObject onlineAgent = entry.getValue();
            BasicDBObject user = (BasicDBObject) onlineAgent.get("user");
            String redisResult = redis.get(
                    RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"));
            int currImDealNum = 0;

            //只要获取失败,则直接采用随机策略
            if (redisResult != null && redisResult.equals(RedisKeyConstant.REDIS_FAIL)) {
        		List<DBObject> list = new ArrayList<>();
        		list.add(new BasicDBObject("user", onlineAgent.get("_id")));
        		list.add(new BasicDBObject("invitedUser", onlineAgent.get("_id")).append("inviteUserStatus", "accept"));
        		currImDealNum = (int) MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
                        new BasicDBObject(new BasicDBObject("$or",list)).append("status", "deal"));
                redis.set(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"), String.valueOf(currImDealNum));
            } else {
                if (redisResult != null) {
                    currImDealNum = Integer.parseInt(redisResult);
                }
            }


            int maxImDealCount = 0;
            if (user.get("imDealCount") != null) {
                maxImDealCount = Integer.parseInt(user.get("imDealCount").toString());
            }
            if (currImDealNum < maxImDealCount) {
                int dealImNum = 0;
                String dealed = redis.get(RedisKeyConstant.AGENT_IM_DEALED_COUNT + onlineAgent.get("_id"));
                if (dealed != null && !dealed.equals(RedisKeyConstant.REDIS_FAIL)) {
                    dealImNum = Integer.parseInt(dealed);
                }
                if (minimumNum == -1 || dealImNum < minimumNum) {
                    minimumNum = dealImNum;
                }
                onlineAgent.put("dealImNum", dealImNum);
                matchAgents.add(onlineAgent);
            }
        }
        for(int i=0; i<matchAgents.size(); i++){
            BasicDBObject onlineAgent = matchAgents.get(i);
            int dealImNum = matchAgents.get(i).get("dealImNum") == null ? 0 : Integer.parseInt(matchAgents.get(i).get("dealImNum").toString());
            if(dealImNum == minimumNum){
                resultList.add(onlineAgent);
            }
        }
        if(memory){
            BasicDBObject agent = resultList.get(0);
            if(resultList.size() > 0){
                resultList.clear();
                resultList.add(agent);
            }

        }
        return 1;
    }

    /**
     * 获取策略为优先级时,每次可以给座席分配的最大数量
     *
     * @param clients
     */
    private int getResultAgentsWithPriority(Map<String,BasicDBObject> clients, List<BasicDBObject> resultList,
                                            int pValue, long taskCount, String peerId, boolean memory) {
        List<BasicDBObject> matchAgents = new ArrayList<BasicDBObject>();
        int highP = Integer.MAX_VALUE;
        for (Map.Entry<String, BasicDBObject> entry : clients.entrySet()) {
            BasicDBObject onlineAgent = entry.getValue();
            BasicDBObject user = (BasicDBObject) onlineAgent.get("user");
            String redisResult = redis.get(
                    RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"));
            int currImDealNum = 0;

            //只要获取失败,则直接采用随机策略
            if (redisResult != null && redisResult.equals(RedisKeyConstant.REDIS_FAIL)) {
                currImDealNum = (int) MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
                        new BasicDBObject("user", onlineAgent.get("_id")).append("status", "deal"));
              redis.set(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"), String.valueOf(currImDealNum));
            } else {
                if (redisResult != null) {
                    currImDealNum = Integer.parseInt(redisResult);
                }
            }


            int maxImDealCount = 0;
            if (user.get("imDealCount") != null) {
                maxImDealCount = Integer.parseInt(user.get("imDealCount").toString());
            }
            if (currImDealNum < maxImDealCount) {
                onlineAgent.put("spareCount", maxImDealCount-currImDealNum);
                String agent = (String) onlineAgent.get("_id");
                int priority = 0;
                if (onlineAgent.get("priority") != null) {
                    priority = Integer.parseInt(onlineAgent.get("priority").toString());
                }
                if (priority < highP) {
                    highP = priority;
                }
                matchAgents.add(onlineAgent);
            }
        }
        if(highP == Integer.MAX_VALUE){
            return -1;
        }
        int minumSpareCount = -1;
        List<BasicDBObject> tmpList = new ArrayList<BasicDBObject>();
        for (int i = 0; i < matchAgents.size(); i++) {
            BasicDBObject onlineAgent = matchAgents.get(i);
            int priority = matchAgents.get(i).get("priority") == null ? 0 : Integer.parseInt(matchAgents.get(i).get("priority").toString());
            if (priority == highP) {
                int count = Integer.parseInt(onlineAgent.get("spareCount").toString());
                if (minumSpareCount == -1 || count < minumSpareCount) {
                    minumSpareCount = count;
                }
                if (resultList.size() > 0) {
                    resultList.add(matchAgents.get(i));
                } else {
                    if (AppServiceHander.peerMap.get(peerId)!=null && AppServiceHander.peerMap.get(peerId).equals(onlineAgent.get("_id").toString())) {
                        resultList.add(matchAgents.get(i));
                    } else {
                        tmpList.add(matchAgents.get(i));
                    }
                }

            }
        }

        if (resultList.size() > 0) {
            resultList.addAll(tmpList);
            BasicDBObject tmpObj = resultList.remove(0);
            resultList.add(tmpObj);
        } else if(tmpList.size() > 0){
            resultList.addAll(tmpList);
        } else{
            pValue = -1;
            return pValue;
        }
        pValue = minumSpareCount;
        int matchAgentCounts = resultList.size();
        if (matchAgentCounts > 0) {
            int averageNum = (int) taskCount / matchAgentCounts;
            if (averageNum != 0 && averageNum < pValue) {
                pValue = averageNum;
            }
            if (averageNum == 0) {
                pValue = 1;
            }
        }
        if(memory){
            pValue = 1;
            BasicDBObject agent = resultList.get(0);
            if(resultList.size() > 0){
                resultList.clear();
                resultList.add(agent);
            }

        }
        return pValue;

    }

    /**
     * 取得策略为轮询或者随机时获取座席中的最小空闲数  (空闲数=最大能处理的数-正在处理的数)
     *
     * @param clients
     * @param pValue
     * @param taskCount @return
     */
    private int getBatchNumWithRandomOrRoundRobin(Map<String,BasicDBObject> clients, List<BasicDBObject> resultList,
                                                  int pValue, long taskCount, String peerId, String strategy, boolean memory) {
        if (clients.size() == 0) {
            return 0;
        }
        int minumSpareCount = -1; ///计算所有座席还能够接入的会话数总和
        List<BasicDBObject> tmpList = new ArrayList<BasicDBObject>();
        for (Map.Entry<String, BasicDBObject> entry : clients.entrySet()) {
            BasicDBObject onlineAgent = entry.getValue();
            BasicDBObject user = (BasicDBObject) onlineAgent.get("user");
            String redisResult = redis.get(
                    RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"));
            int currImDealNum = 0;

            //只要获取失败,则直接采用随机策略
            if (redisResult != null && redisResult.equals(RedisKeyConstant.REDIS_FAIL)) {
            	List<DBObject> list = new ArrayList<>();
        		list.add(new BasicDBObject("user", onlineAgent.get("_id")));
        		list.add(new BasicDBObject("invitedUser", onlineAgent.get("_id")).append("inviteUserStatus", "accept"));
        		currImDealNum = (int) MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
                        new BasicDBObject(new BasicDBObject("$or",list)).append("status", "deal"));
                redis.set(
                        RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT + onlineAgent.get("_id"), String.valueOf(currImDealNum));
            } else {
                if (redisResult != null) {
                    currImDealNum = Integer.parseInt(redisResult);
                }
            }

            int maxImDealCount = 0;
            if (user.get("imDealCount") != null) {
                maxImDealCount = Integer.parseInt(user.get("imDealCount").toString());
            }


            if (currImDealNum < maxImDealCount) {
                String agent = (String) onlineAgent.get("_id");
                int count = maxImDealCount - currImDealNum;
                if (minumSpareCount == -1 || count < minumSpareCount) {
                    minumSpareCount = count;
                }
                if (resultList.size() > 0) {
                    resultList.add(onlineAgent);
                } else {
                    if (AppServiceHander.peerMap.get(peerId) != null && AppServiceHander.peerMap.get(peerId).equals(agent)) {
                        resultList.add(onlineAgent);
                    } else {
                        tmpList.add(onlineAgent);
                    }
                }
            }
        }
        if (resultList.size() > 0) {
            resultList.addAll(tmpList);
            BasicDBObject tmpObj = resultList.remove(0);
            resultList.add(tmpObj);
        } else if(tmpList.size() > 0){
            resultList.addAll(tmpList);
        }else{
            pValue = -1;
            return pValue;
        }
        pValue = minumSpareCount;
        int matchAgentCounts = resultList.size();
        if (matchAgentCounts > 0) {
            int averageNum = (int) taskCount / matchAgentCounts;
            if (averageNum != 0 && averageNum < pValue) {
                pValue = averageNum;
            }
            if (averageNum == 0) {
                pValue = 1;
            }
        }
        //随机的,打乱下列表的顺序
        if (strategy.equals(RANDOM)) {
            List<BasicDBObject> tempList = new ArrayList<BasicDBObject>();
            while (resultList.size() > 0) {
                BasicDBObject agentObj = resultList.remove(((int) (Math.random() * 10)) % resultList.size());
                tempList.add(agentObj);
            }
            resultList.addAll(tempList);
        }

        if(memory){
            pValue = 1;
            BasicDBObject agent = resultList.get(0);
            if(resultList.size() > 0){
                resultList.clear();
                resultList.add(agent);
            }

        }
        return pValue;
    }



}
