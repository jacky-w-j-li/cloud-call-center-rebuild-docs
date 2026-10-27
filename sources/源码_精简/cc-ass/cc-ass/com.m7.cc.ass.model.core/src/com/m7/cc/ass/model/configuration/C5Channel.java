package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.ass.config.model.District;
import com.m7.cc.ass.config.model.Province;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

/**
 * 
 * @author caizhibin 2009-6-10
 *
 */
public class C5Channel{
	
	private String pbx;
	private String account = "";
	private String exten;
	private String peer;
	
	private String callerIDNum = "";
	private String callerIDName = "";
	private String callerProvince = "";
	private String callerProvinceCode = "";
	private String callerCity = "";
	private String callerCityCode = "";
	private String callerDistrictNo = "";
	
	private String calleeProvince = "";
	private String calleeProvinceCode = "";
	private String calleeCity = "";
	private String calleeCityCode = "";
	private String calleeDistrictNo = "";

	private String state = Fields.Down;

	private String channelName = "";
	
	private String uniqueid = "";
	
	private String timestamp;
	private String ringtime;
	private String monitorFilename;
	private String actionId;
	
	private boolean isLinked = false;
	
	private C5Channel linkedChannel;
	
	private boolean isTransfer = false;
	private String channelType = "none";
	private String fromCid = "";
	private String fromDid = "";
	private String queue = null;
	private String queueName = "";
	private String location = "none";
	private boolean isInvestigatting = false;
	private boolean isLooting = false;
	private boolean isIvrMenu = false;
	
	private boolean waitForRing = false;
	
	private SipPeer sipPeer;
	
	private Hashtable<String, String> C5Fields = new Hashtable<String, String>();
	private Hashtable<String, String> vars = new Hashtable<String, String>();

	private C5Call call;
	private String ringtimestamp;
	private String queueTimestamp = null;
	private String beginTime;
	private String endTime;
	
	private List<String> labels = new ArrayList<String>();
	
	protected WebCallMaxCallTimerTask maxCallTimerTask = null;
	protected MeetWebCallMaxCallTimerTask meetMaxCallTimerTask = null;
	protected int maxCallTime = 0;
	protected Hashtable<String, TimerTask> webCallChatingIvrPromptVoMap = null;
	
	public C5Channel(){
		
	}
	/**
	 * Create a new channel object
	 * 
	 * @param channelName
	 *            the name of the channel
	 * @param callerIDNum
	 *            the caller id number
	 * @param callerIDName
	 *            the caller id name
	 * @param state
	 *            the channel state
	 * @param device
	 *            the device the channel belongs to
	 */
	public C5Channel(String channelName, String callerIDNum,
			String callerIDName, String state, String uniqueid, String id) {
		this.channelName = channelName;
		this.callerIDNum = callerIDNum;
		this.callerIDName = callerIDName;
		this.state = state;
		this.uniqueid = uniqueid;
		if(channelName.indexOf('-') != -1)
			peer = channelName.substring(0, channelName.indexOf('-'));
		else peer = channelName;
		exten = peer.substring(peer.indexOf('/')+1);
		pbx = id;
	}

	/**
	 * Create a new channel object
	 * 
	 * @param channelName
	 *            the name of the channel
	 * @param state
	 *            the channel state
	 * @param device
	 *            the device the channel belongs to
	 */
	public C5Channel(String channelName, String state, String uniqueid, String id) {
		this(channelName, null, null, state, uniqueid, id);
	}
	
