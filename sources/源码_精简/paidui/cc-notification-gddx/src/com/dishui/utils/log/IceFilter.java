package com.dishui.utils.log;

import java.util.logging.Filter;
import java.util.logging.LogRecord;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class IceFilter implements Filter{

	String name;
	
	public IceFilter(String clsName){
		name = clsName;
	}
	public boolean isLoggable(LogRecord record) {
		if(name == null)
			return false;
		else{
			if(name.equals(record.getLoggerName())){
				return true;
			} else return false;
		}
	}
	
}
