package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Vector;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;


/**
 * 
 * times
 * Time ranges, in 24-hour format
 * days_of_week
 * Days of the week (mon, tue, wed, thu, fri, sat, sun)
 * days_of_month
 * Days of the month (1-31)
 * months
 * Months (jan, feb, mar, apr, etc.)
 * ; If we're open, then go to the open context
 * ; We're open from 9am to 6pm Monday through Friday
 * exten => s,1,GotoIfTime(09:00-17:59,mon-fri,*,*?open,s,1)
 * ;
 * ; We're also late on Tuesday and Thursday
 * exten => s,n,GotoIfTime(09:00-19:59,tue&thu,*,*?open,s,1)
 * ;
 * ; We're also open from 9am to noon on Saturday
 * exten => s,n,GotoIfTime(09:00-11:59,sat,*,*?open,s,1)
 * ;
 * ; Otherwise, we're closed
 * exten => s,n,Goto(closed,s,1)
 * 
 * @author Cai Zhibin 2009-10-27
 *
 */
public class TimeCondition extends Context implements ServicePeer{
	
	public static final String NAME = "time";
	
	private String account;
	private String pbx;
	private Vector<TimeConditionItem> items = new Vector<TimeConditionItem>();
	
	private String matchedPeer = "0";
	private String unmatchedPeer = "0";
	
	private String displayName;
	
	public TimeCondition(String pbx, String account, String exten) {
		super(account+"-"+exten+"-"+NAME, exten);
		this.account = account;
		this.displayName = "timecondition-" + exten;
	}

	public void setValue(Hashtable<String, String> data){
		try{
			String times = data.get(Fields.Times);
			String[] a = times.split("@");
			items.clear();
			for(int i=0;i<a.length;i++){
				String[] b = a[i].split(",");
				TimeConditionItem item = new TimeConditionItem();
				item.setTimes(b[0]);
				item.setDaysOfWeek(b[1]);
				item.setDaysOfMoth(b[2]);
				item.setMoths(b[3]);
				items.add(item);
			}
			if(data.containsKey(Fields.MatchedPeer))
				this.setMatchedPeer(data.get(Fields.MatchedPeer));
			if(data.containsKey(Fields.UnmatchedPeer))
				this.setUnmatchedPeer(data.get(Fields.UnmatchedPeer));
		}catch (Exception e){
			
		}
	}
	
	public Vector<TimeConditionItem> getItems() {
		return items;
	}

	public void addTimeConditionItem(TimeConditionItem item){
		items.add(item);
	}
	
	public void removeTimeConditionTime(TimeConditionItem item){
		items.remove(item);
	}
	
	public void clearTimeConditionTime(){
		items.clear();
	}
	
	public String getAccount() {
		return account;
	}

	public String getMatchedPeer() {
		return matchedPeer;
	}

	public void setMatchedPeer(String matchedPeer) {
		this.matchedPeer = matchedPeer;
	}

	public String getUnmatchedPeer() {
		return unmatchedPeer;
	}

	public void setUnmatchedPeer(String unmatchedPeer) {
		this.unmatchedPeer = unmatchedPeer;
	}

	public String getPbx() {
		return pbx;
	}

	public String getActionString() {
		return "goto "+this.getContext()+",\\$\\{FROM_DID\\},1";
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "timecondition-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(getServicePeerName());
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.DisplayName, displayName);
		String times = "";
		for (int i = 0; i < items.size(); i++) {
			times += items.get(i).getConditionString() + "@";
		}
		if (times.endsWith("@"))
			times = times.substring(0, times.length() - 1);
		event.addParameter(Fields.Times, times);
		event.addParameter(Fields.MatchedPeer, matchedPeer);
		event.addParameter(Fields.UnmatchedPeer, unmatchedPeer);
		return event;
	}
}
