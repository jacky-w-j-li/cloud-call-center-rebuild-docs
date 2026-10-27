package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ValidationHandler {
	private static Logger log = Logger.getLogger(ValidationHandler.class.getName());
	
	public static C5Response addValidate(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			String data = action.getStringValue(Fields.Data);
//			boolean update = action.getBoolValue(Fields.Update);
			int waitTimeout = action.getIntValue(Fields.WaitTime);
			
			Validation validation = RuntimeData.getInstance()
					.getAccount(pbx, account).getValidationNodes().get(exten);
			if (validation == null)
				validation = new Validation(pbx, account, exten);
			validation.setData(data);
			validation.setWaitTimeout(waitTimeout);
			if (action.hasKey(Fields.Filename)) {
				String filename = action.getStringValue(Fields.Filename);
				String file = ASConfig.getInstance().getConfigPath()
						+ "/" + pbx + "/accounts/"
						+ account + "/" + ASConfig.AudioDirectory
						+ "/" + filename;
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music music = new Music(pbx, account, file);
				music.setPlayback(false);
				validation.setMusic(music);
			} else {
				validation.setMusic(null);
			}
			
			
			int endType = action.getIntValue(Fields.EndType);
			validation.setEndType(endType);
			if (Validation.END_LENGTH == endType)
			{
				int endLength = action.getIntValue(Fields.EndLength);
				validation.setEndLength(endLength);
			}
			else if (Validation.END_CHAR == endType)
			{
				int maxLength = action.getIntValue(Fields.Max);	
				validation.setMaxLength(maxLength);
				validation.setEndKey(action.getStringValue(Fields.EndKey));
			}
			int minLength = action.getIntValue(Fields.Min);
			validation.setMinLength(minLength);
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					validation.setDisplayName(displayName);
				}
			}
			
			if(action.hasKey(Fields.ToPeer))
				validation.setNextPeer(action.getStringValue(Fields.ToPeer));
			
			if (action.hasKey(Fields.ToPeerWhenWaitTimeout))
				validation.setNextPeerWhenTimeout(action.getStringValue(Fields.ToPeerWhenWaitTimeout));
			
			if (action.hasKey(Fields.ReturnKey))
				validation.setReturnKey(action.getStringValue(Fields.ReturnKey));
				
			Vector<Validation> validations = new Vector<Validation>();
			validations.add(validation);
//			if(update)
			RuntimeData.getInstance().updateValidate(pbx, account, validations);
//			else RuntimeData.getInstance().addValidate(pbx, account, validations);
			response.setSucceed(true);
		} catch (Exception e){
			log.log(Level.WARNING, "ValidateAdd: \r\n"+action.getJsonString(), e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
