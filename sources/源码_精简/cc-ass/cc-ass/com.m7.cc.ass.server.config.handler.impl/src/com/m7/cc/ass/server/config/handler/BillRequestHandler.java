package com.m7.cc.ass.server.config.handler;

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentLinkedQueue;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class BillRequestHandler {
	private static ConcurrentLinkedQueue<C5Action> q = new ConcurrentLinkedQueue<C5Action>();
	private static Timer timer = null;
	
	public static C5Response handle(C5Action action){
		if(timer == null){
			startTimer();
		}
		q.add(action);
		C5Response response = new C5Response(action);
		response.setSucceed(true);
		return response;
	}
	
	private static void process(C5Action action){
		if (action.getActionName().equalsIgnoreCase(Fields.ToUpdateLisence)) {
			ToUpdateLisenceHandler.toUpdate(action);
		} else if (action.getActionName()
				.equalsIgnoreCase("ToUpdate400Lisence")) {
			ToUpdateLisenceHandler.toUpdate400(action);
		}
	}
	
	private static void startTimer(){
		timer = new Timer(true);
		timer.schedule(new TimerTask() {
			public void run() {
				C5Action action = q.poll();
				while (action != null){
					process(action);
					action = q.poll();
				}
			}
		}, 5000, 5000);
	}
}
