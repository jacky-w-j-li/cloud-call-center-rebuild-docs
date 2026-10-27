package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class Room extends Context implements ServicePeer {
	private String pbx;
	private String account;

	private String displayName;
	private String password;
	
	//runtime data
	private Hashtable<String, RoomMember> roomMembers = new Hashtable<String, RoomMember>();

	public Room(String pbx, String account, String exten) {
		super(account + "-" + exten + "-" + Fields.Room.toLowerCase(), exten);
		this.pbx = pbx;
		this.account = account;
		this.displayName = Fields.Room + "-" + exten;
	}

	public void setValue(Hashtable<String, String> data) {
		if (data.containsKey(Fields.DisplayName))
			this.displayName = data.get(Fields.DisplayName);

		if (data.containsKey(Fields.RoomPassword))
			this.password = data.get(Fields.RoomPassword);
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
		return Fields.Room;
	}

	@Override
	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey(Fields.DisplayName))
			this.displayName = map.get(Fields.DisplayName).toString();

		if (map.containsKey(Fields.RoomPassword))
			this.password = map.get(Fields.RoomPassword).toString();
		else
			this.password = "";
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

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.Room);
		event.addParameter(Fields.Exten, this.getExten());
		event.addParameter(Fields.DisplayName, this.displayName);
		event.addParameter(Fields.PBX, this.pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Password, password);
		event.addParameter(Fields.RoomMember, getMemberEvent());
		return event;
	}
	
	public void addRoomMember(RoomMember member) {
		synchronized (roomMembers) {
			if (member == null || roomMembers.containsKey(member.getUsernum()))
				return;
			roomMembers.put(member.getUsernum(), member);
		}
	}

	public void removeRoomMember(RoomMember member) {
		synchronized (roomMembers) {
			if (member == null || !roomMembers.containsKey(member.getUsernum()))
				return;
			roomMembers.remove(member.getUsernum());
		}
	}
	
	public void removeMemberViaUsernum(String usernum){
		synchronized (roomMembers) {
			if(usernum == null || !roomMembers.containsKey(usernum))
				return;
			roomMembers.remove(usernum);
		}
	}
	
	public RoomMember getMemberViaUsernum(String usernum){
		synchronized (roomMembers) {
			if(usernum == null)
				return null;
			return roomMembers.get(usernum);
		}
	}
	
	public List<Map<String, Object>> getMemberEvent(){
		List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
		synchronized (roomMembers) {
			if(roomMembers.size() > 0){
				Iterator<RoomMember> m = roomMembers.values().iterator();
				while(m.hasNext()){
					events.add(m.next().getStateEvent().getParameters());
				}
			}
		}
		return events;
	}
}
