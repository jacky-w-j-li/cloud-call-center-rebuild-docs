package com.koala.smart.server.config;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.Configure;

/**
 * This class identified all configure elements of Smart server.
 * 
 * @author caif
 *
 */
public class ServerConfig {
	public final static String ID = "Server";
	public final static String PROTOCOL = "Protocol";
	public final static String BANNER = "Banner";
	public final static String NAME = "Name";
	public final static String PORT = "Port";
	public final static String BIND_ADDR = "BindAddress";
	public final static String MAX_CONNECTION = "MaxConnection";
	public final static String TIMEOUT_MSG = "TimeoutMessage";
	public final static String TIMEOUT = "Timeout";
	public final static String DATA_MODE = "DataMode";
	public final static String BYTE = "byte";
	public final static String STRING = "string";
	public final static String CHARSET = "Charset";
	public final static String PACKET_SIZE = "PacketSize";
	public final static String DISPATCHER_NUM = "DispatcherNum";
	
	private SessionPoolConfig sessionPoolConfig;
	private GandarPoolConfig gandarPoolConfig;
	private BufferPoolConfig bufferPoolConfig;
	private SecurityConfig securityConfig;
	
	private ConfPeer serverPeer;
	
	private String protocol;
	private int packetSize = 2048;

	/**
	 * The data mode should be byte|string, ignore case
	 */
	private String dataMode = BYTE;
	private String charset = "UTF-8";
	
	private String serverBanner = "*cai zhi bin*";
	private String serverName = "Smart Server 1.0.0";
	private String timeoutMsg = "-ERR Timeout";
	private int port = 9876;	
	private String bindAddr = "0.0.0.0";
	private long maxConnection = -1;
	private int timeout = 1 * 60 * 1000; //1 min. socket timeout	
	private int dispatcherNum = 3;

	public ServerConfig(){
		sessionPoolConfig = new SessionPoolConfig();
		gandarPoolConfig = new GandarPoolConfig();
		bufferPoolConfig = new BufferPoolConfig();
		securityConfig = new SecurityConfig();
	}

	public void setConfig(Configure conf) throws ConfigException {
		
		serverPeer = conf.getPeer(ID);
		if(serverPeer != null)
			setServerConfig(serverPeer);
			
		ConfPeer session = conf.getPeer(SessionPoolConfig.ID);
		if(session != null)
			sessionPoolConfig.setPeer(session);
		
		ConfPeer buffer = conf.getPeer(BufferPoolConfig.ID);
		if(buffer != null)
			bufferPoolConfig.setPeer(buffer);
		
		ConfPeer gandar = conf.getPeer(GandarPoolConfig.ID);
		if(gandar != null)
			gandarPoolConfig.setPeer(gandar);
		
		ConfPeer security = conf.getPeer(SecurityConfig.ID);
		if(security != null)
			securityConfig.setPeer(security);
	}
	
	private void setServerConfig(ConfPeer peer) throws ConfigException{
		dataMode = peer.getParam(DATA_MODE);
		if(!dataMode.equalsIgnoreCase(STRING)
				&& dataMode.equalsIgnoreCase(BYTE))
			throw new ConfigException("Unknow data mode: "+dataMode);
		if(dataMode.equalsIgnoreCase(STRING)){
			if(peer.contain(CHARSET))
				charset = peer.getParam(CHARSET);
		}
		
		protocol = peer.getParam(PROTOCOL);
		if(peer.contain(PACKET_SIZE))
			packetSize = Integer.valueOf(peer.getParam(PACKET_SIZE)).intValue();
		serverBanner = peer.getParam(BANNER);
		serverName = peer.getParam(NAME);
		timeoutMsg = peer.getParam(TIMEOUT_MSG);
		port = Integer.valueOf(peer.getParam(PORT)).intValue();
		bindAddr = peer.getParam(BIND_ADDR);
		maxConnection = Integer.valueOf(peer.getParam(MAX_CONNECTION)).intValue();
		timeout = Integer.valueOf(peer.getParam(TIMEOUT)).intValue();
		if(peer.contain(DISPATCHER_NUM))
			dispatcherNum = Integer.valueOf(peer.getParam(DISPATCHER_NUM)).intValue();
	}

	public String getBindAddr() {
		return bindAddr;
	}

	public void setBindAddr(String bindAddr) {
		this.bindAddr = bindAddr;
		serverPeer.addParam(BIND_ADDR, bindAddr);
	}

	public long getMaxConnection() {
		return maxConnection;
	}

	public void setMaxConnection(long maxConnection) {
		this.maxConnection = maxConnection;
		serverPeer.addParam(MAX_CONNECTION, maxConnection+"");
	}

	public int getPort() {
		return port;
	}


	public void setPort(int port) {
		this.port = port;
		serverPeer.addParam(PORT, port+"");
	}


	public String getServerBanner() {
		return serverBanner;
	}


	public void setServerBanner(String serverBanner) {
		this.serverBanner = serverBanner;
		serverPeer.addParam(BANNER, serverBanner);
	}


	public String getServerName() {
		return serverName;
	}


	public void setServerName(String serverName) {
		this.serverName = serverName;
		serverPeer.addParam(NAME, serverName);
	}


	public int getTimeout() {
		return timeout;
	}


	public void setTimeout(int timeout) {
		this.timeout = timeout;
		serverPeer.addParam(TIMEOUT, timeout+"");
	}


	public String getTimeoutMsg() {
		return timeoutMsg;
	}


	public void setTimeoutMsg(String timeoutMsg) {
		this.timeoutMsg = timeoutMsg;
		serverPeer.addParam(TIMEOUT_MSG, timeoutMsg);
	}

	public String getProtocol() {
		return protocol;
	}

	public void setProtocol(String protocol) {
		this.protocol = protocol;
		serverPeer.addParam(PROTOCOL, protocol);
	}

	public boolean isPoolSession() {
		return sessionPoolConfig.isActive();
	}


	public boolean isPoolGandar() {
		return gandarPoolConfig.isActive();
	}


	public boolean isPoolBuffer() {
		return bufferPoolConfig.isActive();
	}
	
	public String getDataMode() {
		return dataMode;
	}

	public void setDataMode(String dataMode) {
		this.dataMode = dataMode;
		serverPeer.addParam(DATA_MODE, dataMode);
	}
	
	public SessionPoolConfig getSessionPoolConfig() {
		return sessionPoolConfig;
	}

	public GandarPoolConfig getGandarPoolConfig() {
		return gandarPoolConfig;
	}

	public BufferPoolConfig getBufferPoolConfig() {
		return bufferPoolConfig;
	}
	
	public String getCharset() {
		return charset;
	}

	public void setCharset(String charset) {
		this.charset = charset;
		serverPeer.addParam(CHARSET, charset);
	}
	
	
	public int getPacketSize() {
		return packetSize;
	}

	public void setPacketSize(int packetSize) {
		this.packetSize = packetSize;
		serverPeer.addParam(PACKET_SIZE, packetSize+"");
	}
	
	public SecurityConfig getSecurityConfig() {
		return securityConfig;
	}

	
	public int getDispatcherNum() {
		return dispatcherNum;
	}

	public void setDispatcherNum(int dispatcherNum) {
		this.dispatcherNum = dispatcherNum;
		serverPeer.addParam(DISPATCHER_NUM, dispatcherNum+"");
	}
	
}
