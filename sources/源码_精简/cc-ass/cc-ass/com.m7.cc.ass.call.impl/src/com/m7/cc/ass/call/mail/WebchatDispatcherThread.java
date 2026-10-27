package com.m7.cc.ass.call.mail;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.MailQueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WebchatMessage;
import com.m7.cc.ass.model.configuration.WebchatSession;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class WebchatDispatcherThread extends Thread {
	private static Logger log = Logger.getLogger(WebchatDispatcherThread.class.getName());
	
	MailQueue mailQueue = null;
	
	public WebchatDispatcherThread(MailQueue curQueue) {
		mailQueue = curQueue;
	}
	
	@Override
    public void run() {
    	synchronized (mailQueue.webchatBuffer) {
            while (mailQueue.webchatBuffer.size() > 0) {
            	log.log(Level.WARNING,"webchat dispatcher thread run ++++++Queue["+mailQueue.getExten()+"]+++++ bufferSize="+mailQueue.webchatBuffer.size());
                try {
                	log.log(Level.WARNING,"webchat+++++Queue["+mailQueue.getExten()+"]++++++ mailQueue.getIdelCount()="+mailQueue.getIdelCount());
                	if(mailQueue.getIdelCount() > 0){
                		log.log(Level.WARNING,"webchat dispatcher to user ++++Queue["+mailQueue.getExten()+"]+++++++ " +
                				"IdelMemberCount="+mailQueue.getIdelCount());
						dispatcher(mailQueue.webchatBuffer.remove(0));
						log.log(Level.WARNING,"webchat dispatcher to user ++++++Queue["+mailQueue.getExten()+"]+++++ bufferSize="+mailQueue.webchatBuffer.size());
                	}
                } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                }
            }
            mailQueue.webchatBuffer.notifyAll();
    	}
		log.log(Level.WARNING,"webchat dispatcher thread stop +++++Queue["+mailQueue.getExten()+"]++++++");
    }
	
    public void dispatcher(WebchatMessage msg) {
    	WebchatSession session = MailQueueRuntime.getInstance().webchatSessionMap.get(msg.getSid());
    	if(session != null){
    		if(System.currentTimeMillis() - session.getLastSendTime() < 24*60*60*1000l){
    			log.log(Level.WARNING,"webcaht "+msg.getSid()+"dispatcher find session to user +++++["+session.getUserID()+"]++++++");
    			notifyToAgentBySession(session, msg);
    			return;    			
    		}else{
    			 MailQueueRuntime.getInstance().webchatSessionMap.remove(msg.getSid());
    		}
    	}
    	
		String dealId = null;
		synchronized (mailQueue.AIdelMembers) {
			if(mailQueue.AIdelMembers.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.AIdelMembers.entrySet()){
					if(mailQueue.webchatADispatcherMap.size() >= mailQueue.AIdelMembers.size()){
						mailQueue.webchatADispatcherMap.clear();
					}
					if(!mailQueue.webchatADispatcherMap.containsKey(entry.getKey())){
						dealId = entry.getKey();
						mailQueue.webchatADispatcherMap.put(dealId, true);
						break;
					}
				}   
			}
			mailQueue.AIdelMembers.notifyAll();
		}
    	if(dealId != null){
    		notifyToAgent(dealId, msg);
    		return;
    	}
		synchronized (mailQueue.BIdelMembers) {
			if(mailQueue.BIdelMembers.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.BIdelMembers.entrySet()){
					if(mailQueue.webchatBDispatcherMap.size() >= mailQueue.BIdelMembers.size()){
						mailQueue.webchatBDispatcherMap.clear();
					}
					if(!mailQueue.webchatBDispatcherMap.containsKey(entry.getKey())){
						dealId = entry.getKey();
						mailQueue.webchatBDispatcherMap.put(dealId, true);
						break;
					}
				}   
			}
			mailQueue.BIdelMembers.notifyAll();
		}
		if(dealId != null){
			notifyToAgent(dealId, msg);
    		return;
    	}
		synchronized (mailQueue.CIdelMembers) {
			if(mailQueue.CIdelMembers.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.CIdelMembers.entrySet()){
					if(mailQueue.webchatCDispatcherMap.size() >= mailQueue.CIdelMembers.size()){
						mailQueue.webchatCDispatcherMap.clear();
					}
					if(!mailQueue.webchatCDispatcherMap.containsKey(entry.getKey())){
						dealId = entry.getKey();
						mailQueue.webchatCDispatcherMap.put(dealId, true);
						break;
					}	
				}   
			}
			mailQueue.CIdelMembers.notifyAll();
		}
		if(dealId != null){
			notifyToAgent(dealId, msg);
    		return;
    	}
		msg.setDispatchered(true);
		MailQueueRuntime.getInstance().addToWebchatBuffer(msg);
	}
    
    private void notifyToAgent(String agentId,WebchatMessage msg){
    	C5Account account;
		try {				
			account = RuntimeData.getInstance().getAccount(mailQueue.getPbx(), mailQueue.getAccount());
			User user = account.getUser(agentId);
			
			if(user != null && user.isLogin() && !user.isBusy() && user.getConnection() != null) {
				log.log(Level.WARNING,"webchat dispatcher to user +++++++++++ exten="+user.getExten()+"+++webchatID="+msg.getMessageId());
				C5Event event = new C5Event("NewWebchat");
				event.addParameter(Fields.Data, msg.getMap());
				event.addParameter(Fields.PBX, mailQueue.getPbx());
				event.addParameter(Fields.Account, mailQueue.getAccount());
				user.getConnection().sendEvent(event);
				
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(msg.getMessageId(), msg.getSid(), "webchat", agentId, msg.getMsgType(), 3));
				
				WebchatSession session = new WebchatSession(msg.getSid(), agentId, System.currentTimeMillis());
				MailQueueRuntime.getInstance().webchatSessionMap.put(msg.getSid(), session);
				user.getWebchatSessionFromList().add(session.getSid());
			}else{
				msg.setDispatchered(true);
				MailQueueRuntime.getInstance().addToWebchatBuffer(msg);
			}
			
		} catch (Exception e) {
			log.log(Level.WARNING,"webchat notifyToAgent has Exception!",e);
		}
		return;
    }
    
    private void notifyToAgentBySession(WebchatSession session, WebchatMessage msg){
    	C5Account account;
		try {				
			account = RuntimeData.getInstance().getAccount(mailQueue.getPbx(), mailQueue.getAccount());
			User user = account.getUser(session.getUserID());
			
			if(user != null && user.isLogin() && user.getConnection() != null) {
				C5Event event = new C5Event("NewWebchat");
				event.addParameter(Fields.Data, msg.getMap());
				event.addParameter(Fields.PBX, mailQueue.getPbx());
				event.addParameter(Fields.Account, mailQueue.getAccount());
				user.getConnection().sendEvent(event);
				
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(msg.getMessageId(), msg.getSid(),"webchat", session.getUserID(), msg.getMsgType(), 3));
				session.setLastSendTime(System.currentTimeMillis());
			}else{
				msg.setDispatchered(true);
				MailQueueRuntime.getInstance().webchatSessionMap.remove(session.getSid());
				MailQueueRuntime.getInstance().addToWebchatBuffer(msg);
			}
		} catch (Exception e) {
			log.log(Level.WARNING,"webchat notifyToAgentBySession has Exception!",e);
		}
		return;
    }

}
