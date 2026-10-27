package com.m7.mailServer.handler;

import com.m7.mailServer.AppConfig;
import com.m7.mailServer.model.M7Mail;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/5/27.
 */
public class SendMailManager {
    private static final Logger log = Logger.getLogger(SendMailThread.class.getName());
    private static SendMailManager instance;
    private static ExecutorService fixedThreadPool;
    private int poolSize = 50;

    private SendMailManager(){
        instance = this;
        this.poolSize = Integer.parseInt(AppConfig.getInstance().getVar("send.mail.pool"));
        fixedThreadPool = Executors.newFixedThreadPool(poolSize);
    }

    public static SendMailManager getInstance(){
        if(instance == null){
            new SendMailManager();
        }
        return instance;
    }

    /**
     * 发送邮件
     */
    public void sendMail(M7Mail m7Mail){
        SendMailThread mailThread = new SendMailThread(m7Mail);
        fixedThreadPool.execute(mailThread);
    }

}
