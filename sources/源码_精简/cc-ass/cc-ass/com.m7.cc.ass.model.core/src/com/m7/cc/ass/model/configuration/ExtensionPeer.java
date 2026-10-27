package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.json.JSONWriter;

public class ExtensionPeer extends Context implements ServicePeer{
	
	public static final String NAME="ExtensionPeer";
	
	private String pbx;
	private String account;
	
	private String dialplan;
	
	private String displayName;
	
	public ExtensionPeer(String pbx, String account, String exten) {
		super(account+"-"+exten+"-"+NAME, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = "extensionpeer-" + exten;
	}

	public void addValues(HashMap<String, Object> map) {
		if(dialplan == null)
			dialplan = getContext()+" {\n\ts => {\n\t\tHangup;\n\t}\n}\n";
		map.put(Fields.DialPlan, dialplan);
	}

	public String getActionString() {
		return "goto "+ getContext() + ", s, 1";
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

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
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

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		JSONWriter jw = new JSONWriter();
		event.addParameter(Fields.DialPlan, jw.write(getDialplan()));
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}

}
