package com.m7.monitor;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.mail.EmailException;

import com.m7.monitor.sip.C5SipProvider;
import com.m7.monitor.sip.IceSipURI;
import com.m7.monitor.sip.Registration;
import com.m7.util.AsteriskConf;
import com.m7.util.MailSend;
import com.m7.util.Utils;
import com.m7.util.log.IceLogger;

public class Monitor {
	private String localIp = "";
	public IceSipURI fromURI;
	private static Monitor instance;
	private ASS ass;
	private static final Logger log = Logger.getLogger(Monitor.class.getName());
	private static Logger monitorLog;
	private static Logger restartLog;
	
	private Monitor() {
		instance = this;
	}
	
	public static Monitor getInstance() {
		if (instance == null) {
			new Monitor();
		}
		return instance;
	}
	
	public void sipMonitor() {
		//this.localIp = AsteriskConf.getInstance().getAssIp();
		this.localIp = "127.0.0.1";
		fromURI = new IceSipURI("5000", localIp, 5062);
		fromURI.setDisplayName("5000");
		initLog();
		initASS();
		startMonitorSip();
	}
	
	private void initLog() {
		monitorLog = IceLogger.getLogger(AsteriskConf.getInstance().getLogDir(),
				"monitor", "ALL", false);
		restartLog = IceLogger.getLogger(AsteriskConf.getInstance().getLogDir(),
				"restart", "ALL", false);
	}
	
	private void initASS() {
		//String assIp = AsteriskConf.getInstance().getAssIp();
		String assIp = "127.0.0.1";
		ass = new ASS(assIp);
		String[] strs = AsteriskConf.getInstance().getIps();
		if(strs != null) {
			for(int i = 0; i < strs.length; i++) {
				String ip = strs[i].split(":")[0];
				int port = Integer.parseInt(strs[i].split(":")[1]);
				ass.addAsk(new Asterisk(ip, port));
			}
		}
	}
	
	private void startMonitorSip() {
		C5SipProvider.getInstance().initStack(localIp, 5078, "UDP");
		Thread t = new Thread("sip register") {
			public void run() {
				while (true) {
					Iterator<Asterisk> it = ass.getAsterisks().iterator();
					while (it.hasNext()) {
						Asterisk a = it.next();
						monitorSip(ass.getIp(), a.getPort(), a.getId());
						try {
							sleep(15000);
						} catch (InterruptedException e) {
							log.log(Level.WARNING, "", e);
						}
					}
				}
			}
		};
		t.start();
	}
	
	private void monitorSip(final String ip, final int port, final String name) {
		int count = 0;
		while (true) {
			count++;
			String result = detectSip(ip, port);
			if (result.equals("800")) {
				if (count > 5) {
					restartAsk(name);
					break;
				} else {
					continue;
				}
			} else {
				monitorLog.info("monitor:" + name + "--" + port);
				break;
			}
		}
	}
	
	private void restartAsk(String name) {
		String realName = name;
		if(name.startsWith("gateway")){
			name = name.substring(0,7);
		}
		if(name.startsWith("vgateway")){
			name = name.substring(0,8);
		}
		String path = "/var/run/asterisk/" + name + "/asterisk.pid";
		File file = new File(path);
		if(file.exists()) {
			try {
				BufferedReader br = new BufferedReader(new FileReader(file));
				String pid = null;
				if((pid = br.readLine()) != null) {
					Utils.excuteCommand("kill -9 " + pid);
					restartLog.info("kill -9:" + pid + "  path" + path);
					Utils.excuteCommand("/usr/sbin/asterisk -g -C /etc/asterisk/" + name + "/asterisk.conf");
					restartLog.info("restart:" + realName);
					MailSend.send("asterisk-" + realName + " was restart" , "asterisk-" + realName + " was restart");
				}
			} catch (Exception e) {
				restartLog.log(Level.WARNING, "restart:" + realName + " failed", e);
			}
		} else {
			restartLog.info("asterisk.pid not exist " + name);
			Utils.excuteCommand("/usr/sbin/asterisk -g -C /etc/asterisk/" + name + "/asterisk.conf");
			restartLog.info("restart:" + realName);
			try {
				MailSend.send("asterisk-" + realName + " was restart" , "asterisk-" + realName + " was restart");
			} catch (EmailException e) {
				restartLog.log(Level.WARNING, "", e);
			}
		}
	}

	private String detectSip(String ip, int port) {
		IceSipURI toURI = new IceSipURI("5000", ip, port);

		fromURI.setPassword("7moorcom");
		Registration register = new Registration(Utils.getUniqueid(), fromURI,
				toURI);
		register.setExpireTime(15000);
		return C5SipProvider.getInstance().processRegistration(register);
	}
	
	public static void main(String args[]) {
		//System.out.println(Utils.getLocalIPAddresses());
	}

}
