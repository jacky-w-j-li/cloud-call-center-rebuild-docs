package com.m7.cc.ass.config.model;

public class Binded400 {
	private String accountId;
	private String numberOf400;
	private String serviceNo;
	private String isCallable;

	public Binded400(String accountId, String numberOf400, String serviceNo, String isCallable) {
		this.accountId = accountId;
		this.numberOf400 = numberOf400;
		this.serviceNo = serviceNo;
		this.isCallable = isCallable;
	}

	public String getAccountId() {
		return accountId;
	}

	public void setAccountId(String accountId) {
		this.accountId = accountId;
	}

	public String getNumberOf400() {
		return numberOf400;
	}

	public void setNumberOf400(String numberOf400) {
		this.numberOf400 = numberOf400;
	}

	public String getServiceNo() {
		return serviceNo;
	}

	public void setServiceNo(String serviceNo) {
		this.serviceNo = serviceNo;
	}

	public String getIsCallable() {
		return isCallable;
	}

	public void setIsCallable(String isCallable) {
		this.isCallable = isCallable;
	}

}
