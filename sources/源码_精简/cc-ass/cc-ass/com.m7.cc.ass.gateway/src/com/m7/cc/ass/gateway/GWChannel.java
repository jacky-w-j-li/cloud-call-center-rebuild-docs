package com.m7.cc.ass.gateway;

import java.util.Hashtable;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;


public class GWChannel {

	private String uniqueid;

	private String account="";
	private String route = "";
	private String line = "";

	private String fromCid;
	private String fromDid;
	private String callerProvince = "";
	private String callerCity = "";
	private String callerDistrictNo = "";
	private String calleeProvince = "";
	private String calleeCity = "";
	private String calleeDistrictNo = "";
	
	private String beginTime;
	private String endTime;

	// transfer or dialout
	private String channelType = "";
	private boolean link = false;
	private String channelStatus = Fields.Down;

	private String timestamp;
	
	private String product = "";
	private String agentId = "";
	private String call_sheet_ID = "";
	
	private Hashtable<String, String> vars = new Hashtable<String, String>();
	
	private String channelName;
	public GWChannel(String uniqueid) {
		this.uniqueid = uniqueid;
	}
	public GWChannel(String uniqueid,String channelName){
		this.uniqueid = uniqueid;
		this.channelName=channelName;
	}
	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getRoute() {
		return route;
	}
	public void setRoute(String route) {
		this.route = route;
	}
	public String getLine() {
		return line;
	}
	public void setLine(String line) {
		this.line = line;
	}
	public String getFromCid() {
		return fromCid;
	}

	public void setFromCid(String fromCid) {
		fromCid = getFormattedNumber(fromCid);
		CallNumberInfo numberInfo = ASConfig.getInstance()
				.getNumberInfoViaNumber(fromCid);
		if (numberInfo != null) {
			this.callerProvince = numberInfo.getProvince();
			this.callerCity = numberInfo.getCity();
			this.callerDistrictNo = numberInfo.getDistrictNo();
		}else{
			numberInfo = ASConfig.getInstance().getNumberInfoViaDistrictNo(ASConfig.getInstance().getDistrictNo(account));
			if(numberInfo != null){
				this.callerProvince = numberInfo.getCity();
				this.callerCity = numberInfo.getCity();
				this.callerDistrictNo = ASConfig.getInstance().getDistrictNo(account);
			}
		}
		this.fromCid = fromCid;
	}

	public String getFromDid() {
		return fromDid;
	}

	public void setFromDid(String fromDid) {
		fromDid = getFormattedNumber(fromDid);
		CallNumberInfo numberInfo = ASConfig.getInstance()
				.getNumberInfoViaNumber(fromDid);
		if (numberInfo != null) {
			this.calleeProvince = numberInfo.getProvince();
			this.calleeCity = numberInfo.getCity();
			this.calleeDistrictNo = numberInfo.getDistrictNo();
		}
		this.fromDid = fromDid;
	}

	public String getChannelType() {
		return channelType;
	}

	public void setChannelType(String channelType) {
		this.channelType = channelType;
	}

	public String getUniqueid() {
		return uniqueid;
	}

	public String getChannelStatus() {
		return channelStatus;
	}

	public void setChannelStatus(String channelStatus) {
		this.channelStatus = channelStatus;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}
	
	public void addVar(String key, String value) {
		vars.put(key, value);
	}
	
	public String getVar(String key) {
		return vars.get(key);
	}
	
	public void removeVar(String key) {
		vars.remove(key);
	}
	
	public String getBeginTime() {
		return beginTime;
	}

	public void setBeginTime(String beginTime) {
		this.beginTime = beginTime;
	}

	public String getEndTime() {
		return endTime;
	}

	public void setEndTime(String endTime) {
		this.endTime = endTime;
	}
	
