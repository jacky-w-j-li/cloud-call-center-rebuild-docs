package com.m7.cc.report;

import java.util.Calendar;
import java.util.Timer;
import java.util.TimerTask;

public class ReportServer {
	private static ReportServer instance = null;
	private boolean isRunning = false;
	private TimerTask collectTask = new ReportCollector();
	private Timer reportCollectorTimer = new Timer();
	
	private ReportServer(){
		instance = this;
	}
	
	public static ReportServer getInstance(){
		if (instance == null){
			new ReportServer();
		}
		return instance;
	}
	
	public void startServer(){
		System.out.println("Report server starting...");
		if(this.isRunning){
			System.out.println("Report server was started.");
			return;
		}
		
		Calendar cal = Calendar.getInstance();
		if(cal.get(Calendar.MINUTE) < 30) {
			cal.set(Calendar.MINUTE, 5);
		} else {
			cal.set(Calendar.MINUTE, 35);
		}
//		reportCollectorTimer.schedule(collectTask, cal.getTime(), 1800000);
		reportCollectorTimer.scheduleAtFixedRate(collectTask, cal.getTime(), 1800000);
		System.out.println("Report server started.");
	}
	
	public void stop(){
		reportCollectorTimer.cancel();
		reportCollectorTimer = null;
		this.isRunning = false;
	}
}
