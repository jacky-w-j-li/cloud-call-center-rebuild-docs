package com.m7.cc.ass.call.mail;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.event.CallCounter;
import com.m7.cc.ass.call.impl.Activator;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.MailQueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WeixinMessage;
import com.m7.cc.ass.model.configuration.WeixinSession;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class WeixinDispatcherThread extends Thread {
	private static Logger log = Logger.getLogger(WeixinDispatcherThread.class.getName());
	
	MailQueue mailQueue = null;
	
	public WeixinDispatcherThread(MailQueue curQueue) {
		mailQueue = curQueue;
	}
	
	@Override
    public void run() {
    	synchronized (mailQueue.weixinBuffer) {
            while (mailQueue.weixinBuffer.size() > 0) {
            	log.log(Level.WARNING,"weixin dispatcher thread run ++++++Queue["+mailQueue.getExten()+"]+++++ bufferSize="+mailQueue.weixinBuffer.size());
                try {
                	log.log(Level.WARNING,"weixin+++++Queue["+mailQueue.getExten()+"]++++++ mailQueue.getIdelCount()="+mailQueue.getIdelCount());
                	log.log(Level.WARNING,"weixin+++++Queue["+mailQueue.getExten()+"]++++++ mailQueue.getMailUnReceiveCount()="+mailQueue.getMailUnReceiveCount());
                	if(mailQueue.getIdelCount() - mailQueue.getWeixinUnReceiveCount() < 1){
                		System.out.println("weixin Queue ["+mailQueue.getExten()+"] IdelMember is 0!");
                        mailQueue.weixinBuffer.notifyAll();
                		break;
                	}else{
                		log.log(Level.WARNING,"weixin dispatcher to user ++++Queue["+mailQueue.getExten()+"]+++++++ " +
                				"IdelMemberCount="+mailQueue.getIdelCount() + " +++ weixinUnReceiveCount="+mailQueue.getWeixinUnReceiveCount());
                		
						dispatcher(mailQueue.weixinBuffer.remove(0));
						log.log(Level.WARNING,"weixin dispatcher to user ++++++Queue["+mailQueue.getExten()+"]+++++ bufferSize="+mailQueue.weixinBuffer.size());
                	}
                } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                }
            }
            mailQueue.weixinBuffer.notifyAll();
    	}
		log.log(Level.WARNING,"weixin dispatcher thread stop +++++Queue["+mailQueue.getExten()+"]++++++");
    }
	
    public void dispatcher(WeixinMessage msg) {
    	WeixinSession session = MailQueueRuntime.getInstance().weixinSessionMap.get(msg.getUserID());
    	if(session != null){
    		if(System.currentTimeMillis() - session.getLastSendTime() < 24*60*60*1000l){
    			log.log(Level.WARNING,"weixin "+msg.getUserID()+"dispatcher find session to user +++++["+session.getUserID()+"]++++++");
    			notifyToAgentBySession(session, msg);
    			return;    			
    		}else{
    			 MailQueueRuntime.getInstance().weixinSessionMap.remove(msg.getUserID());
    		}
    	}
    	
		String dealId = null;
		synchronized (mailQueue.AIdelMembers) {
			if(mailQueue.AIdelMembers.size() - mailQueue.weixinAUnReceive.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.AIdelMembers.entrySet()){
					if(!mailQueue.weixinAUnReceive.containsKey(entry.getKey())){
						if(mailQueue.weixinADispatcherMap.size() >= (mailQueue.AIdelMembers.size() - mailQueue.weixinAUnReceive.size())){
							mailQueue.weixinADispatcherMap.clear();
						}
						if(!mailQueue.weixinADispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.weixinADispatcherMap.put(dealId, true);
							break;
						}					
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
			if(mailQueue.BIdelMembers.size() - mailQueue.weixinBUnReceive.size()> 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.BIdelMembers.entrySet()){
					if(!mailQueue.weixinBUnReceive.containsKey(entry.getKey())){
						if(mailQueue.weixinBDispatcherMap.size() >= (mailQueue.BIdelMembers.size() - mailQueue.weixinBUnReceive.size())){
							mailQueue.weixinBDispatcherMap.clear();
						}
						if(!mailQueue.weixinBDispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.weixinBDispatcherMap.put(dealId, true);
							break;
						}						
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
			if(mailQueue.CIdelMembers.size() - mailQueue.weixinCUnReceive.size()> 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.CIdelMembers.entrySet()){
					if(!mailQueue.weixinCUnReceive.containsKey(entry.getKey())){
						if(mailQueue.weixinCDispatcherMap.size() >= (mailQueue.CIdelMembers.size() - mailQueue.weixinCUnReceive.size())){
							mailQueue.weixinCDispatcherMap.clear();
						}
						if(!mailQueue.weixinCDispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.weixinCDispatcherMap.put(dealId, true);
							break;
						}						
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
		MailQueueRuntime.getInstance().addToWeixinBuffer(msg);
	}
    
    private void notifyToAgent(String agentId,WeixinMessage msg){
    	C5Account account;
		try {				
			account = RuntimeData.getInstance().getAccount(mailQueue.getPbx(), mailQueue.getAccount());
			User user = account.getUser(agentId);
			
			if(user != null && user.isLogin() && !user.isBusy() && user.getConnection() != null) {
				log.log(Level.WARNING,"weixin dispatcher to user +++++++++++ exten="+user.getExten()+"+++weixinID="+msg.getMessageId());
//				CallCounter.setBusy(user, "97", true);
				C5Event event = new C5Event("NewWeixin");
				event.addParameter(Fields.Data, msg.getMap());
				event.addParameter(Fields.PBX, mailQueue.getPbx());
				event.addParameter(Fields.Account, mailQueue.getAccount());
				user.getConnection().sendEvent(event);
				
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(msg.getMessageId(), "weixin", agentId, 2));
				
				WeixinSession session = new WeixinSession(msg.getUserID(), agentId, System.currentTimeMillis());
				MailQueueRuntime.getInstance().weixinSessionMap.put(msg.getUserID(), session);
				user.getWeixinSessionFromList().add(session.getFrom());
//				int a = mailQueue.getTimeout() * 1000;
//				WeixinDispatcherTimerTask task = new WeixinDispatcherTimerTask(user, msg, mailQueue);
//				Activator.callTimer.schedule(task, a);
			}else{
				msg.setDispatchered(true);
				MailQueueRuntime.getInstance().addToWeixinBuffer(msg);
			}
			
		} catch (Exception e) {
			log.log(Level.WARNING,"weixin notifyToAgent has Exception!",e);
		}
		return;
    }
    
    private void notifyToAgentBySession(WeixinSession session, WeixinMessage msg){
    	C5Account account;
		try {				
			account = RuntimeData.getInstance().getAccount(mailQueue.getPbx(), mailQueue.getAccount());
			User user = account.getUser(session.getUserID());
			
			if(user != null && user.isLogin() && user.getConnection() != null) {
				C5Event event = new C5Event("NewWeixin");
				event.addParameter(Fields.Data, msg.getMap());
				event.addParameter(Fields.PBX, mailQueue.getPbx());
				event.addParameter(Fields.Account, mailQueue.getAccount());
				user.getConnection().sendEvent(event);
				
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(msg.getMessageId(), "weixin", session.getUserID(), 2));
				session.setLastSendTime(System.currentTimeMillis());
			}else{
				msg.setDispatchered(true);
				MailQueueRuntime.getInstance().weixinSessionMap.remove(session.getFrom());
				MailQueueRuntime.getInstance().addToWeixinBuffer(msg);
			}
		} catch (Exception e) {
			log.log(Level.WARNING,"weixin notifyToAgentBySession has Exception!",e);
		}
		return;
    }

}
