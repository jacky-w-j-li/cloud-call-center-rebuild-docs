package com.m7.cc.ass.call.impl;

import java.util.Hashtable;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ami.service.AMISystemListener;
import com.m7.cc.ami.service.scan.ScanListener;
import com.m7.cc.ass.call.event.AstEventHandler;
import com.m7.cc.ass.call.event.CallTimer;
import com.m7.cc.ass.call.event.Scanner;
import com.m7.cc.ass.call.handler.CallHandlerImpl;
import com.m7.cc.ass.call.model.CallHandler;

public class Activator implements BundleActivator, AMISystemListener {

	private Hashtable<String, AstEventHandler> eventHandlers = new Hashtable<String, AstEventHandler>();
	
	private ServiceRegistration sr = null;
	
	public static CallTimer callTimer = new CallTimer("call timer");
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Start call impl...");
		CallHandlerImpl callHandler = new CallHandlerImpl();
		sr = context.registerService(CallHandler.class.getName(), callHandler, null);
		
		AMIClient[] clients = AMICore.getInstance().getAMIClients();
		for(int i=0;i<clients.length;i++){
			if(!clients[i].getId().startsWith("gateway")) {
				AstEventHandler handler = new AstEventHandler(clients[i].getId());
				clients[i].addEventListener(handler, 255);
				clients[i].addResponseListener(handler);
				if(clients[i].isAuthenticated()){
					handler.querySIPPeerStatus();
					handler.queryQueueStatus();
				}
				handler.setHandlerStartTime(System.currentTimeMillis());
				eventHandlers.put(clients[i].getId(), handler);
			}
		}
		AMICore.getInstance().addAMIListener(this);
		ScanListener.getInstance().addQueueScanListener(Scanner.getInstance());
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		sr.unregister();
		AMICore.getInstance().removeAMIListener(this);
		AMIClient[] clients = AMICore.getInstance().getAMIClients();
		for(int i=0;i<clients.length;i++){
			AstEventHandler handler = eventHandlers.get(clients[i].getId());
			if(handler != null){
				clients[i].removeEventListener(handler);
				clients[i].removeResponseListener(handler);
				handler.destruct();
			}
		}
		eventHandlers.clear();
		try{
			callTimer.cancel();
			callTimer = null;
		} catch (Exception e){
			
		}

		ScanListener.getInstance().removeQueueScanListener(Scanner.getInstance());
	}

	@Override
	public void asteriskConnected(AMIClient client) {
		try{
			if(client.getId().startsWith("gateway"))
				return;
			AstEventHandler handler = eventHandlers.get(client.getId());
			if(handler == null){
				handler = new AstEventHandler(client.getId());
				eventHandlers.put(client.getId(), handler);
			} 
			client.addEventListener(handler, 255);
			client.addResponseListener(handler);
			handler.querySIPPeerStatus();
			handler.queryQueueStatus();
		} catch (Exception e){
			
		}
	}

	@Override
	public void asteriskDisonnected(AMIClient client) {
		AstEventHandler handler = eventHandlers.get(client.getId());
		if(handler != null){
			handler.clear();
		}
	}

	@Override
	public void asteriskReloaded(AMIClient client) {
		// TODO Auto-generated method stub
		
	}

}
