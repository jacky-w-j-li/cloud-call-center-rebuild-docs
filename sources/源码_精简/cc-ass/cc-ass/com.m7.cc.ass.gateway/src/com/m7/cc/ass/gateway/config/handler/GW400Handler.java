package com.m7.cc.ass.gateway.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.config.GWFields;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GW400Handler {
	private static Logger log = Logger.getLogger(LineHandler.class.getName());

	public static C5Response bind400(C5Action action) {
		C5Response response = new C5Response(action);

		try {
			String numberOf400 = action.getStringValue(GWFields.NUMBER_400);
			String serviceNo = action.getStringValue(GWFields.SERVICE_NO);
			String accountId = action.getStringValue(Fields.Account);

			if (numberOf400 == null) {
				response.setSucceed(false);
				response.setMessage("400 number is null.");
				return response;
			}
			if (serviceNo == null) {
				response.setSucceed(false);
				response.setMessage("ServiceNo is null.");
				return response;
			}
			if (accountId == null) {
				response.setSucceed(false);
				response.setMessage("Account is null.");
				return response;
			}

			ASConfig.getInstance().addBinded400(serviceNo, numberOf400,
					accountId, "0");
			ASConfig.getInstance().update400File();
			response.setSucceed(true);
			log.info("The binding of 400 [" + numberOf400 + "] success.");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response unbind400(C5Action action) {
		C5Response response = new C5Response(action);

		try {
			String numberOf400 = action.getStringValue(GWFields.NUMBER_400);
			String serviceNo = action.getStringValue(GWFields.SERVICE_NO);

			if (numberOf400 == null) {
				response.setSucceed(false);
				response.setMessage("400 number is null.");
				return response;
			}
			if (serviceNo == null) {
				response.setSucceed(false);
				response.setMessage("ServiceNo is null.");
				return response;
			}

			ASConfig.getInstance().removeBinded400(serviceNo);
			ASConfig.getInstance().update400File();
			response.setSucceed(true);
			log.info("The binding of 400 [" + numberOf400
					+ "] has been removed.");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
