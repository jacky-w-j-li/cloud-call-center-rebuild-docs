package com.m7.cc.rtp;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.sip.proxy.RC4;
import com.m7.cc.sip.proxy.config.SPConfig;

public class RtpProxy implements Runnable{
	
	public static final int MAX_DATAGRAM_SIZE = 8 * 1024;
	
	public static int port = SPConfig.getInstance().rtpPort;
	
	private int listenPort = 20000;
	
	private DatagramSocket socket = null;
	
	private String callID;
	
	private String agentIp = "192.168.0.1";
	private int agentPort = 10000;
	
	private String astIp = "";
	private int astPort = 10000;
	
	private boolean running = true;
	private boolean started = false;
	
	private static Logger log = Logger.getLogger(RtpProxy.class.getName());
	
	public RtpProxy(String callID){
		this.callID = callID;
	}
	
	public void start(){
		if(port > SPConfig.getInstance().rtpPort+5000)
			port = SPConfig.getInstance().rtpPort;
		while(!started){
			try {
				listenPort = port;
				socket = new DatagramSocket(port);
				socket.setReceiveBufferSize(MAX_DATAGRAM_SIZE);
				started = true;
			} catch (Exception e) {
//				running = false;
//				socket.close();
//				socket = null;
				log.log(Level.WARNING, "------1-----", e);
			}
			port++;
		}
		Thread t = new Thread(this);
		t.start();
	}

	public String getAgentIp() {
		return agentIp;
	}

	public void setAgentIp(String agentIp) {
		this.agentIp = agentIp;
	}

	public int getAgentPort() {
		return agentPort;
	}

	public void setAgentPort(int agentPort) {
		this.agentPort = agentPort;
	}

	public String getAstIp() {
		return astIp;
	}

	public void setAstIp(String astIp) {
		this.astIp = astIp;
	}

	public int getAstPort() {
		return astPort;
	}

	public void setAstPort(int astPort) {
		this.astPort = astPort;
	}

	@Override
	public void run() {
		if (socket == null) {
			return;
		}

		byte[] receiveData = new byte[MAX_DATAGRAM_SIZE];
		DatagramPacket packet = new DatagramPacket(receiveData,
				receiveData.length);

		while (running && socket != null) {
			try {
				packet.setLength(MAX_DATAGRAM_SIZE);
				socket.receive(packet);

				int packetLength = packet.getLength();
				// Read bytes and put it in a queue.
				byte[] bytes = packet.getData();
				byte[] msgBytes = new byte[packetLength];
				System.arraycopy(bytes, 0, msgBytes, 0, packetLength);

				String fromIp = packet.getAddress().getHostAddress();
				int fromPort = packet.getPort();
				log.info("Get rtp from: "+fromIp+":"+fromPort+", length: "+packetLength);
				// message from asterisk, encrypt it and send to client
				if (fromIp.equals(astIp)) {
					InetSocketAddress add = new InetSocketAddress(agentIp, agentPort);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0, add);
					RC4 rc4 = new RC4(SPConfig.getInstance().encryptKey);
					byte[] data = rc4.rc4(msgBytes);
					dp.setData(data);
					dp.setLength(data.length);
					log.info("Send rtp to: "+agentIp+":"+agentPort);
					socket.send(dp);
					continue;
				}
				// message from client, dencrypt it and send to asterisk
				else {
					agentIp = fromIp;
					agentPort = fromPort;
					
					RC4 rc4 = new RC4(SPConfig.getInstance().encryptKey);
					byte[] data = rc4.rc4(msgBytes);

					InetSocketAddress address = new InetSocketAddress(
							astIp, astPort);
					DatagramPacket dp = new DatagramPacket(new byte[0], 0,
							address);
					dp.setData(data);
					dp.setLength(data.length);
					log.info("Send rtp to: "+astIp+":"+astPort);
					socket.send(dp);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "---------2---------", e);
			} finally {

			}
		}
	}
	
	public String getCallID() {
		return callID;
	}

	public int getListenPort() {
		return listenPort;
	}

	public void stop() {
		try{
			running = false;
			socket.close();
			socket = null;
		} catch (Exception e){
			log.log(Level.WARNING, "---------3---------", e);
		}
	}
	
}
