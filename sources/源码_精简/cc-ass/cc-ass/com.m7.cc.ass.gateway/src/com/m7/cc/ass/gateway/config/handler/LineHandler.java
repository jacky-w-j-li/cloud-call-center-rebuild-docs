package com.m7.cc.ass.gateway.config.handler;

import java.io.File;
import java.io.FileWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.config.GWFields;
import com.m7.cc.ass.gateway.config.model.GWLine;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class LineHandler {

	private static Logger log = Logger.getLogger(LineHandler.class.getName());
	
	public static C5Response addLine(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String exten = action.getStringValue(Fields.Exten);
			String ip = action.getStringValue(Fields.Address);
			int port = action.getIntValue(Fields.Port);
			String displayName = "";
			if(action.hasKey(Fields.DisplayName)){
				displayName = action.getStringValue(Fields.DisplayName);
			}
			
			GWLine line = GWRuntimeData.getInstance().getLine(exten);
			if(line == null)
				line = new GWLine(exten);
			line.setDisplayName(displayName);
			line.setIp(ip);
			line.setPort(port);
			
			GWRuntimeData.getInstance().addLine(line);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response removeLine(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String exten = action.getStringValue(Fields.Exten);
			GWRuntimeData.getInstance().removeLine(exten);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static C5Response configLine(C5Action action) {
		C5Response response = new C5Response(action);
		try{
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + GWFields.LINE_AEL);
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
