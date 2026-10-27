package com.m7.cc.ass.call.mail;

import java.util.TimerTask;

import com.m7.cc.ass.call.event.CallCounter;
import com.m7.cc.ass.model.configuration.Mail;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WeixinMessage;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class WeixinDispatcherTimerTask extends TimerTask {
	private User user;
	private WeixinMessage msg;
	private MailQueue mailQueue;

	public WeixinDispatcherTimerTask(User user, WeixinMessage msg, MailQueue mailQueue) {
		this.user = user;
		this.msg = msg;
		this.mailQueue = mailQueue;
	}

	public void run() {
		try {
			if(user.isLogin() && user.isBusy()){
//				CallCounter.setBusy(user, Fields.B00, false);					
			}
		} catch (Throwable e) {

		} finally {
			cancel();
		}
	}
}
