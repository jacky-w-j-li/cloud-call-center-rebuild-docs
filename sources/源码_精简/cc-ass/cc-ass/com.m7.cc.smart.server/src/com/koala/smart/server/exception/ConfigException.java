package com.koala.smart.server.exception;

public class ConfigException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 7984174329155510734L;

	public ConfigException() {
		super();
	}

	public ConfigException(String s) {
		super(s);
	}

	public ConfigException(String s, Exception ex) {
		super(s,ex);
	}
}
