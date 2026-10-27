package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5CallRecord extends C5Event{

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
	private String connect_type;
	//monitor/10.1.1.101/20080118/20080118-172204_59242301_Q21001203_ss-01-001-1200648122.2.mp3
	private String record_file_name;
//	private String customer_name;
	private String origin_id;
	private String ref_call_sheet_id;
	private String call_id;
	//1 caller, 0 callee
	private String direction = out;
	
	private String opType = insert;
	private String channelState;
	
	private String fileServer = "";
	
	public C5CallRecord() {
		super(Fields.CallCdr);
		this.addParameter(Fields.OpType, opType);
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

	public String getFileServer() {
		return fileServer;
	}

	public void setFileServer(String fileServer) {
		this.fileServer = fileServer;
		this.addParameter(Fields.FileServer, fileServer);
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
			this.setOrigin_id((String)map.get(Fields.OriginID));
			this.setRecord_file_name((String)map.get(Fields.RecordFileName));
			this.setRef_call_sheet_id((String)map.get(Fields.RefCallSheetID));
			this.setStatus((String)map.get(Fields.Status));
			this.setOpType((String)map.get(Fields.OpType));
			this.setChannelState((String)map.get(Fields.ChannelStatus));
			this.setDirection((String)map.get(Fields.Direction));
			this.setFileServer((String)map.get(Fields.FileServer));
	}
}
