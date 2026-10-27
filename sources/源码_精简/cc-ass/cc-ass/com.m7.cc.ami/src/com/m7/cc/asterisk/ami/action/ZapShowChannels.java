package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * list all zap channels' status
 * @author Caif
 * @version 1.0, 2008-1-26
 */
public class ZapShowChannels extends AsteriskAction{

	public ZapShowChannels(String actionID) {
		super(AMIField.ZAP_SHOW_CHANNELS, actionID);
	}

}
