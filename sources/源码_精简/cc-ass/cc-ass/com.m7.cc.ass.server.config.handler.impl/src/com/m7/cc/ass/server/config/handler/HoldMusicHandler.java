package com.m7.cc.ass.server.config.handler;

import java.io.File;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class HoldMusicHandler {
	
	public static C5Response addMusic(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String moh = action.getStringValue(Fields.HoldMusic);
			String dir = ASConfig.getInstance()
			.getConfigPath()
			+ "/"
			+ pbx
			+ "/accounts/"
			+ account + "/moh/" + moh;
			File file = new File(dir);
			if(!file.exists())
				file.mkdirs();
			RuntimeData.getInstance().addHoldMusic(pbx, account, moh);
			response.setSucceed(true);
		} catch (Exception e){
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		
		return response;
	}
	
	public static C5Response removeHoldMusic(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String moh = action.getStringValue(Fields.HoldMusic);
			RuntimeData.getInstance().removeHoldMusic(pbx, account, moh);
			File file = new File(ASConfig.getInstance()
							.getConfigPath()
							+ "/"
							+ pbx
							+ "/accounts/"
							+ account + "/moh/" + moh);
			if(file.exists())
				deleteFile(file);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	private static void deleteFile(File file) {
		if (file.isFile()) {
			file.delete();
			return;
		} else {
			File[] files = file.listFiles();
			if (files.length == 0) {
				file.delete();
				return;
			} else {
				for (int i = 0; i < files.length; i++) {
					deleteFile(files[i]);
				}
			}
		}
		file.delete();
	}
}
