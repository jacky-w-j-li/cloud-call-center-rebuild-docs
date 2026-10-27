package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 
 * @author chenguang 2014-10-09
 * 
 */
public class SuperDialJobNum extends Context implements ServicePeer {
	public static final String NAME = "superDialJobNum";
	private String account;
	private String pbx;
	
	private Music music;
	
	private String toPeerNotExist = "0";
	private String toPeerAgentBusy = "0";
	private String toPeerLogoff = "0";
	private String toPeerFrontOffice = "0";

	private String displayName;

	public SuperDialJobNum(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + NAME, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "superDialJobNum-" + exten;
	}

	public boolean setValues(Hashtable<String, String> map) {
		try {
			
			if (map.containsKey(Fields.Filename)) {
				String welmusicFile = map.get(Fields.Filename);
				music = new Music(pbx, account, welmusicFile);
			}
			if (map.containsKey(Fields.ToPeer))
				this.setToPeerNotExist(map.get(Fields.ToPeer));

			if (map.containsKey(Fields.AgentBusyToPeer))
				this.setToPeerAgentBusy(map.get(Fields.AgentBusyToPeer));
			
			if (map.containsKey(Fields.LogoffToPeer))
				this.setToPeerLogoff(map.get(Fields.LogoffToPeer));
			
			if (map.containsKey(Fields.FrontOfficeToPeer))
				this.setToPeerFrontOffice(map.get(Fields.FrontOfficeToPeer));
			
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

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public Music getMusic() {
		return music;
	}

	public void setMusic(Music music) {
		this.music = music;
	}

	public String getToPeerNotExist() {
		return toPeerNotExist;
	}

	public void setToPeerNotExist(String toPeerNotExist) {
		this.toPeerNotExist = toPeerNotExist;
	}

	public String getToPeerAgentBusy() {
		return toPeerAgentBusy;
	}

	public void setToPeerAgentBusy(String toPeerAgentBusy) {
		this.toPeerAgentBusy = toPeerAgentBusy;
	}

	public String getToPeerLogoff() {
		return toPeerLogoff;
	}

	public void setToPeerLogoff(String toPeerLogoff) {
		this.toPeerLogoff = toPeerLogoff;
	}

	public String getToPeerFrontOffice() {
		return toPeerFrontOffice;
	}

	public void setToPeerFrontOffice(String toPeerFrontOffice) {
		this.toPeerFrontOffice = toPeerFrontOffice;
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
			this.displayName = "superDialJobNum-"
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
		if (getDisplayName() != null)
			event.addParameter(Fields.DisplayName, getDisplayName());
		event.addParameter(Fields.ToPeer, getToPeerNotExist());
		event.addParameter(Fields.AgentBusyToPeer, getToPeerAgentBusy());
		event.addParameter(Fields.LogoffToPeer, getToPeerLogoff());
		event.addParameter(Fields.FrontOfficeToPeer, getToPeerFrontOffice());
		return event;
	}
}
