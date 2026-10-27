package com.m7.cc.ass.server.monitor.handler;

import com.m7.cc.ass.server.cdr.server.CDRServer;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;

public class GetCdrClientHandler {
	public static C5Response getCdrClient(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			int size = CDRServer.getInstance().getCurrentBufferSize();
			response.addParameter("cdrResult", size + "");
			response.setSucceed(true);
		} catch (Exception e) {
			// log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
