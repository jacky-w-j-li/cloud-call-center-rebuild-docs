package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;


public class ServiceNo extends Context implements ServicePeer {
	public static final String NAME = "ServiceNo";
	
	private String account;
	private String pbx;
	private Music welcomeMusic;
	private String toPeer = "0";
	
	private String type = Fields.normal;
	private String displayName ;
	
	private int inCalls = 0;
	private int inComplete = 0;
	private int inLosts = 0;

	public ServiceNo(String pbx, String account, String exten) {
		super(exten, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "serviceno-" + exten;
	}

	public String getAccount() {
		return account;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public Music getWelcomeMusic() {
		return welcomeMusic;
	}

	public void setWelcomeMusic(Music welcomeMusic) {
		this.welcomeMusic = welcomeMusic;
	}

	public String getPbx() {
		return pbx;
	}
	
	public int getInCalls() {
		return inCalls;
	}

	public void setInCalls(int inCalls) {
		this.inCalls = inCalls;
	}

	public int getInComplete() {
		return inComplete;
	}

	public void setInComplete(int inComplete) {
		if(inComplete > inCalls)
			inComplete = inCalls;
		this.inComplete = inComplete;
	}

	public int getInLosts() {
		return inLosts;
	}

	public void setInLosts(int inLosts) {
		this.inLosts = inLosts;
	}
	
	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public void setValue(Hashtable<String, String> data){
		toPeer = data.get(Fields.ToPeer);
		if (data.containsKey(Fields.Filename)) {
			welcomeMusic = new Music(pbx, account, data.get(Fields.Filename));
			welcomeMusic.setPlayback(true);
		}
		if (data.containsKey(Fields.Type)) {
			this.type = data.get(Fields.Type);
		}
	}
	
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.TrunkStatus);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.ServiceNo, this.getExten());
		event.addParameter(Fields.InCalls, inCalls);
		event.addParameter(Fields.InComplete, inComplete);
		event.addParameter(Fields.InLost, inLosts);
		event.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
		event.addParameter(Fields.DisplayName, displayName);
		return event;
	}

	public String getActionString() {
		return "goto " + this.getContext() + ",\\$\\{FROM_DID\\},1";
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
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "serviceno-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}
}
