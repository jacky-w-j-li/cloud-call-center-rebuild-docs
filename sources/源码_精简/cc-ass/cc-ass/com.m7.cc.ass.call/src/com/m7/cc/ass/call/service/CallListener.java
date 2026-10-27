package com.m7.cc.ass.call.service;

import java.util.Hashtable;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5QueueEntry;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class CallListener {
	
	public static CallListener instance;
	
	private static Logger log = Logger.getLogger(CallListener.class.getName());
	
	private Hashtable<String, Vector<ChannelListener>> channelListeners = 
		new Hashtable<String, Vector<ChannelListener>>();
	
	private Hashtable<String, Vector<PeerListener>> peerListeners = 
		new Hashtable<String, Vector<PeerListener>>();
	
	private Hashtable<String, Vector<QueueListener>> queueListeners = 
		new Hashtable<String, Vector<QueueListener>>();
	
	private Hashtable<String, Vector<TrunkListener>> trunkListeners = 
		new Hashtable<String, Vector<TrunkListener>>();
	
	private Hashtable<String, Vector<CallReportListener>> callReportListeners = 
		new Hashtable<String, Vector<CallReportListener>>();
	
	private Hashtable<String, Vector<UserListener>> userListeners = 
		new Hashtable<String, Vector<UserListener>>();

	private Hashtable<String, Vector<MeetmeListener>> meetmeListeners = 
		new Hashtable<String, Vector<MeetmeListener>>();
	
	private Hashtable<String, Vector<OriginateResponseListener>> originateListeners = 
		new Hashtable<String, Vector<OriginateResponseListener>>();
	
	private Hashtable<String, Vector<ConferenceListener>> conferenceListeners = 
		new Hashtable<String, Vector<ConferenceListener>>();

	private Hashtable<String, Vector<BatchDialoutListener>> batchDialoutListeners = 
			new Hashtable<String, Vector<BatchDialoutListener>>();
	
	private CallListener(){
		instance = this;
	}
	
	public static CallListener getInstance(){
		if (instance == null)
			new CallListener();
		return instance;
	}
	
	public void addChannelListener(String account, ChannelListener listener){
		synchronized (channelListeners) {
			Vector<ChannelListener> listeners = channelListeners.get(account);
			if(listeners == null){
				listeners = new Vector<ChannelListener>();
				channelListeners.put(account, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeChannelListener(String account, ChannelListener listener){
		synchronized (channelListeners) {
			Vector<ChannelListener> listeners = channelListeners.get(account);
			if(listeners == null){
				listeners = new Vector<ChannelListener>();
				channelListeners.put(account, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllChannelListeners(){
		synchronized (channelListeners) {
			channelListeners.clear();
		}
	}
	
	public void addPeerListener(String exten, PeerListener listener){
		synchronized (peerListeners) {
			Vector<PeerListener> listeners = peerListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<PeerListener>();
				peerListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removePeerListener(String exten, PeerListener listener){
		synchronized (peerListeners) {
			Vector<PeerListener> listeners = peerListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<PeerListener>();
				peerListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllPeerListeners(){
		synchronized (peerListeners) {
			peerListeners.clear();
		}
	}
	
	public void addUserListener(String exten, UserListener listener){
		synchronized (userListeners) {
			Vector<UserListener> listeners = userListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<UserListener>();
				userListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeUserListener(String exten, UserListener listener){
		synchronized (userListeners) {
			Vector<UserListener> listeners = userListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<UserListener>();
				userListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllUserListeners(){
		synchronized (userListeners) {
			userListeners.clear();
		}
	}
	
	public void addMeetmeListener(String exten, MeetmeListener listener){
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> listeners = meetmeListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<MeetmeListener>();
				meetmeListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeMeetmeListener(String exten, MeetmeListener listener){
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> listeners = meetmeListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<MeetmeListener>();
				meetmeListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllMeetmeListeners(){
		synchronized (meetmeListeners) {
			meetmeListeners.clear();
		}
	}
	
	public void addOriginateListener(String exten, OriginateResponseListener listener){
		synchronized (originateListeners) {
			Vector<OriginateResponseListener> listeners = originateListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<OriginateResponseListener>();
				originateListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeOriginateListener(String exten, OriginateResponseListener listener){
		synchronized (originateListeners) {
			Vector<OriginateResponseListener> listeners = originateListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<OriginateResponseListener>();
				originateListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeOriginateListeners(){
		synchronized (originateListeners) {
			originateListeners.clear();
		}
	}
	
	public void addBatchDialoutListener(String exten,
			BatchDialoutListener listener) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> listeners = batchDialoutListeners
					.get(exten);
			if (listeners == null) {
				listeners = new Vector<BatchDialoutListener>();
				batchDialoutListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}

	public void removeBatchDialoutListener(String exten,
			BatchDialoutListener listener) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> listeners = batchDialoutListeners
					.get(exten);
			if (listeners == null) {
				listeners = new Vector<BatchDialoutListener>();
				batchDialoutListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}

	public void removeAllBatchDialoutListeners() {
		synchronized (batchDialoutListeners) {
			batchDialoutListeners.clear();
		}
	}
	
	public void addQueueListener(String exten, QueueListener listener){
		synchronized (queueListeners) {
			Vector<QueueListener> listeners = queueListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<QueueListener>();
				queueListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeQueueListenerr(String exten, QueueListener listener){
		synchronized (queueListeners) {
			Vector<QueueListener> listeners = queueListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<QueueListener>();
				queueListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllQueueListeners(){
		synchronized (queueListeners) {
			queueListeners.clear();
		}
	}
	
	public void addConferenceListener(String exten, ConferenceListener listener) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> listeners = conferenceListeners
					.get(exten);
			if (listeners == null) {
				listeners = new Vector<ConferenceListener>();
				conferenceListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}

	public void removeConferenceListener(String exten,
			ConferenceListener listener) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> listeners = conferenceListeners
					.get(exten);
			if (listeners == null) {
				listeners = new Vector<ConferenceListener>();
				conferenceListeners.put(exten, listeners);
			}
			listeners.remove(exten);
		}
	}

	public void removeAllConferenceListener() {
		synchronized (conferenceListeners) {
			conferenceListeners.clear();
		}
	}
	
	public void addCallReportListener(String exten, CallReportListener listener){
		synchronized (callReportListeners) {
			Vector<CallReportListener> listeners = callReportListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<CallReportListener>();
				callReportListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeCallReportListener(String exten, CallReportListener listener){
		synchronized (callReportListeners) {
			Vector<CallReportListener> listeners = callReportListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<CallReportListener>();
				callReportListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllCallReportListeners(){
		synchronized (callReportListeners) {
			callReportListeners.clear();
		}
	}
	
	public void addTrunkListener(String exten, TrunkListener listener){
		synchronized (trunkListeners) {
			Vector<TrunkListener> listeners = trunkListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<TrunkListener>();
				trunkListeners.put(exten, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeTrunkListener(String exten, TrunkListener listener){
		synchronized (trunkListeners) {
			Vector<TrunkListener> listeners = trunkListeners.get(exten);
			if(listeners == null){
				listeners = new Vector<TrunkListener>();
				trunkListeners.put(exten, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllTrunkListeners(){
		synchronized (trunkListeners) {
			trunkListeners.clear();
		}
	}
	
	public void queueMemberAdded(String exten, C5QueueMember event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueMemberAdded(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberAdded(event);
				}
				
				pbxls = queueListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberAdded(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			
		}
	}
	
	public void queueMemberRemoved(String exten, C5QueueMember event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueMemberRemoved(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberRemoved(event);
				} 
				pbxls = queueListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberRemoved(event);
				} 
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueMemberPaused(String exten, C5QueueMember event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueMemberPaused(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberPaused(event);
				}
				pbxls = queueListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueMemberPaused(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueEntryJoin(String exten, C5QueueEntry event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueJoin(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueJoin(event);
				}
				pbxls = queueListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueJoin(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueEntryLeave(String exten, C5QueueEntry event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueLeave(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueLeave(event);
				}
				pbxls = queueListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueLeave(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueCallerAbandon(String exten, C5Event event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueCallerAbandon(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueCallerAbandon(event);
				}
				
				pbxls = queueListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueCallerAbandon(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueAgentCalled(String exten, C5Event event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueAgentCalled(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueAgentCalled(event);
				} 
				pbxls = queueListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueAgentCalled(event);
				} 
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueConnect(String exten, C5Event event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueConnect(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueConnect(event);
				} 
				pbxls = queueListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueConnect(event);
				} 
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void queueComplete(String exten, C5Event event){
		synchronized (queueListeners) {
			Vector<QueueListener> ls = queueListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).queueComplete(event);
			}
			try{
				Vector<QueueListener> pbxls = queueListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueComplete(event);
				} 
				pbxls = queueListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).queueComplete(event);
				} 
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void meetmeJoin(String exten, C5Event event) {
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> ls = meetmeListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).meetmeJoin(event);
			}
			try{
				Vector<MeetmeListener> pbxls = meetmeListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeJoin(event);
				}
				
				pbxls = meetmeListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeJoin(event);
				}
				
				pbxls = meetmeListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeJoin(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void meetmeLeave(String exten, C5Event event) {
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> ls = meetmeListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).meetmeLeave(event);
			}
			try{
				Vector<MeetmeListener> pbxls = meetmeListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeLeave(event);
				}
				
				pbxls = meetmeListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeLeave(event);
				}
				
				pbxls = meetmeListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeLeave(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void meetmeTalking(String exten, C5Event event) {
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> ls = meetmeListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).meetmeTalking(event);
			}
			try{
				Vector<MeetmeListener> pbxls = meetmeListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeTalking(event);
				}
				
				pbxls = meetmeListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeTalking(event);
				}
				
				pbxls = meetmeListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeTalking(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void meetmeStopTalking(String exten, C5Event event) {
		synchronized (meetmeListeners) {
			Vector<MeetmeListener> ls = meetmeListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).meetmeStopTalking(event);
			}
			try{
				Vector<MeetmeListener> pbxls = meetmeListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeStopTalking(event);
				}
				
				pbxls = meetmeListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeStopTalking(event);
				}
				
				pbxls = meetmeListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).meetmeStopTalking(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void originateResponse(String exten, C5Event event) {
		synchronized (originateListeners) {
			Vector<OriginateResponseListener> ls = originateListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).OriginateResponse(event);
			}
			try{
				Vector<OriginateResponseListener> pbxls = originateListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).OriginateResponse(event);
				}
				
				if (event.getParameterValue(Fields.Account) != null) {
					pbxls = originateListeners.get(event
							.getParameterValue(Fields.Account));
					if (pbxls != null) {
						for (int i = 0; i < pbxls.size(); i++)
							pbxls.get(i).OriginateResponse(event);
					}
				}
				
				pbxls = originateListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).OriginateResponse(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userBusy(String exten, User event){
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userBusy(event);
			}
			try{
				Vector<UserListener> accountls = userListeners.get(event.getAccount());
				if(accountls != null){
					for(int i=0;i<accountls.size();i++)
						accountls.get(i).userBusy(event);
				}
				
				accountls = userListeners.get(event.getPbx());
				if(accountls != null){
					for(int i=0;i<accountls.size();i++)
						accountls.get(i).userBusy(event);
				}
				
				Vector<UserListener> allls = userListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).userBusy(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userUnBusy(String exten, User event){
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userUnbusy(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userUnbusy(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userUnbusy(event);
				}
				Vector<UserListener> allls = userListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).userUnbusy(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userLogin(String user, User event) {
		synchronized (userListeners) {
			try{
				Vector<UserListener> ls = userListeners.get(user);
				if(ls != null){
					for(int i=0;i<ls.size();i++)
						ls.get(i).userLogin(event);
				}
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userLogin(event);
				}
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userLogin(event);
				}
				Vector<UserListener> allls = userListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).userLogin(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userLogoff(String exten, User event) {
		synchronized (userListeners) {
			try{
				Vector<UserListener> ls = userListeners.get(exten);
				if(ls != null){
					for(int i=0;i<ls.size();i++)
						ls.get(i).userLogoff(event);
				}
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userLogoff(event);
				}
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userLogoff(event);
				}
				Vector<UserListener> allls = userListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).userLogoff(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userSignIn(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userSignIn(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userSignIn(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userSignIn(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userSignOut(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userSignOut(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userSignOut(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userSignOut(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userUpdate(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userStatus(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userStatus(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userStatus(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userAdded(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userAdded(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userAdded(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userAdded(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userRemoved(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userRemoved(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userRemoved(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userRemoved(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void userCallsUpdate(String exten, User event) {
		synchronized (userListeners) {
			Vector<UserListener> ls = userListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).userCallsUpdate(event);
			}
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getAccount());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userCallsUpdate(event);
				}
				
				pbxls = userListeners.get(event.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).userCallsUpdate(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void newEvent(C5Event event) {
		synchronized (userListeners) {
			try{
				Vector<UserListener> pbxls = userListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).newEvent(event);
				}
				
				pbxls = userListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).newEvent(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void peerRegister(String exten, C5Event event) {
		synchronized (peerListeners) {
			Vector<PeerListener> ls = peerListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).phoneRegister(event);
			}
			try{
				Vector<PeerListener> pbxls = peerListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneRegister(event);
				}
				pbxls = peerListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneRegister(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void peerUnregister(String exten, C5Event event) {
		synchronized (peerListeners) {
			Vector<PeerListener> ls = peerListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).phoneUnregister(event);
			}
			try{
				Vector<PeerListener> pbxls = peerListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneUnregister(event);
				}
				
				pbxls = peerListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneUnregister(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void peerUpdate(String exten, C5Event event) {
		synchronized (peerListeners) {
			Vector<PeerListener> ls = peerListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).phoneUpdate(event);
			}
			try{
				Vector<PeerListener> pbxls = peerListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneUpdate(event);
				}
				
				pbxls = peerListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).phoneUpdate(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void peerRemoved(String exten, C5Event event) {
		synchronized (peerListeners) {
			Vector<PeerListener> ls = peerListeners.get(exten);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).SipRemoved(event);
			}
			try{
				Vector<PeerListener> pbxls = peerListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).SipRemoved(event);
				}
				pbxls = peerListeners.get(event.getParameterValue(Fields.Account));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).SipRemoved(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void channelStatusChanged(C5Channel channel) {
 
		synchronized (channelListeners) {
			try{
				Vector<ChannelListener> pbxls = channelListeners.get(channel.getPbx());
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).channelStatusChanged(channel);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			try{
				Vector<ChannelListener> allls = channelListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).channelStatusChanged(channel);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			
			Vector<ChannelListener> ls = channelListeners.get(channel.getAccount());
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).channelStatusChanged(channel);
			}
		}
	}
	
	public void channelNewExten(String account, C5Event event) {
		synchronized (channelListeners) {
			try{
				Vector<ChannelListener> pbxls = channelListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).newExten(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			try{
				Vector<ChannelListener> pbxls = channelListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).newExten(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			if(account != null){
				Vector<ChannelListener> ls = channelListeners.get(account);
				if(ls != null){
					for(int i=0;i<ls.size();i++)
						ls.get(i).newExten(event);
				}
			}
		}

	}
	
	public void serviceNoState(String account, C5Event event) {
		synchronized (trunkListeners) {
			try{
				Vector<TrunkListener> pbxls = trunkListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).trunkStatusChanged(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			Vector<TrunkListener> ls = trunkListeners.get(account);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).trunkStatusChanged(event);
			}
		}
	}
	
	public void callReportUpdate(String account, C5Event event) {
		synchronized (callReportListeners) {
			Vector<CallReportListener> ls = callReportListeners.get(account);
			if(ls != null){
				for(int i=0;i<ls.size();i++)
					ls.get(i).callReportUpdate(event);
			}
			
			try{
				Vector<CallReportListener> pbxls = callReportListeners.get(event.getParameterValue(Fields.PBX));
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).callReportUpdate(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void conferenceJoin(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceJoin(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceJoin(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceJoin(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public void conferenceLeave(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceLeave(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceLeave(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceLeave(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public void conferenceTalking(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceTalking(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceTalking(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceTalking(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public void conferenceStopTalking(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceStopTalking(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceStopTalking(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceStopTalking(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void conferenceMute(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceMute(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceMute(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceMute(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void conferenceUnmute(String exten, C5Event event) {
		synchronized (conferenceListeners) {
			Vector<ConferenceListener> ls = conferenceListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).conferenceUnmute(event);
			}
			try {
				ls = conferenceListeners.get(event
						.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceUnmute(event);
				}

				ls = conferenceListeners.get(event
						.getParameterValue(Fields.Account));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).conferenceUnmute(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void batchDialoutDialing(String exten, C5Event event) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> ls = batchDialoutListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).batchDialoutDialing(event);
			}
		}
	}

	public void batchDialoutDialed(String exten, C5Event event) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> ls = batchDialoutListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).batchDialoutDialed(event);
			}
			try {
				ls = batchDialoutListeners.get(event.getParameterValue(Fields.PBX));
				if (ls != null) {
					for (int i = 0; i < ls.size(); i++)
						ls.get(i).batchDialoutDialed(event);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	public void batchDialoutFinish(String exten, C5Event event) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> ls = batchDialoutListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).batchDialoutFinish(event);
			}
		}
	}
	
	public void batchDialoutError(String exten, C5Event event) {
		synchronized (batchDialoutListeners) {
			Vector<BatchDialoutListener> ls = batchDialoutListeners.get(exten);
			if (ls != null) {
				for (int i = 0; i < ls.size(); i++)
					ls.get(i).batchDialoutError(event);
			}
		}
	}
}
