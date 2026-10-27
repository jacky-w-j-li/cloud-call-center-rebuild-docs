package com.m7.cc.asterisk.cdr.client;

import java.io.IOException;
import java.util.HashMap;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.command.PacketListener;
import com.m7.cc.util.Utils;

public class CdrConnection implements PacketListener {

	private Thread dataThread;
	private SocketClient socketClient;
	private Thread ping;
	private boolean pinging = false;
	private boolean connected = false;
	private boolean reconnecting = false;

	private String ip;
	private int port;
	private String user;
	private String password;
	private String pbxName = "";

	private Vector<C5Event> event_buffer = new Vector<C5Event>();
	private DBProvider dbProvider;

	private HashMap<String, C5Action> _waitingActions = new HashMap<String, C5Action>();
	private HashMap<String, C5Response> _waitingResponses = new HashMap<String, C5Response>();

	private Logger eventLog = null;
	private static Logger log = Logger.getLogger(CdrConnection.class.getName());

	public CdrConnection(DBProvider dbProvider, AssCdrConnect connect) {
		this.ip = connect.getIp();
//		eventLog = IceLogger.getLogger(connect.getName(), "ALL", false);
		this.pbxName = connect.getName();
		this.port = connect.getPort();
		this.user = connect.getUser();
		this.password = connect.getPassword();
		this.dbProvider = dbProvider;
		Thread t = new Thread("connecting to " + ip) {
			public void run() {
				while (!connected) {
					reconnecting = true;
					try {
						connect();
						Thread.sleep(5000);
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			}
		};
		t.start();
		updateData();
	}

	private void connect() {
		if (socketClient != null && socketClient.isRunning())
			return;

		_waitingActions.clear();

		System.out.println("Connecting to ASS " + pbxName + " " + ip);
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
		try {
			sendSynAction(action);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void ping() {
		if (pinging)
			return;
		ping = new Thread("Ping") {
			public void run() {
				while (connected) {
					try {
						pinging = true;
						log.info("Send ping to ass: " + pbxName);
						sendSynAction(new C5Action(Fields.Ping, Utils
								.getSynActionID("ping")));
						sleep(20000);
					} catch (Throwable e) {
						pinging = false;
						log.log(Level.WARNING, "Send ping failed: timeout", e);
						processClose();
						break;
					}
				}
				pinging = false;
			}
		};
		ping.setDaemon(true);
		ping.start();
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
		log.warning("Disconnected from ass: " + this.pbxName);
		connected = false;
		// reconnect every 10 seconds
		if (reconnecting)
			return;

		Thread t = new Thread("Connecting to ASS") {
			public void run() {
				while (!connected) {
					try {
						reconnecting = true;
						if (socketClient != null)
							socketClient.destruct();
						socketClient = null;
						log.info("Reconnecting to ass: " + pbxName);
						connect();
						sleep(5000);
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			}
		};
		// t.setDaemon(true);
		t.start();
	}

	public void processAction(C5Action action) {
	}

	public void processEvent(C5Event event) {
		eventLog.info(event.getJsonString());
		event_buffer.add(event);
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
					if (event.getEventName().equalsIgnoreCase("GWChannel")) {
						boolean update = event.getStringValue(
								Fields.ChannelStatus).equals(Fields.Hangup);
						String channelType = event.getStringValue(Fields.ChannelType);
						if (channelType.equals(Fields.dialout)
								|| channelType.equals(Fields.transfer)) {
							if (update) {
								dbProvider.updateToCallSheet(event);
							} else {
								if (!event.getStringValue(Fields.Account)
										.equals("null"))
									dbProvider.saveToCallSheet(event);
							}
						} else if (channelType.equals(Fields.normal)) {
							if(update){
								dbProvider.saveTo400CallSheet(event);
							}
						}
					}
					event = null;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
	}

	public void processResponse(C5Response response) {
		if (response.getActionName().equalsIgnoreCase(Fields.CdrLogin)) {
			if (response.isSucceed()) {
				connected = true;
				reconnecting = false;
				log.info("Login to " + this.pbxName + " succeed.");
				System.out.println("Login to " + this.pbxName + " succeed.");
				ping();
			} else {
				log.warning("Login failed: " + response.getMessage());
				destruct();
			}
		}
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

	private void destruct() {
		log.warning("Stoping CDR Connection");
		socketClient.destruct();
	}
}
