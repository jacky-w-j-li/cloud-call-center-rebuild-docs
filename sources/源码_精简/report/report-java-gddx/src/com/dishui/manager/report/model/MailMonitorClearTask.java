package com.dishui.manager.report.model;

import com.dishui.manager.report.impl.MailMonitorHandler;

import java.util.TimerTask;
import java.util.logging.Logger;


public class MailMonitorClearTask extends TimerTask {
	private static final Logger log = Logger.getLogger(MailMonitorHandler.class.getName());
	private MailMonitorHandler mailMonitorHandler;

	public MailMonitorClearTask(MailMonitorHandler mailMonitorHandler) {
		this.mailMonitorHandler = mailMonitorHandler;
	}

	public void run() {
		try {
			if (mailMonitorHandler == null)
				return;
			mailMonitorHandler.accounts.clear();
			log.warning("[ mail monitor ] every night clear yesterday monitor data finish.");
		} catch (Throwable e) {

		}
	}
}
