package com.m7.cc.ass.model.configuration;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class RoomMember {
	private String user;
	private String exten;
	private String channel;
	private String uniqueid;
	private String callIdNum;
	private String usernum;

	public RoomMember(String usernum) {
		this.usernum = usernum;
	}
	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.RoomMember);
		event.addParameter(Fields.Usernum, this.usernum);
		if (user != null) {
			event.addParameter(Fields.User, this.user);
			event.addParameter(Fields.Exten, exten);
		}
		event.addParameter(Fields.Channel, channel);
		event.addParameter(Fields.Uniqueid, uniqueid);
		event.addParameter(Fields.CallerIDNum, callIdNum);
		return event;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getUniqueid() {
		return uniqueid;
	}

	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
	}

	public String getCallIdNum() {
		return callIdNum;
	}

	public void setCallIdNum(String callIdNum) {
		this.callIdNum = callIdNum;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
	}

	public String getUsernum() {
		return usernum;
	}

	public void setUsernum(String usernum) {
		this.usernum = usernum;
	}
}