	public String getAllStatusString(){
		String status = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
						+",\""+Fields.Event+"\":\""+Fields.ChannelStatus+"\""
						+",\""+Fields.PBX+"\":\""+this.pbx+"\""
						+",\""+Fields.Account+"\":\""+this.account+"\""
						+",\""+Fields.Channel+"\":\""+this.channelName+"\""
						+",\""+Fields.Exten+"\":\""+this.exten+"\""
						+",\""+Fields.Peer+"\":\""+this.peer+"\""
						+",\""+Fields.Uniqueid+"\":\""+this.uniqueid+"\""
						+",\""+Fields.ChannelStatus+"\":\""+this.state+"\""
						+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
						+",\""+Fields.Link+"\":"+this.isLinked
						+",\""+Fields.Transfer+"\":"+this.isTransfer
						+",\""+Fields.ChannelType+"\":\""+this.channelType+"\""
						+",\""+Fields.FromCid+"\":\""+this.fromCid+"\""
						+",\""+Fields.FromDid+"\":\""+this.fromDid+"\""
						+",\""+Fields.CallerProvince+"\":\""+this.callerProvince+"\""
						+",\""+Fields.CallerProvinceCode+"\":\""+this.callerProvinceCode+"\""
						+",\""+Fields.CallerCity+"\":\""+this.callerCity+"\""
						+",\""+Fields.CallerCityCode+"\":\""+this.callerCityCode+"\""
						+",\""+Fields.CallerDistrictNo+"\":\""+this.callerDistrictNo+"\""
						+",\""+Fields.CalleeProvince+"\":\""+this.calleeProvince+"\""
						+",\""+Fields.CalleeProvinceCode+"\":\""+this.calleeProvinceCode+"\""
						+",\""+Fields.CalleeCity+"\":\""+this.calleeCity+"\""
						+",\""+Fields.CalleeCityCode+"\":\""+this.calleeCityCode+"\""
						+",\""+Fields.CalleeDistrictNo+"\":\""+this.calleeDistrictNo+"\""
						+",\""+Fields.Location+"\":\""+this.location+"\""
						+((this.sipPeer != null && this.sipPeer.getUser()!= null)?
								(",\""+Fields.UserID+"\":\""+sipPeer.getUser().getId()+"\""+
										",\""+Fields.ExtenType+"\":\""+sipPeer.getUser().getExtenType()+"\""):"")
//						+",\""+Fields.MonitorFilename+"\":\""+this.monitorFilename+"\""
						+((queue != null)?(",\""+Fields.Queue+"\":\""+this.queue+"\""
								+",\""+Fields.QueueName+"\":\""+this.queueName+"\"")
								:"")
						+getJsonString(C5Fields)
						+((linkedChannel != null && isLinked)?
								(",\""+Fields.LinkedChannel+"\":"+linkedChannel.getStatusString())
								:"")
						+"}";
		return status;
	}
	
	/**
	 * Only parameters of this channel will be added, exclude the linked channel.
	 * @return
	 */
	public String getStatusString(){
		String status = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
						+",\""+Fields.Event+"\":\""+Fields.ChannelStatus+"\""
						+",\""+Fields.PBX+"\":\""+this.pbx+"\""
						+",\""+Fields.Account+"\":\""+this.account+"\""
						+",\""+Fields.Channel+"\":\""+this.channelName+"\""
						+",\""+Fields.Exten+"\":\""+this.exten+"\""
						+",\""+Fields.Peer+"\":\""+this.peer+"\""
						+",\""+Fields.Uniqueid+"\":\""+this.uniqueid+"\""
						+",\""+Fields.ChannelStatus+"\":\""+this.state+"\""
						+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
						+",\""+Fields.Link+"\":"+this.isLinked
						+",\""+Fields.Transfer+"\":"+this.isTransfer
						+",\""+Fields.ChannelType+"\":\""+this.channelType+"\""
						+",\""+Fields.FromCid+"\":\""+this.fromCid+"\""
						+",\""+Fields.FromDid+"\":\""+this.fromDid+"\""
						+",\""+Fields.CallerProvince+"\":\""+this.callerProvince+"\""
						+",\""+Fields.CallerProvinceCode+"\":\""+this.callerProvinceCode+"\""
						+",\""+Fields.CallerCity+"\":\""+this.callerCity+"\""
						+",\""+Fields.CallerCityCode+"\":\""+this.callerCityCode+"\""
						+",\""+Fields.CallerDistrictNo+"\":\""+this.callerDistrictNo+"\""
						+",\""+Fields.CalleeProvince+"\":\""+this.calleeProvince+"\""
						+",\""+Fields.CalleeProvinceCode+"\":\""+this.calleeProvinceCode+"\""
						+",\""+Fields.CalleeCity+"\":\""+this.calleeCity+"\""
						+",\""+Fields.CalleeCityCode+"\":\""+this.calleeCityCode+"\""
						+",\""+Fields.CalleeDistrictNo+"\":\""+this.calleeDistrictNo+"\""
						+",\""+Fields.Location+"\":\""+this.location+"\""
						+((this.sipPeer != null && this.sipPeer.getUser()!= null)?
								(",\""+Fields.UserID+"\":\""+sipPeer.getUser().getId()+"\""+
										",\""+Fields.ExtenType+"\":\""+sipPeer.getUser().getExtenType()+"\""):"")
//						+",\""+Fields.MonitorFilename+"\":\""+this.monitorFilename+"\""
						+((queue != null)?(",\""+Fields.Queue+"\":\""+this.queue+"\""
								+",\""+Fields.QueueName+"\":\""+this.queueName+"\"")
								:"")
						+getJsonString(C5Fields)
						+"}";
		return status;
	}
	
