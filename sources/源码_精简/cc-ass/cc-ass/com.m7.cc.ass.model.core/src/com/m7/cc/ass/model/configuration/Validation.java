package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class Validation extends Context implements ServicePeer {
	public static final String NAME = "validate";

	public static final int END_LENGTH = 0;
	public static final int END_CHAR = 1;

	private String pbx;
	private String account;

	private Music music;
	private String data;
	private String nextPeer = "0";

	private int endType; // 0 length end; 1 char end
	private int waitTimeout = 20;
	private String nextPeerWhenTimeout = "0";
	private int endLength = 1;
	private String returnKey;
	private String endKey = "#";

	private String displayName;

	private int maxLength = 30;
	private int minLength = 0;

	public Validation(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = "validation-" + exten;
	}

	public void setValues(Hashtable<String, String> map) {
		int endType = Validation.END_CHAR;
		if (map.containsKey(Fields.EndType))
			endType = Integer.valueOf(map.get(Fields.EndType));
		this.setEndType(endType);
		this.setData((String) map.get(Fields.Data));
		this.setMinLength(Integer.valueOf(map.get(Fields.Min)));
		if (map.containsKey(Fields.WaitTime))
			this.setWaitTimeout(Integer.valueOf(map.get(Fields.WaitTime)));
		else
			this.setWaitTimeout(20);
		if (map.containsKey(Fields.Filename)) {
			music = new Music(pbx, account, map.get(Fields.Filename));
			music.setPlayback(false);
		}
		if (map.containsKey(Fields.ToPeer))
			this.setNextPeer(map.get(Fields.ToPeer));
		if (map.containsKey(Fields.ToPeerWhenTimeout))
			this.setNextPeerWhenTimeout(map.get(Fields.ToPeerWhenTimeout));
		if (map.containsKey(Fields.ReturnKey))
			this.setReturnKey(map.get(Fields.ReturnKey));

		if (Validation.END_LENGTH == endType) {
			if (map.containsKey(Fields.EndLength))
				this.setEndLength(Integer.valueOf(map.get(Fields.EndLength)));
			else
				this.setEndLength(1);
		} else if (Validation.END_CHAR == endType) {
			if (map.containsKey(Fields.Max))
				this.setMaxLength(Integer.valueOf(map.get(Fields.Max)));
			else
				this.setMaxLength(30);

			if (map.containsKey(Fields.EndKey))
				this.setEndKey(map.get(Fields.EndKey));
			else
				this.setEndKey("#");
		}

	}

	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}

	// Aman zhai. 2010.06.21
	public String getActionStringForIvrExten() {
		String result = null;

		result = "\t\tEXTEN_INPUT_NUMS_" + this.getExten()
				+ "= \\$\\{EXTEN\\};\n" + "\t\tgoto " + this.getContext()
				+ ", s, loop;\n";

		return result;
	}

	// <--

	public String getPbx() {
		return pbx;
	}

	public String getAccount() {
		return account;
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public String getData() {
		return data;
	}

	public void setData(String data) {
		this.data = data;
	}

	public String getNextPeer() {
		return nextPeer;
	}

	public void setNextPeer(String nextPeer) {
		this.nextPeer = nextPeer;
	}

	public int getMaxLength() {
		return maxLength;
	}

	public void setMaxLength(int maxLength) {
		this.maxLength = maxLength;
	}

	public int getMinLength() {
		return minLength;
	}

	public void setMinLength(int minLength) {
		this.minLength = minLength;
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

	public int getEndType() {
		return endType;
	}

	public void setEndType(int endType) {
		this.endType = endType;
	}

	public int getWaitTimeout() {
		return waitTimeout;
	}

	public void setWaitTimeout(int waitTimeout) {
		this.waitTimeout = waitTimeout;
	}

	public String getNextPeerWhenTimeout() {
		return nextPeerWhenTimeout;
	}

	public void setNextPeerWhenTimeout(String nextPeerWhenTimeout) {
		this.nextPeerWhenTimeout = nextPeerWhenTimeout;
	}

	public int getEndLength() {
		return endLength;
	}

	public void setEndLength(int endLength) {
		this.endLength = endLength;
	}

	public String getReturnKey() {
		return returnKey;
	}

	public void setReturnKey(String returnKey) {
		this.returnKey = returnKey;
	}

	public String getEndKey() {
		return endKey;
	}

	public void setEndKey(String endKey) {
		this.endKey = endKey;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "validation-"
					+ ((null == this.getExten()) ? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.DisplayName, displayName);
		if (getNextPeer() != null)
			event.addParameter(Fields.ToPeer, getNextPeer());
		if (null != getReturnKey())
			event.addParameter(Fields.ReturnKey, getReturnKey());
		if (null != getNextPeerWhenTimeout())
			event.addParameter(Fields.ToPeerWhenWaitTimeout,
					getNextPeerWhenTimeout());
		if (null != getDisplayName())
			event.addParameter(Fields.DisplayName, getDisplayName());
		event.addParameter(Fields.Data, getData());
		event.addParameter(Fields.WaitTime, getWaitTimeout() + "");
		int endType = getEndType();
		event.addParameter(Fields.EndType, endType + "");
		if (Validation.END_LENGTH == endType) {
			event.addParameter(Fields.EndLength, getEndLength() + "");
		} else if (Validation.END_CHAR == endType) {
			event.addParameter(Fields.Max, getMaxLength() + "");
		}
		event.addParameter(Fields.Min, getMinLength() + "");
		if (getMusic() != null)
			event.addParameter(Fields.Filename, getMusic().getMusicFile());
		return event;
	}
}
