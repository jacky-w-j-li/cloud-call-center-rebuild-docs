package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.TwowayCall;

public class TwowayCallTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	public static final String MUSIC = "_music";
	public static final String VALIDATE = "_validate";
	
	public static String create(C5Account account, TwowayCall twowaycall) throws IOException {
		String data = "";
		
		if(twowaycall == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(),
				ASConfig.VM_TWOWAYCALL);
		
		if (data.equals(""))
			data = ASConfig.getInstance().getVmTwowaycall();
		if(twowaycall.getMusic() != null)
			data = data.replaceAll(MUSIC, twowaycall.getMusic().getActionString());
		else data = data.replaceAll(MUSIC+";", "");
		 

//		String exten = twowaycall.getNextPeer();
//		if(exten != null){
//			ServicePeer peer = account.getServicePeer(exten);
//			if(peer == null)
//				data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
//			else data = data.replaceAll(NEXT_PEER, peer.getActionString());
//		} else {
//			data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
//		}

		data = data.replaceAll(VALIDATE, twowaycall.getVariable());
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, twowaycall.getExten());
		data += "\n";
		return data;	
	}
}
