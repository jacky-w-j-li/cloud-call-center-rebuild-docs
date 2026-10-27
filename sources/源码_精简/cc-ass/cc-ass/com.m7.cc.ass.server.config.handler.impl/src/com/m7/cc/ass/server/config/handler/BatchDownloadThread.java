package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BatchDownloadThread extends Thread {
	private static Logger log = Logger.getLogger(BatchDownloadThread.class
			.getName());
	private List<String> files = null;
	private String filename = null;
	
	public BatchDownloadThread(List<String> afiles,String afilename) {
		files = afiles;
		filename = afilename;
	}
	
	@Override
	public void run() {
		try {
			File f = new File("/var/spool/asterisk/monitor/recorderZip");
		    if(!f.exists())f.mkdirs();
			long startTime = System.currentTimeMillis();
			String command = "zip -1qj /var/spool/asterisk/monitor/recorderZip/"+filename;
			int n = 0;
			for(int i=0;i<files.size();i++) {
				command += " /var/spool/asterisk/" + files.get(i);
				n++;
			}
			Process process;
			process = Runtime.getRuntime().exec(command);
			process.waitFor();
			process.destroy();
			long duration = System.currentTimeMillis() - startTime;

			log.info(filename + "zip recorder: "+duration);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

}
