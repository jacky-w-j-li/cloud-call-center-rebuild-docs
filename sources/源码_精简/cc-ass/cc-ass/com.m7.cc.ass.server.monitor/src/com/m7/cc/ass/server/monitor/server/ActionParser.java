package com.m7.cc.ass.server.monitor.server;

import java.util.Hashtable;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class ActionParser {
	public static C5Action parseAction(String command) throws Exception {
		String[] params = command.split(" ");
		if (params.length % 2 != 1) {
			throw new Exception(
					"Error command, please use help to see all commands");
		}
		Hashtable<String, String> values = new Hashtable<String, String>();
		for (int i = 1; i < params.length; i = i + 2) {
			values.put(params[i].trim(), params[i + 1].trim());
		}
		if (params[0].equalsIgnoreCase(Fields.Login)) {
			if (params.length < 5) {
				throw new Exception(
						"Login failed: login [-u user] [-p password]");
			}
			C5Action action = new C5Action(Fields.Login, Utils.getSynActionID("login"));
			String password = values.get("-p");
			String user = values.get("-u");
			if (password == null || user == null) {
				throw new Exception(
						"Error command: login [-u user] [-p password]");
			}
			action.addParameter(Fields.User, user);
			action.addParameter(Fields.Password, password);
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.GetPBXStatus)) {
			C5Action action = new C5Action(Fields.GetPBXStatus, Utils
					.getSynActionID("GetPBXStatus"));
			if (values.containsKey("-p"))
				action.addParameter(Fields.PBX, values.get("-p"));
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.GetQueueStatus)) {
			C5Action action = new C5Action(Fields.GetQueueStatus, Utils
					.getSynActionID("GetQueueStatus"));
			String pbx = values.get("-p");
			String queue = values.get("-q");
			String account = values.get("-a");
			if (pbx != null)
				action.addParameter(Fields.PBX, pbx);
			if (queue != null)
				action.addParameter(Fields.Queue, queue);
			if (account != null)
				action.addParameter(Fields.Account, account);
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.GetPeerStatus)) {
			C5Action action = new C5Action(Fields.GetPeerStatus, Utils
					.getSynActionID("GetPeerStatus"));
			String pbx = values.get("-p");
			String peer = values.get("-e");
			String account = values.get("-a");
			if (pbx != null)
				action.addParameter(Fields.PBX, pbx);
			if (peer != null)
				action.addParameter(Fields.Peer, peer);
			if (account != null)
				action.addParameter(Fields.Account, account);
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.GetUserStatus)) {
			C5Action action = new C5Action(Fields.GetUserStatus, Utils
					.getSynActionID("GetUserStatus"));
			String pbx = values.get("-p");
			String peer = values.get("-e");
			String online = values.get("-o");
			String account = values.get("-a");
			if (pbx != null)
				action.addParameter(Fields.PBX, pbx);
			if (account != null)
				action.addParameter(Fields.Account, account);
			if (peer != null)
				action.addParameter(Fields.Peer, peer);
			if (online != null)
				action.addParameter(Fields.Online, online.equalsIgnoreCase("true"));
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.GetChannelStatus)) {
			C5Action action = new C5Action(Fields.GetChannelStatus, Utils
					.getSynActionID("GetChannelStatus"));
			String pbx = values.get("-p");
			String channel = values.get("-c");
			String account = values.get("-a");
			if (pbx != null)
				action.addParameter(Fields.PBX, pbx);
			if (channel != null)
				action.addParameter(Fields.Channel, channel);
			if (account != null)
				action.addParameter(Fields.Account, account);
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.Help)) {
			C5Action action = new C5Action(Fields.Help, Utils.getSynActionID("Help"));
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.Reload)) {
			C5Action action = new C5Action(Fields.Reload, Utils.getSynActionID("Reload"));
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.Busy)) {
			C5Action action = new C5Action(Fields.Busy, Utils.getSynActionID("Busy"));
			String pbx = values.get("-p");
			String exten = values.get("-e");
			String busy = values.get("-b");
			if (pbx == null || exten == null || busy == null)
				throw new Exception(
						"error command! Busy {-p pbx} {-e exten} {-b true/false}");
			else {
				action.addParameter(Fields.PBX, pbx);
				action.addParameter(Fields.Exten, exten);
				action.addParameter(Fields.Busy, busy.equalsIgnoreCase("true"));
			}
			return action;
		} else if (params[0].equalsIgnoreCase(Fields.Hangup)) {
			C5Action action = new C5Action(Fields.Hangup, Utils.getSynActionID("Hangup"));
			String pbx = values.get("-p");
			String channel = values.get("-c");
			if (pbx == null || channel == null)
				throw new Exception(
						"error command! hangup {-p pbx} {-c channel}");
			else {
				action.addParameter(Fields.PBX, pbx);
				action.addParameter(Fields.Channel, channel);
			}
			return action;
		}
