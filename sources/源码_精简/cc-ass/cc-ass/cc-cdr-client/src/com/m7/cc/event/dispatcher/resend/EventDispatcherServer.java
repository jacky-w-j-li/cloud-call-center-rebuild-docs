package com.m7.cc.event.dispatcher.resend;

import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

public class EventDispatcherServer {
	private static EventDispatcherServer instance = null;
	private boolean isRunning = false;
	private TimerTask resendTask = new EventDispatcherResendTask();
	private Timer resendTimer = new Timer();
	private EventDispatcherResender dispatcherResender;
	
	private EventDispatcherServer(){
		instance = this;
	}
	
	public static EventDispatcherServer getInstance(){
		if (instance == null){
			new EventDispatcherServer();
		}
		return instance;
	}
	
	public void startServer(){
		System.out.println("EventDispatcherResend server starting...");
		if(this.isRunning){
			System.out.println("EventDispatcherResend server was started.");
			return;
		}
		dispatcherResender = new EventDispatcherResender();
		resendTimer.scheduleAtFixedRate(resendTask,  new Date(), 5000);
		System.out.println("EventDispatcherResend server started.");
	}
	
	public void stop(){
		resendTimer.cancel();
		resendTimer = null;
		this.isRunning = false;
	}
}
