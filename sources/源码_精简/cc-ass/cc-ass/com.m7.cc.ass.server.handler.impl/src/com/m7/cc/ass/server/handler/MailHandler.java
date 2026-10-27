package com.m7.cc.ass.server.handler;

import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.mail.MailQueueRuntime;
import com.m7.cc.ass.call.mail.requestMultiChannelDispatcherTask;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.UserListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Mail;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WebchatMessage;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.ass.model.configuration.WeixinMessage;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;


public class MailHandler implements UserListener{
	private static Logger log = Logger.getLogger(MailHandler.class.getName());
	
	public void initMailHandler() {
		CallListener.getInstance().addUserListener("ALL", this);
	}
	
	public static C5Response handle(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String account = (String) action.getParameterValue(Fields.Account);
			String MailAddr = (String) action.getParameterValue("Address");

			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 PBX not found");
				response.setSucceed(false);
				return response;
			}
			
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("402 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			MailAddr addr = a.getMailAddrs().get(MailAddr);
			if(addr == null){
				response.setMessage("403 MAIL ADDRESS not found");
				response.setSucceed(false);
				return response;
			}
			Mail newMail = new Mail();
			newMail.setValues(action.getParameters());
			
			log.log(Level.WARNING,"Receive mail +++++++++++"+newMail.getMap());
			MailQueueRuntime.getInstance().addToMailBuffer(newMail);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response acceptMail(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String account = (String) action.getParameterValue(Fields.Account);
			String UserId = (String) action.getParameterValue(Fields.UserID);

			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 PBX not found");
				response.setSucceed(false);
				return response;
			}
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("402 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			User curUser = a.getUser(UserId);
			
			if(curUser.getWaitAcceptMail() != null){
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(curUser.getWaitAcceptMail().getMailId(), "mail", "deal"));
				if(curUser.getMailDispatcherTimerTask() != null){
					curUser.getMailDispatcherTimerTask().cancel();
				}
				curUser.setWaitAcceptMail(null);
				response.setSucceed(true);
				response.setMessage("200");
			}else{
				response.setSucceed(true);
				response.setMessage("404");
			}
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response handleNewWeixin(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			log.log(Level.WARNING,"Receive weixin action +++++++++++"+action.getJsonString());
			String account = (String) action.getParameterValue(Fields.Account);
			String weixinAddr = (String) action.getParameterValue("OpenID");
			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 PBX not found");
				response.setSucceed(false);
				return response;
			}
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("402 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			WeixinAddr addr = a.getWeixinAddrs().get(weixinAddr);
			if(addr == null){
				response.setMessage("403 WEIXIN OPENID not found");
				response.setSucceed(false);
				return response;
			}
			
			WeixinMessage newWeixin = new WeixinMessage();
			newWeixin.setValues(action.getParameters());
			log.log(Level.WARNING,"Receive weixin +++++++++++"+newWeixin.getMap());
			MailQueueRuntime.getInstance().addToWeixinBuffer(newWeixin);
			response.setSucceed(true);			
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response handleNewWebchat(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			log.log(Level.WARNING,"Receive webchat IM action +++++++++++"+action.getJsonString());
			String account = (String) action.getParameterValue(Fields.Account);
			String accessId = (String) action.getParameterValue("AccessId");
			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 PBX not found");
				response.setSucceed(false);
				return response;
			}
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("402 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			WebchatAddr addr = a.getWebchatAddrs().get(accessId);
			if(addr == null){
				response.setMessage("403 WEBCHAT SERVICEID not found");
				response.setSucceed(false);
				return response;
			}
			WebchatMessage newWebchat = new WebchatMessage();
			newWebchat.setValues(action.getParameters());
			log.log(Level.WARNING,"Receive webchat IM +++++++++++"+newWebchat.getMap());
			MailQueueRuntime.getInstance().addToWebchatBuffer(newWebchat);
			response.setSucceed(true);			
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response handleSetMultiChannelReceiveStatus(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String account = (String) action.getParameterValue(Fields.Account);
			String userId = (String) action.getParameterValue(Fields.UserID);
			String mailStatus = (String) action.getParameterValue(Fields.Mail);
			String weixinStatus = (String) action.getParameterValue(Fields.Weixin);
			
			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 PBX not found");
				response.setSucceed(false);
				return response;
			}
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("402 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			User user = a.getUser(userId);

			if(user.isLogin()){
				if(mailStatus.equals("true")){
					log.log(Level.WARNING,"SetMultiReceiveStatus Receive mail +++++++++++ is true");
					if(a.getMailQueues() != null && a.getMailQueues().size()>0){
						for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    				     
						     if(entry.getValue().getMembersMap().containsKey(user.getId())){
						    	 synchronized (entry.getValue().mailAUnReceive) {
						    		 if(entry.getValue().mailAUnReceive.containsKey(user.getId())){
						    			 entry.getValue().mailAUnReceive.remove(user.getId());
						    		 }									
						    	 }
					    		 synchronized (entry.getValue().mailBUnReceive) {
					    			 if(entry.getValue().mailBUnReceive.containsKey(user.getId())){
					    				 entry.getValue().mailBUnReceive.remove(user.getId());
					    			 }										
						    	 }
					    		 synchronized (entry.getValue().mailCUnReceive) {
					    			 if(entry.getValue().mailCUnReceive.containsKey(user.getId())){
					    				 entry.getValue().mailCUnReceive.remove(user.getId());
					    			 }										
						    	 }
						    	 if(entry.getValue().getMailBuffer().size() >0){
					    			 MailQueueRuntime.getInstance().startMailDispatcherThread(entry.getValue());
					    		 }
						     }
						}
					}
				}else{
					if(a.getMailQueues() != null && a.getMailQueues().size()>0){
						for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    				     
						     if(entry.getValue().getMembersMap().containsKey(user.getId())){
						    	 String penalty = entry.getValue().getMembersMap().get(user.getId());
						    	 if(penalty.endsWith("0")){
						    		 synchronized (entry.getValue().mailAUnReceive) {						    			 
						    			 entry.getValue().mailAUnReceive.put(user.getId(), true);
						    		 }
						    	 }else if(penalty.endsWith("1")){
						    		 synchronized (entry.getValue().mailBUnReceive) {
						    			 entry.getValue().mailBUnReceive.put(user.getId(), true);;						    			 
						    		 }
						    	 }else if(penalty.endsWith("2")){
						    		 synchronized (entry.getValue().mailCUnReceive) {
						    			 entry.getValue().mailCUnReceive.put(user.getId(), true);;						    			 
						    		 }
						    	 }
						     }
						}
					}
				}
				if(weixinStatus.equals("true")){
					if(a.getMailQueues() != null && a.getMailQueues().size()>0){
						for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    				     
						     if(entry.getValue().getMembersMap().containsKey(user.getId())){
						    	 synchronized (entry.getValue().weixinAUnReceive) {
						    		 if(entry.getValue().weixinAUnReceive.containsKey(user.getId())){
						    			 entry.getValue().weixinAUnReceive.remove(user.getId());
						    		 }						    		 
						    	 }
						    	 synchronized (entry.getValue().weixinBUnReceive) {
						    		 if(entry.getValue().weixinBUnReceive.containsKey(user.getId())){
						    			 entry.getValue().weixinBUnReceive.remove(user.getId());
							    	 }
						    	 }
						    	 synchronized (entry.getValue().weixinCUnReceive) {
						    		 if(entry.getValue().weixinCUnReceive.containsKey(user.getId())){
						    			 entry.getValue().weixinCUnReceive.remove(user.getId());
							    	 }
						    	 }
						    	 if(entry.getValue().getWeixinBuffer().size() >0){
					    			 MailQueueRuntime.getInstance().startWeixinDispatcherThread(entry.getValue());
					    		 }
						     }
						}
					}
				}else{
					if(a.getMailQueues() != null && a.getMailQueues().size()>0){
						for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    				     
						     if(entry.getValue().getMembersMap().containsKey(user.getId())){
						    	 String penalty = entry.getValue().getMembersMap().get(user.getId());
					    		 if(penalty.endsWith("0")){
					    			 synchronized (entry.getValue().weixinAUnReceive) {
					    				 entry.getValue().weixinAUnReceive.put(user.getId(), true);					    				 
					    			 }
						    	 }else if(penalty.endsWith("1")){
						    		 synchronized (entry.getValue().weixinBUnReceive) {
						    			 entry.getValue().weixinBUnReceive.put(user.getId(), true);;						    			 
						    		 }
						    	 }else if(penalty.endsWith("2")){
						    		 synchronized (entry.getValue().weixinCUnReceive) {
						    			 entry.getValue().weixinCUnReceive.put(user.getId(), true);;						    			 
						    		 }
						    	 }
						     }
						}
					}
					if(user.getWeixinSessionFromList().size() > 0){
						for(int i=0 ;i<user.getWeixinSessionFromList().size() ;i++){
							MailQueueRuntime.getInstance().weixinSessionMap.remove(user.getWeixinSessionFromList().get(i));					
						}
					}
					user.getWeixinSessionFromList().clear();
				}
			}else{
				response.setMessage("403 user not logined");
				response.setSucceed(false);
				return response;
			}
			response.setSucceed(true);			
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}

	@Override
	public void userAdded(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userRemoved(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userLogin(User user) {
		try{
			C5Account a = RuntimeData.getInstance().getAccount(user.getPbx(), user.getAccount());
			if(a.getMailQueues() != null && a.getMailQueues().size()>0){
				for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    				     
				     if(entry.getValue().getMembersMap().containsKey(user.getId())){
				    	 entry.getValue().addLoginMember(user.getId(), entry.getValue().getMembersMap().get(user.getId()));
				    	 entry.getValue().addIdelMember(user.getId(), entry.getValue().getMembersMap().get(user.getId()));
			    		 if(entry.getValue().getMailBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startMailDispatcherThread(entry.getValue());
			    		 }
			    		 if(entry.getValue().getWeixinBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startWeixinDispatcherThread(entry.getValue());
			    		 }
			    		 if(entry.getValue().getWebchatBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startWebchatDispatcherThread(entry.getValue());
			    		 }
				     }
				}
			}
			user.setWeixinSessionFrom(new Vector<String>());
			user.setWebchatSessionFromList(new Vector<String>());
//			if(user.getMailDispatcherTimerTask() != null){
//				user.getMailDispatcherTimerTask().cancel();
//			}
		}catch (Exception e) {
			log.log(Level.WARNING, "",e);
		}
	}

	@Override
	public void userLogoff(User user) {
		try{
			C5Account a = RuntimeData.getInstance().getAccount(user.getPbx(), user.getAccount());
			if(a.getMailQueues() != null && a.getMailQueues().size()>0){
				for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){
				     if(entry.getValue().getMembersMap().containsKey(user.getId())){
				    	 entry.getValue().removeLoginMember(user.getId());
				    	 entry.getValue().removeIdelMember(user.getId());
				    	 if(entry.getValue().getLoginQueueMembers().size() == 0){
				    		 synchronized (entry.getValue().mailAUnReceive) {
				    			 entry.getValue().mailAUnReceive.clear();
				    		 }
				    		 synchronized (entry.getValue().mailBUnReceive) {
				    			 entry.getValue().mailBUnReceive.clear();
				    		 }
				    		 synchronized (entry.getValue().mailCUnReceive) {
				    			 entry.getValue().mailCUnReceive.clear();
				    		 }
				    		 synchronized (entry.getValue().weixinAUnReceive) {
				    			 entry.getValue().weixinAUnReceive.clear();
				    		 }
				    		 synchronized (entry.getValue().weixinBUnReceive) {
				    			 entry.getValue().weixinBUnReceive.clear();
				    		 }
				    		 synchronized (entry.getValue().weixinCUnReceive) {
				    			 entry.getValue().weixinCUnReceive.clear();
				    		 }
				    		 MailQueueRuntime.getInstance().clearMailBuffer(entry.getValue());
				    		 MailQueueRuntime.getInstance().clearWeixinBuffer(entry.getValue());
				    		 MailQueueRuntime.getInstance().clearWebchatBuffer(entry.getValue());
				    	 }else{
				    		 synchronized (entry.getValue().mailAUnReceive) {
				    			 if(entry.getValue().mailAUnReceive.containsKey(user.getId()))
				    				 entry.getValue().mailAUnReceive.remove(user.getId());
				    		 }
				    		 synchronized (entry.getValue().mailBUnReceive) {
				    			 if(entry.getValue().mailBUnReceive.containsKey(user.getId()))
				    				 entry.getValue().mailBUnReceive.remove(user.getId());
				    		 }
				    		 synchronized (entry.getValue().mailCUnReceive) {
				    			 if(entry.getValue().mailCUnReceive.containsKey(user.getId()))
				    				 entry.getValue().mailCUnReceive.remove(user.getId());
				    		 }
				    		 synchronized (entry.getValue().weixinAUnReceive) {
				    			 if(entry.getValue().weixinAUnReceive.containsKey(user.getId()))
				    				 entry.getValue().weixinAUnReceive.remove(user.getId());
				    		 }
				    		 synchronized (entry.getValue().weixinBUnReceive) {
				    			 if(entry.getValue().weixinBUnReceive.containsKey(user.getId()))
				    				 entry.getValue().weixinBUnReceive.remove(user.getId());
				    		 }
				    		 synchronized (entry.getValue().weixinCUnReceive) {
				    			 if(entry.getValue().weixinCUnReceive.containsKey(user.getId()))
				    				 entry.getValue().weixinCUnReceive.remove(user.getId());
				    		 }   		 
				    	 }
				     }
				}
			}
			if(user.getMailDispatcherTimerTask() != null){
				user.getMailDispatcherTimerTask().cancel();
			}
			if(user.getWeixinSessionFromList().size() > 0){
				for(int i=0 ;i<user.getWeixinSessionFromList().size() ;i++){
					MailQueueRuntime.getInstance().weixinSessionMap.remove(user.getWeixinSessionFromList().get(i));					
				}
			}
			user.getWeixinSessionFromList().clear();
			if(user.getWebchatSessionFromList().size() > 0){
				for(int i=0 ;i<user.getWebchatSessionFromList().size() ;i++){
					MailQueueRuntime.getInstance().webchatSessionMap.remove(user.getWebchatSessionFromList().get(i));					
				}
			}
			user.getWebchatSessionFromList().clear();
		}catch (Exception e) {
			log.log(Level.WARNING, "MailHandler userLogoff has Exception",e);
		}
	}

	@Override
	public void userBusy(User user) {
		try{
			C5Account a = RuntimeData.getInstance().getAccount(user.getPbx(), user.getAccount());
			if(a.getMailQueues() != null && a.getMailQueues().size()>0){
				for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    
				     if(entry.getValue().getMembersMap().containsKey(user.getId())){
				    	 entry.getValue().removeIdelMember(user.getId());
				     }
				}
				
			}
		}catch (Exception e) {
			log.log(Level.WARNING, "",e);
		}	
	}

	@Override
	public void userUnbusy(User user) {
		try{
			C5Account a = RuntimeData.getInstance().getAccount(user.getPbx(), user.getAccount());
			if(a.getMailQueues() != null && a.getMailQueues().size()>0){
				for(Map.Entry<String, MailQueue> entry:a.getMailQueues().entrySet()){    
				     if(entry.getValue().getMembersMap().containsKey(user.getId())){
				    	 entry.getValue().addIdelMember(user.getId(), entry.getValue().getMembersMap().get(user.getId()));
			    		 if(entry.getValue().getMailBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startMailDispatcherThread(entry.getValue());
			    		 }
			    		 if(entry.getValue().getWeixinBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startWeixinDispatcherThread(entry.getValue());
			    		 }
			    		 if(entry.getValue().getWebchatBuffer().size() >0){
			    			 MailQueueRuntime.getInstance().startWebchatDispatcherThread(entry.getValue());
			    		 }
				     }
				}
			}
		}catch (Exception e) {
			log.log(Level.WARNING, "",e);
		}
	}

	@Override
	public void userSignIn(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userSignOut(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userStatus(User event) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userCallsUpdate(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void newEvent(C5Event event) {
		// TODO Auto-generated method stub
		
	}
}
