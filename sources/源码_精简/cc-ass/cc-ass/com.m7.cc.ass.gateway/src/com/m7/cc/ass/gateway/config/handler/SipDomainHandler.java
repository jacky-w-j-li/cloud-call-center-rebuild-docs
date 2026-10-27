package com.m7.cc.ass.gateway.config.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class SipDomainHandler {
	
	private static Logger log = Logger.getLogger(SipDomainHandler.class.getName());
	
	public static C5Response updateDomain(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String ds = action.getStringValue(Fields.Domain).trim();
			List<String> list = new ArrayList<String>();
			if(!ds.equalsIgnoreCase("")){
				String a[] = ds.split(",");
				for(int i=0;i<a.length;i++){
					list.add(a[i]);
				}
			}
			GWRuntimeData.getInstance().getSipDomain().setDomains(list);
			GWRuntimeData.getInstance().updateSipDomain();
			AMICore.getInstance().getAMIClient("gateway").reload();
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response removeDomain(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String ds = action.getStringValue(Fields.DomainRemove).trim();
			GWRuntimeData.getInstance().getSipDomain().setRemoveDomain(ds);
			GWRuntimeData.getInstance().removeSipDomain();
			AMICore.getInstance().getAMIClient("gateway").reload();
			response.setSucceed(true);
		}catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
