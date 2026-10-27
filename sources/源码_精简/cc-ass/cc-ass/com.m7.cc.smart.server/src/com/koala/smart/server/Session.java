package com.koala.smart.server;

import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.config.ServerConfig;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.koala.smart.server.reactor.Connection;

/**
 * Session is a process of comunication between a client and server. This class
 * support transferring String, Object, byte[] between client and server, but
 * only one kind of data can be used for one seesion.
 * 
 * @author caif
 * 
 */
public class Session {

	protected String id;

	public Vector<byte[]> toSendData;
	protected Vector<byte[]> receivedData;
	protected Vector<String> receivedString;
	protected SmartServer server;
	protected InetAddress hostAddress;
	protected String ip;
	protected int port;

	protected boolean isClosing = false;
	protected boolean isReading = false;

	protected long latestUpdateTime = 0;
	protected long timeout = 0;
	protected TimeoutTask timeoutTask = null;
	
	private Connection connection;

	static final Logger logger = Logger.getLogger(Session.class.getName());

	public Session(SmartServer server) {
		this.server = server;
		toSendData = new Vector<byte[]>();
		
		if (server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.STRING)) {
			receivedString = new Vector<String>();
		} else if (server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.BYTE)) {
			receivedData = new Vector<byte[]>();
		}
		latestUpdateTime = System.currentTimeMillis();
		timeout = server.getServerConfig().getTimeout() * 1000;
		if (!server.getServerConfig().isPoolSession())
			init();
	}
	
	public void setConnection(Connection connection){
		this.connection = connection;
		connection.setSession(this);
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public InetAddress getHostAddress() {
		return hostAddress;
	}

	public void setHostAddress(InetAddress hostAddress) {
		this.hostAddress = hostAddress;
		ip = hostAddress.getHostAddress();
	}

	public String getIp() {
		return ip;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

	public void read(byte[] data) {
		if (isClosing || !server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.BYTE))
			return;

		updateCommunicationTime();
		server.getDataHandler().handleByte(this, data);
	}
	
	public void read(String data){
		if (isClosing || !server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.STRING))
			return;

		updateCommunicationTime();
			server.getDataHandler().handleString(this, data);
	}

	public void resumeRead() {
	}

	private void handleData() {
		if (isClosing) {
			isReading = false;
			return;
		}
		if (server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.STRING)) {
			String data = null;
			while (true) {
				synchronized (receivedString) {
					if (receivedString.size() == 0) {
						isReading = false;
						return;
					}
					data = receivedString.remove(0);
				}

				if (data == null) {
					isReading = false;
					return;
				}
				server.getDataHandler().handleString(this, data);
			}
		} else if (server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.BYTE)) {
			byte[] data = null;
			while (true) {
				synchronized (receivedData) {
					if (receivedData.size() == 0) {
						isReading = false;
						return;
					}
					data = receivedData.remove(0);
				}

				if (data == null) {
					isReading = false;
					return;
				}
				server.getDataHandler().handleByte(this, data);
			}
		}
		

	}

	/**
	 * This method is implemented by subclass of Session
	 */
	protected void sendData() {
		connection.resumeWrite();
	}

	public void newSession() {
		server.getSessionListener().newSession(this);
	}

	/**
	 * This method is called by other calsses when they find this session is
	 * disconnected. After call this method, it will call a Gandar to notify app
	 * about this event and then return this session to pool if it pooled, or
	 * destroy this session.
	 */
	public void close() {
		if (isClosing)
			return;
		isClosing = true;

		logger.fine("Session closed: " + id);
		
		try {
			if(server == null)
				return;
			server.removeSession(id);
			server.getSessionListener().sessionClosed(this);
			if(connection != null)
				connection.close();
			
			connection = null;
			destroy();
			
		} catch (Throwable e) {
			logger.log(Level.WARNING, "Remove session failed", e);
		}
	}
	
	public void lingerClose() {
		int a = 0;
		while(toSendData.size() > 0){
			try {
				Thread.sleep(200);
			} catch (InterruptedException e) {
				logger.log(Level.WARNING, "", e);
			}
			if(a == 5)
				break;
			a++;
		}
		close();
	}

	public void send(String data) throws AppException, SessionException{
		if (server.getServerConfig().getDataMode()
				.equalsIgnoreCase(ServerConfig.STRING)){
			try {
				byte[] data1 = data.getBytes(server.getServerConfig().getCharset());
				send(data1);
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
		} else {
			throw new AppException("Can not send string when the transfer mode is not String");
		}
	}
	
	/**
	 * Caller must make sure that the data he want to send it a complete package.
	 * @param data
	 * @throws AppException
	 * @throws SessionException
	 */
	public void send(byte[] data) throws AppException, SessionException {
//		System.out.println("["+id+"]send data: "+data.length);
		if (isClosing)
			throw new SessionException("The session is closing");

		if (!isClosing)
			synchronized (toSendData) {
				int size = data.length;
				int packetSize = server.getServerConfig().getPacketSize();
				int count = size / packetSize;
				for (int i = 0; i < count; i++) {
					byte[] packet = new byte[packetSize];
					System.arraycopy(data, packetSize * i, packet, 0,
							packet.length);
					toSendData.add(packet);
//					System.out.println("["+id+"]send packet: "+packet.length+" packets: "+toSendData.size());
				}
				int rest = size % packetSize;
				if (rest > 0) {
					byte[] packet = new byte[rest];
					System.arraycopy(data, packetSize * count, packet, 0,
							packet.length);
					toSendData.add(packet);
//					System.out.println("["+id+"]send packet: "+packet.length+" packets: "+toSendData.size());
				}
				sendData();
			}
	}

	public void clear() {
//		id = null;
		hostAddress = null;
		port = 0;

		if (server.getServerConfig().getTimeout() > 0 && timeoutTask != null) {
			timeoutTask.cancel();
			timeoutTask.close();
			timeoutTask = null;
			server.getTimer().purge();
		}

		synchronized (toSendData) {
			toSendData.clear();
		}
		
		if(receivedData != null){
			synchronized (receivedData) {
				receivedData.clear();
			}
		}
		
		if(receivedString != null){
			synchronized (receivedString) {
				receivedString.clear();
			}
		}
		
	}

	public void destroy() {
		clear();
		// bytePool = null;
		// receivedBuffers = null;
		server = null;
	}

	public void init() {
		isClosing = false;
		isReading = false;
		latestUpdateTime = System.currentTimeMillis();
		if (server.getServerConfig().getTimeout() > 0) {
			timeoutTask = new TimeoutTask(this);
			server.getTimer().schedule(timeoutTask, timeout, timeout);
		}
	}

	public void timeOut(long time) {
		if (server.getServerConfig().getTimeout() > 0 && timeoutTask != null) {
			timeoutTask.cancel();
			server.getTimer().purge();
			timeoutTask.close();
			timeoutTask = null;
		} else
			return;

		server.getSessionListener().sessionTimeout(this, time);
	}

	public boolean isClosed() {
		return isClosing;
	}

	private void updateCommunicationTime() {
		latestUpdateTime = System.currentTimeMillis();
	}

	public long getLatestUpdateTime() {
		return latestUpdateTime;
	}

	public long getTimeout() {
		return timeout;
	}
}
