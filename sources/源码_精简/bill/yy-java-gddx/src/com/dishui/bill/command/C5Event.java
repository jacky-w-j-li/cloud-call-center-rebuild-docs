package com.dishui.bill.command;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class C5Event {
	public static final String Command = "Command";
	public static final String Event = "Event";
	
	private String eventName;
	private HashMap<String, Object> parameters;

	public C5Event(String eventName) {
		this.eventName = eventName;
		parameters = new HashMap<String, Object>();
		parameters.put(Command, Event);
		parameters.put(Event, eventName);
	}

	public void addParameter(String key, Object value) {
		parameters.put(key, value);
	}

	public HashMap<String, Object> getParameters() {
		return parameters;
	}

	public Object getParameterValue(String key) throws Exception {
		if (!parameters.containsKey(key))
			throw new Exception("["+key+"] not found in "+eventName);
		return parameters.get(key);
	}

	public String getEventName() {
		return eventName;
	}

	public Object removeParameter(String key) {
		return parameters.remove(key);
	}

	public void setValues(Map<String, Object> map){
		parameters.putAll(map);
	}
	
	public void setValues(Hashtable<String, String> map) {
		parameters.putAll(map);
	}
	
	public String getStringValue(String key) throws Exception{
		if(parameters.containsKey(key))
			return (String) parameters.get(key);
		else throw new Exception("["+key+"] not found in "+eventName);
	}

	public boolean getBoolValue(String key) throws Exception {
		if(parameters.containsKey(key))
			return (Boolean) parameters.get(key);
		else throw new Exception("["+key+"] not found in "+eventName);
	}

	public int getIntValue(String key) throws Exception {
		if(parameters.containsKey(key))
			return Integer.valueOf(parameters.get(key).toString());
		else throw new Exception("["+key+"] not found in "+eventName);
	}
	
	public String getJsonString() {
		JSONWriter jw = new JSONWriter();
		return jw.write(parameters);
	}
}
