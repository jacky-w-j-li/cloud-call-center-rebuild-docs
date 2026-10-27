package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class DialextenNode extends Context implements ServicePeer {
	public static final String NAME = "DialextenNode";
	private String pbx;
	private String account;
	private Music music;
	// seconds
	private int timeout = 20;
	private int extenLen = 3;

	private String displayName;

	private String toPeerWhenTimeout = "0";

	public DialextenNode(String pbx, String account, String exten) {
		super(account + "-" + exten + "dial-exten", exten);
		this.pbx = pbx;
		this.account = account;
		toPeerWhenTimeout = "";
	}

	public String getActionString() {
		return "goto " + this.getContext() + ", s, 1";
	}

	public String getServicePeerName() {
		String result = null;
		result = NAME;
		return result;
	}

	public void addValues(HashMap<String, Object> map) {
	}

	public void setValues(HashMap<String, Object> map) {

	}

	public void setValue(Hashtable<String, String> data) {
		try {
			if (data.containsKey(Fields.Timeout))
				this.setTimeout(Integer.valueOf(data.get(Fields.Timeout)));
			if (data.containsKey(Fields.ExtenLen))
				this.setExtenLen(Integer.valueOf(data.get(Fields.ExtenLen)));
			if (data.containsKey(Fields.ToPeerWhenTimeout))
				this.setToPeerWhenTimeout(data.get(Fields.ToPeerWhenTimeout));
			if (data.containsKey(Fields.Filename)) {
				music = new Music(pbx, account, data.get(Fields.Filename));
				music.setPlayback(false);
			}

		} catch (Exception e) {

		}
	}

	// /////////////////////////////////
	// set and get
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

	public int getExtenLen() {
		return extenLen;
	}

	public void setExtenLen(int extenLen) {
		this.extenLen = extenLen;
	}

	public String getToPeerWhenTimeout() {
		return toPeerWhenTimeout;
	}

	public void setToPeerWhenTimeout(String toPeerWhenTimeout) {
		this.toPeerWhenTimeout = toPeerWhenTimeout;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		if (getMusic() != null)
			event.addParameter(Fields.Filename, getMusic().getMusicFile());

		event.addParameter(Fields.Timeout, getTimeout() + "");
		event.addParameter(Fields.ExtenLen, getExtenLen() + "");

		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());

		if (!"".equals(getToPeerWhenTimeout())
				&& null != getToPeerWhenTimeout())
			event
					.addParameter(Fields.ToPeerWhenTimeout,
							getToPeerWhenTimeout());
		return event;
	}
}
