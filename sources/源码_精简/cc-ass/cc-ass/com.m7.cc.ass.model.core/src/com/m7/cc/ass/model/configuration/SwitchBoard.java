package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class SwitchBoard extends Context implements ServicePeer {
	public static final String NAME = "switchboard";
	public String account;
	public String pbx;
	public String queue;
	public Music music;
	public String displayName;

	public SwitchBoard(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = NAME + "-" + exten;
	}

	@Override
	public void addValues(HashMap<String, Object> map) {
		if (map.containsKey(Fields.Filename)) {
			music = new Music(pbx, account, map.get(Fields.Filename).toString());
		} else {
			music = null;
		}
		if (map.containsKey(Fields.Queue)) {
			this.queue = map.get(Fields.Queue).toString();
		}
		if (map.containsKey(Fields.DisplayName)) {
			this.displayName = map.get(Fields.DisplayName).toString();
		}

	}

	@Override
	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}

	@Override
	public String getServicePeerName() {
		return NAME;
	}

	@Override
	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey(Fields.Filename)) {
			music = new Music(pbx, account, map.get(Fields.Filename).toString());
		} else {
			music = null;
		}
		if (map.containsKey(Fields.Queue)) {
			this.queue = map.get(Fields.Queue).toString();
		}
		if (map.containsKey(Fields.DisplayName)) {
			this.displayName = map.get(Fields.DisplayName).toString();
		}
	}
	
	@Override
	public String getDisplayName() {
		return this.displayName;
	}

	@Override
	public C5Event getStateEvent() {
		// TODO Auto-generated method stub
		return null;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getQueue() {
		return queue;
	}

	public void setQueue(String queue) {
		this.queue = queue;
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public void setValues(Hashtable<String, String> map) {
		if (map.containsKey(Fields.Filename)) {
			music = new Music(pbx, account, map.get(Fields.Filename));
		} else {
			music = null;
		}
		if (map.containsKey(Fields.Queue)) {
			this.queue = map.get(Fields.Queue);
		}
		if (map.containsKey(Fields.DisplayName)) {
			this.displayName = map.get(Fields.DisplayName);
		}
	}

}
