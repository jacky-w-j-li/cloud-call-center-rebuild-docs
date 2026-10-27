package com.m7.cc.ass.model;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;

public class PbxReloadThread extends Thread{
	
	private String pbx;

	private static Logger log = Logger.getLogger(PbxReloadThread.class.getName());
	
	public PbxReloadThread(String pbx) {
		this.pbx = pbx;
	}
	
	@Override
	public void run() {
		log.log(Level.INFO, pbx + "PbxReloadThread is started!");
		C5Pbx pbxVo = RuntimeData.getInstance().getPbxViaId(this.pbx);
		String type = null;
		while (true){
			try {
				if(pbxVo.getTaskToReload().size() > 0){
					if(pbxVo.getTaskToReload().get("all") != null && pbxVo.getTaskToReload().get("all").equals("true")){
						log.log(Level.INFO, pbx + "PbxReloadThread [all = true] reload we to reload!");
						type = "all";
						AMICore.getInstance().getAMIClient(this.pbx).reload();
						pbxVo.getTaskToReload().put("all", "false");
						Thread.sleep(15000);
					}else if(pbxVo.getTaskToReload().get("ael") != null && pbxVo.getTaskToReload().get("ael").equals("true")){
						log.log(Level.INFO, pbx + "PbxReloadThread [ael = true] reload we to reload!");
						type = "ael";
						AMICore.getInstance().getAMIClient(this.pbx).reloadAel();
						pbxVo.getTaskToReload().put("ael", "false");
						Thread.sleep(15000);
					}else if(pbxVo.getTaskToReload().get("sip") != null && pbxVo.getTaskToReload().get("sip").equals("true")){
						log.log(Level.INFO, pbx + "PbxReloadThread [sip = true] reload we to reload!");
						type = "sip";
						AMICore.getInstance().getAMIClient(this.pbx).reloadSip();
						pbxVo.getTaskToReload().put("sip", "false");
						Thread.sleep(15000);
					}else if(pbxVo.getTaskToReload().get("queue") != null && pbxVo.getTaskToReload().get("queue").equals("true")){
						log.log(Level.INFO, pbx + "PbxReloadThread [queue = true] reload we to reload!");
						type = "queue";
						AMICore.getInstance().getAMIClient(this.pbx).reloadQueue();
						pbxVo.getTaskToReload().put("queue", "false");
						Thread.sleep(15000);
					}else{
						Thread.sleep(30000);
						continue;
					}
					log.log(Level.INFO, pbx +"["+type+"]PbxReloadThread ==== reload ok!");
				}else{
					log.log(Level.INFO, pbx + "PbxReloadThread size is 0 sleep!");
						Thread.sleep(30000);
				}
			} catch (InterruptedException e) {
				e.printStackTrace();
				log.log(Level.WARNING, "PbxReloadThread has Excepiton!" , e);
			}
		}
		
	}

}
