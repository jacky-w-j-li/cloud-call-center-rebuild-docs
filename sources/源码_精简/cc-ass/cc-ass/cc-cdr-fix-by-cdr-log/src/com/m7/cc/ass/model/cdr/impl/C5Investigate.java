package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5Investigate extends C5Event{
	private String survey_id;
	private String agent_id;
	private String survey_time;
	private String call_sheet_id;
	private String surver_content;
	private String account_id;
	public C5Investigate() {
		super(Fields.Investigate);
	}

	@Override
	public void setValues(Map<String, Object> map) {
			this.setSurver_content((String)map.get(Fields.Content));
			this.setAccount_id((String)map.get(Fields.Account));
			this.setAgent_id((String)map.get(Fields.UserID));
			this.setCall_sheet_id((String)map.get(Fields.CallSheetID));
			this.setSurvey_id((String)map.get(Fields.id));
			this.setSurvey_time((String)map.get(Fields.Timestamp));
	}

	public String getSurvey_id() {
		return survey_id;
	}

	public void setSurvey_id(String survey_id) {
		this.survey_id = survey_id;
		this.addParameter(Fields.id, survey_id);
	}

	public String getAgent_id() {
		return agent_id;
	}

	public void setAgent_id(String agent_id) {
		if(agent_id == null)
			return;
		this.agent_id = agent_id;
		this.addParameter(Fields.UserID, agent_id);
	}

	public String getSurvey_time() {
		return survey_time;
	}

	public void setSurvey_time(String survey_time) {
		this.survey_time = survey_time;
		this.addParameter(Fields.Timestamp, survey_time);
	}

	public String getCall_sheet_id() {
		return call_sheet_id;
	}

	public void setCall_sheet_id(String call_sheet_id) {
		if(call_sheet_id == null)
			return;
		this.call_sheet_id = call_sheet_id;
		this.addParameter(Fields.CallSheetID, call_sheet_id);
	}

	public String getSurver_content() {
		return surver_content;
	}

	public void setSurver_content(String surver_content) {
		this.surver_content = surver_content;
		this.addParameter(Fields.Content, surver_content);
	}

	public String getAccount_id() {
		return account_id;
	}

	public void setAccount_id(String account_id) {
		this.account_id = account_id;
		this.addParameter(Fields.Account, account_id);
	}

}
