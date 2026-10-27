package com.m7.cc.ass.gateway.cdr;

import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.GWCallListener;

public class GWCdrServer {
	public static final String logName = "cdr_";

	private boolean running = false;
	private CdrClient client;
	private GWCdrHandler cdrHandler = new GWCdrHandler();
	private static GWCdrServer instance = null;
	private static final Logger log = Logger.getLogger(GWCdrServer.class
			.getName());

	private GWCdrServer() {
		instance = this;
		client = new CdrClient();
		log.info("Start GW CDR Server succeed.");
		running = true;
	}

	public static GWCdrServer getInstance() {
		if (null == instance) {
			instance = new GWCdrServer();
		}
		return instance;
	}

	public void initHandler() {
		String[] amis = ASConfig.getInstance().getPbxs();
		for (int i = 0; i < amis.length; i++) {
			if (amis[i].startsWith("gateway")) {
				GWCallListener.getInstance().addChannelListener("ALL",
						cdrHandler);
				cdrHandler.addListener(client);
				break;
			}
		}
	}

	public void addCdrListener(CdrListener listener) {
		cdrHandler.addListener(listener);
	}

	public void removeCdrListener(CdrListener listener) {
		cdrHandler.removeListener(listener);
	}

	public boolean isRunning() {
		return running;
	}

	public void destruct() {
		running = false;
	}

	public void stop() {
		running = false;
		cdrHandler.close();
		client.close();
	}
}
