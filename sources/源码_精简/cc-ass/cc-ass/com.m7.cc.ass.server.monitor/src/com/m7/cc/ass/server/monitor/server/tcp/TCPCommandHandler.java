package com.m7.cc.ass.server.monitor.server.tcp;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.server.monitor.handler.BundleHandler;
import com.m7.cc.ass.server.monitor.handler.GetAccountStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetCdrClientHandler;
import com.m7.cc.ass.server.monitor.handler.GetChannelStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetConfigHandler;
import com.m7.cc.ass.server.monitor.handler.GetGWChannelHandler;
import com.m7.cc.ass.server.monitor.handler.GetLineChannelHandler;
import com.m7.cc.ass.server.monitor.handler.GetPBXAccountHandler;
import com.m7.cc.ass.server.monitor.handler.GetPBXChannelHandler;
import com.m7.cc.ass.server.monitor.handler.GetPBXDevHandler;
import com.m7.cc.ass.server.monitor.handler.GetPBXStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetPeerStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetQueueStatusHandler;
import com.m7.cc.ass.server.monitor.handler.GetUserStatusHandler;
import com.m7.cc.ass.server.monitor.handler.ReloadHandler;
import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class TCPCommandHandler {
	public static C5Response processCommand(C5Action action) {

		if (action.getActionName().equalsIgnoreCase(Fields.Login)) {
			C5Response response = new C5Response(action);
			try {
				String user = action.getStringValue(Fields.User);
				String password = action.getStringValue(Fields.Password);
				if (user.equalsIgnoreCase(ASConfig.getInstance()
						.getMonitorUser())
						&& password.equalsIgnoreCase(ASConfig.getInstance()
								.getMonitorPassword())) {
					String msg = "Login succeed! \r\nWelcome to "
							+ ASConfig.getInstance().serverName + " "
							+ ASConfig.getInstance().version;
					response.setMessage(msg);
					response.setSucceed(true);
					return response;
				} else {
					response.setMessage("Error password or user name");
					response.setSucceed(false);
					return response;
				}
			} catch (Exception e) {
				response.setMessage(e.getMessage());
				response.setSucceed(false);
				return response;
			}
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetPBXStatus)) {
			return GetPBXStatusHandler.getPBXStatus(action);
		} else if (action.getActionName().equalsIgnoreCase(
				Fields.GetChannelStatus)) {
			return GetChannelStatusHandler.getChannelStatus(action);
		} else if (action.getActionName().equalsIgnoreCase(
				Fields.GetQueueStatus)) {
			return GetQueueStatusHandler.getQueueStatus(action);
		} else if (action.getActionName()
				.equalsIgnoreCase(Fields.GetPeerStatus)) {
			return GetPeerStatusHandler.getPeerStatus(action);
		} else if (action.getActionName()
				.equalsIgnoreCase(Fields.GetUserStatus)) {
			return GetUserStatusHandler.getUserStatus(action);
		} else if (action.getActionName()
				.equalsIgnoreCase(Fields.GetAccountStatus)) {
			return GetAccountStatusHandler.getAccountStatus(action);
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetConfig)) {
			return GetConfigHandler.getConfig(action);
		} else if (action.getActionName().equalsIgnoreCase(Fields.Reload)) {
			return ReloadHandler.reload(action);
		} else if (action.getActionName().equalsIgnoreCase(Fields.Stop)) {
			return new C5Response(action.getActionName(), action.getActionID(),
					"Not allowed in current version of ASS", false);
		} else if (action.getActionName().equalsIgnoreCase(Fields.Update)) {
			return BundleHandler.update(action);
		} else if (action.getActionName().equalsIgnoreCase(Fields.GetBundle)) {
			return BundleHandler.getBundles(action);
		} else if (action.getActionName().equalsIgnoreCase(Fields.gc)) {
			System.gc();
			return new C5Response(action.getActionName(), action.getActionID(),
					"Release memery complete.", true);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetPBXDev)) {
			return GetPBXDevHandler.getPBXDev(action);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetPBXChannel)) {
			return GetPBXChannelHandler.getPBXChannel(action);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetCdrClient)) {
			return GetCdrClientHandler.getCdrClient(action);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetPBXAccount)) {
			return GetPBXAccountHandler.getPBXAccount(action);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetGWChannel)) {
			return GetGWChannelHandler.getGWChannel(action);
		} else if(action.getActionName().equalsIgnoreCase(MonitorFields.GetLineChannel)) {
			return GetLineChannelHandler.getLineChannel(action);
		} else {
			return new C5Response(action.getActionName(), action.getActionID(),
					"Unkown command: " + action.getActionName(), false);
		}
	}
}
