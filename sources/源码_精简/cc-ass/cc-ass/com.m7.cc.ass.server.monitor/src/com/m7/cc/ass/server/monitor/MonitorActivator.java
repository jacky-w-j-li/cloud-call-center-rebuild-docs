package com.m7.cc.ass.server.monitor;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

import com.m7.cc.ass.server.monitor.server.MonitorServer;
import com.m7.cc.ass.server.monitor.server.http.MonitorHttpServer;
import com.m7.cc.ass.server.monitor.server.tcp.MonitorTCPServer;

public class MonitorActivator implements BundleActivator {

	private MonitorServer server;
	private MonitorTCPServer tcpServer;
	private MonitorHttpServer httpServer;
	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#start(org.osgi.framework.BundleContext)
	 */
	public void start(BundleContext context) throws Exception {
		server = new MonitorServer();
		tcpServer = new MonitorTCPServer();
		try{
			httpServer = new MonitorHttpServer();
		} catch (Exception e){
			e.printStackTrace();
		}
		
	}

	/*
	 * (non-Javadoc)
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	public void stop(BundleContext context) throws Exception {
		server.stop();
		tcpServer.stop();
		httpServer.stop();
	}

}
