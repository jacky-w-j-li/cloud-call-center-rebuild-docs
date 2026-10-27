package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class AssignmentNodeTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String SETVAR = "_valuesAssigned";
	public static final String NEXTPEER = "_nextPeer";
	
	public static String create(C5Account account, AssignmentNode assignmentNode) throws IOException {
		String context = "";
		if(assignmentNode == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(
				account.getAccount(), ASConfig.VM_ASSIGNMENTNODE);
		if (context.equals(""))
			context = ASConfig.getInstance().getVmAssignmentNode();
		
		context = context.replaceAll(ACCOUNTID, assignmentNode.getAccount());
		context = context.replaceAll(EXTEN, assignmentNode.getExten());
		
		String toPeer = assignmentNode.getToPeer();
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
	
		
		String b = "";
		
		b += assignmentNode.getItemsString();
		
		context = context.replaceAll(SETVAR, b);
		
		context += "\n";
		
		return context;
	}
}
