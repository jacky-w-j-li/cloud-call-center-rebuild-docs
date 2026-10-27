package com.koala.smart.server.config;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfPeer;

public class GandarPoolConfig {
	public static final String ID = "GandarPool";
	public static final String ACTIVE = "Active";
	public static final String MAX_ACTIVE = "MaxActive";
	public static final String MAX_IDLE = "MaxIdle";
	public static final String MIN_IDLE = "MinIdle";
	public static final String MAX_WAIT = "MaxWait";
	
	private int maxActive = 1;
	private int maxIdle = 1;
	//ms
	private long maxWait = 1000;
	private int minIdle = 1;
	
	private boolean isActive = true;
	private ConfPeer peer;

	/**
	 * Caution: This method must be called after construct had been called.
	 * @param peer
	 * @throws ConfigException
	 */
	public void setPeer(ConfPeer peer) throws ConfigException{
		this.peer = peer;
		
		if(peer.contain(ACTIVE)){
			if(peer.getParam(ACTIVE).equalsIgnoreCase("yes")){
				isActive = true;
			} else if(peer.getParam(ACTIVE).equalsIgnoreCase("no")){
				isActive = false;
			} else throw new ConfigException("The value of 'Active' should be 'yes|no'");
		} else {
			peer.addParam(ACTIVE, "no");
		}
		
		if(peer.contain(MAX_WAIT)){
			maxWait = Long.valueOf(peer.getParam(MAX_WAIT)).longValue();
		}
		
		int _maxActive = maxActive;
		int _maxIdle = maxIdle;
		int _minIdle = minIdle;
		
		if(peer.contain(MAX_ACTIVE)){
			_maxActive = Integer.valueOf(peer.getParam(MAX_ACTIVE)).intValue();
		} else {
			_maxActive = maxActive;
		}
		
		if(peer.contain(MAX_IDLE)){
			_maxIdle = Integer.valueOf(peer.getParam(MAX_IDLE)).intValue();
		} else {
			_maxIdle = maxIdle;
		}
		
		if(peer.contain(MIN_IDLE)){
			_minIdle = Integer.valueOf(peer.getParam(MIN_IDLE)).intValue();
		} else {
			_minIdle = minIdle;
		}
		
		/**
		 * Check rules of configuration about gandar pool:
		 * 1.max active >= max idle > 0
		 * 2.max idle >= min idle > 0
		 * 
		 */
		if(_maxActive >= _maxIdle){
			maxActive = _maxActive;
		} else throw new ConfigException("");
		
		if(_maxIdle >= _minIdle){
			maxIdle = _maxIdle;
			minIdle = _minIdle;
		} else throw new ConfigException("");
	}
	
	public boolean isActive() {
		return isActive;
	}

	public void setActive(boolean isActive) {
		this.isActive = isActive;
		peer.addParam(ACTIVE, isActive?"yes":"no");
	}
	public int getMaxActive() {
		return maxActive;
	}

	public void setMaxActive(int maxActive) {
		this.maxActive = maxActive;
		peer.addParam(MAX_ACTIVE, maxActive+"");
	}

	public int getMaxIdle() {
		return maxIdle;
	}

	public void setMaxIdle(int maxIdle) {
		this.maxIdle = maxIdle;
		peer.addParam(MAX_IDLE, maxIdle+"");
		if(maxIdle > maxActive){
			setMaxActive(maxIdle); 
		}
	}

	public long getMaxWait() {
		return maxWait;
	}

	public void setMaxWait(long maxWait) {
		this.maxWait = maxWait;
		peer.addParam(MAX_WAIT, maxWait+"");
	}

	public int getMinIdle() {
		return minIdle;
	}

	public void setMinIdle(int minIdle) {
		this.minIdle = minIdle;
		peer.addParam(MIN_IDLE, minIdle+"");
		if(minIdle > maxIdle){
			setMaxIdle(minIdle);
		}
	}

}
