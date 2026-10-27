package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author caizhibin 2009-6-10
 *
 */
public class SIPPeers extends AsteriskAction{

	public SIPPeers(String actionID) {
		super(AMIField.SIP_PEERS, actionID);
	}

}
