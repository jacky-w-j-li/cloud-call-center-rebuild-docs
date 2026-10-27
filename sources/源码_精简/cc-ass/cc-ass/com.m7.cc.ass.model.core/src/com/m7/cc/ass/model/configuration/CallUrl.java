package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class CallUrl extends Context implements ServicePeer{

	private String pbx;
	private String account;
	
	private String url;
	private String displayName;
	private String var;
	private String md5Key = null;
	private Music music;
	//default 5 seconds
	private int timeout = 5;
	
	private String toPeerWhenTimeout = null;
	private String nextPeer = null;
	
	public CallUrl(String pbx, String account, String exten) {
		super(account+"-"+exten+"-"+Fields.callurl, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = "callurl-"+exten;
	}

	public String getPbx() {
		return pbx;
	}

	public String getAccount() {
		return account;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public int getTimeout() {
		return timeout;
	}

	public void setTimeout(int timeout) {
		this.timeout = timeout;
	}
	
	public String getToPeerWhenTimeout() {
		return toPeerWhenTimeout;
	}

	public void setToPeerWhenTimeout(String toPeerWhenTimeout) {
		this.toPeerWhenTimeout = toPeerWhenTimeout;
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

	public String getMd5Key() {
		return md5Key;
	}

	public void setMd5Key(String md5Key) {
		this.md5Key = md5Key;
	}

	public void setValue(Hashtable<String, String> data) {
		try {
			this.toPeerWhenTimeout = data.get(Fields.ToPeerWhenTimeout);
			this.nextPeer = data.get(Fields.NextPeer);
			this.url = data.get(Fields.Url);
			this.var = data.get(Fields.Variable);
			this.setTimeout(Integer.valueOf(data.get(Fields.Timeout)));
			if(data.containsKey(Fields.MD5)){
				this.md5Key = data.get(Fields.MD5);
			} else this.md5Key = null;
			
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
		return Fields.callurl;
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
		event.addParameter(Fields.Timeout, getTimeout() + "");
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		if (getToPeerWhenTimeout() != null)
			event.addParameter(Fields.ToPeerWhenTimeout, getToPeerWhenTimeout());
		if (getNextPeer() != null) {
			event.addParameter(Fields.NextPeer, getNextPeer());
		}
		if (getUrl() != null) {
			event.addParameter(Fields.Url, getUrl());
		}
		if (getMd5Key() != null) {
			event.addParameter(Fields.MD5, getMd5Key());
		}
		
		if (getVar() != null) {
			event.addParameter(Fields.Variable, getVar());
		}
		return event;
	}

}
