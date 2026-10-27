package com.m7.cc.asterisk.ami.action;

import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedHashMap;

import com.m7.cc.asterisk.ami.AMIField;


public abstract class AsteriskAction {

	private String actionName;

	private String actionID;

	private LinkedHashMap<String, String> parameters;

	public AsteriskAction(String actName, String actionID) {
		this.actionName = actName;
		this.actionID = actionID;
		parameters = new LinkedHashMap<String, String>();
	}

	
	public void addParameter(String key, String value) {
		//ActionName and ActionID should be setted when creating this action.
		if (key.equalsIgnoreCase(AMIField.ACTION)
				|| key.equalsIgnoreCase(AMIField.ACTION_ID))
			return;
		parameters.put(key, value);
	}

	/**
	 * Retrieve a action parameter's value
	 * 
	 * @param key
	 *            the action parameter
	 * @return the parameter's current value
	 */
	public String getParameterValue(String key) {
		if(!parameters.containsKey(key))
			return null;
		// The toUpperCase will make the key insensitive. This is important
		// since its difficult to know
		// whether the Asterisk server will return things upper or lower case.
		return (String) parameters.get(key);
	}

	/**
	 * The function returns the action id associated with an action command. The
	 * action ID is a unique number that differentiates one action from another
	 * 
	 * @return The integer action id
	 */
	public String getActionID() {
		return actionID;
	}

	/**
	 * This function will remove a parameter from an action command
	 * 
	 * @param key
	 *            The key which is to be removed
	 */
	public void removeParameter(String key) {
		parameters.remove(key);
	}

	/**
	 * Returns the String representation of the action command. This command can
	 * then be sent to the Asterisk server.
	 * 
	 * @return the action command in string form
	 * @throws IOException
	 *             The action command did not have a action specified when
	 *             trying to fetch the action string
	 */
	public String getCommandString() {
		StringBuffer command = new StringBuffer();
		command.append(AMIField.ACTION + ": " + actionName + AMIField.END_LINE);
		Iterator<String> i = parameters.keySet().iterator();
		while (i.hasNext()) {
			String key = (String) i.next();
			String value = (String) parameters.get(key);
			command.append(key + ": " + value + AMIField.END_LINE);
		}
		command
				.append(AMIField.ACTION_ID + ": " + actionID
						+ AMIField.END_LINE);
		command.append(AMIField.END_ACTION);
		return command.toString();
	}

	public void setActionID(String actionID) {
		this.actionID = actionID;
	}

	public String getActionName() {
		return actionName;
	}

	public void setActionName(String actionName) {
		this.actionName = actionName;
	}
}
