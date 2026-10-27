package com.m7.cc.ass.server.monitor.server.tcp;

import java.util.Map;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.m7.cc.ass.server.monitor.server.MonitorSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;

public class MonitorTCPSession {
	public static final String COMMAND_END = "\r\n";
	public static final int MAX_COMMAND_LENGTH = 4096;

	private String id;
	private Session session;
	private StringBuffer buffer = new StringBuffer();
	private boolean logined = false;
	private int loginTry = 3;
	JSONReader jr = new JSONReader();
	
	private static final Logger log = Logger.getLogger(MonitorSession.class.getName());

	public MonitorTCPSession(String id, Session session) {
		this.id = id;
		this.session = session;
	}

	public String getId() {
		return id;
	}

	public Session getSession() {
		return session;
	}

	public void processData(String data) {
		synchronized (buffer) {
			if (data.indexOf(COMMAND_END) != -1) {
				buffer.append(data);

				String _commands = null;
				// If this command is ended with a action we send the whole
				// command
				// string to subparser to parse and clear buffer.
				if (data.endsWith(COMMAND_END)) {
					_commands = buffer.toString();
					buffer.setLength(0);
				}
				// If command is not ended with a action
				else {
					_commands = buffer.toString();
					int lastIndex = _commands.lastIndexOf(COMMAND_END);

					// There is no complete action
					if (lastIndex < 0) {

						// The packet is longer than protocol permit
						if (buffer.length() > MAX_COMMAND_LENGTH) {
							buffer.setLength(0);
							sendCommand(new C5Response("", "", "Command too long", false));
							return;
						}
						// End parse
						else {
							return;
						}
					}
					_commands = _commands.substring(0, lastIndex);
					buffer.delete(0, lastIndex + 2);
				}

				String[] commands = _commands.split(COMMAND_END);
				for(int i=0;i<commands.length;i++){
					try {
						log.fine("Get command: "+commands[i]+" from session["+session.getId()+"]");
						
						Map<String, Object> values = (Map<String, Object>)jr.read(commands[i]);
						String actionName = (String) values.get(Fields.Action);
						if (actionName == null) {
							throw new Exception(
									"Error command, none action name defined");
						}
						String actionID = (String) values.get(Fields.ActionID);
						C5Action action = new C5Action(actionName, actionID);
						action.setValues(values);
						if(logined){
							C5Response response = TCPCommandHandler.processCommand(action);
							sendCommand(response);
						} else if(loginTry < 1){
							sendCommand(new C5Response("", "", "Session closed: tried too many time of login.", false));
							destruct();
						} else {
							if(action.getActionName().equalsIgnoreCase(Fields.Login)){
								loginTry --;
								C5Response response = TCPCommandHandler.processCommand(action);
								if(response.isSucceed()){
									logined = true;
								} 
								sendCommand(response);
							} else if(action.getActionName().equalsIgnoreCase(Fields.Help)) {
								C5Response response = TCPCommandHandler.processCommand(action);
								sendCommand(response);
							} else {
								sendCommand(new C5Response("", "", "Please login before you do any action!", false));
							}
						}
						
					} catch (Exception e) {
//						sendCommand(new C5Response()e.getMessage());
					}
				}
			} else {
				buffer.append(data);
			}
		}
	}
	
	
	public void sendCommand(C5Response command){
		try {
			session.send(command.getJsonString()+COMMAND_END);
		} catch (AppException e) {
			e.printStackTrace();
		} catch (SessionException e) {
			e.printStackTrace();
			destruct();
		}
	}
	
	public void destruct(){
		if(!session.isClosed())
			session.close();
		session = null;
		buffer = null;
	}
}
