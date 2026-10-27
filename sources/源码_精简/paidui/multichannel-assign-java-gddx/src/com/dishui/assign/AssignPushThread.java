package com.dishui.assign;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

import org.json.JSONException;
import org.json.JSONObject;

import redis.clients.jedis.Pipeline;

import com.dishui.db.mango.MongoProvider;
import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.model.Constant;
import com.dishui.model.PushQueue;
import com.dishui.model.PushVO;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.QueryOperators;
import com.mongodb.WriteConcern;
import com.mongodb.client.model.InsertOneModel;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.util.JSON;

/**
 * Created by zengyx on 16/8/16.
 */
public class AssignPushThread implements Runnable{
    private static final Logger log = Logger.getLogger(AssignPushThread.class.getName());

    private RedisAPI redis = new RedisAPI(RedisConnection.getRedisPool(), RedisKeyConstant.REDIS_DB1);

    public static void start(int threadNum){
        while(threadNum > 0){
            log.info("thread-push-" + threadNum +" start...");
            new Thread(new AssignPushThread(), "thread-push-"+threadNum).start();
            threadNum-- ;
        }
    }

    @Override
    public void run() {
        while(true){
            try{
                if(PushQueue.size()<=0){
                    synchronized (PushQueue.pushQueue){
                        PushQueue.pushQueue.wait();
                    }

                }
                PushVO pushVO = PushQueue.poll();
                if(pushVO == null){
                    continue;
                }
                long start = System.currentTimeMillis();
                processPush(pushVO);
            }catch (Exception e){
                log.warning("push error-----");
                e.printStackTrace();
            }
        }

    }

    /**
     * 更新历史记录
     * 推送给座席
     * 推送给访客端
     * 报表
     * @param pushVO
     */
    private void processPush(PushVO pushVO) {
        if (Constant.PUSHVOTYPE_VIPASSIGNFAILED.equals(pushVO.getPushVoType())) {
            processvipAssignFailedPush(pushVO);
        } else {  
	        long start = System.currentTimeMillis();
	        String agent = pushVO.getAgent();
	        String account = pushVO.getAccount();
	        Set<String> sessionIds = pushVO.getSessionIds();
	        BasicDBObject updateSessionCondition2 = new BasicDBObject();
	        updateSessionCondition2.put("_id", new BasicDBObject(QueryOperators.IN, sessionIds));
	        updateSessionCondition2.put("account", account);
	        updateSessionCondition2.put("user", agent);
	        updateSessionCondition2.put("status", "deal");
	
	        List<BasicDBObject> sessions = MongoProvider.find(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, updateSessionCondition2);
	        Set<String> uids = new HashSet<String>();
	        Pipeline pip = redis.pipelined();
	        for (int i = 0; i < sessions.size(); i++) {
	            String uid = sessions.get(i).get("sid").toString();
	            uids.add(uid);
	            if(pushVO.getMemorySeconds()>0){
	                pip.setex(RedisKeyConstant.IM_ASSIGN_MEMORY+uid, pushVO.getMemorySeconds(), agent);
	            }
	        }
	        redis.safeSync();
	
	        List<BasicDBObject> relateObj = getCustomerRelations(uids, account);
	
	        BasicDBObject findCondition = new BasicDBObject();
	        findCondition.put("account", account);
	        findCondition.put("product", "cc");
	        BasicDBObject accountProduct = MongoProvider.findOne("bill", Constant.DB_PLATFORM_ACCOUNT_PRODUCT, findCondition);
	
	        List<BasicDBObject> customers = null;
	        HashMap<String, BasicDBObject> customerRelations = getRelateCustomerInfos(account, relateObj, accountProduct, customers);
	
	        List<UpdateOneModel> updateOps = new ArrayList<UpdateOneModel>();
	        Map<String, List> accessIdMap = new HashMap<String, List>();
	
	        //对session数据的封装,以及数据提取
	        for (int i = 0; i < sessions.size(); i++) {
	            BasicDBObject session = sessions.get(i);
	
	            getSidsToPushWelcomeMsg(accessIdMap, session);
	
	            getUpdateHistoryOps(agent, customerRelations, updateOps, session);
	
	            processSessionFields(session);
	
	        }
	
	        if (sessions != null && sessions.size() > 0) {
	
	            //推送给座席
	            pushToAgent(agent, sessions, account);
	            log.info("========================push6:"+(System.currentTimeMillis() - start));
	
	            //批量推送给gateway
	            notifyGateway(agent, uids);
	
	            //报表统计
	            emitReport(agent, sessions, account);
	
	            //领取后推送欢迎语
	            pushWelcomeMsg(accessIdMap);
	        }
	
	        if(updateOps.size()>0){
	            MongoProvider.bulkWrite(accountProduct.get("dataDB").toString(), account + "_history", updateOps, new WriteConcern(0));
	        }
	
	        log.info("========================push5:"+(System.currentTimeMillis() - start));
        }

    }

