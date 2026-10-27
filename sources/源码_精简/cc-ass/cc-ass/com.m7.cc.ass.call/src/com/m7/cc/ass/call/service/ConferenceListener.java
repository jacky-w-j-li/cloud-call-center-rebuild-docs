package com.m7.cc.ass.call.service;

import com.m7.cc.command.C5Event;

public interface ConferenceListener {
	public void conferenceJoin(C5Event event);
	public void conferenceLeave(C5Event event);
	public void conferenceTalking(C5Event event);
	public void conferenceStopTalking(C5Event event);
	public void conferenceMute(C5Event event);
	public void conferenceUnmute(C5Event event);
}
