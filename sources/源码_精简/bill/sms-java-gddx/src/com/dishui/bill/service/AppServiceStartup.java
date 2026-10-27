package com.dishui.bill.service;

import com.dishui.db.mango.MongoConnect;
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
//        MongoConnect.getInstance().connectReport();
        System.out.println("mongo db connected.");

        new AppHttpServer();
        System.out.println("app service server started.");

        DsService.getInstance().start();
        System.out.println("dsService server started.");

    }
}
