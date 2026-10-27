package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Vector;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * Audio menu
 * 
 * @author Cai Zhibin 2009-11-16
 * 
 */
public class IVR extends Context implements ServicePeer {

	public static final String NAME = "ivr";
	private String pbx;
	private String account;
	private Music music;
	// seconds
	private int timeout = 20;
	private int retry_time = 3;

	private String displayName;

	private Vector<IVRKey> ivrKeys = new Vector<IVRKey>();

	public IVR(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "ivr-" + exten;
	}

	public void setValue(Hashtable<String, String> data) {
		try {
			this.setTimeout(Integer.valueOf(data.get(Fields.Timeout)));
			this.setRetry_time(Integer.valueOf(data.get(Fields.RetryTime)));
			if (data.containsKey(Fields.Filename)) {
				music = new Music(pbx, account, data.get(Fields.Filename));
				music.setPlayback(false);
			}
			if (data.containsKey(Fields.IvrKey)) {
				String[] keys = data.get(Fields.IvrKey).split(",");
				for (int i = 0; i < keys.length; i++) {
					String[] a = keys[i].split("@");
					IVRKey ivrKey = new IVRKey(a[0]);
					if (a[1].equalsIgnoreCase("null"))
						ivrKey.setToPeer(null);
					else
						ivrKey.setToPeer(a[1]);
					this.addIvrKey(ivrKey);
				}
			}
		} catch (Exception e) {

		}
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public Vector<IVRKey> getIvrKeys() {
		return ivrKeys;
	}

	public void addIvrKey(IVRKey key) {
		if (key != null)
			ivrKeys.add(key);
	}

	public String getAccount() {
		return account;
	}

	public String getPbx() {
		return pbx;
	}

	public int getTimeout() {
		return timeout;
	}

	public void setTimeout(int timeout) {
		this.timeout = timeout;
	}

	public int getRetry_time() {
		return retry_time;
	}

	public void setRetry_time(int retry_time) {
		this.retry_time = retry_time;
	}

	public String getIvrKeyString() {
		String a = "";
		for (int i = 0; i < ivrKeys.size(); i++) {
			IVRKey key = ivrKeys.get(i);
			a += key.getKey() + "@" + key.getToPeer() + ",";
		}
		if (a.endsWith(","))
			a = a.substring(0, a.length() - 1);
		else
			a = null;
		return a;
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
			this.displayName = "ivr-"
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
		if (getIvrKeys().size() > 0) {
			String ivrKey = "";
			for (int i = 0; i < getIvrKeys().size(); i++) {
				IVRKey key = getIvrKeys().get(i);
				ivrKey += key.getKey() + "@" + key.getToPeer() + ",";
			}
			if (ivrKey.endsWith(","))
				ivrKey = ivrKey.substring(0, ivrKey.length() - 1);
			event.addParameter(Fields.IvrKey, ivrKey);
		}
		event.addParameter(Fields.Timeout, getTimeout() + "");
		event.addParameter(Fields.RetryTime, getRetry_time() + "");

		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}

}
