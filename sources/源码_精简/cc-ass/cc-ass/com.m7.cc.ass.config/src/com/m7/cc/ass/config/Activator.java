package com.m7.cc.ass.config;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.util.log.IceLogger;

public class Activator implements BundleActivator {

	private final static String logFile = "ass";
	
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting config...");
		IceLogger.initLogger(ASConfig.getInstance().getLogDir(),
				logFile, ASConfig.getInstance().getLogLevel(),
				ASConfig.getInstance().isLogConsole());
		CallRoute.loadRoute();
		AllBlackNums.loadAllBlackNums();
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
	}

}
