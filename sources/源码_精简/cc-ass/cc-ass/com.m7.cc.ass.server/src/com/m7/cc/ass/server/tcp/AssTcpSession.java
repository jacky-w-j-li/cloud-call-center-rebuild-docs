package com.m7.cc.ass.server.tcp;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.call.service.ConferenceListener;
import com.m7.cc.ass.call.service.PeerListener;
import com.m7.cc.ass.call.service.UserListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.server.Activator;
import com.m7.cc.ass.server.http.C5Session;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;

public class AssTcpSession extends C5Connection implements PeerListener,
		ChannelListener, UserListener, ConferenceListener {
	public static final String COMMAND_END = "\r\n";
	public static final int MAX_COMMAND_LENGTH = 4096;

	JSONReader jr = new JSONReader();

	private Session session;
	private String pbx;
	private String account;
	private String userID;
	private StringBuffer buffer = new StringBuffer();
	private boolean authenticated = false;
	private boolean running = true;
	private List<String> listeningConferences = new ArrayList<String>();

	private static final Logger log = Logger.getLogger(C5Session.class
			.getName());

	private User c5user;

	public AssTcpSession(Session session) {
		this.session = session;
	}

	public void processAction(C5Action action) {
		if (!authenticated && !action.getActionName().equals(Fields.Login)) {
			C5Response response = new C5Response(action.getActionName(), action
					.getActionID(), "Please login at first", false);
			this.sendResponse(response);
			return;
		}

		if (action.getActionName().equals(Fields.Login)) {
			processLoginAction(action);
			return;
		} else {
			action.addParameter(Fields.id, userID);
		}
		
		if (action.getActionName().equals(Fields.Logoff)) {
			C5Response response = new C5Response(action);
//			try {
//				response = Activator.getHandler().handle(action);
//				if (response.isSucceed()) {
//					this.sendResponse(response);
//					this.destruct();
//				}
//			} catch (Exception e) {
//				response = new C5Response(action.getActionName(), action
//						.getActionID(), "Handler not found", false);
//				log.log(Level.WARNING, "", e);
//			}
			sendResponse(response);
			return;
		} else if (action.getActionName().equalsIgnoreCase(Fields.Transfer)
				|| action.getActionName().equalsIgnoreCase(
						Fields.InviteToConference)) {
			this.processActionInNewThread(action);
			return;
		} else if (action.getActionName().equalsIgnoreCase(
				Fields.ListenConference)) {
			try {
				if(!listeningConferences.contains(action.getStringValue(Fields.Exten)))
					listeningConferences.add(action.getStringValue(Fields.Exten));
			} catch (Exception e) {

			}
		} else if (action.getActionName().equalsIgnoreCase(
				Fields.UnlistenConference)) {
			try {
				listeningConferences
						.remove(action.getStringValue(Fields.Exten));
			} catch (Exception e) {

			}
		}

		C5Response response = null;
		try {
			if (action.hasKey(Fields.HandlerType)) {
				response = Activator.getHandler(
						action.getStringValue(Fields.HandlerType)).handle(
						action);
			} else
				response = Activator.getHandler().handle(action);
		} catch (Exception e) {
			response = new C5Response(action.getActionName(), action
					.getActionID(), "Handler not found", false);
			log.log(Level.WARNING, "", e);
		}
		if (response != null)
			this.sendResponse(response);
	}

	private void processActionInNewThread(final C5Action action){
		Thread t = new Thread(action.getActionID()) {
			public void run() {
				C5Response response = null;
				try {
					response = Activator.getHandler().handle(action);
				} catch (Exception e) {
					response = new C5Response(action.getActionName(),
							action.getActionID(),
							"Handler not found", false);
					log.log(Level.WARNING, "", e);
				}
				sendResponse(response);
			}
		};
		t.start();
	}

	private void processLoginAction(C5Action action) {

		String browser = "Ass Client";
		action.addParameter(Fields.Browser, browser);
		int result = 0;
		try {
			this.userID = action.getStringValue(Fields.UserID);
			this.account = action.getStringValue(Fields.Account);
			this.pbx = action.getStringValue(Fields.PBX);
			
			C5Account account = RuntimeData.getInstance().getAccount(this.pbx, this.account);
			if (account == null) {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID());
				response.setMessage("404 Error user/password/account");
				response.addParameter(Fields.Result, 404);
				response.setSucceed(false);
				this.sendResponse(response);
				return;
			}

			c5user = account.getUser(this.userID);
			if (c5user == null) {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID());
				response.setMessage("404 Error user/password/account");
				response.addParameter(Fields.Result, 404);
				response.setSucceed(false);
				this.sendResponse(response);
				return;
			}
//			action.addParameter(Fields.User, c5user.getUser() + "@"
//					+ accountName);
			action.addParameter(Fields.UserID, c5user.getId());
			action.addParameter(Fields.Account, account.getAccount());
			action.addParameter(Fields.PBX, account.getPbx());

			// start login
			C5Response res = Activator.getHandler().handle(action);
			result = res.getIntValue(Fields.Result);
			if (res.isSucceed()) {
				authenticated = true;

				res.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
				res.addParameter(Fields.Account, this.account);
				res.addParameter(Fields.PBX, this.pbx);
				res.addParameter(Fields.UserID, this.userID);
				res.addParameter(Fields.ExtenType, c5user.getExtenType());
				this.sendResponse(res);

				if(c5user.getOwnSipNums().get(Fields.sip) != null) {
					SipPeer sippeer = RuntimeData.getInstance().getSipPeer(pbx,
							c5user.getOwnSipNums().get(Fields.sip));
					if(sippeer != null) {
						C5Event event = new C5Event(Fields.PeerStatus);
						event.addParameter(Fields.Exten, sippeer.getExten());
						event.addParameter(Fields.PeerStatus, sippeer.getPeerStatus());
						event.addParameter(Fields.Status, sippeer.getStatus());
						this.sendEvent(event);
					}
				}
				
				if(c5user.getOwnSipNums().get(Fields.gateway) != null) {
					SipPeer sippeer = RuntimeData.getInstance().getSipPeer(pbx,
							c5user.getOwnSipNums().get(Fields.gateway));
					if(sippeer != null) {
						C5Event event = new C5Event(Fields.PeerStatus);
						event.addParameter(Fields.Exten, sippeer.getExten());
						event.addParameter(Fields.PeerStatus, sippeer.getPeerStatus());
						event.addParameter(Fields.Status, sippeer.getStatus());
						this.sendEvent(event);
					}
				}
				
				if(c5user.getOwnSipNums().get(Fields.Local) != null) {
					SipPeer sippeer = RuntimeData.getInstance().getSipPeer(pbx,
							c5user.getOwnSipNums().get(Fields.Local));
					if(sippeer != null) {
						C5Event event = new C5Event(Fields.PeerStatus);
						event.addParameter(Fields.Exten, sippeer.getExten());
						event.addParameter(Fields.PeerStatus, sippeer.getPeerStatus());
						event.addParameter(Fields.Status, sippeer.getStatus());
						this.sendEvent(event);
					}
				}
				
				C5Event event = new C5Event(Fields.UserStatus);
				event.addParameter(Fields.UserID, c5user.getId());
				event.addParameter(Fields.ExtenType, c5user.getExtenType());
				this.sendEvent(event);

				// Add listener
				CallListener.getInstance().addChannelListener(
						account.getAccount(), this);
				CallListener.getInstance().addPeerListener(
						account.getAccount(), this);
				CallListener.getInstance().addUserListener(c5user.getId(), this);
				CallListener.getInstance().addConferenceListener(account.getAccount(), this);
				// set connection to user
				c5user.addVar(Fields.ActionID, action.getActionID());
				//c5user.setConnection(this);
			} else {
				C5Response response = new C5Response(action.getActionName(),
						action.getActionID(), false);
				response.addParameter(Fields.Result, result);
				this.sendResponse(response);
				this.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Login failed.", e);
			C5Response response = new C5Response(action.getActionName(), action
					.getActionID(), false);
			response.addParameter(Fields.Result, 500);
			response.setMessage(e.getMessage());
			this.sendResponse(response);
			this.close();
			return;
		}
	}

	public void sendResponse(C5Response response) {
		if (session == null)
			return;
		try {
			session.send(response.getJsonString() + "\r\n");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void processData(String data) {
		synchronized (buffer) {
			if (data.indexOf(COMMAND_END) != -1) {
				buffer.append(data);

				String _commands = null;
				// If this command is ended with a action we send the whole
				// command
				// string to subparser to parse and clear buffer.
				if (data.endsWith(COMMAND_END)) {
					_commands = buffer.toString();
					buffer.setLength(0);
				}
				// If command is not ended with a action
				else {
					_commands = buffer.toString();
					int lastIndex = _commands.lastIndexOf(COMMAND_END);

					// There is no complete action
					if (lastIndex < 0) {

						// The packet is longer than protocol permit
						if (buffer.length() > MAX_COMMAND_LENGTH) {
							buffer.setLength(0);
							sendResponse(new C5Response("", "",
									"Command too long", false));
							return;
						}
						// End parse
						else {
							return;
						}
					}
					_commands = _commands.substring(0, lastIndex);
					buffer.delete(0, lastIndex + 2);
				}

				String[] commands = _commands.split(COMMAND_END);
				for (int i = 0; i < commands.length; i++) {
					try {
						log.fine("Get command: " + commands[i]
								+ " from session[" + session.getId() + "]");

						Map<String, Object> values = (Map<String, Object>) jr
								.read(commands[i]);
						String actionName = (String) values.get(Fields.Action);
						if (actionName == null) {
							throw new Exception(
									"Error command, none action name defined");
						}
						String actionID = (String) values.get(Fields.ActionID);
						C5Action action = new C5Action(actionName, actionID);
						action.setValues(values);
						this.processAction(action);
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			} else {
				buffer.append(data);
			}
		}
	}

	public void sendAction(C5Action action) {
		if (session == null)
			return;
		try {
			session.send(action.getJsonString() + "\r\n");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void sendEvent(C5Event event) {
		if (session == null)
			return;
		try {
			session.send(event.getJsonString() + "\r\n");
		} catch (Exception e) {
			this.close();
			log.log(Level.WARNING, "", e);
		}
	}

	public void logoff(String comments) {
		
		try {
//			this.destruct();
		} catch (Exception e) {
			log.log(Level.WARNING, "logff session failed", e);
		}
	}

	@Override
	public void kick(String comments) {}

	public synchronized void close() {
		if (!running)
			return;
		running = false;
		Thread t = new Thread("ASS tcp Session close") {
			public void run(){
				try {
					AssTcpServer.getInstance().getSessionHandler().removeSession(
							session.getId());
				} catch (Throwable e) {
					log.log(Level.WARNING, "" + session.getId(), e);
				}

				try {
					CallListener.getInstance().removePeerListener(account, AssTcpSession.this);
					CallListener.getInstance().removeChannelListener(account, AssTcpSession.this);
					CallListener.getInstance().removeUserListener(userID, AssTcpSession.this);
					CallListener.getInstance().removeConferenceListener(account, AssTcpSession.this);
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		};
		t.start();
		
	}

	private void handleChannel(C5Channel channel) {
//		String channelType = channel.getChannelType();
		String state = channel.getState();
//		String channelName = channel.getChannelName();
//		if (c5user.getSipNum() != null && c5user.isBusy()
//				&& !channel.getState().equals(Fields.Link)) {
//			if (!c5user.getStatus().equals(User.LISTENNING)
//					&& !c5user.getStatus().equals(User.LOOT)
//					&& !channelType.equals(Fields.dialout)
//					&& !channelType.equals(Fields.validate)
//					&& !c5user.getStatus().equals(User.OUTBOUND_CALL)) {
//				if (state.equals(Fields.Ring) || state.equals(Fields.Ringing)) {
//					try {
//						AMICore.getInstance().getAMIClient(pbx).sendAction(
//								new Hangup(channelName, Utils
//										.getSynActionID("hangup-tcp-busy")));
//					} catch (IOException e) {
//						e.printStackTrace();
//					}
//				}
//				return;
//			}
//		}
		if (state.equalsIgnoreCase(Fields.Hangup)) {
			c5user.setStatus(User.IDLE);
		}
		try {
			this.session.send(channel.getAllStatusString() + "\r\n");
		} catch (AppException e) {
			e.printStackTrace();
		} catch (SessionException e) {
			e.printStackTrace();
		}
	}

	public void asteriskConnected(AMIClient client) {
		if (!client.getId().equalsIgnoreCase(pbx))
			return;
		// queue add again
		C5Action queueaction = new C5Action("addqueuemember", Utils
				.getSynActionID("addqueuemember"));
		queueaction.addParameter(Fields.User, c5user);
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

	@Override
	public void phoneRegister(C5Event event) {
		if (!running)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			if(c5user.getExtenType(exten) != null) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void phoneUnregister(C5Event event) {
		if (!running)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			if(c5user.getExtenType(exten) != null) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void SipRemoved(C5Event event) {
		if (!running)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			if(c5user.getExtenType(exten) != null) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void channelStatusChanged(C5Channel channel) {
		if (!running)
			return;
		try {
			String exten = channel.getExten();
			if(c5user.getExtenType(exten) != null) {
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
	}

	@Override
	public void phoneUpdate(C5Event event) {
		if (!running)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			if(c5user.getExtenType(exten) != null) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void newEvent(C5Event event) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userAdded(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userBusy(User user) {
		if (!running)
			return;
		if(this.userID.equals(user.getId())) {
			C5Event event = new C5Event(Fields.Busy);
			event.addParameter(Fields.UserID, user.getId());
			event.addParameter(Fields.BusyType, user.getBusyType());
			this.sendEvent(event);
		}
	}

	@Override
	public void userCallsUpdate(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userLogin(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userLogoff(User event) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userRemoved(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userSignIn(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userSignOut(User user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void userStatus(User user) {
		if (!running)
			return;
		if(this.userID.equals(user.getId())) {
			C5Event event = new C5Event(Fields.UserStatus);
			event.addParameter(Fields.UserID, user.getId());
			event.addParameter(Fields.ExtenType, user.getExtenType());
			this.sendEvent(event);
		}
	}

	@Override
	public void userUnbusy(User user) {
		if (!running)
			return;
		if(this.userID.equals(user.getId())) {
			C5Event event = new C5Event(Fields.Busy);
			event.addParameter(Fields.UserID, user.getId());
			event.addParameter(Fields.BusyType, user.getBusyType());
			this.sendEvent(event);
		}
	}

	@Override
	public void conferenceJoin(C5Event event) {
		try{
			String exten = event.getStringValue(Fields.Exten);
			if(this.listeningConferences.contains(exten)) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void conferenceLeave(C5Event event) {
		try{
			String exten = event.getStringValue(Fields.Exten);
			if(this.listeningConferences.contains(exten)) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void conferenceMute(C5Event event) {
		try{
			String exten = event.getStringValue(Fields.Exten);
			if(this.listeningConferences.contains(exten)) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void conferenceStopTalking(C5Event event) {
//		try{
//			String exten = event.getStringValue(Fields.Exten);
//			if(this.listeningConferences.contains(exten)) {
//				this.sendEvent(event);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
	}

	@Override
	public void conferenceTalking(C5Event event) {
//		try{
//			String exten = event.getStringValue(Fields.Exten);
//			if(this.listeningConferences.contains(exten)) {
//				this.sendEvent(event);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
	}

	@Override
	public void conferenceUnmute(C5Event event) {
		try{
			String exten = event.getStringValue(Fields.Exten);
			if(this.listeningConferences.contains(exten)) {
				this.sendEvent(event);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
}
