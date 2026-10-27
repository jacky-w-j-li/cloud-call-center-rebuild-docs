package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * this action used to list all parked calls
 * @author Caif
 * @version 1.0, 2008-1-27
 */
public class ParkedCalls extends AsteriskAction{

	public ParkedCalls(String actionID) {
		super(AMIField.PARKED_CALLS, actionID);
	}

}
