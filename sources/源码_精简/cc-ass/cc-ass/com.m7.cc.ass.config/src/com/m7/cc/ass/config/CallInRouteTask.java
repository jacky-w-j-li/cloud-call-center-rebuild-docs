package com.m7.cc.ass.config;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CallInRouteTask extends TimerTask {
	private Logger log = Logger.getLogger(CallInRouteTask.class.getName());

	@Override
	public void run() {
		log.log(Level.INFO, "Begin sync callin Route!");
		Map<String, HashMap<String,String>> callInRoutes = CallRoute.getCallInRoutes();
		List<String> callInKeys = CallRoute.getCallInKeys();
		
		Iterator<String> iter = callInKeys.iterator();  
		while(iter.hasNext()){
			String key = iter.next();  
			HashMap<String,String> thisRoute = CallRoute.getRouteFromBill(key);
			if(thisRoute == null){
			}else if(thisRoute.get("status").equals("404")){				
				callInRoutes.remove(key);
				iter.remove();
			}else{
				callInRoutes.put(key, thisRoute);
			}
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		CallRoute.setCallInRoutes(callInRoutes);
		CallRoute.saveInRoute();
	}
}
