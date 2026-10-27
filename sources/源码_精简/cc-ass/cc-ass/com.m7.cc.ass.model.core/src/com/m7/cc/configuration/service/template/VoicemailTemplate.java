package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.configuration.service.ServicePeer;

public class VoicemailTemplate {
	public static final String accountId = "_accountId";
	public static final String exten = "_exten";
	public static final String welmusic = "_welmusic";
	public static final String pbx = "_pbx";
	public static final String toPeer = "_toPeer";
	
	public static String create(C5Account account, Voicemail voicemail) throws IOException{
		String data = "";
		
		if (voicemail == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_VOICEMAIL);
		if(data.equals(""))
			data = ASConfig.getInstance().getVmVoicemail();
		
		data = data.replaceAll(accountId, voicemail.getAccount());
		data = data.replaceAll(exten, voicemail.getExten());
		data = data.replaceAll(pbx, voicemail.getPbx());
		if(voicemail.getWelcomeMusic() != null){
			data = data.replaceAll(welmusic, voicemail.getWelcomeMusic().getActionString());
		} else {
			data = data.replaceAll(welmusic+";", "");
		}
		if(voicemail.getToPeer() != null){
			ServicePeer peer = account.getServicePeer(voicemail.getToPeer());
			if(peer == null)
				data = data.replaceAll(toPeer, new TerminateCall().getActionString());
			else
				data = data.replaceAll(toPeer, peer.getActionString());
		}else{
			data = data.replaceAll(toPeer, new TerminateCall().getActionString());
		}
		return data;
	}
}
