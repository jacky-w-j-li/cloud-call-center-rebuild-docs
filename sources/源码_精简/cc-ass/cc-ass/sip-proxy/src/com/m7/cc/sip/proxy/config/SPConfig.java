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
	public final static String ASTERISK_IP = "asterisk.ip";
	public final static String ASTERISK_PORT = "asterisk.port";
	public final static String KAMAILIO_IP = "kamailio.ip";
	public final static String KAMAILIO_PORT = "kamailio.port";
	public final static String RTP_PORT = "rtp.port";
	public final static String RTP_ENCRYPT = "rtp.encrypt";
	public final static String ENCRYPT_KEY = "encrypt.key";
	public final static String MEDIA_IP = "media.ip";
	
	private String confFile = "proxy.conf";
	
	private static SPConfig instance = null;
	
	public String ip = "127.0.0.1";
	public int port = 6070;
	
	public String logLevel = "INFO";
	public boolean logConsole = false;
	public String logDir = "./log";
	
	public String astIp = "127.0.0.1";
	public int astPort = 5060;
	public String kIP = "127.0.0.1";
	public int kPort = 5061;
	public String mediaIP = "127.0.0.1";
	
	public boolean encryptRTP = false;
	public int rtpPort = 20000;
	
	public String encryptKey = "1";
	
	private ConfigProvider confProvider;
	private Configure config;
	
	private ConfPeer serverPeer = null;
	
	private SPConfig(){
		instance = this;
		confProvider = new ConfigProvider();
		loadConfig();
		System.out.println("asterisk: "+astIp+":"+astPort+"\nkamailio: "+kIP+":"+kPort);
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
		if(serverPeer.contain(ASTERISK_IP))
			astIp = serverPeer.getParam(ASTERISK_IP);
		if(serverPeer.contain(ASTERISK_PORT))
			astPort = Integer.valueOf(serverPeer.getParam(ASTERISK_PORT));
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
		if(serverPeer.contain(KAMAILIO_IP))
			kIP = serverPeer.getParam(KAMAILIO_IP);
		if(serverPeer.contain(KAMAILIO_PORT)){
			kPort = Integer.valueOf(serverPeer.getParam(KAMAILIO_PORT));
		}
			
		if(serverPeer.contain(MEDIA_IP))
			mediaIP = serverPeer.getParam(MEDIA_IP);
	}
}
