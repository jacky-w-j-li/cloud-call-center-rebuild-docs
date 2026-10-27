package com.koala.smart.server.config;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfPeer;

/**
 * 
 * @author caif
 * 
 */
public class SessionPoolConfig {
	public static final String ID = "SessionPool";
	public static final String MAX_OBJECT = "MaxObject";
	public static final String INIT_OBJECT = "InitObject";
	public static final String ACTIVE = "Active";

	private boolean isActive = false;

	private int maxObject = 8;

	private int initObject = 4;

	private ConfPeer peer;

	public void setPeer(ConfPeer peer) throws ConfigException {
		this.peer = peer;
		int max = 0;
		int init = 0;
		if (peer.contain(MAX_OBJECT)) {
			max = Integer.valueOf(peer.getParam(MAX_OBJECT));
		} else
			max = maxObject;

		if (peer.contain(INIT_OBJECT)) {
			init = Integer.valueOf(peer.getParam(INIT_OBJECT));
		} else
			init = initObject;

		if(peer.contain(ACTIVE)){
			if(peer.getParam(ACTIVE).equalsIgnoreCase("yes")){
				isActive = true;
			} else if(peer.getParam(ACTIVE).equalsIgnoreCase("no")){
				isActive = false;
			} else throw new ConfigException("The value of 'Active' should be 'yes|no'");
		} else {
			peer.addParam(ACTIVE, "no");
		}
		
		/**
		 * check the configuration of session pool Rules: 
		 * 1.init should not larger than max 
		 * 2.init >= 0 
		 * 3.max > 0 
		 * 
		 */
		if (init > max) {
			throw new ConfigException(
					"The number of init object should not be "
							+ "larger than max object number");
		}

		if (init < 0)
			throw new ConfigException(
					"The init object number should not be less than 0");

		if (max <= 0) {
			throw new ConfigException(
					"The init object number should be larger than 0");
		}
		
		maxObject = max;
		initObject = init;
	}

	public boolean isActive() {
		return isActive;
	}

	public void setActive(boolean isActive) {
		this.isActive = isActive;
		String value = isActive ? "yes" : "no";
		peer.addParam(ACTIVE, value);
	}

	public int getMaxObject() {
		return maxObject;
	}

	public void setMaxObject(int maxObject) {
		this.maxObject = maxObject;
		peer.addParam(MAX_OBJECT, maxObject + "");
	}

	public int getInitObject() {
		return initObject;
	}

	public void setInitObject(int initObject) {
		this.initObject = initObject;
		peer.addParam(INIT_OBJECT, initObject + "");
	}
}
