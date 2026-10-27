package com.m7.cc.ass.recorder;

import java.util.Vector;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ass.config.ASConfig;

public class RcorderActivator implements BundleActivator {

	private Vector<RecorderRunner> runners = new Vector<RecorderRunner>();
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		System.out.println("Starting recorder handler....");
		String[] pbxs = ASConfig.getInstance().getPbxs();
		new RecorderHttpServer();
		
		for(int i=0;i<pbxs.length;i++){
			if(!pbxs[i].startsWith("gateway")){
				RecorderRunner runner = new RecorderRunner(pbxs[i]);
				runner.start();
				runners.add(runner);
			}
		}
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		RecorderHttpServer.getInstance().close();
		
		for(int i=0;i<runners.size();i++) {
			runners.get(i).close();
		}
		runners.clear();
		runners = null;
		System.out.println("Recorder runner stopped.");
	}

}
