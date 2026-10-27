package com.m7.cc.agi.handler.impl.handlers;

import java.util.Hashtable;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.Monitor;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class LootCallHandler {

	public static Logger log = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "LootCall", "FINE", false);

	public static void hadle(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String exten = action.getStringValue(Fields.agi_extension);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbxID = a[0].split("=")[1];
				String cid = action.getStringValue(Fields.agi_callerid);
				String channelName = action.getStringValue(Fields.agi_channel);
				action.getParameters().clear();
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
				
				String accountID = null;
				String sipExten = channelName.substring(channelName.indexOf('/')+1, channelName.indexOf('-'));
				SipPeer peer = pbx.getPeer(sipExten);
				C5Channel channel = pbx.getChannel(channelName);
				if (peer == null) {
					if(channel == null) {
						log.warning("Account [" + channelName
								+ "] not found.");
						session.close();
						return;
					}
					accountID = channel.getAccount();
				} else accountID = peer.getAccount();
				
				C5Account account = pbx.getAccount(accountID);
				if (account == null) {
					log.warning("Account [" + accountID
							+ "] not found");
					session.close();
					return;
				}
				boolean hasAgentExten = false;
				String lootedExten = null;
				if(!exten.substring(1, exten.length()).equals("*")){
					hasAgentExten = true;
					lootedExten = exten.substring(1, exten.length());
				}
				
				Hashtable<String, C5Channel> channels = pbx.getChannels();
				Iterator it = channels.keySet().iterator();
				
				boolean isFind = false;
				C5Channel lootedChanenl = null;
				if(hasAgentExten){
					User user = account.getUserViaExten(lootedExten);
					String ccSipNum = user.getAvailableCCSipNumForLootCall();
					String userId = user.getId();
					while (it.hasNext()) {
						String curChannelName = it.next().toString();
						C5Channel curChannel = channels.get(curChannelName) ;
						if(curChannel.getState().equalsIgnoreCase(Fields.Ringing) && curChannel.getSipPeer()!=null){
							if(curChannel.getSipPeer().getExten().equals(ccSipNum)){
								lootedChanenl = curChannel;
								isFind = true;
								break;
							}
						}
					}
				}else{
					while (it.hasNext()) {
						String curChannelName = it.next().toString();
						C5Channel curChannel = channels.get(curChannelName) ;
						if(curChannel.getState().equalsIgnoreCase(Fields.Ringing) 
								&& curChannel.getChannelType().equals(Fields.normal)
								&& channel.getAccount().equals(curChannel.getAccount())
								&& channel.getPeer() != null){
							lootedChanenl = curChannel;
							isFind = true;
							break;
						}
					}
				}
				
				if(!isFind){
					//playback: lootfail,not found calling ,bye!
					session.send("SET VARIABLE lootFail \"1\"");
				}else{
					boolean isFindCaller = false;
					C5Channel callerChannel = null;
					String from_cid = lootedChanenl.getFromCid();
					Iterator its = channels.keySet().iterator();
					while (its.hasNext()) {
						String callerChannelName = its.next().toString();
						C5Channel curCallerChannel = channels.get(callerChannelName) ;
						if(curCallerChannel.getFromCid().indexOf(from_cid) != -1 && !curCallerChannel.getChannelName().equals(lootedChanenl.getChannelName())){
							isFindCaller = true;
							callerChannel = curCallerChannel;
							break;
						}
					}
					if(!isFindCaller){
						//playback: lootfail,not found calling ,bye!
						session.send("SET VARIABLE lootFail \"1\"");
					}else{
						//start monitor
//						callerChannel.setUserID(channel.getUserID());
						Monitor monitor = new Monitor(callerChannel.getChannelName(), Utils.getSynActionID("monitor"));
						monitor.setFile(callerChannel.getMonitorFilename());
						monitor.setMix("false");
						AMICore.getInstance().getAMIClient(callerChannel.getPbx()).sendAction(monitor);
						//new call
						Call call = new Call();
						call.setRoom(ASConfig.getThreeWayCallRoom() + "");
						call.setMainChannel(callerChannel);
						call.setSecondChannel(channel);
						C5Action unhold = new C5Action(Fields.Unhold, "");
						C5Response unholdRes = call.handleAction(unhold);
						if (!unholdRes.isSucceed()) {
							//playback: lootfail ,bye!
							session.send("SET VARIABLE lootFail \"2\"");
						}
						callerChannel.setState(Fields.Link);
						callerChannel.setLinked(true);
						callerChannel.setLinkedChannel(channel);
						callerChannel.setTimestamp(Utils.getCurrentTimestamp());
						CallListener.getInstance().channelStatusChanged(callerChannel);
						channel.setState(Fields.Link);
						channel.setLinked(true);
						channel.setLinkedChannel(callerChannel);
						channel.setTimestamp(Utils.getCurrentTimestamp());
						CallListener.getInstance().channelStatusChanged(channel);
					}
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
