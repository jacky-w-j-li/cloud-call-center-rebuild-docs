package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class ValidateHandler {
	public static Logger log = Logger
			.getLogger(ValidateHandler.class.getName());

	public static C5Response processValidate(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = (String) action
					.getParameterValue(Fields.Channel);
			String exten = (String) action.getParameterValue(Fields.Exten);
			String context = (String) action.getParameterValue(Fields.Context);

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);

				return response;
			} else {
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
						.getChannel(channelName);
				// If the channel for validatting is null, this action failed.
				if (channel == null) {
					response.setSucceed(false);
					response.setMessage("Can not find channel: " + channelName);
					return response;
				}
				C5Call call = channel.getCall();
				if(call == null){
					channel.setChannelType(Fields.validate);
					channel.addVar(Fields.Validate, exten);

					Redirect redirect = new Redirect(channelName, context, exten,
							"1", Utils.getSynActionID("Redirect"));
					AsteriskResponse res;
					res = amiClient.sendSynchronousAction(redirect);
					boolean result = res.isSuccessful();
					if (!result) {
						response.setSucceed(false);
						response.setMessage("Validate call failed: "
								+ res.toString());
					} else {
						response.setSucceed(true);
					}
				} else {
					return call.handleAction(action);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
