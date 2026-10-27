package com.m7.cc.ass.gateway.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.gateway.config.GWFields;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CommonHandler {
	private static Logger log = Logger.getLogger(CommonHandler.class.getName());

	public static C5Response routeConfig(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String name = action.getStringValue(Fields.Peer);
			if (name.equalsIgnoreCase(GWFields.GWOutRoute)) {
				return OutRouteHandler.configOutRoute(action);
			} else if (name.equalsIgnoreCase(GWFields.GWInRoute)) {
				return InRouteHandler.configInRoute(action);
			} else if (name.equalsIgnoreCase(GWFields.GWDomain)) {
				return DomainHandler.configSipDomain(action);
			} else if (name.equalsIgnoreCase(GWFields.GWLine)) {
				return LineHandler.configLine(action);
			} else if (name.equalsIgnoreCase(GWFields.GWOutCallConfig)){
				return OutCallConfigHandler.configOutRoute(action);
			}
			response.setSucceed(false);
			response.setMessage("unknow peer");

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response peerAdd(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String name = action.getStringValue(Fields.Peer);
			if (name.equalsIgnoreCase(GWFields.GWBind400)) {
				return GW400Handler.bind400(action);
			} else if (name.equalsIgnoreCase(GWFields.GWLine)) {
				return LineHandler.addLine(action);
			} else if (name.equalsIgnoreCase(GWFields.GWRoute)) {
				return RouteHandler.addRoute(action);
			} else if (name.equalsIgnoreCase(Fields.ExtensionPeer)) {
				return ExtensionPeerHandler.addExtensionPeer(action);
			}
			response.setSucceed(false);
			response.setMessage("unknow peer");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response peerRemove(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String name = action.getStringValue(Fields.Peer);
			if (name.equalsIgnoreCase(GWFields.GWUnbind400)) {
				return GW400Handler.unbind400(action);
			} else if (name.equalsIgnoreCase(GWFields.GWLine)) {
				return LineHandler.removeLine(action);
			} else if (name.equalsIgnoreCase(GWFields.GWRoute)) {
				return RouteHandler.removeRoute(action);
			} else if (name.equalsIgnoreCase(Fields.ExtensionPeer)) {
				return ExtensionPeerHandler.removeExtensionPeer(action);
			}
			response.setSucceed(false);
			response.setMessage("unknow peer");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response effect(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String name = null;
			if (action.hasKey(Fields.Peer))
				name = action.getStringValue(Fields.Peer);
			if (name == null) {
				GWRuntimeData.getInstance().effectAll();
			} else {
				GWRuntimeData.getInstance().effect(name);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static void reload() {
		try {
			AMICore.getInstance().getAMIClient("gateway").reload();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void reload(String gatewayName) {
		try {
			AMICore.getInstance().getAMIClient(gatewayName).reload();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
}
