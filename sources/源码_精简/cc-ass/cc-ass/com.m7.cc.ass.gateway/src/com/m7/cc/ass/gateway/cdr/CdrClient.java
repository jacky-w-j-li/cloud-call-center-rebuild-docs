package com.m7.cc.ass.gateway.cdr;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.url.HttpProvider;

public class CdrClient implements CdrListener {
	public static Vector<String> eventBuffer = new Vector<String>();

	private static final Logger log = Logger.getLogger(CdrClient.class
			.getName());

	private boolean running = true;

	public CdrClient() {
		new Thread("Send gw cdr thread") {
			public void run() {
				sendCdr();
			}
		}.start();
	}

	private void sendCdr() {
		while (running) {
			try {
				String cdr = null;
				int count = -1;
				synchronized (eventBuffer) {
					if (eventBuffer.size() == 0) {
						eventBuffer.wait();
					} else {
						cdr = "";
						for(int i=0;i<eventBuffer.size() && i<50;i++) {
							cdr += eventBuffer.get(i)+"<>";
							count = i;
						}
						if(cdr.endsWith("<>")){
							cdr = cdr.substring(0, cdr.length() - 2);
						}
					}
				}
				if (count > -1 && send(cdr)) {
					count++;
					log.info("send gw cdr count: "+count);
					for(int i=0;i<count;i++)
						eventBuffer.remove(0);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	private boolean send(String cdr) {
		try {
			String res = HttpProvider.sendPost(
					ASConfig.getInstance().getVar("gwcdr.server.url"),
					cdr.getBytes("UTF-8"), 5000);
			if (res.equals("200"))
				return true;
		} catch (Exception e) {
			log.log(Level.WARNING, "send gwcdr failed", e);
			try {
				Thread.sleep(3000);
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
		}
		return false;
	}

	public void close() {
		running = false;
	}

	private void sendToBuf(String cdr) {
		synchronized (eventBuffer) {
			if (eventBuffer.size() > 1000000) {
				log.warning("GWCdr buffer is too large to cache any event");
			} else {
				eventBuffer.add(cdr);
			}
			eventBuffer.notifyAll();
		}
	}

	@Override
	public void channelCdrNew(GWChannel cdr) {
		sendToBuf(cdr.getJsonString());
	}
}
