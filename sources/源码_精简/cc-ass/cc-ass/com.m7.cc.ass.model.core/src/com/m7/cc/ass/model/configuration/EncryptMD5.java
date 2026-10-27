package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class EncryptMD5 extends Context implements ServicePeer{
	private String pbx;
	private String account;
	
	private String displayName;
	private String encryptText;
	private String var;
	private String nextPeer = null;
	
	public EncryptMD5(String pbx, String account, String exten){
		super(account+"-"+exten+"-"+Fields.EncryptMD5, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = Fields.EncryptMD5 + "-" + exten;
	}
	
	public void setValue(Hashtable<String, String> data){
		this.nextPeer = data.get(Fields.NextPeer);
		this.encryptText = data.get(Fields.EncryptText);
		this.var = data.get(Fields.Variable);
		
		if(data.containsKey(Fields.DisplayName)) {
			this.displayName = data.get(Fields.DisplayName);
		}
	}
	
	@Override
	public void addValues(HashMap<String, Object> map) {
	}
	
	@Override
	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}
	
	@Override
	public String getDisplayName() {
		return this.displayName;
	}
	
	@Override
	public String getServicePeerName() {
		return Fields.TextAnnouncement;
	}
	
	@Override
	public void setValues(HashMap<String, Object> map) {
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
	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}
	public String getEncryptText() {
		return encryptText;
	}
	public void setEncryptText(String encryptText) {
		this.encryptText = encryptText;
	}
	public String getVar() {
		return var;
	}
	public void setVar(String var) {
		this.var = var;
	}
	public String getNextPeer() {
		return nextPeer;
	}
	public void setNextPeer(String nextPeer) {
		this.nextPeer = nextPeer;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.EncryptText, getEncryptText());
		event.addParameter(Fields.Variable, getVar());
		if (getNextPeer() != null) {
			event.addParameter(Fields.NextPeer, getNextPeer());
		}
		if (getDisplayName() != null) {
			event.addParameter(Fields.DisplayName, getDisplayName());
		}
		return event;
	}
	
	
}
