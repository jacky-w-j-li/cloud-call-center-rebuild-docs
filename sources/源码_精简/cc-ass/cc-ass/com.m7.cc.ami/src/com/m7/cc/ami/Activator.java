package com.m7.cc.ami;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;

public class Activator implements BundleActivator {

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting ami...");
		AMICore.getInstance().initAMIClient(ASConfig.getInstance().getAmiContacts());
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		AMICore.getInstance().destruct();
		System.out.println("Stop ami...");
	}

}
