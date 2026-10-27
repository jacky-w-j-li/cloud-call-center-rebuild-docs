package com.dishui.bill.command;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class C5Action {
	public static final String Command = "Command";
	public static final String Action = "Action";
	public static final String ActionID = "ActionID";
	
	private String actionName;

	private String actionID;

	private HashMap<String, Object> parameters;

	public C5Action(String actName, String actionID) {
		this.actionName = actName;
		this.actionID = actionID;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Action);
		parameters.put(Action, actionName);
		parameters.put(ActionID, actionID);
	}
	
	public C5Action(String actionName, String actionID, Map<String, Object> map){
		this.actionName = actionName;
		this.actionID = actionID;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Action);
		parameters.put(Action, actionName);
		parameters.put(ActionID, actionID);
		try {
			this.setValues(map);
		} catch (Exception e) {
		}
	}

	public void addParameter(String key, Object value) {
//		if(value == null){
//			log.warning("Null value of ["+key+"] in "+this.actionName);
//			throw new NullPointerException(key+" is null");
//		}
		parameters.put(key, value);
	}

	public HashMap<String, Object> getParameters() {
		return parameters;
	}
	
	public boolean hasKey(String key){
		return parameters.containsKey(key);
	}

	public Object getParameterValue(String key) throws Exception {
		if (!parameters.containsKey(key))
			throw new Exception("["+key+"] not found in "+actionName);
		return parameters.get(key);
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

	public Object removeParameter(String key) {
		return parameters.remove(key);
	}

	public String getActionName() {
		return actionName;
	}
	
	public String getStringValue(String key) throws Exception{
		if(parameters.containsKey(key)){
			Object b = parameters.get(key);
			if(b != null)
				return (String) b;
			else return null;
		}
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

	public boolean setValues(Map<String, Object> map){
		parameters.putAll(map);
		return true;
	}
	
	public boolean setValues(Hashtable<String, String> map){
		parameters.putAll(map);
		return true;
	}

	public String getJsonString() {
		JSONWriter jw = new JSONWriter();
		return jw.write(parameters);
	}
}
