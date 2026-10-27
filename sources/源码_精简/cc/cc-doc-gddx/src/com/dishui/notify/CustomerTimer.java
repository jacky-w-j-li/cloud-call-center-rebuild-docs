package com.dishui.notify;

import java.util.Timer;
import java.util.logging.Logger;


public class CustomerTimer extends Timer{
	private static Logger log = Logger.getLogger(CustomerTimer.class.getName());
	private static CustomerTimer instance;

	public static CustomerTimer getInstance(){
		if(instance == null)
			new CustomerTimer();
		return instance;
	}

	private CustomerTimer(){
		super("customerTimer!");
		instance = this;
		log.info("customer timer is created!");
	}
}