    /**
     * 专属坐席分配失败给访客发送消息
     * 
     * @param pushVO
     */
    private void processvipAssignFailedPush(PushVO pushVO) {
        long start = System.currentTimeMillis();
        pushVO.getAccount();
        Set<String> sessionIds = pushVO.getSessionIds();
        //获取sid，发送
        for (Iterator iterator = sessionIds.iterator(); iterator.hasNext();) {
            String sessionId = (String) iterator.next();
            String _id = sessionId.split(",",-1)[0];
            String sid = sessionId.split(",",-1)[1];
            String vipAgentId = sessionId.split(",",-1)[2];
            
            pushVipAssignFail(sid,vipAgentId);
            
            BasicDBObject find = new BasicDBObject();
            find.put("_id",_id);
            find.put("account", pushVO.getAccount());
            find.put("status", "undeal");
            BasicDBObject setOP = new BasicDBObject();
            setOP.put("$set", new BasicDBObject("isVipAssignDealing", true));
            MongoProvider.updateMulti(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, find, setOP, new WriteConcern(1));
            
        }
        log.info("========================push7:"
                + (System.currentTimeMillis() - start));
    }
    private void pushVipAssignFail(String  sid,String vipAgentId) {
        //给gateway发送消息
        HashMap<String, Object> notifyVo = new HashMap<String, Object>();
        notifyVo.put("sid", sid);
        notifyVo.put("type", "webchat");
        notifyVo.put("operation", "vipAssignFail");
        notifyVo.put("user", vipAgentId);
        String url = AppConfig.getInstance().getVar(
                "multi_channel_dispatcher_url");
        String dataStr = new JSONObject(notifyVo).toString();
        String data = "data=" + dataStr;
        try {
            HttpProvider.sendPost(url + "/status", data.getBytes("UTF-8"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }  


    
    
    /**
     * 获取关联客户的详细信息
     * @param account
     * @param relateObj
     * @param accountProduct
     * @param customers
     * @return
     */
    private HashMap<String, BasicDBObject> getRelateCustomerInfos(String account, List<BasicDBObject> relateObj, BasicDBObject accountProduct, List<BasicDBObject> customers) {
        if (relateObj != null) {
            List<String> customerIds = new ArrayList<String>();
            for(int i=0; i<relateObj.size(); i++){
                customerIds.add(relateObj.get(i).get("customerId").toString());
            }
            if(customerIds.size() > 0){
                customers = MongoProvider.find(accountProduct.get("dataDB").toString(), account + Constant.DB_C5_CUSTOMER, new BasicDBObject("_id", new BasicDBObject(QueryOperators.IN, customerIds)));
            }
        }
        HashMap<String, BasicDBObject> customerRelations = new HashMap<String, BasicDBObject>();

        if (customers != null) {
            for (int i = 0; i < customers.size(); i++) {
                for (int j = 0; j < relateObj.size(); j++) {
                    if (customers.get(i).get("_id").toString().equals(relateObj.get(j).get("customerId").toString())) {
                        customerRelations.put(relateObj.get(j).get("sid").toString(), customers.get(i));
                    }
                }
            }
        }
        return customerRelations;
    }

    /**
     * 获取sid关联的客户id
     * @param uids
     * @param account
     * @return
     */
    private List<BasicDBObject> getCustomerRelations(Set<String> uids, String account) {
        BasicDBObject relationCon = new BasicDBObject();
        relationCon.put("sid", new BasicDBObject(QueryOperators.IN,uids));
        relationCon.put("account", account);
        relationCon.put("status", new BasicDBObject(QueryOperators.NE, "delete"));
        return MongoProvider.find(Constant.DB_APP_IM_CUSTOMER_RELATION, relationCon);
    }

    /**
     * 对session的字段进行处理
     * @param session
     */
    private void processSessionFields(BasicDBObject session) {
        session.removeField("history");
        session.removeField("seoKeywords");
        session.removeField("seoSource");
        session.removeField("area");
        session.removeField("msgCount");
        session.removeField("agentClaimTime");
        session.removeField("manualTime");
        session.removeField("serviceMan");
        session.removeField("autoClaimVersion");
        session.removeField("ip");

        session.put("Content", "用户新接入");//固定字段
        session.put("MsgType", "newMsg");//固定字段
        long lastAgentMsgTimeStamp = 0l;
        long lastCustomerMsgTimeStamp = 0l;
        if(session.get("lastAgentMsgTimeStamp") != null){
            String time = session.get("lastAgentMsgTimeStamp").toString();
            BigDecimal bigDecimal = new BigDecimal(time);
            lastAgentMsgTimeStamp = Long.parseLong(bigDecimal.toPlainString());
        }
        if(session.get("lastCustomerMsgTimeStamp") != null){
            String time = session.get("lastCustomerMsgTimeStamp").toString();
            BigDecimal bigDecimal = new BigDecimal(time);
            lastCustomerMsgTimeStamp = Long.parseLong(bigDecimal.toPlainString());
        }
        if(session.get("leavemsg") != null || lastAgentMsgTimeStamp > lastCustomerMsgTimeStamp){
            session.put("startWaitTimer", -1);
        }else{
            session.put("startWaitTimer", 0);
        }
    }

    /**
     * 封装联系历史的数据库更新命令,集中处理
     * @param agent
     * @param customerRelations
     * @param updateOps
     * @param session
     */
    private void getUpdateHistoryOps(String agent, HashMap<String, BasicDBObject> customerRelations, List<UpdateOneModel> updateOps, BasicDBObject session) {
        BasicDBObject customer = customerRelations.get(session.get("sid").toString());
        String customerId = null;
        if (customer != null) {
            customerId = customer.get("_id").toString();
            session.put("sourceName", session.get("sName"));
            session.put("sName", customer.get("name"));
            session.put("custId", customer.get("_id"));
            session.put("custName", customer.get("name"));
            session.put("showCustomerName", true);
        }

        BasicDBObject filter = new BasicDBObject();
        filter.append("_id", session.get("_id"));
        BasicDBObject setOp = new BasicDBObject("$set",new BasicDBObject("agent", agent)
                .append("lastUpdateTime", DateUtil.getCurrentTime())
                .append("sid", session.get("sid").toString())
                .append("_id", session.get("_id").toString())
                .append("type", "chat")
                .append("status", "chating")
                .append("platform", session.get("platform"))
                .append("createTime", DateUtil.getCurrentTime())
                .append("customer", customerId)
                .append("beginTime", DateUtil.getCurrentTime()));
        UpdateOptions updateOptions = new UpdateOptions();
        updateOptions.upsert(false);
        UpdateOneModel<BasicDBObject> updateOneModel = new UpdateOneModel<BasicDBObject>(filter, setOp, updateOptions);
        updateOps.add(updateOneModel);
    }

    /**
     * 获取需要推送欢迎语的粉丝id
     * @param accessIdMap
     * @param session
     */
    private void getSidsToPushWelcomeMsg(Map<String, List> accessIdMap, BasicDBObject session) {

        //转技能组的不在推送 session.get("fromUser") == null
        if(session.get("platform") != null && session.get("platform").toString().equals("weixin") && session.get("fromUser") == null){
            if(accessIdMap.containsKey(session.get("accessId").toString())){
                List<String> sids = accessIdMap.get(session.get("accessId").toString());

                sids.add(session.get("sid").toString());

            }else{
                List<String> sids = new ArrayList<String>();
                sids.add(session.get("sid").toString()+","+session.get("_id").toString());
                accessIdMap.put(session.get("accessId").toString(), sids);
            }
        }
    }

    /**
     * 领取后推送欢迎语
     * @param accessIdMap
     */
    private void pushWelcomeMsg(Map<String, List> accessIdMap) {
        List<String> accessIds = new ArrayList<String>();
        for(Map.Entry<String, List> entry: accessIdMap.entrySet()){
            String accessId = entry.getKey();
            accessIds.add(accessId);
        }
        List<BasicDBObject> wxConfigs = MongoProvider.find(Constant.DB_WEIXIN,Constant.DB_WXACCOUNT, new BasicDBObject("_id",
                new BasicDBObject(QueryOperators.IN, accessIds)).append("welcomePushTime", "claim"));
        for(BasicDBObject wxConfig: wxConfigs){
            String accessId = wxConfig.get("_id").toString();
            List<String> sids = accessIdMap.get(accessId);
            String id = UUID.randomUUID().toString();
            String time = DateUtil.getCurrentTime();
            if(wxConfig.get("welcome_msg") != null && !wxConfig.get("welcome_msg").toString().equals("")){
                try {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("_id", id);
                    jsonObject.put("msgType", "batchNewIm");
                    jsonObject.put("user", "system");
                    jsonObject.put("createTime", time);
                    jsonObject.put("lastTime", time);
                    jsonObject.put("contentType", "text");
                    jsonObject.put("content", wxConfig.get("welcome_msg").toString());
                    jsonObject.put("account", wxConfig.get("account").toString());
                    jsonObject.put("accessId", accessId);
                    jsonObject.put("sid", sids);
                    jsonObject.put("platform", "weixin");
                    String url = AppConfig.getInstance().getVar("multi_channel_dispatcher_url");

                    String data = "data=" + jsonObject.toString();
                    try {
                        HttpProvider.sendPost(url+"/sendMessage", data.getBytes("UTF-8"));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

        }
    }

    /**
      * 报表事件
      */
    private void emitReport(String agent, List<BasicDBObject> sessions, String account) {
        List<InsertOneModel> insertOps = new ArrayList<InsertOneModel>();
        //座席接入会话数
        for (int i = 0; i < sessions.size(); i++) {

            BasicDBObject reportData = new BasicDBObject();
            reportData.put("reportTime", DateUtil.getCurrentTime());
            reportData.put("type", "accessSession");
            reportData.put("account", account);
            BasicDBObject subData = new BasicDBObject();
            subData.put("agentId", agent);
            subData.put("accessSessionCount", 1);
            subData.put("accessId", sessions.get(i).get("accessId"));
            subData.put("platform", sessions.get(i).get("platform"));
            subData.put("toPeer", sessions.get(i).get("toPeer"));
            subData.put("sessionId", sessions.get(i).get("_id"));
            reportData.put("businessData", subData);
            reportData.put("_id", Utils.getUniqueid());
            reportData.put("reportStatus", "ready");
            InsertOneModel<BasicDBObject> insertOneModel = new InsertOneModel<BasicDBObject>(reportData);
            insertOps.add(insertOneModel);
        }

        MongoProvider.bulkWriteByReportDB(Constant.DB_APP_REPORT_EVENT, insertOps, new WriteConcern(0));


    }

    /**
     * 通知gateway下发通知
     */
    private void notifyGateway(String agent, Set uids) {
//        for(int i=0; i<sessions.size(); i++){
//
//        }
//        //微信的不推送
//        if(task.getPlatform().equals("weixin")){
//            return;
//        }
        HashMap<String, Object> notifyVo = new HashMap<String, Object>();
        notifyVo.put("sids", uids);
        notifyVo.put("type", "webchat");
        notifyVo.put("operation", "claim");
        notifyVo.put("user", agent);
        notifyVo.put("batch", true);

        String url = AppConfig.getInstance().getVar("multi_channel_dispatcher_url");
        String dataStr = new JSONObject(notifyVo).toString();
        String data = "data=" + dataStr;
        try {
            HttpProvider.sendPost(url+"/status", data.getBytes("UTF-8"));
        } catch (Exception e) {
            e.printStackTrace();
        }


    }





    /**
      * 将消息推送给座席
      */
    private void pushToAgent(String agent, List<BasicDBObject> sessions, String account) {
        BasicDBObject pushClient = null;
        String agentObj = redis.get(RedisKeyConstant.ONLINE_AGENT_INFO + agent);
        if (agent != null) {
            pushClient = (BasicDBObject) JSON.parse(agentObj);
        }

        if (pushClient != null) {
            try {
                Hashtable<String, Object> subMap = new Hashtable<String, Object>();
                subMap.put("Account", account);
                subMap.put("Event", "BatchNewWebchat");
                subMap.put("Data", sessions);
                subMap.put("Foryou", true);
                subMap.put("assign", true);
                Hashtable<String, Object> map = new Hashtable<String, Object>();
                map.put("userId", agent);
                map.put("eventData", subMap);
                String url = "http://" + pushClient.get("pushServerIp").toString() + ":" + pushClient.get("pushServerPort").toString() + "/push";

                String result = HttpProvider.sendPost(url, ("msg="+URLEncoder.encode(JSON.serialize(map), "UTF-8")).getBytes());
                log.info("push msg to pushServer:" + JSON.serialize(map));

            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            log.warning("not found online agent");
        }
    }



}
