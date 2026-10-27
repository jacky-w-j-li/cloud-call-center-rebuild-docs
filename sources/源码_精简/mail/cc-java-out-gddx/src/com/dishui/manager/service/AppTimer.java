package com.dishui.manager.service;

import java.util.Timer;
import java.util.logging.Logger;


public class AppTimer extends Timer{
	private static Logger log = Logger.getLogger(AppTimer.class.getName());
	private static AppTimer instance;
	
	public static AppTimer getInstance(){
		if(instance == null)
			new AppTimer();
		return instance;
	}
	
	private AppTimer(){
		super("appTimer!");
		instance = this;
		log.info("app timer is created!");
	}
}
