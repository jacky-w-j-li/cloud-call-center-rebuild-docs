package com.m7.cc.asterisk.cdr.server.handler;

import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.db.oracle.AppDBProvider;
import com.m7.cc.db.oracle.DBProvider;

public class DefaultCDRHandler implements CDRHandler {
	private Logger log = Logger.getLogger(NewAppCDRHandler.class.getName());
	
	@Override
	public boolean connectDatabase(){
		// init database
		try{
			DBProvider.getInstance().connect();
			AppDBProvider.getInstance().connect();
		}catch(SQLException e){
			e.printStackTrace();
			log.log(Level.WARNING, e.getMessage(), e);
			return false;
		}
		return true;
	}

	@Override
	public void handlePeerCallCdr(C5PeerCallRecord cdr) {
		if (cdr.getRefUniqueid() != null) {
			DBProvider.getInstance().updateRefCallCdr(cdr);
			AppDBProvider.getInstance().updateRefCallCdr(cdr);
		} else if (cdr.getOpType().equalsIgnoreCase(C5CallRecord.insert)) {
			DBProvider.getInstance().saveToCallSheet(cdr);
		} else if (cdr.getEnd_time() != null) {
			DBProvider.getInstance().updateToCallSheet(cdr);
			AppDBProvider.getInstance().updateToCallSheet(cdr);
		}
	}

	@Override
	public void handleChannelCdr(C5ChannelRecord cdr) {
		DBProvider.getInstance().saveChannelCDR(cdr);
	}

	@Override
	public void handlePeerCdr(C5PeerRecord cdr) {
		if (cdr.getOpType().equalsIgnoreCase(C5CallRecord.insert)) {
			DBProvider.getInstance().savePeerRecord(cdr);
			AppDBProvider.getInstance().savePeerRecord(cdr);
		} else {
			DBProvider.getInstance().updatePeerRecord(cdr);
			AppDBProvider.getInstance().updatePeerRecord(cdr);
		}
	}

	@Override
	public void handleInvestigateCdr(C5Investigate cdr) {
		DBProvider.getInstance().saveInvestigateRecord(cdr);
		AppDBProvider.getInstance().saveInvestigateRecord(cdr);
	}

	@Override
	public void handleBatchDialoutCdr(C5BatchDialoutRecord cdr) {
		AppDBProvider.getInstance().saveBatchDialoutRecord(cdr);
	}

}
