package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class EncryptMD5Handler {
	private static Logger log = Logger.getLogger(TextAnnouncementHandler.class.getName());
	
	public static C5Response addEncryptMD5(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			
			EncryptMD5 encryptMD5 = account.getEncryptMD5s().get(exten);
			if(encryptMD5 == null) {
				encryptMD5 = new EncryptMD5(pbx, accountID, exten);
			}
			if(action.hasKey(Fields.EncryptText)){
				encryptMD5.setEncryptText(action.getStringValue(Fields.EncryptText));
			}
			if(action.hasKey(Fields.Variable)){
				encryptMD5.setVar(action.getStringValue(Fields.Variable));
			}
			if(action.hasKey(Fields.NextPeer)){
				encryptMD5.setNextPeer(action.getStringValue(Fields.NextPeer));
			}else{
				encryptMD5.setNextPeer(null);
			}
			if(action.hasKey(Fields.DisplayName)){
				encryptMD5.setDisplayName(action.getStringValue(Fields.DisplayName));
			}
			
			response.setSucceed(RuntimeData.getInstance().addEncryptMD5(pbx,
					accountID, encryptMD5));
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
