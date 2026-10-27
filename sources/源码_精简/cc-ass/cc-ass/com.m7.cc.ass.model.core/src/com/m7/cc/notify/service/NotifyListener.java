package com.m7.cc.notify.service;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Logger;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class NotifyListener {
	
	public static NotifyListener instance;
	
	private static Logger log = Logger.getLogger(NotifyListener.class.getName());
	

	private Hashtable<String, Vector<MessageListener>> messageListeners = 
		new Hashtable<String, Vector<MessageListener>>();

	private NotifyListener(){
		instance = this;
	}
	
	public static NotifyListener getInstance(){
		if (instance == null)
			new NotifyListener();
		return instance;
	}
	
	public void addMessageListener(String userID, MessageListener listener){
		synchronized (messageListeners) {
			Vector<MessageListener> listeners = messageListeners.get(userID);
			if(listeners == null){
				listeners = new Vector<MessageListener>();
				messageListeners.put(userID, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeMessageListener(String userID, MessageListener listener){
		synchronized (messageListeners) {
			Vector<MessageListener> listeners = messageListeners.get(userID);
			if(listeners == null){
				listeners = new Vector<MessageListener>();
				messageListeners.put(userID, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllMessageListeners(){
		synchronized (messageListeners) {
			messageListeners.clear();
		}
	}
	
	public void newMessage(String userID, C5Event event) {
		synchronized (messageListeners) {
			Vector<MessageListener> listeners = messageListeners.get(userID);
			if (listeners != null) {
				for (int i = 0; i < listeners.size(); i++)
					listeners.get(i).newMessage(event);
			}
		}
	}
	/**
	 * the method send message to softPhone.
	 * @param eventType
	 * @param userId
	 * @param account
	 * @param pbx
	 * @param data
	 */
	public void sendToSoftPhoneMessage(String eventType, String userId,
			String account, String pbx, Map<String, String> data) {

		C5Event message = new C5Event(eventType);
		message.addParameter(Fields.Account, account);
		message.addParameter(Fields.PBX, pbx);
		message.addParameter(Fields.UserID, userId);
		message.getParameters().putAll(data);
		// for(Map.Entry<String, String> mapEntry : data.entrySet()) {
		// if(mapEntry.getKey() != null && mapEntry.getValue()!=null)
		// message.addParameter(mapEntry.getKey().toString(),
		// mapEntry.getValue().toString());
		// }
		newMessage(userId, message);
	}
	
	public void sendToSoftPhoneMessage(String eventType, String userId,
			String account, String pbx) {
		sendToSoftPhoneMessage(eventType, userId, account, pbx,
				new HashMap<String, String>());
	}
}
