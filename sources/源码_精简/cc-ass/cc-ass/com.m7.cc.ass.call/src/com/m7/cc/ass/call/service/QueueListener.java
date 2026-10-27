package com.m7.cc.ass.call.service;

import com.m7.cc.ass.model.configuration.C5QueueEntry;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.command.C5Event;

public interface QueueListener {
	
	//These status of queue should be got via Method-Calling, not Event/Listen
	public void queueParams(C5Event event);
	public void queueMemberAdded(C5QueueMember member);
	public void queueMemberRemoved(C5QueueMember member);
	public void queueMemberPaused(C5QueueMember member);
	public void queueJoin(C5QueueEntry entry);
	public void queueLeave(C5QueueEntry entry);
	public void queueCallerAbandon(C5Event event);
	public void queueRemoved(C5Event event);
	public void queueAgentCalled(C5Event event);
	public void queueConnect(C5Event event);
	public void queueComplete(C5Event event);
}
