package com.m7.cc.ass.server.config.handler;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.AutoCallTask;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ACSStorage;

public class CallHandler {
	private static Logger log = Logger
			.getLogger(CallHandler.class.getName());
	public static Map<String, AutoDialThread> autoDialThreads = new HashMap<String, AutoDialThread>();
	public static Map<String, AutoDialTaskThread> autoDialTaskThreads = new HashMap<String, AutoDialTaskThread>();
//	public static Map<String, AutoFaxThread> autoFaxThreads = new HashMap<String, AutoFaxThread>();

	/**
	 * 
	 * @param action
	 * @return
	 */
	public static C5Response autoDial(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {	
			String accountId = action.getStringValue("account");
			String pbxID = action.getStringValue("pbx");
			boolean start = action.getStringValue("start").equals("yes");
//			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
//			C5Account account = pbx.getAccount(accountId);
			
			synchronized (autoDialThreads) {
				if(start){
					AutoDialThread t = autoDialThreads.get(accountId);
					if(t == null) {
						t = new AutoDialThread(pbxID, accountId);
						autoDialThreads.put(accountId, t);
						t.start();
					}
				} else {
					AutoDialThread t = autoDialThreads.get(accountId);
					if(t != null) {
						t.stopDial();
					}
					autoDialThreads.remove(accountId);
				}
			}
			
			
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
//	public static C5Response autoFax(C5Action action) {
//		C5Response response = new C5Response(action.getActionName(), action
//				.getActionID());
//		try {
//			String accountId = action.getStringValue("account");
//			String pbxID = action.getStringValue("pbx");
//			boolean start = action.getStringValue("start").equals("yes");
//			C5Pbx pbx = RuntimeData.getInstance().getPbx(pbxID);
//			C5Account account = pbx.getAccount(accountId);
//			
//			if(start){
//				account.setAutoFaxing(true);
//				AutoFaxThread t = autoFaxThreads.get(accountId);
//				if(t == null) {
//					t = new AutoFaxThread(pbxID, accountId);
//					autoFaxThreads.put(accountId, t);
//					t.start();
//				}
//			} else {
//				account.setAutoFaxing(false);
//				AutoFaxThread t = autoFaxThreads.get(accountId);
//				if(t != null) {
//					t.stopDial();
//				}
//				autoFaxThreads.remove(accountId);
//			}
//			pbx.updateAccount(account);
//			
//			response.setSucceed(true);
//		} catch (Exception e) {
//			response.setSucceed(false);
//			response.setMessage(e.getMessage());
//			log.log(Level.WARNING, action.getJsonString(), e);
//		}
//		return response;
//	}
	
	public static C5Response addAutoCallTask(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.autoCallTask_pbx);
			String accountID = action.getStringValue(Fields.autoCallTask_account);
			String taskId = action.getStringValue(Fields.TaskId);
			String serviceNo = action.getStringValue(Fields.autoCallTask_serviceNo);
			boolean reStart = false;
			if(action.hasKey("start"))
				reStart = action.getStringValue("start").equals("yes");
					
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			
			AutoCallTask task = account.getAutoCallTasks().get(taskId);
			if(task == null) {
				task = new AutoCallTask(pbx, accountID, taskId);
			}
			if(action.hasKey(Fields.TaskId))
				task.setTaskId(action.getStringValue(Fields.TaskId));
			if(action.hasKey(Fields.autoCallTask_displayName))
				task.setDisplayName(action.getStringValue(Fields.autoCallTask_displayName));
			if(action.hasKey(Fields.TaskType))
				task.setTaskType(action.getStringValue(Fields.TaskType));
			if(action.hasKey(Fields.NumType))
				task.setNumType(action.getStringValue(Fields.NumType));
			if(action.hasKey(Fields.TimeType))
				task.setTimeType(action.getStringValue(Fields.TimeType));
			if(action.hasKey(Fields.TaskTime))
				task.setTaskTime(action.getStringValue(Fields.TaskTime));
			if(action.hasKey(Fields.TaskDate))
				task.setTaskDate(action.getStringValue(Fields.TaskDate));
			if(action.hasKey(Fields.TaskQueue))
				task.setTaskQueue(action.getStringValue(Fields.TaskQueue));
			task.setServiceNo(serviceNo);
			if(reStart){
				task.setStart(true);
			}

			account.addOrUpdateAutoCallTask(task);
			//if taskType = time. when add we start threads.
			if(task.getTaskType().equals("time")){
				synchronized (autoDialTaskThreads) {
					AutoDialTaskThread t = autoDialTaskThreads.get(taskId);
					if(t == null) {
						t = new AutoDialTaskThread(pbx, accountID, taskId);
						autoDialTaskThreads.put(taskId, t);
						t.start();
					}
				}
			}
			if(reStart){
				AutoDialTaskThread t = autoDialTaskThreads.get(taskId);
				if(t == null) {
					t = new AutoDialTaskThread(pbx, accountID, taskId);
					autoDialTaskThreads.put(taskId, t);
					t.start();
				}
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	
	public static C5Response startAutoCallTask(C5Action action){
		C5Response response = new C5Response(action);
		try {	
			String accountId = action.getStringValue("account");
			String pbxID = action.getStringValue("pbx");
			String taskId = action.getStringValue("taskId");
			boolean start = action.getStringValue("start").equals("yes");
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
			C5Account account = pbx.getAccount(accountId);
			AutoCallTask currTask = account.getAutoCallTasks().get(taskId);
			if(currTask == null){
				response.setSucceed(false);
				response.setMessage("404");
				return response;
			}
			//check if has running normal task .
			if(start){
				Hashtable<String, AutoCallTask> allTasks = account.getAutoCallTasks();
				Iterator it = allTasks.keySet().iterator();
				while(it.hasNext()){
					String key = it.next().toString();
					AutoCallTask task = allTasks.get(key);
					if(task.getTaskType().equals("normal") && task.isStart()){
						response.setSucceed(false);
						response.setMessage("401");
						return response;
					}
				}
			}
			synchronized (autoDialTaskThreads) {
				if(start){
					AutoDialTaskThread t = autoDialTaskThreads.get(taskId);
					if(t == null) {
						t = new AutoDialTaskThread(pbxID, accountId, taskId);
						autoDialTaskThreads.put(taskId, t);
						t.start();
					}
					currTask.setStart(true);
				} else {
					AutoDialTaskThread t = autoDialTaskThreads.get(taskId);
					if(t != null) {
						log.log(Level.WARNING, "stop autoCallTask taskId="+taskId);
						t.stopDial();
						autoDialTaskThreads.remove(taskId);
					}else{
						log.log(Level.WARNING, "when stop autoCallTask we not found this" +
								" task thread in [autoDialTaskThreads]! taskId="+taskId);
					}
					currTask.setStart(false);
				}
			}
			//when thread is tart,we set auto_call_task.conf [start=true] or [start=false].
			account.addOrUpdateAutoCallTask(currTask);
			
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	public static C5Response DeleteAutoCallTask(C5Action action){
		C5Response response = new C5Response(action);
		try {	
			String accountId = action.getStringValue("account");
			String pbxID = action.getStringValue("pbx");
			String taskId = action.getStringValue("taskId");
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
			C5Account account = pbx.getAccount(accountId);
			AutoCallTask currTask = account.getAutoCallTasks().get(taskId);
			if(currTask == null){
				response.setSucceed(false);
				response.setMessage("404");
				return response;
			}

			synchronized (autoDialTaskThreads) {
				AutoDialTaskThread t = autoDialTaskThreads.get(taskId);
				if(t != null) {
					t.stopDial();
				}
				autoDialTaskThreads.remove(taskId);
			}
			account.deleteAutoCallTask(currTask.getTaskId());
			
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	/**
	 * this method for when starting ass ,check autoCallTask thread 'diao yong' .
	 * @param task
	 * @return
	 */
	public static boolean startAutoCallTask(AutoCallTask task){
		boolean result = false;
		try {	
			synchronized (autoDialTaskThreads) {
					AutoDialTaskThread t = autoDialTaskThreads.get(task.getTaskId());
					if(t == null) {
						t = new AutoDialTaskThread(task.getPbx(), task.getAccount(), task.getTaskId());
						autoDialTaskThreads.put(task.getTaskId(), t);
						t.start();
					}
			}
			result = true;
		} catch (Exception e) {
			log.log(Level.WARNING, "AutoCallTask taskId ="+task.getTaskId(), e);
		}
		return result;
	}
	
}
