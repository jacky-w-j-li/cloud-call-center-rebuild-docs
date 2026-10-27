package com.m7.cc.asterisk.cdr.server.handler;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class NewAppCDRHandler implements CDRHandler {
	@Override
	public boolean connectDatabase(){
		boolean isConnected = MongoProvider.getInstance().connect();
		if(!isConnected){
			return false;
		}
		return MongoProvider.getInstance().loadAccountDatabase();
	}

	@Override
	public void handlePeerCallCdr(C5PeerCallRecord cdr) {
//		if (cdr.getRefUniqueid() != null) {
//			MongoProvider.getInstance().updateRefCallCdr(cdr);
//		} else if (cdr.getOpType().equalsIgnoreCase(
//				C5CallRecord.insert)) {
			MongoProvider.getInstance().saveToCallSheet(cdr);
//		} else {
//			MongoProvider.getInstance().updateToCallSheet(cdr);
//		}

	}

	@Override
	public void handleChannelCdr(C5ChannelRecord cdr) {
		MongoProvider.getInstance().saveChannelCDR(cdr);
	}

	@Override
	public void handlePeerCdr(C5PeerRecord cdr) {
		if (cdr.getOpType().equalsIgnoreCase(C5CallRecord.insert)) {
			MongoProvider.getInstance().savePeerRecord(cdr);
		} else {
			MongoProvider.getInstance().updatePeerRecord(cdr);
		}
	}

	@Override
	public void handleInvestigateCdr(C5Investigate cdr) {
		MongoProvider.getInstance().saveInvestigateRecord(cdr);
	}

	@Override
	public void handleBatchDialoutCdr(C5BatchDialoutRecord cdr) {
		MongoProvider.getInstance().saveBatchDialoutRecord(cdr);
	}

}
