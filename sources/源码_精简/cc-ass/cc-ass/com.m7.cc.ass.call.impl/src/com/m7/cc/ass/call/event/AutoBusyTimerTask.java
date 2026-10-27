package com.m7.cc.ass.call.event;

import java.util.TimerTask;

import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.Fields;

public class AutoBusyTimerTask extends TimerTask {
	private User user;

	public AutoBusyTimerTask(User user) {
		this.user = user;
	}

	public void run() {
		try {
			if (user.getBusyType().equals("99")) {
				if(user.isLogin()){
					CallCounter.setBusy(user, user.getOriginalBusyType(), user
							.isOriginalBusy());
				} else {
					CallCounter.setBusy(user, Fields.B00, false);
				}
			}
		} catch (Throwable e) {

		} finally {
			cancel();
		}
	}
}
