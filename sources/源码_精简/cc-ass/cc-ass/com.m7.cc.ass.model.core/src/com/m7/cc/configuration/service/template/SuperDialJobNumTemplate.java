package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class SuperDialJobNumTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String MUSIC = "_music";
	public static final String NotExistNEXTPEER = "_nextPeerNotExist";
	public static final String AgentBusyNEXTPEER = "_nextPeerAgentBusy";
	public static final String LogOffNEXTPEER = "_nextPeerLogoff";
	public static final String frontOfficeNEXTPEER = "_nextPeerFrontOffice";
	
	public static String create(C5Account account, SuperDialJobNum superDialJobNum) throws IOException {
		String context = "";
		if(superDialJobNum == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(
				account.getAccount(), ASConfig.VM_SUPERDIALJOBNUM);
		if (context.equals(""))
			context = ASConfig.getInstance().getVmSuperDialJobNum();

		context = context.replaceAll(ACCOUNTID, superDialJobNum.getAccount());
		context = context.replaceAll(EXTEN, superDialJobNum.getExten());
		if(superDialJobNum.getMusic() != null)
		{
			superDialJobNum.getMusic().setPlayback(false);
			context = context.replaceAll(MUSIC, superDialJobNum.getMusic().getActionString());			
		}
		//empnoNotExist topeer
		String toPeer = superDialJobNum.getToPeerNotExist();
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
		String abToPeer = superDialJobNum.getToPeerAgentBusy();
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
		String loToPeer = superDialJobNum.getToPeerLogoff();
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
		
		//to frontOffice
		String foToPeer = superDialJobNum.getToPeerFrontOffice();
		ServicePeer peer3 = account.getServicePeer(foToPeer);
		String actionString3 = "";
		if (null != peer3)
		{
			actionString3 += peer3.getActionString();
		}
		else{
			actionString3 += new TerminateCall().getActionString();
		}
		context = context.replaceAll(frontOfficeNEXTPEER, actionString3);
		
		context += "\n";
		
		return context;
	}
}
