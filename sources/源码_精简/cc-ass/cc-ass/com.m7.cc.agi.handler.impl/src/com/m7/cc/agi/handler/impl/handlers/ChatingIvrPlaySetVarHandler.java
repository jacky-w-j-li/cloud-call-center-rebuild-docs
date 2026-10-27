package com.m7.cc.agi.handler.impl.handlers;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class ChatingIvrPlaySetVarHandler {
	public static Logger log = Logger.getLogger(ChatingIvrPlaySetVarHandler.class.getName());

	public static void processChatingIvrSetVar(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String channelName = action.getStringValue(Fields.agi_channel);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbx = a[0].split("=")[1];
				String varId = a[1].split("=")[1];
				
				C5Channel c5channel = RuntimeData.getInstance()
						.getPbxViaId(pbx)
						.getChannel(channelName);
				if (c5channel != null) {
					C5Account account = RuntimeData.getInstance().getAccount(pbx, c5channel.getAccount());
					HashMap<String, String> varMap = account.getChatingIvrPlayVarMap().get(varId);
					if(varMap != null && varMap.size()>0){
						for (Map.Entry<String, String> entry : varMap.entrySet()) {
						    if(entry.getKey().startsWith("__")){
								c5channel.addC5Var(entry.getKey().substring(2), entry.getValue());
								c5channel.addVar(entry.getKey().substring(2), entry.getValue());
							}else{
								c5channel.addVar(entry.getKey(),entry.getValue());									
							}
						    session.send("SET VARIABLE "+entry.getKey()+" \""+entry.getValue()+"\"");
						} 
						account.getChatingIvrPlayVarMap().remove(varId);
					}
				}
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}

}
