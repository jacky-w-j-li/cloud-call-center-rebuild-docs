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

public class DelRecord {

	private static Logger log = Logger.getLogger(DelRecord.class.getName());
	
	public static void deleteRecord(){
		Thread t = new Thread("Delete record"){
			public void run(){
				delete();
			}
		};
		t.start();
	}
	
	private static void delete(){
		try{
			log.info("Begin Delete Monitor File Task");
			int duration = ASConfig.getInstance().getMonitorDuration();
			if(duration == -1)
				return;
			File file = new File("/var/spool/asterisk/monitor");
			
			File[] files = file.listFiles();
			for(int i=0;i<files.length;i++){
				File afile = files[i];
				String fileName = afile.getName();
				if(fileName.matches("[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+")){
					log.info("<><><>begin check pbx:"+fileName);
					boolean hasSetMonitorDuration = false;
					int MinMonitorDuration = ASConfig.getInstance().getMonitorDuration();
					C5Pbx thisPbx = RuntimeData.getInstance().getPbxViaId(fileName);
					if(thisPbx == null){
						continue;
					}
					Hashtable<String, C5Account> thisAccounts = thisPbx.getAccounts();
					Set<String> keys = thisAccounts.keySet();  
			        for(String key: keys){
			            if(thisAccounts.get(key).getMonitorDuration() != -1){
			            	hasSetMonitorDuration = true;
			            	if(thisAccounts.get(key).getMonitorDuration() < MinMonitorDuration){
			            		MinMonitorDuration = thisAccounts.get(key).getMonitorDuration();
			            	}
			            }
			        }
					if(hasSetMonitorDuration){
						File[] rfileVos = afile.listFiles();
						//rfileVos is date collections
						for(int j=0;j<rfileVos.length;j++){
							File datefile = rfileVos[j];
							String rname = datefile.getName();
							if(!rname.matches("[1-9][0-9]{7}"))
								continue;
							long currentTime = System.currentTimeMillis();
							long toDelete = currentTime - 3600000l*MinMonitorDuration*24l;
							Date aaa = new Date(toDelete);
							DateFormat df = new SimpleDateFormat("yyyyMMdd");
							String date = df.format(aaa);
							int toDelTime = Integer.valueOf(date);
							int aDate = Integer.valueOf(rname);
							//standard deltime---
							long standardToDelete = currentTime - 3600000l*duration*24l;
							Date standardDf = new Date(standardToDelete);
							String standardDate = df.format(standardDf);
							int standardToDelTime = Integer.valueOf(standardDate);
							//---
							if(aDate < toDelTime){
								if(datefile.list().length > 0){
									log.info("@@@coming check date:"+rname);
									File[] mp3files = datefile.listFiles();
									for(int k=0;k<mp3files.length;k++){
										String mp3Name = mp3files[k].getName();
										if(mp3Name.indexOf("N") == -1){
											Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
											process.waitFor();
											process.destroy();
										}else{
											int accIndex = mp3Name.indexOf("N");
											if(mp3Name.length() > accIndex+12+4){
												String account = mp3Name.substring(accIndex, accIndex+12);
//												C5Account acc = RuntimeData.getInstance().getAccount(fileName, account);
												C5Account acc = RuntimeData.getInstance().getPbxViaId(fileName).getAccount(account);
												if(acc != null){
													if(acc.getMonitorDuration() != -1){
														long accToDelete = currentTime - 3600000l*acc.getMonitorDuration()*24l;
														Date accAaa = new Date(accToDelete);
														String accDate = df.format(accAaa);
														int accToDelTime = Integer.valueOf(accDate);
														int accADate = Integer.valueOf(rname);
														if(accADate < accToDelTime){
															log.info("Delete file: beyond date "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
															Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
															process.waitFor();
															process.destroy();
														}
													}else{
														long accToDelete = currentTime - 3600000l*ASConfig.getInstance().getMonitorDuration()*24l;
														Date accAaa = new Date(accToDelete);
														String accDate = df.format(accAaa);
														int accToDelTime = Integer.valueOf(accDate);
														int accADate = Integer.valueOf(rname);
														if(accADate < accToDelTime){
															log.info("Delete file: normal beyond date "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
															Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
															process.waitFor();
															process.destroy();
														}
													}
												}else{
													if(aDate < standardToDelTime){
														log.info("Delete file: beyond standardToDelTime account is null "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
														Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
														process.waitFor();
														process.destroy();														
													}
												}
											}else{
												if(aDate < standardToDelTime){
													log.info("Delete file: beyond standardToDelTime fileName is error "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
													Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+"/"+mp3Name);
													process.waitFor();
													process.destroy();													
												}
											}
										}
									}
								}else{
									log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname);
									Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname);
									process.waitFor();
									process.destroy();
									log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+" end");
								}
							}
						}
						
					}else{
						log.info("<><><>coming check old del:"+fileName);
						String[] rfiles = afile.list();
						for(int j=0;j<rfiles.length;j++){
							String rname = rfiles[j];
							if(!rname.matches("[1-9][0-9]{7}"))
								continue;
							long currentTime = System.currentTimeMillis();
							long toDelete = currentTime - 3600000l*duration*24l;
							Date aaa = new Date(toDelete);
							DateFormat df = new SimpleDateFormat("yyyyMMdd");
							String date = df.format(aaa);
							int toDelTime = Integer.valueOf(date);
							int aDate = Integer.valueOf(rname);
							if(aDate < toDelTime){
								log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname);
								Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname);
								process.waitFor();
								process.destroy();
								log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/"+fileName+"/"+rname+" end");
							}
						}
					}
					log.info("End Delete Monitor File Task Success!");
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "Monitor File Task Has Exception! ", e);
			e.printStackTrace();
		}
	}
	
	public static void deleteRecordZip(){
		Thread t = new Thread("Delete record zip"){
			public void run(){
				deleteZip();
			}
		};
		t.start();
	}
	
	private static void deleteZip(){
		try{
			File file = new File("/var/spool/asterisk/monitor/recorderZip");
			File[] files = file.listFiles();
			for(int i=0;i<files.length;i++){
				File afile = files[i];
				String fileName = afile.getName();
				if(fileName.endsWith(".zip")){
					String rname = fileName.substring(0, 8);
					if(!rname.matches("[1-9][0-9]{7}"))
						continue;
					long currentTime = System.currentTimeMillis();
					long toDelete = currentTime - 3600000l*31*24l;
					Date aaa = new Date(toDelete);
					DateFormat df = new SimpleDateFormat("yyyyMMdd");
					String date = df.format(aaa);
					int toDelTime = Integer.valueOf(date);
					int aDate = Integer.valueOf(rname);
					if(aDate < toDelTime){
						log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/recorderZip/"+fileName);
						Process process = Runtime.getRuntime().exec("rm -rf /var/spool/asterisk/monitor/recorderZip/"+fileName);
						process.waitFor();
						process.destroy();
						log.info("Delete file: "+"rm -rf /var/spool/asterisk/monitor/recorderZip/"+fileName+" end");
					}
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "deleteZip File Task Has Exception! ", e);
			e.printStackTrace();
		}
	}
	
	public static void main(String[] args){
//		String fileName = "dh.pbx.3.0";
//		if(fileName.matches("[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+")){
//			System.out.println("-======matche----");
//		}
		
		long currentTime = System.currentTimeMillis();
		long toDelete = currentTime - 3600000*30*24l;
//		long toDelete = 3600000*730;
		System.out.println("==="+toDelete);
		Date aaa = new Date(toDelete);
		DateFormat df = new SimpleDateFormat("yyyyMMdd");
		String date = df.format(aaa);
		System.out.println(date+"----");
		int toDelTime = Integer.valueOf(date);
		String rname = "20160517";
		int aDate = Integer.valueOf(rname);
		System.out.println(toDelTime);
		System.out.println(aDate);
		if(aDate < toDelTime){
			System.out.println("ok---");
		}
//		String a = "dh.pbx.2.1";
//		if(a.matches("[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+"))
//			System.out.println("++++++++");
//		}
//		String abc = "123-N0000000";
//		System.out.println(abc.indexOf("x"));
//		System.out.println(abc.substring(abc.indexOf("N"), abc.indexOf("N")+12));
	}	
}
