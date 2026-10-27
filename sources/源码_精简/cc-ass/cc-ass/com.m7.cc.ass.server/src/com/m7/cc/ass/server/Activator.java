package com.m7.cc.ass.server;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import com.m7.cc.ass.server.core.AsteriskStatusServer;
import com.m7.cc.ass.server.handler.core.C5Handler;

public class Activator implements BundleActivator {

	public static BundleContext context;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting ass...");
		Activator.context = context;
		new AsteriskStatusServer();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		Activator.context = null;
	}
	
	public static C5Handler getHandler() throws Exception {
		ServiceReference sr = context.getServiceReference(C5Handler.class.getName());
		if(sr == null)
			throw new Exception("Service reference not found for ["+C5Handler.class.getName()+"]");
		Object handler = context.getService(sr);
		if(handler == null){
			throw new Exception("Service not found for ["+C5Handler.class.getName()+"]");
		}
		return (C5Handler) handler;
	}

	public static C5Handler getHandler(String type) throws Exception {
		ServiceReference sr = context.getServiceReference(C5Handler.class.getName()+"."+type);
		if(sr == null)
			throw new Exception("Service reference not found for ["+C5Handler.class.getName()+"."+type+"]");
		Object handler = context.getService(sr);
		if(handler == null){
			throw new Exception("Service not found for ["+C5Handler.class.getName()+"."+type+"]");
		}
		return (C5Handler) handler;
	}
}
