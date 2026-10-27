package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Login extends AsteriskAction{
	private String userName;
	private String secret;
	private String key;
	private String authType;
	private boolean isNegative = false;
	public boolean isNegative() {
		return isNegative;
	}

	public void setNegative(boolean isNegative) {
		this.isNegative = isNegative;
	}

	public String getAuthType() {
		return authType;
	}

	public String getKey() {
		return key;
	}

	/**
	 * This structure used for no encrypt login.
	 * @param name
	 * @param secret
	 * @param actionID
	 */
	public Login(String name, String secret, String actionID) {
		super(AMIField.LOGIN, actionID);
		this.addParameter(AMIField.USER_NAME, name);
		this.addParameter(AMIField.SECRET, secret);
		this.userName = name;
		this.secret = secret;
	}
	
	/**
	 * This structure used for encypt login
	 * @param name
	 * @param authType
	 * @param key
	 * @param actionID
	 */
	public Login(String name, String authType, String key, String actionID){
		super(AMIField.LOGIN, actionID);
		this.addParameter(AMIField.USER_NAME, name);
		this.addParameter(AMIField.AUTH_TYPE, authType);
		this.addParameter(AMIField.KEY, key);
		this.userName = name;
		this.key = key;
		this.authType = authType;
	}

	public String getSecret() {
		return secret;
	}

	public String getUserName() {
		return userName;
	}


}
