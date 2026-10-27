package com.m7.cc.ass.model;

import java.io.File;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Hashtable;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;

public class DelKdxfTtsWav {

	private static Logger log = Logger.getLogger(DelKdxfTtsWav.class.getName());
	
	public static void deleteKdxfTtsWav(){
		Thread t = new Thread("Delete KdxfTtsWav"){
			public void run(){
				delete();
			}
		};
		t.start();
	}
	
	private static void delete(){
		try{
			File tempFile = new File("/var/lib/asterisk/sounds/sound/kdxf_temp");
			File file = new File("/var/lib/asterisk/sounds/sound/kdxf");
			if(tempFile.exists()){
				File[] tfiles = tempFile.listFiles();
				if(tfiles.length >0){
					log.info("Delete KdxfTtsWav temp file: "+"rm -rf /var/lib/asterisk/sounds/sound/kdxf_temp");
					Process process = Runtime.getRuntime().exec("rm -rf /var/lib/asterisk/sounds/sound/kdxf_temp");
					process.waitFor();
					process.destroy();
					log.info("Delete KdxfTtsWav temp file: "+"rm -rf /var/lib/asterisk/sounds/sound/kdxf_temp end");
				}
			}
			if(file.exists()){
				File[] files = file.listFiles();
				if(files.length > 0){
					log.info("Delete KdxfTtsWav file: "+"rm -rf /var/lib/asterisk/sounds/sound/kdxf");
					Process process = Runtime.getRuntime().exec("rm -rf /var/lib/asterisk/sounds/sound/kdxf");
					process.waitFor();
					process.destroy();
					log.info("Delete KdxfTtsWav file: "+"rm -rf /var/lib/asterisk/sounds/sound/kdxf end");
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "Delete KdxfTtsWav File Task Has Exception! ", e);
			e.printStackTrace();
		}
	}
}
