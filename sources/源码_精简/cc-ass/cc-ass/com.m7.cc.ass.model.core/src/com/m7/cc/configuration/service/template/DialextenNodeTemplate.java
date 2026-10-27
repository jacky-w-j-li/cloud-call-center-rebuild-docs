package com.m7.cc.configuration.service.template;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class DialextenNodeTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String MUSIC = "_music";
	public static final String TO_PEER_WHEN_TIMEOUT = "_toPeerWhenTimeout";
	public static final String TIMEOUT = "_timeout";
	public static final String EXTEN_LEN = "_extlen";

	
	public static String create(C5Account account, DialextenNode dialextenNode) {
		String context = "";
		if(dialextenNode == null)
			return context;
		context = ASConfig.getInstance().getVmDialextenNode();
		context = context.replaceAll(ACCOUNTID, dialextenNode.getAccount());
		context = context.replaceAll(EXTEN, dialextenNode.getExten());
		context = context.replaceAll(TIMEOUT, dialextenNode.getTimeout()+"");
		context = context.replaceAll(EXTEN_LEN, dialextenNode.getExtenLen()+"");
		if(dialextenNode.getMusic() != null)
			context = context.replaceAll(MUSIC, dialextenNode.getMusic().getActionString());
		else context = context.replaceAll(MUSIC+";", "");
	
		String toPeerWhenTimeout = dialextenNode.getToPeerWhenTimeout();
		if(null != toPeerWhenTimeout
				&& !"".equals(toPeerWhenTimeout)){
			ServicePeer peer = account.getServicePeer(toPeerWhenTimeout);
			if(peer == null)
				context = context.replaceAll(TO_PEER_WHEN_TIMEOUT, new TerminateCall().getActionString());
			else context = context.replaceAll(TO_PEER_WHEN_TIMEOUT, peer.getActionString());
		} else {
			context = context.replaceAll(TO_PEER_WHEN_TIMEOUT, new TerminateCall().getActionString());
		}
		
		context += "\n";
	
		return context;
	}
}
