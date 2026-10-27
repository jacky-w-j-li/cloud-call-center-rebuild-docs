package com.m7.cc.ass.server.dispatcher.server;

import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

public class QiniuMonitorDispatcherServer {

	private static QiniuMonitorDispatcherServer instance = null;
	private Timer dispatcherTimer = new Timer();
	private TimerTask qiniuPushTask = new QiniuMonitorDispatcherTask();
	private TimerTask qiniuHandPushTask = new QiniuHandMonitorDispatcherTask();
	
	public QiniuMonitorDispatcherServer() {
		instance = this;
	}
	
	public static QiniuMonitorDispatcherServer getInstance(){
		if (instance == null){
			new QiniuMonitorDispatcherServer();
		}
		return instance;
	}
	
	public void start(){
		System.out.println("QiniuMonitorDispatcher Push server started!");
		dispatcherTimer.scheduleAtFixedRate(qiniuPushTask, new Date(), 3600000);
		dispatcherTimer.scheduleAtFixedRate(qiniuHandPushTask, new Date(), 300000);
	}
	
}
