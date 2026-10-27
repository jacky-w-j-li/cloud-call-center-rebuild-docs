package com.m7.cc.configuration.service.template;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class ServiceNoTemplate {
	public static String accountId = "_accountId";
	public static String serviceNo = "_serviceNo";
	public static String nextPeer = "_nextPeer";
	public static String welcomeMusic = "_welcomeMusic";
	public static String callroute = "_callroute";
	public static String callLimit = "_callLimit";
	public static String serviceNoType = "_typeOfServiceNo";
	public static String create(C5Account account, ServiceNo serviceNo) throws Exception {
		String data = "";
		if (serviceNo == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_SERVICE);
		if(data.equals(""))
			data = ASConfig.getInstance().getVmService().replaceAll(accountId, serviceNo.getAccount());
		
		String cr = "";
		for(int i=0;i<account.getDidNumbers().size();i++){
			cr += "\t\tif( \"\\$\\{FROM_CID\\}\" = \""
						+account.getDidNumbers().get(i)+"\") \\{\n"
						+"\t\t\tgoto "+serviceNo.getExten()+"-ivrlogin,s,1;\n"
						+"\t\t\\}\n";
		}
		data = data.replaceAll(callroute, cr);
		data = data.replaceAll(ServiceNoTemplate.serviceNo, serviceNo.getExten());
			
		ServicePeer peer = account.getServicePeer(serviceNo.getToPeer());
		if(peer == null){
//			if(serviceNo.getToPeer() != null)
//				throw new Exception("Cannot found service peer: "+serviceNo.getToPeer());
//			else 
			peer = new TerminateCall();
		}
		data = data.replaceAll(nextPeer, peer.getActionString());
		if(serviceNo.getWelcomeMusic() != null)
			data = data.replaceAll(welcomeMusic, serviceNo.
					getWelcomeMusic().getActionString());
		else data = data.replaceAll(welcomeMusic+";", "");
		
		data = data.replaceAll(serviceNoType, "SERVICE_NO_TYPE=\"" + serviceNo.getType() + "\"");
		
		return data;
	}
}
