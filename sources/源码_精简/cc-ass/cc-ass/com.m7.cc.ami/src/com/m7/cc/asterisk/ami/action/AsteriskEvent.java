package com.m7.cc.asterisk.ami.action;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.logging.Logger;

import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.C5Constants;

/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public class AsteriskEvent {

	private Hashtable<String, String> parameters;
	private static Logger log = Logger.getLogger(AsteriskEvent.class.getName());

	public AsteriskEvent(String msg) {
		parameters = new Hashtable<String, String>();
		String[] tempList = new String[msg
				.split(C5Constants.ASTERISK_END_LINE).length];
		tempList = msg.split(C5Constants.ASTERISK_END_LINE);
		int colonIndex = -1;
		for (int i = 0; i < tempList.length; i++) {

			colonIndex = tempList[i].indexOf(": ");
			if (colonIndex > -1) {
				parameters.put(tempList[i].substring(0, colonIndex),
						tempList[i].substring(colonIndex + 2));
			} else {
				parameters.put("Parameter" + i, tempList[i]);
			}
		}
	}

	/**
	 * This function returns the event name which can be used to determine
	 * what's happening on the server
	 * 
	 * @return string event name title
	 */
	public String getEventName() {
		return (String) parameters.get(AMIField.EVENT);
	}

	/**
	 * There are different types of information. This is mistakenly named a
	 * privilege despite the fact that there is no concept of privileges. Some
	 * functions will return null, so treat that as all.
	 * 
	 * @return privilege type of event
	 */
	public String getPrivilege() {
		return (String) parameters.get(AMIField.PRIVILEGE);
	}

	/**
	 * This function is used to fetch information about a non-standard parameter
	 * 
	 * @param parameter
	 *            the parameter whose value you would like to fetch
	 * @return the parameter's value
	 */
	public String getValue(String parameter) {
		Object param = parameters.get(parameter);
		if (param == null){
			log.warning("Try to get ["+parameter+"] from ["+this.getEventName()+"], but it's null in this event.");
			return null;
		}
		return (String) param;
	}

	/**
	 * Returns a Enumeration of the parameters available with this message
	 * 
	 * @return an Enumeration of the paremeters
	 */
	public Enumeration<String> getParameterList() {
		return parameters.keys();
	}
	
	public Hashtable<String, String> getParameters(){
		return parameters;
	}

	public String toString() {
		String result;
		String temp;
		result = AMIField.EVENT + AMIField.SPLIT + " " + this.getEventName()
				+ AMIField.END_LINE;
		result += AMIField.PRIVILEGE + AMIField.SPLIT + " "
				+ this.getPrivilege() + AMIField.END_LINE;
		Enumeration<String> e = getParameterList();
		while (e.hasMoreElements()) {
			temp = (String) e.nextElement();
			if (!AMIField.EVENT.equals(temp)
					&& !AMIField.PRIVILEGE.equals(temp)) {
				result += temp + ": " + getValue(temp)
						+ AMIField.END_LINE;
			}
		}
		result = result + AMIField.END_ACTION;
		return result;
	}

}
