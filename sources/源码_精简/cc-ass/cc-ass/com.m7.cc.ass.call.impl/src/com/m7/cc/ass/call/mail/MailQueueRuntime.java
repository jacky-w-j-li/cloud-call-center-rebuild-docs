package com.m7.cc.ass.call.mail;

import java.util.Hashtable;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Mail;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.MailQueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WebchatMessage;
import com.m7.cc.ass.model.configuration.WebchatSession;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.ass.model.configuration.WeixinMessage;
import com.m7.cc.ass.model.configuration.WeixinSession;

public class MailQueueRuntime{
	private static Logger log = Logger.getLogger(MailQueueRuntime.class.getName());

	private static MailQueueRuntime instance = null;
	
	public Hashtable<String, Thread> mailThreadMap = new Hashtable<String, Thread>();
	public Hashtable<String, Thread> weixinThreadMap = new Hashtable<String, Thread>();
	public Hashtable<String, WeixinSession> weixinSessionMap = new Hashtable<String, WeixinSession>();
	public Hashtable<String, Thread> webchatThreadMap = new Hashtable<String, Thread>();
	public Hashtable<String, WebchatSession> webchatSessionMap = new Hashtable<String, WebchatSession>();

	private ThreadPoolExecutor mailQueueThreadPoolExecutor = (ThreadPoolExecutor) Executors.newCachedThreadPool();
	
	public ThreadPoolExecutor getMailQueueThreadPoolExecutor() {
		return mailQueueThreadPoolExecutor;
	}

	public void setMailQueueThreadPoolExecutor(
			ThreadPoolExecutor mailQueueThreadPoolExecutor) {
		this.mailQueueThreadPoolExecutor = mailQueueThreadPoolExecutor;
	}
	
	private MailQueueRuntime() {
		instance = this;
	}
	
	public static MailQueueRuntime getInstance() {
		if (instance == null)
			new MailQueueRuntime();
		return instance;
	}

	public void addToMailBuffer(Mail newMail) {
		try {
			String pbx = newMail.getPbx();
			String account = newMail.getAccount();
			MailAddr mailAddr = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getMailAddrs().get(newMail.getAddr());
			MailQueue curQueue = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getMailQueues().get(mailAddr.getToPeer());
			if(curQueue == null){
				log.warning("this queue ["+mailAddr.getToPeer()+"] not exist ,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newMail.getMailId(), "mail", "leak"));
				return;
			}
			if(curQueue.getLoginQueueMembers().size() == 0){
				log.warning("this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				System.out.println("this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newMail.getMailId(), "mail", "leak"));
				return;
			}
			if(newMail.isDispatchered()){
				if(curQueue.getIdelCount() > 0){
					C5Account curAccount = RuntimeData.getInstance().getAccount(pbx, account);
					for(Map.Entry<String, MailQueueMember> entry:curQueue.getIdelQueueMembers().entrySet()){
						User user = curAccount.getUser(entry.getKey());
						if(user == null || !user.isLogin() || user.getConnection() == null || user.isBusy()) {
							curQueue.removeIdelMember(entry.getKey());
							if(!user.isLogin()){
								curQueue.removeLoginMember(entry.getKey());
							}
						}
					}
				}
			}
			synchronized (curQueue.mailBuffer) {
				if (curQueue.mailBuffer.size() > 1000000) {
					log.warning("mail Queue buffer is too large to cache any event");

					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
							.execute(new requestMultiChannelDispatcherTask(newMail.getMailId(), "mail", "leak"));
					curQueue.mailBuffer.notifyAll();
					return;
				} else {
					if(newMail.getDispatcheredCount() != 0 || newMail.isDispatchered()){
						log.warning("mail add queue ["+curQueue.getExten()+"]to buffer first mail="+newMail.getFrom());
						curQueue.mailBuffer.add(0, newMail);
					}else{
						log.warning("mail add to queue ["+curQueue.getExten()+"] buffer last mail ="+newMail.getFrom());
						curQueue.mailBuffer.add(newMail);						
					}
				}				
				curQueue.mailBuffer.notifyAll();
			}
			
			startMailDispatcherThread(curQueue);
		} catch (Exception e) {
			log.log(Level.WARNING, "dispatcher failed!" , e);
			MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
				.execute(new requestMultiChannelDispatcherTask(newMail.getMailId(), "mail", "leak"));
			e.printStackTrace();
		}
	}
	
	public void startMailDispatcherThread(MailQueue mailQueue){
		synchronized (mailThreadMap) {
				Thread curThread = null;
				if(mailThreadMap.get(mailQueue.getExten()) == null){
					curThread = new MailDispatcherThread(mailQueue);
					mailThreadMap.put(mailQueue.getExten(), curThread);
				}else{
					curThread = mailThreadMap.get(mailQueue.getExten());
				}
				if(!curThread.isAlive()){
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor().execute(curThread);
				}
				mailThreadMap.notifyAll();
		}
	}
	
