package com.m7.cc.ass.server.monitor.model;

import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class PbxCount {
	private String pbx;
	private int normal = 0;
	private int dialout = 0;
	
	public PbxCount(String pbx) {
		this.pbx = pbx;
	}
	public String getPbx() {
		return pbx;
	}
	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public int getNormal() {
		return normal;
	}
	public void setNormal(int normal) {
		this.normal = normal;
	}
	public int getDialout() {
		return dialout;
	}
	public void setDialout(int dialout) {
		this.dialout = dialout;
	}
	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.PBX);
		event.addParameter(MonitorFields.PbxName, this.pbx);
		event.addParameter(MonitorFields.Dialout, this.dialout);
		event.addParameter(MonitorFields.Normal, this.normal);
		return event;
	}
	

}
