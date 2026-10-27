package com.dishui.util.log;

import java.io.File;
import java.io.IOException;
import java.util.logging.FileHandler;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;

/**
 * 
 * @author Cai Zhibin 2009-7-17
 *
 */
public class IceLogger {
	
	public static void initLogger(String path, String fileName, String level,
			boolean isConsole){
		if(path.endsWith("/"))
			path = path.substring(0, path.length() - 1);
		Logger logger = null;
		File log = new File(path);
		if (!log.canRead())
			log.mkdirs();
		try {
			Level logLevel = getLevel(level);
			logger = LogManager.getLogManager().getLogger("");
			Handler[] handlers = logger.getHandlers();
			for (int i = 0; handlers != null && i < handlers.length; i++)
				logger.removeHandler(handlers[i]);
			logger.setLevel(Level.ALL);

			int count = 20;

			FileHandler txtLog = new FileHandler(path +"/" + fileName
					+ "_%u_%g.log", 1024 * 1024 * 20, count, true);
			txtLog.setFormatter(new LogFormat());
			txtLog.setLevel(logLevel);
			txtLog.setEncoding("UTF-8");

			logger.addHandler(txtLog);
			SystemOutHandler soh = new SystemOutHandler(isConsole);
			soh.setFormatter(new LogFormat());
			soh.setLevel(logLevel);
			logger.addHandler(soh);

			String str = "version: Bill Server 1.0\n"
					+ "Java vendor: "
					+ System.getProperty("java.vendor")
					+ "\n"
					+ "Java version: "
					+ System.getProperty("java.version")
					+ "\n"
					+ "Java WM name: "
					+ System.getProperty("java.vm.name")
					+ "\n"
					+ "Java WM vendor: "
					+ System.getProperty("java.vm.vendor")
					+ "\n"
					+ "Java WM version: "
					+ System.getProperty("java.vm.version")
					+ "\n\n"
					+ "OS name: "
					+ System.getProperty("os.name")
					+ "\n"
					+ "OS architecture: "
					+ System.getProperty("os.arch")
					+ "\n"
					+ "OS version: "
					+ System.getProperty("os.version")
					+ "\n\n";
			logger.info(str);
		} catch (IOException e) {
			System.err.println("Could not create txtLog FileHandler : " + e);
		}
	}

	public static void initLogger(String uri,String baseLogFields,int timeout,String path, String fileName, String level,
									   boolean isConsole){
		initLogger(path,fileName,level,isConsole);

		if(uri == null || baseLogFields == null){
			return;
		}
		Logger logger = LogManager.getLogManager().getLogger("");
		Level logLevel = getLevel(level);
		logger.setLevel(Level.ALL);

//		RedisHandler redisHandler = new RedisHandler(uri,baseLogFields,timeout);
//		redisHandler.setFormatter(new LogFormat());
//		redisHandler.setLevel(logLevel);
//
//		logger.addHandler(redisHandler);
	}

	public static Logger getLogger(String path, String fileName, String level,
			boolean isConsole) {
		if(path.endsWith("/"))
			path = path.substring(0, path.length() - 1);
		Logger logger = Logger.getLogger(fileName);
		logger.setUseParentHandlers(false);
		File log = new File(path);
		if (!log.canRead())
			log.mkdirs();
		try {
			Level logLevel = getLevel(level);
			Handler[] handlers = logger.getHandlers();
			for (int i = 0; handlers != null && i < handlers.length; i++)
				logger.removeHandler(handlers[i]);
			logger.setLevel(Level.ALL);

			int count = 20;

			FileHandler txtLog = new FileHandler(path +"/" + fileName
					+ "_%u_%g.log", 1024 * 1024 * 20, count, true);
			txtLog.setFormatter(new LogFormat());
			txtLog.setLevel(logLevel);
			txtLog.setEncoding("UTF-8");

			logger.addHandler(txtLog);
			SystemOutHandler soh = new SystemOutHandler(isConsole);
			soh.setFormatter(new LogFormat());
			soh.setLevel(logLevel);
			logger.addHandler(soh);

			String str = "version: Asterisk Status Server 1.0\n"
					+ "Java vendor: "
					+ System.getProperty("java.vendor")
					+ "\n"
					+ "Java version: "
					+ System.getProperty("java.version")
					+ "\n"
					+ "Java WM name: "
					+ System.getProperty("java.vm.name")
					+ "\n"
					+ "Java WM vendor: "
					+ System.getProperty("java.vm.vendor")
					+ "\n"
					+ "Java WM version: "
					+ System.getProperty("java.vm.version")
					+ "\n\n"
					+ "OS name: "
					+ System.getProperty("os.name")
					+ "\n"
					+ "OS architecture: "
					+ System.getProperty("os.arch")
					+ "\n"
					+ "OS version: "
					+ System.getProperty("os.version")
					+ "\n\n";
			logger.info(str);
		} catch (IOException e) {
			System.err.println("Could not create txtLog FileHandler : " + e);
		}
		return logger;
	}

	private static Level getLevel(String level) {
		if (level == null) {
			return Level.FINE;
		}
		level = level.toUpperCase();

		if (level.equalsIgnoreCase("ALL"))
			return Level.ALL;
		else if (level.equalsIgnoreCase("FINEST"))
			return Level.FINEST;
		else if (level.equalsIgnoreCase("FINER"))
			return Level.FINER;
		else if (level.equalsIgnoreCase("FINE"))
			return Level.FINE;
		else if (level.equalsIgnoreCase("CONFIG"))
			return Level.CONFIG;
		else if (level.equalsIgnoreCase("INFO"))
			return Level.INFO;
		else if (level.equalsIgnoreCase("WARNING"))
			return Level.WARNING;
		else if (level.equalsIgnoreCase("SEVERE"))
			return Level.SEVERE;
		else if (level.equalsIgnoreCase("OFF"))
			return Level.OFF;
		return Level.FINE;
	}
}
