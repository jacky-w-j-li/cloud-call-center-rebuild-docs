package com.dishui.manager.batchCdrMonitor;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class BatchCdrMonitorTask extends TimerTask {
	private Logger log = Logger.getLogger(BatchCdrMonitorTask.class.getName());

	public void run() {
		try {
            log.log(Level.INFO, "Begin  Generate BatchMonitor nowDate="+ Utils.getCurrentDate());
			SimpleDateFormat formatter = new SimpleDateFormat("HH");
            DBObject condition = new BasicDBObject();
            condition.put("status", "ready");
            List<DBObject> taskList = null;
            if(Integer.parseInt(formatter.format(new Date())) == 3){
                taskList = MongoProvider.find("app_call_sheet_batch_download_task", condition);
			}else{
                // for N00000000958 zzdl every hour to zip0
                condition.put("account","N00000000958");
                taskList = MongoProvider.find("app_call_sheet_batch_download_task", condition);
            }
            if(taskList != null){
                for(int i=0 ;i<taskList.size();i++){
                    DBObject curObj = taskList.get(i);
                    String account = curObj.get("account").toString();
                    String id = curObj.get("_id").toString();
                    log.log(Level.INFO, "Begin require ass to Generate BatchMonitor Account="+
                            account + " taskId=" + id);

                    HashMap<String, List<String>> recordsMap = (HashMap<String, List<String>>)curObj.get("records");

                    Set<String> recordSet = recordsMap.keySet();
                    for(String curPbx : recordSet){
                        String pbx = curPbx.replaceAll("-",".");
                        String acsUrl = BatchCdrMonitorServer.getInstance().getPbxAcsUrl(pbx);
                        if(acsUrl == null){
                            continue;
                        }
                        List<String> recordList = recordsMap.get(curPbx);
                        C5Action action = new C5Action("DownloadRecorderZip","DownloadRecorderZip"+Math.random());
                        action.addParameter("PBX", pbx);
                        action.addParameter("Account", account);
                        action.addParameter("records", recordList);
                        String sendData = action.getJsonString() + "\r\n";
                        String result = "{\"Succeed\":false}";
                        try{
                            result = HttpProvider.sendPost(acsUrl, sendData.getBytes("UTF-8"));
                        }catch (Exception e){
                            log.log(Level.WARNING, "request ass failed!", e);
                            continue;
                        }
                        JSONReader jsonReader = new JSONReader();
                        HashMap<String,Object> response = (HashMap<String, Object>)jsonReader.read(result);
                        if((Boolean)response.get("Succeed")){
                            DBObject setDoc = new BasicDBObject();
                            setDoc.put("$set",new BasicDBObject("status", "finish")
                                    .append("downloadUrlList."+curPbx, response.get("url").toString()));

                            MongoProvider.update("app_call_sheet_batch_download_task", new BasicDBObject("_id", id), setDoc);
                        }else{
                            DBObject setDoc = new BasicDBObject();
                            setDoc.put("$set",new BasicDBObject("status","finish")
                                    .append("downloadUrlList."+curPbx, response.get("Message").toString()));

                            MongoProvider.update("app_call_sheet_batch_download_task", new BasicDBObject("_id", id), setDoc);
                        }
                    }
                    log.log(Level.INFO, "End require ass to Generate BatchMonitor Account="+
                            account + " taskId=" + id);
                }
            }
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}
	public static void main(String[] args) {
//		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
//		System.out.println(formatter.format(new Date(System.currentTimeMillis() - 31*24*60*60*1000l)));
//        String abc = "/var/spool/asterisk/monitor/1.1.1.101/20141215/20141215-121633_N00000000143_10000197_5001_01058010112_10000197_pbx-1418616991.280";
//        String end = "";
//        for(int i=10; i<1000 ;i++){
//            end += abc+i+".mp3 ";
//        }
//        System.out.println(end);
	}
}
