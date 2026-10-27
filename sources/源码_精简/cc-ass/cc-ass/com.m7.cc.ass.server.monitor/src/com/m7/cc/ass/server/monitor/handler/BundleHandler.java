package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.osgi.framework.Bundle;

import com.m7.cc.ass.osgi.service.BundleManager;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class BundleHandler {
	public static C5Response update(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		response.setSucceed(true);
		try{
			int id = action.getIntValue(Fields.id);
			BundleManager.getInstance().updateBundle(id);
			response.setMessage("Update bundle ["+id+"] succeed.");
		} catch (Exception e){
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response getBundles(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		response.setSucceed(true);
		try{
			Bundle[] bundles = BundleManager.getInstance().getBundles();
			if(bundles == null){
				response.setMessage("No bundle found.");
			}else {
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for (int i=0;i<bundles.length;i++){
					C5Event event  = new C5Event("Bundle");
					event.addParameter(Fields.id, bundles[i].getBundleId());
					event.addParameter(Fields.Name, bundles[i].getSymbolicName());
					//Not implemented in old osgi frame work
//					event.addParameter(Fields.Version, bundles[i].getVersion().toString());
					events.add(event.getParameters());
				}
				response.addParameter(Fields.Event, events);
			}
		} catch (Throwable e){
			e.printStackTrace();
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
