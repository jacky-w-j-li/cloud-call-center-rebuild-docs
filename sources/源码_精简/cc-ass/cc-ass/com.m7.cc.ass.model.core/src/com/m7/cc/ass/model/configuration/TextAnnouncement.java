package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class TextAnnouncement extends Context implements ServicePeer{
	public static final String WORD_INTERVAL_DEFAULT = "120";
	public static final String SIGN_INTERVAL_DEFAULT = "500";
	public static final String IS_MONEY_DEFAULT = "0";
	public static final String ENGINE_DEFAULT = "default";
	public static final String ENGINE_KDXF = "kdxf";
	public static final String SPEED_DEFAULT = "50";
	public static final String PITCH_DEFAULT = "50";
	public static final String VOLUME_DEFAULT = "70";
	public static final String VOICE_NAME_DEFAULT = "xiaoyan";
	
	private String pbx;
	private String account;
	
	private String displayName;
	private String announcementText;
	private String wordInterval = WORD_INTERVAL_DEFAULT;
	private String signInterval = SIGN_INTERVAL_DEFAULT;
	private String isMoney = IS_MONEY_DEFAULT;
	private String nextPeer = null;
	private String engine = ENGINE_DEFAULT;
	private String speed = SPEED_DEFAULT;
	private String pitch = PITCH_DEFAULT;
	private String volume = VOLUME_DEFAULT;
	private String voiceName = VOICE_NAME_DEFAULT;
	private String replaceVar;
	
	
	public TextAnnouncement(String pbx, String account, String exten){
		super(account+"-"+exten+"-"+Fields.TextAnnouncement, exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = Fields.TextAnnouncement + "-" + exten;
	}
	
	public void setValue(Hashtable<String, String> data){
		if(data.containsKey(Fields.AnnouncementText))
			this.announcementText = data.get(Fields.AnnouncementText);
		else
			this.announcementText = "";
		
		if(data.containsKey(Fields.WordInterval))
			this.wordInterval = data.get(Fields.WordInterval);
		else
			this.wordInterval = WORD_INTERVAL_DEFAULT;
		
		if(data.containsKey(Fields.SignInterval))
			this.signInterval = data.get(Fields.SignInterval);
		else
			this.signInterval = SIGN_INTERVAL_DEFAULT;
		
		if(data.containsKey(Fields.IsMoney))
			this.isMoney = data.get(Fields.IsMoney);
		else
			this.isMoney = IS_MONEY_DEFAULT;
		
		if(data.containsKey(Fields.NextPeer))
			this.nextPeer = data.get(Fields.NextPeer);
		else
			this.nextPeer = null;
		
		if(data.containsKey(Fields.DisplayName))
			this.displayName = data.get(Fields.DisplayName);
		
		if(data.containsKey(Fields.Engine))
			this.engine = data.get(Fields.Engine);
		else
			this.engine = ENGINE_DEFAULT;
		
		if(data.containsKey(Fields.Speed))
			this.speed = data.get(Fields.Speed);
		else
			this.speed = SPEED_DEFAULT;
		
		if(data.containsKey(Fields.Pitch))
			this.pitch = data.get(Fields.Pitch);
		else
			this.pitch = PITCH_DEFAULT;
		
		if(data.containsKey(Fields.Volume))
			this.volume = data.get(Fields.Volume);
		else
			this.volume = VOLUME_DEFAULT;
		
		if(data.containsKey(Fields.VoiceName))
			this.voiceName = data.get(Fields.VoiceName);
		else
			this.voiceName = VOICE_NAME_DEFAULT;
		
		if(data.containsKey(Fields.ReplaceVar))
			this.replaceVar = data.get(Fields.ReplaceVar);
		else
			this.replaceVar = "";
	}
	
	@Override
	public void addValues(HashMap<String, Object> map) {
	}
	
	@Override
	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}
	
	@Override
	public String getDisplayName() {
		return this.displayName;
	}
	
	@Override
	public String getServicePeerName() {
		return Fields.TextAnnouncement;
	}
	
	@Override
	public void setValues(HashMap<String, Object> map) {
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getAnnouncementText() {
		return announcementText;
	}

	public void setAnnouncementText(String announcementText) {
		this.announcementText = announcementText;
	}

	public String getNextPeer() {
		return nextPeer;
	}

	public void setNextPeer(String nextPeer) {
		this.nextPeer = nextPeer;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getWordInterval() {
		return wordInterval;
	}

	public void setWordInterval(String wordInterval) {
		this.wordInterval = wordInterval;
	}

	public String getSignInterval() {
		return signInterval;
	}

	public void setSignInterval(String signInterval) {
		this.signInterval = signInterval;
	}

	public String getIsMoney() {
		return isMoney;
	}

	public void setIsMoney(String isMoney) {
		this.isMoney = isMoney;
	}

	public String getEngine() {
		return engine;
	}

	public void setEngine(String engine) {
		this.engine = engine;
	}

	public String getSpeed() {
		return speed;
	}

	public void setSpeed(String speed) {
		this.speed = speed;
	}

	public String getPitch() {
		return pitch;
	}

	public void setPitch(String pitch) {
		this.pitch = pitch;
	}

	public String getVolume() {
		return volume;
	}

	public void setVolume(String volume) {
		this.volume = volume;
	}

	public String getVoiceName() {
		return voiceName;
	}

	public void setVoiceName(String voiceName) {
		this.voiceName = voiceName;
	}

	public String getReplaceVar() {
		return replaceVar;
	}

	public void setReplaceVar(String replaceVar) {
		this.replaceVar = replaceVar;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.DisplayName, displayName);
		event.addParameter(Fields.AnnouncementText, announcementText);
		event.addParameter(Fields.WordInterval, wordInterval);
		event.addParameter(Fields.SignInterval, signInterval);
		event.addParameter(Fields.IsMoney, isMoney);
		event.addParameter(Fields.NextPeer, nextPeer);
		event.addParameter(Fields.Engine, engine);
		event.addParameter(Fields.Speed, speed);
		event.addParameter(Fields.Pitch, pitch);
		event.addParameter(Fields.Volume, volume);
		event.addParameter(Fields.VoiceName, voiceName);
		event.addParameter(Fields.ReplaceVar, replaceVar);
		return event;
	}
	
}
