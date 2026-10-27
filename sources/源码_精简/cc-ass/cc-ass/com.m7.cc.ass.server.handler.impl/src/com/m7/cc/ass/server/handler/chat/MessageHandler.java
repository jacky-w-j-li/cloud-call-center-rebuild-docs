package com.m7.cc.ass.server.handler.chat;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class MessageHandler {
	
	private static Logger log = Logger.getLogger(MessageHandler.class.getName());
	
	public static C5Response handleMessage(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
//			String userID = action.getStringValue(Fields.UserID);
			String from = action.getStringValue(Fields.From);
			String to = action.getStringValue(Fields.To);
			String message = action.getStringValue(Fields.Message);
			
			User toUser = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getUser(to);
			if(toUser == null){
				response.setMessage("User not found");
				response.setSucceed(false);
				return response;
			}
			C5Connection connection = toUser.getConnection();
			if(connection == null) {
				response.setMessage("User not logined");
				response.setSucceed(false);
				return response;
			}
			C5Event event = new C5Event(Fields.Message);
			event.addParameter(Fields.From, from);
			event.addParameter(Fields.To, to);
			event.addParameter(Fields.Message, message);
			event.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
			connection.sendEvent(event);
		} catch (Exception e){
			response.setMessage("send message failed");
			response.setSucceed(false);
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
