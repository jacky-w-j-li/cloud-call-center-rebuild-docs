package com.m7.cc.ass.server.http;

import java.util.TimerTask;

import com.m7.cc.ass.config.ASConfig;

public class C5TimeoutTask extends TimerTask {
	private C5Session client;

	public C5TimeoutTask(C5Session client) {
		this.client = client;
	}

	public void run() {
		try{
			if (client == null)
				return;
			if ((System.currentTimeMillis() - client.lastUpdateTime) > ASConfig.getInstance().getHttpTimeout() * 1000)
				client.timeout();
		} catch (Throwable e){
			
		}
	}

	public void close() {
		client = null;
	}
}
