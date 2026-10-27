package com.m7.cc.ass.server.config.handler;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.mail.MailQueueRuntime;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.MailQueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class MailQueueHandler {
	
	private static Logger log = Logger.getLogger(MailQueueHandler.class.getName());
	
	public static C5Response addMailQueues(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			MailQueue mqueue = RuntimeData.getInstance().getMailQueue(pbx, account, exten);
			if(mqueue == null){
				mqueue = new MailQueue(pbx, account, exten);
			}

			Set<String> oldMembers = mqueue.getMemberSet();
			mqueue.setValue(action.getParameters());
			
			RuntimeData.getInstance().updateMailQueue(pbx, account, mqueue);

			Set<String> needAddMembers = new HashSet<String>();
			Set<String> needRemoveMembers = new HashSet<String>();
			Set<String> newMembers = mqueue.getMemberSet();
			pickoutMember(newMembers, oldMembers, needAddMembers, needRemoveMembers);
			
			Iterator<String> memberIte = null;
			User u = null;
			if (needAddMembers.size() > 0) {
				memberIte = needAddMembers.iterator();
				while (memberIte.hasNext()) {
					u = RuntimeData.getInstance().getAccount(pbx, account)
							.getUser(memberIte.next());
					if(u != null){
						u.getMailQueues().add(mqueue.getExten());
						if (u.isLogin()) {
							if(!u.isBusy()){
								mqueue.addIdelMember(u.getId(), mqueue.getPenalty(u.getId()));								
							}
							mqueue.addLoginMember(u.getId(), mqueue.getPenalty(u.getId()));
						}
					}
				}
			}
			if (needRemoveMembers.size() > 0) {
				memberIte = needRemoveMembers.iterator();
				Map<String, MailQueueMember> queueMembers = mqueue
						.getIdelQueueMembers();
				while (memberIte.hasNext()) {
					u = RuntimeData.getInstance().getAccount(pbx, account)
							.getUser(memberIte.next());
					if(u != null){
						if(queueMembers.containsKey(u.getId())){
							u.getMailQueues().remove(mqueue.getExten());
							if(u.isLogin() && !u.isBusy()){
								if(!u.isBusy()){
									mqueue.removeIdelMember(u.getId());																	
								}
								mqueue.removeLoginMember(u.getId());
							}
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
	
	public static boolean removeMailQueue(String pbx, String accountID,Vector<String> _mqueues){
		for (int i = 0; i < _mqueues.size(); i++){
			if(MailQueueRuntime.getInstance().getMailThreadMap().containsKey(_mqueues.get(i))){
				MailQueueRuntime.getInstance().getMailThreadMap().remove(_mqueues.get(i));
			}
		}
		try {
			RuntimeData.getInstance().removeMailQueue(pbx, accountID, _mqueues);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return true;
	}
}
