package com.m7.cc.asterisk.cdr.server;

import java.io.File;
import java.io.IOException;

import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;

public class CdrServerConfig {
	public final static String SERVER = "server";
	public final static String DATABASE = "database";
	public final static String DBDriver = "driver";
	public final static String DB_USER = "user";
	public final static String DB_PASSWORD = "password";
	public final static String LOG_LEVEL = "log.level";
	public final static String LOG_CONSOLE = "log.console";
	public final static String LOG_DIR = "log.dir";
	public final static String PORT = "port";
	public final static String PBX = "pbx";
//	public final static String ACCOUNT = "account";
	public final static String QUEUE = "queue";
	public final static String CDR_USER = "cdr.user";
	public final static String CDR_PASSWORD = "cdr.password";
	
	private ConfigProvider confProvider;
	private Configure config;
	private String confFile;
	
	private String port;
	private ConfPeer serverPeer;
	private String logLevel = "INFO";
	private boolean logConsole = false;
	private String logDir = "./log/";
	private static CdrServerConfig instance = null;
	
	private CdrServerConfig(){
		confProvider = new ConfigProvider();
		confFile = "server.conf";
		instance = this;
	}
	
	public static CdrServerConfig getInstance(){
		if(instance == null) {
			new CdrServerConfig();
		}
		return instance;
	}
	
	public boolean loadConfig() {
		
		//Check configure file
		if (confFile == null || confFile.equalsIgnoreCase("")) {
			System.out.println("Can not load configure file, it is null");
			return false;
		}

		File file = new File(confFile);
		if(!file.exists()){
			System.out.println("Can not find configure file ["+confFile+"].");
			return false;
		}
		
		if(!file.canRead()){
			System.out.println("Can not read configure file ["+confFile+"].");
			return false;
		}
		
		System.out.println("Load configuration from ["+confFile+"]");
		//Start loading
		try {
			config = confProvider.parser(confFile);
			updateConfig();
		} catch (ConfigureParserException e) {
			e.printStackTrace();
			return false;
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
	private void updateConfig() throws Exception{
		serverPeer = config.getPeer(SERVER);
		if(serverPeer == null)
			throw new Exception("Can not find peer [server]");
		port = serverPeer.getParam(PORT);
		logLevel = serverPeer.getParam(LOG_LEVEL);
		if(serverPeer.contain(LOG_DIR))
			logDir = serverPeer.getParam(LOG_DIR);
		logConsole = serverPeer.getParam(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		
	}

	public String getLogDir() {
		return logDir;
	}

	public boolean isLogConsole() {
		return logConsole;
	}

	public String getPort() {
		return port;
	}

	public String getLogLevel() {
		return logLevel;
	}
	
	public String getVar(String key) {
		return serverPeer.getParam(key);
	}
}
