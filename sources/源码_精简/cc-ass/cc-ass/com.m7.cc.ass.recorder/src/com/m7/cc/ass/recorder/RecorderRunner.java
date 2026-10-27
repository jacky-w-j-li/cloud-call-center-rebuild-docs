package com.m7.cc.ass.recorder;

import java.io.File;
import java.io.FilenameFilter;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class RecorderRunner implements Runnable {

	private String pbx;
	private boolean running = true;
	private Thread thread;

	private static Logger log = Logger
			.getLogger(RecorderRunner.class.getName());

	public RecorderRunner(String pbx) {
		this.pbx = pbx;
	}

	public void start() {
		thread = new Thread(this);
		thread.setName("Recorder " + pbx);
		thread.start();
	}

	public void close() {
		running = false;
		try {
			thread.interrupt();
		} catch (Exception e) {

		}
	}

	/**
	 * Send all files which last modified are 10s ago.
	 * 
	 */
	private void moveRecorder() {
		File dir = new File("/var/spool/asterisk/" + pbx + "/monitor");
		if (dir.exists()) {
			File[] recorders = dir.listFiles(new FilenameFilter() {

				@Override
				public boolean accept(File arg0, String arg1) {
					if (arg1.endsWith("wav"))
						return true;
					else
						return false;
				}
			});
			for (int i = 0; i < recorders.length; i++) {
				File rcd = recorders[i];
				if (rcd.exists()) {
					String name = rcd.getPath();
					if(!recorderForbidden(name)){
						if (name.endsWith("in.wav") && !name.endsWith("premedia-in.wav")) {
							if (System.currentTimeMillis() - rcd.lastModified() > 10000) {
								File outFile = new File(rcd.getPath().replaceAll(
										"-in.wav", "-out.wav"));
								if (outFile.exists()
										&& System.currentTimeMillis()
												- outFile.lastModified() > 10000) {
									if(sendFile(rcd) && sendFile(outFile)){
										rcd.delete();
										outFile.delete();
									} else {
										log.warning(pbx+"Send record failed, start mix");
										if(mixFile(rcd, outFile)){
//											sendFileToTemp(rcd);//for test
//											sendFileToTemp(outFile);//for test
											rcd.delete();
											outFile.delete();
										}
									}
								}
							}
						} else if (name.endsWith("vm.wav")) {
							if (System.currentTimeMillis() - rcd.lastModified() > 10000) {
								if(sendFile(rcd)){
									rcd.delete();
								} else {
									if(mixFile(rcd)){
										rcd.delete();
									}
								}
							}
						} else if (name.endsWith("premedia-out.wav")) {
							if (System.currentTimeMillis() - rcd.lastModified() > 10000) {
								transformPremedia(rcd);
								rcd.delete();							
							}
						} else if (name.endsWith("premedia-in.wav")) {
							rcd.delete();
							continue;
						} else if (name.endsWith("out.wav")) {
							continue;
						} else {
							log.warning("unknow recorder type: " + name);
							continue;
						}
					}else{
						//if forbidden recorder ,then remove in-out files
						if (System.currentTimeMillis() - rcd.lastModified() > 10000)
							rcd.delete();
					}
				}
			}
		} else {
			log.warning("File directory /var/spool/asterisk/" + pbx
					+ "/monitor not found");
		}
	}

//	public void mix() {
//		String rdStr = "/var/spool/asterisk/" + pbx + "/monitor";
//		File rdFile = new File(rdStr);
//		if (rdFile.exists()) {
//			File[] recorders = rdFile.listFiles(new FilenameFilter() {
//				@Override
//				public boolean accept(File arg0, String arg1) {
//					if (arg1.endsWith("wav"))
//						return true;
//					else
//						return false;
//				}
//			});
//			for (int j = 0; j < recorders.length; j++) {
//
//				try {
//					File rcd = recorders[j];
//					String name = rcd.getPath();
//					if (name.endsWith("in.wav")) {
//						if (System.currentTimeMillis() - rcd.lastModified() > 10000) {
//							File outFile = new File(rcd.getPath().replaceAll(
//									"-in.wav", "-out.wav"));
//							if (outFile.exists()
//									&& System.currentTimeMillis()
//											- outFile.lastModified() > 10000) {
//								if(mixFile(rcd, outFile)){
//									rcd.delete();
//									outFile.delete();
//								}
//							}
//						}
//					} else if (name.endsWith("vm.wav")) {
//						if (System.currentTimeMillis() - rcd.lastModified() > 10000) {
//							if(mixFile(rcd)){
//								rcd.delete();
//							}
//							continue;
//						}
//					} else if (name.endsWith("out.wav")) {
//						continue;
//					} else {
//						log.warning("unknow recorder type: " + name);
//						continue;
//					}
//				} catch (Exception e) {
//					log.log(Level.WARNING, "", e);
//				}
//			}
//		}
//	}

	private boolean sendFile(File rcd) {
		boolean succeed = false;
		String mixServer = ASConfig.getInstance().getVar("recorder.server");
		if (mixServer != null && mixServer.startsWith("http")) {
			String result = "";
			try {
				result = HttpProvider.sendGet(mixServer + "ping", 3000);
				if (result.equals("Pong")) {
					String sendIn = mixServer + "command?Action=MusicAdd&PBX="
							+ pbx + "&Filename=" + rcd.getName();
					String response = HttpProvider.sendFile(sendIn, rcd
							.getPath());
					if (response.endsWith("200")) {
						log.info("Sending file succeed: [" + rcd.length()
								+ "] " + rcd.getName());
						succeed = true;
					} else {
						log.warning("Sending file failed: " + response + " - "
								+ rcd.getName());
					}
				}
			} catch (Exception e) {
				log.log(Level.WARNING, pbx + "Send file failed!"+mixServer, e);
			}
		}
		return succeed;
	}
	
	private boolean sendFileToTemp(File rcd) {
		log.info("sendFileToTemp file 1" + rcd.getName());
		boolean succeed = false;
		String mixServer = "http://10.132.24.136:7003/";
		if (mixServer != null && mixServer.startsWith("http")) {
			String result = "";
			try {
				result = HttpProvider.sendGet(mixServer + "ping", 3000);
				if (result.equals("Pong")) {
					log.info("sendFileToTemp file " + rcd.getName());
					String sendIn = mixServer + "command?Action=MusicAdd&PBX="
							+ pbx + "&Filename=" + rcd.getName();
					String response = HttpProvider.sendFile(sendIn, rcd
							.getPath());
					if (response.endsWith("200")) {
						log.info("sendFileToTemp file succeed: [" + rcd.length()
								+ "] " + rcd.getName());
						succeed = true;
					} else {
						log.warning("sendFileToTemp file failed: " + response + " - "
								+ rcd.getName());
					}
				}
			} catch (Exception e) {
				log.log(Level.WARNING, pbx + "Send file failed!"+mixServer, e);
			}
		}
		return succeed;
	}

	private boolean mixFile(File inFile, File outFile) {
		try {
			String toStr = "/var/spool/asterisk/monitor/" + pbx;
			File toFile = new File(toStr);
			if (!toFile.exists())
				toFile.mkdirs();

			String name = inFile.getPath();
			String fileName = inFile.getName();
			String dayString = fileName.substring(0, fileName.indexOf('-'));
			File dayDir = new File(toStr + "/" + dayString);
			if (!dayDir.exists())
				dayDir.mkdirs();
			// Mix
			String out = name.replaceAll("in.wav", "out.wav");
			String temp = toStr + "/" + dayString + "/"
					+ fileName.replaceAll("in.wav", "tmp.wav");
			String mp3 = toStr + "/" + dayString + "/"
					+ fileName.replaceAll("-in.wav", ".mp3");
			String command = ASConfig.getInstance().getSox() + " -m " + name
					+ " " + out + " -V1 -r 8000 -2 -t raw " + temp;
			if(ASConfig.getInstance().getVar("voice.record.stereo") != null){
				command = ASConfig.getInstance().getSox() + " -M " + name + " " + out + " -V1 -r 8000 -2 -t raw -c 2 " + temp;
			}
			Process process = Runtime.getRuntime().exec(command);
			process.waitFor();
			process.destroy();

			command = ASConfig.getInstance().getLame()
					+ " -r -m m -s 8 --bitwidth 16 --quiet " + temp + " " + mp3;
			if(ASConfig.getInstance().getVar("voice.record.stereo") != null){
				command = ASConfig.getInstance().getLame() + " -r -m s -s 8 --bitwidth 16 --quiet " + temp + " " + mp3;
			}
			process = Runtime.getRuntime().exec(command);
			process.waitFor();
			process.destroy();
			File file = new File(temp);
			file.delete();
			log.info(pbx+"mixed" + fileName);
			return true;
		} catch (Exception e) {
			log.log(Level.WARNING, "mix error", e);
		}
		return false;
	}

	private boolean mixFile(File vm) {
		try {
			String toStr = "/var/spool/asterisk/monitor/" + pbx;
			String fileName = vm.getName();
			String name = vm.getPath();
			String dayString = fileName.substring(0, fileName.indexOf('-'));
			File dayDir = new File(toStr + "/" + dayString);
			if (!dayDir.exists())
				dayDir.mkdirs();
			String mp3 = toStr + "/" + dayString + "/"
					+ fileName.replaceAll("-vm.wav", ".mp3");
			String command = ASConfig.getInstance().getLame()
					+ " -r -m m -s 8 --bitwidth 16 --quiet " + name + " " + mp3;
			Process process = Runtime.getRuntime().exec(command);
			process.waitFor();
			process.destroy();
			return true;
		} catch (Exception e) {
			log.log(Level.WARNING, "mix error", e);
		}
		return false;
	}

	private boolean transformPremedia(File file) {
		try {
			int num = Utils.getScopeRandom(1, ASConfig.getInstance().getkdxfAsrCount());
			String toStr = "/var/spool/asterisk/monitor/kdxf_asr_"+num;
			File toFile = new File(toStr);
			if (!toFile.exists())
				toFile.mkdirs();

			String name = file.getPath();
			String fileName = file.getName();
			String out = toStr + "/" + fileName.replaceAll("out.wav", "transform.wav");
//			commond: sox abcdefg-out.wav -r 16000 -c 1 -w abcdefg-transform.wav
			String command = ASConfig.getInstance().getSox() + " " + name
					+ " -q -r 16000 -c 1 -w " + out;
			System.out.println("transformPremedia commond = " + command);
			Process process = Runtime.getRuntime().exec(command);
			process.waitFor();
			process.destroy();
			log.info(pbx+" transformPremedia " + fileName);
			return true;
		} catch (Exception e) {
			log.log(Level.WARNING, pbx + "transformPremedia error", e);
		}
		return false;
	}
	
	private boolean recorderForbidden(String fileName){
		boolean recorder403 = false;
		try {
			String accountId = fileName.split("_")[1];
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountId);
			if(account != null && account.getExtenFields() != null){
				Object forbidden = account.getExtenFields().getParameterValue("RecorderForbidden");
				recorder403 = forbidden == null?false:(Boolean)forbidden;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "recorderForbidden failed", e);
			e.printStackTrace();
		}
		return recorder403;
	}
	
	@Override
	public void run() {
		while (running) {
			try {
				moveRecorder();
				Thread.sleep(10000);
			} catch (Throwable e) {
				log.log(Level.WARNING, "record failed", e);
			}
		}
	}
}
