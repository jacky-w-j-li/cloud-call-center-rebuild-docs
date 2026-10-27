package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class RedList extends Context implements ServicePeer {
	public static final String NAME = "redlist";

	private String pbx;
	private String account;
	private String displayName;
	private String list;
	
	public RedList(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "redlist-" + exten;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "redlist-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getAccount() {
		return account;
	}

	public String getPbx() {
		return pbx;
	}
	
	public void setValue(Hashtable<String, String> data){
		try{
			if(data.containsKey(Fields.List)){
				this.list = data.get(Fields.List).toString();
			}
		}catch (Exception e){
			
		}
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getList() {
		return list;
	}

	public void setList(String list) {
		this.list = list;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.List, list);
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}

	@Override
	public String getActionString() {
		// TODO Auto-generated method stub
		return null;
	}
}
