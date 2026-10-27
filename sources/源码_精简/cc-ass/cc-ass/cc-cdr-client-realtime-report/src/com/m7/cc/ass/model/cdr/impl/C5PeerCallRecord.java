package com.m7.cc.ass.model.cdr.impl;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class C5PeerCallRecord extends C5Event{

	public static final String dealing = "dealing";
	public static final String notDeal = "notDeal";
	public static final String record_format = ".mp3";
	public static final String insert = "insert";
	public static final String update = "update";
	public static final String in = "I";
	public static final String out = "O";
	
	private String call_sheet_id;
	private String account;
	private String customer_id;
	private String customer_name;
	private String call_no;
	private String called_no;
	//notDeal, dealing
	private String status = notDeal;
	private String disposal_agent;
//	private String direction;
	private String begin_time;
	private String end_time;
	private String offering_time;
	private String queue_time;
	private String connect_type;
	//monitor/10.1.1.101/20080118/20080118-172204_59242301_Q21001203_ss-01-001-1200648122.2.mp3
	private String record_file_name;
//	private String customer_name;
	private String origin_id;
	private String ref_call_sheet_id;
	private String call_id;
	//I caller, O callee
	private String direction = out;
	private String error_memo = null;
	private String queue_name = "";
	private String action_id;
	
	private String opType = insert;
	private String channelState;
	private String location = "system";
	private String locationName = "";
	private String locationId = "";
	
	private String pbx;
	private String extenType;
	private String investigate;
	private String fileServer = "";
	private String refUniqueid = null;
	private String statistic;
	private String province = "";
	private String provinceCode = "";
	private String district = "";
	private String districtCode = "";
	private String serviceNoType = null;
	private boolean keyTag = false;
	private String cdrVar = null;
	private boolean isAutoCall = false;
	private String transferMode = "";
	private String transferNum = "";
	private String transferAgent = "";
	private List<String> labels = new ArrayList<String>();
	
	private Hashtable<String, String> vars = new Hashtable<String, String>();
	
	public C5PeerCallRecord() {
		super(Fields.PeerCallCdr);
		this.addParameter(Fields.OpType, opType);
		this.addParameter(Fields.ErrorMemo, error_memo);
		this.addParameter(Fields.Location, location);
	}
	
	public String getCall_sheet_id() {
		return call_sheet_id;
	}
	public void setCall_sheet_id(String call_sheet_id) {
		this.call_sheet_id = call_sheet_id;
		this.addParameter(Fields.CallSheetID, call_sheet_id);
	}
	public String getAccount() {
		return account;
	}
	public void setAccount(String account) {
		this.account = account;
		this.addParameter(Fields.Account, account);
	}
	public String getCustomer_id() {
		return customer_id;
	}
	public void setCustomer_id(String customer_id) {
		this.customer_id = customer_id;
		this.addParameter(Fields.CustomerID, customer_id);
	}
	public String getCall_no() {
		return call_no;
	}
	public void setCall_no(String call_no) {
		this.call_no = call_no;
		this.addParameter(Fields.CallNo, call_no);
	}
	public String getCalled_no() {
		return called_no;
	}
	public void setCalled_no(String called_no) {
		this.called_no = called_no;
		this.addParameter(Fields.CalledNo, called_no);
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
		this.addParameter(Fields.Status, status);
	}
	public String getDisposal_agent() {
		return disposal_agent;
	}
	public void setDisposal_agent(String disposal_agent) {
		this.disposal_agent = disposal_agent;
		this.addParameter(Fields.DisposalAgent, disposal_agent);
	}
//	public String getDirection() {
//		return direction;
//	}
//	public void setDirection(String direction) {
//		this.direction = direction;
//		this.addParameter(Fields.d, direction);
//	}
	public String getBegin_time() {
		return begin_time;
	}
	public void setBegin_time(String begin_time) {
		this.begin_time = begin_time;
		this.addParameter(Fields.BeginTime, begin_time);
	}
	public String getEnd_time() {
		return end_time;
	}
	public void setEnd_time(String end_time) {
		this.end_time = end_time;
		this.addParameter(Fields.EndTime, end_time);
	}
	public String getOffering_time() {
		return offering_time;
	}
	public void setOffering_time(String offering_time) {
		this.offering_time = offering_time;
		this.addParameter(Fields.OfferingTime, offering_time);
	}
	
	public String getQueue_time() {
		return queue_time;
	}

	public void setQueue_time(String queue_time) {
		this.queue_time = queue_time;
		this.addParameter(Fields.QueueTime, queue_time);
	}

	public String getConnect_type() {
		return connect_type;
	}
	public void setConnect_type(String connect_type) {
		this.connect_type = connect_type;
		this.addParameter(Fields.ConnectType, connect_type);
	}
	public String getRecord_file_name() {
		return record_file_name;
	}
	public void setRecord_file_name(String record_file_name) {
		this.record_file_name = record_file_name;
		this.addParameter(Fields.RecordFileName, record_file_name);
	}
	
	public String getOrigin_id() {
		return origin_id;
	}
	
	public String getOpType() {
		return opType;
	}

	public void setOpType(String opType) {
		this.opType = opType;
		this.addParameter(Fields.OpType, opType);
	}

	public void setOrigin_id(String origin_id) {
		this.origin_id = origin_id;
		this.addParameter(Fields.OriginID, origin_id);
	}
	public String getRef_call_sheet_id() {
		return ref_call_sheet_id;
	}
	public void setRef_call_sheet_id(String ref_call_sheet_id) {
		this.ref_call_sheet_id = ref_call_sheet_id;
		this.addParameter(Fields.RefCallSheetID, ref_call_sheet_id);
	}
	public String getCall_id() {
		return call_id;
	}
	public void setCall_id(String call_id) {
		this.call_id = call_id;
		this.addParameter(Fields.CallID, call_id);
	}
	
	public String getChannelState() {
		return channelState;
	}

	public void setChannelState(String channelState) {
		this.channelState = channelState;
		this.addParameter(Fields.ChannelStatus, channelState);
	}

	public String getDirection() {
		return direction;
	}

	public void setDirection(String direction) {
		this.direction = direction;
		this.addParameter(Fields.Direction, direction);
	}

	public String getCustomer_name() {
		return customer_name;
	}

	public void setCustomer_name(String customer_name) {
		this.customer_name = customer_name;
	}

	public String getError_memo() {
		return error_memo;
	}

	public void setError_memo(String error_memo) {
		this.error_memo = error_memo;
		this.addParameter(Fields.ErrorMemo, error_memo);
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
		this.addParameter(Fields.Location, location);
	}

	public String getAction_id() {
		return action_id;
	}

	public void setAction_id(String action_id) {
		if(action_id == null)
			return;
		this.action_id = action_id;
		this.addParameter(Fields.ActionID, action_id);
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
		this.addParameter(Fields.PBX, pbx);
	}

	public String getExtenType() {
		return extenType;
	}

	public void setExtenType(String extenType) {
		this.extenType = extenType;
		this.addParameter(Fields.ExtenType, extenType);
	}

	public String getInvestigate() {
		return investigate;
	}

	public void setInvestigate(String investigate) {
		this.investigate = investigate;
		this.addParameter(Fields.Investigate, investigate);
	}

	public String getLocationName() {
		return locationName;
	}

	public void setLocationName(String locationName) {
		this.locationName = locationName;
		this.addParameter(Fields.LocationName, locationName);
	}

	public String getLocationId() {
		return locationId;
	}

	public void setLocationId(String locationId) {
		this.locationId = locationId;
		this.addParameter(Fields.LocationId, locationId);
	}

	public String getQueue_name() {
		return queue_name;
	}

	public void setQueue_name(String queue_name) {
		this.queue_name = queue_name;
		this.addParameter(Fields.QueueName, queue_name);
	}
	
	public String getFileServer() {
		return fileServer;
	}

	public void setFileServer(String fileServer) {
		this.fileServer = fileServer;
		this.addParameter(Fields.FileServer, fileServer);
	}
	
	public String getRefUniqueid() {
		return refUniqueid;
	}

	public void setRefUniqueid(String refUniqueid) {
		this.refUniqueid = refUniqueid;
		this.addParameter(Fields.RefUniqueid, refUniqueid);
	}

	public Hashtable<String, String> getVars() {
		return vars;
	}

	public void setVars(Hashtable<String, String> vars) {
		this.vars = vars;
	}
	
	public String getStatistic() {
		return statistic;
	}

	public void setStatistic(String statistic) {
		this.statistic = statistic;
		this.addParameter(Fields.Statistic, statistic);
	}
	
	public String getProvince() {
		return province;
	}

	public void setProvince(String province) {
		this.province = province;
		this.addParameter(Fields.Province, province);
	}

	public String getDistrict() {
		return district;
	}

	public void setDistrict(String district) {
		this.district = district;
		this.addParameter(Fields.District, district);
	}
	
	public String getProvinceCode() {
		return provinceCode;
	}

	public void setProvinceCode(String provinceCode) {
		this.provinceCode = provinceCode;
		this.addParameter(Fields.ProvinceCode, provinceCode);
	}

	public String getDistrictCode() {
		return districtCode;
	}

	public void setDistrictCode(String districtCode) {
		this.districtCode = districtCode;
		this.addParameter(Fields.DistrictCode, districtCode);
	}
	
	public String getServiceNoType() {
		return serviceNoType;
	}

	public void setServiceNoType(String serviceNoType) {
		this.serviceNoType = serviceNoType;
		this.addParameter(Fields.ServiceNoType, serviceNoType);
	}

	public boolean getKeyTag() {
		return keyTag;
	}

	public void setKeyTag(boolean keyTag) {
		this.keyTag = keyTag;
		this.addParameter(Fields.KeyTag, keyTag);
	}
	
	public String getCdrVar() {
		return cdrVar;
	}

	public void setCdrVar(String cdrVar) {
		this.cdrVar = cdrVar;
		this.addParameter(Fields.CdrVar, cdrVar);
	}
	
	public boolean isAutoCall() {
		return isAutoCall;
	}

	public void setAutoCall(boolean isAutoCall) {
		this.isAutoCall = isAutoCall;
		this.addParameter(Fields.IsAutoCall, isAutoCall);
	}
	
	public String getTransferMode() {
		return transferMode;
	}

	public void setTransferMode(String transferMode) {
		this.transferMode = transferMode;
		this.addParameter(Fields.TransferMode, transferMode);
	}
	public String getTransferNum() {
		return transferNum;
	}

	public void setTransferNum(String transferNum) {
		this.transferNum = transferNum;
		this.addParameter(Fields.TransferNum, transferNum);
	}
	
	public String getTransferAgent() {
		return transferAgent;
	}

	public void setTransferAgent(String transferAgent) {
		this.transferAgent = transferAgent;
		this.addParameter(Fields.TransferAgent, transferAgent);
	}

	@Override
	public void setValues(Map<String, Object> map) {
			this.setAccount((String)map.get(Fields.Account));
			this.setBegin_time((String)map.get(Fields.BeginTime));
			this.setCall_id((String)map.get(Fields.CallID));
			this.setCall_no((String)map.get(Fields.CallNo));
			this.setCall_sheet_id((String)map.get(Fields.CallSheetID));
			this.setCalled_no((String)map.get(Fields.CalledNo));
			this.setConnect_type((String)map.get(Fields.ConnectType));
			this.setCustomer_id((String)map.get(Fields.CustomerID));
			this.setDisposal_agent((String)map.get(Fields.DisposalAgent));
			this.setEnd_time((String)map.get(Fields.EndTime));
			this.setOffering_time((String)map.get(Fields.OfferingTime));
			this.setQueue_time((String)map.get(Fields.QueueTime));
			this.setOrigin_id((String)map.get(Fields.OriginID));
			this.setRecord_file_name((String)map.get(Fields.RecordFileName));
			this.setRef_call_sheet_id((String)map.get(Fields.RefCallSheetID));
			this.setStatus((String)map.get(Fields.Status));
			this.setOpType((String)map.get(Fields.OpType));
			this.setChannelState((String)map.get(Fields.ChannelStatus));
			this.setDirection((String)map.get(Fields.Direction));
			this.setError_memo((String)map.get(Fields.ErrorMemo));
			this.setQueue_name((String)map.get(Fields.QueueName));
			this.setLocation((String)map.get(Fields.Location));
			this.setLocationName((String) map.get(Fields.LocationName));
			this.setLocationId((String) map.get(Fields.LocationId));
			this.setPbx((String)map.get(Fields.PBX));
			if(map.containsKey(Fields.ExtenType))
				this.setExtenType((String)map.get(Fields.ExtenType));
			if(map.containsKey(Fields.investigate))
				this.setInvestigate((String) map.get(Fields.Investigate));
			if(map.containsKey(Fields.ActionID))
				this.setAction_id((String)map.get(Fields.ActionID));
			if(map.containsKey(Fields.RefUniqueid))
				this.setRefUniqueid((String)map.get(Fields.RefUniqueid));
			if(map.containsKey(Fields.Statistic))
				this.setStatistic((String)map.get(Fields.Statistic));
			if(map.containsKey(Fields.Province)){
				if(map.get(Fields.Province).toString().contains("\\")){
					this.setProvince(Utils.unicodeToGB(map.get(Fields.Province).toString()));					
				}else{
					this.setProvince((String) map.get(Fields.Province));
				}
			}
			if(map.containsKey(Fields.ProvinceCode))
				this.setProvinceCode((String) map.get(Fields.ProvinceCode));
			if(map.containsKey(Fields.District)){
				if(map.get(Fields.District).toString().contains("\\")){
					this.setDistrict(Utils.unicodeToGB(map.get(Fields.District).toString()));					
				}else{
					this.setDistrict((String) map.get(Fields.District));
				}
			}
			if(map.containsKey(Fields.DistrictCode))
				this.setDistrictCode((String) map.get(Fields.DistrictCode));
			this.setFileServer((String)map.get(Fields.FileServer));
			if(map.containsKey(Fields.ServiceNoType))
				this.setServiceNoType((String)map.get(Fields.ServiceNoType));
			if(map.containsKey(Fields.KeyTag))
				this.setKeyTag((Boolean)map.get(Fields.KeyTag));
			if(map.containsKey(Fields.CdrVar))
				this.setCdrVar((String)map.get(Fields.CdrVar));
			if(map.containsKey(Fields.IsAutoCall))
				this.setAutoCall((Boolean)map.get(Fields.IsAutoCall));
			if(map.containsKey(Fields.Labels)){
				this.setLabels((List<String>) map.get(Fields.Labels));
			}
			if(map.containsKey(Fields.TransferMode)){
				this.setTransferMode((String)map.get(Fields.TransferMode));
			}
			if(map.containsKey(Fields.TransferNum)){
				this.setTransferNum((String)map.get(Fields.TransferNum));
			}
			if(map.containsKey(Fields.TransferAgent)){
				this.setTransferAgent((String)map.get(Fields.TransferAgent));
			}
			
	}

	public List<String> getLabels() {
		return labels;
	}

	public void setLabels(List<String> labels) {
		this.labels = labels;
		this.addParameter(Fields.Labels, labels);
	}
}
