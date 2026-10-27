package com.m7.cc.ass.model;

import java.util.Hashtable;
import java.util.Iterator;

import com.m7.cc.configuration.service.ACSStorage;

public class C5EventInterfaces {

	private Hashtable<String, Hashtable<String, EventInterface>> eventInterfaces;

	// private Hashtable<String, EventInterface> urlHash;

	public C5EventInterfaces() {
		eventInterfaces = new Hashtable<String, Hashtable<String, EventInterface>>();
		// urlHash = new Hashtable<String, EventInterface>();
	}

	public synchronized void setEventInterfaces(
			Hashtable<String, Hashtable<String, EventInterface>> maps) {
		if (null != maps)
			this.eventInterfaces = maps;
	}

	public synchronized boolean addEventInterface(EventInterface eventInterface)
			throws Exception {
		boolean result = false;
		if (null == eventInterface)
			return false;

		String pbx = eventInterface.getPbx();
		String accountId = eventInterface.getAccountID();
		if (eventInterfaces.containsKey(accountId)) {
			Hashtable<String, EventInterface> theOne = eventInterfaces
					.get(accountId);
			
			Iterator<String> iterator = theOne.keySet().iterator();
			while (iterator.hasNext()) {
				String key = iterator.next();
				if (!key.equals(eventInterface.getKey())) {
					if (eventInterface.getConcreteType().equals(
							theOne.get(key).getConcreteType())) {
						return false;	
					}
				}
				else
					return false;
			}
			
			theOne.put(eventInterface.getKey(), eventInterface);
		} else {
			Hashtable<String, EventInterface> newOne = new Hashtable<String, EventInterface>();
			newOne.put(eventInterface.getKey(), eventInterface);
			eventInterfaces.put(accountId, newOne);
		}
		ACSStorage.updateEventInterfaces(pbx, accountId, eventInterfaces);
		result = true;
		return result;
	}

	public synchronized boolean updateEventInterface(
			EventInterface eventInterface) throws Exception {
		boolean result = false;
		if (null == eventInterface)
			return false;
		String pbx = eventInterface.getPbx();
		String accountId = eventInterface.getAccountID();
		if (eventInterfaces.containsKey(accountId)) {
			Hashtable<String, EventInterface> theOne = eventInterfaces
					.get(accountId);
			// if (eventInterface.getKey())
			Iterator<String> iterator = theOne.keySet().iterator();
			while (iterator.hasNext()) {
				String key = iterator.next();
				if (!key.equals(eventInterface.getKey())) {
					if (eventInterface.getConcreteType().equals(
							theOne.get(key).getConcreteType())) {
						return false;	
					}
				}
			}
			theOne.put(eventInterface.getKey(), eventInterface);
		} else {
			 Hashtable<String, EventInterface> newOne = new Hashtable<String, EventInterface>(); 
			 newOne.put(eventInterface.getKey(), eventInterface);
			 eventInterfaces.put(accountId, newOne);
		}
		ACSStorage.updateEventInterfaces(pbx, accountId, eventInterfaces);
		result = true;
		return result;
	}

	public synchronized boolean removeEventInterface(String pbx,
			String accountId, String keyUrl) throws Exception {
		boolean result = false;
		if (null == keyUrl || null == accountId || null == pbx)
			return result;
		result = true;
		if (eventInterfaces.containsKey(accountId)) {
			Hashtable<String, EventInterface> theOne = eventInterfaces
					.get(accountId);
			if (theOne.containsKey(keyUrl)) {
				theOne.remove(keyUrl);
				ACSStorage.updateEventInterfaces(pbx, accountId,
						eventInterfaces);
				return true;
			}
		}

		return result;
	}

	public synchronized String getUrl(String accountId, String type) {
		String result = null;
		if (eventInterfaces.containsKey(accountId)) {
			Hashtable<String, EventInterface> theOne = eventInterfaces
					.get(accountId);
			Iterator<String> iterator = theOne.keySet().iterator();
			while (iterator.hasNext()) {
				String theKey = iterator.next();
				String theType = theOne.get(theKey).getConcreteType();
				if (type.equalsIgnoreCase(theType)) {
					result = theOne.get(theKey).getUrl();
					break;
				}
			}

		}
		return result;
	}

	public void clear() {
		this.eventInterfaces.clear();
	}

}
