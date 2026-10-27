package com.koala.smart.server.config;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfPeer;

public class BufferPoolConfig {
	public static final String ID = "BufferPool";
	public static final String MAX_BUFFER = "MaxObject";
	public static final String INIT_BUFFER = "InitObject";
	public static final String ACTIVE = "Active";
	
	public int maxBuffer = 20;
	public int initBuffer = 20;
	
	private ConfPeer peer;
	
	private boolean isActive = true;
	
	public void setPeer(ConfPeer peer) throws ConfigException{
		this.peer = peer;
		int max = 0;
		int init = 0;
		if (peer.contain(MAX_BUFFER)) {
			max = Integer.valueOf(peer.getParam(MAX_BUFFER));
		} else
			max = maxBuffer;

		if (peer.contain(INIT_BUFFER)) {
			init = Integer.valueOf(peer.getParam(INIT_BUFFER));
		} else
			init = initBuffer;

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
		
		maxBuffer = max;
		initBuffer = init;
	}
	
	public boolean isActive() {
		return isActive;
	}

	public void setActive(boolean isActive) {
		this.isActive = isActive;
		String value = isActive ? "yes" : "no";
		peer.addParam(ACTIVE, value);
	}

	public int getMaxBuffer() {
		return maxBuffer;
	}

	public void setMaxBuffer(int maxBuffer) {
		this.maxBuffer = maxBuffer;
		peer.addParam(MAX_BUFFER, maxBuffer+"");
	}

	public int getInitBuffer() {
		return initBuffer;
	}

	public void setInitBuffer(int initBuffer) {
		this.initBuffer = initBuffer;
		peer.addParam(INIT_BUFFER, initBuffer+"");
	}

}
