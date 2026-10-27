package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class IvrValidateNodeTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String NEXTPEER = "_nextPeer";
	
	public static String create(C5Account account, IvrValidateNode ivrValidateNode) throws IOException {
		String context = "";
		if(ivrValidateNode == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(
				account.getAccount(), ASConfig.VM_IVRVALIDATENODE);
		if (context.equals(""))
			context = ASConfig.getInstance().getVmIvrValidateNode();

		context = context.replaceAll(ACCOUNTID, ivrValidateNode.getAccount());
		//context = context.replaceAll(EXTEN, ivrValidateNode.getExten());
		
		String toPeer = ivrValidateNode.getValidateToPeer();
		ServicePeer pToPeer = account.getServicePeer(toPeer);
		if(pToPeer == null){
			pToPeer = new TerminateCall();
		} else {
			pToPeer = account.getServicePeer(toPeer);
		}
		String actionString = "";
		if (null != pToPeer)
		{
			actionString += pToPeer.getActionString();
		}
		else
			actionString += new TerminateCall().getActionString();
		
		context = context.replaceAll(NEXTPEER, actionString);
		
		context += "\n";
		
		return context;
	}
}
