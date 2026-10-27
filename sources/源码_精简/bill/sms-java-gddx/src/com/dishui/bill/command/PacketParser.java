package com.dishui.bill.command;

import java.util.HashMap;

/**
 * Translate String data to Action/Event/Response.
 * 
 * @author Cai Zhibin
 *
 */
public class PacketParser {
	private StringBuffer sb = new StringBuffer();
	private PacketListener listener;
	private JSONReader jsonReader = new JSONReader();

	public PacketParser(PacketListener listener) {
		this.listener = listener;
	}

	public void parserPacket(String data) throws Exception {
		try {
			String[] commands = null;
			synchronized (sb) {
				sb.append(data);
				int a = sb.lastIndexOf(Fields.END_ACTION);
				if (a > 0) {
					commands = sb.substring(0, a).split(Fields.END_ACTION);
					sb.delete(0, a + Fields.END_ACTION.length());
				}
			}
			if(commands != null) {
				for (int i = 0; i < commands.length; i++) {
					HashMap<String, Object> map = (HashMap<String, Object>) jsonReader
							.read(commands[i]);
					String commandType = (String) map.get(Fields.Command);
					if (commandType.equalsIgnoreCase(Fields.Action)) {
						parseAction(map);
					} else if (commandType.equalsIgnoreCase(Fields.Response)) {
						parseResponse(map);
					} else if (commandType.equalsIgnoreCase(Fields.Event)) {
						parseEvent(map);
					}
				}
			}
		} catch (Exception e) {
			throw e;
		}
	}
	
	private void parseAction(HashMap<String, Object> map) throws Exception{
		String actionName = (String) map.get(Fields.Action);
		String actionID = (String) map.get(Fields.ActionID);
		C5Action action = new C5Action(actionName, actionID);
		
		
		if(action == null)
			throw new Exception("Unknow Action: " + actionName);
		
		if (action.setValues(map))
			listener.processAction(action);
		else
			throw new Exception("Error Action: " + actionName);
	}
	
	private void parseResponse(HashMap<String, Object> map) throws Exception{
		String actionName = (String) map.get(Fields.Response);
		String actionID = (String) map.get(Fields.ActionID);
		C5Response response = new C5Response(actionName, actionID);
		if (response.setValues(map))
			listener.processResponse(response);
		else
			throw new Exception("Error Response: " + actionName);
	}
	
	private void parseEvent(HashMap<String, Object> map) throws Exception{
		String eventName = (String) map.get(Fields.Event);
		C5Event event = new C5Event(eventName);
		event.setValues(map);
		listener.processEvent(event);
	}
}
