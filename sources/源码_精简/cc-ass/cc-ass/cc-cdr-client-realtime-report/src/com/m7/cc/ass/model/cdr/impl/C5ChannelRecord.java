package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5ChannelRecord extends C5Event{
	
	public C5ChannelRecord() {
		super(Fields.ChannelCdr);
	}

	private String account;
	private String asterisk;
	private String uniqueid;
	private String channel;
	private String timestamp;
	private String connect_type;
	//location is ivr/queue/conference/peer/...
	private String location = "system";
	private String locationId = "";
	private String locationName = "";
	//channel status is down/ring/ringing/up/link/unlink/hangup
	private int sequence = 0;
	
	private String fromDid;
	private String fromCid;
	private String data;
	
	private boolean isLinked = false;

	public String getUniqueid() {
		return uniqueid;
	}

	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getChanneType() {
		return connect_type;
	}

	public void setChannelType(String connect_type) {
		this.connect_type = connect_type;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public int getSequence() {
		return sequence;
	}

	public void setSequence(int sequence) {
		this.sequence = sequence;
	}

	public boolean isLinked() {
		return isLinked;
	}

	public void setLinked(boolean isLinked) {
		this.isLinked = isLinked;
	}

	public String getAsterisk() {
		return asterisk;
	}

	public void setAsterisk(String asterisk) {
		this.asterisk = asterisk;
	}

	public String getFromDid() {
		return fromDid;
	}

	public String getConnect_type() {
		return connect_type;
	}

	public void setConnect_type(String connect_type) {
		this.connect_type = connect_type;
	}

	public String getFromCid() {
		return fromCid;
	}

	public void setFromCid(String fromCid) {
		this.fromCid = fromCid;
	}

	public void setFromDid(String fromDid) {
		this.fromDid = fromDid;
	}

	public void setFromDid(Object fromDid) {
		if(fromDid != null)
		this.fromDid = fromDid.toString();
	}

	public void setFromCid(Object fromCid) {
		if(fromCid != null)
			this.fromCid = fromCid.toString();
	}

	public String getData() {
		return data;
	}

	public void setData(Object data) {
		if(data != null)
		this.data = data.toString();
	}

	public String getLocationId() {
		return locationId;
	}

	public void setLocationId(String locationId) {
		this.locationId = locationId;
	}

	public String getLocationName() {
		return locationName;
	}

	public void setLocationName(String locationName) {
		this.locationName = locationName;
	}

	public String getJsonString(){
		String str = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
					+",\""+Fields.Event+"\":\""+Fields.ChannelCdr+"\""
					+",\""+Fields.PBX+"\":\""+this.asterisk+"\""
					+",\""+Fields.Account+"\":\""+this.account+"\""
					+",\""+Fields.Channel+"\":\""+this.channel+"\""
					+",\""+Fields.Uniqueid+"\":\""+this.uniqueid+"\""
					+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
					+",\""+Fields.ChannelType+"\":\""+this.connect_type+"\""
					+",\""+Fields.Sequence+"\":"+this.sequence
					+",\""+Fields.Location+"\":\""+this.location+"\""
					+",\""+Fields.LocationId+"\":\""+this.locationId+"\""
					+",\""+Fields.LocationName+"\":\""+this.locationName+"\""
					+",\""+Fields.FromDid+"\":\""+this.fromDid+"\""
					+",\""+Fields.Data+"\":\""+this.data+"\""
					+",\""+Fields.Link+"\":"+this.isLinked
					+"}";
		return str;
	}
	
	public void setValues(C5Event event) throws Exception{
		asterisk = (String) event.getParameterValue(Fields.PBX);
		uniqueid = (String) event.getParameterValue(Fields.Uniqueid);
		channel = (String) event.getParameterValue(Fields.Channel);
		timestamp = (String) event.getParameterValue(Fields.Timestamp);
		connect_type = (String) event.getParameterValue(Fields.ChannelType);
		location = (String) event.getParameterValue(Fields.Location);
		account = (String)event.getParameterValue(Fields.Account);
		this.setLocationId(event.getStringValue(Fields.LocationId));
		this.setLocationName(event.getStringValue(Fields.LocationName));
		this.setFromCid(event.getParameterValue(Fields.FromCid));
		this.setFromDid(event.getParameterValue(Fields.FromDid));
		this.setData(event.getParameterValue(Fields.Data));
	}
	

	@Override
	public void setValues(Map<String, Object> map) {
			asterisk = (String) map.get(Fields.PBX);
			uniqueid = (String) map.get(Fields.Uniqueid);
			channel = (String) map.get(Fields.Channel);
			timestamp = (String) map.get(Fields.Timestamp);
			connect_type = (String) map.get(Fields.ChannelType);
			location = (String) map.get(Fields.Location);
			sequence = ((Long) map.get(Fields.Sequence)).intValue();
			isLinked = (Boolean) map.get(Fields.Link);
			account = (String)map.get(Fields.Account);
			this.setLocationId((String)map.get(Fields.LocationId));
			this.setLocationName((String)map.get(Fields.LocationName));
//			if(map.get(Fields.LocationName).toString().contains("\\")){
//				this.setLocationName(Utils.unicodeToGB(map.get(Fields.LocationName).toString()));					
//			}else{
//				this.setLocationName((String) map.get(Fields.LocationName));
//			}
			this.setFromCid(map.get(Fields.FromCid));
			this.setFromDid(map.get(Fields.FromDid));
			this.setData(map.get(Fields.Data));
	}
}
