package com.m7.monitor.sip;


/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-5
 */
public class Registration {

	private int expireTime = 0;

	private IceSipURI fromURI = null;

	private IceSipURI toURI = null;
	private String callID;

	/**
	 * Construct a register event.
	 */
	public Registration(String callID, IceSipURI fromURI, IceSipURI toURI) {
		this.callID = callID;
		this.fromURI = fromURI;
		this.toURI = toURI;
	}

	/**
	 * Set register expire time.
	 * 
	 * @param expireTime
	 *            expire time.
	 */
	public void setExpireTime(int expireTime) {
		this.expireTime = expireTime;
	}

	/**
	 * Get register expire time.
	 * 
	 * @return expire time.
	 */
	public int getExpireTime() {
		return expireTime;
	}

	public IceSipURI getFromURI() {
		return fromURI;
	}

	public IceSipURI getToURI() {
		return toURI;
	}

	public String getCallID() {
		return callID;
	}
	
}