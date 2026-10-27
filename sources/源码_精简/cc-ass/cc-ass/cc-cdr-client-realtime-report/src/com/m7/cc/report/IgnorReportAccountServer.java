package com.m7.cc.report;

import java.util.Date;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;

public class IgnorReportAccountServer {
	private static IgnorReportAccountServer instance = null;
	private Timer IgnorreportTimer = new Timer();
	public HashMap<String, Boolean> ignoreReportAcc = new HashMap<String, Boolean>();
	private TimerTask ignoreAccTask = new ReportLoadIgnoreAccTask();
	
	private IgnorReportAccountServer(){
		instance = this;
	}
	
	public static IgnorReportAccountServer getInstance(){
		if (instance == null){
			new IgnorReportAccountServer();
		}
		return instance;
	}
	
	public void startServer(){
		System.out.println("Ignore Report Account Server starting...");
		IgnorreportTimer.scheduleAtFixedRate(ignoreAccTask, new Date(), 600000);
		System.out.println("Ignore Report Account server started.");
	}
	
	public void stop(){
		IgnorreportTimer.cancel();
		IgnorreportTimer = null;
	}
}
