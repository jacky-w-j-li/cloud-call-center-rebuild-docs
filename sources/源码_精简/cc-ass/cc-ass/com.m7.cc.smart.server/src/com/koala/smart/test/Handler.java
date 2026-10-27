package com.koala.smart.test;

import java.io.IOException;
import java.net.SocketTimeoutException;

import com.koala.smart.server.Session;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;

public class Handler implements DataListener,
		SessionListener {
	private StringBuffer buffer = new StringBuffer();
	private Session session;

	public void handleCommand(Session handler, String command) {
		
		if (command.indexOf("\r\n") != -1) {
			String a = buffer.toString();
			buffer.delete(0, buffer.length());
			buffer.append(command.substring(command.indexOf("\r\n") + 2));
			command = a + command.substring(0, command.indexOf("\r\n"));
			System.out.println("Get - " + command + " - " + handler.getId());
			if (command.equalsIgnoreCase("command1"))
				try {
					handler.send("command22\r\n".getBytes());
				} catch (AppException e) {
					e.printStackTrace();
				}  catch (SessionException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			else if (command.equalsIgnoreCase("command22"))
				try {
					handler.send("command1\r\n".getBytes());
				} catch (AppException e) {
					e.printStackTrace();
				} catch (SessionException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
		}
		else buffer.append(command);
	}

	public void handleByte(Session handler, byte[] command) {
		// TODO Auto-generated method stub

	}


	public void newSession(Session _session) {
		this.session = _session;
		System.out.println("new session: "+session.getId());
		try {
			String a = "1234567890";
//			for(int i=0;i<100;i++){
//				a = a + "1234567890";
//			}
			session.send((a+"\r\n").getBytes());
		} catch (AppException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SessionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
//		Thread t = new Thread(){
//			public void run(){
//				while (true){
//					long a = System.currentTimeMillis() - session.getLatestUpdateTime();
//					System.out.println(a);
//					if(a > 3000){
//						session.close();
//						return;
//					}
//						
//					try {
//						sleep(3000);
//					} catch (InterruptedException e) {
//						// TODO Auto-generated catch block
//						e.printStackTrace();
//					}
//				}
//				
//			}
//		};
//		t.start();
	}

	public void sessionClosed(Session session) {
		System.out.println("Session closed: " + session.getId());
	}

	public void sessionTimeout(Session session, long time) {
		System.out.println("Session timeout: " + session.getId());
		session.close();
	}

	public void handleString(Session session, String command) {
		// TODO Auto-generated method stub
		
	}

}
