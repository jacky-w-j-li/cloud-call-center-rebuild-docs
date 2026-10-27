package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.SwitchBoard;

public class SwitchBoardTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String MUSIC = "_music";
	public static final String EXTEN = "_exten";
	public static final String QUEUE = "_queue";
	
	public static String create(C5Account account, SwitchBoard switchBoard) throws IOException {
		String data = "";
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_SWITCHBOARD);
		
		if(data.equals(""))
			data = ASConfig.getInstance().getVmSwitchBoard();
		
		if (switchBoard.getMusic() != null) {
			data = data.replaceAll(MUSIC, switchBoard.getMusic().getActionString() + ";");
		} else {
			data = data.replaceAll(MUSIC, "");
		}
		String queue = switchBoard.getQueue();
		if (queue != null) {
			data = data.replaceAll(QUEUE, account.getServicePeer(queue).getActionString());
		}
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, switchBoard.getExten());
		data += "\n";
		return data;
	}
}
