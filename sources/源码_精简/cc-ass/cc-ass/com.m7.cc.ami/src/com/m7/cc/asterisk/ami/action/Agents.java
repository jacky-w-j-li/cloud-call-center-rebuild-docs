package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * show all gents's status
 * @author Caif
 * @version 1.0, 2008-1-26
 */
public class Agents extends AsteriskAction{

	public Agents(String actionID) {
		super(AMIField.AGENTS, actionID);
	}

}
