package com.m7.util.log;

import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;

/**
 * 
 * @author Caif
 * @version 1.0, 2007-12-28
 */
public class SystemOutHandler extends Handler{
	private boolean isConsole = true;
	
	public SystemOutHandler(boolean isConsole){
		this.isConsole = isConsole;
	}
	
	public void close() throws SecurityException {
	}

	public void flush() {
		System.out.flush();
	}

	public void publish(LogRecord record) {
		if(isLoggable(record) && isConsole)
		{
			if(record.getLevel().intValue() >= Level.WARNING.intValue())
				System.err.print(getFormatter().format(record));
			else System.out.print(getFormatter().format(record));
		}
	}

}
