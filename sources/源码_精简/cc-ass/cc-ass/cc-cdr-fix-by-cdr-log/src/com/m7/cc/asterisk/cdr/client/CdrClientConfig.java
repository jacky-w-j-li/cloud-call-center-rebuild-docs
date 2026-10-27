package com.m7.cc.asterisk.cdr.client;

import java.io.File;
import java.io.IOException;
import java.util.Vector;

import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;

public class CdrClientConfig {
	public final static String DATABASE = "database";
	public final static String DBDriver = "dbdriver";
	public final static String DB_USER = "DBUser";
	public final static String DB_PASSWORD = "DBPassword";
	public final static String LOG_LEVEL = "log.level";
	public final static String LOG_CONSOLE = "log.console";
	public final static String LOG_DIR = "log.dir";
	public final static String ASS_IP = "ass.ip";
	public final static String ASS_PORT = "ass.port";
	public final static String PBX = "pbx";
//	public final static String ACCOUNT = "account";
	public final static String QUEUE = "queue";
	public final static String CDR_USER = "cdr.user";
	public final static String CDR_PASSWORD = "cdr.password";
	
	private ConfigProvider confProvider;
	private Configure config;
	private String confFile;
	
	private ConfPeer dbPeer;
	private String database;
	private String dbDriver;
	private String dbUser;
	private String dbPassword;
	private String logLevel = "INFO";
	private boolean logConsole = false;
	private String logDir = "./log/";
	private static CdrClientConfig instance = null;
	private Vector<AssCdrConnect> assCdrConnects = new Vector<AssCdrConnect>();
	
	private CdrClientConfig(){
		confProvider = new ConfigProvider();
		confFile = "cdr_client.conf";
		instance = this;
	}
	
	public static CdrClientConfig getInstance(){
		if(instance == null) {
			new CdrClientConfig();
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
		dbPeer = config.getPeer(DATABASE);
		if(dbPeer == null)
			throw new Exception("Can not find peer [database]");
		database = dbPeer.getParam(DATABASE);
		dbDriver = dbPeer.getParam(DBDriver);
		dbUser = dbPeer.getParam(DB_USER);
		dbPassword = dbPeer.getParam(DB_PASSWORD);
		logLevel = dbPeer.getParam(LOG_LEVEL);
		if(dbPeer.contain(LOG_DIR))
			logDir = dbPeer.getParam(LOG_DIR);
		logConsole = dbPeer.getParam(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		ConfPeer[] peers = config.getAllPeers();
		for(int i=0;i<peers.length;i++){
			ConfPeer peer = peers[i];
			if(!peer.getName().equals(DATABASE)){
				AssCdrConnect acc = new AssCdrConnect(peer.getName(), peer.getParam(CDR_USER),
						peer.getParam(CDR_PASSWORD), peer.getParam(ASS_IP),
						Integer.valueOf(peer.getParam(ASS_PORT)));
				String pbx = peer.getParam(PBX);
				if(pbx.contains(",")){
					String[] _pbx = pbx.split(",");
					for(int j=0;j<_pbx.length;j++){
						acc.addPbx(_pbx[j]);
					}
				} else acc.addPbx(pbx);
				assCdrConnects.add(acc);
			}
		}
	}

	public String getDatabase() {
		return database;
	}

	public void setDatabase(String database) {
		this.database = database;
		dbPeer.addParam(DATABASE, database);
	}

	public String getDbDriver() {
		return dbDriver;
	}

	public void setDbDriver(String dbDriver) {
		this.dbDriver = dbDriver;
		dbPeer.addParam(DBDriver, dbDriver);
	}

	public String getDbUser() {
		return dbUser;
	}

	public void setDbUser(String dbUser) {
		this.dbUser = dbUser;
		dbPeer.addParam(DB_USER, dbUser);
	}

	public String getDbPassword() {
		return dbPassword;
	}

	public void setDbPassword(String dbPassword) {
		this.dbPassword = dbPassword;
		dbPeer.addParam(DB_PASSWORD, dbPassword);
	}
	
	public String getLogLevel() {
		return logLevel;
	}

	public void setLogLevel(String logLevel) {
		this.logLevel = logLevel;
		dbPeer.addParam(LOG_LEVEL, logLevel);
	}

	public String getLogDir() {
		return logDir;
	}

	public boolean isLogConsole() {
		return logConsole;
	}

	public void setLogConsole(boolean logConsole) {
		this.logConsole = logConsole;
		dbPeer.addParam(LOG_CONSOLE, logConsole?"yes":"no");
	}

	public Vector<AssCdrConnect> getAssCdrConnects() {
		return assCdrConnects;
	}
	
}
