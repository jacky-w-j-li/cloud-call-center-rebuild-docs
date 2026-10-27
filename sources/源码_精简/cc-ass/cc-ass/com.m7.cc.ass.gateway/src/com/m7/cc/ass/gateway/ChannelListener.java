package com.m7.cc.ass.gateway;

import com.m7.cc.command.C5Event;

public interface ChannelListener {
	public void channelStatusChanged(GWChannel channel);
	public void newExten(C5Event event);
}
