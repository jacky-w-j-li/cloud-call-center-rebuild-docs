package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class EncryptMD5Template {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	
	public static String create(C5Account account, EncryptMD5 encryptMD5) throws IOException{
		String data = "";
		
		if (encryptMD5 == null)
			return data;

		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(),
				ASConfig.VM_ENCRYPTMD5);
		if (data.equals(""))
			data = ASConfig.getInstance().getVmEncryptMD5();
		
		String nextPeerExten = encryptMD5.getNextPeer();
		if(nextPeerExten != null){
			ServicePeer peer = account.getServicePeer(nextPeerExten);
			if(peer == null){
				data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
			}else{
				data = data.replaceAll(NEXT_PEER, peer.getActionString());
			}
		}else{
			data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
		}
		
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, encryptMD5.getExten());
		data += "\n";
		return data;
	}
}
