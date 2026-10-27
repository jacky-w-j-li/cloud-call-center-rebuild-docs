package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class Voicemail extends Context implements ServicePeer{
	public static final String NAME = "voicemail";
	
	private String pbx;
	private String account;
	private Music welcomeMusic;
	private String toPeer;
	private String displayName;
	
	public Voicemail(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = "voicemail-" + exten;
	}

	public boolean setValues(Hashtable<String, String> map) {
		if(map.containsKey(Fields.Filename)){
			Music music = new Music(pbx, account, map.get(Fields.Filename));
			music.setPlayback(true);
			this.welcomeMusic = music;
		}
		return true;
	}
	
	public String getActionString() {
		return "goto "+this.getContext()+",s,1";
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

	public String getAccount() {
		return account;
	}

	public void setValues(HashMap<String, Object> map) {
		if(map.containsKey(Fields.Filename)){
			welcomeMusic = new Music(pbx, account, (String)map.get(Fields.Filename));
			welcomeMusic.setPlayback(true);
		} else {
			welcomeMusic = null;
		}
		if(map.containsKey(Fields.ToPeer)){
			this.setToPeer((String) map.get(Fields.ToPeer));
		}else{
			this.setToPeer(null);
		}
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		if(welcomeMusic != null)
			map.put(Fields.Filename, welcomeMusic.getMusicFile());
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "voicemail-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.DisplayName, displayName);
		if (getWelcomeMusic() != null)
			event.addParameter(Fields.Filename, getWelcomeMusic()
					.getMusicFile());
		return event;
	}
}
