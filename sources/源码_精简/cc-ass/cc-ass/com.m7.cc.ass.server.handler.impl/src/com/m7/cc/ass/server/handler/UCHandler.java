package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.call.service.UserListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.UCtor;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class UCHandler {
	public static Logger log = Logger.getLogger(UCHandler.class.getName());

	private static String ucUrl;

	public void initUcHandler() {
		ucUrl = ASConfig.getInstance().getUcUrl() + ":"
				+ ASConfig.getInstance().getUcPort() + "/app";

		C5UCtor tor = new C5UCtor();
		CallListener.getInstance().addChannelListener("ALL", tor);
		CallListener.getInstance().addUserListener("ALL", tor);
		tor.start();
	}

	public static void ucCallsOpenScreenSend(C5Action action) {
		try {
			String data = action.getJsonString() + "\r\n";
			HttpProvider.sendPost(ucUrl, data.getBytes("UTF-8"));
		} catch (java.net.SocketTimeoutException e) {
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void ucCcLoginTypeSend(C5Action action) {
		try {
			String data = action.getJsonString() + "\r\n";
			HttpProvider.sendPost(ucUrl, data.getBytes("UTF-8"));
		} catch (java.net.SocketTimeoutException e) {
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

}

class C5UCtor extends UCtor implements ChannelListener, UserListener {
	public static Logger log = Logger.getLogger(UCtor.class.getName());

	public void start() {
		if (screenSendThread != null) {
			screenSendThread.interrupt();
			screenSendThread = null;
		}
		if (ccLoginSendThread != null) {
			ccLoginSendThread.interrupt();
			ccLoginSendThread = null;
		}
		screenSendThread = new Thread() {
			public void run() {
				C5Action action = null;
				while (true) {
					try {
						if (callsScreenUcQueues.size() > 0) {
							action = callsScreenUcQueues.remove(0);
							UCHandler.ucCallsOpenScreenSend(action);
						} else {
							synchronized (callsScreenUcQueues) {
								callsScreenUcQueues.wait();
							}
						}
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			}
		};
		ccLoginSendThread = new Thread() {
			public void run() {
				C5Action action = null;
				while (true) {
					try {
						if (ccLoginNotifyUcQueues.size() > 0) {
							action = ccLoginNotifyUcQueues.remove(0);
							 UCHandler.ucCcLoginTypeSend(action);
						} else {
							synchronized (ccLoginNotifyUcQueues) {
								ccLoginNotifyUcQueues.wait();
							}
						}

					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			}
		};
		screenSendThread.start();
		ccLoginSendThread.start();
	}

	@Override
	public void channelStatusChanged(C5Channel channel) {

		try {
			if (channel.getState().equalsIgnoreCase(Fields.Ringing)) {

				SipPeer peer = RuntimeData.getInstance().getSipPeer(
						channel.getPbx(), channel.getExten());
				if (peer != null) {
					C5Action action = new C5Action(Fields.PhoneRinging,
							Utils.getSynActionID(Fields.PhoneRinging));
					action.addParameter(Fields.Account, channel.getAccount());
					action.addParameter(Fields.UserID,
							channel.getVar(Fields.DisposalAgent));
					if (channel.getChannelType().equalsIgnoreCase(Fields.inner)) {
						User callerUser = RuntimeData
								.getInstance()
								.getAccount(channel.getPbx(),
										channel.getAccount())
								.getUserViaExten(channel.getFromCid());
						if (callerUser != null) {
							action.addParameter(Fields.UC_Caller,
									callerUser.getId());
						} else {
							action.addParameter(Fields.UC_Caller, "");
						}
						action.addParameter(Fields.Type, Fields.inner);
						action.addParameter(Fields.CallNo, channel.getFromCid());
					} else {// if inner call
						action.addParameter(Fields.UC_Caller, "");
						action.addParameter(Fields.Type, Fields.normal);
						action.addParameter(Fields.CallNo, channel.getFromCid());
					}
					action.addParameter(Fields.ExtenType, peer.getExtenType());
					action.addParameter(Fields.UC_ServerNo,
							channel.getFromDid());

					callsScreenUcQueues.addElement(action);
					synchronized (callsScreenUcQueues) {
						callsScreenUcQueues.notifyAll();
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void userLogin(User user) {
		try {
			SipPeer peer = RuntimeData.getInstance().getSipPeer(user.getPbx(),
					user.getOwnSipNums().get(Fields.sip));
			// if softPhone registered we send to uc the cclogin type.
			if (peer.getPeerStatus().equalsIgnoreCase(SipPeer.REGISTERED)) {
				C5Action action = new C5Action(Fields.UC_CCLoginType,
						Utils.getSynActionID(Fields.UC_CCLoginType));
				action.addParameter(Fields.Account, user.getAccount());
				action.addParameter(Fields.UserID, user.getId());
				action.addParameter(Fields.ExtenType, user.getExtenType());
				action.addParameter(Fields.IsLoginCallcenter, true);
				ccLoginNotifyUcQueues.addElement(action);

				synchronized (ccLoginNotifyUcQueues) {
					ccLoginNotifyUcQueues.notifyAll();
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void newExten(C5Event event) {
		// TODO Auto-generated method stub
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
	public void userBusy(User event) {
		// TODO Auto-generated method stub
	}

	@Override
	public void userCallsUpdate(User user) {
		// TODO Auto-generated method stub
	}

	@Override
	public void userLogoff(User user) {
		try {
			if (user.isReserve()) {
				return;
			}

			SipPeer peer = RuntimeData.getInstance().getSipPeer(user.getPbx(),
					user.getOwnSipNums().get(Fields.sip));
			if (peer.getPeerStatus().equalsIgnoreCase(SipPeer.REGISTERED)) {
				C5Action action = new C5Action(Fields.UC_CCLoginType,
						Utils.getSynActionID(Fields.UC_CCLoginType));
				action.addParameter(Fields.Account, user.getAccount());
				action.addParameter(Fields.UserID, user.getId());
				action.addParameter(Fields.IsLoginCallcenter, false);
				ccLoginNotifyUcQueues.addElement(action);

				synchronized (ccLoginNotifyUcQueues) {
					ccLoginNotifyUcQueues.notifyAll();
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void userRemoved(User user) {
		// TODO Auto-generated method stub
	}

	@Override
	public void userSignIn(User user) {
		this.userLogin(user);
	}

	@Override
	public void userSignOut(User user) {
		this.userLogoff(user);
	}

	@Override
	public void userStatus(User event) {
		// TODO Auto-generated method stub
	}

	@Override
	public void userUnbusy(User event) {
		// TODO Auto-generated method stub
	}
}