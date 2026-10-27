package com.m7.mailServer;

import com.dishui.config.ConfPeer;
import com.dishui.config.ConfigProvider;
import com.dishui.config.Configure;
import com.dishui.config.ConfigureParserException;

import java.io.*;
import java.util.logging.Logger;

/**
 * 
 * @author caizhibin
 * 
 *         2012-3-14
 */
public class AppConfig {

	public final static String confFile = "server.conf";
	public final static String SERVER = "server";
	public final static String LOG_LEVEL = "log.level";
	public final static String LOG_CONSOLE = "log.console";
	public final static String LOG_DIR = "log.dir";
	public final static String HTTP_TIMEOUT = "http.timeout";
	public final static String WEIBO_HTTP_PORT = "service.http.port";

	//clog
	public final static String CLOG_HOST = "clog.host";
	public final static String CLOG_TIMEOUT = "clog.timeout";
	public final static String CLOG_BASELOGFIELDS = "clog.baseLogFields";



    private ConfigProvider confProvider;
	private Configure config;
	private ConfPeer serverPeer;

	private String logLevel = "INFO";
	private boolean logConsole = false;
	private String logDir = "./log";

	private int httpPort = 8000;
	private int httpTimeout = 40;
	private String dbIP = "127.0.0.1";
	private int dbPort = 27017;
    private boolean dbCluster = false;

	public static String serverName = "7moor mail Server";
	public static String version = "1.0.0";

	//clog
	private String clogHost = null;
	private int clogTimeout = 5000;
	private String clogBaseLogFields = "source=mail-server";

	private static AppConfig instance;

	private static Logger log = Logger.getLogger(AppConfig.class.getName());

	private AppConfig(String file) {
		instance = this;
		confProvider = new ConfigProvider();
        loadConfig();
		Thread t = new Thread("update config") {
			public void run() {
				while (true) {
					loadConfig();
					try {
						sleep(60000);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
				}
			}
		};
		t.start();

	}

	public static AppConfig getInstance() {
		if (instance == null)
			new AppConfig(confFile);
		return instance;
	}


	/**
	 * Load configuration from configure file. And then set them into
	 * ServerConfig.
	 * 
	 * @return boolean return the loading and parser result.
	 */
	private boolean loadConfig() {
		System.out.println("Loading [" + confFile + "]");
		// Check configure file
		if (confFile == null || confFile.equalsIgnoreCase("")) {
			System.out.println("Can not load configure file, it is null");
			return false;
		}

		File file = new File(confFile);
		if (!file.exists()) {
			System.out.println("Can not find configure file [" + confFile
					+ "].");
			return false;
		}

		if (!file.canRead()) {
			System.out.println("Can not read configure file [" + confFile
					+ "].");
			return false;
		}

		System.out.println("Load configuration from [" + confFile + "]");
		// Start loading
		try {
			updateConfig();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	private void updateConfig() throws Exception {
		config = confProvider.parser(confFile);
		serverPeer = config.getPeer(SERVER);
		if (serverPeer == null)
			throw new Exception("Can not find peer [server]");
		if (serverPeer.contain(LOG_LEVEL))
			logLevel = serverPeer.getParam(LOG_LEVEL);
		if (serverPeer.contain(LOG_CONSOLE))
			logConsole = serverPeer.getParam(LOG_CONSOLE).equalsIgnoreCase(
					"yes") ? true : false;
		if (serverPeer.contain(LOG_DIR))
			logDir = serverPeer.getParam(LOG_DIR);
		if (serverPeer.contain(WEIBO_HTTP_PORT))
			httpPort = Integer.valueOf(serverPeer.getParam(WEIBO_HTTP_PORT));
		if (serverPeer.contain(HTTP_TIMEOUT))
			httpTimeout = Integer.valueOf(serverPeer.getParam(HTTP_TIMEOUT));

		//clog
		if(serverPeer.contain(CLOG_HOST)){
			clogHost = serverPeer.getParam(CLOG_HOST);
		}
		if(serverPeer.contain(CLOG_TIMEOUT)){
			clogTimeout = Integer.parseInt(serverPeer.getParam(CLOG_TIMEOUT));
		}
		if(serverPeer.contain(CLOG_BASELOGFIELDS)){
			clogBaseLogFields = serverPeer.getParam(CLOG_BASELOGFIELDS);
		}
	}

	public boolean reload() throws Exception {
		this.updateConfig();
		return true;
	}

	/**
	 * Save the configuration of Smart Server
	 * 
	 * @return boolean true|false
	 */
	public boolean saveConfig() {
		try {
			confProvider.save(config);
		} catch (ConfigureParserException e) {
			e.printStackTrace();
			return false;
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public void addPeer(ConfPeer peer) {
		if (config.getPeer(peer.getName()) != null)
			return;
		config.addPeer(peer);
		saveConfig();
	}

	public String getLogLevel() {
		return logLevel;
	}

	public void setLogLevel(String logLevel) {
		this.logLevel = logLevel;
		serverPeer.addParam(LOG_LEVEL, logLevel);
	}

	public boolean isLogConsole() {
		return logConsole;
	}

	public void setLogConsole(boolean logConsole) {
		this.logConsole = logConsole;
		serverPeer.addParam(LOG_CONSOLE, logConsole ? "yes" : "no");
	}

	public String getLogDir() {
		return this.logDir;
	}

	public int getHttpTimeout() {
		return httpTimeout;
	}

	public int getHttpPort() {
		return httpPort;
	}

	public String getDbIP() {
		return dbIP;
	}

	public int getDbPort() {
		return dbPort;
	}

    public boolean getDbCluster() {
        return dbCluster;
    }

	public String getVar(String key) {
		return serverPeer.getParam(key);
	}

	public void addVar(String key, String value) {
		serverPeer.addParam(key, value);
	}

	//clog
	public String getClogHost() {
		return clogHost;
	}

	public int getClogTimeout() {
		return clogTimeout;
	}

	public String getClogBaseLogFields() {
		return clogBaseLogFields;
	}

}
