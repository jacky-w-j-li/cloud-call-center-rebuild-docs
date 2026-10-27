package com.koala.smart.server.exception;

public class SessionException  extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = -3198751362374845000L;

	public SessionException() {
		super();
	}

	public SessionException(String s) {
		super(s);
	}

	public SessionException(String s, Exception ex) {
		super(s,ex);
	}
	
}
