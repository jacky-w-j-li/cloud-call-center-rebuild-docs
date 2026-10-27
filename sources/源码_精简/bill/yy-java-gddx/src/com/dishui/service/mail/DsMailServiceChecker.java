package com.dishui.service.mail;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/3/3.
 * 监控 邮件服务的  状态
 * 保证邮件服务的高可用性
 */
public class DsMailServiceChecker {
    private static Logger log = Logger.getLogger(DsMailServiceChecker.class.getName());

    private static DsMailServiceChecker instance;
    private long waitTime = 15000;
    private Thread checkThead;
    private boolean running = true;
    private boolean isChecking = false;


    private DsMailServiceChecker() {
        instance = this;
        this.checkThead = new Thread("mail check thread") {
            @Override
            public void run() {
                while (running) {
                    if (!isChecking) {
                        isChecking = true;
                        try {
                            checkThread();
                        } catch (Exception e) {
                            log.log(Level.WARNING, "", e);
                        } finally {
                            isChecking = false;
                        }
                    } else {
                        log.log(Level.WARNING, "prev checker process is still running!,wait ........");
                    }

                    try {
                        sleep(waitTime);
                    } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                    }

                }
            }
        };

        this.checkThead.setDaemon(true);
        this.checkThead.start();
    }

    public static DsMailServiceChecker getInstance() {
        if (instance == null) {
            new DsMailServiceChecker();
        }
        return instance;
    }

    public void checkThread() {
        log.info("start check mail service status ........");
        Thread mailThread = DsMailService.getInstance().getMailThread();
        long activeTime = DsMailService.getInstance().getActiveTime();
        if (mailThread != null && activeTime != 0) {
            boolean isAlive = mailThread.isAlive();
            boolean isActive = checkActive(activeTime);
            if(!isAlive  || !isActive){
                log.warning("send mail thread is now stop!!!!!!!!!!!!!!");
                //重启邮件服务
                DsMailService.getInstance().killThead();
                while (mailThread.isAlive()){
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                log.warning("=+++++++++++++++++++++++++" + mailThread.isAlive());

                DsMailService.getInstance().activeThread();
            } else {
                log.info("mail thread status is ok !!!!!");
            }

        } else {
            log.warning("send mail thread is null!!!!!!!!!!!!!!");
        }

    }

    /**
     * 5分钟 只要没有再次运行，即认为服务假死。
     * @param activeTime
     * @return
     */
    private boolean checkActive(long activeTime) {
        long now = System.currentTimeMillis();
        if((now - activeTime) > 5 * 60 * 1000){
            return false;
        }
        return true;
    }


}
