package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 
 * @author chenguang 2012-9-6
 * 
 */
public class Satisfaction extends Context implements ServicePeer {
	public static final String NAME = "satisfaction";
	private String account;
	private String pbx;
	
	private String data;
	
	private Music welmusic;
	private Music invalidmusic;
	private Music timeoutmusic;
	private Music byemusic;
	private Music endmusic;

	private String displayName;

	// The next peer after satisfaction, if it's null the call will
	// be hung up
	private String toPeer = "0";

	public Satisfaction(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "satisfaction-" + exten;
	}

	public boolean setValues(Hashtable<String, String> map) {
		try {
			this.setToPeer(map.get(Fields.ToPeer));
			
			if (map.containsKey(Fields.Data)) {
				this.setData((String) map.get(Fields.Data));
			}
			
			if (map.containsKey(Fields.Welfilename)) {
				String welmusicFile = map.get(Fields.Welfilename);
				welmusic = new Music(pbx, account, welmusicFile);
			}
			if (map.containsKey(Fields.Invalidfilename)) {
				String invalidmusicFile = map.get(Fields.Invalidfilename);
				invalidmusic = new Music(pbx, account, invalidmusicFile);
			}
			if (map.containsKey(Fields.Timeoutfilename)) {
				String timeoutmusicFile = map.get(Fields.Timeoutfilename);
				timeoutmusic = new Music(pbx, account, timeoutmusicFile);
			}
			if (map.containsKey(Fields.Byefilename)) {
				String byemusicFile = map.get(Fields.Byefilename);
				byemusic = new Music(pbx, account, byemusicFile);
			}
			if (map.containsKey(Fields.Endfilename)) {
				String endmusicFile = map.get(Fields.Endfilename);
				endmusic = new Music(pbx, account, endmusicFile);
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

	public String getData() {
		return data;
	}

	public void setData(String data) {
		this.data = data;
	}

	public Music getWelmusic() {
		return welmusic;
	}

	public void setWelmusic(Music welmusic) {
		this.welmusic = welmusic;
	}

	public Music getInvalidmusic() {
		return invalidmusic;
	}

	public void setInvalidmusic(Music invalidmusic) {
		this.invalidmusic = invalidmusic;
	}

	public Music getTimeoutmusic() {
		return timeoutmusic;
	}

	public void setTimeoutmusic(Music timeoutmusic) {
		this.timeoutmusic = timeoutmusic;
	}

	public Music getByemusic() {
		return byemusic;
	}

	public void setByemusic(Music byemusic) {
		this.byemusic = byemusic;
	}

	public Music getEndmusic() {
		return endmusic;
	}

	public void setEndmusic(Music endmusic) {
		this.endmusic = endmusic;
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

	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
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
			this.displayName = "satisfaction-"
					+ ((null == this.getExten()) ? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Data, data);
		
		if (getWelmusic() != null)
			event.addParameter(Fields.Welfilename, getWelmusic().getMusicFile());
		if (getInvalidmusic() != null)
			event.addParameter(Fields.Invalidfilename, getInvalidmusic().getMusicFile());
		if (getTimeoutmusic() != null)
			event.addParameter(Fields.Timeoutfilename, getTimeoutmusic().getMusicFile());
		if (getByemusic() != null)
			event.addParameter(Fields.Byefilename, getByemusic().getMusicFile());
		if (getEndmusic() != null)
			event.addParameter(Fields.Endfilename, getEndmusic().getMusicFile());
		if (getToPeer() != null)
			event.addParameter(Fields.ToPeer, getToPeer());
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		return event;
	}
}
