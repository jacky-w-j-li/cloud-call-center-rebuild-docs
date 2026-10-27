package com.m7.cc.ass.model.core;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5LisenceHandler;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.notify.service.NotifyListener;

public class Activator implements BundleActivator {

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting ass core model...");
		String[] pbxs = ASConfig.getInstance().getPbxs();
		
		
		
		for(int i=0;i<pbxs.length;i++){
			if(!pbxs[i].startsWith("gateway"))
				RuntimeData.getInstance().addPbx(pbxs[i]);
		}
		
		Thread t = new Thread("update lisence") {
			public void run() {
				C5LisenceHandler.updateLisence();
			}
		};
		t.start();
		
		//Aman zhai
		RuntimeData.getInstance().loadC5EventInterfaces();
		NotifyListener.getInstance();
			
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
	
	}

}
