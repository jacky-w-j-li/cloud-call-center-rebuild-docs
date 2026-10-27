package com.m7.cc.asterisk.cdr.client;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.command.PacketListener;
import com.m7.cc.db.oracle.DBProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class CdrConnection implements PacketListener {

	private Thread dataThread;
	private SocketClient socketClient;
	private Thread ping;
	private boolean connected = false;

	private String ip;
	private int port;
	private String user;
	private String password;
	private List<String> pbxs;
	private String pbxName = "";

	private Vector<C5Event> event_buffer = new Vector<C5Event>();
	private DBProvider dbProvider;

	private HashMap<String, C5Action> _waitingActions = new HashMap<String, C5Action>();
	private HashMap<String, C5Response> _waitingResponses = new HashMap<String, C5Response>();

	private Logger eventLog = null;
	private static Logger log = Logger.getLogger(CdrConnection.class.getName());

	public CdrConnection(DBProvider dbProvider, AssCdrConnect connect) {
		this.ip = connect.getIp();
		eventLog = IceLogger.getLogger(CdrClientConfig.getInstance()
				.getLogDir(), connect.getName(), "ALL", false);
		this.pbxName = connect.getName();
		this.port = connect.getPort();
		this.user = connect.getUser();
		this.password = connect.getPassword();
		this.pbxs = connect.getPbxs();
		this.dbProvider = dbProvider;
		ping();
		updateData();
	}

	private void connect() {
		try{
			if(socketClient != null)
				socketClient.destruct();
		} catch (Exception e) {
			
		}
		_waitingActions.clear();

		System.out.println("Connecting to ASS " + pbxName + " " + ip);
		log.info("Connecting to ASS " + pbxName + " " + ip);
		try {
			socketClient = new SocketClient(ip, port, this);
			// connected = true;
		} catch (IOException e) {
			log.log(Level.WARNING, "Connect to ASS failed: " + pbxName, e);
			return;
		}
		C5Action action = new C5Action(Fields.CdrLogin, Utils
				.getSynActionID("cdrlogin"));
		action.addParameter(Fields.User, user);
		action.addParameter(Fields.Password, password);
		action.addParameter(Fields.PBX, pbxs);
		try {
			C5Response response = sendSynAction(action);
			if (response.isSucceed()) {
				try {
					if (response.getParameterValue(Fields.BeginTime) != null) {
						String startTime = (String) response
								.getParameterValue(Fields.BeginTime);
//						dbProvider.refactLoginData(startTime);
					}
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
				connected = true;
				log.info("Login to " + this.pbxName + " succeed.");
				System.out.println("Login to " + this.pbxName + " succeed.");
			} else {
				log.warning("Login failed: " + response.getMessage());
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Send login failed "+pbxName, e);
		}
	}

	public void ping() {
		ping = new Thread("Ping") {
			public void run() {
				while (true) {
					try {
						if(connected) {
							log.info("Send ping to ass: " + pbxName);
							try {
								sendSynAction(new C5Action(Fields.Ping, Utils
										.getSynActionID("ping")));
								log.info("Get pong from ass: " + pbxName);
								sleep(20000);
							} catch (Throwable e) {
								log.log(Level.WARNING, "Send ping failed "+pbxName, e);
								connected = false;
							}
						} else {
							try {
								log.info("Connecting to ass: "+pbxName);
								connect();
								sleep(5000);
							} catch (Throwable e) {
								log.log(Level.WARNING, "Connect failed "+pbxName, e);
								connected = false;
							}
						}
					} catch (Throwable e) {
						log.log(Level.WARNING, "Ping thread error", e);
					}
				}
			}
		};
		ping.setDaemon(true);
		ping.start();
	}
	
	public void sendAction(C5Action action){
		this.socketClient.sendCommand(action.getJsonString());
	}

	public C5Response sendSynAction(C5Action action) throws Exception {
		// Our response
		C5Response serverResponse = null;

		// NOTE: We have sent the command, we need to sleep this thread until we
		// recieve a response
		synchronized (action) {
			// add the command to the waiting command hash map
			_waitingActions.put(action.getActionID(), action);
			try {
				// send the command to the server
				this.socketClient.sendCommand(action.getJsonString());
				action.wait(10000);
				if (!_waitingResponses.containsKey(action.getActionID())) {
					_waitingActions.clear();
					throw new Exception("Send action timeout: "
							+ action.getJsonString());
				}
			} catch (InterruptedException e) {
				log
						.warning("sendSynchronousCommand:  Synchronizing wait interrupted, failing."
								+ e.getMessage());
				throw new Exception("Synchronizing wait interrupted, failing."
						+ e.getMessage());
			}
			serverResponse = _waitingResponses.remove(action.getActionID());
		}

		return serverResponse;
	}

	public void updateData() {
		dataThread = new Thread("Data thread") {
			public void run() {
				updateCdrToDatabase();
			}
		};
		// dataThread.setDaemon(true);
		dataThread.start();
	}

	public void processDatabaseReconnected() {
		log.info("Reconnected to db, process buffered event");
		synchronized (event_buffer) {
			if (event_buffer.size() > 0) {
				event_buffer.notifyAll();
			}
		}
	}

	public void processClose() {

	}

	public void processAction(C5Action action) {
	}

	public void processEvent(C5Event event) {
		eventLog.info(event.getJsonString());
		event_buffer.add(event);
		this.sendAction(new C5Action("Done", "1"));
	}

	private void updateCdrToDatabase() {
		C5Event event = null;
		while (true) {
			try {
				if (event_buffer.size() > 0)
					event = event_buffer.remove(0);
				else {
					Thread.sleep(500);
				}
				if (event != null) {
					if (event.getEventName().equalsIgnoreCase(
							Fields.PeerCallCdr)) {
						C5PeerCallRecord cdr = new C5PeerCallRecord();
						cdr.setValues(event.getParameters());
						if (cdr.getRefUniqueid() != null) {
							dbProvider.updateRefCallCdr(cdr);
						} else if (cdr.getOpType().equalsIgnoreCase(
								C5CallRecord.insert)) {
							dbProvider.saveToCallSheet(cdr);
						} else if (cdr.getEnd_time() != null){
							dbProvider.updateToCallSheet(cdr);
						}
					} else if (event.getEventName().equalsIgnoreCase(
							Fields.ChannelCdr)) {
						C5ChannelRecord cdr = new C5ChannelRecord();
						cdr.setValues(event.getParameters());
						dbProvider.saveChannelCDR(cdr);
					} else if (event.getEventName().equalsIgnoreCase(
							Fields.PeerCdr)) {
						C5PeerRecord cdr = new C5PeerRecord();
						cdr.setValues(event.getParameters());
						if (cdr.getOpType().equalsIgnoreCase(
								C5CallRecord.insert)) {
//							dbProvider.savePeerRecord(cdr);
						} else {
//							dbProvider.updatePeerRecord(cdr);
						}
					} 
//					else if (event.getEventName().equalsIgnoreCase(
//							Fields.QueueEntryCdr)) {
//						C5QueueEntryRecord cdr = new C5QueueEntryRecord();
//						cdr.setValues(event.getParameters());
//						saved = dbProvider.saveEntryRecord(cdr);
//					} else if (event.getEventName().equalsIgnoreCase(
//							Fields.QueueMemberCdr)) {
//						C5QueueMemberRecord cdr = new C5QueueMemberRecord();
//						cdr.setValues(event.getParameters());
//						saved = dbProvider.saveMemberRecord(cdr);
//					} 
					else if (event.getEventName().equalsIgnoreCase(
							Fields.Investigate)) {
						C5Investigate cdr = new C5Investigate();
						cdr.setValues(event.getParameters());
//						dbProvider.saveInvestigateRecord(cdr);
					} else if (event.getEventName().equalsIgnoreCase(Fields.BatchDialoutCdr)){
						C5BatchDialoutRecord cdr = new C5BatchDialoutRecord();
						cdr.setValues(event.getParameters());
//						dbProvider.saveBatchDialoutRecord(cdr);
					} else {
//						log.warning("Unknow event: " + event.getJsonString());
					}
					event = null;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
	}

	public void processResponse(C5Response response) {
		if (!_waitingActions.containsKey(response.getActionID()))
			return;
		// Get the action that is waiting for a response
		C5Action target = _waitingActions.remove(response.getActionID());
		// critical section to avoid multiple pre-emption
		synchronized (target) {
			_waitingResponses.put(target.getActionID(), response);
			target.notifyAll();
		}
	}

//	private void destruct() {
//		log.warning("Stoping CDR Connection");
//		socketClient.destruct();
//	}
}
