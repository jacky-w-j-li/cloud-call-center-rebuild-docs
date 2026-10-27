package com.m7.cc.asterisk.ami.action;

import java.util.Hashtable;

import com.m7.cc.asterisk.ami.AMIField;


/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class AsteriskResponse {

	private boolean _isSuccessful = false;

	private String _actionId = null;

	private String string;

	private Hashtable<String, String> parameters = new Hashtable<String, String>();

	public AsteriskResponse() {
		
	}
	/**
	 * This object represents a response from the AsteriskServer object. Unlike
	 * an Event, response happen as the output of commands executed against the
	 * server. A ResponseObserver object will use this response to understand
	 * the result of an executed command.
	 * 
	 * @param msg
	 *            This is the string, formatted by Asterisk, which represents a
	 *            response from the server.
	 */
	public AsteriskResponse(String msg) {
		string = msg;
		String[] params = msg.split(AMIField.END_LINE);
		for (int i = 0; i < params.length; i++) {
			int index = params[i].indexOf(AMIField.SPLIT + " ");
			if (index > -1)
				parameters.put(params[i].substring(0, index), params[i]
						.substring(index + 2));
			else
				parameters.put("Parameter" + i, params[i]);
		}
		
		// set success and trim success line from message
		if (parameters.get(AMIField.RESPONSE).equals(AMIField.SUCCESS)) {
			_isSuccessful = true;
		}
		// CLI commands return Follows instead of success,
		// i'm counting this as being successful even though a cli command
		// can fail and return follows.
		else if (parameters.get(AMIField.RESPONSE).equals(AMIField.FOLLOWS)) {
			_isSuccessful = true;
		}
		//System.out.println(msg);
		_actionId = parameters.get(AMIField.ACTION_ID).toString();
	}

	/**
	 * The response will <b>typically </b> state whether or not the action was
	 * successful. If an unsuccessful response is returned, it may still be
	 * necesssary to inspect the message payload for hints.
	 * 
	 * @return true if successful, false if unsuccessful or indeterminable
	 */
	public boolean isSuccessful() {
		return _isSuccessful;
	}

	/**
	 * The action id is used for internal housekeeping. In most cases it will be
	 * of no consequence.
	 * 
	 * @return String which is the action id.
	 */
	public String getActionID() {
		return _actionId;
	}
	
	/**
	 * Get the parameter via key.
	 * @param key
	 * @return
	 */
	public String getParameter(String key){
		if(parameters.containsKey(key))
			return parameters.get(key).toString();
		else return null;
	}
	
	public void putParameters(Hashtable<String, String> map) {
		parameters.putAll(map);
		_actionId = parameters.get(AMIField.ACTION_ID).toString();
		// set success and trim success line from message
		if (parameters.get(AMIField.RESPONSE).equals(AMIField.SUCCESS)) {
			_isSuccessful = true;
		}
		// CLI commands return Follows instead of success,
		// i'm counting this as being successful even though a cli command
		// can fail and return follows.
		else if (parameters.get(AMIField.RESPONSE).equals(AMIField.FOLLOWS)) {
			_isSuccessful = true;
		}
	}

	public String toString() {
		return string;
	}
}
