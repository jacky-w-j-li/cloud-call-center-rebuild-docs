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

public class InRouteHandler {
	
	private static Logger log = Logger.getLogger(OutRouteHandler.class.getName());

	public static C5Response configInRoute(C5Action action) {
		C5Response response = new C5Response(action);
		try{
			String gatewayDir = ASConfig.getInstance().getVar("gateway.baseDir");
			if(gatewayDir == null) {
				gatewayDir = "gateway";
			}
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/"+ gatewayDir +"/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/" + gatewayDir + "/" + GWFields.IN_ROUTE_AEL);
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
