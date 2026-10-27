//package com.dishui.server.assign;
//
//import com.dishui.db.mango.MongoProvider;
//import com.dishui.m7Redis.RedisAPI;
//import com.dishui.m7Redis.RedisKeyConstant;
//import com.dishui.manager.service.AppConfig;
//import com.dishui.manager.service.Utils;
//import com.dishui.server.http.AppServiceHander;
//import com.dishui.server.http.HttpProvider;
//import com.dishui.util.DateUtil;
//import com.mongodb.*;
//import com.mongodb.util.JSON;
//import org.json.JSONObject;
//
//import java.io.UnsupportedEncodingException;
//import java.net.URLEncoder;
//import java.util.*;
//import java.util.logging.Logger;
//
///**
// * Created by zengyx on 16/5/20.
// */
//public class EmailPeerAssignThread implements Runnable{
//    private static final Logger log = Logger.getLogger(EmailPeerAssignThread.class.getName());
//    private String account;
//    private String strategy; //分配策略
//    public static final String PRIORITY = "priority";
//    public static final String MINIMUN = "least";
//    public static final String ROUNDROBIN = "queue";
//    public static final String RANDOM = "random";
//    public static ArrayList<AssignTask> taskList = new ArrayList<AssignTask>();
//
//    public EmailPeerAssignThread(String account) {
//        this.account = account;
//    }
//
//    public void addTask(AssignTask assignTask){
//        synchronized (this){
//            taskList.add(assignTask);
////            if(!AppServiceHander.emailPeerMap.containsKey(assignTask.getPeerId())){
////                AppServiceHander.emailPeerMap.put(assignTask.getPeerId(), "");
////            }
//            this.notify();
//        }
//
//
//    }
//
//    @Override
//    public void run() {
//        log.info("账号"+ account +" email running=====");
//        while(true){
//            if(taskList.size() > 0){
//                long start = System.currentTimeMillis();
//                AssignTask assignTask = taskList.remove(0);
//                try {
//                    DBObject result = null;
//                    String queue = RedisAPI.StringRedis.get(RedisKeyConstant.MULTICHANNEL_SKILLGROUP+assignTask.getPeerId(), RedisKeyConstant.REDIS_DB1);
//                    if(queue == null){
//                        BasicDBObject condition = new BasicDBObject();
//                        condition.put("Exten", assignTask.getPeerId());
//                        result = MongoProvider.findOne(Constant.DB_APP_MAIL_QUEUE, condition);
//                        if(result!=null){
//                            RedisAPI.StringRedis.set(RedisKeyConstant.MULTICHANNEL_SKILLGROUP+assignTask.getPeerId(), JSON.serialize(result), RedisKeyConstant.REDIS_DB1);
//                        }
//                    }else{
//                        result = (DBObject) JSON.parse(queue);
//                    }
//                    if(result == null){
//                        continue;
//                    }
//                    BasicDBList agentIdList = (BasicDBList) result.get("AssignMembers");
//                    strategy = result.get("AssignRule") == null ? RANDOM : result.get("AssignRule").toString();
//                    System.out.println("strategy======"+strategy);
//                    List<String> agentIds = new ArrayList<String>();
//                    List<Map<String, Object>> agents = new ArrayList<Map<String, Object>>(); //存技能组里的结构
//                    List<DBObject> clients = new ArrayList<DBObject>();
//                    if (agentIdList != null) {
//                        boolean getFromRedis = true;
//                        for (int i = 0; i < agentIdList.size(); i++) {
//                            Map<String, Object> agentMap = (Map<String, Object>) agentIdList.get(i);
//                            String agentId = (String) agentMap.get("agentID");
//                            agentIds.add(agentId);
//                            agents.add(agentMap);
//
//                        }
//                        for(int i=0; i< agentIds.size(); i++){
//                            String agentId = agentIds.get(i);
//                            String client = RedisAPI.StringRedis.get(RedisKeyConstant.ONLINE_AGENT_INFO+agentId, RedisKeyConstant.REDIS_DB1);
//                            if(client!= null && client.equals(RedisKeyConstant.REDIS_FAIL)){
//                                getFromRedis = false;
//                                break;
//                            }
//                            if(client != null){
//                                DBObject clientObj = (DBObject) JSON.parse(client);
//                                if(clientObj.get("emailStatus") == null || clientObj.get("emailStatus").toString().equals("open")){
//                                    clients.add(clientObj);
//                                }
//
//                            }
//                        }
//
//                        if(!getFromRedis){
//                            BasicDBObject pushCondition = new BasicDBObject();
//                            pushCondition.put("emailStatus", new BasicDBObject(QueryOperators.NE, "close"));
//                            pushCondition.put("_id", new BasicDBObject(QueryOperators.IN, agentIds));
//                            clients = MongoProvider.find(Constant.DB_APP_PUSH_CLIENT, pushCondition);
//                        }
//
//                    }
//
//                    if (agentIds.size() > 0) {
//                        List<String> matchAgents = new ArrayList<String>(); //存push_client里的结构
//                        List<Map<String, Object>> resultAgents = new ArrayList<Map<String, Object>>();
//                        int minimumNum = -1;
//                        String minimumAgent = "";
//                        if (clients != null && clients.size()>0) {
//                            for (int i = 0; i < clients.size(); i++) {
//                                DBObject onlineAgent = clients.get(i);
//                                DBObject user = (DBObject) onlineAgent.get("user");
//                                String redisResult = RedisAPI.StringRedis.get(
//                                        RedisKeyConstant.AGENT_CURR_EMAIL_COUNT+onlineAgent.get("_id"), RedisKeyConstant.REDIS_DB1);
//                                int currImDealNum = 0;
//
//                                //只要获取失败,则直接采用随机策略
//                                if(redisResult!= null && redisResult.equals(RedisKeyConstant.REDIS_FAIL)){
//                                    currImDealNum = (int) MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION,
//                                            new BasicDBObject("user", onlineAgent.get("_Id")).append("status", "deal"));
//                                    strategy = RANDOM;
//                                }else{
//                                    if(redisResult !=null){
//                                        currImDealNum = Integer.parseInt(redisResult);
//                                    }
//                                }
//
//                                int dealImNum = 0;
//                                String dealed = RedisAPI.StringRedis.get(RedisKeyConstant.AGENT_EMAIL_DEAL_COUNT+ onlineAgent.get("_id"),  RedisKeyConstant.REDIS_DB1);
//                                if (dealed!= null && !dealed.equals(RedisKeyConstant.REDIS_FAIL)) {
//                                    dealImNum = Integer.parseInt(dealed);
//                                }
//                                int maxImDealCount = 0;
//                                if (user.get("maxEmailDealCount") != null) {
//                                    maxImDealCount = Integer.parseInt(user.get("maxEmailDealCount").toString());
//                                }
//
//                                if (currImDealNum < maxImDealCount) {
//                                    String agent = (String) onlineAgent.get("_id");
//                                    if (minimumNum == -1 || dealImNum < minimumNum) {
//                                        minimumNum = dealImNum;
//                                        minimumAgent = agent;
//                                    }
//                                    matchAgents.add(agent);
//                                }
//                            }
//                            String agent = "";
//
//                            //最少的获取
//                            if (strategy.equals(MINIMUN)) {
//                                try {
//                                    if (minimumAgent != null && !minimumAgent.equals("")) {
//                                        processAssignSuccess(assignTask, minimumAgent);
//                                    }else{
//                                        log.warning("分配座席失败 没有获取到符合条件的座席");
//                                    }
//
//                                } catch (Exception e) {
//
//                                }
//                                notifyAgent(assignTask, clients);
//                                continue;
//                            }
//
//                            if (matchAgents.size() > 0) {
//                                for (int i = 0; i < agentIds.size(); i++) {
//                                    for (int j = 0; j < matchAgents.size(); j++) {
//                                        if (agentIds.get(i).equals(matchAgents.get(j))) {
//                                            resultAgents.add(agents.get(i));
//                                            matchAgents.remove(j);
//                                            break;
//                                        }
//                                    }
//                                }
//
//                            }
//                            if (resultAgents.size() <= 0) {
//                                notifyAgent(assignTask, clients);
//                                continue;
//                            }
//
//                            String currAgent = AppServiceHander.peerMap.get(new String(assignTask.getPeerId()));
//
//                            //轮询算法
//                            if (strategy.equals(ROUNDROBIN)) {
//                                agent = getAgentByRound(currAgent, resultAgents);
//                                AppServiceHander.peerMap.remove(assignTask.getPeerId());
//                                AppServiceHander.peerMap.put(assignTask.getPeerId(), agent);
//                            }
//                            //优先级算法
//                            else if (strategy.equals(PRIORITY)) {
//                                int highP = Integer.MAX_VALUE;
//                                for (int i = 0; i < resultAgents.size(); i++) {
//                                    int priority = resultAgents.get(i).get("penalty") == null ? 0 : Integer.parseInt(resultAgents.get(i).get("penalty").toString());
//                                    if (priority < highP) {
//                                        highP = priority;
//                                    }
//                                }
//                                List<Map<String, Object>> matchList = new ArrayList<Map<String, Object>>();
//                                for (int i = 0; i < resultAgents.size(); i++) {
//                                    int priority = resultAgents.get(i).get("penalty") == null ? 0 : Integer.parseInt(resultAgents.get(i).get("penalty").toString());
//                                    if (priority == highP) {
//                                        matchList.add(resultAgents.get(i));
//                                    }
//                                }
//
//                                agent = getAgentByRound(currAgent, matchList);
//
//                            }
//                            //随机算法
//                            else if(strategy.equals(RANDOM)){
//                                int randomNum = (int) Math.floor(Math.random()* resultAgents.size());
//                                agent = resultAgents.get(randomNum).get("agentID").toString();
//                            }
//
//                            if (agent != null && !agent.equals("")) {
//                                boolean flag = processAssignSuccess(assignTask, agent);
//                                if(flag){
//                                    if(strategy.equals(ROUNDROBIN) || strategy.equals(PRIORITY)){
//                                        AppServiceHander.peerMap.remove(assignTask.getPeerId());
//                                        AppServiceHander.peerMap.put(assignTask.getPeerId(), agent);
//                                    }
//
//                                }
//                                notifyAgent(assignTask, clients);
//
//                                System.out.println("========================"+(System.currentTimeMillis() -start));
//                            }else{
//                                notifyAgent(assignTask, clients);
//                            }
//                        } else {
//                            log.warning("not found online agent");
//                        }
//
//                    } else {
//                        log.warning("not found agent");
//
//                    }
//
//                } catch (Exception e) {
//                    e.printStackTrace();
//                }
//            }else{
//                synchronized (this){
//                    try {
//                        this.wait();
//                    } catch (InterruptedException e) {
//
//                        e.printStackTrace();
//                    }
//                }
//            }
//
//
//        }
//
//    }
//
//    /**
//     * 分配座席成功时的处理
//     * @param assignTask
//     * @param agent
//     */
//    private boolean processAssignSuccess(AssignTask assignTask, String agent) {
//        //分配成功的操作
//        assignTask.setAgent(agent);
////        DBObject condition1 = new BasicDBObject();
////        condition1.put("_id", agent);
////        DBObject inc = new BasicDBObject();
////        inc.put("$inc", new BasicDBObject("currImDealCount", 1));
////        WriteConcern concern = new WriteConcern(1);
////        MongoProvider.updateOne("app_push_client", condition1, inc, concern);
//
//
//
//        String thisClaimVersion = Math.random() + "_" + DateUtil.getCurrentMs();
//        DBObject updateSessionCondition = new BasicDBObject();
//        updateSessionCondition.put("_id", assignTask.getSessionId());
//        updateSessionCondition.put("autoClaimVersion", assignTask.getSessionVersion());
//        DBObject setOP = new BasicDBObject();
//        setOP.put("$set", new BasicDBObject("user", agent)
//                .append("status", "deal").append("type", "email").append("lastClaimTime", DateUtil.getCurrentMs())
//                .append("autoClaimVersion", thisClaimVersion).append("beginTime", DateUtil.getCurrentTime()).append("agentClaimTime", DateUtil.getCurrentMs()));
//        setOP.put("$addToSet", new BasicDBObject("history", new BasicDBObject("user", agent)
//                .append("time", DateUtil.getCurrentTime())
//                .append("type", "claim")));
//
//        MongoProvider.updateOne(Constant.APP_EMAIL_CHANNEL_SESSION, updateSessionCondition, setOP, new WriteConcern(1));
//
//        DBObject updatedSessionCondition = new BasicDBObject();
//        updatedSessionCondition.put("_id", assignTask.getSessionId());
//        updatedSessionCondition.put("autoClaimVersion", thisClaimVersion);
//
//        DBObject session = MongoProvider.findOne(Constant.APP_EMAIL_CHANNEL_SESSION, updatedSessionCondition);
//
//        //确保这个session没有被其它座席领取走
//        if(session != null){
//            assignTask.setSid(session.get("sid").toString());
//            //推送给座席
//            RedisAPI.StringRedis.incr(RedisKeyConstant.AGENT_CURR_IM_DEAL_COUNT+ assignTask.getAgent(), 1, RedisKeyConstant.REDIS_DB1);
//            RedisAPI.StringRedis.incr(RedisKeyConstant.AGENT_IM_DEALED_COUNT+ assignTask.getAgent(), 1, RedisKeyConstant.REDIS_DB1);
//            DBObject findCondition = new BasicDBObject();
//            findCondition.put("account", assignTask.getAccount());
//            findCondition.put("product", "cc");
//            DBObject accountProduct = MongoProvider.findOne("bill", Constant.DB_PLATFORM_ACCOUNT_PRODUCT, findCondition);
//            DBObject relationCon = new BasicDBObject();
//            relationCon.put("sid", session.get("sid"));
//            relationCon.put("status", new BasicDBObject(QueryOperators.NE, "delete"));
//            DBObject relateObj = MongoProvider.findOne(Constant.DB_APP_IM_CUSTOMER_RELATION,relationCon);
//            DBObject customer = null;
//            if(relateObj!=null){
//                customer = MongoProvider.findOne(accountProduct.get("dataDB").toString(), assignTask.getAccount()+ Constant.DB_C5_CUSTOMER, new BasicDBObject("_id", relateObj.get("customerId")));
//
//            }
//            pushToAgent(assignTask, session, customer);
//            notifyGateway(assignTask);
//            //报表统计
//            emitReport(assignTask, session);
//
//            MongoProvider.updateOne(accountProduct.get("dataDB").toString(), assignTask.getAccount() + "_history",
//                    new BasicDBObject("_id", assignTask.getSessionId()), new BasicDBObject("agent", agent)
//                            .append("lastUpdateTime", DateUtil.getCurrentTime())
//                            .append("sid", assignTask.getSid())
//                            .append("_id", assignTask.getSessionId())
//                            .append("type","chat")
//                            .append("status","chating")
//                            .append("platform", session.get("platform"))
//                            .append("createTime", DateUtil.getCurrentTime())
//                            .append("customer", customer.get("_id"))
//                            .append("beginTime", DateUtil.getCurrentTime()), new WriteConcern(0));
//            return true;
//        }else{
//            log.warning("该会话已被其它座席领取了");
//            return false;
//        }
//
//    }
//
//    /**
//     * 报表事件
//     */
//    private void emitReport(AssignTask task, DBObject session){
//        //座席接入会话数
//
//        DBObject reportData = new BasicDBObject();
//        reportData.put("reportTime", DateUtil.getCurrentTime());
//        reportData.put("type", "accessSession");
//        reportData.put("account", task.getAccount());
//        DBObject subData = new BasicDBObject();
//        subData.put("agentId", task.getAgent());
//        subData.put("accessSessionCount", 1);
//        subData.put("accessId", session.get("accessId"));
//        subData.put("platform", session.get("platform"));
//        subData.put("toPeer", session.get("toPeer"));
//        subData.put("sessionId", session.get("_id"));
//        reportData.put("businessData", subData);
//        reportData.put("_id", Utils.getUniqueid());
//        reportData.put("reportStatus", "ready");
//
//        System.out.println(reportData.toString());
//        MongoProvider.insertByReportDb(Constant.DB_APP_REPORT_EVENT, reportData);
//
//    }
//
//    /**
//     * 通知gateway下发通知
//     */
//    private void notifyGateway(AssignTask task){
////        var notifyVo = {
////                sid: data.sid,
////                type: 'webchat',
////                operation: data.operation, //值可以为 claim(领取)  redirect(转接)  finish(完结)
////                user: data.userId,
////                queueNum: data.queueNum || 0
////        };
//
//        HashMap<String, Object> notifyVo = new HashMap<String, Object>();
//        notifyVo.put("sid", task.getSid());
//        notifyVo.put("type", "webchat");
//        notifyVo.put("operation", "claim");
//        notifyVo.put("user", task.getAgent());
//
//        String url = AppConfig.getInstance().getVar("multi_channel_dispatcher_url");
//        System.out.println(url);
//        String dataStr = new JSONObject(notifyVo).toString();
//        log.info("["+url+"]notifyDispatherServer :"+dataStr);
//        String data = "data=" + dataStr;
//        try {
//            HttpProvider.sendPost(url, data.getBytes("UTF-8"));
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//
//    }
//
//
//    /**
//     * 将待处理的数目推送给各个座席
//     * @param assignTask
//     */
//    private void notifyAgent(AssignTask assignTask, List<DBObject> clients) {
//
//        for(int i=0; i<clients.size(); i++){
//            DBObject agent = clients.get(i);
//            HashMap<String, Object> condition = new HashMap<String, Object>();
//            condition.put("account", assignTask.getAccount());
//            condition.put("agentId", agent.get("_id").toString());
//            Object[] peers = getAgentPeers(condition);
//            condition.put("toPeer", new BasicDBObject("$in", peers));
//            long undealNum = getUndealNum(condition);
//            pushUndealNumToAgent(agent, undealNum);
//        }
//
//    }
//
//    /**
//     * 推送待领取的数量给技能组下的所有座席
//     */
//    private void pushUndealNumToAgent(DBObject onlineAgent, long undealNum) {
//        DBObject user = (DBObject) onlineAgent.get("user");
//        try {
//            Hashtable<String, Object> dataMap = new Hashtable<String, Object>();
//            dataMap.put("undealNum", undealNum);
//            dataMap.put("type", "refreshUndealNum");
//            Hashtable<String, Object> subMap = new Hashtable<String, Object>();
//            subMap.put("Account", user.get("account"));
//            subMap.put("Event", "NewNotify");
//            subMap.put("Data", dataMap);
//
//            Hashtable<String, Object> map = new Hashtable<String, Object>();
//            map.put("userId", onlineAgent.get("_id"));
//            map.put("eventData", subMap);
//            String url = "http://"+onlineAgent.get("pushServerIp").toString()+":"+ onlineAgent.get("pushServerPort").toString() +"/push?msg="+ URLEncoder.encode(JSON.serialize(map),"UTF-8");
//            log.info("push msg to pushServer:"+url);
//            String result = HttpProvider.sendGet(url);
//
//        } catch (UnsupportedEncodingException e) {
//            e.printStackTrace();
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
//
//
//    private Object[] getAgentPeers(HashMap<String, Object> condition){
//        DBObject dbObject = new BasicDBObject();
//        dbObject.put("Account", condition.get("account"));
//        dbObject.put("AssignMembers.agentID", condition.get("agentId"));
//        List<DBObject> result = MongoProvider.find(Constant.DB_APP_MAIL_QUEUE, dbObject);
//        List<String> peers = new ArrayList<String>();
//        for(int i=0; i<result.size(); i++){
//            peers.add(result.get(i).get("Exten").toString());
//        }
//        return peers.toArray();
//    }
//
//    private long getUndealNum(HashMap<String, Object> condition){
//        DBObject dbObject = new BasicDBObject();
//        dbObject.put("account", condition.get("account"));
//        dbObject.put("toPeer", condition.get("toPeer"));
//        dbObject.put("status", "undeal");
//        long count =  MongoProvider.count(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, dbObject);
//        return count;
//    }
//
//    /**
//     * 将消息推送给座席
//     * @param assignTask
//     * @param session
//     * @param customer
//     */
//    private void pushToAgent(AssignTask assignTask, DBObject session, DBObject customer) {
//        DBObject pushClient = null;
//        long getRedisTime = System.currentTimeMillis();
//        String agent = RedisAPI.StringRedis.get(RedisKeyConstant.ONLINE_AGENT_INFO+assignTask.getAgent(), RedisKeyConstant.REDIS_DB1);
//        System.out.println("get from redis:"+ (System.currentTimeMillis() - getRedisTime));
//        if(agent!= null){
//            pushClient = (DBObject) JSON.parse(agent);
//        }
//
//        if(pushClient != null){
//            try {
//                DBObject jsonObject = (DBObject) JSON.parse(assignTask.getData());
////                DBObject relationCon = new BasicDBObject();
////                relationCon.put("sid", jsonObject.get("Sid"));
////                relationCon.put("status", new BasicDBObject(QueryOperators.NE, "delete"));
////                DBObject relateObj = MongoProvider.findOne(Constant.DB_APP_IM_CUSTOMER_RELATION,relationCon);
////                if(relateObj!=null){
////                    DBObject customer = MongoProvider.findOne(accountDB.get("dataDB").toString(), assignTask.getAccount()+ Constant.DB_C5_CUSTOMER, new BasicDBObject("_id", relateObj.get("customerId")));
//                if(customer != null){
//                    jsonObject.put("sourceName", session.get("sName"));
//                    jsonObject.put("sName", customer.get("name"));
//                    jsonObject.put("custId", customer.get("_id"));
//                    jsonObject.put("custName", customer.get("name"));
//                    jsonObject.put("showCustomerName", true);
//
//                }
//
////                }
//                Hashtable<String, Object> subMap = new Hashtable<String, Object>();
//                subMap.put("Account", assignTask.getAccount());
//                subMap.put("Event", "NewWebchat");
//                subMap.put("Data", jsonObject);
//                subMap.put("Foryou", true);
//                subMap.put("assign", true);
//                Hashtable<String, Object> map = new Hashtable<String, Object>();
//                map.put("userId", assignTask.getAgent());
//                map.put("eventData", subMap);
//                String url = "http://"+pushClient.get("pushServerIp").toString()+":"+ pushClient.get("pushServerPort").toString() +"/push?msg="+ URLEncoder.encode(JSON.serialize(map),"UTF-8");
//                log.info("push msg to pushServer:"+url);
//                String result = HttpProvider.sendGet(url);
//
//            } catch (UnsupportedEncodingException e) {
//                e.printStackTrace();
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//        }else{
//            log.warning("not found online agent");
//        }
//    }
//
//
//
//    /**
//     * 轮询获取座席
//     *
//     * @return
//     */
//    private String getAgentByRound(String currAgent, List<Map<String, Object>> matchList) {
//        int index = -1;
//        for (int i = 0; i < matchList.size(); i++) {
//            if (matchList.get(i).get("agentID").equals(currAgent)) {
//                index = i;
//                break;
//            }
//        }
//
//        index = (index + 1) % matchList.size();
//        String agent = (String) matchList.get(index).get("agentID");
//        return agent;
//    }
//}
