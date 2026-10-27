package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.ReportStartUp;
import com.dishui.manager.report.impl.mail.MailAgentReportHandler;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.dishui.manager.report.model.MailMonitorClearTask;
import com.dishui.manager.report.model.MonitorAccount;
import com.mongodb.BasicDBObject;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by wangyn on 2016年9月8日12:13:55
 *
 * 邮件客服监控处理类
 */
public class MailMonitorHandler implements EventListener {
	private static final Logger log = Logger.getLogger(MailMonitorHandler.class.getName());

	public Vector<Event> eventBuffer = new Vector<Event>();

	public static HashMap<String, MonitorAccount> accounts = new HashMap<String, MonitorAccount>();
	public static ExecutorService excutor = Executors.newCachedThreadPool();

	private boolean running = true;

	public MailMonitorHandler() {
		Thread t = new Thread("MailMonitorHandler buffer thread") {
			public void run() {
				doEvent();
			}
		};
		t.start();
		Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.HOUR_OF_DAY, 23);
		calendar.set(Calendar.MINUTE, 59);
		calendar.set(Calendar.SECOND, 59);
		Date time = calendar.getTime();
		MailMonitorClearTask clearTask = new MailMonitorClearTask(this);
		ReportStartUp.getInstance().mailMonitorTimer.scheduleAtFixedRate(clearTask, time, 86400000);
	}

	private void doEvent() {
		while (running) {
			try {
				synchronized (eventBuffer) {
					if (eventBuffer.size() == 0) {
						eventBuffer.wait();
					} else {
						handleEvent(eventBuffer.remove(0));
					}
				}
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public void addToBuf(Event event) {
		synchronized (eventBuffer) {
			if (eventBuffer.size() > 1000000) {
				log.warning("account buffer is too large to cache any event");
			} else {
				eventBuffer.add(event);
			}
			eventBuffer.notify();
		}
	}

	private void handleEvent(Event event) {
		try {
			if (event.getType().equalsIgnoreCase(EventType.MAIL_AUTO_CLAIM_MONITOR)) {
				MailAgentMonitorHandler.getInstance().mailAutoClaimStatus(event);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "MailMonitorHandler handle event failed", e);
		}
	}

	public void close() {
		running = false;
	}

	public static void pushByAccount(String account, Hashtable<String, Object> dataMap) {
		List<BasicDBObject> list = MongoProvider.findFromApp("cc", "app_push_client",
				new BasicDBObject("user.account", account).append("user.type", "manager"));

		for (int i = 0; i < list.size(); i++) {
			if (list.get(i).get("pushServerIp") != null && list.get(i).get("pushServerPort") != null) {
				PushTask pt = new PushTask(list.get(i).get("pushServerIp").toString(),
						list.get(i).get("pushServerPort").toString(), account, list.get(i).get("_id").toString(),
						"MailMonitor", dataMap);
				MailMonitorHandler.excutor.execute(pt);
			}
		}
	}

}
