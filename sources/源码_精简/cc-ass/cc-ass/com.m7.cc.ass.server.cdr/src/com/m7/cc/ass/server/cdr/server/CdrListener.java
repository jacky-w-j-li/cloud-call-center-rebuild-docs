package com.m7.cc.ass.server.cdr.server;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.command.C5Event;


public interface CdrListener {
	public void channelCdrNew(C5ChannelRecord cdr);
	public void investigateNew(C5Investigate cdr);
	public void callCdrNew(C5CallRecord cdr);
	public void callCdrUpdate(C5CallRecord cdr);
	public void peerCallCdrNew(C5PeerCallRecord cdr);
	public void peerCallCdrUpdate(C5PeerCallRecord cdr);
	public void peerCdrNew(C5PeerRecord cdr);
	public void peerCdrUpdate(C5PeerRecord cdr);
//	public void queueEntryCdrNew(C5QueueEntryRecord cdr);
//	public void queueMemberCdrNew(C5QueueMemberRecord cdr);
	public void batchDialoutCdrNew(C5BatchDialoutRecord cdr);
	public void autoCall(C5Event cdr);
}
