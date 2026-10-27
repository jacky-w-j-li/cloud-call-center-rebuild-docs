package com.m7.cc.ass.server.handler;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.C5Lisence;
import com.m7.cc.ass.model.C5LisenceHandler;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class LoginHandler {
	private static Logger log = Logger.getLogger(LoginHandler.class.getName());

	public static C5Response processLoginAction(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		int result = 200;
		String exten = null;
		try {
			// String user = action.getStringValue(Fields.User);
			// int a = user.indexOf('@');
			// if (a != -1)
			// user = user.substring(0, a);
			String userID = action.getStringValue(Fields.UserID);

			String password = action.getStringValue(Fields.Password);
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			String extenType = action.getStringValue(Fields.ExtenType);
			String platform = null;
			if (action.hasKey(Fields.Platform))
				platform = action.getStringValue(Fields.Platform);

			String busyType = null;
			boolean autoBusy = false;
			if (action.hasKey(Fields.AutoBusy)) {
				autoBusy = action.getBoolValue(Fields.AutoBusy);
				busyType = autoBusy ? Fields.B01 : Fields.B00;
			}

			if (action.hasKey(Fields.BusyType)) {
				busyType = action.getStringValue(Fields.BusyType);
			}

			 String extenParam = null;
			 if (action.hasKey(Fields.Exten))
				 extenParam = (String) action.getParameterValue(Fields.Exten);

			boolean authenticated = false;
			String appVersion = null;
			if(action.hasKey(Fields.AppVersion))
				appVersion = (String) action.getParameterValue(Fields.AppVersion);

			// This is a monitor user.
			// The account it will monitor will be setted via oth
			if (userID.equals(ASConfig.getInstance().getMonitorUser())
					&& password.equals(ASConfig.getInstance()
							.getMonitorPassword())) {
				authenticated = true;
				// loginAsMonitor(action, exchange);
			} else {
				C5Account c5Account = RuntimeData.getInstance().getAccount(pbx,
						account);
				User c5user = c5Account.getUser(userID);
				if (c5user == null) {
					response.setMessage("404 Error user/password/account");
					response.addParameter(Fields.Result, 404);
					response.setSucceed(false);
					return response;
				}
				
				if(appVersion != null){
					//all other version can login serviceVersion
//					if(!appVersion.equals(c5user.getVersion())){
//						response.setMessage("406 Error appVersion and userVersion");
//						response.addParameter(Fields.Result, 406);
//						response.setSucceed(false);
//						return response;
//					}
				}else{
					if(c5user.getVersion().equals(Fields.VersionService)){
						response.setMessage("406 Error appVersion and userVersion");
						response.addParameter(Fields.Result, 406);
						response.setSucceed(false);
						return response;
					}
				}
				
				if (!extenType.equalsIgnoreCase(Fields.none)) {
					exten = c5user.getOwnSipNums().get(extenType);
					if (exten == null) {
						if (extenParam != null) {
							exten = extenParam;
						} else {
							response.setMessage("400 No exten");
							response.addParameter(Fields.Result, 400);
							response.setSucceed(false);
							return response;
						}
					}
				}
				String mypassword = c5user.getPassword();
				if (mypassword == null)
					authenticated = false;
				else {
					if (mypassword.equals(password))
						authenticated = true;
					else
						authenticated = false;
				}
				if (!authenticated) {
					response.setMessage("404 Error user/password/account");
					response.addParameter(Fields.Result, 404);
					response.setSucceed(false);
					return response;
				}
				boolean isCallCenterLogin = platform != null
						&& platform.equals(Fields.IM) ? false : true;

				if (isCallCenterLogin) {
					// 1. kick user
					kickRelatedUser(pbx, account, exten, c5user);
					// 2. check lisence
					result = checkLisence(pbx, account, c5user,
							extenType);
					// 3. login this user
					if (result == 200) {
						result = loginCallCenter(pbx, account, userID, exten,
								extenType, busyType, c5user);
					}
				} else {
					result = loginIM(pbx, account, userID, exten, extenType, c5user);
				}
				if (result == 200) {
					response.setSucceed(true);
				} else
					response.setSucceed(false);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Login failed", e);
			response.setMessage(e.getMessage());
			result = 500;
			response.setSucceed(false);
		}
		response.addParameter(Fields.SipNum, exten);
		response.addParameter(Fields.Result, result);
		return response;
	}

	public static void kickRelatedUser(String pbx, String account,
			String exten, User user) throws Exception {
		// already logined, we need to kick the old session
		C5Connection connection = user.getConnection();
		if (connection != null) {
			connection.kick("ukick");
		} else {
			// kick offline prelogin
			if (user.getSipNum() != null && !user.getSipNum().equals("")) {
				kickOfflinePrelogin(user);
			}

			// kick the user who using the same exten
			if (exten != null && !exten.trim().equals("")) {
				kickOtherUserLoginWithSameExten(exten, pbx, account);
			}
		}
	}

	/**
	 * Kick offline users who using this exten
	 * 
	 * @param exten
	 * @throws Exception
	 */
	private static void kickOtherUserLoginWithSameExten(String exten,
			String pbx, String account) throws Exception {
		User user = RuntimeData.getInstance().getAccount(pbx, account)
				.getUserViaSipNum(exten);
		if (user == null) {
			return;
		} else {
			C5Connection connection = user.getConnection();
			if (connection != null) {
				connection.kick("ekick");
			} else {
				// remove it from queues
				for (int i = 0; i < user.getQueues().size(); i++) {
					String queue = user.getQueues().get(i);
					QueueRemove remove = new QueueRemove(queue, "SIP" + "/"
							+ exten, Utils
							.getSynActionID("SameExtenqueueremove"));
					try {
						AMICore.getInstance().getAMIClient(pbx)
								.sendSynchronousAction(remove);
					} catch (Exception e) {
						break;
					}
				}
				user.removeAllQueues();
				user.setExtenType("");
				user.setSipNum(null);
				user.setReserve(false);
				user.setLogin(false);
				CallListener.getInstance().userSignOut(exten, user);
			}
		}
	}

	private static void kickOfflinePrelogin(User user) {
		for (int i = 0; i < user.getQueues().size(); i++) {
			String queue = user.getQueues().get(i);
			QueueRemove remove = new QueueRemove(queue, "SIP" + "/"
					+ user.getSipNum(), Utils
					.getSynActionID("kickPreLoginqueueremove"));
			try {
				AMICore.getInstance().getAMIClient(user.getPbx())
						.sendSynchronousAction(remove);
			} catch (Exception e) {
				break;
			}
		}
		user.removeAllQueues();
		user.setExtenType("");
		user.setSipNum(null);
		user.setReserve(false);
	}

	private static int checkLisence(String pbx, String account, User user,
			String extenType) throws Exception {
		C5Account c5account = RuntimeData.getInstance()
				.getAccount(pbx, account);
		if (c5account == null) {
			return 404;
		}

		C5Lisence lisence = c5account.getLisence();
		if (!user.getUser().startsWith("admin")) {
			if (extenType.equalsIgnoreCase(Fields.none)) {
				int loginedCount = c5account.getUserLoginApp().size();
				int lisenceCount = lisence.getAppCount();
				if (lisenceCount > -1
						&& (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
					lisence = C5LisenceHandler.updateLisence(c5account);
					// no enough app license 602
					lisenceCount = lisence.getAppCount();
					if (lisence != null
							&& lisenceCount > -1
							&& (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
						return 602;
					}
				}
			} else {
				String version = user.getVersion();
				int loginedCount = c5account.getUserOfCall(version).size();
				log.log(Level.WARNING, user.getDisplayName()+" Login Version["+version+"] get loginedCount Account["
						+c5account.getAccount()+"] count=" + loginedCount);
				int lisenceCount = lisence.getCount(version);
				log.log(Level.WARNING, user.getDisplayName()+" Login Version["+version+"] get lisenceCount Account["
						+c5account.getAccount()+"] count=" + lisenceCount);
//				int loginedCount = c5account.getUserOfCall().size();
//				int lisenceCount = lisence.getCallCount();
				if (lisenceCount > -1
						&& (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
					lisence = C5LisenceHandler.updateLisence(c5account);
					// no enough call license 601
					lisenceCount = lisence.getCount(version);
					if (lisence != null
							&& lisenceCount > -1
							&& (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
						return 601;
					}
				}
			}
		}
		return 200;
	}

	private static int loginCallCenter(String pbx, String account,
			String userID, String exten, String extenType, String busyType,
			User c5user) throws Exception {
		List<String> myQueues = RuntimeData.getInstance().getQueuesOfUser(pbx,
				account, userID);
		C5Pbx amiClient = RuntimeData.getInstance().getPbxViaId(pbx);
		if (amiClient == null) {
			return 405;
		}

		// if logined as gateway or local and not queueremoved, we need to
		// remove it before login
		if (c5user.getExtenType().equalsIgnoreCase(Fields.gateway)
				|| c5user.getExtenType().equalsIgnoreCase(Fields.Local)) {
			C5Action queueaction = new C5Action("removequeuemember", Utils
					.getSynActionID("removequeuemember"));
			queueaction.addParameter(Fields.User, c5user);
			QueueActionHandler.queueRemove(queueaction);
		}
		c5user.setQueues(myQueues);
		c5user.setSipNum(exten);
		c5user.setExtenType(extenType);
		c5user.setLogin(true);
		c5user.setReserve(false);
		c5user.setBusyType(busyType);
		if (busyType.equals(Fields.B00)) {
			c5user.setBusy(false);
		} else {
			c5user.setBusy(true);
		}
		RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(c5user);
		CallListener.getInstance().userLogin(c5user.getUser(), c5user);
		SipPeer peer = null;
		if (exten != null)
			peer = amiClient.getPeer(exten);
		if (peer != null) {
			peer.setUser(c5user);
		}
		if (peer != null) {
			C5Action queueaction = new C5Action("addqueuemember", Utils
					.getSynActionID("addqueuemember"));
			queueaction.addParameter(Fields.User, c5user);
			if (!busyType.equals(Fields.B00)) {
				queueaction.addParameter(Fields.Paused, true);
			}
			QueueActionHandler.queueAdd(queueaction);
		}
		return 200;
	}

	private static int loginIM(String pbx, String account, String userID,
			String exten, String extenType, User c5user) throws Exception {
		C5Pbx amiClient = RuntimeData.getInstance().getPbxViaId(pbx);
		if (amiClient == null) {
			return 405;
		}
		if(exten != null) {
			SipPeer sipPeer = amiClient.getPeer(exten);
			if(sipPeer != null)
				sipPeer.setUser(c5user);
			c5user.setUcSipNum(exten);
			c5user.setUcExtenType(extenType);
			RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(c5user);
		}
		return 200;
	}

	public static C5Response processLogoff(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String userID = action.getStringValue(Fields.UserID);
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			boolean queueRemove = action.getBoolValue(Fields.QueueRemove);
			String comments = "";
			if (!queueRemove)
				comments = "reserve";
			if (action.hasKey(Fields.Comments))
				comments = action.getStringValue(Fields.Comments);
			logoff(pbx, account, userID, comments, queueRemove);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage("logoff failed");
			log.log(Level.WARNING, "logoff failed", e);
		}
		return response;
	}

	private static void logoff(String pbx, String account, String userID,
			String comments, boolean queueRemove) throws Exception {
		User c5user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userID);
		if (c5user == null) {
			throw new Exception("User not found");
		}

		c5user.setStatus(User.IDLE);
		c5user.setLogin(false);
		if (c5user.getExtenType().equals(Fields.none)) {
			c5user.setExtenType("");
			c5user.setSipNum(null);
			c5user.setReserve(false);
		} else {
			// if the exten is not null, we need to remove it from it's queues
			String lastSipNum = c5user.getOwnSipNums().get(c5user.getExtenType());
			if(c5user.isBusy()){
			
				C5Action setbusyaction = new C5Action("Busy", Utils
						.getSynActionID("Busy"));
				setbusyaction.addParameter(Fields.PBX, c5user.getPbx());
				setbusyaction.addParameter(Fields.Exten, c5user.getId());
				setbusyaction.addParameter(Fields.Account, c5user.getAccount());
				setbusyaction.addParameter(Fields.Busy, false);
				setbusyaction.addParameter(Fields.BusyType, "0");
				C5Response res = SetBusyHandler.processBusy(setbusyaction);
			}
			
			if (c5user.getSipNum() != null && queueRemove) {
				if (lastSipNum != null && !lastSipNum.equals(c5user.getSipNum())) {
					//if before kick ,this agent bind gateway sip num,so c5user.getSipNum() is new bind sipnum,we need remove real old sipnum
					c5user.setSipNum(lastSipNum);
				}
				C5Action queueaction = new C5Action("removequeuemember", Utils
						.getSynActionID("removequeuemember"));
				queueaction.addParameter(Fields.User, c5user);
				QueueActionHandler.queueRemove(queueaction);
			}
			if (queueRemove) {
				c5user.setExtenType("");
				c5user.setSipNum(null);
				c5user.setReserve(false);
			} else {
				c5user.setReserve(true);
			}
//			if (c5user.isBusy() && !c5user.getBusyType().equals(Fields.B99)) {
//				if (c5user.getSipNum() != null) {
//					QueuePause queuePause = new QueuePause("SIP/"
//							+ c5user.getSipNum(), false + "", Utils
//							.getSynActionID("queuepause"));
//					try {
//						AMICore.getInstance().getAMIClient(pbx)
//								.sendSynchronousAction(queuePause);
//					} catch (Exception e) {
//						log.log(Level.WARNING, "", e);
//					}
//				}
//				c5user.setBusy(false);
//				c5user.setBusyType(Fields.B00);
//				CallListener.getInstance().userUnBusy(c5user.getUser(), c5user);
//			}
		}
		C5Connection connection = c5user.getConnection();
		if (connection != null) {
			c5user.setConnection(null);
			connection.close();
		}

		RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(c5user);
		c5user.setLogoffComments(comments);
		CallListener.getInstance().userLogoff(c5user.getUser(), c5user);
	}
}
