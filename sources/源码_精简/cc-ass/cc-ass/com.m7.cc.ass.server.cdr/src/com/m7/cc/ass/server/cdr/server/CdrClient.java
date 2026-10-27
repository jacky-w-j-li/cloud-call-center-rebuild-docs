package com.m7.cc.ass.server.cdr.server;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.command.C5Event;
import com.m7.cc.url.HttpProvider;

public class CdrClient implements CdrListener {

	public static Vector<String> eventBuffer = new Vector<String>();

	private static final Logger log = Logger.getLogger(CdrClient.class
			.getName());

	private boolean running = true;

	public CdrClient() {
		Thread t = new Thread("Send cdr thread") {
			public void run() {
				sendCdr();
			}
		};
		t.start();
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
					log.info("send cdr count: "+count);
					for(int i=0;i<count;i++)
						eventBuffer.remove(0);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	private void sendToBuf(String cdr) {
		synchronized (eventBuffer) {
			if (eventBuffer.size() > 1000000) {
				log.warning("Cdr buffer is too large to cache any event");
			} else {
				eventBuffer.add(cdr);
			}
			eventBuffer.notifyAll();
		}
	}

	private boolean send(String cdr) {
		try {
			String res = HttpProvider.sendPost(ASConfig.getInstance().getVar(
					"cdr.server.url")+"cdr", cdr.getBytes("UTF-8"), 5000);
			if (res.equals("200"))
				return true;
		} catch (Exception e) {
			log.log(Level.WARNING, "send cdr failed", e);
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

	public void callCdrNew(C5CallRecord cdr) {
//		sendToBuf(cdr.getJsonString());
	}

	public void callCdrUpdate(C5CallRecord cdr) {
//		sendToBuf(cdr.getJsonString());
	}

	public void channelCdrNew(C5ChannelRecord cdr) {
		try {
			if(RuntimeData.getInstance().getChannelCdrRecordMap().containsKey(cdr.getAccount()+"@"+cdr.getAsterisk())){
				sendToBuf(cdr.getJsonString());
			}
		} catch (Exception e) {
			log.warning("channelCdrNew getAccount Exception!"+e);
		}
//		sendToBuf(cdr.getJsonString());
	}

	public void peerCdrNew(C5PeerRecord cdr) {
		sendToBuf(cdr.getJsonString());
	}

	public void peerCdrUpdate(C5PeerRecord cdr) {
		sendToBuf(cdr.getJsonString());
	}

	public void investigateNew(C5Investigate cdr) {
		sendToBuf(cdr.getJsonString());
	}

	public void peerCallCdrNew(C5PeerCallRecord cdr) {
//		sendToBuf(cdr.getJsonString());
	}

	public void peerCallCdrUpdate(C5PeerCallRecord cdr) {
		if(cdr.getOpType().equals(C5PeerCallRecord.end))
			sendToBuf(cdr.getJsonString());
	}

	public void batchDialoutCdrNew(C5BatchDialoutRecord cdr) {
		sendToBuf(cdr.getJsonString());
	}
	
	public void eventDispatcherResend(String url){
		sendToBuf(url);
	}
	
	public int getBufferSize(){
		return eventBuffer.size();
	}

	@Override
	public void autoCall(C5Event cdr) {
		sendToBuf(cdr.getJsonString());
	}
}
