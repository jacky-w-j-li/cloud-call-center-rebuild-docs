package com.m7.cc.sip.proxy;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.net.SocketException;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.rtp.RtpProxy;
import com.m7.cc.sip.proxy.config.SPConfig;
import com.m7.cc.util.log.IceLogger;

public class SipProxy implements Runnable {
	static DatagramSocket socket = null;
	public static final int MAX_DATAGRAM_SIZE = 8 * 1024;

	private static Logger log = Logger.getLogger(SipProxy.class.getName());

	private Hashtable<String, RtpProxy> calls = new Hashtable<String, RtpProxy>();

	public static void main(String[] a) {
		SPConfig.getInstance();
		IceLogger.initLogger(SPConfig.getInstance().logDir, "sipPorxy",
				SPConfig.getInstance().logLevel,
				SPConfig.getInstance().logConsole);
		SipProxy proxy = new SipProxy();

		try {
			InetSocketAddress add = new InetSocketAddress(SPConfig
					.getInstance().ip, SPConfig.getInstance().port);
			socket = new DatagramSocket(add);
			socket.setReceiveBufferSize(MAX_DATAGRAM_SIZE);
		} catch (SocketException e) {
			log.log(Level.WARNING, "", e);
		}
		Thread t = new Thread(proxy);
		t.start();
		//if open ping Function.
		if(SPConfig.getInstance().ping){
			PingProvider pingProvider = new PingProvider(socket); 
			Thread p = new Thread(pingProvider);
			p.start();			
		}
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
				//if the packet is ping.
				String pingStr = new String(msgBytes, "UTF-8");
				if(pingStr.equalsIgnoreCase("c5ping")){
					SPConfig.getInstance().eip = fromIp;
					SPConfig.getInstance().eport = packet.getPort();
					continue;
				}
				
				// message from gateway, encrypt it and send to client
				if (fromIp.equals(SPConfig.getInstance().gip)) {
					String rc4Message = new String(msgBytes, "UTF-8");
					log.info("From asterisk: " + fromIp
							+ "-----------------\r\n" + rc4Message + "\r\n");
					rc4Message = rc4Message.replaceAll(SPConfig
							.getInstance().ip+":"+SPConfig
							.getInstance().port, SPConfig
							.getInstance().eip+":"+SPConfig
							.getInstance().eport);
					SipMessage sip = new SipMessage();
					sip.paser(rc4Message);
					if (SPConfig.getInstance().encryptRTP) {
						if (sip.getRequest().startsWith("INVITE")) {
							addCall(sip, true);
						} else if (sip.getRequest()
								.startsWith("SIP/2.0 200 OK")) {
							updateCall(sip, true);
						} else if (sip.getRequest().startsWith("SIP/2.0 4")) {
							endCall(sip);
						} else if (sip.getRequest().startsWith("SIP/2.0 5")) {
							endCall(sip);
						} else if (sip.getRequest().startsWith("BYE")
								|| sip.getRequest().startsWith("CANCEL")) {
							endCall(sip);
						}
					}

					if (sip.getHeader("Via") != null) {
						Via via = new Via(sip.getHeader("Via"));
						via.setIp(SPConfig.getInstance().ip);
						via.setPort(SPConfig.getInstance().port);
						sip.addHeader("Via", via.getString());
					}

					InetSocketAddress add = new InetSocketAddress(SPConfig
							.getInstance().eip, SPConfig.getInstance().eport);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0, add);
					String strdata = sip.getSipMessage();
					strdata = strdata.replaceAll(SPConfig
							.getInstance().gip+":"+SPConfig
							.getInstance().gport, SPConfig
							.getInstance().ip+":"+SPConfig
							.getInstance().port);
					byte[] d = strdata.getBytes("UTF-8");
					RC4 rc4 = new RC4(SPConfig.getInstance().encryptKey);
					byte[] data = rc4.rc4(d);
					dp.setData(data);
					dp.setLength(data.length);
					log.info("Send to [" + SPConfig
							.getInstance().eip + ":" + SPConfig.getInstance().eport + "]: \r\n"
							+ strdata);
					socket.send(dp);
					continue;
				}
				// message from client, dencrypt it and send to gateway
				else {
					String rc4Message = new String(msgBytes, "UTF-8");
					String sipMessage = rc4Message;
					if (rc4Message.length() == 4) {
						continue;
					} else {
						RC4 rc4 = new RC4(SPConfig.getInstance().encryptKey);
						byte[] data = rc4.rc4(msgBytes);
						sipMessage = new String(data, "UTF-8");
						log
								.info("From client: " + fromIp
										+ "-----------------\r\n" + sipMessage
										+ "\r\n");
					}
					SipMessage sip = new SipMessage();
					sip.paser(sipMessage);
					if (SPConfig.getInstance().encryptRTP) {
						if (sip.getRequest().startsWith("INVITE")) {
							addCall(sip, false);
						} else if (sip.getRequest()
								.startsWith("SIP/2.0 200 OK")) {
							updateCall(sip, false);
						} else if (sip.getRequest().startsWith("SIP/2.0 4")) {
							endCall(sip);
						} else if (sip.getRequest().startsWith("SIP/2.0 5")) {
							endCall(sip);
						} else if (sip.getRequest().startsWith("BYE")
								|| sip.getRequest().startsWith("CANCEL")) {
							endCall(sip);
						}
					}
					InetSocketAddress address = new InetSocketAddress(SPConfig
							.getInstance().gip,
							SPConfig.getInstance().gport);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0,
							address);
					String strdata = sip.getSipMessage();
					byte[] d = strdata.getBytes("UTF-8");
					dp.setData(d);
					dp.setLength(d.length);
					log.info("Send to [" + SPConfig.getInstance().gip + ":"
							+ SPConfig.getInstance().gport + "]: \r\n"
							+ strdata); 
					socket.send(dp);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			} finally {

			}
		}
	}

	// INVITE
	private void addCall(SipMessage message, boolean fromG) {
		String callID = message.getHeader("Call-ID");
		if (callID == null)
			return;

		RtpProxy call = new RtpProxy(callID);
		call.start();
		// INVITE from asterisk
		if (fromG) {
			call.setAstIp(message.getSdp().getConnection_address());
			call.setAstPort(message.getSdp().getPort());
		}
		// INVITE from client
		else {
			call.setAgentIp(message.getSdp().getConnection_address());
			call.setAgentPort(message.getSdp().getPort());
		}
		message.getSdp().setConnection_address(SPConfig.getInstance().ip);
		message.getSdp().setPort(call.getListenPort());
		calls.put(callID, call);
	}

	// 200 ok
	private void updateCall(SipMessage message, boolean fromG) {
		String callID = message.getHeader("Call-ID");
		if (callID == null)
			return;
		RtpProxy call = calls.get(callID);
		if (call == null) {
			return;
		}
		// INVITE from asterisk
		if (fromG) {
			call.setAstIp(message.getSdp().getConnection_address());
			call.setAstPort(message.getSdp().getPort());
		}
		// INVITE from client
		else {
			call.setAgentIp(message.getSdp().getConnection_address());
			call.setAgentPort(message.getSdp().getPort());
		}
		message.getSdp().setConnection_address(SPConfig.getInstance().ip);
		message.getSdp().setPort(call.getListenPort());
	}

	private void endCall(SipMessage message) {
		String callID = message.getHeader("Call-ID");
		if (callID == null)
			return;
		RtpProxy call = calls.remove(callID);
		if (call != null) {
			call.stop();
		}
	}
}
