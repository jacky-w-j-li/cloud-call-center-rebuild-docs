package com.koala.smart.server;

import java.util.TimerTask;

public class TimeoutTask extends TimerTask{
	
	private long timeout = -1;
	
	private Session session;
	
	public TimeoutTask(Session session){
		this.session = session;
		timeout = session.getTimeout();
	}

	public void run() {
		if(session.isClosed())
			return;
		if(timeout > 0){
			long time = System.currentTimeMillis() - session.getLatestUpdateTime();
			if(timeout <= time)
				session.timeOut(time);
		}
	}
	
	public void close(){
		session = null;
	}
}
