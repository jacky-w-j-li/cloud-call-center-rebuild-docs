package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class PhoneNumberHandler {
	public static Logger log = Logger.getLogger(PhoneNumberHandler.class
			.getName());

	public static void isLocalNumber(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");

			String number = a[0].split("=")[1];

			if (number == null || number.equals("")) {
				log.warning("number not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			String account = null;
			String prefix = null;
			if(a.length > 1){
				String pbxID = a[1].split("=")[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
				if(pbx != null){
					C5Channel channel = pbx.getChannel(channelName);
					if(channel != null){
						account = channel.getAccount();						
					}else{
						prefix = ASConfig.getInstance().getDistrictNo();
					}
				}else{
					prefix = a[1].split("=")[1];
				}
			}else{
					prefix = ASConfig.getInstance().getDistrictNo();
			}
			if(account != null){
				prefix = ASConfig.getInstance().getDistrictNo(account);	
			}
			if(number.startsWith("0"))
				number = number.substring(1);

			if (ASConfig.getInstance().isLocalMobileNumber(number, prefix)) {
				session.send("SET VARIABLE isLocal 1");
			}

			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
}
