package com.m7.cc.ass.server.config.handler;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class UserHandler {

	public static Logger log = Logger.getLogger(UserHandler.class.getName());

	public static C5Response addUser(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			String id = null;
			if (action.hasKey(Fields.id))
				id = action.getStringValue(Fields.id);
			else
				id = action.getStringValue(Fields.UserID);

			if (account == null) {
				log.warning("Account should not be null in this action: "
						+ action.getJsonString());
				response
						.setMessage("Account should not be null in this action");
			} else {
				Vector<User> _users = new Vector<User>();
				User u = RuntimeData.getInstance().getAccount(pbx, account)
						.getUser(id);
				if (u == null)
					u = new User(pbx, account, id);
				u.setValues(action.getParameters());

				_users.add(u);
				response.setSucceed(RuntimeData.getInstance().updateUser(pbx,
						account, _users));
//				RuntimeData.getInstance().effectAll(pbx, account);
//				RuntimeData.getInstance().getPbxViaId(pbx).reload();
				if (u.getExten() != null)
					CallListener.getInstance().userAdded(u.getExten(), u);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, action.getJsonString(), e);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response removeUser(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			if (account == null) {
				log.warning("Account should not be null in this action: "
						+ action.getJsonString());
				response
						.setMessage("Account should not be null in this action");
			} else {
				String user = action.getStringValue(Fields.User);
				Vector<String> _users = new Vector<String>();
				String[] users = user.split(",");
				AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
				for (int i = 0; i < users.length; i++) {
					_users.add(users[i]);
					// Remove member from queue by AMI
					User u = RuntimeData.getInstance().getAccount(pbx, account)
							.getUser(users[i]);
					if(u != null){
						String sipNo = u.getSipNum();
						Vector<String> queues = u.getQueues();
						if (u != null && sipNo != null && queues != null
								&& queues.size() > 0) {
							for (int j = 0; j < queues.size(); j++) {
								QueueRemove queueRemove = new QueueRemove(queues
										.get(j), "SIP/" + sipNo, Utils
										.getSynActionID("UserRemove"));
								amiClient.sendAction(queueRemove);
							}
						}
						// Remove userID member from queues.conf
						List<String> queueExtens = RuntimeData.getInstance().getQueuesOfUser(pbx, account, users[i]);
						C5Queue queue = null;
						for(String queueExten : queueExtens){
							queue = RuntimeData.getInstance().getQueue(pbx, queueExten);
							queue.removeMember(u.getId());
						}
						if(queue != null){
							RuntimeData.getInstance().updateQueue(pbx, account, queue);
						}
					}else{
						log.log(Level.WARNING, "remove User Failed! not found user from cache!");
					}
				}
				response.setSucceed(RuntimeData.getInstance().removeUser(pbx,
						account, _users));
				RuntimeData.getInstance().effectAll(pbx, account);
				RuntimeData.getInstance().getPbxViaId(pbx).reload();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, action.getJsonString(), e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}

		return response;
	}
}
