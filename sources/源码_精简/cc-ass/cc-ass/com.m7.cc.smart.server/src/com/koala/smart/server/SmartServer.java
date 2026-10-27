package com.koala.smart.server;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.logging.Logger;

import com.koala.smart.server.config.SSConfigManager;
import com.koala.smart.server.config.ServerConfig;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;
import com.koala.smart.server.pool.BufferPool;
import com.koala.smart.server.reactor.Accepter;
import com.koala.smart.server.reactor.Connection;
import com.m7.cc.util.Utils;

/**
 * Smart Server acts.
 * 
 * @author caif
 * @version 1.0.0
 */
public class SmartServer {
	private final static String VERSION = "1.0.0";
	private String serverBanner = "";
	private SSConfigManager configManager;

	private ServerConfig serverConfig;

	private boolean initiated = false;
	private DataListener byteHandler = null;
	private SessionListener sessionListener = null;

	private BufferPool bufferPool = null;

	private SmartTimer timer = null;

	private Hashtable<String, Session> sessions;

	/**
	 * TCP
	 */
	private Accepter accepter = null;

	private static final Logger logger = Logger.getLogger(SmartServer.class
			.getName());

	/**
	 * Init Smart Server from and read configuration infomations from a config
	 * file. If the config file is null or it can not be found/read, Smart
	 * Server will use default configure values.
	 * 
	 * @param confFile
	 */
	public SmartServer(String confFile) {
		logger.info("Loading SmartServer code v" + getVersion() + "......");
		configManager = new SSConfigManager();
		initServer(confFile);
	}

	private void initServer(String confFile) {
		if (!configManager.init(confFile)) {
			logger.warning("Load configuration failed, end server.");
			return;
		}
		serverConfig = configManager.getServerConfig();
		initiated = true;
	}

	public void startServer() throws AppException {
		if (!initiated) {
			throw new AppException("Smart server is not initiated");
		}
		logger.info("Starting " + getName());

		if (isClosed() == false) {
			logger.warning("Server " + getName() + " already running.");
			throw new AppException("Server " + getName() + " already running.");
		}

		if (serverBanner == null) {
			serverBanner = "\n---------------------------------------"
					+ "\n| Name : " + getName() + "" + "\n| Provider : "
					+ getBanner() + "" + "\n| Version : " + getVersion()
					+ "\n| Bind Address : " + getBindAddress() + "\n| Port : "
					+ getPort() + "\n---------------------------------------\n";
			logger.info(serverBanner);
		}

		createPool();

		createTimer();

		sessions = new Hashtable<String, Session>();
		try {
			startTCPServer();
		} catch (IOException e) {
			throw new AppException("Start TCP server failed: "
					+ e.getMessage());
		}
	}

	private void createTimer() {
		timer = new SmartTimer();
	}

	private void createPool() {
		if (serverConfig.isPoolBuffer()) {
			bufferPool = new BufferPool(this);
		}
	}

	private void startTCPServer() throws IOException {
		String name = serverConfig.getServerName() + "-"
				+ serverConfig.getBindAddr() + ":" + serverConfig.getPort()
				+ "[TCP]";
		logger.info("Start " + this.getName() + " in TCP mode: " + name);

		accepter = new Accepter(this, new InetSocketAddress(serverConfig
				.getBindAddr(), serverConfig.getPort()), name);
		accepter.startListen();
	}

	public void removeSession(String id) {
		if (id == null)
			return;
		if (sessions.containsKey(id))
			sessions.remove(id);
		// System.gc();
	}

	public boolean processNewSession(InetAddress host, int port,
			Connection connection) {
		// check for connection limit
		if (serverConfig.getMaxConnection() >= 0) {
			if (sessions.size() >= serverConfig.getMaxConnection()) {
				logger.warning(this.getName()
						+ " Too many connections, max connections: "
						+ serverConfig.getMaxConnection());
				if (connection != null)
					connection.close();
				return false;
			}
		}

		logger.info(this.getName() + " new connection ["
				+ host.getHostAddress() + ":" + port + "] current sessions["
				+ sessions.size() + "]");

		// check for security
		if (serverConfig.getSecurityConfig().isActive()) {
			if (serverConfig.getSecurityConfig().isDeclined(
					host.getHostAddress())) {
				logger.warning(this.getName()
						+ " A not permited IP is trying to connect: "
						+ host.getHostAddress());
				if (connection != null)
					connection.close();
				return false;
			}
		}

		String id = Utils.getUniqueid();
		Session session = new Session(this);
		session.setConnection(connection);
		session.setId(id);
		session.setHostAddress(host);
		session.setPort(port);
		sessions.put(session.getId(), session);
		session.newSession();
		return true;
	}

	/** Returns the version of the library. */
	public static final String getVersion() {
		return VERSION;
	}

	public static final float getVersionNo() {
		return getVersionNo(VERSION);
	}

	public String getName() {
		return serverConfig.getServerName();
	}

	public String getBanner() {
		return serverConfig.getServerBanner();
	}

	public String getBindAddress() {
		return serverConfig.getBindAddr();
	}

	public int getPort() {
		return serverConfig.getPort();
	}

	public static final float getVersionNo(String ver) {
		// String ver = getVersion();
		float version = 0;
		int i = ver.indexOf(" "); // check if beta
		if (i == -1)
			i = ver.length();
		ver = ver.substring(0, i);

		i = ver.indexOf("."); // check for sub version
		if (i != -1) {
			int j = ver.indexOf(".", i);
			if (j != -1) {
				ver = ver.substring(0, i) + "."
						+ MyString.replaceAll(ver.substring(i + 1), ".", "");
			}
		}

		try {
			version = Float.parseFloat(ver);
		} catch (NumberFormatException e) {
			throw new RuntimeException("Corrupt QuickServer");
		}
		return version;
	}

	public void destruct() {
		byteHandler = null;
		sessionListener = null;
		if (bufferPool != null)
			bufferPool.close();
		synchronized (sessions) {
			Iterator<Session> its = sessions.values().iterator();
			while (its.hasNext()) {
				its.next().destroy();
			}
			sessions.clear();
		}

		timer.cancel();
		if (accepter != null)
			accepter.close();
		// TODO destruct udp server
	}

	public boolean isClosed() {
		// if(serverSocket==null)
		// return true;
		// return serverSocket.isClosed();
		return true;
	}

	public void addSessionListener(SessionListener sessionListener)
			throws AppException {
		if (this.sessionListener != null)
			throw new AppException(
					"only one session listener can be setted per one smart server");
		this.sessionListener = sessionListener;
	}

	public void setByteHandler(DataListener byteHandler) throws AppException {
		if (this.byteHandler != null)
			throw new AppException(
					"only one ByteHandler can be setted per one smart server");
		this.byteHandler = byteHandler;
	}

	public DataListener getDataHandler() {
		return byteHandler;
	}

	public SessionListener getSessionListener() {
		return sessionListener;
	}

	public ServerConfig getServerConfig() {
		return serverConfig;
	}

	public BufferPool getBufferPool() {
		return bufferPool;
	}

	public SSConfigManager getConfigManager() {
		return configManager;
	}

	public SmartTimer getTimer() {
		return timer;
	}

	public Hashtable<String, Session> getSessions() {
		return sessions;
	}

	public Accepter getAccepter() {
		return accepter;
	}

}
