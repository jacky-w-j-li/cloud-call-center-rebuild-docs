package com.m7.cc.ass.server.config.handler.impl;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.server.config.handler.CheckAutoDialTaskStatusThread;
import com.m7.cc.ass.server.config.handler.CoreHandler;
import com.m7.cc.ass.server.config.handler.core.C5ConfHandler;

public class Activator implements BundleActivator {

	private ServiceRegistration sr = null;
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		CoreHandler handler = new CoreHandler();
		sr = context.registerService(C5ConfHandler.class.getName(), handler, null);
		//start check autoDialTask thread
		CheckAutoDialTaskStatusThread checkTaskThread = new CheckAutoDialTaskStatusThread();
		checkTaskThread.start();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		sr.unregister();
		sr = null;
	}

}
