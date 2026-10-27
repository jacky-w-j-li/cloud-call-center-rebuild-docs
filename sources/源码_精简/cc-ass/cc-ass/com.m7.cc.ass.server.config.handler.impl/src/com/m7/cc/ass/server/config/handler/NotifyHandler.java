package com.m7.cc.ass.server.config.handler;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class NotifyHandler {
	private static Logger log = Logger.getLogger(DownloadHandler.class
			.getName());

	public static C5Response notify(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			List<String> to = (List<String>)action.getParameterValue(Fields.To);
			String from = action.getStringValue(Fields.From);
			String type = action.getStringValue(Fields.Event);
			Object data = action.getParameterValue(Fields.Data);
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			for(int i=0;i<to.size();i++) {
				User user = account.getUser(to.get(i));
				if(user != null && user.isLogin() && user.getConnection() != null) {
					C5Event event = new C5Event(type);
					event.addParameter(Fields.From, from);
					event.addParameter(Fields.Data, data);
					event.addParameter(Fields.PBX, pbx);
					event.addParameter(Fields.Account, accountID);
					user.getConnection().sendEvent(event);
				}
			}
			response.setSucceed(true);
			response.setMessage("200");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
