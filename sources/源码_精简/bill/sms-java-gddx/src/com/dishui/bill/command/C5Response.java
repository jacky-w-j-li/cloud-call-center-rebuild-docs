package com.dishui.bill.command;

import java.util.HashMap;
import java.util.Map;



/**
 * 
 * @author Cai Zhibin 2009-6-26
 *
 */
public class C5Response {
	public static final String Command = "Command";
	public static final String Action = "Action";
	public static final String ActionID = "ActionID";
	public static final String Succeed = "Succeed";
	public static final String Response = "Response";
	public static final String Message = "Message";
	
	private String actionName;

	private String actionID;
	
	private boolean succeed = false;
	
	private String message;

	private HashMap<String, Object> parameters;
	
	public C5Response(C5Action action){
		this.actionName = action.getActionName();
		this.actionID = action.getActionID();
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Response);
		parameters.put(Response, actionName);
		parameters.put(ActionID, actionID);
		parameters.put(Succeed, succeed);
	}
	
	public C5Response(C5Action action, boolean isSucceed){
		this.actionName = action.getActionName();
		this.actionID = action.getActionID();
		succeed = isSucceed;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Response);
		parameters.put(Response, actionName);
		parameters.put(ActionID, actionID);
		parameters.put(Succeed, succeed);
	}
	
	public C5Response(String actName, String actionID) {
		this.actionName = actName;
		this.actionID = actionID;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Response);
		parameters.put(Response, actionName);
		parameters.put(ActionID, actionID);
		parameters.put(Succeed, succeed);
	}

	public C5Response(String actName, String actionID, boolean isSucceed) {
		this.actionName = actName;
		this.actionID = actionID;
		succeed = isSucceed;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Response);
		parameters.put(Response, actionName);
		parameters.put(ActionID, actionID);
		parameters.put(Succeed, succeed);
	}
	
	public C5Response(String actName, String actionID, String message, boolean isSucceed) {
		this.actionName = actName;
		this.actionID = actionID;
		this.message = message;
		succeed = isSucceed;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Response);
		parameters.put(Response, actionName);
		parameters.put(ActionID, actionID);
		parameters.put(Succeed, succeed);
		parameters.put(Message, message);
	}
	
	public boolean setValues(Map<String, Object> map) {
		try{
			parameters.putAll(map);
			setSucceed((Boolean)map.get(Succeed));
			if(map.containsKey(Message)){
				setMessage((String)map.get(Message));
			}
		}catch(Exception e){
			return false;
		}
		return true;
	}

	public void addParameter(String key, Object value) {
		parameters.put(key, value);
	}

	public HashMap<String, Object> getParameters() {
		return parameters;
	}

	public Object getParameterValue(String key) {
		if (!parameters.containsKey(key))
			return null;
		return parameters.get(key);
	}
	
	public String getStringValue(String key) throws Exception{
		if(parameters.containsKey(key))
			return (String) parameters.get(key);
		else throw new Exception("["+key+"] not found in "+actionName);
	}

	public boolean getBoolValue(String key) throws Exception {
		if(parameters.containsKey(key))
			return (Boolean) parameters.get(key);
		else throw new Exception("["+key+"] not found in "+actionName);
	}

	public int getIntValue(String key) throws Exception {
		if(parameters.containsKey(key))
			return Integer.valueOf(parameters.get(key).toString());
		else throw new Exception("["+key+"] not found in "+actionName);
	}

	public boolean isSucceed() {
		return succeed;
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

	public void removeParameter(String key) {
		parameters.remove(key);
	}

	public String getActionName() {
		return actionName;
	}

	public String getJsonString() {
		JSONWriter jw = new JSONWriter();
		String commandString = jw.write(parameters);
		return commandString;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
		this.addParameter(Message, message);
	}

	public void setSucceed(boolean succeed) {
		this.succeed = succeed;
		this.addParameter(Succeed, succeed);
	}
	
}
