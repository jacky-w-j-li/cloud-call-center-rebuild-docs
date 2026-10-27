package com.m7.cc.ass.gateway;

import java.util.HashMap;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.EventListener;
import com.m7.cc.asterisk.ami.ResponseListener;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.IceQueue;

public class EventHandler implements EventListener, ResponseListener, Runnable {

	private String id;

	private IceQueue eventQueue;
	private boolean keepRunning = false;
	private NewextenHandler newextenHandler;
	private Vector<AsteriskEvent> unlinkEvents = new Vector<AsteriskEvent>();

	private HashMap<String, GWChannel> channels = new HashMap<String, GWChannel>();

	private final static Logger logger = Logger.getLogger(EventHandler.class
			.getName());

	public EventHandler(String id) {
		this.id = id;

		eventQueue = new IceQueue();
		newextenHandler = new NewextenHandler(this);

		keepRunning = true;

		Thread adThread = new Thread(this, "GateWay Cacher[" + id + "]");
		adThread.setDaemon(true);
		adThread.start();
	}

	@Override
	public void connectionClosed() {
		// TODO Auto-generated method stub

	}

	@Override
	public void processEvent(AsteriskEvent event) {
		synchronized (eventQueue) {
			eventQueue.add(event);
			eventQueue.notifyAll();
		}
	}

	private void filterEvent(AsteriskEvent event) {
		if (event.getEventName() == null) {
			return;
		}

		/**
		 * Every unlink event will be cached before sending to app. When get an
		 * unlink event: 1. If it's been cached, just update it. 2. If not,
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
			_processEvent(event);
		}
	}

	@Override
	public void processResponse(AsteriskResponse response) {
		// TODO Auto-generated method stub

	}

	@Override
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
		// status of channel
		else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_STATUS)) {
			// processNewstate(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_CHANNEL)) {
			processNewChannel(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_CALLERID)) {
			// processNewCallerid(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.NEW_EXTEN)) {
			processNewExten(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.DIAL)) {
//			 processDial(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.HANGUP)) {
			processHangup(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.LINK)) {
			processLink(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.UNLINK)) {
//			processUnlink(event);
		} else if (event.getEventName().equalsIgnoreCase(AMIField.STATUS)) {
			// processStatus(event);
		}

	}

	private void processReload() {

	}
	
	private void processDial(AsteriskEvent event) {
	}

	/**
	 * EventName:Newchannel Privileges:call,all CallerIDNum:1002
	 * CallerIDName:device State:Down Channel:SIP/1002-0a0f6610
	 * Uniqueid:1201326830.19
	 * 
	 * @param event
	 */
	private void processNewChannel(AsteriskEvent event) {
		String channelName = event.getValue(AMIField.CHANNEL);
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
		String state = event.getValue(AMIField.STATE);
		String uniqueid = event.getValue(AMIField.UNIQUEID);

		GWChannel channel = new GWChannel(uniqueid,channelName);
		channels.put(channel.getUniqueid(), channel);
		String timestamp = event.getValue(AMIField.TIMESTAMP);
		channel.setTimestamp(timestamp);
		channel.setChannelStatus(state);
		notifyChannelStatusChanged(channel);
	}

	private void processLink(AsteriskEvent event) {
		String uniqueid1 = event.getValue(AMIField.UNIQUEID1);
		if (!channels.containsKey(uniqueid1)) {
			uniqueid1 = event.getValue(AMIField.UNIQUEID2);
		}
		if (!channels.containsKey(uniqueid1)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}
		String timestamp = event.getValue(AMIField.TIMESTAMP);

		GWChannel channel = channels.get(uniqueid1);
		channel.setTimestamp(timestamp);
		channel.setBeginTime(timestamp);
		channel.setChannelStatus(Fields.Link);
		channel.setLink(true);
		notifyChannelStatusChanged(channel);
	}

	private void processUnlink(AsteriskEvent event) {
		String uniqueid1 = event.getValue(AMIField.UNIQUEID1);
		if (!channels.containsKey(uniqueid1)) {
			uniqueid1 = event.getValue(AMIField.UNIQUEID2);
		}
		if (!channels.containsKey(uniqueid1)) {
			logger.warning("Get channel event which is not cached: \r\n"
					+ event.toString());
			return;
		}
		String timestamp = event.getValue(AMIField.TIMESTAMP);

		GWChannel channel = channels.get(uniqueid1);
		channel.setTimestamp(timestamp);
		channel.setChannelStatus(Fields.Unlink);
		notifyChannelStatusChanged(channel);
	}

	private void processHangup(AsteriskEvent event) {
		String uniqueid = event.getValue(AMIField.UNIQUEID);

		try {
			// remove it from cache
			GWChannel channel = channels.get(uniqueid);
			if (channel == null) {
				channel = new GWChannel(uniqueid);
			}
			String timestamp = event.getValue(AMIField.TIMESTAMP);
			channel.setTimestamp(timestamp);
			channel.setEndTime(timestamp);
			channel.setChannelStatus(Fields.Hangup);

			// remove it from peer
			notifyChannelStatusChanged(channel);
			channel.destruct();
		} catch (Exception e) {
			logger.log(Level.WARNING, "", e);
		}
		channels.remove(uniqueid);
	}

	private void processNewExten(AsteriskEvent event) {
		event.getParameters().put(Fields.Asterisk, id);
		newextenHandler.handleNewexten(event);
	}

//	private String getExtenFromChannelName(String channelName) {
//		String peerName = "";
//		try {
//			if (channelName.indexOf('-') != -1)
//				peerName = channelName.substring(channelName.indexOf('/') + 1,
//						channelName.indexOf('-'));
//			else
//				peerName = channelName;
//		} catch (Exception e) {
//			logger.log(Level.WARNING, "", e);
//		}
//		return peerName;
//	}

	public void notifyChannelStatusChanged(GWChannel channel) {
		// System.out.println(channel.getAllStatusString().replaceAll("\"",
		// "").replaceAll(",", "\r\n")+"\r\n");
		if (channel == null)
			return;
		if (channel.getAccount() == null
				&& !channel.getChannelStatus().equals(Fields.Hangup))
			return;

		GWCallListener.getInstance().channelStatusChanged(channel);
	}

	public void notifyChannelPathChanged(NewExtenEvent event, GWChannel channel) {
		if (event == null)
			return;
		C5Event event1 = new C5Event(Fields.Newexten);
		event1.setValues(event.getParameters());
		event1.addParameter(Fields.Account, channel.getAccount());
		GWCallListener.getInstance().channelNewExten(channel.getAccount(), event);
	}

	public GWChannel getChannel(String uniqueid) {
		return channels.get(uniqueid);
	}
	public HashMap<String, GWChannel> getChannels(){
		synchronized (this.channels) {
			HashMap<String,GWChannel> returnChannels=new HashMap<String,GWChannel>();
			returnChannels.putAll(this.channels);
			return returnChannels;			
		}
	}
	
	public void emptyChannels(){
		synchronized (this.channels) {
			this.channels.clear();
		}
	}

	public void clear() {
		eventQueue.clear();
		unlinkEvents.clear();
	}

	public void close() {
		keepRunning = false;
		clear();
	}

}
