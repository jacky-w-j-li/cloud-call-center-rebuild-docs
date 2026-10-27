package com.m7.cc.sip.proxy.config;

import java.io.File;

import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;

public class SPConfig {
	
	public final static String SERVER = "server";
	public final static String IP = "ip";
	public final static String PORT = "port";
	public final static String LOG_LEVEL = "log.level";
	public final static String LOG_CONSOLE = "log.console";
	public final static String LOG_DIR = "log.dir";
	public final static String RTP_PORT = "rtp.port";
	public final static String RTP_ENCRYPT = "rtp.encrypt";
	public final static String ENCRYPT_KEY = "encrypt.key";
	public final static String PING = "ping";
	public final static String PINGCONTENT = "pingcontent";
	
	private String confFile = "proxy.conf";
	
	private static SPConfig instance = null;
	
	public boolean ping = false;
	public String pingcontent;
	public String ip = "127.0.0.1";
	public int port = 6070;
	
	public String logLevel = "INFO";
	public boolean logConsole = false;
	public String logDir = "./log";
	
	public boolean encryptRTP = false;
	public int rtpPort = 20000;
	
	public String encryptKey = "1";
	
	public String gip = "";
	public int gport = 5060;
	public String eip = "";
	public int eport = 5060;
	
	private ConfigProvider confProvider;
	private Configure config;
	
	private ConfPeer serverPeer = null;
	
	private SPConfig(){
		instance = this;
		confProvider = new ConfigProvider();
		loadConfig();
	}
	
	public static SPConfig getInstance(){
		if(instance == null) {
			new SPConfig();
		}
		return instance;
	}
	
	private boolean loadConfig() {
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
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
	private void updateConfig() throws Exception{
		serverPeer = config.getPeer("server");
		if(serverPeer == null)
			throw new Exception("Can not find peer [server]");
		if(serverPeer.contain(LOG_LEVEL))
			logLevel = serverPeer.getParam(LOG_LEVEL);
		if(serverPeer.contain(LOG_CONSOLE))
			logConsole = serverPeer.getParam(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		if(serverPeer.contain(LOG_DIR))
			logDir = serverPeer.getParam(LOG_DIR);
		if(serverPeer.contain(RTP_ENCRYPT))
			encryptRTP = serverPeer.getParam(RTP_ENCRYPT).equalsIgnoreCase("yes")?true:false;
		if(serverPeer.contain(RTP_PORT))
			rtpPort = Integer.valueOf(serverPeer.getParam(RTP_PORT));
		if(serverPeer.contain(PORT))
			port = Integer.valueOf(serverPeer.getParam(PORT));
		if(serverPeer.contain(IP))
			ip = serverPeer.getParam(IP);
		if(serverPeer.contain(ENCRYPT_KEY))
			encryptKey = serverPeer.getParam(ENCRYPT_KEY);
		if(serverPeer.contain("eip"))
			eip = serverPeer.getParam("eip");
		if(serverPeer.contain("gip"))
			gip = serverPeer.getParam("gip");
		if(serverPeer.contain("eport"))
			eport = Integer.valueOf(serverPeer.getParam("eport"));
		if(serverPeer.contain("gport"))
			gport = Integer.valueOf(serverPeer.getParam("gport"));
		if(serverPeer.contain(PING))
			ping = serverPeer.getParam(PING).equalsIgnoreCase("yes")?true:false;
		if(serverPeer.contain(PINGCONTENT))
			pingcontent = serverPeer.getParam(PINGCONTENT);
	}
}
