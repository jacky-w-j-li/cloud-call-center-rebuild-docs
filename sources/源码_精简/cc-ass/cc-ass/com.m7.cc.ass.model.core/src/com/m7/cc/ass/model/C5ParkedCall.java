package com.m7.cc.ass.model;

/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class C5ParkedCall {
	private String astID;
	
	//the exten, any one can dial it to invoke the call
	private String exten = "";
	private String callerIDName = "";
	private String callerID = "";
	
	//the parked channel
	private String channel = "";
	
	//the parked timeout
	private String timeout;
	
	//who will invoke it
	private String fromChannel = "";
	
	/**
	 * 
	 * @param exten the exten, any one can dial it to invoke the call
	 * @param channel the parked channel
	 * @param fromChannel who will invoke it
	 * @param timeout the parked timeout
	 */
	public C5ParkedCall(String exten, String channel,
			String fromChannel, String timeout, String id){
		this.exten = exten;
		this.channel = channel;
		this.fromChannel = fromChannel;
		this.timeout = timeout;
		this.astID = id;
	}
	
	/**
	 * Event: ParkedCall
	 * Exten: 701
	 * Channel: SIP/1001-12U39172
	 * From: SIP/1002-SHDFI0193
	 * Timeout: 45
	 * CallerID: 1001
	 * CallerIDName: caif
	 * @return
	 */
	public String getStatusString(){
//		String status = AMIField.EVENT+AMIField.SPLIT+" "+AMIField.PARKED_CALL+AMIField.END_LINE
//					+AMIField.EXTEN+AMIField.SPLIT+" "+exten+AMIField.END_LINE
//					+AMIField.CHANNEL+AMIField.SPLIT+" "+channel+AMIField.END_LINE;
//		if(fromChannel != null)
//			status = status+AMIField.FROM+AMIField.SPLIT+" "+fromChannel+AMIField.END_LINE;
//		if(timeout != null)
//			status = status+AMIField.TIMEOUT+AMIField.SPLIT+" "+timeout+AMIField.END_LINE;
//		if(callerID != null)
//			status = status+AMIField.CALLERID+AMIField.SPLIT+" "+callerID+AMIField.END_LINE;
//		if(callerIDName != null)
//			status = status+AMIField.CALLERIDNAME+AMIField.SPLIT+" "+callerIDName+AMIField.END_LINE;
//		status =status+AMIField.END_ACTION;
		return "";
	}

	public String getAstID() {
		return astID;
	}

	public String getCallerID() {
		return callerID;
	}

	public void setCallerID(String callerID) {
//		if(callerID == null || callerID.equalsIgnoreCase(AMIField.NULL)
//				|| callerID.equalsIgnoreCase(AMIField.UNKNOWN))
//			return;
//		this.callerID = callerID;
	}

	public String getCallerIDName() {
		return callerIDName;
	}

	public void setCallerIDName(String callerIDName) {
//		if(callerIDName == null || callerIDName.equalsIgnoreCase(AMIField.NULL)
//				|| callerIDName.equalsIgnoreCase(AMIField.UNKNOWN))
//			return;
		this.callerIDName = callerIDName;
	}

	public String getChannel() {
		return channel;
	}

	public String getExten() {
		return exten;
	}

	public String getFromChannel() {
		return fromChannel;
	}

	public String getTimeout() {
		return timeout;
	}
}
