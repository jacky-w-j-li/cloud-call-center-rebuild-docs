package com.m7.cc.ass.gateway;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ami.service.AMISystemListener;
import com.m7.cc.ass.gateway.cdr.GWCdrServer;
import com.m7.cc.ass.gateway.config.GWServer;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;

public class GateWayActivator implements BundleActivator, AMISystemListener {

	private static EventHandler handler = null;
	private static AstDownHanlder astDownHanlder = null;
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		AMIClient[] clients = AMICore.getInstance().getAMIClients();
		boolean start = false;
		for(int i=0;i<clients.length;i++){
			if(clients[i].getId().startsWith("gateway")) {
				handler = new EventHandler(clients[i].getId());
				astDownHanlder = new AstDownHanlder(clients[i].getId(), handler);
				clients[i].addEventListener(handler, 255);
				clients[i].addResponseListener(handler);
				clients[i].addAsteriskSysListener(astDownHanlder);
				start = true;
//				break;
			}
		}
		if(start) {
			GWRuntimeData.getInstance();
			
			AMICore.getInstance().addAMIListener(this);
			
			GWCdrServer.getInstance().initHandler();
			
			GWServer.getInstance();
		}
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		handler.close();
		handler = null;
		AMICore.getInstance().removeAMIListener(this);
	}

	@Override
	public void asteriskConnected(AMIClient client) {
		if(client.getId().startsWith("gateway")) {
			handler = new EventHandler(client.getId());
			client.addEventListener(handler, 255);
			client.addResponseListener(handler);
			astDownHanlder = new AstDownHanlder(client.getId(), handler);
			client.addAsteriskSysListener(astDownHanlder);
		}
	}

	@Override
	public void asteriskDisonnected(AMIClient client) {
		if(handler != null){
			handler.clear();
		}
	}

	@Override
	public void asteriskReloaded(AMIClient client) {
		// TODO Auto-generated method stub
		
	}

	public static EventHandler getHandler() {
		return handler;
	}

	
}
