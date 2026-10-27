package com.m7.cc.asterisk.ami;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Vector;
import java.util.logging.Logger;

import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;

/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public class Dispatcher implements DataListener {

	private Vector<EventListener> _allEventListeners = new Vector<EventListener>();

	private HashMap<EventListener, Integer> _allEventListenerMasks = new HashMap<EventListener, Integer>();

	private Vector<ResponseListener> _responseListeners = new Vector<ResponseListener>();
	
	private Vector<AsteriskSysListener> sysListeners = new Vector<AsteriskSysListener>();
	
	private String pbx;
	
	private Logger eventLog;
	
	public Dispatcher(String pbx, Logger eventLog){
		this.pbx = pbx;
		this.eventLog = eventLog;
	}
	
	public void addEventObserver(EventListener eo, int type) {
		if (_allEventListeners == null)
			return;
		if(_allEventListeners.contains(eo))
			return;
		synchronized (_allEventListeners) {
			_allEventListeners.add(eo);
			_allEventListenerMasks.put(eo, new Integer(type));
		}
	}

	public void deleteEventObserver(EventListener eo) {
		if (_allEventListeners == null)
			return;
		synchronized (_allEventListeners) {
			_allEventListeners.remove(eo);
			_allEventListenerMasks.remove(eo);
		}
	}

	public void deleteEventObservers() {
		if (_allEventListeners == null)
			return;
		synchronized (_allEventListeners) {
			_allEventListeners.clear();
			_allEventListenerMasks.clear();
		}
	}

	private void notifyEventObservers(int observerType, AsteriskEvent ase) {
		if (_allEventListeners == null)
			return;
		if (!_allEventListeners.isEmpty()) {
			synchronized (_allEventListeners) {
				Iterator<EventListener> i = _allEventListeners.iterator();
				EventListener curEO;
				int curMask;
				while (i.hasNext()) {
					curEO = i.next();
					curMask = ((Integer) _allEventListenerMasks.get(curEO))
							.intValue();
					if ((curMask & observerType) != 0) {
						if(ase.getEventName().equals(AMIField.RELOAD)){
							synchronized (sysListeners) {
								try{
									Iterator<AsteriskSysListener> it = sysListeners.iterator();
									while (i.hasNext()) {
										it.next().asteriskReload(pbx);
									}
								} catch (Exception e){
									
								}
							}
						}
						curEO.processEvent(ase);
					}
				}
			}
		}
	}

	public void deleteResponseObserver(ResponseListener ro) {
		if (_responseListeners == null)
			return;
		synchronized (_responseListeners) {
			_responseListeners.remove(ro);
		}
	}

	public void deleteResponseObservers() {
		if (_responseListeners == null)
			return;
		synchronized (_responseListeners) {
			_responseListeners.removeAllElements();
		}
	}

	private void notifyResponseObservers(AsteriskResponse asr) {
		if (!asr.getParameter(AMIField.RESPONSE).equalsIgnoreCase(
				AMIField.PONG))
			eventLog.fine("Process response: \r\n" + asr.toString());
		if (_responseListeners == null)
			return;
		synchronized (_responseListeners) {
			Iterator<ResponseListener> i = _responseListeners.iterator();
			while (i.hasNext()) {
				i.next().processResponse(asr);
			}
		}
	}

	public void addResponseObserver(ResponseListener ro) {
		if (_responseListeners == null)
			return;
		if(_responseListeners.contains(ro))
			return;
		synchronized (_responseListeners) {
			if (_responseListeners.contains(ro))
				return;
			_responseListeners.add(ro);
		}
	}
	
	public void addAsteriskSysListener(AsteriskSysListener eo) {
		if(sysListeners.contains(eo))
			return;
		synchronized (sysListeners) {
			sysListeners.add(eo);
		}
	}

	public void deleteAsteriskSysListener(AsteriskSysListener eo) {
		synchronized (sysListeners) {
			sysListeners.remove(eo);
		}
	}

	public void deleteAsteriskSysListeners() {
		synchronized (sysListeners) {
			sysListeners.clear();
		}
	}

	public void update(String info) {
		int check;
		while (info != null
				&& (check = info.indexOf(C5Constants.ASTERISK_END_LINE
						+ C5Constants.ASTERISK_END_ACTION)) > -1) {
			String tempMsg = info.substring(0, check + 4);
			if (tempMsg != null
					&& tempMsg
							.startsWith(C5Constants.ASTERISK_DISPATCH_RESPONSE_W_COL)) {
				processResponse(tempMsg);
			} else if (tempMsg != null
					&& tempMsg
							.startsWith(C5Constants.ASTERISK_DISPATCH_EVENT_W_COL)) {
				processEvent(tempMsg);
			} else if (tempMsg != null) {
				int i_resp = tempMsg
						.indexOf(C5Constants.ASTERISK_DISPATCH_RESPONSE_W_COL);
				int i_event = tempMsg
						.indexOf(C5Constants.ASTERISK_DISPATCH_EVENT_W_COL);
				if (i_resp == -1) {
					processEvent(tempMsg);
				} else if (i_event == -1) {
					processResponse(tempMsg);
				} else if (i_resp < i_event) {
					processResponse(tempMsg);
				} else {
					processEvent(tempMsg);
				}
			}
			info = info.substring(check + 4);
		}
	}

	/**
	 * This function processes a response from the asterisk server
	 * 
	 * @param response
	 *            response string
	 */
	private void processResponse(String response) {
		AsteriskResponse asr = new AsteriskResponse(response);
		// pass action response back to observers
		this.notifyResponseObservers(asr);
	}

	/**
	 * This function processes an event from the asterisk server
	 * 
	 * @param event
	 *            event string
	 */
	private void processEvent(String event) {
		AsteriskEvent ase = new AsteriskEvent(event);
		eventLog.finest("Get event: \r\n" + event.toString());
		// pass event on to observers
		String curPrivilege = ase.getPrivilege();

		int curMask = C5Constants.ASTERISK_EVENT_OFF;

		if (curPrivilege == null) {
			curMask = C5Constants.ASTERISK_EVENT_ALL;
		} else {
			// look for each message type and change the mask appropriately
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_SYSTEM) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_SYSTEM;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_CALL) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_LOG;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_LOG) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_CALL;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_VERBOSE) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_VERBOSE;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_COMMAND) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_COMMAND;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_AGENT) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_AGENT;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_USER) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_USER;
			}
			if (curPrivilege.indexOf(C5Constants.ASTERISK_ADMIN_CONFIG) != -1) {
				curMask += C5Constants.ASTERISK_EVENT_CONFIG;
			}
		}
		// send to listeners which are included in the mask
		notifyEventObservers(curMask, ase);
	}

	public void destruct() {
		if(_allEventListeners != null)
			_allEventListeners.clear();
		if(_allEventListenerMasks != null)
			_allEventListenerMasks.clear();
		if(_responseListeners != null)
			_responseListeners.clear();
		_allEventListenerMasks = null;
		_allEventListeners = null;
		_responseListeners = null;
	}

	public void connectionClosed(String message) {
		synchronized (sysListeners) {
			Iterator<AsteriskSysListener> i = sysListeners.iterator();
			while (i.hasNext()) {
				i.next().asteriskDown(pbx);
			}
		}
		synchronized (_allEventListeners) {
			Iterator<EventListener> i = _allEventListeners.iterator();
			while (i.hasNext()) {
				i.next().connectionClosed();
			}
		}
	}
}
