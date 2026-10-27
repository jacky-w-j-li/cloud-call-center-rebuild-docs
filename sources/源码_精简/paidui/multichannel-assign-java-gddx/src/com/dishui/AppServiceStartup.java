package com.dishui;

import com.dishui.assign.*;
import com.dishui.db.mango.MongoConnect;
//import com.dishui.manager.db.master.DBMaster;
import com.dishui.db.mango.MongoProvider;
import com.dishui.m7Redis.RedisAPI;
import com.dishui.m7Redis.RedisConnection;
import com.dishui.m7Redis.RedisKeyConstant;
import com.dishui.manager.service.AppConfig;
import com.dishui.model.Constant;
import com.dishui.model.PeerTaskQueue;
import com.dishui.server.http.AppHttpServer;
import com.dishui.server.http.AppServiceHander;
import com.dishui.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.QueryOperators;
import com.mongodb.util.JSON;
import org.jsoup.nodes.Entities;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AppServiceStartup {

	public static Map<String, PeerTaskQueue> queueMap = new ConcurrentHashMap<String, PeerTaskQueue>();
	public static Map<String, Object> agentMap = new HashMap<String, Object>();
	public static Map<String, List> agentPeerMap = new HashMap<String, List>();

	public static void main(String[] args) {

        AppConfig.getInstance();
		IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
				"managerService", AppConfig.getInstance().getLogLevel(),
				true);
		System.out.println("Starting DB plugin...");
		MongoConnect.getInstance().connect();
//
		RedisConnection.initPool();
		new AppHttpServer();
		System.out.println("app service server started.");
		RedisImTaskThread.initData();
		DBQueueThread.start();
		AssignPushThread.start(Integer.parseInt(AppConfig.getInstance().getVar("pushThreadNum")));
		PeerAssignThread.start(Integer.parseInt(AppConfig.getInstance().getVar("assignThreadNum")));
		RedisImTaskThread.start();
		CCExceptionProcessorThread.start();

	}
}
