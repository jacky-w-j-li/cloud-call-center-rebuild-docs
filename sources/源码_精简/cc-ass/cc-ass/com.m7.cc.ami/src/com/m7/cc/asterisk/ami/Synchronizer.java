package com.m7.cc.asterisk.ami;

import java.util.HashMap;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.ami.action.AsteriskAction;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.Fields;

/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public class Synchronizer implements ResponseListener, EventListener {

	private SocketServer _internalAWriter = null;
	private HashMap<String, AsteriskAction> _waitingActions = new HashMap<String, AsteriskAction>();
	private HashMap<String, AsteriskAction> _waitingEventActions = new HashMap<String, AsteriskAction>();
	private HashMap<String, AsteriskResponse> _waitingResponses = new HashMap<String, AsteriskResponse>();

	private Logger _log = Logger
			.getLogger(Synchronizer.class.getName());
	private boolean _keepRunning = true;

	public Synchronizer(SocketServer anbss) {
		_internalAWriter = anbss;
		_log.fine("Created Asterisk Synchronizer");
	}

	/**
	 * This function synchronizes a command executed against the Asterisk server
	 * 
	 * @param cmd
	 *            AsteriskServerAction which is to be executed on the server
	 * @return AsteriskServerResponse which will contain the server's response
	 *         to the command
	 * @throws CommunicationException
	 *             Thrown if command execution fails or if synchronization fails
	 */
	public AsteriskResponse sendSynchronousCommand(AsteriskAction cmd)
			throws CommunicationException {
		// Our response
		AsteriskResponse serverResponse = null;

		// NOTE: We have sent the command, we need to sleep this thread until we
		// recieve a response
		synchronized (cmd) {
			// add the command to the waiting command hash map
			_waitingActions.put(cmd.getActionID(), cmd);
			try {
				// send the command to the server
				_internalAWriter.sendCommand(cmd.getCommandString());
				cmd.wait(30000);
				if (!_keepRunning)
					throw new CommunicationException(
							"Syncheronizer stopped: "+cmd.getCommandString());
				if (!_waitingResponses.containsKey(cmd.getActionID())) {
					_waitingActions.clear();
					throw new CommunicationException(
							"Send action timeout: "+cmd.getCommandString());
				}
			} catch (InterruptedException e) {
				_log.fine("sendSynchronousCommand:  Synchronizing wait interrupted, failing."
								+ e.getMessage());
				throw new CommunicationException(
						"Synchronizing wait interrupted, failing."
								+ e.getMessage());
			}
			serverResponse = (AsteriskResponse) _waitingResponses.remove(cmd
					.getActionID());
		}

		return serverResponse;
	}
	
	public AsteriskResponse sendSynOriginate(AsteriskAction cmd)
			throws CommunicationException {
		// Our response
		AsteriskResponse serverResponse = null;

		// NOTE: We have sent the command, we need to sleep this thread until we
		// recieve a response
		synchronized (cmd) {
			// add the command to the waiting command hash map
			_waitingEventActions.put(cmd.getActionID(), cmd);
			try {
				// send the command to the server
				_internalAWriter.sendCommand(cmd.getCommandString());
				cmd.wait(120000);
				if (!_keepRunning)
					throw new CommunicationException("Syncheronizer stopped: "
							+ cmd.getCommandString());
				if (!_waitingResponses.containsKey(cmd.getActionID())) {
					_waitingEventActions.clear();
					throw new CommunicationException("Send action timeout: "
							+ cmd.getCommandString());
				}
			} catch (InterruptedException e) {
				_log
						.fine("sendSynchronousCommand:  Synchronizing wait interrupted, failing."
								+ e.getMessage());
				throw new CommunicationException(
						"Synchronizing wait interrupted, failing."
								+ e.getMessage());
			}
			serverResponse = (AsteriskResponse) _waitingResponses.remove(cmd
					.getActionID());
		}

		return serverResponse;
	}

	public void processResponse(AsteriskResponse response) {
		if (!_waitingActions.containsKey(response.getActionID()))
			return;
		// Get the action that is waiting for a response
		AsteriskAction target = (AsteriskAction) _waitingActions
				.remove(response.getActionID());
		// critical section to avoid multiple pre-emption
		synchronized (target) {
			_waitingResponses.put(target.getActionID(), response);
			target.notifyAll();
		}
	}

	@Override
	public void connectionClosed() {
		// TODO Auto-generated method stub
		
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
	@Override
	public void processEvent(AsteriskEvent event) {
		try{
			if (event.getEventName().equalsIgnoreCase(Fields.OriginateResponse)){
				if (!_waitingEventActions.containsKey(event.getValue(Fields.ActionID)))
					return;
				// Get the action that is waiting for a response
				AsteriskAction target = (AsteriskAction) _waitingEventActions
						.remove(event.getValue(Fields.ActionID));
				// critical section to avoid multiple pre-emption
				synchronized (target) {
					AsteriskResponse response = new AsteriskResponse();
					response.putParameters(event.getParameters());
					_waitingResponses.put(target.getActionID(), response);
					target.notifyAll();
				}
			}
		} catch (Throwable e) {
			_log.log(Level.WARNING, "", e);
		}
	}
	
	/**
	 * This function readies this class for garbage collection
	 */
	public void destruct() {
		_internalAWriter = null;
		_keepRunning = false;
		if(_waitingActions != null){
			Iterator<String> i = _waitingActions.keySet().iterator();
			while (i.hasNext()) {
				try{
					_waitingActions.get(i.next()).notifyAll();
				}catch(Exception e){
					
				}
			}
			_waitingActions.clear();
			_waitingActions = null;
		}
		
		if(_waitingEventActions != null){
			Iterator<String> i = _waitingEventActions.keySet().iterator();
			while (i.hasNext()) {
				try{
					_waitingEventActions.get(i.next()).notifyAll();
				}catch(Exception e){
					
				}
			}
			_waitingEventActions.clear();
			_waitingEventActions = null;
		}
		
		
		_log = null;
		if(_waitingResponses != null){
			_waitingResponses.clear();
			_waitingResponses = null;
		}
	}
}
