package com.m7.cc.ass.call.event;

import java.io.File;
import java.io.IOException;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.Vector;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.CallProvider;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.C5QueueEntry;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.RoomMember;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.EventListener;
import com.m7.cc.asterisk.ami.ResponseListener;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.asterisk.ami.action.MailboxCount;
import com.m7.cc.asterisk.ami.action.Monitor;
import com.m7.cc.asterisk.ami.action.PlayDTMF;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.asterisk.ami.action.QueueStatus;
import com.m7.cc.asterisk.ami.action.SIPPeers;
import com.m7.cc.asterisk.ami.action.SIPShowPeer;
import com.m7.cc.asterisk.ami.action.StopMonitor;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

/**
 * The status cache keep watching all extensions, pbx.getQueues() and park
 * loots. And cache them status in memory.
 * 
 * @author Caif
 * @version 1.0
 */
public class AstEventHandler implements EventListener, ResponseListener,
		Runnable {
	private final static Logger logger = Logger.getLogger(AstEventHandler.class
			.getName());
	private String id;
	private C5Pbx pbx;

	
	private Vector<AsteriskEvent> unlinkEvents = new Vector<AsteriskEvent>();

	private IceQueue eventQueue;

	private NewextenHandler newextenHandler;

	private boolean keepRunning = false;
	private boolean waitForReload = false;
	private Hashtable<String, String> tempChannel = new Hashtable<String, String>();
	private long handlerStartTime;
	private ExecutorService excutor;
	/**
	 * Create an AsteriskStatusCache
	 * 
	 * @param target
	 *            the AsteriskServer to monitor
	 */
	public AstEventHandler(String id) {
		this.id = id;
		pbx = RuntimeData.getInstance().getPbxViaId(id);

		eventQueue = new IceQueue();
		newextenHandler = new NewextenHandler(this);
		
		keepRunning = true;
		excutor = Executors.newCachedThreadPool();
		Thread adThread = new Thread(this, "Status Cacher[" + id + "]");
		adThread.setDaemon(true);
		adThread.start();
	}

	public String getId() {
		return id;
	}

	public void processEvent(AsteriskEvent event) {
		// logger.fine("process event: \r\n"+event);
		// We don't want the event dispatcher thread to wait, so i've used
		// concurrent
		// access queue which should allow us to add elements without waiting
		// for
		// a synchronous access
		synchronized (eventQueue) {
			eventQueue.add(event);
			eventQueue.notifyAll();
		}
	}

	public void run() {
		// this thread will proccess events off of the event stack
		while (keepRunning) {
			try {
				AsteriskEvent event = null;
				synchronized (eventQueue) {
					if (eventQueue.isEmpty()) {
						eventQueue.wait();
					} else {
						try {
							event = (AsteriskEvent) eventQueue.remove();
						} catch (Exception e) {
							logger
									.log(Level.WARNING, "process event failed",
											e);
						}
					}
				}
				if (event != null)
					filterEvent(event);
			} catch (Exception e) {
				logger.log(Level.WARNING, "", e);
			}
		}
	}

	private void filterEvent(AsteriskEvent event) {
		if (event.getEventName() == null) {
			return;
		}

		/**
		 * Every unlink event will be cached before sending to app. When get an
		 * unlink event: 1. If it's been cached, just update it. 2. or
		 * cache it.
		 */
		if (event.getEventName().equalsIgnoreCase(AMIField.UNLINK)) {
			String uniqueid1 = event.getValue(AMIField.UNIQUEID1);

			boolean isWaiting = false;
			for (int i = 0; i < unlinkEvents.size(); i++) {
				AsteriskEvent wEvent = unlinkEvents.get(i);
				String c1 = wEvent.getValue(AMIField.UNIQUEID1);

				if (uniqueid1.equals(c1)) {
					unlinkEvents.remove(i);
					unlinkEvents.add(i, event);
					isWaiting = true;
					break;
				}
			}

			if (!isWaiting) {
				unlinkEvents.add(event);
			}
		}
		/**
		 * When get link event: 1. If cached, omit this event. 2. If not cached,
		 * send it to app.
		 */
		else if (event.getEventName().equalsIgnoreCase(AMIField.LINK)) {
			String uniqueid1 = event.getValue(AMIField.UNIQUEID1);
			boolean isWaiting = false;
			for (int i = 0; i < unlinkEvents.size(); i++) {
				AsteriskEvent wEvent = unlinkEvents.get(i);
				String c1 = wEvent.getValue(AMIField.UNIQUEID1);

				if (uniqueid1.equals(c1)) {
					isWaiting = true;
					unlinkEvents.remove(i);
					break;
				}
			}
			if (!isWaiting) {
				_processEvent(event);
			}
		}
		/**
		 * For other events: 1. Channel events: 1. If is cached, remove this
		 * unlink event and send it to app 2. 2. All events will be sent to app.
		 */
		else {
			if (event.getParameters().containsKey(AMIField.UNIQUEID)
					|| event.getParameters().containsKey("UniqueID")) {
				boolean isIVRKeyTag = false;
				if(event.getParameters().containsKey(Fields.Context)) {
					if(event.getParameters().get(Fields.Context).equals("macro-IVR_KEY_TAG")){
						isIVRKeyTag = true;
					}
				}
				if(!isIVRKeyTag){
					String uniqueid = null;
					if (event.getParameters().containsKey(AMIField.UNIQUEID))
						uniqueid = event.getValue(AMIField.UNIQUEID);
					else
						uniqueid = event.getValue("UniqueID");
					boolean isWaiting = false;
					AsteriskEvent wEvent1 = null;
					for (int i = 0; i < unlinkEvents.size(); i++) {
						AsteriskEvent wEvent = unlinkEvents.get(i);
						String c1 = wEvent.getValue(AMIField.UNIQUEID1);
						String c2 = wEvent.getValue(AMIField.UNIQUEID2);

						if (uniqueid.equals(c1) || uniqueid.equals(c2)) {
							isWaiting = true;
							wEvent1 = wEvent;
							break;
						}
					}
					if (isWaiting) {
						unlinkEvents.remove(wEvent1);
						_processEvent(wEvent1);
					}
				}
			}
			_processEvent(event);
		}
	}

	/**
	 * This is the main event loop that determines what action to take based on
	 * what events are seen from the asterisk server
	 * 
	 * @param event
	 *            asterisk server event
	 */
	private void _processEvent(AsteriskEvent event) {
		String eventName = event.getEventName();
		try {
			if (eventName.equalsIgnoreCase(AMIField.SHUTDOWN)) {
				logger.warning("Asterisk is going to shutdown.");
				connectionClosed();
				return;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, event.toString(), e);
			e.printStackTrace();
			return;
		}

		if (eventName.equalsIgnoreCase(AMIField.RELOAD)) {
			processReload();
		}
		// status of peer
		else if (event.getEventName().equalsIgnoreCase(AMIField.PEER_STATUS)) {
			processPeerStatus(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.PEER_ENTRY)) {
			processPeerEntry(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.PEERLIST_COMPLETE)) {
			processPeerlistComplete(event);
		}
		// status of voice mail
		else if (event.getEventName()
				.equalsIgnoreCase(AMIField.MESSAGE_WAITING)) {
			processMessageWaiting(event);
		}
		// status of channel
		else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_STATUS)) {
			processNewstate(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_CHANNEL)) {
			processNewChannel(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_CALLERID)) {
			processNewCallerid(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_EXTEN)) {
			processNewExten(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.DIAL)) {
			processDial(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.HANGUP)) {
			processHangup(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.LINK)) {
			processLink(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.UNLINK)) {
			processUnlink(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.STATUS)) {
			processStatus(event);
		}
		// process parked call
		else if (event.getEventName().equalsIgnoreCase(AMIField.PARKED_CALL)) {
			processParkedCall(event);
		} else if (event.getEventName()
				.equalsIgnoreCase(AMIField.UNPARKED_CALL)) {
			processUnParkedCall(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.PARKED_CALL_TIEMOUT)) {
			processParkedCallTimeout(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.PARKED_CALL_GIVE_UP)) {
			processParkedCallGiveUp(event);
		}

		// queue status event
		else if (event.getEventName().equalsIgnoreCase(AMIField.QUEUE_MEMBER)) {
			processQueueMember(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.QUEUE_ENTRY)) {
			processQueueEntry(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.QUEUE_PARAMS)) {
			processQueueParams(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_STATUS_COMPLETE)) {
			processQueueStatusComplete(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_MEMBER_ADDED)) {
			processQueueMemberAdded(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_MEMBER_REMOVED)) {
			processQueueMemberRemoved(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_MEMBER_PAUSED)) {
			processQueueMemberPaused(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.JOIN)) {
			processQueueJoin(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.LEAVE)) {
			processQueueLeave(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_CALLER_ABANDON)) {
			processQueueCallerAbandon(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.AgentCalled)) {
			processAgentCalled(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.AgentConnect)) {
			processAgentConnect(event);
		} else if (event.getEventName()
				.equalsIgnoreCase(AMIField.AgentComplete)) {
			processAgentComplete(event);
		} else if (event.getEventName().equalsIgnoreCase(
				AMIField.QUEUE_MEMBER_STATUS)) {
			// InvalidMemberHandler.processMemberStatus(event, this.server);
		}
		
		// meetme
		else if (event.getEventName().equalsIgnoreCase(Fields.MeetmeJoin)) {
			processMeetmeJoin(event);
		} else if (event.getEventName().equalsIgnoreCase(Fields.MeetmeLeave)) {
			processMeetmeLeave(event);
		} else if (event.getEventName().equalsIgnoreCase(Fields.MeetmeStopTalking)) {
			processMeetmeStopTalking(event);
		} else if (event.getEventName().equalsIgnoreCase(Fields.MeetmeTalking)) {
			processMeetmeTalking(event);
		} else if (event.getEventName().equalsIgnoreCase(Fields.MeetmeMute)) {
			processMeetmeMute(event);
		} 
		
		else if (event.getEventName().equalsIgnoreCase(Fields.OriginateResponse)) {
			processOriginateResponse(event);
		} 
		
	}
	/**
	 * Event: MeetmeJoin
 	 * Privilege: call,all
 	 * Timestamp: 1279866262.720710
 	 * Channel: SIP/211.151.35.110:5072-008135d0
 	 * Uniqueid: ass-03-140-1279866262.1051
 	 * Meetme: 100005
 	 * Usernum: 2

	 */
	private void processMeetmeJoin(AsteriskEvent event) {
		String room = event.getValue(Fields.Meetme);
		if (room.length() == 18 || room.startsWith("N")) {
			String accountId = room.substring(0, 13);
			String channelName = event.getValue(Fields.Channel);
			String usernum = event.getValue(Fields.Usernum);
			String peerName = getExtenFromChannelName(channelName);
			String uniqueid = event.getValue(Fields.Uniqueid);
			C5Account account = pbx.getAccount(accountId);
			C5Channel channel = pbx.getChannel(channelName);
			if (channel != null) {
				channel.addVar("usernum", usernum);
				channel.addVar("room", room);
			}
			if (account != null) {
				String roomConfId = room.substring(13);
				Room currentRoom = account.getRooms().get(roomConfId);
				if (currentRoom != null) {
					RoomMember member = new RoomMember(usernum);
					currentRoom.addRoomMember(member);
					member.setUniqueid(uniqueid);
					member.setChannel(channelName);
					SipPeer peer = pbx.getPeer(peerName);
					if (peer != null) {
						User user = peer.getUser();
						if (user != null) {
							member.setUser(user.getId());
							member.setExten(user.getExten());
						} else {
							if (channel != null) {
								member.setCallIdNum(channel.getCallerIDNum());
							}
						}
					} else {
						if (channel != null) {
							member.setCallIdNum(channel.getCallerIDNum());
						}
					}
					C5Event c5event = new C5Event(Fields.ConferenceJoin);
					c5event.addParameter(Fields.PBX, pbx.getPbx());
					c5event.addParameter(Fields.Account, accountId);
					c5event.addParameter(Fields.Exten, room.substring(13));
					c5event.addParameter(Fields.Usernum, usernum);
					c5event.addParameter(Fields.Member, member.getStateEvent().getParameters());
					CallListener.getInstance()
							.conferenceJoin(room, c5event);
				}
			} else {
				logger.log(Level.WARNING, "Account not found :" + accountId);
			}
		} else {
			Call call = CallProvider.getInstance().getCallViaRoomnum(room);
			// we only catch meetme event which is in our call cacher 
			if(call != null){
				C5Event c5event = new C5Event(event.getEventName());
				c5event.setValues(event.getParameters());
				c5event.addParameter(Fields.PBX, pbx.getPbx());
				call.processMeetmeJoin(c5event);				
			}
			//ghw 
			String channelName = event.getValue(AMIField.CHANNEL);
			channelName = getFormattedChannelName(channelName);
			if (!pbx.hasChannel(channelName)) {
				logger.warning("Get channel event which is not cached: \r\n" + event.toString());
				return;
			}
			C5Channel channel = pbx.getChannel(channelName);
			if(channel.getVar("Meet-MaxCallTime") != null){
				if(channel.getMeetMaxCallTimerTask() != null){
					logger.warning("------------cgcgcg Meet-MaxCallTime cached: \r\n" + channel.getMaxCallTime());
					RuntimeData.webcallTimer.schedule(channel.getMeetMaxCallTimerTask(), channel.getMaxCallTime());
				}
			}
			if(channel.getVar("Meet-ChatingIvrPrompt") != null){
				logger.warning("------------cgcgcg Meet-ChatingIvrPrompt cached: \r\n" + channel.getVar("Meet-ChatingIvrPrompt"));
				//chatingIvrPrompt
				if(channel.getWebCallChatingIvrPromptVoMap() != null && channel.getWebCallChatingIvrPromptVoMap().size() > 0){
					for(Map.Entry<String, TimerTask> entry:channel.getWebCallChatingIvrPromptVoMap().entrySet()){
						logger.warning("------------cgcgcg Meet-ChatingIvrPrompt cached: -------\r\n" + Integer.parseInt(entry.getKey())+ ";"+entry.getValue().getClass());
						RuntimeData.webcallTimer.schedule(entry.getValue(), Integer.parseInt(entry.getKey()));
					}
				}
			}
		}
		
	}
	
	/**
	 * Event: MeetmeLeave
 	 * Privilege: call,all
 	 * Timestamp: 1279866329.597465
 	 * Channel: SIP/211.151.35.110:5072-008135d0
 	 * Uniqueid: ass-03-140-1279866312.1055
 	 * Meetme: 100006
 	 * Usernum: 2
 	 * CallerIDnum: 13810177187
 	 * CallerIDname: <unknown>
 	 * Duration: 17
	 * @param event
	 */
	private void processMeetmeLeave(AsteriskEvent event) {
		String room = event.getValue(Fields.Meetme);
		if (room.length() == 18) {
			String accountId = room.substring(0, 13);
			String roomConfId = room.substring(13);
			String usernum = event.getValue(Fields.Usernum);
			C5Account account = pbx.getAccount(accountId);
			if (account != null) {
				Room currentRoom = account.getRooms().get(roomConfId);
				if (currentRoom != null) {
					currentRoom.removeMemberViaUsernum(usernum);
					C5Event c5event = new C5Event(Fields.ConferenceLeave);
					c5event.addParameter(Fields.PBX, pbx.getPbx());
					c5event.addParameter(Fields.Account,
							room.substring(0, 13));
					c5event.addParameter(Fields.Exten, room.substring(13));
					c5event.addParameter(Fields.Usernum, usernum);
					CallListener.getInstance().conferenceLeave(room,
							c5event);
				}
			} else {
				logger.log(Level.WARNING, "Account not found" + accountId);
			}
		} else {
			Call call = CallProvider.getInstance().getCallViaRoomnum(room);
			// we only catch meetme event which is in our call cacher 
			if(call == null)
				return;
			C5Event c5event = new C5Event(event.getEventName());
			c5event.setValues(event.getParameters());
			c5event.addParameter(Fields.PBX, pbx.getPbx());
			call.processMeetmeLeave(c5event);
		}
	}

	/**
	 * Event: MeetmeStopTalking 
	 * Privilege: call,all 
	 * Channel: SIP/200-ABC1 
	 * Uniqueid: 1234567890.1 
	 * Meetme: 400 
	 * Usernum: 2 
	 */
	private void processMeetmeStopTalking(AsteriskEvent event) {
		String room = event.getValue(Fields.Meetme);
		if (room.length() == 18) {
			String accountId = room.substring(0, 13);
			String usernum = event.getValue(Fields.Usernum);
			String channelName = event.getValue(Fields.Channel);
			String peerName = getExtenFromChannelName(channelName);
			String uniqueid = event.getValue(Fields.Uniqueid);
			C5Account account = pbx.getAccount(accountId);
			if(account != null){
				String roomConfId = room.substring(13);
				Room currentRoom = account.getRooms().get(roomConfId);
				if (currentRoom != null) {
					RoomMember member = currentRoom.getMemberViaUsernum(usernum);
					if(member == null){
						member = new RoomMember(usernum);
						currentRoom.addRoomMember(member);
						member.setChannel(channelName);
						member.setUniqueid(uniqueid);
						SipPeer peer = pbx.getPeer(peerName);
						if (peer != null) {
							User user = peer.getUser();
							if (user != null) {
								member.setUser(user.getId());
								member.setExten(user.getExten());
							}
						} else {
							C5Channel channel = pbx.getChannel(channelName);
							if (channel != null) {
								member.setCallIdNum(channel.getCallerIDNum());
							}
						}
					}
				
					C5Event c5event = new C5Event(Fields.ConferenceStopTalking);
					c5event.addParameter(Fields.Member, member.getStateEvent().getParameters());
					c5event.addParameter(Fields.PBX, pbx.getPbx());
					c5event.addParameter(Fields.Account, room.substring(0, 13));
					c5event.addParameter(Fields.Exten, room.substring(13));
					c5event.addParameter(Fields.Usernum, usernum);
					CallListener.getInstance().conferenceStopTalking(room, c5event);
				}
			}else{
				logger.log(Level.WARNING, "Account not found" + accountId);
			}
		} else {
			Call call = CallProvider.getInstance().getCallViaRoomnum(room);
			// we only catch meetme event which is in our call cacher 
			if(call == null)
				return;
			C5Event c5event = new C5Event(event.getEventName());
			c5event.setValues(event.getParameters());
			c5event.addParameter(Fields.PBX, pbx.getPbx());
			call.processMeetmeStopTalking(c5event);
		}
	}
	
	/**
	 * Event: MeetmeTalking
	Privilege: call,all
Timestamp: 1338969131.907518
Channel: SIP/22000801-0fa38b20
Uniqueid: bjpbxtest1-100-1338969131.7
Meetme: Q00000000851210006
Usernum: 1
Status: on
	 */
	private void processMeetmeTalking(AsteriskEvent event) {
		String room = event.getValue(Fields.Meetme);
		if (room.length() == 18) {
			String usernum = event.getValue(Fields.Usernum);
			String channelName = event.getValue(Fields.Channel);
			String peerName = getExtenFromChannelName(channelName);
			String uniqueid = event.getValue(Fields.Uniqueid);
			String accountId = room.substring(0, 13);
			String status = event.getValue(Fields.Status);
			C5Account account = pbx.getAccount(accountId);
			if (account != null) {
				String roomConfId = room.substring(13);
				Room currentRoom = account.getRooms().get(roomConfId);
				if (currentRoom != null) {
					RoomMember member = currentRoom
							.getMemberViaUsernum(usernum);
					if (member == null) {
						member = new RoomMember(usernum);
						currentRoom.addRoomMember(member);
						member.setChannel(channelName);
						member.setUniqueid(uniqueid);
						SipPeer peer = pbx.getPeer(peerName);
						if (peer != null) {
							User user = peer.getUser();
							if (user != null) {
								member.setUser(user.getId());
								member.setExten(user.getExten());
							}
						} else {
							C5Channel channel = pbx.getChannel(channelName);
							if (channel != null) {
								member.setCallIdNum(channel.getCallerIDNum());
							}
						}
					}
					C5Event c5event = new C5Event(Fields.ConferenceTalking);
					c5event.addParameter(Fields.Member, member.getStateEvent().getParameters());
					c5event.addParameter(Fields.PBX, pbx.getPbx());
					c5event.addParameter(Fields.Account, room.substring(0, 13));
					c5event.addParameter(Fields.Exten, room.substring(13));
					c5event.addParameter(Fields.Usernum, usernum);
					c5event.addParameter(Fields.Status, status);
					CallListener.getInstance().conferenceTalking(room, c5event);
				}
			} else {
				logger.log(Level.WARNING, "Account not found" + accountId);
			}
		} else {
			Call call = CallProvider.getInstance().getCallViaRoomnum(room);
			// we only catch meetme event which is in our call cacher 
			if(call == null)
				return;
			C5Event c5event = new C5Event(event.getEventName());
			c5event.setValues(event.getParameters());
			c5event.addParameter(Fields.PBX, pbx.getPbx());
			call.processMeetmeTalking(c5event);
		}
	}

	//TODO
	/**
	 * Event: MeetmeMute
	 * Privilege: call,all
	 * Channel: SIP/linksys2-10211dc0
	 * Uniqueid: 1174008176.3
	 * Meetme: 104
	 * Usernum: 1
	 * Status: on|off
	 */
	private void processMeetmeMute(AsteriskEvent event) {
		String room = event.getValue(Fields.Meetme);
		if (room.length() == 18) {
			String usernum = event.getValue(Fields.Usernum);
			String channelName = event.getValue(Fields.Channel);
			String peerName = getExtenFromChannelName(channelName);
			String uniqueid = event.getValue(Fields.Uniqueid);
			String accountId = room.substring(0, 13);
			C5Account account = pbx.getAccount(accountId);
			if (account != null) {
				String roomConfId = room.substring(13);
				Room currentRoom = account.getRooms().get(roomConfId);
				if (currentRoom != null) {
					RoomMember member = currentRoom
							.getMemberViaUsernum(usernum);
					if (member == null) {
						member = new RoomMember(usernum);
						currentRoom.addRoomMember(member);
						member.setChannel(channelName);
						member.setUniqueid(uniqueid);
						SipPeer peer = pbx.getPeer(peerName);
						if (peer != null) {
							User user = peer.getUser();
							if (user != null) {
								member.setUser(user.getId());
								member.setExten(user.getExten());
							}
						} else {
							C5Channel channel = pbx.getChannel(channelName);
							if (channel != null) {
								member.setCallIdNum(channel.getCallerIDNum());
							}
						}
					}
					C5Event c5event = new C5Event(Fields.ConferenceMute);
					c5event.addParameter(Fields.Member, member.getStateEvent().getParameters());
					c5event.addParameter(Fields.PBX, pbx.getPbx());
					c5event.addParameter(Fields.Account, room.substring(0, 13));
					c5event.addParameter(Fields.Exten, room.substring(13));
					c5event.addParameter(Fields.Usernum, usernum);
					String status = event.getValue(Fields.Status);
					if (status.equals(Fields.On))
						CallListener.getInstance().conferenceMute(room, c5event);
					else if (status.equals(Fields.Off))
						CallListener.getInstance().conferenceUnmute(room, c5event);
				}
			} else {
				logger.log(Level.WARNING, "Account not found" + accountId);
			}
		} else {
			Call call = CallProvider.getInstance().getCallViaRoomnum(room);
			// we only catch meetme event which is in our call cacher 
			if(call == null)
				return;
			C5Event c5event = new C5Event(event.getEventName());
			c5event.setValues(event.getParameters());
			c5event.addParameter(Fields.PBX, pbx.getPbx());
			call.processMeetmeMute(c5event);
		}
	}
	
	/**
	 * Event: OriginateResponse
	 * Privilege: call,all
	 * Timestamp: 1328668031.713113
	 * ActionID: originate6265657272351846768
	 * Response: Success
	 * Channel: SIP/21302735-18aac3c0
	 * Context: Q000000005225
	 * Exten: 9051257703522
	 * Reason: 4
	 * Uniqueid: ass-03-145-1328668031.74740
	 * CallerID: <unknown>
	 * CallerIDNum: <unknown>
	 * CallerIDName: <unknown>
	 * @param event
	 */
	private void processOriginateResponse(AsteriskEvent event) {
		String channelName = event.getValue(Fields.Channel);
//		if(!pbx.hasChannel(channelName)){
//			return;
//		}
		String timestamp = event.getValue(Fields.Timestamp);
		String exten = event.getValue(Fields.Exten);
		String uniqueid = event.getValue(Fields.Uniqueid);
		String actionID = event.getValue(Fields.ActionID);
		String response = event.getValue(Fields.Response);
		String context = event.getValue(Fields.Context);
		String reason = event.getValue(Fields.Reason);
		String callerID = event.getValue(Fields.CallerID);
		String callerIDNum = event.getValue(Fields.CallerIDNum);
		String callerIDName = event.getValue(Fields.CallerIDName);
		String cachedCallerIDNum = pbx.getParameterCache(actionID);
		String account = null;
		if(pbx.hasChannel(channelName)){
			C5Channel channel = pbx.getChannel(channelName);
			if(cachedCallerIDNum != null){
				channel.setCallerIDNum(cachedCallerIDNum);
				callerIDNum = cachedCallerIDNum;
			}
			channel.setActionId(actionID);
			account = channel.getAccount();
		}else{
			// channelName like SIP/Q000000005419191858103397@10.1.1.180:5072:
			if (channelName.indexOf("@") > -1) {
				if (channelName.length() > 21) {
					callerIDNum = channelName.substring(21,
							channelName.indexOf("@"));
				}
			} else {
				int t = channelName.indexOf("-");
				if (t > -1) {
					// channelName like SIP/21300938-0fecbfb0
					callerIDNum = channelName.substring(
							channelName.indexOf("/") + 1, t);
				} else {
					// channelName like SIP/21300938
					callerIDNum = channelName.substring(channelName
							.indexOf("/") + 1);
				}
			}
		}
		C5Event c5event = new C5Event(Fields.OriginateResponse);
		c5event.addParameter(Fields.PBX, pbx.getPbx());
		c5event.addParameter(Fields.Account, account);
		c5event.addParameter(Fields.Timestamp, timestamp);
		c5event.addParameter(Fields.Exten, exten);
		c5event.addParameter(Fields.Channel, channelName);
		c5event.addParameter(Fields.Uniqueid, uniqueid);
		c5event.addParameter(Fields.ActionID, actionID);
		c5event.addParameter(Fields.Response, response);
		c5event.addParameter(Fields.Context, context);
		c5event.addParameter(Fields.Reason, reason);
		c5event.addParameter(Fields.CallerID, callerID);
		c5event.addParameter(Fields.CallerIDNum, callerIDNum);
		c5event.addParameter(Fields.CallerIDName, callerIDName);
		
		CallListener.getInstance().originateResponse(exten, c5event);
		
		String originateOriChannelName = pbx.getOriginateCache(actionID);
		if(originateOriChannelName != null){
			C5Channel originateOriChannel = pbx.getChannel(originateOriChannelName);
			if(originateOriChannel != null && originateOriChannel.getCall() != null){
				c5event.addParameter(Fields.OriginChannel, originateOriChannel);
				originateOriChannel.getCall().handleEvent(c5event);
			}
		}
	}
	
	/**
	 * Event: AgentComplete Privilege: agent,all HoldTime: 0 Uniqueid:
	 * ss-02-001-1245375659.3545177 Queue: 0 Channel: SIP/server15-08791c90
	 * MemberName: SIP/server15 Timestamp: 1245375689.176344 Member:
	 * SIP/server15 Reason: caller TalkTime: 30
	 * 
	 * @param event
	 */
	private void processAgentComplete(AsteriskEvent event) {
		String timestamp = event.getValue(Fields.Timestamp);
		String channel = event.getValue(Fields.Channel);
		String uniqueid = event.getValue(Fields.Uniqueid);
		String holdTime = event.getValue(Fields.HoldTime);
		String talkTime = event.getValue(Fields.TalkTime);
		C5Queue queue = pbx.getQueue(event.getValue(AMIField.QUEUE));
		if (queue != null) {
			C5QueueMember member = queue.getMember(event
					.getValue(AMIField.MEMBER_NAME));
			if (member != null) {
				member.setCallsTaken(member.getCallsTaken() + 1);
				member.setLastCall(event.getValue(AMIField.CHANNEL));
				C5Event c5event = new C5Event(AMIField.AgentComplete);
				c5event.addParameter(Fields.PBX, pbx.getPbx());
				c5event.addParameter(Fields.Account, queue.getAccount());
				c5event.addParameter(Fields.Timestamp, timestamp);
				c5event.addParameter(Fields.Queue, queue.getExten());
				c5event.addParameter(Fields.Agent, member.getExten());
				c5event.addParameter(Fields.Channel, channel);
				c5event.addParameter(Fields.Uniqueid, uniqueid);
				c5event.addParameter(Fields.HoldTime, holdTime);
				c5event.addParameter(Fields.TalkTime, talkTime);
				CallListener.getInstance().queueComplete(queue.getExten(), c5event);
			}
		}
	}

	/**
	 * Event: AgentConnect Privilege: agent,all BridgedChannel:
	 * ss-02-001-1245375659.3545178 Uniqueid: ss-02-001-1245375659.3545177
	 * Queue: 0 Channel: SIP/server15-08791c90 MemberName: SIP/server15
	 * Timestamp: 1245375659.908096 Member: SIP/server15 Holdtime: 0
	 */
	private void processAgentConnect(AsteriskEvent event) {
		String timestamp = event.getValue(Fields.Timestamp);
		String channel = event.getValue(Fields.Channel);
		String uniqueid = event.getValue(Fields.Uniqueid);
		String holdTime = event.getValue(Fields.Holdtime);
		String bridgedChannel = event.getValue(Fields.BridgedChannel);
		C5Queue queue = pbx.getQueue(event.getValue(AMIField.QUEUE));
		if (queue != null) {
			boolean agentExtenPoint = queue.isAgentExtenPoint();
			if (agentExtenPoint == true) {
				PlayDTMF ann = new PlayDTMF(channel, "1",
						Utils.getSynActionID("PlayDTMF"));
				try {
					AMICore.getInstance().getAMIClient(this.id).sendAction(ann);
				} catch (Exception e) {
					logger.log(Level.WARNING,
							"Can not play DTMF when agent connected!", e);
				}
			}
			C5QueueMember member = queue.getMember(event
					.getValue(AMIField.MEMBER_NAME));
			if (member != null) {
				C5Event c5event = new C5Event(AMIField.AgentConnect);
				c5event.addParameter(Fields.PBX, pbx.getPbx());
				c5event.addParameter(Fields.Account, queue.getAccount());
				c5event.addParameter(Fields.Timestamp, timestamp);
				c5event.addParameter(Fields.Queue, queue.getExten());
				c5event.addParameter(Fields.Agent, member.getExten());
				c5event.addParameter(Fields.Channel, channel);
				c5event.addParameter(Fields.Uniqueid, uniqueid);
				c5event.addParameter(Fields.HoldTime, holdTime);
				c5event.addParameter(Fields.LinkedChannel, bridgedChannel);
				CallListener.getInstance().queueConnect(queue.getExten(), c5event);
			}
		}
	}

	/**
	 * Event: AgentCalled Privilege: agent,all Extension: 500 AgentCalled:
	 * SIP/server15 CallerID: 5002 Priority: 4 Timestamp: 1245375659.906280
	 * ChannelCalling: SIP/5002-a87924d0 AgentName: SIP/server15 CallerIDName:
	 * 7koala Context: sipp-test
	 * 
	 * @param event
	 */
	private void processAgentCalled(AsteriskEvent event) {
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		String callerID = event.getValue(AMIField.CALLERID);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		String queueName = event.getValue(Fields.Extension);
		String channelName = event.getValue(AMIField.ChannelCalling);
		channelName = getFormattedChannelName(channelName);
		if (channelName.startsWith("Local")) {
			if (tempChannel.containsKey(channelName)) {
				channelName = tempChannel.get(channelName);
				event.getParameters().put(AMIField.ChannelCalling, channelName);
			} else
				return;
		}

		String agentName = event.getValue(AMIField.AgentName);
		agentName = agentName.substring(4);

		SipPeer peer = pbx.getPeer(agentName);
		if (peer != null) {
			C5Channel channel_destination = pbx.getPeer(agentName)
					.getChannels().get(0);
			if (channel_destination == null) {
				logger.warning("Can not find channel from peer: \r\n"
						+ event.toString());
				return;
			}

			if (!pbx.hasChannel(channelName)) {
				logger.warning("Get channel event which is not cached: \r\n"
						+ event.toString());
				return;
			}
			C5Channel channel_source = cacheChannel(channelName, callerID,
					callerIDName, null);

			channel_destination.setLinked(true);
			channel_destination.setLinkedChannel(channel_source);

			channel_source.setLinked(true);
			channel_source.setLinkedChannel(channel_destination);
			if (channel_source.getAccount() != null)
				channel_destination.setAccount(channel_source.getAccount());
			else if (channel_destination != null) {
				channel_source.setAccount(channel_destination.getAccount());
			} else {
				logger.warning("Account not found for " + channelName);
			}

			if (channel_source.getMonitorFilename() != null)
				channel_destination.setMonitorFilename(channel_source
						.getMonitorFilename());
			else if (channel_destination != null) {
				channel_source.setMonitorFilename(channel_destination
						.getMonitorFilename());
			}

			if (channel_destination.getState().equals(Fields.Down)) {
				channel_destination.setState(Fields.Ringing);
				channel_destination.setRingtime(timestamp);
				if (channel_destination.getLinkedChannel() != null) {
					channel_destination.setChannelType(channel_destination
							.getLinkedChannel().getChannelType());
					channel_destination.setFromCid(channel_destination
							.getLinkedChannel().getFromCid());
					channel_destination.setFromDid(channel_destination
							.getLinkedChannel().getFromDid());
				}
				notifyChannelStatusChanged(channel_destination);
			}
			C5Event c5event = new C5Event(AMIField.AgentCalled);
			c5event.addParameter(Fields.PBX, pbx.getPbx());
			c5event.addParameter(Fields.Account, peer.getAccount());
			c5event.addParameter(Fields.Timestamp, timestamp);
			c5event.addParameter(Fields.Queue, queueName);
			c5event.addParameter(Fields.Agent, agentName);
			c5event.addParameter(Fields.Channel, channelName);
			CallListener.getInstance().queueAgentCalled(queueName, c5event);
		} else {
			logger.warning("Can not find peer for: /r/n"+event.toString());
		}
	}

	private void processReload() {
		// If it is waiting now, just return
		if (waitForReload) {
			logger.info("Already waitting for reload, just return");
			return;
		}

		waitForReload = true;

		Thread t = new Thread("query status after asterisk reload") {
			public void run() {
				try {
					querySIPPeerStatus();
					queryQueueStatus();
				} catch (Exception e) {
					logger.log(Level.WARNING, "", e);
				}
			}
		};
		t.setDaemon(true);
		t.start();
	}

	/**
	 * Event: QueueStatusComplete ActionID: 11223344556677889900
	 */
	private void processQueueStatusComplete(AsteriskEvent event) {
		waitForReload = false;
	}

	/**
	 * Event: PeerlistComplete ListItems: 7 ActionID: 555444333222111
	 */
	private void processPeerlistComplete(AsteriskEvent event) {
	}

	/**
	 * Event: Newexten Privilege: call,all Extension: 2000 Application: Queue
	 * Uniqueid: 1244774639.123 Channel: SIP/6001-09ed0830 Priority: 1 AppData:
	 * 2000 Context: g3si
	 */
	private void processNewExten(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		if (channelName.startsWith("Local")) {
			if (tempChannel.containsKey(channelName)) {
				event.getParameters().put(AMIField.CHANNEL,
						tempChannel.get(channelName));
			} else
				return;
		}
		event.getParameters().put(Fields.Asterisk, id);
		newextenHandler.handleNewexten(event);
	}

	/**
	 * Event: Status Privilege: Call Channel: SIP/3005-087020f0 CallerID: 3005
	 * CallerIDNum: 3005 CallerIDName: softphone-3005 State: Up Context:
	 * macro-dial Extension: s Priority: 10 Seconds: 607867
	 * Link:SIP/3005-08708a28 Uniqueid: 1204622592.0 ActionID:
	 * status9136931504553842172
	 * 
	 * @param event
	 */
	private void processStatus(AsteriskEvent event) {
		// TODO process status here
	}

	/**
	 * Event: Newcallerid Privilege: call,all CallerIDName:<Unknown>
	 * CID-CallingPres:0 (Presentation Allowed, Not Screened)
	 * Channel:SIP/1001-09a42b00 Uniqueid:1201444059.39 CallerID:1001
	 * 
	 * @param event
	 */
	private void processNewCallerid(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		channelName = getFormattedChannelName(channelName);
		if (channelName.startsWith("Local"))
			return;
		if (!pbx.hasChannel(channelName)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}

		String callerID = event.getValue(AMIField.CALLERID);
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		String uniqueid = event.getValue(AMIField.UNIQUEID);

		C5Channel channel = cacheChannel(channelName, callerID, callerIDName,
				uniqueid);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channel.setTimestamp(timestamp);
	}

	/**
	 * Event: Dial Privilege: call,all Source: SIP/3002-087ed130 Destination:
	 * SIP/3001-087b0428 CallerID: 3002 CallerIDName: softphone-3002
	 * SrcUniqueID: 1205820450.562 DestUniqueID: 1205820450.563
	 * 
	 * @param event
	 */
	private void processDial(AsteriskEvent event) {
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		String callerID = event.getValue(AMIField.CALLERID);
		String destination = event.getValue(AMIField.DESTINATION);
		destination = getFormattedChannelName(destination);
		String channelName = event.getValue(AMIField.SOURCE);
		String srcUniqueID = event.getValue(AMIField.SrcUniqueID);
		String destUniqueID = event.getValue(AMIField.DestUniqueID);
		channelName = getFormattedChannelName(channelName);

		/**
		 * when do web call, there will be two temp pbx.getChannels():
		 * Local/xxxxxxxxxxxxxxx,1 Local/xxxxxxxxxxxxxxx,2 The first channel
		 * will call agent instead of the outbound channel, so we need to
		 * replace all Local/xxxxxxxxxxxxxxx,1 to this channel.
		 * 
		 * Event: Dial Privilege: call,all Timestamp: 1251266421.168480 Source:
		 * Local/95000@P000000002450-5ec8,2 Destination: SIP/5000-08f729f0
		 * CallerID: 59242409 CallerIDName: <unknown> SrcUniqueID:
		 * ss-test-003-1251266421.4751 DestUniqueID: ss-test-003-1251266421.4752
		 */
		if (channelName.startsWith("Local") && destination.startsWith("SIP")) {
			if (pbx.hasChannel(destination)) {
				if (pbx.getChannel(destination).getSipPeer() == null) {
					tempChannel.put(channelName.substring(0, channelName
							.length() - 1)
							+ "1", destination);
					return;
				}
			}
		}

		if (!pbx.hasChannel(channelName)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}
		C5Channel channel_source = cacheChannel(channelName, callerID,
				callerIDName, srcUniqueID);
		C5Channel channel_destination = cacheChannel(destination, "", "",
				destUniqueID);

		channel_destination.setLinked(true);
		channel_destination.setLinkedChannel(channel_source);

		channel_source.setLinked(true);
		channel_source.setLinkedChannel(channel_destination);
		if (channel_source.getAccount() != null){
			if(channel_destination.getSipPeer() != null){
				if(channel_destination.getSipPeer().getAccount().equals(channel_source.getAccount())){
					channel_destination.setAccount(channel_source.getAccount());			
				}
			}else{
				channel_destination.setAccount(channel_source.getAccount());				
			}
		}else if (channel_destination != null) {
			channel_source.setAccount(channel_destination.getAccount());
		} else {
			logger.warning("Account not found for " + channelName);
		}

		if (channel_source.getMonitorFilename() != null)
			channel_destination.setMonitorFilename(channel_source
					.getMonitorFilename());
		else if (channel_destination != null) {
			channel_source.setMonitorFilename(channel_destination
					.getMonitorFilename());
		}
		//if 'transfer-Dial',we set destinationChannel to call's thridChannel.
		//add by chenguang 2013-04-11
		C5Call call = channel_source.getCall();
		if (call != null){
			C5Event c5event = new C5Event(event.getEventName());
			c5event.addParameter(Fields.Channel, channel_destination);
			call.handleEvent(c5event);
		}
	}

	private C5Channel cacheChannel(String channelName, String callerID,
			String callerIDName, String uniqueid) {
		// cache it into pbx.getChannels()
		C5Channel channel = pbx.getChannel(channelName);
		if (channel != null) {
			if (channel.getSipPeer() != null){
				if(channel.getSipPeer().getUser() != null){
					channel.setCallerIDNum(channel.getSipPeer().getUser().getExten());
				}
				else channel.setCallerIDNum(channel.getSipPeer().getExten());
			}
			else
				channel.setCallerIDNum(callerID);
			channel.setCallerIDName(callerIDName);
		} else {
			channel = new C5Channel(channelName, callerID, callerIDName,
					Fields.Down, uniqueid, id);
			pbx.addChannel(channel);
			channel.setCallerIDNum(callerID);
			String peerName = getExtenFromChannelName(channelName);
			SipPeer peer = pbx.getPeer(peerName);
			try{
				// TODO omit sip/5-8000 for test
				if (peer != null && peerName.length() > 5) {
					User user = peer.getUser();
					channel.setCallerIDNum(peer.getExten());
					channel.setCallerIDName(peer.getExten());
					channel.setAccount(peer.getAccount());
					peer.addChannel(channel);
					C5Channel orginateChannel = pbx.getChannel(peer.getOriginateChannel());
					if(user != null){
						channel.setCallerIDNum(user.getExten());
						channel.setCallerIDName(user.getExten());
						// if it's an new channel we set it's status according to peer
						// status
						if (channel.getState().equalsIgnoreCase(Fields.Down)) {
							if (user.getStatus().equalsIgnoreCase(
									User.LISTENNING)) {
								channel.setChannelType(User.LISTENNING);
								channel.addC5Var(Fields.ListenExten, user.getVar(Fields.CalledNo));
								channel.setFromCid(channel.getSipPeer().getExten());
								channel.setFromDid(user.getVar(Fields.CalledNo));
								channel.setCallerIDName(user.getVar(Fields.CalledNo));
							} else if (user.getStatus()
									.equalsIgnoreCase(User.OUTBOUND_CALL)) {
								channel.addC5Var(Fields.ListenExten, user.getVar(Fields.CalledNo));
								channel.setChannelType(Fields.dialout);
								channel.setFromCid(user.getDidNum());
								channel.setFromDid(user.getVar(Fields.CalledNo));
								if (user.getVar(Fields.DialoutActionID) != null) {
									String actionID = user.removeVar(Fields.DialoutActionID);
									channel.addVar(Fields.ActionID, actionID);
									channel.setActionId(actionID);
								}
							} else if (user.getStatus()
									.equalsIgnoreCase(SipPeer.INBOUND_CALL)) {
								channel.addC5Var(Fields.ListenExten, user.getVar(Fields.CalledNo));
								channel.setFromCid(user.getExten());
								channel.setFromDid(user.getVar(Fields.CalledNo));
								channel.setChannelType(Fields.inner);
							} else if (user.getStatus()
									.equalsIgnoreCase(User.WEBCALL)) {
								channel.addC5Var(Fields.ListenExten, user.getVar(Fields.CalledNo));
								channel.setChannelType(Fields.webcall);
								channel.setFromCid(user.getVar(Fields.CalledNo));
								channel.setFromDid(user.getVar(Fields.ServiceNo));
								
							} else if (user.getStatus().equals(Fields.ThreeWayCall)){
								channel.setChannelType(Fields.ThreeWayCall);
								channel.setLinked(true);
								channel.setLinkedChannel(channel);
							}
							
							if(orginateChannel != null) {
								if (orginateChannel.getSipPeer() == null) {
									channel.setChannelType(orginateChannel
											.getChannelType());
									channel.setLinkedChannel(orginateChannel);
									channel.setFromCid(orginateChannel
											.getFromCid());
									channel.setFromDid(orginateChannel
											.getFromDid());
									channel.setCallerCity(orginateChannel.getCallerCity());
									channel.setCallerCityCode(orginateChannel.getCallerCityCode());
									channel.setCallerProvince(orginateChannel.getCallerProvince());
									channel.setCallerProvinceCode(orginateChannel.getCallerProvinceCode());
									channel.setCallerDistrictNo(orginateChannel.getCallerDistrictNo());
									channel.setCalleeCity(orginateChannel.getCalleeCity());
									channel.setCalleeCityCode(orginateChannel.getCalleeCityCode());
									channel.setCalleeProvince(orginateChannel.getCalleeProvince());
									channel.setCalleeProvinceCode(orginateChannel.getCalleeProvinceCode());
									channel.setCalleeDistrictNo(orginateChannel.getCalleeDistrictNo());
									channel.setLinked(true);
								} 
								//call from inbound
								else {
									String fromcid = orginateChannel.getExten();
									if (orginateChannel.getSipPeer() != null
											&& orginateChannel.getSipPeer()
													.getUser() != null) {
										fromcid = orginateChannel.getSipPeer()
												.getUser().getExten();
									}
									String fromdid = channel.getExten();
									if (channel.getSipPeer().getUser() != null) {
										fromdid = channel.getSipPeer()
												.getUser().getExten();
									}
									channel.setFromCid(fromcid);
									channel.setFromDid(fromdid);
									channel.setChannelType(Fields.inner);
									//channel.setLinkedChannel(orginateChannel);
									// channel.setLinked(true);
								}
							}
						}
						channel.addVar(Fields.DisposalAgent, user.getId());
					}
				}
			} catch (Exception e){
				logger.log(Level.WARNING, "", e);
			}
			
		}
		return channel;
	}

	/**
	 * Event: MessageWaiting Privilege: call,all Mailbox: 1001@default Waiting:
	 * 1 New: 1 Old: 0
	 * 
	 * @param event
	 */
	private void processMessageWaiting(AsteriskEvent event) {
		// TODO The message sometimes not send the new and old parameters,
		// We need to query the mailbox again. This event only tell use that
		// there is a new message for him.
		// String mailbox = event.getValue(AMIField.MAILBOX);
		// try {
		// queryMailboxStatus(mailbox);
		// } catch (CommunicationException e) {
		// e.printStackTrace();
		// }
	}

	/**
	 * Event: QueueParams Privilege: null
	 * ActionID:pbx.getQueues()tatus5886785244630162652 Queue:202 Completed:0
	 * Abandoned:0 ServiceLevel:0 Weight:0 Calls:0 Max:0 ServicelevelPerf:0.0
	 * Holdtime:0
	 * 
	 * @param event
	 */
	private void processQueueParams(AsteriskEvent event) {
		String queueName = event.getValue(AMIField.QUEUE);
		int serviceLevel = Integer.valueOf(
				event.getValue(AMIField.SERVICE_LEVEL)).intValue();
		int weight = Integer.valueOf(event.getValue(AMIField.WEIGHT))
				.intValue();
		int calls = Integer.valueOf(event.getValue(AMIField.CALLS)).intValue();
		int max = Integer.valueOf(event.getValue(AMIField.MAX)).intValue();
		double serviceLevelPerf = Double.valueOf(
				event.getValue(AMIField.SERVICELEVEL_PERF)).doubleValue();
		int holdtime = Integer.valueOf(event.getValue("Holdtime")).intValue();

		C5Queue queue = pbx.getQueue(queueName);
		if (queue != null) {
			queue.setCalls(calls);
			queue.setHoldtime(holdtime);
			queue.setMax(max);
			queue.setServiceLevel(serviceLevel);
			queue.setServiceLevelPerf(serviceLevelPerf);
			queue.setWeight(weight);
			queue.setRemoved(false);
			queue.removeAllQueueMembers();
		} else {
			logger.warning("Get queue not in cacher: " + queueName);
		}
	}

	/**
	 * Event: QueueMember Privilege: null
	 * ActionID:pbx.getQueues()tatus5886785244630162652 Paused:0
	 * Membership:static Queue:202 Penalty:0 Name:Local/1003@from-internal/n
	 * LastCall:0 Location:Local/1003@from-internal/n Status:1 CallsTaken:0
	 * 
	 * @param event
	 */
	private void processQueueMember(AsteriskEvent event) {
		String name = event.getValue(AMIField.NAME);
		int paused = Integer.valueOf(event.getValue(AMIField.PAUSED))
				.intValue();
		String membership = event.getValue(AMIField.MEMBERSHIP);
		String queueName = event.getValue(AMIField.QUEUE);
		int penalty = Integer.valueOf(event.getValue(AMIField.PENALTY))
				.intValue();
		String lastCall = event.getValue(AMIField.LAST_CALL);
		String location = event.getValue(AMIField.LOCATION);
		int status = Integer.valueOf(event.getValue(AMIField.STATUS))
				.intValue();
		int callsTaken = Integer.valueOf(event.getValue(AMIField.CALLS_TAKEN))
				.intValue();

		// If the queue is not in our cache, there must be some error on reload
		// or initiation.
		// I have to drop this member.
		C5Queue queue = pbx.getQueue(queueName);
		if (queue == null) {
			logger.warning("Can not find the queue [" + queueName
					+ "] of this member, drop this event: " + event.toString());
			return;
		}

		C5QueueMember member = null;
		// If this member is not in the queue, I add it.
		if (queue.getMember(name) == null) {
			member = new C5QueueMember(name, queueName, queue.getAccount(), id);
			queue.addQueueMember(member);
		} else {
			member = queue.getMember(name);
		}

		member.setPaused((paused == 1) ? true : false);
		member.setMembership(membership);
		member.setPenalty(penalty);
		member.setLastCall(lastCall);
		member.setLocation(location);
		member.setStatus(status);
		member.setCallsTaken(callsTaken);
		
		if(System.currentTimeMillis() - this.getHandlerStartTime() > 120000){
			SipPeer peer = pbx.getPeer(name.substring(name.indexOf('/') + 1));
			if(status == 6){
//				logger.warning("---Find Queue["+queueName+"] Member Status = 6----[peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName()
//						+"[peer.channels.size]="+peer.getChannels().size());
				if(peer.getChannels().size() > 0){
//					C5Channel channel = peer.getChannels().get(0);
//					if(channel.getState().equalsIgnoreCase(Fields.Ringing)){
//						logger.warning("---Find Queue["+queueName+"] Member Status = 6----[peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName()
//								+"[peer.channel status is ringing is ok]");
//					}else{
//						logger.warning("---Find Queue["+queueName+"] Member Status = 6----[peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName()
//								+"[peer.channel status not ringing has problem!!!]"+channel.getChannelName());
////						excutor.execute(new CheckQueueMemberStatus6HasErrorTask(pbx.getPbx(), queueName, peer.getName(), peer.getUser().getDisplayName(), "has_channel_but_not_ringing!"));
//					}
				}else{
					logger.warning("---Find Queue["+queueName+"] Member Status = 6----[peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName()
							+"[peer.channel don't have channel.It's has problem!!!]");
					excutor.execute(new CheckQueueMemberStatus6HasErrorTask(pbx.getPbx(), queueName, peer.getName(), peer.getUser().getDisplayName(), "don't_has_channel!"));
				}
			}		
			if(peer != null && peer.getUser() != null){
				if(!peer.getUser().isLogin() && !peer.getUser().isReserve()){					
					logger.warning("---Find Queue Zombie Member----[peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName());
					boolean result;
					QueueRemove queueRemove = new QueueRemove(queue.getExten(), name,
							Utils.getSynActionID("queueremoveZombieMember"));
					AsteriskResponse res;
					try {
						res = AMICore.getInstance()
								.getAMIClient(pbx.getPbx())
								.sendSynchronousAction(queueRemove);
						result = res.isSuccessful();
						if (result) {
							logger.warning("===Remove Queue Zombie Member Success! [peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName());
						}else{
							logger.warning("===Remove Queue Zombie Member Failed! [peer]="+peer.getName()+"[user]="+peer.getUser().getDisplayName());
						}
					} catch (CommunicationException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				}
			}
		}
		
//		C5Account account = this.pbx.getAccount(queue.getAccount());
//		if(account != null){
//			User user = account.getUserViaSipNum(member.getExten());
//			if(user != null){
//				member.setUserID(user.getId());
//			}
//		}
	}

	/**
	 * Event: QueueMemberAdded Privilege: agent,all Paused:0 Membership:dynamic
	 * Queue:202 Penalty:0 MemberName:Local/1001@from-internal/n LastCall:0
	 * Location:Local/1001@from-internal/n Status:1 CallsTaken:0
	 * 
	 * @param event
	 */
	private void processQueueMemberAdded(AsteriskEvent event) {
		String name = event.getValue(AMIField.MEMBER_NAME);
		int paused = Integer.valueOf(event.getValue(AMIField.PAUSED))
				.intValue();
		String membership = event.getValue(AMIField.MEMBERSHIP);
		String queueName = event.getValue(AMIField.QUEUE);
		int penalty = Integer.valueOf(event.getValue(AMIField.PENALTY))
				.intValue();
		String lastCall = event.getValue(AMIField.LAST_CALL);
		String location = event.getValue(AMIField.LOCATION);
		int status = Integer.valueOf(event.getValue(AMIField.STATUS))
				.intValue();
		int callsTaken = Integer.valueOf(event.getValue(AMIField.CALLS_TAKEN))
				.intValue();

		// If the queue is not in our cache, there must be some error on reload
		// or initiation.
		// I have to drop this member.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("Can not find the queue [" + queueName
					+ "] of this member, drop this event: " + event.toString());
			return;
		}

		C5Queue queue = (C5Queue) pbx.getQueues().get(queueName);
		C5QueueMember member = null;
		// If this member is not in the queue, I add it.
		if (queue.getMember(name) == null) {
			member = new C5QueueMember(name, queueName, queue.getAccount(), id);
			queue.addQueueMember(member);
		} else {
			member = queue.getMember(name);
		}
		member.setPaused((paused == 1) ? true : false);
		member.setMembership(membership);
		member.setPenalty(penalty);
		member.setLastCall(lastCall);
		member.setLocation(location);
		member.setStatus(status);
		member.setCallsTaken(callsTaken);
		CallListener.getInstance().queueMemberAdded(queueName, member);
	}

	/**
	 * Event: QueueMemberRemoved Privilege: agent,all
	 * MemberName:Local/1001@from-internal/n Location:Local/1001@from-internal/n
	 * Queue:202
	 * 
	 * @param event
	 */
	private void processQueueMemberRemoved(AsteriskEvent event) {
		String name = event.getValue(AMIField.MEMBER_NAME);
		String queueName = event.getValue(AMIField.QUEUE);

		// If the queue is not in our cache, there must be some error on reload
		// or initiation.
		// I have to drop this member.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("Can not find the queue [" + queueName
					+ "] of this member, drop this event: " + event.toString());
			return;
		}

		C5Queue queue = pbx.getQueues().get(queueName);
		// If this member is in the queue, I remove it.
		if (queue.getMember(name) == null) {
			// can not find it, do nothing
			return;
		} else {
			C5QueueMember member = queue.removeQueueMember(name);
			CallListener.getInstance().queueMemberRemoved(queueName, member);
		}
	}

	/**
	 * Event: QueueMemberPaused Privilege: agent,all
	 * MemberName:Local/1001@from-internal/n Location:Local/1001@from-internal/n
	 * Paused:1 Queue:200
	 * 
	 * @param event
	 */
	private void processQueueMemberPaused(AsteriskEvent event) {
		String name = event.getValue(AMIField.MEMBER_NAME);
		int paused = Integer.valueOf(event.getValue(AMIField.PAUSED))
				.intValue();
		String queueName = event.getValue(AMIField.QUEUE);
		String location = event.getValue(AMIField.LOCATION);
//		String timestamp = event.getValue(AMIField.TIMESTAMP);
		// If the queue is not in our cache, there must be some error on reload
		// or initiation.
		// I have to drop this member.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("Can not find the queue [" + queueName
					+ "] of this member, drop this event: " + event.toString());
			return;
		}

		C5Queue queue = pbx.getQueues().get(queueName);
		C5QueueMember member = null;
		// If this member is not in the queue, return.
		if (queue.getMember(name) == null) {
			logger.warning("Can not find the queue [" + queueName
					+ "] of member [" + name + "]");
			return;
		} else {
			member = queue.getMember(name);
		}
		if (member.isPaused() == (paused == 1))
			return;
		member.setPaused((paused == 1) ? true : false);
		member.setLocation(location);
		CallListener.getInstance().queueMemberPaused(queueName, member);
	}

	/**
	 * Event:QueueEntry Queue:200 Position:1 Channel:SIP/1001-123214ui1
	 * CallerID:1001 CallerIDName:caif Wait:377
	 * 
	 * @param event
	 */
	private void processQueueEntry(AsteriskEvent event) {
		String channel = event.getValue(AMIField.CHANNEL);
		channel = getFormattedChannelName(channel);
		String queueName = event.getValue(AMIField.QUEUE);
		int position = Integer.valueOf(event.getValue(AMIField.POSITION))
				.intValue();
		String callerID = event.getValue(AMIField.CALLERID);
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		int wait = Integer.valueOf(event.getValue(AMIField.WAIT)).intValue();

		// The queue of this entry is not in my cache, this should be a error.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("The queue [" + queueName + "] of entry ["
					+ event.toString() + "] is not in my cache, ignore it");
			return;
		}
		C5Queue queue = (C5Queue) pbx.getQueues().get(queueName);
		//check Queue zombie channel
		if(wait > queue.getWaitTime()){
			logger.warning("Find Queue Zombie Channel : " + channel);
			Hangup action = new Hangup(channel, Utils.getSynActionID("hangup"));
			try {
				AMICore.getInstance().getAMIClient(pbx.getPbx()).sendAction(action);
			} catch (IOException e) {
				logger.warning("Hangup Queue Zombie Channel Failed: " + channel);
			}
			return;
		}
		C5QueueEntry entry = queue.getEntry(channel);
		// If the entry is not in the queue, add it.
		if (entry == null) {
			entry = new C5QueueEntry(channel, queueName, queue.getAccount(), id);
			queue.addEntry(entry);
		}
		entry.setWait(wait);
		entry.setCallerID(callerID);
		entry.setCallerIDName(callerIDName);
		entry.setChannel(channel);
		entry.setPosition(position);
	}

	/**
	 * Event: Join Privilege: call,all Position:1 Uniqueid:1201427071.46
	 * CallerID:1002 Queue:202 Channel:SIP/1002-08f62f38 Count:1
	 * CallerIDName:lilian
	 * 
	 * @param event
	 */
	private void processQueueJoin(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channelName = getFormattedChannelName(channelName);
		if (channelName.startsWith("Local")) {
			if (tempChannel.containsKey(channelName))
				channelName = tempChannel.get(channelName);
			else
				return;
		}
		String queueName = event.getValue(AMIField.QUEUE);

		// for c5
		C5Channel channel = pbx.getChannel(channelName);
		if (channel != null) {
			if(channel.getQueue() != null){
				if(channel.getQueueTimestamp() == null){
					channel.setQueueTimestamp(timestamp);
				}
			} else if(channel.getChannelType().equals(Fields.normal)) {
				channel.setQueue(queueName);
				channel.setQueueTimestamp(timestamp);
				try {
					String queueDisplayName = pbx.getQueue(queueName).getDisplayName();
					channel.setQueueName(queueDisplayName);
				} catch (Exception e) {
					logger.log(Level.WARNING, "", e);
				}
			}
			
		} else {
			logger.warning("Channel not found for join: "+channelName);
			return;
		}

		int position = Integer.valueOf(event.getValue(AMIField.POSITION))
				.intValue();
		String uniqueid = event.getValue(AMIField.UNIQUEID);
		String callerID = event.getValue(AMIField.CALLERID);
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		int count = Integer.valueOf(event.getValue(AMIField.COUNT)).intValue();

		// The queue of this entry is not in my cache, this should be a error.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("The queue [" + queueName + "] of entry ["
					+ event.toString() + "] is not in my cache, ignore it");
			return;
		}
		C5Queue queue = pbx.getQueues().get(queueName);
		C5QueueEntry entry = queue.getEntry(channelName);

		// If the entry is not in the queue, add it.
		if (entry == null) {
			entry = new C5QueueEntry(channel.getChannelName(), queueName, queue
					.getAccount(), id);
			queue.addEntry(entry);
			queue.setCalls(queue.getCalls() + 1);
		}
		entry.setCallerID(callerID);
		entry.setCallerIDName(callerIDName);
		entry.setChannel(channelName);
		entry.setPosition(position);
		entry.setUniqueid(uniqueid);
		entry.setCount(count);
		CallListener.getInstance().queueEntryJoin(queueName, entry);
	}

	/**
	 * Event: Leave 
	 * Privilege: call,all 
	 * Count:0 
	 * Channel:SIP/1002-08f62f38
	 * Queue:202 
	 * Uniqueid:1201427071.46
	 * 
	 * @param event
	 */
	private void processQueueLeave(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		channelName = getFormattedChannelName(channelName);
		if (channelName.startsWith("Local")) {
			if (tempChannel.containsKey(channelName))
				channelName = tempChannel.get(channelName);
			else
				return;
		}
		String queueName = event.getValue(AMIField.QUEUE);

		String uniqueid = event.getValue(AMIField.UNIQUEID);
		int count = Integer.valueOf(event.getValue(AMIField.COUNT)).intValue();

		// The queue of this entry is not in my cache, this should be a error.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("The queue [" + queueName + "] of entry ["
					+ event.toString() + "] is not in my cache, ignore it");
			return;
		}
		C5Queue queue = pbx.getQueues().get(queueName);
		C5QueueEntry entry = queue.getEntry(channelName);

		// If the entry is not in the queue, add it.
		if (entry == null) {
			// Not find the entry, do nothing
			return;
		} else {
			queue.removeEntry(channelName);
			queue.setCalls(queue.getCalls() - 1);
			queue.setTotalCalls(queue.getTotalCalls() + 1);
		}
		entry.setChannel(channelName);
		entry.setUniqueid(uniqueid);
		entry.setCount(count);
		CallListener.getInstance().queueEntryLeave(queueName, entry);
	}

	/**
	 * Event: QueueCallerAbandon 
	 * Privilege: agent,all Position:1 HoldTime:3
	 * Queue:202 
	 * OriginalPosition:1 
	 * Uniqueid:1201427744.52
	 * 
	 * @param event
	 */
	private void processQueueCallerAbandon(AsteriskEvent event) {
		String queueName = event.getValue(AMIField.QUEUE);
		String uniqueid = event.getValue(Fields.Uniqueid);

		// The queue of this entry is not in my cache, this should be a error.
		if (!pbx.getQueues().containsKey(queueName)) {
			logger.warning("The queue [" + queueName + "] of entry ["
					+ event.toString() + "] is not in my cache, ignore it");
			return;
		}
		C5Queue queue = (C5Queue) pbx.getQueues().get(queueName);
		queue.setAbandoned(queue.getAbandoned() + 1);
		C5Event _event = new C5Event(Fields.QueueCallerAbandon);
		_event.addParameter(Fields.PBX, queue.getPbx());
		_event.addParameter(Fields.Account, queue.getAccount());
//		_event.setValues(event.getParameters());
		_event.addParameter(Fields.Uniqueid, uniqueid);
		_event.addParameter(Fields.Timestamp, event
				.getValue(AMIField.TIMESTAMP));
		_event.addParameter(Fields.Queue, event.getValue(Fields.Queue));
		CallListener.getInstance().queueCallerAbandon(queueName, _event);
	}

	/**
	 * Event: ParkedCallTimeOut Privilege: call,all Exten:701
	 * CallerIDName:<unknown> Channel:SIP/1001-08f6a330 CallerID:1001
	 * 
	 * @param event
	 */
	private void processParkedCallTimeout(AsteriskEvent event) {
		// String channel = event.getValue(AMIField.CHANNEL);
		// channel = getFormattedChannelName(channel);
		// if (parkedCalls.containsKey(channel))
		// parkedCalls.remove(channel);
		// else
		// return;
		//
		// C5Event _event = new C5Event(Fields.ParkedCallTimeOut);
		// _event.setValues(event.getParameters());
		//
		// synchronized (parkListeners) {
		// Iterator<ParkListener> i = parkListeners.iterator();
		// while (i.hasNext()) {
		// ((ParkListener) i.next()).parkedCallTimeout(_event);
		// }
		// }
		// logger.fine("Notify park status listenser: \r\n" + event);
	}

	/**
	 * Event: ParkedCallGiveUp Privilege: call,all Exten: 701 Channel:
	 * SIP/3002-09984578 CallerID: 3002 CallerIDName: caif
	 * 
	 * @param event
	 */
	private void processParkedCallGiveUp(AsteriskEvent event) {
		// String channel = event.getValue(AMIField.CHANNEL);
		// channel = getFormattedChannelName(channel);
		// if (parkedCalls.containsKey(channel))
		// parkedCalls.remove(channel);
		// else
		// return;
		//
		// C5Event _event = new C5Event(Fields.ParkedCallGiveUp);
		// _event.setValues(event.getParameters());
		//
		// synchronized (parkListeners) {
		// Iterator<ParkListener> i = parkListeners.iterator();
		// while (i.hasNext()) {
		// ((ParkListener) i.next()).parkedCallGiveup(_event);
		// }
		// }
	}

	/**
	 * Event: ParkedCall Privilege: call,all Exten:701 CallerIDName:<unknown>
	 * Channel:SIP/1001-08f6bef0 Timeout:45 From:SIP/1002-08f67348 //who will
	 * invoke it CallerID:1001
	 * 
	 * @param event
	 */
	private void processParkedCall(AsteriskEvent event) {
		// String exten = event.getValue(AMIField.EXTEN);
		// String channel = event.getValue(AMIField.CHANNEL);
		// channel = getFormattedChannelName(channel);
		// String fromChannel = event.getValue(AMIField.FROM);
		// fromChannel = getFormattedChannelName(fromChannel);
		// String timeout = event.getValue(AMIField.TIMEOUT);
		// String callerID = event.getValue(AMIField.CALLERID);
		// String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		// C5ParkedCall parkedCall = null;
		// if (parkedCalls.containsKey(channel))
		// parkedCall = parkedCalls.get(channel);
		// else {
		// parkedCall = new C5ParkedCall(exten, channel, fromChannel, timeout,
		// id);
		// parkedCalls.put(channel, parkedCall);
		// }
		//
		// parkedCall.setCallerID(callerID);
		// parkedCall.setCallerIDName(callerIDName);
		// C5Event _event = new C5Event(Fields.ParkedCall);
		// _event.setValues(event.getParameters());
		// synchronized (parkListeners) {
		// Iterator<ParkListener> i = parkListeners.iterator();
		// while (i.hasNext()) {
		// ((ParkListener) i.next()).parkedCall(_event);
		// }
		// }
	}

	/**
	 * Event: UnParkedCall Privilege: call,all Exten:701 CallerIDName:<unknown>
	 * Channel:SIP/1001-08f6bef0 From:SIP/1002-08f65928 //who invoked it
	 * CallerID:1001
	 * 
	 * @param event
	 */
	private void processUnParkedCall(AsteriskEvent event) {
		// String channel = event.getValue(AMIField.CHANNEL);
		// channel = getFormattedChannelName(channel);
		// if (parkedCalls.containsKey(channel))
		// parkedCalls.remove(channel);
		// else
		// return;
		// C5Event _event = new C5Event(Fields.UnParkedCall);
		// _event.setValues(event.getParameters());
		// synchronized (parkListeners) {
		// Iterator<ParkListener> i = parkListeners.iterator();
		// while (i.hasNext()) {
		// ((ParkListener) i.next()).unparkedCall(_event);
		// }
		// }
	}

	/**
	 * Event: Unlink Privilege: call,all Channel2:SIP/1003-091c8668
	 * Channel1:SIP/1002-091c46f0 Uniqueid2:1201353260.41
	 * Uniqueid1:1201353260.40 CallerID2:1003 CallerID1:1002
	 * 
	 * @param event
	 */
	private void processUnlink(AsteriskEvent event) {
		String channelName1 = event.getValue(AMIField.CHANNEL1);
		channelName1 = getFormattedChannelName(channelName1);
		if (channelName1.startsWith("Local"))
			return;
		if (!pbx.hasChannel(channelName1)) {
			return;
		}
		String callerID1 = event.getValue(AMIField.CALLERID1);
		String uniqueid1 = event.getValue(AMIField.UNIQUEID1);

		String channelName2 = event.getValue(AMIField.CHANNEL2);
		channelName2 = getFormattedChannelName(channelName2);
		if (channelName2.startsWith("Local"))
			return;
		if (!pbx.hasChannel(channelName2)) {
			return;
		}
		String callerID2 = event.getValue(AMIField.CALLERID2);
		String uniqueid2 = event.getValue(AMIField.UNIQUEID2);

		String timestamp = event.getValue(AMIField.TIMESTAMP);

		processUnlinkChannel(channelName1, callerID1, uniqueid1, timestamp);
		processUnlinkChannel(channelName2, callerID2, uniqueid2, timestamp);
	}

	private void processUnlinkChannel(String channelName, String callerID,
			String uniqueid, String timestamp) {
		C5Channel channel = pbx.getChannel(channelName);
		if (channel != null) {
			if(channel.getCall() != null)
				return;
			channel.setLinked(false);
			channel.setState(Fields.Unlink);
			channel.setTimestamp(timestamp);
			channel.setEndTime(timestamp);
			notifyChannelStatusChanged(channel);
			if (channel.isWaitForRing()) {
				channel.setWaitForRing(false);
				channel.setState(Fields.Ring);
				notifyChannelStatusChanged(channel);
			}
		}
	}

	/**
	 * Event: Link Privilege: call,all Channel2:SIP/1003-091c8668
	 * Channel1:SIP/1002-091c46f0 Uniqueid2:1201353260.41
	 * Uniqueid1:1201353260.40 CallerID2:1003 CallerID1:1002
	 * 
	 * @param event
	 */
	private void processLink(AsteriskEvent event) {
		String channelName1 = event.getValue(AMIField.CHANNEL1);
		channelName1 = getFormattedChannelName(channelName1);
		String channelName2 = event.getValue(AMIField.CHANNEL2);
		channelName2 = getFormattedChannelName(channelName2);

		/**
		 * when do web call, there will be two temp pbx.getChannels():
		 * Local/xxxxxxxxxxxxxxx,1 Local/xxxxxxxxxxxxxxx,2 The first channel
		 * will call agent instead of the outbound channel, so we need to
		 * replace all Local/xxxxxxxxxxxxxxx,1 to this channel.
		 */
		if (channelName1.startsWith("Local") && channelName2.startsWith("SIP")) {
			if (tempChannel.containsKey(channelName1)) {
				channelName1 = tempChannel.get(channelName1);
			}
			if (pbx.hasChannel(channelName2)) {
				if (pbx.getChannel(channelName2).getSipPeer() == null) {
					return;
				}
			}
		}

		if (!pbx.hasChannel(channelName1)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}

		if (!pbx.hasChannel(channelName2)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}

		C5Channel channel1 = pbx.getChannel(channelName1);
		C5Channel channel2 = pbx.getChannel(channelName2);

		channel1.setLinkedChannel(channel2);
		channel1.setState(Fields.Link);
		channel1.setLinked(true);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channel1.setTimestamp(timestamp);
		channel1.setBeginTime(timestamp);
		
		channel2.setLinkedChannel(channel1);
		channel2.setState(Fields.Link);
		channel2.setTimestamp(timestamp);
		channel2.setBeginTime(timestamp);
		channel2.setLinked(true);
		//add to record Premedia
		if(channel1.getChannelType() != null && channel1.getChannelType().equals(Fields.dialout)){
			logger.log(Level.INFO,"Premedia this is dialout channel +"+ channel1.getChannelName());
			try{
				if(channel1.getMonitorFilename().endsWith("premedia")){
					StopMonitor stopM = new StopMonitor(channel1.getChannelName(), Utils.getSynActionID("PremediaStopmonitor"));
					AMICore.getInstance().getAMIClient(channel1.getPbx()).sendAction(stopM);
					Monitor monitor = new Monitor(channel1.getChannelName(), Utils.getSynActionID("PremediaMonitor"));
					String oldName = channel1.getMonitorFilename();
					String newName = oldName.substring(0, oldName.lastIndexOf("_"));
					channel1.setMonitorFilename(newName);
					monitor.setFile(newName);
					monitor.setMix("false");
					AMICore.getInstance().getAMIClient(channel1.getPbx()).sendAction(monitor);
					//if link to delete premedia
					File premediaInFile = new File("/var/spool/asterisk/" + pbx.getPbx() + "/monitor/"+oldName+"-in.wav");
					File premediaOutFile = new File("/var/spool/asterisk/" + pbx.getPbx() + "/monitor/"+oldName+"-out.wav");
					if(premediaInFile.exists()){
						premediaInFile.delete();
						logger.log(Level.WARNING, "delete premediaInFile success!"+ "/var/spool/asterisk/" + pbx.getPbx() + "/monitor/"+ oldName +"-in.wav");
					}
					if(premediaOutFile.exists()){
						premediaOutFile.delete();
						logger.log(Level.WARNING, "delete premediaOutFile success!"+ "/var/spool/asterisk/" + pbx.getPbx() + "/monitor/"+ oldName +"-out.wav");
					}
				}
			}catch (Exception e) {
				logger.log(Level.WARNING, "The dialout channel record Premedia has Exception!", e);
			}
		}
		
		//maxCalltime task
		if(channel1.getMaxCallTimerTask() != null){
			if(channel1.getVar("Meet-MaxCallTime") != null){
				RuntimeData.webcallTimer.schedule(channel1.getMeetMaxCallTimerTask(), channel1.getMaxCallTime());
			}else{
				if(channel1.getMaxCallTimerTask().getLchannel() != null &&
						channel1.getMaxCallTimerTask().getLchannel().getUniqueid().equals(channel1.getUniqueid())){
					channel1.getMaxCallTimerTask().setChannel(channel2);
				}else{
					channel1.getMaxCallTimerTask().setLchannel(channel2);
					RuntimeData.webcallTimer.schedule(channel1.getMaxCallTimerTask(), channel1.getMaxCallTime());				
				}
				channel2.setMaxCallTimerTask(channel1.getMaxCallTimerTask());
			}
		}
		//chatingIvrPrompt
		if(channel1.getWebCallChatingIvrPromptVoMap() != null && channel1.getWebCallChatingIvrPromptVoMap().size() > 0){
			Hashtable<String, String> tempMap = new Hashtable<String, String>();
			tempMap.put("Account", channel1.getAccount());
			tempMap.put("CallID", channel2.getUniqueid());
			RuntimeData.getInstance().getWebcallChatingIvrPromptCallIDMap().put(channel1.getUniqueid(), tempMap);
			for(Map.Entry<String, TimerTask> entry:channel1.getWebCallChatingIvrPromptVoMap().entrySet()){
				RuntimeData.webcallTimer.schedule(entry.getValue(), Integer.parseInt(entry.getKey()));
			}
		}
		
		if(channel2.getSipPeer() != null && channel2.getSipPeer().getUser() != null)
			channel1.addVar(Fields.UserID, channel2.getSipPeer().getUser().getId());
		notifyChannelStatusChanged(channel1);

		if(channel1.getSipPeer() != null && channel1.getSipPeer().getUser() != null)
			channel2.addVar(Fields.UserID, channel1.getSipPeer().getUser().getId());
		notifyChannelStatusChanged(channel2);
	}

	/**
	 * Event: ExtensionStatus Privilege: call,all Status:0 Exten:1002
	 * Context:ext-local
	 * 
	 * @param event
	 */
	// private void processExtensionStatus(AsteriskEvent event){
	// String exten = event.getInfo(AMIField.EXTEN);
	// int status = Integer.valueOf(event.getInfo(AMIField.STATUS)).intValue();
	// if(status != 0 && status != 4)
	// return;
	// if(extens.containsKey(exten)){
	// AsteriskExten astExten = (AsteriskExten) extens.get(exten);
	// astExten.setState(status);
	// notifyPeerStatusChanged(astExten.getStatusString());
	// }
	// }
	/**
	 * EventName:Hangup Privileges:call,all Cause-txt:Normal Clearing Cause:16
	 * Channel:SIP/1002-0a0f6610 Uniqueid:1201326830.19
	 * 
	 * @param event
	 */
	private void processHangup(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);

		// ignores rename channel
		if (channelName.startsWith("AsyncGoto")){
			if(pbx.hasChannel(channelName))
				pbx.removeChannel(channelName);
			return;
		}

		channelName = getFormattedChannelName(channelName);
		if (channelName.startsWith("Local")) {
			if (tempChannel.containsKey(channelName))
				tempChannel.remove(channelName);
			if(pbx.hasChannel(channelName))
				pbx.removeChannel(channelName);
			return;
		}
		if (!pbx.hasChannel(channelName)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}
		try {
			// remove it from cache
			C5Channel channel = pbx.getChannel(channelName);
			String timestamp = event.getValue(AMIField.TIMESTAMP);
			channel.setTimestamp(timestamp);
			channel.setEndTime(timestamp);
			channel.setState(Fields.Hangup);
			channel.setLinked(false);

			// remove it from peer
			String peerName = getExtenFromChannelName(channelName);
			SipPeer peer = pbx.getPeer(peerName);
			if (peer == null) {
				logger.fine("The peer of channel [" + channelName
						+ "] is not in the cache, no need to remove it: "
						+ channelName);
			} else {
				if (peer.hasChannel(channel)) {
					peer.removeChannel(channel);
					peer.setOriginateChannel("");
					if(peer.getUser() != null) {
						peer.getUser().setBusyTimestamp(channel.getTimestamp());
						peer.getUser().setStatus(User.IDLE);
					}
				}
			}
			notifyChannelStatusChanged(channel);
			channel.destruct();
		} catch (Exception e){
			logger.log(Level.WARNING, "", e);
		}
		pbx.removeChannel(channelName);
	}

	/**
	 * EventName:Newchannel 
	 * Privileges:call,all 
	 * CallerIDNum:1002
	 * CallerIDName:device 
	 * State:Down 
	 * Channel:SIP/1002-0a0f6610
	 * Uniqueid:1201326830.19
	 * 
	 * @param event
	 */
	private void processNewChannel(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		String exten = this.getExtenFromChannelName(channelName);
		SipPeer peer = null;
		if (channelName.trim().equalsIgnoreCase(""))
			return;
		// do not cache rename channel
		if (channelName.startsWith("AsyncGoto"))
			return;
		if (channelName.startsWith("Local")) {
			// In current version, only xfer local channel need to be recored
			// if(!exten.endsWith("prexfer")){
			return;
		}
		
		peer = pbx.getPeer(exten);

		// TODO In C5 only one channel can be created for one peer
		// we need to hangup the pre channel
		if (peer != null && peer.getChannels().size() > 0) {
			logger.warning("Get new channel from asterisk where " +
							"this peer already has one: "
							+ event.toString());
			C5Channel preChannel = peer.getChannels().get(0);
			preChannel.setState(Fields.Hangup);
			this.notifyChannelStatusChanged(preChannel);
		}
		String callerIDNum = event.getValue(AMIField.CALLERIDNUM);
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		String state = event.getValue(AMIField.STATE);
		String uniqueid = event.getValue(AMIField.UNIQUEID);

		C5Channel channel = cacheChannel(channelName, callerIDNum,
				callerIDName, uniqueid);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channel.setTimestamp(timestamp);
//		channel.setState(state);
		notifyChannelStatusChanged(channel);
	}

	/**
	 * I just update this peer in my cacher
	 * 
	 * Event: PeerEntry 
	 * ActionID: 555444333222111 
	 * Channeltype: SIP 
	 * ObjectName: labrat 
	 * ChanObjectType: peer 
	 * IPaddress: 10.0.0.75 
	 * IPport: 5060 
	 * Dynamic: no
	 * Natsupport: no 
	 * VideoSupport: no 
	 * ACL: no 
	 * Status: OK (318 ms)
	 * RealtimeDevice: no
	 */
	private void processPeerEntry(AsteriskEvent event) {
		String objectName = event.getValue(AMIField.OBJECT_NAME);
		String status = event.getValue(AMIField.STATUS);
		SipPeer peer = pbx.getPeer(objectName);
		if(peer != null){
			String peerStatus = SipPeer.UNREGISTERED;
			if(status.trim().substring(0, 2).equalsIgnoreCase("ok")){
				peerStatus = SipPeer.REGISTERED;
				peer.setStatus(status.substring(4, status.length()-1));
				peer.setIpAddress(event.getValue(AMIField.IP_ADDRESS));
				peer.setIpPort(event.getValue(AMIField.IP_PORT));
				peer.setObjectName(event.getValue(Fields.ObjectName));
			} else if (peer.isLocal()){
				peerStatus = SipPeer.REGISTERED;
				peer.setStatus("1 ms");
			}
			if (!peer.getPeerStatus().equals(peerStatus)) {
				peer.setPeerStatus(peerStatus);
				this.notifyPeerRegister(peer);
			} else {
				notifyPeerUpdate(peer);
			}
		} else {
//			logger.warning("Sip peer not found: "+event.toString());
		}
	}

	/**
	 * Event: PeerStatus Privilege: system,all
	 * PeerStatus:Registered|Unregistered|Reachable|Unreachable Peer: SIP/1002
	 * 
	 * @param event
	 */
	private void processPeerStatus(AsteriskEvent event) {
		String peerName = event.getValue(AMIField.PEER).substring(4);
		// The peer is not belong to my monitored peers, I ignore it
		SipPeer peer = pbx.getPeer(peerName);
		if (peer == null) {
			return;
		}

		// No need to process reachable/unreachable
		String peerStatus = event.getValue(AMIField.PEER_STATUS);
		if (peerStatus.equals(SipPeer.UNREACHABLE))
			peerStatus = SipPeer.UNREGISTERED;
		else if (peerStatus.equals(SipPeer.REACHABLE)){
			peerStatus = SipPeer.REGISTERED;
			peer.setStatus(event.getValue("Time")+" ms");
			notifyPeerUpdate(peer);
		}

		if (peerStatus.equalsIgnoreCase(SipPeer.REGISTERED)
				|| peerStatus.equalsIgnoreCase(SipPeer.UNREGISTERED)) {
			if(peerStatus.equalsIgnoreCase(SipPeer.UNREGISTERED)){
				peer.setStatus("-1");
				notifyPeerUpdate(peer);
			}
			if (!peer.getPeerStatus().equals(peerStatus)) {
				peer.setPeerStatus(peerStatus);
				try {
					AsteriskResponse showPeerRes = sipShowPeer(peer.getExten());
					peer.setSipUseragent(showPeerRes.getParameter("SIP-Useragent"));
					peer.setRegContact(showPeerRes.getParameter("Reg-Contact "));
					peer.setIpAddress(showPeerRes.getParameter("Address-IP"));
					if(peerStatus.equalsIgnoreCase(SipPeer.REGISTERED) 
							&& peer.getIpAddress() != null 
							&& !peer.getIpAddress().equals("")){
						excutor.execute(new CheckRegisterIPCountryTask(peer.getIpAddress(), peer.getPbx(), peer.getExten()));						
					}
				} catch (Exception e) {
					logger.warning("Get sip peer SIP-Useragent and Reg-Contact failed. \r\n"+ e);
				}
				this.notifyPeerRegister(peer);
			}else{
				if(peerStatus.equalsIgnoreCase(SipPeer.REGISTERED)
						&& peer.getSipUseragent().equals("")){
					try {
						AsteriskResponse showPeerRes = sipShowPeer(peer.getExten());
						peer.setSipUseragent(showPeerRes.getParameter("SIP-Useragent"));
						peer.setRegContact(showPeerRes.getParameter("Reg-Contact "));
						peer.setIpAddress(showPeerRes.getParameter("Address-IP"));
						if(peer.getIpAddress() != null && !peer.getIpAddress().equals("")){
							excutor.execute(new CheckRegisterIPCountryTask(peer.getIpAddress(), peer.getPbx(), peer.getExten()));
						}
					} catch (Exception e) {
						logger.warning("Get sip peer SIP-Useragent and Reg-Contact failed. \r\n"+ e);
					}
				}
			}
		}
	}

	/**
	 * EventName:Newstate Privileges:call,all Timestamp: 1244654048.354211
	 * CallerIDName:device State: Down|Ring|Ringing|Up Channel:SIP/1002-0a0f6610
	 * Uniqueid:1201326830.19 CallerID:1002
	 * 
	 * @param event
	 */
	private void processNewstate(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
		if (channelName.trim().equalsIgnoreCase(""))
			return;
		if (channelName.startsWith("Local"))
			return;
		channelName = getFormattedChannelName(channelName);
		if (!pbx.hasChannel(channelName)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}

		String callerID = event.getValue(AMIField.CALLERID);
		String callerIDName = event.getValue(AMIField.CALLERIDNAME);
		String state = event.getValue(AMIField.STATE);
		if (!state.equals(Fields.Up) && !state.equals(Fields.Down)
				&& !state.equals(Fields.Ring) && !state.equals(Fields.Ringing))
			return;
		String uniqueid = event.getValue(AMIField.UNIQUEID);

		C5Channel channel = cacheChannel(channelName, callerID, callerIDName,
				uniqueid);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channel.setTimestamp(timestamp);

		// the prestate is ringing(that means we have created a ringing event in
		// agentcalled event), omit this ringing event.
		if (state.equalsIgnoreCase(Fields.Ringing)
				&& channel.getState().equalsIgnoreCase(Fields.Ringing)) {
			if (channel.getLinkedChannel() != null) {
				channel.setChannelType(channel.getLinkedChannel()
						.getChannelType());
				channel.setFromCid(channel.getLinkedChannel().getFromCid());
				channel.setFromDid(channel.getLinkedChannel().getFromDid());
			}
			return;
		}

		// Some softphone dose not send 180 to asterisk, so there is no Ringing
		// state before Up, we add it for our client.
		if (state.equalsIgnoreCase(Fields.Up)
				&& channel.getState().equalsIgnoreCase(Fields.Down)) {
			if (channel.getSipPeer() != null && channel.getSipPeer().getUser() != null
					&& (channel.getSipPeer().getUser().getStatus().equalsIgnoreCase(
							SipPeer.OUTBOUND_CALL)
							|| channel.getSipPeer().getUser().getStatus()
									.equalsIgnoreCase(SipPeer.INBOUND_CALL) || channel
							.getSipPeer().getUser().getStatus().equalsIgnoreCase(
									SipPeer.LISTENNING))) {
				channel.setState(Fields.Ring);
				channel.setRingtime(timestamp);
			} else {
				channel.setState(Fields.Ringing);
				channel.setRingtime(timestamp);
				if (channel.getLinkedChannel() != null) {
					channel.setChannelType(channel.getLinkedChannel()
							.getChannelType());
					channel.setFromCid(channel.getLinkedChannel().getFromCid());
					channel.setFromDid(channel.getLinkedChannel().getFromDid());
				} else {
					channel.setState(Fields.Ring);
				}
			}
			notifyChannelStatusChanged(channel);
		}
		// When it's ringing and the peer's c5status is dial, we should treat it
		// as ring.
		// And we should set it's callidnum
		else if (state.equalsIgnoreCase(Fields.Ringing)) {
			channel.addVar("RealState", Fields.Ringing);
			channel.addC5Var("RealState", Fields.Ringing);
			if(channel.getChannelType().equals(Fields.transfer)){
				SipPeer peer = channel.getSipPeer();
				if(peer != null && peer.getOriginateChannel() != null){
					C5Channel mainChannel = pbx.getChannel(peer.getOriginateChannel());
					if(mainChannel != null && mainChannel.getCall()!= null){
						mainChannel.getCall().setThirdChannel(channel);
					}
				}
			} else {
				channel.setRingtime(timestamp);
				/**
				 * This call is generated by Originate command, we should set the
				 * Ringing state to Ring.
				 */
				if (channel.getLinkedChannel() == null) {
					state = Fields.Ring;
				} else {
					channel.setChannelType(channel.getLinkedChannel()
							.getChannelType());
					channel.setFromCid(channel.getLinkedChannel().getFromCid());
					channel.setFromDid(channel.getLinkedChannel().getFromDid());
					sendShanxin(channel, Fields.Ringing);
				}
			}
			
		} else if (state.equalsIgnoreCase(Fields.Ring)) {
			channel.setRingtime(timestamp);
		}
		// All new peer's calls should come from context P00000000XXX,
		// we will send this ring message to listeners when it's channel
		// goes into this context. So we omit it here.
		// So as the normal call from outbound.
		if (state.equalsIgnoreCase(Fields.Ring)
				|| state.equalsIgnoreCase(Fields.Up)) {
			if (channel.getChannelType().equals(Fields.none)) {
				channel.setState(state);
				return;
			}
		}
		channel.setState(state);
		if(channel.getChannelType().equals(Fields.ThreeWayCall)){
			channel.setChannelType(Fields.inner);
			notifyChannelStatusChanged(channel);
			channel.setState(Fields.Link);
		}
		notifyChannelStatusChanged(channel);
	}

	private void notifyPeerRegister(SipPeer peer) {
		if (peer == null)
			return;
		C5Event event = peer.getStateEvent();
		try {
			if (peer.getPeerStatus().equalsIgnoreCase(SipPeer.REGISTERED))
				CallListener.getInstance().peerRegister(peer.getExten(), event);
			else
				CallListener.getInstance().peerUnregister(peer.getExten(),
						event);
		} catch (Exception e) {
			logger.log(Level.WARNING, "", e);
		}
	}
	
	private void notifyPeerUpdate(SipPeer peer) {
		if (peer == null)
			return;
		C5Event event = peer.getStateEvent();
		try {
			if (peer.getPeerStatus().equalsIgnoreCase(SipPeer.REGISTERED))
				CallListener.getInstance().peerUpdate(peer.getExten(), event);
		} catch (Exception e) {
			logger.log(Level.WARNING, "", e);
		}
	}

	/**
	 * Notify peer listeners with channel status.
	 * 
	 * @param channel
	 *            if channel is null, this method will do nothing
	 */
	public void notifyChannelStatusChanged(C5Channel channel) {
//		System.out.println(channel.getAllStatusString().replaceAll("\"", "").replaceAll(",", "\r\n")+"\r\n");
		if (channel == null)
			return;
		if (channel.getAccount() == null)
			return;
		
		CallCounter.count(pbx, channel);
		
		if(channel.getCall() != null){
			C5Event event = new C5Event(Fields.ChannelStatus);
			event.addParameter(Fields.Channel, channel);
			channel.getCall().handleEvent(event);
		} else {
			CallListener.getInstance().channelStatusChanged(channel);
		}
	}

	/**
	 * terminate threads
	 */
	private void stopRunning() {
		keepRunning = false;
		synchronized (eventQueue) {
			eventQueue.notifyAll();
		}
		excutor.shutdownNow();
	}

	/**
	 * Terminate and deallocate objects
	 */
	public void destruct() {
		stopRunning();

		pbx.removeAllChannels();
		pbx = null;
		newextenHandler.close();
		newextenHandler = null;
		eventQueue.clear();
		eventQueue = null;
		unlinkEvents.clear();
		tempChannel.clear();
		CallCounter.linkedChannel.clear();
	}

	public void notifyChannelPathChanged(NewExtenEvent event, C5Channel channel) {
		if (event == null)
			return;
		C5Event event1 = new C5Event(Fields.Newexten);
		event1.setValues(event.getParameters());
		event1.addParameter(Fields.Account, channel.getAccount());
		event1.addParameter(Fields.PBX, pbx.getPbx());
		if(channel.getCall() != null){
			channel.getCall().handleEvent(event1);
		} else 
			CallListener.getInstance().channelNewExten(channel.getAccount(), event);
	}

	public void processResponse(AsteriskResponse response) {
		// logger.fine("Process response: \r\n"+response.toString());
		
	}

	public void querySIPPeerStatus() throws CommunicationException, IOException {
		String actionID = Utils.getSynActionID("sippeers");
		AMICore.getInstance().getAMIClient(id).sendAction(
				new SIPPeers(actionID));
	}
	
	public AsteriskResponse sipShowPeer(String exten) throws CommunicationException, IOException {
		String actionID = Utils.getSynActionID("sippeers");
		return AMICore.getInstance().getAMIClient(id).sendSynchronousAction(
				new SIPShowPeer(exten, actionID));
	}
	
	public void queryMailboxStatus(String mailbox) throws Exception {
		AMICore.getInstance().getAMIClient(id)
				.sendAction(
						new MailboxCount(mailbox, Utils
								.getSynActionID("mailboxstate")));
	}

	public void queryQueueStatus() throws CommunicationException {
		AMICore.getInstance().getAMIClient(id).sendSynchronousAction(
				new QueueStatus(Utils.getSynActionID("queuestatus")));
	}

	private String getExtenFromChannelName(String channelName) {
		String peerName = "";
		try {
			if (channelName.indexOf('-') != -1)
				peerName = channelName.substring(channelName.indexOf('/') + 1,
						channelName.indexOf('-'));
			else
				peerName = channelName;
		} catch (Exception e) {
			logger.log(Level.WARNING, "", e);
		}
		return peerName;
	}

	private String getFormattedChannelName(String channelName) {
		if (channelName.endsWith(">"))
			channelName = channelName.substring(0, channelName.indexOf('<'));
		channelName = channelName.replaceAll("AsyncGoto/", "");
		channelName.replaceAll("sip", "SIP");
		return channelName;
	}

	public void connectionClosed() {
		// In this method we need to close all channel, and set all peer to
		// unregister, clear queue and parked calls

		// 1.close channel
		Iterator<C5Channel> it = pbx.getChannels().values().iterator();
		while (it.hasNext()) {
			C5Channel channel = it.next();
			channel.setLinked(false);
			channel.setState(Fields.Hangup);
			channel.setTimestamp(Utils.getCurrentTimestamp());
			notifyChannelStatusChanged(channel);
		}
		try {
			List<String> accounts = RuntimeData.getInstance().getAccounts(
					pbx.getPbx());
			for (int i = 0; i < accounts.size(); i++) {
				C5Account account = RuntimeData.getInstance().getAccount(
						pbx.getPbx(), accounts.get(i));
				if(account != null)
					account.getCallReport().clearCurrentCall();
			}

		} catch (Exception e){
			logger.log(Level.WARNING, "", e);
		}
		
	}

	public void clear() {
		pbx.clear();
		pbx.removeAllChannels();
		eventQueue.clear();
	}

	public long getHandlerStartTime() {
		return handlerStartTime;
	}

	public void setHandlerStartTime(long handlerStartTime) {
		this.handlerStartTime = handlerStartTime;
	}
	
	//add by pansy 161117
	public void sendShanxin(C5Channel calleeChannel, String event){
		C5Channel callerChannel = calleeChannel.getLinkedChannel();
		SipPeer peer = callerChannel.getSipPeer();
		if(peer!= null){
			User caller = peer.getUser();
			if(caller != null && caller.isSendShanxin()){
				String sxUrl = ASConfig.getInstance().getVar("shanxin.url");
				String sxAction = "sendShanxin";
				String sxAccount = caller.getAccount();
				String sxCid = caller.getLocalNumber();
				if(sxCid == null || sxCid.equals("")){
					logger.info("caller no set LocalNum ,get calleeChannel FromCiD as sxCid");
					sxCid = calleeChannel.getFromCid();
				}
				String sxDid = calleeChannel.getFromDid();
				String sxUserId = caller.getId();
				String sxBillId = callerChannel.getVar("CallSheetID");
				String myurl = sxUrl + "?Action=" + sxAction
						+ "&account=" + sxAccount + "&CID=" + sxCid
						+ "&DID=" + sxDid + "&bill=" + sxBillId
						+ "&userId=" + sxUserId + "&event=" + event;
				if(sxBillId == null || sxBillId.equals("")){
					logger.info("When set sxBillId, CallSheetID is missing, this can never happen!");
					return;
				}
				logger.info("Shanxin get request : " + myurl);
				try {
					HttpProvider.sendGet(myurl);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}else
				logger.info("caller has no permission to send shanxin");
		}else
			logger.info("shanxin callerChannel's sipPeer is null.");
	}
}
