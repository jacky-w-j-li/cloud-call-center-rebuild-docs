package com.m7.cc.ass.call.mail;

import java.util.TimerTask;
import java.util.logging.Level;

import com.m7.cc.ass.call.event.CallCounter;
import com.m7.cc.ass.model.configuration.Mail;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class MailDispatcherTimerTask extends TimerTask {
	private User user;
	private Mail mail;
	private MailQueue mailQueue;

	public MailDispatcherTimerTask(User user, Mail mail, MailQueue mailQueue) {
		this.user = user;
		this.mail = mail;
		this.mailQueue = mailQueue;
	}

	public void run() {
		try {
			user.setWaitAcceptMail(null);
			if(mail.getDispatcheredCount() < mailQueue.getWaitCount()){
				MailQueueRuntime.getInstance().addToMailBuffer(mail);
			}else{
				//tell fenfaqi mail don't anyone accept
				MailQueueRuntime.getInstance().getMailQueueThreadPoolExecutor()
						.execute(new requestMultiChannelDispatcherTask(mail.getMailId(), "mail", "undeal"));
			}
			if(user.isLogin()){
				C5Event event = new C5Event("RecycleNewMail");
				event.addParameter(Fields.PBX, mail.getPbx());
				event.addParameter(Fields.Account, mail.getAccount());
				event.addParameter("MailId", mail.getMailId());
				user.getConnection().sendEvent(event);
//				Thread.sleep(2000);
//				CallCounter.setBusy(user, Fields.B00, false);					
			}
		} catch (Throwable e) {

		} finally {
			cancel();
		}
	}
}
