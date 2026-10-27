package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class ExtensionPeer extends Context implements ServicePeer{
	
	public static final String NAME="ExtensionPeer";
	
	private String dialplan;
	
	private String displayName;
	
	public ExtensionPeer(String exten) {
		super(exten+"-"+NAME, exten);
		this.displayName = "extensionpeer-" + exten;
	}

	public void addValues(HashMap<String, Object> map) {
		if(dialplan == null)
			dialplan = getContext()+" {\n\t_X. => {\n\t\tHangup;\n\t}\n}\n";
		map.put(Fields.DialPlan, dialplan);
	}

	public String getActionString() {
		//return "goto "+ getContext() + ",\\$\\{FROM_CID\\},1";
		return "goto "+ getContext() + ",s,1";
	}

	public String getServicePeerName() {
		return NAME;
	}

	public void setValues(HashMap<String, Object> map) {
		if(map.containsKey(Fields.DialPlan)){
			dialplan = (String)map.get(Fields.DialPlan);
			dialplan = dialplan.replaceAll("\r\n", "\n");
		} else {
			dialplan = getContext()+" {\n\n}\n";
		}
	}

	public String getDialplan() {
		return dialplan;
	}

	public void setDialplan(String dialplan) {
		if(dialplan == null)
			dialplan = getContext()+" {\n\t_X. => {\n\t\tHangup;\n\t}\n}\n";
		this.dialplan = dialplan;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "extensionpeer-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

}