//		else if (params[0].equalsIgnoreCase(Fields.Originate)) {
//			return processOriginate(values);
//		} else if (params[0].equalsIgnoreCase(Fields.Park)) {
//			return processPark(values);
//		} 
		else if (params[0].equalsIgnoreCase(Fields.QueueAdd)) {
			return processQueueAdd(values);
		} else if (params[0].equalsIgnoreCase(Fields.QueueRemove)) {
			return processQueueRemove(values);
		} else if (params[0].equalsIgnoreCase(Fields.QueuePause)) {
			return processQueuePause(values);
		} else if (params[0].equalsIgnoreCase(Fields.SetVar)) {
			return processSetVar(values);
		} else if (params[0].equalsIgnoreCase(Fields.Transfer)) {
			return processTransfer(values);
		} else if (params[0].equalsIgnoreCase(Fields.GetConfig)) {
			return processGetConfig(values);
		} else if (params[0].equalsIgnoreCase(Fields.SetExtenType)) {
			return processSetExtenType(values);
		} else if (params[0].equalsIgnoreCase(Fields.Stop)){
			return new C5Action(Fields.Stop, Utils.getSynActionID("stop"));
		} else if (params[0].equalsIgnoreCase(Fields.Update)){
			return processUpdateBundle(values);
		} else if (params[0].equalsIgnoreCase("ss")){
			return processGetBundle(values);
		} else if (params[0].equalsIgnoreCase("gc")){
			return new C5Action(Fields.gc, Utils.getSynActionID("gc"));
		} else {
			throw new Exception("Unknow action: " + command);
		}
	}
	
	private static C5Action processGetBundle(Hashtable<String, String> values) throws Exception{
		C5Action action= new C5Action(Fields.GetBundle, Utils.getSynActionID("GetBundle"));
		return action;
	}
	
	private static C5Action processUpdateBundle(Hashtable<String, String> values) throws Exception{
		C5Action action= new C5Action(Fields.Update, Utils.getSynActionID("update"));
		String bundle = values.get("-b");
		if(bundle != null)
			action.addParameter(Fields.id, bundle);
		else throw new Exception("error command! Update {-b bundle id}");
		return action;
	}
	
	private static C5Action processSetExtenType(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.SetExtenType, Utils.getSynActionID("setExtenType"));
		String pbx = values.get("-p");
		String exten = values.get("-e");
		String extentype = values.get("-t");
		if(pbx == null || exten == null || extentype == null){
			throw new Exception("error command! SetExtenType {-p pbx} {-e exten} {-t extenType}");
		}
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Exten, exten);
		action.addParameter(Fields.ExtenType, extentype);
		return action;
	}
	
	private static C5Action processTransfer(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.Transfer, Utils.getSynActionID("Transfer"));
		String pbx = values.get("-p");
		String channel = values.get("-c");
		String extraChannel = values.get("-ec");
		String exten = values.get("-e");
		String context =  values.get("-ct");
		
		if(pbx == null || channel == null || exten == null || context == null)
			throw new Exception(
					"error command! Transfer {-p pbx} {-c channel} " +
					"[-ec extraChannel] {-e exten} {-ct context}");
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Channel, channel);
		action.addParameter(Fields.Exten, exten);
		action.addParameter(Fields.Context, context);
		if(extraChannel != null)
			action.addParameter(Fields.ExtraChannel, extraChannel);
		return action;
	}
	
	private static C5Action processGetConfig(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.GetConfig, Utils.getSynActionID("getconfig"));
		String pbx = values.get("-p");
		String filename = values.get("-f");
		if(pbx == null || filename == null)
			throw new Exception(
					"error command! GetConfig {-p pbx} {-f filename}");
		action.addParameter(Fields.Filename, filename);
		action.addParameter(Fields.PBX, pbx);
		return action;
	}
	
	private static C5Action processSetVar(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.SetVar, Utils.getSynActionID("SetVar"));
		String pbx = values.get("-p");
		String channel = values.get("-c");
		String strValue = values.get("-v");
		if(pbx == null || channel == null || strValue == null)
			throw new Exception(
					"error command! QueueRemove {-p pbx} {-c channel} " +
					"{-v values}");
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Channel, channel);
		action.addParameter(Fields.Value, strValue);
		return action;
	}
	
	private static C5Action processQueuePause(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.QueuePause, Utils.getSynActionID("QueuePause"));
		String Interface = values.get("-i");
		String pbx = values.get("-p");
		String queue = values.get("-q");
		String paused = values.get("-pa");
		if(pbx == null || Interface == null || queue == null || paused == null)
			throw new Exception(
					"error command! QueuePause {-p pbx} {-i interface} " +
					"{-q queue} {-pa pasued}");
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Interface, Interface);
		action.addParameter(Fields.Queue, queue);
		action.addParameter(Fields.Paused, paused.equalsIgnoreCase("true"));
		return action;
	}
	private static C5Action processQueueRemove(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.QueueRemove, Utils.getSynActionID("QueueRemove"));
		String Interface = values.get("-i");
		String pbx = values.get("-p");
		String queue = values.get("-q");
		if(pbx == null || Interface == null || queue == null)
			throw new Exception(
					"error command! QueueRemove {-p pbx} {-i interface} " +
					"{-q queue}");
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Interface, Interface);
		action.addParameter(Fields.Queue, queue);
		return action;
	}
	
	private static C5Action processQueueAdd(Hashtable<String, String> values) throws Exception{
		C5Action action = new C5Action(Fields.QueueAdd, Utils.getSynActionID("QueueAdd"));
		String pbx = values.get("-p");
		String Interface = values.get("-i");
		String queue = values.get("-q");
		String penalty = values.get("-pe");
		String member = values.get("-m");
		String paused = values.get("-pa");
		
		if(pbx == null || Interface == null || queue == null
				|| penalty == null){
			throw new Exception(
					"error command! QueueAdd {-p pbx} {-i interface} " +
					"{-q queue} {-pe penalty} {-m member} " +
					"[-pa pasued true/false]");
		}
		if(member != null)
			action.addParameter(Fields.MemberName, member);
		action.addParameter(Fields.Penalty, penalty);
		if(paused != null)
			action.addParameter(Fields.Paused, paused.equalsIgnoreCase("true"));
		action.addParameter(Fields.PBX, pbx);
		action.addParameter(Fields.Interface, Interface);
		action.addParameter(Fields.Queue, queue);
		return action;
	}
	
	
