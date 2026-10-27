package com.m7.cc.ass.server.dispatcher;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.server.dispatcher.server.EventDispatcher;
import com.m7.cc.ass.server.dispatcher.server.EventDispatcherResend;
import com.m7.cc.ass.server.dispatcher.server.QiniuMonitorDispatcherServer;

public class DispatcherActivator implements BundleActivator {

	private EventDispatcher dispatcher;
	private EventDispatcherResend dispatcherResend;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		dispatcher = new EventDispatcher();
		dispatcher.start();
		dispatcherResend = new EventDispatcherResend();
		if(ASConfig.getInstance().getQiniupPushFile().equals("yes")){
			QiniuMonitorDispatcherServer.getInstance().start();			
		}
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		dispatcher.stop();
	}

}
