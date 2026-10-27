package com.m7.cc.ass.server.monitor.server;

import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class MonitorSession {
	public static final String COMMAND_END = "\r\n";
	public static final int MAX_COMMAND_LENGTH = 4096;

	private String id;
	private Session session;
	private StringBuffer buffer = new StringBuffer();
	private boolean logined = false;
	private int loginTry = 3;
	private String leastCommand;
	
	private static final Logger log = Logger.getLogger(MonitorSession.class.getName());

	public MonitorSession(String id, Session session) {
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
		//repeat command
		if(data.equalsIgnoreCase("[A")){
			try {
				session.send("\r\n"+leastCommand);
				buffer.setLength(0);
				buffer.append(leastCommand);
			} catch (AppException e) {
				e.printStackTrace();
			} catch (SessionException e) {
				e.printStackTrace();
				destruct();
			}
			return;
		} else if(data.equalsIgnoreCase("\b")){
			buffer.deleteCharAt(buffer.length() - 1);
			return;
		}
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
							sendCommand("Command too long");
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
					leastCommand = commands[i];
					if(leastCommand.equalsIgnoreCase("q")){
						destruct();
						return;
					}
					try {
						log.fine("Get command: "+commands[i]+" from session["+session.getId()+"]");
						C5Action action = ActionParser.parseAction(commands[i]);
						if(logined){
							String response = CommandHandler.processCommand(action);
							sendCommand(response);
						} else if(loginTry < 1){
							sendCommand("Session closed: tried too many time of login.");
							destruct();
						} else {
							if(action.getActionName().equalsIgnoreCase(Fields.Login)){
								loginTry --;
								String response = CommandHandler.processCommand(action);
								if(response.indexOf("succeed") != -1){
									logined = true;
								} 
								sendCommand(response);
							} else if(action.getActionName().equalsIgnoreCase(Fields.Help)) {
								String response = CommandHandler.processCommand(action);
								sendCommand(response);
							} else {
								sendCommand("Please login before you do any action!");
							}
						}
						
					} catch (Exception e) {
						sendCommand(e.getMessage());
					}
				}
			} else {
				buffer.append(data);
			}
		}
	}
	
	
	public void sendCommand(String command){
		try {
			session.send(command+COMMAND_END);
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
