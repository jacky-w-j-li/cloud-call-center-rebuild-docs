package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class CallUrlTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	public static final String TOPEER_WHEN_TIMEOUT = "_toPeerWhenTimeout";
	
	public static String create(C5Account account, CallUrl callurl) throws IOException {
		String data = "";
		
		if(callurl == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(),
				ASConfig.VM_CALLURL);

		if (data.equals(""))
			data = ASConfig.getInstance().getVmCallurl();
		
		String timeoutExten = callurl.getToPeerWhenTimeout();
		if(timeoutExten != null){
			ServicePeer peer = account.getServicePeer(timeoutExten);
			if(peer == null)
				data = data.replaceAll(TOPEER_WHEN_TIMEOUT, new TerminateCall().getActionString());
			else data = data.replaceAll(TOPEER_WHEN_TIMEOUT, peer.getActionString());
		} else {
			data = data.replaceAll(TOPEER_WHEN_TIMEOUT, new TerminateCall().getActionString());
		}
		
		String exten = callurl.getNextPeer();
		if(exten != null){
			ServicePeer peer = account.getServicePeer(exten);
			if(peer == null)
				data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
			else data = data.replaceAll(NEXT_PEER, peer.getActionString());
		} else {
			data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
		}
		
		
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, callurl.getExten());
		data += "\n";
		return data;
	}
}
