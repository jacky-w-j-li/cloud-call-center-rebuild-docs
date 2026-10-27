package com.dishui.model;

import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Created by zengyx on 16/8/16.
 */
public class PushQueue {

    public static ConcurrentLinkedQueue<PushVO> pushQueue = new ConcurrentLinkedQueue<PushVO>();

    public static void add(PushVO processVO){
        pushQueue.add(processVO);
        synchronized (pushQueue){
            pushQueue.notifyAll();
        }

    }

    public static PushVO poll(){
        PushVO vo = pushQueue.poll();
        return vo;
    }

    public static int size(){
        return pushQueue.size();
    }
}
