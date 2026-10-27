package com.dishui.utils.log;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Formatter;
import java.util.logging.LogRecord;


/**
 * Formats the LogRecord as "[LEVEL] MM-dd-yyyy hh:mm:ss  - Class.method() - MESSAGE"
 * @author Cai Zhibin
 * @since 1.3.2
 */
public class LogFormat extends Formatter {
	private Date date = new Date();
	private SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    private String lineSeparator = "\r\n";

	public synchronized String format(LogRecord record) {
		date.setTime(record.getMillis());

		StringBuffer sb = new StringBuffer();
		sb.append("[");
		sb.append(record.getLevel().getLocalizedName());
		sb.append("] ");
		sb.append(df.format(date)+" - ");
		if(record.getSourceClassName() != null) {
			sb.append(record.getSourceClassName());
		} else {
			sb.append(record.getLoggerName());
		}
		if(record.getSourceMethodName() != null) {	
			sb.append('.');
			sb.append(record.getSourceMethodName());
		}
		sb.append("\r\n");
		sb.append(formatMessage(record));
				
		if(record.getThrown() != null) {
			sb.append(lineSeparator);
			sb.append("[StackTrace: ");
			try {
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				record.getThrown().printStackTrace(pw);
				pw.close();
				sb.append(sw.toString());
			} catch(Exception ex) {
				sb.append(record.getThrown().toString());
			}
			sb.append(']');
		}
		
		sb.append(lineSeparator);
		return  sb.toString();		
	}
}
