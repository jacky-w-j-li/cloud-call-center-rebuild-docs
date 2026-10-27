package com.m7.monitor;

import java.io.IOException;

import com.m7.util.AsteriskConf;
import com.m7.util.log.IceLogger;

public class Start {
	public static void main(String args[]) {
		//load config
		try {
			AsteriskConf.getInstance().loadConfiguration();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		//load log
		IceLogger.initLogger(AsteriskConf.getInstance().getLogDir(), "asterisk",
				AsteriskConf.getInstance().getLogLevel(), AsteriskConf
						.getInstance().isLogConsole());

		//start monitor
		Monitor.getInstance().sipMonitor();
		
	}
}
