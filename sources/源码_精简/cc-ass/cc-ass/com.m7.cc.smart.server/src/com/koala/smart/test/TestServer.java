package com.koala.smart.test;

import com.koala.smart.server.SmartServer;
import com.koala.smart.server.exception.AppException;

public class TestServer {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		SmartServer server = new SmartServer("smart.conf");
		Handler handler = new Handler();
		try {
			server.addSessionListener(handler);
			server.setByteHandler(handler);
		} catch (AppException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		try {
			server.startServer();
//			server.getServerConfig().getGandarPoolConfig().setMaxActive(3);
//			server.getServerConfig().getGandarPoolConfig().setMaxIdle(3);
//			server.getServerConfig().getGandarPoolConfig().setMinIdle(1);
//			server.getServerConfig().setMaxConnectionMsg("Too many connections");
//			server.getServerConfig().setTimeoutMsg("time out");
//			server.getConfigManager().saveConfig();
			
		} catch (AppException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

}
