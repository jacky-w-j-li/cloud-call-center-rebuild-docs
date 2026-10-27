package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

/**
 * 
 * @author chenguang 2014-08-13
 * 
 */
public class AutoCallTask extends Context implements ServicePeer {
	public static final String NAME = "autoCallTask";
	private String account;
	private String pbx;

	private String displayName;
	private String taskId;
	private String taskType; //normal or time
	private String numType;  //import or generate
	private String timeType; //everyDay or staticDate
	private String serviceNo;
	private String taskTime;
	private String taskDate;
	private String taskQueue;
	private boolean start = false;
	private String lastStopNos = null;

//	private List<String> autoCalls = new ArrayList<String>();

	public AutoCallTask(String pbx, String account, String taskId) {
		super(account + "-" + taskId + "-" + NAME, taskId);
		this.account = account;
		this.pbx = pbx;
		this.taskId = taskId;
	}

	public boolean setValues(Hashtable<String, String> map) {
		try {
			if (map.containsKey(Fields.TaskId)) {
				this.setTaskId((String) map.get(Fields.TaskId));
			}
			if (map.containsKey(Fields.TaskType)) {
				this.setTaskType((String) map.get(Fields.TaskType));
			}
			if (map.containsKey(Fields.NumType)) {
				this.setNumType((String) map.get(Fields.NumType));
			}
			if (map.containsKey(Fields.TimeType)) {
				this.setTimeType((String) map.get(Fields.TimeType));
			}
			if (map.containsKey(Fields.autoCallTask_serviceNo)) {
				this.setServiceNo((String) map.get(Fields.autoCallTask_serviceNo));
			}
			if (map.containsKey(Fields.TaskTime)) {
				this.setTaskTime((String) map.get(Fields.TaskTime));
			}
			if (map.containsKey(Fields.TaskDate)) {
				this.setTaskDate((String) map.get(Fields.TaskDate));
			}
			if(map.containsKey(Fields.Start)){
				this.setStart(Boolean.parseBoolean(map.get(Fields.Start)));
			}
			if (map.containsKey(Fields.autoCallTask_displayName)) {
				this.setDisplayName((String) map.get(Fields.autoCallTask_displayName));
			}
			if (map.containsKey(Fields.TaskQueue)) {
				this.setTaskQueue((String) map.get(Fields.TaskQueue));
			}
		} catch (Exception e) {
			return false;
		}
		return true;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub

	}

	public String getServicePeerName() {
		return NAME;
	}

	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub

	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "autoCallTask-"
					+ taskId;
		else
			this.displayName = displayName;
	}

	
	public String getTaskId() {
		return taskId;
	}

	public void setTaskId(String taskId) {
		this.taskId = taskId;
	}

	public String getTaskType() {
		return taskType;
	}

	public void setTaskType(String taskType) {
		this.taskType = taskType;
	}

	public void setSmartCount(int smartCount) {
		smartCount = smartCount;
	}

	public String getServiceNo() {
		return serviceNo;
	}

	public void setServiceNo(String serviceNo) {
		this.serviceNo = serviceNo;
	}
	
//	public List<String> getAutoCalls() {
//		return autoCalls;
//	}
//
//	public void addAutoCalls(String callID) {
//		if(!this.autoCalls.contains(callID))
//			autoCalls.add(callID);
//	}

	public String getNumType() {
		return numType;
	}

	public void setNumType(String numType) {
		this.numType = numType;
	}

	public boolean isStart() {
		return start;
	}

	public void setStart(boolean start) {
		this.start = start;
	}

	public String getTimeType() {
		return timeType;
	}

	public void setTimeType(String timeType) {
		this.timeType = timeType;
	}

	public String getTaskTime() {
		return taskTime;
	}

	public void setTaskTime(String taskTime) {
		this.taskTime = taskTime;
	}

	public String getTaskDate() {
		return taskDate;
	}

	public void setTaskDate(String taskDate) {
		this.taskDate = taskDate;
	}

	public String getTaskQueue() {
		return taskQueue;
	}

	public void setTaskQueue(String taskQueue) {
		this.taskQueue = taskQueue;
	}

	public String getLastStopNos() {
		return lastStopNos;
	}

	public void setLastStopNos(String lastStopNos) {
		this.lastStopNos = lastStopNos;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		if (getTaskId() != null)
			event.addParameter(Fields.TaskId, taskId);
		if (getTaskType() != null)
			event.addParameter(Fields.TaskType, taskType);
		if (getNumType() != null)
			event.addParameter(Fields.NumType, numType);
		if (getServiceNo() != null)
			event.addParameter(Fields.autoCallTask_serviceNo, serviceNo);
		if (getDisplayName() != null)
			event.addParameter(Fields.autoCallTask_displayName, getDisplayName());
		if (getTimeType() != null)
			event.addParameter(Fields.TimeType, timeType);
		if (getTaskTime() != null)
			event.addParameter(Fields.TaskTime, taskTime);
		if (getTaskDate() != null)
			event.addParameter(Fields.TaskDate, taskDate);
		if (getTaskQueue() != null)
			event.addParameter(Fields.TaskQueue, taskQueue);
		event.addParameter(Fields.Start, start);
		return event;
	}
}
