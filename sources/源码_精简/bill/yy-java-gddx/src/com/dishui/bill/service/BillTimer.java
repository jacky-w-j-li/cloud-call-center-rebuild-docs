package com.dishui.bill.service;

import java.util.Timer;
import java.util.logging.Logger;


public class BillTimer extends Timer{
	private static Logger log = Logger.getLogger(BillTimer.class.getName());
	private static BillTimer instance;

	public static BillTimer getInstance(){
		if(instance == null)
			new BillTimer();
		return instance;
	}

	private BillTimer(){
		super("billTimer!");
		instance = this;
		log.info("bill timer is created!");
	}
}
