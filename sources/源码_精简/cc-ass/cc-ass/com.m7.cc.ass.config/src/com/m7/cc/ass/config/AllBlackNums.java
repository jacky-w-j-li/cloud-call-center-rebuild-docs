package com.m7.cc.ass.config;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;


public class AllBlackNums {
	private static Logger log = Logger.getLogger(AllBlackNums.class.getName());
	public static Map<String, String> allBlackNumCach = new HashMap<String, String>();
	public static void saveAllBlackNums(String nums) {
		File file = new File("allblacknums.conf");
		if (!file.exists())
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create allblacknums.conf file failed", e);
				return;
			}
		StringBuffer data = new StringBuffer();
		String[] numsarray = nums.split(",");
		for (int i = 0; i < numsarray.length; i++) {
			data.append(numsarray[i]);
			data.append("\r\n");
		}
		try {
			allBlackNumCach.put("allblack",nums);
			Writer fw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file), "UTF-8"));
			fw.write(data.toString());
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Write allblacknums.conf file failed", e);
		}
	}
	
	public static void loadAllBlackNums() {
		try {
			allBlackNumCach.clear();
			File file = new File("allblacknums.conf");
			if (file.exists()) {
				BufferedReader br = new BufferedReader(new FileReader(file));
				String line = null;
				StringBuffer numsb = new StringBuffer();
				while ((line = br.readLine()) != null) {
					numsb.append(line+",");
				}
				String nums = "";
				if(numsb.length()>0){
					nums = numsb.substring(0, numsb.length()-1);
				}
				allBlackNumCach.put("allblack", nums);
				br.close();
			} else {
				file.createNewFile();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
}
