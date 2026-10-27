package com.m7.cc.ass.server.config.handler;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.AutoCallTask;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class AutoDialTaskThread extends Thread {

	private static Logger log = Logger
			.getLogger(AutoDialTaskThread.class.getName());

	private boolean dial = false;
	private String pbxID;
	private String accountId;
	private String taskId;

	public AutoDialTaskThread(String pbx, String account,String taskId) {
		super("auto dial "+account+". PBX = "+ pbx + ". TaskId= "+ taskId);
		this.pbxID = pbx;
		this.accountId = account;
		this.taskId = taskId;
		dial = true;
	}

	public void stopDial() {
		dial = false;
	}

	public void run() {
		try {
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
			C5Account account = pbx.getAccount(accountId);
			AutoCallTask currentTask = account.getAutoCallTasks().get(taskId);
			account.getAutoCalls().clear();
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbxID);
			boolean isTimeTaskStart = false;
			if(currentTask.getTaskType().equals("time")){
				sleep(120000);
			}
			log.log(Level.INFO, "auto dial task thread start......:taskId = "+currentTask.getTaskId()+" taskName="+currentTask.getDisplayName());
			while (dial) {
				try {
					//check timecondition
					if(currentTask.getTaskType().equals("time")){
						boolean isStart = false;
						if(currentTask.getTimeType().equals("everyDay")){
							float nowTime = Float.parseFloat(Utils.getDate("HH.mm"));
							String[] timeCons = currentTask.getTaskTime().split(",");
							for(int i=0 ;i<timeCons.length;i++){
								float begin = Float.parseFloat(timeCons[i].split("-")[0]);
								float end = Float.parseFloat(timeCons[i].split("-")[1]);
								if(nowTime > begin && nowTime < end){
									if(!isTimeTaskStart){
										isTimeTaskStart = true;
										account.startTimeAutoCallTask(currentTask);
										tellAppTaskStatus(taskId,Fields.Task_status_start);
									}
									isStart = true;
									break;
								}
							}
							if(!isStart && isTimeTaskStart){
								account.stopTimeAutoCallTask(currentTask);
								tellAppTaskStatus(taskId,Fields.Task_status_ready);
								isTimeTaskStart = false;
							}
						}else if(currentTask.getTimeType().equals("staticDate")){
							int flag = Utils.compare_date(Utils.getDate("yyyy-MM-dd"), currentTask.getTaskDate());
							if(flag == 0){ //nowDay = taskDay.we check taskTime
								float nowTime = Float.parseFloat(Utils.getDate("HH.mm"));
								String[] timeCons = currentTask.getTaskTime().split(",");
								for(int i=0 ;i<timeCons.length;i++){
									float begin = Float.parseFloat(timeCons[i].split("-")[0]);
									float end = Float.parseFloat(timeCons[i].split("-")[1]);
									if(nowTime > begin && nowTime < end){
										if(!isTimeTaskStart){
											isTimeTaskStart = true;
											account.startTimeAutoCallTask(currentTask);
											tellAppTaskStatus(taskId,Fields.Task_status_start);
										}
										isStart = true;
										break;
									}
								}
							}
							if(!isStart && isTimeTaskStart){
								account.stopTimeAutoCallTask(currentTask);
								tellAppTaskStatus(taskId,Fields.Task_status_ready);
								isTimeTaskStart = false;
							}
						}
						if(!isStart){
							sleep(30000);
							continue;
						}
					}
					String res = "404";
					//check last stop if has not to dial nos.
					if(currentTask.getLastStopNos() != null){
						res = currentTask.getLastStopNos();
						currentTask.setLastStopNos(null);
					}else{
						// get list from cccdr
						C5Action action = new C5Action("GetAutoDialList",
								Utils.getUniqueid());
						action.addParameter("account", accountId);
						action.addParameter("taskId", taskId);
						action.addParameter("taskName", currentTask.getDisplayName());
						action.addParameter("numType",currentTask.getNumType());
						res = HttpProvider.sendPost(ASConfig.getInstance()
								.getVar("cdr.server.url"), action.getJsonString()
								.getBytes("UTF-8"), 10000);
					}
					if (res.equals("404")) {
						dial = false;
						CallHandler.autoDialTaskThreads.remove(taskId);
						//delete this peer from account
						account.deleteAutoCallTask(taskId);
						//todo call cc-server interface tell app,task is end.
						log.info("Auto call task finish taskId = "+ taskId);
						tellAppTaskStatus(taskId,Fields.Task_status_finish);
					} else {
						String[] nos = res.split(",");
						for (int i = 0; i < nos.length;) {
							if(!dial) {
								if(i < nos.length){
									String thisStopNos = "";
									for (int j = i; j < nos.length; j++) {
										thisStopNos+=nos[j]+",";
									}
									if(thisStopNos.endsWith(",")){
										thisStopNos = thisStopNos.substring(0, thisStopNos.length() - 1);
									}
									currentTask.setLastStopNos(thisStopNos);
								}
								break;
							}
							SimpleDateFormat formatter = new SimpleDateFormat("HH");
							if(Integer.parseInt(formatter.format(new Date())) < 9 || Integer.parseInt(formatter.format(new Date())) >= 21){
								sleep(10000);
								continue;
							}
							if(account.getAutoCalls().size() >= account.getLisence().getMaxIncomingCalls()){
								sleep(500);
								continue;
							}
							//is taskType == time . only to use AutoCallStrategy : static
							String serviceNo = currentTask.getServiceNo();
							if(currentTask.getTaskType().equals("normal") &&
									account.getLisence().getAutoCallStrategy().equals(Fields.AutoCallStrategy_Smart)){
								if( (account.getAutoCalls().size()-account.getCallReport().getCurrentInCalls()) 
										>= ((account.getIdleAndReserveUser(currentTask.getTaskQueue()))*account.getLisence().getSmartAutoCallCount()) ){
									sleep(500);
									continue;
								}
							}
							
							String[] _nos = nos[i].split(":");
							String no = _nos[0];
							String id = _nos[1];
							String channel = "SIP/"+account.getSipContact(no, Fields.DialoutFlag)+ "@"
									+ ASConfig.getInstance().getDialoutLine()
									+ ":"
									+ ASConfig.getInstance().getDialoutPort();

							String actionID = "auto,"+accountId + ","+ no + "," + id;
							Originate originate = new Originate(channel,
									serviceNo, serviceNo, "1",
									actionID);
							originate.setAsync("true");
							originate.setTimeout("60000");
//							originate.setCallerID(account.getDidNum(Fields.DialoutFlag));
							originate.setCallerID(account.getAutoCallDidNum());
							originate.setVariable("autocall=1|realdid="+no+"|taskId="+taskId);
							amiClient.sendAction(originate);
							account.getAutoCalls().add(actionID);
							account.getAutoCallUniqueidTaskIdMap().put(id, taskId+","+currentTask.getNumType());
							i++;
							//sleep(10);
						}
					}
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "auto dial failed", e);
			dial = false;
			CallHandler.autoDialTaskThreads.remove(taskId);
		}
		dial = false;
		CallHandler.autoDialTaskThreads.remove(taskId);
	}
	
	private void tellAppTaskStatus(String taskId,String status){
		String appUrl = ASConfig.getInstance().getVar("app.url");
		if(!appUrl.endsWith("/")){
			appUrl += "/";
		}
		String url = appUrl + "service?action=updateBdTaskStatus&data={\"taskId\":\""+taskId+"\",\"status\":\""+status+"\"}";
		try {
			String result = HttpProvider.sendGet(url, 5000);
			log.log(Level.INFO,"autoCallTaskStatus to cc-server ["+ status +"]. taskId =" + taskId+". result = " + result);
		} catch (Exception e) {
			log.log(Level.WARNING,"autoCallTaskStatus to cc-server failed. taskId =" + taskId,e);
			e.printStackTrace();
		}
	}
	
	
}
