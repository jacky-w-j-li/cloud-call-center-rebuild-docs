package com.m7.cc.configuration.service.template;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.ExtensionPeer;

public class ExtensionPeerTemplate {
	public static String create(C5Account account, ExtensionPeer peer){
		String data = peer.getDialplan();
		
		return data;
	}
}
