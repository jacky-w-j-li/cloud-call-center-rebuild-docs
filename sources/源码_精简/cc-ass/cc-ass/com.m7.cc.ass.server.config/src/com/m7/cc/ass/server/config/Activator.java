package com.m7.cc.ass.server.config;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import com.m7.cc.ass.server.config.handler.core.C5ConfHandler;

public class Activator implements BundleActivator {
	
	public static BundleContext context;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting ACS...");
		Activator.context = context;
		new ACServer();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		//TODO Aman zhai. we need to stop acs server
		ACServer.getInstance().stopACServer();
	}
	
	public static C5ConfHandler getHandler() throws Exception {
		ServiceReference sr = context.getServiceReference(C5ConfHandler.class.getName());
		if(sr == null)
			throw new Exception("Service reference not found for ["+C5ConfHandler.class.getName()+"]");
		Object handler = context.getService(sr);
		if(handler == null){
			throw new Exception("Service not found for ["+C5ConfHandler.class.getName()+"]");
		}
		return (C5ConfHandler) handler;
	}

}
