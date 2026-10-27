package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.configuration.service.ServicePeer;

public class ValidateTemplate {
	public static final String account = "_accountId";
	public static final String music = "_music";
	public static final String data = "_data";
	public static final String nextPeer = "_nextPeer";
	public static final String nextPeerWhenTimeout = "_toPeerWhenTimeout";
	public static final String exten = "_exten";
	public static final String max = "_max";
	public static final String min = "_min";
	public static final String waitTimeout = "_waittimeout";
	public static final String extlen = "_extlen";
	public static final String returnKey = "_returnkey";
	public static final String endKey = "_endkey";
	
	public static String create(C5Account c5account, Validation validation) throws IOException {
		String a = "";
		if (validation == null)
			return a;
		
		int endType = validation.getEndType();
		
		if (Validation.END_LENGTH == endType)
		{
			a = ASConfig.getInstance().getPrivateTemplate(
					c5account.getAccount(), ASConfig.VM_DIALEXTENNODE);
			if (a.equals(""))
				a = ASConfig.getInstance().getVmDialextenNode();
			a = a.replaceAll(extlen, validation.getEndLength() + "");
		}
		else if (Validation.END_CHAR == endType)
		{	
			a = ASConfig.getInstance().getPrivateTemplate(
					c5account.getAccount(), ASConfig.VM_VALIDATE);
			if (a.equals(""))
				a = ASConfig.getInstance().getVmValidate();
			a = a.replaceAll(max, validation.getMaxLength()+"");
			a = a.replaceAll(endKey, validation.getEndKey());
		}
		a = a.replaceAll(account, validation.getAccount());
		a = a.replaceAll(exten, validation.getExten());
		a = a.replaceAll(min, validation.getMinLength()+"");
		a = a.replaceAll(waitTimeout, validation.getWaitTimeout()+"");
		if(validation.getMusic() != null)
			a = a.replaceAll(music, validation.getMusic().getActionString());
		else 
			a = a.replaceAll(music+";", "");
		
		if(validation.getReturnKey() != null)
			a = a.replaceAll(returnKey, validation.getReturnKey() + " => goto s, 1;");
		else 
			a = a.replaceAll(returnKey, "");
		
		
		if(validation.getNextPeer() == null)
			a = a.replaceAll(nextPeer, new TerminateCall().getActionString());
		else {
			ServicePeer peer = c5account.getServicePeer(validation.getNextPeer());
			if(peer == null)
				a = a.replaceAll(nextPeer, new TerminateCall().getActionString());
			else
				a = a.replaceAll(nextPeer, peer.getActionString());
		}
		
		if(validation.getNextPeerWhenTimeout() == null)
			a = a.replaceAll(nextPeerWhenTimeout, new TerminateCall().getActionString());
		else {
			ServicePeer peer = c5account.getServicePeer(validation.getNextPeerWhenTimeout());
			if(peer == null)
//				throw new PeerNotFoundException("Peer ["+validation.getNextPeer()+"] not found");
				a = a.replaceAll(nextPeerWhenTimeout, new TerminateCall().getActionString());
			else
				a = a.replaceAll(nextPeerWhenTimeout, peer.getActionString());
		}
		
		a = a.replaceAll(data, validation.getData());
		return a;
	}
}
