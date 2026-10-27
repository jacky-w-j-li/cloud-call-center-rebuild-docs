package com.m7.cc.ass.call.mail;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.event.CallCounter;
import com.m7.cc.ass.call.impl.Activator;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Mail;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.MailQueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class MailDispatcherThread extends Thread {
	private static Logger log = Logger.getLogger(MailDispatcherThread.class.getName());
	
	MailQueue mailQueue = null;
	
	public MailDispatcherThread(MailQueue curQueue) {
		mailQueue = curQueue;
	}
	
	@Override
    public void run() {
		log.log(Level.WARNING,"mail dispatcher thread run +++++Queue["+mailQueue.getExten()+"]++++++ bufferSize="+mailQueue.mailBuffer.size());
    	synchronized (mailQueue.mailBuffer) {
            while (mailQueue.mailBuffer.size() > 0) {
                try {
                	log.log(Level.WARNING,"mail+++++Queue["+mailQueue.getExten()+"]++++++ mailQueue.getIdelCount()="+mailQueue.getIdelCount());
                	log.log(Level.WARNING,"mail+++++Queue["+mailQueue.getExten()+"]++++++ mailQueue.getMailUnReceiveCount()="+mailQueue.getMailUnReceiveCount());
                	if(mailQueue.getIdelCount() - mailQueue.getMailUnReceiveCount() < 1){
                		log.log(Level.WARNING, "mail Queue ["+mailQueue.getExten()+"] IdelMember is 0!");
                        mailQueue.mailBuffer.notifyAll();
                		break;
                	}else{
                		log.log(Level.WARNING,"mail dispatcher to user" +
                				" ++++++Queue["+mailQueue.getExten()+"]+++++ IdelMemberCount="+mailQueue.getIdelCount()+"+++++ mailUnReceiveCount="+mailQueue.getMailUnReceiveCount());
						
                		dispatcher(mailQueue.mailBuffer.remove(0));
						log.log(Level.WARNING,"mail dispatcher to user +++++Queue["+mailQueue.getExten()+"]++++++ bufferSize="+mailQueue.mailBuffer.size());
                	}
                } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                }
            }
            mailQueue.mailBuffer.notifyAll();
    	}
		log.log(Level.WARNING,"mail dispatcher thread stop +++++Queue["+mailQueue.getExten()+"]++++++");
    }
	
    public void dispatcher(Mail mail) {
		String dealId = null;
		synchronized (mailQueue.AIdelMembers) {
			if(mailQueue.AIdelMembers.size() - mailQueue.mailAUnReceive.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.AIdelMembers.entrySet()){
					if(!mailQueue.mailAUnReceive.containsKey(entry.getKey())){
						if(mailQueue.mailADispatcherMap.size() >= (mailQueue.AIdelMembers.size() - mailQueue.mailAUnReceive.size())){
							mailQueue.mailADispatcherMap.clear();
						}
						if(!mailQueue.mailADispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.mailADispatcherMap.put(dealId, true);
							break;
						}
					}
				}   
			}
			mailQueue.AIdelMembers.notifyAll();
		}
    	if(dealId != null){
    		notifyToAgent(dealId, mail);
    		return;
    	}
		synchronized (mailQueue.BIdelMembers) {
			if(mailQueue.BIdelMembers.size() - mailQueue.mailBUnReceive.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.BIdelMembers.entrySet()){
					if(!mailQueue.mailBUnReceive.containsKey(entry.getKey())){
						if(mailQueue.mailBDispatcherMap.size() >= (mailQueue.BIdelMembers.size() - mailQueue.mailBUnReceive.size())){
							mailQueue.mailBDispatcherMap.clear();
						}
						if(!mailQueue.mailBDispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.mailBDispatcherMap.put(dealId, true);
							break;
						}
					}
				}   
			}
			mailQueue.BIdelMembers.notifyAll();
		}
		if(dealId != null){
			notifyToAgent(dealId, mail);
    		return;
    	}
		synchronized (mailQueue.CIdelMembers) {
			if(mailQueue.CIdelMembers.size() - mailQueue.mailCUnReceive.size() > 0){
				for(Map.Entry<String, MailQueueMember> entry:mailQueue.CIdelMembers.entrySet()){
					if(!mailQueue.mailCUnReceive.containsKey(entry.getKey())){
						if(mailQueue.mailCDispatcherMap.size() >= (mailQueue.CIdelMembers.size() - mailQueue.mailCUnReceive.size())){
							mailQueue.mailCDispatcherMap.clear();
						}
						if(!mailQueue.mailCDispatcherMap.containsKey(entry.getKey())){
							dealId = entry.getKey();
							mailQueue.mailCDispatcherMap.put(dealId, true);
							break;
						}						
					}
				}   
			}
			mailQueue.CIdelMembers.notifyAll();
		}
		if(dealId != null){
			notifyToAgent(dealId, mail);
    		return;
    	}
		mail.setDispatchered(true);
		MailQueueRuntime.getInstance().addToMailBuffer(mail);
	}
    
    private void notifyToAgent(String agentId,Mail mail){
    	C5Account account;
		try {				
			account = RuntimeData.getInstance().getAccount(mailQueue.getPbx(), mailQueue.getAccount());
			User user = account.getUser(agentId);
			
			if(user != null && user.isLogin() && !user.isBusy() && user.getConnection() != null) {

				log.log(Level.WARNING,"mail dispatcher to user +++++++++++ exten= ["+user.getExten()+"]+++mailID="+mail.getMailId());
//				CallCounter.setBusy(user, "98", true);
				C5Event event = new C5Event("NewMail");
				event.addParameter(Fields.Data, mail.getMap());
				event.addParameter(Fields.PBX, mailQueue.getPbx());
				event.addParameter(Fields.Account, mailQueue.getAccount());
				user.getConnection().sendEvent(event);
				
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(mail.getMailId(), "mail", agentId, 2));
				
//				mail.setDispatcheredCount(mail.getDispatcheredCount()+1);
//				int a = mailQueue.getTimeout() * 1000;
//				MailDispatcherTimerTask task = new MailDispatcherTimerTask(user, mail, mailQueue);
//				user.setMailDispatcherTimerTask(task);
//				user.setWaitAcceptMail(mail);
//				Activator.callTimer.schedule(task, a);
			}else{
				mail.setDispatchered(true);
				MailQueueRuntime.getInstance().addToMailBuffer(mail);
			}
			
		} catch (Exception e) {
			log.log(Level.WARNING,"mail notifyToAgent has Exception!"+e);
		}
		return;
    }
}
