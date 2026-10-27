package com.m7.cc.ass.osgi;

import org.osgi.framework.BundleContext;

public class OsgiHandler{
	public static final int UNINSTALLED = 0x00000001;

	public static final int INSTALLED = 0x00000002;

	public static final int RESOLVED = 0x00000004;

	public static final int STARTING = 0x00000008;

	public static final int STOPPING = 0x00000010;

	public static final int ACTIVE = 0x00000020;
	
	public OsgiHandler(BundleContext context){
	}
	
//	@Override
//	public void bundleChanged(BundleEvent event) {
//		Bundle bundle = event.getBundle();
//		System.out.println(event.getType() + " " + bundle.getBundleId() + " "
//				+ bundle.getSymbolicName()+ bundle.getVersion() + " "
//				+ getStateString(bundle.getState()));
//	}

	public String getStateString(int state) {
		String a = "unknow";
		switch (state) {
		case UNINSTALLED:
			a = "UNINSTALLED";
			break;
		case INSTALLED:
			a = "INSTALLED";
			break;
		case RESOLVED:
			a = "RESOLVED";
			break;
		case STARTING:
			a = "STARTING";
			break;
		case STOPPING:
			a = "STOPPING";
			break;
		case ACTIVE:
			a = "ACTIVE";
			break;
		}
		return a;
	}

}
