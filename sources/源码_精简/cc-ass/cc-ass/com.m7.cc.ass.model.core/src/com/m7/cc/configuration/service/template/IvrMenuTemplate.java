package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class IvrMenuTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	
	public static String create(C5Account account, IvrMenu ivrMenu) throws IOException {
		String data = "";
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_IVRMENU);
		
		if(data.equals(""))
			data = ASConfig.getInstance().getVmIvrmenu();
		
		String exten = ivrMenu.getToPeer();
		if(exten != null){
			ServicePeer peer = account.getServicePeer(exten);
			if(peer == null)
				data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
			else data = data.replaceAll(NEXT_PEER, peer.getActionString());
		} else {
			data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
		}
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, ivrMenu.getExten());
		
		data += "\n";
		return data;
	}
}
