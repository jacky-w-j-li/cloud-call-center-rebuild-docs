package com.m7.cc.ass.server.config.handler;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class QueueHandler {
	
	private static Logger log = Logger.getLogger(QueueHandler.class.getName());
	
	public static C5Response addQueues(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			
			C5Queue queue = RuntimeData.getInstance().getQueue(pbx, exten);
			if(queue == null){
				queue = new C5Queue(pbx, account, exten);
			}

			Set<String> oldMembers = queue.getMemberSet();
			queue.setValue(action.getParameters());
			
//			if(action.hasKey(Fields.DisplayName)){
//				String displayName = action.getStringValue(Fields.DisplayName);
//				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
//					queue.setDisplayName(displayName);
//				}
//			}
			
			RuntimeData.getInstance().updateQueue(pbx, account, queue);

			Set<String> needAddMembers = new HashSet<String>();
			Set<String> needRemoveMembers = new HashSet<String>();
			Set<String> newMembers = queue.getMemberSet();
			pickoutMember(newMembers, oldMembers, needAddMembers, needRemoveMembers);
			
			Iterator<String> memberIte = null;
			boolean result;
			User u = null;
			if (needAddMembers.size() > 0) {
				QueueAdd queueAdd = null;
				memberIte = needAddMembers.iterator();
				while (memberIte.hasNext()) {
					u = RuntimeData.getInstance().getAccount(pbx, account)
							.getUser(memberIte.next());
					if(u != null){
						if ((u.isLogin() && u.getExtenType().equalsIgnoreCase(
								Fields.sip))
								|| u.getExtenType()
										.equalsIgnoreCase(Fields.gateway)
								|| u.getExtenType().equalsIgnoreCase(Fields.Local)) {
							queueAdd = new QueueAdd(queue.getExten(), "SIP/"
									+ u.getSipNum(),
									Utils.getSynActionID("queueadd"));
							queueAdd.setPanelty(queue.getPenalty(u.getId()));
							if (u.isBusy())
								queueAdd.setPaused("yes");
							AsteriskResponse res = AMICore.getInstance()
									.getAMIClient(pbx)
									.sendSynchronousAction(queueAdd);
							result = res.isSuccessful();
							if (!result) {
								log.warning("Add queue member failed: "
										+ response.getJsonString());
							}
							u.getQueues().add(queue.getExten());
						}
					}
				}
			}
			if (needRemoveMembers.size() > 0) {
				memberIte = needRemoveMembers.iterator();
				QueueRemove queueRemove = null;
				Map<String, C5QueueMember> queueMembers = queue
						.getQueueMembers();
				while (memberIte.hasNext()) {
					u = RuntimeData.getInstance().getAccount(pbx, account)
							.getUser(memberIte.next());
					if(u != null){
						if (queueMembers.containsKey("SIP/" + u.getSipNum())) {
							queueRemove = new QueueRemove(queue.getExten(), "SIP/"
									+ u.getSipNum(),
									Utils.getSynActionID("queueremove"));
							AsteriskResponse res = AMICore.getInstance()
									.getAMIClient(pbx)
									.sendSynchronousAction(queueRemove);
							result = res.isSuccessful();
							if (!result) {
								log.warning("Remove queue member failed: "
										+ response.toString());
							}
							u.getQueues().remove(queue.getExten());
						}
					}
				}
			}
			
			response.setSucceed(true);
		}catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	private static void pickoutMember(Set<String> members, Set<String> compareMembers,
			Set<String> needAddMembers, Set<String> needRemoveMembers) {
		HashSet<String> both = new HashSet<String>();
		String m;
		Iterator<String> t = compareMembers.iterator();
		while (t.hasNext()) {
			m = t.next();
			if (members.contains(m)) {
				both.add(m);
			} else {
				needRemoveMembers.add(m);
			}
		}

		t = members.iterator();
		while (t.hasNext()) {
			m = t.next();
			if (!both.contains(m)) {
				needAddMembers.add(m);
			}
		}
		both.clear();
		both = null;
	}
}
