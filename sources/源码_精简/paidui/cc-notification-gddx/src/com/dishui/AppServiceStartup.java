package com.dishui;

import com.dishui.m7Redis.RedisConnection;
import com.dishui.service.NotificationConsumerThread;
import com.dishui.service.NotificationProductThread;
import com.dishui.service.manager.NotificationService;
import com.dishui.utils.AppConfig;
import com.dishui.utils.log.IceLogger;

/**
 * Created by zengyx on 16/10/9.
 */
public class AppServiceStartup {

    public static void main(String[] args) {
        // 日志
        IceLogger.initLogger(AppConfig.getInstance().getLogDir(), "reportService", AppConfig.getInstance().getLogLevel(), true);
        // 初始化redis
        RedisConnection.initPool();

        NotificationConsumerThread.start(2);
        NotificationProductThread.start();
    }
}
