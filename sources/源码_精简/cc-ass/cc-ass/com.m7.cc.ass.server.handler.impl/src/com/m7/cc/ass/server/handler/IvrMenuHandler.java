package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class IvrMenuHandler {
	public static Logger log = Logger.getLogger(IvrMenuHandler.class.getName());

	public static C5Response processIvrMenu(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = (String) action
					.getParameterValue(Fields.Channel);
			// String exten = (String) action.getParameterValue(Fields.Exten);
			String context = (String) action.getParameterValue(Fields.Context);
			String account = (String) action.getParameterValue(Fields.Account);

			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				response.setSucceed(false);
				response.setMessage("Can not find channel: " + channelName);
				return response;
			}

			IvrMenu menu = RuntimeData.getInstance().getAccount(pbx, account)
					.getIvrMenus().get(context);

			if (menu != null) {
				C5Call call = channel.getCall();
				if (call == null) {
					C5Channel lChannel = channel.getLinkedChannel();
					if (lChannel == null) {
						log.warning("channel is not linked");
						response.setMessage("303");
						response.setSucceed(false);
						return response;
					}
					Call mycall = new Call();
					mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
					mycall.setMainChannel(channel);
					mycall.setSecondChannel(lChannel);
					call = mycall;
					// Switch call(init) to chatting state
					C5Action unhold = new C5Action(Fields.Unhold, "");
					C5Response unholdRes = mycall.handleAction(unhold);
					unholdRes.addParameter(Fields.Message, "unhold failed");
					if (!unholdRes.isSucceed()) {
						return unholdRes;
					}
				} else {
					if (!call.getState().equalsIgnoreCase("chatting")) {
						log.warning("channel call state isn't chatting,so can't to ivrMenu!");
						response.setMessage("301");
						response.setSucceed(false);
						return response;
					}
				}
				call.getMainChannel().setIvrMenu(true);
				call.getSecondChannel().setIvrMenu(true);
				if (menu.getMenuType().equalsIgnoreCase(
						Fields.ivrMenuType_Inner)) {
					// Switch call(chatting) to valindating state
					// only put secondchannel put into meetme,mainchannel to
					// ivr-menu context.
					C5Action toIvrMenu = new C5Action(Fields.IvrMenuInner, "");
					toIvrMenu.addParameter(Fields.IvrMenuContext,
							menu.getContext());
					C5Response res = call.handleAction(toIvrMenu);
					if (!res.isSucceed()) {
						return res;
					}
					response.setSucceed(true);
				} else if (menu.getMenuType().equalsIgnoreCase(
						Fields.ivrMenuType_Out)) {
					// Switch call(chatting) to valindating state
					C5Action toIvrMenu = new C5Action(Fields.IvrMenuOut, "");
					toIvrMenu.addParameter(Fields.IvrMenu, menu);
					C5Response res2 = call.handleAction(toIvrMenu);
					if (!res2.isSucceed()) {
						return res2;
					}
					response.setSucceed(true);
				} else {
					log.warning("Unsupport ivrMenu Type: "+menu.getMenuType());
					response.setMessage("403");
					response.setSucceed(false);
					return response;
				}
			} else {
				log.warning("IvrMenu node not found: "+context);
				response.setMessage("404");
				response.setSucceed(false);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
