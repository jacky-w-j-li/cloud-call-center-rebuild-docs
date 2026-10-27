package com.m7.cc.ass.server.dispatcher.server;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.log.IceLogger;

public class EventDispatcherResend {

	public static Vector<String> eventBuffer = new Vector<String>();
	private static Logger rensendLog;
	private boolean running = true;

	public EventDispatcherResend() {
		rensendLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				"dispatcherResend", "ALL", false);
		Thread t = new Thread("EventDispatcher ReSend thread") {
			public void run() {
				sendEvent();
			}
		};
		t.start();
		rensendLog.info("EventDispatcher ReSend thread started!");
	}

	private void sendEvent() {
		while (running) {
			try {
				String eventUrl = null;
				synchronized (eventBuffer) {
					if (eventBuffer.size() == 0) {
						eventBuffer.wait();
					} else {
						eventUrl = eventBuffer.get(0);
					}
				}
				if (eventUrl != null && send(eventUrl)) {
					eventBuffer.remove(0);
				}else{
					Thread.sleep(5000);
				}
			} catch (Exception e) {
				rensendLog.log(Level.WARNING, "", e);
			}
		}
	}

	public static void addToBuf(String eventUrl) {
		synchronized (eventBuffer) {
			if (eventBuffer.size() > 1000000) {
				rensendLog.warning("EventDispatcher ReSend buffer is too large to cache any event");
			} else {
				eventBuffer.add(eventUrl);
			}
			eventBuffer.notifyAll();
		}
	}

	private boolean send(String eventUrl) {
		try {
			C5Event event = new C5Event(Fields.EventDispatcherResend);
			event.addParameter("url", eventUrl);
			event.addParameter("PBX", RuntimeData.getInstance().getPbxVos().get(0).getPbx());
			String res = HttpProvider.sendPost(ASConfig.getInstance().getVar(
					"cdr.server.url")+"cdr", event.getJsonString().getBytes("UTF-8"), 5000);
			rensendLog.log(Level.INFO, "EventDispatcher Send Event To Cdr: " + eventUrl + ".result=" + res);
			if(res.trim().equals("200")){
				return true;
			}
		} catch (Exception e) {
			rensendLog.log(Level.WARNING, "EventDispatcher ReSend Event failed", e);
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
	
	public int getBufferSize(){
		return eventBuffer.size();
	}
}
