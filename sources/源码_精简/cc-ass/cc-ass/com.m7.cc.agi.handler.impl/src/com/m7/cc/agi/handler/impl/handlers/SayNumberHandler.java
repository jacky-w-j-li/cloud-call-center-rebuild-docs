package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class SayNumberHandler {
	
	private static Logger log = Logger.getLogger(SayNumberHandler.class.getName());
	
	/**
	 * agi_network: yes 
	 * agi_network_script: /GetCallerRecord?extension=5551212
	 * agi_request - The filename of your script 
	 * agi_channel - The originating channel (your phone) 
	 * agi_language - The language code (e.g. "en") 
	 * agi_type - The originating channel type (e.g. "SIP" or "ZAP") 
	 * agi_uniqueid - A unique ID for the call 
	 * agi_version - The version of Asterisk (since Asterisk 1.6) 
	 * agi_callerid - The caller ID number (or "unknown") 
	 * agi_calleridname - The caller ID name (or "unknown") 
	 * agi_callingpres - The presentation for the callerid in a ZAP channel 
	 * agi_callingani2 - The number which is defined in ANI2 see Asterisk Detailed Variable List (only for PRI Channels) 
	 * agi_callington - The type of number used in PRI Channels see Asterisk Detailed Variable List 
	 * agi_callingtns - An optional 4 digit number (Transit Network Selector) used in PRI Channels see Asterisk Detailed Variable List 
	 * agi_dnid - The dialed number id (or "unknown") 
	 * agi_rdnis - The referring DNIS number (or "unknown") 
	 * agi_context - Origin context in extensions.conf 
	 * agi_extension - The called number 
	 * agi_priority - The priority it was executed as in the dial plan 
	 * agi_enhanced - The flag value is 1.0 if started as an EAGI script, 0.0 otherwise 
	 * agi_accountcode - Account code of the origin channel 
	 * agi_threadid - Thread ID of the AGI script (since Asterisk 1.6)
	 * @param session
	 * @param params
	 */
	public static void handlerSayExten(C5Action action){
		try{
			AgiSession session = (AgiSession) action.getParameters().remove(Fields.Session);
			try{
				String agi_network_script = action.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(agi_network_script.indexOf('?')).split("=");
				String pbx = a[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
				if(channel == null){
					log.warning("Channel ["+channelName+"] not found");
					action.getParameters().clear();
					session.close();
					return;
				}
				if(channel.getLinkedChannel() == null){
					log.warning("channel not linked: "+channel.getChannelName());
					action.getParameters().clear();
					session.close();
					return;
				}
				if(channel.getLinkedChannel().getSipPeer() == null){
					log.warning("sip peer not found: "+channel.getLinkedChannel().getChannelName());
					action.getParameters().clear();
					session.close();
					return;
				}
				if(channel.getLinkedChannel().getSipPeer().getUser() == null){
					log.warning("user not found: "+channel.getLinkedChannel().getSipPeer().getExten());
					action.getParameters().clear();
					session.close();
					return;
				}
				action.getParameters().clear();
				String exten = channel.getLinkedChannel().getSipPeer().getUser().getExten();
				if(channel.getVar("queue_sayexten_announcement") != null){
					String annName = channel.getVar("queue_sayexten_announcement");
					session.send("STREAM FILE \"" + annName + "\" \"*\"");
				}
				session.send("SAY DIGITS "+exten+" \"#*\"");
				session.send("STREAM FILE \"sound/agentnumber\" \"*\"");
//				session.send("exec Playback \"sound/agentnumber\"");
				session.close();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
				action.getParameters().clear();
				session.close();
				return;
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
}
