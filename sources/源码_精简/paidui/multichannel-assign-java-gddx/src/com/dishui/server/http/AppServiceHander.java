package com.dishui.server.http;

import java.net.URLEncoder;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.AppServiceStartup;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.net.httpserver.HttpExchange;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

public class AppServiceHander {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());
    public static ThreadPoolExecutor pool = new ThreadPoolExecutor(0, Integer.MAX_VALUE ,60, TimeUnit.SECONDS, new SynchronousQueue<Runnable>());
    public static Hashtable<String, Object> accountMap = new Hashtable<String, Object>();
//    public static Map<String, PeerAssignThread> peerList = new HashMap<String, PeerAssignThread>();
    public static HashMap<String, String> peerMap = new HashMap<String, String>();

//    public static Map<String, EmailPeerAssignThread> emailAccountList = new HashMap<String, EmailPeerAssignThread>();
//    public static HashMap emailPeerMap = new HashMap<String, String>();

    public static C5Response getIMAgentId(C5Action action, HttpExchange exchange) {

        C5Response response = new C5Response(action);
        try {
//            response.setSucceed(true);
//            AppHttpHandler.sendOK(response, exchange);
//            BasicDBObject task = new BasicDBObject();
//            task.put("account",action.getStringValue("account"));
//            task.put("data", action.getStringValue("data"));
//            task.put("peerId", action.getStringValue("peerId"));
//            task.put("sessionVersion", action.getStringValue("sessionVersion"));
//            task.put("_id", action.getStringValue("sessionId"));
//            task.put("time", Long.parseLong(action.getStringValue("time")));
//            if(peerList.get(task.get("peerId").toString()) != null){
//                PeerAssignThread thread = peerList.get(task.get("peerId"));
//                thread.addTask(task);
//            }else{
//                synchronized (peerList){
//                    if(!peerList.containsKey(task.get("peerId").toString())){
//                        PeerAssignThread thread = new PeerAssignThread(task.get("account").toString(), task.get("peerId").toString());
//                        peerList.put(task.get("peerId").toString(), thread);
//                        accountMap.put(action.getStringValue("account"), new Object());
//                        pool.execute(thread);
//                        thread.addTask(task);
//                    }else{
//                        peerList.get(task.get("peerId").toString()).addTask(task);
//                    }
//                }
////                DBObject findCondition = new BasicDBObject();
////                findCondition.put("status", "undeal");
////                findCondition.put("toPeer", task.get("peerId").toString());
////                List<DBObject> sessionList = MongoProvider.find(Constant.DB_APP_MULTI_CHANNEL_CHAT_SESSION, findCondition);
////                if (sessionList != null && sessionList.size() > 0) {
////                    for (int j = 0; j < sessionList.size(); j++) {
////                        DBObject session = sessionList.get(j);
////                        DBObject task1 = getTaskDbObject(session);
////                        MongoProvider.insertByReportDbName(Constant.ASSIGN_DB, Constant.APP_IM_ASSIGN_TASK, task1, new WriteConcern(1));
////                    }
////                }
//
//            }





        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public static C5Response notifyAssign(C5Action action, HttpExchange exchange) {
        C5Response response = new C5Response(action);
        try {
            String peerStr = action.getStringValue("peers");
            String account = action.getStringValue("account");
            String agent = null;
            try{
                agent = action.getStringValue("agent");
            }catch (Exception e){

            }

            List<String> peerList = new ArrayList<String>();
            if(peerStr!= null && !peerStr.equals("")){
                String[] peers = peerStr.split(",");
                for(int i=0; i<peers.length; i++){
                    String peerId = peers[i];
                    peerList.add(peerId);
                    if(AppServiceStartup.queueMap.containsKey(peerId)){
                        AppServiceStartup.queueMap.get(peerId).setAssignStatus(true);
                        log.log(Level.INFO, "setAssignStatus(true)" + peerId);
                    }
                }

                if(agent!= null && AppServiceStartup.agentPeerMap.containsKey(agent)){
                    AppServiceStartup.agentPeerMap.put(agent, peerList);
                }
            }

            response.setSucceed(true);
            AppHttpHandler.sendOK(response, exchange);

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }


}



