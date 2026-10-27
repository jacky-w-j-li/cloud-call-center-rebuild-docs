package com.m7.cc.ass.call.service;

import com.m7.cc.command.C5Event;

public interface TrunkListener {
	public void trunkStatusChanged(C5Event event);
}
