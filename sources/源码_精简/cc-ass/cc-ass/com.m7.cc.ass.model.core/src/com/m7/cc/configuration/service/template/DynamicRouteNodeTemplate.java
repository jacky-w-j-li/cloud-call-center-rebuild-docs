package com.m7.cc.configuration.service.template;

import java.io.IOException;
import java.util.Vector;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.RouteRule;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class DynamicRouteNodeTemplate {
	public static final String ACCOUNTID = "_accountId";
	public static final String EXTEN = "_exten";
	public static final String TOPEERUNMATCHED = "_toPeerUnmatched";
	public static final String ROUTERULES = "_matcheRouteRules";

	
	public static String create(C5Account account, DynamicRouteNode dynamicRouteNode) throws IOException {
		String context = "";
		if(dynamicRouteNode == null)
			return context;
		
		context = ASConfig.getInstance().getPrivateTemplate(
				account.getAccount(), ASConfig.VM_DYNAMICEROUTENODE);
		if (context.equals(""))
			context = ASConfig.getInstance().getVmDynamicRouteNode();
		
		context = context.replaceAll(ACCOUNTID, dynamicRouteNode.getAccount());
		context = context.replaceAll(EXTEN, dynamicRouteNode.getExten());
		
		String extenPeerUnmatched = dynamicRouteNode.getToPeerUnmatched();
		ServicePeer toPeerUnmatched = null;
		if(extenPeerUnmatched == null){
			toPeerUnmatched = new TerminateCall();
		} else {
			toPeerUnmatched = account.getServicePeer(extenPeerUnmatched);
		}
		String actionString = "";
		if (null != toPeerUnmatched)
		{
			actionString += toPeerUnmatched.getActionString();
		}
		else
			actionString += new TerminateCall().getActionString();
		
		context = context.replaceAll(TOPEERUNMATCHED, actionString);
	
		
		String b = "";
		
		Vector<RouteRule> routeRules = dynamicRouteNode.getRouteRules();
		int i = 0; // default it's in order by priority, should be improved not strong
		while (i < routeRules.size())
		{
//			String toMatchedPeerString = "";
			b += routeRules.get(i).getMatchedPeerString();
			b += "\t\t\t\t";
			
			String exten = routeRules.get(i).getToPeerMatched();
			
			ServicePeer toPeer = null;
			if(exten == null){
				toPeer = new TerminateCall();
			} else {
				toPeer = account.getServicePeer(exten);
			}
			
			if (null != toPeer)
			{
				b += toPeer.getActionString() + ";";
			}
			else
				b += new TerminateCall().getActionString() + ";";
			
			b +=  "\n"; 
			
			i++;
		}
		
		context = context.replaceAll(ROUTERULES, b);
		
		context += "\n";
		
		return context;
	}
}