	private String getJsonString(Hashtable<String, String> data){
		if(data == null)
			return "";
		String str = ",\""+Fields.Data+"\":{";
		Iterator<String> it = data.keySet().iterator();
		if(data.size() > 0){
			String key = it.next();
			str = str + "\""+key+"\":\""+data.get(key)+"\"";
		}
		while(it.hasNext()){
			String key = it.next();
			str = str + ",\""+key+"\":\""+data.get(key)+"\"";
		}
		str = str+"}";
		return str;
	}
	
	public C5Event getSelfStateEvent(){
		C5Event event = new C5Event(Fields.ChannelStatus);
		event.addParameter(Fields.PBX, this.pbx);
		event.addParameter(Fields.Account, this.account);
		event.addParameter(Fields.Channel, this.channelName);
		event.addParameter(Fields.Exten, this.exten);
		event.addParameter(Fields.Peer, this.peer);
		event.addParameter(Fields.Uniqueid, this.uniqueid);
		event.addParameter(Fields.ChannelStatus, this.state);
		event.addParameter(Fields.Timestamp, this.timestamp);
		event.addParameter(Fields.RingTime, this.ringtime);
		event.addParameter(Fields.Link, this.isLinked);
		event.addParameter(Fields.Transfer, this.isTransfer);
		event.addParameter(Fields.ChannelType, this.channelType);
		event.addParameter(Fields.FromCid, this.fromCid);
		event.addParameter(Fields.FromDid, this.fromDid);
		event.addParameter(Fields.CallerProvince, this.callerProvince);
		event.addParameter(Fields.CallerProvinceCode, this.callerProvinceCode);
		event.addParameter(Fields.CallerCity, this.callerCity);
		event.addParameter(Fields.CallerCityCode, this.callerCityCode);
		event.addParameter(Fields.CalleeDistrictNo, this.calleeDistrictNo);
		event.addParameter(Fields.CalleeProvince, this.calleeProvince);
		event.addParameter(Fields.CalleeProvinceCode, this.calleeProvinceCode);
		event.addParameter(Fields.CalleeCity, this.calleeCity);
		event.addParameter(Fields.CalleeCityCode, this.calleeCityCode);
		event.addParameter(Fields.CallerDistrictNo, this.callerDistrictNo);
		event.addParameter(Fields.Location, this.location);
//		event.addParameter(Fields.MonitorFilename, this.monitorFilename);
		if(this.sipPeer != null && this.sipPeer.getUser()!= null)
			event.addParameter(Fields.UserID, this.sipPeer.getUser().getId());
		else event.addParameter(Fields.UserID, null);
		if(actionId != null)
			event.addParameter(Fields.ActionID, actionId);
		if(queue != null){
			event.addParameter(Fields.Queue, this.queue);
			event.addParameter(Fields.QueueName, queueName);
		}
			
		event.getParameters().putAll(C5Fields);
		return event;
	}
	
