package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class SatisfactionHandler {
	public static Logger log = Logger.getLogger(SatisfactionHandler.class
			.getName());

	public static void satisfaction(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);

			action.getParameters().clear();
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}

			// pick options from account
			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());

			boolean isInvalid = account.getSatistionOptions().getOptions()
					.containsKey(exten);

			if (isInvalid) {
				session.send("SET VARIABLE VALID_FLAG 1");
			} else {
				session.send("SET VARIABLE VALID_FLAG 0");
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if (session != null) {
				session.close();
			}
		}
	}
}
