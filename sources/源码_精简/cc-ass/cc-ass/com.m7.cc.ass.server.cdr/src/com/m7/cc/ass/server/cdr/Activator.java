package com.m7.cc.ass.server.cdr;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ass.server.cdr.server.CDRServer;

public class Activator implements BundleActivator {
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting cdr server...");
		CDRServer.getInstance();
		CDRServer.getInstance().initHandler();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		CDRServer.getInstance().stop();
	}

}
