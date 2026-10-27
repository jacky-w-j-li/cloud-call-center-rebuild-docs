package com.m7.cc.ass.model;

import java.util.Vector;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class CallReport {
	
	private String account;
	private String pbx;
	
	private int[] inCallsPerHour = new int[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
	private int[] inCallsCompletePerHour = new int[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
	private int[] outCallsPerHour = new int[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
	private int[] outCallsCompletePerHour = new int[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

	private Vector<String> currentInCallIds = new Vector<String>();
	
	private Vector<String> currentOutCallIds = new Vector<String>();
	
	private int inCalls = 0;
	private int inComplete = 0;
	
	private int outCalls = 0;
	private int outComplete = 0;
	
	public CallReport(String pbx, String account){
		this.pbx = pbx;
		this.account = account;
	}
	
	public void incomingCall(int hour){
		inCalls++;
		inCallsPerHour[hour] = inCallsPerHour[hour]+1;
	}
	
	public void incomingCallCompleted(int hour){
		inComplete++;
		inCallsCompletePerHour[hour] = inCallsCompletePerHour[hour]+1;
	}
	
	public void incomingCallStart(String uniqueid){
		if(currentInCallIds.contains(uniqueid))
			return;
		else {
			currentInCallIds.add(uniqueid);
		}
	}
	
	public boolean incomingCallEnd(String uniqueid){
		boolean a = currentInCallIds.contains(uniqueid);
		currentInCallIds.remove(uniqueid);
		return a;
	}
	
	public void outgoingCall(int hour){
		outCalls++;
		outCallsPerHour[hour] = outCallsPerHour[hour]+1;
	}
	
	public void outgoingCallCompleted(int hour) {
		outComplete++;
		outCallsCompletePerHour[hour] = outCallsCompletePerHour[hour]+1;
	}
	
	public void outgoingCallStart(String uniqueid) {
		if(currentOutCallIds.contains(uniqueid))
			return;
		else {
			currentOutCallIds.add(uniqueid);
		}
	}
	
	public boolean outgoingCallEnd(String uniqueid) {
		boolean a = currentOutCallIds.contains(uniqueid);
		currentOutCallIds.remove(uniqueid);
		return a;
	}

	public int[] getInCallsPerHour() {
		return inCallsPerHour;
	}

	public int[] getInCallsCompletePerHour() {
		return inCallsCompletePerHour;
	}

	public int[] getOutCallsPerHour() {
		return outCallsPerHour;
	}

	public int[] getOutCallsCompletePerHour() {
		return outCallsCompletePerHour;
	}

	public int getCurrentInCalls() {
		return currentInCallIds.size();
	}

	public int getCurrentOutCalls() {
		return currentOutCallIds.size();
	}

	public int getInCalls() {
		return inCalls;
	}

	public int getInComplete() {
		return inComplete;
	}

	public int getOutCalls() {
		return outCalls;
	}

	public int getOutComplete() {
		return outComplete;
	}

	public String getAccount() {
		return account;
	}

	public void setInCallsPerHour(int index, int value) {
		this.inCallsPerHour[index] = value;
	}

	public void setInCallsCompletePerHour(int index, int value) {
		this.inCallsCompletePerHour[index] = value;
	}

	public void setOutCallsPerHour(int index, int value) {
		this.outCallsPerHour[index] = value;
	}

	public void setOutCallsCompletePerHour(int index, int value) {
		this.outCallsCompletePerHour[index] = value;
	}

	public void setInCalls(int inCalls) {
		this.inCalls = inCalls;
	}

	public void setInComplete(int inComplete) {
		this.inComplete = inComplete;
	}

	public void setOutCalls(int outCalls) {
		this.outCalls = outCalls;
	}

	public void setOutComplete(int outComplete) {
		this.outComplete = outComplete;
	}
	
	public String getInCallsPerHourString(){
		String a = "";
		for(int i=0;i<24;i++){
			a = a+ " "+ inCallsPerHour[i];
		}
		return a;
	}
	
	public String getInCallsCompletePerHourString(){
		String a = "";
		for(int i=0;i<24;i++){
			a = a+ " "+ inCallsCompletePerHour[i];
		}
		return a;
	}
	
	public String getOutCallsPerHourString(){
		String a = "";
		for(int i=0;i<24;i++){
			a = a+ " "+ outCallsPerHour[i];
		}
		return a;
	}
	
	public String getOutCallsCompletePerHourString(){
		String a = "";
		for(int i=0;i<24;i++){
			a = a+ " "+ outCallsCompletePerHour[i];
		}
		return a;
	}
	
	public void clear(){
		inCalls = 0;
		inComplete = 0;
		
		outCalls = 0;
		outComplete = 0;
		for(int i=0;i<24;i++){
			inCallsPerHour[i] = 0;
			inCallsCompletePerHour[i] = 0;
			outCallsPerHour[i] = 0;
			outCallsCompletePerHour[i] = 0;
		}
	}
	
	public void clearCurrentCall(){
		currentOutCallIds.clear();
		currentInCallIds.clear();
	}
	
	private String getStringForArray(int[] a){
		String result = a[0]+"";
		for(int i=1;i<a.length;i++){
			result += ","+a[i];
		}
		return result;
	}
	
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.AccountStatus);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.InCalls, inCalls);
		event.addParameter(Fields.InComplete, this.inComplete);
		event.addParameter(Fields.OutCalls, this.outCalls);
		event.addParameter(Fields.OutComplete, this.outComplete);
		event.addParameter(Fields.InCallsPerHour, this.getStringForArray(inCallsPerHour));
		event.addParameter(Fields.InCompletePerHour, this.getStringForArray(inCallsCompletePerHour));
		event.addParameter(Fields.OutCallsPerHour, this.getStringForArray(outCallsPerHour));
		event.addParameter(Fields.OutCompletePerHour, this.getStringForArray(outCallsCompletePerHour));
		event.addParameter(Fields.CurrentInCalls, this.currentInCallIds.size());
		event.addParameter(Fields.CurrentOutCalls, this.currentOutCallIds.size());
		return event;
	}
}
