package com.dishui.bill.service;

import java.util.Timer;
import java.util.logging.Logger;


public class SmsTimer extends Timer{
	private static Logger log = Logger.getLogger(SmsTimer.class.getName());
	private static SmsTimer instance;

	public static SmsTimer getInstance(){
		if(instance == null)
			new SmsTimer();
		return instance;
	}

	private SmsTimer(){
		super("smsTimer!");
		instance = this;
		log.info("sms timer is created!");
	}
}