	public String getChannelName() {
		return channelName;
	}
	public String getCallerProvince() {
		return callerProvince;
	}
	public void setCallerProvince(String callerProvince) {
		this.callerProvince = callerProvince;
	}
	public String getCallerCity() {
		return callerCity;
	}
	public void setCallerCity(String callerCity) {
		this.callerCity = callerCity;
	}
	public String getCallerDistrictNo() {
		return callerDistrictNo;
	}
	public void setCallerDistrictNo(String callerDistrictNo) {
		this.callerDistrictNo = callerDistrictNo;
	}
	public String getCalleeProvince() {
		return calleeProvince;
	}
	public void setCalleeProvince(String calleeProvince) {
		this.calleeProvince = calleeProvince;
	}
	public String getCalleeCity() {
		return calleeCity;
	}
	public void setCalleeCity(String calleeCity) {
		this.calleeCity = calleeCity;
	}
	public String getCalleeDistrictNo() {
		return calleeDistrictNo;
	}
	public void setCalleeDistrictNo(String calleeDistrictNo) {
		this.calleeDistrictNo = calleeDistrictNo;
	}
	
	public boolean isLink() {
		return link;
	}
	public void setLink(boolean link) {
		this.link = link;
	}
	
	public String getProduct() {
		return product;
	}
	public void setProduct(String product) {
		this.product = product;
	}
	
	public String getAgentId() {
		return agentId;
	}
	public void setAgentId(String agentId) {
		this.agentId = agentId;
	}
	public String getCall_sheet_ID() {
		return call_sheet_ID;
	}
	public void setCall_sheet_ID(String call_sheet_ID) {
		this.call_sheet_ID = call_sheet_ID;
	}
	public String getJsonString() {
		String a = "";
		a += "{\""+Fields.Uniqueid+"\":\""+this.uniqueid+"\""
			+",\""+Fields.Account+"\":\""+this.account+"\""
			+",\""+Fields.PBX+"\":\"gateway\""
			+",\""+Fields.Command+"\":\"Event\""
			+",\""+Fields.Event+"\":\"GWChannel\""
			+",\""+Fields.ChannelStatus+"\":\""+this.channelStatus+"\""
			+",\""+Fields.ChannelType+"\":\""+this.channelType+"\""
			+",\""+Fields.FromCid+"\":\""+this.fromCid+"\""
			+",\""+Fields.FromDid+"\":\""+this.fromDid+"\""
			+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
			+",\""+Fields.BeginTime+"\":\""+this.beginTime+"\""
			+",\""+Fields.EndTime+"\":\""+this.endTime+"\""
			+",\""+Fields.Channel+"\":\""+this.channelName+"\""
			+",\"product\":\""+this.product+"\""
			+",\"route\":\""+this.route+"\""
			+",\"line\":\""+this.line+"\""
			+",\""+Fields.CallerProvince+"\":\""+this.callerProvince+"\""
			+",\""+Fields.CallerCity+"\":\""+this.callerCity+"\""
			+",\""+Fields.CallerDistrictNo+"\":\""+this.callerDistrictNo+"\""
			+",\""+Fields.CalleeProvince+"\":\""+this.calleeProvince+"\""
			+",\""+Fields.CalleeCity+"\":\""+this.calleeCity+"\""
			+",\""+Fields.CalleeDistrictNo+"\":\""+this.calleeDistrictNo+"\""
			+",\"agentId\":\""+this.agentId+"\""
			+",\"call_sheet_ID\":\""+this.call_sheet_ID+"\""
			+"}";
		return a;
	}
	
	private String getFormattedNumber(String number) {
		String result = number;
		if(Utils.isMobileNo(number)){
			return result;
		}else if (number.startsWith("0") && Utils.isMobileNo(number.substring(1))) 
			return result.substring(1);
		else if (number.startsWith("400")){
			return result;
		} else if (number.startsWith("0")){
			return number;
		} else if (number.matches("[0-9]+")){
			return ASConfig.getInstance().getDistrictNo(account)+number;
		} else return number;
	}
	
	public void destruct(){
		if(vars != null)
			vars.clear();
	}

	

}
