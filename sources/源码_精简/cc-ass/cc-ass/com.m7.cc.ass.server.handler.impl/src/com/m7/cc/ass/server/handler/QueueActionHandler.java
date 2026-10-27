package com.m7.cc.ass.server.handler;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.asterisk.ami.action.QueuePause;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class QueueActionHandler {

	private static Logger log = Logger.getLogger(QueueActionHandler.class
			.getName());

	public static C5Response processQueueAdd(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);
				return response;
			} else {
				String queues = (String) action.getParameterValue(Fields.Queue);
				String intf = (String) action
						.getParameterValue(Fields.Interface);
				boolean paused = (Boolean) action
						.getParameterValue(Fields.Paused);
				if (queues.indexOf(',') > -1) {
					String[] a = queues.split(",");
					for (int i = 0; i < a.length; i++) {
						QueueAdd queueAdd = new QueueAdd(a[i], intf, Utils
								.getSynActionID("QueueAdd"));
						if (paused)
							queueAdd.setPaused("yes");
						amiClient.sendAction(queueAdd);
					}
				} else {
					QueueAdd queueAdd = new QueueAdd(queues, intf, Utils
							.getSynActionID("QueueAdd"));
					if (paused)
						queueAdd.setPaused("yes");
					amiClient.sendAction(queueAdd);
				}
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response processQueueRemove(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String queue = (String) action.getParameterValue(Fields.Queue);
			String intf = (String) action.getParameterValue(Fields.Interface);
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);
				return response;
			} else {
				QueueRemove queueRemove = new QueueRemove(queue, intf, Utils
						.getSynActionID("QueueRemove"));
				AsteriskResponse res = amiClient
						.sendSynchronousAction(queueRemove);
				boolean result = res.isSuccessful();
				if (!result) {
					response.setSucceed(false);
					response.setMessage("Remove member failed: "
							+ res.toString());
					return response;
				} else {
					response.setSucceed(true);
					return response;
				}
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response processQueuePause(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {

			String pbx = (String) action.getParameterValue(Fields.PBX);
			String intf = (String) action.getParameterValue(Fields.Interface);
			String queue = null;
			if (action.hasKey(Fields.Queue))
				queue = (String) action.getParameterValue(Fields.Queue);
			boolean paused = (Boolean) action.getParameterValue(Fields.Paused);
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);
				return response;
			} else {
				QueuePause queuePause = new QueuePause(intf, paused + "", Utils
						.getSynActionID("queuepause"));
				if (queue != null)
					queuePause.setQueue(queue);
				AsteriskResponse res = amiClient
						.sendSynchronousAction(queuePause);
				boolean result = res.isSuccessful();
				if (!result) {
					response.setSucceed(false);
					response.setMessage("Pause member failed: "
							+ res.toString());
				} else {
					response.setSucceed(true);
				}
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	/**
	 * User should be putted in this action, and the queues it will attend
	 * should be setted in User.queues.
	 * 
	 * @param _action
	 * @return
	 */
	public static C5Response queueAdd(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			User c5user = (User) action.removeParameter(Fields.User);
			Vector<String> myQueues = c5user.getQueues();
			if (c5user.getSipNum() == null) {
				response.setMessage("User has no peer: " + c5user.getUser());
				return response;
			}

			// if the exten is not null, we need to add it to it's queue
			String pbx = c5user.getPbx();
			if (!c5user.getExtenType().equalsIgnoreCase(Fields.none)
					&& myQueues != null && myQueues.size() > 0) {
				for (int i = 0; i < myQueues.size(); i++) {
					String queue = myQueues.get(i);
					String penalty = RuntimeData.getInstance().getQueue(pbx,
							queue).getPenalty(c5user.getId());
					boolean paused = false;
					if(action.hasKey(Fields.Paused))
						paused = true;
					QueueAdd queueAdd = new QueueAdd(queue, "SIP" + "/"
							+ c5user.getSipNum(), Utils
							.getSynActionID("queueadd"));
					queueAdd.setPanelty(penalty);
					if(paused)
						queueAdd.setPaused("yes");
					AsteriskResponse res = AMICore.getInstance().getAMIClient(
							pbx).sendSynchronousAction(
							queueAdd);
					boolean result = res.isSuccessful();
					if (!result) {
						log.warning("Add queue member failed: "
								+ response.getJsonString());
					} else {
						C5Queue c5queue = RuntimeData.getInstance().getQueue(pbx, queue);
						if(c5queue!= null) {
							C5QueueMember member = 
							new C5QueueMember( "SIP" + "/"
									+ c5user.getSipNum(), queue, c5queue.getAccount(), pbx);
							member.setExten(c5user.getSipNum());
							c5queue.addQueueMember(member);
						}
					}
				}
				response.setSucceed(true);
			} else {
				response.setSucceed(false);
				response.setMessage("User error: ");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	/**
	 * User should be putted in this action, and the queues it will attend
	 * should be setted in User.queues.
	 * 
	 * @param _action
	 * @return
	 */
	public static C5Response queueRemove(C5Action _action) {
		C5Response response = new C5Response(_action.getActionName(), _action
				.getActionID());
		try {
			User c5user = (User) _action.removeParameter(Fields.User);
			if (!c5user.getExtenType().equalsIgnoreCase(Fields.none)
					&& c5user.getSipNum() != null) {
				List<String> queues = RuntimeData.getInstance().getAccount(c5user.getPbx(),
						c5user.getAccount()).getQueueExtens();
				for (int i = 0; i < queues.size(); i++) {
					String queue = queues.get(i);
					QueueRemove action = new QueueRemove(queue, "SIP" + "/"
							+ c5user.getSipNum(), Utils
							.getSynActionID("queueremove"));
					AsteriskResponse res = AMICore.getInstance().getAMIClient(
							c5user.getPbx()).sendSynchronousAction(
							action);
					boolean result = res.isSuccessful();
					if (!result) {
//						log.warning("Remove queue member failed: "
//								+ response.toString());
					}
				}
				response.setSucceed(true);	
			} else {
				response.setSucceed(false);
				response.setMessage("User error: " + c5user.getUser() + " "
						+ c5user.getAccount());
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
