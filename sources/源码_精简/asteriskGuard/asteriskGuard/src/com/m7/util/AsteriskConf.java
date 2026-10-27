package com.m7.util;

import java.io.File;
import java.io.IOException;

import org.eclipse.jface.preference.PreferenceStore;

public class AsteriskConf {
	private final String configFile = "asterisk.conf";
	private static AsteriskConf instance;
	private PreferenceStore ps;
	private final String ASTERISK_IP = "asterisk.ip";
	private final String ASS_IP = "ass.ip";
	private final String LOG_DIR = "log.dir";
	private final String LOG_CONSOLE = "log.console";
	private final String LOG_LEVEL = "log.level";
	private final String MAIL_TO = "mail.to";
	private String asteriskIp = "";
	private String assIp = "";
	private String[] ips;
	private String logDir = "/var/log/asteriskGuard/";
	private String logLevel = "INFO";
	private String mailTo = "";
	private String[] mailTos;
	private boolean logConsole = false;
	
	public static AsteriskConf getInstance() {
		if (instance == null) {
			instance = new AsteriskConf();
		}
		return instance;
	}

	public void loadConfiguration() throws IOException {
		File file = new File(configFile);
		if (!file.exists())
			file.createNewFile();
		if (ps != null)
			return;
		ps = new PreferenceStore(configFile);
		try {
			ps.load();
		} catch (IOException e) {
			e.printStackTrace();
		}

		if (ps.contains(ASTERISK_IP)) {
			asteriskIp = ps.getString(ASTERISK_IP);
			if(asteriskIp != null && !asteriskIp.equals("")) {
				ips = asteriskIp.split(",");
			}
		}
		
		if (ps.contains(ASS_IP)) {
			assIp = ps.getString(ASS_IP);
		}
		
		if(ps.contains(LOG_DIR)) {
			logDir = ps.getString(LOG_DIR);
		}
			
		if(ps.contains(LOG_CONSOLE)) {
			logConsole = ps.getString(LOG_CONSOLE).equalsIgnoreCase("yes")?true:false;
		}
		
		if(ps.contains(LOG_LEVEL)) {
			logLevel = ps.getString(LOG_LEVEL);
		}
		
		if (ps.contains(MAIL_TO)) {
			mailTo = ps.getString(MAIL_TO);
			if(mailTo != null && !mailTo.equals("")) {
				mailTos = mailTo.split(",");
			}
		}
	}
	
	public String[] getIps() {
		return ips;
	}

	public String getAssIp() {
		return assIp;
	}

	public String getLogDir() {
		return logDir;
	}

	public String getLogLevel() {
		return logLevel;
	}

	public boolean isLogConsole() {
		return logConsole;
	}

	public String[] getMailTos() {
		return mailTos;
	}
	
}
