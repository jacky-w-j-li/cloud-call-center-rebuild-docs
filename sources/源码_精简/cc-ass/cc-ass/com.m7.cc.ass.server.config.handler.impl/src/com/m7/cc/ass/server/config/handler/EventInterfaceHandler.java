package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.EventInterface;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class EventInterfaceHandler {
	private static Logger log = Logger.getLogger(EventInterfaceHandler.class
			.getName());

	public EventInterfaceHandler() {

	}

	public static C5Response addEventInterface(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			boolean result = false;
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			
			if (null == accountID)
			{
				log.warning("Account should not be null in this action: "
						+ action.getJsonString());
				response.setMessage("Account should not be null in this action");
				response.setSucceed(false);
				return response;
			}
			
			boolean updateOrNot = action.getBoolValue(Fields.Update);
			String eventType = action.getStringValue(Fields.EventType);
			String concreteType = action.getStringValue(Fields.ConcreteType);
			String url = action.getStringValue(Fields.Url);
			String name = action.getStringValue(Fields.Name);
			String key = action.getStringValue("UrlKey");
			EventInterface eventInterface = new EventInterface(pbx, accountID);
			if (null == eventInterface) {
				log.warning("EventInterface should not be null: "
						+ action.getJsonString());
				response.setMessage("EventInterface should not be null");
				response.setSucceed(false);
				return response;
			}
			
			eventInterface.setName(name);
			eventInterface.setEventType(eventType);
			eventInterface.setConcreteType(concreteType);
			eventInterface.setUrl(url);
			eventInterface.setKey(key);
			
			if (!updateOrNot) { // Add
				result = RuntimeData.getInstance().addEventInterface(pbx, accountID,
						eventInterface);
			} else { // update
				result = RuntimeData.getInstance().updateEventInterface(pbx, accountID,
						eventInterface);	
			}
			response.setSucceed(result);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	public static C5Response removeEventInterface(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			boolean result = false;
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			
			if (null == accountID)
			{
				log.warning("Account should not be null in this action: "
						+ action.getJsonString());
				response.setMessage("Account should not be null in this action");
				response.setSucceed(false);
				return response;
			}
			
			
			String name = action.getStringValue(Fields.Name);
			
			result = RuntimeData.getInstance().removeEventInterface(pbx, accountID,
						name);	
			response.setSucceed(result);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}

}
