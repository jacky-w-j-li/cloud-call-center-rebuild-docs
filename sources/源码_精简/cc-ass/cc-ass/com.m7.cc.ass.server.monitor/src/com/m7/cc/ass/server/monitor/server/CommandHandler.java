package com.m7.cc.ass.server.monitor.server;

import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.server.cdr.server.CDRServer;
import com.m7.cc.ass.server.monitor.handler.BundleHandler;
import com.m7.cc.ass.server.monitor.handler.GetChannelStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetConfigHandler;
import com.m7.cc.ass.server.monitor.handler.GetPBXStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetPeerStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetQueueStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetUserStatusHandler;
import com.m7.cc.ass.server.monitor.handler.ReloadHandler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CommandHandler {
	
	private static Logger log = Logger.getLogger(CommandHandler.class.getName());
	
	public static String processCommand(C5Action action) {
		if (action.getActionName().equalsIgnoreCase(Fields.Help)) {
			return getHelpString();
		} else if (action.getActionName().equalsIgnoreCase(Fields.Login)) {
			try{
				String user = action.getStringValue(Fields.User);
				String password = action.getStringValue(Fields.Password);
				if (user.equalsIgnoreCase(
						ASConfig.getInstance().getMonitorUser())
						&& password.equalsIgnoreCase(
								ASConfig.getInstance()
										.getMonitorPassword())) {
					String response = "Login succeed! \r\nWelcome to "
							+ ASConfig.getInstance().serverName + " "
							+ ASConfig.getInstance().version;
					return response;
				} else {
					return "Error password or user name";
				}
			} catch (Exception e){
				return e.getMessage();
			}
			
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetPBXStatus)) {
			String result = "";
			try {
				C5Response response = GetPBXStatusHandler.getPBXStatus(action);

				if (response.isSucceed()) {
					List<Map<String, Object>> events = (List<Map<String, Object>>) response
							.getParameterValue(Fields.Event);
					if (events.size() > 0)
						result = getPBXStatusString(events);
					else
						result = "No pbx found.";
				} else {
					result = response.getMessage();
				}
			} catch (Exception e) {
				result = e.getMessage();
			}
			return result;
		} else if (action.getActionName().equalsIgnoreCase(
				Fields.GetChannelStatus)) {
			String result = "";
			try {
				C5Response response = GetChannelStatusHandler
						.getChannelStatus(action);

				if (response.isSucceed()) {
					List<Map<String, Object>> channels = (List<Map<String, Object>>) response
							.getParameterValue(Fields.Event);
					if (channels.size() > 0) {
						result = getChannelString(channels);
					} else {
						result = "No channel found.";
					}
				} else {
					result = response.getMessage();
				}
			} catch (Exception e) {
				result = e.getMessage();
				log.log(Level.WARNING, "", e);
			}
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetQueueStatus)) {
			String result = "";
			try {
				C5Response response = GetQueueStatusHandler
						.getQueueStatus(action);

				if (response.isSucceed()) {
					List<Map<String, Object>> queues = (List<Map<String, Object>>) response
							.getParameterValue(Fields.Event);
					if (queues.size() > 0)
						result = getQueueString(queues);
					else
						result = "No queue found.";
				} else {
					result = response.getMessage();
				}
			} catch (Exception e) {
				result = e.getMessage();
				log.log(Level.WARNING, e.getMessage(), e);
			}
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetPeerStatus)) {
			String result = "";
			try {
				C5Response response = GetPeerStatusHandler
						.getPeerStatus(action);
				if (response.isSucceed()) {
					List<Map<String, Object>> peers = (List<Map<String, Object>>) response
							.getParameterValue(Fields.Event);
					if (peers.size() > 0)
						result = getPeerString(peers);
					else
						result = "No peer found.";
				} else {
					result = response.getMessage();
				}
			} catch (Exception e) {
				result = e.getMessage();
			}
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetUserStatus)) {
			String result = "";
			try {
				C5Response response = GetUserStatusHandler
						.getUserStatus(action);
				if (response.isSucceed()) {
					List<Map<String, Object>> peers = (List<Map<String, Object>>) response
							.getParameterValue(Fields.Event);
					if (peers.size() > 0)
						result = getUserString(peers);
					else
						result = "No peer found.";
				} else {
					result = response.getMessage();
				}
			} catch (Exception e) {
				result = e.getMessage();
			}
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetConfig)) {
			C5Response response = GetConfigHandler.getConfig(action);
			String result = response.getMessage();
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.Reload)) {
			C5Response response = ReloadHandler.reload(action);
			String result = response.getMessage();
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.Stop)) {
			String result = "This command is not implemented in this version.";
			return result;
		} else if (action.getActionName().equalsIgnoreCase(Fields.Update)) {
			C5Response response = BundleHandler.update(action);
			return response.getMessage();
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetBundle)) {
			C5Response response = BundleHandler.getBundles(action);
			try{
				return getBundleStatusString((List<Map<String, Object>>)response.getParameterValue(Fields.Event));
			} catch(Exception e){
				return e.getMessage();
			}
		} else if (action.getActionName().equalsIgnoreCase(Fields.gc)) {
			System.gc();
			return "Release memery complete.";
		} else if (action.getActionName().equalsIgnoreCase("ass")) {
			int a = CDRServer.getInstance().getCdrHandlers().size();
			return "cdr handler ["+a+"]";
		} else {
			return "Unkown command: " + action.getActionName();
		}
	}

	public static String getHelpString() {
		String str = ""
				+ "Busy                | {-p pbx} {-e exten} {-b true/false} Set the exten to busy\r\n"
				+ "GetPBXStatus        | [-p pbx prefix] Get status of pbx, if bpx is not \r\n"
				+ "                      identified all pbxs' status will return.\r\n"
				+ "GetChannelStatus    | [-p pbx] [-c channel prefix] Get the status of channel.\r\n"
				+ "                      If pbx is not identified all channels' status will return.\r\n"
				+ "GetConfig           | {-p pbx} {-f filename}\r\n"
				+ "GetQueueStatus      | [-p pbx] [-q queue] Get the status of queue. If pbx \r\n"
				+ "                      is not identified all queues' status will return.\r\n"
				+ "GetPeerStatus       | [-p pbx] [-e exten] [-o isOnline] Get the status of\r\n"
				+ "                      channel. If pbx is not identified all channels' status\r\n"
				+ "                      will return.\r\n"
				+ "Hangup              | {-p pbx} {-c channel} hangup a channel.\r\n"
				+ "Login               | {-u user} {-p password} Login ASS.\r\n"
				+ "Originate           | {-p pbx} {-c channel} {{-ap application} {-d data}} \r\n"
				+ "                      {{-ct context} {-e exten}} [-a async, -ca callerid, \r\n"
				+ "                      -t timeout, -v variable, -ac account] Originate a channel\r\n"
				+ "                      to a context with exten and priority.\r\n"
				+ "Park                | {-p pbx} {-c channel} {-fc fromChannel} [-t timeout]\r\n"
				+ "                      Park a channel.\r\n"
				+ "QueueAdd            | {-p pbx} {-i interface} {-q queue} {-pe penalty} \r\n"
				+ "                      {-m member} [-pa pasued true/false]\r\n"
				+ "QueueRemove         | {-p pbx} {-i interface}\r\n"
				+ "QueuePause          | {-p pbx} {-i interface} {-q queue} {-pa pasued}\r\n"
				+ "QueueRemove         | {-p pbx} {-c channel} {-v values}\r\n"
				+ "Reload              | Reload ASS configurations\r\n"
				+ "SetExtenTyp         | Set an online peer's exten type: Local/sip/gateway"
				+ "Transfer            | {-p pbx} {-c channel} [-ec extraChannel] {-e exten} \r\n"
				+ "                      {-ct context}\r\n";
		return str;
	}

	public static String getBundleStatusString(List<Map<String, Object>> events) throws Exception {
		String str = "";
		for(int i=0;i<events.size();i++){
			Map<String, Object> event = events.get(i);
			str = str + event.get(Fields.id)+" "
					+ event.get(Fields.Name)+" \r\n";
//					+ event.getStringValue(Fields.Version)+" \r\n";
		}
		return str;
	}
	
	public static String getPBXStatusString(List<Map<String, Object>> clients) throws Exception {
		String str = "";
		for (int i = 0; i < clients.size(); i++) {
			Map<String, Object> client = clients.get(i);
			str = str + client.get(Fields.PBX) + " "
					+ client.get(Fields.Host) + " "
					+ (((Boolean)client.get(Fields.Connected))?"connected ":"disconnect")+" "
					+ (((Boolean)client.get(Fields.Authenticated))?"login   ":"notLogin") + "\r\n";
		}
		return str;
	}

	public static String getChannelString(List<Map<String, Object>> channels) throws Exception{
		String str = "";
		for (int i = 0; i < channels.size(); i++) {
			Map<String, Object> channel = channels.get(i);
			str = str + channel.get(Fields.PBX) + " " + channel.get(Fields.ChannelStatus)
					+ " " + channel.get(Fields.ChannelType) + " " + channel.get(Fields.FromCid)
					+ " " + channel.get(Fields.FromDid) + " "
					+ channel.get(Fields.Account) + "\r\n\t" 
					+ channel.get(Fields.Peer) + " "
					+ channel.get(Fields.Channel) + "\r\n";
		}
		str += "Total channels: ["+channels.size()+"]";
		return str;
	}

	public static String getQueueString(List<Map<String, Object>> queues) throws Exception {
		String str = "";
		for (int i = 0; i < queues.size(); i++) {
			Map<String, Object> _queue = queues.get(i);
			str = str + _queue.get(Fields.Queue) + " " + _queue.get(Fields.PBX)
					+ " Complete[" + _queue.get(Fields.Completed) + "] "
					+ " Abandoned[" + _queue.get(Fields.Abandoned) + "] "
					+ " Waiting[" + _queue.get(Fields.Calls) + "]" + "\r\n";
			str = str
					+ "Member---------Paused-Membership-penalty-Location-----\r\n";
			List<Map<String, Object>> members = (List<Map<String, Object>>) _queue.get(Fields.QueueMember);
			for (int j=0;j<members.size();j++) {
				Map<String, Object> member = members.get(j);
				str = str + member.get(Fields.Name) + " "
						+ (((Boolean)member.get(Fields.Paused))?"paused":"idle") + " "
						+ member.get(Fields.Membership) + " " 
						+ member.get(Fields.Penalty)
						+ " " + member.get(Fields.Location) + "\r\n";
			}
			members = null;
			str = str + "Entry----------------------------------------\r\n";
			List<Map<String, Object>> entries = (List<Map<String, Object>>)_queue.get(Fields.QueueEntry);
			for (int j=0;j<entries.size();j++) {
				Map<String, Object> entry = entries.get(j);
				str = str + entry.get(Fields.CallerID) + " " 
						+ entry.get(Fields.Wait)
						+ " " + entry.get(Fields.CallerIDName) + " "
						+ entry.get(Fields.Position) + " "
						+ entry.get(Fields.Uniqueid)
						+ "\r\n";
			}
			entries = null;
		}
		return str;
	}

	public static String getPeerString(List<Map<String, Object>> peers) throws Exception {
		String str = "";
		for (int i = 0; i < peers.size(); i++) {
			Map<String, Object> peer = peers.get(i);
			str = str + peer.get(Fields.Exten) + " "
					+ peer.get(Fields.Status) + " " 
					+ peer.get(Fields.ObjectName) + " " 
					+ peer.get(Fields.Context) + " "
					+ peer.get(Fields.PBX)+" "
					+ "\r\n";
		}
		str += "Total peers ["+peers.size()+"]";
		return str;
	}
	
	public static String getUserString(List<Map<String, Object>> peers) throws Exception {
		String str = "";
		for (int i = 0; i < peers.size(); i++) {
			Map<String, Object> peer = peers.get(i);
			str = str
					+ peer.get(Fields.Account)+" "
					+ peer.get(Fields.User) + " "
					+ peer.get(Fields.Exten) + " " 
					+ peer.get(Fields.ExtenType) + " "
					+ (((Boolean)peer.get(Fields.Login)) ? "Online" : "Offline") + " "
					+ (((Boolean)peer.get(Fields.Busy)) ? "Busy" : "Idle") + " "
					+ peer.get(Fields.SipNum) + " "
					+ peer.get(Fields.Local) + " "
					+ peer.get(Fields.Browser)
					+ "\r\n";
		}
		str += "Total peers ["+peers.size()+"]";
		return str;
	}
}
