package com.m7.cc.ass.model.configuration;

import java.util.Hashtable;

public class SatisfactionOptions{
	public static final String CONFIG_ITEM_PREFIX = ",";
	public static final String ITEM_KEY_VALUE_PREFIX = "=";
	
	
	private Hashtable<String,String> options = new Hashtable<String, String>();
	
	public SatisfactionOptions(){
	}
	
	public void setValue(String configString) {
		configString=configString.substring(1,configString.length()-1);
		String[] configArr = configString.split(CONFIG_ITEM_PREFIX);
		String[] configItem;

		for(String item : configArr){
			configItem = item.split(ITEM_KEY_VALUE_PREFIX);

			options.put(configItem[0].trim(), configItem[1].trim());
		}
	}
	public void clear(){
		this.options.clear();
	}

	public Hashtable<String, String> getOptions() {
		return options;
	}

	public void setOptions(Hashtable<String, String> options) {
		this.options = options;
	}
	
	
	
}
