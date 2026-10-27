package com.m7.cc.hangupsms.cach;

import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

import com.m7.cc.auto.call.clear.ClearAutoCallCdrServer;
import com.m7.cc.auto.call.clear.ClearAutoCallCdrTask;
import com.m7.cc.auto.call.clear.ClearCdrTask;

public class HangupSmsCachServer {
	private static HangupSmsCachServer instance = null;
	private boolean isRunning = false;
	private TimerTask getcachTask = new HangupSmsCachTask();
	private Timer getcachTimer = new Timer();
	
	private HangupSmsCachServer(){
		instance = this;
	}
	
	public static HangupSmsCachServer getInstance(){
		if (instance == null){
			new HangupSmsCachServer();
		}
		return instance;
	}
	
	public void startServer(){
		System.out.println("HangupSmsCach server starting...");
		if(this.isRunning){
			System.out.println("HangupSmsCach server was started.");
			return;
		}
		getcachTimer.scheduleAtFixedRate(getcachTask,  new Date(), 60000);
		System.out.println("HangupSmsCach server started.");
	}
	
	public void stop(){
		getcachTimer.cancel();
		getcachTimer = null;
		this.isRunning = false;
	}
}
