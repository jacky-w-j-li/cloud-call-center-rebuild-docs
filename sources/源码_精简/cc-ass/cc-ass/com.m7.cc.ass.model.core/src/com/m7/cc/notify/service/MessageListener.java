package com.m7.cc.notify.service;

import com.m7.cc.command.C5Event;

public interface MessageListener {

	public void newMessage(C5Event event);
}
