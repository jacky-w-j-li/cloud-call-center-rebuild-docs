package com.dishui.bill.service;

import com.dishui.checkNum.NumCheckManager;
import com.dishui.db.mango.MongoConnect;
import com.dishui.bill.bill.BillMaster;
import com.dishui.bill.session.AppSession;
import com.dishui.db.redis.RedisUtil;
import com.dishui.ip.IPManager;
import com.dishui.mongo.master.DBMaster;
import com.dishui.server.http.AppHttpServer;
import com.dishui.service.DsService;
import com.dishui.util.log.IceLogger;

public class AppServiceStartup {

    public static void main(String[] args) {
        AppConfig.getInstance();
        IceLogger.initLogger(AppConfig.getInstance().getClogHost(),AppConfig.getInstance().getClogBaseLogFields(),
                AppConfig.getInstance().getClogTimeout(),AppConfig.getInstance().getLogDir(),"billService",
                AppConfig.getInstance().getLogLevel(),true);
        System.out.println("Starting DB plugin...");
        MongoConnect.getInstance().connect();
        MongoConnect.getInstance().connectReport();
        System.out.println("mongo db connected.");

       RedisUtil.initDialStatsPool(AppConfig.getInstance().getRedisIp(),AppConfig.getInstance().getRedisPort(),AppConfig.getInstance().getRedisPwd());
        System.out.println("redis pool init.");

        new AppHttpServer();
        System.out.println("app service server started.");


        AppSession.getInstance().start();
        System.out.println("app session server started.");


        DsService.getInstance().start();
        System.out.println("dsService server started.");


        System.out.println("bill task starting....");
        BillMaster.getInstance().start();
        System.out.println("bill task started.");

        DBMaster.getInstance().start();
        System.out.println("db master started.");

        IPManager.getInstance().start();
        System.out.println("ip manager started.");

        NumCheckManager.getInstance().start();
        System.out.println(" numCheck manager started.");


    }
}
