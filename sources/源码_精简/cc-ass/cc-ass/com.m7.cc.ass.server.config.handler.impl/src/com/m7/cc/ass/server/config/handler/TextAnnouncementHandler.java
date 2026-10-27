package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class TextAnnouncementHandler {
	private static Logger log = Logger.getLogger(TextAnnouncementHandler.class.getName());
	
	public static C5Response addTextAnnouncement(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			
			TextAnnouncement textAnnouncement = account.getTextAnnouncements().get(exten);
			if(textAnnouncement == null) {
				textAnnouncement = new TextAnnouncement(pbx, accountID, exten);
			}
			if(action.hasKey(Fields.AnnouncementText)){
				textAnnouncement.setAnnouncementText(action.getStringValue(Fields.AnnouncementText));
			}else{
				textAnnouncement.setAnnouncementText(null);
			}
			if(action.hasKey(Fields.WordInterval)){
				textAnnouncement.setWordInterval(action.getStringValue(Fields.WordInterval));
			}else{
				textAnnouncement.setWordInterval(TextAnnouncement.WORD_INTERVAL_DEFAULT);
			}
			if(action.hasKey(Fields.SignInterval)){
				textAnnouncement.setSignInterval(action.getStringValue(Fields.SignInterval));
			}else{
				textAnnouncement.setSignInterval(TextAnnouncement.SIGN_INTERVAL_DEFAULT);
			}
			if(action.hasKey(Fields.IsMoney)){
				textAnnouncement.setIsMoney(action.getStringValue(Fields.IsMoney));
			}else{
				textAnnouncement.setIsMoney(TextAnnouncement.IS_MONEY_DEFAULT);
			}
			if(action.hasKey(Fields.NextPeer)){
				textAnnouncement.setNextPeer(action.getStringValue(Fields.NextPeer));
			}else{
				if(action.hasKey(Fields.ToPeer)){
					textAnnouncement.setNextPeer(action.getStringValue(Fields.ToPeer));
				}else{
					textAnnouncement.setNextPeer(null);
				}
			}
			if(action.hasKey(Fields.DisplayName)){
				textAnnouncement.setDisplayName(action.getStringValue(Fields.DisplayName));
			}
			if(action.hasKey(Fields.Engine)){
				textAnnouncement.setEngine(action.getStringValue(Fields.Engine));
			}else{
				textAnnouncement.setEngine(TextAnnouncement.ENGINE_DEFAULT);
			}
			if(action.hasKey(Fields.Speed)){
				textAnnouncement.setSpeed(action.getStringValue(Fields.Speed));
			}else{
				textAnnouncement.setSpeed(TextAnnouncement.SPEED_DEFAULT);
			}
			if(action.hasKey(Fields.Pitch)){
				textAnnouncement.setPitch(action.getStringValue(Fields.Pitch));
			}else{
				textAnnouncement.setPitch(TextAnnouncement.PITCH_DEFAULT);
			}
			if(action.hasKey(Fields.Volume)){
				textAnnouncement.setVolume(action.getStringValue(Fields.Volume));
			}else{
				textAnnouncement.setVolume(TextAnnouncement.VOLUME_DEFAULT);
			}
			if(action.hasKey(Fields.VoiceName)){
				textAnnouncement.setVoiceName(action.getStringValue(Fields.VoiceName));
			}else{
				textAnnouncement.setVoiceName(TextAnnouncement.VOICE_NAME_DEFAULT);
			}
			if(action.hasKey(Fields.ReplaceVar)){
				textAnnouncement.setReplaceVar(action.getStringValue(Fields.ReplaceVar));
			}else{
				textAnnouncement.setReplaceVar("");
			}
			response.setSucceed(RuntimeData.getInstance().addTextAnnouncement(
					pbx, accountID, textAnnouncement));
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
