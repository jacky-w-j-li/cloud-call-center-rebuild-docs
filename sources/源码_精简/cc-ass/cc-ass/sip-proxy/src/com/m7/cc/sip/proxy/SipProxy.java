package com.m7.cc.sip.proxy;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.rtp.RtpProxy;
import com.m7.cc.sip.proxy.config.SPConfig;
import com.m7.cc.util.log.IceLogger;

public class SipProxy implements Runnable {
	static DatagramSocket socket = null;
	public static final int MAX_DATAGRAM_SIZE = 8 * 1024;
	private static Logger log = Logger.getLogger(SipProxy.class.getName());

	public static void main(String[] a) {
		SPConfig.getInstance();
		IceLogger.initLogger(SPConfig.getInstance().logDir, "sipPorxy",
				SPConfig.getInstance().logLevel,
				SPConfig.getInstance().logConsole);
		SipProxy proxy = new SipProxy();

		try {
			InetSocketAddress add = new InetSocketAddress(
					SPConfig.getInstance().ip, SPConfig.getInstance().port);
			socket = new DatagramSocket(add);
			socket.setReceiveBufferSize(MAX_DATAGRAM_SIZE);
		} catch (SocketException e) {
			log.log(Level.WARNING, "", e);
		}
		Thread t = new Thread(proxy);
		t.start();
	}

	public void run() {
		if (socket == null) {
			return;
		}

		byte[] receiveData = new byte[MAX_DATAGRAM_SIZE];
		DatagramPacket packet = new DatagramPacket(receiveData,
				receiveData.length);

		while (true && socket != null) {
			try {
				packet.setLength(MAX_DATAGRAM_SIZE);
				socket.receive(packet);

				int packetLength = packet.getLength();
				// Read bytes and put it in a eueue.
				byte[] bytes = packet.getData();
				byte[] msgBytes = new byte[packetLength];
				System.arraycopy(bytes, 0, msgBytes, 0, packetLength);

				String fromIp = packet.getAddress().getHostAddress();
				int fromPort = packet.getPort();
				String rc4Message = new String(msgBytes, "UTF-8");
				log.info("Get Message: " + fromIp + ":" + fromPort
						+ "-----------------\r\n" + rc4Message + "\r\n");
				SipMessage sip = new SipMessage();
				sip.paser(rc4Message);
				// message from asterisk, encrypt it and send to client
				if (fromIp.equals(SPConfig.getInstance().astIp) && fromPort == SPConfig.getInstance().astPort) {
					// SIP/2.0/UDP 10.8.103.42:5060;received=218.241.181.25
//					if (sip.getHeader("Via") != null) {
//						Via via = new Via(sip.getHeader("Via"));
//						via.setPort(SPConfig.getInstance().port);
//						sip.addHeader("Via", via.getString());
//					}
					if (sip.getHeader("Contact") != null) {
						Contact contact = new Contact(sip.getHeader("Contact"));
						contact.setPort(SPConfig.getInstance().port);
						sip.updateHeader("Contact", contact.getString());
					}
					sip.getSdp().setConnection_address(SPConfig.getInstance().mediaIP);
					InetSocketAddress add = new InetSocketAddress(SPConfig.getInstance().kIP, SPConfig.getInstance().kPort);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0, add);
					String strdata = sip.getSipMessage();
					byte[] d = strdata.getBytes("UTF-8");
					dp.setData(d);
					dp.setLength(d.length);
					log.info("Send to kamailio [" + SPConfig.getInstance().kIP + ":" + SPConfig.getInstance().kPort + "]: \r\n"
							+ strdata);
					socket.send(dp);
				}
				// message from kamailio, send to asterisk
				else if (fromIp.equals(SPConfig.getInstance().kIP) && fromPort == SPConfig.getInstance().kPort) {
					log.info("get message from kamailio");
					InetSocketAddress address = new InetSocketAddress(
							SPConfig.getInstance().astIp,
							SPConfig.getInstance().astPort);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0,
							address);
					String strdata = sip.getSipMessage();
					byte[] d = strdata.getBytes("UTF-8");
					dp.setData(d);
					dp.setLength(d.length);
					log.info("Send to asterisk ["
							+ SPConfig.getInstance().astIp + ":"
							+ SPConfig.getInstance().astPort + "]: \r\n"
							+ strdata);
					socket.send(dp);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			} finally {

			}
		}
	}

}
