package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class SIPShowPeer extends AsteriskAction{

	private String exten;
	
	public SIPShowPeer(String exten, String actionID) {
		super(AMIField.SIP_SHOW_PEER, actionID);
		this.exten = exten;
		this.addParameter(AMIField.PEER, exten);
	}
	
	public String getExten(){
		return exten;
	}
}
