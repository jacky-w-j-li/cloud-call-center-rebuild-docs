package com.m7.cc.ass.server.handler.impl;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.server.handler.CoreHandler;
import com.m7.cc.ass.server.handler.LinkAutoToCallHandler;
import com.m7.cc.ass.server.handler.MailHandler;
import com.m7.cc.ass.server.handler.UCHandler;
import com.m7.cc.ass.server.handler.WebcallAsynchronousHandler;
import com.m7.cc.ass.server.handler.core.C5Handler;

public class Activator implements BundleActivator {

	private ServiceRegistration sr = null;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		CoreHandler handler = new CoreHandler();
		sr = context.registerService(C5Handler.class.getName(), handler, null);
		UCHandler uc = new UCHandler();
		uc.initUcHandler();
		MailHandler mh = new MailHandler();
		mh.initMailHandler();
		LinkAutoToCallHandler latch = new LinkAutoToCallHandler();
		latch.initLinkAutoToCallHandler();
		
		WebcallAsynchronousHandler webcallasy = new WebcallAsynchronousHandler();
		CallListener.getInstance().addOriginateListener("ALL", webcallasy);
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
