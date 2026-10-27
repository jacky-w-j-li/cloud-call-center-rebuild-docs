package com.m7.cc.ass.server.monitor.model;

import com.m7.cc.ass.server.monitor.util.MonitorFields;

public class AccountCount {
	private String accounnt;
	private int callIn;
	private int callOut;
	
	public AccountCount(String account) {
		this.accounnt = account;
	}
	 
	public String getAccounnt() {
		return accounnt;
	}
	public void setAccounnt(String accounnt) {
		this.accounnt = accounnt;
	}
	public int getCallIn() {
		return callIn;
	}
	public void setCallIn(int callIn) {
		this.callIn = callIn;
	}
	public int getCallOut() {
		return callOut;
	}
	public void setCallOut(int callOut) {
		this.callOut = callOut;
	}
	
	public String toString() {
		String status = "{"+ MonitorFields.CallIn + ":\"" + this.callIn + "\""
						+","+ MonitorFields.CallOut + ":\"" + this.callOut + "\""
						+"}";
		return status;
	}
}
