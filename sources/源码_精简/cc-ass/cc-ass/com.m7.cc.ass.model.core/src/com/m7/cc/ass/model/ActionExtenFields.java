package com.m7.cc.ass.model;

/*
 * Aman zhai. 2010.05.12 
 */

import java.util.Hashtable;
import java.util.Iterator;
import java.util.Vector;

import com.m7.cc.util.Utils;

public class ActionExtenFields {

	private Hashtable<String, Object> extenFields;

	public ActionExtenFields() {
		extenFields = new Hashtable<String, Object>();
	}

	public void addOrUpdateParameter(String key, Object value) {
		if (null != key && null != value)
			extenFields.put(key, value);
	}

	public boolean containKey(String key) {
		return extenFields.containsKey(key);
	}

	public void addOrUpdateParameters(Hashtable<String, Object> map) {
		if (null != map)
			extenFields.putAll(map);
	}
	
	// Aman zhai. 2010.05.11
	private Object changeToObject(String str){
		Object value = null;
		if (Utils.isNumeric(str)) {
			value = Integer.parseInt(str);
		} else if (str.equalsIgnoreCase("true")) {
			value = Boolean.TRUE;
		} else if (str.equalsIgnoreCase("false")) {
			value = Boolean.FALSE;
		} else {
			value = str;
		}
		return value;
	}

	public Hashtable<String, Object> getHashtableStringObject(Hashtable<String, String> params) {
		Hashtable<String, Object> result = new Hashtable<String, Object>();
		Object value;
		Iterator<String> iterator = params.keySet().iterator();
		while (iterator.hasNext()) {
			String key = iterator.next();
			String valParam = params.get(key);
			if(key.equals("PbxCustomArea")){
				value = valParam;
			}else{
				value = changeToObject(valParam);				
			}
			result.put(key, value);
		}
		return result;
	}
	// <--
	
	
	public void removeParameters(Vector<String> array) {
		if (null != array)
		{
			for (int i = 0; i < array.size(); i++)
			{
				String fieldKey = array.get(i);
				if (extenFields.containsKey(fieldKey))
					extenFields.remove(fieldKey);
			}
		}	
	}

	public void setParameter(String key, Object value) {
		extenFields.put(key, value);
	}

	public Hashtable<String, Object> getParameters() {
		return extenFields;
	}

	public Object getParameterValue(String key) {
		if (!extenFields.containsKey(key))
			return null;
		return extenFields.get(key);
	}

	public String getStringValue(String key) throws Exception {
		if (extenFields.containsKey(key))
			return extenFields.get(key).toString();
		else
			throw new Exception("[" + key + "] not found in " + "extenFields");
	}

	public boolean getBoolValue(String key) throws Exception {
		if (extenFields.containsKey(key))
			return (Boolean) extenFields.get(key);
		else
			throw new Exception("[" + key + "] not found in " + "extenFields");
	}

	public int getIntValue(String key) throws Exception {
		if (extenFields.containsKey(key))
			return Integer.valueOf(extenFields.get(key).toString());
		else
			throw new Exception("[" + key + "] not found in " + "extenFields");
	}

	public void clear() {
		if (null != this.extenFields)
			extenFields.clear();
	}

}
