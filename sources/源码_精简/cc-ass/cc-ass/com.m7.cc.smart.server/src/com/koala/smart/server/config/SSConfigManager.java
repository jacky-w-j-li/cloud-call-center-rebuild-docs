package com.koala.smart.server.config;

import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;

/**
 * This class is used to configure SmartServer.
 * 
 * @author caif
 * @version 1.0.0
 */
public class SSConfigManager {
	
	private String confFile;
	
	private ServerConfig serverConfig;

	private ConfigProvider confProvider;
	
	private Configure config;

	private Logger logger = Logger.getLogger(SSConfigManager.class.getName());
	
	/**
	 * Initial a configuration.
	 * 
	 * @param confFile
	 */
	public SSConfigManager() {
		confProvider = new ConfigProvider();
		serverConfig = new ServerConfig();
	}
	
	public boolean init(String confFile){
		this.confFile = confFile;
		return loadConfig();
	}

	/**
	 * Load configuration from configure file. And then set them into ServerConfig.
	 * @return boolean return the loading and parser result.
	 */
	private boolean loadConfig() {
		
		//Check configure file
		if (confFile == null || confFile.equalsIgnoreCase("")) {
			logger.warning("Can not load configure file, it is null");
			return false;
		}

		File file = new File(confFile);
		if(!file.exists()){
			logger.warning("Can not find configure file ["+confFile+"].");
			return false;
		}
		
		if(!file.canRead()){
			logger.warning("Can not read configure file ["+confFile+"].");
			return false;
		}
		
		logger.info("Load configuration from ["+confFile+"]");
		//Start loading
		try {
			config = confProvider.parser(confFile);
			serverConfig.setConfig(config);
		} catch (ConfigureParserException e) {
			logger.log(Level.WARNING, "Parser configuration failed", e);
			return false;
		} catch (IOException e) {
			logger.log(Level.WARNING, "Load configuration failed", e);
			return false;
		} catch (ConfigException e) {
			logger.log(Level.WARNING, "Set configuration failed", e);
			return false;
		}
		return true;
	}
	
	/**
	 * Save the configuration of Smart Server
	 * @return boolean true|false
	 */
	public boolean saveConfig(){
		try {
			confProvider.save(config);
		} catch (ConfigureParserException e) {
			logger.log(Level.WARNING, "Save configuration failed", e);
			return false;
		} catch (IOException e) {
			logger.log(Level.WARNING, "Save configuration failed", e);
			return false;
		}
		return true;
	}
	
	public ServerConfig getServerConfig() {
		return serverConfig;
	}
}
