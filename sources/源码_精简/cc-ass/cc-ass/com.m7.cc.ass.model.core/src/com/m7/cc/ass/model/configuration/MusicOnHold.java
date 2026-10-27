package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class MusicOnHold extends Context implements ServicePeer{
	public static final String NAME = "mod";
	
	private String account;
	private String pbx;
	private String musicClass;
	
	// =0|<0: no timeout
	private int holdtime = 45;
	
	// The next peer after timeout
	private String toPeer;
	
	public MusicOnHold(String pbx, String account, String exten) {
		super(account+"-"+exten+"-"+NAME, exten);
		this.account = account;
		this.pbx = pbx;
	}
	
	public String getAccount() {
		return account;
	}

	public String getMusic() {
		return musicClass;
	}

	public void setMusic(String music) {
		this.musicClass = music;
	}

	public int getHoldtime() {
		return holdtime;
	}

	public void setHoldtime(int holdtime) {
		this.holdtime = holdtime;
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

	public String getActionString() {
		return "goto "+this.getContext()+",\\$\\{FROM_DID\\},1";
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
		return null;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		return event;
	}
}
