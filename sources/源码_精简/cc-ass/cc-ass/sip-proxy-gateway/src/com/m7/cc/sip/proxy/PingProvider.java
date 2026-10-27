package com.m7.cc.sip.proxy;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.net.SocketException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.sip.proxy.config.SPConfig;

public class PingProvider implements Runnable {
	static DatagramSocket socket = null;

	private static Logger log = Logger.getLogger(PingProvider.class.getName());

	public PingProvider(DatagramSocket socket1) {
		socket = socket1;
	}
	
	public void run() {
		if (socket == null) {
			return;
		}

		while (true && socket != null) {
			try {
				InetSocketAddress add = new InetSocketAddress(SPConfig
						.getInstance().eip, SPConfig.getInstance().eport);
				
				DatagramPacket dp = new DatagramPacket(new byte[0], 0, add);
				
				String strdata = SPConfig.getInstance().pingcontent;
				byte[] d = strdata.getBytes("UTF-8");
				dp.setData(d);
				dp.setLength(d.length);
				log.info("Ping to [" + SPConfig
						.getInstance().eip + ":" + SPConfig.getInstance().eport + "]: \r\n"
						+ strdata);
				socket.send(dp);
				Thread.sleep(5000);
				continue;
					
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				} 
		}
	}
}
