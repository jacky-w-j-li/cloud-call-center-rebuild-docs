package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueuePause;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class SetBusyHandler {
	private static final Logger log = Logger.getLogger(SetBusyHandler.class
			.getName());

	public static C5Response processBusy(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String user = (String) action.getParameterValue(Fields.Exten);
			String account = action.getStringValue(Fields.Account);
			boolean busy = (Boolean) action.getParameterValue(Fields.Busy);
			String busyType = busy ? "1" : "0";
			if (action.hasKey(Fields.BusyType)) {
				busyType = (String) action.getParameterValue(Fields.BusyType);
			}

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setMessage("can not find this pbx: " + pbx);
				response.setSucceed(false);
			} else {
				boolean result = true;
				User u = RuntimeData.getInstance().getAccount(pbx, account)
						.getUser(user);
				if (u == null) {
					response.setMessage("User [" + user + "@" + account
							+ "] not found.");
					response.setSucceed(false);
					return response;
				}
				if (u.getAutoBusyTimerTask() != null)
					u.getAutoBusyTimerTask().cancel();

				if (u.isBusy() != busy && u.getSipNum() != null
						&& u.getQueues().size() > 0) {
					QueuePause queuePause = new QueuePause("SIP/"
							+ u.getSipNum(), busy + "", action.getActionID());
					AsteriskResponse res = amiClient
							.sendSynchronousAction(queuePause);
					result = res.isSuccessful();
					if (!result) {
						response.setMessage("Pause member failed: "
								+ res.toString());
						response.setSucceed(false);
						return response;
					}
				}

				if (!u.getBusyType().equalsIgnoreCase(busyType)) {
					u.setBusy(busy);
					u.setBusyType(busyType);
					if (busy)
						CallListener.getInstance().userBusy(user,
								u);
					else
						CallListener.getInstance().userUnBusy(user,
								u);
				}

				response.setMessage("set busy succeed");
				response.setSucceed(true);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
