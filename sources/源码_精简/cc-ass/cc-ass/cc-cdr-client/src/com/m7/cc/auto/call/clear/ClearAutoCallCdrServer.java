package com.m7.cc.auto.call.clear;

import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

public class ClearAutoCallCdrServer {
	private static ClearAutoCallCdrServer instance = null;
	private boolean isRunning = false;
	private TimerTask clearTask = new ClearAutoCallCdrTask();
	private TimerTask cdrClearTask = new ClearCdrTask();
	private Timer clearTimer = new Timer();
	
	private ClearAutoCallCdrServer(){
		instance = this;
	}
	
	public static ClearAutoCallCdrServer getInstance(){
		if (instance == null){
			new ClearAutoCallCdrServer();
		}
		return instance;
	}
	
	public void startServer(){
		System.out.println("ClearAutoCallCdr server starting...");
		if(this.isRunning){
			System.out.println("ClearAutoCallCdr server was started.");
			return;
		}
		clearTimer.scheduleAtFixedRate(clearTask,  new Date(), 3600000);
		clearTimer.scheduleAtFixedRate(cdrClearTask,  new Date(), 3600000);
		System.out.println("ClearAutoCallCdr server started.");
	}
	
	public void stop(){
		clearTimer.cancel();
		clearTimer = null;
		this.isRunning = false;
	}
}
