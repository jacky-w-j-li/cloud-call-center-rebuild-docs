package com.m7.cc.ami.service;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.scan.ScanListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.AsteriskSysListener;
import com.m7.cc.asterisk.ami.Dispatcher;
import com.m7.cc.asterisk.ami.EventListener;
import com.m7.cc.asterisk.ami.ResponseListener;
import com.m7.cc.asterisk.ami.SocketServer;
import com.m7.cc.asterisk.ami.Synchronizer;
import com.m7.cc.asterisk.ami.action.AsteriskAction;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Challenge;
import com.m7.cc.asterisk.ami.action.Command;
import com.m7.cc.asterisk.ami.action.Login;
import com.m7.cc.asterisk.ami.action.Ping;
import com.m7.cc.asterisk.ami.action.QueueStatus;
import com.m7.cc.asterisk.ami.action.SIPPeers;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.asterisk.ami.exceptions.ConnectionException;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public class AMIClient{

	private String id;
	
	private String hostname;
	private int portNum;
	private String userName;
	private String secret;

	private boolean connected = false;
	private boolean connecting = false;
	private boolean authenticated = false;
	private boolean disposed = false;

	private boolean pinging = false;

	private Dispatcher dispatcher;
	private Synchronizer _sync;
	private SocketServer _nbSocketServ;
	
	private Thread ping = null;

	private Logger eventLog = null;
	
	private static Logger logger = Logger.getLogger(AMIClient.class
			.getName());

	/**
	 * Create a new server object.
	 * 
	 * @param hostname
	 *            hostname of the Asterisk server
	 * @param portNum
	 *            port used to connect to management server (see manager.conf)
	 */
	public AMIClient(String id, String hostname, int portNum) {
		logger.fine("Connecting to " +id+" "+ hostname + ":" + portNum + ".");
		this.id = id;
		this.hostname = hostname;
		this.portNum = portNum;
		eventLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				id, "ALL", false);
		eventLog.setUseParentHandlers(false);
		dispatcher = new Dispatcher(id, eventLog);
	}

	public String getId() {
		return id;
	}

	/**
	 * This function will cause the socket connection to the server to be
	 * established. It is suggested you use login, since authentication is
	 * required to preform most functions.
	 * @throws IOException 
	 */
	private void connect() throws ConnectionException, IOException {
/**
 *  Removed 2010-05-24
 *  in order to recover reconnectiong to Asterisk bug
 *  
 */
//		if(dispatcher != null){
//			dispatcher.destruct();
//			dispatcher = null;
//		}
		if(_sync != null){
			_sync.destruct();
			_sync = null;
		}
		if(_nbSocketServ != null){
			_nbSocketServ.destruct();
			_nbSocketServ = null;
		}
		logger.info("Connecting to the Asterisk server.");
		_nbSocketServ = new SocketServer(this.hostname, this.portNum);

		_sync = new Synchronizer(_nbSocketServ);
		dispatcher.addResponseObserver(_sync);
		dispatcher.addEventObserver(_sync, 255);
		_nbSocketServ.addObserver(dispatcher);

		this.connected = true;
		this.authenticated = false;
		logger.info("Connectiion established with " + hostname + ":" + portNum
				+ ".");
	}

	/**
	 * This function will attempt to authenticate with the Asterisk server. It
	 * will connect to the server if this object is not already connected.
	 * 
	 * @param username
	 *            Asterisk manager user name (see manager.conf)
	 * @param secret
	 *            Asterisk manager password (see manager.conf)
	 * @return true if log on was successful, false for anything else.
	 * @throws IOException 
	 */
	public boolean login(String username, String secret)
			throws ConnectionException, IOException {
		
		if(authenticated)
			return true;
		
		this.userName = username;
		this.secret = secret;
		
		connect();
		
		// check if connection worked
		if (isConnected()) {
			String challenge;
			String tSecret;
			
			logger.info("Login to Asterisk AMI......");
			Challenge challengeReq = new Challenge("MD5", Utils
					.getSynActionID("challenge"));
			try {
				challenge = _sync.sendSynchronousCommand(challengeReq)
						.toString();
				// The chanllenge should not contain \r\n
				challenge = challenge.substring(
						challenge.indexOf("Challenge: ") + 11).replaceAll(
						AMIField.END_LINE, "");

				MessageDigest messDig = MessageDigest.getInstance("MD5");
				messDig.update(challenge.getBytes());
				messDig.update(secret.getBytes());
				byte[] passwordDigest = messDig.digest();
				tSecret = byteArrayToHexString(passwordDigest);
			} catch (CommunicationException e) {
				logger.log(Level.WARNING, "Failed to send login action.", e);
				return false;
			} catch (NoSuchAlgorithmException e) {
				logger.log(Level.WARNING, "Failed to send login action.", e);
				return false;

			}
			Login ac = new Login(username, "MD5", tSecret, Utils
					.getSynActionID("login"));
			logger.info("Sending credentials for authentication.");
			try {
				this.authenticated = _sync.sendSynchronousCommand(ac)
						.isSuccessful();
			} catch (CommunicationException e) {
				logger.warning("Failed to send login action.");
				return false;
			}
			if(!authenticated)
				return false;
			ping();
		
			return this.authenticated;
		} else {
			logger.info("Unable to proceed because connection attempt failed.");
			return false;
		}
	}
	
	/**
	 * This function will execute a CLI command on the Asterisk server. This is
	 * a synchronous action and you will receive response after this call blocks
	 * for execution.
	 * 
	 * @param cmd
	 *            the command you would like to run on the server. (i.e. "sip
	 *            show users")
	 * @return A string response received from the server.
	 */
	public String sendCLICmd(String cmd) throws SecurityException,
			CommunicationException {
		if (isAuthenticated()) {
			Command ac = new Command(cmd, Utils.getSynActionID("command"));
			eventLog.info(ac.getCommandString());
			return _sync.sendSynchronousCommand(ac).toString();
		} else {
			throw new SecurityException(
					"Please login before attempting to access admin functionality.");
		}
	}

	/**
	 * Send an action to the asterisk server
	 * 
	 * @param target
	 *            the asterisk server action to send
	 * @return the response object from the server
	 * @throws CommunicationException
	 *             thrown if communication between the server and veil fails
	 */
	public AsteriskResponse sendSynchronousAction(AsteriskAction target)
			throws CommunicationException {
		if(!authenticated || !connected)
			throw new CommunicationException("Asterisk server is not ready");
		if(!target.getActionName().equalsIgnoreCase(Fields.Ping))
			eventLog.info(target.getCommandString());
		return _sync.sendSynchronousCommand(target);
	}
	
	public AsteriskResponse sendSynOriginate(AsteriskAction action) throws CommunicationException {
		if(!authenticated || !connected)
			throw new CommunicationException("Asterisk server is not ready");
		if(!action.getActionName().equalsIgnoreCase(Fields.Ping))
			eventLog.info(action.getCommandString());
		return _sync.sendSynOriginate(action);
	}

	public void sendAction(AsteriskAction target) throws IOException {
		if(!connected)
			throw new IOException("Asterisk is not available");
		if(!target.getActionName().equalsIgnoreCase(Fields.Ping))
			eventLog.info(target.getCommandString());
		if(!_nbSocketServ.sendCommand(target.getCommandString())){
			throw new IOException("NB Server is not available");
		}
	}

	/**
	 * This function will stop the server.
	 */
	public void stopServer() throws SecurityException,
			CommunicationException {
		logger.fine("Stopping server.");
		if (isAuthenticated()) {
			// this command should stop the server remotely
			sendCLICmd("stop now");
			logger.finer("Stopping command issued.");
		} else {
			logger
					.fine("Please login before attempting to access admin functionality.");
		}
	}

	/**
	 * @return Returns the connected.
	 */
	public boolean isConnected() {
		return connected;
	}

	/**
	 * @return Returns the authenticated.
	 */
	public boolean isAuthenticated() {
		return authenticated;
	}
	
	public void clear(){
		connected = false;
		authenticated = false;
		if(ping != null)
			ping.interrupt();

		if (_sync != null) {
			dispatcher.deleteResponseObserver(_sync);
			dispatcher.deleteEventObservers();
			_sync.destruct();
		}

		if (_nbSocketServ != null) {
			_nbSocketServ.destruct();
		}

		this._nbSocketServ = null;
		this._sync = null;
	}

	/**
	 * Explicit deallocation method which will remove all threads and sub
	 * objects
	 */
	public void destruct() {
		logger.info("Destruct AMIClient: "+id);
		disposed = true;
		connected = false;
		authenticated = false;
		if(ping != null)
			ping.interrupt();

		if (_sync != null) {
			_sync.destruct();
		}
		
		if (dispatcher != null) {
			dispatcher.destruct();
		}

		if (_nbSocketServ != null) {
			_nbSocketServ.destruct();
		}
		
		this.dispatcher = null;
		this._nbSocketServ = null;
		this._sync = null;
	}

	/**
	 * This function convers a byte value to a string
	 * 
	 * @param aToConv
	 *            byte array to convert
	 * @return the equivalent string of char values
	 */
	static String byteArrayToHexString(byte[] aToConv) {
		StringBuffer buf;
		byte cur;

		if (aToConv == null || aToConv.length == 0) {
			return null;
		}
		buf = new StringBuffer();
		for (int i = 0; i < aToConv.length; i++) {
			cur = aToConv[i];
			int curHi = (cur & 0xF0) >>> 4; // High bits
			int curLo = cur & 0xF; // Low bits
			buf.append(intToHexChar(curHi));
			buf.append(intToHexChar(curLo));
		}
		return buf.toString();
	}
	
	public synchronized void reloadQueue(){
		if(!authenticated)
			return;
		try {
			this.sendCLICmd("module reload app_queue.so");
		} catch (Exception e) {
			logger.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void reloadSip(){
		if(!authenticated)
			return;
		try {
			String result = this.sendCLICmd("sip reload");
			if(result.indexOf("Previous SIP reload not yet done") != -1)
				logger.warning("reload failed: "+result);
		} catch (Exception e) {
			
		}
	}
	
	public synchronized void reloadAel(){
		if(!authenticated)
			return;
		try {
			String result = this.sendCLICmd("ael reload");
			if(result.indexOf("Previous SIP reload not yet done") != -1)
				logger.warning("reload failed: "+result);
		} catch (Exception e) {
			
		}
	}
	
	public synchronized void reload(){
		if(!authenticated)
			return;
		try {
			String result = this.sendCLICmd("module reload");
			if(result.indexOf("Previous SIP reload not yet done") != -1)
				logger.warning("reload failed: "+result);
		} catch (Exception e) {
			
		}
	}
	
	public void ping(){
		if(pinging)
			return;
		ping = new Thread("Ping"){
			public void run(){
				int a = 0;
				while(connected){
					try {
						pinging = true;
						sendAction(new Ping(Utils
								.getSynActionID("ping")));
						a++;
						/**
						 * 1. every 5 minutes we reload queue model to remove invalid members
						 * 2. every 3 minutes we query sip peers, to update state of all peers
						 */
						if(a > 60){
							a = 0;
							AMICore.getInstance().getAMIClient(id).reloadQueue();
						}else if(a == 36){
							String isScanQueue = ASConfig.getInstance().getVar(ASConfig.QueueScan);
							if(isScanQueue == null || isScanQueue.equals("1")){
								ScanListener.getInstance().queueMemberScan(id);
								AMICore.getInstance().getAMIClient(id).sendAction(
										new QueueStatus(Utils.getSynActionID("queuestatus_ping")));
							}
						} else if(a == 30){
							AMICore.getInstance().getAMIClient(id).sendAction(
									new SIPPeers(Utils.getSynActionID("sippeers")));
						}
						sleep(5000);
					} catch (Exception e) {
						logger.log(Level.WARNING, "Send ping to Asterisk failed", e);
						pinging = false;
						return;
					}
				}
			}
		};
		ping.setDaemon(false);
		ping.start();
	}

	/**
	 * Convert int to hex. This function converts the lowest four bits of an int
	 * to a hex value
	 * 
	 * @param toConv
	 *            int to convert
	 * @return char hex value
	 */
	static public char intToHexChar(int toConv) {
		return hex_chars[toConv % 16];
	}

	static final char[] hex_chars = { '0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

	public Dispatcher getDispatcher() {
		return dispatcher;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getSecret() {
		return secret;
	}

	public void setSecret(String secret) {
		this.secret = secret;
	}
	
	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public int getPortNum() {
		return portNum;
	}

	public void setPortNum(int portNum) {
		this.portNum = portNum;
	}
	
	public void addEventListener(EventListener el, int type){
		dispatcher.addEventObserver(el, type);
	}
	
	public void addResponseListener(ResponseListener rl){
		dispatcher.addResponseObserver(rl);
	}
	
	public void addAsteriskSysListener(AsteriskSysListener asl) {
		dispatcher.addAsteriskSysListener(asl);
	}
	
	public void removeAsteriskSysListener(AsteriskSysListener asl) {
		dispatcher.deleteAsteriskSysListener(asl);
	}
	
	public void removeAsteriskSysListeners(){
		dispatcher.deleteAsteriskSysListeners();
	}
	
	public void removeEventListener(EventListener el){
		dispatcher.deleteEventObserver(el);
	}
	
	public void removeAllEventListener(){
		dispatcher.deleteEventObservers();
	}
	
	public void removeResponseListener(ResponseListener rl){
		dispatcher.deleteResponseObserver(rl);
	}
	
	public void removeAllResponseListener(){
		dispatcher.deleteResponseObservers();
	}

	public boolean isConnecting() {
		return connecting;
	}

	public void setConnecting(boolean connecting) {
		this.connecting = connecting;
	}

	public boolean isDisposed() {
		return disposed;
	}
	
	/**
	 * @return
	 */
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.PBX);
		event.addParameter(Fields.PBX, this.id);
		event.addParameter(Fields.Authenticated, this.isAuthenticated());
		event.addParameter(Fields.Connected, this.isAuthenticated());
		event.addParameter(Fields.Password, this.secret);
		event.addParameter(Fields.Host, this.hostname);
		event.addParameter(Fields.Port, this.getPortNum());
		event.addParameter(Fields.User, this.userName);
		return event;
	}

}
