package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class TwowayCall extends Context implements ServicePeer{

	private String pbx;
	private String account;
	
	private String displayName;
	private String var;
	private String variable;
	private Music music;
	private String nextPeer = null;
	
	public TwowayCall(String pbx, String account, String exten) {
		super(account+"-"+exten+"-"+Fields.twowaycall, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = "twowaycall-"+exten;
	}

	public String getPbx() {
		return pbx;
	}

	public String getAccount() {
		return account;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getVariable() {
		return variable;
	}

	public void setVariable(String variable) {
		this.variable = variable;
	}
	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public String getNextPeer() {
		return nextPeer;
	}

	public void setNextPeer(String nextPeer) {
		this.nextPeer = nextPeer;
	}

	public String getVar() {
		return var;
	}

	public void setVar(String var) {
		this.var = var;
	}

	public void setValue(Hashtable<String, String> data) {
		try {
			this.nextPeer = data.get(Fields.NextPeer);
			// this.var = data.get(Fields.Variable);
			this.variable = data.get(Fields.Variable);
			
			if(data.containsKey(Fields.Filename)) {
				music = new Music(pbx, account, data.get(Fields.Filename));
				music.setPlayback(false);
			}
			if(data.containsKey(Fields.DisplayName)) {
				this.displayName = data.get(Fields.DisplayName);
			}
		} catch (Exception e) {
			
		}
	}

	@Override
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public String getActionString() {
		return "goto "+this.getContext()+",s,1";
	}

	@Override
	public String getDisplayName() {
		return displayName;
	}

	@Override
	public String getServicePeerName() {
		return Fields.twowaycall;
	}

	@Override
	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		if (getMusic() != null)
			event.addParameter(Fields.Filename, getMusic()
					.getMusicFile());
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		if (getNextPeer() != null) {
			event.addParameter(Fields.NextPeer, getNextPeer());
		}
		
//		if (getVar() != null) {
//			event.addParameter(Fields.Variable, getVar());
//		}
		
		if (getVariable() != null) {
			event.addParameter(Fields.Variable, getVariable());
		}
		return event;
	}

}
