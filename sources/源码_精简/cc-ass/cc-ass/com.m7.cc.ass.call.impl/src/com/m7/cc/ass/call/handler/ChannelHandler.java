package com.m7.cc.ass.call.handler;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;

public class ChannelHandler {
	private static Logger log = Logger
			.getLogger(ChannelHandler.class.getName());
	public static void hangup(C5Channel channel) throws IOException {
		if(channel == null){
			log.log(Level.WARNING, "We want to hangup the channel, but it is null!");
			return;
		}
		Hangup action = new Hangup(channel.getChannelName(), Utils
				.getSynActionID("hangup"));
		AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(action);
	}

	public static void redirect(C5Channel channel, String context,
			String exten, String priority) throws Exception {
		Redirect action = new Redirect(channel.getChannelName(), context,
				exten, priority, Utils.getSynActionID("redirect"));
		AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(action);
	}

	public static boolean redirectSyn(C5Channel channel, String context,
			String exten, String priority) throws Exception {
		Redirect action = new Redirect(channel.getChannelName(), context,
				exten, priority, Utils.getSynActionID("redirect"));
		AsteriskResponse res = AMICore.getInstance().getAMIClient(
				channel.getPbx()).sendSynchronousAction(action);
		return res.isSuccessful();
	}
	
	public static void redirect(C5Channel channel, C5Channel extraChannel, String context,
			String exten, String priority) throws Exception {
		Redirect action = new Redirect(channel.getChannelName(), context,
				exten, priority, Utils.getSynActionID("redirect"));
		action.setExtraChannel(extraChannel.getChannelName());
		AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(action);
	}

	public static boolean redirectSyn(C5Channel channel, C5Channel extraChannel, String context,
			String exten, String priority) throws Exception {
		Redirect action = new Redirect(channel.getChannelName(), context,
				exten, priority, Utils.getSynActionID("redirect"));
		action.setExtraChannel(extraChannel.getChannelName());
		AsteriskResponse res = AMICore.getInstance().getAMIClient(
				channel.getPbx()).sendSynchronousAction(action);
		return res.isSuccessful();
	}

	public static boolean redirectToQueueHangupPeer(C5Channel channel)
			throws Exception {
		if (channel.getQueue() != null) {

			C5Queue queue = RuntimeData.getInstance().getQueue(
					channel.getPbx(), channel.getQueue());
			if (queue.getToPeerWhenHanguped() != null
					&& !queue.getToPeerWhenHanguped().equals("0")) {
				String context = "";
				String exten = "s";
				String priority = "1";
				if (queue.getToPeerWhenHanguped().equals("1")) {
					context = channel.getAccount() + "-" + Fields.investigate;
					exten = "s";
					priority = "1";
				} else {
					ServicePeer peer = RuntimeData.getInstance().getAccount(
							channel.getPbx(), channel.getAccount())
							.getServicePeer(queue.getToPeerWhenHanguped());
					if (peer != null) {

						String actionString = peer.getActionString().trim();
						if (actionString != null
								&& actionString.startsWith("goto")) {
							String[] command = actionString.substring(4).split(
									",");
							context = command[0].trim();
							exten = command[1].trim();
							if (exten.contains("\\$")) {
								String varExten = "";
								if(exten.length() > 9){
									String varName = exten.substring(4, exten.length()-2);
									varExten = channel.getVar(varName);
									if(varExten == null && varName != null && varName.equals("FROM_DID"))
										varExten = channel.getFromDid();
								}
								if(varExten != null && !varExten.equals("")){
									exten = varExten;
								}else{
									exten = "1";									
								}
							}
							priority = command[2].trim();
							if(priority.equals("0"))
								priority = "1";
						}
					}
				}
				ChannelHandler.redirect(channel, context, exten, priority);
				return true;
			}
		}
		return false;
	}
}
