package com.dishui.manager.agentPc.collectInfo;

import com.dishui.server.handler.CollectInfoHandler;

import java.util.Calendar;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by cx on 16/9/29.
 */
public class AgentPcCollectInfoServer {

    private static AgentPcCollectInfoServer instance = null;
    private AgentPcCollectInfoServer(){
        instance = this;
    }
    private boolean isRunning = false;
    private Timer collectTimer = new Timer();
    private TimerTask collectTask = new CollectInfoHandler();

    public static AgentPcCollectInfoServer getInstance(){
        if (instance == null){
            new AgentPcCollectInfoServer();
        }
        return instance;
    }

    public void start(){
        if(this.isRunning){
            System.out.println("AgentPcCollectInfoServer server was started.");
            return;
        }
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 30);
        long oneDay = 24 * 60 * 60 * 1000;
        collectTimer.scheduleAtFixedRate(collectTask,cal.getTime(),oneDay);
    }
}
