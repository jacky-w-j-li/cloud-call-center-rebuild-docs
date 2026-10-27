package com.m7.cc.ass.model;

/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class C5Voicemail {
	private String astID;
	private String mailbox;
	private int newMessages = 0;
	private int oldMessages = 0;
	private String exten;
	
	public C5Voicemail(String mailbox, String id){
		this.mailbox = mailbox;
		astID = id;
	}
	
	public String getAstID() {
		return astID;
	}

	/**
	 * Event: voicemail
	 * Mailbox: 1001@default
	 * Exten: 1001
	 * NewMessages: 1
	 * OldMessages: 0
	 * @return
	 */
	public String getStatusString(){
//		String status = AMIField.EVENT+AMIField.SPLIT+" "+AMIField.VOICEMAIL+AMIField.END_LINE
//						+AMIField.MAILBOX+AMIField.SPLIT+" "+mailbox+AMIField.END_LINE
//						+AMIField.EXTEN+AMIField.SPLIT+" "+exten+AMIField.END_LINE
//						+AMIField.NEW_MESSAGES+AMIField.SPLIT+" "+newMessages+AMIField.END_LINE
//						+AMIField.OLD_MESSAGES+AMIField.SPLIT+" "+oldMessages+AMIField.END_LINE;
//		status = status+AMIField.END_ACTION;
		return "";
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public int getNewMessages() {
		return newMessages;
	}

	public void setNewMessages(int newMessages) {
		this.newMessages = newMessages;
	}

	public int getOldMessages() {
		return oldMessages;
	}

	public void setOldMessages(int oldMessages) {
		this.oldMessages = oldMessages;
	}

	public String getMailbox() {
		return mailbox;
	}
}
