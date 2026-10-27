package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.TimeConditionItem;
import com.m7.cc.configuration.service.ServicePeer;

public class TimeConditionTemplate {
	public static final String accountId = "_accountId";
	public static final String exten = "_exten";
	public static final String condition = "_condition";
	public static final String nextPeer = "_nextPeer";

	public static String create(C5Account account, TimeCondition tc) throws IOException {
		String data = "";
		
		if(tc == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_TIME_CONDITION);
		if(data.equals(""))
			data = ASConfig.getInstance().getVmTimeCondition();

		data = data.replaceAll(accountId, account.getAccount());
		data = data.replaceAll(exten, tc.getExten());
		String to = "";
		if (tc.getMatchedPeer() != null) {
			ServicePeer peer = account.getServicePeer(tc.getMatchedPeer());
			if (peer != null) {
				to = peer.getActionString();
			} else {
//				throw new PeerNotFoundException("Peer "+tc.getMatchedPeer()+" not found");
				to = new TerminateCall().getActionString();
			}
		} else {
			to = new TerminateCall().getActionString();
		}
		String timeCondition = "";
		for(int i=0;i<tc.getItems().size();i++){
			String[] conditions = getConditionString(tc.getItems().get(i), to);
			for(int j=0;j<conditions.length;j++)
				timeCondition += conditions[j];
		}
		data = data.replaceAll(condition, timeCondition);
		
		if (tc.getUnmatchedPeer() != null) {
			ServicePeer peer = account.getServicePeer(tc.getUnmatchedPeer());
			if (peer != null) {
				data = data.replaceAll(nextPeer, peer.getActionString());
			} else {
//				throw new PeerNotFoundException("Peer "+tc.getUnmatchedPeer()+" not found");
				data = data.replaceAll(nextPeer, new TerminateCall().getActionString());
			}
		} else {
			data = data.replaceAll(nextPeer, new TerminateCall().getActionString());
		}
		data = data + "\n";
		return data;
	}
	
	private static String[] getConditionString(TimeConditionItem item, String to){
		String[] weeks = item.getDaysOfWeek().split("&");
		String[] cds = new String[weeks.length];
		for(int i=0;i<weeks.length;i++){
			cds[i] = "\t\tifTime("+item.getTimes()+"\\|"+weeks[i]+"\\|"+item.getDaysOfMoth()+"\\|"+item.getMoths()+") {\n"
			+"\t\t\t"+to+";\n\t\t}\n";
		}
		return cds;
	}
}
