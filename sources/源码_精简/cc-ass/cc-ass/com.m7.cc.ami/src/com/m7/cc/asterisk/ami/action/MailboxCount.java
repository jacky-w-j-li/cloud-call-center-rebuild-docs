package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This class used to query messages of the mailbox.
 * @author Caif
 * @version 1.0, 2008-2-18
 */
public class MailboxCount extends AsteriskAction{
	private String mailbox;
	
	public MailboxCount(String mailbox, String actionID) {
		super(AMIField.MAILBOX_COUNT, actionID);
		this.mailbox = mailbox;
		this.addParameter(AMIField.MAILBOX, mailbox);
	}

	public String getMailbox() {
		return mailbox;
	}

}
