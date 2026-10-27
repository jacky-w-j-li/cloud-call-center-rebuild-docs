package com.m7.cc.ass.server.http;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.HttpExchange;
import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ami.service.AMISystemListener;
import com.m7.cc.ass.call.service.BatchDialoutListener;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.CallReportListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.call.service.PeerListener;
import com.m7.cc.ass.call.service.QueueListener;
import com.m7.cc.ass.call.service.TrunkListener;
import com.m7.cc.ass.call.service.UserListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.C5QueueEntry;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.server.Activator;
import com.m7.cc.ass.server.core.AsteriskStatusServer;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.notify.service.MessageListener;
import com.m7.cc.notify.service.NotifyListener;
import com.m7.cc.util.Utils;

public class C5Session extends C5Connection implements PeerListener,
		ChannelListener, QueueListener, TrunkListener, AMISystemListener,
		UserListener, CallReportListener, BatchDialoutListener, MessageListener {
	private String id;// session id
	private String pbx;
	private String account;
	private String userID;
	private boolean authenticated = false;
	private boolean isMonitor = false;
	private boolean isMonitorUser = false;
	private boolean isListenBatchDialoutEvent = false;
	private static final Logger log = Logger.getLogger(C5Session.class
			.getName());

	private HttpExchange currentExchange;
	public long lastUpdateTime;
	private C5TimeoutTask timeoutTask = new C5TimeoutTask(this);

	// -----------------------------------
	public static final String timeOut = "timeout";
	public static final String kicked = "kicked";

	private User c5user;

	private int timeout = 5000;
	private Object lock = new Object();
	private boolean running = true;
	// listening event
	private boolean isListenning = false;

	private Vector<String> users = new Vector<String>();
	private Vector<String> queues = new Vector<String>();

	private StateQueue stateQueue = new StateQueue("");

	private boolean kiked = false;
	private String kickComments = "";

	/**
	 * This map will cache all kinds of actions from client. We need to discard
	 * retransported action.
	 */
	private HashMap<String, String> actions = new HashMap<String, String>();

	public C5Session() {
		id = Utils.getUniqueid();
	}

	public void parserPacket(HashMap<String, Object> map, HttpExchange exchange)
			throws Exception {
		lastUpdateTime = System.currentTimeMillis();
		String commandType = (String) map.get(Fields.Command);
		if (commandType.equalsIgnoreCase(Fields.Action)) {
			parserAction(map, exchange);
		} else {
			log.warning("Unknow data from :"
					+ exchange.getRemoteAddress().getHostName() + ":"
					+ exchange.getRemoteAddress().getPort());
			throw new Exception("Unknow data from :" + map.toString());
		}
	}

	private void parserAction(HashMap<String, Object> map, HttpExchange exchange)
			throws Exception {
		String actionName = (String) map.get(Fields.Action);
		String actionID = (String) map.get(Fields.ActionID);
		// this is a retrasported action
		if (actions.containsKey(actionName)
				&& actions.get(actionName).equals(actionID)) {
			log.info("Expired action from ["
					+ exchange.getRemoteAddress().getHostName() + "] :\r\n"
					+ map.toString());
			C5HttpHandler.sendOK(new C5Response(actionName, actionID,
					"Expired action", false), exchange);
			return;
		} else {
			actions.put(actionName, actionID);
		}

		if (!authenticated && !actionName.equalsIgnoreCase(Fields.Login)) {
			C5HttpHandler.sendOK(new C5Response(actionName, actionID,
					"Please login at first", false), exchange);
			return;
		} else if (actionName.equalsIgnoreCase(Fields.GetState)) {
			C5Action action = new C5Action(Fields.GetState, actionID);
			action.setValues(map);
			getState(exchange, action);
			return;
		} else if (actionName.equalsIgnoreCase(Fields.Login)) {
			C5Action action = new C5Action(Fields.Login, actionID);
			action.setValues(map);
			processLoginAction(action, exchange);
			return;
		} else if (actionName.equalsIgnoreCase(Fields.Logoff)) {
			C5Action action = new C5Action(Fields.Logoff, actionID);
			if (action.setValues(map))
				processLogoff(action, exchange);
			else
				C5HttpHandler.sendOK(
						new C5Response(action.getActionName(), action
								.getActionID(), "Action parameters error",
								false), exchange);
			return;
		} else if (actionName.equalsIgnoreCase(Fields.ListenBatchDialoutEvent)){
			this.isListenBatchDialoutEvent = true;
			C5HttpHandler.sendOK(new C5Response(actionName, actionID,
					"", true), exchange);
			return;
		} else if(actionName.equalsIgnoreCase(Fields.UnlistenBatchDialoutEvent)){
			this.isListenBatchDialoutEvent = false;
			C5HttpHandler.sendOK(new C5Response(actionName, actionID,
					"", true), exchange);
			return;
		}

		C5Action action = new C5Action(actionName, actionID);
		action.setValues(map);
		C5Response response = null;
		try {
			if (action.hasKey(Fields.HandlerType)) {
				response = Activator.getHandler(
						action.getStringValue(Fields.HandlerType)).handle(
						action);
			} else
				response = Activator.getHandler().handle(action);
		} catch (Exception e) {
			C5HttpHandler.sendOK(new C5Response(actionName, actionID,
					"Handler not found", false), exchange);
		}
		if (response != null)
			C5HttpHandler.sendOK(response, exchange);
		else {
			C5HttpHandler.sendOK("error", exchange);
		}
	}

	public void processLogoff(C5Action action, HttpExchange exchange)
			throws Exception {
		C5Response response = new C5Response(action);
		response.setSucceed(true);
		if(!isMonitorUser){
			action.addParameter(Fields.UserID, userID);
			action.addParameter(Fields.User, userID);
			action.addParameter(Fields.PBX, pbx);
			action.addParameter(Fields.Account, account);
			response = Activator.getHandler().handle(action);
		}
		C5HttpHandler.sendOK(response, exchange);
		if(response.isSucceed()){
			this.close();
		}
	}

	public void kick(String comments) {
		kiked = true;
		kickComments = comments;
		stateQueue.pushState(new C5Event(Fields.Kick).getJsonString());
		notifyAction();
		C5Action action = new C5Action(Fields.Logoff, Utils
				.getSynActionID(comments));
		action.addParameter(Fields.UserID, userID);
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Account, account);
		action.addParameter(Fields.Comments, comments);
		action.addParameter(Fields.QueueRemove, true);
		try {
			Activator.getHandler().handle(action);
		} catch (Exception e) {
			log.log(Level.WARNING, "kick session failed", e);
		}
		closeForKick();
	}

	private void processLoginAction(C5Action action, HttpExchange exchange)
			throws IOException {
		if (authenticated) {
			try {
				if (timeoutTask != null) {
					timeoutTask.cancel();
					AsteriskStatusServer.getInstance().timer.purge();
					timeoutTask.close();
					timeoutTask = new C5TimeoutTask(this);
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}

		// Mutil pbxs user login
		if (action.hasKey(Fields.MonitorUser)) {
			try {
				String user = action.getStringValue(Fields.UserID);
				String password = action.getStringValue(Fields.Password);
				if (user.equals(ASConfig.getInstance().getVar("monitor.user"))
						&& password.equals(ASConfig.getInstance().getVar(
								"monitor.password"))) {
					pbx = action.getStringValue(Fields.PBX);
					account = action.getStringValue(Fields.Account);
					int result = 200;
					authenticated = true;
					isMonitorUser = true;
					isMonitor = true;
					// Add this session to httphandler
					C5HttpServer.getInstance().getHttpHandler()
							.addSession(id, this);
					// push state event
					ServiceNo[] it = RuntimeData.getInstance().getServiceNos(pbx,
							account);
					for (int i = 0; i < it.length; i++) {
						ServiceNo sn = it[i];
						stateQueue.pushState(sn.getStateEvent().getJsonString());
					}
					stateQueue.pushState(RuntimeData.getInstance().getAccount(pbx,
							account).getCallReport().getStateEvent()
							.getJsonString());

					List<String> peers = RuntimeData.getInstance().getAccount(pbx,
							account).getUserIds();
					for (int i = 0; i < peers.size(); i++) {
						this.addPeer(peers.get(i));
					}

					List<String> queues = RuntimeData.getInstance().getAccount(pbx,
							account).getQueueExtens();

					for (int i = 0; i < queues.size(); i++) {
						this.addQueue(queues.get(i));
					}

					// Add listener
					CallListener.getInstance().addChannelListener(account, this);
					CallListener.getInstance().addTrunkListener(account, this);
					CallListener.getInstance().addUserListener(account, this);
					CallListener.getInstance().addPeerListener(account, this);
					CallListener.getInstance().addQueueListener(account, this);
					CallListener.getInstance().addCallReportListener(account, this);
					AMICore.getInstance().addAMIListener(this);
					
					C5Response response = new C5Response(action.getActionName(), action
							.getActionID(), true);
					response.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
					response.addParameter(Fields.SessionID, id);
					response.addParameter(Fields.Result, result);
					String phonebarConfig = RuntimeData.getInstance().getAccount(pbx, account)
							.getPhonebarConfig().getValueString();
					response.addParameter(Fields.PhonebarConfigKey,
							phonebarConfig);
					C5HttpHandler.sendOK(response, exchange);
					AsteriskStatusServer.getInstance().timer.schedule(timeoutTask, 40000,
							40000);
					return;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}

		}
		String browser = exchange.getRequestHeaders().getFirst("User-agent");
		action.addParameter(Fields.Browser, browser);

		int result = 0;
		String phonebarConfig = "";
		String sipNum = null;
		try {
			if (action.hasKey(Fields.PBX)){
				pbx = action.getStringValue(Fields.PBX);
			}
			if (action.hasKey(Fields.Account)){
				account = action.getStringValue(Fields.Account);
			}
			if (action.hasKey(Fields.UserID)){
				userID = action.getStringValue(Fields.UserID);
			} else {
				if (action.hasKey(Fields.User)){
					String user = action.getStringValue(Fields.User);
					int a = user.indexOf('@');
					if (a != -1){
						String userName = user.substring(0, a);
						C5Account currentAccount = null;
						if (pbx != null && account != null){
							currentAccount = RuntimeData.getInstance().getAccount(pbx, account);
						} else {
							String accountName = user.substring(a + 1);
							currentAccount = RuntimeData.getInstance().getAccountViaNameByUser(accountName, userName);
						}
						
						if(currentAccount == null){
							C5Response response = new C5Response(
									action.getActionName(), action.getActionID(), false);
							response.setMessage("404 Error account");
							response.addParameter(Fields.Result, 404);
							response.setSucceed(false);
							C5HttpHandler.sendOK(response, exchange);
							this.close();
							return;
						}
						account = currentAccount.getAccount();
						action.addParameter(Fields.Account, account);
						pbx = currentAccount.getPbx();
						action.addParameter(Fields.PBX, pbx);
						User currentUser = currentAccount.getUserViaName(userName);
						if(currentUser != null){
							userID = currentUser.getId();
							action.addParameter(Fields.UserID, userID);
						}
					}
				}
			}
			if (userID == null){
				C5Response response = new C5Response(
						action.getActionName(), action.getActionID(), false);
				response.addParameter(Fields.Result, 404);
				response.setMessage("404 Error user");
				C5HttpHandler.sendOK(response, exchange);
				this.close();
				return;
			}
			if (action.hasKey(Fields.Monitor))
				isMonitor = action.getBoolValue(Fields.Monitor);
			c5user = RuntimeData.getInstance().getAccount(pbx, account)
					.getUser(userID);

			String actionID = c5user.getVar(Fields.ActionID);
			if (actionID != null) {
				if (actionID.equals(action.getActionID())) {
					log.warning("Get retransfered login action [" + actionID
							+ "]");
					C5Response response = new C5Response(
							action.getActionName(), action.getActionID(), false);
					response.addParameter(Fields.Result, 404);
					C5HttpHandler.sendOK(response, exchange);
					this.close();
					return;
				}
			}

			// start login
			C5Response res = Activator.getHandler().handle(action);

			result = res.getIntValue(Fields.Result);
			if(res.getParameterValue(Fields.SipNum) != null){
				sipNum = res.getStringValue(Fields.SipNum);
			}
			
			if (res.isSucceed()) {
				authenticated = true;

				// Add this session to httphandler
				C5HttpServer.getInstance().getHttpHandler()
						.addSession(id, this);
				// push state event
				ServiceNo[] it = RuntimeData.getInstance().getServiceNos(pbx,
						account);
				for (int i = 0; i < it.length; i++) {
					ServiceNo sn = it[i];
					stateQueue.pushState(sn.getStateEvent().getJsonString());
				}
				stateQueue.pushState(RuntimeData.getInstance().getAccount(pbx,
						account).getCallReport().getStateEvent()
						.getJsonString());

				List<String> peers = RuntimeData.getInstance().getAccount(pbx,
						account).getUserIds();
				for (int i = 0; i < peers.size(); i++) {
					this.addPeer(peers.get(i));
				}

				List<String> queues = RuntimeData.getInstance().getAccount(pbx,
						account).getQueueExtens();

				for (int i = 0; i < queues.size(); i++) {
					this.addQueue(queues.get(i));
				}

				// Add listener
				CallListener.getInstance().addChannelListener(account, this);
				CallListener.getInstance().addTrunkListener(account, this);
				CallListener.getInstance().addUserListener(account, this);
				CallListener.getInstance().addPeerListener(account, this);
				CallListener.getInstance().addQueueListener(account, this);
				CallListener.getInstance().addCallReportListener(account, this);
				CallListener.getInstance().addBatchDialoutListener(account, this);
				NotifyListener.getInstance().addMessageListener(c5user.getId(), this);
				AMICore.getInstance().addAMIListener(this);
				// set connection to user
				c5user.addVar(Fields.ActionID, action.getActionID());
				c5user.setConnection(this);
			} else {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID(), false);
				response.addParameter(Fields.Result, result);
				C5HttpHandler.sendOK(response, exchange);
				this.close();
				return;
			}

			phonebarConfig = RuntimeData.getInstance().getAccount(pbx, account)
					.getPhonebarConfig().getValueString();
		} catch (Throwable e) {
			log.log(Level.WARNING, "Login failed.", e);
			C5Response response = new C5Response(action.getActionName(), action
					.getActionID(), false);
			response.addParameter(Fields.Result, 500);
			response.setMessage(e.getMessage());
			C5HttpHandler.sendOK(response, exchange);
			this.close();
			return;
		}
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), true);
		response.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
		response.addParameter(Fields.SessionID, id);
		response.addParameter(Fields.Result, result);
		response.addParameter(Fields.AutoBusyTime, c5user.getAutoBusyTime());
		response.addParameter(Fields.PhonebarConfigKey, phonebarConfig);
		response.addParameter(Fields.UserID, userID);
		response.addParameter(Fields.PBX, pbx);
		response.addParameter(Fields.Account, account);
		response.addParameter(Fields.SipNum, sipNum);
		if (isMonitor) {
			response.addParameter(Fields.MonitorUser, ASConfig.getInstance()
					.getVar("monitor.user"));
			response.addParameter(Fields.MonitorPassword, ASConfig
					.getInstance().getVar("monitor.password"));
		}
		C5HttpHandler.sendOK(response, exchange);
		AsteriskStatusServer.getInstance().timer.schedule(timeoutTask, 40000,
				40000);
	}

	public String getSessionID() {
		return id;
	}

	/**
	 * This method will proccess timeout event. It should be called only when
	 * client communication timeout.
	 * 
	 */
	public void timeout() {
		if (timeoutTask != null) {
			timeoutTask.cancel();
			AsteriskStatusServer.getInstance().timer.purge();
			timeoutTask.close();
			timeoutTask = null;
		}
		if(!isMonitorUser) {
			try {
				C5Action action = new C5Action(Fields.Logoff, Utils
						.getSynActionID(Fields.Timeout));
				action.addParameter(Fields.PBX, pbx);
				action.addParameter(Fields.Account, account);
				action.addParameter(Fields.UserID, userID);
				action.addParameter(Fields.Comments, Fields.Timeout);
				if (c5user.getExtenType().equals(Fields.sip) || c5user.getExtenType().equals(Fields.gateway)) {
					action.addParameter(Fields.QueueRemove, true);
				} else {
					action.addParameter(Fields.QueueRemove, false);
				}
				Activator.getHandler().handle(action);
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
		this.close();
	}

	public void getState(HttpExchange exchange, C5Action _action)
			throws IOException {
		// if is listenning, that means the old session is expired.
		// we need to abandon it and use the new one.
		if (isListenning) {
			try {
				if (currentExchange != null)
					currentExchange.close();
			} catch (Exception e) {

			}

			log.warning("C5Client is listenning");
			synchronized (lock) {
				isListenning = false;
				lock.notifyAll();
			}
		}
		String data = "";

		isListenning = true;
		if (stateQueue.hasNext()) {
			C5Response response = new C5Response(_action.getActionName(),
					_action.getActionID(), true);
			response.addParameter(Fields.HasEvent, true);
			if (kiked) {
				response.addParameter(Fields.Kick, true);
				response.addParameter(Fields.Comments, kickComments);
			}
			data = "{\"" + Fields.Response + "\":" + response.getJsonString()
					+ ",\"" + Fields.Event + "\":" + this.getStateString()
					+ "}";
			isListenning = false;
			send(data, exchange);
		} else {
			synchronized (lock) {
				try {
					this.currentExchange = exchange;
					lock.wait(timeout);
					if (this.currentExchange == null)
						return;
				} catch (InterruptedException e) {
					log.log(Level.WARNING, "", e);
					exchange.close();
				}
			}
			try {
				data = notifyStatus(_action);
			} catch (Throwable e) {
				log.log(Level.WARNING, "", e);
				data = e.getMessage();
			}
			send(data, exchange);
		}

	}

	private String notifyStatus(C5Action action) throws Exception {
		if (!running)
			return "";
		String data = "";
		if (isListenning) {
			// C5HttpServer.getInstance().getTimer().purge();
			isListenning = false;
			if (stateQueue.hasNext()) {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID(), true);
				if (kiked) {
					response.addParameter(Fields.Kick, true);
					response.addParameter(Fields.Comments, kickComments);
				}
				response.addParameter(Fields.HasEvent, true);
				data = "{\"" + Fields.Response + "\":"
						+ response.getJsonString() + ",\"" + Fields.Event
						+ "\":" + this.getStateString() + "}";
			} else {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID(), true);
				if (kiked) {
					response.addParameter(Fields.Kick, true);
					response.addParameter(Fields.Comments, kickComments);
				}
				response.addParameter(Fields.HasEvent, false);
				data = "{\"" + Fields.Response + "\":"
						+ response.getJsonString() + "}";
			}
		} else {
			C5Response response = new C5Response(action.getActionName(), action
					.getActionID(), true);
			if (kiked) {
				response.addParameter(Fields.Kick, true);
				response.addParameter(Fields.Comments, kickComments);
			}
			response.addParameter(Fields.HasEvent, true);
			data = "{\"" + Fields.Response + "\":" + response.getJsonString()
					+ ",\"" + Fields.Event + "\":" + this.getStateString()
					+ "}";
		}
		return data;
	}

	private String getStateString() {
		if (!running)
			return "";
		String data = stateQueue.popAllState();
		return data;
	}

	private void send(String data, HttpExchange exchange) throws IOException {
		if (exchange == null) {
			log.warning("exchange is null");
			return;
		}
		C5HttpHandler.sendOK(data, exchange);
	}

	/**
	 * Add a peer that this client will listen it's status.
	 * 
	 * @param peerName
	 *            exten@asterisk
	 */
	private void addPeer(String userId) throws Exception {

		if (users.contains(userId)) {
			return;
		}

		users.add(userId);
		User user = RuntimeData.getInstance().getAccount(pbx, account).getUser(
				userId);
		if (user != null) {
			stateQueue.pushState(user.getStateEvent().getJsonString());
			if (user.getSipNum() != null
					&& !user.getSipNum().equalsIgnoreCase("")) {
				SipPeer peer = RuntimeData.getInstance().getAccount(pbx,
						account).getSipPeer(user.getSipNum());
				if (peer == null){
					return;
				}
				C5Event event = new C5Event(Fields.PeerStatus);
				event.addParameter(Fields.Exten, peer.getExten());
				event.addParameter(Fields.PeerStatus, peer.getPeerStatus());
				event.addParameter(Fields.Status, peer.getStatus());
				stateQueue.pushState(event.getJsonString());
				Vector<C5Channel> channels = peer.getChannels();
				if (channels.size() > 0) {
					stateQueue.pushState(channels.get(0).getAllStatusString());
				}
			} else {
				log.log(Level.WARNING, "user sip num is null");
			}
		}
	}

	/**
	 * Add a queue which will be listened by this client.
	 * 
	 * @param queueName
	 *            exten@pbx 1000@192.168.0.1
	 */
	private void addQueue(String exten) {
		if (queues.contains(exten)) {
			return;
		}
		queues.add(exten);
		try {
			C5Queue queue = RuntimeData.getInstance().getPbxViaId(pbx)
					.getQueue(exten);
			if (queue != null) {
				stateQueue.pushState(queue.getState().getJsonString());
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public String getUserID() {
		return userID;
	}

	private synchronized void closeForKick() {
		if (!running)
			return;
		running = false;

		try {
			CallListener.getInstance().removeChannelListener(account, this);
			CallListener.getInstance().removeTrunkListener(account, this);
			CallListener.getInstance().removePeerListener(account, this);
			CallListener.getInstance().removeQueueListenerr(account, this);
			CallListener.getInstance().removeUserListener(account, this);
			CallListener.getInstance().removeCallReportListener(account, this);
			CallListener.getInstance().removeBatchDialoutListener(account, this);
			NotifyListener.getInstance().removeMessageListener(c5user.getId(), this);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		try {
			if (timeoutTask != null) {
				timeoutTask.cancel();
				AsteriskStatusServer.getInstance().timer.purge();
				timeoutTask.close();
				timeoutTask = null;
			}
		} catch (Throwable e) {
			log.log(Level.WARNING, "", e);
		}
		AMICore.getInstance().removeAMIListener(this);

		Thread t = new Thread("Session close for kick") {
			public void run() {
				try {
					sleep(5000);
				} catch (InterruptedException e1) {
					log.warning(e1.getMessage());
				}
				try {
					C5HttpServer.getInstance().getHttpHandler().removeSession(
							id);
				} catch (Throwable e) {
					log.log(Level.WARNING, "" + id, e);
				}
				if (stateQueue != null) {
					stateQueue.destruct();
					stateQueue = null;
				}
				if (users != null) {
					users.clear();
					users = null;
				}
				if (queues != null) {
					queues.clear();
					queues = null;
				}
			}
		};
		t.start();
	}

	public synchronized void close() {
		if (!running)
			return;
		running = false;
		try {
			C5HttpServer.getInstance().getHttpHandler().removeSession(id);
		} catch (Throwable e) {
			log.log(Level.WARNING, "" + id, e);
		}

		try {
			CallListener.getInstance().removeChannelListener(account, this);
			CallListener.getInstance().removeTrunkListener(account, this);
			CallListener.getInstance().removePeerListener(account, this);
			CallListener.getInstance().removeQueueListenerr(account, this);
			CallListener.getInstance().removeUserListener(account, this);
			CallListener.getInstance().removeCallReportListener(account, this);
			CallListener.getInstance().removeBatchDialoutListener(account, this);
			NotifyListener.getInstance().removeMessageListener(c5user.getId(), this);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		try {
			if (timeoutTask != null) {
				timeoutTask.cancel();
				AsteriskStatusServer.getInstance().timer.purge();
				timeoutTask.close();
				timeoutTask = null;
			}
		} catch (Throwable e) {
			log.log(Level.WARNING, "", e);
		}
		AMICore.getInstance().removeAMIListener(this);
		if (stateQueue != null) {
			stateQueue.destruct();
			stateQueue = null;
		}
		if (users != null) {
			users.clear();
			users = null;
		}
		if (queues != null) {
			queues.clear();
			queues = null;
		}
	}

	private void notifyAction() {
		synchronized (lock) {
			lock.notifyAll();
		}
	}

	private void handleChannel(C5Channel channel) {
//		String channelType = channel.getChannelType();
		String state = channel.getState();
//		String channelName = channel.getChannelName();
//		if (c5user.getSipNum() != null && c5user.isBusy()) {
//			if (channelType.equals(Fields.normal)
//					&& !c5user.getStatus().equals(User.LISTENNING)
//					&& !c5user.getStatus().equals(User.LOOT)
//					&& !c5user.getStatus().equals(User.OUTBOUND_CALL)) {
//				if (state.equals(Fields.Ring) || state.equals(Fields.Ringing)) {
//					try {
//						AMICore.getInstance().getAMIClient(pbx).sendAction(
//								new Hangup(channelName, Utils
//										.getSynActionID("hangup-busy")));
//					} catch (IOException e) {
//						e.printStackTrace();
//					}
//				}
//			}
//		}
		if (state.equalsIgnoreCase(Fields.Hangup)) {
			c5user.setStatus(User.IDLE);
		}
		stateQueue.pushState(channel.getAllStatusString());
		notifyAction();
	}

	public void asteriskConnected(AMIClient client) {
		if(isMonitorUser)
			return;
		if (!client.getId().equalsIgnoreCase(pbx))
			return;
		// queue add again
		C5Action queueaction = new C5Action("addqueuemember", Utils
				.getSynActionID("addqueuemember"));
		queueaction.addParameter(Fields.User, c5user);
		if(c5user.isBusy()){
			queueaction.addParameter(Fields.Paused, true);			
		}
		try {
			Activator.getHandler().handle(queueaction);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void asteriskDisonnected(AMIClient client) {

	}

	public void asteriskReloaded(AMIClient client) {
	}

	public boolean isRunning() {
		return running;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public void trunkStatusChanged(C5Event trunk) {
		if (!running)
			return;
		if (!isMonitor)
			return;
		try {
			if (!trunk.getStringValue(Fields.PBX).equals(pbx))
				return;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return;
		}
		stateQueue.pushState(trunk.getJsonString());
		notifyAction();
	}

	@Override
	public void phoneRegister(C5Event event) {
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
			String exten = event.getStringValue(Fields.Exten);
			String peerStatus = event.getStringValue(Fields.PeerStatus);
			String status = event.getStringValue(Fields.Status);
			event.clear();
			event.addParameter(Fields.PBX, pbx);
			event.addParameter(Fields.Exten, exten);
			event.addParameter(Fields.PeerStatus, peerStatus);
			event.addParameter(Fields.Status, status);

			// if (isMonitor) {
			stateQueue.pushState(event.getJsonString());
			notifyAction();
			// } else if (this.c5user.getSipNum() != null
			// && exten.equals(this.c5user.getSipNum())) {
			// stateQueue.pushState(event.getJsonString());
			// notifyAction();
			// }
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void phoneUnregister(C5Event event) {
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
			String exten = event.getStringValue(Fields.Exten);
			String peerStatus = event.getStringValue(Fields.PeerStatus);
			String status = event.getStringValue(Fields.Status);
			event.clear();
			event.addParameter(Fields.PBX, pbx);
			event.addParameter(Fields.Exten, exten);
			event.addParameter(Fields.PeerStatus, peerStatus);
			event.addParameter(Fields.Status, status);

			// if (isMonitor) {
			stateQueue.pushState(event.getJsonString());
			notifyAction();
			// } else if (this.c5user.getSipNum() != null
			// && exten.equals(this.c5user.getSipNum())) {
			// stateQueue.pushState(event.getJsonString());
			// notifyAction();
			// }
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void SipRemoved(C5Event event) {
		if (!running)
			return;
		if (!isMonitor)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return;
		}
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void channelStatusChanged(C5Channel channel) {
		if (!running)
			return;
		if (channel.getState().equals(Fields.Unlink))
			return;
		try {
			if (!channel.getPbx().equals(pbx))
				return;
			if (isMonitor) {
				String exten = channel.getExten();
				if (this.c5user != null && this.c5user.getSipNum() != null && pbx != null
						&& this.c5user.getSipNum().equalsIgnoreCase(exten)) {
					handleChannel(channel);
				} else {
//					//if IvrMenuInner channel ,the result to tell softphone.add by chenguang.
//					if(channel.isIvrMenu() 
//							&& channel.getCall() != null){
//						C5Event event = new C5Event(Fields.IvrMenuEnd);
//						event.addParameter(Fields.Account, channel.getAccount());
//						event.addParameter(Fields.PBX, channel.getPbx());
//						event.addParameter(Fields.Exten, channel.getExten());
//						
//						if(channel.getState().equals(Fields.Link)){
////							event.addParameter(Fields.IvrMenuEnd, channel.getVar(Fields.VAL_OF_IVR_MENU));							
////							System.out.println("������IvrmenuInner end�¼�================");
//						}else if(channel.getState().equals(Fields.Hangup)){
//							event.addParameter(Fields.IvrMenuEnd, channel.getVar("IvrMenuOutEnd"));
//							System.out.println("������IvrmenuOut end�¼�================");
//						}
//						stateQueue.pushState(event.getJsonString());
//					}
					stateQueue.pushState(channel.getAllStatusString());
					notifyAction();
				}
			} else if (this.c5user.getSipNum() != null
					&& pbx != null
					&& this.c5user.getSipNum().equalsIgnoreCase(
							channel.getExten())) {
				handleChannel(channel);
			}

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void newExten(C5Event event) {
		if (!running)
			return;
		if (this.c5user == null || this.c5user.getSipNum() == null)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
			String context = (String) event.getParameterValue(Fields.Context);
			String asterisk = (String) event.getParameterValue(Fields.PBX);
			String channelName = (String) event
					.getParameterValue(Fields.Channel);
			if (asterisk.equals(this.pbx)) {
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(
						asterisk).getChannel(channelName);
				if (channel == null) {
					return;
				} else {
					if (context.endsWith("validate-wait")) {
						if (channel.getVar(Fields.Validate).equals(
								this.c5user.getSipNum())) {
							if (channel.getCall() == null) {
								Redirect action = new Redirect(channelName,
										this.account, this.c5user.getSipNum(),
										"1", Utils.getSynActionID("redirect"));
								try {
									AMICore.getInstance()
											.getAMIClient(asterisk).sendAction(
													action);
								} catch (IOException e) {
									log.log(Level.WARNING, "", e);
								}
							}
						}
					}
//					else if(context.endsWith("ivr-menu-end")){
//						//if IvrMenuInner channel ,the result to tell softphone.add by chenguang.
//						if(channel.isIvrMenu() 
//								&& channel.getCall() != null){
//							C5Event c5event = new C5Event(Fields.IvrMenuEnd);
//							c5event.addParameter(Fields.Account, channel.getAccount());
//							c5event.addParameter(Fields.PBX, channel.getPbx());
//							c5event.addParameter(Fields.Exten, channel.getExten());
//							
//							c5event.addParameter(Fields.IvrMenuEnd, channel.getVar(Fields.VAL_OF_IVR_MENU));							
//							System.out.println("������IvrmenuInner end�¼�============��֤���="+channel.getVar(Fields.VAL_OF_IVR_MENU));
//							
//							stateQueue.pushState(c5event.getJsonString());
//						}
//					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void queueCallerAbandon(C5Event event) {
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return;
		}
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueJoin(C5QueueEntry entry) {
		if (!running)
			return;

		if (!entry.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.Join);
		event.addParameter(Fields.Queue, entry.getQueue());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueLeave(C5QueueEntry entry) {
		if (!running)
			return;
		
		if (!entry.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.Leave);
		event.addParameter(Fields.Queue, entry.getQueue());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueMemberAdded(C5QueueMember member) {
		if (!running)
			return;
		if (!member.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.QueueMemberAdded);
		event.addParameter(Fields.Queue, member.getQueue());
		event.addParameter(Fields.Exten, member.getExten());
		event.addParameter(Fields.Paused, member.isPaused());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueMemberPaused(C5QueueMember member) {
	}

	@Override
	public void queueMemberRemoved(C5QueueMember member) {
		if (!running)
			return;
		if (!member.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.QueueMemberRemoved);
		event.addParameter(Fields.Queue, member.getQueue());
		event.addParameter(Fields.Exten, member.getExten());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueParams(C5Event event) {
	}

	@Override
	public void queueRemoved(C5Event event) {
	}

	@Override
	public void userAdded(User event) {
	}

	@Override
	public void userBusy(User user) {
		if (!running)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.UserBusy);
		event.addParameter(Fields.UserID, user.getId());
		event.addParameter(Fields.Busy, user.isBusy());
		event.addParameter(Fields.BusyType, user.getBusyType());
		event.addParameter(Fields.BusyTimestamp, user.getBusyTimestamp());
		event.addParameter(Fields.LoginTimestamp, user.getLoginTimestamp());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void userLogin(User user) {
		if (!running)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		// C5Event event = new C5Event(Fields.UserLogin);
		// event.addParameter(Fields.UserID, user.getId());
		// event.addParameter(Fields.Login, user.isLogin());
		// event.addParameter(Fields.SipNum, user.getSipNum());
		// event.addParameter(Fields.BusyTimestamp, user.getBusyTimestamp());
		// event.addParameter(Fields.LoginTimestamp, user.getLoginTimestamp());
		stateQueue.pushState(user.getStateEvent().getJsonString());
		notifyAction();
	}

	@Override
	public void userLogoff(User user) {
		if (!running)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		// C5Event event = new C5Event(Fields.UserLogin);
		// event.addParameter(Fields.UserID, user.getId());
		// event.addParameter(Fields.Login, user.isLogin());
		// event.addParameter(Fields.BusyTimestamp, user.getBusyTimestamp());
		// event.addParameter(Fields.LoginTimestamp, user.getLoginTimestamp());
		// stateQueue.pushState(event.getJsonString());
		stateQueue.pushState(user.getStateEvent().getJsonString());
		notifyAction();
	}

	@Override
	public void userRemoved(User user) {
	}

	@Override
	public void userUnbusy(User user) {
		if (!running)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.UserBusy);
		event.addParameter(Fields.UserID, user.getId());
		event.addParameter(Fields.Busy, user.isBusy());
		event.addParameter(Fields.BusyType, user.getBusyType());
		event.addParameter(Fields.BusyTimestamp, user.getBusyTimestamp());
		event.addParameter(Fields.LoginTimestamp, user.getLoginTimestamp());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void userStatus(User user) {
		if (!running)
			return;
		if (!isMonitor && !user.getId().equals(this.userID))
			return;
		if (!user.getPbx().equals(pbx))
			return;
		stateQueue.pushState(user.getStateEvent().getJsonString());
		notifyAction();
	}

	@Override
	public void phoneUpdate(C5Event event) {
//		log.log(Level.WARNING, "Get peer status event: " + event.getJsonString());
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
			String exten = event.getStringValue(Fields.Exten);
			String peerStatus = event.getStringValue(Fields.PeerStatus);
			String status = event.getStringValue(Fields.Status);
			event.clear();
			event.addParameter(Fields.PBX, pbx);
			event.addParameter(Fields.Exten, exten);
			event.addParameter(Fields.PeerStatus, peerStatus);
			event.addParameter(Fields.Status, status);
			if (!isMonitor) {
				if (this.c5user.getSipNum() != null
						&& exten.equals(this.c5user.getSipNum())) {
					stateQueue.pushState(event.getJsonString());
					notifyAction();
				}
				return;
			}
			stateQueue.pushState(event.getJsonString());
			log.log(Level.WARNING, "[Session]: push " + event.getJsonString());
			notifyAction();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void callReportUpdate(C5Event event) {
		if (!running)
			return;
		if (!isMonitor)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return;
		}
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void sendEvent(C5Event event) {
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return;
		}
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void queueComplete(C5Event event) {

	}

	@Override
	public void queueConnect(C5Event event) {

	}

	@Override
	public void queueAgentCalled(C5Event event) {

	}

	@Override
	public void newEvent(C5Event event) {
		if (!running)
			return;
		try {
			if (!event.getStringValue(Fields.PBX).equals(pbx))
				return;
			if (c5user != null && event.getStringValue(Fields.Exten).equals(
					this.c5user.getSipNum())) {
				stateQueue.pushState(event.getJsonString());
				notifyAction();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void userCallsUpdate(User user) {
		if (!running)
			return;
		if (!isMonitor && !user.getId().equals(this.userID))
			return;
		if (!user.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.UserCallsUpdate);
		event.addParameter(Fields.UserID, user.getId());
		event.addParameter(Fields.InCalls, user.getInCalls());
		event.addParameter(Fields.InComplete, user.getInCallsCompleted());
		event.addParameter(Fields.OutCalls, user.getOutCalls());
		event.addParameter(Fields.OutComplete, user.getOutCallsCompleted());
		event.addParameter(Fields.DialinTimeLength, user.getDialinTimeLength());
		event.addParameter(Fields.DialoutTimeLength, user
				.getDialoutTimeLength());
		event.addParameter(Fields.TransferCalls, user.getTransferCalls());
		event.addParameter(Fields.TransferComplete,
				user.getTransferCallsCompleted());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void userSignIn(User user) {
		if (!running)
			return;
		if (!isMonitor)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.UserSignIn);
		event.addParameter(Fields.UserID, user.getId());
		event.addParameter(Fields.ExtenType, user.getExtenType());
		event.addParameter(Fields.SipNum, user.getSipNum());
		event.addParameter(Fields.Reserve, user.isReserve());
		event.addParameter(Fields.Login, user.isLogin());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}

	@Override
	public void userSignOut(User user) {
		if (!running)
			return;
		if (!user.getPbx().equals(pbx))
			return;
		C5Event event = new C5Event(Fields.UserSignOut);
		event.addParameter(Fields.UserID, user.getId());
		event.addParameter(Fields.ExtenType, user.getExtenType());
		event.addParameter(Fields.SipNum, user.getSipNum());
		event.addParameter(Fields.Reserve, user.isReserve());
		event.addParameter(Fields.Login, user.isLogin());
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}
	
	@Override
	public void batchDialoutDialed(C5Event event) {
		if (this.isListenBatchDialoutEvent) {
			stateQueue.pushState(event.getJsonString());
		}
	}

	@Override
	public void batchDialoutDialing(C5Event event) {
		if (this.isListenBatchDialoutEvent) {
			stateQueue.pushState(event.getJsonString());
		}
	}

	@Override
	public void batchDialoutError(C5Event event) {
		if (this.isListenBatchDialoutEvent) {
			stateQueue.pushState(event.getJsonString());
		}
	}

	@Override
	public void batchDialoutFinish(C5Event event) {
		if (this.isListenBatchDialoutEvent) {
			stateQueue.pushState(event.getJsonString());
		}
	}
	
	@Override
	public void newMessage(C5Event event) {
		stateQueue.pushState(event.getJsonString());
		notifyAction();
	}
}
