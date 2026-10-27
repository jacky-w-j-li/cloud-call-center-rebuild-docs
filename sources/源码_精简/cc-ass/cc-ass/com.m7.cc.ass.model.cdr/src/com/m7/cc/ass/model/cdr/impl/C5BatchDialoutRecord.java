package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5BatchDialoutRecord extends C5Event {
	private String account;
	private String pbx;
	private String customerId;
	private String dialState;

	public C5BatchDialoutRecord() {
		super(Fields.BatchDialoutCdr);
	}

	public C5BatchDialoutRecord(String pbx, String account, String customerId,
			String dialState) {
		super(Fields.BatchDialoutCdr);
		this.pbx = pbx;
		this.account = account;
		this.customerId = customerId;
		this.dialState = dialState;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getDialState() {
		return dialState;
	}

	public void setDialState(String dialState) {
		this.dialState = dialState;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getJsonString() {
		String str = "{\"" + Fields.Command + "\":\"" + Fields.Event + "\"" + ",\""
				+ Fields.Event + "\":\"" + Fields.BatchDialoutCdr + "\"" + ",\""
				+ Fields.Account + "\":\"" + this.account + "\"" + ",\""
				+ Fields.DialState + "\":\"" + this.dialState + "\"" + ",\""
				+ Fields.CustomerID + "\":\"" + this.customerId + "\", \""
				+ Fields.PBX + "\":\"" + this.pbx + "\"}";
		return str;
	}

	public void setValues(Map<String, Object> map) {
		this.account = (String) map.get(Fields.Account);
		this.customerId = (String) map.get(Fields.CustomerID);
		this.dialState = (String) map.get(Fields.DialState);
	}

}
