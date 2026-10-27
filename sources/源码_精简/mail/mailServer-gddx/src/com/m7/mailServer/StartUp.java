package com.m7.mailServer;

import com.dishui.dbpool.M7JdbcPool;
import com.dishui.dbpool.M7JdbcProvider;
import com.dishui.util.log.IceLogger;
import com.m7.mailServer.handler.MailHandler;
import com.m7.mailServer.http.AppHttpServer;

/**
 * Created by zhangyang on 16/4/1.
 */
public class StartUp {
    public static void main(String[] args) {
        AppConfig.getInstance();
        //IceLogger.initLogger(AppConfig.getInstance().getLogDir(), "mailServer", AppConfig.getInstance().getLogLevel(), true);
        //clog
        IceLogger.initLogger(AppConfig.getInstance().getClogHost(),AppConfig.getInstance().getClogBaseLogFields(),
                AppConfig.getInstance().getClogTimeout(),AppConfig.getInstance().getLogDir(),"mailServer",
                AppConfig.getInstance().getLogLevel(),true);

        M7JdbcPool.getInstance();

        new AppHttpServer();
        System.out.println("mail server started.");
        init();

    }

    private static void init() {
        //db  tables init
        if(M7JdbcProvider.init()){
            System.out.println("init db success .............");
        } else {
            System.out.println("init db error !!!!!!!!!!!!!!!!!");
        }
        //leave mails
        System.out.println("start process leave mails.......");
        MailHandler.processExistMail();
        System.out.println("end process leave mails.......");
    }
}
