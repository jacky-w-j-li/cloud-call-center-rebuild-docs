package com.m7.cc.ass.server.config.handler;

import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.AutoCallTask;

public class CheckAutoDialTaskStatusThread extends Thread {

	private static Logger log = Logger
			.getLogger(CheckAutoDialTaskStatusThread.class.getName());

	public void run() {
		try {
			log.log(Level.INFO, "Started auto dial thread start task.");
			List<C5Pbx> pbxs = RuntimeData.getInstance().getPbxVos();
			while(true){
				for(int i=0 ; i < pbxs.size();i++){
//					log.log(Level.INFO, "Check auto dial thread------pbx = "+pbxs.get(i).getPbx());
					Hashtable<String, C5Account> accounts = pbxs.get(i).getAccounts();
					Iterator it = accounts.keySet().iterator();
					while(it.hasNext()){
						String key = it.next().toString();
						C5Account account = accounts.get(key);
						if(account.getAutoCallTasks().size()>0){
							Hashtable<String, AutoCallTask> allTasks = account.getAutoCallTasks();
							Iterator taskIt = allTasks.keySet().iterator();
							while(taskIt.hasNext()){
								String taskKey = taskIt.next().toString();
								AutoCallTask task = allTasks.get(taskKey);
								if(task.getTaskType().equals("normal")){
									if(task.isStart()){
										CallHandler.startAutoCallTask(task);
										log.log(Level.WARNING, "check auto dial thread start [normal] task: name = "+ task.getDisplayName() + ". taskId = "+ task.getTaskId());
									}
								}else{
									CallHandler.startAutoCallTask(task);
									log.log(Level.WARNING, "check auto dial thread start [time] task: name = "+ task.getDisplayName() + ". taskId = "+ task.getTaskId());
								}
							}
						}
					}
				}
				sleep(300000);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "auto dial failed", e);
		}

	}
}
