package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class QueueHandler {
	public static Logger log = Logger.getLogger(QueueHandler.class.getName());

	public static void checkAssignable(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				log.warning("PBX " + pbx + " not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			C5Queue queue = c5pbx.getQueue(exten);
			if (queue == null) {
				log.warning("Queue " + exten + " not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			int idleMemberCount = queue.getQueueMembers().size()
					- queue.getBusyMemberCount();
			if (queue.getCalls() >= idleMemberCount) {
				session.send("SET VARIABLE queueAssignable 0");
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
}
