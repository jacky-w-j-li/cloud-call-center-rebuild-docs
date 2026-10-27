package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.log.IceLogger;

public class GetDisplayNameHandler {
	public static Logger log = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "GetDisplayName", "FINE", false);

	public static void hadle(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");//
				String pbxID = a[0].split("=")[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				action.getParameters().clear();
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
				String extenCode = null;
				String displayName = null;
				C5Channel channel = pbx.getChannel(channelName);
				SipPeer peer = channel.getSipPeer();
				if (channel != null && peer != null) {
					User user = peer.getUser();
					extenCode = user.getExten();
					displayName = user.getDisplayName();
					session.send("SET VARIABLE extenCode \""+extenCode+"\"");
					session.send("SET VARIABLE displayName \""+displayName+"\"");
				} else {
					session.send("SET VARIABLE extenCode 1");
					session.send("SET VARIABLE displayName 1");
				}
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}

}
