package com.m7.cc.ass.call;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import com.m7.cc.ass.call.model.CallHandler;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.CallProvider;

public class Activator implements BundleActivator {
	
	public static BundleContext context;
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting call...");
		Activator.context = context;
		CallListener.getInstance();
		CallProvider.getInstance();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		Activator.context = null;
	}

	public static CallHandler getHandler() throws Exception {
		ServiceReference sr = context.getServiceReference(CallHandler.class.getName());
		if(sr == null)
			throw new Exception("Service reference not found for ["+CallHandler.class.getName()+"]");
		Object handler = context.getService(sr);
		if(handler == null){
			throw new Exception("Service not found for ["+CallHandler.class.getName()+"]");
		}
		return (CallHandler) handler;
	}
}
