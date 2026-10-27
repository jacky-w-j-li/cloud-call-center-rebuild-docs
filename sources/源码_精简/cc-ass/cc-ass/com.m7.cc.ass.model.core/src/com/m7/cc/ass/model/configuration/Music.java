package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;


/**
 * A class to play a music file.
 * 
 * @author Cai Zhibin 2009-10-27
 *
 */
public class Music implements ServicePeer{

	private String account;
	private String pbx;
	private String musicFile;
	
	/**
	 * true: play back
	 * false: background play
	 */
	private boolean playback = true;
	
	public Music(String pbx, String account, String file){
		this.pbx = pbx;
		this.account = account;
		this.musicFile = file;
	}
	
	public String getMusicFile() {
		return musicFile;
	}
	
	public String getMusicFileWithNoExtension() {
		String file = musicFile;
		int a = file.lastIndexOf('.');
		if(a != -1){
			file = file.substring(0, a);
		}
		return file;
	}

	public void setMusicFile(String musicFile) {
		this.musicFile = musicFile;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public boolean isPlayback() {
		return playback;
	}

	public void setPlayback(boolean playback) {
		this.playback = playback;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getExten() {
		return null;
	}

	public String getActionString() {
		String file = musicFile;
		int a = file.lastIndexOf('.');
		if(a != -1){
			file = file.substring(0, a);
		}
		return (playback?"Playback":"BackGround")+"("+file+")";
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return "Music";
	}
	
	public String getDisplayName() {
		return null;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		return event;
	}
	
}
