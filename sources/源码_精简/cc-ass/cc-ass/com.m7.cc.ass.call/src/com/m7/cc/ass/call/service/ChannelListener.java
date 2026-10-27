package com.m7.cc.ass.call.service;

import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Event;

public interface ChannelListener {
	public void channelStatusChanged(C5Channel channel);
	public void newExten(C5Event event);
}
