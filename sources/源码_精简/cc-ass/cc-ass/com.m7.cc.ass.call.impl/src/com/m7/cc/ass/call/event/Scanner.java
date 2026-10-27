package com.m7.cc.ass.call.event;

import java.util.Enumeration;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ami.service.scan.QueueScanListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class Scanner implements QueueScanListener {
	private static Logger log = Logger.getLogger(Scanner.class.getName());
	private static Scanner instance;

	private Scanner() {
		instance = this;
	}

	public static Scanner getInstance() {
		if (instance == null) {
			new Scanner();
		}
		return instance;
	}

	@Override
	public void scanQueueMember(String pbxID) {
		if (pbxID.equalsIgnoreCase(Fields.gateway)) {
			return;
		}
		C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
		if (pbx == null) {
			return;
		}
		Enumeration<C5Queue> queues = pbx.getQueues().elements();

		String memberID;
		String sipNo;
		User user = null;
		C5Account account = null;
		C5Queue queue = null;
		QueueAdd queueAdd = null;
		Iterator<String> memberIdIte = null;
		try {
			while (queues.hasMoreElements()) {
				queue = queues.nextElement();
				if(queue.isRemoved())
					continue;
				memberIdIte = queue.getMemberSet().iterator();
				while (memberIdIte.hasNext()) {
					memberID = memberIdIte.next();
					account = RuntimeData.getInstance().getAccount(pbxID,
							queue.getAccount());
					if (account == null) {
						continue;
					}
					user = account.getUser(memberID);
					if (user == null) {
						continue;
					}
					if (user.getExtenType() == null
							|| user.getExtenType().equals("")) {
						continue;
					}
					sipNo = user.getOwnSipNums().get(user.getExtenType());
					if (sipNo != null && !sipNo.equals("")) {
						sipNo = "SIP/" + sipNo;
						if (queue.getMember(sipNo) == null) {
							String penalty = queue.getPenalty(user.getId());
							queueAdd = new QueueAdd(queue.getExten(), sipNo,
									Utils.getSynActionID("QueueAdd"));
							queueAdd.setPanelty(penalty);
							if (!user.getBusyType().equals(Fields.B00)) {
								queueAdd.setPaused("yes");
							}
							AMICore.getInstance().getAMIClient(pbxID)
									.sendAction(queueAdd);
							log.warning("The user " + user.getDisplayName()
									+ " of account " + user.getAccount()
									+ " has logined, but not in queue "
									+ queue.getExten() + ", we add it[" + sipNo
									+ "]");
						}
					}
				}
			}
			log.log(Level.INFO, "Finish queue of " + pbxID + " scaning.");
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}

}
