package com.m7.cc.asterisk.cdr.server.handler;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;

public interface CDRHandler {
	static final String DEFAULT_HANDLER_TYPE = "default";
	static final String NEW_APP_HANDLER_TYPE = "newapp";
	
	boolean connectDatabase();
	void handlePeerCallCdr(C5PeerCallRecord cdr);
	void handleChannelCdr(C5ChannelRecord cdr);
	void handlePeerCdr(C5PeerRecord cdr);
	void handleInvestigateCdr(C5Investigate cdr);
	void handleBatchDialoutCdr(C5BatchDialoutRecord cdr);
}
