package com.dishui.exception;


public class SaxParserHeadException extends BaseRuntimeException {
    public SaxParserHeadException() {
        super();
    }

    public SaxParserHeadException(String errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }

    public SaxParserHeadException(String errorCode, String message) {
        super(errorCode, message);
    }

    public SaxParserHeadException(String message, Throwable cause) {
        super(message, cause);
    }

    public SaxParserHeadException(String errorCode) {
        super(errorCode);
    }

    public SaxParserHeadException(Throwable cause) {
        super(cause);
    }
}
