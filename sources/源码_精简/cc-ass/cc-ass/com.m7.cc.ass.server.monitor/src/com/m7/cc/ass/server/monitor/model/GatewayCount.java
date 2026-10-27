package com.m7.cc.ass.server.monitor.model;

import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class GatewayCount {
	private int normal = 0;
	private int dialout = 0;
	private int transfer = 0;
	private String id;
	
	public GatewayCount(String id) {
		this.id = id;
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

	public int getTransfer() {
		return transfer;
	}

	public void setTransfer(int transfer) {
		this.transfer = transfer;
	}

	public String getId() {
		return id;
	}
	
	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.PBX);
		event.addParameter(MonitorFields.GW, this.id);
		event.addParameter(MonitorFields.Normal, this.normal);
		event.addParameter(MonitorFields.Dialout, this.dialout);
		event.addParameter(MonitorFields.Transfer, this.transfer);
		return event;
	}
}
