package com.m7.cc.ass.server.cdr.server;

import java.util.Hashtable;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.ASConfigListener;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueEntryRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueMemberRecord;

public class CDRServer implements ASConfigListener{
	public static final String logName = "cdr_";
	
	private boolean running = false;
	private Hashtable<String, CDRHandler> cdrHandlers = new Hashtable<String, CDRHandler>();
	private CdrClient client;
	
	private static CDRServer instance = null;
	
	private static final Logger log = Logger.getLogger(CDRServer.class.getName());
	
	private CDRServer(){
		instance = this;
		client = new CdrClient();
		log.info("Start CDR server succeed.");
		running = true;
	}
	
	public static CDRServer getInstance(){
		if (null == instance)
			instance = new CDRServer();
		return instance;
	}
	
	public void initHandler(){
		synchronized (cdrHandlers) {
			String[] amis = ASConfig.getInstance().getPbxs();
			for(int i=0;i<amis.length;i++){
				if(amis[i].startsWith("gateway"))
					continue;
				CDRHandler handler = new CDRHandler(this, amis[i]);
				CallListener.getInstance().addChannelListener(amis[i], handler);
				CallListener.getInstance().addPeerListener(amis[i], handler);
				CallListener.getInstance().addQueueListener(amis[i], handler);
				CallListener.getInstance().addUserListener(amis[i], handler);
				CallListener.getInstance().addBatchDialoutListener(amis[i], handler);
				CallListener.getInstance().addOriginateListener(amis[i], handler);
				cdrHandlers.put(amis[i], handler);
				handler.addCdrListener(client);
			}
		}
	}
	
	public void addCdrListener(CdrListener listener, String id){
		synchronized (cdrHandlers) {
			if(id == null){
				Iterator<CDRHandler> it = cdrHandlers.values().iterator();
				while(it.hasNext()){
					it.next().addCdrListener(listener);
				}
			} else {
				if(cdrHandlers.get(id) != null)
					cdrHandlers.get(id).addCdrListener(listener);
			}
		}
	}
	
	public void removeCdrListener(CdrListener listener, String id) {
		synchronized (cdrHandlers) {
			if(id == null){
				Iterator<CDRHandler> it = cdrHandlers.values().iterator();
				while(it.hasNext()){
					it.next().removeCdrListener(listener);
				}
			} else {
				if(cdrHandlers.get(id) != null)
					cdrHandlers.get(id).removeCdrListener(listener);
			}
		}
	}
	
	public Hashtable<String, CDRHandler> getCdrHandlers() {
		return cdrHandlers;
	}
	
	public void processChannelCdr(C5ChannelRecord cdr){

	}
	
	public void saveCallCdr(C5CallRecord cdr){

	}
	
	public void updateCallCdr(C5CallRecord cdr){

	}
	
	public void savePeerCdr(C5PeerRecord cdr){

	}
	
	public void updatePeerCdr(C5PeerRecord cdr){

	}
	
	public void saveQueueEntryCdr(C5QueueEntryRecord cdr){

	}
	
	public void saveQueueMemberCdr(C5QueueMemberRecord cdr){

	}
	
	public boolean isRunning() {
		return running;
	}

	public void destruct(){
		running = false;
	}

	public void pbxAdd(String ip) {
		synchronized (cdrHandlers) {
			try{
				CDRHandler handler = new CDRHandler(this, ip);
				cdrHandlers.put(ip, handler);
				handler.addCdrListener(client);
			} catch(Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public void pbxChanged(String ip) {
		
	}

	public void pbxRemoved(String ip) {
		synchronized (cdrHandlers) {
			if(!cdrHandlers.containsKey(ip)){
				log.log(Level.WARNING, "Can not find the cdr handler, this should never hanppen!");
				return;
			}
			log.warning(ip + " removed");
			cdrHandlers.remove(ip).destruct();
		}
	}
	
	public void stop(){
		running = false;
		synchronized (cdrHandlers) {
			Iterator<CDRHandler> handlers = cdrHandlers.values().iterator();
			while(handlers.hasNext()){
				CDRHandler handler = handlers.next();
				handler.stop();
			}
		}
		client.close();
	}
	
	public int getCurrentBufferSize(){
		return client.getBufferSize();
	}
}