//	private static C5Action processOriginate(Hashtable<String, String> values) throws Exception{
//		C5Action action = new C5Action(Utils
//				.getSynActionID("Originate"));
//		String pbx = values.get("-p");
//		String channel = values.get("-c");
//		String application = values.get("-ap");
//		String data = values.get("-d");
//		String context = values.get("-ct");
//		String exten = values.get("-e");
//		String async = values.get("-a");
//		String callid = values.get("-ca");
//		String timeout = values.get("-t");
//		String variable = values.get("-v");
//		String account = values.get("-ac");
//		String priority = values.get("-pr");
//		if(application ==null){
//			if(context == null)
//				throw new Exception(
//						"error command! Originate {-p pbx} {-c channel} " +
//						"{{-ap application} {-d data}} | {{-ct context} {-e exten}} " +
//						"[-a async, -ca callerid, -t timeout, -v variable, -ac account]");
//			else {
//				if(exten == null)
//					throw new Exception(
//							"error command! Originate {-p pbx} {-c channel} " +
//							"{{-ap application} {-d data}} | {{-ct context} {-e exten}} " +
//							"[-a async, -ca callerid, -t timeout, -v variable, -ac account]");
//			}
//		} else {
//			if(data == null)
//				throw new Exception(
//						"error command! Originate {-p pbx} {-c channel} " +
//						"{{-ap application} {-d data}} | {{-ct context} {-e exten}} " +
//						"[-a async, -ca callerid, -t timeout, -v variable, -ac account]");
//		}
//		if (pbx == null || channel == null)
//			throw new Exception(
//					"error command! Originate {-p pbx} {-c channel} " +
//					"{{-ap application} {-d data}} | {{-ct context} {-e exten} {-pr priority}} " +
//					"[-a async, -ca callerid, -t timeout, -v variable, -ac account]");
//		else {
//			action.setPbx(pbx);
//			action.setChannel(channel);
//			action.setAccount(account);
//			action.setApplication(application);
//			action.setAsync(async);
//			action.setCallerID(callid);
//			action.setContext(context);
//			action.setData(data);
//			action.setExten(exten);
//			action.setPriority(priority);
//			action.setTimeout(timeout);
//			action.setVariable(variable);
//		}
//		return action;
//	}
}
