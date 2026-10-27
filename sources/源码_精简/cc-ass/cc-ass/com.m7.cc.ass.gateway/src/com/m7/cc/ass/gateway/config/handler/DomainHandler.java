package com.m7.cc.ass.gateway.config.handler;

import java.io.File;
import java.io.FileWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.config.GWFields;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class DomainHandler {

	private static Logger log = Logger.getLogger(DomainHandler.class.getName());
	
	public static C5Response configSipDomain(C5Action action) {
		C5Response response = new C5Response(action);
		try{
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + GWFields.SIP_DOMAIN_CONF);
			if (!file.exists())
				file.createNewFile();
			String data = "";
			data=action.getStringValue(Fields.Content);
			FileWriter fw = new FileWriter(file);
			try{
				fw.write(data);
				fw.flush();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			} finally {
				fw.close();
				CommonHandler.reload();
				response.setSucceed(true);
			}
		}catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	

}
