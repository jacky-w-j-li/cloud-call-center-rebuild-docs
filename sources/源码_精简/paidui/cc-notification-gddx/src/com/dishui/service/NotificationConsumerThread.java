package com.dishui.service;

import com.dishui.config.NotificationConfig;
import com.dishui.model.NotificationVO;

import java.util.logging.Logger;

/**
 * Created by zengyx on 16/10/9.
 */
public class NotificationConsumerThread implements Runnable {
    private Logger log = Logger.getLogger(this.getClass().getName());

    /**
     * 开启多个线程去处理
     * @param threadNum
     */
    public static void start(int threadNum){
        while(threadNum > 0){
            new Thread(new NotificationConsumerThread(), "NotificationConsumerThread-"+ threadNum).start();
            threadNum--;
        }
    }


    @Override
    public void run() {
        log.info("notifictaion consumer thread start");

        while(true){
            try{
                NotificationVO notificationVO = NotificationProductThread.queue.poll();
                if(notificationVO == null){
                    synchronized (NotificationProductThread.queue){
                        NotificationProductThread.queue.wait();
                    }
                    continue;
                }
                if(NotificationConfig.notificationConfigMap.containsKey(notificationVO.getType())){
                    Boolean result = NotificationConfig.notificationConfigMap.get(notificationVO.getType()).process(notificationVO);
                    if (!result) {
                        NotificationProductThread.queue.add(notificationVO);
                    }
                }else{
                    log.warning("not found type:" + notificationVO.getType());
                }
            }catch (Exception e){

            }
        }

    }
}