	public boolean setValues(Map<String, Object> map){
		try{
			setChannelName((String)map.get(Fields.Channel));
			setCallerIDNum((String)map.get(Fields.CallerIDNum));
			setCallerIDName((String)map.get(Fields.CallerIDName));
			setState((String)map.get(Fields.State));
			setUniqueid((String)map.get(Fields.Uniqueid));
			setAstID((String)map.get(Fields.PBX));
			setExten((String)map.get(Fields.Exten));
			setPeer((String)map.get(Fields.Peer));
			setState((String)map.get(Fields.ChannelStatus));
			setTimestamp((String)map.get(Fields.Timestamp));
			setRingtime((String)map.get(Fields.RingTime));
			setLinked((Boolean)map.get(Fields.Link));
			setTransfer((Boolean)map.get(Fields.Transfer));
			setChannelType((String)map.get(Fields.ChannelType));
			setFromDid((String)map.get(Fields.FromDid));
			setFromCid((String)map.get(Fields.FromCid));
			setLocation((String)map.get(Fields.Location));
			this.setMonitorFilename((String)map.get(Fields.MonitorFilename));
			if(map.containsKey(Fields.Queue)){
				this.setQueue((String) map.get(Fields.Queue));
				this.queueName = (String) map.get(Fields.QueueName);
			}
				
		}catch(Exception e){
			return false;
		}
		return true;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getCallerIDName() {
		return callerIDName;
	}

	public void setCallerIDName(String callerIDName) {
		this.callerIDName = callerIDName;
	}

	public String getCallerIDNum() {
		return callerIDNum;
	}

	public void setCallerIDNum(String callerIDNum) {
		this.callerIDNum = callerIDNum;
	}

	public String getChannelName() {
		return channelName;
	}

	public void setChannelName(String channelName) {
		this.channelName = channelName;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public boolean isLinked() {
		return isLinked;
	}

	public void setLinked(boolean isLinked) {
		this.isLinked = isLinked;
		if(!isLinked)
			linkedChannel = null;
	}

	public String getUniqueid() {
		return uniqueid;
	}

	public String getPeer() {
		return peer;
	}

	public void setPeer(String peer) {
		this.peer = peer;
	}

	public String getExten() {
		return exten;
	}

	public boolean isTransfer() {
		return isTransfer;
	}

	public void setTransfer(boolean isTransfer) {
		this.isTransfer = isTransfer;
	}

	public C5Channel getLinkedChannel() {
		return linkedChannel;
	}

	public void setLinkedChannel(C5Channel linkedChannel) {
		this.linkedChannel = linkedChannel;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}
	
	public void addC5Var(String key, String value) {
		C5Fields.put(key, value);
	}
	
	public Hashtable<String, String> getC5Vars() {
		Hashtable<String, String> map = new Hashtable<String, String> ();
		map.putAll(C5Fields);
		return map;
	}
	
	public String getC5Var(String key) {
		return C5Fields.get(key);
	}
	
	public void removeC5Var(String key) {
		C5Fields.remove(key);
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


	public String getChannelType() {
		return channelType;
	}

	public void setChannelType(String channelType) {
		this.channelType = channelType;
	}

	public String getQueue() {
		return queue;
	}

	public void setQueue(String queue) {
		this.queue = queue;
	}
	
	public String getQueueName() {
		return queueName;
	}
	public void setQueueName(String queueName) {
		this.queueName = queueName;
	}
	public void setAstID(String astID) {
		this.pbx = astID;
	}
	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
	}
	
	public String getFromCid() {
		return fromCid;
	}

	public void setFromCid(String fromCid) {
		if (this.channelType.equals(Fields.normal)) {
			fromCid = getFormattedNumber(fromCid);
			CallNumberInfo numberInfo = ASConfig.getInstance()
					.getNumberInfoViaNumber(fromCid);
			if (numberInfo != null) {
				this.callerDistrictNo = numberInfo.getDistrictNo();
				District d = ASConfig.getInstance().getDistrictViaCode(
						this.callerDistrictNo);
				if (d != null) {
					this.callerCity = d.getName();
					this.callerCityCode = d.getCode();
					Province p = ASConfig.getInstance().getProvinceViaCode(
							d.getProvinceCode());
					if (p != null) {
						this.callerProvince = p.getName();
						this.callerProvinceCode = p.getCode();
					}
				}
			}
		}
		this.fromCid = fromCid;
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
	
	public String getFromDid() {
		return fromDid;
	}
	public void setFromDid(String fromDid) {
		if(this.channelType.equals(Fields.dialout)){
			fromDid = getFormattedNumber(fromDid);
			CallNumberInfo numberInfo = ASConfig.getInstance()
					.getNumberInfoViaNumber(fromDid);
			if (numberInfo != null) {
				this.calleeDistrictNo = numberInfo.getDistrictNo();
				District d = ASConfig.getInstance().getDistrictViaCode(this.calleeDistrictNo);
				if(d != null){
					this.calleeCity = d.getName();
					this.calleeCityCode = d.getCode();
					Province p = ASConfig.getInstance().getProvinceViaCode(d.getProvinceCode());
					if(p != null){
						this.calleeProvince = p.getName();
						this.calleeProvinceCode = p.getCode();
					}
				}
			}
		}
		this.fromDid = fromDid;
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
	public boolean isLooting() {
		return isLooting;
	}
	public void setLooting(boolean isLooting) {
		this.isLooting = isLooting;
	}
	public String getLocation() {
		return location;
	}
	public void setLocation(String location) {
		this.location = location;
	}
	
	public SipPeer getSipPeer() {
		return sipPeer;
	}
	
	public void setSipPeer(SipPeer sipPeer) {
		this.sipPeer = sipPeer;
	}
	
	public boolean isInvestigatting() {
		return isInvestigatting;
	}
	
	public void setInvestigatting(boolean isInvestigatting) {
		this.isInvestigatting = isInvestigatting;
	}
	
	public boolean isWaitForRing() {
		return waitForRing;
	}
	
	public void setWaitForRing(boolean waitForRing) {
		this.waitForRing = waitForRing;
	}
	
	public String getRingtime() {
		return ringtime;
	}
	
	public void setRingtime(String ringtime) {
		this.ringtime = ringtime;
	}
	
	public String getMonitorFilename() {
		return monitorFilename;
	}
	
	public void setMonitorFilename(String monitorFilename) {
		this.monitorFilename = monitorFilename;
	}
	
	public String getActionId() {
		return actionId;
	}
	
	public void setActionId(String actionId) {
		this.actionId = actionId;
	}
	
	public C5Call getCall() {
		return call;
	}
	
	public void setCall(C5Call call) {
		this.call = call;
	}
	
	public String getRingtimestamp() {
		if(ringtimestamp == null)
			ringtimestamp = Utils.getCurrentDate();
		return ringtimestamp;
	}
	public void setRingtimestamp(String ringtimestamp) {
		this.ringtimestamp = ringtimestamp;
	}
	
	public String getQueueTimestamp() {
		return queueTimestamp;
	}
	public void setQueueTimestamp(String queueTimestamp) {
		this.queueTimestamp = queueTimestamp;
	}
	public void destruct(){
		if(C5Fields != null)
			C5Fields.clear();
		C5Fields = null;
		if(vars != null)
			vars.clear();
		linkedChannel = null;
		//this.sipPeer = null;
		this.call = null;
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
	public void setCallerDistrictNo(String callerDistictNo) {
		this.callerDistrictNo = callerDistictNo;
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
	public List<String> getLabels() {
		return labels;
	}
	public void setLabels(List<String> labels) {
		this.labels = labels;
	}
	public String getCallerProvinceCode() {
		return callerProvinceCode;
	}
	public void setCallerProvinceCode(String callerProvinceCode) {
		this.callerProvinceCode = callerProvinceCode;
	}
	public String getCallerCityCode() {
		return callerCityCode;
	}
	public void setCallerCityCode(String callerCityCode) {
		this.callerCityCode = callerCityCode;
	}
	public String getCalleeProvinceCode() {
		return calleeProvinceCode;
	}
	public void setCalleeProvinceCode(String calleeProvinceCode) {
		this.calleeProvinceCode = calleeProvinceCode;
	}
	public String getCalleeCityCode() {
		return calleeCityCode;
	}
	public void setCalleeCityCode(String calleeCityCode) {
		this.calleeCityCode = calleeCityCode;
	}
	public boolean isIvrMenu() {
		return isIvrMenu;
	}
	public void setIvrMenu(boolean isIvrMenu) {
		this.isIvrMenu = isIvrMenu;
	}
	public WebCallMaxCallTimerTask getMaxCallTimerTask() {
		return maxCallTimerTask;
	}
	public void setMaxCallTimerTask(WebCallMaxCallTimerTask maxCallTimerTask) {
		this.maxCallTimerTask = maxCallTimerTask;
	}
	public MeetWebCallMaxCallTimerTask getMeetMaxCallTimerTask() {
		return meetMaxCallTimerTask;
	}
	public void setMeetMaxCallTimerTask(
			MeetWebCallMaxCallTimerTask meetMaxCallTimerTask) {
		this.meetMaxCallTimerTask = meetMaxCallTimerTask;
	}
	public int getMaxCallTime() {
		return maxCallTime;
	}
	public void setMaxCallTime(int maxCallTime) {
		this.maxCallTime = maxCallTime;
	}
	public Hashtable<String, TimerTask> getWebCallChatingIvrPromptVoMap() {
		return webCallChatingIvrPromptVoMap;
	}
	public void setWebCallChatingIvrPromptVoMap(
			Hashtable<String, TimerTask> webCallChatingIvrPromptVoMap) {
		this.webCallChatingIvrPromptVoMap = webCallChatingIvrPromptVoMap;
	}
	
}
