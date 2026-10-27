package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 
 * @author Cai Zhibin 2009-11-16
 * 
 */
public class Announcement extends Context implements ServicePeer {
	public static final String NAME = "announcement";
	private String account;
	private String pbx;
	private Music music;
	private String notbreak;

	private String displayName;



	// The next peer after annoucement, if it's null the call will
	// be hung up
	private String toPeer = "0";

	public Announcement(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "announcement-" + exten;
	}

	public boolean setValues(Hashtable<String, String> map) {
		try {
			this.setToPeer(map.get(Fields.ToPeer));
			if (map.containsKey(Fields.Filename)) {
				String musicFile = map.get(Fields.Filename);
				music = new Music(pbx, account, musicFile);
			}
		} catch (Exception e) {
			return false;
		}
		return true;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getNotbreak() {
		return notbreak;
	}

	public void setNotbreak(String notbreak) {
		this.notbreak = notbreak;
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
			this.displayName = "announcement-"
					+ ((null == this.getExten()) ? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		if (getMusic() != null)
			event.addParameter(Fields.Filename, getMusic().getMusicFile());
		if (getToPeer() != null)
			event.addParameter(Fields.ToPeer, getToPeer());
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		if (getNotbreak() != null)
			event.addParameter(Fields.NotBreak, getNotbreak());
		return event;
	}
}
