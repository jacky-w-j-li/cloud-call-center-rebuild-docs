package com.m7.cc.ass.server.monitor.model;

import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class LineCount {
	private String line;
	private int dialout;
	private int normal;
	private int transfer;

	public int getTransfer() {
		return transfer;
	}

	public void setTransfer(int transfer) {
		this.transfer = transfer;
	}

	public LineCount(String line) {
		this.line = line;
	}

	public String getLine() {
		return line;
	}

	public void setLine(String line) {
		this.line = line;
	}

	public int getDialout() {
		return dialout;
	}

	public void setDialout(int dialout) {
		this.dialout = dialout;
	}

	public int getNormal() {
		return normal;
	}

	public void setNormal(int normal) {
		this.normal = normal;
	}

	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.PBX);
		event.addParameter(MonitorFields.LINE, this.line);
		event.addParameter(MonitorFields.Normal, this.normal);
		event.addParameter(MonitorFields.Dialout, this.dialout);
		event.addParameter(MonitorFields.Transfer, this.transfer);
		return event;
	}
}
