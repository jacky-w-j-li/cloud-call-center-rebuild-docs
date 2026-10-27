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
	private final static String APP_DB = "appdb";
	private final static String HANDLER_TYPE = "handler.type";
	public final static String MONGODB = "mongodb";
	public final static String MONGODB_IP = "ip";
	public final static String MONGODB_PORT = "port";
	public final static String REPORT_COLLECTION = "report.collection";
	public final static String DISPATCHER_EVENT_RESEND = "dispatcher.event.resend";
	public final static String CLEAR_CDR = "clear.cdr";
	public final static String REPORT_RECORD_NAME = "report.record.name";
	public final static String REPORT_ACCOUNTS = "report.accounts";
	public final static String HANGUP_SMS_URL ="hangup_sms_url";

	private ConfigProvider confProvider;
	private Configure config;
	private String confFile;

	private String port;
	private ConfPeer dbPeer;
	private ConfPeer serverPeer;
	private ConfPeer mongoDBPeer;
	private String database;
	private String dbDriver;
	private String dbUser;
	private String dbPassword;
	private String logLevel = "INFO";
	private boolean logConsole = false;
	private String logDir = "./log/";
	private ConfPeer appDBPeer;
	private String appDB;
	private String appDBUser;

	private String appDBPassword;
	private String handlerType = "default";
	private String mongoDBIP;
	private String mongoDBPort;
	private boolean isCollectReport = false;
	private boolean isDispatcherEventResend = false;
	private boolean isClearCdr = false;
	private static CdrServerConfig instance = null;
	private String reportRecordName = "app_report_server";
	private String reportAccounts = "";
	private String hangup_sms_url="";

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
		if(serverPeer.contain(HANDLER_TYPE))
			handlerType = serverPeer.getParam(HANDLER_TYPE);
		if(serverPeer.contain(REPORT_COLLECTION)){
			if(serverPeer.getParam(REPORT_COLLECTION).equalsIgnoreCase("yes"))
				isCollectReport = true;
		}
		if(serverPeer.contain(DISPATCHER_EVENT_RESEND)){
			if(serverPeer.getParam(DISPATCHER_EVENT_RESEND).equalsIgnoreCase("yes"))
				isDispatcherEventResend = true;
		}
		if(serverPeer.contain(CLEAR_CDR)){
			if(serverPeer.getParam(CLEAR_CDR).equalsIgnoreCase("yes"))
				isClearCdr = true;
		}
		if(serverPeer.contain(REPORT_RECORD_NAME)){
			reportRecordName = serverPeer.getParam(REPORT_RECORD_NAME);
		}
		if(serverPeer.contain(REPORT_ACCOUNTS)){
			reportAccounts = serverPeer.getParam(REPORT_ACCOUNTS);
		}
		if(serverPeer.contain(HANGUP_SMS_URL)){
			hangup_sms_url = serverPeer.getParam(HANGUP_SMS_URL);			
		}

		dbPeer = config.getPeer(DATABASE);
		if(dbPeer != null){
			database = dbPeer.getParam(DATABASE);
			dbDriver = dbPeer.getParam(DBDriver);
			dbUser = dbPeer.getParam(DB_USER);
			dbPassword = dbPeer.getParam(DB_PASSWORD);
		}

		appDBPeer = config.getPeer(APP_DB);
		if(appDBPeer != null){
			appDB = appDBPeer.getParam(DATABASE);
			appDBUser = appDBPeer.getParam(DB_USER);
			appDBPassword = dbPeer.getParam(DB_PASSWORD);
		}

		mongoDBPeer = config.getPeer(MONGODB);
		if(mongoDBPeer != null){
			mongoDBIP = mongoDBPeer.getParam(MONGODB_IP);
			mongoDBPort = mongoDBPeer.getParam(MONGODB_PORT);
			dbUser = mongoDBPeer.getParam(DB_USER);
			dbPassword = mongoDBPeer.getParam(DB_PASSWORD);
			database = mongoDBPeer.getParam(DATABASE);
		}

//		ConfPeer[] peers = config.getAllPeers();
//		for(int i=0;i<peers.length;i++){
//			ConfPeer peer = peers[i];
//			if(!peer.getName().equals(DATABASE)){
//				AssCdrConnect acc = new AssCdrConnect(peer.getName(), peer.getParam(CDR_USER),
//						peer.getParam(CDR_PASSWORD), peer.getParam(ASS_IP),
//						Integer.valueOf(peer.getParam(PORT)));
//				String pbx = peer.getParam(PBX);
//				if(pbx.contains(",")){
//					String[] _pbx = pbx.split(",");
//					for(int j=0;j<_pbx.length;j++){
//						acc.addPbx(_pbx[j]);
//					}
//				} else acc.addPbx(pbx);
//				assCdrConnects.add(acc);
//			}
//		}
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

	public String getHangup_sms_url() {
		return hangup_sms_url;
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

	public String getPort() {
		return port;
	}

	public String getAppDB() {
		return appDB;
	}

	public String getAppDBUser() {
		return appDBUser;
	}

	public String getAppDBPassword() {
		return appDBPassword;
	}

	public String getHandlerType() {
		return handlerType;
	}

	public String getMongoDBIP() {
		return mongoDBIP;
	}

	public String getMongoDBPort() {
		return mongoDBPort;
	}

	public boolean isCollectReport() {
		return isCollectReport;
	}

	public boolean isdispatcherEventResend() {
		return isDispatcherEventResend;
	}

	public boolean isClearCdr() {
		return isClearCdr;
	}

	public String getReportRecordName() {
		return reportRecordName;
	}

	public String getReportAccounts() {
		return reportAccounts;
	}

}
