package com.m7.cc.ass.server.config;

import java.util.HashMap;

import com.cc.net.httpserver.HttpExchange;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;

public class RequestParser {
	private JSONReader jsonReader = new JSONReader();

	public RequestParser() {
	}

	public void parserPacket(String data, HttpExchange exchange)
			throws Exception {
		if (data.indexOf(Fields.END_ACTION) == -1)
			throw new Exception("Error action string: \r\n" + data);
		String[] commands = data.split(Fields.END_ACTION);
		C5Response[] responses = new C5Response[commands.length];
		try {
			for (int i = 0; i < commands.length; i++) {
				HashMap<String, Object> map = (HashMap<String, Object>) jsonReader
						.read(commands[i]);
				String commandType = (String) map.get(Fields.Command);
				if (commandType.equalsIgnoreCase(Fields.Action)) {
					responses[i] = parseAction(map);
				} else {
					throw new Exception("Error action");
				}
			}

		} catch (Exception e) {
			throw e;
		}
		String res = "";
		for (int i = 0; i < responses.length; i++)
			res += responses[i].getJsonString() + Fields.END_ACTION;
		if (res.endsWith(Fields.END_ACTION)) {
			res = res.substring(0, res.length() - 2);
			ACSHttpServer.sendOK(res, exchange);
		} else {
			ACSHttpServer.sendOK(new C5Response("", "", "No Action found", false), exchange);
		}
	}

	private C5Response parseAction(HashMap<String, Object> map)
			{
		String actionName = (String) map.get(Fields.Action);
		String actionID = (String) map.get(Fields.ActionID);
		try{
			C5Action action = new C5Action(actionName, actionID);
			action.setValues(map);
			return Activator.getHandler().handle(action);
		} catch (Exception e){
			return new C5Response(actionName, actionID, e.getMessage(), false);
		}
	}
}
