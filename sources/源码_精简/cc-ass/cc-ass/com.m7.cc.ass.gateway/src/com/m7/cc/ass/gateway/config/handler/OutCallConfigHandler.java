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

public class OutCallConfigHandler {
	private static Logger log = Logger.getLogger(OutCallConfigHandler.class
			.getName());

	public static C5Response configOutRoute(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String gatewayDir = ASConfig.getInstance().getVar("gateway.baseDir");
			if(gatewayDir == null) {
				gatewayDir = "gateway";
			}
			String[] amis = ASConfig.getInstance().getPbxs();
			for (int i = 0; i < amis.length; i++) {
				if (amis[i].startsWith("gateway")) {
					gatewayDir = amis[i];
					File dir = new File(ASConfig.getInstance().getConfigPath()
							+ "/" + gatewayDir + "/");
					if (!dir.exists())
						dir.mkdirs();
					File file = new File(ASConfig.getInstance().getConfigPath()
							+ "/" + gatewayDir + "/" + GWFields.OUT_CALL_CONFIG_AEL);
					if (!file.exists())
						file.createNewFile();
					String data = "";
					data = action.getStringValue(Fields.Content);
					FileWriter fw = new FileWriter(file);
					try {
						fw.write(data);
						fw.flush();
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					} finally {
						fw.close();
						Thread.sleep(3000);
						CommonHandler.reload(gatewayDir);
						response.setSucceed(true);
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	private void mian() {
		// TODO Auto-generated method stub

	}
}
