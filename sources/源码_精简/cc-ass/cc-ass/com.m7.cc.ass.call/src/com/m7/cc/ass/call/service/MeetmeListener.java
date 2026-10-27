package com.m7.cc.ass.call.service;

import com.m7.cc.command.C5Event;

public interface MeetmeListener {
	public void meetmeJoin(C5Event event);
	public void meetmeLeave(C5Event event);
	public void meetmeTalking(C5Event event);
	public void meetmeStopTalking(C5Event event);
}
