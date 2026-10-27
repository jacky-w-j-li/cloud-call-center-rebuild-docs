package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class AnnouncementTemplate {
	public static final String ACCOUNT_ID = "_accountId";
	public static final String MUSIC = "_music";
	public static final String NEXT_PEER = "_nextPeer";
	public static final String EXTEN = "_exten";
	
	public static String create(C5Account account, Announcement announcement) throws IOException {
		String data = "";
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_ANNOUNCEMENT);
		
		if(data.equals(""))
			data = ASConfig.getInstance().getVmAnnouncement();
		
		String exten = announcement.getToPeer();
		if(exten != null){
			ServicePeer peer = account.getServicePeer(exten);
			if(peer == null)
				data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
			else data = data.replaceAll(NEXT_PEER, peer.getActionString());
		} else {
			data = data.replaceAll(NEXT_PEER, new TerminateCall().getActionString());
		}
		data = data.replaceAll(ACCOUNT_ID, account.getAccount());
		data = data.replaceAll(EXTEN, announcement.getExten());
		if(announcement.getMusic() != null)
			data = data.replaceAll(MUSIC, announcement.getMusic().getActionString());
		else data = data.replaceAll(MUSIC+";", "");
		data += "\n";
		return data;
	}
}
