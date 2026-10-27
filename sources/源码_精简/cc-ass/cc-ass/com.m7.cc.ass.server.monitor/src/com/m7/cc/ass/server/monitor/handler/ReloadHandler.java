package com.m7.cc.ass.server.monitor.handler;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;

public class ReloadHandler {
	public static C5Response reload(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		
		try {
			ASConfig.getInstance().reload();
			response.setMessage("Reload complete");
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
