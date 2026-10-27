package com.dishui.manager.report.model;

import com.dishui.manager.report.impl.ImMonitorHandler;

import java.util.TimerTask;
import java.util.logging.Logger;


public class MonitorClearTask extends TimerTask {
    private static final Logger log = Logger.getLogger(ImMonitorHandler.class.getName());
	private ImMonitorHandler handler;

	public MonitorClearTask(ImMonitorHandler handler) {
		this.handler = handler;
	}

	public void run() {
		try{
			if (handler == null)
				return;
			handler.accounts.clear();
            log.warning("every night clear yesterday monitor data finish.");
		} catch (Throwable e){
			
		}
	}
}
