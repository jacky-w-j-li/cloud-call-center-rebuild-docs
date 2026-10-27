package com.m7.cc.agi;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import com.m7.cc.agi.handler.AgiHandler;
import com.m7.cc.asterisk.fastagi.AgiServer;

public class AgiActivator implements BundleActivator {

	private AgiServer agiServer;
	public static BundleContext context;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		agiServer = new AgiServer();
		AgiActivator.context = context;
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		agiServer.close();
		agiServer = null;
		AgiActivator.context = null;
	}

	public static AgiHandler getHandler() throws Exception {
		ServiceReference sr = context.getServiceReference(AgiHandler.class.getName());
		if(sr == null)
			throw new Exception("Service reference not found for ["+AgiHandler.class.getName()+"]");
		Object handler = context.getService(sr);
		if(handler == null){
			throw new Exception("Service not found for ["+AgiHandler.class.getName()+"]");
		}
		return (AgiHandler) handler;
	}
}
