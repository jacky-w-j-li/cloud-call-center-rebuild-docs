package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;


public class WeixinAddr extends Context implements ServicePeer {
	public static final String NAME = "WeixinAddr";
	
	private String account;
	private String pbx;
	private String toPeer = "0";
	
	private String displayName ;
	
	private int inMails = 0;
	private int inComplete = 0;
	private int inLosts = 0;

	public WeixinAddr(String pbx, String account, String exten) {
		super(exten, exten);
		this.account = account;
		this.pbx = pbx;
		this.displayName = "mailaddr-" + exten;
	}

	public String getAccount() {
		return account;
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
	
	public int getInMails() {
		return inMails;
	}

	public void setInMails(int inMails) {
		this.inMails = inMails;
	}

	public int getInComplete() {
		return inComplete;
	}

	public void setInComplete(int inComplete) {
		if(inComplete > inMails)
			inComplete = inMails;
		this.inComplete = inComplete;
	}

	public int getInLosts() {
		return inLosts;
	}

	public void setInLosts(int inLosts) {
		this.inLosts = inLosts;
	}

	public void setValue(Hashtable<String, String> data){
		toPeer = data.get(Fields.ToPeer);
	}
	
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.TrunkStatus);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.MailAddr, this.getExten());
		event.addParameter(Fields.InMails, inMails);
		event.addParameter(Fields.InComplete, inComplete);
		event.addParameter(Fields.InLost, inLosts);
		event.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
		event.addParameter(Fields.DisplayName, displayName);
		return event;
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
			this.displayName = "weixinaddr-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public String getActionString() {
		// TODO Auto-generated method stub
		return null;
	}
}
