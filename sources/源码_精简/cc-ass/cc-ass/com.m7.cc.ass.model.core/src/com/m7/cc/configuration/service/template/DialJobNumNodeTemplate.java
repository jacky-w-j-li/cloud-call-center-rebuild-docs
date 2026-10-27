package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class DialJobNumNodeTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String NotExistNEXTPEER = "_nextPeerNotExist";
	public static final String AgentBusyNEXTPEER = "_nextPeerAgentBusy";
	public static final String LogOffNEXTPEER = "_nextPeerLogoff";
	
	public static String create(C5Account account, DialJobNumNode dialJobNumNode) throws IOException {
		String context = "";
		if(dialJobNumNode == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(
				account.getAccount(), ASConfig.VM_DIALJOBNUMNODE);
		if (context.equals(""))
			context = ASConfig.getInstance().getVmDialJobNumNode();

		context = context.replaceAll(ACCOUNTID, dialJobNumNode.getAccount());
		context = context.replaceAll(EXTEN, dialJobNumNode.getExten());
		//empnoNotExist topeer
		String toPeer = dialJobNumNode.getToPeerNotExist();
		ServicePeer pToPeer = account.getServicePeer(toPeer);

		String actionString = "";
		if (null != pToPeer)
		{
			actionString += pToPeer.getActionString();
		}
		else{
			actionString += "Playback(sound/dialinnoexist);\n\t\t";
			actionString += new TerminateCall().getActionString();
		}
		
		context = context.replaceAll(NotExistNEXTPEER, actionString);
		
		//empnoAgentBusy topeer
		String abToPeer = dialJobNumNode.getToPeerAgentBusy();
		ServicePeer peer1 = account.getServicePeer(abToPeer);

		String actionString1 = "";
		if (null != peer1){
			actionString1 += peer1.getActionString();
		}
		else{
			actionString1 += "Playback(sound/dialinbusy);\n\t\t";
			actionString1 += new TerminateCall().getActionString();			
		}
		
		context = context.replaceAll(AgentBusyNEXTPEER, actionString1);
		
		//empnoLogoff topeer
		String loToPeer = dialJobNumNode.getToPeerLogoff();
		ServicePeer peer2 = account.getServicePeer(loToPeer);
		String actionString2 = "";
		if (null != peer2)
		{
			actionString2 += peer2.getActionString();
		}
		else{
			actionString2 += "Playback(sound/dialinnosignin);\n\t\t";
			actionString2 += new TerminateCall().getActionString();
		}
		
		context = context.replaceAll(LogOffNEXTPEER, actionString2);
		
		context += "\n";
		
		return context;
	}
}
