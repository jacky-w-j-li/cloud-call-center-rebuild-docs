package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class DownloadHandler {

	private static Logger log = Logger.getLogger(DownloadHandler.class
			.getName());

//	private static List<String> files = null;
//	private static String filename = null;
	
	public static C5Response downloadRecorder(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			
			List<String> files = (List<String>)action.getParameterValue("records");
			String filename = Utils.getDate("yyyyMMdd")+"_"+accountID+"_"+pbx+"_"+Utils.getRandom32()+".zip";
			
			BatchDownloadThread batchThread = new BatchDownloadThread(files, filename);
			batchThread.start();
			
//			Thread t = new Thread(){
//				public void run() {
//					try {
//						File f = new File("/var/spool/asterisk/monitor/recorderZip");
//					    if(!f.exists())f.mkdirs();
//						long startTime = System.currentTimeMillis();
//						String command = "zip -1qj /var/spool/asterisk/monitor/recorderZip/"+filename;
//						int n = 0;
//						for(int i=0;i<files.size();i++) {
//							command += " /var/spool/asterisk/" + files.get(i);
//							n++;
//						}
//						Process process;
//						process = Runtime.getRuntime().exec(command);
//						process.waitFor();
//						process.destroy();
//						long duration = System.currentTimeMillis() - startTime;
//
//						log.info("zip recorder: "+duration);
//					} catch (Exception e) {
//						log.log(Level.WARNING, "", e);
//					}
//				}
//			};
//			t.start();
			
			response.setSucceed(true);
			response.addParameter("url", ASConfig.getInstance().getFileServer()+"/monitor/recorderZip/"+filename);
			response.setMessage("200");
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}

}
