package com.dishui.exception;

public class BaseRuntimeException extends RuntimeException {
	private static final long serialVersionUID = -972852709892861507L;
	
	private String errorCode;

	public BaseRuntimeException() {
		super();
	}
	
	public BaseRuntimeException(String errorCode) {
		this.errorCode = errorCode;
	}

	public BaseRuntimeException(String errorCode, String message, Throwable cause) {
		super(message, cause);
		this.errorCode = errorCode;
	}

	public BaseRuntimeException(String errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}
	
	public BaseRuntimeException(String message, Throwable cause) {
		super(message, cause);
	}	

	public BaseRuntimeException(Throwable cause) {
		super(cause);
	}

	public String getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(String errorCode) {
		this.errorCode = errorCode;
	}
	
}