	public void clearMailBuffer(MailQueue mailQueue){
		synchronized (mailQueue.mailBuffer) {
			while (mailQueue.mailBuffer.size() > 0) {
				Mail curMail = mailQueue.mailBuffer.remove(0);
				log.warning("this Queue ["+mailQueue.getExten()+"] all member is logoff ,this queue mail buffer is clear!");
				if(curMail.getDispatcheredCount() == 0){
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
							.execute(new requestMultiChannelDispatcherTask(curMail.getMailId(), "mail", "leak")); 
				}else{
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
							.execute(new requestMultiChannelDispatcherTask(curMail.getMailId(), "mail", "undeal")); 
				}
			}
			mailQueue.mailBuffer.notifyAll();
		}
	}
	
	public void addToWeixinBuffer(WeixinMessage newWeixin) {
		try {
			String pbx = newWeixin.getPbx();
			String account = newWeixin.getAccount();
			WeixinAddr weixinAddr = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getWeixinAddrs().get(newWeixin.getOpenID());
			MailQueue curQueue = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getMailQueues().get(weixinAddr.getToPeer());
			if(curQueue == null){
				log.warning("this queue ["+weixinAddr.getToPeer()+"] not exist ,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newWeixin.getMessageId(), "weixin", "leak"));
				return;
			}
			if(curQueue.getLoginQueueMembers().size() == 0){
				log.warning("Weixin this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				System.out.println("Weixin this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newWeixin.getMessageId(), "weixin", "leak"));
				return;
			}
			if(newWeixin.isDispatchered()){
				if(curQueue.getIdelCount() > 0){
					C5Account curAccount = RuntimeData.getInstance().getAccount(pbx, account);
					for(Map.Entry<String, MailQueueMember> entry:curQueue.getIdelQueueMembers().entrySet()){
						User user = curAccount.getUser(entry.getKey());
						if(user == null || !user.isLogin() || user.getConnection() == null || user.isBusy()) {
							curQueue.removeIdelMember(entry.getKey());
							if(!user.isLogin()){
								curQueue.removeLoginMember(entry.getKey());
							}
						}
					}
				}
			}
			synchronized (curQueue.weixinBuffer) {
				if (curQueue.weixinBuffer.size() > 1000000) {
					log.warning("weixin Queue buffer is too large to cache any event");
					System.out.println("this weixinBuffer size too large,we tell fenfaqi!");

					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
							.execute(new requestMultiChannelDispatcherTask(newWeixin.getMessageId(), "weixin", "leak"));
					curQueue.weixinBuffer.notifyAll();
					return;
				} else {
					if(newWeixin.isDispatchered()){
						log.warning("weixin add queue ["+curQueue.getExten()+"]to buffer first mail="+newWeixin.getUserID());
						curQueue.weixinBuffer.add(0, newWeixin);
					}else{

						log.warning("weixin add queue ["+curQueue.getExten()+"]to buffer last mail="+newWeixin.getUserID());
						curQueue.weixinBuffer.add(newWeixin);						
					}
				}				
				curQueue.weixinBuffer.notifyAll();
			}
			startWeixinDispatcherThread(curQueue);
		} catch (Exception e) {
			log.log(Level.WARNING, "dispatcher failed!" , e);
			MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(newWeixin.getMessageId(), "weixin", "leak"));
			e.printStackTrace();
		}
	}
	
	public void startWeixinDispatcherThread(MailQueue mailQueue){
		synchronized (weixinThreadMap) {
				Thread curThread = null;
				if(weixinThreadMap.get(mailQueue.getExten()) == null){
					curThread = new WeixinDispatcherThread(mailQueue);
					weixinThreadMap.put(mailQueue.getExten(), curThread);
				}else{
					curThread = weixinThreadMap.get(mailQueue.getExten());
				}
				if(!curThread.isAlive()){
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor().execute(curThread);
				}
				weixinThreadMap.notifyAll();
		}
	}
	
	public void clearWeixinBuffer(MailQueue mailQueue){
		synchronized (mailQueue.weixinBuffer) {
			while (mailQueue.weixinBuffer.size() > 0) {
				WeixinMessage weixin = mailQueue.weixinBuffer.remove(0);
				log.warning("this Queue ["+mailQueue.getExten()+"] all member is logoff ,this queue weixin buffer is clear!");
				System.out.println("this Queue ["+mailQueue.getExten()+"] all member is logoff ,this weixin queue buffer is clear!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(weixin.getMessageId(), "weixin", "undeal")); 
			}
			mailQueue.weixinBuffer.notifyAll();
		}
	}

	public Hashtable<String, Thread> getMailThreadMap() {
		return mailThreadMap;
	}

	public void setMailThreadMap(Hashtable<String, Thread> mailThreadMap) {
		this.mailThreadMap = mailThreadMap;
	}
	//-------
	public void addToWebchatBuffer(WebchatMessage newWebchat) {
		try {
			String pbx = newWebchat.getPbx();
			String account = newWebchat.getAccount();
			WebchatAddr webchatAddr = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getWebchatAddrs().get(newWebchat.getAccessId());
			MailQueue curQueue = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getMailQueues().get(webchatAddr.getToPeer());
			if(curQueue == null){
				log.warning("this queue ["+webchatAddr.getToPeer()+"] not exist ,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newWebchat.getMessageId(),  newWebchat.getSid(), "webchat", "leak", newWebchat.getMsgType(), "4"));
				return;
			}
			if(curQueue.getLoginQueueMembers().size() == 0){
				log.warning("Webchat this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				System.out.println("Webchat this queue ["+curQueue.getExten()+"] not login member,we tell fenfaqi!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(newWebchat.getMessageId(), newWebchat.getSid(), "webchat", "leak", newWebchat.getMsgType(), "4"));
				return;
			}
			if(newWebchat.isDispatchered()){
				if(curQueue.getIdelCount() > 0){
					C5Account curAccount = RuntimeData.getInstance().getAccount(pbx, account);
					for(Map.Entry<String, MailQueueMember> entry:curQueue.getIdelQueueMembers().entrySet()){
						User user = curAccount.getUser(entry.getKey());
						if(user == null || !user.isLogin() || user.getConnection() == null || user.isBusy()) {
							curQueue.removeIdelMember(entry.getKey());
							if(!user.isLogin()){
								curQueue.removeLoginMember(entry.getKey());
							}
						}
					}
				}
			}
			synchronized (curQueue.webchatBuffer) {
				if (curQueue.webchatBuffer.size() > 1000000) {
					log.warning("webchat Queue buffer is too large to cache any event");
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
							.execute(new requestMultiChannelDispatcherTask(newWebchat.getMessageId(),newWebchat.getSid() ,"webchat", "leak", newWebchat.getMsgType(), "4"));
					curQueue.webchatBuffer.notifyAll();
					return;
				} else {
					if(newWebchat.isDispatchered()){
						log.warning("webchat add queue ["+curQueue.getExten()+"]to buffer first sid="+newWebchat.getSid());
						curQueue.webchatBuffer.add(0, newWebchat);
					}else{
						log.warning("webchat add queue ["+curQueue.getExten()+"]to buffer last sid="+newWebchat.getSid());
						curQueue.webchatBuffer.add(newWebchat);						
					}
				}				
				curQueue.webchatBuffer.notifyAll();
			}
			startWebchatDispatcherThread(curQueue);
		} catch (Exception e) {
			log.log(Level.WARNING, "dispatcher failed!" , e);
			MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
					.execute(new requestMultiChannelDispatcherTask(newWebchat.getMessageId(), newWebchat.getSid(), "webchat", "leak", newWebchat.getMsgType(), "4"));
			e.printStackTrace();
		}
	}
	
	public void startWebchatDispatcherThread(MailQueue mailQueue){
		synchronized (webchatThreadMap) {
				Thread curThread = null;
				if(webchatThreadMap.get(mailQueue.getExten()) == null){
					curThread = new WebchatDispatcherThread(mailQueue);
					webchatThreadMap.put(mailQueue.getExten(), curThread);
				}else{
					curThread = webchatThreadMap.get(mailQueue.getExten());
				}
				if(!curThread.isAlive()){
					MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor().execute(curThread);
				}
				webchatThreadMap.notifyAll();
		}
	}
	
	public void clearWebchatBuffer(MailQueue mailQueue){
		synchronized (mailQueue.webchatBuffer) {
			while (mailQueue.webchatBuffer.size() > 0) {
				WebchatMessage webchat = mailQueue.webchatBuffer.remove(0);
				log.warning("this Queue ["+mailQueue.getExten()+"] all member is logoff ,this queue webcaht buffer is clear!");
				System.out.println("this Queue ["+mailQueue.getExten()+"] all member is logoff ,this webchat queue buffer is clear!");
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(webchat.getMessageId(), webchat.getSid(), "webcaht", "leak", webchat.getMsgType(), "4")); 
			}
			mailQueue.webchatBuffer.notifyAll();
		}
	}
	
}
