package com.m7.cc.ass.model;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

public class DelThirdWav {
	
	private static Logger log = Logger.getLogger(DelThirdWav.class.getName());
	
	public static void deletethirdWav(){
		Thread t = new Thread("Delete ThirdWav"){
			public void run(){
				delete();
			}
		};
		t.start();
	}
	
	private static void delete(){
		try{
			File tempFile = new File("/var/lib/asterisk/sounds/sound/thirdsound");
			if(tempFile.exists()){
				File[] tfiles = tempFile.listFiles();
				if(tfiles.length >0){
					log.info("Delete ThirdWav temp file: "+"rm -rf /var/lib/asterisk/sounds/sound/thirdsound");
					Process process = Runtime.getRuntime().exec("rm -rf /var/lib/asterisk/sounds/sound/thirdsound");
					process.waitFor();
					process.destroy();
					log.info("Delete ThirdWav temp file: "+"rm -rf /var/lib/asterisk/sounds/sound/thirdsound end");
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "Delete ThirdWav File Task Has Exception! ", e);
			e.printStackTrace();
		}
	}
}
