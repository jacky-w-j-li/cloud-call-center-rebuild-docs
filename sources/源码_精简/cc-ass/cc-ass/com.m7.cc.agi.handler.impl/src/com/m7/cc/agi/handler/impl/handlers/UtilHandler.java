package com.m7.cc.agi.handler.impl.handlers;

import java.io.ObjectInputStream.GetField;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class UtilHandler {

	public static Logger log = Logger.getLogger(UtilHandler.class.getName());

	public static int random = 1;
	
	public static void getRandom(C5Action action) {
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
			String no = a[0].split("=")[1];
			session.send("SET VARIABLE RANDNUM "+random);
			random++;
			if(random > Integer.valueOf(no)) {
				random = 1;
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
	
	public static void hangupLinkChannel(C5Action action) {
		AgiSession session = (AgiSession) action.getParameters().remove(
				Fields.Session);
		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String channelName = action.getStringValue(Fields.agi_channel);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			
			C5Channel c5channel = RuntimeData.getInstance()
					.getPbxViaId(pbx)
					.getChannel(channelName);
			
			C5Channel lchannel = c5channel.getLinkedChannel();

			if (lchannel != null) {
				session.send("HANGUP " + lchannel.getChannelName());
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			session.close();
			return;
		}
	
	}
	
	public static void originateThirdPartyToThreewaycall(C5Action action){
		AgiSession session = (AgiSession) action.getParameters().remove(
				Fields.Session);
		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String channelName = action.getStringValue(Fields.agi_channel);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String no = null;
			if(a.length > 1){
				no = a[1].split("=")[1];
			}
			
			C5Channel c5channel = RuntimeData.getInstance()
					.getPbxViaId(pbx)
					.getChannel(channelName);
			C5Account account = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(c5channel.getAccount());
			//-----
			Originate originate = null;
			if(no == null){
				no = c5channel.getVar("MEETME_THIRD_PARTY_NUM");				
			}
			if(no == null){
				session.close();
				return;
			}
			String context = "threewaycall";
			String exten = c5channel.getVar("ORI_MEETME_NUM");
			String channel = "SIP/"+account.getSipContact(no, Fields.DialoutFlag)+ "@"
					+ ASConfig.getInstance().getDialoutLine()
					+ ":"
					+ ASConfig.getInstance().getDialoutPort();

			originate = new Originate(channel, exten, context, "1", Utils.getSynActionID("originateThirdPartyToThreewaycall"));
			
			originate.setAccount(c5channel.getAccount());
			originate.setAsync("true");
			originate.setTimeout("30000");
			try {
				AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
				amiClient.sendAction(originate);				
			} catch (Exception e) {
				log.log(Level.WARNING, "originateThirdPartyToThreewaycall has error!", e);
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			session.close();
			return;
		}
	}
	
	public static void setVarFromLinkChannel(C5Action action){
		AgiSession session = (AgiSession) action.getParameters().remove(
				Fields.Session);
		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String channelName = action.getStringValue(Fields.agi_channel);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String varName = a[1].split("=")[1];
			String varName1 = null;
			String varName2 = null;
			if(a.length > 2){
				varName1 = a[2].split("=")[1];
			}
			if(a.length > 3){
				varName2 = a[3].split("=")[1];
			}
			
			C5Channel c5channel = RuntimeData.getInstance()
					.getPbxViaId(pbx)
					.getChannel(channelName);
			if(c5channel.getLinkedChannel() != null){
				C5Channel lchannel = c5channel.getLinkedChannel();
				if(lchannel.getVar(varName) != null){
					if(varName.endsWith("FROM_CID")){
						session.send("SET VARIABLE "+ varName + " " + lchannel.getFromCid());
						c5channel.addVar(varName, lchannel.getFromCid());			
					}else if(varName.endsWith("FROM_DID")){
						session.send("SET VARIABLE "+ varName + " " + lchannel.getFromDid());
						c5channel.addVar(varName, lchannel.getFromDid());			
					}else{
						session.send("SET VARIABLE "+ varName + " " + lchannel.getVar(varName));
						c5channel.addVar(varName, lchannel.getVar(varName));						
					}
				}
				if(varName1 != null && lchannel.getVar(varName1) !=null){
					if(varName1.endsWith("FROM_CID")){
						session.send("SET VARIABLE "+ varName1 + " " + lchannel.getFromCid());
						c5channel.addVar(varName1, lchannel.getFromCid());			
					}else if(varName1.endsWith("FROM_DID")){
						session.send("SET VARIABLE "+ varName1 + " " + lchannel.getFromDid());
						c5channel.addVar(varName1, lchannel.getFromDid());			
					}else{
						session.send("SET VARIABLE "+ varName1 + " " + lchannel.getVar(varName1));
						c5channel.addVar(varName1, lchannel.getVar(varName1));
					}
				}
				if(varName2 != null && lchannel.getVar(varName2) !=null){
					if(varName2.endsWith("FROM_CID")){
						session.send("SET VARIABLE "+ varName2 + " " + lchannel.getFromCid());
						c5channel.addVar(varName2, lchannel.getFromCid());			
					}else if(varName2.endsWith("FROM_DID")){
						session.send("SET VARIABLE "+ varName2 + " " + lchannel.getFromDid());
						c5channel.addVar(varName2, lchannel.getFromDid());			
					}else{
						session.send("SET VARIABLE "+ varName2 + " " + lchannel.getVar(varName2));
						c5channel.addVar(varName2, lchannel.getVar(varName2));
					}
				}
			}else{
				log.log(Level.WARNING, "setVarFromLinkChannel " + channelName +" don't has link channel!");
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			session.close();
			return;
		}
	}
}
